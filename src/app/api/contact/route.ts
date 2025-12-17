import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, message } = body || {};

        if (!name || !email || !message) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        await prisma.contactSubmission.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phone: phone ? String(phone).trim() : null,
                message: message.trim(),
            }
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: 'Error saving message' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const messages = await prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(messages);
    } catch {
        return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        await prisma.contactSubmission.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: 'Error deleting message' }, { status: 500 });
    }
}
