import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staff, tenants, staffServices, services } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

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

export async function GET(request: NextRequest) {
  try {
    const superAdmin = await verifySuperAdmin(request);
    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Authentication required. Super admin access only.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = (page - 1) * limit;

    let conditions = [];

    if (tenantId) {
      conditions.push(eq(staff.tenantId, parseInt(tenantId)));
    }

    if (search) {
      conditions.push(
        or(
          like(staff.nameEn, `%${search}%`),
          like(staff.nameFr, `%${search}%`),
          like(staff.nameAr, `%${search}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [staffResults, totalResult] = await Promise.all([
      db
        .select({
          id: staff.id,
          userId: staff.userId,
          tenantId: staff.tenantId,
          nameEn: staff.nameEn,
          nameFr: staff.nameFr,
          nameAr: staff.nameAr,
          photoUrl: staff.photoUrl,
          role: staff.role,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
          tenantName: tenants.name,
          tenantSlug: tenants.slug,
        })
        .from(staff)
        .leftJoin(tenants, eq(staff.tenantId, tenants.id))
        .where(whereCondition)
        .orderBy(desc(staff.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(staff)
        .where(whereCondition)
    ]);

    const staffIds = staffResults.map(s => s.id);
    let staffServicesMap: Record<number, any[]> = {};

    if (staffIds.length > 0) {
      const staffServiceResults = await db
        .select({
          staffId: staffServices.staffId,
          serviceId: staffServices.serviceId,
          serviceName: services.nameEn,
        })
        .from(staffServices)
        .leftJoin(services, eq(staffServices.serviceId, services.id))
        .where(sql`${staffServices.staffId} IN ${staffIds}`);

      staffServiceResults.forEach(ss => {
        if (!staffServicesMap[ss.staffId]) {
          staffServicesMap[ss.staffId] = [];
        }
        staffServicesMap[ss.staffId].push({
          serviceId: ss.serviceId,
          serviceName: ss.serviceName,
        });
      });
    }

    const staffWithServices = staffResults.map(s => ({
      ...s,
      services: staffServicesMap[s.id] || [],
    }));

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      staff: staffWithServices,
      total,
      page,
      limit,
    });

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
        error: 'Authentication required. Super admin access only.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, nameEn, nameFr, nameAr, role, photoUrl, serviceIds } = body;

    if (!tenantId || !nameEn || !nameFr || !nameAr || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: tenantId, nameEn, nameFr, nameAr, role',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    const tenantExists = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)))
      .limit(1);

    if (tenantExists.length === 0) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = new Date().toISOString();

    const newStaff = await db
      .insert(staff)
      .values({
        userId: null,
        tenantId: parseInt(tenantId),
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        photoUrl: photoUrl || null,
        role: role.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const createdStaff = newStaff[0];

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const serviceRecords = serviceIds.map(serviceId => ({
        staffId: createdStaff.id,
        serviceId: parseInt(serviceId),
        createdAt: now,
      }));

      await db.insert(staffServices).values(serviceRecords);
    }

    const staffWithServices = {
      ...createdStaff,
      services: serviceIds || [],
    };

    return NextResponse.json({
      success: true,
      staff: staffWithServices,
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}