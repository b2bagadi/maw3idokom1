import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'BUSINESS') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { gallery } = await req.json();

        const business = await prisma.business.findFirst({ 
            where: { userId: session.user.id } 
        });

        if (!business) {
            return NextResponse.json({ message: 'Business not found' }, { status: 404 });
        }

        await prisma.businessImage.deleteMany({ 
            where: { businessId: business.id } 
        });

        if (Array.isArray(gallery) && gallery.length > 0) {
            await prisma.businessImage.createMany({
                data: gallery.map((img: any) => ({
                    url: img.url,
                    deleteUrl: img.deleteUrl || null,
                    businessId: business.id
                }))
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Gallery update error:', error);
        return NextResponse.json({ 
            message: 'Failed to update gallery', 
            error: error.message 
        }, { status: 500 });
    }
}
