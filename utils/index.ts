import { BigNumber, BigNumberish, ethers } from "ethers";
// export const unstringifyBigInts = (o) => {
//   if (typeof o == "string" && /^[0-9]+$/.test(o)) {
//     return bigInt(o);
//   } else if (typeof o == "string" && /^0x[0-9a-fA-F]+$/.test(o)) {
//     return bigInt(o);
//   } else if (Array.isArray(o)) {
//     return o.map(unstringifyBigInts);
//   } else if (typeof o == "object") {
//     if (o === null) return null;
//     const res = {};
//     const keys = Object.keys(o);
//     keys.forEach((k) => {
//       res[k] = unstringifyBigInts(o[k]);
//     });
//     return res;
//   } else {
//     return o;
//   }
// };

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
