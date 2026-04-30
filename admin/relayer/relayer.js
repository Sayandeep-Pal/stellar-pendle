"use strict";

const { ethers }  = require("ethers");
require("dotenv").config();

const {
  Keypair, Contract, rpc, Networks,
  TransactionBuilder, BASE_FEE, Address,
  nativeToScVal, xdr, scValToNative,
} = require("@stellar/stellar-sdk");

const Database = require("better-sqlite3"); // npm install better-sqlite3
const fs        = require("fs");
const path      = require("path");

// ─────────────────────────────────────────────
// 1. CONFIGURATION & VALIDATION
// ─────────────────────────────────────────────

/**
 * Validates that all required environment variables are present.
 * Throws immediately at startup if any are missing rather than
 * crashing deep inside execution with a confusing error.
 */
function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

const CONFIG = {
  evmRpcUrl:            requireEnv("RPC_URL"),
  mainnetRpcUrl:        requireEnv("MAINNET_RPC_URL"),
  evmVaultAddress:      requireEnv("EVM_VAULT_ADDRESS"),
  sorobanBridgeId:      requireEnv("SOROBAN_BRIDGE_ID"),
  relayerSecret:        requireEnv("RELAYER_SECRET_KEY"),
  evmPrivateKey:        requireEnv("PRIVATE_KEY"),
  evmYieldTokenAddress: requireEnv("EVM_YIELD_TOKEN_ADDRESS"),

  // Safety parameters — tune via env or leave as defaults
  evmConfirmations:     parseInt(process.env.EVM_CONFIRMATIONS    || "12", 10),
  oracleIntervalMs:     parseInt(process.env.ORACLE_INTERVAL_MS   || "3600000", 10), // 1 hour
  sorobanPollMs:        parseInt(process.env.SOROBAN_POLL_MS      || "5000", 10),
  maturityRefreshMs:    parseInt(process.env.MATURITY_REFRESH_MS  || "3600000", 10),
  maxRetries:           parseInt(process.env.MAX_RETRIES          || "5", 10),
  circuitBreakerLimit:  parseInt(process.env.CIRCUIT_BREAKER_LIMIT|| "10", 10),

  // Decimal precision constants — documented explicitly
  // EVM USDC uses 6 decimals, Soroban bridge token uses 7 decimals
  // EVM sUSDe yield token uses 18 decimals
  evmUsdcDecimals:      6n,
  sorobanDecimals:      7n,
  evmYieldDecimals:     18n,
};

// ─────────────────────────────────────────────
// 2. AUDIT LOGGING
// ─────────────────────────────────────────────

const LOG_FILE = process.env.AUDIT_LOG_FILE || "relayer-audit.jsonl";
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

function audit(level, event, data = {}) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  });
  // Write to both stdout and the persistent audit log file
  console.log(entry);
  logStream.write(entry + "\n");
}

// ─────────────────────────────────────────────
// 3. PERSISTENT REPLAY PROTECTION (SQLite)
// ─────────────────────────────────────────────

/**
 * Uses SQLite so processed event hashes survive relayer restarts.
 * Without this, a restart would reprocess all events from lastLedger
 * and double-mint tokens to users.
 */
const DB_FILE = process.env.DB_FILE || "relayer.db";
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS processed_events (
    hash        TEXT PRIMARY KEY,
    direction   TEXT NOT NULL,   -- 'evm_to_soroban' | 'soroban_to_evm'
    processed_at TEXT NOT NULL,
    status      TEXT NOT NULL    -- 'success' | 'dead_letter'
  );

  CREATE TABLE IF NOT EXISTS ledger_cursor (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    last_ledger INTEGER NOT NULL
  );
  INSERT OR IGNORE INTO ledger_cursor (id, last_ledger) VALUES (1, 0);

  CREATE TABLE IF NOT EXISTS dead_letter (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hash        TEXT NOT NULL,
    direction   TEXT NOT NULL,
    payload     TEXT NOT NULL,   -- JSON
    error       TEXT NOT NULL,
    failed_at   TEXT NOT NULL
  );
