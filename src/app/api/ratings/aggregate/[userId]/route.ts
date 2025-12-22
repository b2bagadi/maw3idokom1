import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                avgRating: true,
                totalRatings: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            avgRating: user.avgRating,
            totalRatings: user.totalRatings
        });
    } catch (error) {
        console.error('[Rating Aggregate Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
