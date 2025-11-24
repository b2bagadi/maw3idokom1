import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  tenantId: number;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function verifyBusinessOwnerToken(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.role !== 'BUSINESS_OWNER') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const businessOwner = await verifyBusinessOwnerToken(request);
    
    if (!businessOwner) {
      return NextResponse.json(
        { 
          error: 'Authentication required. Must be a business owner with valid JWT token.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, body: emailBody, appointmentId } = body;

    if (!to) {
      return NextResponse.json(
        { 
          error: 'Recipient email address (to) is required',
          code: 'MISSING_TO_FIELD'
        },
        { status: 400 }
      );
    }

    if (!validateEmail(to)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format for recipient address',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    if (!subject || subject.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Email subject is required and cannot be empty',
          code: 'MISSING_SUBJECT'
        },
        { status: 400 }
      );
    }

    if (!emailBody || emailBody.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Email body is required and cannot be empty',
          code: 'MISSING_BODY'
        },
        { status: 400 }
      );
    }

    console.log('=== EMAIL STUB IMPLEMENTATION ===');
    console.log('Sender (Business Owner):', {
      userId: businessOwner.userId,
      email: businessOwner.email,
      tenantId: businessOwner.tenantId
    });
    console.log('Email Details:', {
      to: to.trim(),
      subject: subject.trim(),
      body: emailBody.trim(),
      appointmentId: appointmentId || null
    });
    console.log('Timestamp:', new Date().toISOString());
    console.log('=== END EMAIL STUB ===');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully',
        details: {
          to: to.trim(),
          subject: subject.trim(),
          appointmentId: appointmentId || null,
          sentBy: businessOwner.email,
          tenantId: businessOwner.tenantId
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/send-email error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}