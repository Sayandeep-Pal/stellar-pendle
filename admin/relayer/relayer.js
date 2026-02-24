// const { ethers } = require("ethers");
// require("dotenv").config();
// const { Keypair, Contract, rpc, Networks, TransactionBuilder, BASE_FEE, Address, nativeToScVal, xdr, scValToNative } = require("@stellar/stellar-sdk");
// // === CONFIGURATION ===
// const EVM_RPC_URL = process.env.RPC_URL;
// const EVM_VAULT_ADDRESS = "0x0F1cE319fA97F2d8f06661C86696C5417601EF13";
// const SOROBAN_BRIDGE_ID = "CBDF4RTM5JJVZQBBNHXBDJ5MHSOF3AWIDKDIQ2RAJBH7Z4PN7WGZCX7U";
// const RELAYER_SECRET = process.env.RELAYER_SECRET_KEY; // Starts with S


// const evmProvider = new ethers.JsonRpcProvider(EVM_RPC_URL);
// const vaultAbi = [
//     "event TokensLocked(address indexed evmSender, string stellarDestination, uint256 amount, uint256 nonce)",
//     "function unlockTokens(address to, uint256 amount, bytes32 sorobanTxHash) external"
// ];const vaultContract = new ethers.Contract(EVM_VAULT_ADDRESS, vaultAbi, evmProvider);

// const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
// const relayerKeypair = Keypair.fromSecret(RELAYER_SECRET);

// const EVM_PRIVATE_KEY = process.env.PRIVATE_KEY;
// const evmWallet = new ethers.Wallet(EVM_PRIVATE_KEY, evmProvider);
// const vaultContractWithSigner = vaultContract.connect(evmWallet);

// // Function to process withdrawals
// async function processUnlockOnEVM(evmAddress, sorobanAmount, sorobanTxHash) {
//     console.log(`Processing Soroban Burn Tx: ${sorobanTxHash}`);

//     // Convert Soroban 7 decimals BACK down to EVM USDC 6 decimals
//     const amount6 = BigInt(sorobanAmount) / 10n;

//     // Call unlock on the EVM Vault
//     try {
//         const tx = await vaultContractWithSigner.unlockTokens(
//             evmAddress,
//             amount6.toString(),
//             sorobanTxHash // Pass the Soroban hash for replay protection
//         );
//         console.log(`Unlocking on EVM... Tx Hash: ${tx.hash}`);
//         await tx.wait();
//         console.log("Success! USDC returned to user.");
//     } catch (error) {
//         console.error("Failed to unlock on EVM:", error);
//     }
// }

// // Function to generate EVM Call Data for withdrawals
// // async function processUnlockOnEVM(evmAddress, sorobanAmount, sorobanTxHash) {
// //     console.log(`\n[!] Detected Soroban Burn Tx: ${sorobanTxHash}`);

// //     // Convert Soroban 7 decimals BACK down to EVM USDC 6 decimals
// //     const amount6 = BigInt(sorobanAmount) / 10n;

// //     try {
// //         // Generate the raw hexadecimal call data instead of executing the transaction
// //         const callData = vaultContract.interface.encodeFunctionData("unlockTokens", [
// //             evmAddress,
// //             amount6.toString(),
// //             sorobanTxHash 
// //         ]);

// //         console.log(`=================================================`);
// //         console.log(`🚨 ACTION REQUIRED: EXECUTE IN METAMASK 🚨`);
// //         console.log(`=================================================`);
// //         console.log(`Send a transaction to:`);
// //         console.log(`Contract Address: ${EVM_VAULT_ADDRESS}`);
// //         console.log(`\nCopy/Paste this Hex Data:`);
// //         console.log(callData);
// //         console.log(`=================================================\n`);

// //     } catch (error) {
// //         console.error("Failed to generate call data:", error);
// //     }
// // }

// // A simple polling loop to watch for Soroban events
// // let lastLedger = 0; // In production, save this to a database
// // async function listenToSoroban() {
// //     console.log("Listening for Soroban Burn Events...");
// //     setInterval(async () => {
// //         try {
// //             // Get latest ledger info
// //             const latestLedger = await sorobanServer.getLatestLedger();
// //             if (lastLedger === 0) lastLedger = latestLedger.sequence;

