// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Test.sol";
import "../src/charity/CharityDonationTracker.sol";

contract CharityDonationTrackerTest is Test {
    CharityDonationTracker charity;
    address admin = address(this);
    address charityAddr = address(0x100);
    address donor1 = address(0x1);
    address donor2 = address(0x2);

    function setUp() public {
        charity = new CharityDonationTracker();
        vm.deal(donor1, 10 ether);
        vm.deal(donor2, 10 ether);
    }

    function testAdminIsDeployer() public view {
        assertEq(charity.admin(), admin);
    }

    function testCreateCampaign() public {
        charity.createCampaign("Save the Forest", charityAddr);
        
        assertEq(charity.campaignCount(), 1);
        
        CharityDonationTracker.Campaign memory c = charity.getCampaign(1);
        assertEq(c.name, "Save the Forest");
        assertEq(c.charityAddress, charityAddr);
        assertTrue(c.active);
    }

    function testDonate() public {
        charity.createCampaign("Save the Forest", charityAddr);

        vm.prank(donor1);
        charity.donate{value: 1 ether}(1);

        CharityDonationTracker.Campaign memory c = charity.getCampaign(1);
        assertEq(c.totalDonated, 1 ether);
        assertEq(charity.getDonorContribution(1, donor1), 1 ether);
    }

    function testMultipleDonations() public {
        charity.createCampaign("Save the Forest", charityAddr);

        vm.prank(donor1);
        charity.donate{value: 1 ether}(1);
        
        vm.prank(donor2);
        charity.donate{value: 2 ether}(1);

        CharityDonationTracker.Campaign memory c = charity.getCampaign(1);
        assertEq(c.totalDonated, 3 ether);
        assertEq(charity.getCampaignDonationCount(1), 2);
    }

    function testWithdrawFunds() public {
        charity.createCampaign("Save the Forest", charityAddr);

        vm.prank(donor1);
        charity.donate{value: 5 ether}(1);

        uint256 balanceBefore = charityAddr.balance;

        vm.prank(charityAddr);
        charity.withdrawFunds(1);

        assertEq(charityAddr.balance, balanceBefore + 5 ether);
        
        CharityDonationTracker.Campaign memory c = charity.getCampaign(1);
        assertEq(c.totalDonated, 0);
    }

    function testOnlyCharityCanWithdraw() public {
        charity.createCampaign("Save the Forest", charityAddr);

        vm.prank(donor1);
        charity.donate{value: 1 ether}(1);

        vm.prank(donor1);
        vm.expectRevert("Only charity can withdraw");
        charity.withdrawFunds(1);
    }

    function testCannotDonateToClosedCampaign() public {
        charity.createCampaign("Save the Forest", charityAddr);
        charity.closeCampaign(1);

        vm.prank(donor1);
        vm.expectRevert("Campaign not active");
        charity.donate{value: 1 ether}(1);
    }

    function testCannotDonateZero() public {
        charity.createCampaign("Save the Forest", charityAddr);

        vm.prank(donor1);
        vm.expectRevert("Donation must be > 0");
        charity.donate{value: 0}(1);
    }
}
