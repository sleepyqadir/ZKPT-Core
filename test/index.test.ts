/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { getPoseidonFactory } from ".";
// eslint-disable-next-line camelcase
import { ETHZkPool__factory, Verifier__factory, ETHZkPool } from "../typechain";
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line node/no-missing-import
import { toFixedHex } from "../utils/index";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";

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
        for (let i = 1; i < 11; i++) {
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
    it("#construct", () => {
      console.log(ETHZkPool.address);
    });
  });
});
