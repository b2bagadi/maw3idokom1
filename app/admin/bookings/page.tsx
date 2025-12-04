import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsTable } from '@/components/BookingsTable';
import { getBookingsForAdmin } from '@/actions/admin-actions';

export default async function AdminBookingsPage() {
    const bookings = await getBookingsForAdmin();

    return (
        <AdminDashboard>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Booking Management</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>All Bookings ({bookings.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BookingsTable bookings={bookings} />
                    </CardContent>
                </Card>
            </div>
        </AdminDashboard>
    );
}
