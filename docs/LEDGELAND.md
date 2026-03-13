# LedgeLand Registry (Land Ownership Ledger)

An immutable land ownership ledger with chain-of-custody history and IPFS deed verification. A designated registrar (the deployer) manages all land records -- registering properties, transferring ownership, and updating locations. Every change is permanently recorded on-chain with a full audit trail.

## How It Works

1. The registrar registers a land parcel by providing a Land ID (from an external source such as an Excel cadastral sheet), a location description, the owner's wallet address, and an IPFS CID pointing to the deed document.
2. When ownership changes, the registrar transfers the land to a new owner. The transfer is appended to an immutable chain-of-custody history. A new deed CID can optionally replace the existing one.
3. The registrar can update the location description (e.g., correcting an address or rezoning) with an event trail.
4. Anyone can look up a land record by ID, view the full ownership history, or verify a deed CID against the on-chain record.

Because deed CIDs are content-addressed on IPFS, any tampering with the document would produce a different hash and fail the on-chain verification.

## Contract Details

**Contract:** `LandRegistry.sol`
**Network:** Sepolia Testnet
**Address:** `0xf229700dCdF524945B9558f257bb1E2b726B7d93`

### Data Structures

```solidity
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
```

Land IDs are user-provided (not auto-incremented), allowing integration with external cadastral databases.

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerLand(landId, location, owner, deedCID)` | Registrar only | Registers a new land parcel |
| `transferOwnership(landId, newOwner, newDeedCID, note)` | Registrar only | Transfers ownership, optionally updating the deed CID |
| `updateLocation(landId, newLocation)` | Registrar only | Updates the location description |
| `getLand(landId)` | View | Returns the full land record |
| `getOwnershipHistory(landId)` | View | Returns the chain-of-custody entries |
| `getLandsByOwner(owner)` | View | Returns all land IDs owned by an address |
| `verifyDeed(landId, cid)` | View | Returns true if the CID matches the on-chain deed hash |
| `registrar()` | View | Returns the registrar (deployer) address |
| `landCount()` | View | Returns total number of registered parcels |

### Events

| Event | Emitted When |
|-------|-------------|
| `LandRegistered(landId, location, owner, deedCID)` | A land parcel is registered |
| `OwnershipTransferred(landId, previousOwner, newOwner, deedCID, note)` | Ownership is transferred |
| `LocationUpdated(landId, oldLocation, newLocation)` | A location description is changed |

### Access Control

All write operations (`registerLand`, `transferOwnership`, `updateLocation`) are restricted to the registrar -- the address that deployed the contract. This models a centralized land authority while keeping the ledger transparent and immutable.

### Custom Errors

| Error | Condition |
|-------|-----------|
| `OnlyRegistrar()` | Non-registrar attempts a write operation |
| `LandAlreadyExists(landId)` | Duplicate registration of the same Land ID |
| `LandNotFound(landId)` | Operation on an unregistered Land ID |
| `EmptyLocation()` | Empty location string |
| `EmptyDeedCID()` | Empty deed CID on registration |
| `InvalidOwner()` | Zero address provided as owner |
| `SameOwner()` | Transfer to the current owner |

## IPFS Integration

Deed documents are pinned on IPFS via Pinata. The frontend uploads files through a shared Next.js API route (`/api/pinata`) that keeps the Pinata JWT server-side. The returned CID is stored on-chain during registration or transfer.

Deed verification uses `keccak256` comparison of the on-chain CID with a provided CID. On the frontend, the detail page also makes a HEAD request to the Pinata gateway to confirm the file is still retrievable.

## Excel Bulk Import

The frontend supports bulk land registration from Excel files (`.xlsx`, `.xls`, `.csv`) using SheetJS. The spreadsheet must contain columns:

| Column | Required | Description |
|--------|----------|-------------|
| LandID | Yes | Numeric land parcel identifier |
| Location | Yes | Location description |
| OwnerAddress | Yes | Ethereum address of the owner |
| DeedCID | Yes | IPFS CID of the deed document |

Each row is submitted as a separate `registerLand` transaction.

## Frontend

Routes:
- `/ledgeland` -- land registry with search, All Properties / My Properties tabs
- `/ledgeland/[id]` -- land record detail with chain-of-custody timeline

Features:
- Land record cards showing ID, location, owner, and deed CID
- Full chain-of-custody timeline on the detail page with owner, deed CID, timestamp, and transfer notes
- Registrar-only controls: Register Land button, Bulk Import button, Transfer Ownership, Edit Location
- Deed integrity check via HEAD request to IPFS gateway
- Single registration modal with manual or file-upload CID entry
- Transfer modal with optional new deed CID (none, manual entry, or file upload)

## Tests

Located in `contracts/test/LandRegistry.t.sol` with 24 test cases:

- Registrar is set to deployer
- Single and multiple land registration
- Duplicate registration reverts
- Only registrar can register, transfer, and update location
- Empty location, empty deed CID, and zero-address owner rejected
- Ownership transfer with and without new deed CID
- Transfer to same owner reverts
- Transfer of non-existent land reverts
- Ownership history grows with registration + transfers
- Location update success and validation
- `getLandsByOwner` returns correct IDs per owner
- `verifyDeed` match and mismatch
- `getLand` reverts for non-existent ID
- `LandRegistered`, `OwnershipTransferred`, and `LocationUpdated` event emission

```bash
forge test --match-path test/LandRegistry.t.sol -vvv
```

## Deployment

```bash
forge script script/DeployLandRegistry.s.sol --rpc-url sepolia --broadcast --verify
```

Or as part of the full platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```

`LAND_REGISTRY_ADDRESS` in `frontend/src/lib/contracts.ts` must match the deployed address.
