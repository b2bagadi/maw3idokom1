'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useClientTranslation } from '@/i18n/client';

export default function AdminBookingsTable() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [businessFilter, setBusinessFilter] = useState<string>('all');
    const { t } = useClientTranslation();

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/accounts');
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            
            setBookings(data.bookings || []);
            
            const uniqueBusinesses = Array.from(
                new Map(
                    data.bookings
                        ?.filter((b: any) => b.business)
                        .map((b: any) => [b.business.name, b.business])
                ).values()
            );
            setBusinesses(uniqueBusinesses);
        } catch (error) {
            toast.error(t('admin.failedLoadBookings'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (businessFilter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.business?.name === businessFilter));
        }
    }, [businessFilter, bookings]);

    const handleMarkCompleted = async (bookingId: string) => {
        try {
            const res = await fetch('/api/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: 'COMPLETED' }),
            });
            if (!res.ok) throw new Error('Failed to mark as completed');
            toast.success(t('admin.bookingMarkedCompleted'));
            fetchData();
        } catch (error) {
            toast.error(t('admin.failedUpdate'));
        }
    };

    const columns = [
        { 
            header: t('admin.client'), 
            accessor: (booking: any) => booking.client?.name || 'N/A' 
        },
        { 
            header: t('nav.business'), 
            accessor: (booking: any) => booking.business?.name || 'N/A' 
        },
        { 
            header: t('booking.selectService'), 
            accessor: (booking: any) => booking.service?.name || 'N/A' 
        },
        { 
            header: t('common.date'), 
            accessor: (booking: any) => new Date(booking.date).toLocaleDateString() 
        },
        { 
            header: t('common.time'), 
            accessor: (booking: any) => booking.time 
        },
        { 
            header: t('common.status'), 
            accessor: (booking: any) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    booking.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                    {t(`booking.status.${booking.status}`)}
                </span>
            )
        },
        { 
            header: t('common.actions'), 
            accessor: (booking: any) => (
                booking.status === 'CONFIRMED' ? (
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkCompleted(booking.id)}
                    >
                        {t('admin.markCompleted')}
                    </Button>
                ) : null
            )
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{t('admin.allBookings')}</h2>
                <select
                    value={businessFilter}
                    onChange={(e) => setBusinessFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                    <option value="all">{t('admin.allBusinesses')}</option>
                    {businesses.map((business: any) => (
                        <option key={business.name} value={business.name}>
                            {business.name}
                        </option>
                    ))}
                </select>
            </div>
            <Table
                data={filteredBookings}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
            />
        </div>
    );
}