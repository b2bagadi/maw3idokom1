'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDate, formatPrice, getStatusColor } from '@/lib/utils';
import { MessageSquare, Star, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientChat from './ClientChat';
import ReviewModal from './ReviewModal';
import { useClientTranslation } from '@/i18n/client';

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatBooking, setChatBooking] = useState<{ id: string; name: string } | null>(null);
    const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
    const { t } = useClientTranslation();

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setBookings(data);
        } catch {
            toast.error(t('booking.bookingError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm(t('booking.confirmCancellation'))) return;
        try {
            const res = await fetch('/api/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'CANCELLED' }),
            });
            if (!res.ok) throw new Error('Failed');

            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
            toast.success(t('booking.cancelBooking'));
        } catch {
            toast.error(t('booking.bookingError'));
        }
    };

    const columns = [
        { header: t('nav.business'), accessor: (b: any) => b.business.name },
        { header: t('booking.selectService'), accessor: (b: any) => b.service.name },
        { header: t('common.date'), accessor: (b: any) => `${formatDate(b.date)} @ ${b.time}` },
        { header: t('common.price'), accessor: (b: any) => formatPrice(b.totalPrice) },
        {
            header: t('common.status'),
            accessor: (b: any) => (
                <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", getStatusColor(b.status))}>
                    {t(`booking.status.${b.status}`)}
                </span>
            )
        },
        {
            header: t('services.actions'),
            accessor: (b: any) => (
                <div className="flex gap-2">
                    {b.status === 'PENDING' && (
                        <Button size="sm" variant="danger" onClick={() => handleCancel(b.id)} title={t('booking.cancelBooking')}>
                            <XCircle size={16} />
                        </Button>
                    )}
                    {b.status === 'COMPLETED' && (
                        <Button size="sm" variant="secondary" onClick={() => setReviewBookingId(b.id)} title={t('review.addReview')}>
                            <Star size={16} />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setChatBooking({ id: b.id, name: b.business.name })}
                        title={t('chat.title')}
                    >
                        <MessageSquare size={16} />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">{t('booking.myBookings')}</h2>
            <Table
                data={bookings}
                columns={columns}
                keyExtractor={b => b.id}
                isLoading={isLoading}
                emptyMessage={t('business.noBookings')}
            />

            {chatBooking && (
                <ClientChat
                    bookingId={chatBooking.id}
                    businessName={chatBooking.name}
                    isOpen={true}
                    onClose={() => setChatBooking(null)}
                />
            )}

            {reviewBookingId && (
                <ReviewModal
                    bookingId={reviewBookingId}
                    isOpen={true}
                    onClose={() => setReviewBookingId(null)}
                    onReviewSubmitted={fetchBookings}
                />
            )}
        </div>
    );
}