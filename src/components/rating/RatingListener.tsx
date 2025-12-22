'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationsByType } from '@/lib/hooks/usePolling';
import { RatingModal } from './RatingModal';
import { useRouter } from 'next/navigation';

export function RatingListener() {
    const { data: session } = useSession();
    const { notifications, markAsRead } = useNotificationsByType('rating', 5000); // Poll for rating notifications
    const router = useRouter();

    const [modalOpen, setModalOpen] = useState(false);
    const [ratingData, setRatingData] = useState<{
        bookingId: string;
        rateeId: string;
        rateeName: string;
    } | null>(null);

    useEffect(() => {
        if (!session?.user) return;

        // Process new rating notifications from polling
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            const data = latestNotification.data;

            const processRatingRequest = async () => {
                try {
                    const res = await fetch(`/api/bookings/${data.bookingId}`);
                    if (!res.ok) return;

                    const booking = await res.json();

                    let rateeId = '';
                    let rateeName = '';

                    if (session.user.id === booking.clientId) {
                        rateeId = booking.business.userId;
                        rateeName = booking.business.name;
                    } else if (session.user.id === booking.business.userId) {
                        rateeId = booking.clientId;
                        rateeName = booking.client.name;
                    } else {
                        return;
                    }

                    if (!rateeId) {
                        console.warn('[RatingListener] Could not determine rateeId for booking:', data.bookingId);
                        return;
                    }

                    setRatingData({
                        bookingId: data.bookingId,
                        rateeId,
                        rateeName
                    });
                    setModalOpen(true);

                    // Mark notification as read
                    markAsRead([latestNotification.id]);
                } catch (e) {
                    console.error('Error handling rating notification:', e);
                }
            };

            processRatingRequest();
        }
    }, [notifications, session, markAsRead]);

    if (!ratingData) return null;

    return (
        <RatingModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            bookingId={ratingData.bookingId}
            rateeId={ratingData.rateeId}
            rateeName={ratingData.rateeName}
            onSuccess={() => {
                // Refresh page or list to show new rating state
                router.refresh();
            }}
        />
    );
}
