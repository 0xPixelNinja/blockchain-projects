// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

interface IVotingPoll {
    function initialize(address _admin, string memory _title, bool _isPublic) external;
}

// Minimal Clones library to avoid external dependencies issues
library Clones {
    function clone(address implementation) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }
}

contract VotingFactory {
    address public implementation;
    address[] public deployedPolls;

    event PollCreated(address indexed pollAddress, address indexed creator, string title, bool isPublic);

    constructor(address _implementation) {
        require(_implementation != address(0), "Invalid implementation");
        implementation = _implementation;
    }

    function createPoll(string memory _title, bool _isPublic) external returns (address) {
        address clone = Clones.clone(implementation);
        IVotingPoll(clone).initialize(msg.sender, _title, _isPublic);
        deployedPolls.push(clone);
        
        emit PollCreated(clone, msg.sender, _title, _isPublic);
        return clone;
    }

    function getDeployedPolls() external view returns (address[] memory) {
        return deployedPolls;
    }
}
