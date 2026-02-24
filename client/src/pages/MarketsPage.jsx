import { useState, useEffect } from 'react';
import {
    mintSplit,
    redeemPt,
    claimYield,
    combineAndRedeem,
    getPtBalance,
    getYtBalance,
    checkConnection,
    scaleDown,
} from '../lib/stellar-wrapper';
import TransactionModal from '../components/TransactionModal';

const DECIMALS = 7;
const toScaled = (v) => BigInt(Math.floor(parseFloat(v) * 10 ** DECIMALS));

/* ── Action Card ────────────────────────────────────────────── */
const ActionBox = ({
    title, subtitle, badgeColor, badgeAlpha, badgeLabel,
    balanceLabel, balanceValue, tokenLabel,
    actionLabel, onAction, loading, disabled,
    inputValue, onInputChange, isNeon, noInput,
    icon, delay = 0,
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className="glass-3d relative flex flex-col h-full rounded-[28px]"
            style={{
                /* color-reactive top/left border override */
                borderTop:    `1px solid ${badgeAlpha}0.22)`,
                borderLeft:   `1px solid ${badgeAlpha}0.14)`,
                /* entry animation */
                opacity:    mounted ? 1 : 0,
                transform:  mounted ? undefined : 'translateY(18px)',
                transition: mounted
                    ? undefined
                    : 'opacity 0.55s cubic-bezier(0.19,1,0.22,1), transform 0.55s cubic-bezier(0.19,1,0.22,1)',
            }}
        >
            {/* Color rim line at top */}
            <div
                className="absolute top-0 inset-x-0 h-px pointer-events-none z-10"
                style={{ background: `linear-gradient(90deg, transparent, ${badgeAlpha}0.5), transparent)` }}
            />

            <div className="flex flex-col flex-1 p-6 gap-5 relative z-[1]">
                {/* Header row */}
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

                    {/* Icon orb — glass-orb */}
                    <div
                        className="glass-orb w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            borderTopColor:  `${badgeAlpha}0.28)`,
                            borderLeftColor: `${badgeAlpha}0.18)`,
                        }}
                    >
                        {icon}
                    </div>
                </div>

                {/* Balance / input well — glass-inset */}
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
                            style={{ color: badgeColor, textShadow: `0 0 20px ${badgeAlpha}0.3)` }}
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
                {isNeon ? (
                    <button
                        onClick={onAction}
                        disabled={disabled}
                        className="glass-neon-btn mt-auto w-full py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em]
                                   disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                                   flex items-center justify-center gap-2"
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
                ) : (
                    <button
                        onClick={onAction}
                        disabled={disabled}
                        className="glass-3d-btn mt-auto w-full py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black
                                   disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                                   flex items-center justify-center gap-2"
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
                )}
            </div>
        </div>
    );
};

