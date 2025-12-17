import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Staff
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const staff = await prisma.staff.findMany({ where: { businessId: business.id } });
    return NextResponse.json(staff);
}

// CREATE Staff
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const staff = await prisma.staff.create({
        data: {
            businessId: business.id,
            name: body.name,
            role: body.role,
            avatarUrl: body.avatarUrl,
            avatarDeleteUrl: body.avatarDeleteUrl,
        }
    });

    return NextResponse.json(staff, { status: 201 });
}

// DELETE Staff
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await prisma.staff.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
}