import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userId, credits } = await req.json();

        if (!userId || typeof credits !== 'number') {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { quickFindCredits: credits },
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating credits' }, { status: 500 });
    }
}
