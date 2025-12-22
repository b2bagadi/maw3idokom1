import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const bookings = await prisma.booking.findMany({
        where: status ? { status } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
            client: { select: { name: true, email: true } },
            business: { select: { name: true } },
            service: { select: { name: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { text: true, createdAt: true },
            },
        },
        take: 200,
    });

    const result = bookings.map((b) => ({
        id: b.id,
        status: b.status,
        clientName: b.client.name,
        clientEmail: b.client.email,
        businessName: b.business.name,
        serviceName: b.service?.name ?? 'N/A',
        lastMessage: b.messages[0] || null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
    }));

    return NextResponse.json(result);
}
