import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRatingAggregates } from '@/lib/rating-calculator';

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

        const raterId = session.user.id;

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
            if (booking.business && booking.business.userId !== rateeId) {
                console.warn('[Rating Submit] Invalid rateeId for client rater:', { rateeId, businessUserId: booking.business.userId });
                return NextResponse.json({ error: 'Invalid ratee for this booking' }, { status: 400 });
            }
        }
        // If rater is the business owner
        else if (booking.business && booking.business.userId === raterId) {
            raterType = 'business';
            // Ratee must be the client
            if (booking.clientId !== rateeId) {
                console.warn('[Rating Submit] Invalid rateeId for business rater:', { rateeId, clientId: booking.clientId });
                return NextResponse.json({ error: 'Invalid ratee for this booking' }, { status: 400 });
            }
        } else {
            console.warn('[Rating Submit] User not participant:', { raterId, clientId: booking.clientId, businessUserId: booking.business?.userId });
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
        try {
            await updateRatingAggregates(rateeId);
        } catch (aggError) {
            console.error('[Rating Aggregation Error]', aggError);
            // Don't fail the whole request if aggregation fails, but log it
        }

        return NextResponse.json({ success: true, rating: newRating });
    } catch (error) {
        console.error('[Rating Submit Error] Full error details:', {
            error,
            message: (error as any).message,
            stack: (error as any).stack,
            code: (error as any).code
        });
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'You have already rated this booking' }, { status: 409 });
        }
        return NextResponse.json({
            error: 'Internal error during rating submission',
            details: (error as any).message
        }, { status: 500 });
    }
}
