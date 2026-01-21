// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

contract VotingPoll {
    address public admin;
    string public title;
    uint256 public votingEndTime;
    uint256 public candidateCount;
    bool public votingActive;
    bool public isPublic;
    bool private initialized;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public voters;
    mapping(address => uint256) public voterVotedFor;
    mapping(address => bool) public whitelistedVoters;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VotingStarted(uint256 votingEndTime);
    event VotingEnded();
    event VoterWhitelisted(address indexed voter);

    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    function _onlyAdmin() internal view {
        require(msg.sender == admin, "Only admin can call this");
    }

    modifier votingOpen() {
        _votingOpen();
        _;
    }

    function _votingOpen() internal view {
        require(votingActive && block.timestamp < votingEndTime, "Voting not active");
    }

    function initialize(address _admin, string memory _title, bool _isPublic) external {
        require(!initialized, "Already initialized");
        initialized = true;
        admin = _admin;
        title = _title;
        isPublic = _isPublic;
        votingActive = false;
        candidateCount = 0;
    }

    function whitelistVoter(address _voter) external onlyAdmin {
        whitelistedVoters[_voter] = true;
        emit VoterWhitelisted(_voter);
    }

    function addCandidate(string memory _name) external onlyAdmin {
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            voteCount: 0
        });
        emit CandidateAdded(candidateCount, _name);
    }

    function startVoting(uint256 _durationInMinutes) external onlyAdmin {
        require(!votingActive, "Voting already active");
        votingActive = true;
        votingEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        emit VotingStarted(votingEndTime);
    }

    function vote(uint256 _candidateId) external votingOpen {
        require(!voters[msg.sender], "Already voted");
        
        if (!isPublic) {
            require(whitelistedVoters[msg.sender], "Voter not whitelisted");
        }
        
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");

        voters[msg.sender] = true;
        voterVotedFor[msg.sender] = _candidateId;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function endVoting() external onlyAdmin {
        require(votingActive, "Voting not active");
        votingActive = false;
        emit VotingEnded();
    }

    function getCandidate(uint256 _candidateId) external view returns (Candidate memory) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");
        return candidates[_candidateId];
    }

    function getWinner() external view returns (uint256 winnerId, string memory winnerName, uint256 votes) {
        require(!votingActive, "Voting still active");
        require(candidateCount > 0, "No candidates");

        uint256 maxVotes = 0;
        uint256 winnerId_ = 0;

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId_ = i;
            }
        }

        return (winnerId_, candidates[winnerId_].name, candidates[winnerId_].voteCount);
    }

    function hasVoted(address _voter) external view returns (bool) {
        return voters[_voter];
    }
}
