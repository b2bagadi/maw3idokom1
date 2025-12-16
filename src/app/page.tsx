import Hero from '@/components/landing/Hero';
import Categories from '@/components/landing/Categories';
import LandingContent from '@/components/landing/LandingContent';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'Maw3idokom - Book Appointments Online',
    description: 'Find and book top-rated professionals nearby: Salons, Mechanics, Doctors, and more.',
    openGraph: {
        title: 'Maw3idokom - Book Appointments Online',
        description: 'Find and book top-rated professionals nearby.',
        type: 'website',
    }
};

async function getNewBusinesses() {
    try {
        const businesses = await prisma.business.findMany({
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                reviews: true,
                _count: {
                    select: { bookings: true, reviews: true }
                }
            }
        });
        return businesses;
    } catch (error) {
        return [];
    }
}

async function getTrendingBusinesses() {
    try {
        const businesses = await prisma.business.findMany({
            include: {
                category: true,
                reviews: true,
                _count: {
                    select: { 
                        bookings: {
                            where: {
                                status: { in: ['COMPLETED', 'CONFIRMED'] }
                            }
                        },
                        reviews: true
                    }
                }
            }
        });

        // Sort by bookings count and rating (weighted score)
        const sorted = businesses
            .map(business => ({
                ...business,
                trendScore: (business._count.bookings * 2) + (business.averageRating * business._count.reviews)
            }))
            .sort((a, b) => b.trendScore - a.trendScore)
            .slice(0, 3);

        return sorted;
    } catch (error) {
        return [];
    }
}

export default async function Home() {
    const [newBusinesses, trendingBusinesses] = await Promise.all([
        getNewBusinesses(),
        getTrendingBusinesses()
    ]);

    return (
        <div className="min-h-screen">
            <Hero />
            <Categories />
            <LandingContent 
                newBusinesses={newBusinesses} 
                trendingBusinesses={trendingBusinesses}
            />
            <Footer />
        </div>
    );
}