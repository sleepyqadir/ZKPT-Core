/* eslint-disable camelcase */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable node/no-missing-import */
import { expect, assert } from "chai";

import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
// eslint-disable-next-line camelcase
import { Pool__factory, Verifier__factory, Pool } from "../typechain";
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line node/no-missing-import
import { generateMerkleProof, prove, getPoseidonFactory } from "../utils/index";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Deposit } from "../classes/Deposit";

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
  before(async () => {
    poseidon = await buildPoseidon();
    provider = ethers.provider;
  });

  beforeEach(async function () {
    const [signer, relayer] = await ethers.getSigners();
    poseidonContract = await getPoseidonFactory(2).connect(signer).deploy();

    const verifier = await new Verifier__factory(signer).deploy();

    const MerkleTreeInstance = await ethers.getContractFactory(
      "MerkleTreeWithHistoryMock"
    );
    merkleTreeWithHistory = await MerkleTreeInstance.deploy(
      20,
      poseidonContract.address
    );
    await merkleTreeWithHistory.deployed();

    ZKPool = await new Pool__factory(signer).deploy(
      verifier.address,
      ETH_AMOUNT,
      20,
      poseidonContract.address,
      await relayer.getAddress()
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
    it("#Deposit and withdraw", async () => {
      const [depositor, relayer, withdrawer] = await ethers.getSigners();
      const deposit = Deposit.new(poseidon);
      const commitment = deposit.commitment;
      const nullifierHash = deposit.nullifierHash;
      const depositTransaction = await ZKPool.connect(depositor).deposit(
        commitment,
        nullifierHash,
        {
          value: ETH_AMOUNT,
        }
      );
      const depositReciept = await depositTransaction.wait();

      const events = await ZKPool.queryFilter(
        ZKPool.filters.Deposit(),
        depositReciept.blockHash
      );

      assert.equal(events[0].args.commitment, commitment);

      // const tree = new MerkleTree(20, "test", new PoseidonHasher(poseidon));
      // assert.equal(await tree.root(), await ZKPool.roots(0));
      console.log({
        commitment: deposit.commitment,
      });
      // await tree.insert(deposit.commitment);
      // console.log({ root: await tree.root() });
      // assert.equal(tree.totalElements, await ZKPool.nextIndex());
      // assert.equal(await tree.root(), await ZKPool.roots(1));

      const recipient = await withdrawer.getAddress();
      const fee = 0;

      // const { root, path_elements, path_index } = await tree.path(
      //   deposit.leafIndex
      // );

      const { root, path_elements, path_index } = await generateMerkleProof(
        deposit,
        ZKPool,
        poseidon
      );

      const witness = {
        // Public
        root,
        nullifierHash,
        recipient,
        relayer: await relayer.getAddress(),
        fee,
        secret: 1,
        // Private
        nullifier: BigNumber.from(deposit.nullifier).toBigInt(),
        pathElements: path_elements,
        pathIndices: path_index,
      };

      console.log({ witness });

      const solidityProof = await prove(witness);

      const txWithdraw = await ZKPool.connect(relayer).withdraw(
        solidityProof,
        root,
        nullifierHash,
        recipient,
        await relayer.getAddress(),
        fee
      );
      const receiptWithdraw = await txWithdraw.wait();
    });

    it("#Deposit from 3 different accounts and withdraw 3 2 1", async () => {
      const [
        depositor,
        relayer,
        withdrawer,
        depositorTwo,
        withdrawerTwo,
        depositorThree,
        withdrawerThree,
      ] = await ethers.getSigners();

      const deposit = Deposit.new(poseidon);

      const commitment = deposit.commitment;

      const nullifierHash = deposit.nullifierHash;

      const depositTransaction = await ZKPool.connect(depositor).deposit(
        commitment,
        nullifierHash,
        {
          value: ETH_AMOUNT,
        }
      );

      let poolBalance = await provider.getBalance(ZKPool.address);

      const depositReciept = await depositTransaction.wait();

      expect(poolBalance).equals(ethers.utils.parseEther("0.1"));

      const depositTwo = Deposit.new(poseidon);

      const commitmentTwo = depositTwo.commitment;

      const nullifierHashTwo = depositTwo.nullifierHash;

      const depositTransactionTwo = await ZKPool.connect(depositorTwo).deposit(
        commitmentTwo,
        nullifierHashTwo,
        {
          value: ETH_AMOUNT,
        }
      );

      poolBalance = await provider.getBalance(ZKPool.address);

      console.log({ poolBalance });

      expect(poolBalance).equals(ethers.utils.parseEther("0.2"));

      const depositThree = Deposit.new(poseidon);

      const commitmentThree = depositThree.commitment;

      console.log({ commitmentThree });

      const nullifierHashThree = depositThree.nullifierHash;

      const depositTransactionThree = await ZKPool.connect(
        depositorThree
      ).deposit(commitmentThree, nullifierHashThree, {
        value: ETH_AMOUNT,
      });

      poolBalance = await provider.getBalance(ZKPool.address);

      console.log({ poolBalance });

      expect(poolBalance).equals(ethers.utils.parseEther("0.3"));

      // TODO migrate events test in seperate test
      // const events = await Pool.queryFilter(
      //   Pool.filters.Deposit(),
      //   depositReciept.blockHash
      // );

      // assert.equal(events[0].args.commitment, commitment);

      // deposit.leafIndex = events[0].args.leafIndex;

      const recipient = await withdrawer.getAddress();
      let recipientBalance = await provider.getBalance(recipient);

      const fee = 0;

      const {
        root: rootThree,
        path_elements: pathElementsThree,
        path_index: pathIndicesThree,
      } = await generateMerkleProof(depositThree, ZKPool, poseidon);

      const witnessThree = {
        // Public
        root: rootThree,
        nullifierHash: nullifierHashThree,
        recipient,
        relayer: await relayer.getAddress(),
        fee,
        // Private
        secret: BigNumber.from(depositThree.secret).toBigInt(),
        // Private
        nullifier: BigNumber.from(depositThree.nullifier).toBigInt(),
        pathElements: pathElementsThree,
        pathIndices: pathIndicesThree,
      };

      console.log({ witnessThree }, { index: await ZKPool.nextIndex() });

      const solidityProof = await prove(witnessThree);

      const txWithdraw = await ZKPool.connect(relayer).withdraw(
        solidityProof,
        rootThree,
        nullifierHashThree,
        recipient,
        await relayer.getAddress(),
        fee
      );
      const receiptWithdrawThree = await txWithdraw.wait();

      recipientBalance = await provider.getBalance(recipient);

      expect(recipientBalance).equals(ethers.utils.parseEther("1000.2"));
    }).timeout(500000);

    // TODO add the test case for the Nullifier spent case

    it("#Start A new Draw", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await ZKPool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      expect(await ZKPool.numDraws()).equals(1);
    });
    it("#Should revert when non-owner try to create a new draw", async () => {
      const [signer, nonOwner] = await ethers.getSigners();
      await expect(ZKPool.connect(nonOwner).initDraw(3)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("#Should Fail to create 2 draws", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await ZKPool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      await expect(ZKPool.connect(signer).initDraw(3)).to.be.revertedWith(
        "Draw: previous draw not ended"
      );
    });
    it("#Get The End and Start Time of the Draw", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await ZKPool.connect(signer).initDraw(1);
      const reciept = transaction.wait();

      const draw1 = await ZKPool.draws(0);
      await sleep(60 * 1000);
      const secondTransaction = await ZKPool.connect(signer).initDraw(3);
      const secondReciept = await secondTransaction.wait();
      const draw2 = await ZKPool.draws(1);
    }).timeout(2 * 60 * 1000);
    it("#Should fail to trigger the triggerDrawComplete before 1 min", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await ZKPool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
    });
    it("#Should allow to trigger the triggerDrawComplete after 1 min", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await ZKPool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      const draw1 = await ZKPool.draws(0);
      await sleep(60 * 1000);

      const drawAfterComplete = await ZKPool.draws(0);
    }).timeout(1.5 * 60 * 1000);
  });
});
