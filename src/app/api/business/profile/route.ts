import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  tenantId: number;
  role: string;
  email: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function verifyBusinessOwnerToken(request: NextRequest): Promise<{ tenantId: number } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization token is required',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    if (decoded.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ 
        error: 'Access denied. Business owner role required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    if (!decoded.tenantId) {
      return NextResponse.json({ 
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN_PAYLOAD' 
      }, { status: 401 });
    }

    return { tenantId: decoded.tenantId };
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED' 
    }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyBusinessOwnerToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { tenantId } = authResult;

    const tenant = await db.select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      nameEn: tenants.nameEn,
      nameFr: tenants.nameFr,
      nameAr: tenants.nameAr,
      aboutEn: tenants.aboutEn,
      aboutFr: tenants.aboutFr,
      aboutAr: tenants.aboutAr,
      email: tenants.email,
      ownerName: tenants.ownerName,
      phone: tenants.phone,
      address: tenants.address,
      businessType: tenants.businessType,
      logo: tenants.logo,
      mapUrl: tenants.mapUrl,
      whatsappUrl: tenants.whatsappUrl,
      galleryImages: tenants.galleryImages,
      latitude: tenants.latitude,
      longitude: tenants.longitude,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
    })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(tenant[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyBusinessOwnerToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { tenantId } = authResult;

    const body = await request.json();
    const {
      nameEn,
      nameFr,
      nameAr,
      logo,
      mapUrl,
      whatsappUrl,
      aboutEn,
      aboutFr,
      aboutAr,
      phone,
      businessType,
      address,
      latitude,
      longitude,
      galleryImages,
    } = body;

    const existingTenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const currentTenant = existingTenant[0];
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (nameEn !== undefined) {
      updates.nameEn = nameEn.trim();
      updates.name = nameEn.trim();
      
      if (nameEn.trim() !== currentTenant.nameEn) {
        updates.slug = generateSlug(nameEn);
      }
    }

    if (nameFr !== undefined) {
      updates.nameFr = nameFr.trim();
    }

    if (nameAr !== undefined) {
      updates.nameAr = nameAr.trim();
    }

    if (logo !== undefined) {
      updates.logo = logo;
    }

    if (mapUrl !== undefined) {
      updates.mapUrl = mapUrl;
    }

    if (whatsappUrl !== undefined) {
      updates.whatsappUrl = whatsappUrl;
    }

    if (aboutEn !== undefined) {
      updates.aboutEn = aboutEn;
    }

    if (aboutFr !== undefined) {
      updates.aboutFr = aboutFr;
    }

    if (aboutAr !== undefined) {
      updates.aboutAr = aboutAr;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (businessType !== undefined) {
      updates.businessType = businessType;
    }

    if (address !== undefined) {
      updates.address = address;
    }

    if (galleryImages !== undefined) {
      updates.galleryImages = galleryImages;
    }

    if (latitude !== undefined) {
      if (latitude !== null) {
        const lat = parseFloat(latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ 
            error: 'Latitude must be a number between -90 and 90',
            code: 'INVALID_LATITUDE' 
          }, { status: 400 });
        }
        updates.latitude = lat;
      } else {
        updates.latitude = null;
      }
    }

    if (longitude !== undefined) {
      if (longitude !== null) {
        const lng = parseFloat(longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({ 
            error: 'Longitude must be a number between -180 and 180',
            code: 'INVALID_LONGITUDE' 
          }, { status: 400 });
        }
        updates.longitude = lng;
      } else {
        updates.longitude = null;
      }
    }

    const updated = await db.update(tenants)
      .set(updates)
      .where(eq(tenants.id, tenantId))
      .returning({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        nameEn: tenants.nameEn,
        nameFr: tenants.nameFr,
        nameAr: tenants.nameAr,
        aboutEn: tenants.aboutEn,
        aboutFr: tenants.aboutFr,
        aboutAr: tenants.aboutAr,
        email: tenants.email,
        ownerName: tenants.ownerName,
        phone: tenants.phone,
        address: tenants.address,
        businessType: tenants.businessType,
        logo: tenants.logo,
        mapUrl: tenants.mapUrl,
        whatsappUrl: tenants.whatsappUrl,
        galleryImages: tenants.galleryImages,
        latitude: tenants.latitude,
        longitude: tenants.longitude,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      });

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update tenant',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tenant: updated[0],
    }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}