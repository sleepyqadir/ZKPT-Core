// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./MerkleTreeWithHistory.sol";

import "./DrawManager.sol";

import "./interfaces/IVerifier.sol";

import "./interfaces/IWETHGateway.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IWETH.sol";

contract Pool is MerkleTreeWithHistory, DrawManager, ReentrancyGuard {
    uint256 public immutable denomination;

    address constant POOL_PROXY = 0xE039BdF1d874d27338e09B55CB09879Dedca52D8;

    IVerifier public immutable withdrawVerifier;
    IVerifier public immutable winningVerifier;

    IWETHGateway public immutable wethGateway;

    IWETH public WETH;

    mapping(bytes32 => bool) public nullifierHashes;

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    event Deposit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
    event Withdrawal(
        address to,
        bytes32 nullifierHash,
        address indexed relayer,
        uint256 fee
    );
    event Received(address, uint256);

    constructor(
        IVerifier _verifierWithdraw, // withdraw verify
        IVerifier _verifierWinning, // withdraw+ winning verify
        IWETHGateway _wethGateway,
        uint256 _denomination,
        uint32 _merkleTreeHeight,
        address _hasher,
        address _relayer,
        address _weth,
        uint256 _minutes
    ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) DrawManager(_minutes) {
        require(_denomination > 0, "denomination should be greater than 0");
        winningVerifier = _verifierWinning;
        withdrawVerifier = _verifierWithdraw;
        denomination = _denomination;
        WETH = IWETH(_weth);
        wethGateway = _wethGateway;
        WETH.approve(address(_wethGateway), type(uint256).max);
        transferOwnership(_relayer);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function authorizePool(address pool) internal onlyOwner {
        WETH.approve(pool, type(uint256).max);
    }

    function deposit(bytes32 _commitment) external payable nonReentrant {
        bytes32 saltedCommitment = hashLeftRight(
            _commitment,
            bytes32(currentDrawId)
        );
        uint32 insertedIndex = _insert(saltedCommitment);

        require(
            msg.value == denomination,
            "Please send `mixDenomination` ETH along with transaction"
        );

        wethGateway.depositETH{value: msg.value}(POOL_PROXY, address(this), 0);

        emit Deposit(saltedCommitment, insertedIndex, block.timestamp);
    }

    function withdraw(
        Proof calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee,
        uint256 _drawId
    ) external payable nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");

        require(
            !nullifierHashes[_nullifierHash],
            "The note has been already spent"
        );

        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one

        require(
            draws[_drawId].isCompleted,
            "Draw is not completed cannot withdraw right now"
        );

        require(
            withdrawVerifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [
                    uint256(_root),
                    uint256(_nullifierHash),
                    uint256(uint160(address(_recipient))),
                    uint256(uint160(address(_relayer))),
                    _fee,
                    uint256(_drawId),
                    uint256(draws[_drawId].random)
                ]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;

        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );

        wethGateway.withdrawETH(POOL_PROXY, denomination - _fee, _recipient);

        if (_fee > 0) {
            (bool success, ) = _relayer.call{value: _fee}("");
            require(success, "payment to _relayer did not go thru");
        }

        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    }

    // Add calculation for the winning amount

    function winning(
        Proof calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee,
        uint256 _drawId
    ) external payable nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");

        require(
            !nullifierHashes[_nullifierHash],
            "The note has been already spent"
        );

        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one

        require(
            draws[_drawId].isCompleted,
            "Draw is not completed cannot withdraw right now"
        );

        require(
            winningVerifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [
                    uint256(_root),
                    uint256(_nullifierHash),
                    uint256(uint160(address(_recipient))),
                    uint256(uint160(address(_relayer))),
                    _fee,
                    _drawId,
                    draws[_drawId].random
                ]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;

        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );

        wethGateway.withdrawETH(POOL_PROXY, denomination - _fee, _recipient);

        if (_fee > 0) {
            (bool success, ) = _relayer.call{value: _fee}("");
            require(success, "payment to _relayer did not go thru");
        }

        draws[_drawId].isSpent = true;

        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    }

    function isSpent(bytes32 _nullifierHash) public view returns (bool) {
        return nullifierHashes[_nullifierHash];
    }

    // TODO remove the random number generator to vrf
    function random(uint256 bound) public view returns (uint256) {
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp +
                        block.difficulty +
                        ((
                            uint256(keccak256(abi.encodePacked(block.coinbase)))
                        ) / (block.timestamp)) +
                        block.gaslimit +
                        ((uint256(keccak256(abi.encodePacked(msg.sender)))) /
                            (block.timestamp)) +
                        block.number
                )
            )
        );
        uint256 xmr = (seed - ((seed / 1000) * 1000));
        return xmr % bound;
    }

    // fix the issue of the random
    function triggerDraw(uint256 _minutes) public {
        uint256 index = random(5);
        _triggerDraw(index, _minutes);
    }
}
