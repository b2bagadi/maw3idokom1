import { db } from '@/db';
import { tenants } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    const sampleTenants = [
        {
            name: 'Demo Business',
            slug: 'demo',
            nameEn: 'Demo Business',
            nameFr: 'Entreprise de Démonstration',
            nameAr: 'الأعمال التجريبية',
            aboutEn: 'Welcome to our demo booking system! This is a sample business to showcase our appointment booking features. Try booking an appointment to see how easy it is for your customers to schedule services with you.',
            aboutFr: 'Bienvenue dans notre système de réservation de démonstration! Il s\'agit d\'une entreprise exemple pour présenter nos fonctionnalités de réservation de rendez-vous. Essayez de réserver un rendez-vous pour voir à quel point il est facile pour vos clients de planifier des services avec vous.',
            aboutAr: 'مرحبًا بك في نظام الحجز التجريبي الخاص بنا! هذا عمل تجريبي لعرض ميزات حجز المواعيد لدينا. جرب حجز موعد لترى كم هو سهل لعملائك جدولة الخدمات معك.',
            email: 'demo@maw3idokom.com',
            passwordHash: passwordHash,
            ownerName: 'Demo Owner',
            phone: '+1-555-DEMO',
            address: '123 Demo Street, Demo City',
            businessType: 'Demo Services',
            logo: null,
            mapUrl: 'https://maps.google.com/?q=Demo+Business',
            whatsappUrl: 'https://wa.me/1555DEMO',
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
        },
        {
            name: 'Beautiful Hair Salon',
            slug: 'beautiful-hair-salon',
            nameEn: 'Beautiful Hair Salon',
            nameFr: 'Salon de Coiffure Beauté',
            nameAr: 'صالون الشعر الجميل',
            aboutEn: 'Beautiful Hair Salon offers premium hair care services including cutting, styling, coloring, and treatments. Our experienced stylists are dedicated to making you look and feel your best with personalized attention and the latest techniques.',
            aboutFr: 'Beautiful Hair Salon propose des services de soins capillaires haut de gamme, notamment coupe, coiffure, coloration et traitements. Nos stylistes expérimentés se consacrent à vous rendre belle et à vous sentir bien avec une attention personnalisée et les dernières techniques.',
            aboutAr: 'يقدم صالون الشعر الجميل خدمات عناية بالشعر متميزة بما في ذلك القص والتصفيف والصبغ والعلاجات. يكرس مصففو الشعر ذوو الخبرة لدينا جهودهم لجعلك تبدو وتشعر بأفضل حال مع الاهتمام الشخصي وأحدث التقنيات.',
            email: 'owner@beautifulhair.com',
            passwordHash: passwordHash,
            ownerName: 'Sarah Johnson',
            phone: '+1-555-0101',
            address: '123 Main Street, Downtown, City',
            businessType: 'Hair Salon',
            logo: null,
            mapUrl: 'https://maps.google.com/?q=123+Main+Street+Downtown',
            whatsappUrl: 'https://wa.me/15550101',
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Relaxation Spa Center',
            slug: 'relaxation-spa-center',
            nameEn: 'Relaxation Spa Center',
            nameFr: 'Centre de Spa Relaxation',
            nameAr: 'مركز سبا الاسترخاء',
            aboutEn: 'Relaxation Spa Center is your sanctuary for wellness and rejuvenation. We offer a full range of spa services including massages, facials, body treatments, and aromatherapy. Escape the stress of daily life and indulge in our tranquil environment designed for ultimate relaxation.',
            aboutFr: 'Relaxation Spa Center est votre sanctuaire pour le bien-être et la régénération. Nous proposons une gamme complète de services de spa, notamment des massages, des soins du visage, des soins corporels et de l\'aromathérapie. Échappez au stress de la vie quotidienne et laissez-vous tenter par notre environnement tranquille conçu pour une relaxation ultime.',
            aboutAr: 'مركز سبا الاسترخاء هو ملاذك للعافية والتجديد. نقدم مجموعة كاملة من خدمات السبا بما في ذلك التدليك وعلاجات الوجه وعلاجات الجسم والعلاج بالروائح. اهرب من ضغوط الحياة اليومية وانغمس في بيئتنا الهادئة المصممة للاسترخاء الكامل.',
            email: 'owner@relaxationspa.com',
            passwordHash: passwordHash,
            ownerName: 'Michael Chen',
            phone: '+1-555-0202',
            address: '456 Wellness Boulevard, Spa District, City',
            businessType: 'Spa & Wellness',
            logo: null,
            mapUrl: 'https://maps.google.com/?q=456+Wellness+Boulevard+Spa+District',
            whatsappUrl: 'https://wa.me/15550202',
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            name: 'Health & Wellness Clinic',
            slug: 'health-wellness-clinic',
            nameEn: 'Health & Wellness Clinic',
            nameFr: 'Clinique Santé et Bien-être',
            nameAr: 'عيادة الصحة والعافية',
            aboutEn: 'Health & Wellness Clinic provides comprehensive healthcare services focused on preventive care and holistic wellness. Our team of medical professionals offers consultations, health screenings, nutritional guidance, and personalized treatment plans to help you achieve optimal health and wellbeing.',
            aboutFr: 'Health & Wellness Clinic fournit des services de santé complets axés sur les soins préventifs et le bien-être holistique. Notre équipe de professionnels de la santé offre des consultations, des dépistages de santé, des conseils nutritionnels et des plans de traitement personnalisés pour vous aider à atteindre une santé et un bien-être optimaux.',
            aboutAr: 'توفر عيادة الصحة والعافية خدمات رعاية صحية شاملة تركز على الرعاية الوقائية والعافية الشاملة. يقدم فريقنا من المتخصصين الطبيين استشارات وفحوصات صحية وإرشادات غذائية وخطط علاج مخصصة لمساعدتك على تحقيق الصحة والعافية المثلى.',
            email: 'owner@healthclinic.com',
            passwordHash: passwordHash,
            ownerName: 'Emily Rodriguez',
            phone: '+1-555-0303',
            address: '789 Health Avenue, Medical Plaza, City',
            businessType: 'Healthcare Clinic',
            logo: null,
            mapUrl: 'https://maps.google.com/?q=789+Health+Avenue+Medical+Plaza',
            whatsappUrl: 'https://wa.me/15550303',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
    ];

    await db.insert(tenants).values(sampleTenants);

    console.log('✅ Tenants seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});