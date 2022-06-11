/* eslint-disable camelcase */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable node/no-missing-import */
import { expect, assert } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { getPoseidonFactory } from ".";
// eslint-disable-next-line camelcase
import { ETHZkPool__factory, Verifier__factory, ETHZkPool } from "../typechain";
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line node/no-missing-import
import { prove, toFixedHex } from "../utils/index";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Deposit } from "../classes/Deposit";
// eslint-disable-next-line prettier/prettier
import { MerkleTree } from "../src/merkleTree";
import { PoseidonHasher } from "../classes/PoseidonHasher";

// TODO: add support of env variables

// const { MERKLE_TREE_HEIGHT } = process.env;

const ETH_AMOUNT = ethers.utils.parseEther("1");

describe("ZkPoolTogether", async () => {
  // TODO change the any type to the typechain
  let merkleTreeWithHistory: any;
  let poseidonContract: Contract;
  let ETHZkPool: ETHZkPool;
  let poseidon: any;
  before(async () => {
    poseidon = await buildPoseidon();
  });

  beforeEach(async function () {
    const [signer] = await ethers.getSigners();
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

    ETHZkPool = await new ETHZkPool__factory(signer).deploy(
      verifier.address,
      ETH_AMOUNT,
      20,
      poseidonContract.address
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
      const depositTransaction = await ETHZkPool.connect(depositor).deposit(
        commitment,
        {
          value: ETH_AMOUNT,
        }
      );
      const depositReciept = await depositTransaction.wait();

      const events = await ETHZkPool.queryFilter(
        ETHZkPool.filters.Deposit(),
        depositReciept.blockHash
      );

      assert.equal(events[0].args.commitment, commitment);
      deposit.leafIndex = events[0].args.leafIndex;

      const tree = new MerkleTree(20, "test", new PoseidonHasher(poseidon));
      assert.equal(await tree.root(), await ETHZkPool.roots(0));
      await tree.insert(deposit.commitment);
      assert.equal(tree.totalElements, await ETHZkPool.nextIndex());
      assert.equal(await tree.root(), await ETHZkPool.roots(1));

      const nullifierHash = deposit.nullifierHash;
      const recipient = await withdrawer.getAddress();
      const relayerAddress = await relayer.getAddress();
      const fee = 0;

      const { root, path_elements, path_index } = await tree.path(
        deposit.leafIndex
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

      const solidityProof = await prove(witness);

      console.log({ witness, solidityProof });
      const txWithdraw = await ETHZkPool.connect(relayer).withdraw(
        solidityProof,
        root,
        nullifierHash,
        recipient,
        await relayer.getAddress(),
        fee
      );
      const receiptWithdraw = await txWithdraw.wait();
      console.log("Withdraw gas cost", receiptWithdraw.gasUsed.toNumber());
    });
  });
});
