Make sure to setup the .env file

`npx hardhat deploy --network rinkeby` => `npx hardhat etherscan-verify --network rinkeby`
This will compile the contract, deploy on Rinkeby, and verify the contract on Etherscan

'npx hardhat run scripts/test_mint.ts --network rinkeby'
This will run a test mint 

# Simple NFT generation contract

Testing on Rinkeby:
1. Add environment variables to .env file. See hardhat.config.ts to see which env vairables are needed.
2. Deploy contract to Rinkeby using the `deploy` script. Note the address of the contract.
3. Supply address to `claim` script to claim a NFT.
4. Watch contract on Eterscan for VFR callback, and NFT minting. You should see contract emitting associated 
    events in the events tab onf Etherscan.
5. You can also run the `testMinted` script to get the minted NFT traits.

TODO:
* add metadata generation script
* add metadata methods to contract 
