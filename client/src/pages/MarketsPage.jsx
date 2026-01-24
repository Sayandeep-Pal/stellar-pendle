import { useState } from 'react';
import { wrapPendle, redeemPt, claimYield, combineAndRedeem } from '../lib/stellar';

export default function MarketsPage({ address, pendleBalances, refreshData, setLoading, loading, setError }) {
    const [wrapAmount, setWrapAmount] = useState('');
    const [ptRedeemAmount, setPtRedeemAmount] = useState('');
    const [earlyExitAmount, setEarlyExitAmount] = useState('');

    const handleWrap = async (e) => {
        e.preventDefault();
        if (!wrapAmount || isNaN(wrapAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await wrapPendle(address, parseFloat(wrapAmount));
            setWrapAmount('');
            await refreshData();
            alert('Wrapped to PT/YT successfully!');
        } catch (err) {
            console.error("Wrap Error Stack:", err);
            setError(err.message || 'Wrap failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemPt = async (e) => {
        e.preventDefault();
        if (!ptRedeemAmount || isNaN(ptRedeemAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await redeemPt(address, parseFloat(ptRedeemAmount));
            setPtRedeemAmount('');
            await refreshData();
            alert('PT Redeemed successfully!');
        } catch (err) {
            console.error("PT Redeem Error Stack:", err);
            setError(err.message || 'PT Redeem failed (Check maturity?)');
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
            alert('Yield Claimed successfully!');
        } catch (err) {
            console.error("Claim Yield Error Stack:", err);
            setError(err.message || 'Claim Yield failed details');
        } finally {
            setLoading(false);
        }
    };

    const handleEarlyExit = async (e) => {
        e.preventDefault();
        if (!earlyExitAmount || isNaN(earlyExitAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await combineAndRedeem(address, parseFloat(earlyExitAmount));
            setEarlyExitAmount('');
            await refreshData();
            alert('Combined & Redeemed successfully!');
        } catch (err) {
            console.error("Early Exit Error Stack:", err);
            setError(err.message || 'Early Exit failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="dashboard">
            <h2 className="section-title">Markets (Liquidity Providers)</h2>

            <div className="card-grid-custom">
                <div className="card" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                    <div className="card-title">Your PT Balance</div>
                    <div className="card-value">{pendleBalances.pt}</div>
                    <div className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>Redeem at Maturity</div>
                </div>

                <div className="card" style={{ background: 'rgba(168, 85, 247, 0.05)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <div className="card-title">Your YT Balance</div>
                    <div className="card-value">{pendleBalances.yt}</div>
                    <div className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>Earning Yield</div>
                </div>
            </div>

            <div className="actions-grid" style={{ marginTop: '2rem' }}>
                {/* WRAP */}
                <div className="card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    <h3 style={{ color: '#38bdf8' }}>Wrap wXLM</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Split wXLM into Principal Token (PT) and Yield Token (YT).
                    </p>
                    <form className="action-form" onSubmit={handleWrap}>
                        <div className="input-group">
                            <label>Amount (wXLM)</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                step="0.0000001"
                                value={wrapAmount}
                                onChange={(e) => setWrapAmount(e.target.value)}
                                disabled={!address || loading}
                            />
                        </div>
                        <button
                            className="action-btn"
                            type="submit"
                            style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                            disabled={!address || loading || !wrapAmount}
                        >
                            {loading ? 'Pr...' : 'Wrap to PT+YT'}
                        </button>
                    </form>
                </div>

                {/* CLAIM YIELD */}
                <div className="card" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                    <h3 style={{ color: '#a855f7' }}>Claim Yield</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Claim accumulated yield from your Yield Tokens (YT).
                    </p>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            className="action-btn"
                            onClick={handleClaimYield}
                            style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                            disabled={!address || loading}
                        >
                            {loading ? 'Pr...' : 'Claim Yield (YT)'}
                        </button>
                    </div>
                </div>

                {/* REDEEM PT */}
                <div className="card">
                    <h3>Redeem PT</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Burn PT to get Principal after Maturity.
                    </p>
                    <form className="action-form" onSubmit={handleRedeemPt}>
                        <div className="input-group">
                            <label>Amount (PT)</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                step="0.0000001"
                                value={ptRedeemAmount}
                                onChange={(e) => setPtRedeemAmount(e.target.value)}
                                disabled={!address || loading}
                            />
                        </div>
                        <button
                            className="action-btn"
                            type="submit"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            disabled={!address || loading || !ptRedeemAmount}
                        >
                            {loading ? 'Pr...' : 'Redeem PT'}
                        </button>
                    </form>
                </div>

                {/* EARLY EXIT */}
                <div className="card">
                    <h3>Early Exit</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Combine PT + YT to exit back to wXLM anytime.
                    </p>
                    <form className="action-form" onSubmit={handleEarlyExit}>
                        <div className="input-group">
                            <label>Amount (PT+YT)</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                step="0.0000001"
                                value={earlyExitAmount}
                                onChange={(e) => setEarlyExitAmount(e.target.value)}
                                disabled={!address || loading}
                            />
                        </div>
                        <button
                            className="action-btn"
                            type="submit"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            disabled={!address || loading || !earlyExitAmount}
                        >
                            {loading ? 'Pr...' : 'Combine & Redeem'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
