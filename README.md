# Blockchain Projects

A collection of smart contract projects built on Ethereum as a hands-on approach to learning Solidity, contract design patterns, and full-stack dApp development. Each project is deployed on the Sepolia testnet with a shared Next.js frontend.

This repository currently contains three projects. More will be added over time.

| Project | Description | Documentation |
|---------|-------------|---------------|
| Charity Donation Tracker | On-chain donation campaigns with transparent fund tracking | [docs/CHARITY.md](docs/CHARITY.md) |
| Token Factory | Permissionless ERC-20 token deployment | [docs/TOKEN.md](docs/TOKEN.md) |
| Voting System | Public and private governance polls using minimal proxy clones | [docs/VOTING.md](docs/VOTING.md) |

---

## Repository Structure

```
blockchain-projects/
├── contracts/                # Foundry project (Solidity)
│   ├── src/
│   │   ├── charity/          # CharityDonationTracker.sol
│   │   ├── token/            # TokenFactory.sol, TokenTemplate.sol
│   │   └── voting/           # VotingFactory.sol, VotingPoll.sol
│   ├── script/               # Deployment scripts
│   ├── test/                 # Forge tests
│   ├── lib/                  # Dependencies (forge-std, OpenZeppelin)
│   └── foundry.toml
├── frontend/                 # Next.js 16 application
│   ├── src/
│   │   ├── app/              # Pages (charity, token, voting)
│   │   ├── components/       # UI components per project
│   │   └── lib/              # Contract ABIs, wagmi config
│   └── package.json
└── docs/                     # Per-project documentation
    ├── CHARITY.md
    ├── TOKEN.md
    └── VOTING.md
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

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| CharityDonationTracker | `0x22Ae8dfbf5852D85E60Ac35f64Eda9a5555933E2` |
| VotingPoll (Implementation) | `0x526463800aa0faf45cdb3023294b72748e9d67ac` |
| VotingFactory | `0x79EeD8c357b433583d7BecFC21670CDf37D60138` |
| TokenFactory | `0x5389Eba86740c16e0f9C2897874b2c691Bfba7E9` |

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

Then run the deployment scripts:

```bash
# Deploy individual contracts
forge script script/DeployCharity.s.sol --rpc-url sepolia --broadcast --verify

# Deploy the full platform (Charity + Voting + Token)
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify

# Deploy only the Token Factory
forge script script/DeployToken.s.sol --rpc-url sepolia --broadcast --verify
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

## Tests

Each project has its own test suite under `contracts/test/`:

| Test File | Tests | Covers |
|-----------|-------|--------|
| CharityDonationTracker.t.sol | 10 | Campaign creation, donations, withdrawals, access control |
| TokenFactory.t.sol | 8 | Token deployment, supply distribution, registry queries |
| VotingPoll.t.sol | 8 | Poll lifecycle, voting, whitelisting, winner calculation |

```bash
# Run all tests
forge test

# Run a specific test file
forge test --match-path test/CharityDonationTracker.t.sol -vvv
```

## License

This project is for educational purposes. The smart contracts use the MIT license.
