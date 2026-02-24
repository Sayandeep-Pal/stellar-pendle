import React, { useState, useEffect } from 'react';
import {
    mintSplit,
    redeemPt,
    claimYield,
    combineAndRedeem,
    initializeWrapper,
    initializeMarketplace,
    checkConnection,
    WRAPPER_ID,
    MARKETPLACE_ID,
} from '../lib/stellar-wrapper';

const DECIMALS = 7;
const toScaled = (v) => BigInt(Math.floor(parseFloat(v) * 10 ** DECIMALS));

/* ── Glass Input ─────────────────────────────────────────────── */
const InputField = ({ label, placeholder, value, onChange, type = 'text' }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[9px] font-black text-text-dim uppercase tracking-[0.22em]">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/15 transition-all duration-200"
            style={{
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.02)',
                outline: 'none',
            }}
            onFocus={e => {
                e.target.style.borderColor = 'rgba(226,255,55,0.35)';
                e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.35), 0 0 0 3px rgba(226,255,55,0.07), 0 0 16px rgba(226,255,55,0.07)';
            }}
            onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.02)';
            }}
        />
    </div>
);

/* ── Glass Section Card ──────────────────────────────────────── */
const SectionCard = ({ title, subtitle, accent = false, delay = 0, children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className="relative rounded-[28px] overflow-hidden flex flex-col gap-5"
            style={{
                background: 'linear-gradient(160deg, rgba(18,18,24,0.9) 0%, rgba(10,10,14,0.95) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                borderTop: accent ? '1px solid rgba(226,255,55,0.2)' : '1px solid rgba(255,255,255,0.1)',
                border: accent ? '1px solid rgba(226,255,55,0.1)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: accent
                    ? '0 0 0 1px rgba(0,0,0,0.5) inset, inset 0 1px 0 rgba(255,255,255,0.07), 0 24px 48px rgba(0,0,0,0.6), 0 0 40px rgba(226,255,55,0.05)'
                    : '0 0 0 1px rgba(0,0,0,0.5) inset, inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.5)',
                padding: '28px',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateY(16px)',
                transition: 'opacity 0.55s cubic-bezier(0.19,1,0.22,1), transform 0.55s cubic-bezier(0.19,1,0.22,1)',
            }}
        >
            {/* Top accent line */}
            <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                    background: accent
                        ? 'linear-gradient(90deg, transparent, rgba(226,255,55,0.5), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                }}
            />

            <div>
                <h2
                    className="text-lg font-black uppercase tracking-tighter italic mb-1"
                    style={accent ? {
                        color: '#e2ff37',
                        textShadow: '0 0 24px rgba(226,255,55,0.4)',
                    } : { color: '#ffffff' }}
                >
                    {title}
                </h2>
                <p className="text-[9px] text-text-dim font-black uppercase tracking-[0.22em] opacity-50">{subtitle}</p>
            </div>

            {children}
        </div>
    );
};

