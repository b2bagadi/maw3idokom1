import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appointments } from '@/db/schema';
import { eq, like, and, or, sql, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

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
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const superAdmin = await verifySuperAdmin(request);
    
    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query with role filter
    let whereConditions = [eq(users.role, 'CUSTOMER')];

    // Add search conditions if search parameter provided
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push(
        or(
          like(users.email, searchPattern),
          like(users.firstName, searchPattern),
          like(users.lastName, searchPattern)
        )!
      );
    }

    const whereClause = whereConditions.length > 1 
      ? and(...whereConditions)
      : whereConditions[0];

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    
    const total = totalCountResult[0]?.count ?? 0;

    // Get customers with appointment counts
    const customersQuery = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        bookingCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${appointments}
          WHERE ${appointments.customerId} = ${users.id}
        )`.as('booking_count')
      })
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt);

    const customers = await customersQuery;

    // Format response
    return NextResponse.json({
      customers: customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        role: customer.role,
        tenantId: customer.tenantId,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        bookingCount: customer.bookingCount || 0
      })),
      total,
      page,
      limit
    }, { status: 200 });

  } catch (error) {
    console.error('GET customers error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}