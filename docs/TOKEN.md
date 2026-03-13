# Token Factory

A permissionless ERC-20 token factory. Any user can deploy a new fixed-supply token through the factory contract. The factory maintains a registry of all deployed tokens, queryable by creator address.

## How It Works

1. A user calls `createToken` with a name, symbol, and initial supply.
2. The factory deploys a new `TokenTemplate` contract, minting the entire supply to the caller.
3. The new token address is recorded in the factory's registry.
4. The token is a standard ERC-20 with transfer, approval, and allowance functionality.

There is no minting after deployment. The total supply is fixed at creation time.

## Contract Details

### TokenFactory

**Contract:** `TokenFactory.sol`
**Network:** Sepolia Testnet
**Address:** `0x5389Eba86740c16e0f9C2897874b2c691Bfba7E9`

| Function | Access | Description |
|----------|--------|-------------|
| `createToken(name, symbol, initialSupply)` | Anyone | Deploys a new ERC-20 token and mints supply to caller |
| `getDeployedTokens()` | View | Returns all deployed token addresses |
| `getTokensByCreator(creator)` | View | Returns tokens deployed by a specific address |

| Event | Emitted When |
|-------|-------------|
| `TokenCreated(tokenAddress, creator, name, symbol, initialSupply)` | A new token is deployed |

### TokenTemplate

Each token deployed through the factory is an instance of `TokenTemplate`, which extends OpenZeppelin's ERC-20 implementation.

- The full supply is minted to the creator in the constructor.
- The creator address is stored as an immutable field.
- Standard ERC-20 interface: `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`, `totalSupply`.

No owner privileges, no minting functions, no burn functions. Once deployed, the token behaves as a plain fixed-supply ERC-20.

## Frontend

The token module in the frontend provides:

- A token listing page with a toggle between "All Tokens" and "My Tokens"
- A token detail page showing supply, creator, and transfer functionality
- A modal form for deploying new tokens (name, symbol, supply)

Routes:
- `/token` -- token registry and deployment form
- `/token/[address]` -- individual token detail

## Tests

Located in `contracts/test/TokenFactory.t.sol` with 8 test cases:

- Token creation and supply verification
- Full supply delivered to the creator
- Multiple tokens tracked in the registry
- Per-creator token queries
- Token count accuracy
- Standard ERC-20 transfers between accounts
- Multiple creators tracked independently
- `TokenCreated` event emission

```bash
forge test --match-path test/TokenFactory.t.sol -vvv
```

## Deployment

```bash
forge script script/DeployToken.s.sol --rpc-url sepolia --broadcast --verify
```

Or as part of the full platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```
