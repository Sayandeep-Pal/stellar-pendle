import { useState } from 'react';
import { ethers } from 'ethers';
import { requestAccess, signTransaction } from '@stellar/freighter-api';
import { Contract, rpc, Networks, TransactionBuilder, BASE_FEE, Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import './App.css';

// === CONFIGURATION ===
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
const EVM_VAULT_ADDRESS = "0x0F1cE319fA97F2d8f06661C86696C5417601EF13"; // Your Vault
const SOROBAN_BRIDGE_ID = "CDN7OWS4YXICY3PULMLRFDC3URCAW233FMXXMSRCEIOV7WYP7SROK3UZ"; // Your Soroban Bridge

const vaultAbi = [
  "function lockTokens(uint256 _amount, string calldata _stellarDestination) external"
];
const usdcAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");

// Utility to convert hex strings without relying on Node's Buffer (fixes Vite issues)
const hexToUint8Array = (hexString) => {
  const hex = hexString.replace(/^0x/, '');
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
      array[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return array;
};

export default function App() {
  const [evmAccount, setEvmAccount] = useState("");
  const [freighterAccount, setFreighterAccount] = useState("");
  const [status, setStatus] = useState("Awaiting action...");

  // Form States
  const [depositAmount, setDepositAmount] = useState("1");
  const [withdrawAmount, setWithdrawAmount] = useState("1");

  // === WALLET CONNECTIONS ===
  const connectMetaMask = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    setEvmAccount(await signer.getAddress());
  };

  const connectFreighter = async () => {
    try {
      const access = await requestAccess();
      
      // If the user rejects the popup, alert them
      if (access.error) {
        return alert(`Freighter Error: ${access.error}`);
      }

      // Safely extract the string address from the response object
      const userAddress = typeof access === 'string' ? access : access.address;
      setFreighterAccount(userAddress);

    } catch (e) {
      alert("Please install and unlock Freighter, and set it to Testnet.");
    }
  };

  // === 1. DEPOSIT: EVM TO SOROBAN ===
  const handleDeposit = async () => {
    if (!evmAccount || !freighterAccount) return alert("Connect both wallets first!");
    setStatus("Initiating Deposit on Ethereum...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, signer);
      const vault = new ethers.Contract(EVM_VAULT_ADDRESS, vaultAbi, signer);

      // 6 decimals for EVM USDC
      const amount6 = ethers.parseUnits(depositAmount, 6);

      setStatus("1/2: Approving USDC... Please confirm in MetaMask.");
      const approveTx = await usdc.approve(EVM_VAULT_ADDRESS, amount6);
      await approveTx.wait();

      setStatus("2/2: Locking tokens... Please confirm in MetaMask.");
      const lockTx = await vault.lockTokens(amount6, freighterAccount);
      await lockTx.wait();

      setStatus(`Deposit complete! Tx: ${lockTx.hash}. Watch your Relayer terminal!`);
    } catch (error) {
      console.error(error);
      setStatus("Deposit failed. See console.");
    }
  };

  // === 2. WITHDRAW: SOROBAN TO EVM ===
  const handleWithdraw = async () => {
    if (!evmAccount || !freighterAccount) return alert("Connect both wallets first!");
    setStatus("Initiating Withdrawal on Soroban...");

    try {
      // 7 decimals for Soroban stsUSDC
      const amount7 = BigInt(parseFloat(withdrawAmount) * 10000000);

      // Convert variables to ScVal
      const fromScVal = new Address(freighterAccount).toScVal();
      const amountScVal = nativeToScVal(amount7, { type: "i128" });
      const evmDestScVal = xdr.ScVal.scvBytes(hexToUint8Array(evmAccount)); // Automatically strips 0x

      // Fetch User Account Details
      const account = await sorobanServer.getAccount(freighterAccount);
      const bridge = new Contract(SOROBAN_BRIDGE_ID);

      // Build the raw transaction
      setStatus("Simulating transaction to build footprint...");
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(bridge.call("withdraw", fromScVal, amountScVal, evmDestScVal))
        .setTimeout(30)
        .build();

      // CRITICAL: This prepareTransaction call fixes your tx_malformed error!
      // const preparedTx = await sorobanServer.prepareTransaction(tx);

      // setStatus("Please sign the transaction in the Freighter popup.");
      // const signedXdr = await signTransaction(preparedTx.toXDR(), {
      //   network: "TESTNET",
      //   accountToSign: freighterAccount,
      // });

      // setStatus("Submitting to Stellar network...");
      // const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      // const response = await sorobanServer.sendTransaction(signedTx);

      // setStatus(`Withdrawal submitted! Hash: ${response.hash}. Watch your Relayer terminal!`);


      const preparedTx = await sorobanServer.prepareTransaction(tx);

      setStatus("Please sign the transaction in the Freighter popup.");
      
      // FIX 1: Explicitly pass the networkPassphrase to Freighter
      const signedResponse = await signTransaction(preparedTx.toXDR(), {
        network: "TESTNET",
        networkPassphrase: Networks.TESTNET,
        address: freighterAccount // Using 'address' instead of 'accountToSign'
      });

      // Catch if the user clicks "Reject" in the popup
      if (signedResponse.error) {
        return setStatus(`Freighter Error: ${signedResponse.error}`);
      }

      setStatus("Submitting to Stellar network...");
      
      // FIX 2: Extract the .signedTxXdr string from the response object
      const signedTx = TransactionBuilder.fromXDR(signedResponse.signedTxXdr, Networks.TESTNET);
      
      const response = await sorobanServer.sendTransaction(signedTx);

      setStatus(`Withdrawal submitted! Hash: ${response.hash}. Watch your Relayer terminal!`);
    } catch (error) {
      console.error(error);
      setStatus("Withdrawal failed. See console.");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🌉 Cross-Chain Bridge Tester</h2>
      
      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
        <strong>Status Logs:</strong> {status}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        <button onClick={connectMetaMask}>
          {evmAccount ? `MetaMask: ${evmAccount.substring(0, 6)}...` : "Connect MetaMask"}
        </button>
        <button onClick={connectFreighter}>
          {freighterAccount ? `Freighter: ${freighterAccount.substring(0, 6)}...` : "Connect Freighter"}
        </button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "20px", borderRadius: "8px" }}>
        <h3>Lock (Sepolia EVM ➔ Soroban)</h3>
        <p>Locks USDC and mints stsUSDC to your Freighter wallet.</p>
        <input 
          type="number" 
          value={depositAmount} 
          onChange={e => setDepositAmount(e.target.value)} 
          placeholder="Amount of USDC"
        />
        <button onClick={handleDeposit} style={{ marginLeft: "10px" }}>Deposit</button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
        <h3>Redeem (Soroban ➔ Sepolia EVM)</h3>
        <p>Burns stsUSDC in Freighter and unlocks USDC to your MetaMask.</p>
        <input 
          type="number" 
          value={withdrawAmount} 
          onChange={e => setWithdrawAmount(e.target.value)} 
          placeholder="Amount of stsUSDC"
        />
        <button onClick={handleWithdraw} style={{ marginLeft: "10px" }}>Withdraw</button>
      </div>
    </div>
  );
}