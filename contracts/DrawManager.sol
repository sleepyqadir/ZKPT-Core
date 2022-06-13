pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DrawManager is Ownable {
    using Math for uint256;

    // State Variables
    struct DrawStruct {
        uint256 DrawId;
        uint256 startTime;
        uint256 endTime;
        uint256 activeMintingPeriod; // minting tickets is allowed. TASK: rename to "isMintingPeriodActive"?
        bool isCompleted; // winner was found; winnings were deposited.
        bool isCreated; // is created
    }

    // struct WinningTicketStruct {
    //     uint256 DrawId;
    //     uint256 winningTicketIndex;
    //     bytes32 commitment;
    // }

    uint256 public constant NUMBER_OF_MINUTES = 10; // 1 week by default; configurable

    uint256 public currentDrawId = 0;

    uint256 public numDraws = 0;

    // mapping(uint256 => uint256) public prizes; // key is DrawId

    // mapping(uint256 => WinningTicketStruct) public winningTickets; // key is DrawId

    mapping(uint256 => DrawStruct) public draws; // key is lotteryId

    // mapping(uint256 => mapping(address => uint256)) public pendingWithdrawals; // pending withdrawals for each winner, key is lotteryId, then player address

    // Events goes here
    event LogNewLottery(address creator, uint256 startTime, uint256 endTime); // emit when lottery created

    // errors

    // modifiers

    /* @dev check that minting period is completed, and lottery drawing can begin
    either:
    1) minting period manually ended, ie lottery is inactive. Then drawing can begin immediately.
    2) lottery minting period has ended organically, and lottery is still active at that point
    */
    // modifier isDrawMintingCompleted() {
    //     if (!((draws[currentDrawId].isActive == true &&
    //             draws[currentDrawId].endTime < block.timestamp) ||
    //             draws[currentDrawId].isActive == false)
    //     ) {
    //         revert Lottery__MintingNotCompleted();
    //     }
    //     _;
    // }


    modifier isDrawActive {
      if(draws[currentDrawId].endTime > block.timestamp) {
        revert("Draw: previous draw not ended");
      }
      _;
    }


    // functions goes here

    /*
     * @title initDraw
     * @dev A function to initialize a new Draw
     * probably should also be onlyOwner
     * @param uint256 startTime_: start of minting period, unixtime
     * @param uint256 numMinutes: in minutes, how long mint period will last
     */
    function initDraw(uint256 numMinutes_)
        external
        onlyOwner()
        isDrawActive
    {
        // basically default value
        // if set to 0, default to explicit default number of days
        if (numMinutes_ == 0) {
            numMinutes_ = NUMBER_OF_MINUTES;
        }
        uint256 endTime = block.timestamp + (numMinutes_ * 1 minutes);
        draws[currentDrawId] = DrawStruct({
            DrawId: currentDrawId,
            startTime: block.timestamp,
            endTime: endTime,
            activeMintingPeriod: 1 minutes,
            isCompleted: false,
            isCreated: true
        });
        numDraws = numDraws + 1;
        emit LogNewLottery(msg.sender, block.timestamp, endTime);
    }

    // /*
    //  * @title triggerLotteryDrawing
    //  * @dev a function for owner to trigger lottery drawing
    //  */
    // function triggerDrawing()
    //     external
    //     isLotteryMintingCompleted
    //     onlyOwner
    // {
    //     // console.log("triggerLotteryDrawing");
    //     prizes[currentDrawId] = prizeAmount; // keep track of prize amts for each of the previous lotteries

    //     _playerTicketDistribution(); // create the distribution to get ticket indexes for each user
    //     // can't be done a priori bc of potential multiple mints per user
    //     uint256 winningTicketIndex = _performRandomizedDrawing();
    //     // initialize what we can first
    //     winningTicket.currentLotteryId = currentLotteryId;
    //     winningTicket.winningTicketIndex = winningTicketIndex;
    //     findWinningAddress(winningTicketIndex); // via binary search

    //     emit LogWinnerFound(
    //         currentLotteryId,
    //         winningTicket.winningTicketIndex,
    //         winningTicket.addr
    //     );
    // }

    // /*
    //  * @title triggerDepositWinnings // TASK: rename to maybe depositWinnings
    //  * @dev function to deposit winnings for user withdrawal pattern
    //  * then reset lottery params for new one to be created
    //  */
    // function triggerDepositWinnings() public {
    //     // console.log("triggerDepositWinnings");
    //     pendingWithdrawals[currentLotteryId][winningTicket.addr] = prizeAmount;
    //     prizeAmount = 0;
    //     lotteries[currentLotteryId].isCompleted = true;
    //     winningTickets[currentLotteryId] = winningTicket;
    //     // emit before resetting lottery so vars still valid
    //     emit LotteryWinningsDeposited(
    //         currentLotteryId,
    //         winningTicket.addr,
    //         pendingWithdrawals[currentLotteryId][winningTicket.addr]
    //     );
    // }

}