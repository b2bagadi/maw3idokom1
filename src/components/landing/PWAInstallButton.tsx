'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Check if already installed
        const installed = window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true ||
            document.referrer.includes('android-app://');
        
        setIsInstalled(installed);

        if (installed) {
            // Store installation state in localStorage
            localStorage.setItem('pwa-installed', 'true');
            return;
        }

        // Check localStorage for previous installation
        const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
        if (wasInstalled) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event (Android/Desktop)
        const handler = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            
            // Auto-trigger install prompt for Android after a short delay
            if (!iOS) {
                setTimeout(() => {
                    promptEvent.prompt().then(() => {
                        promptEvent.userChoice.then((choice) => {
                            if (choice.outcome === 'accepted') {
                                localStorage.setItem('pwa-installed', 'true');
                                setIsInstalled(true);
                            }
                        });
                    }).catch(console.error);
                }, 500);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for app installed event
        const installedHandler = () => {
            localStorage.setItem('pwa-installed', 'true');
            setIsInstalled(true);
        };
        
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, [isIOS]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSPrompt(true);
            return;
        }

        if (!deferredPrompt) return;

        setIsInstalling(true);
        
        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                localStorage.setItem('pwa-installed', 'true');
                setIsInstalled(true);
            }
        } catch (error) {
            console.error('Install error:', error);
        } finally {
            setIsInstalling(false);
            setDeferredPrompt(null);
        }
    };

    // Always show the button unless already installed
    if (isInstalled) return null;

    return (
        <>
            <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="mb-6 flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {/* Left Icon - Platform Logo */}
                <div className="relative w-6 h-6 flex-shrink-0">
                    <Image
                        src={isIOS ? "/icon-180.png" : "/icon-192.png"}
                        alt="App icon"
                        width={24}
                        height={24}
                        className="rounded-md"
                    />
                </div>

                {/* Middle Text */}
                <span className="font-medium text-sm md:text-base">
                    {isInstalling ? 'Installing...' : 'Install App'}
                </span>

                {/* Right Icon - Phone */}
                <motion.div
                    animate={{ rotate: isInstalling ? 360 : 0 }}
                    transition={{ duration: 0.6, repeat: isInstalling ? Infinity : 0 }}
                    className="relative w-6 h-6 flex-shrink-0"
                >
                    <Image
                        src="/mobile.png"
                        alt="Mobile"
                        width={24}
                        height={24}
                        className="group-hover:scale-110 transition-transform"
                    />
                </motion.div>
            </motion.button>

            {/* iOS Installation Prompt Modal */}
            <AnimatePresence>
                {showIOSPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowIOSPrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src="/icon-180.png"
                                        alt="App Icon"
                                        width={48}
                                        height={48}
                                        className="rounded-xl"
                                    />
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Install Maw3idokom</h3>
                                        <p className="text-sm text-gray-600">Add to Home Screen</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowIOSPrompt(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-sm text-gray-700">
                                <p className="font-medium">To install this app on your iPhone:</p>
                                <ol className="space-y-2 list-decimal list-inside">
                                    <li>Tap the <span className="font-semibold">Share button</span> <span className="inline-block text-blue-500">⎋</span> in Safari</li>
                                    <li>Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span></li>
                                    <li>Tap <span className="font-semibold">"Add"</span> in the top right</li>
                                </ol>
                            </div>

                            <button
                                onClick={() => {
                                    setShowIOSPrompt(false);
                                    localStorage.setItem('pwa-installed', 'true');
                                    setIsInstalled(true);
                                }}
                                className="mt-6 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                            >
                                Got it!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}