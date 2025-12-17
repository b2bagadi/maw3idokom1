import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { pricePerMonth: 'asc' },
        });
        return NextResponse.json(plans);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching plans' }, { status: 500 });
    }
}
