import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Business Profile
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const business = await prisma.business.findFirst({
            where: { userId: session.user.id },
            include: {
                category: true,
                subscriptionPlan: true,
                gallery: true, // Include gallery images
            }
        });

        if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 });

        return NextResponse.json(business);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching profile' }, { status: 500 });
    }
}

// UPDATE Business Profile
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, address, phone, lat, lng, logoUrl, logoDeleteUrl, heroUrl, heroDeleteUrl, categoryId } = body;

        const business = await prisma.business.findFirst({ 
            where: { userId: session.user.id } 
        });

        if (!business) {
            return NextResponse.json({ message: 'Business not found' }, { status: 404 });
        }

        await prisma.business.update({
            where: { id: business.id },
            data: {
                name,
                description,
                address,
                phone,
                lat,
                lng,
                logoUrl,
                logoDeleteUrl,
                heroUrl,
                heroDeleteUrl,
                categoryId,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ 
            message: 'Error updating profile', 
            error: error.message 
        }, { status: 500 });
    }
}