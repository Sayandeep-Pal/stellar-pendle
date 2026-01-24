import {
    isAllowed,
    setAllowed,
    getUserInfo,
    signTransaction,
    requestAccess,
} from "@stellar/freighter-api";
import {
    Account,
    Address,
    Asset,
    Contract,
    Keypair,
    Networks,
    rpc,
    TransactionBuilder,
    xdr,
    scValToNative,
    nativeToScVal,
} from "@stellar/stellar-sdk";

const YIELD_VAULT_ID = "CCNJFISZLU5SBZKZ5TMOTUDDPVRSZ5ZAF3JL3MAYMDUC324FIKXIUUT6";
const PENDLE_WRAPPER_ID = "CBGG2YIJYT4AXZHXKSNWQ3PMY5FUTXRCXZDDCPM5URPQYEHBGUL2KJSI"; // TODO: Update this ID!
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);

// sanity check
if (typeof window !== 'undefined' && !window.Buffer) {
    console.warn("Buffer is missing! Stellar SDK may crash.");
}

export const connectWallet = async () => {
    const address = await requestAccess();
    return address;
};

export const getContractMetadata = async () => {
    const name = await invokeReadOnly(YIELD_VAULT_ID, "name");
    const symbol = await invokeReadOnly(YIELD_VAULT_ID, "symbol");
    const decimals = await invokeReadOnly(YIELD_VAULT_ID, "decimals");
    return { name, symbol, decimals };
};

export const getBalance = async (userAddress) => {
    const balance = await invokeReadOnly(YIELD_VAULT_ID, "balance", [
        nativeToScVal(userAddress, { type: "address" }),
    ]);
    return balance;
};

export const getRate = async () => {
    try {
        const rate = await invokeReadOnly(YIELD_VAULT_ID, "view_rate");
        return rate;
    } catch (e) {
        console.error("Error getting rate:", e);
        return 1000;
    }
};

