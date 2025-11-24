import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, tenants, superAdmins } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Middleware to verify super admin JWT token
async function verifySuperAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    const superAdmin = await db.select()
      .from(superAdmins)
      .where(eq(superAdmins.id, decoded.id))
      .limit(1);

    if (superAdmin.length === 0) {
      return null;
    }

    return superAdmin[0];
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const superAdmin = await verifySuperAdmin(request);
    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Super admin authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = (page - 1) * limit;

    let conditions = [];
    
    if (tenantId) {
      const parsedTenantId = parseInt(tenantId);
      if (isNaN(parsedTenantId)) {
        return NextResponse.json({ 
          error: 'Invalid tenantId',
          code: 'INVALID_TENANT_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(services.tenantId, parsedTenantId));
    }

    if (search) {
      const searchCondition = or(
        like(services.nameEn, `%${search}%`),
        like(services.nameFr, `%${search}%`),
        like(services.nameAr, `%${search}%`),
        like(services.descriptionEn, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = whereCondition 
      ? db.select({ count: sql<number>`count(*)` }).from(services).where(whereCondition)
      : db.select({ count: sql<number>`count(*)` }).from(services);
    
    const countResult = await countQuery;
    const total = Number(countResult[0].count);

    // Get services with tenant info using join
    let query = db.select({
      id: services.id,
      tenantId: services.tenantId,
      nameEn: services.nameEn,
      nameFr: services.nameFr,
      nameAr: services.nameAr,
      descriptionEn: services.descriptionEn,
      descriptionFr: services.descriptionFr,
      descriptionAr: services.descriptionAr,
      duration: services.duration,
      price: services.price,
      isActive: services.isActive,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
    })
    .from(services)
    .leftJoin(tenants, eq(services.tenantId, tenants.id))
    .orderBy(desc(services.createdAt));

    if (whereCondition) {
      query = query.where(whereCondition) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json({
      services: results,
      total,
      page,
      limit
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const superAdmin = await verifySuperAdmin(request);
    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Super admin authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      tenantId, 
      nameEn, 
      nameFr, 
      nameAr, 
      descriptionEn, 
      descriptionFr, 
      descriptionAr,
      duration, 
      price 
    } = body;

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'tenantId is required',
        code: 'MISSING_TENANT_ID' 
      }, { status: 400 });
    }

    if (!nameEn || typeof nameEn !== 'string' || nameEn.trim() === '') {
      return NextResponse.json({ 
        error: 'nameEn is required and must be a non-empty string',
        code: 'MISSING_NAME_EN' 
      }, { status: 400 });
    }

    if (!nameFr || typeof nameFr !== 'string' || nameFr.trim() === '') {
      return NextResponse.json({ 
        error: 'nameFr is required and must be a non-empty string',
        code: 'MISSING_NAME_FR' 
      }, { status: 400 });
    }

    if (!nameAr || typeof nameAr !== 'string' || nameAr.trim() === '') {
      return NextResponse.json({ 
        error: 'nameAr is required and must be a non-empty string',
        code: 'MISSING_NAME_AR' 
      }, { status: 400 });
    }

    if (duration === undefined || duration === null) {
      return NextResponse.json({ 
        error: 'duration is required',
        code: 'MISSING_DURATION' 
      }, { status: 400 });
    }

    if (price === undefined || price === null) {
      return NextResponse.json({ 
        error: 'price is required',
        code: 'MISSING_PRICE' 
      }, { status: 400 });
    }

    // Validate data types
    const parsedTenantId = parseInt(tenantId);
    if (isNaN(parsedTenantId)) {
      return NextResponse.json({ 
        error: 'tenantId must be a valid integer',
        code: 'INVALID_TENANT_ID_TYPE' 
      }, { status: 400 });
    }

    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration)) {
      return NextResponse.json({ 
        error: 'duration must be a valid integer',
        code: 'INVALID_DURATION_TYPE' 
      }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return NextResponse.json({ 
        error: 'price must be a valid number',
        code: 'INVALID_PRICE_TYPE' 
      }, { status: 400 });
    }

    // Validate business rules
    if (parsedDuration <= 0) {
      return NextResponse.json({ 
        error: 'duration must be greater than 0',
        code: 'INVALID_DURATION_VALUE' 
      }, { status: 400 });
    }

    if (parsedPrice < 0) {
      return NextResponse.json({ 
        error: 'price must be greater than or equal to 0',
        code: 'INVALID_PRICE_VALUE' 
      }, { status: 400 });
    }

    // Validate tenantId exists
    const tenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, parsedTenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      tenantId: parsedTenantId,
      nameEn: nameEn.trim(),
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: descriptionEn ? descriptionEn.trim() : null,
      descriptionFr: descriptionFr ? descriptionFr.trim() : null,
      descriptionAr: descriptionAr ? descriptionAr.trim() : null,
      duration: parsedDuration,
      price: parsedPrice,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Insert service
    const newService = await db.insert(services)
      .values(insertData)
      .returning();

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