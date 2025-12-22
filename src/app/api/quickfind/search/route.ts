import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateDistance } from '@/lib/utils/distance';

/**
 * POST /api/quickfind/search
 * Search for nearby businesses based on Quick Find criteria
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            categoryId,
            lat,
            lng,
            maxDistance = 25, // km
            minRating = 0,
            maxPrice
        } = await req.json();

        if (!categoryId || lat === undefined || lng === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: categoryId, lat, lng' },
                { status: 400 }
            );
        }

        // Find all businesses in this category
        const businesses = await prisma.business.findMany({
            where: {
                categoryId,
                user: {
                    isActive: true
                },
                averageRating: {
                    gte: minRating
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                category: {
                    select: {
                        nameEn: true,
                        nameFr: true,
                        nameAr: true
                    }
                },
                approvals: {
                    where: {
                        categoryId,
                        isActive: true
                    },
                    select: {
                        approvedPrice: true,
                        approvedDurationMinutes: true
                    }
                }
            }
        });

        // Filter by distance and price
        const nearbyBusinesses = businesses
            .map(business => {
                if (!business.lat || !business.lng) return null;

                const distance = calculateDistance(
                    lat,
                    lng,
                    business.lat,
                    business.lng
                );

                return {
                    ...business,
                    distance
                };
            })
            .filter((b): b is (any & { distance: number }) =>
                b !== null && b.distance <= maxDistance
            )
            .filter(b => {
                if (!maxPrice) return true;
                const approval = b.approvals[0];
                return !!approval && approval.approvedPrice <= maxPrice;
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20); // Max 20 results

        return NextResponse.json({
            businesses: nearbyBusinesses,
            count: nearbyBusinesses.length
        });

    } catch (error) {
        console.error('Quick Find search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
