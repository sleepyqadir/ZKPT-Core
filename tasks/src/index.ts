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
export async function handler(credentials: RelayerParams) {
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });
  const ZKPool = new ethers.Contract(
    "0xB46DB0C763B3bC1C3a93965D00D79baBf5004E1D",
    PoolABI.abi,
    signer
  );
  const newDrawTransaction = await ZKPool.initDraw();
  await newDrawTransaction.wait();
}
