/* eslint-disable node/no-missing-import */
import { ethers } from "ethers";
import { poseidonHash } from "../utils";

export class Deposit {
  private constructor(
    public readonly nullifier: Uint8Array,
    public poseidon: any
  ) {
    this.poseidon = poseidon;
  }

  static new(poseidon: any) {
    const nullifier = ethers.utils.randomBytes(15);
    return new this(nullifier, poseidon);
  }

  get commitment(): string {
    return poseidonHash(this.poseidon, [this.nullifier, 0]);
  }

  get nullifierHash() {
    return poseidonHash(this.poseidon, [this.nullifier, 17]);
  }
}
