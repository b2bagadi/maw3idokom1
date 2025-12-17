'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useClientTranslation } from '@/i18n/client';

export default function ClientProfileEditor() {
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, reset } = useForm();
    const { t } = useClientTranslation();

    useEffect(() => {
        fetch('/api/client/profile')
            .then(res => res.json())
            .then(data => {
                reset(data);
                setIsLoading(false);
            })
            .catch(() => toast.error(t('profile.failedLoad')));
    }, [reset, t]);

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/client/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed');

            toast.success(t('profile.profileUpdated'));
            reset({ ...result, password: '', newPassword: '' });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (isLoading) return <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('clientDashboard.myProfile')}</h3>
                <Input label={t('profile.name')} {...register('name')} required />
                <Input label={t('profile.email')} type="email" {...register('email')} required />
                <Input label={t('profile.phone')} type="tel" {...register('phone')} required />
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('profile.changePassword')}</h3>
                <PasswordInput label={t('profile.currentPassword')} {...register('password')} />
                <PasswordInput label={t('profile.newPassword')} {...register('newPassword')} />
            </div>

            <div className="flex justify-end">
                <Button type="submit">{t('schedule.saveChanges')}</Button>
            </div>
        </form>
    );
}