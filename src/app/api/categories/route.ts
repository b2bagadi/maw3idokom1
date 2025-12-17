import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET Categories
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');

    try {
        let where: any = {};
        if (featured === 'true') where.isFeatured = true;
        if (active === 'true') where.isActive = true;
        
        const categories = await prisma.category.findMany({
            where,
            orderBy: { nameEn: 'asc' },
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 });
    }
}

// POST Category (Admin only)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const category = await prisma.category.create({ data: body });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error creating category' }, { status: 500 });
    }
}

// PUT Category (Admin only) - Update isFeatured or isActive
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updates } = body;
        const category = await prisma.category.update({
            where: { id },
            data: updates,
        });
        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating category' }, { status: 500 });
    }
}