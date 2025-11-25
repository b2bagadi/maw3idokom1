
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, services, staff } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            // Fetch specific tenant by slug
            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.slug, slug),
            });

            if (!tenant) {
                return NextResponse.json(
                    { error: 'Tenant not found' },
                    { status: 404 }
                );
            }

            // Fetch related services
            const tenantServices = await db.query.services.findMany({
                where: eq(services.tenantId, tenant.id),
            });

            // Fetch related staff
            const tenantStaff = await db.query.staff.findMany({
                where: eq(staff.tenantId, tenant.id),
            });

            // Combine data
            const tenantWithDetails = {
                ...tenant,
                services: tenantServices,
                staff: tenantStaff,
            };

            return NextResponse.json({ tenants: [tenantWithDetails] });
        }

        // If no slug provided, return all tenants (optional, for listing)
        const allTenants = await db.query.tenants.findMany();
        return NextResponse.json({ tenants: allTenants });

    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
