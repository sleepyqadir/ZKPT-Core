const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

const content = fs.readFileSync("./contracts/verifier.sol", {
  encoding: "utf-8",
});
const bumped = content.replace(solidityRegex, "pragma solidity ^0.8.0");

fs.writeFileSync("./contracts/verifier.sol", bumped);
