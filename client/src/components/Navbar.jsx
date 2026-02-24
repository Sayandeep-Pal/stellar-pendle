import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReturnToggle from './ReturnToggle';

const Navbar = ({ address, handleConnect }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveTab('home');
    else if (path === '/vault') setActiveTab('vault');
    else if (path === '/markets') setActiveTab('markets');
    else if (path === '/marketplace') setActiveTab('marketplace');
    else if (path === '/trade') setActiveTab('trade');
    else if (path === '/admin') setActiveTab('admin');
  }, [location]);

  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') navigate('/');
    else if (tabId === 'vault') navigate('/vault');
    else if (tabId === 'markets') navigate('/markets');
    else if (tabId === 'marketplace') navigate('/marketplace');
    else if (tabId === 'trade') navigate('/trade');
    else if (tabId === 'admin') navigate('/admin');
  };

  const navOptions = [
    { id: 'home', label: 'Home' },
    { id: 'markets', label: 'Derivatives' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'trade', label: 'Trade' },
  ];

  return (
    /* ── Rail: sticky glass strip ─────────────────────────── */
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'glass-rail' : ''}`}
    >
      <div className="w-full max-w-[1400px] mx-auto flex justify-between items-center py-5 px-6 sm:px-8">

        {/* ── Logo / Brand ─────────────────────────────────── */}
        <div
          className="flex items-center gap-3.5 group cursor-pointer select-none"
          onClick={() => navigate('/')}
        >
          {/* Icon orb */}
          <div
            className="glass-orb relative w-11 h-11 rounded-2xl flex items-center justify-center
                       transition-all duration-400 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(226,255,55,0.15)]"
          >
            <img
              src="/spield_logomain.png"
              alt="Speild"
              className="w-6 h-6 object-contain relative z-10
                         filter drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]
                         transition-all duration-500 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-black tracking-tighter text-white italic leading-none
                             transition-all duration-300 group-hover:text-white/90">
              Spield
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              {['Fixed Returns', 'High Leverage'].map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[9px] text-text-dim font-bold tracking-[0.08em] uppercase">
                  <span
                    className="w-1 h-1 rounded-full bg-accent-neon animate-pulse"
                    style={{ boxShadow: '0 0 5px rgba(226,255,55,0.8)' }}
                  />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Nav pill (ReturnToggle — already has 3D glass) ── */}
        <div className="hidden md:block">
          <ReturnToggle
            options={navOptions}
            activeId={activeTab}
            onToggle={handleNavigation}
          />
        </div>

        {/* ── Connect Wallet Button ─────────────────────────── */}
        {address ? (
          /* Connected state — glass-3d-btn with neon pulse dot */
          <button
            onClick={handleConnect}
            className="glass-3d-btn flex items-center gap-2.5 px-5 py-2.5 rounded-2xl
                       text-[10px] font-black uppercase tracking-[0.15em] text-white"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse flex-shrink-0"
              style={{ boxShadow: '0 0 10px rgba(226,255,55,0.9)' }}
            />
            {address.slice(0, 6)}…{address.slice(-4)}
          </button>
        ) : (
          /* Disconnected state — glass-neon-btn CTA */
          <button
            onClick={handleConnect}
            className="glass-neon-btn px-5 py-2.5 rounded-2xl
                       text-[10px] font-black uppercase tracking-[0.18em]"
          >
            Connect Wallet
          </button>
        )}

      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden border-t border-white/[0.05] px-4 pb-3 pt-2 flex justify-center">
        <ReturnToggle
          options={navOptions}
          activeId={activeTab}
          onToggle={handleNavigation}
        />
      </div>
    </header>
  );
};

export default Navbar;
