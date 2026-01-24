import { useState } from 'react';
import { deposit, redeem, getBalance, getRate } from '../lib/stellar';

export default function VaultPage({ address, balance, rate, metadata, refreshData, setLoading, loading, setError }) {
    const [depositAmount, setDepositAmount] = useState('');
    const [redeemAmount, setRedeemAmount] = useState('');

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositAmount || isNaN(depositAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await deposit(address, parseFloat(depositAmount));
            setDepositAmount('');
            await refreshData();
            alert('Deposit successful!');
        } catch (err) {
            console.error("Deposit Error Stack:", err);
            setError(err.message || 'Deposit failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!redeemAmount || isNaN(redeemAmount)) return;
        setLoading(true);
        setError(null);
        try {
            await redeem(address, parseFloat(redeemAmount));
            setRedeemAmount('');
            await refreshData();
            alert('Redeem successful!');
        } catch (err) {
            console.error("Redeem Error Stack:", err);
            setError(err.message || 'Redeem failed');
        } finally {
            setLoading(false);
        }
    };

    const yieldPercentage = ((Number(rate) - 1000) / 100).toFixed(2);

    return (
        <main className="dashboard">
            <h2 className="section-title">Yield Vault (Mint wXLM)</h2>

            <div className="card-grid-custom">
                <div className="card">
                    <div className="card-title">Contract</div>
                    <div className="card-value">{metadata.name}</div>
                    <div className="card-subtext">{metadata.symbol}</div>
                </div>

                <div className="card">
                    <div className="card-title">Current Yield Rate</div>
                    <div className="card-value">{(Number(rate) / 1000).toFixed(3)}x</div>
                    <div className="card-subtext">+{yieldPercentage}% Variable APR</div>
                </div>

                <div className="card">
                    <div className="card-title">Your wXLM Balance</div>
                    <div className="card-value">{balance}</div>
                    <div className="status-badge">Available to Wrap</div>
                </div>
            </div>

            <div className="actions-grid" style={{ marginTop: '2rem' }}>
                <div className="card">
                    <h3>Deposit XLM</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Convert XLM to {metadata.symbol} (wXLM).
                    </p>
                    <form className="action-form" onSubmit={handleDeposit}>
                        <div className="input-group">
                            <label>Amount (XLM)</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                step="0.0000001"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                disabled={!address || loading}
                            />
                        </div>
                        <button
                            className="action-btn deposit-btn"
                            type="submit"
                            disabled={!address || loading || !depositAmount}
                        >
                            {loading ? 'Processing...' : 'Deposit XLM'}
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3>Redeem wXLM</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Withdraw wXLM back to XLM.
                    </p>
                    <form className="action-form" onSubmit={handleRedeem}>
                        <div className="input-group">
                            <label>Amount (wXLM)</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                step="0.0000001"
                                value={redeemAmount}
                                onChange={(e) => setRedeemAmount(e.target.value)}
                                disabled={!address || loading}
                            />
                        </div>
                        <button
                            className="action-btn redeem-btn"
                            type="submit"
                            disabled={!address || loading || !redeemAmount}
                        >
                            {loading ? 'Processing...' : `Redeem to XLM`}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
