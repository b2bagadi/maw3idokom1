'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import MapPicker from '@/components/ui/MapPicker';
import { registerBusinessSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { z } from 'zod';
import { useClientTranslation } from '@/i18n/client';

type RegisterBusinessFormData = z.infer<typeof registerBusinessSchema>;

export default function BusinessRegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const { t } = useClientTranslation();

    useEffect(() => {
        fetch('/api/categories?active=true')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Failed to fetch categories', err));
    }, []);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterBusinessFormData>({
        resolver: zodResolver(registerBusinessSchema),
        defaultValues: {
            lat: 33.5731,
            lng: -7.5898,
        },
    });

    const lat = watch('lat');
    const lng = watch('lng');

    const onSubmit = async (data: RegisterBusinessFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || t('businessRegister.registrationFailed'));
            }

            toast.success(t('businessRegister.registrationSubmitted'));

            if (result.subscriptionEnabled) {
                router.push(`/business/plans?businessId=${result.userId}`);
            } else {
                router.push('/contact?reason=awaiting-approval');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.nameEn
    }));

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-12">
            <div className="w-full max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('businessRegister.title')}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('businessRegister.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('businessRegister.accountDetails')}</h3>
                                <Input
                                    label={t('businessRegister.businessEmail')}
                                    type="email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                    placeholder={t('businessRegister.emailPlaceholder')}
                                    required
                                />
                                <PasswordInput
                                    label={t('auth.password')}
                                    {...register('password')}
                                    error={errors.password?.message}
                                    placeholder={t('businessRegister.passwordPlaceholder')}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('businessRegister.businessDetails')}</h3>
                                <Input
                                    label={t('businessRegister.businessName')}
                                    {...register('businessName')}
                                    error={errors.businessName?.message}
                                    placeholder={t('businessRegister.businessNamePlaceholder')}
                                    required
                                />
                                <Input
                                    label={t('auth.phone')}
                                    type="tel"
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                    placeholder={t('businessRegister.phonePlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Select
                                label={t('businessDashboard.category')}
                                {...register('category')}
                                error={errors.category?.message}
                                options={categoryOptions}
                                required
                            />

                            <Input
                                label={t('business.address')}
                                {...register('address')}
                                error={errors.address?.message}
                                placeholder={t('businessRegister.addressPlaceholder')}
                                required
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('businessRegister.location')}
                                </label>
                                <Controller
                                    name="lat"
                                    control={control}
                                    render={() => (
                                        <MapPicker
                                            lat={lat || 33.5731}
                                            lng={lng || -7.5898}
                                            onLocationSelect={(newLat, newLng) => {
                                                setValue('lat', newLat);
                                                setValue('lng', newLng);
                                            }}
                                        />
                                    )}
                                />
                                <div className="text-xs text-gray-500">
                                    {t('businessRegister.locationCoords', { lat: lat?.toFixed(4), lng: lng?.toFixed(4) })}
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg py-3" isLoading={isLoading}>
                            {t('businessRegister.submitRegistration')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('businessRegister.alreadyJoined')}{' '}
                            <Link href="/login" className="text-primary-600 hover:underline">
                                {t('businessRegister.loginHere')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}