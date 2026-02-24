import { useState, useEffect } from 'react';
import { deposit, redeem, initializeVault } from '../lib/stellar';
import TransactionModal from '../components/TransactionModal';

/* ── SwapPanel — 3D glass card ─────────────────────────────── */
const SwapPanel = ({ label, balanceLabel, balanceValue, tokenName, amount, isEditable, onInputChange }) => {
    return (
        <div
            className="glass-3d flex-1 rounded-[28px] p-6 flex flex-col gap-5
                       transition-all duration-400"
        >
            {/* Top row */}
            <div className="flex justify-between items-center">
                <span
                    className="text-[9px] font-black uppercase tracking-[0.22em]"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                    {label}
                </span>
                {/* Network badge — glass-inset micro chip */}
                <span
                    className="glass-inset text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Stellar Testnet
                </span>
            </div>

            {/* Token selector */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-dim/50">Token</span>
                    {/* Token pill — glass-3d-btn */}
                    <button
                        className="glass-3d-btn flex items-center gap-2 text-white font-black text-sm px-3.5 py-2 rounded-xl"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Token avatar orb */}
                        <div
                            className="glass-orb w-5 h-5 rounded-full flex items-center justify-center
                                       text-[8px] font-black text-white flex-shrink-0"
                        >
                            {tokenName.substring(0, 1)}
                        </div>
                        <span className="text-sm font-black">{tokenName}</span>
                        <svg className="w-3 h-3 text-text-dim ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                {/* Empty right col for symmetry */}
                <div />
            </div>

            {/* Amount input well — glass-inset */}
            <div className="mt-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.18em] text-text-dim mb-2 px-1">
                    <span>{balanceLabel}</span>
                    <span>
                        Balance:{' '}
                        <span className="text-white font-mono">{balanceValue}</span>
                        {isEditable && (
                            <button
                                className="ml-2 font-black tracking-widest transition-all duration-200 hover:opacity-80"
                                style={{ color: '#e2ff37', textShadow: '0 0 8px rgba(226,255,55,0.5)' }}
                                onClick={() => onInputChange && onInputChange(balanceValue)}
                            >
                                MAX
                            </button>
                        )}
                    </span>
                </div>
                {/* Recessed input */}
                <div className="glass-inset rounded-2xl px-5 py-4 relative">
                    {/* Inner top micro-gloss */}
                    <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }}
                    />
                    {isEditable ? (
                        <>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="bg-transparent text-5xl font-light text-white outline-none w-full placeholder-white/[0.07] [appearance:textfield]"
                                value={amount}
                                onChange={(e) => onInputChange(e.target.value)}
                            />
                            <div className="text-[10px] text-text-dim/40 mt-1 font-medium">≈ $ --.--</div>
                        </>
                    ) : (
                        <>
                            <div className="text-5xl font-light text-white/35 truncate">{amount || '0.00'}</div>
                            <div className="text-[10px] text-text-dim/40 mt-1 font-medium">≈ $ --.--</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── VaultPage ─────────────────────────────────────────────── */
export default function VaultPage({ address, balance, rate, metadata, refreshData, setLoading, loading, setError }) {
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, message: '', type: 'success' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    const handleAction = async () => {
        if (!amount || isNaN(amount)) return;
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'deposit') {
                await deposit(address, parseFloat(amount));
                setModalState({ isOpen: true, message: 'Deposit successful!', type: 'success' });
            } else {
                await redeem(address, parseFloat(amount));
                setModalState({ isOpen: true, message: 'Redeem successful!', type: 'success' });
            }
            setAmount('');
            await refreshData();
        } catch (err) {
            console.error(`${activeTab} Error:`, err);
            if (err.message?.includes('Unknown error')) {
                setError(`Transaction failed. This usually means the Yield Vault is not initialized. Try 'Init Vault' below.`);
            } else {
                setError(err.message || 'Transaction failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TransactionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                message={modalState.message}
                type={modalState.type}
            />

            <main className="flex flex-col items-center w-full py-10 px-4 gap-8 pb-24">

                {/* ── Main Vault Panel — glass-3d ──────────────── */}
                <div
                    className="glass-3d rounded-[40px] sm:rounded-[48px] p-8 sm:p-10 w-full max-w-[1000px]"
                    style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'none' : 'translateY(20px)',
                        transition: 'opacity 0.65s cubic-bezier(0.19,1,0.22,1), transform 0.65s cubic-bezier(0.19,1,0.22,1)',
                        /* override hover lift for large container */
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.002)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                    }}
                >

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 px-1">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black tracking-tighter text-white italic uppercase">
                                Yield Gateway
                            </h2>
                            {/* Live badge */}
                            <span
                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                                style={{
                                    background: 'rgba(226,255,55,0.08)',
                                    color: '#e2ff37',
                                    border: '1px solid rgba(226,255,55,0.18)',
                                    textShadow: '0 0 8px rgba(226,255,55,0.5)',
                                }}
                            >
                                <span className="w-1 h-1 rounded-full bg-accent-neon animate-pulse"
                                    style={{ boxShadow: '0 0 5px rgba(226,255,55,0.9)' }} />
                                Live
                            </span>
                        </div>

                        {/* Refresh — glass-3d-btn icon button */}
                        <button
                            onClick={refreshData}
                            className="glass-3d-btn p-3 rounded-2xl text-text-dim hover:text-white transition-colors duration-200"
                            title="Refresh balances"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12V7" />
                            </svg>
                        </button>
                    </div>

                    {/* Deposit / Redeem Tab toggle — glass-inset pill */}
                    <div
                        className="glass-inset flex p-1 rounded-2xl mb-8 w-fit mx-auto"
                        style={{ gap: '2px' }}
                    >
                        {['deposit', 'redeem'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300"
                                style={activeTab === tab ? {
                                    background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                                    color: '#ffffff',
                                    borderTop:    '1px solid rgba(255,255,255,0.16)',
                                    borderLeft:   '1px solid rgba(255,255,255,0.10)',
                                    borderRight:  '1px solid rgba(255,255,255,0.04)',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    boxShadow:
                                        '0 4px 12px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.35) inset, inset 0 1px 0 rgba(255,255,255,0.10)',
                                    textShadow: '0 0 16px rgba(255,255,255,0.4)',
                                } : {
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.30)',
                                    border: '1px solid transparent',
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Swap panels */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center relative">
                        <SwapPanel
                            label="From"
                            balanceLabel="You send"
                            balanceValue={activeTab === 'deposit' ? '--' : balance}
                            tokenName={activeTab === 'deposit' ? 'XLM' : (metadata.symbol || 'wXLM')}
                            amount={amount}
                            isEditable
                            onInputChange={setAmount}
                        />

                        {/* Desktop switcher — glass-orb */}
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex"
                            onClick={() => setActiveTab(activeTab === 'deposit' ? 'redeem' : 'deposit')}
                        >
                            <div
                                className="glass-orb p-3 rounded-2xl cursor-pointer
                                           hover:shadow-[0_0_20px_rgba(226,255,55,0.15)] transition-all duration-300
                                           hover:scale-110 active:scale-90"
                            >
                                <svg
                                    className={`w-5 h-5 transition-all duration-500 ${activeTab === 'redeem' ? 'rotate-180 text-accent-neon' : 'text-text-dim'}`}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </div>
                        </div>

                        {/* Mobile switcher */}
                        <div
                            className="flex lg:hidden glass-3d-btn rounded-xl p-3 cursor-pointer"
                            onClick={() => setActiveTab(activeTab === 'deposit' ? 'redeem' : 'deposit')}
                        >
                            <svg
                                className={`w-5 h-5 transition-transform duration-500 ${activeTab === 'redeem' ? 'rotate-180 text-accent-neon' : 'text-text-dim'}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <path d="m7 10 5 5 5-5" />
                            </svg>
                        </div>

                        <SwapPanel
                            label="To"
                            balanceLabel="You receive"
                            balanceValue={activeTab === 'deposit' ? balance : '--'}
                            tokenName={activeTab === 'deposit' ? (metadata.symbol || 'wXLM') : 'XLM'}
                            amount={amount}
                            isEditable={false}
                        />
                    </div>

                    {/* Footer row */}
                    <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-6 px-1">
                        {/* Rate display — glass-inset badge */}
                        <div
                            className="glass-inset flex flex-col gap-1.5 px-5 py-3.5 rounded-2xl"
                        >
                            <div className="flex items-center gap-3 text-xs font-bold text-text-dim">
                                <span className="text-white font-mono">1 XLM = 1.00 wXLM</span>
                                <span
                                    className="font-black font-mono px-2.5 py-0.5 rounded-lg text-[10px]"
                                    style={{
                                        color: '#e2ff37',
                                        background: 'rgba(226,255,55,0.08)',
                                        border: '1px solid rgba(226,255,55,0.15)',
                                        textShadow: '0 0 8px rgba(226,255,55,0.4)',
                                    }}
                                >
                                    +5.62%
                                </span>
                            </div>
                            <p className="text-[9px] text-text-dim/40 uppercase tracking-[0.2em] font-bold">
                                Rate for reference only · Updated now
                            </p>
                        </div>

                        {/* Action CTA — glass-neon-btn */}
                        <button
                            onClick={handleAction}
                            disabled={!address || loading || !amount}
                            className="glass-neon-btn py-4 px-10 rounded-[28px] text-sm uppercase tracking-[0.22em]
                                       disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none
                                       disabled:shadow-none flex items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {activeTab === 'deposit' ? 'Deposit' : 'Redeem'}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Developer Utils ───────────────────────────── */}
                <div
                    className="flex flex-col items-center gap-4 mt-8"
                    style={{
                        opacity: mounted ? 1 : 0,
                        transition: 'opacity 0.6s cubic-bezier(0.19,1,0.22,1) 300ms',
                    }}
                >
                    <div className="flex items-center gap-3 opacity-40">
                        <div className="h-px w-16 bg-white/10" />
                        <span className="text-[9px] text-text-dim uppercase tracking-[0.4em] font-black whitespace-nowrap">
                            Contract Developer Utils
                        </span>
                        <div className="h-px w-16 bg-white/10" />
                    </div>

                    <button
                        onClick={async () => {
                            if (!address) return;
                            setLoading(true);
                            setError(null);
                            try {
                                await initializeVault(address);
                                setModalState({ isOpen: true, message: 'Yield Vault Initialized!', type: 'success' });
                            } catch (e) {
                                setError(e.message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="glass-3d-btn px-6 py-2.5 rounded-xl
                                   text-[9px] font-black uppercase tracking-[0.18em] text-text-dim hover:text-white"
                    >
                        Bootstrap: Init New Vault
                    </button>
                </div>

            </main>
        </>
    );
}
