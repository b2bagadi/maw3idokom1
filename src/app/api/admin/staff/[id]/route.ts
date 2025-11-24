import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staff, staffServices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  id: number;
  username: string;
  role: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<JWTPayload | null> {
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

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const staffId = parseInt(id);

    const existingStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff not found', code: 'STAFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nameEn, nameFr, nameAr, photoUrl, role, isActive, serviceIds } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (nameEn !== undefined) updates.nameEn = nameEn;
    if (nameFr !== undefined) updates.nameFr = nameFr;
    if (nameAr !== undefined) updates.nameAr = nameAr;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    if (serviceIds !== undefined) {
      if (!Array.isArray(serviceIds)) {
        return NextResponse.json(
          { error: 'serviceIds must be an array', code: 'INVALID_SERVICE_IDS' },
          { status: 400 }
        );
      }

      await db.delete(staffServices).where(eq(staffServices.staffId, staffId));

      if (serviceIds.length > 0) {
        const serviceRecords = serviceIds.map((serviceId) => ({
          staffId: staffId,
          serviceId: serviceId,
          createdAt: new Date().toISOString()
        }));

        await db.insert(staffServices).values(serviceRecords);
      }
    }

    const updatedStaff = await db
      .update(staff)
      .set(updates)
      .where(eq(staff.id, staffId))
      .returning();

    if (updatedStaff.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update staff', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: updatedStaff[0]
    });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const staffId = parseInt(id);

    const existingStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff not found', code: 'STAFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(staffServices).where(eq(staffServices.staffId, staffId));

    const deletedStaff = await db
      .delete(staff)
      .where(eq(staff.id, staffId))
      .returning();

    if (deletedStaff.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete staff', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}