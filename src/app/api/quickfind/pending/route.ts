import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/quickfind/pending
 * Get pending Quick Find requests for a business
 * Business polls this endpoint to check for new requests
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const since = searchParams.get('since'); // ISO timestamp of last poll

        // Get business for this user
        const business = await prisma.business.findUnique({
            where: { userId: session.user.id },
            select: { id: true, categoryId: true }
        });

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Get pending requests for this business's category
        const requests = await prisma.bookingRequest.findMany({
            where: {
                categoryId: business.categoryId,
                status: 'PENDING',
                expiresAt: {
                    gt: new Date() // Not expired
                },
                ...(since && {
                    createdAt: {
                        gt: new Date(since)
                    }
                })
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        avgRating: true,
                        totalRatings: true
                    }
                },
                category: {
                    select: {
                        nameEn: true,
                        nameFr: true,
                        nameAr: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        return NextResponse.json({
            requests,
            count: requests.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch requests' },
            { status: 500 }
        );
    }
}
