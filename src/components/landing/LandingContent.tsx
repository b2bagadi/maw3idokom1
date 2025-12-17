'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import BusinessCard from '@/components/search/BusinessCard';
import { useSession } from 'next-auth/react';
import { useClientTranslation } from '@/i18n/client';
import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Clock, Sparkles } from 'lucide-react';

interface LandingContentProps {
    newBusinesses: any[];
    trendingBusinesses: any[];
}

// Haversine formula to calculate distance between two lat/lng points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

export default function LandingContent({ newBusinesses, trendingBusinesses }: LandingContentProps) {
    const { data: session } = useSession();
    const { t } = useClientTranslation();
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        // Load recently viewed businesses from localStorage
        const stored = localStorage.getItem('recentlyViewedBusinesses');
        if (stored) {
            const parsed = JSON.parse(stored);
            setRecentlyViewed(parsed.slice(0, 4));
        }

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    setLoadingLocation(false);
                    
                    // Calculate nearby businesses
                    const allBusinesses = [...trendingBusinesses, ...newBusinesses];
                    // Remove duplicates based on business ID
                    const uniqueBusinesses = Array.from(
                        new Map(allBusinesses.map(b => [b.id, b])).values()
                    );
                    const businessesWithDistance = uniqueBusinesses
                        .filter(b => b.lat && b.lng)
                        .map(business => ({
                            ...business,
                            distance: calculateDistance(
                                location.lat,
                                location.lng,
                                business.lat,
                                business.lng
                            )
                        }))
                        .filter(b => b.distance <= 10) // Within 10km
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 4);
                    
                    setNearbyBusinesses(businessesWithDistance);
                },
                (error) => {
                    console.log('Location access denied or unavailable');
                    setLoadingLocation(false);
                }
            );
        } else {
            setLoadingLocation(false);
        }
    }, [trendingBusinesses, newBusinesses]);

    return (
        <>
            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
                <section className="py-16 px-4 max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Clock className="text-primary-600 dark:text-primary-400" size={32} />
                            <h2 className="text-3xl font-bold">{t('landing.recentlyViewed', { defaultValue: 'Recently Viewed' })}</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recentlyViewed.map((business) => (
                            <BusinessCard key={business.id} business={business} />
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Section */}
            <section className="py-16 px-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-primary-600 dark:text-primary-400" size={32} />
                        <h2 className="text-3xl font-bold">{t('landing.trends', { defaultValue: 'Trends' })}</h2>
                    </div>
                    <Link href="/search">
                        <Button variant="ghost">{t('landing.viewAll', { defaultValue: 'View All' })}</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {trendingBusinesses.length > 0 ? (
                        trendingBusinesses.map((business) => (
                            <BusinessCard key={business.id} business={business} />
                        ))
                    ) : (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border dark:border-gray-700 animate-pulse">
                                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Nearby Section */}
            {!loadingLocation && nearbyBusinesses.length > 0 && (
                <section className="py-16 px-4 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900/50 dark:to-blue-900/20 rounded-3xl my-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-blue-600 dark:text-blue-400" size={32} />
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{t('landing.nearby', { defaultValue: 'Nearby' })}</h2>
                                <p className="text-gray-500">{t('landing.nearbySubtitle', { defaultValue: 'Businesses close to you' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {nearbyBusinesses.map((business, index) => (
                            <div key={`nearby-${business.id}-${index}`} className="relative">
                                <BusinessCard business={business} />
                                <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                    {business.distance.toFixed(1)} km
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* New Businesses Section */}
            <section className="py-16 px-4 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900/50 rounded-3xl my-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-primary-600 dark:text-primary-400" size={32} />
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{t('landing.newTitle', { defaultValue: 'New on Maw3idokom' })}</h2>
                            <p className="text-gray-500">{t('landing.newSubtitle', { defaultValue: 'Discover the latest businesses joining our platform' })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {newBusinesses.length > 0 ? (
                        newBusinesses.map((business) => (
                            <BusinessCard key={business.id} business={business} />
                        ))
                    ) : (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border dark:border-gray-700 h-64 flex flex-col items-center justify-center text-gray-400">
                                <span>{t('landing.noBusinesses', { defaultValue: 'No new businesses yet' })}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-600 text-white py-20 px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.ctaTitle', { defaultValue: 'Grow Your Business with Maw3idokom' })}</h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                    {t('landing.ctaSubtitle', { defaultValue: 'Join thousands of businesses managing appointments, clients, and growth on our platform.' })}
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/contact">
                        <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 border-none">
                            {t('landing.contactSales', { defaultValue: 'Contact Sales' })}
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}