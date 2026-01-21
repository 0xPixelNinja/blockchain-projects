// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Test.sol";
import "../src/voting/DecentralizedVoting.sol";

contract DecentralizedVotingTest is Test {
    DecentralizedVoting voting;
    address admin = address(this);
    address voter1 = address(0x1);
    address voter2 = address(0x2);

    function setUp() public {
        voting = new DecentralizedVoting();
    }

    function testAdminIsDeployer() public view {
        assertEq(voting.admin(), admin);
    }

    function testAddCandidate() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");
        
        assertEq(voting.candidateCount(), 2);
        
        DecentralizedVoting.Candidate memory c1 = voting.getCandidate(1);
        assertEq(c1.name, "Alice");
        assertEq(c1.voteCount, 0);
    }

    function testWhitelistVoter() public {
        voting.whitelistVoter(voter1);
        assertTrue(voting.whitelistedVoters(voter1));
    }

    function testStartVoting() public {
        voting.addCandidate("Alice");
        voting.startVoting(60);
        
        assertTrue(voting.votingActive());
        assertGt(voting.votingEndTime(), block.timestamp);
    }

    function testVote() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");
        voting.whitelistVoter(voter1);
        voting.startVoting(60);

        vm.prank(voter1);
        voting.vote(1);

        assertTrue(voting.hasVoted(voter1));
        
        DecentralizedVoting.Candidate memory c1 = voting.getCandidate(1);
        assertEq(c1.voteCount, 1);
    }

    function testCannotDoubleVote() public {
        voting.addCandidate("Alice");
        voting.whitelistVoter(voter1);
        voting.startVoting(60);

        vm.prank(voter1);
        voting.vote(1);

        vm.prank(voter1);
        vm.expectRevert("Already voted");
        voting.vote(1);
    }

    function testNonWhitelistedCannotVote() public {
        voting.addCandidate("Alice");
        voting.startVoting(60);

        vm.prank(voter1);
        vm.expectRevert("Voter not whitelisted");
        voting.vote(1);
    }

    function testGetWinner() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");
        voting.whitelistVoter(voter1);
        voting.whitelistVoter(voter2);
        voting.startVoting(60);

        vm.prank(voter1);
        voting.vote(2);
        
        vm.prank(voter2);
        voting.vote(2);

        voting.endVoting();

        (uint256 id, string memory name, uint256 votes) = voting.getWinner();
        assertEq(id, 2);
        assertEq(name, "Bob");
        assertEq(votes, 2);
    }
}
