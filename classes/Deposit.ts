/* eslint-disable node/no-missing-import */
import { ethers } from "ethers";
import { poseidonHash } from "../utils";

export class Deposit {
  private constructor(
    public readonly nullifier: Uint8Array,
    public readonly secret: Uint8Array,
    public readonly blind: number,
    public poseidon: any
  ) {
    this.poseidon = poseidon;
  }

  static new(blind: number, poseidon: any) {
    const nullifier = ethers.utils.randomBytes(15);
    const secret = ethers.utils.randomBytes(15);
    return new this(nullifier, secret, blind, poseidon);
  }

  get commitment(): string {
    return poseidonHash(this.poseidon, [
      this.nullifier,
      this.secret,
      this.blind,
    ]);
  }

  get nullifierHash() {
    return poseidonHash(this.poseidon, [this.nullifier, 17]);
  }
}