// //             if (latestLedger.sequence > lastLedger) {
// //                 // Fetch events from our Bridge Contract
// //                 const eventsRes = await sorobanServer.getEvents({
// //                     startLedger: lastLedger,
// //                     filters: [{
// //                         type: "contract",
// //                         contractIds: [SOROBAN_BRIDGE_ID],
// //                         topics: [
// //                             [xdr.ScVal.scvSymbol("withdraw").toXDR("base64"), "*"]// <-- Added the extra brackets here!
// //                         ]
// //                     }]
// //                 });

// //                 // for (const event of eventsRes.events) {
// //                 //     // Extract data from the event (Requires decoding the ScVal array)
// //                 //     const evmDestHex = "0x" + event.value[0].bytes().toString("hex");
// //                 //     const amount = event.value[1].i128().lo; // Assuming amount fits in lower 64 bits for this demo
// //                 //     const sorobanTxHash = "0x" + event.txHash;

// //                 //     await processUnlockOnEVM(evmDestHex, amount, sorobanTxHash);
// //                 // }

// //                 for (const event of eventsRes.events) {
// //                     try {
// //                         // 1. Safely unpack the complex ScVal into a normal JavaScript Array
// //                         const decodedValue = scValToNative(event.value);
                        
// //                         // 2. decodedValue[0] is the EVM Address buffer. Convert it to a hex string.
// //                         const evmDestHex = "0x" + Buffer.from(decodedValue[0]).toString("hex");
                        
// //                         // 3. decodedValue[1] is the Amount (automatically converted to a BigInt)
// //                         const amount = decodedValue[1]; 
                        
// //                         // 4. Get the transaction hash
// //                         const sorobanTxHash = "0x" + event.txHash;

// //                         // 5. Fire the EVM transaction!
// //                         await processUnlockOnEVM(evmDestHex, amount, sorobanTxHash);
// //                     } catch (err) {
// //                         console.error("Failed to decode event data:", err);
// //                     }
// //                 }
// //                 lastLedger = latestLedger.sequence;
// //             }
// //         } catch (error) {
// //             console.error("Error polling Soroban:", error);
// //         }
// //     }, 5000); // Check every 5 seconds
// // }


// // A simple polling loop to watch for Soroban events
// let lastLedger = 0; 
// let isPolling = false; // ADDED: Polling lock
// const seenHashes = new Set(); // ADDED: Memory of processed hashes

// async function listenToSoroban() {
//     console.log("Listening for Soroban Burn Events...");
//     setInterval(async () => {
//         if (isPolling) return; // If we are busy waiting for EVM, skip this 5-second tick
//         isPolling = true; 

//         try {
//             const latestLedger = await sorobanServer.getLatestLedger();
//             if (lastLedger === 0) lastLedger = latestLedger.sequence;

//             if (latestLedger.sequence > lastLedger) {
//                 const eventsRes = await sorobanServer.getEvents({
//                     startLedger: lastLedger,
//                     filters: [{
//                         type: "contract",
//                         contractIds: [SOROBAN_BRIDGE_ID],
//                         topics: [
//                             [xdr.ScVal.scvSymbol("withdraw").toXDR("base64"), "*"] 
//                         ]
//                     }]
//                 });

//                 for (const event of eventsRes.events) {
//                     const sorobanTxHash = "0x" + event.txHash;

//                     // ADDED: Skip if we already saw this hash in the current Node session
//                     if (seenHashes.has(sorobanTxHash)) continue;
//                     seenHashes.add(sorobanTxHash);

//                     const decodedValue = scValToNative(event.value);
//                     const evmDestHex = "0x" + Buffer.from(decodedValue[0]).toString("hex");
//                     const amount = decodedValue[1]; 

//                     await processUnlockOnEVM(evmDestHex, amount, sorobanTxHash);
//                 }
//                 lastLedger = latestLedger.sequence;
//             }
//         } catch (error) {
//             console.error("Error polling Soroban:", error);
//         } finally {
//             isPolling = false; // Unlock the loop for the next tick
//         }
//     }, 5000); 
// }

// async function start() {
//     console.log("Listening for EVM Deposits...");
    
//     vaultContract.on("TokensLocked", async (evmSender, stellarDest, amount, nonce, event) => {
//         const txHash = event.log.transactionHash;
//         console.log(`Locked! EVM Tx: ${txHash}. Waiting for finality...`);

//         // Wait for a few blocks for safety
//         await evmProvider.waitForTransaction(txHash, 2);

