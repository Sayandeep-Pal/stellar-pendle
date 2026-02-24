
// ============================================================
// SPIELD PROTOCOL — AMM LIQUIDITY SEEDER (add to relayer)
// ============================================================
//
// This module handles the admin flow of:
//   1. Receiving minted STSUSDE in treasury wallet
//   2. Calling mint_split on the splitter to get PT + YT
//   3. Approving AMM contract to spend PT, YT, USDC
//   4. Adding initial liquidity to PT/USDC and YT/USDC pools
//
// Add these constants and functions to your existing relayer.js

const {
  Keypair, Contract, rpc, Networks, TransactionBuilder,
  BASE_FEE, Address, nativeToScVal, xdr, scValToNative
} = require("@stellar/stellar-sdk");
require("dotenv").config();

// ─────────────────────────────────────────────
// CONTRACT ADDRESSES — fill these in at deploy time
// ─────────────────────────────────────────────

const SPLITTER_CONTRACT_ID = "CAWX3TFZ4A4I5USKIIQFJ4JX7AM5JL53R2ETWHKDWUKVSHICWDRZEZRL"; // your existing splitter
const STSUSDE_TOKEN_ID    = "CABXOOSNVKM4X3IV34VBPIYWLIUSDWQM2TCZ7RMBKTYVEJNJTAB63EJV";  // ← fill after deploy
const PT_TOKEN_ID         = "CCOR4BLV76LB2KGFPV255MJ5ZZMQTJAF23JRU34I55AAT3AP76KDPNMN";        // ← fill after deploy  
const YT_TOKEN_ID         = "CAWX3TFZ4A4I5USKIIQFJ4JX7AM5JL53R2ETWHKDWUKVSHICWDRZEZRL";        // ← fill after deploy
const AMM_CONTRACT_ID     = "CCRN4JF3X3A2IO3N7GF5ANA3KSSRQ6Q2MXZM24ADTXSVYNPHHZVE5DRX";             // ← fill after deploy
const USDC_TOKEN_ID       = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"; // Stellar USDC

// The treasury wallet that receives minted STSUSDE from the bridge
// This is the same wallet as the relayer (or a separate admin wallet)
const TREASURY_KEYPAIR = Keypair.fromSecret(process.env.RELAYER_SECRET_KEY);

const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");

// ─────────────────────────────────────────────
// HELPER: fresh account fetcher
// ─────────────────────────────────────────────
// Soroban testnet RPC nodes are often load-balanced and can serve stale
// account state (old sequence number) for several seconds after a tx
// confirms. Using a stale sequence causes the next tx to fail with txBadSeq.
//
// We track the last sequence number we submitted and spin until the node
// returns an account whose sequence is at least that value.
let lastSubmittedSeq = 0n;

async function getFreshAccount() {
  for (let i = 0; i < 20; i++) {
    const account = await sorobanServer.getAccount(TREASURY_KEYPAIR.publicKey());
    if (BigInt(account.sequenceNumber()) >= lastSubmittedSeq) return account;
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error("Timed out waiting for fresh account sequence from RPC node");
}

// ─────────────────────────────────────────────
// HELPER: submit a transaction to Soroban
// ─────────────────────────────────────────────
async function submitTx(tx, signerKeypair) {
  // prepareTransaction simulates the tx and attaches the auth footprint.
  // The tx must NOT be signed before this step — signing before preparation
  // produces a signature over the wrong envelope (missing the footprint),
  // causing "Missing or Mismatched Signatures" errors on-chain.
  const preparedTx = await sorobanServer.prepareTransaction(tx);
  preparedTx.sign(signerKeypair);

  // Record the sequence number so getFreshAccount() knows what "fresh" means
  const submittedSeq = BigInt(preparedTx.sequence);
  lastSubmittedSeq = submittedSeq;

  const response = await sorobanServer.sendTransaction(preparedTx);

  // sendTransaction returns ERROR synchronously if the tx was rejected
  // (bad auth, insufficient fee, etc.) — catch it before polling
  if (response.status === "ERROR") {
    throw new Error(`sendTransaction rejected: ${JSON.stringify(response.errorResult ?? response)}`);
  }

  // Poll for confirmation — 30 × 3s = 90s window
  let result;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    result = await sorobanServer.getTransaction(response.hash);
    if (result.status !== "NOT_FOUND") break;
  }
  if (!result || result.status !== "SUCCESS") {
    throw new Error(`Tx failed: ${JSON.stringify(result)}`);
  }

  // Advance lastSubmittedSeq to the confirmed sequence so the NEXT getFreshAccount()
  // will not accept a node still serving the pre-confirmation sequence.
  lastSubmittedSeq = submittedSeq;

  return result;
}

