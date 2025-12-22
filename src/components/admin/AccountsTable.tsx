'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useClientTranslation } from '@/i18n/client';

export default function AccountsTable() {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { t } = useClientTranslation();

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/accounts');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || data);
        } catch (error) {
            toast.error(t('admin.failedUpdate'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = users;

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        if (statusFilter === 'active') {
            filtered = filtered.filter(u => u.isActive);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(u => !u.isActive);
        }

        setFilteredUsers(filtered);
    }, [roleFilter, statusFilter, users]);

    const handleToggleActive = async (userId: string, currentStatus: boolean) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));

        try {
            const res = await fetch('/api/admin/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success(t('admin.statusUpdated'));
        } catch (error) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: currentStatus } : u));
            toast.error(t('admin.failedUpdate'));
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deleteId }),
            });
            if (!res.ok) throw new Error('Failed to delete');

            setUsers(prev => prev.filter(u => u.id !== deleteId));
            toast.success(t('admin.userDeleted'));
        } catch (error) {
            toast.error(t('admin.failedDelete'));
        } finally {
            setDeleteId(null);
        }
    };

    const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
    const [creditValue, setCreditValue] = useState<number>(0);

    const handleUpdateCredits = async (userId: string, newCredits: number) => {
        try {
            const res = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, credits: newCredits }),
            });
            if (!res.ok) throw new Error('Failed to update');

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, quickFindCredits: newCredits } : u));
            toast.success('Credits updated');
            setEditingCreditId(null);
        } catch (error) {
            toast.error('Failed to update credits');
        }
    };

    const columns = [
        { header: t('profile.name'), accessor: 'name' },
        { header: t('profile.email'), accessor: 'email' },
        { header: t('staff.role'), accessor: 'role' },
        {
            header: t('admin.subscription') || 'Plan',
            accessor: (user: any) => user.business?.subscriptionPlan?.name || '-'
        },
        {
            header: t('admin.credits') || 'Credits',
            accessor: (user: any) => {
                if (user.role !== 'CLIENT') return '-';
                if (editingCreditId === user.id) {
                    return (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                className="w-16 px-2 py-1 text-sm border rounded"
                                value={creditValue}
                                onChange={(e) => setCreditValue(Number(e.target.value))}
                                autoFocus
                            />
                            <Button size="sm" variant="outline" onClick={() => handleUpdateCredits(user.id, creditValue)} className="h-7 px-2">✓</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCreditId(null)} className="h-7 px-2">✕</Button>
                        </div>
                    );
                }
                return (
                    <div
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-1 group"
                        onClick={() => {
                            setEditingCreditId(user.id);
                            setCreditValue(user.quickFindCredits || 0);
                        }}
                    >
                        {user.quickFindCredits ?? 0}
                        <span className="opacity-0 group-hover:opacity-50 text-xs">✎</span>
                    </div>
                );
            }
        },
        {
            header: t('admin.active'),
            accessor: (user: any) => (
                <Switch
                    checked={user.isActive}
                    onChange={() => handleToggleActive(user.id, user.isActive)}
                    disabled={user.role === 'ADMIN'}
                />
            )
        },
        {
            header: t('services.actions'),
            accessor: (user: any) => (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(user.id)}
                    disabled={user.role === 'ADMIN'}
                >
                    <Trash2 size={16} />
                </Button>
            )
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{t('admin.userAccounts')}</h2>
                <div className="flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="all">{t('admin.allRoles')}</option>
                        <option value="CLIENT">{t('admin.clients')}</option>
                        <option value="BUSINESS">{t('admin.businesses')}</option>
                        <option value="ADMIN">Admins</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="all">{t('admin.allStatus')}</option>
                        <option value="active">{t('admin.active')}</option>
                        <option value="inactive">{t('admin.inactive')}</option>
                    </select>
                </div>
            </div>
            <Table
                data={filteredUsers}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
            />

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title={t('admin.deleteAccount')}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>{t('services.cancel')}</Button>
                        <Button variant="danger" onClick={handleDelete}>{t('admin.deleteAccount')}</Button>
                    </>
                }
            >
                <p>{t('admin.confirmDelete')}</p>
            </Modal>
        </div>
    );
}