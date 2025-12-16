import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerClientSchema } from '@/lib/validations';
import * as bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerClientSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: 'Validation failed', errors: result.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password, name, phone } = result.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create client user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: 'CLIENT',
                isActive: true, // Clients are active by default
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json(
            { message: 'User registered successfully', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
