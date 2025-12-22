import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  try {
    const dataPath = path.join(process.cwd(), 'data-export.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log('Starting data import...');

    // Import Users and build ID mapping
    console.log('Importing users...');
    const userIdMap: Record<string, string> = {};

    for (const user of data.users) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        userIdMap[user.id] = existing.id;
        await prisma.user.update({
          where: { email: user.email },
          data: { ...user, id: existing.id },
        });
      } else {
        const created = await prisma.user.create({
          data: user,
        });
        userIdMap[user.id] = created.id;
      }
    }
    console.log(`✓ Imported ${data.users.length} users`);

    // Import Categories
    console.log('Importing categories...');
    for (const category of data.categories) {
      const existing = await prisma.category.findFirst({
        where: { nameEn: category.nameEn },
      });

      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: category,
        });
      } else {
        await prisma.category.create({
          data: category,
        });
      }
    }
    console.log(`✓ Imported ${data.categories.length} categories`);

    // Import Subscription Plans
    console.log('Importing subscription plans...');
    for (const plan of data.subscriptionPlans) {
      const existing = await prisma.subscriptionPlan.findFirst({
        where: { name: plan.name },
      });

      if (existing) {
        await prisma.subscriptionPlan.update({
          where: { id: existing.id },
          data: plan,
        });
      } else {
        await prisma.subscriptionPlan.create({
          data: plan,
        });
      }
    }
    console.log(`✓ Imported ${data.subscriptionPlans.length} subscription plans`);

    // Import Businesses (with user ID mapping)
    console.log('Importing businesses...');
    for (const business of data.businesses) {
      const mappedUserId = userIdMap[business.userId] || business.userId;
      await prisma.business.upsert({
        where: { id: business.id },
        update: { ...business, userId: mappedUserId },
        create: { ...business, userId: mappedUserId },
      });
    }
    console.log(`✓ Imported ${data.businesses.length} businesses`);

    // Import Services
    console.log('Importing services...');
    for (const service of data.services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
    }
    console.log(`✓ Imported ${data.services.length} services`);

    // Import Staff
    console.log('Importing staff...');
    for (const staff of data.staff) {
      await prisma.staff.upsert({
        where: { id: staff.id },
        update: staff,
        create: staff,
      });
    }
    console.log(`✓ Imported ${data.staff.length} staff`);

    // Import Schedules
    console.log('Importing schedules...');
    for (const schedule of data.schedules) {
      await prisma.schedule.upsert({
        where: { id: schedule.id },
        update: schedule,
        create: schedule,
      });
    }
    console.log(`✓ Imported ${data.schedules.length} schedules`);

    // Import Bookings (with user ID mapping)
    console.log('Importing bookings...');
    for (const booking of data.bookings) {
      const mappedClientId = userIdMap[booking.clientId] || booking.clientId;
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: { ...booking, clientId: mappedClientId },
        create: { ...booking, clientId: mappedClientId },
      });
    }
    console.log(`✓ Imported ${data.bookings.length} bookings`);

    /*
    // Import Reviews (with user ID mapping)
    console.log('Importing reviews...');
    for (const review of data.reviews) {
      const mappedClientId = userIdMap[review.clientId] || review.clientId;
      await prisma.review.upsert({
        where: { id: review.id },
        update: { ...review, clientId: mappedClientId },
        create: { ...review, clientId: mappedClientId },
      });
    }
    console.log(`✓ Imported ${data.reviews.length} reviews`);
    */

    // Import Messages (skip if sender doesn't exist)
    console.log('Importing messages...');
    let messageCount = 0;
    for (const message of data.messages) {
      const mappedSenderId = userIdMap[message.senderId];
      if (mappedSenderId) {
        try {
          await prisma.message.upsert({
            where: { id: message.id },
            update: { ...message, senderId: mappedSenderId },
            create: { ...message, senderId: mappedSenderId },
          });
          messageCount++;
        } catch (e) {
          console.log(`Skipping message ${message.id} due to foreign key constraint`);
        }
      }
    }
    console.log(`✓ Imported ${messageCount} messages`);

    // Import Business Images
    console.log('Importing business images...');
    for (const image of data.businessImages) {
      await prisma.businessImage.upsert({
        where: { id: image.id },
        update: image,
        create: image,
      });
    }
    console.log(`✓ Imported ${data.businessImages.length} business images`);

    // Import Global Settings
    console.log('Importing global settings...');
    for (const setting of data.globalSettings) {
      try {
        await prisma.globalSettings.upsert({
          where: { id: setting.id },
          update: setting,
          create: setting,
        });
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`Updating existing setting: ${setting.key}`);
          const existing = await prisma.globalSettings.findFirst({
            where: { key: setting.key },
          });
          if (existing) {
            await prisma.globalSettings.update({
              where: { id: existing.id },
              data: setting,
            });
          }
        }
      }
    }
    console.log(`✓ Imported ${data.globalSettings.length} global settings`);

    console.log('\n✅ Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();