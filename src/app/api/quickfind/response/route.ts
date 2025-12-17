import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action } = await req.json();

    if (action === 'reject') {
      return NextResponse.json({ success: true });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { services: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const parts = requestId.split('_');
    const clientId = parts.slice(2).join('_');
    
    const pusher = getPusherServer();
    await pusher.trigger(`user-${clientId}`, 'request_offered', {
      businessId: business.id,
      businessName: business.name,
      price: business.services[0]?.price || 0,
      address: business.address,
      lat: business.lat,
      lng: business.lng,
      logoUrl: business.logoUrl,
      requestId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QuickFind Response Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
