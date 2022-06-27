/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import { BigNumber, BigNumberish, ethers, ContractFactory } from "ethers";
// @ts-ignore
import { groth16 } from "snarkjs";
import path from "path";
import { Deposit } from "../classes/Deposit";
import { Pool } from "../typechain";
import { PoseidonHasher } from "../classes/PoseidonHasher";
import { MerkleTree } from "../src/merkleTree";
const { poseidonContract } = require("circomlibjs");
interface Proof {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
}

export const poseidonHash = (poseidon: any, inputs: BigNumberish[]): string => {
  const hash = poseidon(inputs.map((x) => BigNumber.from(x).toBigInt()));
  // Make the number within the field size
  const hashStr = poseidon.F.toString(hash);
  // Make it a valid hex string
  const hashHex = BigNumber.from(hashStr).toHexString();
  // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
  const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
  return bytes32;
};

export const toFixedHex = (number: any, length = 32) => {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  let str = BigInt(number).toString(16);
  while (str.length < length * 2) str = "0" + str;
  str = "0x" + str;
  return str;
};

export const prove = async (witness: any): Promise<Proof> => {
  const wasmPath = path.join(
    __dirname,
    "../circuits/build/withdraw_js/withdraw.wasm"
  );
  const zkeyPath = path.join(__dirname, "../circuits/build/circuit_final.zkey");
  const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);
  const solProof: Proof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return solProof;
};

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the contract, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
export const generateMerkleProof = async (
  deposit: Deposit,
  contract: Pool,
  poseidon: any
) => {
  console.log("Getting contract state...");
  const eventFilter = contract.filters.Deposit();
  const events = await contract.queryFilter(eventFilter, 0, "latest");

  const tree = new MerkleTree(20, "test", new PoseidonHasher(poseidon));

  const leaves = events
    .sort((a, b) => a.args.leafIndex - b.args.leafIndex) // Sort events in chronological order
    .map((e) => e.args.commitment);

  for (const iterator of leaves) {
    console.log({ iterator });
    await tree.insert(iterator);
    console.log({ number: tree.totalElements });
  }

  // Find current commitment in the tree
  const depositEvent = events.find(
    (e) => e.args.commitment === deposit.commitment
  );

  const leafIndex = depositEvent ? depositEvent.args.leafIndex : -1;

  // Validate that our data is correct (optional)
  const { root, path_elements, path_index } = await tree.path(leafIndex);
  // const isValidRoot = await contract.isKnownRoot(root);

  // const isSpent = await contract.isSpent(deposit.nullifierHash);
  // assert(isValidRoot === true, "Merkle tree is corrupted");
  // assert(isSpent === false, "The note is already spent");
  // assert(leafIndex >= 0, "The deposit is not found in the tree");

  // Compute merkle proof of our commitment
  return { path_elements, path_index, root };
};

export const getPoseidonFactory = (nInputs: number) => {
  const bytecode = poseidonContract.createCode(nInputs);
  const abiJson = poseidonContract.generateABI(nInputs);
  const abi = new ethers.utils.Interface(abiJson);
  return new ContractFactory(abi, bytecode);
};
