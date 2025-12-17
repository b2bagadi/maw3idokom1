"use client";

import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useClientTranslation } from '@/i18n/client';
import { PWAInstallButton } from './PWAInstallButton';


export default function Hero() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [heroImage, setHeroImage] = useState('');
    const { t } = useClientTranslation();

    useEffect(() => {
        // Fetch hero background setting
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data && data.hero_background_url) {
                    setHeroImage(data.hero_background_url);
                }
            })
            .catch(err => console.error('Failed to fetch hero settings:', err));
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
                {heroImage ? (
                    <img
                        src={heroImage}
                        alt="Hero"
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-gray-900 to-black" />
                )}
            </div>



            <div className="relative z-20 text-center max-w-3xl px-4">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-bold text-white mb-6"
                >
                    {t('hero.title').split(' ').slice(0, -2).join(' ')} <br />
                    <span className="text-primary-400">{t('hero.title').split(' ').slice(-2).join(' ')}</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-gray-200 mb-8"
                >
                    {t('hero.subtitle')}
                </motion.p>

                <div className="flex justify-center mb-8">
                    <PWAInstallButton />
                </div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSearch}
                    className="flex flex-col md:flex-row gap-4 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20"
                >
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-300" />
                        <input
                            type="text"
                            placeholder={t('hero.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button size="lg" className="px-8 text-lg" type="submit">
                        {t('hero.searchButton')}
                    </Button>
                </motion.form>
            </div>
        </div>
    );
}
