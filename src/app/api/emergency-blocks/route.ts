import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Blocks
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const blocks = await prisma.emergencyBlock.findMany({
        where: { businessId: business.id },
        orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(blocks);
}

// CREATE Block
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const block = await prisma.emergencyBlock.create({
        data: {
            businessId: business.id,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            reason: body.reason,
        }
    });

    return NextResponse.json(block, { status: 201 });
}

// DELETE Block
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await prisma.emergencyBlock.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
}
