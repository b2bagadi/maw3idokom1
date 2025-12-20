import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        subscriptionPlan: true,
                    }
                },
                _count: {
                    select: {
                        clientBookings: true,
                        givenRatings: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const bookings = await prisma.booking.findMany({
            include: {
                client: { select: { name: true, email: true } },
                business: { select: { name: true } },
                service: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ users, bookings });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching accounts' }, { status: 500 });
    }
}