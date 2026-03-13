# LogiTrack (Supply Chain Provenance)

A decentralized supply chain provenance ledger. Coordinators register products with IPFS-pinned quality documents and track shipments through their lifecycle. Anyone can verify a product's authenticity and trace its full journey on-chain.

## How It Works

1. A coordinator registers a product by providing a name, origin location, and an IPFS CID pointing to a quality document.
2. The contract assigns a sequential ID starting from 2001 and records the initial tracking state at the origin.
3. The coordinator updates the shipment status and location as the product moves through the supply chain. Each update is appended to an immutable tracking history.
4. Anyone can look up a product by ID to verify its origin, quality document, current status, and full tracking timeline.

Because the quality document CID is content-addressed on IPFS, any tampering with the file would produce a different hash and fail to match the on-chain record.

## Contract Details

**Contract:** `LogiTrack.sol`
**Network:** Sepolia Testnet
**Address:** `0x1D9Fa0aD3D9D05EfC49c39Ca336523603CfEa1bb`

### Data Structures

```solidity
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
```

Product IDs start at **2001** and increment with each registration.

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerProduct(name, origin, qualityDocCID)` | Anyone | Registers a product and returns its ID |
| `getProduct(id)` | View | Returns product details |
| `getProductsByRegistrar(registrar)` | View | Returns all product IDs registered by an address |
| `getTrackingState(id)` | View | Returns current status, location, and last update time |
| `getTrackingHistory(id)` | View | Returns the full array of tracking events |
| `updateTracking(id, status, location, note)` | Registrar only | Appends a tracking event and updates current state |
| `verifyProduct(id)` | View | Returns existence flag plus all product fields |

### Events

| Event | Emitted When |
|-------|-------------|
| `ProductRegistered(id, productName, origin, qualityDocCID, registrar)` | A product is registered |
| `TrackingUpdated(id, status, location, note, updatedBy)` | A tracking update is recorded |

### Access Control

- Any address can register a product (becoming its registrar).
- Only the registrar of a product can call `updateTracking` for that product.

## IPFS Integration

Quality documents are pinned on IPFS via Pinata. The frontend uploads files through a shared Next.js API route (`/api/pinata`) that keeps the Pinata JWT server-side. The returned CID is stored on-chain during product registration.

To verify a quality document, the frontend fetches it from the Pinata gateway and confirms the CID matches the on-chain record (content-addressed integrity).

## Excel Bulk Import

The frontend supports bulk product registration from Excel files (`.xlsx`, `.xls`, `.csv`) using SheetJS. The spreadsheet must contain columns:

| Column | Required | Description |
|--------|----------|-------------|
| ProductName | Yes | Name of the product |
| Origin | Yes | Origin location |
| QualityDocCID | Yes | IPFS CID of the quality document |

Each row is submitted as a separate `registerProduct` transaction.

## Frontend

Routes:
- `/logitrack` -- product registry with search, All/My Products tabs, and bulk import
- `/logitrack/[id]` -- product detail with tracking timeline, status updates, and IPFS verification

Features:
- Product cards showing name, origin, status badge, and registrar address
- Full tracking timeline on the detail page with status, location, and notes
- Registrar-only controls: tracking update form (status dropdown, location, note)
- Bulk import modal for Excel file parsing
- IPFS integrity check via HEAD request to Pinata gateway
- "View on Etherscan" link for on-chain verification

## Tests

Located in `contracts/test/LogiTrack.t.sol` with 18 test cases:

- START_ID is 2001
- Single and sequential product registration
- Product field validation (empty name, origin, CID rejected)
- Per-registrar product queries
- Product verification (exists/not found)
- Initial tracking state uses origin location
- Tracking updates (status, location, note)
- Tracking history grows with registration + updates
- Only registrar can update tracking
- Empty location rejected on update
- Non-existent product reverts
- `ProductRegistered` and `TrackingUpdated` event emission

```bash
forge test --match-path test/LogiTrack.t.sol -vvv
```

## Deployment

```bash
forge script script/DeployLogistics.s.sol --rpc-url sepolia --broadcast --verify
```

Or as part of the full platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```
