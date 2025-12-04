import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
    // Fetch stats
    const [userCount, businessCount, bookingCount, reviewCount] = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.booking.count(),
        prisma.review.count(),
    ]);

    const stats = [
        {
            name: 'Total Users',
            value: userCount,
            icon: Users,
            color: 'bg-blue-500',
        },
        {
            name: 'Total Businesses',
            value: businessCount,
            icon: Building2,
            color: 'bg-purple-500',
        },
        {
            name: 'Total Bookings',
            value: bookingCount,
            icon: Calendar,
            color: 'bg-green-500',
        },
        {
            name: 'Total Reviews',
            value: reviewCount,
            icon: TrendingUp,
            color: 'bg-orange-500',
        },
    ];

    return (
        <AdminDashboard>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.name}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.name}
                                    </CardTitle>
                                    <div className={`${stat.color} p-2 rounded-lg`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Welcome Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to Maw3idokom Admin Panel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Use the sidebar to navigate through different sections:
                        </p>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li>• <strong>Users:</strong> Manage all users, change passwords, ban/unban accounts</li>
                            <li>• <strong>Businesses:</strong> Verify, suspend, or delete business listings</li>
                            <li>• <strong>Bookings:</strong> View all bookings and force status changes</li>
                            <li>• <strong>Reviews:</strong> Moderate and delete inappropriate reviews</li>
                            <li>• <strong>Settings:</strong> Update your admin username and password</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AdminDashboard>
    );
}