/* ── Main Page ─────────────────────────────────────────────── */
export default function MarketsPage({ address, pendleBalances, refreshData, setLoading, loading, setError }) {
    const [wrapAmount, setWrapAmount] = useState('');
    const [ptRedeemAmount, setPtRedeemAmount] = useState('');
    const [earlyExitAmount, setEarlyExitAmount] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, message: '', type: 'success' });
    const [ptBal, setPtBal] = useState('0.0000');
    const [ytBal, setYtBal] = useState('0.0000');
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
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

    const handleWrap = async () => {
        if (!wrapAmount || isNaN(wrapAmount)) return;
        setLoading(true); setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await mintSplit(user.publicKey, toScaled(wrapAmount));
            setWrapAmount('');
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: `Wrapped ${wrapAmount} stsUSDe → PT + YT minted!`, type: 'success' });
        } catch (err) {
            setError(err.message || 'Wrap failed.');
        } finally { setLoading(false); }
    };

    const handleRedeemPt = async () => {
        if (!ptRedeemAmount || isNaN(ptRedeemAmount)) return;
        setLoading(true); setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await redeemPt(user.publicKey, toScaled(ptRedeemAmount));
            setPtRedeemAmount('');
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: 'PT redeemed for stsUSDe principal!', type: 'success' });
        } catch (err) {
            setError(err.message?.includes('Wait for maturity')
                ? 'Cannot redeem PT yet — maturity has not been reached.'
                : err.message || 'PT redeem failed');
        } finally { setLoading(false); }
    };

    const handleClaimYield = async () => {
        setLoading(true); setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await claimYield(user.publicKey);
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: 'Yield harvested and paid in stsUSDe!', type: 'success' });
        } catch (err) {
            setError(err.message?.includes('No new yield')
                ? 'No yield has accrued since your last claim.'
                : err.message || 'Claim yield failed');
        } finally { setLoading(false); }
    };

    const handleEarlyExit = async () => {
        if (!earlyExitAmount || isNaN(earlyExitAmount)) return;
        setLoading(true); setError(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await combineAndRedeem(user.publicKey, toScaled(earlyExitAmount));
            setEarlyExitAmount('');
            await fetchBalances();
            if (refreshData) await refreshData();
            setModalState({ isOpen: true, message: 'PT + YT combined and redeemed!', type: 'success' });
        } catch (err) {
            setError(err.message?.includes('both PT and YT')
                ? 'Insufficient PT or YT — you need equal amounts of both.'
                : err.message || 'Early exit failed');
        } finally { setLoading(false); }
    };

    return (
        <>
            <TransactionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
                message={modalState.message}
                type={modalState.type}
            />

            <main className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 py-8 pb-24 mx-auto">

                {/* ── Page Header ──────────────────────────────── */}
                <div
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6"
                    style={{
                        opacity:    pageVisible ? 1 : 0,
                        transform:  pageVisible ? 'none' : 'translateY(12px)',
                        transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1), transform 0.6s cubic-bezier(0.19,1,0.22,1)',
                    }}
                >
                    <div>
                        {/* Section badge — glass-inset chip */}
                        <span className="glass-inset text-[10px] font-black uppercase tracking-[0.25em] text-text-dim px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-4">
                            <span
                                className="w-1 h-1 rounded-full bg-accent-neon animate-pulse"
                                style={{ boxShadow: '0 0 5px rgba(226,255,55,0.8)' }}
                            />
                            Yield Derivatives
                        </span>
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none uppercase">
                            Derivatives
                        </h2>
                        <p className="text-text-dim font-medium text-xs mt-2 tracking-[0.2em] uppercase opacity-50">
                            Manage your Principal &amp; Yield Asset positions
                        </p>
                    </div>

                    {/* Balance Stat Pills — glass-3d */}
                    <div className="flex gap-3 flex-wrap">
                        {[
                            { label: 'PT Balance', value: ptBal, color: '#ffffff', glow: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.18)' },
                            { label: 'YT Balance', value: ytBal, color: '#e2ff37', glow: 'rgba(226,255,55,0.35)', borderColor: 'rgba(226,255,55,0.22)' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="glass-3d px-6 py-4 rounded-2xl flex flex-col items-center min-w-[160px]"
                                style={{
                                    borderTopColor:  stat.borderColor,
                                    borderLeftColor: stat.borderColor,
                                }}
                            >
                                <span className="text-[9px] text-text-dim font-black uppercase tracking-[0.2em] mb-1.5">
                                    {stat.label}
                                </span>
                                <span
                                    className="text-3xl font-black font-mono tracking-tighter"
                                    style={{ color: stat.color, textShadow: `0 0 24px ${stat.glow}` }}
                                >
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Action Cards Grid — outer glass-3d shell ─── */}
                <div
                    className="glass-3d rounded-[40px] sm:rounded-[48px] p-4 sm:p-6 lg:p-8"
                    style={{
                        opacity:    pageVisible ? 1 : 0,
                        transform:  pageVisible ? undefined : 'translateY(20px)',
                        transition: pageVisible
                            ? undefined
                            : 'opacity 0.7s cubic-bezier(0.19,1,0.22,1) 150ms, transform 0.7s cubic-bezier(0.19,1,0.22,1) 150ms',
                    }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        {/* 1 — Wrap & Split */}
                        <ActionBox
                            title="Wrap & Split"
                            subtitle="Deposit stsUSDe, receive equal PT + YT"
                            badgeLabel="Mint"
                            badgeColor="#e2ff37"
                            badgeAlpha="rgba(226,255,55,"
                            balanceLabel="stsUSDe to wrap"
                            balanceValue="--"
                            tokenLabel="stsUSDe"
                            actionLabel="Wrap & Mint"
                            onAction={handleWrap}
                            inputValue={wrapAmount}
                            onInputChange={setWrapAmount}
                            loading={loading}
                            disabled={!address || loading || !wrapAmount}
                            isNeon
                            delay={0}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="#e2ff37" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        />

                        {/* 2 — Redeem PT */}
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
                            isNeon={false}
                            delay={80}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="#60a5fa" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />

                        {/* 3 — Claim Yield (purple) */}
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
                            isNeon={false}
                            noInput
                            delay={160}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="#c084fc" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />

                        {/* 4 — Early Exit */}
                        <ActionBox
                            title="Early Exit"
                            subtitle="Merge equal PT + YT to exit and recover stsUSDe"
                            badgeLabel="Exit"
                            badgeColor="#f87171"
                            badgeAlpha="rgba(239,68,68,"
                            balanceLabel="Min(PT, YT) available"
                            balanceValue={`${Math.min(parseFloat(ptBal), parseFloat(ytBal)).toFixed(4)}`}
                            tokenLabel="PT+YT"
                            actionLabel="Combine & Exit"
                            onAction={handleEarlyExit}
                            inputValue={earlyExitAmount}
                            onInputChange={setEarlyExitAmount}
                            loading={loading}
                            disabled={!address || loading || !earlyExitAmount}
                            isNeon={false}
                            delay={240}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="#f87171" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            }
                        />
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

            </main>
        </>
    );
}
