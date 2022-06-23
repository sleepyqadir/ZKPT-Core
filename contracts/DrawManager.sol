pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract DrawManager is Ownable {
    using Math for uint256;

    // State Variables
    struct DrawStruct {
        uint256 drawId;
        uint256 startTime;
        uint256 endTime;
        uint256 activeMintingPeriod; // minting tickets is allowed. TASK: rename to "isMintingPeriodActive"?
        bool isCompleted; // winner was found; winnings were deposited.
        bool isEnded;
    }

    struct WinningTicketStruct {
        uint256 drawId;
        uint256 nullifierHashIndex;
        bytes32 nullifierHash;
        bool isSpent;
    }

    uint256 public constant NUMBER_OF_MINUTES = 10; // 1 week by default; configurable

    uint256 public currentDrawId = 0;

    uint256 public numDraws = 0;

    mapping(uint256 => uint256) public prizes; // key is DrawId

    mapping(uint256 => WinningTicketStruct) public winningTickets; // key is DrawId

    mapping(uint256 => DrawStruct) public draws; // key is lotteryId

    // Events goes here
    event LogNewLottery(address creator, uint256 startTime, uint256 endTime); // emit when lottery created

    // errors

    // modifiers

    /* @dev check that minting period is completed, and lottery drawing can begin
    either:
    1) minting period manually ended, ie lottery is inactive. Then drawing can begin immediately.
    2) lottery minting period has ended organically, and lottery is still active at that point
    */

    modifier isDrawActive() {
        if (draws[currentDrawId].endTime > block.timestamp) {
            revert("Draw: previous draw not ended");
        }
        _;
    }

    modifier isLotteryMintingCompleted(uint256 drawId) {
        if (draws[drawId].activeMintingPeriod > block.timestamp) {
            revert("Draw: minting period is not ended");
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

    modifier isDrawEnded(uint256 drawId) {
        if (draws[drawId].isEnded) {
            revert("Draw: draw is already ended");
        }
        _;
    }

    /*
     * @title initDraw
     * @dev A function to initialize a new Draw
     * probably should also be onlyOwner
     * @param uint256 numMinutes: in minutes, how long mint period will last
     */
    function initDraw(uint256 numMinutes_) external onlyOwner isDrawActive {
        // basically default value
        // if set to 0, default to explicit default number of days
        if (numMinutes_ == 0) {
            numMinutes_ = NUMBER_OF_MINUTES;
        }
        uint256 endTime = block.timestamp + (numMinutes_ * 1 minutes);
        uint256 activeMintingPeriod = block.timestamp + 1 minutes;
        draws[currentDrawId] = DrawStruct({
            drawId: currentDrawId,
            startTime: block.timestamp,
            endTime: endTime,
            activeMintingPeriod: activeMintingPeriod,
            isCompleted: false,
            isEnded: false
        });
        numDraws++;
        currentDrawId++;
        emit LogNewLottery(msg.sender, block.timestamp, endTime);
    }

    /*
     * @title trigger draw completed will select the random user from the merkle root history using vrf function
     * @dev a function for owner to trigger lottery drawing
     */

    // Todo add the functionality to track the current merkle tree height so no user that has deposited after it considered in this draw
    function _triggerDrawComplete(
        uint256 drawId,
        bytes32 _nullifierHash,
        uint256 random
    ) public isLotteryMintingCompleted(drawId) isCompleted(drawId) onlyOwner {
        draws[drawId].isCompleted = true;

        winningTickets[drawId] = WinningTicketStruct({
            drawId: drawId,
            nullifierHashIndex: random,
            nullifierHash: _nullifierHash,
            isSpent: false
        });
    }

    function vrf() internal view returns (bytes32 result) {
        uint256[1] memory bn;
        bn[0] = block.number;
        assembly {
            let memPtr := mload(0x40)
            if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
                invalid()
            }
            result := mload(memPtr)
        }
    }

    /*
     * @title triggerDepositWinnings // TASK: rename to maybe depositWinnings
     * @dev function to deposit winnings for user withdrawal pattern
     * then reset lottery params for new one to be created
     */
    function _triggerDrawEnd(uint256 drawId)
        public
        isDrawEnded(drawId)
        isTimeEnded(drawId)
        onlyOwner
    {
        draws[drawId].isEnded = true;
        // emit before resetting lottery so vars still valid
    }
}
