/* eslint-disable camelcase */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable node/no-missing-import */
import { expect, assert } from "chai";

import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
// eslint-disable-next-line camelcase
import {
  Pool__factory,
  Pool,
  WinningVerifier__factory,
  WithdrawVerifier__factory,
} from "../typechain";
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line node/no-missing-import
import {
  generateMerkleProof,
  prove,
  getPoseidonFactory,
  poseidonHash,
} from "../utils/index";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Deposit } from "../classes/Deposit";
import { WithdrawVerifier } from "../typechain/WithdrawVerifier";

const { solidity } = require("ethereum-waffle");

const chai = require("chai");

chai.use(solidity);

// TODO: add support of env variables

const ETH_AMOUNT = ethers.utils.parseEther("0.1");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("ZkPoolTogether", async () => {
  // TODO change the any type to the typechain
  let merkleTreeWithHistory: any;
  let poseidonContract: Contract;
  let ZKPool: Pool;
  let poseidon: any;
  let provider: any;
  let withdrawVerifier: WithdrawVerifier;
  before(async () => {
    poseidon = await buildPoseidon();
    provider = ethers.provider;
  });

  beforeEach(async function () {
    const [signer, relayer] = await ethers.getSigners();
    poseidonContract = await getPoseidonFactory(2).connect(signer).deploy();

    const winningVerifier = await new WinningVerifier__factory(signer).deploy();

    withdrawVerifier = await new WithdrawVerifier__factory(signer).deploy();

    const MerkleTreeInstance = await ethers.getContractFactory(
      "MerkleTreeWithHistoryMock"
    );
    merkleTreeWithHistory = await MerkleTreeInstance.deploy(
      20,
      poseidonContract.address
    );
    await merkleTreeWithHistory.deployed();

    // _verifierWithdraw: string,
    // _verifierWinning: string,
    // _wethGateway: string,
    // _denomination: BigNumberish,
    // _merkleTreeHeight: BigNumberish,
    // _hasher: string,
    // _relayer: string,
    // _weth: string,
    // _minutes: BigNumberish,

    console.log({ relayer: relayer.getAddress() });

    ZKPool = await new Pool__factory(signer).deploy(
      withdrawVerifier.address,
      winningVerifier.address,
      "0xD1DECc6502cc690Bc85fAf618Da487d886E54Abe",
      ETH_AMOUNT,
      20,
      poseidonContract.address,
      await relayer.getAddress(),
      "0x608D11E704baFb68CfEB154bF7Fd641120e33aD4",
      3
    );
  });

  // describe("Poseidon", async () => {
  //   it("generates same poseidon hash", async function () {
  //     const res = await poseidonContract["poseidon(uint256[2])"]([1, 2]);
  //     const res2 = poseidon([1, 2]);
  //     expect(res.toString()).equals(poseidon.F.toString(res2));
  //   }).timeout(500000);
  // });

  // describe("MerkleTreeWithHistory", function () {
  //   describe("#contructor", () => {
  //     it("should initialize", async () => {
  //       const zeroValue = await merkleTreeWithHistory.ZERO_VALUE();
  //       const firstSubtree = await merkleTreeWithHistory.filledSubtrees(0);
  //       expect(firstSubtree).equals(zeroValue);
  //       const firstZero = await merkleTreeWithHistory.zeros(0);
  //       expect(firstZero).equals(zeroValue);
  //     });
  //   });

  //   describe("#insert", () => {
  //     it("should insert", async () => {
  //       let lastRoot;
  //       for (let i = 1; i < 5; i++) {
  //         await merkleTreeWithHistory.insert(toFixedHex(i));
  //         lastRoot = await merkleTreeWithHistory.getLastRoot();
  //       }
  //       const knownRoot = await merkleTreeWithHistory.isKnownRoot(lastRoot);
  //       // eslint-disable-next-line no-unused-expressions
  //       expect(knownRoot).to.be.true;
  //     });
  //   });
  // });

  describe("Pool", async () => {
    it("#Start A new Draw", async () => {
      console.log("starting...");
      const [signer, depositor, withdrawer, relayer] =
        await ethers.getSigners();
      const deposit = Deposit.new(8, poseidon);
      console.log({ deposit });
      const commitment = deposit.commitment;
      const nullifierHash = deposit.nullifierHash;
      console.log({ nullifierHash });
      const depositTransaction = await ZKPool.connect(depositor).deposit(
        commitment,
        {
          value: ETH_AMOUNT,
        }
      );

      const depositReciept = await depositTransaction.wait();

      console.log(depositReciept);

      await ethers.provider.send("evm_increaseTime", [300]);
      await ethers.provider.send("evm_mine", []);

      const end = await ZKPool.connect(depositor).triggerDrawEnd();
      await end.wait();

      // const drawBalance = await provider.getBalance(address);

      const draws = await ZKPool.getDraws();

      console.log({ draws });

      // console.log({ drawBalance });

      const events = await ZKPool.queryFilter(
        ZKPool.filters.Deposit(),
        depositReciept.blockHash
      );

      console.log(events[0].args.commitment, commitment);

      const saltedCommitment = await poseidonHash(poseidon, [
        commitment,
        draws[0].drawId,
      ]);

      console.log({ saltedCommitment });

      assert.equal(events[0].args.commitment, saltedCommitment);

      const recipient = await withdrawer.getAddress();
      const fee = 0;

      const { root, path_elements, path_index } = await generateMerkleProof(
        saltedCommitment,
        ZKPool,
        poseidon
      );

      console.log({ root, path_elements, path_index });

      const witness = {
        // Public
        root,
        nullifierHash,
        recipient,
        relayer: await relayer.getAddress(),
        fee,
        nullifier: BigNumber.from(deposit.nullifier).toBigInt(),
        secret: BigNumber.from(deposit.secret).toBigInt(),
        blind: deposit.blind,
        draw: draws[0].drawId.toNumber(),
        random: draws[0].random.toNumber(),
        pathElements: path_elements,
        pathIndices: path_index,
      };

      console.log({ witness });

      const solidityProof = await prove(witness);

      // console.log({ solidityProof }, solidityProof.b);

      const txWithdraw = await ZKPool.connect(relayer).withdraw(
        solidityProof,
        root,
        nullifierHash,
        recipient,
        await relayer.getAddress(),
        fee,
        0
      );

      const receiptWithdraw = await txWithdraw.wait();

      const withdrawerBalance = await provider.getBalance(recipient);

      console.log({ withdrawerBalance });
    });

    // it("#Should revert when non-owner try to create a new draw", async () => {
    //   const [signer, nonOwner] = await ethers.getSigners();
    //   await expect(ZKPool.connect(nonOwner).initDraw(3)).to.be.revertedWith(
    //     "Ownable: caller is not the owner"
    //   );
    // });
    // it("#Should Fail to create 2 draws", async () => {
    //   const [signer] = await ethers.getSigners();
    //   const transaction = await ZKPool.connect(signer).initDraw();
    //   const reciept = transaction.wait();
    //   await expect(ZKPool.connect(signer).initDraw()).to.be.revertedWith(
    //     "Draw: previous draw not ended"
    //   );
    // });
    // it("#Get The End and Start Time of the Draw", async () => {
    //   const [signer] = await ethers.getSigners();
    //   const transaction = await ZKPool.connect(signer).initDraw(1);
    //   const reciept = transaction.wait();

    //   const draw1 = await ZKPool.draws(0);
    //   await sleep(60 * 1000);
    //   const secondTransaction = await ZKPool.connect(signer).initDraw(3);
    //   const secondReciept = await secondTransaction.wait();
    //   const draw2 = await ZKPool.draws(1);
    // }).timeout(2 * 60 * 1000);
    // it("#Should fail to trigger the triggerDrawComplete before 1 min", async () => {
    //   const [signer] = await ethers.getSigners();
    //   const transaction = await ZKPool.connect(signer).initDraw(3);
    //   const reciept = transaction.wait();
    // });
    // it("#Should allow to trigger the triggerDrawComplete after 1 min", async () => {
    //   const [signer] = await ethers.getSigners();
    //   const transaction = await ZKPool.connect(signer).initDraw(3);
    //   const reciept = transaction.wait();
    //   const draw1 = await ZKPool.draws(0);
    //   await sleep(60 * 1000);

    //   const drawAfterComplete = await ZKPool.draws(0);
    // }).timeout(1.5 * 60 * 1000);
  });
});
