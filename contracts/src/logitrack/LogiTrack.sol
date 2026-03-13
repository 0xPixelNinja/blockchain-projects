// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

// Decentralized supply chain provenance ledger.
// Coordinators register products with IPFS quality doc CIDs; anyone can verify by ID.
contract LogiTrack {
    enum ProductStatus {
        Registered,
        InTransit,
        AtCheckpoint,
        Delivered,
        Delayed,
        Cancelled
    }

    struct Product {
        uint256 id;
        string productName;
        string origin;
        string qualityDocCID;
        address registrar;
        uint256 registeredAt;
    }

    struct TrackingEvent {
        ProductStatus status;
        string location;
        string note;
        address updatedBy;
        uint256 updatedAt;
    }

    uint256 public constant START_ID = 2001;
    uint256 public productCount;

    mapping(uint256 => Product) private products;
    mapping(address => uint256[]) private registrarProducts;
    mapping(uint256 => ProductStatus) private currentStatuses;
    mapping(uint256 => string) private currentLocations;
    mapping(uint256 => uint256) private lastUpdatedAts;
    mapping(uint256 => TrackingEvent[]) private trackingHistory;

    event ProductRegistered(
        uint256 indexed id,
        string productName,
        string origin,
        string qualityDocCID,
        address indexed registrar
    );

    event TrackingUpdated(
        uint256 indexed id,
        ProductStatus status,
        string location,
        string note,
        address indexed updatedBy
    );

    error EmptyProductName();
    error EmptyOrigin();
    error EmptyQualityDocCID();
    error EmptyLocation();
    error ProductNotFound(uint256 id);
    error UnauthorizedUpdater(address caller, uint256 id);

    function registerProduct(
        string calldata _productName,
        string calldata _origin,
        string calldata _qualityDocCID
    ) external returns (uint256) {
        if (bytes(_productName).length == 0) revert EmptyProductName();
        if (bytes(_origin).length == 0) revert EmptyOrigin();
        if (bytes(_qualityDocCID).length == 0) revert EmptyQualityDocCID();

        productCount++;
        uint256 newId = START_ID + productCount - 1;

        products[newId] = Product({
            id: newId,
            productName: _productName,
            origin: _origin,
            qualityDocCID: _qualityDocCID,
            registrar: msg.sender,
            registeredAt: block.timestamp
        });

        registrarProducts[msg.sender].push(newId);
        currentStatuses[newId] = ProductStatus.Registered;
        currentLocations[newId] = _origin;
        lastUpdatedAts[newId] = block.timestamp;
        trackingHistory[newId].push(
            TrackingEvent({
                status: ProductStatus.Registered,
                location: _origin,
                note: "Product registered",
                updatedBy: msg.sender,
                updatedAt: block.timestamp
            })
        );

        emit ProductRegistered(newId, _productName, _origin, _qualityDocCID, msg.sender);

        return newId;
    }

    function getProduct(uint256 _id) external view returns (Product memory) {
        if (products[_id].registeredAt == 0) revert ProductNotFound(_id);
        return products[_id];
    }

    function getProductsByRegistrar(address _registrar) external view returns (uint256[] memory) {
        return registrarProducts[_registrar];
    }

    function getTrackingState(uint256 _id)
        external
        view
        returns (ProductStatus status, string memory location, uint256 updatedAt)
    {
        if (products[_id].registeredAt == 0) revert ProductNotFound(_id);
        return (currentStatuses[_id], currentLocations[_id], lastUpdatedAts[_id]);
    }

    function getTrackingHistory(uint256 _id) external view returns (TrackingEvent[] memory) {
        if (products[_id].registeredAt == 0) revert ProductNotFound(_id);
        return trackingHistory[_id];
    }

    function updateTracking(
        uint256 _id,
        ProductStatus _status,
        string calldata _location,
        string calldata _note
    ) external {
        Product memory p = products[_id];
        if (p.registeredAt == 0) revert ProductNotFound(_id);
        if (p.registrar != msg.sender) revert UnauthorizedUpdater(msg.sender, _id);
        if (bytes(_location).length == 0) revert EmptyLocation();

        currentStatuses[_id] = _status;
        currentLocations[_id] = _location;
        lastUpdatedAts[_id] = block.timestamp;
        trackingHistory[_id].push(
            TrackingEvent({
                status: _status,
                location: _location,
                note: _note,
                updatedBy: msg.sender,
                updatedAt: block.timestamp
            })
        );

        emit TrackingUpdated(_id, _status, _location, _note, msg.sender);
    }

    function verifyProduct(uint256 _id)
        external
        view
        returns (
            bool exists,
            string memory productName,
            string memory origin,
            string memory qualityDocCID,
            address registrar,
            uint256 registeredAt
        )
    {
        Product memory p = products[_id];
        if (p.registeredAt == 0) {
            return (false, "", "", "", address(0), 0);
        }
        return (true, p.productName, p.origin, p.qualityDocCID, p.registrar, p.registeredAt);
    }
}
