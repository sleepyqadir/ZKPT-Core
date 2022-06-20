// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YieldGenerator {
    function generateYield(uint256[] memory _poolBalance) public {
        payable(msg.sender).transfer(1 ether);
    }
}
