pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Ownable.sol";

contract DrawManager is Ownable {
    // State Variables
    struct DrawStruct {
        uint256 drawId;
        uint256 startTime;
        uint256 endTime;
        bool isCompleted;
        uint256 nullifierHashIndex;
        bytes32 nullifierHash;
        bool isSpent;
        uint256 amount;
    }

    uint256 public constant NUMBER_OF_MINUTES = 5;

    uint256 public currentDrawId = 0;

    uint256 public numDraws = 0;

    DrawStruct[] public draws;

    // Events goes here
    event LogNewLottery(address creator, uint256 startTime, uint256 endTime); // emit when lottery created

    // errors

    // modifiers
    modifier isDrawActive() {
        if (currentDrawId != 0) {
            if (draws[currentDrawId - 1].endTime > block.timestamp) {
                revert("Draw: previous draw not ended");
            }
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

    /*
     * @title initDraw
     * @dev A function to initialize a new Draw
     * probably should also be onlyOwner
     * @param uint256 numMinutes: in minutes, how long mint period will last
     */
    function initDraw() external onlyOwner isDrawActive {
        // basically default value
        // if set to 0, default to explicit default number of days
        uint256 endTime = block.timestamp + (NUMBER_OF_MINUTES * 1 minutes);
        draws.push(
            DrawStruct({
                drawId: currentDrawId,
                startTime: block.timestamp,
                endTime: endTime,
                isCompleted: false,
                isSpent: false,
                amount: 0,
                nullifierHash: "",
                nullifierHashIndex: 0
            })
        );
        numDraws++;
        currentDrawId++;
        emit LogNewLottery(msg.sender, block.timestamp, endTime);
    }

    /*
     * @title triggerDepositWinnings // TASK: rename to maybe depositWinnings
     * @dev function to deposit winnings for user withdrawal pattern
     * then reset lottery params for new one to be created
     */
    function _triggerDrawEnd(
        uint256 drawId,
        uint256 amount,
        bytes32 _nullifierHash,
        uint256 random
    ) public isCompleted(drawId) isTimeEnded(drawId) onlyOwner {
        draws[drawId].isCompleted = true;
        draws[drawId].nullifierHashIndex = random;
        draws[drawId].nullifierHash = _nullifierHash;
        draws[drawId].amount = amount;
    }

    function getDraws() external view returns (DrawStruct[] memory) {
        return draws;
    }
}
