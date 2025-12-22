import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as bcrypt from 'bcrypt';

// GET Client Profile
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, phone: true, avgRating: true, totalRatings: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching profile' }, { status: 500 });
    }
}

// UPDATE Client Profile
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, email, phone, password, newPassword } = body;

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Verify current password if changing sensitive info or validation strictly requires it
        // For this MVP, let's require password only if changing password, or always?
        // Good practice: Require password for email/password changes.
        // Let's implement basic update logic.

        let updateData: any = { name, phone, email };

        if (newPassword) {
            if (!password) {
                return NextResponse.json({ message: 'Current password required to set new password' }, { status: 400 });
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return NextResponse.json({ message: 'Incorrect current password' }, { status: 403 });
            }
            updateData.password = await bcrypt.hash(newPassword, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json({
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone
        });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
    }
}
