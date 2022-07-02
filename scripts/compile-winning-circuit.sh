#!/bin/bash

cd circuits/build

if [ -f ./Winning ]; then
  echo "build dir already exists..."
else
  echo 'creating build dir...'
  mkdir Winning
fi

if [ -f ../powersOfTau28_hez_final_20.ptau ]; then
  echo "powersOfTau28_hez_final_20.ptau already exists. Skipping."
else
  echo 'Downloading powersOfTau28_hez_final_20.ptau'
  wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau
fi

echo "Compiling withdraw.circom..."

# compile circuit

circom ../winning.circom --r1cs --wasm --sym -o Winning

cd Winning
snarkjs r1cs info winning.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup winning.r1cs ../../powersOfTau28_hez_final_20.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor Name" -v -e="blah blah blah"
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# # generate solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey ../../../contracts/WinningVerifier.sol

# cd ..
