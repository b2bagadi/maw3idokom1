'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDate, formatPrice, getStatusColor } from '@/lib/utils';
import { MessageSquare, Star, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientChat from './ClientChat';
import { RatingModal } from '@/components/rating/RatingModal';
import { useClientTranslation } from '@/i18n/client';

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatBooking, setChatBooking] = useState<{ id: string; name: string } | null>(null);
    const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');
    const { t } = useClientTranslation();
    const searchParams = useSearchParams();

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

    useEffect(() => {
        if (!Array.isArray(bookings) || bookings.length === 0) return;
        const paramId = searchParams?.get('chatBookingId');
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('chatBookingId') : null;
        const targetId = paramId || storedId;
        if (targetId) {
            const booking = bookings.find((b: any) => b?.id === targetId);
            if (booking) {
                setChatBooking({
                    id: booking.id,
                    name: booking?.business?.name || t('common.unknown', { defaultValue: 'Unknown' })
                });
            }
            if (storedId) localStorage.removeItem('chatBookingId');
            if (paramId && typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('chatBookingId');
                window.history.replaceState({}, '', url);
            }
        }
    }, [bookings, searchParams, t]);

    const normalizedBookings = (Array.isArray(bookings) ? bookings : [])
        .filter(Boolean)
        .filter(b => {
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            const matchesDate = !dateFilter || new Date(b.date).toLocaleDateString('en-CA') === dateFilter;
            return matchesStatus && matchesDate;
        })
        .map((b, idx) => ({
            ...b,
            originalId: typeof b?.id === 'string' ? b.id : null,
            safeId: typeof b?.id === 'string' ? b.id : `booking-${idx}`,
            businessName: b?.business?.name || t('common.unknown'),
            serviceName: b?.service?.name || t('common.deleted'),
            dateDisplay: b?.date ? `${formatDate(b.date)} @ ${b.time ?? ''}` : t('common.unknown'),
            priceDisplay: typeof b?.totalPrice === 'number' ? formatPrice(b.totalPrice) : '-',
            statusValue: b?.status ?? 'UNKNOWN',
        }));

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
        { header: t('nav.business'), accessor: (b: any) => b?.businessName ?? t('common.unknown') },
        { header: t('booking.selectService'), accessor: (b: any) => b?.serviceName ?? t('common.deleted') },
        { header: t('common.date'), accessor: (b: any) => b?.dateDisplay ?? t('common.unknown') },
        { header: t('common.price'), accessor: (b: any) => b?.priceDisplay ?? '-' },
        {
            header: t('common.status'),
            accessor: (b: any) => (
                <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", getStatusColor(b?.statusValue))}>
                    {b?.statusValue && b.statusValue !== 'UNKNOWN' ? t(`booking.status.${b.statusValue}`) : t('common.unknown')}
                </span>
            )
        },
        {
            header: t('services.actions'),
            accessor: (b: any) => {
                const hasId = typeof b?.originalId === 'string';
                return (
                    <div className="flex gap-2">
                        {hasId && b?.statusValue === 'PENDING' && (
                            <Button size="sm" variant="danger" onClick={() => handleCancel(b.originalId)} title={t('booking.cancelBooking')}>
                                <XCircle size={16} />
                            </Button>
                        )}
                        {hasId && b?.statusValue === 'COMPLETED' && (
                            <Button size="sm" variant="secondary" onClick={() => setReviewBookingId(b.originalId)} title={t('review.addReview')}>
                                <Star size={16} />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={!hasId}
                            onClick={() => hasId && setChatBooking({ id: b.originalId, name: b?.businessName || t('common.unknown') })}
                            title={t('chat.title')}
                        >
                            <MessageSquare size={16} />
                        </Button>
                    </div>
                );
            }
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{t('booking.myBookings')}</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="all">{t('admin.allStatuses', { defaultValue: 'All Statuses' })}</option>
                        <option value="PENDING">{t('booking.status.PENDING', { defaultValue: 'Pending' })}</option>
                        <option value="CONFIRMED">{t('booking.status.CONFIRMED', { defaultValue: 'Confirmed' })}</option>
                        <option value="COMPLETED">{t('booking.status.COMPLETED', { defaultValue: 'Completed' })}</option>
                        <option value="REJECTED">{t('booking.status.REJECTED', { defaultValue: 'Rejected' })}</option>
                        <option value="CANCELLED">{t('booking.status.CANCELLED', { defaultValue: 'Cancelled' })}</option>
                    </select>
                </div>
            </div>
            <Table
                data={normalizedBookings}
                columns={columns}
                keyExtractor={b => b.safeId}
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
                <RatingModal
                    bookingId={reviewBookingId}
                    rateeId={bookings.find(b => typeof b.id === 'string' && b.id === reviewBookingId)?.business?.userId || ''}
                    rateeName={bookings.find(b => typeof b.id === 'string' && b.id === reviewBookingId)?.business?.name || ''}
                    isOpen={true}
                    onClose={() => setReviewBookingId(null)}
                    onSuccess={fetchBookings}
                />
            )}
        </div>
    );
}