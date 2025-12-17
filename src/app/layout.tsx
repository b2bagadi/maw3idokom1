import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: {
        default: 'Maw3idokom - Book Your Appointment Today',
        template: '%s | Maw3idokom',
    },
    description: 'Find and book local services in seconds. Maw3idokom is your one-stop platform for appointments.',
    keywords: ['appointments', 'booking', 'services', 'local business', 'scheduling'],
    authors: [{ name: 'Maw3idokom Team' }],
    manifest: '/manifest.json',
    themeColor: '#8b5cf6',
    icons: {
        icon: [
            { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        apple: [
            { url: '/icon-180.png', sizes: '180x180', type: 'image/png' }
        ],
        shortcut: '/icon-192.png'
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Maw3idokom',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://maw3idokom.com',
        siteName: 'Maw3idokom',
        title: 'Maw3idokom - Book Your Appointment Today',
        description: 'Find and book local services in seconds',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Maw3idokom - Book Your Appointment Today',
        description: 'Find and book local services in seconds',
    },
    robots: {
        index: true,
        follow: true,
    },
};

import { FloatingBg } from '@/components/ui/FloatingBg';
import Header from '@/components/layout/Header';
import { PusherProvider } from '@/lib/websocket/pusher-context';
import { RequestPopup } from '@/components/booking/RequestPopup';
import { QuickFindButton } from '@/components/quickfind/QuickFindButton';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.variable}>
                  <Providers>
                      <PusherProvider>
                          <FloatingBg />
                          <Header />
                          <main className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 relative z-10 transition-colors duration-300">
                              {children}
                          </main>
                          <RequestPopup />
                          <QuickFindButton />
                      </PusherProvider>
                  </Providers>
            </body>
        </html>
    );
}