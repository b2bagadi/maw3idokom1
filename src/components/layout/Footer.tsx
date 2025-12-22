'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Facebook, Instagram, Mail, MapPin } from 'lucide-react';

import { useClientTranslation } from '@/i18n/client';

export default function Footer() {
    const { t } = useClientTranslation();
    const { data: session } = useSession();
    const [socials, setSocials] = useState({
        facebook_url: '#',
        instagram_url: '#',
        twitter_url: '#',
        contact_email: '',
    });

    useEffect(() => {
        // Fetch global settings
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setSocials({
                        facebook_url: data.facebook_url || '#',
                        instagram_url: data.instagram_url || '#',
                        twitter_url: data.twitter_url || '#',
                        contact_email: data.contact_email || '',
                    });
                }
            })
            .catch(err => console.error('Failed to fetch footer settings:', err));
    }, []);

    // ... existing return ...
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 px-4 transition-colors duration-300">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* ... (Brand) ... */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            {/* ... logo ... */}
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                                {t('common.appName')}
                            </span>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('footer.description', { defaultValue: 'Your one-stop platform for booking local services. Find, book, and enjoy.' })}
                        </p>
                    </div>

                    {/* ... (Quick Links) ... */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('footer.platform', { defaultValue: 'Platform' })}</h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><Link href="/search" className="hover:text-primary-600 transition-colors">{t('nav.search')}</Link></li>

                            {session ? (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="hover:text-primary-600 transition-colors"
                                    >
                                        {t('auth.logout', { defaultValue: 'Logout' })}
                                    </button>
                                </li>
                            ) : (
                                <>
                                    <li><Link href="/business/register" className="hover:text-primary-600 transition-colors">{t('nav.business')}</Link></li>
                                    <li><Link href="/login" className="hover:text-primary-600 transition-colors">{t('auth.login')}</Link></li>
                                    <li><Link href="/register" className="hover:text-primary-600 transition-colors">{t('auth.register')}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('nav.contact')}</h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <Mail size={16} />
                                <a href={`mailto:${socials.contact_email}`} className="hover:text-primary-600">{socials.contact_email || 'contact@example.com'}</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span>Casablanca, Morocco</span>
                            </li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('footer.followUs')}</h3>
                        <div className="flex items-center gap-4">
                            {socials.facebook_url && socials.facebook_url !== '#' && (
                                <a href={socials.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                                    <Facebook size={20} />
                                </a>
                            )}
                            {socials.instagram_url && socials.instagram_url !== '#' && (
                                <a href={socials.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                                    <Instagram size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t('footer.copyright')}
                </div>
            </div>
        </footer>
    );
}
