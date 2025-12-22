import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // 0. Update the original request status
    await prisma.bookingRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        acceptedBy: businessId
      }
    });

    // 1. Notify the selected business user
    await (prisma as any).notification.create({
      data: {
        userId: business.userId,
        type: 'quick_find',
        read: false,
        data: {
          bookingId: booking.id,
          requestId,
          eventType: 'booking_confirmed'
        }
      }
    });

    // 2. Notify all other businesses who received this request that it's now taken
    const allRequestNotifications = await (prisma as any).notification.findMany({
      where: {
        type: 'quick_find',
        data: {
          path: ['requestId'],
          equals: requestId
        },
        userId: { not: business.userId }
      }
    });

    // Get unique userIds who received the request
    const uniqueUserIds = Array.from(new Set(allRequestNotifications.map((n: any) => n.userId)));

    if (uniqueUserIds.length > 0) {
      await (prisma as any).notification.createMany({
        data: uniqueUserIds.map((userId: any) => ({
          userId,
          type: 'quick_find',
          read: false,
          data: {
            requestId,
            eventType: 'request_taken'
          }
        }))
      });
    }

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error('[QuickFind Confirm Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
