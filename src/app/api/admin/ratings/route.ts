import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRatingAggregates } from '@/lib/rating-calculator';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ratings = await prisma.rating.findMany({
            include: {
                rater: { select: { name: true, email: true } },
                ratee: { select: { name: true, email: true } },
                booking: { select: { id: true, date: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(ratings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const rating = await prisma.rating.findUnique({ where: { id } });
        if (!rating) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.rating.delete({ where: { id } });

        // Update aggregates for the ratee
        await updateRatingAggregates(rating.rateeId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, comment } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.rating.update({
            where: { id },
            data: { comment }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
