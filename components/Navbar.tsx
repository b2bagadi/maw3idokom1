'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, Menu } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

export function Navbar({ locale }: { locale: string }) {
    const t = useTranslations('common');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        href={`/${locale}`}
                        className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                    >
                        Maw3idokom
                    </Link>

                    {/* Condensed Search - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder={t('search')}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />

                        <Link href={`/${locale}/login`}>
                            <Button variant="outline" size="sm">
                                {t('login')}
                            </Button>
                        </Link>

                        <Link href={`/${locale}/register`}>
                            <Button size="sm">{t('register')}</Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder={t('search')}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
