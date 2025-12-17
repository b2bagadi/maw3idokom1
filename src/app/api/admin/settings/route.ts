import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all settings
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.globalSettings.findMany();
        // Convert array to object for easier consumption on frontend if needed, 
        // but array is fine for editing list. 
        // Let's return the simplified key-value pairs? No, admin needs full objects to edit translations.
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
    }
}

// UPDATE or CREATE setting
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { key, valueEn, valueFr, valueAr } = body;

        const setting = await prisma.globalSettings.upsert({
            where: { key },
            update: { valueEn, valueFr, valueAr },
            create: { key, valueEn, valueFr, valueAr },
        });

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating setting' }, { status: 500 });
    }
}
