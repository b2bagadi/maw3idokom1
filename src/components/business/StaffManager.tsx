'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useClientTranslation } from '@/i18n/client';

export default function StaffManager() {
    const [staff, setStaff] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarDeleteUrl, setAvatarDeleteUrl] = useState('');
    const { register, handleSubmit, reset } = useForm();
    const { t } = useClientTranslation();

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/staff');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setStaff(data);
        } catch {
            toast.error(t('staff.failedLoad'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    avatarUrl,
                    avatarDeleteUrl,
                }),
            });
            if (!res.ok) throw new Error('Failed');

            toast.success(t('staff.staffAdded'));
            setIsModalOpen(false);
            setAvatarUrl('');
            setAvatarDeleteUrl('');
            reset();
            fetchStaff();
        } catch {
            toast.error(t('staff.failedAdd'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('staff.deleteStaffMember'))) return;
        try {
            const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setStaff(prev => prev.filter(s => s.id !== id));
            toast.success(t('staff.deleted'));
        } catch {
            toast.error(t('staff.failedDelete'));
        }
    };

    const columns = [
        { header: t('staff.name'), accessor: 'name' },
        { header: t('staff.role'), accessor: 'role' },
        {
            header: t('staff.actions'),
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
                <h2 className="text-xl font-bold">{t('staff.staffMembers')}</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" /> {t('staff.addStaff')}
                </Button>
            </div>

            <Table data={staff} columns={columns} keyExtractor={s => s.id} isLoading={isLoading} emptyMessage={t('staff.noStaffFound')} />

            <Modal isOpen={isModalOpen} onClose={() => {
                setIsModalOpen(false);
                setAvatarUrl('');
                setAvatarDeleteUrl('');
            }} title={t('staff.addStaff')}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label={t('staff.name')} {...register('name')} required />
                    <Input label={t('staff.role')} {...register('role')} placeholder={t('staff.rolePlaceholder')} required />

                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('staff.avatar')}</label>
                        <ImageUpload
                            onUploadComplete={(url, deleteUrl) => {
                                setAvatarUrl(url);
                                setAvatarDeleteUrl(deleteUrl);
                            }}
                            buttonText={t('staff.uploadAvatar')}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => {
                            setIsModalOpen(false);
                            setAvatarUrl('');
                            setAvatarDeleteUrl('');
                        }}>{t('services.cancel')}</Button>
                        <Button type="submit">{t('staff.addStaff')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}