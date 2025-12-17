import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.globalSettings.findMany({
            where: {
                key: { in: ['facebook_url', 'instagram_url', 'twitter_url', 'contact_email', 'hero_background_url', 'system_logo_url'] }
            }
        });

        const result: Record<string, string> = {};
        settings.forEach(s => {
            result[s.key] = s.valueEn;
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({}, { status: 500 });
    }
}