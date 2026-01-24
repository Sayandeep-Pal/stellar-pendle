import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import {
  connectWallet,
  getBalance,
  getRate,
  getContractMetadata,
  getPendleBalances
} from './lib/stellar';

import VaultPage from './pages/VaultPage';
import MarketsPage from './pages/MarketsPage';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0');
  const [pendleBalances, setPendleBalances] = useState({ pt: '0', yt: '0' });
  const [rate, setRateValue] = useState(1000);
  const [metadata, setMetadata] = useState({ name: 'Loading...', symbol: '...' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setError(null);
    try {
      console.log("Attempting to connect wallet...");
      const addressString = await connectWallet();
      console.log("Wallet connected:", addressString);
      if (typeof addressString === 'string') {
        setAddress(addressString);
      } else if (addressString && addressString.address) {
        setAddress(addressString.address);
      } else {
        setError('No address found. Please unlock Freighter.');
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError('Failed to connect wallet. Ensure Freighter is installed and on Testnet.');
    }
  };

  const refreshData = async () => {
    if (!address) return;
    try {
      const bal = await getBalance(address);
      setBalance((Number(bal) / 10 ** 7).toFixed(4));

      const pBal = await getPendleBalances(address);
      setPendleBalances(pBal);
    } catch (err) {
      console.error("Data refresh error:", err);
    }
  };

  const updateRate = async () => {
    try {
      const r = await getRate();
      setRateValue(r);
    } catch (err) {
      console.error("Rate refresh error:", err);
    }
  };

  const loadMetadata = async () => {
    try {
      const meta = await getContractMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error("Metadata load error:", err);
    }
  };

  useEffect(() => {
    loadMetadata();
    updateRate();
    const rateInterval = setInterval(updateRate, 5000);
    return () => clearInterval(rateInterval);
  }, []);

  useEffect(() => {
    if (address) {
      refreshData();
      const balInterval = setInterval(refreshData, 15000);
      return () => clearInterval(balInterval);
    }
  }, [address]);

  return (
    <div className="app-container">
      <header>
        <div className="logo-text">StellarPendle</div>

        {/* Navigation */}
        <nav style={{ display: 'flex' }}>
          <NavLink to="/">Yield Vault</NavLink>
          <NavLink to="/markets">Markets (LP)</NavLink>
        </nav>

        <button className="connect-btn" onClick={handleConnect}>
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <Routes>
        <Route path="/" element={
          <VaultPage
            address={address}
            balance={balance}
            rate={rate}
            metadata={metadata}
            refreshData={refreshData}
            setLoading={setLoading}
            loading={loading}
            setError={setError}
          />
        } />
        <Route path="/markets" element={
          <MarketsPage
            address={address}
            pendleBalances={pendleBalances}
            refreshData={refreshData}
            setLoading={setLoading}
            loading={loading}
            setError={setError}
          />
        } />
      </Routes>

      {!address && (
        <div className="card" style={{ textAlign: 'center', gridColumn: '1 / -1', marginTop: '2rem' }}>
          <h2>Welcome to Stellar Pendle</h2>
          <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
            Connect your Freighter wallet to start earning yield on the Stellar network.
          </p>
          <button
            className="connect-btn"
            style={{ marginTop: '2rem', padding: '1rem 3rem' }}
            onClick={handleConnect}
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
