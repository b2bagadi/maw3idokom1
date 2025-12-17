import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
    });
    const { pathname } = request.nextUrl;
    
    // Debug logging for Vercel deployment issues
    if (!token && process.env.NODE_ENV !== 'production') {
        console.log('[Middleware] No token found for path:', pathname);
    }

    // Rate limiting (simple IP-based check)
    // In production, use edge-config or Redis for distributed rate limiting
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Admin routes protection
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!token || token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Business routes protection
    if (pathname.startsWith('/business/dashboard') || pathname.startsWith('/business/schedule')) {
        if (!token || token.role !== 'BUSINESS') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check if business account is active
        if (!token.isActive) {
            return NextResponse.redirect(new URL('/contact?reason=awaiting-approval', request.url));
        }
    }

    // Client dashboard protection
    if (pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')) {
        if (!token || token.role !== 'CLIENT') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect logged-in users away from login pages
    if (pathname === '/login' || pathname === '/admin/login') {
        if (token) {
            if (token.role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            } else if (token.role === 'BUSINESS') {
                if (token.isActive) {
                    return NextResponse.redirect(new URL('/business/dashboard', request.url));
                } else {
                    return NextResponse.redirect(new URL('/contact?reason=awaiting-approval', request.url));
                }
            } else if (token.role === 'CLIENT') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/business/:path*',
        '/dashboard/:path*',
        '/login',
    ],
};
