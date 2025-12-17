import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as bcrypt from 'bcrypt';

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email, password } = body;

        const data: any = {};
        if (email) data.email = email;
        if (password) {
            data.password = await bcrypt.hash(password, 12);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
    }
}
