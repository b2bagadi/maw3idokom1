import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

async function verifySuperAdminToken(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminPayload = await verifySuperAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json(
        { 
          error: 'Authentication required. Valid super admin token must be provided.',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { 
          error: 'Current password is required',
          code: 'MISSING_CURRENT_PASSWORD' 
        },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { 
          error: 'New password is required',
          code: 'MISSING_NEW_PASSWORD' 
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          error: 'New password must be at least 8 characters long',
          code: 'WEAK_PASSWORD' 
        },
        { status: 400 }
      );
    }

    const admin = await db.select()
      .from(superAdmins)
      .where(eq(superAdmins.id, adminPayload.id))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { 
          error: 'Super admin not found',
          code: 'ADMIN_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin[0].passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD' 
        },
        { status: 401 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updated = await db.update(superAdmins)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      })
      .where(eq(superAdmins.id, adminPayload.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update password',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}