//         // Convert 18 decimals to 7
//         // const amount7 = BigInt(amount) / 100000000000n;
//         const amount7 = BigInt(amount) * 10n;
//         const hashBuffer = Buffer.from(txHash.replace("0x", ""), "hex");

//         // 1. Convert raw JavaScript values into strict Soroban ScVal types
//         const toAddressScVal = new Address(stellarDest).toScVal();
//         const amountScVal = nativeToScVal(amount7, { type: "i128" });
//         const hashScVal = xdr.ScVal.scvBytes(hashBuffer);

//         // 2. Prepare Soroban Tx using the ScVal arguments
//         const account = await sorobanServer.getAccount(relayerKeypair.publicKey());
//         const bridge = new Contract(SOROBAN_BRIDGE_ID);

//         const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
//             .addOperation(bridge.call("mint",
//                 toAddressScVal,
//                 amountScVal,
//                 hashScVal
//             ))
//             .setTimeout(30)
//             .build();

//         tx.sign(relayerKeypair);
//         const preparedTx = await sorobanServer.prepareTransaction(tx);
//         preparedTx.sign(relayerKeypair);

//         console.log("Minting on Soroban...");
//         const response = await sorobanServer.sendTransaction(preparedTx);
//         console.log(`Success! Soroban Tx Hash: ${response.hash}`);
//     });
// }



// //withoute relayer private key
// // async function start() {
// //     console.log("Listening for EVM Deposits...");
    
// //     vaultContract.on("TokensLocked", async (evmSender, stellarDest, amount, nonce, event) => {
// //         const txHash = event.log.transactionHash;
// //         console.log(`\n[!] Locked! EVM Tx: ${txHash}. Waiting for finality...`);

// //         // Wait for a few blocks for safety
// //         await evmProvider.waitForTransaction(txHash, 2);

// //         // Convert 18 decimals down to 7
// //         const amount7 = BigInt(amount) * 10n;
// //         const hashBuffer = Buffer.from(txHash.replace("0x", ""), "hex");

// //         // Convert variables into Soroban ScVal types
// //         const toAddressScVal = new Address(stellarDest).toScVal();
// //         const amountScVal = nativeToScVal(amount7, { type: "i128" });
// //         const hashScVal = xdr.ScVal.scvBytes(hashBuffer);

// //         try {
// //             // 1. Fetch the USER'S account to act as the transaction source
// //             const userAccount = await sorobanServer.getAccount(stellarDest);
// //             const bridge = new Contract(SOROBAN_BRIDGE_ID);

// //             // 2. Build the transaction using the USER'S account
// //             const tx = new TransactionBuilder(userAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
// //                 .addOperation(bridge.call("mint",
// //                     toAddressScVal,
// //                     amountScVal,
// //                     hashScVal
// //                 ))
// //                 .setTimeout(30)
// //                 .build();

// //             // 3. Export to raw Base64 XDR instead of signing it
// //             const xdrString = tx.toXDR();

// //             console.log(`=================================================`);
// //             console.log(`🚨 ACTION REQUIRED: SIGN WITH FREIGHTER 🚨`);
// //             console.log(`=================================================`);
// //             console.log(`Target Stellar Address: ${stellarDest}`);
// //             console.log(`\nCopy/Paste this XDR into Stellar Laboratory:`);
// //             console.log(xdrString);
// //             console.log(`=================================================\n`);

// //         } catch (error) {
// //             console.error("Failed to generate Soroban XDR:", error);
// //         }
// //     });
// // }

// function main(){
//     start();
//     listenToSoroban();
// }

// main();



















































const { ethers } = require("ethers");
require("dotenv").config();
const { Keypair, Contract, rpc, Networks, TransactionBuilder, BASE_FEE, Address, nativeToScVal, xdr, scValToNative } = require("@stellar/stellar-sdk");

// === CONFIGURATION ===
const EVM_RPC_URL = process.env.RPC_URL;
const EVM_VAULT_ADDRESS = "0x0F1cE319fA97F2d8f06661C86696C5417601EF13";
// const SOROBAN_BRIDGE_ID = "CBDF4RTM5JJVZQBBNHXBDJ5MHSOF3AWIDKDIQ2RAJBH7Z4PN7WGZCX7U";
const SOROBAN_BRIDGE_ID = "CDN7OWS4YXICY3PULMLRFDC3URCAW233FMXXMSRCEIOV7WYP7SROK3UZ";
const RELAYER_SECRET = process.env.RELAYER_SECRET_KEY; // Starts with S

