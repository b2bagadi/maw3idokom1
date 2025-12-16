'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useClientTranslation } from '@/i18n/client';

export default function Categories() {
    const [categories, setCategories] = useState<any[]>([]);
    const { t, lng } = useClientTranslation();

    const getLocalizedCategoryName = (cat: any) => {
        const lang = lng;
        if (lang === 'ar') return cat.nameAr || cat.nameEn;
        if (lang === 'fr') return cat.nameFr || cat.nameEn;
        return cat.nameEn;
    };

    useEffect(() => {
        fetch('/api/categories?featured=true&active=true')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    // console.error('Categories response is not an array:', data);
                    setCategories([]); // Silently fail or empty to avoid error causing crash
                }
            })
            .catch((err) => {
                // console.error('Failed to fetch categories:', err);
                setCategories([]);
            });
    }, []);

    return (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">{t('categories.title')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {categories.map((cat) => (
                        <Link
                            href={`/search?category=${cat.id}`}
                            key={cat.id}
                            className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center border hover:border-primary-500"
                        >
                            <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">{cat.emoji}</span>
                            <h3 className="font-semibold">{getLocalizedCategoryName(cat)}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}