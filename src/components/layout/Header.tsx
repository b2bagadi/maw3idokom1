'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LangThemeToggle } from '@/components/ui/LangThemeToggle';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback, CSSProperties } from 'react';
import { useClientTranslation } from '@/i18n/client';
import { Bell, MessageSquare, Menu, X, CalendarCheck, XCircle, LogOut } from 'lucide-react';

interface NotificationItem {
    id: string;
    type: 'message' | 'booking';
    bookingId?: string | null;
    status?: string | null;
    title?: string | null;
    text?: string | null;
    createdAt?: string;
    from?: string | null;
    counterparty?: string | null;
}

const statusBadgeClass: Record<string, string> = {
    CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-100',
    REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-100',
    CANCELLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-100',
    PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
};

function formatDateTime(iso?: string, locale?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(locale || undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const { t, lng } = useClientTranslation();

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isRTL, setIsRTL] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

    const isDashboardPath = useMemo(() => (
        pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/business/dashboard')
    ), [pathname]);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const notificationButtonsRef = useRef<HTMLButtonElement[]>([]);

    const registerNotificationButton = useCallback((el: HTMLButtonElement | null) => {
        if (!el) return;
        if (!notificationButtonsRef.current.includes(el)) {
            notificationButtonsRef.current.push(el);
        }
    }, []);

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
            .catch(() => { /* silent */ });
        return () => observer.disconnect();
    }, []);

    const computeDropdownStyle = useCallback((): CSSProperties => {
        if (!anchorRect) return {};
        const width = Math.min(416, window.innerWidth - 16);
        const top = anchorRect.bottom + 8;
        let left = isRTL ? anchorRect.left : anchorRect.right - width;
        left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
        return { position: 'fixed', top, left, width, zIndex: 60 };
    }, [anchorRect, isRTL]);

    useEffect(() => {
        if (!showNotifications) return;
        const update = () => setDropdownStyle(computeDropdownStyle());
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [showNotifications, computeDropdownStyle]);

    useEffect(() => {
        if (!session?.user?.id) return;
        const stored = localStorage.getItem(`notifications:dismissed:${session.user.id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setDismissedIds(new Set(parsed));
                }
            } catch {
                // ignore parse errors
            }
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (!session?.user?.id) return;
        localStorage.setItem(`notifications:dismissed:${session.user.id}`, JSON.stringify(Array.from(dismissedIds)));
    }, [dismissedIds, session?.user?.id]);

    useEffect(() => {
        if (!session) return;
        let isActive = true;

        const loadNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const res = await fetch('/api/notifications', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                if (isActive) {
                    const list = Array.isArray(data.notifications) ? data.notifications : [];
                    setRawNotifications(list);
                }
            } catch {
                // silent
            } finally {
                if (isActive) setLoadingNotifications(false);
            }
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 8000);
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [session]);

      useEffect(() => {
          function handleClickOutside(event: Event) {
              const target = event.target as Node;
            if (notificationsRef.current && notificationsRef.current.contains(target)) return;
            if (notificationButtonsRef.current.some(btn => btn && btn.contains(target))) return;
            setShowNotifications(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        setShowNotifications(false);
    }, [pathname]);

    const notifications = useMemo(
        () => rawNotifications.filter((n) => !dismissedIds.has(n.id)),
        [rawNotifications, dismissedIds]
    );

    const unreadCount = notifications.length;
    const baseDashboardPath = useMemo(() => {
        if (session?.user?.role === 'BUSINESS') return '/business/dashboard';
        if (session?.user?.role === 'ADMIN') return '/admin/dashboard';
        return '/dashboard';
    }, [session?.user?.role]);

    const handleDismiss = (id: string) => {
        setDismissedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const handleClear = () => {
        setDismissedIds((prev) => {
            const next = new Set(prev);
            notifications.forEach((n) => next.add(n.id));
            return next;
        });
    };

    const handleToggleNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const sameAnchor = anchorRect && rect.left === anchorRect.left && rect.top === anchorRect.top;
        setAnchorRect(rect);
        setDropdownStyle({});
        setShowNotifications((prev) => (sameAnchor ? !prev : true));
    };

    const handleNotificationClick = (n: NotificationItem) => {
        setShowNotifications(false);
        if (!n.bookingId) return;

        const params = new URLSearchParams({ tab: 'bookings' });

        if (n.type === 'message') {
            params.set('chatBookingId', n.bookingId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('chatBookingId', n.bookingId);
            }
        }

        router.push(`${baseDashboardPath}?${params.toString()}`);
    };

    const handleViewAll = () => {
        setShowNotifications(false);
        router.push(`${baseDashboardPath}?tab=bookings`);
    };

    const notificationDropdown = showNotifications && (
        <div
            ref={notificationsRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
            style={{
                position: 'fixed',
                ...dropdownStyle,
                width: dropdownStyle.width ?? 'min(26rem, calc(100vw - 2rem))',
                transformOrigin: isRTL ? 'top left' : 'top right',
            }}
        >
            <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-sm">{t('header.notifications')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} {t('header.items', { defaultValue: 'items' })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        onClick={handleClear}
                    >
                        {t('header.clearAll', { defaultValue: 'Clear all' })}
                    </button>
                </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        {t('header.loadingNotifications', { defaultValue: 'Loading notifications...' })}
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((n) => {
                        const statusClass = n.status ? statusBadgeClass[n.status] : '';
                        return (
                            <div
                                key={n.id}
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 border-b last:border-0 dark:border-gray-700/50 cursor-pointer"
                                onClick={() => handleNotificationClick(n)}
                            >
                                <div className="mt-1 text-gray-500 dark:text-gray-300">
                                    {n.type === 'message' ? <MessageSquare size={16} /> : <CalendarCheck size={16} />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                                                {n.type === 'message' ? t('header.message', { defaultValue: 'Message' }) : t('header.bookingUpdated', { defaultValue: 'Booking update' })}
                                            </span>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {n.title || (n.type === 'message' ? t('header.newMessage', { defaultValue: 'New message' }) : t('header.newBooking', { defaultValue: 'New booking' }))}
                                            </p>
                                        </div>
                                        {n.status && (
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusClass}`}>
                                                {t(`booking.status.${n.status}`, { defaultValue: n.status })}
                                            </span>
                                        )}
                                    </div>
                                    {(n.from || n.counterparty) && (
                                        <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                                            {n.from || n.counterparty}
                                        </p>
                                    )}
                                    {n.text && (
                                        <p className="text-xs text-gray-600 dark:text-gray-300 break-words">
                                            {n.text}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-gray-400">{formatDateTime(n.createdAt, lng)}</p>
                                </div>
                                <button
                                    className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDismiss(n.id);
                                    }}
                                    aria-label={t('header.dismiss', { defaultValue: 'Dismiss' })}
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>

                        );
                    })
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                        <p className="text-sm">{t('header.noNotifications')}</p>
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={handleViewAll}
                className="w-full p-3 border-t dark:border-gray-700 text-center text-xs font-semibold text-primary-600 dark:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                {t('header.viewAll', { defaultValue: 'View all messages' })}
            </button>
        </div>
    );

    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md h-16 opacity-0" />
        );
    }

        if (isDashboardPath) {
            if (!session) return null;
            return (
                <>
                    <div className="fixed top-3 right-16 sm:top-4 sm:right-4 flex items-center gap-2 z-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                            onClick={() => signOut({ callbackUrl: '/' })}
                        >
                            <LogOut size={18} className="sm:hidden" />
                            <span className="hidden sm:inline">{t('auth.logout', { defaultValue: 'Logout' })}</span>
                        </Button>

                        <div className="hidden sm:flex flex-col items-end leading-tight max-w-[200px]">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {session.user?.name || session.user?.email}
                            </span>
                            {session.user?.email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {session.user.email}
                                </span>
                            )}
                        </div>

                        <LangThemeToggle />

                        <button
                            ref={registerNotificationButton}
                            className="p-2 text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                            onClick={handleToggleNotifications}
                            aria-label={t('header.notifications')}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                    </div>
                    {notificationDropdown}
                </>
            );
        }

    return (
        <>
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
                        {session ? (
                            <Link
                                href={baseDashboardPath}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                            >
                                {t('header.dashboard', { defaultValue: 'Dashboard' })}
                            </Link>
                        ) : (
                            <Link href="/business/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg">
                                {t('header.forBusiness', { defaultValue: 'For Business' })}
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <LangThemeToggle />

                        {session ? (
                            <>
                                <button
                                    ref={registerNotificationButton}
                                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                                    onClick={handleToggleNotifications}
                                    aria-label={t('header.notifications')}
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </button>

                                <div className="hidden lg:flex flex-col leading-tight max-w-[180px] px-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {session.user?.name || session.user?.email}
                                    </span>
                                    {session.user?.email && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</span>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-semibold"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                >
                                    {t('auth.logout', { defaultValue: 'Logout' })}
                                </Button>
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
                            <button
                                ref={registerNotificationButton}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                                onClick={handleToggleNotifications}
                                aria-label={t('header.notifications')}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Toggle navigation"
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
                            {session ? (
                                <Link
                                    href={baseDashboardPath}
                                    className="px-4 py-2.5 text-center text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('header.dashboard', { defaultValue: 'Dashboard' })}
                                </Link>
                            ) : (
                                <Link
                                    href="/business/register"
                                    className="px-4 py-2.5 text-center text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-md"
                                >
                                    {t('header.forBusiness', { defaultValue: 'For Business' })}
                                </Link>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-1 flex flex-col gap-2">
                                {session ? (
                                    <>
                                        <div className="px-1 text-center">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {session.user?.name || session.user?.email}
                                            </div>
                                            {session.user?.email && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</div>
                                            )}
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full font-semibold border-2"
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                        >
                                            {t('auth.logout', { defaultValue: 'Logout' })}
                                        </Button>
                                    </>
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
            {notificationDropdown}
        </>
    );
}
