'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    banUser,
    unbanUser,
    changeUserPassword,
    updateUser,
} from '@/actions/admin-actions';
import { Edit2, Lock, Ban, CheckCircle } from 'lucide-react';

interface User {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: string;
    isBanned: boolean;
    createdAt: Date;
}

export function UsersTable({ users }: { users: User[] }) {
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editData, setEditData] = useState({ username: '', email: '', name: '' });
    const [changingPassword, setChangingPassword] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const handleEdit = (user: User) => {
        setEditingUser(user.id);
        setEditData({
            username: user.username,
            email: user.email || '',
            name: user.name || '',
        });
    };

    const handleSaveEdit = async (userId: string) => {
        try {
            await updateUser(userId, editData);
            setEditingUser(null);
        } catch (error) {
            alert('Error updating user');
        }
    };

    const handleChangePassword = async (userId: string) => {
        if (!newPassword) return;
        try {
            await changeUserPassword(userId, newPassword);
            setChangingPassword(null);
            setNewPassword('');
            alert('Password changed successfully');
        } catch (error) {
            alert('Error changing password');
        }
    };

    const handleBanToggle = async (userId: string, isBanned: boolean) => {
        try {
            if (isBanned) {
                await unbanUser(userId);
            } else {
                await banUser(userId);
            }
        } catch (error) {
            alert('Error updating ban status');
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3">
                                {editingUser === user.id ? (
                                    <Input
                                        value={editData.username}
                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                        className="h-8"
                                    />
                                ) : (
                                    <span className="font-medium">{user.username}</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {editingUser === user.id ? (
                                    <Input
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        className="h-8"
                                    />
                                ) : (
                                    <span className="text-sm text-muted-foreground">{user.email || 'N/A'}</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {editingUser === user.id ? (
                                    <Input
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="h-8"
                                    />
                                ) : (
                                    <span className="text-sm">{user.name || 'N/A'}</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <Badge
                                    variant={
                                        user.role === 'SUPER_ADMIN'
                                            ? 'destructive'
                                            : user.role === 'BUSINESS'
                                                ? 'default'
                                                : 'secondary'
                                    }
                                >
                                    {user.role}
                                </Badge>
                            </td>
                            <td className="px-4 py-3">
                                {user.isBanned ? (
                                    <Badge variant="destructive">Banned</Badge>
                                ) : (
                                    <Badge variant="outline">Active</Badge>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    {editingUser === user.id ? (
                                        <>
                                            <Button size="sm" onClick={() => handleSaveEdit(user.id)}>
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingUser(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Edit2 className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>

                                            {changingPassword === user.id ? (
                                                <div className="flex gap-1">
                                                    <Input
                                                        type="password"
                                                        placeholder="New password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="h-8 w-32"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleChangePassword(user.id)}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setChangingPassword(null);
                                                            setNewPassword('');
                                                        }}
                                                    >
                                                        X
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setChangingPassword(user.id)}
                                                >
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Password
                                                </Button>
                                            )}

                                            {user.role !== 'SUPER_ADMIN' && (
                                                <Button
                                                    size="sm"
                                                    variant={user.isBanned ? 'default' : 'destructive'}
                                                    onClick={() => handleBanToggle(user.id, user.isBanned)}
                                                >
                                                    {user.isBanned ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Unban
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="h-3 w-3 mr-1" />
                                                            Ban
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
