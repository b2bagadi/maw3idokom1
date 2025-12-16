export class NotificationService {
    static async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }

    static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                ...options,
                icon: options?.icon || '/icon.png',
                badge: options?.badge || '/icon.png',
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, {
                    ...options,
                    icon: options?.icon || '/icon.png',
                    badge: options?.badge || '/icon.png',
                });
            }
        }
    }

    static isSupported(): boolean {
        return 'Notification' in window;
    }

    static getPermissionState(): NotificationPermission {
        if (!('Notification' in window)) {
            return 'denied';
        }
        return Notification.permission;
    }
}
