import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  tenantId: number;
  role: string;
  email: string;
}

export async function PUT(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }, { status: 401 });
    }

    // Check role is BUSINESS_OWNER
    if (decoded.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ 
        error: 'Access denied. Business owner role required',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, { status: 403 });
    }

    // Get ID from URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid appointment ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { rejectionReason } = body;

    // Validate required field
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
      return NextResponse.json({ 
        error: 'Rejection reason is required',
        code: 'MISSING_REJECTION_REASON'
      }, { status: 400 });
    }

    // Check if appointment exists and belongs to the tenant
    const existingAppointment = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, parseInt(id)),
          eq(appointments.tenantId, decoded.tenantId)
        )
      )
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found or access denied',
        code: 'APPOINTMENT_NOT_FOUND'
      }, { status: 404 });
    }

    // Update appointment to REJECTED status with reason
    const updated = await db.update(appointments)
      .set({
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(appointments.id, parseInt(id)),
          eq(appointments.tenantId, decoded.tenantId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update appointment',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      appointment: updated[0]
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/appointments/reject error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}