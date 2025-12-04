'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { forceUpdateBooking } from '@/actions/admin-actions';
import { format } from 'date-fns';

interface Booking {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    totalPrice: number;
    status: string;
    customer: {
        username: string;
        email: string | null;
    };
    business: {
        name: string;
    };
    service: {
        name: string;
    };
    createdAt: Date;
}

const statusOptions = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
type BookingStatus = typeof statusOptions[number];

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
        setUpdatingStatus(bookingId);
        try {
            await forceUpdateBooking(bookingId, newStatus);
        } catch (error) {
            alert('Error updating booking status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'default';
            case 'PENDING':
                return 'secondary';
            case 'CANCELLED':
                return 'destructive';
            case 'COMPLETED':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Service</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3">
                                <div>
                                    <div className="font-medium">{booking.customer.username}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {booking.customer.email}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{booking.business.name}</td>
                            <td className="px-4 py-3">{booking.service.name}</td>
                            <td className="px-4 py-3">
                                <div>
                                    <div>{format(new Date(booking.date), 'PP')}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {booking.startTime} - {booking.endTime}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                                €{booking.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={getStatusBadgeVariant(booking.status)}>
                                    {booking.status}
                                </Badge>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                    {statusOptions
                                        .filter((status) => status !== booking.status)
                                        .map((status) => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusChange(booking.id, status)}
                                                disabled={updatingStatus === booking.id}
                                                className="text-xs"
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
