# Stellar Pendle: Decentralized Yield Trading Protocol

Stellar Pendle is a sophisticated yield-trading protocol built on the **Stellar Soroban** network. It brings the concept of yield splitting to the Stellar ecosystem, allowing users to separate yield-bearing assets into **Principal Tokens (PT)** and **Yield Tokens (YT)**. This enables advanced financial strategies like fixed-yield locking, yield speculation, and liquidity provision. 

---

## 🏗 Architecture Overview

The system consists of three primary smart contracts interacting to provide a seamless yield-trading experience:

### 1. Yield Vault (Underlying Asset)
- **Role:** Simulates or manages the underlying yield-bearing asset (e.g., wrapped XLM).
- **Core Logic:** Provides a `view_rate` that represents the current yield accumulation. 
- **Contract ID:** `CD3IYDAQXIAA3ZPNDSHU6BDFN3RVI6DIWJXJS4ALZT6UCEMRR6GN6TKE`

### 2. Pendle Wrapper (Derivative Engine)
- **Role:** The core logic engine that manages the minting and burning of derivatives.
- **Key Functions:**
    - `mint_split`: Deposits underlying assets and issues equal amounts of PT and YT.
    - `redeem_pt`: Allows users to burn PT to reclaim the principal asset after the maturity timestamp.
    - `claim_yield`: Burn YT to harvest the accumulated profit (yield) since the last checkpoint.
    - `combine_and_redeem`: Allows for early exit by merging PT and YT back into the underlying asset.
- **Contract ID:** `CDTEVYD4LOV24UMVJNFMM2K7PKBPDPRTEWMLBGAFUXICD6UDFB4M4IFR`

### 3. Marketplace (Orderbook & Trading)
- **Role:** A peer-to-peer marketplace with automated matching for trading derivatives.
- **Key Functions:**
    - `list_pt` / `list_yt`: Sellers lock their tokens in the marketplace and specify availability.
    - `buy_market_pt` / `buy_market_yt`: Buyers can instantly purchase PT or YT using XLM.
- **Trading Dynamics:** 
    - PT usually trades at a discount (e.g., 0.95 XLM), reflecting the time value of money.
    - YT trades based on yield expectations (e.g., 0.05 XLM).
- **Contract ID:** `CBGKPNLESKNVWRHRAAOPABPZ2QLENAYKBUFOYJKUBDNIEKNAEZG5RHW6`

---

## 🛠 Tech Stack

### Smart Contracts (Rust/Soroban)
- Developed using the **Soroban SDK**.
- Implements custom token authorization (`require_auth`) and persistent storage management.
- Handles complex fixed-point math for yield calculations.

### Frontend (React/Vite)
- **Framework:** React with Vite for lightning-fast development.
- **Styling:** Custom CSS with a "Glassmorphism" aesthetic and neon accents.
- **Blockchain Interaction:** 
    - `@stellar/stellar-sdk` for transaction building and XDR handling.
    - `@stellar/freighter-api` for secure wallet integration and transaction signing.
- **Features:** Real-time rate polling, automated transaction simulation, and a developer utility suite.

---

## 🚀 Key Features

- **Yield Splitting:** Instantly turn your XLM into a fixed-income asset (PT) and a leverage-yield asset (YT).
- **Flexible Redemption:** Exit positions early by combining PT and YT, or wait for maturity to reclaim full principal.
- **P2P Marketplace:** Trade derivatives directly on-chain without centralized intermediaries.
- **Dynamic Yield Simulation:** The protocol includes a simulated yield rate that fluctuates, allowing for realistic testing of YT profit patterns.
- **Premium UI:** A high-end, dark-themed dashboard designed for professional traders.

---

## 🔧 Deployment & Configuration

### Contract Addresses (Testnet)

| Contract | Address |
|---|---|
| **Pendle Wrapper** | `CDTEVYD4LOV24UMVJNFMM2K7PKBPDPRTEWMLBGAFUXICD6UDFB4M4IFR` |
| **Yield Vault** | `CD3IYDAQXIAA3ZPNDSHU6BDFN3RVI6DIWJXJS4ALZT6UCEMRR6GN6TKE` |
| **Marketplace** | `CBGKPNLESKNVWRHRAAOPABPZ2QLENAYKBUFOYJKUBDNIEKNAEZG5RHW6` |

### Getting Started

1. **Install Dependencies:**
   ```bash
   cd client && pnpm install
   ```

2. **Run Development Server:**
   ```bash
   pnpm run dev
   ```

3. **Wallet Setup:**
   Ensure you have the **Freighter Wallet** extension installed and set to **Testnet**.

---

## 📈 Yield Mechanics

The protocol utilizes a simulated yield environment for demonstration:
- **Underlying Rate:** The Yield Vault maintains a `u64` rate.
- **PT Valuation:** Always redeems at 1:1 with the principal at maturity.
- **YT Valuation:** Claimable profit is calculated as:
  `profit = (YT_Balance * (Current_Rate - Entry_Rate)) / 1000`
- **Dynamic Yield:** Developers can use the building tools to adjust the yield rate and see the YT value update in real-time.

---

## 📂 Project Structure

```text
.
├── client/              # React Vite Frontend
│   ├── src/
│   │   ├── lib/stellar.js  # Smart contract interaction layer
│   │   ├── pages/         # Markets and Dashboard UIs
│   │   └── components/    # Reusable UI elements
├── contract_1/         # Soroban Smart Contracts
│   ├── pendlewrap/     # Main protocol logic
│   ├── orderbook/      # Marketplace logic
│   └── token/          # Token utilities
└── README.md
```
