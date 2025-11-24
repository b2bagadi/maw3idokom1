import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  tenantId: number;
  role: string;
  email: string;
}

function verifyBusinessOwnerToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    if (decoded.role !== 'BUSINESS_OWNER') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyBusinessOwnerToken(request);
    
    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Authentication required. Valid business owner token needed.',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const results = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, tokenData.tenantId))
      .orderBy(asc(services.nameEn));

    return NextResponse.json({ services: results }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyBusinessOwnerToken(request);
    
    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Authentication required. Valid business owner token needed.',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if tenantId provided in body
    if ('tenantId' in body || 'tenant_id' in body) {
      return NextResponse.json({ 
        error: "Tenant ID cannot be provided in request body",
        code: "TENANT_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      nameEn, 
      nameFr, 
      nameAr, 
      duration, 
      price,
      descriptionEn,
      descriptionFr,
      descriptionAr
    } = body;

    // Validate required fields
    if (!nameEn || typeof nameEn !== 'string' || nameEn.trim() === '') {
      return NextResponse.json({ 
        error: "nameEn is required and must be a non-empty string",
        code: "MISSING_NAME_EN" 
      }, { status: 400 });
    }

    if (!nameFr || typeof nameFr !== 'string' || nameFr.trim() === '') {
      return NextResponse.json({ 
        error: "nameFr is required and must be a non-empty string",
        code: "MISSING_NAME_FR" 
      }, { status: 400 });
    }

    if (!nameAr || typeof nameAr !== 'string' || nameAr.trim() === '') {
      return NextResponse.json({ 
        error: "nameAr is required and must be a non-empty string",
        code: "MISSING_NAME_AR" 
      }, { status: 400 });
    }

    if (duration === undefined || duration === null) {
      return NextResponse.json({ 
        error: "duration is required",
        code: "MISSING_DURATION" 
      }, { status: 400 });
    }

    if (price === undefined || price === null) {
      return NextResponse.json({ 
        error: "price is required",
        code: "MISSING_PRICE" 
      }, { status: 400 });
    }

    // Validate duration > 0
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return NextResponse.json({ 
        error: "duration must be a positive number greater than 0",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    // Validate price >= 0
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ 
        error: "price must be a number greater than or equal to 0",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newService = await db.insert(services).values({
      tenantId: tokenData.tenantId,
      nameEn: nameEn.trim(),
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: descriptionEn ? descriptionEn.trim() : null,
      descriptionFr: descriptionFr ? descriptionFr.trim() : null,
      descriptionAr: descriptionAr ? descriptionAr.trim() : null,
      duration: durationNum,
      price: priceNum,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();

    return NextResponse.json({ 
      success: true, 
      service: newService[0] 
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}