// ─────────────────────────────────────────────
// INITIALIZE SPLITTER (run once, or after TTL expiry)
// ─────────────────────────────────────────────
async function initializeSplitter(maturityTimestamp) {
  console.log(`\n🛠  Initializing splitter with maturity: ${new Date(maturityTimestamp * 1000).toISOString()}...`);

  const account = await getFreshAccount();

  const stsusdeScVal  = new Address(STSUSDE_TOKEN_ID).toScVal();
  const ptScVal       = new Address(PT_TOKEN_ID).toScVal();
  const ytScVal       = new Address(YT_TOKEN_ID).toScVal();
  const maturityScVal = nativeToScVal(BigInt(maturityTimestamp), { type: "u64" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(new Contract(SPLITTER_CONTRACT_ID).call(
      "initialize",
      stsusdeScVal,
      ptScVal,
      ytScVal,
      maturityScVal
    ))
    .setTimeout(30)
    .build();

  await submitTx(tx, TREASURY_KEYPAIR);
  console.log("✅ Splitter initialized.");
}

// ─────────────────────────────────────────────
// PRE-FLIGHT: verify splitter is initialized and bridge index is set
// ─────────────────────────────────────────────
async function verifySplitterReady() {
  console.log("\n🔍 Pre-flight checks...");
  const account = await getFreshAccount();

  // 1. Check splitter maturity is set (proves initialize() ran successfully)
  const maturityTx = new TransactionBuilder(account, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET
  })
    .addOperation(new Contract(SPLITTER_CONTRACT_ID).call("get_maturity"))
    .setTimeout(30)
    .build();
  const maturitySim = await sorobanServer.simulateTransaction(maturityTx);
  if (!maturitySim.result) {
    return { initialized: false, expired: false };
  }
  const maturity = Number(scValToNative(maturitySim.result.retval));
  const now = Math.floor(Date.now() / 1000);
  console.log(`   ✅ Splitter initialized. Maturity: ${new Date(maturity * 1000).toISOString()}`);
  if (now >= maturity) {
    console.log("   ⚠️  Maturity has passed — will re-initialize with a new maturity.");
    return { initialized: true, expired: true };
  }

  // 2. Check bridge yield index is set (mint_split calls get_yield_index internally)
  const freshAccount2 = await getFreshAccount();
  const bridgeAddr = "CBRHMRHP4QZXOID6DSU4SVT7HLIQRXOMT3NDIGOJN6DY6GC7G5G2C6B5";
  const indexTx = new TransactionBuilder(freshAccount2, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET
  })
    .addOperation(new Contract(bridgeAddr).call("get_yield_index"))
    .setTimeout(30)
    .build();
  const indexSim = await sorobanServer.simulateTransaction(indexTx);
  if (!indexSim.result) {
    throw new Error(
      "Bridge contract get_yield_index failed — the relayer oracle must push a yield index " +
      "before mint_split will work. Run the relayer first (fetchAndPushYieldIndex)."
    );
  }
  const yieldIndex = scValToNative(indexSim.result.retval);
  console.log(`   ✅ Bridge yield index is set: ${yieldIndex}`);

  console.log("   ✅ All pre-flight checks passed.\n");
  return { initialized: true, expired: false };
}

