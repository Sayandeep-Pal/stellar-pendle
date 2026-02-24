import {
    isAllowed,
    signTransaction,
    requestAccess,
} from "@stellar/freighter-api";
import {
    Account,
    Address,
    Contract,
    Networks,
    rpc,
    TransactionBuilder,
    scValToNative,
    nativeToScVal,
    xdr,
} from "@stellar/stellar-sdk";

export const MARKETPLACE_ID = "CDUVCF2RLHGD3J4JK3ARQW6RPWO3474Q2FJAEBCACCBQ456HLDCMRT7V";
export const WRAPPER_ID = "CCPAX6NYTOHRZIVQUBL4BMUFQXZEN52NSXU7C3DM75H5EZJLXHX2WDDA";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const DEMO_ADDR = "GDGOZDTERHFZM46RBZDUZUZMYKCCHK4CFXW42SBKOMCBNZ2VRT6XKWW6";

const server = new rpc.Server(RPC_URL);

// ---------------------------------------------------------------
// FREIGHTER HELPERS
// freighter-api v6: requestAccess() returns { address: string }
// freighter-api v5: requestAccess() returned just the string
// We handle both.
// ---------------------------------------------------------------

export const checkConnection = async () => {
    try {
        const allowed = await isAllowed();
        if (!allowed) return null;
        const result = await requestAccess();
        if (!result) return null;
        // v6 returns { address: "G..." }, v5 returned plain string
        const address = (result && typeof result === 'object' && result.address)
            ? result.address
            : result;
        if (!address || typeof address !== 'string') return null;
        return { publicKey: address };
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------
// POLL FOR TRANSACTION CONFIRMATION
// ---------------------------------------------------------------
const checkTx = async (hash, attempts = 0) => {
    const tx = await server.getTransaction(hash);
    if (tx.status === "SUCCESS") return tx;
    if (tx.status === "FAILED") throw new Error(`Transaction failed: ${JSON.stringify(tx.resultXdr)}`);
    if (attempts > 30) throw new Error("Transaction timed out waiting for confirmation");
    await new Promise(r => setTimeout(r, 2000));
    return checkTx(hash, attempts + 1);
};

// ---------------------------------------------------------------
// WRITE: simulate → prepare → sign → send
// ---------------------------------------------------------------
const invokeWrite = async (contractId, method, args = []) => {
    const user = await checkConnection();
    if (!user) throw new Error("Wallet not connected. Please connect Freighter first.");
    const userAddress = user.publicKey;

    const account = await server.getAccount(userAddress);

    let tx = new TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(new Contract(contractId).call(method, ...args))
        .setTimeout(30)
        .build();

    // prepareTransaction simulates and assembles the tx with correct footprint
    tx = await server.prepareTransaction(tx);

    const signResult = await signTransaction(tx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
    });
    // v6 returns { signedTxXdr } or { error }; guard both
    if (!signResult || signResult.error)
        throw new Error(signResult?.error || 'Transaction signing was cancelled');
    const signedTxXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;
    if (!signedTxXdr) throw new Error('No signed XDR returned from Freighter');

    const sentTx = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
    );

    if (sentTx.status === "ERROR") {
        console.error("sendTransaction error:", sentTx);
        throw new Error(sentTx.errorResultXdr || "Transaction rejected by network");
    }

    return await checkTx(sentTx.hash);
};

// ---------------------------------------------------------------
// READ: simulate only (no signing required)
// ---------------------------------------------------------------
const invokeRead = async (contractId, method, args = []) => {
    const tx = new TransactionBuilder(
        new Account(DEMO_ADDR, "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
    )
        .addOperation(new Contract(contractId).call(method, ...args))
        .setTimeout(0)
        .build();

    const sim = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationSuccess(sim)) {
        return scValToNative(sim.result.retval);
    }

    // Surface the real reason so it appears in the browser console
    const detail = sim.error ?? (rpc.Api.isSimulationRestore(sim) ? 'instance storage TTL expired – needs restore' : JSON.stringify(sim));
    console.error(`[invokeRead] ${contractId}::${method} simulation failed:`, detail, sim);
    throw new Error(`Read simulation failed (${method}): ${detail}`);
};

// Utility – scale i128 (7 decimals) to a display number
export const scaleDown = (val) => (Number(val) / 1e7).toFixed(4);

// ==========================================
// --- MARKETPLACE FUNCTIONS ---
// ==========================================

