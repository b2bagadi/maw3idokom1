'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { registerClientSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { z } from 'zod';

type RegisterFormData = z.infer<typeof registerClientSchema>;

import { useClientTranslation } from '@/i18n/client';

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useClientTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerClientSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        // Password Security Check
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(data.password)) {
            toast.error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            toast.success('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('auth.createAccount', { defaultValue: 'Create Account' })}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('auth.joinMessage', { defaultValue: 'Join Maw3idokom today' })}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label={t('auth.name')}
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="John Doe"
                            required
                        />

                        <Input
                            label={t('auth.email')}
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                            placeholder="john@example.com"
                            required
                        />

                        <Input
                            label={t('auth.phone')}
                            type="tel"
                            {...register('phone')}
                            error={errors.phone?.message}
                            placeholder="+1 234 567 890"
                            required
                        />

                        <PasswordInput
                            label={t('auth.password')}
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Choose a strong password' })}
                            required
                        />

                        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
                            {t('auth.signUp')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.hasAccount')}{' '}
                            <Link href="/login" className="text-primary-600 hover:underline">
                                {t('auth.login')}
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.businessInterest', { defaultValue: 'Want to list your business?' })}{' '}
                            <Link href="/business/register" className="text-primary-600 hover:underline">
                                {t('auth.registerBusiness', { defaultValue: 'Register Business' })}
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-white hover:underline">
                        ← {t('common.backToHome', { defaultValue: 'Back to Home' })}
                    </Link>
                </div>
            </div>
        </div>
    );
}
