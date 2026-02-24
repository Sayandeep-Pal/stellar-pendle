import React, { useState, useEffect } from 'react';
import TradeModal from '../components/TradeModal';

const MarketplacePage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState('PT');
    const [hoveredRow, setHoveredRow] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    const markets = [
        {
            id: 1,
            asset: 'stsUSDe',
            fullName: 'Bridged Token',
            maturity: '24 Feb 2026',
            daysLeft: 0,
            yield: '3.3%',
            liquidity: '$4',
            volume: '$4',
            change: '+0.02%',
            positive: true,
        }
    ];

    const openTrade = (type) => {
        setSelectedToken(type);
        setIsModalOpen(true);
    };

    const stats = [
        { label: 'Total Value Locked', value: '$4', sub: '+3.3% this week' },
        { label: 'Active Markets', value: '1', sub: 'Live on Testnet' },
        { label: 'Avg. Implied Yield', value: '3.3%', sub: 'Annualized APY' },
        { label: '24h Volume', value: '$4', sub: 'Across all markets' },
    ];

    return (
        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-24 pt-8 mx-auto">

            {/* ── Header ─────────────────────────────────────── */}
            <div
                className="mb-10"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'none' : 'translateY(16px)',
                    transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1), transform 0.6s cubic-bezier(0.19,1,0.22,1)',
                }}
            >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-dim bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
                                Secondary Market
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent-neon">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse shadow-[0_0_6px_rgba(226,255,55,0.8)]" />
                                Live
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none">
                            MARKETPLACE
                        </h1>
                        <p className="text-text-dim text-sm mt-3 max-w-md leading-relaxed">
                            Trade Principal &amp; Yield Tokens instantly at market price.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {stats.map((s, i) => (
                    <div
                        key={s.label}
                        className="glass-card rounded-2xl px-5 py-4 group"
                        style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'none' : 'translateY(12px)',
                            transition: `opacity 0.5s cubic-bezier(0.19,1,0.22,1) ${i * 80}ms, transform 0.5s cubic-bezier(0.19,1,0.22,1) ${i * 80}ms`,
                        }}
                    >
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim mb-1.5">{s.label}</p>
                        <p className="text-xl font-black text-white font-mono tracking-tight mb-0.5">{s.value}</p>
                        <p className="text-[10px] text-text-dim/60 font-medium">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Markets Table ──────────────────────────────── */}
            <div
                className="glass-panel rounded-[28px] sm:rounded-[36px] overflow-hidden"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'none' : 'translateY(20px)',
                    transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1) 300ms, transform 0.6s cubic-bezier(0.19,1,0.22,1) 300ms',
                }}
            >
                {/* Table header */}
                <div className="px-5 sm:px-8 py-5 border-b border-white/[0.05]">
                    <div className="hidden md:grid grid-cols-12 gap-4 text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">
                        <div className="col-span-3">Asset</div>
                        <div className="col-span-2">Maturity</div>
                        <div className="col-span-2">Implied Yield</div>
                        <div className="col-span-2">Liquidity</div>
                        <div className="col-span-3 text-right">Trade</div>
                    </div>
                    <div className="md:hidden text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">
                        Active Markets
                    </div>
                </div>

                {/* Rows */}
                {markets.map((market, idx) => (
                    <div
                        key={market.id}
                        onMouseEnter={() => setHoveredRow(market.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="relative border-b border-white/[0.04] last:border-0 transition-all duration-300"
                        style={{
                            background: hoveredRow === market.id
                                ? 'linear-gradient(90deg, rgba(226,255,55,0.025) 0%, rgba(255,255,255,0.03) 100%)'
                                : 'transparent',
                        }}
                    >
                        {/* Neon left accent on hover */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300"
                            style={{
                                background: 'linear-gradient(180deg, #e2ff37, rgba(226,255,55,0.3))',
                                opacity: hoveredRow === market.id ? 1 : 0,
                                boxShadow: '4px 0 16px rgba(226,255,55,0.3)',
                            }}
                        />

                        {/* Mobile layout */}
                        <div className="md:hidden p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-11 h-11 flex-shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 border border-blue-500/25 flex items-center justify-center text-blue-300 font-black text-base">
                                            S
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-neon border-2 border-[#080809]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-base leading-none">{market.asset}</h3>
                                        <span className="text-[10px] text-text-dim">{market.fullName}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-accent-neon font-black text-lg">{market.yield}</div>
                                    <div className="text-[10px] text-text-dim">Implied APY</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                    <div className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Maturity</div>
                                    <div className="text-white font-mono text-xs">{market.maturity}</div>
                                </div>
                                <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                    <div className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Liquidity</div>
                                    <div className="text-white font-mono text-xs">{market.liquidity}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openTrade('PT')}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
                                    style={{
                                        background: 'rgba(59,130,246,0.12)',
                                        color: '#60a5fa',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        boxShadow: '0 0 0 transparent',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#3b82f6';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.4)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                                        e.currentTarget.style.color = '#60a5fa';
                                        e.currentTarget.style.boxShadow = '0 0 0 transparent';
                                    }}
                                >
                                    Buy PT
                                </button>
                                <button
                                    onClick={() => openTrade('YT')}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
                                    style={{
                                        background: 'rgba(168,85,247,0.12)',
                                        color: '#c084fc',
                                        border: '1px solid rgba(168,85,247,0.2)',
                                        boxShadow: '0 0 0 transparent',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#a855f7';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.4)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(168,85,247,0.12)';
                                        e.currentTarget.style.color = '#c084fc';
                                        e.currentTarget.style.boxShadow = '0 0 0 transparent';
                                    }}
                                >
                                    Buy YT
                                </button>
                            </div>
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-6 items-center">
                            {/* Asset */}
                            <div className="col-span-3 flex items-center gap-4">
                                <div className="relative w-11 h-11 flex-shrink-0">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 border border-blue-500/25 flex items-center justify-center text-blue-300 font-black text-sm shadow-[0_0_16px_rgba(59,130,246,0.15)]">
                                        S
                                    </div>
                                    <div
                                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080809]"
                                        style={{ background: '#e2ff37', boxShadow: '0 0 8px rgba(226,255,55,0.6)' }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-[15px] leading-none mb-1">{market.asset}</h3>
                                    <span className="text-[10px] text-text-dim uppercase tracking-wider font-medium">{market.fullName}</span>
                                </div>
                            </div>

                            {/* Maturity */}
                            <div className="col-span-2">
                                <div className="text-white font-mono text-sm font-medium">{market.maturity}</div>
                                <div className="text-[10px] text-text-dim mt-0.5">{market.daysLeft}d remaining</div>
                            </div>

                            {/* Yield */}
                            <div className="col-span-2">
                                <div
                                    className="text-lg font-black font-mono"
                                    style={{ color: '#e2ff37', textShadow: '0 0 20px rgba(226,255,55,0.4)' }}
                                >
                                    {market.yield}
                                </div>
                                <div className="text-[10px] text-green-400 mt-0.5 font-bold">{market.change}</div>
                            </div>

                            {/* Liquidity */}
                            <div className="col-span-2">
                                <div className="text-white font-mono text-sm font-medium">{market.liquidity}</div>
                                <div className="text-[10px] text-text-dim mt-0.5">Vol: {market.volume}</div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-3 flex justify-end gap-2.5">
                                <button
                                    onClick={() => openTrade('PT')}
                                    className="relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 group/btn"
                                    style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        color: '#60a5fa',
                                        border: '1px solid rgba(59,130,246,0.18)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#3b82f6';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.45), 0 4px 12px rgba(0,0,0,0.4)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                        e.currentTarget.style.color = '#60a5fa';
                                        e.currentTarget.style.boxShadow = '';
                                        e.currentTarget.style.transform = '';
                                    }}
                                >
                                    <span className="relative z-10">TRADE PT</span>
                                </button>
                                <button
                                    onClick={() => openTrade('YT')}
                                    className="relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300"
                                    style={{
                                        background: 'rgba(168,85,247,0.1)',
                                        color: '#c084fc',
                                        border: '1px solid rgba(168,85,247,0.18)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#a855f7';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 24px rgba(168,85,247,0.45), 0 4px 12px rgba(0,0,0,0.4)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
                                        e.currentTarget.style.color = '#c084fc';
                                        e.currentTarget.style.boxShadow = '';
                                        e.currentTarget.style.transform = '';
                                    }}
                                >
                                    TRADE YT
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Footer info bar */}
                <div className="px-5 sm:px-8 py-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-text-dim font-medium">
                        <svg className="w-3.5 h-3.5 text-accent-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Prices update in real-time from on-chain oracle
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-dim font-black uppercase tracking-wider">Network:</span>
                        <span className="text-[10px] font-black text-accent-neon uppercase tracking-wider">Stellar Testnet</span>
                    </div>
                </div>
            </div>

            {/* ── Token Info Cards ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {[
                    {
                        token: 'PT',
                        color: '#60a5fa',
                        colorAlpha: 'rgba(59,130,246,',
                        title: 'Principal Token',
                        desc: 'Locked in value. Redeems 1:1 for the underlying asset at maturity. Buy at a discount for a fixed yield.',
                        tag: 'Fixed Yield',
                    },
                    {
                        token: 'YT',
                        color: '#c084fc',
                        colorAlpha: 'rgba(168,85,247,',
                        title: 'Yield Token',
                        desc: 'Captures the variable yield streamed by the underlying. High leverage on yield rate movements.',
                        tag: 'Leveraged Yield',
                    },
                ].map((card, i) => (
                    <div
                        key={card.token}
                        className="glass-card rounded-2xl p-6"
                        style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'none' : 'translateY(12px)',
                            transition: `opacity 0.5s cubic-bezier(0.19,1,0.22,1) ${400 + i * 100}ms, transform 0.5s cubic-bezier(0.19,1,0.22,1) ${400 + i * 100}ms`,
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                                style={{
                                    background: `${card.colorAlpha}0.14)`,
                                    color: card.color,
                                    border: `1px solid ${card.colorAlpha}0.22)`,
                                    boxShadow: `0 0 16px ${card.colorAlpha}0.12)`,
                                }}
                            >
                                {card.token}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-white font-black text-sm">{card.title}</h3>
                                    <span
                                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{
                                            background: `${card.colorAlpha}0.1)`,
                                            color: card.color,
                                            border: `1px solid ${card.colorAlpha}0.15)`,
                                        }}
                                    >
                                        {card.tag}
                                    </span>
                                </div>
                                <p className="text-text-dim text-xs leading-relaxed">{card.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <TradeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tokenType={selectedToken}
            />
        </div>
    );
};

export default MarketplacePage;
