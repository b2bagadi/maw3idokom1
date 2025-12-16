'use client';

import { Star, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEffect } from 'react';

interface BusinessHeroProps {
    business: any;
}

export default function BusinessHero({ business }: BusinessHeroProps) {
    useEffect(() => {
        // Track recently viewed businesses
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedBusinesses') || '[]');
        
        // Remove if already exists to avoid duplicates
        const filtered = recentlyViewed.filter((b: any) => b.id !== business.id);
        
        // Add current business at the beginning
        const updated = [{
            id: business.id,
            name: business.name,
            heroUrl: business.heroUrl,
            categoryName: business.category?.nameEn,
            address: business.address,
            averageRating: business.averageRating,
            reviewCount: business._count?.reviews || 0,
            viewedAt: new Date().toISOString()
        }, ...filtered].slice(0, 8); // Keep only last 8
        
        localStorage.setItem('recentlyViewedBusinesses', JSON.stringify(updated));
    }, [business]);

    return (
        <div className="relative h-[400px]">
            <div className="absolute inset-0">
                <img
                    src={business.heroUrl || 'https://via.placeholder.com/1200x400'}
                    alt={business.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {business.category?.nameEn}
                            </span>
                            <div className="flex items-center text-yellow-400">
                                <Star size={16} fill="currentColor" strokeWidth={0} />
                                <span className="ml-1 font-bold">{business.averageRating.toFixed(1)}</span>
                                <span className="ml-1 text-gray-300 text-sm">({business._count?.reviews || 0} reviews)</span>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{business.name}</h1>

                        <div className="flex flex-col sm:flex-row gap-4 text-gray-200">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} />
                                <span>{business.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} />
                                <span>Open Today</span>
                            </div>
                        </div>
                    </div>

                    <Button size="lg" className="shadow-lg" onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}>
                        Book Appointment
                    </Button>
                </div>
            </div>
        </div>
    );
}