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

    try {
        const business = await prisma.business.findFirst({ 
            where: { userId: session.user.id } 
        });
        if (!business) {
            return NextResponse.json({ message: 'Business not found' }, { status: 404 });
        }

        const service = await prisma.service.findUnique({ 
            where: { id },
            select: { businessId: true }
        });

        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        if (service.businessId !== business.id) {
            return NextResponse.json({ message: 'Unauthorized to delete this service' }, { status: 403 });
        }

        /*
        const bookingsWithService = await prisma.booking.count({
            where: { 
                serviceId: id,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });

        if (bookingsWithService > 0) {
            return NextResponse.json({ 
                message: 'Cannot delete service with active bookings. Please complete or cancel them first.' 
            }, { status: 400 });
        }
        */

        // Update all related bookings to remove service reference
        await prisma.booking.updateMany({
            where: { serviceId: id },
            data: { serviceId: null }
        });

        await prisma.service.delete({ where: { id } });
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        console.error('Delete service error:', error);
        return NextResponse.json({ 
            message: error.message || 'Failed to delete service' 
        }, { status: 500 });
    }
}
