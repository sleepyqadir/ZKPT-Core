/* eslint-disable no-process-exit */
/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */

// ZKPOOL deployed to: 

import { ethers } from "hardhat";

const ETH_AMOUNT = ethers.utils.parseEther("0.01");

async function main() {
  console.log("deploying....");

  const [signer] = await ethers.getSigners();

  console.log({ signer });

  // this is for the withdraw only
  // const verifierWithdraw = await ethers.getContractFactory("WithdrawVerifier");

  // const verifierWithdrawInstance = await verifierWithdraw.deploy();
  // await verifierWithdrawInstance.deployed();

  // console.log(
  //   "Withdraw Verifier deployed to:",
  //   verifierWithdrawInstance.address
  // );

  // this is for the withdraw + winning only
  // const verifierWinning = await ethers.getContractFactory("WinningVerifier");

  // const verifierWinningInstance = await verifierWinning.deploy();
  // await verifierWinningInstance.deployed();

  // console.log("Winning Verifier deployed to:", verifierWinningInstance.address);

  const ZKPool = await ethers.getContractFactory("Pool");

  const ZKPoolInstance = await ZKPool.deploy(
    "0x98869e780d0A0bbB210CE2b410DE661c4391242C",
    "0x118fF3b4E3825cE3701412deed20C53A1e47E505",
    "0xD1DECc6502cc690Bc85fAf618Da487d886E54Abe",
    ETH_AMOUNT,
    20,
    "0x25352E780f664623a0DdCF8Cd136b9D5fD04bb06",
    process.env.RELAYER_ADDRESS || "",
    "0x608D11E704baFb68CfEB154bF7Fd641120e33aD4",
    3
  );

  await ZKPoolInstance.deployed();

  console.log("ZKPOOL deployed to:", ZKPoolInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
