import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { i18nStrings } from '@/db/schema';
import { eq, like, and, or, asc, desc, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Super Admin Authentication Helper
async function verifySuperAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: number; username: string; role: string };
    
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
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ 
        error: 'Super admin authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = (page - 1) * limit;

    // Build the query conditions
    let whereConditions: any[] = [];

    // Filter by category if provided
    if (category) {
      whereConditions.push(eq(i18nStrings.category, category));
    }

    // Search across key and text fields
    if (search) {
      const searchCondition = or(
        like(i18nStrings.key, `%${search}%`),
        like(i18nStrings.textEn, `%${search}%`),
        like(i18nStrings.textFr, `%${search}%`),
        like(i18nStrings.textAr, `%${search}%`)
      );
      whereConditions.push(searchCondition);
    }

    // Build the query
    let query = db.select().from(i18nStrings);

    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(i18nStrings);
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }
    const countResult = await countQuery;
    const total = countResult[0]?.count ?? 0;

    // Execute query with ordering and pagination
    const strings = await query
      .orderBy(asc(i18nStrings.category), asc(i18nStrings.key))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      strings,
      total,
      page,
      limit
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
    // Verify super admin authentication
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ 
        error: 'Super admin authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { key, textEn, textFr, textAr, category } = body;

    // Validate required fields
    if (!key) {
      return NextResponse.json({ 
        error: 'Key is required',
        code: 'MISSING_KEY' 
      }, { status: 400 });
    }

    if (!textEn) {
      return NextResponse.json({ 
        error: 'English text is required',
        code: 'MISSING_TEXT_EN' 
      }, { status: 400 });
    }

    if (!textFr) {
      return NextResponse.json({ 
        error: 'French text is required',
        code: 'MISSING_TEXT_FR' 
      }, { status: 400 });
    }

    if (!textAr) {
      return NextResponse.json({ 
        error: 'Arabic text is required',
        code: 'MISSING_TEXT_AR' 
      }, { status: 400 });
    }

    // Trim whitespace from key
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      return NextResponse.json({ 
        error: 'Key cannot be empty',
        code: 'EMPTY_KEY' 
      }, { status: 400 });
    }

    // Check if key already exists
    const existingString = await db.select()
      .from(i18nStrings)
      .where(eq(i18nStrings.key, trimmedKey))
      .limit(1);

    if (existingString.length > 0) {
      return NextResponse.json({ 
        error: 'Translation key already exists',
        code: 'DUPLICATE_KEY' 
      }, { status: 400 });
    }

    // Insert new translation string
    const now = new Date().toISOString();
    const newString = await db.insert(i18nStrings)
      .values({
        key: trimmedKey,
        textEn: textEn.trim(),
        textFr: textFr.trim(),
        textAr: textAr.trim(),
        category: category ? category.trim() : null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json({
      success: true,
      string: newString[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}