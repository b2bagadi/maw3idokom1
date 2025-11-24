import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq, like, or, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT verification middleware
async function verifySuperAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 };
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return { error: 'Server configuration error', status: 500 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { role: string };
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return { error: 'Access denied. Super admin privileges required', status: 403 };
    }

    return { success: true };
  } catch (error) {
    console.error('Token verification error:', error);
    return { error: 'Invalid or expired token', status: 401 };
  }
}

// Generate unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// GET Handler - List tenants with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await verifySuperAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = (page - 1) * limit;

    // Build query with filters
    let whereConditions = [];

    // Search across multiple fields
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          like(tenants.nameEn, searchTerm),
          like(tenants.nameFr, searchTerm),
          like(tenants.nameAr, searchTerm),
          like(tenants.email, searchTerm),
          like(tenants.ownerName, searchTerm)
        )
      );
    }

    // Status filter (if needed for future extension)
    if (status) {
      // Currently no status field, but keeping for future use
    }

    // Execute query with pagination
    let query = db.select().from(tenants);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(tenants);
    
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }

    const countResult = await countQuery;
    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      tenants: results,
      total,
      page,
      limit
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST Handler - Create new tenant/business
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await verifySuperAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      nameEn,
      nameFr,
      nameAr,
      email,
      ownerName,
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
    if (!nameEn || !nameEn.trim()) {
      return NextResponse.json(
        { error: 'English name is required', code: 'MISSING_NAME_EN' },
        { status: 400 }
      );
    }

    if (!nameFr || !nameFr.trim()) {
      return NextResponse.json(
        { error: 'French name is required', code: 'MISSING_NAME_FR' },
        { status: 400 }
      );
    }

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json(
        { error: 'Arabic name is required', code: 'MISSING_NAME_AR' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (!ownerName || !ownerName.trim()) {
      return NextResponse.json(
        { error: 'Owner name is required', code: 'MISSING_OWNER_NAME' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone is required', code: 'MISSING_PHONE' },
        { status: 400 }
      );
    }

    if (!businessType || !businessType.trim()) {
      return NextResponse.json(
        { error: 'Business type is required', code: 'MISSING_BUSINESS_TYPE' },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    // Validate latitude and longitude if provided
    if (latitude !== undefined && latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json(
          { 
            error: 'Latitude must be a number between -90 and 90', 
            code: 'INVALID_LATITUDE'
          },
          { status: 400 }
        );
      }
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json(
          { 
            error: 'Longitude must be a number between -180 and 180', 
            code: 'INVALID_LONGITUDE'
          },
          { status: 400 }
        );
      }
    }

    // Generate unique slug from English name
    const slug = generateSlug(nameEn);

    // Check slug uniqueness
    const existingSlug = await db.select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        { 
          error: 'A business with a similar name already exists', 
          code: 'DUPLICATE_SLUG',
          suggestion: 'Please use a different English name'
        },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingEmail = await db.select()
      .from(tenants)
      .where(eq(tenants.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare tenant data
    const now = new Date().toISOString();
    const tenantData = {
      name: nameEn.trim(), // For backward compatibility
      slug,
      nameEn: nameEn.trim(),
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      aboutEn: aboutEn?.trim() || null,
      aboutFr: aboutFr?.trim() || null,
      aboutAr: aboutAr?.trim() || null,
      email: email.toLowerCase().trim(),
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

    // Insert tenant
    const newTenant = await db.insert(tenants)
      .values(tenantData)
      .returning();

    if (newTenant.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create tenant', code: 'INSERT_FAILED' },
        { status: 500 }
      );
    }

    // Remove password hash from response
    const { passwordHash: _, ...tenantResponse } = newTenant[0];

    return NextResponse.json(
      {
        success: true,
        tenant: tenantResponse
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}