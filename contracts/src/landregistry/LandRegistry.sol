// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

// Immutable land ownership ledger with chain-of-custody history and IPFS deed verification.
// Only the registrar (deployer) can register, transfer, and update land records.
contract LandRegistry {
    struct LandRecord {
        uint256 landId;
        string location;
        address currentOwner;
        string deedCID;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    struct OwnershipEntry {
        address owner;
        string deedCID;
        uint256 timestamp;
        string note;
    }

    address public immutable registrar;
    uint256 public landCount;

    mapping(uint256 => LandRecord) private lands;
    mapping(uint256 => OwnershipEntry[]) private ownershipHistory;
    mapping(address => uint256[]) private ownerLands;
    mapping(uint256 => bool) private landExists;

    event LandRegistered(
        uint256 indexed landId,
        string location,
        address indexed owner,
        string deedCID
    );

    event OwnershipTransferred(
        uint256 indexed landId,
        address indexed previousOwner,
        address indexed newOwner,
        string deedCID,
        string note
    );

    event LocationUpdated(
        uint256 indexed landId,
        string oldLocation,
        string newLocation
    );

    error OnlyRegistrar();
    error LandAlreadyExists(uint256 landId);
    error LandNotFound(uint256 landId);
    error EmptyLocation();
    error EmptyDeedCID();
    error InvalidOwner();
    error SameOwner();

    modifier onlyRegistrar() {
        if (msg.sender != registrar) revert OnlyRegistrar();
        _;
    }

    constructor() {
        registrar = msg.sender;
    }

    function registerLand(
        uint256 _landId,
        string calldata _location,
        address _owner,
        string calldata _deedCID
    ) external onlyRegistrar {
        if (landExists[_landId]) revert LandAlreadyExists(_landId);
        if (bytes(_location).length == 0) revert EmptyLocation();
        if (bytes(_deedCID).length == 0) revert EmptyDeedCID();
        if (_owner == address(0)) revert InvalidOwner();

        lands[_landId] = LandRecord({
            landId: _landId,
            location: _location,
            currentOwner: _owner,
            deedCID: _deedCID,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        landExists[_landId] = true;
        landCount++;
        ownerLands[_owner].push(_landId);

        ownershipHistory[_landId].push(OwnershipEntry({
            owner: _owner,
            deedCID: _deedCID,
            timestamp: block.timestamp,
            note: "Initial registration"
        }));

        emit LandRegistered(_landId, _location, _owner, _deedCID);
    }

    function transferOwnership(
        uint256 _landId,
        address _newOwner,
        string calldata _newDeedCID,
        string calldata _note
    ) external onlyRegistrar {
        if (!landExists[_landId]) revert LandNotFound(_landId);
        if (_newOwner == address(0)) revert InvalidOwner();

        LandRecord storage land = lands[_landId];
        if (land.currentOwner == _newOwner) revert SameOwner();

        address previousOwner = land.currentOwner;
        land.currentOwner = _newOwner;
        land.updatedAt = block.timestamp;

        if (bytes(_newDeedCID).length > 0) {
            land.deedCID = _newDeedCID;
        }

        ownerLands[_newOwner].push(_landId);

        string memory historyDeedCID;
        if (bytes(_newDeedCID).length > 0) {
            historyDeedCID = _newDeedCID;
        } else {
            historyDeedCID = land.deedCID;
        }
        ownershipHistory[_landId].push(OwnershipEntry({
            owner: _newOwner,
            deedCID: historyDeedCID,
            timestamp: block.timestamp,
            note: _note
        }));

        emit OwnershipTransferred(_landId, previousOwner, _newOwner, land.deedCID, _note);
    }

    function updateLocation(
        uint256 _landId,
        string calldata _newLocation
    ) external onlyRegistrar {
        if (!landExists[_landId]) revert LandNotFound(_landId);
        if (bytes(_newLocation).length == 0) revert EmptyLocation();

        LandRecord storage land = lands[_landId];
        string memory oldLocation = land.location;
        land.location = _newLocation;
        land.updatedAt = block.timestamp;

        emit LocationUpdated(_landId, oldLocation, _newLocation);
    }

    function getLand(uint256 _landId) external view returns (LandRecord memory) {
        if (!landExists[_landId]) revert LandNotFound(_landId);
        return lands[_landId];
    }

    function getOwnershipHistory(uint256 _landId) external view returns (OwnershipEntry[] memory) {
        if (!landExists[_landId]) revert LandNotFound(_landId);
        return ownershipHistory[_landId];
    }

    function getLandsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerLands[_owner];
    }

    function verifyDeed(uint256 _landId, string calldata _cid) external view returns (bool) {
        if (!landExists[_landId]) revert LandNotFound(_landId);
        return keccak256(bytes(lands[_landId].deedCID)) == keccak256(bytes(_cid));
    }
}
