// npx hardhat run scripts/test_mint.ts --network rinkeby

import fs from "fs";
import { transferLink } from "./helpers/link_contract";
import { claim, withdrawLink, withdrawBalance, saleIsActive, toggleSale, getEvent } from "./helpers/covidcats_contract";

// const address = "0x2372c07b7B4EDDb084B269223D5e3c7BBb8933dB" // CHANGE DEPLOYED COVID CATS CONTRACT ADDRESS HERE
// // Is there a way to programatically change the above address to link to the most recent deployment?

async function test_mint() {
    
    const deploymentData = await fs.readFileSync("./deployments/rinkeby/CovidCats.json");
    const parsed_deploymentData = JSON.parse(deploymentData.toString())

    const _address = parsed_deploymentData.address

    // Check if mint activated
    const mintOn = await saleIsActive(_address)

    if (!mintOn!) {
        await toggleSale(_address)
    }
    
    // Send 5 LINK from my address to the contract
    await transferLink(_address)

    // Claim NFT - Use a while loop to keep attempting claim() until success
    // One error reason - Calling script too many times in a short period of time. The Chainlink VRF takes a minute or two to return a random number to then call the mint logic
    let claimed = false;

    while (!claimed) {
        try {
            await claim(_address);
            claimed = true;
        } catch {
            console.log("FAILED CLAIM");
        }
    }

    // Call withdrawLink()
    await withdrawLink(_address);

    // Get ETH back lol
    await withdrawBalance(_address);

    // Listen to Mint event => Return the newly minted NFT's traits
    await getEvent(_address)
}

test_mint()