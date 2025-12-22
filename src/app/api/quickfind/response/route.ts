import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action, price } = await req.json();

    if (action === 'reject') {
      return NextResponse.json({ success: true });
    }

    // Fetch the booking request to get the clientId
    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id: requestId },
      select: { clientId: true }
    });

    if (!bookingRequest) {
      console.error('[QuickFind Response] Request not found:', requestId);
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const clientId = bookingRequest.clientId;

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: {
        services: true,
        user: true
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Create notification for client
    await (prisma as any).notification.create({
      data: {
        userId: clientId,
        type: 'quick_find',
        read: false,
        data: {
          businessId: business.id,
          businessName: business.name,
          price: price !== undefined ? price : (business.services[0]?.price || 0),
          address: business.address,
          lat: business.lat,
          lng: business.lng,
          logoUrl: business.logoUrl,
          requestId,
          avgRating: business.user?.avgRating || 0,
          totalRatings: business.user?.totalRatings || 0,
          eventType: 'request_offered'
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QuickFind Response Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
