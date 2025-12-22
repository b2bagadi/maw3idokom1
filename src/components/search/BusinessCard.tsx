'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import { useClientTranslation } from '@/i18n/client';

interface BusinessCardProps {
    business: any;
}

export default function BusinessCard({ business }: BusinessCardProps) {
    const { t } = useClientTranslation();
    const startPrice = business.services?.[0]?.price;
    const category = business.category?.nameEn || business.categoryName;
    const reviewCount = business._count?.reviews ?? business.reviewCount ?? 0;

    return (
        <Link href={`/business/${business.id}`} className="block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={business.heroUrl || 'https://via.placeholder.com/400x300'}
                        alt={business.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {category && (
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold">
                            {category}
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-2">
                            {business.name}
                        </h3>
                        <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-yellow-700 dark:text-yellow-500 text-sm font-bold">
                            <Star size={14} fill="currentColor" strokeWidth={0} className="mr-1" />
                            {business.averageRating.toFixed(1)}
                            <span className="text-gray-400 font-normal ml-1">({reviewCount})</span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {business.address || 'No address'}
                    </p>

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm">
                            <span className="text-gray-500">{t('common.startsFrom', { defaultValue: 'Starts from' })} </span>
                            <span className="font-semibold text-primary-600 dark:text-primary-400">
                                {startPrice ? formatPrice(startPrice) : 'N/A'}
                            </span>
                        </div>
                        <Button size="sm">{t('common.bookNow', { defaultValue: 'Book Now' })}</Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}