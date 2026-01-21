// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Script.sol";
import "../src/voting/DecentralizedVoting.sol";

contract DeployVoting is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        DecentralizedVoting voting = new DecentralizedVoting();
        
        console.log("DecentralizedVoting deployed at:", address(voting));
        
        vm.stopBroadcast();
    }
}