export const listPt = async (sellerAddress, amount) => {
    return await invokeWrite(MARKETPLACE_ID, "list_pt", [
        new Address(sellerAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" })
    ]);
};

export const buyMarketPt = async (buyerAddress, amountNeeded) => {
    return await invokeWrite(MARKETPLACE_ID, "buy_market_pt", [
        new Address(buyerAddress).toScVal(),
        nativeToScVal(amountNeeded, { type: "i128" })
    ]);
};

export const listYt = async (sellerAddress, amount) => {
    return await invokeWrite(MARKETPLACE_ID, "list_yt", [
        new Address(sellerAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" })
    ]);
};

export const buyMarketYt = async (buyerAddress, amountNeeded) => {
    return await invokeWrite(MARKETPLACE_ID, "buy_market_yt", [
        new Address(buyerAddress).toScVal(),
        nativeToScVal(amountNeeded, { type: "i128" })
    ]);
};

export const getPtListing = async (sellerAddress) => {
    return await invokeRead(MARKETPLACE_ID, "get_pt_listing", [
        new Address(sellerAddress).toScVal()
    ]);
};

export const getYtListing = async (sellerAddress) => {
    return await invokeRead(MARKETPLACE_ID, "get_yt_listing", [
        new Address(sellerAddress).toScVal()
    ]);
};

// ==========================================
// --- WRAPPER / ADMIN FUNCTIONS ---
// ==========================================

export const mintSplit = async (userAddress, amount) => {
    return await invokeWrite(WRAPPER_ID, "mint_split", [
        new Address(userAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" })
    ]);
};

export const redeemPt = async (userAddress, amountPt) => {
    return await invokeWrite(WRAPPER_ID, "redeem_pt", [
        new Address(userAddress).toScVal(),
        nativeToScVal(amountPt, { type: "i128" })
    ]);
};

export const claimYield = async (userAddress) => {
    return await invokeWrite(WRAPPER_ID, "claim_yield", [
        new Address(userAddress).toScVal()
    ]);
};

export const combineAndRedeem = async (userAddress, amount) => {
    return await invokeWrite(WRAPPER_ID, "combine_and_redeem", [
        new Address(userAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" })
    ]);
};

export const getPtBalance = async (userAddress) => {
    return await invokeRead(WRAPPER_ID, "get_pt_balance", [
        new Address(userAddress).toScVal()
    ]);
};

export const getYtBalance = async (userAddress) => {
    return await invokeRead(WRAPPER_ID, "get_yt_balance", [
        new Address(userAddress).toScVal()
    ]);
};

export const getTotalPtSupply = async () => {
    // Read the contract instance ledger entry directly — no simulation needed.
    // simulateTransaction fails with Error(Storage, MissingValue) for instance reads
    // on some RPC nodes even when the data is live on-chain.
    const instanceKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
            contract: new Address(WRAPPER_ID).toScAddress(),
            key: xdr.ScVal.scvLedgerKeyContractInstance(),
            durability: xdr.ContractDataDurability.persistent(),
        })
    );

    const result = await server.getLedgerEntries(instanceKey);

    if (!result.entries || result.entries.length === 0) {
        return 0n; // contract instance not yet live or TTL expired
    }

    const storage = result.entries[0].val.contractData().val().instance().storage();
    if (!storage || storage.length === 0) return 0n;

    // #[contracttype] unit enum variants in soroban-sdk are stored as ScSymbol.
    // Try both Symbol and Vec([Symbol]) to cover SDK version differences.
    const asSym = xdr.ScVal.scvSymbol("TotalPT").toXDR("base64");
    const asVec = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol("TotalPT")]).toXDR("base64");

    const found = storage.find(e => {
        const k = e.key().toXDR("base64");
        return k === asSym || k === asVec;
    });

    return found ? scValToNative(found.val()) : 0n;
};

export const getTotalYtSupply = async () => {
    return await invokeRead(WRAPPER_ID, "get_total_yt_supply");
};

// ==========================================
// --- INITIALIZATION FUNCTIONS ---
// ==========================================

/**
 * Initialize the PendleWrapper contract.
 * @param {string} stsusdcAddress  - The stsUSDe / stUSDC token contract address
 * @param {number} maturityTimestamp - Unix timestamp (seconds)
 * @param {string} oracleAddress   - The Bridge/Oracle contract address
 */
export const initializeWrapper = async (stsusdcAddress, maturityTimestamp, oracleAddress) => {
    return await invokeWrite(WRAPPER_ID, "initialize", [
        new Address(stsusdcAddress).toScVal(),
        nativeToScVal(BigInt(maturityTimestamp), { type: "u64" }),
        new Address(oracleAddress).toScVal(),
    ]);
};

/**
 * Initialize the Marketplace (OrderBook) contract.
 * @param {string} wrapperAddress  - The PendleWrapper contract address (WRAPPER_ID)
 * @param {string} usdcAddress     - The USDC token contract address on testnet
 */
export const initializeMarketplace = async (wrapperAddress, usdcAddress) => {
    return await invokeWrite(MARKETPLACE_ID, "initialize", [
        new Address(wrapperAddress).toScVal(),
        new Address(usdcAddress).toScVal(),
    ]);
};
