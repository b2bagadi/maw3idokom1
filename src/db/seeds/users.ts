import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const currentTimestamp = new Date().toISOString();
    
    const sampleUsers = [
        {
            email: 'owner@beautifulhair.com',
            password: hashedPassword,
            firstName: 'Sarah',
            lastName: 'Johnson',
            phone: '+1234567890',
            role: 'OWNER',
            tenantId: 1,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'owner@relaxationspa.com',
            password: hashedPassword,
            firstName: 'Michael',
            lastName: 'Chen',
            phone: '+1234567891',
            role: 'OWNER',
            tenantId: 2,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'owner@healthclinic.com',
            password: hashedPassword,
            firstName: 'Emily',
            lastName: 'Rodriguez',
            phone: '+1234567892',
            role: 'OWNER',
            tenantId: 3,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});