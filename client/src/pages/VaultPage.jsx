import { useState } from 'react';
import { deposit, redeem, initializeVault } from '../lib/stellar';

const SwapPanel = ({ label, balanceLabel, balanceValue, tokenName, networkName, amount, isEditable, onInputChange }) => {
    return (
        <div className="bg-card-dark rounded-[32px] p-6 flex flex-col gap-6 border border-white/5 flex-1 hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center">
                <span className="text-text-dim text-xs font-semibold uppercase tracking-widest">{label}:</span>
                <span className="text-white text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/5 font-mono">
                    Stellar Testnet
                </span>
            </div>

            <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col gap-1">
                    <span className="text-text-dim/60 uppercase tracking-tighter text-[9px]">Token</span>
                    <button className="flex items-center gap-2 text-white font-bold text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-black">
                            {tokenName.substring(0, 1)}
                        </div>
                        {tokenName}
                        <svg className="w-3 h-3 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-text-dim/60 uppercase tracking-tighter text-[9px]">Network</span>
                    {/* <button className="flex items-center gap-2 text-white font-bold text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                        <div className="w-5 h-5 rounded-full bg-accent-neon text-black flex items-center justify-center text-[8px] font-black">
                            S
                        </div>
                        {networkName}
                        <svg className="w-3 h-3 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button> */}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2 px-1">
                    <span>{balanceLabel}:</span>
                    <span>Balance: <span className="text-white font-mono">{balanceValue}</span> {isEditable && <span className="text-accent-neon ml-2 cursor-pointer hover:underline">MAX</span>}</span>
                </div>
                {isEditable ? (
                    <div className="flex flex-col gap-1">
                        <input
                            type="number"
                            placeholder="0.00"
                            className="bg-transparent text-5xl font-light text-white outline-none w-full placeholder-white/5"
                            value={amount}
                            onChange={(e) => onInputChange(e.target.value)}
                        />
                        <div className="text-[10px] text-text-dim/50 ml-1">≈ $ --.--</div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <div className="text-5xl font-light text-white/40 truncate">
                            {amount || '0.00'}
                        </div>
                        <div className="text-[10px] text-text-dim/50 ml-1">≈ $ --.--</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function VaultPage({ address, balance, rate, metadata, refreshData, setLoading, loading, setError }) {
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');

    const handleAction = async () => {
        if (!amount || isNaN(amount)) return;
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'deposit') {
                await deposit(address, parseFloat(amount));
                alert('Deposit successful!');
            } else {
                await redeem(address, parseFloat(amount));
                alert('Redeem successful!');
            }
            setAmount('');
            await refreshData();
        } catch (err) {
            console.error(`${activeTab} Error:`, err);
            if (err.message?.includes('Unknown error')) {
                setError(`Transaction failed. This usually means the Yield Vault at ${activeTab} is not initialized for the new ID. Try running 'Init Vault' at the bottom.`);
            } else {
                setError(err.message || 'Transaction failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center w-full py-12 px-4 gap-8">

            <div className="bg-panel-glass backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 w-full max-w-[1000px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative">
                {/* Header Tabs - Simplified to Title */}
                <div className="flex justify-between items-center mb-10 px-2">
                    <div className="flex gap-8 items-center">
                        <h2 className="text-2xl font-black tracking-tighter text-white italic uppercase">
                            Yield Gateway
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={refreshData}
                            className="p-3 text-text-dim hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12V7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Side by Side Panels */}
                <div className="flex flex-col lg:flex-row gap-4 items-center relative">
                    <SwapPanel
                        label="From"
                        balanceLabel="You send"
                        balanceValue={activeTab === 'deposit' ? '--' : balance}
                        tokenName={activeTab === 'deposit' ? 'XLM' : (metadata.symbol || 'wXLM')}
                        networkName="Binance"
                        amount={amount}
                        isEditable={true}
                        onInputChange={setAmount}
                    />

                    {/* Desktop Switcher Overlay - Toggle Logical */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex"
                        onClick={() => setActiveTab(activeTab === 'deposit' ? 'redeem' : 'deposit')}
                    >
                        <div className="bg-card-dark border-4 border-[#1c1c1e] rounded-2xl p-3 text-text-dim hover:text-accent-neon hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-black shadow-2xl group/switch">
                            <svg
                                className={`w-6 h-6 transition-transform duration-500 ${activeTab === 'redeem' ? 'rotate-180 text-accent-neon' : ''}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </div>
                    </div>
                    {/* Mobile Switcher */}
                    <div
                        className="flex lg:hidden bg-card-dark border border-white/5 rounded-xl p-3 text-text-dim active:bg-white/10"
                        onClick={() => setActiveTab(activeTab === 'deposit' ? 'redeem' : 'deposit')}
                    >
                        <svg
                            className={`w-5 h-5 transition-transform duration-500 ${activeTab === 'redeem' ? 'rotate-180 text-accent-neon' : ''}`}
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
                        networkName="Avalanche"
                        amount={amount}
                        isEditable={false}
                    />
                </div>

                {/* Footer Info & Final Action */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 px-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-dim">
                            <span className="text-white">1 XLM = 1.00 wXLM</span>
                            <span className="text-accent-neon bg-accent-neon/10 px-2 py-0.5 rounded-md font-mono">+5.62% (24H)</span>
                        </div>
                        <p className="text-[10px] text-text-dim/50 uppercase tracking-widest leading-relaxed">Rate is for reference only. Updated just now</p>
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={!address || loading || !amount}
                        className="bg-accent-neon hover:brightness-110 active:scale-95 text-black font-black py-5 px-10 rounded-[30px] flex items-center gap-4 text-sm shadow-[0_20px_40px_rgba(226,255,55,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
                    >
                        {loading ? 'Processing...' : 'Mint >>>'}
                    </button>
                </div>
            </div>

            {/* Developer Section */}
            <div className="mt-20 border-t border-white/5 pt-10 flex flex-col items-center gap-4">
                <span className="text-[10px] text-text-dim uppercase tracking-[0.5em] font-black">Contract Developer Utils</span>
                <button
                    onClick={async () => {
                        if (!address) return;
                        setLoading(true);
                        setError(null);
                        try {
                            await initializeVault(address);
                            alert('Yield Vault Initialized!');
                        } catch (e) {
                            setError(e.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-text-dim font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                    Bootstrap: Init New Vault
                </button>
            </div>
        </main>
    );
}
