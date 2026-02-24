import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

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

        {/* Color-reactive bottom glow */}
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
        {/* Logo */}
        <div
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="glass-orb w-10 h-10 rounded-xl flex items-center justify-center
            transition-all duration-400 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]">
            <span className="font-black text-base italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative z-10">S</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors duration-300">Speild</span>
        </div>

        {/* CTA */}
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

        {/* Title block */}
        <div
          className="text-center relative mb-14 space-y-5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.19,1,0.22,1) 100ms, transform 0.8s cubic-bezier(0.19,1,0.22,1) 100ms',
          }}
        >
          {/* Badge pill — glass-3d treatment on a small chip */}
          <div
            className="glass-3d inline-flex items-center gap-3.5 px-5 py-2.5 rounded-full mb-4 cursor-default"
            style={{ borderRadius: '100px' }}
          >
            {/* Stellar star pulse */}
            <div className="relative flex items-center justify-center w-4 h-4">
              <div className="absolute inset-0 bg-white blur-md opacity-40 animate-pulse rounded-full" />
              <svg className="w-3 h-3 relative z-10" viewBox="0 0 24 24" fill="none">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="white" />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/40 leading-none">
              Built on{' '}
              <span
                className="font-black text-white tracking-[0.15em]"
                style={{ textShadow: '0 0 10px rgba(255,255,255,0.6)' }}
              >
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

          {/* ── PT / Fixed Yield Card ──────────────────────── */}
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
              boxShadow: `
                0 48px 96px -12px rgba(0,0,0,0.95),
                0 20px 40px rgba(0,0,0,0.65),
                0 0 0 1px rgba(0,0,0,0.65) inset,
                0 1px 0 rgba(255,255,255,0.1) inset,
                0 0 60px rgba(59,130,246,0.10)
              `,
            } : undefined}
          >
            {/* Blue tint on hover */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-blue-900/10 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-[55%] rounded-b-[32px] bg-gradient-to-t
              from-blue-900/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-blue-400/70 mb-2 block">
                    Enterprise Strategy
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight
                    group-hover:text-blue-200 transition-colors duration-500">
                    Fixed Yield
                  </h3>
                </div>
                {/* ── Icon orb — glass-orb effect ── */}
                <div className="glass-orb w-12 h-12 rounded-2xl flex items-center justify-center
                  transition-all duration-500 group-hover:bg-blue-500/30 group-hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                  style={ hoveredSide === 'left' ? {
                    borderTopColor:  'rgba(59,130,246,0.35)',
                    borderLeftColor: 'rgba(59,130,246,0.25)',
                  } : undefined}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" className="text-white/70 group-hover:text-blue-300 transition-colors duration-400">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-5">
                <div className="h-px w-full bg-white/8 overflow-hidden rounded-full">
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-400
                    -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out
                    shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </div>
                <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[88%]">
                  Lock in rates today. Remove volatility. Ideal for treasury management and predictable scaling.
                </p>
                {/* Mini CTA chip — glass-3d-btn */}
                <div className="inline-flex">
                  <span className="glass-3d-btn px-4 py-1.5 rounded-full text-[9px] font-black
                    uppercase tracking-[0.18em] text-blue-300/80 group-hover:text-blue-200">
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

          {/* ── YT / Yield Trading Card ────────────────────── */}
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
              boxShadow: `
                0 48px 96px -12px rgba(0,0,0,0.95),
                0 20px 40px rgba(0,0,0,0.65),
                0 0 0 1px rgba(0,0,0,0.65) inset,
                0 1px 0 rgba(255,255,255,0.1) inset,
                0 0 60px rgba(226,255,55,0.08)
              `,
            } : undefined}
          >
            {/* Neon tint on hover */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-bl from-[#E2FF37]/5 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-[55%] rounded-b-[32px] bg-gradient-to-t
              from-[#E2FF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col justify-between text-right">
              <div className="flex flex-row-reverse justify-between items-start">
                <div>
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[#E2FF37]/70 mb-2 block">
                    Active Strategy
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight
                    group-hover:text-[#E2FF37] transition-colors duration-500">
                    Yield Trading
                  </h3>
                </div>
                {/* ── Icon orb ── */}
                <div className="glass-orb w-12 h-12 rounded-2xl flex items-center justify-center
                  transition-all duration-500 group-hover:shadow-[0_0_24px_rgba(226,255,55,0.30)]"
                  style={ hoveredSide === 'right' ? {
                    borderTopColor:  'rgba(226,255,55,0.30)',
                    borderLeftColor: 'rgba(226,255,55,0.20)',
                  } : undefined}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" className="text-white/70 group-hover:text-[#E2FF37] transition-colors duration-400">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-5 flex flex-col items-end">
                <div className="h-px w-full bg-white/8 overflow-hidden rounded-full">
                  <div className="h-full w-full bg-gradient-to-r from-[#E2FF37] to-[#c8e820]
                    translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out
                    shadow-[0_0_8px_rgba(226,255,55,0.6)]" />
                </div>
                <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[88%]">
                  Long yield. Leverage exposure. Capitalize on APY fluctuations without collateral requirements.
                </p>
                {/* Mini CTA chip */}
                <div className="inline-flex">
                  <span className="glass-3d-btn px-4 py-1.5 rounded-full text-[9px] font-black
                    uppercase tracking-[0.18em]"
                    style={{ color: 'rgba(226,255,55,0.8)' }}
                  >
                    Buy YT →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ticker ──────────────────────────────────── */}

    </div>
  );
}
