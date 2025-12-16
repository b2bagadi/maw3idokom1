'use client';

import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { Heart, MapPin, Star, Filter } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

interface SearchSidebarProps {
    filters: any;
    setFilters: (f: any) => void;
    categories: any[];
}

export default function SearchSidebar({ filters, setFilters, categories }: SearchSidebarProps) {
    const { t, lng } = useClientTranslation();
    const lang = lng;
    // Local state for slider to avoid excessive re-fetches while dragging
    const [priceRange, setPriceRange] = useState([0, 5000]); // Cents -> MAD 50.00 roughly
    const [hoverRating, setHoverRating] = useState(0);

    const getLocalizedCategoryName = (cat: any) => {
        if (lang === 'ar') return cat.nameAr || cat.nameEn;
        if (lang === 'fr') return cat.nameFr || cat.nameEn;
        return cat.nameEn;
    };

    const sortOptions = [
        { id: 'best_match', label: t('search.bestMatch', { defaultValue: 'Best match' }), icon: Heart },
        { id: 'closest', label: t('search.closest', { defaultValue: 'The closest' }), icon: MapPin },
        { id: 'top_rated', label: t('search.topRated', { defaultValue: 'Top-rated' }), icon: Star },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{t('search.filters', { defaultValue: 'Filters' })}</h2>
                <Button variant="ghost" size="sm" onClick={() => setFilters({})}>{t('common.clear', { defaultValue: 'Clear all' })}</Button>
            </div>

            {/* Sort By */}
            <div>
                <h3 className="text-sm font-semibold mb-3">{t('search.sortBy', { defaultValue: 'Sort by' })}</h3>
                <div className="grid grid-cols-3 gap-2">
                    {sortOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setFilters({ ...filters, sort: option.id })}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-24",
                                filters.sort === option.id
                                    ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500"
                                    : "border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                            )}
                        >
                            <option.icon className={cn("mb-2", filters.sort === option.id ? "fill-current" : "")} size={20} />
                            <span className="text-xs font-medium text-center leading-tight">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Categories as Chips */}
            <div>
                <h3 className="text-sm font-semibold mb-3">{t('search.category', { defaultValue: 'Category' })}</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilters({ ...filters, category: '' })}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm border transition-colors",
                            !filters.category
                                ? "bg-primary-600 text-white border-primary-600 hover:bg-primary-700"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        )}
                    >
                        {t('search.everyone', { defaultValue: 'Everyone' })}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilters({ ...filters, category: cat.id })}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm border transition-colors",
                                filters.category === cat.id
                                    ? "bg-primary-600 text-white border-primary-600"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                            )}
                        >
                            {cat.emoji} {getLocalizedCategoryName(cat)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold">{t('search.maxPrice', { defaultValue: 'Maximum price' })}</h3>
                    {filters.maxPrice && <span className="text-sm text-gray-500">{filters.maxPrice} MAD</span>}
                </div>
                <div className="px-1">
                    <Slider
                        min={0}
                        max={5000}
                        step={50}
                        value={[0, Number(filters.maxPrice) || 5000]}
                        onChange={(val) => setFilters({ ...filters, maxPrice: val[1] })}
                        className="my-4"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>0 MAD</span>
                        <span>5000+ MAD</span>
                    </div>
                </div>
            </div>

            {/* Rating Filter (Visual Stars) */}
            <div>
                <h3 className="text-sm font-semibold mb-3">{t('search.rating', { defaultValue: 'Rating' })}</h3>
                <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setFilters({ ...filters, rating: filters.rating === star ? 0 : star })}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none transform transition-transform hover:scale-110"
                            title={`${star} Stars`}
                        >
                            <Star
                                size={24}
                                className={cn(
                                    "transition-colors duration-200",
                                    (hoverRating || Number(filters.rating)) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-transparent text-gray-300 dark:text-gray-600"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
