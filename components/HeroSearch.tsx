'use client';

import { useTranslations } from 'next-intl';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, MapPin, Calendar } from 'lucide-react';
import { useState } from 'react';

export function HeroSearch({ locale }: { locale: string }) {
    const t = useTranslations('hero');
    const [searchParams, setSearchParams] = useState({
        what: '',
        where: '',
        when: '',
    });

    const handleSearch = () => {
        // Navigate to search page with params
        const params = new URLSearchParams({
            q: searchParams.what,
            location: searchParams.where,
            date: searchParams.when,
        });
        window.location.href = `/${locale}/search?${params.toString()}`;
    };

    return (
        <div
            className="relative bg-cover bg-center min-h-[500px] flex items-center justify-center"
            style={{
                backgroundImage:
                    "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600')",
            }}
        >
            <div className="max-w-4xl mx-auto px-4 text-center z-10">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    {t('title')}
                </h1>
                <p className="text-xl text-white/90 mb-8">{t('subtitle')}</p>

                {/* Smart Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* What */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder={t('searchWhat')}
                                className="pl-10"
                                value={searchParams.what}
                                onChange={(e) =>
                                    setSearchParams({ ...searchParams, what: e.target.value })
                                }
                            />
                        </div>

                        {/* Where */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder={t('searchWhere')}
                                className="pl-10"
                                value={searchParams.where}
                                onChange={(e) =>
                                    setSearchParams({ ...searchParams, where: e.target.value })
                                }
                            />
                        </div>

                        {/* When */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="date"
                                placeholder={t('searchWhen')}
                                className="pl-10"
                                value={searchParams.when}
                                onChange={(e) =>
                                    setSearchParams({ ...searchParams, when: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full mt-4 text-lg font-semibold"
                        onClick={handleSearch}
                    >
                        {t('searchButton')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
