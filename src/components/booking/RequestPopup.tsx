'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationsByType } from '@/lib/hooks/usePolling';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, X, MessageCircle } from 'lucide-react';
import { RatingDisplay } from '@/components/rating/RatingDisplay';
import { useClientTranslation } from '@/i18n/client';

interface RequestData {
    requestId: string;
    clientName: string;
    service: string;
    price: string;
    time: string;
    description?: string;
    clientRating?: number;
    clientReviews?: number;
}

export function RequestPopup() {
    const { data: session } = useSession();
    const { t } = useClientTranslation();
    const { notifications, markAsRead } = useNotificationsByType('quick_find', 5000); // Poll every 5s
    const [activeRequest, setActiveRequest] = useState<RequestData | null>(null);
    const [timeLeft, setTimeLeft] = useState(120);
    const [status, setStatus] = useState<'new' | 'waiting' | 'confirmed' | 'rejected'>('new');
    const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
    const [negotiatedPrice, setNegotiatedPrice] = useState<string>('');
    const router = useRouter();

    const goToChat = () => {
        if (confirmedBookingId) {
            localStorage.setItem('chatBookingId', confirmedBookingId);
            router.push(`/business/dashboard?tab=bookings&chatBookingId=${confirmedBookingId}`);
        } else {
            router.push('/business/dashboard?tab=bookings');
        }
        closePopup();
    };

    const closePopup = () => {
        setActiveRequest(null);
        localStorage.removeItem('pendingRequest');
        setStatus('new');
        setConfirmedBookingId(null);
    };

    const handleAccept = async () => {
        setStatus('waiting');

        // Parse negotiated price if set, otherwise use original price
        const finalPrice = negotiatedPrice ? parseFloat(negotiatedPrice) * 100 : undefined;

        await fetch('/api/quickfind/response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: activeRequest?.requestId,
                action: 'accept',
                price: finalPrice // Send price if negotiated
            }),
        });
    };

    const handleReject = async () => {
        await fetch('/api/quickfind/response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: activeRequest?.requestId,
                action: 'reject'
            }),
        });
        closePopup();
    };

    useEffect(() => {
        if (!session?.user?.role || session.user.role !== 'BUSINESS') return;

        // Process new notifications
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
            const latestNotification = unreadNotifications[0];
            const request = latestNotification.data;

            // Case 1: New Request
            if (request.eventType === 'quick_find_request') {
                setActiveRequest({
                    requestId: request.requestId,
                    clientName: request.clientName,
                    service: request.service || '',
                    price: request.price,
                    time: request.time,
                    description: request.description,
                    clientRating: request.clientRating,
                    clientReviews: request.clientReviews
                });
                setNegotiatedPrice(request.offeredPrice ? (request.offeredPrice / 100).toString() : '');
                setTimeLeft(120);
                setStatus('new');
                localStorage.setItem('pendingRequest', JSON.stringify(request));

                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(() => undefined);

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Booking Request!', {
                        body: `${request.clientName} wants ${request.service} - ${request.price}`,
                        icon: '/icon-192.png'
                    });
                }
            }

            // Case 2: We were SELECTED
            else if (request.eventType === 'booking_confirmed') {
                setStatus('confirmed');
                setConfirmedBookingId(request.bookingId);

                // Auto-scroll to top or ensure visible if needed
                const audio = new Audio('/sounds/success.mp3');
                audio.play().catch(() => undefined);
            }

            // Case 3: Another business was selected
            else if (request.eventType === 'request_taken') {
                setStatus('rejected');
            }

            // Mark as read after showing
            markAsRead([latestNotification.id]);
        }
    }, [notifications, session, markAsRead]);

    useEffect(() => {
        if (!activeRequest || status !== 'new') return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleReject();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [activeRequest, status]);

    return (
        <AnimatePresence>
            {activeRequest && (
                <div className="fixed inset-0 z-[9999] pointer-events-none flex items-end sm:items-center justify-center p-4 sm:p-6">

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                        onClick={status !== 'new' ? closePopup : undefined}
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl pointer-events-auto overflow-hidden relative"
                    >

                        {/* Header / Status Bar */}
                        <div className={`h-2 w-full ${status === 'new' ? 'bg-blue-500' :
                            status === 'waiting' ? 'bg-yellow-500 animate-pulse' :
                                status === 'confirmed' ? 'bg-green-500' :
                                    'bg-red-500'
                            }`} />

                        {status !== 'new' && (
                            <button
                                onClick={closePopup}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}

                        <div className="p-6">

                            {/* NEW REQUEST STATE */}
                            {status === 'new' && (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </span>
                                                {t('requestPopup.newRequest')}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('requestPopup.expiresIn')} {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">
                                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">👤</div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{activeRequest.clientName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-gray-500">{t('requestPopup.client')}</p>
                                                    {activeRequest.clientRating !== undefined && activeRequest.clientRating > 0 && (
                                                        <RatingDisplay
                                                            rating={activeRequest.clientRating}
                                                            totalRatings={activeRequest.clientReviews}
                                                            size={14}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('requestPopup.service')}</p>
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">{activeRequest.service}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('requestPopup.offer')}</p>
                                                <p className="font-bold text-green-600 text-lg">{activeRequest.price}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                {new Date(activeRequest.time).toLocaleDateString(undefined, {
                                                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        {activeRequest.description && (
                                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">{t('requestPopup.description')}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{activeRequest.description}</p>
                                            </div>
                                        )}

                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl">
                                            <p className="text-xs text-yellow-700 dark:text-yellow-500 uppercase font-bold mb-2 flex items-center gap-2">
                                                <span>{t('requestPopup.adjustPrice')}</span>
                                            </p>
                                            <input
                                                type="number"
                                                value={negotiatedPrice}
                                                onChange={(e) => setNegotiatedPrice(e.target.value)}
                                                className="w-full py-2 px-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-800 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                                placeholder={t('requestPopup.pricePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleReject}
                                            className="py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            {t('requestPopup.decline')}
                                        </button>
                                        <button
                                            onClick={handleAccept}
                                            className="py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {t('requestPopup.accept')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* WAITING STATE */}
                            {status === 'waiting' && (
                                <div className="text-center py-8">
                                    <div className="relative w-20 h-20 mx-auto mb-6">
                                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('requestPopup.waitingTitle')}</h3>
                                    <p className="text-gray-500">{t('requestPopup.waitingDesc')}</p>
                                </div>
                            )}

                            {/* CONFIRMED STATE */}
                            {status === 'confirmed' && (
                                <div className="text-center py-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600"
                                    >
                                        <CheckCircle2 className="w-12 h-12" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('requestPopup.confirmedTitle')}</h3>
                                    <p className="text-gray-500 mb-8">{t('requestPopup.confirmedDesc')}</p>

                                    <button
                                        onClick={goToChat}
                                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {t('requestPopup.goToChat')}
                                    </button>
                                </div>
                            )}

                            {/* REJECTED / TAKEN STATE */}
                            {status === 'rejected' && (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <X className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('requestPopup.takenTitle')}</h3>
                                    <p className="text-gray-500">{t('requestPopup.takenDesc')}</p>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
