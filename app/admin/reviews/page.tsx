import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getReviewsForAdmin, deleteReview } from '@/actions/admin-actions';
import { Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default async function AdminReviewsPage() {
    const reviews = await getReviewsForAdmin();

    async function handleDeleteReview(id: string) {
        'use server';
        await deleteReview(id);
    }

    return (
        <AdminDashboard>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Review Management</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>All Reviews ({reviews.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Comment</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {reviews.map((review: any) => (
                                        <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium">
                                                {review.customer.username}
                                            </td>
                                            <td className="px-4 py-3">{review.business.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-semibold">{review.rating}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 max-w-md">
                                                <p className="line-clamp-2 text-sm">
                                                    {review.comment || 'No comment'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {format(new Date(review.createdAt), 'PP')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <form action={handleDeleteReview.bind(null, review.id)}>
                                                    <Button size="sm" variant="destructive">
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Delete
                                                    </Button>
                                                </form>
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
