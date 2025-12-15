'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LangThemeToggle } from '@/components/ui/LangThemeToggle';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useClientTranslation } from '@/i18n/client';
import { Bell, MessageSquare, Menu, X } from 'lucide-react';

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useClientTranslation();

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isRTL, setIsRTL] = useState(false);

    const notificationRef = useRef<HTMLButtonElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const html = document.documentElement;
        setIsRTL(html.dir === 'rtl');
        const observer = new MutationObserver(() => setIsRTL(html.dir === 'rtl'));
        observer.observe(html, { attributes: true, attributeFilter: ['dir'] });
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data.system_logo_url) setLogoUrl(data.system_logo_url);
            })
            .catch(() => { });
        return () => observer.disconnect();
    }, []);

    // Polling for notifications
    useEffect(() => {
        if (!session) return;

        const fetchNotifications = async () => {
            try {
                const results: any[] = [];

                if (session.user.role === 'BUSINESS') {
                    const bookRes = await fetch('/api/bookings');
                    if (bookRes.ok) {
                        const bookings = await bookRes.json();
                        if (Array.isArray(bookings)) {
                            const pending = bookings.filter((b: any) => b.status === 'PENDING');
                            results.push(...pending.map((b: any) => ({
                                id: 'booking-' + b.id,
                                title: t('header.newBooking', { defaultValue: 'New Booking' }),
                                text: `${b.client.name} - ${b.service.name}`,
                                createdAt: b.createdAt,
                                type: 'booking',
                                bookingId: b.id
                            })));
                        }
                    }
                }

                results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setNotifications(results.slice(0, 10));
            } catch (error) {
                // silent
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);

        return () => clearInterval(interval);
    }, [session, t]);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node) &&
                notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md h-16 opacity-0">
            </header>
        );
    }

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/business/dashboard')) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-colors duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Maw3idokom" className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="bg-primary-600 rounded-lg p-1.5">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 hidden sm:inline">
                        {t('common.appName', { defaultValue: 'Maw3idokom' })}
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-3">
                    <Link href="/search" className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg">
                        {t('header.explore', { defaultValue: 'Explore' })}
                    </Link>
                    <Link href="/business/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg">
                        {t('header.forBusiness', { defaultValue: 'For Business' })}
                    </Link>
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2">
                    <LangThemeToggle />

                    {session ? (
                        <>
                            {/* Notification Icon */}
                            <div className="relative">
                                <button
                                    ref={notificationRef}
                                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <Bell size={18} />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div
                                        ref={notificationsRef}
                                        className="absolute mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden z-50 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto"
                                        style={{ width: 'min(22rem, calc(100vw - 1.5rem))', transformOrigin: isRTL ? 'top left' : 'top right' }}
                                    >
                                        <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                                            <h3 className="font-semibold text-sm">{t('header.notifications')}</h3>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map((n: any) => (
                                                    <div
                                                        key={n.id}
                                                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b dark:border-gray-700/50 last:border-0"
                                                        onClick={() => {
                                                            setShowNotifications(false);
                                                            if (n.type === 'booking') {
                                                                router.push(`/business/dashboard?tab=bookings${n.bookingId ? `&bookingId=${n.bookingId}` : ''}`);
                                                            } else {
                                                                router.push('/dashboard');
                                                            }
                                                        }}
                                                    >
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title || 'Message'}</p>
                                                        <p className="text-xs text-gray-500 truncate">{n.text || n.message}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-500">
                                                    <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                                                    <p className="text-sm">{t('header.noNotifications')}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t dark:border-gray-700 text-center">
                                            <Link
                                                href={session.user.role === 'BUSINESS' ? '/business/dashboard' : '/dashboard'}
                                                className="text-xs text-primary-600 hover:underline"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                {t('header.viewAll')}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link href={session.user.role === 'BUSINESS' ? '/business/dashboard' : '/dashboard'}>
                                <Button size="sm">{t('header.dashboard', { defaultValue: 'Dashboard' })}</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="outline" size="sm" className="font-semibold border-2 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400">{t('header.signIn', { defaultValue: 'Sign In' })}</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">{t('header.signUp', { defaultValue: 'Sign Up' })}</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Actions */}
                <div className="flex md:hidden items-center gap-2">
                    <LangThemeToggle />
                    
                    {session && (
                        <div className="relative">
                            <button
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={18} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
                        <Link 
                            href="/search" 
                            className="px-4 py-2.5 text-center text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                        >
                            {t('header.explore', { defaultValue: 'Explore' })}
                        </Link>
                        <Link 
                            href="/business/register" 
                            className="px-4 py-2.5 text-center text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md"
                        >
                            {t('header.forBusiness', { defaultValue: 'For Business' })}
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-1 flex flex-col gap-2">
                            {session ? (
                                <Link href={session.user.role === 'BUSINESS' ? '/business/dashboard' : '/dashboard'}>
                                    <Button className="w-full">{t('header.dashboard', { defaultValue: 'Dashboard' })}</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="outline" className="w-full font-semibold border-2">{t('header.signIn', { defaultValue: 'Sign In' })}</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button className="w-full">{t('header.signUp', { defaultValue: 'Sign Up' })}</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}