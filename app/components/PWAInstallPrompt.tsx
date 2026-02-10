'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return; // Already installed, don't show prompt
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if user dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted PWA install');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_black] p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#00E676] rounded-lg border-2 border-black flex items-center justify-center">
                        <Download size={24} className="text-black" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-sm mb-1">Install Aplikasi Absensi</h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Akses lebih cepat dari home screen. Tidak perlu buka browser!
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-[#00E676] text-black font-bold text-xs py-2 px-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_black] active:shadow-none active:translate-y-0.5 transition-all"
                            >
                                INSTALL
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="bg-gray-100 text-gray-600 font-bold text-xs py-2 px-3 rounded-lg border-2 border-gray-300"
                            >
                                Nanti
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
