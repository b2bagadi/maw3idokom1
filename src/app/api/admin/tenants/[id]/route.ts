import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifySuperAdmin(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const tenantId = parseInt(id);

    const existingTenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      nameEn,
      nameFr,
      nameAr,
      aboutEn,
      aboutFr,
      aboutAr,
      email,
      password,
      ownerName,
      phone,
      businessType,
      logo,
      mapUrl,
      whatsappUrl,
      address,
      latitude,
      longitude
    } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (nameEn !== undefined) {
      updateData.nameEn = nameEn.trim();
      updateData.name = nameEn.trim();
      updateData.slug = generateSlug(nameEn);
    }

    if (nameFr !== undefined) {
      updateData.nameFr = nameFr.trim();
    }

    if (nameAr !== undefined) {
      updateData.nameAr = nameAr.trim();
    }

    if (aboutEn !== undefined) {
      updateData.aboutEn = aboutEn;
    }

    if (aboutFr !== undefined) {
      updateData.aboutFr = aboutFr;
    }

    if (aboutAr !== undefined) {
      updateData.aboutAr = aboutAr;
    }

    if (email !== undefined) {
      updateData.email = email.toLowerCase().trim();
    }

    if (password !== undefined && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.passwordHash = hashedPassword;
    }

    if (ownerName !== undefined) {
      updateData.ownerName = ownerName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (businessType !== undefined) {
      updateData.businessType = businessType;
    }

    if (logo !== undefined) {
      updateData.logo = logo;
    }

    if (mapUrl !== undefined) {
      updateData.mapUrl = mapUrl;
    }

    if (whatsappUrl !== undefined) {
      updateData.whatsappUrl = whatsappUrl;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (latitude !== undefined) {
      if (latitude !== null) {
        const lat = parseFloat(latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json(
            { error: 'Latitude must be a number between -90 and 90', code: 'INVALID_LATITUDE' },
            { status: 400 }
          );
        }
        updateData.latitude = lat;
      } else {
        updateData.latitude = null;
      }
    }

    if (longitude !== undefined) {
      if (longitude !== null) {
        const lng = parseFloat(longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json(
            { error: 'Longitude must be a number between -180 and 180', code: 'INVALID_LONGITUDE' },
            { status: 400 }
          );
        }
        updateData.longitude = lng;
      } else {
        updateData.longitude = null;
      }
    }

    const updatedTenant = await db.update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId))
      .returning();

    if (updatedTenant.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update tenant', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const { passwordHash, ...tenantWithoutPassword } = updatedTenant[0];

    return NextResponse.json(
      { success: true, tenant: tenantWithoutPassword },
      { status: 200 }
    );

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifySuperAdmin(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const tenantId = parseInt(id);

    const existingTenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(tenants)
      .where(eq(tenants.id, tenantId))
      .returning();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Tenant deleted successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}