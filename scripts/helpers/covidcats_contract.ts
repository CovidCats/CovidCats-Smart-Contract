import { provider, wallet } from "./wallet"
const ethers = require("ethers");

const abi = [
    {
      "inputs":[],
      "name":"claim",
      "outputs":[{"internalType":"bytes32","name":"requestId","type":"bytes32"}],
      "stateMutability":"payable",
      "type":"function"
    },
    {
      "inputs":[],
      "name":"withdrawLink",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    {
      "inputs":[],
      "name":"toggleSale",
      "outputs":[],
      "stateMutability":
      "nonpayable",
      "type":"function"
    },
    {
      "inputs":[],
      "name":"withdrawBalance",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    {
      "inputs":[],
      "name":"saleIsActive",
      "outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view",
      "type":"function"
    },
    "event Mint(address indexed _minter, uint256 indexed _tokenID, uint256[7] random_numbers)"
]

export async function claim(_address: string) {
    const covidcats_contract = new ethers.Contract(_address, abi, provider);
    const covidcats_contract_connected = covidcats_contract.connect(wallet);
    await covidcats_contract_connected.claim({value: ethers.utils.parseEther("0.1")});
    console.log("COVIDCAT CLAIMED!")
}

export async function withdrawLink(_address: string) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  const covidcats_contract_connected = covidcats_contract.connect(wallet);
  await covidcats_contract_connected.withdrawLink();
  console.log("LINK WITHDRAWN!")
}

export async function withdrawBalance(_address: string) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  const covidcats_contract_connected = covidcats_contract.connect(wallet);
  await covidcats_contract_connected.withdrawBalance();
  console.log("ETH WITHDRAWN!")
}

export async function toggleSale(_address: string) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  const covidcats_contract_connected = covidcats_contract.connect(wallet);
  await covidcats_contract_connected.toggleSale();
  console.log("MINT TURNED ON!")
}

export async function saleIsActive(_address: string) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  // const covidcats_contract_connected = covidcats_contract.connect(wallet);
  const saleOn = await covidcats_contract.saleIsActive();
  return saleOn;
}

export async function getEvent(_address: string) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  
  console.log("LISTENING FOR MINT EVENT")
  covidcats_contract.once("Mint", async (_minter: string, _tokenID: any) => {
    const id = _tokenID.toNumber();
    const traits = await findMintEvent(_address, id)
    console.log(traits)
  })
}

// For any tokenID, find the corresponding Mint event and get trait data from event log data
async function findMintEvent(_address: string, _tokenId: number) {
  const covidcats_contract = new ethers.Contract(_address, abi, provider);
  
  // Get the Mint event by tokenId
  const eventFilter = covidcats_contract.filters.Mint(null, _tokenId)
  const event = await covidcats_contract.queryFilter(eventFilter);
  
  // Use ethers.js library to decode this Mint event
  const iface = new ethers.utils.Interface(abi)
  const data = event[0].data
  const topics = event[0].topics
  const decoded_event = iface.parseLog({ data, topics })

  // Return NFT traits
  const nft_traits = decoded_event.args[2]
  return nft_traits;
}