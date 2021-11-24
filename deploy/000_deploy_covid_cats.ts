import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const fs = require("fs")

const RINKEBY_VRF_COORDINATOR = "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B";
const RINKEBY_LINKTOKEN = "0x01be23585060835e02b77ef475b0cc51aa1e0709";
const RINKEBY_KEYHASH =
  "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  const deployResult = await deploy("CovidCats", {
    from: deployer,
    args: [RINKEBY_VRF_COORDINATOR, RINKEBY_LINKTOKEN, RINKEBY_KEYHASH],
    log: true,
  });

  // fs.writeFileSync("./toggle.json", JSON.stringify(deployResult))

  if (deployResult.newlyDeployed) {
    log(`contract Token deployed at ${deployResult.address} using ${deployResult.receipt!.gasUsed!} gas`);
  }

  // Wait 60 seconds before attempting to verify contract on Etherscan
  setTimeout(async() => {
    await hre.run("verify:verify", {
      address: deployResult.address!,
      constructorArguments: [
        RINKEBY_VRF_COORDINATOR,
        RINKEBY_LINKTOKEN,
        RINKEBY_KEYHASH
      ]
    });
  }, 60000)
    
};

export default func;
func.tags = ["CovidCats"];
