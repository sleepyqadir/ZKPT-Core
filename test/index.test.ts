import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { getPoseidonFactory } from ".";

// TODO: add support of env variables

// const { MERKLE_TREE_HEIGHT } = process.env;

function toFixedHex(number: any, length = 32) {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  let str = BigInt(number).toString(16);
  while (str.length < length * 2) str = "0" + str;
  str = "0x" + str;
  return str;
}

describe("MerkleTree", function () {
  // TODO change the any type to the typechain
  let merkleTreeWithHistory: any;
  const levels = 16;
  let poseidonContract: Contract;
  beforeEach(async function () {
    const [signer] = await ethers.getSigners();
    poseidonContract = await getPoseidonFactory(2).connect(signer).deploy();
    const MerkleTreeInstance = await ethers.getContractFactory(
      "MerkleTreeWithHistoryMock"
    );
    merkleTreeWithHistory = await MerkleTreeInstance.deploy(
      levels,
      poseidonContract.address
    );
    await merkleTreeWithHistory.deployed();
  });

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
