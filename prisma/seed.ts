import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash('Saha1201200', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'M@w3id' },
        update: {},
        create: {
            email: 'M@w3id',
            password: hashedAdminPassword,
            role: 'ADMIN',
            name: 'Admin',
            isActive: true,
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Categories
    const categories = [
        { nameEn: 'Beauty & Spa', nameFr: 'Beauté & Spa', nameAr: 'الجمال والمنتجع', emoji: '💅' },
        { nameEn: 'Hair Salon', nameFr: 'Salon de Coiffure', nameAr: 'صالون الحلاقة', emoji: '💇' },
        { nameEn: 'Medical', nameFr: 'Médical', nameAr: 'طبي', emoji: '🏥' },
        { nameEn: 'Fitness', nameFr: 'Fitness', nameAr: 'اللياقة البدنية', emoji: '💪' },
        { nameEn: 'Automotive', nameFr: 'Automobile', nameAr: 'سيارات', emoji: '🚗' },
        { nameEn: 'Home Services', nameFr: 'Services à Domicile', nameAr: 'خدمات منزلية', emoji: '🏠' },
        { nameEn: 'Restaurant', nameFr: 'Restaurant', nameAr: 'مطعم', emoji: '🍽️' },
        { nameEn: 'Education', nameFr: 'Éducation', nameAr: 'تعليم', emoji: '📚' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { nameEn: cat.nameEn },
            update: {},
            create: cat,
        });
    }
    console.log('✅ Categories created');

    // Create Subscription Plans
    const plans = [
        {
            name: 'Basic',
            features: ['Up to 5 services', 'Email support', 'Basic analytics'].join(','),
            pricePerMonth: 2900, // $29.00
            maxServices: 5,
        },
        {
            name: 'Pro',
            features: ['Up to 20 services', 'Priority support', 'Advanced analytics', 'Custom branding'].join(','),
            pricePerMonth: 5900, // $59.00
            maxServices: 20,
        },
        {
            name: 'Premium',
            features: ['Unlimited services', '24/7 support', 'Full analytics', 'API access', 'Custom integrations'].join(','),
            pricePerMonth: 9900, // $99.00
            maxServices: 1000,
        },
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { name: plan.name },
            update: {},
            create: plan,
        });
    }
    console.log('✅ Subscription plans created');

    // Create Global Settings
    const settings = [
        {
            key: 'logo_url',
            valueEn: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200',
            valueFr: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200',
            valueAr: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200',
        },
        {
            key: 'hero_image',
            valueEn: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920',
            valueFr: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920',
            valueAr: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920',
        },
        {
            key: 'hero_title',
            valueEn: 'Book Your Appointment Today',
            valueFr: 'Réservez Votre Rendez-vous Aujourd\'hui',
            valueAr: 'احجز موعدك اليوم',
        },
        {
            key: 'hero_subtitle',
            valueEn: 'Find and book local services in seconds',
            valueFr: 'Trouvez et réservez des services locaux en quelques secondes',
            valueAr: 'ابحث واحجز الخدمات المحلية في ثوانٍ',
        },
        {
            key: 'contact_email',
            valueEn: 'contact@maw3idokom.com',
            valueFr: 'contact@maw3idokom.com',
            valueAr: 'contact@maw3idokom.com',
        },
        {
            key: 'contact_phone',
            valueEn: '+1 234 567 8900',
            valueFr: '+1 234 567 8900',
            valueAr: '+1 234 567 8900',
        },
        {
            key: 'facebook_url',
            valueEn: 'https://facebook.com',
            valueFr: 'https://facebook.com',
            valueAr: 'https://facebook.com',
        },
        {
            key: 'instagram_url',
            valueEn: 'https://instagram.com',
            valueFr: 'https://instagram.com',
            valueAr: 'https://instagram.com',
        },
        {
            key: 'twitter_url',
            valueEn: 'https://twitter.com',
            valueFr: 'https://twitter.com',
            valueAr: 'https://twitter.com',
        },
    ];

    for (const setting of settings) {
        await prisma.globalSettings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }
    console.log('✅ Global settings created');

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
