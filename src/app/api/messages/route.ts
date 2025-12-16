import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function resolveBusinessId(userId: string) {
    const business = await prisma.business.findFirst({ where: { userId }, select: { id: true } });
    return business?.id;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return NextResponse.json({ message: 'Booking ID required' }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { clientId: true, businessId: true } });
    if (!booking) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isAdmin = session.user.role === 'ADMIN';
    const isClient = session.user.role === 'CLIENT' && booking.clientId === session.user.id;
    const businessId = session.user.role === 'BUSINESS' ? await resolveBusinessId(session.user.id) : null;
    const isBusiness = session.user.role === 'BUSINESS' && businessId === booking.businessId;

    if (!isAdmin && !isClient && !isBusiness) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    const messages = await prisma.message.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: {
                select: { id: true, role: true, name: true },
            },
        },
    });

    return NextResponse.json(messages);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { bookingId, text } = body;
        if (!bookingId || !text?.trim()) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });

        const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { clientId: true, businessId: true } });
        if (!booking) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        const isAdmin = session.user.role === 'ADMIN';
        const isClient = session.user.role === 'CLIENT' && booking.clientId === session.user.id;
        const businessId = session.user.role === 'BUSINESS' ? await resolveBusinessId(session.user.id) : null;
        const isBusiness = session.user.role === 'BUSINESS' && businessId === booking.businessId;

        if (!isAdmin && !isClient && !isBusiness) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

        const message = await prisma.message.create({
            data: {
                bookingId,
                senderId: session.user.id,
                text: text.trim(),
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error sending message' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return NextResponse.json({ message: 'Booking ID required' }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
    if (!booking) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    if (booking.status !== 'COMPLETED') return NextResponse.json({ message: 'Booking not completed' }, { status: 400 });

    await prisma.message.deleteMany({ where: { bookingId } });

    return NextResponse.json({ success: true });
}