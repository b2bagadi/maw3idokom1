import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { superAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Validate trimmed inputs are not empty
    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Query super admin by username
    const adminRecords = await db.select()
      .from(superAdmins)
      .where(eq(superAdmins.username, trimmedUsername))
      .limit(1);

    // Check if admin exists
    if (adminRecords.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const admin = adminRecords[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(trimmedPassword, admin.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const tokenPayload = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: 'SUPER_ADMIN'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });

    // Return success response with token and admin info (exclude passwordHash)
    return NextResponse.json(
      {
        success: true,
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}