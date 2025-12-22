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
        const { userId } = await req.json();

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });

        return NextResponse.json({ message: 'User status updated', user: updatedUser });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
    }
}
