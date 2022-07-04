//  SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract DrawManager is Ownable {
    // State Variables
    struct DrawStruct {
        uint256 drawId;
        uint256 startTime;
        uint256 endTime;
        bool isCompleted;
        bool isSpent;
        uint256 reward;
        uint256 random;
    }

    uint256 public constant NUMBER_OF_MINUTES = 30;

    uint256 public currentDrawId = 0;

    DrawStruct[] public draws;

    // Events goes here
    event LogNewLottery(address creator, uint256 startTime, uint256 endTime); // emit when lottery created

    // errors

    // modifiers
    modifier isDrawActive() {
        if (draws[currentDrawId].endTime > block.timestamp) {
            revert("Draw: previous draw not ended");
        }
        _;
    }

    modifier isCompleted(uint256 drawId) {
        if (draws[drawId].isCompleted) {
            revert("Draw: draw is already completed");
        }
        _;
    }

    modifier isTimeEnded(uint256 drawId) {
        if (draws[drawId].endTime > block.timestamp) {
            revert("Draw: draw time is still remaining");
        }
        _;
    }

    constructor(uint256 _minutes) {
        uint256 endTime = block.timestamp + (_minutes * 1 minutes);
        draws.push(
            DrawStruct({
                drawId: currentDrawId,
                startTime: block.timestamp,
                endTime: endTime,
                isCompleted: false,
                isSpent: false,
                reward: 0,
                random: 0
            })
        );
        emit LogNewLottery(msg.sender, block.timestamp, endTime);
    }

    function _triggerDraw(
        uint256 drawId,
        uint256 index,
        uint256 _minutes,
        uint256 reward
    ) public isCompleted(drawId) isTimeEnded(drawId) onlyOwner isDrawActive {
        draws[drawId].isCompleted = true;
        draws[drawId].reward = reward;
        draws[drawId].random = index;

        uint256 endTime = block.timestamp + (_minutes * 1 minutes);

        currentDrawId++;
        draws.push(
            DrawStruct({
                drawId: currentDrawId,
                startTime: block.timestamp,
                endTime: endTime,
                isCompleted: false,
                isSpent: false,
                reward: 0,
                random: 0
            })
        );
        emit LogNewLottery(msg.sender, block.timestamp, endTime);
    }

    function getDraws() external view returns (DrawStruct[] memory) {
        return draws;
    }
}
