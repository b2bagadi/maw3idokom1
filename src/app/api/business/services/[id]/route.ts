import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  tenantId: number;
  role: string;
  email: string;
}

async function verifyBusinessOwnerToken(request: NextRequest): Promise<{ tenantId: number } | null> {
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

    return { tenantId: decoded.tenantId };
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyBusinessOwnerToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Business owner token is invalid or missing.' },
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

    const serviceId = parseInt(id);

    const existingService = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, auth.tenantId)))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      nameEn,
      nameFr,
      nameAr,
      descriptionEn,
      descriptionFr,
      descriptionAr,
      duration,
      price,
      isActive,
    } = body;

    if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
      return NextResponse.json(
        { error: 'Duration must be a positive number', code: 'INVALID_DURATION' },
        { status: 400 }
      );
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (nameEn !== undefined) updates.nameEn = nameEn.trim();
    if (nameFr !== undefined) updates.nameFr = nameFr.trim();
    if (nameAr !== undefined) updates.nameAr = nameAr.trim();
    if (descriptionEn !== undefined) updates.descriptionEn = descriptionEn.trim();
    if (descriptionFr !== undefined) updates.descriptionFr = descriptionFr.trim();
    if (descriptionAr !== undefined) updates.descriptionAr = descriptionAr.trim();
    if (duration !== undefined) updates.duration = duration;
    if (price !== undefined) updates.price = price;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedService = await db
      .update(services)
      .set(updates)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, auth.tenantId)))
      .returning();

    if (updatedService.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service: updatedService[0],
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
    const auth = await verifyBusinessOwnerToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Business owner token is invalid or missing.' },
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

    const serviceId = parseInt(id);

    const existingService = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, auth.tenantId)))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    const deletedService = await db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, auth.tenantId)))
      .returning();

    if (deletedService.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}