# Charity Donation Tracker

A smart contract that enables transparent, on-chain donation campaigns. Campaign creators register a charity address, donors contribute ETH directly, and all transactions are permanently recorded on the blockchain. The charity can withdraw collected funds at any time.

## How It Works

1. Any user can create a campaign by providing a name and a charity wallet address.
2. Other users donate ETH to active campaigns. Each donation is recorded with the donor address, amount, and timestamp.
3. The designated charity address can withdraw the accumulated funds at any time.
4. The campaign creator can close the campaign to stop accepting new donations.

## Contract Details

**Contract:** `CharityDonationTracker.sol`
**Network:** Sepolia Testnet
**Address:** `0x22Ae8dfbf5852D85E60Ac35f64Eda9a5555933E2`

### Data Structures

```solidity
struct Campaign {
    uint256 id;
    string name;
    address charityAddress;
    address creator;
    uint256 totalDonated;
    bool active;
}

struct Donation {
    address donor;
    uint256 amount;
    uint256 timestamp;
}
```

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createCampaign(name, charityAddress)` | Anyone | Registers a new donation campaign |
| `donate(campaignId)` | Anyone | Sends ETH to an active campaign (payable) |
| `withdrawFunds(campaignId)` | Charity only | Transfers collected ETH to the charity address |
| `closeCampaign(campaignId)` | Creator only | Deactivates the campaign, preventing further donations |
| `getCampaign(campaignId)` | View | Returns campaign details |
| `getDonorContribution(campaignId, donor)` | View | Returns total donated by a specific address |
| `getCampaignDonation(campaignId, index)` | View | Returns a specific donation record |

### Events

| Event | Emitted When |
|-------|-------------|
| `CampaignCreated(campaignId, name, charityAddress)` | A new campaign is created |
| `DonationReceived(campaignId, donor, amount)` | A donation is made |
| `FundsWithdrawn(campaignId, charity, amount)` | The charity withdraws funds |
| `CampaignClosed(campaignId)` | A campaign is closed by its creator |

## Frontend

The charity module in the frontend provides:

- A campaign listing page showing all registered campaigns (newest first)
- A campaign detail page with the full donation ledger
- A modal form for creating new campaigns
- Donate functionality for any connected wallet
- Withdraw button visible only to the designated charity address

Routes:
- `/charity` -- campaign list and create form
- `/charity/[id]` -- individual campaign detail

## Tests

Located in `contracts/test/CharityDonationTracker.t.sol` with 10 test cases:

- Admin is set to deployer
- Campaign creation and field validation
- Single and multiple donations tracked correctly
- Fund withdrawal restricted to the charity address
- Donations blocked on closed campaigns
- Zero-value donations rejected

```bash
forge test --match-path test/CharityDonationTracker.t.sol -vvv
```

## Deployment

```bash
forge script script/DeployCharity.s.sol --rpc-url sepolia --broadcast --verify
```

Or as part of the full platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```
