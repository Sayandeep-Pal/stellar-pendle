import React, { useState, useEffect, useRef } from 'react';
import { listPt, buyMarketPt, listYt, buyMarketYt, checkConnection } from '../lib/stellar-wrapper';

export default function TradeModal({ isOpen, onClose, tokenType = 'PT', marketData = {} }) {
    const [action, setAction] = useState('buy');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [visible, setVisible] = useState(false);
    const backdropRef = useRef(null);

    const isPT = tokenType === 'PT';
    const isBuy = action === 'buy';
    const pricePerToken = isPT ? 0.97 : 0.03;
    const totalCost = amount ? (parseFloat(amount) * pricePerToken).toFixed(4) : '0.0000';

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            setTimeout(() => {
                setStatus(null);
                setAmount('');
            }, 350);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExecute = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const decimals = 7;
            const scaledAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
            const user = await checkConnection();
            if (!user) throw new Error('Wallet not connected');

            if (tokenType === 'PT') {
                action === 'buy' ? await buyMarketPt(user.publicKey, scaledAmount) : await listPt(user.publicKey, scaledAmount);
            } else {
                action === 'buy' ? await buyMarketYt(user.publicKey, scaledAmount) : await listYt(user.publicKey, scaledAmount);
            }
            setStatus({ type: 'success', message: `${action.toUpperCase()} ${tokenType} successful!` });
            setTimeout(onClose, 2000);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: err.message || 'Transaction failed' });
        } finally {
            setLoading(false);
        }
    };

    const tokenColor   = isPT ? '#60a5fa' : '#c084fc';
    const tokenAlpha   = isPT ? 'rgba(59,130,246,' : 'rgba(168,85,247,';
    const actionColor  = isBuy ? '#e2ff37' : '#ef4444';
    const actionAlpha  = isBuy ? 'rgba(226,255,55,' : 'rgba(239,68,68,';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ perspective: '1200px' }}
        >
            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={onClose}
                className="fixed inset-0 transition-all duration-400"
                style={{
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 0.35s ease, backdrop-filter 0.35s ease',
                }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-[420px]"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0) scale(1) rotateX(0deg)' : 'translateY(24px) scale(0.95) rotateX(4deg)',
                    transition: 'opacity 0.4s cubic-bezier(0.19,1,0.22,1), transform 0.4s cubic-bezier(0.19,1,0.22,1)',
                    transformOrigin: 'center bottom',
                }}
            >
                {/* Outer glow */}
                <div
                    className="absolute -inset-px rounded-[28px] pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${tokenAlpha}0.18) 0%, transparent 50%, ${actionAlpha}0.08) 100%)`,
                        filter: 'blur(1px)',
                    }}
                />

                <div
                    className="relative rounded-[26px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, rgba(22,22,28,0.96) 0%, rgba(12,12,16,0.98) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        border: `1px solid ${tokenAlpha}0.15)`,
                        borderTop: `1px solid ${tokenAlpha}0.25)`,
                        boxShadow: `
                            0 0 0 1px rgba(0,0,0,0.6) inset,
                            inset 0 1px 0 rgba(255,255,255,0.08),
                            0 40px 80px rgba(0,0,0,0.85),
                            0 0 60px ${tokenAlpha}0.07)
                        `,
                    }}
                >
                    {/* Top gloss */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                        style={{ background: `linear-gradient(90deg, transparent, ${tokenAlpha}0.5), transparent)` }}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-5">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs"
                                style={{
                                    background: `${tokenAlpha}0.15)`,
                                    color: tokenColor,
                                    border: `1px solid ${tokenAlpha}0.25)`,
                                    boxShadow: `0 0 16px ${tokenAlpha}0.15), inset 0 1px 0 ${tokenAlpha}0.2)`,
                                }}
                            >
                                {tokenType}
                            </div>
                            <div>
                                <h2 className="text-white font-black text-lg leading-none">Trade {tokenType}</h2>
                                <p className="text-[10px] text-text-dim mt-0.5 font-medium">
                                    {isPT ? 'Principal Token · stsUSDC' : 'Yield Token · stsUSDC'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/8"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                        {/* Buy / Sell Tab */}
                        <div
                            className="flex p-1 rounded-2xl"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {['buy', 'sell'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setAction(tab)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.12em] transition-all duration-300"
                                    style={action === tab ? {
                                        background: tab === 'buy'
                                            ? 'linear-gradient(135deg, rgba(226,255,55,0.18) 0%, rgba(226,255,55,0.08) 100%)'
                                            : 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 100%)',
                                        color: tab === 'buy' ? '#e2ff37' : '#f87171',
                                        border: `1px solid ${tab === 'buy' ? 'rgba(226,255,55,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
                                    } : {
                                        color: 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Amount Input */}
                        <div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-dim mb-2 px-1">
                                <span>Amount</span>
                                {/* <span>Balance: <span className="text-white">—</span></span> */}
                            </div>
                            <div
                                className="relative rounded-2xl overflow-hidden"
                                style={{
                                    background: 'rgba(0,0,0,0.45)',
                                    border: amount
                                        ? `1px solid ${tokenAlpha}0.3)`
                                        : '1px solid rgba(255,255,255,0.07)',
                                    boxShadow: amount
                                        ? `0 0 0 3px ${tokenAlpha}0.06), inset 0 2px 8px rgba(0,0,0,0.4)`
                                        : 'inset 0 2px 8px rgba(0,0,0,0.4)',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                }}
                            >
                                {/* Inner top gloss */}
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent pointer-events-none" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-transparent py-4 pl-5 pr-20 text-3xl font-light text-white placeholder-white/10 focus:outline-none"
                                    placeholder="0.00"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                    {amount && (
                                        <button
                                            onClick={() => setAmount('')}
                                            className="text-[10px] text-text-dim hover:text-white transition-colors px-1.5 py-0.5 rounded"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <span
                                        className="text-xs font-black px-2.5 py-1.5 rounded-lg"
                                        style={{
                                            background: `${tokenAlpha}0.12)`,
                                            color: tokenColor,
                                            border: `1px solid ${tokenAlpha}0.18)`,
                                        }}
                                    >
                                        {tokenType}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div className="px-4 py-3 space-y-2.5">
                                {[
                                    { label: `Estimated Price per ${tokenType}`, value: `${pricePerToken} USDC` },
                                    { label: 'Estimated Total Cost', value: `${totalCost} USDC`, highlight: true },
                                    // { label: 'Slippage Tolerance', value: '0.5%' },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-text-dim font-medium">{row.label}</span>
                                        <span
                                            className={`font-mono font-bold ${row.highlight ? 'text-white text-sm' : 'text-white/70'}`}
                                        >
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        {status && (
                            <div
                                className="p-3.5 rounded-xl text-xs font-bold text-center animate-slide-in-up"
                                style={status.type === 'success' ? {
                                    background: 'rgba(34,197,94,0.1)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(34,197,94,0.2)',
                                } : {
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                {status.type === 'success' ? '✓ ' : '✕ '}{status.message}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleExecute}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.18em] transition-all duration-300 relative overflow-hidden"
                            style={loading || !amount || parseFloat(amount) <= 0 ? {
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'not-allowed',
                            } : isBuy ? {
                                background: 'linear-gradient(135deg, #e2ff37 0%, #c8e820 100%)',
                                color: '#000',
                                boxShadow: '0 0 32px rgba(226,255,55,0.35), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                                border: '1px solid rgba(226,255,55,0.6)',
                            } : {
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#fff',
                                boxShadow: '0 0 32px rgba(239,68,68,0.35), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                                border: '1px solid rgba(239,68,68,0.5)',
                            }}
                        >
                            {/* Shimmer on hover */}
                            {!(loading || !amount || parseFloat(amount) <= 0) && (
                                <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                            )}
                            <span className="relative">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : `${isBuy ? 'Buy' : 'Sell'} ${tokenType}`}
                            </span>
                        </button>

                        <p className="text-center text-[10px] text-text-dim/50 font-medium">
                            By trading you agree to the protocol's terms of service.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
