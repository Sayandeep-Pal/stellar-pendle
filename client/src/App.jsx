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

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import VaultPage from './pages/VaultPage';
import MarketsPage from './pages/MarketsPage';
import MarketplacePage from './pages/MarketplacePage';
import AdminPage from './pages/AdminPage'; // Added AdminPage
import TradePage from './pages/TradePage';
import ReturnToggle from './components/ReturnToggle';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
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
      {!isLandingPage && <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>}

      {/* Navbar Component */}
      {!isLandingPage && (
        <Navbar address={address} handleConnect={handleConnect} />
      )}

      {/* Mobile Nav */}
      {/* {!isLandingPage && (
        <nav className="md:hidden flex w-full justify-center gap-4 mb-4 relative z-10">
          <Link to="/" className="text-white">Home</Link> */}
          {/* <Link to="/vault" className="text-white">Vault</Link> */}
          {/* <Link to="/markets" className="text-white">Markets</Link>
          <Link to="/marketplace" className="text-white">Marketplace</Link  >
        </nav>
      )} */}

      {/* Return Toggle Pill - Example Usage if needed separately, otherwise can remove if it was only for Navbar, 
          but usually the user might want it for the page content too. 
          Leaving commented out as requested "instead of old nav use this".
          Wait, user said "instead of the old *Navigation* glass pill section use the updated one".
          So I've done that in Navbar. The separate ReturnToggle usage (for leveraging/fixed) might still be desired on the page itself?
          I will leave the standalone one visible if the user wants it, but for now the user specifically asked to use it FOR navigation.
      */}
      {/* 
      {!isLandingPage && (
         <ReturnToggle onToggle={(mode) => console.log('Switched to:', mode)} />
      )}
      */}

      {!isLandingPage && error && (
        <div className="w-[90%] max-w-[600px] mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm relative z-10">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="w-full relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/vault" element={
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/trade" element={
            <TradePage
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
