import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: number;
  email: string;
  role: string;
  tenantId: number;
}

export async function PUT(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Check role is BUSINESS_OWNER
    if (decoded.role !== 'BUSINESS_OWNER') {
      return NextResponse.json(
        { error: 'Business owner access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get and validate ID parameter
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid appointment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(id);

    // Query appointment with tenantId security check
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, decoded.tenantId)
        )
      )
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or not owned by this tenant', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update appointment status to CONFIRMED
    const updatedAppointment = await db
      .update(appointments)
      .set({
        status: 'CONFIRMED',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, decoded.tenantId)
        )
      )
      .returning();

    if (updatedAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update appointment', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        appointment: updatedAppointment[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/appointments/confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}