import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState(null); // 'left' | 'right' | null
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLaunch = (path) => {
    setIsExiting(true);
    setTimeout(() => {
        navigate(path);
    }, 1400);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-hidden font-['Poppins'] selection:bg-[#E2FF37] selection:text-black">
      
      {/* --- Transition Overlay (Shutter Effect) --- */}
      <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none">
            <div className={`flex-1 bg-[#050505] transition-transform duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${isExiting ? 'translate-y-0' : '-translate-y-full'}`}></div>
            <div className={`flex-1 bg-[#050505] transition-transform duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${isExiting ? 'translate-y-0' : 'translate-y-full'}`}></div>
            {/* Center Flash Line */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[0px] h-[2px] bg-white shadow-[0_0_150px_rgba(255,255,255,1)] z-10 transition-all duration-700 delay-300 ${isExiting ? 'max-w-full opacity-100' : 'max-w-[0px] opacity-0'}`}></div>
      </div>

      {/* --- Global Noise Texture --- */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-overlay" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
      }}></div>

      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Silver Sheen - Background Layer */}
         <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)] blur-[100px] mix-blend-overlay"></div>
         
         {/* Silver Premium Gradient - The requested "circular gradient" */}
         <div 
            className="absolute bottom-[-40%] left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] rounded-[100%] opacity-60 blur-[100px] transition-all duration-1000 ease-in-out"
            style={{
                background: hoveredSide === 'left' 
                    ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)' // Blue tint
                    : hoveredSide === 'right'
                    ? 'radial-gradient(circle, rgba(226,255,55,0.15) 0%, rgba(226,255,55,0.05) 40%, transparent 70%)' // Neon tint
                    : 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(160,160,160,0.08) 30%, rgba(255,255,255,0) 70%)' // Silver default
            }}
         />

        {/* Stellar Orbit Lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border border-white/5 rounded-full opacity-20 animate-[spin_120s_linear_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-white/5 rounded-full opacity-10 animate-[spin_180s_linear_infinite_reverse]"></div>
         
         {/* Mouse Follower Glow */}
         <div 
            className="absolute w-[500px] h-[500px] bg-white/3 rounded-full blur-[80px] pointer-events-none transition-transform duration-75 ease-out"
            style={{ 
                left: mousePos.x - 250, 
                top: mousePos.y - 250,
            }}
         />
      </div>

      {/* --- Navigation --- */}
      <nav className="relative z-40 px-8 py-6 flex justify-between items-center max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
           <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all duration-500">
              <span className="font-bold text-lg italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">S</span>
           </div>
           <span className="font-semibold tracking-tight text-xl tracking-[-0.02em]">Speild</span>
        </div>
        <div className="flex items-center gap-8">
            <button 
                onClick={() => handleLaunch('/vault')}
                className="hidden md:flex relative px-6 py-2.5 rounded-full overflow-hidden group bg-white/5 border border-white/10 hover:border-white/20 transition-all font-medium text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white"
            >
                <span className="relative z-10">Launch App</span>
                <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 pb-20">
        
        {/* Main Title */}
        <div className="text-center relative mb-16 space-y-6">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-[#0A0A0A] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-6 overflow-hidden relative group cursor-default hover:border-white/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {/* Stellar Logo / Pulse */}
                <div className="relative flex items-center justify-center w-4 h-4">
                     <div className="absolute inset-0 bg-white blur-md opacity-50 animate-pulse"></div>
                     <svg className="w-3 h-3 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="white"/></svg>
                </div>

                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">
                   Built on <span className="font-bold text-white tracking-[0.15em] drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">STELLAR</span>
                </span>
            </div>
            
            <h1 className="text-8xl md:text-[10rem] font-medium tracking-tighter leading-[0.8] mix-blend-screen select-none">
              <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-600 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">YIELD</span>
              <span className="block md:inline text-neutral-800">,</span>
              <br className="hidden md:block"/>
              <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-b from-neutral-500 via-neutral-200 to-white drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">SPLIT.</span>
            </h1>
        </div>

        {/* The Split Interaction */}
        <div className="relative w-full max-w-6xl md:h-[350px] flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-center perspective-[2000px]">
            
            {/* Enterprise / PT Card */}
            <div 
              onMouseEnter={() => setHoveredSide('left')}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => handleLaunch('/vault')}
              className={`group relative flex-1 min-h-[300px] w-full cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${hoveredSide === 'right' ? 'opacity-40 scale-[0.95] rotate-y-[5deg] blur-[2px]' : 'opacity-100 scale-100'}
                ${hoveredSide === 'left' ? 'scale-[1.02] -translate-y-2 !opacity-100 z-20' : ''}
              `}
            >
                {/* Card Background - Glass & Mesh */}
                <div className="absolute inset-0 rounded-[32px] bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-2xl transition-colors duration-500 group-hover:border-blue-500/30">
                     <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></span>
                     
                     {/* Inner Gradient */}
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                     <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                             <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-blue-400/80 mb-2 block">Enterprise Strategy</span>
                             <h3 className="text-4xl font-semibold text-white tracking-tight group-hover:text-blue-200 transition-colors">Fixed Yield</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="h-[1px] w-full bg-white/10 overflow-hidden">
                            <div className="h-full w-full bg-blue-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></div>
                        </div>
                        
                        <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[90%]">
                           Lock in rates today. Remove volatility. Ideal for treasury management and predictable scaling.
                        </p>
                    </div>
                </div>
            </div>

            {/* Central Divider */}
             <div className="hidden md:flex items-center justify-center w-24 relative z-20">
               <div className={`w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent transition-all duration-500 ${hoveredSide ? 'h-0 opacity-0' : 'h-32 opacity-100'}`}></div>
            </div>

            {/* Opportunist / YT Card */}
            <div 
              onMouseEnter={() => setHoveredSide('right')}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => handleLaunch('/markets')}
              className={`group relative flex-1 min-h-[300px] w-full cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${hoveredSide === 'left' ? 'opacity-40 scale-[0.95] rotate-y-[-5deg] blur-[2px]' : 'opacity-100 scale-100'}
                ${hoveredSide === 'right' ? 'scale-[1.02] -translate-y-2 !opacity-100 z-20' : ''}
              `}
            >
                {/* Card Background */}
                <div className="absolute inset-0 rounded-[32px] bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-2xl transition-colors duration-500 group-hover:border-[#E2FF37]/30">
                     <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></span>

                     {/* Inner Gradient */}
                     <div className="absolute inset-0 bg-gradient-to-bl from-[#E2FF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                     <div className="absolute bottom-0 right-0 w-full h-[60%] bg-gradient-to-t from-[#E2FF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>
                
                 {/* Content */}
                 <div className="relative z-10 p-10 h-full flex flex-col justify-between text-right">
                    <div className="flex flex-row-reverse justify-between items-start">
                        <div className="space-y-2">
                             <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#E2FF37]/80 mb-2 block">Active Strategy</span>
                             <h3 className="text-4xl font-semibold text-white tracking-tight group-hover:text-[#E2FF37] transition-colors">Yield Trading</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-[#E2FF37] group-hover:text-black transition-all duration-500">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        </div>
                    </div>

                    <div className="space-y-6 flex flex-col items-end">
                        <div className="h-[1px] w-full bg-white/10 overflow-hidden">
                            <div className="h-full w-full bg-[#E2FF37] translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></div>
                        </div>
                        
                        <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-[90%]">
                           Long yield. Leverage exposure. Capitalize on APY fluctuations without collateral requirements.
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </main>

      {/* --- Footer ticker --- */}
      <footer className="fixed bottom-0 w-full border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl py-4 z-50 hidden md:block">
         <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-neutral-500">
            <div className="flex gap-12">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${true ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span>System Operational</span>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <span>XLM APY <span className="text-white ml-2">4.2%</span></span>
                <span>yXLM APY <span className="text-[#E2FF37] ml-2">5.8%</span></span>
            </div>
            <div className="flex gap-8 opacity-60">
               <span>Speild Protocol v1.0</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
