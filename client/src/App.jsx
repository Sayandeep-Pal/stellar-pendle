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
import MarketplacePage from './pages/MarketplacePage';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-white bg-white/10 shadow-[0_4px_20px_rgba(255,255,255,0.05)] border border-white/10' : 'text-text-dim hover:text-white'}`}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0');
  const [pendleBalances, setPendleBalances] = useState({ pt: '0', yt: '0', wxl: '0' });
  const [rate, setRateValue] = useState(1000);
  const [metadata, setMetadata] = useState({ name: 'Loading...', symbol: '...' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const addressString = await connectWallet();
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
      const scaledBal = (Number(bal) / 10 ** 7).toFixed(4);
      setBalance(scaledBal);

      const pBal = await getPendleBalances(address);
      setPendleBalances({ ...pBal, wxl: scaledBal });
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
    <div className="w-full min-h-screen flex flex-col items-center relative overflow-hidden bg-app-bg">
      {/* Background Decorative Dots / Grain */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      {/* Navbar */}
      <header className="w-full max-w-[1400px] flex justify-between items-center py-10 px-8 relative z-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-base shadow-xl group-hover:bg-accent-neon group-hover:text-black transition-all duration-500">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white italic">StellarPendle</span>
            <span className="text-[9px] text-text-dim font-bold tracking-[0.4em] uppercase">Maximizing Your Returns</span>
          </div>
        </div>

        {/* Navigation Glass Pill */}
        <nav className="hidden md:flex bg-white/5 backdrop-blur-md p-1.5 gap-2 rounded-[24px] border border-white/5 shadow-2xl">
          <NavLink to="/">Vault</NavLink>
          <NavLink to="/markets">Derivatives</NavLink>
          <NavLink to="/marketplace">Marketplace</NavLink>
        </nav>

        {/* Connect Button */}
        <button
          className={`relative group/conn overflow-hidden rounded-2xl transition-all duration-300 px-6 py-3 border ${address ? 'bg-white/5 border-white/10' : 'bg-white text-black hover:bg-accent-neon'}`}
          onClick={handleConnect}
        >
          {address ? (
            <span className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse shadow-[0_0_10px_rgba(226,255,55,1)]"></div>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          ) : (
            <span className="relative font-black text-[10px] uppercase tracking-[0.2em]">Connect Wallet</span>
          )}
        </button>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden flex w-full justify-center gap-4 mb-4 relative z-10">
        <NavLink to="/">Vault</NavLink>
        <NavLink to="/markets">Markets</NavLink>
      </nav>

      {error && (
        <div className="w-[90%] max-w-[600px] mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm relative z-10">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="w-full relative z-10">
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
          <Route path="/marketplace" element={
            <MarketplacePage
              address={address}
              pendleBalances={pendleBalances}
              refreshData={refreshData}
              setLoading={setLoading}
              loading={loading}
              setError={setError}
            />
          } />
        </Routes>
      </div>
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
