import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/notifications/poll
 * Poll for new notifications for the authenticated user
 * Returns unread notifications created since the last poll
 */
export async function GET(req: NextRequest) {
    let session;
    try {
        session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const since = searchParams.get('since'); // ISO timestamp of last poll

        // Health check: Can we even reach the DB?
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (dbError: any) {
            console.error('[Database Connection Error]', dbError);
            return NextResponse.json(
                { error: 'Database connection failed', details: dbError.message },
                { status: 500 }
            );
        }

        // Security check: Ensure the notification model exists in the generated client
        if (!(prisma as any).notification) {
            console.error('[Prisma Error] Notification model is missing from generated client. Please run npx prisma generate.');
            return NextResponse.json(
                { error: 'System configuration error: Notification model missing.' },
                { status: 500 }
            );
        }

        // Get unread notifications for this user
        const notifications = await (prisma as any).notification.findMany({
            where: {
                userId,
                read: false,
                ...(since && {
                    createdAt: {
                        gt: new Date(since)
                    }
                })
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to 50 notifications per poll
        });

        return NextResponse.json({
            notifications,
            count: notifications.length,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Notification Poll Error]', {
            message: error.message,
            userId: session?.user?.id
        });
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications/poll
 * Mark notifications as read
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationIds } = await req.json();

        if (!Array.isArray(notificationIds)) {
            return NextResponse.json(
                { error: 'notificationIds must be an array' },
                { status: 400 }
            );
        }

        // Mark as read
        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: session.user.id // Security: only mark own notifications
            },
            data: {
                read: true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Mark notifications read error:', error);
        return NextResponse.json(
            { error: 'Failed to update notifications' },
            { status: 500 }
        );
    }
}
