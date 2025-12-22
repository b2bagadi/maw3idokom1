import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { filterByDistance } from '@/lib/utils/distance';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const categoryId = searchParams.get('categoryId');
    const radius = parseFloat(searchParams.get('radius') || '10'); // Default 10km
    const minRating = parseFloat(searchParams.get('minRating') || '0');

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
            { error: 'Valid lat and lng are required' },
            { status: 400 }
        );
    }

    try {
        // Fetch businesses in the category
        const businesses = await prisma.business.findMany({
            where: {
                ...(categoryId && { categoryId }),
                user: {
                    isActive: true,
                },
            },
            include: {
                category: true,
                services: {
                    orderBy: { price: 'asc' },
                    take: 1,
                },
                user: {
                    select: {
                        id: true,
                        avgRating: true,
                        totalRatings: true,
                    },
                },
            },
        });

        // Filter by distance and rating
        const nearbyBusinesses = filterByDistance(
            businesses,
            lat,
            lng,
            radius
        ).filter((b: any) => ((b.user?.avgRating as number) || 0) >= minRating);

        return NextResponse.json(nearbyBusinesses);
    } catch (error) {
        console.error('[Quick Find Nearby Error]', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
