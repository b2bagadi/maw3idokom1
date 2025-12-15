import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all plans
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { pricePerMonth: 'asc' },
        });
        return NextResponse.json(plans);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching plans' }, { status: 500 });
    }
}

// CREATE new plan
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, features, pricePerMonth, maxServices } = body;

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                features,
                pricePerMonth,
                maxServices
            }
        });

        return NextResponse.json(plan, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error creating plan' }, { status: 500 });
    }
}

// UPDATE plan
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, features, pricePerMonth, maxServices } = body;

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name,
                features,
                pricePerMonth,
                maxServices
            }
        });

        return NextResponse.json(plan);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating plan' }, { status: 500 });
    }
}

// DELETE plan
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        await prisma.subscriptionPlan.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Plan deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting plan' }, { status: 500 });
    }
}
