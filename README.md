# Blockchain Projects

A collection of smart contract projects built on Ethereum as a hands-on approach to learning Solidity, contract design patterns, and full-stack dApp development. Each project is deployed on the Sepolia testnet with a shared Next.js frontend.

This repository contains six projects spanning donations, governance, token creation, credential verification, supply chain tracking, and land ownership.

| # | Project | Description | Documentation |
|---|---------|-------------|---------------|
| 1 | Charity Donation Tracker | On-chain donation campaigns with transparent fund tracking | [docs/CHARITY.md](docs/CHARITY.md) |
| 2 | Voting System | Public and private governance polls using minimal proxy clones | [docs/VOTING.md](docs/VOTING.md) |
| 3 | Token Factory | Permissionless ERC-20 token deployment | [docs/TOKEN.md](docs/TOKEN.md) |
| 4 | Certificate Registry | Conference certificate issuance and verification via IPFS + blockchain | [docs/CERTIFICATE.md](docs/CERTIFICATE.md) |
| 5 | LogiTrack | Supply chain provenance ledger with shipment tracking and IPFS quality docs | [docs/LOGITRACK.md](docs/LOGITRACK.md) |
| 6 | LedgeLand Registry | Land ownership ledger with chain-of-custody history and deed verification | [docs/LEDGELAND.md](docs/LEDGELAND.md) |

---

## Repository Structure

```
blockchain-projects/
├── contracts/                # Foundry project (Solidity)
│   ├── src/
│   │   ├── charity/          # CharityDonationTracker.sol
│   │   ├── certificate/      # CertificateRegistry.sol
│   │   ├── token/            # TokenFactory.sol, TokenTemplate.sol
│   │   ├── voting/           # VotingFactory.sol, VotingPoll.sol
│   │   ├── logitrack/        # LogiTrack.sol
│   │   └── landregistry/     # LandRegistry.sol
│   ├── script/               # Deployment scripts
│   ├── test/                 # Forge tests
│   ├── lib/                  # Dependencies (forge-std, OpenZeppelin)
│   └── foundry.toml
├── frontend/                 # Next.js 16 application
│   ├── src/
│   │   ├── app/              # Pages (charity, certificate, token, voting, logitrack, ledgeland)
│   │   ├── components/       # UI components per project
│   │   └── lib/              # Contract ABIs, wagmi config
│   └── package.json
└── docs/                     # Per-project documentation
    ├── CHARITY.md
    ├── CERTIFICATE.md
    ├── TOKEN.md
    ├── VOTING.md
    ├── LOGITRACK.md
    └── LEDGELAND.md
```

## Tech Stack

**Smart Contracts**

- Solidity 0.8.33
- Foundry (Forge, Cast, Anvil)
- OpenZeppelin Contracts (ERC-20, access patterns)
- Sepolia Testnet

**Frontend**

- Next.js 16 with App Router
- React 19
- wagmi v3 + viem v2 (wallet and contract interaction)
- TanStack React Query
- Tailwind CSS v4

**External Services**

- Pinata (IPFS pinning for Certificate Registry, LogiTrack, and LedgeLand)
- SheetJS (client-side Excel parsing for LogiTrack and LedgeLand bulk imports)

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| CharityDonationTracker | `0x22Ae8dfbf5852D85E60Ac35f64Eda9a5555933E2` |
| VotingPoll (Implementation) | `0x526463800aa0faf45cdb3023294b72748e9d67ac` |
| VotingFactory | `0x79EeD8c357b433583d7BecFC21670CDf37D60138` |
| TokenFactory | `0x5389Eba86740c16e0f9C2897874b2c691Bfba7E9` |
| CertificateRegistry | `0xa0d7D1c52492DFB299F3366d1B96A5dAAeB20a61` |
| LogiTrack | `0x1D9Fa0aD3D9D05EfC49c39Ca336523603CfEa1bb` |
| LandRegistry | `0xf229700dCdF524945B9558f257bb1E2b726B7d93` |

All contracts can be verified and interacted with on [Sepolia Etherscan](https://sepolia.etherscan.io).

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- [Node.js](https://nodejs.org) v18 or later
- A browser wallet (MetaMask or similar) configured for Sepolia
- Sepolia ETH from a faucet

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Compile
forge build

# Run tests
forge test

# Run tests with verbose output
forge test -vvv
```

To deploy contracts, create a `.env` file inside `contracts/` with:

```
PRIVATE_KEY=<your_deployer_private_key>
SEPOLIA_RPC_URL=<your_sepolia_rpc_url>
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

Foundry does not auto-read `.env` files -- source it in the shell first, then run commands:

```bash
# Source .env to load PRIVATE_KEY, SEPOLIA_RPC_URL, and ETHERSCAN_API_KEY into the shell
source .env

# Deploy individual contracts
source .env && forge script script/DeployCharity.s.sol --rpc-url sepolia --broadcast --verify
source .env && forge script script/DeployCertificate.s.sol --rpc-url sepolia --broadcast --verify
source .env && forge script script/DeployToken.s.sol --rpc-url sepolia --broadcast --verify
source .env && forge script script/DeployLogistics.s.sol --rpc-url sepolia --broadcast --verify
source .env && forge script script/DeployLandRegistry.s.sol --rpc-url sepolia --broadcast --verify

# Deploy the full platform (all contracts)
source .env && forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:3000`. Connect your wallet to interact with the deployed contracts on Sepolia.

The Certificate Registry, LogiTrack, and LedgeLand require a Pinata account for IPFS uploads. Create a `frontend/.env.local` file:

```
PINATA_JWT=<your_pinata_jwt_token>
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

## Tests

Each project has its own test suite under `contracts/test/`:

| Test File | Tests | Covers |
|-----------|-------|--------|
| CharityDonationTracker.t.sol | 8 | Campaign creation, donations, withdrawals, access control |
| VotingPoll.t.sol | 8 | Poll lifecycle, voting, whitelisting, winner calculation |
| TokenFactory.t.sol | 8 | Token deployment, supply distribution, registry queries |
| CertificateRegistry.t.sol | 11 | Certificate issuance, sequential IDs, verification, access guards |
| LogiTrack.t.sol | 18 | Product registration, tracking updates, history, access control, events |
| LandRegistry.t.sol | 24 | Land registration, ownership transfers, location updates, deed verification, events |

**77 tests total, all passing.**

```bash
# Run all tests
forge test

# Run a specific test file
forge test --match-path test/LandRegistry.t.sol -vvv
```

## License

This project is for educational purposes. The smart contracts use the MIT license.
