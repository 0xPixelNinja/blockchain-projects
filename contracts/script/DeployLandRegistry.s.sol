// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {LandRegistry} from "../src/landregistry/LandRegistry.sol";

contract DeployLandRegistry is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        LandRegistry registry = new LandRegistry();
        console.log("LandRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}
