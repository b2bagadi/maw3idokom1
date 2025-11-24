import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staff, staffServices, services } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  tenantId: number;
  role: string;
  email: string;
}

function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return null;
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
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Authentication required. Valid business owner token needed.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = tokenPayload.tenantId;

    // Get all staff for this tenant
    const staffMembers = await db.select().from(staff)
      .where(eq(staff.tenantId, tenantId))
      .orderBy(staff.nameEn);

    // Get all staff service assignments for this tenant's staff
    const staffIds = staffMembers.map(s => s.id);
    
    let staffServiceAssignments: any[] = [];
    let serviceDetails: any[] = [];

    if (staffIds.length > 0) {
      staffServiceAssignments = await db.select()
        .from(staffServices)
        .where(inArray(staffServices.staffId, staffIds));

      const serviceIds = [...new Set(staffServiceAssignments.map(ss => ss.serviceId))];
      
      if (serviceIds.length > 0) {
        serviceDetails = await db.select()
          .from(services)
          .where(inArray(services.id, serviceIds));
      }
    }

    // Build the response with service assignments
    const staffWithServices = staffMembers.map(staffMember => {
      const assignedServiceIds = staffServiceAssignments
        .filter(ss => ss.staffId === staffMember.id)
        .map(ss => ss.serviceId);

      const assignedServices = serviceDetails
        .filter(service => assignedServiceIds.includes(service.id))
        .map(service => ({
          id: service.id,
          nameEn: service.nameEn,
          nameFr: service.nameFr,
          nameAr: service.nameAr,
          duration: service.duration,
          price: service.price
        }));

      return {
        ...staffMember,
        services: assignedServices
      };
    });

    return NextResponse.json({ 
      staff: staffWithServices 
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Authentication required. Valid business owner token needed.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = tokenPayload.tenantId;
    const body = await request.json();

    const { nameEn, nameFr, nameAr, role, photoUrl, serviceIds } = body;

    // Validate required fields
    if (!nameEn || !nameEn.trim()) {
      return NextResponse.json({ 
        error: 'Name (English) is required',
        code: 'MISSING_NAME_EN' 
      }, { status: 400 });
    }

    if (!nameFr || !nameFr.trim()) {
      return NextResponse.json({ 
        error: 'Name (French) is required',
        code: 'MISSING_NAME_FR' 
      }, { status: 400 });
    }

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ 
        error: 'Name (Arabic) is required',
        code: 'MISSING_NAME_AR' 
      }, { status: 400 });
    }

    if (!role || !role.trim()) {
      return NextResponse.json({ 
        error: 'Role is required',
        code: 'MISSING_ROLE' 
      }, { status: 400 });
    }

    // Validate serviceIds if provided
    if (serviceIds !== undefined && !Array.isArray(serviceIds)) {
      return NextResponse.json({ 
        error: 'Service IDs must be an array',
        code: 'INVALID_SERVICE_IDS' 
      }, { status: 400 });
    }

    // If serviceIds provided, validate they exist and belong to the tenant
    if (serviceIds && serviceIds.length > 0) {
      const validServices = await db.select()
        .from(services)
        .where(and(
          inArray(services.id, serviceIds),
          eq(services.tenantId, tenantId)
        ));

      if (validServices.length !== serviceIds.length) {
        return NextResponse.json({ 
          error: 'One or more service IDs are invalid or do not belong to your business',
          code: 'INVALID_SERVICE_IDS' 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // Create staff record
    const newStaff = await db.insert(staff)
      .values({
        userId: null,
        tenantId: tenantId,
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        photoUrl: photoUrl?.trim() || null,
        role: role.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const createdStaff = newStaff[0];

    // Create staff service assignments if serviceIds provided
    if (serviceIds && serviceIds.length > 0) {
      const staffServiceRecords = serviceIds.map((serviceId: number) => ({
        staffId: createdStaff.id,
        serviceId: serviceId,
        createdAt: now
      }));

      await db.insert(staffServices)
        .values(staffServiceRecords);

      // Fetch the assigned services for response
      const assignedServices = await db.select()
        .from(services)
        .where(inArray(services.id, serviceIds));

      return NextResponse.json({ 
        success: true,
        staff: {
          ...createdStaff,
          services: assignedServices.map(service => ({
            id: service.id,
            nameEn: service.nameEn,
            nameFr: service.nameFr,
            nameAr: service.nameAr,
            duration: service.duration,
            price: service.price
          }))
        }
      }, { status: 201 });
    }

    return NextResponse.json({ 
      success: true,
      staff: {
        ...createdStaff,
        services: []
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}