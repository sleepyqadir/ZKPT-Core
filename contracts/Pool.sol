// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./MerkleTreeWithHistory.sol";
import "./DrawManager.sol";
import "./YieldGenerator.sol";

import "./interfaces/IVerifier.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

contract Pool is MerkleTreeWithHistory, DrawManager, ReentrancyGuard {
    uint256 public immutable denomination;
    uint256 public playersCount;
    IVerifier public immutable verifier;

    mapping(bytes32 => bool) public nullifierHashes;

    bytes32[] players;

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

    YieldGenerator public yieldGenerator;

    /**
    @param _verifier the address of SNARK verifier for this contract
    @param _denomination transfer amount for each deposit
    @param _merkleTreeHeight the height of deposits' Merkle Tree
    */
    constructor(
        IVerifier _verifier,
        uint256 _denomination,
        uint32 _merkleTreeHeight,
        address _hasher,
        address _relayer
    ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
        require(_denomination > 0, "denomination should be greater than 0");
        verifier = _verifier;
        denomination = _denomination;
        yieldGenerator = new YieldGenerator();
        addOwnership(_relayer);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
    @dev Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
    @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
  */
    function deposit(bytes32 _commitment, bytes32 _nullifierHash)
        external
        payable
        nonReentrant
    {
        uint32 insertedIndex = _insert(_commitment);

        require(
            msg.value == denomination,
            "Please send `mixDenomination` ETH along with transaction"
        );

        players.push(_nullifierHash);
        playersCount++;

        emit Deposit(_commitment, insertedIndex, block.timestamp);
    }

    /**
    @dev Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs
    `input` array consists of:
      - merkle root of all deposits in the contract
      - hash of unique deposit nullifier to prevent double spends
      - the recipient of funds
      - optional fee that goes to the transaction sender (usually a relay)
    */
    function withdraw(
        Proof calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee
    ) external payable nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");
        require(
            !nullifierHashes[_nullifierHash],
            "The note has been already spent"
        );
        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
        require(
            verifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [
                    uint256(_root),
                    uint256(_nullifierHash),
                    uint256(uint160(address(_recipient))),
                    uint256(uint160(address(_relayer))),
                    _fee
                ]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;

        removeElement(_nullifierHash);
        playersCount--;

        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );

        (bool success, ) = _recipient.call{value: (denomination - _fee)}("");
        require(success, "payment to _recipient did not go thru");
        if (_fee > 0) {
            (success, ) = _relayer.call{value: _fee}("");
            require(success, "payment to _relayer did not go thru");
        }

        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    }

    function withdrawWinning(
        Proof calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee,
        uint256 drawId
    ) external payable nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");
        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
        require(
            verifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [
                    uint256(_root),
                    uint256(_nullifierHash),
                    uint256(uint160(address(_recipient))),
                    uint256(uint160(address(_relayer))),
                    _fee
                ]
            ),
            "Invalid withdraw proof"
        );

        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );

        require(
            draws[drawId].nullifierHash == _nullifierHash,
            "Nullifier Value does'nt match"
        );

        require(
            draws[drawId].isSpent != true,
            "The winning ticket is already been spent"
        );
        payable(_recipient).transfer(draws[drawId].amount);

        draws[drawId].isSpent = true;
    }

    function isSpent(bytes32 _nullifierHash) public view returns (bool) {
        return nullifierHashes[_nullifierHash];
    }

    function removeElement(bytes32 _element) public {
        for (uint256 i; i < players.length; i++) {
            if (players[i] == _element) {
                players[i] = players[players.length - 1];
                players.pop();
                break;
            }
        }
    }

    function getPlayers() external view returns (bytes32[] memory) {
        return players;
    }

    function rand(uint256 bound) public view returns (uint256) {
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

    function triggerDrawEnd() public {
        uint256 earned = yieldGenerator.generateYield();
        uint256 random = rand(players.length);
        _triggerDrawEnd(currentDrawId - 1, earned, players[random], random);
    }
}
