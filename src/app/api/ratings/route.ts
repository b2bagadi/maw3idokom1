import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ratings = await prisma.rating.findMany({
            where: {
                rateeId: session.user.id
            },
            include: {
                rater: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(ratings);
    } catch (error) {
        console.error('[Ratings GET Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
