import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, tenants, services, staff, users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  id: number;
  username: string;
  role: 'SUPER_ADMIN';
}

// Verify super admin JWT token
async function verifySuperAdmin(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded.id;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const superAdminId = await verifySuperAdmin(request);
    if (!superAdminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const tenantIdParam = searchParams.get('tenantId');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where conditions
    const conditions = [];

    if (tenantIdParam) {
      const tenantId = parseInt(tenantIdParam);
      if (!isNaN(tenantId)) {
        conditions.push(eq(appointments.tenantId, tenantId));
      }
    }

    if (statusParam) {
      conditions.push(eq(appointments.status, statusParam));
    }

    if (search) {
      conditions.push(
        or(
          like(appointments.guestName, `%${search}%`),
          like(appointments.guestEmail, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(whereClause);
    
    const total = countResult[0]?.count || 0;

    // Get appointments with joins
    const appointmentsQuery = db
      .select({
        id: appointments.id,
        tenantId: appointments.tenantId,
        serviceId: appointments.serviceId,
        staffId: appointments.staffId,
        customerId: appointments.customerId,
        guestName: appointments.guestName,
        guestEmail: appointments.guestEmail,
        guestPhone: appointments.guestPhone,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        rejectionReason: appointments.rejectionReason,
        customerLanguage: appointments.customerLanguage,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantEmail: tenants.email,
        serviceNameEn: services.nameEn,
        serviceNameFr: services.nameFr,
        serviceNameAr: services.nameAr,
        serviceDuration: services.duration,
        servicePrice: services.price,
        staffNameEn: staff.nameEn,
        staffNameFr: staff.nameFr,
        staffNameAr: staff.nameAr,
        staffPhotoUrl: staff.photoUrl,
        customerEmail: users.email,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerPhone: users.phone,
      })
      .from(appointments)
      .leftJoin(tenants, eq(appointments.tenantId, tenants.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(staff, eq(appointments.staffId, staff.id))
      .leftJoin(users, eq(appointments.customerId, users.id))
      .where(whereClause)
      .orderBy(desc(appointments.startTime))
      .limit(limit)
      .offset(offset);

    const results = await appointmentsQuery;

    // Format the results
    const formattedAppointments = results.map(row => ({
      id: row.id,
      tenantId: row.tenantId,
      serviceId: row.serviceId,
      staffId: row.staffId,
      customerId: row.customerId,
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      rejectionReason: row.rejectionReason,
      customerLanguage: row.customerLanguage,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tenant: {
        name: row.tenantName,
        slug: row.tenantSlug,
        email: row.tenantEmail,
      },
      service: {
        nameEn: row.serviceNameEn,
        nameFr: row.serviceNameFr,
        nameAr: row.serviceNameAr,
        duration: row.serviceDuration,
        price: row.servicePrice,
      },
      staff: row.staffId ? {
        nameEn: row.staffNameEn,
        nameFr: row.staffNameFr,
        nameAr: row.staffNameAr,
        photoUrl: row.staffPhotoUrl,
      } : null,
      customer: row.customerId ? {
        email: row.customerEmail,
        firstName: row.customerFirstName,
        lastName: row.customerLastName,
        phone: row.customerPhone,
      } : null,
    }));

    return NextResponse.json({
      appointments: formattedAppointments,
      total,
      page,
      limit,
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin authentication
    const superAdminId = await verifySuperAdmin(request);
    if (!superAdminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(id);

    // Check if appointment exists
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the appointment
    const deleted = await db
      .delete(appointments)
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({
      message: 'Appointment deleted successfully',
      appointment: deleted[0],
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}