// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

contract CharityDonationTracker {
    address public admin;
    uint256 public campaignCount;

    struct Campaign {
        uint256 id;
        string name;
        address charityAddress;
        uint256 totalDonated;
        bool active;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;
    mapping(uint256 => Donation[]) public campaignDonations;

    event CampaignCreated(uint256 indexed campaignId, string name, address charityAddress);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed charity, uint256 amount);
    event CampaignClosed(uint256 indexed campaignId);

    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    function _onlyAdmin() internal view {
        require(msg.sender == admin, "Only admin can call this");
    }

    modifier validCampaign(uint256 _campaignId) {
        _validCampaign(_campaignId);
        _;
    }

    function _validCampaign(uint256 _campaignId) internal view {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign");
    }

    modifier onlyCharity(uint256 _campaignId) {
        _onlyCharity(_campaignId);
        _;
    }

    function _onlyCharity(uint256 _campaignId) internal view {
        require(msg.sender == campaigns[_campaignId].charityAddress, "Only charity can withdraw");
    }

    constructor() {
        admin = msg.sender;
        campaignCount = 0;
    }

    function createCampaign(string memory _name, address _charityAddress) external onlyAdmin {
        require(_charityAddress != address(0), "Invalid charity address");
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            name: _name,
            charityAddress: _charityAddress,
            totalDonated: 0,
            active: true
        });
        emit CampaignCreated(campaignCount, _name, _charityAddress);
    }

    function donate(uint256 _campaignId) external payable validCampaign(_campaignId) {
        require(msg.value > 0, "Donation must be > 0");
        require(campaigns[_campaignId].active, "Campaign not active");

        campaigns[_campaignId].totalDonated += msg.value;
        donorContributions[_campaignId][msg.sender] += msg.value;
        campaignDonations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _campaignId) external validCampaign(_campaignId) onlyCharity(_campaignId) {
        uint256 amount = campaigns[_campaignId].totalDonated;
        require(amount > 0, "No funds to withdraw");

        campaigns[_campaignId].totalDonated = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(_campaignId, msg.sender, amount);
    }

    function closeCampaign(uint256 _campaignId) external onlyAdmin validCampaign(_campaignId) {
        campaigns[_campaignId].active = false;
        emit CampaignClosed(_campaignId);
    }

    function getDonorContribution(uint256 _campaignId, address _donor) external view validCampaign(_campaignId) returns (uint256) {
        return donorContributions[_campaignId][_donor];
    }

    function getCampaign(uint256 _campaignId) external view validCampaign(_campaignId) returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function getCampaignDonationCount(uint256 _campaignId) external view validCampaign(_campaignId) returns (uint256) {
        return campaignDonations[_campaignId].length;
    }

    function getCampaignDonation(uint256 _campaignId, uint256 _index) external view validCampaign(_campaignId) returns (Donation memory) {
        require(_index < campaignDonations[_campaignId].length, "Invalid index");
        return campaignDonations[_campaignId][_index];
    }
}
