import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTable } from '@/components/UsersTable';
import { getUsersForAdmin } from '@/actions/admin-actions';

export default async function AdminUsersPage() {
    const users = await getUsersForAdmin();

    return (
        <AdminDashboard>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">User Management</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users ({users.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UsersTable users={users} />
                    </CardContent>
                </Card>
            </div>
        </AdminDashboard>
    );
}
