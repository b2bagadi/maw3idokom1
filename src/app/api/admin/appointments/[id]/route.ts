import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  id: number;
  username: string;
  role: 'SUPER_ADMIN';
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify JWT token and super admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication token required',
        code: 'AUTH_TOKEN_MISSING' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    // Verify super admin role
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Super admin access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Get appointment ID from URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID is provided and valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid appointment ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const appointmentId = parseInt(id);

    // Check if appointment exists
    const existingAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete appointment
    const deleted = await db.delete(appointments)
      .where(eq(appointments.id, appointmentId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete appointment',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE appointment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}