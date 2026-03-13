# Certificate Registry (ConfCert-Web3)

A smart contract and IPFS-based system for issuing and verifying conference certificates. A coordinator uploads a certificate file to IPFS, then registers the student name and IPFS hash on-chain. Anyone with a certificate serial ID can verify its authenticity directly from the blockchain.

## How It Works

1. The coordinator selects a certificate file (image or PDF) and enters the student's name.
2. The file is uploaded to IPFS via Pinata. A content hash (CID) is returned.
3. The student name and CID are registered in the smart contract. The contract assigns a unique serial ID starting from 1001.
4. The coordinator shares the serial ID with the student.
5. Anyone (student, employer, auditor) can enter the serial ID to retrieve the verified record and view the original certificate on IPFS.

Because the CID is derived from the file's content, any tampering with the certificate would produce a different hash and fail to match the on-chain record.

## Contract Details

**Contract:** `CertificateRegistry.sol`
**Network:** Sepolia Testnet
**Address:** `0xa0d7D1c52492DFB299F3366d1B96A5dAAeB20a61`

### Data Structure

```solidity
struct Certificate {
    uint256 id;
    string studentName;
    string ipfsHash;
    address issuer;
    uint256 issuedAt;
}
```

Certificate IDs start at **1001** and increment with each issuance.

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `issueCertificate(studentName, ipfsHash)` | Anyone | Registers a certificate and returns its serial ID |
| `getCertificate(certId)` | View | Returns full certificate details |
| `getCertificatesByIssuer(issuer)` | View | Returns all serial IDs issued by an address |
| `verifyCertificate(certId)` | View | Returns existence flag plus all certificate fields |

### Events

| Event | Emitted When |
|-------|-------------|
| `CertificateIssued(certId, studentName, ipfsHash, issuer)` | A certificate is registered |

## IPFS Integration

Certificate files are pinned on IPFS via Pinata. The file is uploaded through a Next.js API route (`/api/pinata`) which keeps the Pinata JWT server-side. Once pinned, the IPFS CID is stored on-chain.

To read the certificate back, the frontend fetches it from the public Pinata gateway:

```
https://gateway.pinata.cloud/ipfs/<CID>
```

No Pinata account or credentials are needed to verify or view certificates -- only to issue them.

### Environment Setup

Create `frontend/.env.local`:

```
PINATA_JWT=<your_pinata_jwt>
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

## Frontend

Routes:
- `/certificate` -- registry listing with search-by-ID and "My Issued" filter
- `/certificate/[id]` -- verification page with on-chain record and IPFS file preview

Features:
- Search any certificate by serial ID directly from the list page
- Detail page shows verification status, issuer address, issue timestamp, and renders the certificate file
- Issue modal: file picker, IPFS upload step, then blockchain registration step
- "My Issued" tab filters to certificates issued by the connected wallet

## Tests

Located in `contracts/test/CertificateRegistry.t.sol` with 11 test cases:

- Admin is set to deployer
- `START_ID` constant is 1001
- Single certificate issuance and field validation
- Sequential ID assignment across multiple issuers
- Per-issuer certificate registry queries
- `verifyCertificate` returns correct data for valid ID
- `verifyCertificate` returns `exists=false` for unknown ID
- Empty student name rejected
- Empty IPFS hash rejected
- `getCertificate` reverts for non-existent ID
- `CertificateIssued` event emission

```bash
forge test --match-path test/CertificateRegistry.t.sol -vvv
```

## Deployment

```bash
forge script script/DeployCertificate.s.sol --rpc-url sepolia --broadcast --verify
```

Or as part of the full platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```

`CERTIFICATE_ADDRESS` in `frontend/src/lib/contracts.ts` is set to the deployed address.
