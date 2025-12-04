'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';

const categories = [
    { key: 'beauty', icon: '✂️', color: 'bg-pink-100 text-pink-700' },
    { key: 'health', icon: '⚕️', color: 'bg-blue-100 text-blue-700' },
    { key: 'auto', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
    { key: 'legal', icon: '⚖️', color: 'bg-purple-100 text-purple-700' },
    { key: 'education', icon: '🎓', color: 'bg-green-100 text-green-700' },
    { key: 'fitness', icon: '🏋️', color: 'bg-red-100 text-red-700' },
    { key: 'art', icon: '🎨', color: 'bg-indigo-100 text-indigo-700' },
    { key: 'homeServices', icon: '🏡', color: 'bg-yellow-100 text-yellow-700' },
];

export function CategoryPills({ locale }: { locale: string }) {
    const t = useTranslations('categories');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="py-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative">
                    {/* Scroll Buttons */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 hidden md:block"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 hidden md:block"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Scrollable Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide px-8 md:px-12"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {categories.map((category) => (
                            <a
                                key={category.key}
                                href={`/${locale}/search?category=${category.key}`}
                                className="flex-shrink-0"
                            >
                                <Badge
                                    className={`px-6 py-3 text-base font-medium cursor-pointer hover:scale-105 transition-transform ${category.color}`}
                                >
                                    <span className="mr-2">{category.icon}</span>
                                    {t(category.key)}
                                </Badge>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
