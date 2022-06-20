/* eslint-disable camelcase */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable node/no-missing-import */
import { expect, assert } from "chai";

import { BigNumber, Contract } from "ethers";
import { ethers, waffle } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { getPoseidonFactory } from ".";
// eslint-disable-next-line camelcase
import { Pool__factory, Verifier__factory, Pool } from "../typechain";
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line node/no-missing-import
import { prove, toFixedHex } from "../utils/index";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Deposit } from "../classes/Deposit";
// eslint-disable-next-line prettier/prettier
import { MerkleTree } from "../src/merkleTree";
import { PoseidonHasher } from "../classes/PoseidonHasher";

const { solidity } = require("ethereum-waffle");

const chai = require("chai");

chai.use(solidity);

// TODO: add support of env variables

// const { MERKLE_TREE_HEIGHT } = process.env;

const ETH_AMOUNT = ethers.utils.parseEther("1");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("ZkPoolTogether", async () => {
  // TODO change the any type to the typechain
  let merkleTreeWithHistory: any;
  let poseidonContract: Contract;
  let Pool: Pool;
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

    Pool = await new Pool__factory(signer).deploy(
      verifier.address,
      ETH_AMOUNT,
      20,
      poseidonContract.address
    );
  });

  describe("Poseidon", async () => {
    it("generates same poseidon hash", async function () {
      const res = await poseidonContract["poseidon(uint256[2])"]([1, 2]);
      const res2 = poseidon([1, 2]);
      expect(res.toString()).equals(poseidon.F.toString(res2));
    }).timeout(500000);
  });

  describe("MerkleTreeWithHistory", function () {
    describe("#contructor", () => {
      it("should initialize", async () => {
        const zeroValue = await merkleTreeWithHistory.ZERO_VALUE();
        const firstSubtree = await merkleTreeWithHistory.filledSubtrees(0);
        expect(firstSubtree).equals(zeroValue);
        const firstZero = await merkleTreeWithHistory.zeros(0);
        expect(firstZero).equals(zeroValue);
      });
    });

    describe("#insert", () => {
      it("should insert", async () => {
        let lastRoot;
        for (let i = 1; i < 5; i++) {
          await merkleTreeWithHistory.insert(toFixedHex(i));
          lastRoot = await merkleTreeWithHistory.getLastRoot();
        }
        const knownRoot = await merkleTreeWithHistory.isKnownRoot(lastRoot);
        // eslint-disable-next-line no-unused-expressions
        expect(knownRoot).to.be.true;
      });
    });
  });

  describe("Pool", async () => {
    it("#Deposit and withdraw", async () => {
      const [depositor, relayer, withdrawer] = await ethers.getSigners();
      const deposit = Deposit.new(poseidon);
      const commitment = deposit.commitment;
      const depositTransaction = await Pool.connect(depositor).deposit(
        commitment,
        {
          value: ETH_AMOUNT,
        }
      );
      const depositReciept = await depositTransaction.wait();

      const events = await Pool.queryFilter(
        Pool.filters.Deposit(),
        depositReciept.blockHash
      );

      assert.equal(events[0].args.commitment, commitment);
      deposit.leafIndex = events[0].args.leafIndex;

      const tree = new MerkleTree(20, "test", new PoseidonHasher(poseidon));
      assert.equal(await tree.root(), await Pool.roots(0));
      await tree.insert(deposit.commitment);
      assert.equal(tree.totalElements, await Pool.nextIndex());
      assert.equal(await tree.root(), await Pool.roots(1));

      const nullifierHash = deposit.nullifierHash;
      const recipient = await withdrawer.getAddress();
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
      const txWithdraw = await Pool.connect(relayer).withdraw(
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

    it("#Start A new Draw", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await Pool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      expect(await Pool.numDraws()).equals(1);
    });
    it("#Should revert when non-owner try to create a new draw", async () => {
      const [signer, nonOwner] = await ethers.getSigners();
      await expect(Pool.connect(nonOwner).initDraw(3)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("#Should Fail to create 2 draws", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await Pool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      await expect(Pool.connect(signer).initDraw(3)).to.be.revertedWith(
        "Draw: previous draw not ended"
      );
    });
    it("#Get The End and Start Time of the Draw", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await Pool.connect(signer).initDraw(1);
      const reciept = transaction.wait();

      const draw1 = await Pool.draws(0);
      await sleep(60 * 1000);
      const secondTransaction = await Pool.connect(signer).initDraw(3);
      const secondReciept = await secondTransaction.wait();
      const draw2 = await Pool.draws(1);
      console.log({ draw1, draw2 });
    }).timeout(2 * 60 * 1000);
    it("#Should fail to trigger the triggerDrawComplete before 1 min", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await Pool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      const draw1 = await Pool.draws(0);
      console.log(draw1);
      await expect(
        Pool.connect(signer).triggerDrawComplete(draw1.drawId)
      ).to.be.revertedWith("Draw: minting period is not ended");
    });
    it("#Should allow to trigger the triggerDrawComplete after 1 min", async () => {
      const [signer] = await ethers.getSigners();
      const transaction = await Pool.connect(signer).initDraw(3);
      const reciept = transaction.wait();
      const draw1 = await Pool.draws(0);
      await sleep(60 * 1000);
      const triggerCompleteTransaction = await Pool.connect(
        signer
      ).triggerDrawComplete(draw1.drawId);

      triggerCompleteTransaction.wait();
      const drawAfterComplete = await Pool.draws(0);
      // eslint-disable-next-line no-unused-expressions
      expect(drawAfterComplete.isCompleted).to.be.true;
      expect((await Pool.winningTickets(0)).drawId).equals(0);
      await expect(
        Pool.connect(signer).triggerDrawComplete(draw1.drawId)
      ).to.be.revertedWith("Draw: draw is already completed");
      console.log({ ticket: await Pool.winningTickets(0) });
    }).timeout(1.5 * 60 * 1000);
  });
});
