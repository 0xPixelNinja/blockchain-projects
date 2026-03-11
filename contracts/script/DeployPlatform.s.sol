// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Script.sol";
import "../src/charity/CharityDonationTracker.sol";
import "../src/voting/VotingPoll.sol";
import "../src/voting/VotingFactory.sol";
import "../src/token/TokenFactory.sol";

contract DeployPlatform is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Charity Tracker (Open Registry)
        CharityDonationTracker charity = new CharityDonationTracker();
        console.log("CharityDonationTracker deployed at:", address(charity));
        
        // 2. Deploy Voting Logic
        VotingPoll votingLogic = new VotingPoll();
        console.log("VotingPoll Logic deployed at:", address(votingLogic));
        
        // 3. Deploy Voting Factory
        VotingFactory factory = new VotingFactory(address(votingLogic));
        console.log("VotingFactory deployed at:", address(factory));
        
        // 4. Deploy Token Factory
        TokenFactory tokenFactory = new TokenFactory();
        console.log("TokenFactory deployed at:", address(tokenFactory));
        
        vm.stopBroadcast();
    }
}
