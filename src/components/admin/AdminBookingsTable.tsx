'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useClientTranslation } from '@/i18n/client';
import { Trash2 } from 'lucide-react';

export default function AdminBookingsTable() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [businessFilter, setBusinessFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
    const { t } = useClientTranslation();

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/accounts');
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            
            setBookings(data.bookings || []);
            
            // Extract all businesses from users list, not just from bookings
            // This ensures the dropdown has all businesses even if they have no bookings
            const allBusinesses = data.users
                ?.filter((u: any) => u.business)
                .map((u: any) => u.business) || [];
                
            setBusinesses(allBusinesses);
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
        let result = bookings;

        // Business Filter
        if (businessFilter !== 'all') {
            result = result.filter(b => b.business?.name === businessFilter);
        }

        // Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(b => b.status === statusFilter);
        }

        // Date Filter
        if (dateFilter) {
            result = result.filter(b => {
                const bookingDate = new Date(b.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
                return bookingDate === dateFilter;
            });
        }

        setFilteredBookings(result);
        
        // Clear selection when filter changes to avoid confusion
        setSelectedBookings(new Set());
    }, [businessFilter, statusFilter, dateFilter, bookings]);

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

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedBookings);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedBookings(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedBookings.size === filteredBookings.length && filteredBookings.length > 0) {
            setSelectedBookings(new Set());
        } else {
            setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedBookings.size === 0) return;
        
        if (!confirm(t('admin.confirmDelete', { defaultValue: 'Are you sure you want to delete the selected bookings?' }))) {
            return;
        }

        try {
            const res = await fetch('/api/bookings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedBookings) }),
            });

            if (!res.ok) throw new Error('Failed to delete');
            
            toast.success(t('admin.bookingsDeleted', { defaultValue: 'Bookings deleted successfully' }));
            setSelectedBookings(new Set());
            fetchData();
        } catch (error) {
            toast.error(t('admin.failedDelete', { defaultValue: 'Failed to delete bookings' }));
        }
    };

    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={filteredBookings.length > 0 && selectedBookings.size === filteredBookings.length}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (booking: any) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedBookings.has(booking.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(booking.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            className: "w-10 px-0 text-center"
        },
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
                            {t('admin.markCompleted', { defaultValue: 'Mark as Completed' })}
                        </Button>
                    ) : null
            )
        },
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold">{t('admin.allBookings')}</h2>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {selectedBookings.size > 0 && (
                        <Button 
                            variant="danger" 
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="mr-2"
                        >
                            <Trash2 size={16} className="mr-1" />
                            {t('admin.deleteSelected', { defaultValue: 'Delete' })} ({selectedBookings.size})
                        </Button>
                    )}
                    
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

                        <select
                            value={businessFilter}
                            onChange={(e) => setBusinessFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm flex-grow md:flex-grow-0"
                        >
                            <option value="all">{t('admin.allBusinesses')}</option>
                            {businesses.map((business: any) => (
                                <option key={business.id || business.name} value={business.name}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
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