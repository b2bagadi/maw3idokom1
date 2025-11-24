import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appointments, tenants, services, staff, superAdmins } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  superAdminId: number;
  username: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ superAdminId: number; username: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Verify super admin exists
    const superAdmin = await db.select()
      .from(superAdmins)
      .where(eq(superAdmins.id, decoded.superAdminId))
      .limit(1);

    if (superAdmin.length === 0) {
      return null;
    }

    return { superAdminId: decoded.superAdminId, username: decoded.username };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const superAdmin = await verifySuperAdmin(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Super admin authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid customer ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const customerId = parseInt(id);

    // Check if customer exists and is a CUSTOMER role
    const customer = await db.select()
      .from(users)
      .where(and(
        eq(users.id, customerId),
        eq(users.role, 'CUSTOMER')
      ))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query appointments with joins to get full booking details
    const bookings = await db.select({
      id: appointments.id,
      tenantId: appointments.tenantId,
      tenantName: tenants.name,
      tenantNameEn: tenants.nameEn,
      tenantNameFr: tenants.nameFr,
      tenantNameAr: tenants.nameAr,
      serviceId: appointments.serviceId,
      serviceNameEn: services.nameEn,
      serviceNameFr: services.nameFr,
      serviceNameAr: services.nameAr,
      serviceDuration: services.duration,
      servicePrice: services.price,
      staffId: appointments.staffId,
      staffNameEn: staff.nameEn,
      staffNameFr: staff.nameFr,
      staffNameAr: staff.nameAr,
      staffPhotoUrl: staff.photoUrl,
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
    })
      .from(appointments)
      .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(staff, eq(appointments.staffId, staff.id))
      .where(eq(appointments.customerId, customerId))
      .orderBy(desc(appointments.startTime));

    return NextResponse.json({ bookings });
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
    const superAdmin = await verifySuperAdmin(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Super admin authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid customer ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const customerId = parseInt(id);

    // Check if customer exists and is a CUSTOMER role
    const customer = await db.select()
      .from(users)
      .where(and(
        eq(users.id, customerId),
        eq(users.role, 'CUSTOMER')
      ))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found or not a customer role', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Set customerId to null in appointments before deleting customer
    await db.update(appointments)
      .set({ 
        customerId: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.customerId, customerId));

    // Delete the customer
    const deleted = await db.delete(users)
      .where(eq(users.id, customerId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete customer', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      deletedCustomer: {
        id: deleted[0].id,
        email: deleted[0].email,
        firstName: deleted[0].firstName,
        lastName: deleted[0].lastName,
        role: deleted[0].role
      }
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}