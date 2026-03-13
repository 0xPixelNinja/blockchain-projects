// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Script.sol";
import "../src/certificate/CertificateRegistry.sol";

contract DeployCertificate is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        CertificateRegistry registry = new CertificateRegistry();
        console.log("CertificateRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}
