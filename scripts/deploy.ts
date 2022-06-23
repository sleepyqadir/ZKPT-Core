/* eslint-disable no-process-exit */
/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
import { getPoseidonFactory } from "../utils/index";
import { ethers } from "hardhat";

const ETH_AMOUNT = ethers.utils.parseEther("1");

async function main() {
  console.log("deploying....");
  const [signer] = await ethers.getSigners();
  console.log({ signer });
  const poseidonContract = await getPoseidonFactory(2).connect(signer).deploy();

  console.log({ poseidonContract });

  const verifier = await ethers.getContractFactory("Verifier");

  const verifierInstance = await verifier.deploy();

  await verifierInstance.deployed();

  const ZKPool = await ethers.getContractFactory("Pool");

  const ZKPoolInstance = await ZKPool.deploy(
    verifierInstance.address,
    ETH_AMOUNT,
    20,
    poseidonContract.address
  );

  await ZKPoolInstance.deployed();

  console.log("Greeter deployed to:", ZKPoolInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
