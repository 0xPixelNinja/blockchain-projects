// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {LogiTrack} from "../src/logitrack/LogiTrack.sol";

contract DeployLogistics is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        LogiTrack logitrack = new LogiTrack();
        console.log("LogiTrack deployed at:", address(logitrack));

        vm.stopBroadcast();
    }
}
