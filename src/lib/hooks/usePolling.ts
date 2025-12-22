'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';

export interface Notification {
    id: string;
    userId: string;
    type: string; // 'quick_find', 'booking', 'message', 'rating'
    data: any;
    read: boolean;
    createdAt: string;
}

/**
 * Hook to poll for new notifications
 * Polls every 5 seconds when user is authenticated
 */
export function useNotificationPolling(interval = 5000) {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const lastPollTime = useRef<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const poll = useCallback(async () => {
        if (status !== 'authenticated' || !session?.user) {
            if (status === 'authenticated') console.log('[Polling] Authenticated but no user object');
            return;
        }

        try {
            const url = lastPollTime.current
                ? `/api/notifications/poll?since=${encodeURIComponent(lastPollTime.current)}`
                : '/api/notifications/poll';

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const { notifications: newNotifications, timestamp } = await response.json();
                console.log(`[Polling] Received ${newNotifications.length} notifications`);

                if (newNotifications.length > 0) {
                    setNotifications(prev => [...newNotifications, ...prev]);
                }

                lastPollTime.current = timestamp;
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Polling] API error:', response.status, errorData);
            }
        } catch (error) {
            console.error('[Polling] Error fetching notifications:', error);
        }
    }, [session, status]);

    const markAsRead = useCallback(async (notificationIds: string[]) => {
        try {
            await fetch('/api/notifications/poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds })
            });

            // Update local state
            setNotifications(prev =>
                prev.map(n =>
                    notificationIds.includes(n.id) ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error('[Polling] Error marking notifications as read:', error);
        }
    }, []);

    // Start/stop polling based on authentication
    useEffect(() => {
        if (status === 'authenticated') {
            setIsPolling(true);

            // Poll immediately
            poll();

            // Then poll at interval
            intervalRef.current = setInterval(poll, interval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        } else {
            setIsPolling(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [status, poll, interval]);

    return {
        notifications,
        isPolling,
        markAsRead,
        unreadCount: notifications.filter(n => !n.read).length
    };
}

/**
 * Hook to poll for a specific type of notification
 */
export function useNotificationsByType(type: string, interval = 5000) {
    const { notifications, ...rest } = useNotificationPolling(interval);

    return {
        notifications: notifications.filter(n => n.type === type),
        ...rest
    };
}
