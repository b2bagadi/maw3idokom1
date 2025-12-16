import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse, addMinutes, isBefore, isAfter, isEqual, format } from 'date-fns';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const dateStr = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!businessId || !dateStr || !serviceId) {
        return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    try {
        const referenceDate = new Date(dateStr);
        const dayOfWeek = referenceDate.getDay();

        // 1. Get Schedule
        const schedule = await prisma.schedule.findFirst({
            where: { businessId, dayOfWeek },
        });

        if (!schedule || schedule.isClosed || !schedule.openTime || !schedule.closeTime) {
            return NextResponse.json([]);
        }

        // 2. Get Service Duration
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        const duration = service.duration; // minutes

        // 3. Get Existing Bookings
        const startOfDay = new Date(referenceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(referenceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await prisma.booking.findMany({
            where: {
                businessId,
                date: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' },
            },
            include: { service: true },
        });

        // 4. Get Blocks
        const blocks = await prisma.emergencyBlock.findMany({
            where: {
                businessId,
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay },
            }
        });

        // 5. Generate Slots
        // Parse times using a dummy date
        const openTime = parse(schedule.openTime, 'HH:mm', referenceDate);
        const closeTime = parse(schedule.closeTime, 'HH:mm', referenceDate);

        const slots: string[] = [];
        let currentTime = openTime;

        while (isBefore(currentTime, closeTime)) {
            const slotEnd = addMinutes(currentTime, duration);

            if (isAfter(slotEnd, closeTime)) break;

            // Check overlaps
            let isOverlapping = false;

            // Check Bookings
            for (const booking of bookings) {
                const bStart = parse(booking.time, 'HH:mm', referenceDate);
                const bEnd = addMinutes(bStart, booking.service.duration);

                // Check intersection: (StartA < EndB) and (EndA > StartB)
                if (isBefore(currentTime, bEnd) && isAfter(slotEnd, bStart)) {
                    isOverlapping = true;
                    break;
                }
            }

            // Check Blocks
            if (!isOverlapping) {
                for (const block of blocks) {
                    // Block times are precise dates
                    // Slot times are relative to referenceDate
                    // Need to construct full Date objects for slot comp
                    // currentTime is already a Date on referenceDate
                    if (isBefore(currentTime, block.endDate) && isAfter(slotEnd, block.startDate)) {
                        isOverlapping = true;
                        break;
                    }
                }
            }

            if (!isOverlapping) {
                slots.push(format(currentTime, 'HH:mm'));
            }

            currentTime = addMinutes(currentTime, 30); // Interval step
        }

        return NextResponse.json(slots);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
