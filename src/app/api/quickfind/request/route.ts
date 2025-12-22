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

    const { categoryId, offeredPrice, requestedTime, description, clientLat, clientLng } = await req.json();

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { quickFindCredits: true, avgRating: true, totalRatings: true },
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

    // Create BookingRequest in database
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        clientId: session.user.id,
        categoryId,
        description: description || null,
        offeredPrice,
        requestedTime: new Date(requestedTime),
        expiresAt,
        status: 'PENDING'
      }
    });

    // Create notifications for each business (they will poll for these)
    const notificationPromises = businesses.map((business: any) =>
      prisma.notification.create({
        data: {
          userId: business.userId,
          type: 'quick_find',
          read: false,
          data: {
            requestId: bookingRequest.id,
            clientId: session.user.id,
            clientName: session.user.name,
            service: (business.category as any)?.nameEn || 'Service',
            price: `${(offeredPrice / 100).toFixed(2)} MAD`,
            time: requestedTime,
            description: description || null,
            categoryId,
            offeredPrice,
            distance: (business as any).distance || null,
            clientRating: user?.avgRating || 0,
            clientReviews: user?.totalRatings || 0,
            eventType: 'quick_find_request'
          }
        }
      })
    );

    // Create notifications for each business
    try {
      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }
    } catch (notifError) {
      console.error('[QuickFind Notification Error] Failed to create notification records:', notifError);
      // We continue since the request itself was created, but we log the error
    }

    return NextResponse.json({
      success: true,
      requestId: bookingRequest.id,
      remainingCredits: user.quickFindCredits - 1,
    });
  } catch (error) {
    console.error('[QuickFind Request Error]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
