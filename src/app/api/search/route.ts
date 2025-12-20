import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const categoryId = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');

    let where: any = {
        // Only active businesses
        user: {
            isActive: true,
            role: 'BUSINESS' // Redundant but safe
        }
    };

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            // Search services?
            { services: { some: { name: { contains: query, mode: 'insensitive' } } } }
        ];
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (rating) {
        where.averageRating = { gte: parseFloat(rating) };
    }

    // Price filtering requires filtering by Services
    if (minPrice || maxPrice) {
        where.services = {
            some: {
                price: {
                    gte: minPrice ? parseInt(minPrice) : undefined,
                    lte: maxPrice ? parseInt(maxPrice) : undefined,
                }
            }
        };
    }

    try {
        const businesses = await prisma.business.findMany({
            where,
            include: {
                category: true,
                services: {
                    select: { price: true },
                    take: 1,
                    orderBy: { price: 'asc' }
                },
                // _count: { select: { reviews: true } }
            },
            orderBy: { averageRating: 'desc' }, // Default sort
        });

        return NextResponse.json(businesses);
    } catch (error) {
        return NextResponse.json({ message: 'Error searching businesses' }, { status: 500 });
    }
}
