// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockYieldGenerator {
    address public beneficiary;

    constructor (address payable _beneficiary) public {
       beneficiary = _beneficiary;
    }

    modifier onlyOwner(){
        require(msg.sender == beneficiary);
        _;
    }
//TODO add the formula for the calculation of yield generated based on pool balance
    function generateYield(uint[] memory _poolBalance) onlyOwner public {
            payable(msg.sender).transfer(1 ether);
    }
}