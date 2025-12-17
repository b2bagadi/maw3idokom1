import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Schedule
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const schedule = await prisma.schedule.findMany({
        where: { businessId: business.id },
        orderBy: { dayOfWeek: 'asc' },
    });
    return NextResponse.json(schedule);
}

// UPDATE Schedule (Batch)
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const body = await req.json(); // Array of schedule items

    // Transaction to update all
    await prisma.$transaction(
        body.map((item: any) =>
            prisma.schedule.update({
                where: { id: item.id }, // Assumes ID is present
                data: {
                    openTime: item.openTime,
                    closeTime: item.closeTime,
                    isClosed: item.isClosed,
                }
            })
        )
    );

    return NextResponse.json({ message: 'Schedule updated' });
}
