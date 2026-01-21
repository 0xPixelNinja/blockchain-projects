// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Script.sol";
import "../src/charity/CharityDonationTracker.sol";

contract DeployCharity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        CharityDonationTracker charity = new CharityDonationTracker();
        
        console.log("CharityDonationTracker deployed at:", address(charity));
        
        vm.stopBroadcast();
    }
}
