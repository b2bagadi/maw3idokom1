import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { i18nStrings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  id: number;
  username: string;
  role: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ authorized: boolean; user?: JWTPayload }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.role !== 'SUPER_ADMIN') {
      return { authorized: false };
    }

    return { authorized: true, user: decoded };
  } catch (error) {
    return { authorized: false };
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get ID from URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { key, textEn, textFr, textAr, category } = body;

    // Check if translation exists
    const existingTranslation = await db
      .select()
      .from(i18nStrings)
      .where(eq(i18nStrings.id, parseInt(id)))
      .limit(1);

    if (existingTranslation.length === 0) {
      return NextResponse.json(
        { error: 'Translation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // If key is being changed, check uniqueness
    if (key && key !== existingTranslation[0].key) {
      const keyExists = await db
        .select()
        .from(i18nStrings)
        .where(eq(i18nStrings.key, key))
        .limit(1);

      if (keyExists.length > 0) {
        return NextResponse.json(
          { error: 'Translation key already exists', code: 'DUPLICATE_KEY' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (key !== undefined) updates.key = key;
    if (textEn !== undefined) updates.textEn = textEn;
    if (textFr !== undefined) updates.textFr = textFr;
    if (textAr !== undefined) updates.textAr = textAr;
    if (category !== undefined) updates.category = category;

    // Update translation
    const updated = await db
      .update(i18nStrings)
      .set(updates)
      .where(eq(i18nStrings.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update translation', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        string: updated[0]
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get ID from URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if translation exists
    const existingTranslation = await db
      .select()
      .from(i18nStrings)
      .where(eq(i18nStrings.id, parseInt(id)))
      .limit(1);

    if (existingTranslation.length === 0) {
      return NextResponse.json(
        { error: 'Translation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete translation
    const deleted = await db
      .delete(i18nStrings)
      .where(eq(i18nStrings.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete translation', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Translation deleted successfully'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}