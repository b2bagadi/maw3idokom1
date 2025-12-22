import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRatingAggregates } from '@/lib/rating-calculator';
import { broadcastEvent } from '@/lib/websocket/server';
import { WSEvents } from '@/lib/websocket/events';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, rating, comment, rateeId } = await req.json();

        if (!bookingId || !rating || !rateeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const raterId = session.user.id; // Corrected: session.user.id IS the rater

        // Validate booking participation
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { business: true, client: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Determine rater type and validate
        let raterType = '';

        // If rater is the client
        if (booking.clientId === raterId) {
            raterType = 'client';
            // Ratee must be the business user
            if (booking.business.userId !== rateeId) {
                return NextResponse.json({ error: 'Invalid ratee for this booking' }, { status: 400 });
            }
        }
        // If rater is the business owner
        else if (booking.business.userId === raterId) {
            raterType = 'business';
            // Ratee must be the client
            if (booking.clientId !== rateeId) {
                return NextResponse.json({ error: 'Invalid ratee for this booking' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'User not participant in booking' }, { status: 403 });
        }

        // Create Rating
        const newRating = await prisma.rating.create({
            data: {
                bookingId,
                raterId,
                rateeId,
                raterType,
                rating,
                comment,
            },
        });

        // Update Aggregates
        await updateRatingAggregates(rateeId);

        // Broadcast update
        await broadcastEvent(`user-${rateeId}`, WSEvents.RATING_UPDATED, {
            rating: newRating,
            avgRating: await prisma.user.findUnique({ where: { id: rateeId }, select: { avgRating: true } })
        });

        return NextResponse.json({ success: true, rating: newRating });
    } catch (error) {
        console.error('[Rating Submit Error]', error);
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'You have already rated this booking' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
