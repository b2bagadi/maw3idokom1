import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { i18nStrings } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale');
    const category = searchParams.get('category');

    // Validate locale parameter if provided
    if (locale && !['en', 'fr', 'ar'].includes(locale)) {
      return NextResponse.json(
        { 
          error: 'Invalid locale. Must be one of: en, fr, ar',
          code: 'INVALID_LOCALE'
        },
        { status: 400 }
      );
    }

    // Build query with optional category filter
    let query = db.select().from(i18nStrings);

    if (category) {
      query = query.where(eq(i18nStrings.category, category));
    }

    // Order by category and key for consistent results
    const results = await query.orderBy(
      asc(i18nStrings.category),
      asc(i18nStrings.key)
    );

    // Transform results based on locale parameter
    let strings;
    if (locale) {
      strings = results.map(row => {
        const localeField = locale === 'en' ? 'textEn' : locale === 'fr' ? 'textFr' : 'textAr';
        return {
          key: row.key,
          text: row[localeField],
          category: row.category
        };
      });
    } else {
      strings = results.map(row => ({
        key: row.key,
        textEn: row.textEn,
        textFr: row.textFr,
        textAr: row.textAr,
        category: row.category
      }));
    }

    const response = NextResponse.json({
      strings,
      total: strings.length
    });

    // Add cache-control headers for public caching
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}