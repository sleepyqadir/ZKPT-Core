//  SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

interface IHasher {
    function poseidon(bytes32[2] calldata leftRight)
        external
        pure
        returns (bytes32);
}
