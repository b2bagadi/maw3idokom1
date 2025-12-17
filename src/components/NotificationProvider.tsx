'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationService } from '@/lib/notifications';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const initNotifications = async () => {
                if (NotificationService.isSupported()) {
                    const permission = NotificationService.getPermissionState();
                    if (permission === 'default') {
                        setTimeout(async () => {
                            const result = await NotificationService.requestPermission();
                            if (result === 'granted') {
                                toast.success('Notifications enabled');
                            }
                        }, 3000);
                    }
                }
            };

            initNotifications();
        }
    }, [session, status]);

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            let messageCheckInterval: NodeJS.Timeout;
            let bookingCheckInterval: NodeJS.Timeout;
            let lastMessageCount = 0;
            let lastBookingCount = 0;

            const checkNewMessages = async () => {
                if (session.user.role === 'CLIENT' || session.user.role === 'BUSINESS') {
                    try {
                        const res = await fetch('/api/bookings');
                        if (res.ok) {
                            const bookings = await res.json();
                            const allMessageCounts = await Promise.all(
                                bookings.map(async (booking: any) => {
                                    const msgRes = await fetch(`/api/messages?bookingId=${booking.id}`);
                                    if (msgRes.ok) {
                                        const messages = await msgRes.json();
                                        return messages.filter((m: any) => m.senderId !== session.user.id).length;
                                    }
                                    return 0;
                                })
                            );
                            const totalNewMessages = allMessageCounts.reduce((a, b) => a + b, 0);

                            if (lastMessageCount > 0 && totalNewMessages > lastMessageCount) {
                                const diff = totalNewMessages - lastMessageCount;
                                NotificationService.showNotification('New Message', {
                                    body: `You have ${diff} new message${diff > 1 ? 's' : ''}`,
                                    tag: 'new-message',
                                    requireInteraction: false,
                                });
                                toast.info(`${diff} new message${diff > 1 ? 's' : ''}`);
                            }
                            lastMessageCount = totalNewMessages;
                        }
                    } catch (error) {
                        console.error('Error checking messages:', error);
                    }
                }
            };

            const checkNewBookings = async () => {
                if (session.user.role === 'ADMIN') {
                    try {
                        const res = await fetch('/api/admin/accounts');
                        if (res.ok) {
                            const data = await res.json();
                            const allBookings = data.bookings || [];
                            const currentBookingCount = allBookings.length;

                            if (lastBookingCount > 0 && currentBookingCount > lastBookingCount) {
                                const diff = currentBookingCount - lastBookingCount;
                                NotificationService.showNotification('New Booking', {
                                    body: `${diff} new booking${diff > 1 ? 's' : ''} received`,
                                    tag: 'new-booking',
                                    requireInteraction: false,
                                });
                                toast.info(`${diff} new booking${diff > 1 ? 's' : ''}`);
                            }
                            lastBookingCount = currentBookingCount;
                        }
                    } catch (error) {
                        console.error('Error checking bookings:', error);
                    }
                }
            };

            checkNewMessages();
            checkNewBookings();

            messageCheckInterval = setInterval(checkNewMessages, 3000);
            bookingCheckInterval = setInterval(checkNewBookings, 3000);

            return () => {
                clearInterval(messageCheckInterval);
                clearInterval(bookingCheckInterval);
            };
        }
    }, [session, status]);

    return <>{children}</>;
}
