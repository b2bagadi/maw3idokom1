'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatPrice } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

export default function ServicesManager() {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm();
    const { t } = useClientTranslation();

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setServices(data);
        } catch {
            toast.error(t('services.failedLoad'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');

            toast.success(t('services.serviceAdded'));
            setIsModalOpen(false);
            reset();
            fetchServices();
        } catch {
            toast.error(t('services.failedAdd'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('services.deleteService'))) return;
        try {
            const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (!res.ok) {
                toast.error(data.message || t('services.failedDelete'));
                return;
            }
            
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success(t('services.deleted'));
        } catch (error) {
            toast.error(t('services.failedDelete'));
        }
    };

    const columns = [
        { header: t('services.name'), accessor: 'name' },
        { header: t('services.duration'), accessor: (s: any) => `${s.duration} ${t('time.min')}` },
        { header: t('services.price'), accessor: (s: any) => formatPrice(s.price) },
        {
            header: t('services.actions'),
            accessor: (s: any) => (
                <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>
                    <Trash2 size={16} />
                </Button>
            )
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('services.services')}</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" /> {t('services.addService')}
                </Button>
            </div>

            <Table data={services} columns={columns} keyExtractor={s => s.id} isLoading={isLoading} emptyMessage={t('services.noServicesFound')} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('services.addService')}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label={t('services.serviceName')} {...register('name')} required />
                    <Input label={t('services.description')} {...register('description')} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('services.priceCents')} type="number" {...register('price')} required />
                        <Input label={t('services.durationMin')} type="number" {...register('duration')} required />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('services.cancel')}</Button>
                        <Button type="submit">{t('services.createService')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}