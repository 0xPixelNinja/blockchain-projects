// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

// Permissionless factory that deploys fixed-supply ERC-20 tokens and maintains a registry.
import "./TokenTemplate.sol";

contract TokenFactory {
    address[] public deployedTokens;
    mapping(address => address[]) public creatorTokens;

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply
    );

    function createToken(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) external returns (address) {
        TokenTemplate token = new TokenTemplate(_name, _symbol, _initialSupply, msg.sender);
        address tokenAddress = address(token);

        deployedTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, _name, _symbol, _initialSupply);
        return tokenAddress;
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getTokensByCreator(address _creator) external view returns (address[] memory) {
        return creatorTokens[_creator];
    }

    function getDeployedTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}
