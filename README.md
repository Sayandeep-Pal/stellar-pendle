# Stellar Pendle: Cross-Chain Yield Trading Protocol

Stellar Pendle is a production-grade, cross-chain yield-trading protocol that bridges real-world yield from **Ethereum** (sUSDe/sDAI) onto the **Stellar Soroban** network. It allows users to separate yield-bearing assets into **Principal Tokens (PT)** and **Yield Tokens (YT)**, enabling advanced DeFi strategies like fixed-yield locking, leveraged yield speculation, and peer-to-peer yield trading — all without a centralized intermediary.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Contract Addresses](#contract-addresses)
3. [Cross-Chain Bridge](#cross-chain-bridge)
4. [Yield Oracle](#yield-oracle)
5. [Pendle Wrapper — Derivative Engine](#pendle-wrapper--derivative-engine)
6. [Marketplace — Orderbook](#marketplace--orderbook)
7. [Yield Mechanics](#yield-mechanics)
8. [Tech Stack](#tech-stack)
9. [Project Structure](#project-structure)
10. [Getting Started](#getting-started)
11. [Admin & Relayer](#admin--relayer)

---

## Architecture Overview

The protocol is composed of four tightly integrated smart contracts deployed on Stellar Soroban, backed by a Node.js relayer that connects to an EVM chain and a React/Vite frontend.

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVM Chain (Sepolia)                       │
│  ┌──────────────┐         locks/burns USDC                       │
│  │  EVM Vault   │  ◄─────────────────────────────────────────┐  │
│  │  (Solidity)  │  emits TokensLocked / unlockTokens event   │  │
│  └──────┬───────┘                                            │  │
│         │ TokensLocked event                                 │  │
└─────────┼───────────────────────────────────────────────────┼──┘
          │                                                    │
          ▼                                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js Relayer                              │
│  - Listens to EVM events                                         │
│  - Calls bridge.mint() on Soroban                                │
│  - Fetches live sUSDe yield index from mainnet                   │
│  - Pushes yield index to Bridge Oracle every hour                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stellar Soroban Mainnet                        │
│                                                                   │
│  ┌───────────────┐   mints/burns   ┌──────────────────────────┐ │
│  │ Bridge Oracle │ ──────────────► │  stsUSDe Token (SAC)     │ │
│  │  (Rust)       │                 │  (Stellar Asset Contract) │ │
│  │               │  get_yield_     └────────────┬─────────────┘ │
│  │ update_yield_ │  index()                     │ deposit /     │
│  │ index()       │ ◄────────────────────────────┤ withdraw      │
│  └───────────────┘                              ▼               │
│                               ┌─────────────────────────────┐   │
│                               │   Pendle Wrapper             │   │
│                               │   mint_split / redeem_pt     │   │
│                               │   claim_yield / combine      │   │
│                               └───────────────┬─────────────┘   │
│                                               │ PT / YT          │
│                                               ▼                  │
│                               ┌─────────────────────────────┐   │
│                               │   Marketplace (Orderbook)    │   │
│                               │   list_pt / list_yt          │   │
│                               │   buy_market_pt / buy_mkt_yt │   │
│                               └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contract Addresses

### Mainnet (Stellar Mainnet — Public Network)

| Contract | Address |
|---|---|
| **Bridge Contract / Yield Oracle** | `CDNOZGG2ZT6J2ZBI6AVX3JLNSOSPMLCB6AFR7E4YOLPBRK3J3JYM33WW` |
| **stsUSDe Token Contract (SAC)** | `CDO7QZPI2OYXEAD2KMKMJ3744DMUYGSUQSRUFEVDYSDXCGDFGI2CMHY4` |
| **OrderBook Contract** | `CDHHGWGBGT6APB3CDODQJPGUXLYPIU34VV6PBT7SRRHBY3KEWYJVOQHS` |
| **PendleWrapper Contract** | `CA4B534BCYQQ2D6S46XEC4WGGL2J5M7347XABEXAG4SU4I4QULJPCMQT` |

### Testnet (Stellar Testnet — for development)

| Contract | Address |
|---|---|
| **Bridge Contract / Yield Oracle** | `CDN7OWS4YXICY3PULMLRFDC3URCAW233FMXXMSRCEIOV7WYP7SROK3UZ` |
| **Pendle Wrapper** | `CDTEVYD4LOV24UMVJNFMM2K7PKBPDPRTEWMLBGAFUXICD6UDFB4M4IFR` |
| **Marketplace / OrderBook** | `CBGKPNLESKNVWRHRAAOPABPZ2QLENAYKBUFOYJKUBDNIEKNAEZG5RHW6` |

### EVM (Sepolia Testnet)

| Contract | Address |
|---|---|
| **EVM Vault (deposit/withdraw)** | `0x0F1cE319fA97F2d8f06661C86696C5417601EF13` |
| **sUSDe (yield source, mainnet)** | `0x83f20f44975d03b1b09e64809b757c47f942beea` |

---

## Cross-Chain Bridge

The bridge enables a trust-minimized peg between EVM USDC and Stellar stsUSDe tokens.

### Deposit Flow (EVM → Stellar)

1. User calls the EVM Vault's `lockTokens()`, depositing ERC-20 USDC.
2. The Vault emits a `TokensLocked(evmSender, stellarDestination, amount, nonce)` event.
3. The Node.js Relayer detects this event, waits for block finality (2 confirmations), and converts the amount from EVM 18-decimal to Soroban 7-decimal format (`amount × 10`).
4. The Relayer calls `mint(to, amount, evm_tx_hash)` on the Soroban Bridge Contract.
5. The Bridge Contract verifies relayer authorization and checks `Processed(evm_tx_hash)` to prevent replay attacks, then mints stsUSDe tokens 1:1 to the destination Stellar address.

### Withdrawal Flow (Stellar → EVM)

1. User calls `withdraw(from, amount, evm_dest)` on the Bridge Contract, authorizing a burn of their stsUSDe tokens.
2. The Bridge Contract burns the tokens and emits a Soroban `withdraw` event containing the EVM destination address and amount.
3. The Relayer polls for these events every 5 seconds (with a polling lock to prevent double-processing) and converts the amount back to EVM 6-decimal format (`amount ÷ 10`).
4. The Relayer calls `unlockTokens(evmAddress, amount, sorobanTxHash)` on the EVM Vault, releasing native USDC to the user's EVM wallet.

### Security Model

- **Replay protection:** Each EVM transaction hash is stored in `Processed(BytesN<32>)` persistent storage on-chain; duplicate mints are rejected with a panic.
- **Relayer authorization:** The `mint` and `update_yield_index` functions require `relayer.require_auth()`, preventing unauthorized calls.
- **Polling lock:** The Relayer uses an `isPolling` guard and a `seenHashes` in-memory set to ensure each event is processed exactly once per session.

---

## Yield Oracle

The Yield Oracle is the mechanism that imports real-world yield data from Ethereum Mainnet into the Soroban Bridge Contract, making it available to the Pendle Wrapper for yield calculations.

### How It Works

1. The Node.js Relayer connects to **Ethereum Mainnet** via an RPC provider.
2. Every hour, it calls `convertToAssets(1e18)` on the live **sUSDe ERC-4626 contract** (`0x83f20f44975d03b1b09e64809b757c47f942beea`), which returns how many underlying assets 1 share is worth — the yield index.
3. The index is converted from 18-decimal precision to Soroban's 7-decimal format by dividing by `100_000_000_000`.
4. The Relayer calls `update_yield_index(index)` on the Bridge Contract, which requires relayer auth, stores the index in instance storage, and extends the TTL.
5. The Pendle Wrapper reads this index by calling `get_yield_index()` on the Bridge Contract during `mint_split` and `claim_yield`.

### Index Scalar

The protocol uses an `INDEX_SCALAR` of `10_000_000` (representing 1.0000000 in 7-decimal fixed-point). An index of `10_500_000` represents a 5% yield accumulation since inception.

---

## Pendle Wrapper — Derivative Engine

**Contract:** `CA4B534BCYQQ2D6S46XEC4WGGL2J5M7347XABEXAG4SU4I4QULJPCMQT` (mainnet)

The Pendle Wrapper is the core DeFi logic of the protocol. It mints two derivative tokens from a single deposit of stsUSDe and manages their lifecycle through maturity.

### Core Functions

#### `initialize(env, stusdc_address, maturity_timestamp, oracle_address)`
One-time setup. Stores the stsUSDe token address, the Unix maturity timestamp, and the Bridge Oracle address in persistent storage.

#### `mint_split(env, user, amount)`
The primary entry point for users.
1. Requires `user.require_auth()`.
2. Transfers `amount` of stsUSDe from the user into the wrapper contract as collateral.
3. Reads the **current yield index** from the Bridge Oracle via a cross-contract call to `get_yield_index()`.
4. Snapshots this index as the user's `UserEntryIndex` — the baseline from which future yield is measured.
5. Credits the user with `amount` of PT and `amount` of YT (1:1 with their deposit).
6. Updates global `TotalPT` and `TotalYT` supply counters.

#### `redeem_pt(env, user, amount_pt)`
Post-maturity principal redemption.
- Panics if `ledger.timestamp() < maturity`. Users must wait.
- Burns `amount_pt` of PT from the user's balance.
- Returns `amount_pt` of stsUSDe to the user (1:1 principal recovery).

#### `claim_yield(env, user)`
Harvest accumulated yield at any time before or after maturity.
- Reads `current_index` from the Bridge Oracle.
- Reads the user's stored `UserEntryIndex`.
- Calculates profit using the formula:
  ```
  profit = (yt_balance × (current_index − entry_index)) / INDEX_SCALAR
  ```
- Burns **all** of the user's YT balance.
- Transfers the calculated `profit` in stsUSDe to the user.
- Emits a `yield_pay` event.
- Panics if `rate_gain <= 0` (no new yield has accumulated).

#### `combine_and_redeem(env, user, amount)`
Early exit mechanism. Requires the user to hold equal amounts of both PT and YT.
- Burns `amount` of both PT and YT simultaneously.
- Returns `amount` of stsUSDe to the user (1:1 early redemption, no yield captured).
- Decrements both global supply counters.

#### `transfer_pt / transfer_yt`
Internal transfer functions used by the Marketplace to move tokens to/from escrow. Both require `from.require_auth()`.

### View Functions

| Function | Returns |
|---|---|
| `get_pt_balance(user)` | User's current PT balance |
| `get_yt_balance(user)` | User's current YT balance |
| `get_total_pt_supply()` | Global PT supply across all users |
| `get_total_yt_supply()` | Global YT supply across all users |

---

## Marketplace — Orderbook

**Contract:** `CDHHGWGBGT6APB3CDODQJPGUXLYPIU34VV6PBT7SRRHBY3KEWYJVOQHS` (mainnet)

The Marketplace is a non-custodial, peer-to-peer orderbook with automated best-price matching. It uses USDC as the settlement currency.

### Pricing Model

| Token | Price per Unit |
|---|---|
| **PT** | **0.97 USDC** — trades at a discount reflecting time value of money |
| **YT** | **0.03 USDC** — priced as the speculative yield component |

(PT price + YT price = 1.00 USDC, preserving no-arbitrage parity with the underlying stsUSDe.)

### Seller Flow

#### `list_pt(env, seller, amount)`
1. Requires `seller.require_auth()`.
2. Calls `transfer_pt` on the Pendle Wrapper to move the seller's PT into the Marketplace escrow.
3. Records the listing amount under `SellOrderPT(seller)` in persistent storage.
4. Appends the seller address to the `SellersListPT` instance-level list if not already present (for auto-matching).

#### `list_yt(env, seller, amount)`
Same flow as `list_pt` but for YT tokens using `SellOrderYT` and `SellersListYT`.

### Buyer Flow

#### `buy_market_pt(env, buyer, amount_needed)`
1. Requires `buyer.require_auth()`.
2. Iterates through the `SellersListPT` in order, filling from each seller until `amount_needed` is fully satisfied.
3. For each seller fill:
   - Transfers `cost = (take_amount × 97) / 100` USDC from buyer directly to seller.
   - Transfers `take_amount` PT from Marketplace escrow to buyer via `transfer_pt` on the Wrapper.
4. Panics if total market depth is insufficient: `"Not enough PT available for sale in the entire market!"`.

#### `buy_market_yt(env, buyer, amount_needed)`
Same flow but at `cost = (take_amount × 3) / 100` USDC per unit of YT.

### View Functions

| Function | Returns |
|---|---|
| `get_pt_listing(seller)` | PT currently listed for sale by a seller |
| `get_yt_listing(seller)` | YT currently listed for sale by a seller |

---

## Yield Mechanics

The yield system is anchored to the real **sUSDe ERC-4626 yield index** from Ethereum Mainnet, relayed hourly by the Oracle Relayer.

### Fixed-Point Representation

All yield index values use **7-decimal fixed-point arithmetic**:
- `10_000_000` = index value of 1.0000000 (protocol inception baseline)
- `10_500_000` = index value of 1.0500000 (5% cumulative yield since inception)
- `11_234_877` = example live mainnet value (~12.35% yield)

### Profit Calculation

When a user calls `claim_yield`:

$$\text{profit} = \frac{\text{YT Balance} \times (\text{current\_index} - \text{entry\_index})}{10{,}000{,}000}$$

**Example:**
- User deposits 100 stsUSDe at index `10_000_000`.
- Oracle pushes new index `10_500_000` (5% gain).
- `profit = (100 × 500_000) / 10_000_000 = 5 stsUSDe`
- All 100 YT are burned; user receives 5 stsUSDe as yield.

### Token Value Intuition

| Token | Value at Maturity | Value Before Maturity |
|---|---|---|
| **PT** | 1:1 with principal (stsUSDe) | Trades at discount (~0.97 USDC) |
| **YT** | No principal value | Claimable yield since entry index |

---

## Tech Stack

### Smart Contracts

| Layer | Technology |
|---|---|
| Language | Rust (`#![no_std]`) |
| Framework | Soroban SDK |
| Compilation Target | `wasm32v1-none` |
| Storage | Instance (ephemeral globals) + Persistent (per-user state) |
| Authorization | `require_auth()` on all state-mutating calls |
| Token Standard | Stellar Asset Contract (SAC) via `token::Client` and `StellarAssetClient` |
| Cross-contract Calls | `env.invoke_contract()` for yield index fetch |
| Events | `env.events().publish()` for bridge and yield payout tracking |

### Relayer (Node.js)

| Component | Details |
|---|---|
| Runtime | Node.js |
| EVM Connectivity | `ethers.js` v6 |
| Soroban Connectivity | `@stellar/stellar-sdk` |
| Bridge listener | Event-driven via `vaultContract.on("TokensLocked", ...)` |
| Withdrawal watcher | Polling loop every 5 seconds via `sorobanServer.getEvents()` |
| Yield Oracle | Polling loop every 1 hour via `setInterval` |
| Security | `dotenv` for secrets; in-memory `seenHashes` for deduplication |

### Frontend (React/Vite)

| Component | Details |
|---|---|
| Framework | React 18 + Vite |
| Wallet | Freighter API (`@stellar/freighter-api`) — supports v5 & v6 |
| Chain SDK | `@stellar/stellar-sdk` — XDR building, simulation, submission |
| Styling | Custom CSS — Glassmorphism dark theme, neon accents |
| Transaction flow | Simulate → Prepare → Sign (Freighter) → Send → Poll confirmation |
| Read-only calls | `simulateTransaction` via a static demo address (no wallet required for views) |

---

## Project Structure

```
stellar-pendle/
├── client/                          # React/Vite user-facing frontend
│   └── src/
│       ├── lib/
│       │   ├── stellar.js           # Low-level contract read helpers (simulate only)
│       │   └── stellar-wrapper.js   # Write transaction helpers (sign + send via Freighter)
│       ├── pages/
│       │   ├── LandingPage.jsx      # Protocol introduction
│       │   ├── MarketsPage.jsx      # PT/YT market overview and rates
│       │   ├── MarketplacePage.jsx  # Buy/sell PT and YT
│       │   ├── TradePage.jsx        # Mint split, redeem PT, claim yield, combine
│       │   ├── VaultPage.jsx        # Bridge deposit/withdraw (EVM ↔ Stellar)
│       │   └── AdminPage.jsx        # Dev utilities (rate adjustment, etc.)
│       └── components/
│           ├── Navbar.jsx           # Navigation
│           ├── TradeModal.jsx       # Trade confirmation UX
│           ├── TransactionModal.jsx # Transaction status modal
│           └── ReturnToggle.jsx     # PT / YT return mode selector
│
├── contract_2/                      # Soroban smart contracts (Rust)
│   ├── bridgeContract/              # Bridge Oracle + stsUSDe minter/burner
│   │   └── contracts/hello-world/src/lib.rs
│   ├── pendleWrapper/               # Derivative engine (PT/YT lifecycle)
│   │   └── contracts/hello-world/src/lib.rs
│   └── orderBook/                   # P2P marketplace with auto-matching
│       └── contracts/hello-world/src/lib.rs
│
├── token/                           # Custom Soroban token utility (SAC helpers)
│   └── src/
│       ├── contract.rs
│       ├── balance.rs
│       ├── allowance.rs
│       ├── admin.rs
│       ├── metadata.rs
│       └── storage_types.rs
│
├── admin/
│   ├── relayer/                     # Node.js cross-chain relayer + yield oracle
│   │   ├── relayer.js               # Main relayer: bridge listener + oracle pusher
│   │   └── seed_amm.js              # Utility to bootstrap AMM liquidity
│   └── bridge-frontend/             # Admin UI for bridge operations (React/Vite)
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Rust + `wasm32v1-none` target (`rustup target add wasm32v1-none`)
- Stellar CLI (`cargo install --locked stellar-cli`)
- [Freighter Wallet](https://www.freighter.app/) browser extension

### Running the Frontend

```bash
cd client
pnpm install
pnpm run dev
```

Open `http://localhost:5173` and connect your Freighter wallet. Switch Freighter to **Mainnet** (Public Network) to interact with the deployed contracts.

### Running the Relayer

```bash
cd admin/relayer
npm install
```

Create a `.env` file:

```env
RPC_URL=<your_sepolia_rpc_url>
RELAYER_SECRET_KEY=<your_stellar_relayer_secret>
PRIVATE_KEY=<your_evm_relayer_private_key>
```

```bash
node relayer.js
```

The relayer will:
- Start listening for `TokensLocked` events on the EVM vault.
- Start polling Soroban for `withdraw` events every 5 seconds.
- Immediately fetch and push the live sUSDe yield index, then repeat every hour.

### Building Contracts

Each contract directory contains a `Makefile`:

```bash
cd contract_2/pendleWrapper
make build
# Output: target/wasm32v1-none/release/*.wasm
```

To deploy (requires Stellar CLI and funded account):

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source <your_secret_key> \
  --network mainnet
```

---

## Admin & Relayer

### Bridge Frontend (`admin/bridge-frontend`)

A minimal React/Vite admin dashboard for monitoring bridge operations, manually triggering mints/burns, and viewing the current yield index on-chain.

```bash
cd admin/bridge-frontend
npm install
npm run dev
```

---

## Security Considerations

- **Relayer Trust:** The bridge relies on a centralized relayer for cross-chain message passing. A compromised relayer key could mint unbacked tokens. A future upgrade path involves a multi-sig or decentralized oracle network.
- **Maturity Enforcement:** `redeem_pt` is gated by `ledger.timestamp() < maturity`, enforced entirely on-chain — no off-chain component can bypass this.
- **Yield Manipulation:** `update_yield_index` requires `relayer.require_auth()`, preventing arbitrary users from inflating the yield index and draining the vault.
- **Re-entrancy:** Soroban's execution model does not support re-entrancy by design; cross-contract calls are synchronous and stack-based.
- **Replay Attacks:** Each EVM transaction hash is permanently recorded in contract storage; the Bridge Contract panics on duplicate `mint` calls.
