import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Hash the Super Admin password
    const hashedPassword = await bcrypt.hash('1201200', 10);

    // Create Super Admin user
    const superAdmin = await prisma.user.upsert({
        where: { username: 'Ayoubovic09' },
        update: {},
        create: {
            username: 'Ayoubovic09',
            email: 'admin@maw3idokom.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            name: 'Super Admin',
        },
    });

    console.log('✅ Created Super Admin:', superAdmin.username);

    // Create sample categories for demo
    const categories = [
        { icon: '✂️', name: 'Beauty', slug: 'beauty' },
        { icon: '⚕️', name: 'Health', slug: 'health' },
        { icon: '🔧', name: 'Auto', slug: 'auto' },
        { icon: '⚖️', name: 'Legal', slug: 'legal' },
        { icon: '🎓', name: 'Education', slug: 'education' },
        { icon: '🏋️', name: 'Fitness', slug: 'fitness' },
        { icon: '🎨', name: 'Art', slug: 'art' },
        { icon: '🏡', name: 'Home Services', slug: 'home-services' },
    ];

    // Create sample business owner
    const businessOwnerPassword = await bcrypt.hash('password123', 10);
    const businessOwner = await prisma.user.upsert({
        where: { username: 'demo_business' },
        update: {},
        create: {
            username: 'demo_business',
            email: 'business@demo.com',
            password: businessOwnerPassword,
            role: 'BUSINESS',
            name: 'Demo Business Owner',
        },
    });

    console.log('✅ Created demo business owner:', businessOwner.username);

    // Create sample business
    const business = await prisma.business.create({
        data: {
            ownerId: businessOwner.id,
            name: 'Luxury Beauty Salon',
            slug: 'luxury-beauty-salon',
            description: 'Premium beauty services in the heart of the city. Expert stylists and top-quality products.',
            category: 'beauty',
            address: '123 Main Street',
            city: 'Paris',
            country: 'France',
            coverImage: '/images/placeholder-business.jpg',
            verified: true,
            suspended: false,
        },
    });

    console.log('✅ Created sample business:', business.name);

    // Create sample services
    const services = await Promise.all([
        prisma.service.create({
            data: {
                businessId: business.id,
                name: 'Haircut & Styling',
                description: 'Professional haircut with styling consultation',
                price: 45.0,
                duration: 60,
            },
        }),
        prisma.service.create({
            data: {
                businessId: business.id,
                name: 'Hair Coloring',
                description: 'Full hair coloring with premium products',
                price: 85.0,
                duration: 120,
            },
        }),
        prisma.service.create({
            data: {
                businessId: business.id,
                name: 'Manicure & Pedicure',
                description: 'Complete nail care and styling',
                price: 35.0,
                duration: 45,
            },
        }),
    ]);

    console.log(`✅ Created ${services.length} sample services`);

    // Create sample staff
    const staff = await Promise.all([
        prisma.staff.create({
            data: {
                businessId: business.id,
                name: 'Sophie Martin',
                bio: 'Senior stylist with 10+ years of experience',
            },
        }),
        prisma.staff.create({
            data: {
                businessId: business.id,
                name: 'Marie Dubois',
                bio: 'Specialist in hair coloring and treatments',
            },
        }),
    ]);

    console.log(`✅ Created ${staff.length} staff members`);

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await prisma.user.upsert({
        where: { username: 'demo_customer' },
        update: {},
        create: {
            username: 'demo_customer',
            email: 'customer@demo.com',
            password: customerPassword,
            role: 'CUSTOMER',
            name: 'Demo Customer',
        },
    });

    console.log('✅ Created demo customer:', customer.username);

    // Create sample booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const booking = await prisma.booking.create({
        data: {
            customerId: customer.id,
            businessId: business.id,
            serviceId: services[0].id,
            staffId: staff[0].id,
            date: tomorrow,
            startTime: '14:00',
            endTime: '15:00',
            totalPrice: services[0].price,
            status: 'CONFIRMED',
        },
    });

    console.log('✅ Created sample booking');

    // Create sample review
    const review = await prisma.review.create({
        data: {
            customerId: customer.id,
            businessId: business.id,
            rating: 5,
            comment: 'Amazing service! Sophie is incredibly talented and the salon is beautiful.',
        },
    });

    console.log('✅ Created sample review');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Username: Ayoubovic09');
    console.log('  Password: 1201200');
    console.log('  Access: /admin');
    console.log('\nDemo Business:');
    console.log('  Username: demo_business');
    console.log('  Password: password123');
    console.log('  Access: /dashboard');
    console.log('\nDemo Customer:');
    console.log('  Username: demo_customer');
    console.log('  Password: customer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during seed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
