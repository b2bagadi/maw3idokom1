import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notifications: any[] = [];

        // Get messages related to client's bookings
        const messages = await prisma.message.findMany({
            where: {
                booking: {
                    clientId: session.user.id
                }
            },
            include: {
                booking: {
                    include: {
                        service: true,
                        business: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Format messages as notifications
        messages.forEach((msg) => {
            let title = 'Booking Update';
            let type = 'message';
            
            if (msg.text.includes('confirmed')) {
                title = 'Booking Confirmed';
                type = 'booking_confirmed';
            } else if (msg.text.includes('rejected')) {
                title = 'Booking Rejected';
                type = 'booking_rejected';
            } else if (msg.text.includes('complete')) {
                title = 'Booking Completed';
                type = 'booking_completed';
            }

            notifications.push({
                id: msg.id,
                title,
                text: msg.text,
                createdAt: msg.createdAt,
                type,
                bookingId: msg.bookingId
            });
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
    }
}
