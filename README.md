
![Adobe_Express_20220628_1330280 3379003718744713](https://user-images.githubusercontent.com/38910854/177583308-a8ba83f6-50d2-4919-a111-c5f7cde3073d.png)

# zkPoolTogether

ZkPoolTogether is the zkp version of PoolTogether; usage of zero-knowledge proof systems will protect users' identity, and the blind guess number user selected while depositing. For example, users can prove that they have deposited and selected X number in the pool and claim the reward without revealing any knowledge.

The project is currently live and frontend is hosted

- Mainnet
    ----
    - Network: Polgon Mainnet
    - App Url: https://zkpt-ui.vercel.app/
- Testnet
    ---- 
    - Network: Rinkebt Testnet
    - App Url: https://testnet-zkpt-ui.vercel.app/

## Demo

https://studio.youtube.com/video/bFdyjDphY6w/edit

## Contract Addresses

- Testnet:
   --
    - Relayer Address: **0x99d667ff3e5891a5f40288cb94276158ae8176a0**
    - Pool Address: **0xC8b59e543cc298dECa3965a0d6c8612951bd2F24**
    - Withdraw Verifier: **0x98869e780d0A0bbB210CE2b410DE661c4391242C**
    - Winning Verifier:  **0x118fF3b4E3825cE3701412deed20C53A1e47E505**
    - Strategy Pool wethGateway: **0xD1DECc6502cc690Bc85fAf618Da487d886E54Abe**
    - Poseidon Hasher: **0x25352E780f664623a0DdCF8Cd136b9D5fD04bb06**
    - weth: **0x25352E780f664623a0DdCF8Cd136b9D5fD04bb06**
    - POOL_PROXY: **0xE039BdF1d874d27338e09B55CB09879Dedca52D8**
    - aWeth: **0x608D11E704baFb68CfEB154bF7Fd641120e33aD4**

- Mainnet
    --
    - Relayer Address: **0xf61c320cbfebf96ab97fa667fee931eecd417be5**
    - Pool Address: **0xebC02B3371ef6f01309c5cC2Ef32a755FDeeEDef**
    - Withdraw Verifier: **0xA680E910f33B4F01575ef11462A321055F90833d**
    - Winning Verifier:  **0x3d84a4a3f61bc0e8812b6B5cc457fE24fd9F1dF4**
    - Strategy Pool wethGateway: **0x9BdB5fcc80A49640c7872ac089Cc0e00A98451B6**
    - Poseidon Hasher: **0xb5107cd5157C6D8E452F170Eaa0183d79c60E88D**
    - wMatic: **0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270**
    - POOL_PROXY: **0x794a61358D6845594F94dc1DB02A252b5b4814aD**
    - aWMatic: **0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97**



## Architecture

![hh drawio](https://user-images.githubusercontent.com/38910854/177583122-10e0ffc5-c497-421a-8065-7d8b93fb7b20.png)

## Project Structure

```
.
├── circuits
│   ├── merkleTree.circom
│   ├── powersOfTau28_hez_final_20.ptau
│   ├── winning.circom
│   └── withdraw.circom
├── classes
│   ├── Deposit.ts
│   ├── dist
│   │   └── PoseidonHasher.js
│   └── PoseidonHasher.ts
├── contracts
│   ├── DrawManager.sol
│   ├── interfaces
│   │   ├── IHasher.sol
│   │   ├── IVerifier.sol
│   │   ├── IWETHGateway.sol
│   │   └── IWETH.sol
│   ├── libraries
│   │   └── UniformRandomNumber.sol
│   ├── MerkleTreeWithHistory.sol
│   ├── Mocks
│   │   ├── MerkleTreeWithHistoryMock.sol
│   │   └── MockYieldGenerator.sol
│   ├── Pool.sol
│   ├── WinningVerifier.sol
│   └── WithdrawVerifier.sol
├── hardhat.config.ts
├── nethereum-gen.settings
├── package.json
├── package-lock.json
├── powersOfTau28_hez_final_20.ptau
├── README.md
├── scripts
│   ├── bump-solidity.ts
│   ├── compile-winning-circuit.sh
│   ├── compile-withdraw-circuit.sh
│   └── deploy.ts
├── src
│   └── merkleTree.ts
├── tasks
│   ├── dist
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── rollup.config.js
│   ├── src
│   │   └── index.ts
│   ├── tsconfig.json
│   └── yarn.lock
├── test
│   └── index.test.ts
├── tsconfig.json
├── utils
│   └── index.ts
└── yarn.lock

```

#### Frontend:

Please visit the ZKPT_UI repository for frontend project Structure.

https://github.com/sleepyqadir/ZKPT_UI


## Run Locally

Clone the project

```bash
  git clone https://github.com/sleepyqadir/ZKPT_UI
```

Go to the project directory

```bash
  cd ZKPT-Core
```

Install dependencies

```bash
  npm install
```

Compile and build circuits

```bash

npm run circuits

```

Compile contracts

```bash
  
  build:contracts:compile

```
## Running Tests

To run tests, run the following command

```bash

  npx hardhat test

```


## Deployment

To deploy this project on rinkeby run : Please change the config in deploy file before deploying as right now it is manually configured for mainnet deployment. It will be reverted back soon

```bash

  npm run deploy:rinkeby

```


## Screenshots

**Home Page**

![Screenshot from 2022-07-06 20-20-32](https://user-images.githubusercontent.com/38910854/177586071-be9b6f9a-bd46-4501-9f19-6b4191650934.png)

**App Page aka Deposit Page**
![Screenshot from 2022-07-06 20-19-30](https://user-images.githubusercontent.com/38910854/177586087-3b082b9b-8d90-4eed-b666-765a153dc591.png)

**Draws Page**
![Screenshot from 2022-07-06 20-19-34](https://user-images.githubusercontent.com/38910854/177586112-6490e704-d7ba-4af8-928d-b9b58c10f0e2.png)

**Check Draw Page**
![Screenshot from 2022-07-06 20-19-42](https://user-images.githubusercontent.com/38910854/177586134-a0ae878e-5dc1-47ef-9bc0-dc0ac82529ea.png)

**Check Draw Page For Withdraw**
![Screenshot from 2022-07-06 20-20-13](https://user-images.githubusercontent.com/38910854/177586154-f963c6cf-12cf-4a43-9c09-3212ddd268e8.png)



## Tech Stack

**Circuits:** Circom, Groth16, Snarkjs, Circom Tester

**Contracts:** Solidity, Hardhat, Ethers, Typechain

**Server:** Defender Oppenzeppline

**Client:** NextJs, ChakraUI, Emotion, Ethers, SWR


## Acknowledgements

 - [Hardhat](https://hardhat.org/)
 - [Pool Together](https://pooltogether.com/)
 - [Tornado Cash](https://tornado.cash/)
 - [Vercel](https://vercel.com/dashboard)
 - [Mashko Next web3 boilerplate](https://github.com/mirshko/next-web3-boilerplate)



## Support

For support,
- email: qadir@xord.com
- dicord: AbdulQadir#0432
- twiiter: [sleepyqadir](https://twitter.com/sleepyqadir)


## Authors

- [@sleepyqadir](https://www.github.com/sleepyqadir)


## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://katherinempeterson.com/)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/)
[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/sleepyqadir)

