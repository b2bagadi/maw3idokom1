import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Reviews (Public or Private?)
// For now, GET specific business reviews or client reviews
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const clientId = searchParams.get('clientId');

    let where: any = {};
    if (businessId) where.businessId = businessId;
    if (clientId) where.clientId = clientId;

    const reviews = await prisma.review.findMany({
        where,
        include: {
            client: { select: { name: true } },
            business: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
}

// POST Review
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { bookingId, rating, comment } = body;

        // Verify booking
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        if (booking.clientId !== session.user.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        if (booking.status !== 'COMPLETED') return NextResponse.json({ message: 'Booking must be completed' }, { status: 400 });

        const review = await prisma.review.create({
            data: {
                bookingId,
                clientId: session.user.id,
                businessId: booking.businessId,
                rating,
                comment,
            }
        });

        // Update Average Rating (Naive approach: recalculate all)
        const aggregates = await prisma.review.aggregate({
            where: { businessId: booking.businessId },
            _avg: { rating: true },
        });

        await prisma.business.update({
            where: { id: booking.businessId },
            data: { averageRating: aggregates._avg.rating || 0 },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error creating review' }, { status: 500 });
    }
}
