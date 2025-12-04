import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import '../globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Maw3idokom - Book Appointments Anywhere',
    description: 'Find and book appointments with the best professionals near you',
};

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params: { locale },
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client side
    const messages = await getMessages();

    // Determine text direction based on locale
    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