/* ── Admin Action Button ─────────────────────────────────────── */
const AdminBtn = ({ onClick, disabled, isNeon, colorAlpha, colorHex, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3.5 font-black text-[10px] uppercase tracking-[0.18em] rounded-xl transition-all duration-300 relative overflow-hidden active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
        style={isNeon ? {
            background: 'linear-gradient(135deg, #e2ff37 0%, #c8e820 100%)',
            color: '#000',
            border: '1px solid rgba(226,255,55,0.5)',
            boxShadow: disabled ? 'none' : '0 0 24px rgba(226,255,55,0.3), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
        } : colorAlpha ? {
            background: `${colorAlpha}0.1)`,
            color: colorHex,
            border: `1px solid ${colorAlpha}0.22)`,
        } : {
            background: 'rgba(255,255,255,0.06)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => {
            if (!disabled) {
                if (isNeon) {
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(226,255,55,0.45), 0 4px 16px rgba(0,0,0,0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                } else if (colorAlpha) {
                    e.currentTarget.style.background = `${colorAlpha}0.2)`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                } else {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }
            }
        }}
        onMouseLeave={e => {
            if (!disabled) e.currentTarget.style.transform = '';
        }}
    >
        {!disabled && (
            <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        )}
        <span className="relative">{children}</span>
    </button>
);

/* ── Admin Page ──────────────────────────────────────────────── */
const AdminPage = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [pageVisible, setPageVisible] = useState(false);
    const [mintAmount, setMintAmount] = useState('');
    const [redeemAmount, setRedeemAmount] = useState('');
    const [combineAmount, setCombineAmount] = useState('');
    const [wInit, setWInit] = useState({ stsusdcAddress: '', maturityTimestamp: '', oracleAddress: '' });
    const [mInit, setMInit] = useState({ wrapperAddress: WRAPPER_ID, usdcAddress: '' });

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    const run = async (label, fn) => {
        setLoading(true);
        setStatus(null);
        try {
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');
            await fn(user.publicKey);
            setStatus({ type: 'success', message: `${label} — success!` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: err.message || `${label} failed` });
        } finally {
            setLoading(false);
        }
    };

    const handleInitWrapper = () => {
        const ts = parseInt(wInit.maturityTimestamp, 10);
        if (!wInit.stsusdcAddress || !wInit.oracleAddress || isNaN(ts)) {
            setStatus({ type: 'error', message: 'Fill all Wrapper init fields with valid values.' });
            return;
        }
        run('Initialize Wrapper', () => initializeWrapper(wInit.stsusdcAddress, ts, wInit.oracleAddress));
    };

    const handleInitMarketplace = () => {
        if (!mInit.wrapperAddress || !mInit.usdcAddress) {
            setStatus({ type: 'error', message: 'Fill all Marketplace init fields.' });
            return;
        }
        run('Initialize Marketplace', () => initializeMarketplace(mInit.wrapperAddress, mInit.usdcAddress));
    };

    return (
        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-24 pt-8 mx-auto">

            {/* ── Header ────────────────────────────────────── */}
            <div
                className="mb-10"
                style={{
                    opacity: pageVisible ? 1 : 0,
                    transform: pageVisible ? 'none' : 'translateY(12px)',
                    transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1), transform 0.6s cubic-bezier(0.19,1,0.22,1)',
                }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-dim bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
                        Restricted Access
                    </span>
                    <span
                        className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}
                    >
                        Admin
                    </span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black text-white italic tracking-tighter leading-none">
                    ADMIN DASHBOARD
                </h1>
                <p className="text-text-dim text-xs mt-2 uppercase tracking-[0.25em] font-bold opacity-50">
                    Contract management &amp; initialization
                </p>
            </div>

            {/* ── Status Banner ──────────────────────────────── */}
            {status && (
                <div
                    className="mb-8 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-slide-in-up"
                    style={status.type === 'success' ? {
                        background: 'rgba(226,255,55,0.07)',
                        color: '#e2ff37',
                        border: '1px solid rgba(226,255,55,0.2)',
                        boxShadow: '0 0 20px rgba(226,255,55,0.06)',
                    } : {
                        background: 'rgba(239,68,68,0.07)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        boxShadow: '0 0 20px rgba(239,68,68,0.06)',
                    }}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        {status.type === 'success'
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        }
                    </svg>
                    {status.message}
                </div>
            )}

            {/* ── Contract Initialization ────────────────────── */}
            <div className="mb-3">
                <h2
                    className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] mb-5 flex items-center gap-3"
                >
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    Contract Initialization
                    <div className="h-px flex-1 bg-white/[0.06]" />
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                {/* Init PendleWrapper */}
                <SectionCard
                    title="Init PendleWrapper"
                    subtitle={`Contract: ${WRAPPER_ID.slice(0, 14)}…`}
                    accent
                    delay={0}
                >
                    <div
                        className="text-[9px] text-text-dim/40 font-mono leading-relaxed break-all px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(226,255,55,0.03)', border: '1px solid rgba(226,255,55,0.06)' }}
                    >
                        {WRAPPER_ID}
                    </div>
                    <div className="flex flex-col gap-3.5">
                        <InputField
                            label="stsUSDe / stUSDC Token Address"
                            placeholder="C... token contract address"
                            value={wInit.stsusdcAddress}
                            onChange={v => setWInit(s => ({ ...s, stsusdcAddress: v }))}
                        />
                        <InputField
                            label="Maturity Unix Timestamp"
                            placeholder="e.g. 1772000000"
                            value={wInit.maturityTimestamp}
                            onChange={v => setWInit(s => ({ ...s, maturityTimestamp: v }))}
                            type="number"
                        />
                        <InputField
                            label="Oracle / Bridge Contract Address"
                            placeholder="C... oracle contract address"
                            value={wInit.oracleAddress}
                            onChange={v => setWInit(s => ({ ...s, oracleAddress: v }))}
                        />
                    </div>
                    <AdminBtn onClick={handleInitWrapper} disabled={loading} isNeon>
                        {loading ? 'Processing...' : 'Initialize Wrapper Contract'}
                    </AdminBtn>
                </SectionCard>

                {/* Init Marketplace */}
                <SectionCard
                    title="Init Marketplace"
                    subtitle={`Contract: ${MARKETPLACE_ID.slice(0, 14)}…`}
                    delay={100}
                >
                    <div
                        className="text-[9px] text-text-dim/40 font-mono leading-relaxed break-all px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        {MARKETPLACE_ID}
                    </div>
                    <div className="flex flex-col gap-3.5">
                        <InputField
                            label="Wrapper Contract Address"
                            placeholder={WRAPPER_ID}
                            value={mInit.wrapperAddress}
                            onChange={v => setMInit(s => ({ ...s, wrapperAddress: v }))}
                        />
                        <InputField
                            label="USDC Token Address"
                            placeholder="C... USDC token contract address"
                            value={mInit.usdcAddress}
                            onChange={v => setMInit(s => ({ ...s, usdcAddress: v }))}
                        />
                    </div>
                    <AdminBtn onClick={handleInitMarketplace} disabled={loading}>
                        {loading ? 'Processing...' : 'Initialize Marketplace Contract'}
                    </AdminBtn>
                </SectionCard>
            </div>

            {/* ── Position Management ─────────────────────────── */}
            <div className="mb-3">
                <h2 className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] mb-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    Position Management
                    <div className="h-px flex-1 bg-white/[0.06]" />
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Wrap & Mint */}
                <SectionCard
                    title="Wrap stsUSDe → Mint PT + YT"
                    subtitle="Deposit stsUSDe and receive equal PT and YT"
                    delay={200}
                >
                    <InputField
                        label="Amount (stsUSDe)"
                        placeholder="0.00"
                        value={mintAmount}
                        onChange={setMintAmount}
                        type="number"
                    />
                    <AdminBtn
                        onClick={() => run('Mint PT + YT', (pk) => mintSplit(pk, toScaled(mintAmount)))}
                        disabled={loading || !mintAmount}
                        isNeon
                    >
                        {loading ? 'Processing...' : 'Wrap & Mint'}
                    </AdminBtn>
                </SectionCard>

                {/* Redeem & Exit */}
                <SectionCard
                    title="Redeem &amp; Exit"
                    subtitle="Redeem PT after maturity, claim yield, or exit early"
                    delay={300}
                >
                    <InputField
                        label="Amount for Redeem PT / Early Exit"
                        placeholder="0.00"
                        value={redeemAmount}
                        onChange={setRedeemAmount}
                        type="number"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <AdminBtn
                            onClick={() => run('Redeem PT', (pk) => redeemPt(pk, toScaled(redeemAmount)))}
                            disabled={loading || !redeemAmount}
                            colorAlpha="rgba(59,130,246,"
                            colorHex="#60a5fa"
                        >
                            Redeem PT
                        </AdminBtn>
                        <AdminBtn
                            onClick={() => run('Claim Yield', (pk) => claimYield(pk))}
                            disabled={loading}
                            colorAlpha="rgba(168,85,247,"
                            colorHex="#c084fc"
                        >
                            Claim Yield
                        </AdminBtn>
                    </div>

                    <InputField
                        label="Amount for Early Exit (burns equal PT + YT)"
                        placeholder="0.00"
                        value={combineAmount}
                        onChange={setCombineAmount}
                        type="number"
                    />

                    <AdminBtn
                        onClick={() => run('Combine & Redeem', (pk) => combineAndRedeem(pk, toScaled(combineAmount)))}
                        disabled={loading || !combineAmount}
                        colorAlpha="rgba(239,68,68,"
                        colorHex="#f87171"
                    >
                        Early Exit (Combine PT + YT)
                    </AdminBtn>
                </SectionCard>
            </div>
        </div>
    );
};

export default AdminPage;
