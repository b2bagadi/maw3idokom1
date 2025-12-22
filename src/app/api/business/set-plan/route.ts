import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { businessId, planId } = body;

        if (!businessId || !planId) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Verify business exists and doesn't have a plan (or update it)
        // Since this is a public endpoint used after registration (before login/activation),
        // we should validte it carefully. For now, we trust the flow.
        
        await prisma.business.update({
            where: { userId: businessId }, // businessId passed here is actually userId from the registration response
            data: { subscriptionPlanId: planId }
        });

        return NextResponse.json({ message: 'Plan updated' });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating plan' }, { status: 500 });
    }
}
