import { db } from '@/db';
import { superAdmins } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('Ayoub1201200', 10);
    
    const sampleSuperAdmin = {
        username: 'M@w3id',
        passwordHash: hashedPassword,
        email: 'admin@system.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await db.insert(superAdmins).values(sampleSuperAdmin);
    
    console.log('✅ Super admin seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});