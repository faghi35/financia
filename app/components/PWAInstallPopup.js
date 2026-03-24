'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPopup() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // Check if already installed (standalone mode)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(isInStandaloneMode);

        // Check if user has dismissed the popup before
        const hasDismissed = localStorage.getItem('pwa-install-dismissed');

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show popup if not dismissed and not standalone
            if (!hasDismissed && !isInStandaloneMode) {
                setTimeout(() => {
                    setShowInstallPopup(true);
                }, 3000); // Show after 3 seconds
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show popup if not in standalone mode and not dismissed
        if (isIOSDevice && !isInStandaloneMode && !hasDismissed) {
            setTimeout(() => {
                setShowInstallPopup(true);
            }, 3000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallPopup(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowInstallPopup(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showInstallPopup || isStandalone) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">💰</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Installer Financia
                    </h3>
                    <p className="text-slate-500 text-sm">
                        Ajoutez Financia à votre écran d'accueil pour un accès rapide et une expérience optimale
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">📱</span>
                        <span className="text-sm text-slate-600">Accès rapide depuis l'écran d'accueil</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">⚡</span>
                        <span className="text-sm text-slate-600">Chargement plus rapide</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">📴</span>
                        <span className="text-sm text-slate-600">Fonctionne hors ligne</span>
                    </div>
                </div>

                {isIOS ? (
                    <div className="space-y-3">
                        <div className="p-4 bg-sky-50 rounded-xl">
                            <p className="text-sm text-sky-800 font-medium mb-2">
                                Pour installer sur iOS :
                            </p>
                            <ol className="text-sm text-sky-700 space-y-1">
                                <li>1. Appuyez sur le bouton Partager <span className="inline-block w-5 h-5 bg-sky-200 rounded text-center leading-5">↑</span></li>
                                <li>2. Faites défiler et appuyez sur "Sur l'écran d'accueil"</li>
                                <li>3. Appuyez sur "Ajouter"</li>
                            </ol>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Plus tard
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex-1 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-semibold hover:from-sky-600 hover:to-blue-700 transition-colors"
                        >
                            Installer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}