import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rateeId = searchParams.get('rateeId');
    const type = searchParams.get('type'); // 'received' or 'given' (default: received)

    if (!rateeId) {
        return NextResponse.json({ error: 'rateeId is required' }, { status: 400 });
    }

    try {
        const ratings = await prisma.rating.findMany({
            where: {
                rateeId: rateeId,
            },
            include: {
                rater: {
                    select: {
                        name: true,
                        id: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(ratings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
