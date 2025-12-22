import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
    try {
        console.log('Exporting data from SQLite...');

        const data = {
            users: await prisma.user.findMany(),
            businesses: await prisma.business.findMany(),
            categories: await prisma.category.findMany(),
            services: await prisma.service.findMany(),
            bookings: await prisma.booking.findMany(),
            // reviews: await prisma.review.findMany(),
            staff: await prisma.staff.findMany(),
            schedules: await prisma.schedule.findMany(),
            emergencyBlocks: await prisma.emergencyBlock.findMany(),
            messages: await prisma.message.findMany(),
            globalSettings: await prisma.globalSettings.findMany(),
            contactSubmissions: await prisma.contactSubmission.findMany(),
            businessImages: await prisma.businessImage.findMany(),
            subscriptionPlans: await prisma.subscriptionPlan.findMany()
        };

        const counts = Object.entries(data).map(([key, value]) => `${key}: ${value.length}`).join(', ');
        console.log(`Exported: ${counts}`);

        fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
        console.log('Data exported to data-export.json');
    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
