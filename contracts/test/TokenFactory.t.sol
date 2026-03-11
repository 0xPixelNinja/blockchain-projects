// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Test.sol";
import "../src/token/TokenFactory.sol";
import "../src/token/TokenTemplate.sol";

contract TokenFactoryTest is Test {
    TokenFactory factory;
    address creator1 = address(0x1);
    address creator2 = address(0x2);
    address recipient = address(0x3);

    function setUp() public {
        factory = new TokenFactory();
        vm.deal(creator1, 10 ether);
        vm.deal(creator2, 10 ether);
    }

    function testCreateToken() public {
        vm.prank(creator1);
        address tokenAddr = factory.createToken("TestCoin", "TST", 1000e18);

        TokenTemplate token = TokenTemplate(tokenAddr);
        assertEq(token.name(), "TestCoin");
        assertEq(token.symbol(), "TST");
        assertEq(token.totalSupply(), 1000e18);
        assertEq(token.creator(), creator1);
    }

    function testCreatorReceivesSupply() public {
        vm.prank(creator1);
        address tokenAddr = factory.createToken("MyCoin", "MYC", 500_000e18);

        TokenTemplate token = TokenTemplate(tokenAddr);
        assertEq(token.balanceOf(creator1), 500_000e18);
    }

    function testMultipleTokens() public {
        vm.prank(creator1);
        factory.createToken("CoinA", "CA", 100e18);

        vm.prank(creator1);
        factory.createToken("CoinB", "CB", 200e18);

        address[] memory all = factory.getDeployedTokens();
        assertEq(all.length, 2);
    }

    function testGetTokensByCreator() public {
        vm.prank(creator1);
        factory.createToken("CoinA", "CA", 100e18);

        vm.prank(creator2);
        factory.createToken("CoinB", "CB", 200e18);

        address[] memory c1Tokens = factory.getTokensByCreator(creator1);
        address[] memory c2Tokens = factory.getTokensByCreator(creator2);
        assertEq(c1Tokens.length, 1);
        assertEq(c2Tokens.length, 1);

        assertEq(TokenTemplate(c1Tokens[0]).name(), "CoinA");
        assertEq(TokenTemplate(c2Tokens[0]).name(), "CoinB");
    }

    function testGetDeployedTokenCount() public {
        assertEq(factory.getDeployedTokenCount(), 0);

        vm.prank(creator1);
        factory.createToken("CoinA", "CA", 100e18);
        assertEq(factory.getDeployedTokenCount(), 1);

        vm.prank(creator2);
        factory.createToken("CoinB", "CB", 200e18);
        assertEq(factory.getDeployedTokenCount(), 2);
    }

    function testTokenTransfer() public {
        vm.prank(creator1);
        address tokenAddr = factory.createToken("TransferCoin", "TFC", 1000e18);

        TokenTemplate token = TokenTemplate(tokenAddr);

        vm.prank(creator1);
        token.transfer(recipient, 250e18);

        assertEq(token.balanceOf(creator1), 750e18);
        assertEq(token.balanceOf(recipient), 250e18);
    }

    function testDifferentCreators() public {
        vm.prank(creator1);
        address t1 = factory.createToken("Alpha", "ALP", 1000e18);

        vm.prank(creator2);
        address t2 = factory.createToken("Beta", "BET", 2000e18);

        assertEq(TokenTemplate(t1).creator(), creator1);
        assertEq(TokenTemplate(t2).creator(), creator2);
        assertEq(TokenTemplate(t1).balanceOf(creator1), 1000e18);
        assertEq(TokenTemplate(t2).balanceOf(creator2), 2000e18);

        address[] memory all = factory.getDeployedTokens();
        assertEq(all.length, 2);
    }

    function testEmitTokenCreated() public {
        vm.prank(creator1);
        vm.expectEmit(false, true, false, true);
        emit TokenFactory.TokenCreated(address(0), creator1, "EventCoin", "EVT", 777e18);
        factory.createToken("EventCoin", "EVT", 777e18);
    }
}
