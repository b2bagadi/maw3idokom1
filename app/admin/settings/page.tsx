'use client';

import { useState } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateAdminProfile } from '@/actions/admin-actions';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        currentUsername: 'Ayoubovic09',
        newUsername: 'Ayoubovic09',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        // Validate passwords match
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const result = await updateAdminProfile(
                formData.currentUsername,
                formData.newUsername,
                formData.newPassword || undefined
            );

            if (result.success) {
                setMessage('Profile updated successfully! Please log in again.');
                // If username or password changed, logout
                if (formData.newUsername !== formData.currentUsername || formData.newPassword) {
                    setTimeout(() => {
                        router.push('/admin/login');
                    }, 2000);
                }
            }
        } catch (error) {
            setMessage('Error updating profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminDashboard>
            <div className="p-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Update Admin Credentials</CardTitle>
                        <CardDescription>
                            Change your admin username and password. You will be logged out after updating.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="newUsername" className="block text-sm font-medium mb-2">
                                    New Username
                                </label>
                                <Input
                                    id="newUsername"
                                    value={formData.newUsername}
                                    onChange={(e) =>
                                        setFormData({ ...formData, newUsername: e.target.value })
                                    }
                                    placeholder="Enter new username"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                                    New Password (optional)
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, newPassword: e.target.value })
                                    }
                                    placeholder="Leave blank to keep current password"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                    Confirm New Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    placeholder="Confirm new password"
                                    disabled={isLoading}
                                />
                            </div>

                            {message && (
                                <div
                                    className={`p-3 rounded-md text-sm ${message.includes('success')
                                            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        }`}
                                >
                                    {message}
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Updating...' : 'Update Credentials'}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-2">Current Information</h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p>Current Username: <strong>{formData.currentUsername}</strong></p>
                                <p>Role: <strong>SUPER_ADMIN</strong></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminDashboard>
    );
}