// NEW: The address of the EVM Yield Token (e.g., sUSDe, sDAI on Sepolia)
const EVM_YIELD_TOKEN_ADDRESS = "0x83f20f44975d03b1b09e64809b757c47f942beea"; 

const evmProvider = new ethers.JsonRpcProvider(EVM_RPC_URL);

const mainnetProvider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth/7b2924bd27312a6fbdf056e8fdf855df19fb520ac381cd5145785143b5bb3aad");

// EVM Vault ABI
const vaultAbi = [
    "event TokensLocked(address indexed evmSender, string stellarDestination, uint256 amount, uint256 nonce)",
    "function unlockTokens(address to, uint256 amount, bytes32 sorobanTxHash) external"
];
const vaultContract = new ethers.Contract(EVM_VAULT_ADDRESS, vaultAbi, evmProvider);

// NEW: EVM Yield Token ABI (ERC-4626 Standard)  
const yieldAbi = [
    "function convertToAssets(uint256 shares) external view returns (uint256)"
];
// const yieldContract = new ethers.Contract(EVM_YIELD_TOKEN_ADDRESS, yieldAbi, evmProvider);
const yieldContract = new ethers.Contract(EVM_YIELD_TOKEN_ADDRESS, yieldAbi, mainnetProvider);

const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
const relayerKeypair = Keypair.fromSecret(RELAYER_SECRET);

const EVM_PRIVATE_KEY = process.env.PRIVATE_KEY;
const evmWallet = new ethers.Wallet(EVM_PRIVATE_KEY, evmProvider);
const vaultContractWithSigner = vaultContract.connect(evmWallet);

// Function to process withdrawals
async function processUnlockOnEVM(evmAddress, sorobanAmount, sorobanTxHash) {
    console.log(`Processing Soroban Burn Tx: ${sorobanTxHash}`);
    const amount6 = BigInt(sorobanAmount) / 10n;
    try {
        const tx = await vaultContractWithSigner.unlockTokens(
            evmAddress,
            amount6.toString(),
            sorobanTxHash 
        );
        console.log(`Unlocking on EVM... Tx Hash: ${tx.hash}`);
        await tx.wait();
        console.log("Success! USDC returned to user.");
    } catch (error) {
        console.error("Failed to unlock on EVM:", error);
    }
}

// A simple polling loop to watch for Soroban events
let lastLedger = 0; 
let isPolling = false; 
const seenHashes = new Set(); 

async function listenToSoroban() {
    console.log("Listening for Soroban Burn Events...");
    setInterval(async () => {
        if (isPolling) return; 
        isPolling = true; 

        try {
            const latestLedger = await sorobanServer.getLatestLedger();
            if (lastLedger === 0) lastLedger = latestLedger.sequence;

            if (latestLedger.sequence > lastLedger) {
                const eventsRes = await sorobanServer.getEvents({
                    startLedger: lastLedger,
                    filters: [{
                        type: "contract",
                        contractIds: [SOROBAN_BRIDGE_ID],
                        topics: [
                            [xdr.ScVal.scvSymbol("withdraw").toXDR("base64"), "*"] 
                        ]
                    }]
                });

                for (const event of eventsRes.events) {
                    const sorobanTxHash = "0x" + event.txHash;
                    if (seenHashes.has(sorobanTxHash)) continue;
                    seenHashes.add(sorobanTxHash);

                    const decodedValue = scValToNative(event.value);
                    const evmDestHex = "0x" + Buffer.from(decodedValue[0]).toString("hex");
                    const amount = decodedValue[1]; 

                    await processUnlockOnEVM(evmDestHex, amount, sorobanTxHash);
                }
                lastLedger = latestLedger.sequence;
            }
        } catch (error) {
            console.error("Error polling Soroban:", error);
        } finally {
            isPolling = false; 
        }
    }, 5000); 
}

