const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

const content = fs.readFileSync("./contracts/WinningVerifier.sol", {
  encoding: "utf-8",
});

const bumped = content.replace(solidityRegex, "pragma solidity ^0.8.0");

const contentSecond = fs.readFileSync("./contracts/WithdrawVerifier.sol", {
  encoding: "utf-8",
});

const bumpedSecond = contentSecond.replace(
  solidityRegex,
  "pragma solidity ^0.8.0"
);

fs.writeFileSync("./contracts/WinningVerifier.sol", bumped);

fs.writeFileSync("./contracts/WithdrawVerifier.sol", bumpedSecond);
