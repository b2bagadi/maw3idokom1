'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/i18n/client';
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/components/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <I18nProvider initialLang="fr">
                    <NotificationProvider>
                        {children}
                        <Toaster position="top-right" richColors />
                    </NotificationProvider>
                </I18nProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}