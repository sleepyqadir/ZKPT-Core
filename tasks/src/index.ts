/* eslint-disable node/no-unpublished-import */
// Import dependencies available in the autotask environment
import { RelayerParams } from "defender-relay-client/lib/relayer";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { ethers } from "ethers";

import PoolABI from "../../artifacts/contracts/Pool.sol/Pool.json";
// Import a dependency not present in the autotask environment which will be included in the js bundle

// Entrypoint for the Autotask

function randomEntropy(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function handler(credentials: RelayerParams) {
  try {
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });
    const ZKPool = new ethers.Contract(
      "0xd99A6aCb6Ee70a2CedBcA15B6f7c5A165509bb68",
      PoolABI.abi,
      signer
    );
    const entropy = randomEntropy(17);
    const newDrawTransaction = await ZKPool.triggerDraw(4, entropy);
    await newDrawTransaction.wait();
  } catch (err) {
    console.log("error handling", err);
  }
}
