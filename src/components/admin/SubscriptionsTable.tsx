'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useClientTranslation } from '@/i18n/client';

export default function SubscriptionsTable() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm();
    const { t } = useClientTranslation();

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/subscriptions');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPlans(data);
        } catch {
            toast.error(t('admin.operationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            const setting = Array.isArray(data) ? data.find((s: any) => s.key === 'SUBSCRIPTION_PLANS_ENABLED') : null;
            setIsFeatureEnabled(setting?.valueEn === 'true');
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchSettings();
    }, []);

    const handleToggleFeature = async (checked: boolean) => {
        const oldValue = isFeatureEnabled;
        setIsFeatureEnabled(checked);
        try {
             const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'SUBSCRIPTION_PLANS_ENABLED',
                    valueEn: String(checked),
                    valueFr: String(checked),
                    valueAr: String(checked)
                })
            });
            if (!res.ok) throw new Error();
            toast.success(t('common.success'));
        } catch {
            setIsFeatureEnabled(oldValue);
            toast.error(t('admin.failedUpdate'));
        }
    };

    const onSubmit = async (data: any) => {
        // features is comma separated string -> string (already)
        const formattedData = {
            ...data,
            features: data.features, // send as string
            pricePerMonth: parseInt(data.pricePerMonth),
            maxServices: parseInt(data.maxServices),
        };

        try {
            if (editingPlan) {
                // Update
                const res = await fetch('/api/admin/subscriptions', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingPlan.id, ...formattedData }),
                });
                if (!res.ok) throw new Error('Update failed');
                toast.success(t('admin.planUpdated'));
            } else {
                // Create
                const res = await fetch('/api/admin/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formattedData),
                });
                if (!res.ok) throw new Error('Creation failed');
                toast.success(t('admin.planCreated'));
            }
            setIsModalOpen(false);
            reset();
            setEditingPlan(null);
            fetchPlans();
        } catch (error) {
            toast.error(t('admin.operationFailed'));
        }
    };

    const startEdit = (plan: any) => {
        setEditingPlan(plan);
        setValue('name', plan.name);
        setValue('features', plan.features); // already string
        setValue('pricePerMonth', plan.pricePerMonth);
        setValue('maxServices', plan.maxServices);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('admin.deleteThisPlan'))) return;
        try {
            const res = await fetch(`/api/admin/subscriptions?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            toast.success(t('admin.planDeleted'));
            fetchPlans();
        } catch {
            toast.error(t('admin.failedDelete'));
        }
    };

    const columns = [
        { header: t('profile.name'), accessor: 'name' },
        { header: t('admin.priceCentsMonth'), accessor: 'pricePerMonth' },
        { header: t('admin.maxServices'), accessor: 'maxServices' },
        {
            header: t('services.actions'),
            accessor: (plan: any) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(plan)}><Edit size={16} /></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(plan.id)}><Trash2 size={16} /></Button>
                </div>
            )
        },
    ];

    return (
        <div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="font-bold text-lg">{t('admin.enableSubscriptions')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.enableSubscriptionsDesc') || 'Show subscription selection during business registration'}</p>
                </div>
                <Switch checked={isFeatureEnabled} onChange={handleToggleFeature} />
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('admin.subscriptions')}</h2>
                <Button onClick={() => { setEditingPlan(null); reset(); setIsModalOpen(true); }}>
                    <Plus size={16} className="mr-2" /> {t('admin.addPlan')}
                </Button>
            </div>

            <Table data={plans} columns={columns} keyExtractor={(p) => p.id} isLoading={isLoading} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlan ? t('admin.editPlan') : t('admin.newPlan')}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label={t('profile.name')} {...register('name')} required />
                    <Input label={t('admin.priceCentsMonth')} type="number" {...register('pricePerMonth')} required />
                    <Input label={t('admin.maxServices')} type="number" {...register('maxServices')} required />
                    <Input label={t('admin.featuresCommaSeparated')} {...register('features')} placeholder="Feature 1, Feature 2" required />

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('services.cancel')}</Button>
                        <Button type="submit">{t('common.save')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}