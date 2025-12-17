import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type NotificationItem = {
    id: string;
    type: 'message' | 'booking';
    bookingId: string | null;
    status?: string | null;
    title?: string | null;
    text?: string | null;
    createdAt: Date;
    from?: string | null;
    counterparty?: string | null;
};

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    const notifications: NotificationItem[] = [];

    if (role === 'BUSINESS') {
        const business = await prisma.business.findFirst({ where: { userId: session.user.id }, select: { id: true, name: true } });
        if (!business) return NextResponse.json({ notifications: [] });

        const [bookings, messages] = await Promise.all([
            prisma.booking.findMany({
                where: { businessId: business.id },
                include: {
                    client: { select: { name: true } },
                    service: { select: { name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 25
            }),
            prisma.message.findMany({
                where: {
                    booking: { businessId: business.id },
                    senderId: { not: session.user.id }
                },
                include: {
                    booking: {
                        include: {
                            client: { select: { name: true } },
                            service: { select: { name: true } }
                        }
                    },
                    sender: { select: { role: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 25
            })
        ]);

        bookings.forEach((booking) => {
            notifications.push({
                id: `booking-${booking.id}-${booking.status}-${booking.updatedAt.getTime()}`,
                type: 'booking',
                bookingId: booking.id,
                status: booking.status,
                title: null,
                text: `${booking.client?.name ?? ''} • ${booking.service?.name ?? ''}`.trim(),
                createdAt: booking.updatedAt ?? booking.createdAt,
                counterparty: booking.client?.name ?? null,
            });
        });

        messages.forEach((msg) => {
            notifications.push({
                id: `msg-${msg.id}`,
                type: 'message',
                bookingId: msg.bookingId,
                status: msg.booking?.status ?? null,
                title: null,
                text: msg.text,
                createdAt: msg.createdAt,
                from: msg.sender?.name ?? msg.sender?.role ?? null,
                counterparty: msg.booking?.client?.name ?? null,
            });
        });
    } else if (role === 'CLIENT') {
        const [bookings, messages] = await Promise.all([
            prisma.booking.findMany({
                where: { clientId: session.user.id },
                include: {
                    business: { select: { name: true } },
                    service: { select: { name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 25
            }),
            prisma.message.findMany({
                where: {
                    booking: { clientId: session.user.id },
                    senderId: { not: session.user.id }
                },
                include: {
                    booking: {
                        include: {
                            business: { select: { name: true } },
                            service: { select: { name: true } }
                        }
                    },
                    sender: { select: { role: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 25
            })
        ]);

        bookings.forEach((booking) => {
            notifications.push({
                id: `booking-${booking.id}-${booking.status}-${booking.updatedAt.getTime()}`,
                type: 'booking',
                bookingId: booking.id,
                status: booking.status,
                title: null,
                text: `${booking.business?.name ?? ''} • ${booking.service?.name ?? ''}`.trim(),
                createdAt: booking.updatedAt ?? booking.createdAt,
                counterparty: booking.business?.name ?? null,
            });
        });

        messages.forEach((msg) => {
            notifications.push({
                id: `msg-${msg.id}`,
                type: 'message',
                bookingId: msg.bookingId,
                status: msg.booking?.status ?? null,
                title: null,
                text: msg.text,
                createdAt: msg.createdAt,
                from: msg.sender?.name ?? msg.sender?.role ?? null,
                counterparty: msg.booking?.business?.name ?? null,
            });
        });
    } else {
        return NextResponse.json({ notifications: [] });
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 30) });
}
