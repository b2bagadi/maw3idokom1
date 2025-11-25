import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { globalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: number;
  username: string;
  role: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Authentication token required' };
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return { valid: false, error: 'Server configuration error' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return { valid: false, error: 'Super admin access required' };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    console.error('Token verification error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await verifySuperAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error, code: 'AUTHENTICATION_FAILED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { logoUrl, siteName, heroTextEn, heroTextFr, heroTextAr } = body;

    // Validate at least one field is provided
    if (!logoUrl && !siteName && !heroTextEn && !heroTextFr && !heroTextAr) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update', code: 'NO_FIELDS_PROVIDED' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, string> = {
      updatedAt: new Date().toISOString()
    };

    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (siteName !== undefined) updateData.siteName = siteName;
    if (heroTextEn !== undefined) updateData.heroTextEn = heroTextEn;
    if (heroTextFr !== undefined) updateData.heroTextFr = heroTextFr;
    if (heroTextAr !== undefined) updateData.heroTextAr = heroTextAr;

    // Check if settings record exists (id = 1)
    const existingSettings = await db.select()
      .from(globalSettings)
      .where(eq(globalSettings.id, 1))
      .limit(1);

    let result;

    if (existingSettings.length === 0) {
      // Create new settings record with id = 1
      const createData = {
        id: 1,
        logoUrl: logoUrl || null,
        siteName: siteName || null,
        heroTextEn: heroTextEn || null,
        heroTextFr: heroTextFr || null,
        heroTextAr: heroTextAr || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = await db.insert(globalSettings)
        .values(createData)
        .returning();

      result = created[0];
    } else {
      // Update existing settings
      const updated = await db.update(globalSettings)
        .set(updateData)
        .where(eq(globalSettings.id, 1))
        .returning();

      result = updated[0];
    }

    return NextResponse.json({
      success: true,
      settings: result
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/global-settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}