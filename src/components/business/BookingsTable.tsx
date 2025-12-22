'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, X, MessageSquare, Star } from 'lucide-react';
import { formatDate, formatTime, getStatusColor, formatPrice } from '@/lib/utils';
import BusinessChat from './BusinessChat';
import { cn } from '@/lib/utils';

import { useClientTranslation } from '@/i18n/client';
import { RatingModal } from '@/components/rating/RatingModal';

export default function BookingsTable() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatBooking, setChatBooking] = useState<{ id: string; name: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [rateBooking, setRateBooking] = useState<{ id: string; clientName: string; clientId: string } | null>(null);
    const { t } = useClientTranslation();

    const searchParams = useSearchParams();

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setBookings(data);

            // Check for auto-open chat
            const chatBookingId = searchParams?.get('chatBookingId');
            const storedChatId = typeof window !== 'undefined' ? localStorage.getItem('chatBookingId') : null;
            const targetChatId = chatBookingId || storedChatId;

            if (targetChatId) {
                const booking = data.find((b: any) => b.id === targetChatId);
                if (booking) {
                    setChatBooking({ id: booking.id, name: booking.client.name });
                    if (storedChatId) localStorage.removeItem('chatBookingId');
                    // Clean up URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('chatBookingId');
                    window.history.replaceState({}, '', url);
                }
            }
        } catch {
            toast.error(t('common.error', { defaultValue: 'Error loading bookings' }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (!res.ok) throw new Error('Failed');

            setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
            toast.success(t('common.success', { defaultValue: 'Success' }));
        } catch {
            toast.error(t('common.error', { defaultValue: 'Failed to update status' }));
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        // Ensure date comparison is correct. b.date is typically ISO string or Date object.
        // Assuming b.date is ISO string or recognizable by Date constructor.
        // toLocaleDateString('en-CA') returns YYYY-MM-DD which matches input type="date" value format.
        const matchesDate = !dateFilter || new Date(b.date).toLocaleDateString('en-CA') === dateFilter;
        return matchesStatus && matchesDate;
    });

    const columns = [
        { header: t('nav.client', { defaultValue: 'Client' }), accessor: (b: any) => b.client.name },
        { header: t('business.services', { defaultValue: 'Service' }), accessor: (b: any) => b.service?.name || 'Quick Find Service' },
        {
            header: `${t('common.date')} & ${t('common.time')}`,
            accessor: (b: any) => `${formatDate(b.date)} ${t('common.at', { defaultValue: 'at' })} ${b.time}`
        },
        { header: t('common.price', { defaultValue: 'Price' }), accessor: (b: any) => formatPrice(b.totalPrice) },
        {
            header: t('common.status', { defaultValue: 'Status' }),
            accessor: (b: any) => (
                <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", getStatusColor(b.status))}>
                    {t(`booking.status.${b.status}`, { defaultValue: b.status })}
                </span>
            )
        },
        {
            header: t('common.actions', { defaultValue: 'Actions' }),
            accessor: (b: any) => (
                <div className="flex gap-2">
                    {b.status === 'PENDING' && (
                        <>
                            <Button size="sm" variant="success" onClick={() => updateStatus(b.id, 'CONFIRMED')} title={t('common.confirm')}>
                                <Check size={16} />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => updateStatus(b.id, 'REJECTED')} title={t('common.reject', { defaultValue: 'Reject' })}>
                                <X size={16} />
                            </Button>
                        </>
                    )}
                    {b.status === 'CONFIRMED' && (
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                            onClick={() => updateStatus(b.id, 'COMPLETED')}
                            title={t('business.markCompleted', { defaultValue: 'Mark as Completed' })}
                        >
                            <Check size={16} className="mr-1" />
                            <span className="hidden md:inline">{t('common.complete', { defaultValue: 'Complete' })}</span>
                        </Button>
                    )}
                    {b.status === 'COMPLETED' && !b.hasRated && (
                        <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white border-none"
                            onClick={() => setRateBooking({ id: b.id, clientName: b.client.name, clientId: b.client.id })}
                            title={t('rating.rateClient', { defaultValue: 'Rate Client' })}
                        >
                            <Star size={16} />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setChatBooking({ id: b.id, name: b.client.name })}
                        title={t('chat.title')}
                    >
                        <MessageSquare size={16} />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold">{t('business.bookings', { defaultValue: 'Bookings' })}</h2>
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
                data={filteredBookings}
                columns={columns}
                keyExtractor={b => b.id}
                isLoading={isLoading}
                emptyMessage={t('business.noBookings', { defaultValue: 'No bookings found' })}
            />

            {chatBooking && (
                <BusinessChat
                    bookingId={chatBooking.id}
                    customerName={chatBooking.name}
                    isOpen={true}
                    onClose={() => setChatBooking(null)}
                />
            )}

            {rateBooking && (
                <RatingModal
                    isOpen={true}
                    onClose={() => setRateBooking(null)}
                    bookingId={rateBooking.id}
                    rateeId={rateBooking.clientId}
                    rateeName={rateBooking.clientName}
                    onSuccess={() => {
                        toast.success(t('common.success', { defaultValue: 'Rating submitted' }));
                        setRateBooking(null);
                    }}
                />
            )}
        </div>
    );
}
