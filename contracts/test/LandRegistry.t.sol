// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {LandRegistry} from "../src/landregistry/LandRegistry.sol";

contract LandRegistryTest is Test {
    LandRegistry public registry;
    address public registrarAddr;
    address public ownerA = address(0xA001);
    address public ownerB = address(0xB002);
    address public outsider = address(0xCAFE);

    function setUp() public {
        registrarAddr = address(this);
        registry = new LandRegistry();
    }

    function testRegistrarIsDeployer() public view {
        assertEq(registry.registrar(), registrarAddr);
    }

    function testRegisterLand() public {
        registry.registerLand(8801, "Block A, Street 5", ownerA, "QmDeed8801");
        assertEq(registry.landCount(), 1);

        LandRegistry.LandRecord memory land = registry.getLand(8801);
        assertEq(land.landId, 8801);
        assertEq(land.location, "Block A, Street 5");
        assertEq(land.currentOwner, ownerA);
        assertEq(land.deedCID, "QmDeed8801");
    }

    function testRegisterMultipleLands() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        registry.registerLand(8802, "Block B", ownerB, "QmB");
        registry.registerLand(8803, "Block C", ownerA, "QmC");
        assertEq(registry.landCount(), 3);
    }

    function testDuplicateRegistrationReverts() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.LandAlreadyExists.selector, 8801));
        registry.registerLand(8801, "Block B", ownerB, "QmB");
    }

    function testOnlyRegistrarCanRegister() public {
        vm.prank(outsider);
        vm.expectRevert(LandRegistry.OnlyRegistrar.selector);
        registry.registerLand(8801, "Block A", ownerA, "QmA");
    }

    function testEmptyLocationReverts() public {
        vm.expectRevert(LandRegistry.EmptyLocation.selector);
        registry.registerLand(8801, "", ownerA, "QmA");
    }

    function testEmptyDeedCIDReverts() public {
        vm.expectRevert(LandRegistry.EmptyDeedCID.selector);
        registry.registerLand(8801, "Block A", ownerA, "");
    }

    function testZeroAddressOwnerReverts() public {
        vm.expectRevert(LandRegistry.InvalidOwner.selector);
        registry.registerLand(8801, "Block A", address(0), "QmA");
    }

    function testTransferOwnership() public {
        registry.registerLand(8801, "Block A", ownerA, "QmOriginal");
        registry.transferOwnership(8801, ownerB, "QmNewDeed", "Sold in 2026");

        LandRegistry.LandRecord memory land = registry.getLand(8801);
        assertEq(land.currentOwner, ownerB);
        assertEq(land.deedCID, "QmNewDeed");
    }

    function testTransferOwnershipWithoutNewDeed() public {
        registry.registerLand(8801, "Block A", ownerA, "QmOriginal");
        registry.transferOwnership(8801, ownerB, "", "Inherited");

        LandRegistry.LandRecord memory land = registry.getLand(8801);
        assertEq(land.currentOwner, ownerB);
        assertEq(land.deedCID, "QmOriginal");
    }

    function testTransferToSameOwnerReverts() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.expectRevert(LandRegistry.SameOwner.selector);
        registry.transferOwnership(8801, ownerA, "", "re-assign");
    }

    function testOnlyRegistrarCanTransfer() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.prank(outsider);
        vm.expectRevert(LandRegistry.OnlyRegistrar.selector);
        registry.transferOwnership(8801, ownerB, "", "stolen");
    }

    function testTransferNonexistentLandReverts() public {
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.LandNotFound.selector, 9999));
        registry.transferOwnership(9999, ownerB, "", "ghost");
    }

    function testOwnershipHistoryGrows() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        registry.transferOwnership(8801, ownerB, "QmB", "Sold 2026");

        LandRegistry.OwnershipEntry[] memory history = registry.getOwnershipHistory(8801);
        assertEq(history.length, 2);
        assertEq(history[0].owner, ownerA);
        assertEq(history[0].note, "Initial registration");
        assertEq(history[1].owner, ownerB);
        assertEq(history[1].note, "Sold 2026");
        assertEq(history[1].deedCID, "QmB");
    }

    function testUpdateLocation() public {
        registry.registerLand(8801, "Block A, Street 5", ownerA, "QmA");
        registry.updateLocation(8801, "Block A, Street 7 (Corrected)");

        LandRegistry.LandRecord memory land = registry.getLand(8801);
        assertEq(land.location, "Block A, Street 7 (Corrected)");
    }

    function testOnlyRegistrarCanUpdateLocation() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.prank(outsider);
        vm.expectRevert(LandRegistry.OnlyRegistrar.selector);
        registry.updateLocation(8801, "Block B");
    }

    function testUpdateLocationEmptyReverts() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.expectRevert(LandRegistry.EmptyLocation.selector);
        registry.updateLocation(8801, "");
    }

    function testGetLandsByOwner() public {
        registry.registerLand(8801, "A", ownerA, "QmA");
        registry.registerLand(8802, "B", ownerA, "QmB");
        registry.registerLand(8803, "C", ownerB, "QmC");

        uint256[] memory aLands = registry.getLandsByOwner(ownerA);
        assertEq(aLands.length, 2);
        assertEq(aLands[0], 8801);
        assertEq(aLands[1], 8802);

        uint256[] memory bLands = registry.getLandsByOwner(ownerB);
        assertEq(bLands.length, 1);
        assertEq(bLands[0], 8803);
    }

    function testVerifyDeedMatch() public {
        registry.registerLand(8801, "Block A", ownerA, "QmDeed8801");
        assertTrue(registry.verifyDeed(8801, "QmDeed8801"));
    }

    function testVerifyDeedMismatch() public {
        registry.registerLand(8801, "Block A", ownerA, "QmDeed8801");
        assertFalse(registry.verifyDeed(8801, "QmFakeDeed"));
    }

    function testGetNonexistentLandReverts() public {
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.LandNotFound.selector, 9999));
        registry.getLand(9999);
    }

    function testEmitLandRegistered() public {
        vm.expectEmit(true, true, false, true);
        emit LandRegistry.LandRegistered(8801, "Block A", ownerA, "QmA");
        registry.registerLand(8801, "Block A", ownerA, "QmA");
    }

    function testEmitOwnershipTransferred() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.expectEmit(true, true, true, true);
        emit LandRegistry.OwnershipTransferred(8801, ownerA, ownerB, "QmB", "Sold");
        registry.transferOwnership(8801, ownerB, "QmB", "Sold");
    }

    function testEmitLocationUpdated() public {
        registry.registerLand(8801, "Block A", ownerA, "QmA");
        vm.expectEmit(true, false, false, true);
        emit LandRegistry.LocationUpdated(8801, "Block A", "Block B");
        registry.updateLocation(8801, "Block B");
    }
}
