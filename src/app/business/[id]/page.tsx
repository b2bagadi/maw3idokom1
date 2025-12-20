import { prisma } from '@/lib/prisma';
import BusinessHero from '@/components/business/BusinessHero';
import BusinessDetails from '@/components/business/BusinessDetails';
// ReviewsList was not used, generic components now.
import ReviewsList from '@/components/business/ReviewsList'; // Reusing existing component? 
// ReviewsList fetches its own data client-side? No, wait. 
// src/components/business/ReviewsList.tsx relied on fetching /api/reviews?businessId=...
// But it was designed for Business Dashboard (auto-fetch me). 
// I should make it generic or create PublicReviewsList.
// For expediency, I'll pass reviews as prop or creating a generic list component is best.
// The existing ReviewsList.tsx has a useEffect fetching /api/businesses then reviews.
// I should create a GenericReviewsList or just inline the review fetching logic here (server component).
// Since I'm in app directory, I can fetch reviews server side.

import { Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const business = await prisma.business.findUnique({
        where: { id },
        select: { name: true, description: true }
    });

    if (!business) return { title: 'Business Not Found' };

    return {
        title: `${business.name} - Maw3idokom`,
        description: business.description?.slice(0, 160) || `Book an appointment with ${business.name}`,
        openGraph: {
            title: `${business.name} - Maw3idokom`,
            description: business.description || `Book an appointment with ${business.name}`,
        }
    };
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const business = await prisma.business.findUnique({
        where: { id },
        include: {
            category: true,
            services: { orderBy: { price: 'asc' } },
            staff: true,
            gallery: true,
            // reviews: {
            //     include: { client: true },
            //     orderBy: { createdAt: 'desc' },
            //     take: 10
            // },
            // _count: { select: { reviews: true } }
        }
    });

    // Fetch ratings manually since relation is removed
    const ratings = await prisma.rating.findMany({
        where: { rateeId: business?.userId },
        include: { rater: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    if (!business) {
        notFound();
    }

    // Adapt ratings to match what BusinessDetails might expect (or update BusinessDetails)
    // Assuming BusinessDetails might use the 'reviews' prop if passed, or we just pass the business object.
    // If BusinessDetails reads business.reviews, we need to attach it or change BusinessDetails.
    // Let's attach it as 'reviews' for compatibility if possible, but TypeScript might complain.
    // Safer: pass ratings as a separate prop if I update BusinessDetails, or cast.

    const businessWithRatings = {
        ...business,
        reviews: ratings.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            client: { name: r.rater.name }
        }))
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <BusinessHero business={businessWithRatings} />
            <BusinessDetails business={businessWithRatings} />
        </div>
    );
}
