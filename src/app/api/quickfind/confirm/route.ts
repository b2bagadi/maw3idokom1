import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, businessId } = await req.json();

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { services: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: session.user.id,
        businessId,
        serviceId: business.services[0]?.id || '',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '09:00',
        totalPrice: business.services[0]?.price || 0,
        status: 'CONFIRMED',
      },
    });

    const pusher = getPusherServer();
    await pusher.trigger(`user-${business.userId}`, 'booking_confirmed', {
      bookingId: booking.id,
      requestId,
    });

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error('[QuickFind Confirm Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
