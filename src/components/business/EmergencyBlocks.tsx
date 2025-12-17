'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

export default function EmergencyBlocks() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, reset } = useForm();
    const { t } = useClientTranslation();

    const fetchBlocks = async () => {
        try {
            const res = await fetch('/api/emergency-blocks');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setBlocks(data);
        } catch {
            toast.error(t('emergencyBlocks.failedLoad'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/emergency-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');

            toast.success(t('emergencyBlocks.blockCreated'));
            reset();
            fetchBlocks();
        } catch {
            toast.error(t('emergencyBlocks.failedCreate'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('emergencyBlocks.removeBlock'))) return;
        try {
            const res = await fetch(`/api/emergency-blocks?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setBlocks(prev => prev.filter(b => b.id !== id));
            toast.success(t('emergencyBlocks.removed'));
        } catch {
            toast.error(t('emergencyBlocks.failedRemove'));
        }
    };

    const columns = [
        { header: t('emergencyBlocks.startDate'), accessor: (b: any) => formatDate(b.startDate) },
        { header: t('emergencyBlocks.endDate'), accessor: (b: any) => formatDate(b.endDate) },
        { header: t('emergencyBlocks.reason'), accessor: 'reason' },
        {
            header: t('services.actions'),
            accessor: (b: any) => (
                <Button variant="danger" size="sm" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={16} />
                </Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">{t('emergencyBlocks.addTimeBlock')}</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-end">
                    <Input label={t('emergencyBlocks.startDate')} type="date" {...register('startDate')} required containerClassName="flex-1" />
                    <Input label={t('emergencyBlocks.endDate')} type="date" {...register('endDate')} required containerClassName="flex-1" />
                    <Input label={t('emergencyBlocks.reason')} {...register('reason')} placeholder={t('emergencyBlocks.reasonPlaceholder')} required containerClassName="flex-[2]" />
                    <Button type="submit" className="mb-[2px]">{t('emergencyBlocks.blockTime')}</Button>
                </form>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">{t('emergencyBlocks.currentBlocks')}</h3>
                <Table data={blocks} columns={columns} keyExtractor={b => b.id} isLoading={isLoading} emptyMessage={t('emergencyBlocks.noTimeBlocks')} />
            </div>
        </div>
    );
}