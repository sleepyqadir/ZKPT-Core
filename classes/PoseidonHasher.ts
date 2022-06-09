/* eslint-disable node/no-missing-import */
import { Hasher } from "../src/merkleTree";
import { poseidonHash } from "../utils/index";

export class PoseidonHasher implements Hasher {
  poseidon: any;

  constructor(poseidon: any) {
    this.poseidon = poseidon;
  }

  hash(left: string, right: string) {
    return poseidonHash(this.poseidon, [left, right]);
  }
}
