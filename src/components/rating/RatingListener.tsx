'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWebSocket } from '@/lib/websocket/socket-provider';
import { WSEvents } from '@/lib/websocket/events';
import { RatingModal } from './RatingModal';
import { useRouter } from 'next/navigation';

export function RatingListener() {
    const { data: session } = useSession();
    const { subscribe } = useWebSocket();
    const router = useRouter();

    const [modalOpen, setModalOpen] = useState(false);
    const [ratingData, setRatingData] = useState<{
        bookingId: string;
        rateeId: string;
        rateeName: string;
    } | null>(null);

    useEffect(() => {
        if (!session?.user) return;

        const handleBookingCompleted = async (data: any) => {
            // data: { bookingId, requestId }
            console.log('Booking completed event received:', data);

            try {
                // Fetch booking details to determine who to rate
                const res = await fetch(`/api/bookings/${data.bookingId}`);
                if (!res.ok) return;

                const booking = await res.json();

                // Determine if current user is participant
                let rateeId = '';
                let rateeName = '';

                if (session.user.id === booking.clientId) {
                    // I am client, rate business
                    rateeId = booking.business.userId;
                    rateeName = booking.business.name;
                } else if (session.user.id === booking.business.userId) {
                    // I am business, rate client
                    rateeId = booking.clientId;
                    rateeName = booking.client.name;
                } else {
                    return; // Not involved
                }

                setRatingData({
                    bookingId: data.bookingId,
                    rateeId,
                    rateeName
                });
                setModalOpen(true);

            } catch (e) {
                console.error('Error handling booking completion:', e);
            }
        };

        const unsubscribe = subscribe(WSEvents.BOOKING_COMPLETED, handleBookingCompleted);
        return () => unsubscribe();
    }, [session, subscribe]);

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
