import { db } from '@/db';
import { staff } from '@/db/schema';

async function main() {
    const sampleStaff = [
        // Tenant 1: Beautiful Hair Salon - Stylists
        {
            userId: null,
            tenantId: 1,
            nameEn: 'Sarah Martinez',
            nameFr: 'Sarah Martinez',
            nameAr: 'سارة مارتينيز',
            photoUrl: null,
            role: 'Senior Stylist',
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            userId: null,
            tenantId: 1,
            nameEn: 'Michael Chen',
            nameFr: 'Michel Chen',
            nameAr: 'مايكل تشن',
            photoUrl: null,
            role: 'Hair Colorist',
            isActive: true,
            createdAt: new Date('2024-01-12').toISOString(),
            updatedAt: new Date('2024-01-12').toISOString(),
        },
        {
            userId: null,
            tenantId: 1,
            nameEn: 'Emma Thompson',
            nameFr: 'Emma Thompson',
            nameAr: 'إيما تومسون',
            photoUrl: null,
            role: 'Junior Stylist',
            isActive: true,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        // Tenant 2: Relaxation Spa - Massage Therapists
        {
            userId: null,
            tenantId: 2,
            nameEn: 'Amira Hassan',
            nameFr: 'Amira Hassan',
            nameAr: 'أميرة حسان',
            photoUrl: null,
            role: 'Senior Massage Therapist',
            isActive: true,
            createdAt: new Date('2024-01-08').toISOString(),
            updatedAt: new Date('2024-01-08').toISOString(),
        },
        {
            userId: null,
            tenantId: 2,
            nameEn: 'Lucas Dubois',
            nameFr: 'Lucas Dubois',
            nameAr: 'لوكاس دوبوا',
            photoUrl: null,
            role: 'Aromatherapy Specialist',
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            userId: null,
            tenantId: 2,
            nameEn: 'Sofia Rodriguez',
            nameFr: 'Sophie Rodriguez',
            nameAr: 'صوفيا رودريغيز',
            photoUrl: null,
            role: 'Receptionist',
            isActive: true,
            createdAt: new Date('2024-01-14').toISOString(),
            updatedAt: new Date('2024-01-14').toISOString(),
        },
        // Tenant 3: Health Clinic - Medical Staff
        {
            userId: null,
            tenantId: 3,
            nameEn: 'Dr. James Wilson',
            nameFr: 'Dr. Jacques Wilson',
            nameAr: 'د. جيمس ويلسون',
            photoUrl: null,
            role: 'General Practitioner',
            isActive: true,
            createdAt: new Date('2024-01-05').toISOString(),
            updatedAt: new Date('2024-01-05').toISOString(),
        },
        {
            userId: null,
            tenantId: 3,
            nameEn: 'Nurse Fatima Al-Mansoori',
            nameFr: 'Infirmière Fatima Al-Mansoori',
            nameAr: 'الممرضة فاطمة المنصوري',
            photoUrl: null,
            role: 'Registered Nurse',
            isActive: true,
            createdAt: new Date('2024-01-07').toISOString(),
            updatedAt: new Date('2024-01-07').toISOString(),
        },
    ];

    await db.insert(staff).values(sampleStaff);
    
    console.log('✅ Staff seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});