import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerBusinessSchema } from '@/lib/validations';
import * as bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerBusinessSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: 'Validation failed', errors: result.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password, businessName, category, address, phone, lat, lng } = result.data;

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

        // Get category ID (mapping name to ID needed or just assuming ID passed)
        // For now assuming the frontend passes the Category ID. 
        // If name is passed, we'd need to find it:
        let categoryId = category;

        // Check if it's a name vs ID (simple check: valid cuid/uuid or lookup)
        // Actually, let's assume the frontend sends the Category ID from the dropdown 
        // But since the Seed created categories with names, we should look them up if not a CUID.
        // For simplicity/robustness, let's try to find category by name (En) if ID fails or just use it.

        // Better workflow: Frontend fetches categories and sends ID.
        // But we haven't built category fetch API yet. 
        // Let's create a default category fallback or fetch by name.

        const dbCategory = await prisma.category.findFirst({
            where: {
                OR: [
                    { id: category },
                    { nameEn: category },
                    { nameFr: category },
                    { nameAr: category },
                ]
            }
        });

        if (!dbCategory) {
            return NextResponse.json(
                { message: 'Invalid category' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Transaction to create User, Business, and Schedule
        const result_1 = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: businessName, // Use business name as user name initially
                    phone,
                    role: 'BUSINESS',
                    isActive: false, // Business requires approval
                },
            });

            // 2. Create Business Profile
            const business = await tx.business.create({
                data: {
                    userId: user.id,
                    name: businessName,
                    address,
                    phone,
                    categoryId: dbCategory.id,
                    lat: lat || 0,
                    lng: lng || 0,
                    // Default subscription logic could go here
                },
            });

            // 3. Create Default Schedule (Mon-Fri 9-5)
            const schedulePromises = [];
            for (let day = 0; day <= 6; day++) {
                const isWeekend = day === 5 || day === 6; // Fri/Sat or Sat/Sun depending on region. Let's assume Sat/Sun closed for default.
                schedulePromises.push(
                    tx.schedule.create({
                        data: {
                            businessId: business.id,
                            dayOfWeek: day,
                            openTime: '09:00',
                            closeTime: '17:00',
                            isClosed: day === 0 || day === 6, // 0=Sunday, 6=Saturday
                        },
                    })
                );
            }
            await Promise.all(schedulePromises);

            return { user, business };
        });

        return NextResponse.json(
            { message: 'Business registered successfully', userId: result_1.user.id },
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
