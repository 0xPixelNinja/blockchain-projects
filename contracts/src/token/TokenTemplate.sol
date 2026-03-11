// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

// Fixed-supply ERC-20 token spawned by TokenFactory. All supply minted to creator at deploy time.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenTemplate is ERC20 {
    address public immutable creator;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _creator
    ) ERC20(_name, _symbol) {
        require(_creator != address(0), "Invalid creator");
        require(_initialSupply > 0, "Supply must be > 0");
        creator = _creator;
        _mint(_creator, _initialSupply);
    }
}
