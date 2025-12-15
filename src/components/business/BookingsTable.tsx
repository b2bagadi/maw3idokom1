'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, X, MessageSquare } from 'lucide-react';
import { formatDate, formatTime, getStatusColor, formatPrice } from '@/lib/utils';
import BusinessChat from './BusinessChat';
import { cn } from '@/lib/utils';

import { useClientTranslation } from '@/i18n/client';

export default function BookingsTable() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatBooking, setChatBooking] = useState<{ id: string; name: string } | null>(null);
    const { t } = useClientTranslation();

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setBookings(data);
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

    const columns = [
        { header: t('nav.client', { defaultValue: 'Client' }), accessor: (b: any) => b.client.name },
        { header: t('business.services', { defaultValue: 'Service' }), accessor: (b: any) => b.service.name },
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
            <h2 className="text-xl font-bold mb-4">{t('business.bookings', { defaultValue: 'Bookings' })}</h2>
            <Table
                data={bookings}
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
        </div>
    );
}
