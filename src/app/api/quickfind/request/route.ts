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

    const { categoryId, offeredPrice, requestedTime, description } = await req.json();

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

    const businesses = await prisma.business.findMany({
      where: {
        categoryId,
      },
      include: {
        services: true,
        category: true,
      },
    });

    const requestId = `req_${Date.now()}_${session.user.id}`;
    const pusher = getPusherServer();

    for (const business of businesses) {
      await pusher.trigger(`user-${business.userId}`, 'new_request', {
        requestId,
        clientId: session.user.id,
        clientName: session.user.name,
        service: '',
        price: `${(offeredPrice / 100).toFixed(2)} MAD`,
        time: requestedTime,
        description,
        categoryId,
        offeredPrice,
      });
    }

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
