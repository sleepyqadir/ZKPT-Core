pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "merkleTree.circom";


// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
// Verifies that the blind number user selects 
template Winning(levels) {
    signal input root;
    signal input nullifierHash;
    signal input recipient; // not taking part in any computations
    signal input relayer;  // not taking part in any computations
    signal input fee;      // not taking part in any computations
    signal input nullifier;
    signal input secret;
    signal input blind;
    signal input draw;
    signal input random;
    signal input pathElements[levels];
    signal input pathIndices[levels];


    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== 17;
    nullifierHasher.out === nullifierHash;

    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    commitmentHasher.inputs[2] <== blind;

    component saltCommitment = Poseidon(2);
    saltCommitment.inputs[0] <== commitmentHasher.out;
    saltCommitment.inputs[1] <== draw;


    component tree = MerkleTreeInclusionProof(levels);
    tree.leaf <== saltCommitment.out;
    
    for (var i = 0; i < levels; i++) {
        tree.path_elements[i] <== pathElements[i];
        tree.path_index[i] <== pathIndices[i];
    }
    root === tree.root;
    blind === random;
    // Add hidden signals to make sure that tampering with recipient or fee will invalidate the snark proof
    // Most likely it is not required, but it's better to stay on the safe side and it only takes 2 constraints
    // Squares are used to prevent optimizer from removing those constraints
    signal recipientSquare;
    signal feeSquare;
    signal relayerSquare;
    signal refundSquare;
    recipientSquare <== recipient * recipient;
    feeSquare <== fee * fee;
    relayerSquare <== relayer * relayer;
}

component main {public [draw,random,root,nullifierHash,recipient,relayer,fee]} = Winning(20);