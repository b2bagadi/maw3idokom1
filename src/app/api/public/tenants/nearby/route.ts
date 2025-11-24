import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { isNotNull, and } from 'drizzle-orm';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');
    const limitParam = searchParams.get('limit');

    // Validate required parameters
    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES' 
      }, { status: 400 });
    }

    // Parse and validate latitude
    const latitude = parseFloat(lat);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ 
        error: 'Latitude must be a number between -90 and 90',
        code: 'INVALID_LATITUDE' 
      }, { status: 400 });
    }

    // Parse and validate longitude
    const longitude = parseFloat(lng);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ 
        error: 'Longitude must be a number between -180 and 180',
        code: 'INVALID_LONGITUDE' 
      }, { status: 400 });
    }

    // Parse and validate radius (default 10km, max 100km)
    const radius = radiusParam ? parseFloat(radiusParam) : 10;
    if (isNaN(radius) || radius <= 0 || radius > 100) {
      return NextResponse.json({ 
        error: 'Radius must be a positive number not exceeding 100 kilometers',
        code: 'INVALID_RADIUS' 
      }, { status: 400 });
    }

    // Parse and validate limit (default 20, max 50)
    const limit = limitParam ? parseInt(limitParam) : 20;
    if (isNaN(limit) || limit <= 0 || limit > 50) {
      return NextResponse.json({ 
        error: 'Limit must be a positive integer not exceeding 50',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    // Fetch all tenants with both latitude and longitude set
    const allTenants = await db.select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      nameEn: tenants.nameEn,
      nameFr: tenants.nameFr,
      nameAr: tenants.nameAr,
      aboutEn: tenants.aboutEn,
      aboutFr: tenants.aboutFr,
      aboutAr: tenants.aboutAr,
      businessType: tenants.businessType,
      logo: tenants.logo,
      address: tenants.address,
      phone: tenants.phone,
      mapUrl: tenants.mapUrl,
      whatsappUrl: tenants.whatsappUrl,
      latitude: tenants.latitude,
      longitude: tenants.longitude,
    })
    .from(tenants)
    .where(and(
      isNotNull(tenants.latitude),
      isNotNull(tenants.longitude)
    ));

    // Calculate distances and filter by radius
    const tenantsWithDistance = allTenants
      .map(tenant => {
        const distance = calculateDistance(
          latitude,
          longitude,
          tenant.latitude!,
          tenant.longitude!
        );
        
        return {
          ...tenant,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .filter(tenant => tenant.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Apply limit
    const limitedResults = tenantsWithDistance.slice(0, limit);

    // Create response with cache control headers
    const response = NextResponse.json({
      tenants: limitedResults,
      total: tenantsWithDistance.length,
      searchParams: {
        latitude,
        longitude,
        radius,
        limit
      }
    }, { status: 200 });

    // Add cache control headers for public caching
    response.headers.set('Cache-Control', 'public, s-maxage=300');

    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}