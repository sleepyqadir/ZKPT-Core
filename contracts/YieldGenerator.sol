// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";

contract YieldGenerator is Ownable {
    event Received(address, uint256);

    function generateYield() public onlyOwner returns (uint256) {
        payable(msg.sender).transfer(0.0001 ether);
        return 100000000000000;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
