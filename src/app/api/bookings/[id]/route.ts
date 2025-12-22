import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                service: true,
                staff: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                business: {
                    select: {
                        id: true,
                        name: true,
                        userId: true
                    }
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Check if user is participant
        const isClient = booking.clientId === session.user.id;
        const isBusiness = booking.business.userId === session.user.id;

        if (!isClient && !isBusiness && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error('[Booking GET Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
