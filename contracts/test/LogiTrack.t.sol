// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {LogiTrack} from "../src/logitrack/LogiTrack.sol";

contract LogiTrackTest is Test {
    LogiTrack public logitrack;
    address public registrar = address(0xBEEF);
    address public other = address(0xCAFE);

    function setUp() public {
        logitrack = new LogiTrack();
    }

    function testStartIdIs2001() public {
        vm.prank(registrar);
        uint256 id = logitrack.registerProduct("Honey", "Farm #42", "QmAbc123");
        assertEq(id, 2001);
    }

    function testRegisterProduct() public {
        vm.prank(registrar);
        uint256 id = logitrack.registerProduct("Luxury Watch", "Switzerland", "QmXyz456");
        assertEq(id, 2001);
        assertEq(logitrack.productCount(), 1);
    }

    function testSequentialIds() public {
        vm.startPrank(registrar);
        uint256 id1 = logitrack.registerProduct("A", "X", "QmA");
        uint256 id2 = logitrack.registerProduct("B", "Y", "QmB");
        uint256 id3 = logitrack.registerProduct("C", "Z", "QmC");
        vm.stopPrank();
        assertEq(id1, 2001);
        assertEq(id2, 2002);
        assertEq(id3, 2003);
    }

    function testGetProduct() public {
        vm.prank(registrar);
        logitrack.registerProduct("Organic Honey", "Farm #42", "QmQualityCID");
        LogiTrack.Product memory p = logitrack.getProduct(2001);
        assertEq(p.productName, "Organic Honey");
        assertEq(p.origin, "Farm #42");
        assertEq(p.qualityDocCID, "QmQualityCID");
        assertEq(p.registrar, registrar);
    }

    function testGetProductsByRegistrar() public {
        vm.startPrank(registrar);
        logitrack.registerProduct("A", "X", "QmA");
        logitrack.registerProduct("B", "Y", "QmB");
        vm.stopPrank();

        vm.prank(other);
        logitrack.registerProduct("C", "Z", "QmC");

        uint256[] memory ids = logitrack.getProductsByRegistrar(registrar);
        assertEq(ids.length, 2);
        assertEq(ids[0], 2001);
        assertEq(ids[1], 2002);
    }

    function testVerifyProductExists() public {
        vm.prank(registrar);
        logitrack.registerProduct("Steel Pipe", "Factory #7", "QmSteel");
        (bool exists, string memory name, string memory origin, string memory cid,,) =
            logitrack.verifyProduct(2001);
        assertTrue(exists);
        assertEq(name, "Steel Pipe");
        assertEq(origin, "Factory #7");
        assertEq(cid, "QmSteel");
    }

    function testVerifyProductNotFound() public view {
        (bool exists,,,,,) = logitrack.verifyProduct(9999);
        assertFalse(exists);
    }

    function testInitialTrackingStateUsesOrigin() public {
        vm.prank(registrar);
        logitrack.registerProduct("Steel Pipe", "Factory #7", "QmSteel");

        (LogiTrack.ProductStatus status, string memory location, uint256 updatedAt) = logitrack.getTrackingState(2001);

        assertEq(uint256(status), uint256(LogiTrack.ProductStatus.Registered));
        assertEq(location, "Factory #7");
        assertGt(updatedAt, 0);
    }

    function testUpdateTracking() public {
        vm.prank(registrar);
        logitrack.registerProduct("Watch", "Geneva", "QmWatch");

        vm.prank(registrar);
        logitrack.updateTracking(2001, LogiTrack.ProductStatus.InTransit, "Zurich Hub", "Left warehouse");

        (LogiTrack.ProductStatus status, string memory location,) = logitrack.getTrackingState(2001);
        assertEq(uint256(status), uint256(LogiTrack.ProductStatus.InTransit));
        assertEq(location, "Zurich Hub");
    }

    function testTrackingHistoryIncludesRegistrationAndUpdates() public {
        vm.prank(registrar);
        logitrack.registerProduct("Honey", "Farm #42", "QmHoney");

        vm.prank(registrar);
        logitrack.updateTracking(2001, LogiTrack.ProductStatus.AtCheckpoint, "Mombasa Port", "Customs cleared");

        LogiTrack.TrackingEvent[] memory history = logitrack.getTrackingHistory(2001);
        assertEq(history.length, 2);
        assertEq(uint256(history[0].status), uint256(LogiTrack.ProductStatus.Registered));
        assertEq(history[0].location, "Farm #42");
        assertEq(uint256(history[1].status), uint256(LogiTrack.ProductStatus.AtCheckpoint));
        assertEq(history[1].location, "Mombasa Port");
        assertEq(history[1].note, "Customs cleared");
    }

    function testOnlyRegistrarCanUpdateTracking() public {
        vm.prank(registrar);
        logitrack.registerProduct("Honey", "Farm #42", "QmHoney");

        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(LogiTrack.UnauthorizedUpdater.selector, other, 2001));
        logitrack.updateTracking(2001, LogiTrack.ProductStatus.InTransit, "Nairobi", "Moved");
    }

    function testCannotUpdateTrackingWithEmptyLocation() public {
        vm.prank(registrar);
        logitrack.registerProduct("Honey", "Farm #42", "QmHoney");

        vm.prank(registrar);
        vm.expectRevert(LogiTrack.EmptyLocation.selector);
        logitrack.updateTracking(2001, LogiTrack.ProductStatus.InTransit, "", "Moved");
    }

    function testCannotRegisterEmptyName() public {
        vm.prank(registrar);
        vm.expectRevert(LogiTrack.EmptyProductName.selector);
        logitrack.registerProduct("", "Origin", "QmCID");
    }

    function testCannotRegisterEmptyOrigin() public {
        vm.prank(registrar);
        vm.expectRevert(LogiTrack.EmptyOrigin.selector);
        logitrack.registerProduct("Name", "", "QmCID");
    }

    function testCannotRegisterEmptyQualityDocCID() public {
        vm.prank(registrar);
        vm.expectRevert(LogiTrack.EmptyQualityDocCID.selector);
        logitrack.registerProduct("Name", "Origin", "");
    }

    function testGetNonexistentProductReverts() public {
        vm.expectRevert(abi.encodeWithSelector(LogiTrack.ProductNotFound.selector, 9999));
        logitrack.getProduct(9999);
    }

    function testEmitProductRegistered() public {
        vm.prank(registrar);
        vm.expectEmit(true, true, false, true);
        emit LogiTrack.ProductRegistered(2001, "Watch", "Geneva", "QmCID", registrar);
        logitrack.registerProduct("Watch", "Geneva", "QmCID");
    }

    function testEmitTrackingUpdated() public {
        vm.prank(registrar);
        logitrack.registerProduct("Watch", "Geneva", "QmCID");

        vm.prank(registrar);
        vm.expectEmit(true, true, false, true);
        emit LogiTrack.TrackingUpdated(
            2001,
            LogiTrack.ProductStatus.Delivered,
            "Berlin",
            "Delivered to buyer",
            registrar
        );
        logitrack.updateTracking(2001, LogiTrack.ProductStatus.Delivered, "Berlin", "Delivered to buyer");
    }
}
