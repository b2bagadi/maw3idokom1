import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://maw3idokom.com';

    const routes = [
        '',
        '/search',
        '/login',
        '/register',
        '/business/register',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    if (!process.env.DATABASE_URL) {
        return routes;
    }

    try {
        const businesses = await prisma.business.findMany({
            where: {
                user: { isActive: true }
            },
            select: { id: true, updatedAt: true }
        });

        const businessRoutes = businesses.map((business) => ({
            url: `${baseUrl}/business/${business.id}`,
            lastModified: business.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.9,
        }));

        return [...routes, ...businessRoutes];
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return routes;
    }
}