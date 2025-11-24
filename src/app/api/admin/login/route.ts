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
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Username is required',
          code: 'MISSING_USERNAME' 
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Password is required',
          code: 'MISSING_PASSWORD' 
        },
        { status: 400 }
      );
    }

    // Query super_admins table to find user by username
    const result = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.username, username.trim()))
      .limit(1);

    // Check if user exists
    if (result.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    const user = result[0];

    // Compare password with stored hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

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
      id: user.id,
      username: user.username,
      email: user.email,
      role: 'SUPER_ADMIN'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '7d'
    });

    // Return success response with token and user info
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
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