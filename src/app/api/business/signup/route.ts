import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generate unique slug from name
async function generateUniqueSlug(name: string): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nameEn,
      nameFr,
      nameAr,
      ownerName,
      email,
      phone,
      businessType,
      password,
      aboutEn,
      aboutFr,
      aboutAr,
      mapUrl,
      whatsappUrl,
      logo,
      address,
      latitude,
      longitude
    } = body;

    // Validate required fields
    if (!nameEn) {
      return NextResponse.json({
        error: 'English name is required',
        code: 'MISSING_NAME_EN'
      }, { status: 400 });
    }

    if (!nameFr) {
      return NextResponse.json({
        error: 'French name is required',
        code: 'MISSING_NAME_FR'
      }, { status: 400 });
    }

    if (!nameAr) {
      return NextResponse.json({
        error: 'Arabic name is required',
        code: 'MISSING_NAME_AR'
      }, { status: 400 });
    }

    if (!ownerName) {
      return NextResponse.json({
        error: 'Owner name is required',
        code: 'MISSING_OWNER_NAME'
      }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({
        error: 'Phone is required',
        code: 'MISSING_PHONE'
      }, { status: 400 });
    }

    if (!businessType) {
      return NextResponse.json({
        error: 'Business type is required',
        code: 'MISSING_BUSINESS_TYPE'
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      }, { status: 400 });
    }

    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 });
    }

    // Check email uniqueness
    const existingTenant = await db.select()
      .from(tenants)
      .where(eq(tenants.email, trimmedEmail))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json({
        error: 'Email already registered',
        code: 'DUPLICATE_EMAIL'
      }, { status: 400 });
    }

    // Validate latitude and longitude if provided
    if (latitude !== undefined && latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({
          error: 'Latitude must be a number between -90 and 90',
          code: 'INVALID_LATITUDE'
        }, { status: 400 });
      }
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({
          error: 'Longitude must be a number between -180 and 180',
          code: 'INVALID_LONGITUDE'
        }, { status: 400 });
      }
    }

    // Generate unique slug from nameEn
    const slug = await generateUniqueSlug(nameEn);

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare tenant data
    const now = new Date().toISOString();
    const tenantData = {
      name: nameEn.trim(), // Backward compatibility
      slug,
      nameEn: nameEn.trim(),
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      aboutEn: aboutEn?.trim() || null,
      aboutFr: aboutFr?.trim() || null,
      aboutAr: aboutAr?.trim() || null,
      email: trimmedEmail,
      passwordHash,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address?.trim() || null,
      businessType: businessType.trim(),
      logo: logo?.trim() || null,
      mapUrl: mapUrl?.trim() || null,
      whatsappUrl: whatsappUrl?.trim() || null,
      latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
      createdAt: now,
      updatedAt: now
    };

    // Create tenant record
    const newTenant = await db.insert(tenants)
      .values(tenantData)
      .returning();

    if (newTenant.length === 0) {
      return NextResponse.json({
        error: 'Failed to create tenant',
        code: 'CREATION_FAILED'
      }, { status: 500 });
    }

    const createdTenant = newTenant[0];

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({
        error: 'Server configuration error',
        code: 'JWT_SECRET_MISSING'
      }, { status: 500 });
    }

    const tokenPayload = {
      id: createdTenant.id,
      email: createdTenant.email,
      role: 'BUSINESS_OWNER',
      tenantId: createdTenant.id
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '30d'
    });

    // Prepare response (exclude passwordHash)
    const { passwordHash: _, ...tenantResponse } = createdTenant;

    return NextResponse.json({
      success: true,
      tenant: tenantResponse,
      token
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}