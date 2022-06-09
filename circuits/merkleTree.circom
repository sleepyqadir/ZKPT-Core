pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
// Computes MiMC([left, right])

template Sorting() {
    signal input elements[2]; // 0 is leaf and 1 is path_element;
    signal input selector;
    signal output out[2];
    signal inter[2];
    // [leaf:0 , path_element:1]
    // if selector is 0 then path_element is on 0 and leaf on 1
    // if selector is 1 then path_element is on 1 and leaf on 0
    component isz = IsZero();
    // out will be 1 if selector is 0 and out will be 0 if path_index is 1
    isz.in <== selector;
    // if selector is 0 then path_element else leaf
    inter[0] <== elements[0] * selector;  
    out[0] <== inter[0] + elements[1] * isz.out;
    // if path_index is 0 then leaf else path_element
    inter[1] <== elements[1] * selector;
    out[1] <== elements[0] * isz.out + inter[1];
}


template MerkleTreeInclusionProof(n) {
    signal input leaf;
    signal input path_elements[n];
    signal input path_index[n]; // path index are 0's and 1's indicating whether the current element is on the left or right
    signal output root; // note that this is an OUTPUT signal

    //[assignment] insert your code here to compute the root from a leaf and elements along the path
    component levelHashes[n];
    component sorting[n];
    
    for (var i = 0; i < n; i++){
        sorting[i] = Sorting();
        levelHashes[i] = Poseidon(2);
        sorting[i].selector <== path_index[i];
        sorting[i].elements[0] <== path_elements[i];
        if(i == 0) {
            sorting[i].elements[1] <== leaf;
            levelHashes[i].inputs[0] <== sorting[i].out[0]; 
            levelHashes[i].inputs[1] <== sorting[i].out[1];
        }
        else {
            sorting[i].elements[1] <== levelHashes[i-1].out;
            levelHashes[i].inputs[0] <== sorting[i].out[0];
            levelHashes[i].inputs[1] <== sorting[i].out[1];
        }

    }

    root <== levelHashes[n-1].out;

    // [1,2,3,4] => 2,1 => A(0),B => C(1)
}