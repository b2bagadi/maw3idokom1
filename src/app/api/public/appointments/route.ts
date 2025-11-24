import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, services, tenants } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      businessSlug,
      serviceId,
      staffId,
      startTime,
      guestName,
      guestEmail,
      guestPhone,
      notes,
      customerLanguage
    } = body;

    // Validate required fields
    if (!businessSlug || !serviceId || !startTime || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Find tenant by slug
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, businessSlug))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({
        error: 'Business not found',
        code: 'BUSINESS_NOT_FOUND'
      }, { status: 404 });
    }

    const tenantId = tenant[0].id;

    // Find service and validate it belongs to this tenant
    const service = await db
      .select()
      .from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.tenantId, tenantId)
      ))
      .limit(1);

    if (service.length === 0) {
      return NextResponse.json({
        error: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      }, { status: 404 });
    }

    // Calculate end time based on service duration
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + service[0].duration * 60000);

    // Check for conflicting appointments
    const conflicts = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.tenantId, tenantId),
        staffId ? eq(appointments.staffId, staffId) : undefined,
        and(
          lte(appointments.startTime, endDate.toISOString()),
          gte(appointments.endTime, startDate.toISOString())
        )
      ));

    if (conflicts.length > 0) {
      return NextResponse.json({
        error: 'Time slot not available',
        code: 'TIME_SLOT_UNAVAILABLE'
      }, { status: 409 });
    }

    // Create appointment
    const now = new Date().toISOString();
    const result = await db
      .insert(appointments)
      .values({
        tenantId,
        serviceId,
        staffId: staffId || null,
        customerId: null,
        guestName,
        guestEmail,
        guestPhone,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        status: 'PENDING',
        customerLanguage: customerLanguage || 'en',
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      appointment: result[0],
      message: 'Appointment booked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST appointment error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
