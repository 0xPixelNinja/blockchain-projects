// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

contract CertificateRegistry {
    address public admin;
    uint256 public certificateCount;
    uint256 public constant START_ID = 1001;

    struct Certificate {
        uint256 id;
        string studentName;
        string ipfsHash;
        address issuer;
        uint256 issuedAt;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public issuerCertificates;

    event CertificateIssued(
        uint256 indexed certId,
        string studentName,
        string ipfsHash,
        address indexed issuer
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
        certificateCount = 0;
    }

    function issueCertificate(
        string calldata _studentName,
        string calldata _ipfsHash
    ) external returns (uint256) {
        require(bytes(_studentName).length > 0, "Empty student name");
        require(bytes(_ipfsHash).length > 0, "Empty IPFS hash");

        certificateCount++;
        uint256 certId = START_ID + certificateCount - 1;

        certificates[certId] = Certificate({
            id: certId,
            studentName: _studentName,
            ipfsHash: _ipfsHash,
            issuer: msg.sender,
            issuedAt: block.timestamp
        });

        issuerCertificates[msg.sender].push(certId);

        emit CertificateIssued(certId, _studentName, _ipfsHash, msg.sender);

        return certId;
    }

    function getCertificate(uint256 _certId) external view returns (Certificate memory) {
        require(certificates[_certId].issuedAt != 0, "Certificate not found");
        return certificates[_certId];
    }

    function getCertificatesByIssuer(address _issuer) external view returns (uint256[] memory) {
        return issuerCertificates[_issuer];
    }

    function verifyCertificate(uint256 _certId) external view returns (bool exists, string memory studentName, string memory ipfsHash, address issuer, uint256 issuedAt) {
        Certificate memory cert = certificates[_certId];
        if (cert.issuedAt == 0) {
            return (false, "", "", address(0), 0);
        }
        return (true, cert.studentName, cert.ipfsHash, cert.issuer, cert.issuedAt);
    }
}
