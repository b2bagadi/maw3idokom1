'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { toast } from 'sonner';

export default function AdminProfile() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email || undefined, password: password || undefined }),
            });

            if (res.ok) {
                toast.success('Admin credentials updated');
                setPassword('');
            } else {
                toast.error('Failed to update');
            }
        } catch {
            toast.error('Error updating');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6">Admin Account Settings</h2>
            <form onSubmit={handleUpdate} className="space-y-6" autoComplete="off">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Leave fields empty if you don't want to change them.
                    </p>
                </div>

                <Input
                    label="New Admin Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="new-password"
                />

                <PasswordInput
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New strong password"
                    autoComplete="new-password"
                />

                <Button type="submit" isLoading={isLoading}>
                    Update Credentials
                </Button>
            </form>
        </div>
    );
}