`);

const stmtHasSeen    = db.prepare("SELECT 1 FROM processed_events WHERE hash = ?");
const stmtMarkSeen   = db.prepare(
  "INSERT OR IGNORE INTO processed_events (hash, direction, processed_at, status) VALUES (?, ?, ?, ?)"
);
const stmtGetLedger  = db.prepare("SELECT last_ledger FROM ledger_cursor WHERE id = 1");
const stmtSetLedger  = db.prepare("UPDATE ledger_cursor SET last_ledger = ? WHERE id = 1");
const stmtDeadLetter = db.prepare(
  "INSERT INTO dead_letter (hash, direction, payload, error, failed_at) VALUES (?, ?, ?, ?, ?)"
);

function hasSeen(hash)          { return !!stmtHasSeen.get(hash); }
function markSeen(hash, dir, status) {
  stmtMarkSeen.run(hash, dir, new Date().toISOString(), status);
}
function getLastLedger()        { return stmtGetLedger.get().last_ledger; }
function setLastLedger(seq)     { stmtSetLedger.run(seq); }
function sendToDeadLetter(hash, direction, payload, error) {
  stmtDeadLetter.run(hash, direction, JSON.stringify(payload), String(error), new Date().toISOString());
  audit("ERROR", "dead_letter", { hash, direction, error: String(error) });
}

// ─────────────────────────────────────────────
// 4. CIRCUIT BREAKER
// ─────────────────────────────────────────────

/**
 * Halts the relayer after too many consecutive failures to prevent
 * silent fund loss in a degraded state.
 */
let consecutiveFailures = 0;

function recordSuccess() { consecutiveFailures = 0; }
function recordFailure(context) {
  consecutiveFailures++;
  audit("WARN", "consecutive_failure", { count: consecutiveFailures, context });
  if (consecutiveFailures >= CONFIG.circuitBreakerLimit) {
    audit("FATAL", "circuit_breaker_tripped", {
      count: consecutiveFailures,
      message: "Too many consecutive failures. Halting relayer for safety.",
    });
    process.exit(1); // Exit so a process manager (e.g. systemd, PM2) can alert & restart
  }
}

// ─────────────────────────────────────────────
// 5. DECIMAL CONVERSION HELPERS
// ─────────────────────────────────────────────

/**
 * All conversion functions are explicit, documented, and include
 * bounds checks to catch malformed event values before they cause damage.
 */

const MAX_REASONABLE_USDC = ethers.parseUnits("10000000", 6); // $10M sanity cap

function evmUsdcToSoroban(evmAmount6) {
  // EVM USDC: 6 decimals → Soroban bridge token: 7 decimals
  // Multiply by 10 to shift one decimal place right
  const amount = BigInt(evmAmount6);
  if (amount <= 0n) throw new Error(`Invalid EVM amount: ${amount}`);
  if (amount > MAX_REASONABLE_USDC) throw new Error(`Suspiciously large EVM amount: ${amount}`);
  return amount * 10n;
}

function sorobanToEvmUsdc(sorobanAmount7) {
  // Soroban bridge token: 7 decimals → EVM USDC: 6 decimals
  // Divide by 10, truncating the extra decimal place
  const amount = BigInt(sorobanAmount7);
  if (amount <= 0n) throw new Error(`Invalid Soroban amount: ${amount}`);
  const converted = amount / 10n;
  if (converted <= 0n) throw new Error(`Amount too small after conversion: ${sorobanAmount7}`);
  return converted;
}

function evmYieldTo7Decimals(yieldAmount18) {
  // sUSDe/sDAI on mainnet: 18 decimals → Soroban: 7 decimals
  // Divide by 10^11 to drop 11 decimal places
  const amount = BigInt(yieldAmount18);
  if (amount <= 0n) throw new Error(`Invalid yield amount: ${amount}`);
  return amount / 100_000_000_000n;
}

// ─────────────────────────────────────────────
// 6. RETRY HELPER WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────

async function withRetry(label, fn, maxAttempts = CONFIG.maxRetries) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err) {
      lastError = err;
      const delayMs = Math.min(1000 * 2 ** attempt, 60_000); // cap at 60s
      audit("WARN", "retry", { label, attempt, maxAttempts, delayMs, error: err.message });
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  recordFailure(label);
  throw lastError;
}

// ─────────────────────────────────────────────
// 7. EVM PROVIDERS & CONTRACTS
// ─────────────────────────────────────────────

const evmProvider = new ethers.JsonRpcProvider(CONFIG.evmRpcUrl);
const evmWallet   = new ethers.Wallet(CONFIG.evmPrivateKey, evmProvider);

const vaultAbi = [
  "event TokensLocked(address indexed evmSender, string stellarDestination, uint256 amount, uint256 nonce)",
  "function unlockTokens(address to, uint256 amount, bytes32 sorobanTxHash) external",
];
const vaultContract           = new ethers.Contract(CONFIG.evmVaultAddress, vaultAbi, evmProvider);
const vaultContractWithSigner = vaultContract.connect(evmWallet);

const yieldAbi = [
  "function convertToAssets(uint256 shares) external view returns (uint256)",
];

/**
 * Multi-RPC oracle providers with automatic fallback.
 * If the primary mainnet RPC returns a bad value, the oracle
 * tries backup providers rather than pushing stale/wrong data.
 */
const oracleProviderUrls = [
  CONFIG.mainnetRpcUrl,
  ...(process.env.MAINNET_RPC_FALLBACK_URLS || "").split(",").filter(Boolean),
];
const oracleProviders = oracleProviderUrls.map(url => new ethers.JsonRpcProvider(url));

async function callYieldContractWithFallback(method, ...args) {
  const errors = [];
  for (const provider of oracleProviders) {
    try {
      const contract = new ethers.Contract(CONFIG.evmYieldTokenAddress, yieldAbi, provider);
      return await contract[method](...args);
    } catch (err) {
      errors.push(err.message);
    }
  }
  throw new Error(`All oracle providers failed: ${errors.join(" | ")}`);
}

// ─────────────────────────────────────────────
// 8. SOROBAN CLIENT
// ─────────────────────────────────────────────

const sorobanServer   = new rpc.Server("https://soroban-testnet.stellar.org");
const relayerKeypair  = Keypair.fromSecret(CONFIG.relayerSecret);

/**
 * Builds, signs, prepares, and submits a Soroban contract call.
 * Centralised here to avoid repeated boilerplate and ensure
 * consistent signing and error handling.
 */
async function callSoroban(contractId, method, ...scVals) {
  const account = await sorobanServer.getAccount(relayerKeypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...scVals))
    .setTimeout(30)
    .build();

  tx.sign(relayerKeypair);
  const preparedTx = await sorobanServer.prepareTransaction(tx);
  preparedTx.sign(relayerKeypair);

  return sorobanServer.sendTransaction(preparedTx);
}

// ─────────────────────────────────────────────
// 9. EVM → SOROBAN: DEPOSIT HANDLER
// ─────────────────────────────────────────────

async function handleEvmDeposit(evmSender, stellarDest, amount, nonce, event) {
  const txHash = event.log.transactionHash;

  if (hasSeen(txHash)) {
    audit("INFO", "evm_deposit_already_processed", { txHash });
    return;
  }

  audit("INFO", "evm_deposit_detected", { txHash, evmSender, stellarDest, amount: amount.toString() });

  try {
    // Wait for sufficient EVM confirmations before treating as final.
    // 2 confirmations (original code) is unsafe on reorg-prone chains.
    audit("INFO", "waiting_for_evm_finality", { txHash, confirmations: CONFIG.evmConfirmations });
    await withRetry("evm_wait_for_tx", () =>
      evmProvider.waitForTransaction(txHash, CONFIG.evmConfirmations)
    );

    // Validate the deposit still exists post-finality (sanity check after reorg window)
    const receipt = await evmProvider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      throw new Error(`EVM tx ${txHash} not found or failed post-finality`);
    }

    const amount7   = evmUsdcToSoroban(amount);
    const hashBuffer = Buffer.from(txHash.replace("0x", ""), "hex");

    const toAddressScVal = new Address(stellarDest).toScVal();
    const amountScVal    = nativeToScVal(amount7, { type: "i128" });
    const hashScVal      = xdr.ScVal.scvBytes(hashBuffer);

    const response = await withRetry("soroban_mint", () =>
      callSoroban(CONFIG.sorobanBridgeId, "mint", toAddressScVal, amountScVal, hashScVal)
    );

    markSeen(txHash, "evm_to_soroban", "success");
    audit("INFO", "soroban_mint_success", { evmTxHash: txHash, sorobanTxHash: response.hash, amount7: amount7.toString() });

  } catch (err) {
    audit("ERROR", "evm_deposit_failed", { txHash, error: err.message });
    sendToDeadLetter(txHash, "evm_to_soroban", { evmSender, stellarDest, amount: amount.toString() }, err);
    // Do NOT markSeen — allows manual replay after investigation
    throw err;
  }
}

// ─────────────────────────────────────────────
// 10. SOROBAN → EVM: WITHDRAWAL HANDLER
// ─────────────────────────────────────────────

async function handleSorobanWithdrawal(event) {
  // Use the raw Soroban tx hash as the deduplication key.
  // DO NOT prepend 0x — that would make it look like an EVM hash,
  // which could cause incorrect behaviour in the EVM vault contract.
  const sorobanTxHash = event.txHash;

  if (hasSeen(sorobanTxHash)) {
    audit("INFO", "soroban_withdrawal_already_processed", { sorobanTxHash });
    return;
  }

  let evmDestHex, sorobanAmount;
  try {
    const decodedValue = scValToNative(event.value);
    evmDestHex    = "0x" + Buffer.from(decodedValue[0]).toString("hex");
    sorobanAmount = decodedValue[1];

    if (!ethers.isAddress(evmDestHex)) {
      throw new Error(`Decoded EVM address is invalid: ${evmDestHex}`);
    }
  } catch (err) {
    audit("ERROR", "soroban_event_decode_failed", { sorobanTxHash, error: err.message });
    // Mark as dead letter immediately — malformed events can't be retried
    sendToDeadLetter(sorobanTxHash, "soroban_to_evm", { raw: event }, err);
    markSeen(sorobanTxHash, "soroban_to_evm", "dead_letter");
    return;
  }

  audit("INFO", "soroban_withdrawal_detected", { sorobanTxHash, evmDestHex, sorobanAmount: sorobanAmount.toString() });

  try {
    const amount6 = sorobanToEvmUsdc(sorobanAmount);

    /**
     * The vault contract's `unlockTokens` expects a bytes32 identifier
     * for the source transaction. We pass the raw Soroban hash bytes
     * (32 bytes, left-padded if needed), NOT a fake 0x-prefixed EVM hash.
     * The vault contract's replay protection must key on this value.
     */
    const sorobanHashBytes = Buffer.from(sorobanTxHash, "hex");
    if (sorobanHashBytes.length !== 32) {
      throw new Error(`Soroban tx hash is not 32 bytes: ${sorobanTxHash} (${sorobanHashBytes.length} bytes)`);
    }
    const sorobanHashBytes32 = "0x" + sorobanHashBytes.toString("hex");

    await withRetry("evm_unlock", async () => {
      const tx = await vaultContractWithSigner.unlockTokens(
        evmDestHex,
        amount6.toString(),
        sorobanHashBytes32,
      );
      audit("INFO", "evm_unlock_submitted", { evmTxHash: tx.hash, sorobanTxHash });
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error("EVM unlock transaction reverted");
      audit("INFO", "evm_unlock_confirmed", { evmTxHash: tx.hash, sorobanTxHash, amount6: amount6.toString() });
    });

    markSeen(sorobanTxHash, "soroban_to_evm", "success");

  } catch (err) {
    audit("ERROR", "soroban_withdrawal_failed", { sorobanTxHash, error: err.message });
    sendToDeadLetter(sorobanTxHash, "soroban_to_evm", { evmDestHex, sorobanAmount: sorobanAmount.toString() }, err);
    markSeen(sorobanTxHash, "soroban_to_evm", "dead_letter");
    throw err;
  }
}

// ─────────────────────────────────────────────
// 11. SOROBAN EVENT POLLER
// ─────────────────────────────────────────────

let isPolling = false;

async function pollSoroban() {
  // Async-safe guard: if a poll is still running, skip this tick
  if (isPolling) return;
  isPolling = true;

  try {
    const latestLedger = await sorobanServer.getLatestLedger();
    let lastLedger = getLastLedger();

    // On very first run, start from current ledger (don't replay history).
    // WARNING: this means events before first startup are NOT processed.
    // For production, initialise last_ledger in the DB to the correct
    // deployment ledger to avoid missing pre-startup events.
    if (lastLedger === 0) {
      setLastLedger(latestLedger.sequence);
      audit("INFO", "soroban_poll_initialised", { startLedger: latestLedger.sequence });
      return;
    }

    if (latestLedger.sequence <= lastLedger) return;

    const eventsRes = await sorobanServer.getEvents({
      startLedger: lastLedger,
      filters: [{
        type: "contract",
        contractIds: [CONFIG.sorobanBridgeId],
        topics: [[xdr.ScVal.scvSymbol("withdraw").toXDR("base64"), "*"]],
      }],
    });

    for (const event of eventsRes.events) {
      try {
        await handleSorobanWithdrawal(event);
      } catch (err) {
        // Log and continue — one bad event shouldn't stall the whole queue
        audit("ERROR", "soroban_poll_event_error", { txHash: event.txHash, error: err.message });
      }
    }

    // Only advance the cursor after all events in this batch are processed
    setLastLedger(latestLedger.sequence);

  } catch (err) {
    audit("ERROR", "soroban_poll_error", { error: err.message });
    recordFailure("soroban_poll");
  } finally {
    isPolling = false;
  }
}

// ─────────────────────────────────────────────
// 12. YIELD ORACLE
// ─────────────────────────────────────────────

let isOracleRunning = false;

async function fetchAndPushYieldIndex() {
  if (isOracleRunning) return;
  isOracleRunning = true;

  try {
    audit("INFO", "oracle_fetch_start");

    const oneShare = ethers.parseUnits("1", 18);
    const currentAssetsBigInt = await withRetry("oracle_rpc", () =>
      callYieldContractWithFallback("convertToAssets", oneShare)
    );

    const currentIndexHuman = ethers.formatUnits(currentAssetsBigInt, 18);
    audit("INFO", "oracle_fetched", { index: currentIndexHuman });

    // Sanity check: index should be ≥ 1.0 (yield tokens never lose principal in normal operation)
    if (currentAssetsBigInt < ethers.parseUnits("1", 18)) {
      throw new Error(`Yield index below 1.0 — likely a bad RPC response: ${currentIndexHuman}`);
    }

    const index7 = evmYieldTo7Decimals(currentAssetsBigInt);
    const indexScVal = nativeToScVal(index7, { type: "i128" });

    const response = await withRetry("soroban_update_yield", () =>
      callSoroban(CONFIG.sorobanBridgeId, "update_yield_index", indexScVal)
    );

    audit("INFO", "oracle_pushed", { sorobanTxHash: response.hash, index7: index7.toString() });

  } catch (err) {
    audit("ERROR", "oracle_failed", { error: err.message });
    recordFailure("yield_oracle");
  } finally {
    isOracleRunning = false;
  }
}

// ─────────────────────────────────────────────
// 13. MATURITY TIMESTAMP (REFRESHED PERIODICALLY)
// ─────────────────────────────────────────────

let dynamicMaturityTimestamp = 0;

async function fetchMaturityFromContract() {
  try {
    const account   = await sorobanServer.getAccount(relayerKeypair.publicKey());
    const tokenizer = new Contract(CONFIG.sorobanBridgeId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(tokenizer.call("get_maturity"))
      .setTimeout(30)
      .build();

    const simulation = await sorobanServer.simulateTransaction(tx);

    if (simulation.result) {
      dynamicMaturityTimestamp = Number(scValToNative(simulation.result.retval));
      audit("INFO", "maturity_fetched", { maturityTimestamp: dynamicMaturityTimestamp });
    } else {
      audit("WARN", "maturity_fetch_no_result");
    }
  } catch (err) {
    audit("ERROR", "maturity_fetch_failed", { error: err.message });
  }
}

// ─────────────────────────────────────────────
// 14. MAIN ENTRY POINT
// ─────────────────────────────────────────────

async function main() {
  audit("INFO", "relayer_starting", {
    evmVault:         CONFIG.evmVaultAddress,
    sorobanBridge:    CONFIG.sorobanBridgeId,
    evmConfirmations: CONFIG.evmConfirmations,
  });

  // EVM → Soroban: listen for deposit events
  vaultContract.on("TokensLocked", async (evmSender, stellarDest, amount, nonce, event) => {
    try {
      await handleEvmDeposit(evmSender, stellarDest, amount, nonce, event);
    } catch (err) {
      // Already handled inside; top-level catch prevents unhandled rejection crash
      audit("ERROR", "top_level_deposit_error", { error: err.message });
    }
  });

  // Soroban → EVM: poll for withdrawal events
  audit("INFO", "soroban_poller_starting", { intervalMs: CONFIG.sorobanPollMs });
  setInterval(pollSoroban, CONFIG.sorobanPollMs);

  // Yield oracle: push index on a schedule
  audit("INFO", "oracle_starting", { intervalMs: CONFIG.oracleIntervalMs });
  await fetchAndPushYieldIndex(); // Run immediately on start
  setInterval(fetchAndPushYieldIndex, CONFIG.oracleIntervalMs);

  // Maturity: fetch now, then refresh hourly
  await fetchMaturityFromContract();
  setInterval(fetchMaturityFromContract, CONFIG.maturityRefreshMs);
}

main().catch(err => {
  audit("FATAL", "startup_failed", { error: err.message });
  process.exit(1);
});