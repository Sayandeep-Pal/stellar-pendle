import { useState, useEffect } from 'react';
import {
    listPt, buyPt, getMarketLiquidity, getMyListing,
    listYt, buyYt, getYtMarketLiquidity, getMyYtListing,
    initializeMarket,
    scaleDown
} from '../lib/stellar';
import TransactionModal from '../components/TransactionModal';

const MarketplaceBox = ({ title, subtitle, balanceLabel, balanceValue, tokenLabel, actionLabel, onAction, loading, disabled, inputValue, onInputChange, isNeon, priceNote, onMax }) => {
    return (
        <div className="bg-card-dark rounded-[32px] p-8 border border-white/5 flex flex-col gap-6 hover:border-white/10 transition-all group h-full">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">{title}</h3>
                    <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 leading-relaxed max-w-[200px]">{subtitle}</p>
                </div>
                {isNeon && (
                    <div className="bg-accent-neon/10 px-3 py-1 rounded-full border border-accent-neon/20 text-accent-neon text-[9px] font-black uppercase tracking-widest">
                        Live Market
                    </div>
                )}
            </div>

            <div className="bg-black/30 rounded-2xl p-5 border border-white/5 flex flex-col gap-3 group-hover:bg-black/50 transition-all">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">
                    <span>{balanceLabel}</span>
                    <div className="flex gap-2 items-center">
                        <span className="text-white font-mono">{balanceValue}</span>
                        <span className="text-[8px]">{tokenLabel}</span>
                        {onMax && (
                            <button
                                onClick={onMax}
                                className="text-[8px] bg-accent-neon/10 text-accent-neon px-1.5 py-0.5 rounded border border-accent-neon/20 hover:bg-accent-neon hover:text-black transition-all"
                            >
                                MAX
                            </button>
                        )}
                    </div>
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
                {priceNote && <div className="text-[9px] text-accent-neon font-bold tracking-tight mt-1">{priceNote}</div>}
            </div>

            <button
                onClick={onAction}
                disabled={disabled}
                className={`mt-auto w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-40 shadow-xl ${isNeon ? 'bg-accent-neon text-black flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_10px_30px_rgba(226,255,55,0.1)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                ) : actionLabel}
            </button>
        </div>
    );
};

export default function MarketplacePage({ address, pendleBalances, refreshData, setLoading, loading, setError }) {
    const [activeMarket, setActiveMarket] = useState('PT'); // 'PT' or 'YT'
    const [listAmount, setListAmount] = useState('');
    const [buyAmount, setBuyAmount] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, message: '', type: 'success' });

    const [ptMarketLiquidity, setPtMarketLiquidity] = useState('0.0000');
    const [ptMyListing, setPtMyListing] = useState('0.0000');

    const [ytMarketLiquidity, setYtMarketLiquidity] = useState('0.0000');
    const [ytMyListing, setYtMyListing] = useState('0.0000');

    const updateMarketData = async () => {
        if (!address) return;
        try {
            const ptLiq = await getMarketLiquidity();
            setPtMarketLiquidity(ptLiq);
            const ptMyVal = await getMyListing(address);
            setPtMyListing(ptMyVal);

            const ytLiq = await getYtMarketLiquidity();
            setYtMarketLiquidity(ytLiq);
            const ytMyVal = await getMyYtListing(address);
            setYtMyListing(ytMyVal);
        } catch (e) {
            console.error("Market data fetch error:", e);
        }
    };

    useEffect(() => {
        updateMarketData();
        const interval = setInterval(updateMarketData, 5000);
        return () => clearInterval(interval);
    }, [address]);

    const handleList = async () => {
        const val = parseFloat(listAmount);
        if (!val || isNaN(val)) return;

        // Frontend check for balance to avoid contract trap
        const currentBal = activeMarket === 'PT' ? parseFloat(pendleBalances.pt) : parseFloat(pendleBalances.yt);
        if (val > currentBal) {
            setError(`Insufficient ${activeMarket} balance. You have ${currentBal} but tried to list ${val}.`);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (activeMarket === 'PT') {
                await listPt(address, val);
            } else {
                await listYt(address, val);
            }
            setListAmount('');
            await refreshData();
            await updateMarketData();
            setModalState({ isOpen: true, message: `${activeMarket} Listed successfully!`, type: 'success' });
        } catch (err) {
            console.error("Listing Error:", err);
            if (err.message?.includes('InvalidAction')) {
                setError("Contract Trap: The marketplace might not be initialized. Please use the Bootstrap utility below.");
            } else {
                setError(err.message || 'Listing failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        const val = parseFloat(buyAmount);
        if (!val || isNaN(val)) return;

        setLoading(true);
        setError(null);
        try {
            if (activeMarket === 'PT') {
                await buyPt(address, val);
            } else {
                await buyYt(address, val);
            }
            setBuyAmount('');
            await refreshData();
            await updateMarketData();
            setModalState({ isOpen: true, message: `${activeMarket} Purchased successfully!`, type: 'success' });
        } catch (err) {
            console.error("Purchase Error:", err);
            setError(err.message || `Purchase failed. Ensure enough ${activeMarket} is available and contract is initialized.`);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            await initializeMarket(address);
            setModalState({ isOpen: true, message: 'Marketplace Contract Successfully Initialized!', type: 'success' });
            await updateMarketData();
        } catch (err) {
            console.error("Init Error:", err);
            setError(err.message || 'Initialization failed.');
        } finally {
            setLoading(false);
        }
    };

    const currentLiquidity = activeMarket === 'PT' ? ptMarketLiquidity : ytMarketLiquidity;
    const currentMyListing = activeMarket === 'PT' ? ptMyListing : ytMyListing;
    const currentBalance = activeMarket === 'PT' ? pendleBalances.pt : pendleBalances.yt;
    const currentPriceNote = activeMarket === 'PT' ? "Fixed Price: 0.95 XLM per 1 PT" : "Fixed Price: 0.05 XLM per 1 YT";

    return (
        <>
            <TransactionModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                message={modalState.message}
                type={modalState.type}
            />
            <main className="w-full max-w-[1400px] px-8 py-12 pb-24 mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8 px-4">
                <div>
                    <h2 className="text-7xl font-black text-white tracking-tighter mb-4 italic leading-none uppercase">Marketplace</h2>
                    <p className="text-text-dim font-bold uppercase tracking-[0.4em] text-[10px] opacity-60">Buy and sell PT/YT tokens instantly</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[200px] rounded-[24px] border border-white/5 shadow-2xl">
                        <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-1">TOTAL PT FOR SALE</span>
                        <span className="text-4xl font-black text-accent-neon font-mono tracking-tighter">{ptMarketLiquidity}</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 flex flex-col items-center min-w-[200px] rounded-[24px] border border-white/5 shadow-2xl">
                        <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-1">TOTAL YT FOR SALE</span>
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">{ytMarketLiquidity}</span>
                    </div>
                </div>
            </div>

            {/* Market Selection Tab */}
            <div className="flex justify-center mb-10">
                <div className="bg-card-dark p-1.5 rounded-2xl border border-white/5 flex gap-2">
                    <button
                        onClick={() => setActiveMarket('PT')}
                        className={`px-12 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeMarket === 'PT' ? 'bg-accent-neon text-black shadow-lg shadow-accent-neon/20' : 'text-text-dim hover:text-white'}`}
                    >
                        PT Market
                    </button>
                    <button
                        onClick={() => setActiveMarket('YT')}
                        className={`px-12 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeMarket === 'YT' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-text-dim hover:text-white'}`}
                    >
                        YT Market
                    </button>
                </div>
            </div>

            <div className="bg-panel-glass backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 lg:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Buy Section */}
                    <MarketplaceBox
                        title={`Buy ${activeMarket}`}
                        subtitle={`Purchase fixed-yield ${activeMarket} tokens from the pool.`}
                        balanceLabel="Market Available"
                        balanceValue={currentLiquidity}
                        tokenLabel={activeMarket}
                        actionLabel="Confirm Purchase"
                        priceNote={currentPriceNote}
                        onAction={handleBuy}
                        inputValue={buyAmount}
                        onInputChange={setBuyAmount}
                        loading={loading}
                        disabled={!address || loading || !buyAmount || parseFloat(buyAmount) > parseFloat(currentLiquidity)}
                        isNeon={activeMarket === 'PT'}
                        onMax={() => setBuyAmount(currentLiquidity)}
                    />

                    {/* List Section */}
                    <MarketplaceBox
                        title={`List ${activeMarket}`}
                        subtitle={`Sell your ${activeMarket} to others instantly.`}
                        balanceLabel={`My Balance`}
                        balanceValue={currentBalance}
                        tokenLabel={activeMarket}
                        actionLabel="Place Listing"
                        onAction={handleList}
                        inputValue={listAmount}
                        onInputChange={setListAmount}
                        loading={loading}
                        disabled={!address || loading || !listAmount}
                        isNeon={false}
                        onMax={() => setListAmount(currentBalance)}
                    />

                    {/* Listing Status Section */}
                    <div className="bg-card-dark rounded-[32px] p-8 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all h-[400px] group">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">My {activeMarket} Sales</h3>
                                <div className="bg-accent-neon/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-neon"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            <p className="text-text-dim text-[10px] uppercase font-bold tracking-widest leading-loose mb-8 opacity-60">Escrowed tokens currently listed for sale.</p>

                            <div className="bg-black/30 rounded-2xl p-6 border border-white/5 group-hover:bg-black/50 transition-all">
                                <span className="text-[9px] text-text-dim font-black uppercase tracking-widest block mb-2">My Escrow</span>
                                <div className="text-5xl font-black text-white font-mono tracking-tighter">
                                    {currentMyListing} <span className="text-xs text-text-dim font-bold">{activeMarket}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] text-text-dim/80 font-bold leading-relaxed italic">
                            Tokens are trustlessly locked in the contract until bought by a peer.
                        </div>
                    </div>
                </div>
            </div>

            {/* Developer Section */}
            <div className="mt-20 border-t border-white/5 pt-10 flex flex-col items-center gap-4">
                <span className="text-[10px] text-text-dim uppercase tracking-[0.5em] font-black">Contract Developer Utils</span>
                <button
                    onClick={handleInitialize}
                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-text-dim font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                    Bootstrap New Contract Logic
                </button>
            </div>
        </main>
        </>
    )
}
