import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { globalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query globalSettings where id = 1
    const settings = await db.select({
      logoUrl: globalSettings.logoUrl,
      siteName: globalSettings.siteName,
      heroTextEn: globalSettings.heroTextEn,
      heroTextFr: globalSettings.heroTextFr,
      heroTextAr: globalSettings.heroTextAr,
    })
      .from(globalSettings)
      .where(eq(globalSettings.id, 1))
      .limit(1);

    // Return default values if no settings exist
    if (settings.length === 0) {
      return NextResponse.json({
        logoUrl: null,
        siteName: 'Appointment System',
        heroTextEn: 'Welcome to our appointment booking system',
        heroTextFr: 'Bienvenue sur notre système de réservation de rendez-vous',
        heroTextAr: 'مرحبًا بك في نظام حجز المواعيد الخاص بنا',
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Return the public fields with cache headers
    return NextResponse.json(settings[0], {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}