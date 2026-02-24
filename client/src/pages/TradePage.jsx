import React, { useState, useEffect } from 'react';
import TradeModal from '../components/TradeModal';
import TransactionModal from '../components/TransactionModal';
import {
    redeemPt,
    claimYield,
    getPtBalance,
    getYtBalance,
    checkConnection,
    scaleDown,
} from '../lib/stellar-wrapper';

const DECIMALS = 7;
const toScaled = (v) => BigInt(Math.floor(parseFloat(v) * 10 ** DECIMALS));

/* ── Mode Select Modal ─────────────────────────────────────────── */
function ModeSelectModal({ isOpen, onSelect }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ perspective: '1200px' }}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 transition-all duration-400"
                style={{
                    background: 'rgba(0,0,0,0.80)',
                    backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 0.35s ease, backdrop-filter 0.35s ease',
                }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-[540px]"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? 'translateY(0) scale(1) rotateX(0deg)'
                        : 'translateY(24px) scale(0.95) rotateX(4deg)',
                    transition: 'opacity 0.4s cubic-bezier(0.19,1,0.22,1), transform 0.4s cubic-bezier(0.19,1,0.22,1)',
                    transformOrigin: 'center bottom',
                }}
            >
                {/* Outer glow */}
                <div
                    className="absolute -inset-px rounded-[28px] pointer-events-none"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(226,255,55,0.12) 0%, transparent 50%, rgba(168,85,247,0.08) 100%)',
                        filter: 'blur(1px)',
                    }}
                />

                <div
                    className="relative rounded-[26px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, rgba(22,22,28,0.96) 0%, rgba(12,12,16,0.98) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '1px solid rgba(226,255,55,0.2)',
                        boxShadow: `
                            0 0 0 1px rgba(0,0,0,0.6) inset,
                            inset 0 1px 0 rgba(255,255,255,0.08),
                            0 40px 80px rgba(0,0,0,0.85),
                            0 0 60px rgba(226,255,55,0.05)
                        `,
                    }}
                >
                    {/* Top gloss line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, rgba(226,255,55,0.4), transparent)',
                        }}
                    />

                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 text-center">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{
                                background: 'rgba(226,255,55,0.1)',
                                border: '1px solid rgba(226,255,55,0.2)',
                                boxShadow: '0 0 20px rgba(226,255,55,0.1)',
                            }}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="#e2ff37"
                                viewBox="0 0 24 24"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-white font-black text-2xl leading-none mb-2">
                            Choose Your Strategy
                        </h2>
                        <p className="text-text-dim text-xs font-medium leading-relaxed max-w-xs mx-auto">
                            Select how you want to interact with yield-bearing assets on Spield
                        </p>
                    </div>

                    {/* Strategy Cards */}
                    <div className="px-6 pb-8 grid grid-cols-2 gap-3">
                        {/* Fixed Return */}
                        <button
                            onClick={() => onSelect('fixed')}
                            className="relative p-5 rounded-[20px] text-left transition-all duration-300 group overflow-hidden"
                            style={{
                                background: 'rgba(59,130,246,0.06)',
                                border: '1px solid rgba(59,130,246,0.15)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                                e.currentTarget.style.border = '1px solid rgba(59,130,246,0.3)';
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(59,130,246,0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                                e.currentTarget.style.border = '1px solid rgba(59,130,246,0.15)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = '';
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                    background: 'rgba(59,130,246,0.15)',
                                    border: '1px solid rgba(59,130,246,0.25)',
                                    boxShadow: '0 0 16px rgba(59,130,246,0.12)',
                                }}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="#60a5fa"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div
                                className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-block mb-2"
                                style={{
                                    background: 'rgba(59,130,246,0.1)',
                                    color: '#60a5fa',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                }}
                            >
                                PT Token
                            </div>
                            <h3 className="text-white font-black text-sm leading-tight mb-1.5">
                                Fixed Return
                            </h3>
                            <p className="text-text-dim text-[10px] leading-relaxed opacity-70">
                                Buy discounted PT tokens and lock in a guaranteed fixed yield at maturity
                            </p>
                            <div
                                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ color: '#60a5fa' }}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Yield Leverage */}
                        <button
                            onClick={() => onSelect('leverage')}
                            className="relative p-5 rounded-[20px] text-left transition-all duration-300 group overflow-hidden"
                            style={{
                                background: 'rgba(168,85,247,0.06)',
                                border: '1px solid rgba(168,85,247,0.15)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(168,85,247,0.12)';
                                e.currentTarget.style.border = '1px solid rgba(168,85,247,0.3)';
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(168,85,247,0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(168,85,247,0.06)';
                                e.currentTarget.style.border = '1px solid rgba(168,85,247,0.15)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = '';
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                    background: 'rgba(168,85,247,0.15)',
                                    border: '1px solid rgba(168,85,247,0.25)',
                                    boxShadow: '0 0 16px rgba(168,85,247,0.12)',
                                }}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="#c084fc"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                            <div
                                className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-block mb-2"
                                style={{
                                    background: 'rgba(168,85,247,0.1)',
                                    color: '#c084fc',
                                    border: '1px solid rgba(168,85,247,0.2)',
                                }}
                            >
                                YT Token
                            </div>
                            <h3 className="text-white font-black text-sm leading-tight mb-1.5">
                                Yield Leverage
                            </h3>
                            <p className="text-text-dim text-[10px] leading-relaxed opacity-70">
                                Amplify your yield exposure with YT tokens and claim accrued yields
                            </p>
                            <div
                                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ color: '#c084fc' }}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>

                    {/* Bottom info */}
                    <div className="px-8 pb-6 text-center">
                        <p className="text-[10px] text-text-dim/40 font-medium">
                            You can switch strategies at any time
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Action Box ────────────────────────────────────────────────── */
function ActionBox({
    title, subtitle, badgeLabel, badgeColor, badgeAlpha,
    balanceLabel, balanceValue, tokenLabel,
    actionLabel, onAction, loading, disabled,
    inputValue, onInputChange, noInput, icon,
}) {
    return (
        <div
            className="glass-3d relative flex flex-col h-full rounded-[28px]"
            style={{
                borderTop: `1px solid ${badgeAlpha}0.22)`,
                borderLeft: `1px solid ${badgeAlpha}0.14)`,
            }}
        >
            {/* Color rim */}
            <div
                className="absolute top-0 inset-x-0 h-px pointer-events-none z-10"
                style={{
                    background: `linear-gradient(90deg, transparent, ${badgeAlpha}0.5), transparent)`,
                }}
            />

            <div className="flex flex-col flex-1 p-6 gap-5 relative z-[1]">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                                style={{
                                    background: `${badgeAlpha}0.10)`,
                                    color: badgeColor,
                                    border: `1px solid ${badgeAlpha}0.22)`,
                                    textShadow: `0 0 10px ${badgeAlpha}0.4)`,
                                }}
                            >
                                {badgeLabel}
                            </span>
                        </div>
                        <h3 className="text-white font-black text-[17px] leading-tight tracking-tight">
                            {title}
                        </h3>
                        <p className="text-text-dim text-[10px] mt-1 leading-relaxed max-w-[200px] font-medium opacity-60">
                            {subtitle}
                        </p>
                    </div>
                    <div
                        className="glass-orb w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            borderTopColor: `${badgeAlpha}0.28)`,
                            borderLeftColor: `${badgeAlpha}0.18)`,
                        }}
                    >
                        {icon}
                    </div>
                </div>

                {/* Input / balance well */}
                <div className="glass-inset rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-dim">
                            {balanceLabel}
                        </span>
                        <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                                background: `${badgeAlpha}0.08)`,
                                color: badgeColor,
                                border: `1px solid ${badgeAlpha}0.15)`,
                            }}
                        >
                            {tokenLabel}
                        </span>
                    </div>
                    {!noInput ? (
                        <input
                            type="number"
                            placeholder="0.00"
                            className="bg-transparent text-3xl font-light text-white outline-none w-full placeholder-white/[0.08] [appearance:textfield]"
                            value={inputValue}
                            onChange={e => onInputChange(e.target.value)}
                        />
                    ) : (
                        <div
                            className="text-3xl font-black font-mono tracking-tight"
                            style={{
                                color: badgeColor,
                                textShadow: `0 0 20px ${badgeAlpha}0.3)`,
                            }}
                        >
                            {balanceValue}
                        </div>
                    )}
                    {!noInput && balanceValue && balanceValue !== '--' && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.06]">
                            <span className="text-[9px] text-text-dim font-medium">Available</span>
                            <span className="text-[9px] font-black text-white/50 font-mono">
                                {balanceValue} {tokenLabel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action button */}
                <button
                    onClick={onAction}
                    disabled={disabled}
                    className="glass-3d-btn mt-auto w-full py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                    style={{ color: badgeColor }}
                >
                    {loading ? (
                        <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Processing...
                        </>
                    ) : actionLabel}
                </button>
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function TradePage({ address, pendleBalances, refreshData, setLoading, loading, setError }) {
    const [mode, setMode] = useState(null);
    const [showModeModal, setShowModeModal] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [hoveredRow, setHoveredRow] = useState(null);

    // Trade modal
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState('PT');

    // Transaction notification modal
    const [modalState, setModalState] = useState({ isOpen: false, message: '', type: 'success' });

    // Balances
    const [ptBal, setPtBal] = useState('0.0000');
    const [ytBal, setYtBal] = useState('0.0000');

    // Form state
    const [ptRedeemAmount, setPtRedeemAmount] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    const fetchBalances = async () => {
        if (!address) return;
        try {
            const [pt, yt] = await Promise.all([getPtBalance(address), getYtBalance(address)]);
            setPtBal(scaleDown(pt ?? 0));
            setYtBal(scaleDown(yt ?? 0));
        } catch (e) {
            console.error('Balance fetch error:', e);
        }
    };

    useEffect(() => {
        fetchBalances();
        const id = setInterval(fetchBalances, 15000);
        return () => clearInterval(id);
    }, [address]);

    const handleModeSelect = (selectedMode) => {
        setMode(selectedMode);
        setShowModeModal(false);
    };

    const handleRedeemPt = async () => {
        if (!ptRedeemAmount || isNaN(ptRedeemAmount)) return;
        setLoading(true);
        setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await redeemPt(user.publicKey, toScaled(ptRedeemAmount));
            setPtRedeemAmount('');
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: 'PT redeemed for stsUSDe principal!', type: 'success' });
        } catch (err) {
            setError(
                err.message?.includes('Wait for maturity')
                    ? 'Cannot redeem PT yet — maturity has not been reached.'
                    : err.message || 'PT redeem failed'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClaimYield = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await claimYield(user.publicKey);
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: 'Yield harvested and paid in stsUSDe!', type: 'success' });
        } catch (err) {
            setError(
                err.message?.includes('No new yield')
                    ? 'No yield has accrued since your last claim.'
                    : err.message || 'Claim yield failed'
            );
        } finally {
            setLoading(false);
        }
    };

    const openTrade = (type) => {
        setSelectedToken(type);
        setIsTradeModalOpen(true);
    };

    const market = {
        id: 1,
        asset: 'stsUSDe',
        fullName: 'Bridged Token',
        maturity: '24 Feb 2026',
        daysLeft: 0,
        yield: '3.3%',
        liquidity: '$4',
        volume: '$4',
        change: '+0.02%',
    };

    const isFixed = mode === 'fixed';
    const modeColor = isFixed ? '#60a5fa' : '#c084fc';
    const modeAlpha = isFixed ? 'rgba(59,130,246,' : 'rgba(168,85,247,';
    const modeLabel = isFixed ? 'Fixed Return' : 'Yield Leverage';
    const modeToken = isFixed ? 'PT' : 'YT';

    return (
        <>
            <TransactionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
                message={modalState.message}
                type={modalState.type}
            />

            {/* Mode Selection Modal */}
            <ModeSelectModal isOpen={showModeModal} onSelect={handleModeSelect} />

            {/* Page Content */}
            {mode && (
                <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-24 pt-8 mx-auto">

                    {/* ── Header ──────────────────────────────────── */}
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
                                    <span
                                        className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full"
                                        style={{
                                            background: `${modeAlpha}0.1)`,
                                            color: modeColor,
                                            border: `1px solid ${modeAlpha}0.2)`,
                                        }}
                                    >
                                        {modeToken} Market
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent-neon">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse shadow-[0_0_6px_rgba(226,255,55,0.8)]" />
                                        Live
                                    </span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none">
                                    {modeLabel.toUpperCase()}
                                </h1>
                                <p className="text-text-dim text-sm mt-3 max-w-md leading-relaxed">
                                    {isFixed
                                        ? 'Buy discounted PT tokens and redeem 1:1 at maturity for guaranteed fixed returns.'
                                        : 'Trade YT tokens to amplify yield exposure and claim accrued yields from your holdings.'}
                                </p>
                            </div>

                            {/* Switch strategy button */}
                            <button
                                onClick={() => setShowModeModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 self-start sm:self-auto"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.5)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                }}
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                </svg>
                                Switch Strategy
                            </button>
                        </div>
                    </div>

                    {/* ── Market Table ──────────────────────────────── */}
                    <div
                        className="glass-panel rounded-[28px] sm:rounded-[36px] overflow-hidden mb-6"
                        style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'none' : 'translateY(20px)',
                            transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1) 200ms, transform 0.6s cubic-bezier(0.19,1,0.22,1) 200ms',
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

                        {/* Row */}
                        <div
                            onMouseEnter={() => setHoveredRow(market.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className="relative border-b border-white/[0.04] last:border-0 transition-all duration-300"
                            style={{
                                background:
                                    hoveredRow === market.id
                                        ? `linear-gradient(90deg, ${modeAlpha}0.025) 0%, rgba(255,255,255,0.03) 100%)`
                                        : 'transparent',
                            }}
                        >
                            {/* Left accent on hover */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300"
                                style={{
                                    background: `linear-gradient(180deg, ${modeColor}, ${modeAlpha}0.3))`,
                                    opacity: hoveredRow === market.id ? 1 : 0,
                                    boxShadow: `4px 0 16px ${modeAlpha}0.3)`,
                                }}
                            />

                            {/* Mobile layout */}
                            <div className="md:hidden p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-11 h-11 rounded-full border flex items-center justify-center font-black text-base"
                                            style={{
                                                background: `linear-gradient(135deg, ${modeAlpha}0.3) 0%, ${modeAlpha}0.1) 100%)`,
                                                borderColor: `${modeAlpha}0.25)`,
                                                color: modeColor,
                                            }}
                                        >
                                            S
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
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                        <div className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Maturity</div>
                                        <div className="text-white font-mono text-xs">{market.maturity}</div>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                        <div className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Liquidity</div>
                                        <div className="text-white font-mono text-xs">{market.liquidity}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openTrade(modeToken)}
                                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
                                    style={{
                                        background: `${modeAlpha}0.12)`,
                                        color: modeColor,
                                        border: `1px solid ${modeAlpha}0.2)`,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = modeColor;
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = `0 0 20px ${modeAlpha}0.4)`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = `${modeAlpha}0.12)`;
                                        e.currentTarget.style.color = modeColor;
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    Trade {modeToken}
                                </button>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-6 items-center">
                                {/* Asset */}
                                <div className="col-span-3 flex items-center gap-4">
                                    <div className="relative w-11 h-11 flex-shrink-0">
                                        <div
                                            className="w-11 h-11 rounded-full border flex items-center justify-center font-black text-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${modeAlpha}0.3) 0%, ${modeAlpha}0.1) 100%)`,
                                                borderColor: `${modeAlpha}0.25)`,
                                                color: modeColor,
                                                boxShadow: `0 0 16px ${modeAlpha}0.15)`,
                                            }}
                                        >
                                            S
                                        </div>
                                        <div
                                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080809]"
                                            style={{ background: '#e2ff37', boxShadow: '0 0 8px rgba(226,255,55,0.6)' }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-[15px] leading-none mb-1">{market.asset}</h3>
                                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-medium">
                                            {market.fullName}
                                        </span>
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

                                {/* Trade */}
                                <div className="col-span-3 flex justify-end">
                                    <button
                                        onClick={() => openTrade(modeToken)}
                                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300"
                                        style={{
                                            background: `${modeAlpha}0.1)`,
                                            color: modeColor,
                                            border: `1px solid ${modeAlpha}0.18)`,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = modeColor;
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.boxShadow = `0 0 24px ${modeAlpha}0.45), 0 4px 12px rgba(0,0,0,0.4)`;
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = `${modeAlpha}0.1)`;
                                            e.currentTarget.style.color = modeColor;
                                            e.currentTarget.style.boxShadow = '';
                                            e.currentTarget.style.transform = '';
                                        }}
                                    >
                                        TRADE {modeToken}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer bar */}
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

                    {/* ── Action Panel ──────────────────────────────── */}
                    <div
                        className="glass-3d rounded-[40px] sm:rounded-[48px] p-4 sm:p-6 lg:p-8"
                        style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'none' : 'translateY(20px)',
                            transition:
                                'opacity 0.7s cubic-bezier(0.19,1,0.22,1) 300ms, transform 0.7s cubic-bezier(0.19,1,0.22,1) 300ms',
                        }}
                    >
                        <div className="mb-5">
                            <span
                                className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                                style={{
                                    background: `${modeAlpha}0.08)`,
                                    color: modeColor,
                                    border: `1px solid ${modeAlpha}0.15)`,
                                }}
                            >
                                {isFixed ? 'Redeem Position' : 'Claim Yield'}
                            </span>
                            <p className="text-text-dim text-xs mt-3 opacity-60">
                                {isFixed
                                    ? 'Redeem your PT tokens at maturity 1:1 for the underlying principal.'
                                    : 'Harvest yield accrued from your YT token holdings.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                            {isFixed ? (
                                <>
                                    {/* PT balance card */}
                                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-1">
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-dim">
                                            Your PT Balance
                                        </span>
                                        <span
                                            className="text-3xl font-black font-mono"
                                            style={{ color: '#60a5fa', textShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                                        >
                                            {ptBal}
                                        </span>
                                        <span className="text-[10px] text-text-dim opacity-50">PT · stsUSDe</span>
                                    </div>

                                    <ActionBox
                                        title="Redeem PT"
                                        subtitle="Redeem principal after maturity 1:1 for stsUSDe"
                                        badgeLabel="Redeem"
                                        badgeColor="#60a5fa"
                                        badgeAlpha="rgba(59,130,246,"
                                        balanceLabel="PT to redeem"
                                        balanceValue={ptBal}
                                        tokenLabel="PT"
                                        actionLabel="Redeem PT"
                                        onAction={handleRedeemPt}
                                        inputValue={ptRedeemAmount}
                                        onInputChange={setPtRedeemAmount}
                                        loading={loading}
                                        disabled={!address || loading || !ptRedeemAmount}
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="#60a5fa" viewBox="0 0 24 24" strokeWidth="1.8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    {/* YT balance card */}
                                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-1">
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-dim">
                                            Your YT Balance
                                        </span>
                                        <span
                                            className="text-3xl font-black font-mono"
                                            style={{ color: '#c084fc', textShadow: '0 0 20px rgba(168,85,247,0.3)' }}
                                        >
                                            {ytBal}
                                        </span>
                                        <span className="text-[10px] text-text-dim opacity-50">YT · stsUSDe</span>
                                    </div>

                                    <ActionBox
                                        title="Claim Yield"
                                        subtitle="Harvest accrued yield from your YT holdings"
                                        badgeLabel="Harvest"
                                        badgeColor="#c084fc"
                                        badgeAlpha="rgba(168,85,247,"
                                        balanceLabel="YT Held"
                                        balanceValue={ytBal}
                                        tokenLabel="YT"
                                        actionLabel="Harvest Yield"
                                        onAction={handleClaimYield}
                                        loading={loading}
                                        disabled={!address || loading}
                                        noInput
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="#c084fc" viewBox="0 0 24 24" strokeWidth="1.8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                    />
                                </>
                            )}
                        </div>

                        {/* Footer status */}
                        <div className="mt-6 flex items-center gap-3 opacity-40">
                            <div className="h-px flex-1 bg-white/[0.06]" />
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{
                                        background: address ? '#e2ff37' : 'rgba(255,255,255,0.3)',
                                        boxShadow: address ? '0 0 6px rgba(226,255,55,0.8)' : 'none',
                                    }}
                                />
                                <span className="text-[10px] text-text-dim font-medium tracking-[0.15em] uppercase whitespace-nowrap">
                                    {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect wallet to interact'}
                                </span>
                            </div>
                            <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                    </div>
                </div>
            )}

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                tokenType={selectedToken}
            />
        </>
    );
}