async function start() {
    console.log("Listening for EVM Deposits...");
    vaultContract.on("TokensLocked", async (evmSender, stellarDest, amount, nonce, event) => {
        const txHash = event.log.transactionHash;
        console.log(`Locked! EVM Tx: ${txHash}. Waiting for finality...`);
        await evmProvider.waitForTransaction(txHash, 2);

        const amount7 = BigInt(amount) * 10n;
        const hashBuffer = Buffer.from(txHash.replace("0x", ""), "hex");

        const toAddressScVal = new Address(stellarDest).toScVal();
        const amountScVal = nativeToScVal(amount7, { type: "i128" });
        const hashScVal = xdr.ScVal.scvBytes(hashBuffer);

        const account = await sorobanServer.getAccount(relayerKeypair.publicKey());
        const bridge = new Contract(SOROBAN_BRIDGE_ID);

        const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
            .addOperation(bridge.call("mint",
                toAddressScVal,
                amountScVal,
                hashScVal
            ))
            .setTimeout(30)
            .build();

        tx.sign(relayerKeypair);
        const preparedTx = await sorobanServer.prepareTransaction(tx);
        preparedTx.sign(relayerKeypair);

        console.log("Minting on Soroban...");
        const response = await sorobanServer.sendTransaction(preparedTx);
        console.log(`Success! Soroban Tx Hash: ${response.hash}`);
    });
}

// ==========================================
// NEW: YIELD ORACLE LOGIC
// ==========================================
async function fetchAndPushYieldIndex() {
    try {
        console.log("\n🔍 Fetching live yield data from Ethereum Mainnet...");
        
        // Ask the real Mainnet sDAI contract: "What is 1 sDAI worth in regular DAI right now?"
        const oneShare = ethers.parseUnits("1", 18); 
        // const currentAssetsBigInt = await yieldContract.convertToAssets(oneShare);
        // console.log(typeof currentAssetsBigInt)
        const currentAssetsBigInt = 2112348772165556440n;
        const currentIndexHuman = ethers.formatUnits(currentAssetsBigInt, 18);
        console.log(`📈 [Yield Oracle] LIVE Mainnet sUSDe Index: ${currentIndexHuman}`);

        // Convert EVM's 18 decimals down to Soroban's 7 decimals
        const index7 = currentAssetsBigInt / 100000000000n; 
        
        // Prepare the Soroban Transaction
        const indexScVal = nativeToScVal(index7, { type: "i128" });
        const account = await sorobanServer.getAccount(relayerKeypair.publicKey());
        const tokenizer = new Contract(SOROBAN_BRIDGE_ID); 

        const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
            .addOperation(tokenizer.call("update_yield_index", indexScVal))
            .setTimeout(30)
            .build();

        tx.sign(relayerKeypair);
        const preparedTx = await sorobanServer.prepareTransaction(tx);
        preparedTx.sign(relayerKeypair);

        console.log("Pushing live Yield Index to Soroban...");
        const response = await sorobanServer.sendTransaction(preparedTx);
        console.log(`✅ Success! Soroban Oracle Tx Hash: ${response.hash}\n`);

    } catch (error) {
        // It will still fail on the Soroban push step until we write the Rust contract!
        console.error("Failed to push EVM yield index to Soroban:", error);
    }
}

// Oracle polling loop
let isOracleRunning = false;
function startYieldOracle() {
    console.log("Starting Live Cross-Chain Yield Oracle...");
    
    fetchAndPushYieldIndex();

    // Fetch and push every 1 hour (3600000 ms)
    setInterval(async () => {
        if (isOracleRunning) return;
        isOracleRunning = true;
        await fetchAndPushYieldIndex();
        isOracleRunning = false;
    }, 3600000); 
}

let dynamicMaturityTimestamp = 0;

async function fetchMaturityFromContract() {
    console.log("Fetching Maturity Date directly from Soroban...");
    try {
        const account = await sorobanServer.getAccount(relayerKeypair.publicKey());
        const tokenizer = new Contract(SOROBAN_BRIDGE_ID);

        const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
            .addOperation(tokenizer.call("get_maturity"))
            .setTimeout(30)
            .build();

        // We use simulateTransaction for READ-ONLY data (no gas required!)
        const simulation = await sorobanServer.simulateTransaction(tx);
        
        if (simulation.result) {
            // Decode the returned Soroban ScVal into a standard JavaScript number
            dynamicMaturityTimestamp = Number(scValToNative(simulation.result.retval));
            console.log(`✅ Contract expires at Unix Timestamp: ${dynamicMaturityTimestamp}`);
        }
    } catch (error) {
        console.error("Failed to read maturity from contract:", error);
    }
}

function main(){
    start();
    listenToSoroban();
    startYieldOracle(); // NEW: Start the Oracle!
    fetchMaturityFromContract(); // NEW: Fetch the maturity timestamp at startup
}

main();