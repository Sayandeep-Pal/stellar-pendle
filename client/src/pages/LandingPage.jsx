import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Scroll-trigger hook ──────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  /* scroll-triggered refs */
  const [tickerRef, tickerInView] = useInView(0.05);
  const [howRef, howInView] = useInView(0.1);
  const [chartRef, chartInView] = useInView(0.1);
  const [featRef, featInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.15);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLaunch = (path) => {
    setIsExiting(true);
    setTimeout(() => navigate(path), 1400);
  };

  const STATS = [
    { label: 'Total Value Locked', value: '$2.4B', change: '+12.3%' },
    { label: 'Active Markets', value: '847', change: '+24' },
    { label: 'Yield Captured', value: '$148M', change: '+5.7%' },
    { label: 'Avg Fixed APY', value: '8.92%', change: '+0.2%' },
    { label: 'Protocol Users', value: '32,941', change: '+891' },
    { label: 'Stellar Txns', value: '1.2M', change: '+44K' },
  ];

  const STEPS = [
    {
      num: '01',
      title: 'Discover',
      sub: 'Browse Live Markets',
      desc: 'Explore curated yield markets across Stellar assets — USDC, XLM, and more — all managed by the protocol. No deposits required.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      ),
      color: 'rgba(139,92,246,0.5)',
      glow: 'rgba(139,92,246,0.15)',
    },
    {
      num: '02',
      title: 'Choose',
      sub: 'PT or YT Position',
      desc: 'Pick your strategy. Buy PT to lock in a guaranteed fixed APY until maturity. Buy YT for amplified exposure to the floating yield rate.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M16 3h5v5" /><path d="M8 3H3v5" />
          <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
          <path d="M12 22v-8.3a4 4 0 0 1 1.172-2.872L21 3" />
        </svg>
      ),
      color: 'rgba(255,255,255,0.5)',
      glow: 'rgba(255,255,255,0.08)',
    },
    {
      num: '03',
      title: 'Profit',
      sub: 'Redeem or Trade',
      desc: 'PT holders redeem at full par value at maturity. YT holders collect all accrued yield. Trade either token freely in the open market at any time.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
      color: 'rgba(226,255,55,0.5)',
      glow: 'rgba(226,255,55,0.12)',
    },
  ];

  const FEATURES = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      tag: 'Security',
      title: 'Trust-Minimized',
      desc: 'All positions governed by immutable on-chain Stellar contracts. No intermediaries, no custodial risk.',
      accentColor: 'rgba(59,130,246,0.22)',
      borderAccent: 'rgba(59,130,246,0.35)',
      tagColor: 'rgba(59,130,246,0.7)',
      glowColor: 'rgba(59,130,246,0.08)',
      stat: '100% on-chain',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      tag: 'Performance',
      title: 'Stellar-Native Speed',
      desc: '5-second finality. Sub-cent transaction fees. No bridges needed — built directly on Stellar for native performance.',
      accentColor: 'rgba(226,255,55,0.12)',
      borderAccent: 'rgba(226,255,55,0.28)',
      tagColor: 'rgba(226,255,55,0.7)',
      glowColor: 'rgba(226,255,55,0.06)',
      stat: '$0.001 / tx',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      tag: 'Architecture',
      title: 'Non-Custodial',
      desc: 'Permissionless yield markets open to any wallet. Connect, split, and trade without any KYC or approval process.',
      accentColor: 'rgba(168,85,247,0.15)',
      borderAccent: 'rgba(168,85,247,0.32)',
      tagColor: 'rgba(168,85,247,0.7)',
      glowColor: 'rgba(168,85,247,0.07)',
      stat: 'Self-sovereign',
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050507] text-white overflow-hidden font-['Inter'] selection:bg-[#E2FF37] selection:text-black">

      {/* ── Transition Shutter ─────────────────────────────── */}
      <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none">
        <div className={`flex-1 bg-[#050507] transition-transform duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)]
          ${isExiting ? 'translate-y-0' : '-translate-y-full'}`} />
        <div className={`flex-1 bg-[#050507] transition-transform duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)]
          ${isExiting ? 'translate-y-0' : 'translate-y-full'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full
          h-[2px] bg-white shadow-[0_0_150px_rgba(255,255,255,1)] z-10 transition-all duration-700 delay-300
          ${isExiting ? 'max-w-full opacity-100' : 'max-w-[0px] opacity-0'}`} />
      </div>

      {/* ── Film-grain texture ─────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Ambient background ─────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full
          bg-[radial-gradient(closest-side,rgba(255,255,255,0.04),transparent)] blur-[120px] mix-blend-overlay" />

        <div
          className="absolute bottom-[-40%] left-1/2 -translate-x-1/2 w-[120vw] h-[80vh]
            rounded-[100%] opacity-70 blur-[100px] transition-all duration-1000 ease-in-out"
          style={{
            background: hoveredSide === 'left'
              ? 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)'
              : hoveredSide === 'right'
              ? 'radial-gradient(circle, rgba(226,255,55,0.18) 0%, rgba(226,255,55,0.04) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(160,160,160,0.06) 30%, transparent 70%)',
          }}
        />

        {/* Stellar orbit rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[60vw] h-[60vw] border border-white/[0.04] rounded-full animate-[spin_120s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[85vw] h-[85vw] border border-white/[0.025] rounded-full animate-[spin_200s_linear_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[110vw] h-[110vw] border border-white/[0.015] rounded-full animate-[spin_280s_linear_infinite]" />

        {/* Mouse follower glow */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: mousePos.x - 300,
            top: mousePos.y - 300,
            background: hoveredSide === 'left'
              ? 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)'
              : hoveredSide === 'right'
              ? 'radial-gradient(circle, rgba(226,255,55,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav
        className="relative z-40 px-6 sm:px-10 py-6 flex justify-between items-center max-w-[1400px] mx-auto"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(-12px)',
          transition: 'opacity 0.7s cubic-bezier(0.19,1,0.22,1), transform 0.7s cubic-bezier(0.19,1,0.22,1)',
        }}
      >
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
          {/* Glass-orb icon container — matches Navbar.jsx treatment */}
          <div
            className="glass-orb relative w-11 h-11 rounded-2xl flex items-center justify-center
                       transition-all duration-400 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(226,255,55,0.15)]"
          >
            <img
              src="/spield_logomain.png"
              alt="Speild"
              className="w-6 h-6 object-contain relative z-10
                         transition-all duration-500
                         drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]
                         group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            />
          </div>
        </div>

        <button
          onClick={() => handleLaunch('/marketplace')}
          className="glass-3d-btn hidden md:flex items-center px-6 py-2.5 rounded-full
            text-[10px] font-black uppercase tracking-[0.18em] text-white/80 hover:text-white"
        >
          Launch App
          <svg className="w-3 h-3 ml-2 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 pb-20">

        <div
          className="text-center relative mb-14 space-y-5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.19,1,0.22,1) 100ms, transform 0.8s cubic-bezier(0.19,1,0.22,1) 100ms',
          }}
        >
          <div
            className="glass-3d inline-flex items-center gap-3.5 px-5 py-2.5 rounded-full mb-4 cursor-default"
            style={{ borderRadius: '100px' }}
          >
            <div className="relative flex items-center justify-center w-4 h-4">
              <div className="absolute inset-0 bg-white blur-md opacity-40 animate-pulse rounded-full" />
              <svg className="w-3 h-3 relative z-10" viewBox="0 0 24 24" fill="none">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="white" />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/40 leading-none">
              Built on{' '}
              <span className="font-black text-white tracking-[0.15em]" style={{ textShadow: '0 0 10px rgba(255,255,255,0.6)' }}>
                STELLAR
              </span>
            </span>
          </div>

          <h1 className="text-8xl md:text-[10rem] font-medium tracking-tighter leading-[0.8] mix-blend-screen select-none">
            <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-600 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              SPLIT
            </span>
            <span className="block md:inline text-neutral-800">,</span>
            <br className="hidden md:block" />
            <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-b from-neutral-500 via-neutral-200 to-white drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              YIELD.
            </span>
          </h1>
        </div>

        {/* ── Hero Split Cards ───────────────────────────────── */}
        <div
          className="relative w-full max-w-6xl flex flex-col md:flex-row gap-5 items-stretch justify-center"
          style={{
            perspective: '2000px',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(28px)',
            transition: 'opacity 0.9s cubic-bezier(0.19,1,0.22,1) 250ms, transform 0.9s cubic-bezier(0.19,1,0.22,1) 250ms',
          }}
        >
          {/* PT card */}
          <div
            onMouseEnter={() => setHoveredSide('left')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={() => handleLaunch('/marketplace')}
            className={`glass-hero-card group relative flex-1 min-h-[300px] w-full rounded-[32px] cursor-pointer
              transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
              ${hoveredSide === 'right' ? 'opacity-35 scale-[0.95] blur-[1.5px]' : 'opacity-100 scale-100'}
              ${hoveredSide === 'left' ? 'scale-[1.025] -translate-y-3 !opacity-100 z-20' : ''}
            `}
            style={hoveredSide === 'left' ? {
              borderTopColor:  'rgba(59,130,246,0.3)',
              borderLeftColor: 'rgba(59,130,246,0.2)',
              boxShadow: `0 48px 96px -12px rgba(0,0,0,0.95),0 20px 40px rgba(0,0,0,0.65),0 0 0 1px rgba(0,0,0,0.65) inset,0 1px 0 rgba(255,255,255,0.1) inset,0 0 60px rgba(59,130,246,0.10)`,
            } : undefined}
          >
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-blue-900/10 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-[55%] rounded-b-[32px] bg-gradient-to-t
              from-blue-900/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-blue-400/70 mb-2 block">Enterprise Strategy</span>
                  <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight group-hover:text-blue-200 transition-colors duration-500">
                    Fixed Yield
                  </h3>
                </div>
                <div className="glass-orb w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                  group-hover:bg-blue-500/30 group-hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                  style={hoveredSide === 'left' ? { borderTopColor: 'rgba(59,130,246,0.35)', borderLeftColor: 'rgba(59,130,246,0.25)' } : undefined}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70 group-hover:text-blue-300 transition-colors duration-400">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-5">
                <div className="h-px w-full bg-white/8 overflow-hidden rounded-full">
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-400
                    -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </div>
                <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[88%]">
                  Lock in rates today. Remove volatility. Ideal for treasury management and predictable scaling.
                </p>
                <div className="inline-flex">
                  <span className="glass-3d-btn px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em] text-blue-300/80 group-hover:text-blue-200">
                    Buy PT →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center divider */}
          <div className="hidden md:flex items-center justify-center w-16 relative z-20 flex-shrink-0">
            <div className={`w-px bg-gradient-to-b from-transparent via-white/15 to-transparent transition-all duration-500
              ${hoveredSide ? 'h-0 opacity-0' : 'h-28 opacity-100'}`} />
          </div>

          {/* YT card */}
          <div
            onMouseEnter={() => setHoveredSide('right')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={() => handleLaunch('/markets')}
            className={`glass-hero-card group relative flex-1 min-h-[300px] w-full rounded-[32px] cursor-pointer
              transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
              ${hoveredSide === 'left' ? 'opacity-35 scale-[0.95] blur-[1.5px]' : 'opacity-100 scale-100'}
              ${hoveredSide === 'right' ? 'scale-[1.025] -translate-y-3 !opacity-100 z-20' : ''}
            `}
            style={hoveredSide === 'right' ? {
              borderTopColor:  'rgba(226,255,55,0.25)',
              borderLeftColor: 'rgba(226,255,55,0.18)',
              boxShadow: `0 48px 96px -12px rgba(0,0,0,0.95),0 20px 40px rgba(0,0,0,0.65),0 0 0 1px rgba(0,0,0,0.65) inset,0 1px 0 rgba(255,255,255,0.1) inset,0 0 60px rgba(226,255,55,0.08)`,
            } : undefined}
          >
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-bl from-[#E2FF37]/5 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-[55%] rounded-b-[32px] bg-gradient-to-t
              from-[#E2FF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between text-right">
              <div className="flex flex-row-reverse justify-between items-start">
                <div>
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[#E2FF37]/70 mb-2 block">Active Strategy</span>
                  <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight group-hover:text-[#E2FF37] transition-colors duration-500">
                    Yield Trading
                  </h3>
                </div>
                <div className="glass-orb w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                  group-hover:shadow-[0_0_24px_rgba(226,255,55,0.30)]"
                  style={hoveredSide === 'right' ? { borderTopColor: 'rgba(226,255,55,0.30)', borderLeftColor: 'rgba(226,255,55,0.20)' } : undefined}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70 group-hover:text-[#E2FF37] transition-colors duration-400">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-5 flex flex-col items-end">
                <div className="h-px w-full bg-white/8 overflow-hidden rounded-full">
                  <div className="h-full w-full bg-gradient-to-r from-[#E2FF37] to-[#c8e820]
                    translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out shadow-[0_0_8px_rgba(226,255,55,0.6)]" />
                </div>
                <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[88%]">
                  Long yield. Leverage exposure. Capitalize on APY fluctuations without collateral requirements.
                </p>
                <div className="inline-flex">
                  <span className="glass-3d-btn px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em]"
                    style={{ color: 'rgba(226,255,55,0.8)' }}>
                    Buy YT →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── Section: Stats Marquee ─────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        ref={tickerRef}
        className="relative z-10 w-full py-8 overflow-hidden border-y border-white/[0.04]"
        style={{
          opacity: tickerInView ? 1 : 0,
          transition: 'opacity 1s ease 200ms',
        }}
      >
        {/* Fade masks */}
        <div className="absolute left-0 top-0 h-full w-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #050507 20%, transparent)' }} />
        <div className="absolute right-0 top-0 h-full w-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #050507 20%, transparent)' }} />

        {/* Row 1 — scrolls left */}
        <div className="flex items-center gap-3 mb-3" style={{ width: 'max-content', animation: 'marquee 42s linear infinite' }}>
          {[...STATS, ...STATS, ...STATS].map((s, i) => (
            <div
              key={i}
              className="glass-3d flex flex-col px-4 py-3 rounded-2xl whitespace-nowrap flex-shrink-0 cursor-default min-w-[160px]"
            >
              <div className="text-[7px] font-bold uppercase tracking-[0.22em] text-white/20 mb-1 leading-none">{s.label}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-semibold text-white tracking-tight leading-none">{s.value}</div>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#E2FF37', background: 'rgba(226,255,55,0.1)', border: '1px solid rgba(226,255,55,0.14)' }}
                >{s.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 — scrolls right (reversed order for variety) */}
        <div className="flex items-center gap-3" style={{ width: 'max-content', animation: 'marquee-reverse 38s linear infinite' }}>
          {[...[...STATS].reverse(), ...[...STATS].reverse(), ...[...STATS].reverse()].map((s, i) => (
            <div
              key={i}
              className="glass-3d flex flex-col px-4 py-3 rounded-2xl whitespace-nowrap flex-shrink-0 cursor-default min-w-[160px]"
            >
              <div className="text-[7px] font-bold uppercase tracking-[0.22em] text-white/20 mb-1 leading-none">{s.label}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-semibold text-white tracking-tight leading-none">{s.value}</div>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#E2FF37', background: 'rgba(226,255,55,0.1)', border: '1px solid rgba(226,255,55,0.14)' }}
                >{s.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── Section: How It Works ─────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <section
        ref={howRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 py-28"
      >
        {/* Section header */}
        <div
          className="text-center mb-20"
          style={{
            opacity: howInView ? 1 : 0,
            transform: howInView ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.8s cubic-bezier(0.19,1,0.22,1), transform 0.8s cubic-bezier(0.19,1,0.22,1)',
          }}
        >
          <div className="glass-3d inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5" style={{ borderRadius: '100px' }}>
            <span className="text-[8px] font-black tracking-[0.25em] uppercase text-white/30">The Protocol</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-medium tracking-tighter text-white/90">
            Three steps.<br />
            <span className="text-white/30">Start trading yield.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row items-stretch gap-5 lg:gap-8">

          {/* Connecting line (desktop only) */}
          <div className="absolute hidden md:block top-1/2 left-0 right-0 -translate-y-1/2 z-0 px-[calc(33.3%/2)]">
            <svg width="100%" height="2" style={{ overflow: 'visible' }}>
              <line x1="0" y1="1" x2="100%" y2="1"
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 6" />
              {howInView && (
                <line x1="0" y1="1" x2="100%" y2="1"
                  stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="4 6"
                  style={{
                    strokeDashoffset: howInView ? '0' : '200',
                    animation: 'marquee 8s linear infinite',
                  }}
                />
              )}
            </svg>
          </div>

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="relative flex-1 z-10"
              style={{
                opacity: howInView ? 1 : 0,
                transform: howInView ? 'none' : 'translateY(32px)',
                transition: `opacity 0.75s cubic-bezier(0.19,1,0.22,1) ${i * 140}ms, transform 0.75s cubic-bezier(0.19,1,0.22,1) ${i * 140}ms`,
              }}
            >
              {/* Arrow connector — outside glass card to avoid overflow:hidden clipping */}
              {i < 2 && (
                <div className="absolute -right-[22px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 z-20">
                  <div
                    className="glass-orb w-8 h-8 rounded-full flex items-center justify-center transition-all duration-400"
                    style={hoveredStep === i ? { borderTopColor: step.color.replace('0.5)', '0.3)'), boxShadow: `0 0 16px ${step.glow}` } : undefined}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}

              <div
                className="glass-hero-card group relative h-full rounded-[28px] p-8 cursor-default flex flex-col gap-6
                  transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={hoveredStep === i ? {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 40px 80px -12px rgba(0,0,0,0.95), 0 0 60px ${step.glow}`,
                  borderTopColor: step.color.replace('0.5)', '0.3)'),
                } : undefined}
              >
                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 rounded-[28px] pointer-events-none transition-opacity duration-600"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${step.glow}, transparent 70%)`,
                    opacity: hoveredStep === i ? 1 : 0,
                  }}
                />

                {/* Step number */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-black tracking-[0.3em] uppercase"
                    style={{ color: step.color }}
                  >{step.num}</span>
                </div>

                {/* Icon */}
                <div
                  className="glass-orb w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
                  style={hoveredStep === i ? {
                    borderTopColor: step.color.replace('0.5)', '0.3)'),
                    boxShadow: `0 0 24px ${step.glow}`,
                    color: step.color,
                  } : { color: 'rgba(255,255,255,0.6)' }}
                >
                  {step.icon}
                </div>

                {/* Text */}
                <div>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/25 mb-1">{step.sub}</p>
                  <h3
                    className="text-2xl font-semibold tracking-tight mb-3 transition-colors duration-400"
                    style={{ color: hoveredStep === i ? step.color.replace('0.5)', '0.9)') : 'rgba(255,255,255,0.9)' }}
                  >{step.title}</h3>
                  <p className="text-sm text-white/35 font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── Section: Yield Curve Visualization ────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <section
        ref={chartRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-28"
      >
        {/* Section header */}
        <div
          className="text-center mb-14"
          style={{
            opacity: chartInView ? 1 : 0,
            transform: chartInView ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.8s cubic-bezier(0.19,1,0.22,1), transform 0.8s cubic-bezier(0.19,1,0.22,1)',
          }}
        >
          <div className="glass-3d inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5" style={{ borderRadius: '100px' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#E2FF37] animate-pulse shadow-[0_0_8px_rgba(226,255,55,0.8)]" />
            <span className="text-[8px] font-black tracking-[0.25em] uppercase text-white/30">Live Markets</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-medium tracking-tighter text-white/90">
            Yield curves,<br />
            <span className="text-white/30">visualized in real-time.</span>
          </h2>
        </div>

        {/* Main chart card */}
        <div
          className="glass-hero-card rounded-[36px] overflow-hidden"
          style={{
            opacity: chartInView ? 1 : 0,
            transform: chartInView ? 'none' : 'translateY(32px)',
            transition: 'opacity 0.9s cubic-bezier(0.19,1,0.22,1) 150ms, transform 0.9s cubic-bezier(0.19,1,0.22,1) 150ms',
          }}
        >
          <div className="flex flex-col lg:flex-row">

            {/* ── Chart Panel ── */}
            <div className="flex-1 p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-white/[0.05] flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/25 mb-1">USDC / 12-Month Maturity</p>
                  <h3 className="text-xl font-semibold text-white/90 tracking-tight">APY Yield Curves</h3>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.8), rgba(59,130,246,0.4))' }} />
                    <span className="text-[9px] font-semibold text-white/40 tracking-wide">PT Fixed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, rgba(226,255,55,0.9), rgba(226,255,55,0.4))' }} />
                    <span className="text-[9px] font-semibold text-white/40 tracking-wide">YT Float</span>
                  </div>
                </div>
              </div>

              {/* SVG Chart */}
              <div className="relative w-full" style={{ aspectRatio: '860/210' }}>
                <svg
                  viewBox="0 0 860 210"
                  className="w-full h-full"
                  style={{ overflow: 'visible' }}
                >
                  {/* Defs */}
                  <defs>
                    <linearGradient id="ptFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
                      <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                    </linearGradient>
                    <linearGradient id="ytFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(226,255,55,0.12)" />
                      <stop offset="100%" stopColor="rgba(226,255,55,0)" />
                    </linearGradient>
                    <filter id="ptGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="ytGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <clipPath id="chartClip">
                      <rect x="72" y="18" width="756" height="172" />
                    </clipPath>
                  </defs>

                  {/* Grid — horizontal */}
                  {[42, 80, 118, 156].map((y) => (
                    <line key={y} x1="72" y1={y} x2="828" y2={y}
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                  {/* Grid — vertical */}
                  {[72, 223, 374, 525, 676, 828].map((x) => (
                    <line key={x} x1={x} y1="18" x2={x} y2="190"
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}

                  {/* X-axis labels */}
                  {['0M', '3M', '6M', '9M', '12M'].map((label, i) => (
                    <text key={label} x={72 + i * 189} y="205"
                      fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter" textAnchor="middle"
                      fontWeight="600" letterSpacing="0.08em">
                      {label}
                    </text>
                  ))}

                  {/* Y-axis labels */}
                  {[['20%', 30], ['15%', 68], ['10%', 106], ['5%', 144], ['0%', 182]].map(([label, y]) => (
                    <text key={label} x="62" y={y}
                      fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily="Inter" textAnchor="end"
                      fontWeight="500" letterSpacing="0.05em" dominantBaseline="middle">
                      {label}
                    </text>
                  ))}

                  <g clipPath="url(#chartClip)">
                    {/* ── Today line ── */}
                    <line x1="306" y1="18" x2="306" y2="190"
                      stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4" />
                    <text x="306" y="12" fill="rgba(255,255,255,0.22)" fontSize="8"
                      fontFamily="Inter" textAnchor="middle" fontWeight="700" letterSpacing="0.1em">TODAY</text>

                    {/* ── PT fill area ── */}
                    <path
                      d="M 72,112 C 200,106 380,100 828,108 L 828,190 L 72,190 Z"
                      fill="url(#ptFill)"
                      opacity={chartInView ? 1 : 0}
                      style={{ transition: 'opacity 1.5s ease 1s' }}
                    />

                    {/* ── YT fill area ── */}
                    <path
                      d="M 72,76 C 140,58 200,84 278,90 S 400,112 470,100 S 548,72 608,60 S 690,48 760,44 S 810,42 828,40 L 828,190 L 72,190 Z"
                      fill="url(#ytFill)"
                      opacity={chartInView ? 1 : 0}
                      style={{ transition: 'opacity 1.5s ease 1s' }}
                    />

                    {/* ── PT line ── */}
                    <path
                      d="M 72,112 C 200,106 380,100 828,108"
                      fill="none"
                      stroke="rgba(59,130,246,0.9)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#ptGlow)"
                      style={{
                        strokeDasharray: '900',
                        strokeDashoffset: chartInView ? '0' : '900',
                        transition: 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1) 0.4s',
                      }}
                    />

                    {/* ── YT line ── */}
                    <path
                      d="M 72,76 C 140,58 200,84 278,90 S 400,112 470,100 S 548,72 608,60 S 690,48 760,44 S 810,42 828,40"
                      fill="none"
                      stroke="rgba(226,255,55,0.85)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#ytGlow)"
                      style={{
                        strokeDasharray: '1100',
                        strokeDashoffset: chartInView ? '0' : '1100',
                        transition: 'stroke-dashoffset 2.4s cubic-bezier(0.4,0,0.2,1) 0.6s',
                      }}
                    />

                    {/* ── PT dot at today ── */}
                    <circle cx="306" cy="104" r="4" fill="rgba(59,130,246,0.9)"
                      style={{
                        opacity: chartInView ? 1 : 0,
                        filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.8))',
                        transition: 'opacity 0.4s ease 2.2s',
                      }}
                    />
                    <circle cx="306" cy="104" r="8" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="1"
                      style={{
                        opacity: chartInView ? 1 : 0,
                        transition: 'opacity 0.4s ease 2.2s',
                      }}
                    />

                    {/* ── YT dot at today ── */}
                    <circle cx="306" cy="96" r="4" fill="rgba(226,255,55,0.9)"
                      style={{
                        opacity: chartInView ? 1 : 0,
                        filter: 'drop-shadow(0 0 6px rgba(226,255,55,0.8))',
                        transition: 'opacity 0.4s ease 2.4s',
                      }}
                    />
                    <circle cx="306" cy="96" r="8" fill="none" stroke="rgba(226,255,55,0.3)" strokeWidth="1"
                      style={{
                        opacity: chartInView ? 1 : 0,
                        transition: 'opacity 0.4s ease 2.4s',
                      }}
                    />

                    {/* ── Live APY tags at end of lines ── */}
                    <g style={{ opacity: chartInView ? 1 : 0, transition: 'opacity 0.6s ease 2.6s' }}>
                      {/* PT tag */}
                      <rect x="834" y="96" width="52" height="18" rx="5"
                        fill="rgba(59,130,246,0.18)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5" />
                      <text x="860" y="109" fill="rgba(59,130,246,0.95)" fontSize="9.5" fontFamily="Inter"
                        textAnchor="middle" fontWeight="700">8.92%</text>
                    </g>
                    <g style={{ opacity: chartInView ? 1 : 0, transition: 'opacity 0.6s ease 2.7s' }}>
                      {/* YT tag */}
                      <rect x="834" y="28" width="52" height="18" rx="5"
                        fill="rgba(226,255,55,0.15)" stroke="rgba(226,255,55,0.35)" strokeWidth="0.5" />
                      <text x="860" y="41" fill="rgba(226,255,55,0.95)" fontSize="9.5" fontFamily="Inter"
                        textAnchor="middle" fontWeight="700">18.4%</text>
                    </g>
                  </g>

                  {/* Chart border bottom */}
                  <line x1="72" y1="190" x2="828" y2="190" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                  <line x1="72" y1="18" x2="72" y2="190" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                </svg>
              </div>

              {/* ── Liquidity Distribution ── */}
              <div
                style={{
                  opacity: chartInView ? 1 : 0,
                  transition: 'opacity 0.7s ease 2.8s',
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20">Pool Liquidity</span>
                  <span className="text-[8px] text-white/20 tabular-nums">$402M total</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden gap-[1px]">
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: chartInView ? '64%' : '0%',
                      background: 'linear-gradient(90deg, rgba(59,130,246,0.8), rgba(59,130,246,0.45))',
                      transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 3s',
                      boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                    }}
                  />
                  <div
                    className="h-full rounded-r-full"
                    style={{
                      width: chartInView ? '36%' : '0%',
                      background: 'linear-gradient(90deg, rgba(226,255,55,0.7), rgba(226,255,55,0.35))',
                      transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 3.1s',
                      boxShadow: '0 0 8px rgba(226,255,55,0.3)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.8)' }} />
                    <span className="text-[8px] text-white/25 font-medium">PT — $258M (64%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(226,255,55,0.75)' }} />
                    <span className="text-[8px] text-white/25 font-medium">YT — $144M (36%)</span>
                  </div>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px w-full bg-white/[0.04]" />

              {/* ── Recent Trades ── */}
              <div
                className="flex-1"
                style={{
                  opacity: chartInView ? 1 : 0,
                  transition: 'opacity 0.7s ease 3s',
                }}
              >
                <p className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-3">Recent Trades</p>
                <div className="space-y-0">
                  {[
                    { type: 'PT', action: 'BUY',  amount: '$48,200',  price: '$0.9108', time: '2s ago',  buy: true },
                    { type: 'YT', action: 'SELL', amount: '$12,400',  price: '$0.0892', time: '18s ago', buy: false },
                    { type: 'PT', action: 'BUY',  amount: '$91,600',  price: '$0.9107', time: '1m ago',  buy: true },
                    { type: 'YT', action: 'BUY',  amount: '$5,800',   price: '$0.0893', time: '2m ago',  buy: true },
                    { type: 'PT', action: 'SELL', amount: '$21,000',  price: '$0.9106', time: '3m ago',  buy: false },
                  ].map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-white/[0.03] last:border-0"
                      style={{
                        opacity: chartInView ? 1 : 0,
                        transition: `opacity 0.5s ease ${3.1 + i * 0.08}s`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px] w-6 text-center"
                          style={{
                            color: tx.type === 'PT' ? 'rgba(59,130,246,0.9)' : 'rgba(226,255,55,0.9)',
                            background: tx.type === 'PT' ? 'rgba(59,130,246,0.1)' : 'rgba(226,255,55,0.08)',
                          }}
                        >{tx.type}</span>
                        <span
                          className="text-[9px] font-bold w-7"
                          style={{ color: tx.buy ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.75)' }}
                        >{tx.action}</span>
                        <span className="text-[10px] text-white/55 font-medium tabular-nums">{tx.amount}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-white/25 tabular-nums">{tx.price}</span>
                        <span className="text-[8px] text-white/15 w-10 text-right">{tx.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Stats Side Panel ── */}
            <div className="lg:w-72 xl:w-80 p-8 flex flex-col gap-6">
              {/* PT Stats */}
              <div
                className="glass-3d rounded-2xl p-5 relative overflow-hidden cursor-pointer group"
                onClick={() => handleLaunch('/marketplace')}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[8px] font-black tracking-[0.25em] uppercase text-blue-400/70">Principal Token</span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: 'rgba(59,130,246,0.8)', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    PT
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Fixed APY', value: '8.92%' },
                    { label: 'Price', value: '$0.9108' },
                    { label: 'Maturity', value: 'Dec 2025' },
                    { label: 'TVL', value: '$284M' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-white/30 font-medium">{label}</span>
                      <span className="text-[11px] text-white/80 font-semibold tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-px w-full bg-white/5 overflow-hidden rounded-full">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 w-full
                    -translate-x-full group-hover:translate-x-0 transition-transform duration-700 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                </div>
              </div>

              {/* YT Stats */}
              <div
                className="glass-3d rounded-2xl p-5 relative overflow-hidden cursor-pointer group"
                onClick={() => handleLaunch('/markets')}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E2FF37]/5 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[8px] font-black tracking-[0.25em] uppercase text-[#E2FF37]/70">Yield Token</span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: 'rgba(226,255,55,0.85)', background: 'rgba(226,255,55,0.1)', border: '1px solid rgba(226,255,55,0.18)' }}>
                    YT
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Implied APY', value: '18.4%' },
                    { label: 'Price', value: '$0.0892' },
                    { label: 'Leverage', value: '12.8×' },
                    { label: 'Volume 24h', value: '$12.4M' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-white/30 font-medium">{label}</span>
                      <span className="text-[11px] text-white/80 font-semibold tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-px w-full bg-white/5 overflow-hidden rounded-full">
                  <div className="h-full bg-gradient-to-r from-[#E2FF37] to-[#c8e820] w-full
                    translate-x-full group-hover:translate-x-0 transition-transform duration-700 shadow-[0_0_6px_rgba(226,255,55,0.5)]" />
                </div>
              </div>

              {/* Sparkline mini */}
              <div className="glass-3d rounded-2xl p-5">
                <p className="text-[8px] font-black tracking-[0.22em] uppercase text-white/20 mb-3">YT Implied APY — 30D</p>
                <svg viewBox="0 0 220 52" className="w-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(226,255,55,0.25)" />
                      <stop offset="100%" stopColor="rgba(226,255,55,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 4,40 C 20,36 36,28 55,24 S 80,18 100,22 S 120,32 140,20 S 170,8 190,10 S 210,14 216,12"
                    fill="none" stroke="rgba(226,255,55,0.7)" strokeWidth="1.5" strokeLinecap="round"
                    style={{
                      strokeDasharray: '400',
                      strokeDashoffset: chartInView ? '0' : '400',
                      transition: 'stroke-dashoffset 2s ease 1.2s',
                      filter: 'drop-shadow(0 0 4px rgba(226,255,55,0.5))',
                    }}
                  />
                  <path
                    d="M 4,40 C 20,36 36,28 55,24 S 80,18 100,22 S 120,32 140,20 S 170,8 190,10 S 210,14 216,12 L 216,52 L 4,52 Z"
                    fill="url(#sparkFill)"
                    style={{ opacity: chartInView ? 1 : 0, transition: 'opacity 1s ease 1.5s' }}
                  />
                  <circle cx="216" cy="12" r="3" fill="rgba(226,255,55,0.9)"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(226,255,55,0.8))' }} />
                </svg>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] text-white/20">30 days ago</span>
                  <span className="text-[8px] text-white/20">Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── Section: Protocol Features ────────────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <section
        ref={featRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-28"
      >
        {/* Section header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: featInView ? 1 : 0,
            transform: featInView ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.8s cubic-bezier(0.19,1,0.22,1), transform 0.8s cubic-bezier(0.19,1,0.22,1)',
          }}
        >
          <div className="glass-3d inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5" style={{ borderRadius: '100px' }}>
            <span className="text-[8px] font-black tracking-[0.25em] uppercase text-white/30">Infrastructure</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-medium tracking-tighter text-white/90">
            Built different.
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-hero-card group relative rounded-[28px] p-8 flex flex-col gap-6 cursor-default
                transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]"
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                opacity: featInView ? 1 : 0,
                transform: featInView ? 'none' : 'translateY(32px)',
                transition: `opacity 0.75s cubic-bezier(0.19,1,0.22,1) ${i * 120}ms, transform 0.75s cubic-bezier(0.19,1,0.22,1) ${i * 120}ms`,
                ...(hoveredFeature === i ? {
                  borderTopColor: f.borderAccent,
                  borderLeftColor: f.borderAccent.replace('0.35)', '0.2)'),
                  boxShadow: `0 40px 80px -12px rgba(0,0,0,0.95), 0 0 60px ${f.glowColor}`,
                  transform: 'translateY(-6px)',
                } : {}),
              }}
            >
              {/* Bg glow */}
              <div
                className="absolute inset-0 rounded-[28px] pointer-events-none transition-opacity duration-600"
                style={{
                  background: `radial-gradient(circle at 25% 20%, ${f.accentColor}, transparent 65%)`,
                  opacity: hoveredFeature === i ? 1 : 0,
                }}
              />

              {/* Top row */}
              <div className="flex items-start justify-between relative z-10">
                <div
                  className="glass-orb w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500"
                  style={hoveredFeature === i ? {
                    borderTopColor: f.borderAccent,
                    boxShadow: `0 0 20px ${f.accentColor}`,
                    color: f.tagColor,
                  } : { color: 'rgba(255,255,255,0.55)' }}
                >
                  {f.icon}
                </div>
                <div className="text-right">
                  <span
                    className="text-[8px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                    style={{
                      color: f.tagColor,
                      background: f.accentColor,
                      border: `1px solid ${f.borderAccent}`,
                    }}
                  >{f.tag}</span>
                  <p
                    className="text-xs font-semibold mt-2 tracking-wide transition-colors duration-400"
                    style={{ color: hoveredFeature === i ? f.tagColor : 'rgba(255,255,255,0.35)' }}
                  >{f.stat}</p>
                </div>
              </div>

              {/* Text */}
              <div className="relative z-10">
                <h3
                  className="text-xl font-semibold tracking-tight mb-3 transition-colors duration-400"
                  style={{ color: hoveredFeature === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)' }}
                >{f.title}</h3>
                <p className="text-sm text-white/30 font-light leading-relaxed">{f.desc}</p>
              </div>

              {/* Bottom accent line */}
              <div className="relative z-10 h-px w-full bg-white/5 overflow-hidden rounded-full mt-auto">
                <div
                  className="h-full w-full -translate-x-full group-hover:translate-x-0 transition-transform duration-700"
                  style={{ background: `linear-gradient(90deg, ${f.tagColor}, transparent)` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── Section: Final CTA ────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-32"
      >
        <div
          className="glass-hero-card relative rounded-[36px] px-10 py-16 sm:py-20 overflow-hidden text-center"
          style={{
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView ? 'none' : 'translateY(32px)',
            transition: 'opacity 0.9s cubic-bezier(0.19,1,0.22,1), transform 0.9s cubic-bezier(0.19,1,0.22,1)',
          }}
        >
          {/* Glow blobs */}
          <div className="absolute top-[-30%] left-[20%] w-[40%] h-[80%] rounded-full blur-[90px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.09), transparent 70%)' }} />
          <div className="absolute top-[-30%] right-[20%] w-[40%] h-[80%] rounded-full blur-[90px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(226,255,55,0.07), transparent 70%)' }} />

          {/* Content */}
          <div className="relative z-10">
            <div className="glass-3d inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8" style={{ borderRadius: '100px' }}>
              <div className="relative flex items-center justify-center w-3 h-3">
                <div className="absolute inset-0 bg-[#E2FF37] blur-sm opacity-60 rounded-full animate-pulse" />
                <svg className="w-2.5 h-2.5 relative z-10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="white" />
                </svg>
              </div>
              <span className="text-[8px] font-black tracking-[0.25em] uppercase text-white/30">Powered by Stellar</span>
            </div>

            <h2 className="text-5xl sm:text-7xl font-medium tracking-tighter text-white/90 mb-5 leading-[0.9]">
              Ready to split<br />your yield?
            </h2>
            <p className="text-base text-white/30 font-light max-w-md mx-auto mb-12 leading-relaxed">
              Connect any Stellar-compatible wallet and start trading yield in under 60 seconds. No KYC. No bridges. No limits.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleLaunch('/marketplace')}
                className="glass-3d-btn group flex items-center gap-3 px-8 py-4 rounded-full
                  text-[11px] font-black uppercase tracking-[0.2em] text-blue-300 hover:text-blue-200 w-full sm:w-auto justify-center"
                style={{ minWidth: '180px' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                Buy PT
              </button>

              <button
                onClick={() => handleLaunch('/markets')}
                className="glass-3d-btn group flex items-center gap-3 px-8 py-4 rounded-full
                  text-[11px] font-black uppercase tracking-[0.2em] w-full sm:w-auto justify-center"
                style={{ color: 'rgba(226,255,55,0.85)', minWidth: '180px' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(226,255,55,0.1)', border: '1px solid rgba(226,255,55,0.22)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                Trade YT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center group cursor-pointer" onClick={() => navigate('/')}>
            <div
              className="glass-orb relative w-9 h-9 rounded-xl flex items-center justify-center
                         transition-all duration-400 opacity-60 hover:opacity-90
                         group-hover:scale-105 group-hover:shadow-[0_0_14px_rgba(226,255,55,0.10)]"
            >
              <img
                src="/spield_logomain.png"
                alt="Speild"
                className="w-5 h-5 object-contain relative z-10
                           drop-shadow-[0_0_5px_rgba(255,255,255,0.35)]
                           transition-all duration-500
                           group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]"
              />
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Docs', 'Twitter'].map((link) => (
              <button key={link} className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/25
                hover:text-white/60 transition-colors duration-300">
                {link}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E2FF37] animate-pulse shadow-[0_0_6px_rgba(226,255,55,0.7)]" />
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/20">Stellar Mainnet</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
