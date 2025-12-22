import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/websocket/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId, offeredPrice, requestedTime, description, clientLat, clientLng } = await req.json();

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { quickFindCredits: true },
    });

    if (!user || user.quickFindCredits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits', code: 'NO_CREDITS' },
        { status: 403 }
      );
    }

    // Deduct credit
    await prisma.user.update({
      where: { id: session.user.id },
      data: { quickFindCredits: { decrement: 1 } },
    });

    // Fetch businesses - filter by distance if location provided
    let businesses = await prisma.business.findMany({
      where: {
        categoryId,
        user: {
          isActive: true,
        },
      },
      include: {
        services: true,
        category: true,
        user: {
          select: {
            id: true,
            avgRating: true,
            totalRatings: true,
          },
        },
      },
    });

    // Filter by proximity if client location provided
    if (clientLat && clientLng) {
      const { filterByDistance } = await import('@/lib/utils/distance');
      const MAX_RADIUS_KM = 20; // 20km radius
      businesses = filterByDistance(businesses, clientLat, clientLng, MAX_RADIUS_KM) as any; // Cast to preserve type
    }

    const requestId = `req_${Date.now()}_${session.user.id}`;

    // Use Promise.all for parallel broadcasting if multiple businesses
    const broadcastPromises = businesses.map(business =>
      broadcastEvent(`user-${business.userId}`, 'business:request_received', {
        requestId,
        clientId: session.user.id,
        clientName: session.user.name,
        service: '',
        price: `${(offeredPrice / 100).toFixed(2)} MAD`,
        time: requestedTime,
        description,
        categoryId,
        offeredPrice,
        distance: (business as any).distance || null, // Include distance if available
        businessRating: business.user?.avgRating || 0,
        businessReviews: business.user?.totalRatings || 0,
      })
    );

    await Promise.allSettled(broadcastPromises);

    return NextResponse.json({
      success: true,
      requestId,
      remainingCredits: user.quickFindCredits - 1,
    });
  } catch (error) {
    console.error('[QuickFind Request Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
