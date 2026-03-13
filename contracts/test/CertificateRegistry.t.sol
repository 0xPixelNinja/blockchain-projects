// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Test.sol";
import "../src/certificate/CertificateRegistry.sol";

contract CertificateRegistryTest is Test {
    CertificateRegistry registry;
    address issuer1 = address(0x1);
    address issuer2 = address(0x2);
    address verifier = address(0x3);

    function setUp() public {
        registry = new CertificateRegistry();
    }

    function testAdminIsDeployer() public view {
        assertEq(registry.admin(), address(this));
    }

    function testStartIdIs1001() public view {
        assertEq(registry.START_ID(), 1001);
    }

    function testIssueCertificate() public {
        vm.prank(issuer1);
        uint256 certId = registry.issueCertificate("Alice Smith", "QmTestHash123");

        assertEq(certId, 1001);
        assertEq(registry.certificateCount(), 1);

        CertificateRegistry.Certificate memory cert = registry.getCertificate(1001);
        assertEq(cert.studentName, "Alice Smith");
        assertEq(cert.ipfsHash, "QmTestHash123");
        assertEq(cert.issuer, issuer1);
        assertTrue(cert.issuedAt > 0);
    }

    function testSequentialIds() public {
        vm.prank(issuer1);
        uint256 id1 = registry.issueCertificate("Alice", "QmHash1");

        vm.prank(issuer1);
        uint256 id2 = registry.issueCertificate("Bob", "QmHash2");

        vm.prank(issuer2);
        uint256 id3 = registry.issueCertificate("Charlie", "QmHash3");

        assertEq(id1, 1001);
        assertEq(id2, 1002);
        assertEq(id3, 1003);
        assertEq(registry.certificateCount(), 3);
    }

    function testGetCertificatesByIssuer() public {
        vm.startPrank(issuer1);
        registry.issueCertificate("Alice", "QmHash1");
        registry.issueCertificate("Bob", "QmHash2");
        vm.stopPrank();

        vm.prank(issuer2);
        registry.issueCertificate("Charlie", "QmHash3");

        uint256[] memory issuer1Certs = registry.getCertificatesByIssuer(issuer1);
        uint256[] memory issuer2Certs = registry.getCertificatesByIssuer(issuer2);

        assertEq(issuer1Certs.length, 2);
        assertEq(issuer2Certs.length, 1);
        assertEq(issuer1Certs[0], 1001);
        assertEq(issuer1Certs[1], 1002);
        assertEq(issuer2Certs[0], 1003);
    }

    function testVerifyCertificateExists() public {
        vm.prank(issuer1);
        registry.issueCertificate("Alice", "QmHash1");

        (bool exists, string memory name, string memory ipfsHash, address issuer, uint256 issuedAt) = registry.verifyCertificate(1001);

        assertTrue(exists);
        assertEq(name, "Alice");
        assertEq(ipfsHash, "QmHash1");
        assertEq(issuer, issuer1);
        assertTrue(issuedAt > 0);
    }

    function testVerifyCertificateNotFound() public view {
        (bool exists,,,,) = registry.verifyCertificate(9999);
        assertFalse(exists);
    }

    function testCannotIssueEmptyName() public {
        vm.prank(issuer1);
        vm.expectRevert("Empty student name");
        registry.issueCertificate("", "QmHash1");
    }

    function testCannotIssueEmptyHash() public {
        vm.prank(issuer1);
        vm.expectRevert("Empty IPFS hash");
        registry.issueCertificate("Alice", "");
    }

    function testGetNonexistentCertificateReverts() public {
        vm.expectRevert("Certificate not found");
        registry.getCertificate(5000);
    }

    function testEmitCertificateIssued() public {
        vm.prank(issuer1);
        vm.expectEmit(true, true, false, true);
        emit CertificateRegistry.CertificateIssued(1001, "Alice", "QmHash1", issuer1);
        registry.issueCertificate("Alice", "QmHash1");
    }
}