// ─────────────────────────────────────────────
// STEP 1: Mint PT + YT from STSUSDE
// ─────────────────────────────────────────────
// Call this after STSUSDE lands in the treasury wallet.
// `amount` is in 7-decimal Soroban units.
async function mintSplit(amount) {
  console.log(`\n🔀 Calling mint_split for ${amount} STSUSDE...`);

  const account = await getFreshAccount();

  // ── Pre-flight: check treasury STSUSDE balance ──────────────────────────
  // mint_split pulls tokens from `user` — if the balance is 0 the WASM
  // contract will panic with UnreachableCodeReached (Rust unwrap failure).
  const stsusdeContract = new Contract(STSUSDE_TOKEN_ID);
  const balanceTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(stsusdeContract.call(
      "balance",
      new Address(TREASURY_KEYPAIR.publicKey()).toScVal()
    ))
    .setTimeout(30)
    .build();
  const balanceSim = await sorobanServer.simulateTransaction(balanceTx);
  const treasuryBalance = balanceSim.result
    ? BigInt(scValToNative(balanceSim.result.retval))
    : 0n;
  console.log(`   Treasury STSUSDE balance: ${treasuryBalance} (need ${amount})`);
  if (treasuryBalance < BigInt(amount)) {
    throw new Error(
      `Insufficient STSUSDE in treasury. Have ${treasuryBalance}, need ${amount}. ` +
      `Bridge some sUSDe first or fund the treasury wallet.`
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  // Fetch a FRESH account after the simulation above.
  // TransactionBuilder calls account.incrementSequenceNumber() internally when
  // building balanceTx, so reusing that account object would produce seq+1 on
  // the real tx while the chain still expects seq+0 → txBadSeq.
  const freshAccount = await getFreshAccount();
  const splitter = new Contract(SPLITTER_CONTRACT_ID);

  // The treasury wallet is `user` — it must have STSUSDE and authorize this call
  const userScVal = new Address(TREASURY_KEYPAIR.publicKey()).toScVal();
  const amountScVal = nativeToScVal(BigInt(amount), { type: "i128" });

  const tx = new TransactionBuilder(freshAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(splitter.call("mint_split", userScVal, amountScVal))
    .setTimeout(30)
    .build();

  await submitTx(tx, TREASURY_KEYPAIR);
  console.log(`✅ mint_split done. Treasury now holds ${amount} PT and ${amount} YT.`);
}

// ─────────────────────────────────────────────
// STEP 2: Approve a contract to spend a token
// ─────────────────────────────────────────────
// Used for both splitter (STSUSDE allowance) and AMM (PT/YT/USDC allowance)
// expiration_ledger: set to current_ledger + ~200000 (about 2 weeks on testnet)
async function approveToken(tokenContractId, spenderContractId, amount, expirationLedger) {
  console.log(`\n🔑 Approving ${spenderContractId} to spend token: ${tokenContractId}...`);

  const account = await getFreshAccount();
  const tokenContract = new Contract(tokenContractId);

  const fromScVal    = new Address(TREASURY_KEYPAIR.publicKey()).toScVal();
  const spenderScVal = new Address(spenderContractId).toScVal();
  const amountScVal  = nativeToScVal(BigInt(amount), { type: "i128" });
  const expiryScVal  = nativeToScVal(expirationLedger, { type: "u32" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(tokenContract.call("approve", fromScVal, spenderScVal, amountScVal, expiryScVal))
    .setTimeout(30)
    .build();

  await submitTx(tx, TREASURY_KEYPAIR);
  console.log(`✅ Approval set for ${tokenContractId}`);
}

// ─────────────────────────────────────────────
// STEP 3a: Seed PT/USDC Liquidity
// ─────────────────────────────────────────────
// usdcAmount and ptAmount are 7-decimal Soroban units
// PT should be priced at a DISCOUNT to face value.
// Example: if face value = 1 USDC, and implied rate = 10% APY for 1 year,
//          price ≈ 0.909 USDC. So ratio: 909_000 USDC : 1_000_000 PT
async function addPtLiquidity(usdcAmount, ptAmount) {
  console.log(`\n💧 Adding PT/USDC liquidity: ${usdcAmount} USDC + ${ptAmount} PT...`);

  const account = await getFreshAccount();
  const amm = new Contract(AMM_CONTRACT_ID);

  const userScVal     = new Address(TREASURY_KEYPAIR.publicKey()).toScVal();
  const usdcScVal     = nativeToScVal(BigInt(usdcAmount), { type: "i128" });
  const ptScVal       = nativeToScVal(BigInt(ptAmount), { type: "i128" });
  const minLpScVal    = nativeToScVal(BigInt(1), { type: "i128" }); // min 1 LP share

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(amm.call("add_liquidity_pt", userScVal, usdcScVal, ptScVal, minLpScVal))
    .setTimeout(30)
    .build();

  const result = await submitTx(tx, TREASURY_KEYPAIR);
  console.log(`✅ PT pool seeded! LP shares minted.`);
  return result;
}

// ─────────────────────────────────────────────
// STEP 3b: Seed YT/USDC Liquidity
// ─────────────────────────────────────────────
// YT is priced based on expected yield. It's highly speculative.
// Example: if expected yield over period = 5%, each YT worth ~0.05 USDC.
//          ratio: 50_000 USDC : 1_000_000 YT
async function addYtLiquidity(usdcAmount, ytAmount) {
  console.log(`\n💧 Adding YT/USDC liquidity: ${usdcAmount} USDC + ${ytAmount} YT...`);

  const account = await getFreshAccount();
  const amm = new Contract(AMM_CONTRACT_ID);

  const userScVal   = new Address(TREASURY_KEYPAIR.publicKey()).toScVal();
  const usdcScVal   = nativeToScVal(BigInt(usdcAmount), { type: "i128" });
  const ytScVal     = nativeToScVal(BigInt(ytAmount), { type: "i128" });
  const minLpScVal  = nativeToScVal(BigInt(1), { type: "i128" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(amm.call("add_liquidity_yt", userScVal, usdcScVal, ytScVal, minLpScVal))
    .setTimeout(30)
    .build();

  const result = await submitTx(tx, TREASURY_KEYPAIR);
  console.log(`✅ YT pool seeded! LP shares minted.`);
  return result;
}

// ─────────────────────────────────────────────
// STEP 4: View current prices
// ─────────────────────────────────────────────
async function readAmmPrices() {
  const account = await getFreshAccount();
  const amm = new Contract(AMM_CONTRACT_ID);

  // PT price
  const ptTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(amm.call("get_pt_price"))
    .setTimeout(30)
    .build();
  const ptSim = await sorobanServer.simulateTransaction(ptTx);
  const ptPrice = ptSim.result ? Number(scValToNative(ptSim.result.retval)) / 1e7 : 0;

  // YT price
  const ytTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(amm.call("get_yt_price"))
    .setTimeout(30)
    .build();
  const ytSim = await sorobanServer.simulateTransaction(ytTx);
  const ytPrice = ytSim.result ? Number(scValToNative(ytSim.result.retval)) / 1e7 : 0;

  console.log(`📊 PT Price: ${ptPrice.toFixed(7)} USDC`);
  console.log(`📊 YT Price: ${ytPrice.toFixed(7)} USDC`);
  console.log(`📊 PT + YT Price: ${(ptPrice + ytPrice).toFixed(7)} USDC (should ≈ 1 USDC)`);
}

// ─────────────────────────────────────────────
// FULL SEED FLOW — run this once after deployment
// ─────────────────────────────────────────────
//
// Pricing example (adjust to match your maturity and expected yield):
//   - Maturity: 1 year from now
//   - Expected sUSDe APY: 10%
//   - PT fair value: 0.909 USDC (discount = 9.1%)
//   - YT fair value: 0.091 USDC
//   - PT + YT = 1 USDC ✅ (arbitrage invariant)
//
async function seedAmmLiquidity() {
  const TOTAL_STSUSDE = 1_000_000n; // 0.1 STSUSDE (7-dec = 0.1 * 10^7)

  // Liquidity amounts (7-decimal Soroban units)
  const PT_AMOUNT   = 1_000_000n; // 0.1 PT
  const USDC_FOR_PT = 909_000n;   // 0.0909 USDC (at 0.909 per PT)

  const YT_AMOUNT   = 1_000_000n; // 0.1 YT
  const USDC_FOR_YT = 91_000n;    // 0.0091 USDC (at 0.091 per YT)

  const latestLedgerResponse = await sorobanServer.getLatestLedger();
  const currentLedger = latestLedgerResponse.sequence;

  // ~11.5 days from now on testnet (1 ledger ≈ 5s)
  const EXPIRY_LEDGER = currentLedger + 200000;

// const EXPIRY_LEDGER = 9999999; // Set this to current_ledger + ~200000

  try {
    // 0. Verify splitter is initialized and bridge yield index exists
    const { initialized, expired } = await verifySplitterReady();

    if (!initialized || expired) {
      // Set maturity 1 year from now
      const newMaturity = Math.floor(Date.now() / 1000) +  (365 * 24 * 60 * 60);
      await initializeSplitter(newMaturity);
      console.log(`   Splitter re-initialized. New maturity: ${new Date(newMaturity * 1000).toISOString()}`);
    }

    // 1. Approve splitter to pull STSUSDE from treasury (transfer_from inside mint_split)
    await approveToken(STSUSDE_TOKEN_ID, SPLITTER_CONTRACT_ID, TOTAL_STSUSDE, EXPIRY_LEDGER);

    // 2. Split STSUSDE into PT + YT
    await mintSplit(TOTAL_STSUSDE);

    // 3. Approve AMM to spend PT, YT, USDC
    await approveToken(PT_TOKEN_ID, AMM_CONTRACT_ID, (PT_AMOUNT * 2n).toString(), EXPIRY_LEDGER);
    await approveToken(YT_TOKEN_ID, AMM_CONTRACT_ID, (YT_AMOUNT * 2n).toString(), EXPIRY_LEDGER);
    // Kept a small 100_000n (0.01 USDC) buffer on the approval to prevent dust failures
    await approveToken(USDC_TOKEN_ID, AMM_CONTRACT_ID, (USDC_FOR_PT + USDC_FOR_YT + 100_000n).toString(), EXPIRY_LEDGER);

    // 4. Seed PT pool
    await addPtLiquidity(USDC_FOR_PT.toString(), PT_AMOUNT.toString());

    // 5. Seed YT pool
    await addYtLiquidity(USDC_FOR_YT.toString(), YT_AMOUNT.toString());

    // 6. Print prices
    await readAmmPrices();

    console.log("\n🎉 AMM fully seeded and ready for trading!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }
}

module.exports = {
  initializeSplitter,
  mintSplit,
  approveToken,
  addPtLiquidity,
  addYtLiquidity,
  readAmmPrices,
  seedAmmLiquidity,
};

// To run the seed: node seed_amm.js
seedAmmLiquidity();