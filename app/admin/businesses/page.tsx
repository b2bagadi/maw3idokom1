import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBusinessesForAdmin, verifyBusiness, suspendBusiness, deleteBusiness } from '@/actions/admin-actions';
import { CheckCircle, Ban, Trash2 } from 'lucide-react';

export default async function AdminBusinessesPage() {
    const businesses = await getBusinessesForAdmin();

    async function handleVerify(id: string) {
        'use server';
        await verifyBusiness(id);
    }

    async function handleSuspend(id: string) {
        'use server';
        await suspendBusiness(id);
    }

    async function handleDelete(id: string) {
        'use server';
        await deleteBusiness(id);
    }

    return (
        <AdminDashboard>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Business Management</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>All Businesses ({businesses.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Owner</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Stats</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {businesses.map((business: any) => (
                                        <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{business.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {business.owner.username}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">{business.category}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {business.city || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="space-y-1">
                                                    <div>Services: {business._count.services}</div>
                                                    <div>Bookings: {business._count.bookings}</div>
                                                    <div>Reviews: {business._count.reviews}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    {business.verified ? (
                                                        <Badge variant="default">Verified</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Not Verified</Badge>
                                                    )}
                                                    {business.suspended && (
                                                        <Badge variant="destructive">Suspended</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {!business.verified && (
                                                        <form action={handleVerify.bind(null, business.id)}>
                                                            <Button size="sm" variant="default">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Verify
                                                            </Button>
                                                        </form>
                                                    )}

                                                    <form action={handleSuspend.bind(null, business.id)}>
                                                        <Button size="sm" variant="outline">
                                                            <Ban className="h-3 w-3 mr-1" />
                                                            Suspend
                                                        </Button>
                                                    </form>

                                                    <form action={handleDelete.bind(null, business.id)}>
                                                        <Button size="sm" variant="destructive">
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminDashboard>
    );
}
