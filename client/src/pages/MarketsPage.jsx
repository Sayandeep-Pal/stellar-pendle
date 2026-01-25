import { useState, useEffect } from 'react';
import { wrapPendle, redeemPt, claimYield, combineAndRedeem, initializeWrapper, getRate } from '../lib/stellar';
import TransactionModal from '../components/TransactionModal';

const MarketActionBox = ({ title, subtitle, balanceLabel, balanceValue, tokenLabel, actionLabel, onAction, loading, disabled, inputValue, onInputChange, isNeon }) => {
    return (
        <div className="bg-card-dark rounded-[32px] p-8 border border-white/5 flex flex-col gap-6 hover:border-white/10 transition-all group h-full">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">{title}</h3>
                    <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 leading-relaxed max-w-[200px]">{subtitle}</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <svg className="w-5 h-5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 border border-white/5 flex flex-col gap-3 group-hover:bg-black/50 transition-all">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">
                    <span>{balanceLabel}:</span>
                    <span><span className="text-white font-mono">{balanceValue}</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        placeholder="0.00"
                        className="bg-transparent text-3xl font-light text-white outline-none w-full placeholder-white/5"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                    />
                    <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded border border-white/10 text-text-dim uppercase tracking-tighter">
                        {tokenLabel}
                    </span>
                </div>
            </div>

            <button
                onClick={onAction}
                disabled={disabled}
                className={`mt-auto w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-40 shadow-xl ${isNeon ? 'bg-accent-neon text-black flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_10px_30px_rgba(226,255,55,0.1)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
                {loading ? 'Processing...' : actionLabel}
            </button>
        </div>
    );
};

export default function MarketsPage({ address, pendleBalances, refreshData, setLoading, loading, setError }) {
    const [wrapAmount, setWrapAmount] = useState('');
    const [ptRedeemAmount, setPtRedeemAmount] = useState('');
    const [earlyExitAmount, setEarlyExitAmount] = useState('');
    const [currentRate, setCurrentRate] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, message: '', type: 'success' });

    // Fetch rate on mount and poll every 10 seconds
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const rate = await getRate();
                setCurrentRate(rate);
            } catch (err) {
                console.error('Failed to fetch rate:', err);
            }
        };

        // Initial fetch
        fetchRate();

        // Set up polling every 10 seconds
        const interval = setInterval(fetchRate, 5000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    const handleWrap = async () => {
        if (!wrapAmount || isNaN(wrapAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await wrapPendle(address, parseFloat(wrapAmount));
            setWrapAmount('');
            await refreshData();
            setModalState({ isOpen: true, message: 'Wrapped successfully!', type: 'success' });
        } catch (err) {
            setError(err.message || 'Wrap failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemPt = async () => {
        if (!ptRedeemAmount || isNaN(ptRedeemAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await redeemPt(address, parseFloat(ptRedeemAmount));
            setPtRedeemAmount('');
            await refreshData();
            setModalState({ isOpen: true, message: 'PT Redeemed!', type: 'success' });
        } catch (err) {
            console.error("Redeem PT Error:", err);
            if (err.message?.includes('Unknown error')) {
                setError("Transaction failed. This often means you're trying to redeem before maturity, or the contract is uninitialized. Try running 'Finish Setup' at the bottom.");
            } else {
                setError(err.message || 'PT Redeem failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClaimYield = async () => {
        setLoading(true);
        setError(null);
        try {
            await claimYield(address);
            await refreshData();
            setModalState({ isOpen: true, message: 'Yield Claimed!', type: 'success' });
        } catch (err) {
            setError(err.message || 'Claim Yield failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEarlyExit = async () => {
        if (!earlyExitAmount || isNaN(earlyExitAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await combineAndRedeem(address, parseFloat(earlyExitAmount));
            setEarlyExitAmount('');
            await refreshData();
            setModalState({ isOpen: true, message: 'Combined & Redeemed!', type: 'success' });
        } catch (err) {
            setError(err.message || 'Early Exit failed');
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
            <main className="w-full max-w-[1400px] px-8 py-12 pb-24 mx-auto">
            {/* Header / Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8 px-4">
                {/* <div>
                    <h2 className="text-7xl font-black text-white tracking-tighter mb-4 italic leading-none">MARKETS</h2>
                    <p className="text-text-dim font-bold uppercase tracking-[0.4em] text-[10px] opacity-60">Manage your Principal & Yield Asset derivatives</p>
                </div> */}

                <div className="flex gap-4">
                    <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[180px] rounded-[24px] border border-white/5 shadow-2xl">
                        <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-1">wXLM BALANCE</span>
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">{pendleBalances.wxl}</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[180px] rounded-[24px] border border-white/5 shadow-2xl">
                        <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-1">PT BALANCE</span>
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">{pendleBalances.pt}</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[180px] rounded-[24px] border border-white/5 shadow-2xl">
                        <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-1">YT BALANCE</span>
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">{pendleBalances.yt}</span>
                    </div>
                    <div className="bg-accent-neon/10 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[180px] rounded-[24px] border border-accent-neon/20 shadow-2xl">
                        <span className="text-[9px] text-accent-neon font-black uppercase tracking-widest block mb-1">CURRENT RATE</span>
                        <span className="text-4xl font-black text-accent-neon font-mono tracking-tighter">
                            {currentRate !== null ? `${((Number(currentRate) - 1000) / 10).toFixed(2)}%` : '...'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-panel-glass backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 lg:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MarketActionBox
                        title="Wrap Asset"
                        subtitle="Split wXLM into PT + YT"
                        balanceLabel="Max Wrap"
                        balanceValue={pendleBalances.wxl}
                        tokenLabel="wXLM"
                        actionLabel="Confirm Wrap"
                        onAction={handleWrap}
                        inputValue={wrapAmount}
                        onInputChange={setWrapAmount}
                        loading={loading}
                        disabled={!address || loading || !wrapAmount}
                        isNeon={true}
                    />

                    <div className="bg-card-dark rounded-[32px] p-8 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all group h-[400px]">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">Claim Yield</h3>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <svg className="w-5 h-5 text-accent-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            <p className="text-text-dim text-[10px] uppercase font-bold tracking-widest leading-loose mb-8 opacity-60">Harvest accrued yield from your YT holdings.</p>

                            <div className="bg-black/30 rounded-2xl p-6 border border-white/5 group-hover:bg-black/50 transition-all">
                                <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-2">Pending</span>
                                <div className="text-4xl font-black text-white font-mono tracking-tighter flex items-end gap-2">
                                    {pendleBalances.yt} <span className="text-xs text-text-dim font-bold mb-1">YT</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClaimYield}
                            disabled={!address || loading}
                            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-white/5 text-white border border-white/10 hover:bg-white/10 active:scale-95 transition-all shadow-xl"
                        >
                            {loading ? 'Processing...' : 'Harvest Yield'}
                        </button>
                    </div>

                    <MarketActionBox
                        title="Redeem PT"
                        subtitle="Maturity principal redemption"
                        balanceLabel="Principal"
                        balanceValue={pendleBalances.pt}
                        tokenLabel="PT"
                        actionLabel="Redeem Now"
                        onAction={handleRedeemPt}
                        inputValue={ptRedeemAmount}
                        onInputChange={setPtRedeemAmount}
                        loading={loading}
                        disabled={!address || loading || !ptRedeemAmount}
                        isNeon={false}
                    />

                    {/* <MarketActionBox
                        title="Early Exit"
                        subtitle="Merge PT+YT for immediate exit"
                        balanceLabel="Sync Exit"
                        balanceValue="--"
                        tokenLabel="PT+YT"
                        actionLabel="Flash Redeem"
                        onAction={handleEarlyExit}
                        inputValue={earlyExitAmount}
                        onInputChange={setEarlyExitAmount}
                        loading={loading}
                        disabled={!address || loading || !earlyExitAmount}
                        isNeon={false}
                    /> */}
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
                            await initializeWrapper(address);
                            setModalState({ isOpen: true, message: 'Derivative Wrapper Initialized!', type: 'success' });
                        } catch (e) {
                            setError(e.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-text-dim font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                    Finish Setup: Init Wrapper
                </button>
            </div>
        </main>
        </>
    );
}
