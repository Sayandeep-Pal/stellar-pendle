import { useEffect, useState } from 'react';

export default function TransactionModal({ isOpen, onClose, message, type = 'success' }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 350);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-6 px-4 pointer-events-none">
            <div
                className="pointer-events-auto w-full max-w-sm"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.94)',
                    transition: 'opacity 0.4s cubic-bezier(0.19,1,0.22,1), transform 0.4s cubic-bezier(0.19,1,0.22,1)',
                }}
            >
                {/* Outer glow ring */}
                <div
                    className="absolute -inset-px rounded-[20px] pointer-events-none"
                    style={{
                        background: isSuccess
                            ? 'linear-gradient(135deg, rgba(226,255,55,0.2) 0%, transparent 60%)'
                            : 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, transparent 60%)',
                        filter: 'blur(1px)',
                        borderRadius: '20px',
                    }}
                />

                <div
                    className="relative rounded-[18px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, rgba(18,18,24,0.97) 0%, rgba(10,10,14,0.99) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        border: `1px solid ${isSuccess ? 'rgba(226,255,55,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        borderTop: `1px solid ${isSuccess ? 'rgba(226,255,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        boxShadow: `
                            0 0 0 1px rgba(0,0,0,0.6) inset,
                            inset 0 1px 0 rgba(255,255,255,0.07),
                            0 24px 48px rgba(0,0,0,0.8),
                            0 0 40px ${isSuccess ? 'rgba(226,255,55,0.08)' : 'rgba(239,68,68,0.08)'}
                        `,
                    }}
                >
                    {/* Top accent line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{
                            background: isSuccess
                                ? 'linear-gradient(90deg, transparent 0%, #e2ff37 40%, rgba(226,255,55,0.4) 100%)'
                                : 'linear-gradient(90deg, transparent 0%, #ef4444 40%, rgba(239,68,68,0.4) 100%)',
                        }}
                    />

                    <div className="p-5 flex items-start gap-4">
                        {/* Icon */}
                        <div
                            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center relative"
                            style={isSuccess ? {
                                background: 'rgba(226,255,55,0.12)',
                                border: '1px solid rgba(226,255,55,0.25)',
                                boxShadow: '0 0 20px rgba(226,255,55,0.15), inset 0 1px 0 rgba(226,255,55,0.2)',
                            } : {
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                boxShadow: '0 0 20px rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.2)',
                            }}
                        >
                            {isSuccess ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="#e2ff37"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(226,255,55,0.6))' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="#f87171"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h3
                                className="font-black text-sm uppercase tracking-[0.1em] mb-1"
                                style={{
                                    color: isSuccess ? '#e2ff37' : '#f87171',
                                    textShadow: isSuccess
                                        ? '0 0 20px rgba(226,255,55,0.5)'
                                        : '0 0 20px rgba(239,68,68,0.5)',
                                }}
                            >
                                {isSuccess ? 'Transaction Complete' : 'Transaction Failed'}
                            </h3>
                            <p className="text-text-dim text-xs leading-relaxed font-medium">{message}</p>
                        </div>

                        {/* Close */}
                        <button
                            onClick={() => { setVisible(false); setTimeout(onClose, 350); }}
                            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/8"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div
                        className="h-[2px]"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                        }}
                    >
                        <div
                            className="h-full animate-progressBar"
                            style={isSuccess ? {
                                background: 'linear-gradient(90deg, #e2ff37, rgba(226,255,55,0.5))',
                                boxShadow: '0 0 8px rgba(226,255,55,0.5)',
                            } : {
                                background: 'linear-gradient(90deg, #ef4444, rgba(239,68,68,0.5))',
                                boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
