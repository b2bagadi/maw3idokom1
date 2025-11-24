import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { globalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: number;
  role: string;
}

function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no auth required for reading settings
    const settings = await db.select()
      .from(globalSettings)
      .where(eq(globalSettings.id, 1))
      .limit(1);

    // If no settings exist, return defaults
    if (settings.length === 0) {
      return NextResponse.json({
        id: 1,
        logoUrl: null,
        siteName: 'Maw3id',
        heroTextEn: 'Welcome To Maw3id',
        heroTextFr: 'Bienvenue À Maw3id',
        heroTextAr: 'مرحباً بك في موعد'
      }, { status: 200 });
    }

    return NextResponse.json(settings[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication for updates
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Verify super admin role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden: Super admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { logoUrl, siteName } = body;

    // Validate that at least one field is provided
    if (logoUrl === undefined && siteName === undefined) {
      return NextResponse.json({ 
        error: 'At least one field (logoUrl or siteName) must be provided for update',
        code: 'EMPTY_UPDATE' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: {
      logoUrl?: string | null;
      siteName?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString()
    };

    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl;
    }
    if (siteName !== undefined) {
      updateData.siteName = siteName;
    }

    // Check if settings record exists
    const existingSettings = await db.select()
      .from(globalSettings)
      .where(eq(globalSettings.id, 1))
      .limit(1);

    // If record doesn't exist, create it
    if (existingSettings.length === 0) {
      const newSettings = await db.insert(globalSettings)
        .values({
          id: 1,
          logoUrl: logoUrl ?? null,
          siteName: siteName ?? 'Maw3id',
          heroTextEn: 'Welcome To Maw3id',
          heroTextFr: 'Bienvenue À Maw3id',
          heroTextAr: 'مرحباً بك في موعد',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();

      return NextResponse.json(newSettings[0], { status: 200 });
    }

    // Update existing record
    const updated = await db.update(globalSettings)
      .set(updateData)
      .where(eq(globalSettings.id, 1))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}