const invokeReadOnly = async (contractId, method, args = []) => {
    try {
        const contract = new Contract(contractId);
        // Use a funded demo address for simulations
        const DEMO_ADDRESS = "GDGOZDTERHFZM46RBZDUZUZMYKCCHK4CFXW42SBKOMCBNZ2VRT6XKWW6";
        const sourceAccount = new Account(DEMO_ADDRESS, "0");
        const tx = new TransactionBuilder(
            sourceAccount,
            { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
        )
            .addOperation(contract.call(method, ...args))
            .setTimeout(0)
            .build();

        const simulation = await server.simulateTransaction(tx);

        if (rpc.Api.isSimulationSuccess(simulation)) {
            const retval = simulation.result.retval;
            if (!retval) return null;

            try {
                console.log(`Retval for ${method}:`, retval, typeof retval);

                // Force re-serialization to ensure proper XDR object
                let properScVal;
                if (typeof retval === 'string') {
                    properScVal = xdr.ScVal.fromXDR(retval, 'base64');
                } else if (retval && typeof retval.switch !== 'function' && typeof retval.toXDR === 'function') {
                    // It has data but lost prototype methods? Try to regen via toXDR
                    const xdrString = retval.toXDR('base64');
                    properScVal = xdr.ScVal.fromXDR(xdrString, 'base64');
                } else {
                    properScVal = retval;
                }

                return scValToNative(properScVal);
            } catch (convErr) {
                console.error(`Conversion error for ${method}:`, convErr, convErr.stack);
                // Last resort: try to extract raw value if it's a simple type
                if (retval._value !== undefined) return retval._value;
                return null;
            }
        }
        throw new Error(`Simulation failed for ${method}`);
    } catch (e) {
        console.error(`[Stellar Service] Error in invokeReadOnly for method ${method}:`, e);
        if (e.stack) console.error(e.stack);
        throw e;
    }
};

// Helper to check for transaction success
const checkTx = async (hash, attempts = 0) => {
    const tx = await server.getTransaction(hash);
    if (tx.status === "SUCCESS") return tx;
    if (tx.status === "FAILED") throw new Error(`Transaction failed: ${JSON.stringify(tx.resultXdr)}`);
    if (attempts > 30) throw new Error("Transaction timed out");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return checkTx(hash, attempts + 1);
};

export const deposit = async (userAddress, amount) => {
    return await invokeContract(YIELD_VAULT_ID, userAddress, "deposit", [
        { type: "address", value: userAddress },
        { type: "i128", value: BigInt(Math.floor(amount * 10 ** 7)) },
    ]);
};

export const redeem = async (userAddress, amount) => {
    return await invokeContract(YIELD_VAULT_ID, userAddress, "redeem", [
        { type: "address", value: userAddress },
        { type: "i128", value: BigInt(Math.floor(amount * 10 ** 7)) },
    ]);
};

// --- Pendle Wrapper Functions ---
export const wrapPendle = async (userAddress, amount) => {
    return await invokeContract(PENDLE_WRAPPER_ID, userAddress, "mint_split", [
        { type: "address", value: userAddress },
        { type: "i128", value: BigInt(Math.floor(amount * 10 ** 7)) },
    ]);
};

export const redeemPt = async (userAddress, amount) => {
    return await invokeContract(PENDLE_WRAPPER_ID, userAddress, "redeem_pt", [
        { type: "address", value: userAddress },
        { type: "i128", value: BigInt(Math.floor(amount * 10 ** 7)) },
    ]);
};

export const claimYield = async (userAddress) => {
    return await invokeContract(PENDLE_WRAPPER_ID, userAddress, "claim_yield", [
        { type: "address", value: userAddress },
    ]);
};

export const combineAndRedeem = async (userAddress, amount) => {
    return await invokeContract(PENDLE_WRAPPER_ID, userAddress, "combine_and_redeem", [
        { type: "address", value: userAddress },
        { type: "i128", value: BigInt(Math.floor(amount * 10 ** 7)) },
    ]);
};

export const getPendleBalances = async (userAddress) => {
    try {
        const pt = await invokeReadOnly(PENDLE_WRAPPER_ID, "get_pt_balance", [
            nativeToScVal(userAddress, { type: "address" })
        ]);
        const yt = await invokeReadOnly(PENDLE_WRAPPER_ID, "get_yt_balance", [
            nativeToScVal(userAddress, { type: "address" })
        ]);
        return { pt: scaleDown(pt), yt: scaleDown(yt) };
    } catch (e) {
        console.error("Error fetching Pendle balances:", e);
        return { pt: 0, yt: 0 };
    }
};

const scaleDown = (val) => {
    return (Number(val) / 10 ** 7).toFixed(4);
}


export const setRate = async (userAddress, newRate) => {
    return await invokeContract(YIELD_VAULT_ID, userAddress, "set_rate", [
        { type: "u64", value: newRate },
    ]);
}

const invokeContract = async (contractId, userAddress, method, args) => {
    try {
        const account = await server.getAccount(userAddress);
        const contract = new Contract(contractId);

        const scArgs = args.map(arg => {
            switch (arg.type) {
                case "i128":
                    return nativeToScVal(BigInt(arg.value), { type: "i128" });
                case "u64":
                    return nativeToScVal(Number(arg.value), { type: "u64" });
                case "address":
                    return new Address(arg.value).toScVal();
                case "bool":
                    return nativeToScVal(!!arg.value, { type: "bool" });
                default:
                    return nativeToScVal(arg.value, { type: arg.type });
            }
        });

        let tx = new TransactionBuilder(account, {
            fee: "10000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(contract.call(method, ...scArgs))
            .setTimeout(30)
            .build();

        // Use prepareTransaction (simulates + assembles)
        tx = await server.prepareTransaction(tx);

        const { signedTxXdr } = await signTransaction(tx.toXDR(), {
            networkPassphrase: NETWORK_PASSPHRASE,
        });

        const sentTx = await server.sendTransaction(
            TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
        );

        if (sentTx.status === "PENDING") {
            return await checkTx(sentTx.hash);
        }

        if (sentTx.status === "ERROR") {
            throw new Error(`Transaction failed: ${sentTx.errorResultXdr || "Unknown error"}`);
        }

        return sentTx;
    } catch (e) {
        console.error(`[invokeContract] Error originating in stellar.js calling ${method}:`, e);
        throw e;
    }
};
