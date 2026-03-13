# Voting System

A governance voting system composed of two contracts: a factory that deploys lightweight poll clones, and a poll contract that manages candidates, voter access, and vote tallying. Polls can be configured as public (anyone can vote) or private (whitelist-only).

## How It Works

1. A user creates a poll through the `VotingFactory`, specifying a title and access mode (public or private).
2. The factory deploys a minimal proxy clone of the `VotingPoll` implementation contract and initializes it.
3. The poll admin adds candidates, optionally whitelists voters (for private polls), and starts the voting period with a duration in minutes.
4. Eligible voters cast one vote each for their chosen candidate.
5. After voting ends, anyone can query the winner.

## Contract Details

### VotingFactory

**Contract:** `VotingFactory.sol`
**Network:** Sepolia Testnet
**Address:** `0x79EeD8c357b433583d7BecFC21670CDf37D60138`

Uses a custom ERC-1167 minimal proxy (Clones library) to deploy gas-efficient poll instances without pulling in external clone dependencies.

| Function | Access | Description |
|----------|--------|-------------|
| `createPoll(title, isPublic)` | Anyone | Deploys a new VotingPoll clone |
| `getDeployedPolls()` | View | Returns all deployed poll addresses |

| Event | Emitted When |
|-------|-------------|
| `PollCreated(pollAddress, admin, title)` | A new poll is deployed |

### VotingPoll

**Implementation Contract Address:** `0x526463800aa0faf45cdb3023294b72748e9d67ac`

Each poll clone is initialized once and managed by its admin (the creator).

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(admin, title, isPublic)` | Once | Sets up the poll (called by factory) |
| `addCandidate(name)` | Admin | Registers a candidate before voting starts |
| `whitelistVoter(voter)` | Admin | Grants voting permission (private polls) |
| `startVoting(durationInMinutes)` | Admin | Opens the voting period |
| `vote(candidateId)` | Eligible voters | Casts a vote for a candidate |
| `getWinner()` | View | Returns the candidate with the most votes |
| `getCandidate(candidateId)` | View | Returns candidate name and vote count |

**Voting Rules:**
- Each address can vote exactly once per poll.
- In private polls, only whitelisted addresses can vote.
- In public polls, any address can vote.
- Voting is only accepted during the active voting period.
- Candidates can only be added before voting starts.

| Event | Emitted When |
|-------|-------------|
| `CandidateAdded(candidateId, name)` | A candidate is registered |
| `VoterWhitelisted(voter)` | An address is added to the whitelist |
| `VotingStarted(endTime)` | The voting period begins |
| `VoteCast(voter, candidateId)` | A vote is recorded |

### Minimal Proxy Pattern

The `VotingFactory` uses ERC-1167 minimal proxies (clones) rather than deploying a full copy of `VotingPoll` each time. This significantly reduces deployment gas costs. The implementation contract is deployed once, and each new poll is a lightweight proxy that delegates all calls to it.

Because proxies share bytecode, each poll uses `initialize()` instead of a constructor for per-instance setup.

## Frontend

The voting module in the frontend provides:

- A poll listing page showing all deployed polls with public/private badges
- A poll detail page with the full voting interface
- Admin controls: add candidates, manage whitelist, start and end voting
- A modal form for creating new polls (title, access mode)

Routes:
- `/voting` -- poll registry and creation form
- `/voting/[address]` -- individual poll detail and voting interface

## Tests

Located in `contracts/test/VotingPoll.t.sol` with 8 test cases:

- Admin set correctly on initialization
- Candidate registration
- Voter whitelisting
- Voting period activation
- Vote casting and tally
- Double-vote prevention
- Non-whitelisted voter rejection
- Winner calculation

```bash
forge test --match-path test/VotingPoll.t.sol -vvv
```

## Deployment

The voting contracts are deployed as part of the platform deployment:

```bash
forge script script/DeployPlatform.s.sol --rpc-url sepolia --broadcast --verify
```

This deploys the `VotingPoll` implementation contract first, then deploys the `VotingFactory` with the implementation address as a constructor argument.
