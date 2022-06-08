import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
const { poseidonContract } = require("circomlibjs");

export const getPoseidonFactory = (nInputs: number) => {
  const bytecode = poseidonContract.createCode(nInputs);
  const abiJson = poseidonContract.generateABI(nInputs);
  const abi = new ethers.utils.Interface(abiJson);
  return new ContractFactory(abi, bytecode);
};
