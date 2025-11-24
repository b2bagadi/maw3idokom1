import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staff, staffServices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  tenantId: number;
}

function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.role !== 'BUSINESS_OWNER') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
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
      .where(and(eq(staff.id, staffId), eq(staff.tenantId, user.tenantId)))
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff not found', code: 'STAFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nameEn, nameFr, nameAr, photoUrl, role, isActive, serviceIds } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameFr !== undefined) updateData.nameFr = nameFr;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (serviceIds !== undefined && Array.isArray(serviceIds)) {
      await db.delete(staffServices).where(eq(staffServices.staffId, staffId));

      if (serviceIds.length > 0) {
        const staffServiceRecords = serviceIds.map((serviceId) => ({
          staffId,
          serviceId: parseInt(serviceId),
          createdAt: new Date().toISOString(),
        }));

        await db.insert(staffServices).values(staffServiceRecords);
      }
    }

    const updated = await db
      .update(staff)
      .set(updateData)
      .where(and(eq(staff.id, staffId), eq(staff.tenantId, user.tenantId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update staff', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: updated[0],
    });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
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
      .where(and(eq(staff.id, staffId), eq(staff.tenantId, user.tenantId)))
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff not found', code: 'STAFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(staffServices).where(eq(staffServices.staffId, staffId));

    const deleted = await db
      .delete(staff)
      .where(and(eq(staff.id, staffId), eq(staff.tenantId, user.tenantId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete staff', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}