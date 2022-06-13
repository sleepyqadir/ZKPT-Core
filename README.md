# ZK PoolTogether

ZkPoolTogether is the zkp version of PoolTogether; usage of zero-knowledge proof systems will protect users' identity, and the amount users are depositing. 

## PoolTogether:

PoolTogether is a crypto-powered savings protocol based on Premium Bonds. Save money and have a chance to win every week. In PoolTogether, the user deposits funds in the pool and has a chance to win a prize awarded every day. If the user doesn't win, he can withdraw the deposited money.

## PoolTogether User Journey:
- Users can connect to which blockchain they want to deposit.
- Then, users can deposit USDC to the pool, representing the share of your token in the pool.
- The amount can be arbitrary. 
- Amounts are then invested in strategies to gain yield. 
- After every 24 hours, the VRF function from chainlink picks a random user who wins the lottery price. 
- The winner can claim the winning price within 60 days. 

The overview of the work looks like this, but there are some minor details as well, such as pool sizes, etc., which relate to the amount you have deposited and the average time you have deposited. 

But we won’t be diving deep into those things. 

## Scope of zkPoolTogether [Advantages]:
ZkPoolTogether is the zkp version of PoolTogether; usage of zero-knowledge proof systems will protect users' identity, and the amount users are depositing. For example, users can prove that they have deposited X amount in the pool and claim the reward without revealing any knowledge.
## Working of the ZkPoolTogether:
### Actors:
Actors include users involved in the overall process of ZkPoolTogether and entities that interact with the smart contract and Frontend of the system.

#### Depositor:
User that deposits the amount in the pool and creates the commitment hash using the unique secret and nullifier.

#### Relayer Node: 
A central server that triggers the yield collection selects the winner through a VRF function in a smart contract.
#### Withdrawer: 
User who withdraws the winning amount from the pool by proving the commitment hash.

### Case Scenarios: 
Below are the high-level case scenarios through which actors will pass and interact with the system Frontend, Smart Contract, and circuits.
		
#### Generating Commitment Hash:

[image]
#### Depositing in the Pool:

[image]
#### Relayer Triggering the get yield and selecting the winner:

[image]
#### Winner checks that he is eligible for the prize:

[image]
#### Withdraw the prize to another address:

[image]
## Architecture Overview: 
There are five main components of the system: Pool Contract, VRF Contract, Mock Strategy Contract, Circuits, Relayer, and the Frontend ( denoted as a user ). In the Future, Indexer will also be a part of the architecture.

[image]
## Protocol:
### Contracts: 
This section describes the smart contracts and their high-level working and usage in the ZkPoolTogether.

#### Strategy Mock Contract: 
Strategy Mock Contract will generate a random yield after a fixed amount of time, sent to the pool contract to give the winning prize to the user who won the lottery. 
#### Harmony VRF:
Harmony VRF function will be used here to generate the true randomness to select the winner after the end time of the pool.

Harmony brings the technology of VRF (Verifiable Random Function) natively on a chain to create an optimal solution for the randomness that is unpredictable, unbiased, verifiable, and immediately available.
#### Pool Contract:
The core contract will be the updated tornado cash classic pool version. This contract allows users to deposit into the current Pool. After a fixed amount of time, a yield generated from the mock strategy contract is taken to the pool contract, and a winner is picked using the VRF function.

The user can also withdraw by proving his commitment exists in the Merkle root and checking whether he is the winner or not to withdraw funds to another address.
#### Merkle Tree History Contract:
When the User deposits an amount on the Pool contract, the user must provide a commitment hash. This commitment hash will be stored in a Merkle tree. Then, when the user withdraws this amount and prize with a different account, you have to provide two zero-knowledge proofs. The first proves that the Merkel tree contains your commitment. This proof is a zero-knowledge proof of a Merkle proof. But this is not enough because the user should be allowed to withdraw the deposited amount and prize only once. Because of this, the user has to provide a unique nullifier for the commitment. The contract stores this nullifier; This ensures that users don't be able to withdraw the deposited money more than one time.

The nullifier is guaranteed by the commitment generation method. The commitment is generated from the nullifier and a secret by hashing. If you change the nullifier, so one nullifier can be used for only one commitment. Because of the one-way nature of hashing, it’s not possible to link the commitment and the nullifier, but we can generate a ZKP.

[image]
### Relayer: 
A center relayer triggers the Pool Contract EndDraw function transaction after fixed amounts of time, triggering the GenerateYield on Mock Strategy Contract to create the yield and triggering the VRF contract function to select the random nullifier as a winner.
### Circuits: 
The circuit defines a set of constraints that must be satisfied to accept a given result in the Smart Contract.
#### Merkle Tree Checker Circuit:
Merkle Tree Checker circuit is used to verify that the given path elements and root of the provided leaf is present in the Merkle tree. This circuit is the same as the tornado cash classic Merkle tree circuit used to prove the commitment is the part of the Merkle tree.
#### Commitment hasher: 
It generates the steadfast commitment and nullifier hash using the private secret and nullifier. In this case, a secret and nullifier are not exposed to the external server and smart contract. Then, as I wrote before, the template calculates the nullifier and commitment hash, which is a hash of the nullifier and the secret.
#### Withdraw:
It has two public inputs, the Merkle root, and the nullifierHash. The Merkle root is needed to verify the Merkle proof, and the nullifierHash is required by the smart contract to store it. The private input parameters are the nullifier, the secret, and the path elements and pathIndices of the Merkle proof. The circuit checks the nullifier by generating the commitment from it and the secret and matches the given Merkle proof. If everything is fine, the zero-knowledge proof will be generated the TC smart contract can validate that.

### Frontend [User Interface]: 
Frontend Includes all the user interfaces to interact with the smart contracts and generate the proofs using the wasm and Zkey generated files of the circuits. Following are the components of the frontend user interface:

#### Main Page:
Display the details and information about the ZkPoolTogether
#### App Page:
Main Application page allows users to navigate the deposit, withdraw, and prizes pages.

#### Deposit Page:
Allowing the user to create a commitment and deposit amount in the pool
#### Withdraw Page:
This allows the user to remove the amount and generate proof of valid commitment.

#### Prizes Page:
Allows the user to claim the prize by proofing the commitment
Draw Pages: Display data regarding all the going and past draws of ZkPoolTogether

### Indexer:
The indexer will be used to get the real-time data of the draws from the smart contracts and the draw winners on display on the front end.

For Indexer, we will use the Graph, an indexing protocol for querying networks like Ethereum and IPFS. Anyone can build and publish open APIs, called subgraphs, making data easily accessible.

## Implementation [Tech Stack]:
As mentioned earlier, we implemented the proposed design of

- Circuits: zkSNARK (Groth16) Circom circuit
- Smart contracts: solidity on-chain registry of processes.
- Foundry: a modular toolkit for Ethereum application development
- Node: Relayer node, typescript based. 
- Client lib: typescript library used in the user’s browser to create keys,
- NextJs: for the development of the user interface 

## Out of Scope:

[to be added]