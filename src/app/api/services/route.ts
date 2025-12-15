import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Services
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get business ID
    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const services = await prisma.service.findMany({ where: { businessId: business.id } });
    return NextResponse.json(services);
}

// CREATE Service
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const service = await prisma.service.create({
        data: {
            businessId: business.id,
            name: body.name,
            description: body.description,
            price: parseInt(body.price), // in cents
            duration: parseInt(body.duration), // in minutes
        }
    });

    return NextResponse.json(service, { status: 201 });
}

// DELETE Service
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
}
