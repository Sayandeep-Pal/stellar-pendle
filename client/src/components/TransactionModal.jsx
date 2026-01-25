import { useEffect } from 'react';

export default function TransactionModal({ isOpen, onClose, message, type = 'success' }) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <div className="relative bg-card-dark border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-slideDown">
                <div className="flex items-start gap-6">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isSuccess 
                            ? 'bg-accent-neon/10 border border-accent-neon/20' 
                            : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                        {isSuccess ? (
                            <svg className="w-6 h-6 text-accent-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-lg uppercase tracking-tighter mb-2 ${
                            isSuccess ? 'text-accent-neon' : 'text-red-500'
                        }`}>
                            {isSuccess ? 'Transaction Complete' : 'Transaction Failed'}
                        </h3>
                        <p className="text-text-dim text-sm font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-text-dim hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${isSuccess ? 'bg-accent-neon' : 'bg-red-500'} animate-progressBar`} />
                </div>
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes progressBar {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
                .animate-progressBar {
                    animation: progressBar 3s linear;
                }
            `}</style>
        </div>
    );
}
