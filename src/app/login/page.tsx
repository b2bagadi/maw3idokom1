'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import Link from 'next/link';
import { toast } from 'sonner';
import { useClientTranslation } from '@/i18n/client';

export default function LoginPage() {
    const router = useRouter();
    const { t } = useClientTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Invalid email or password');
            } else {
                toast.success('Login successful!');

                // Fetch session to determine role and redirect
                // We use a small delay or retry to ensure session is updated
                const session = await fetch('/api/auth/session').then(res => res.json());

                if (session?.user) {
                    const role = session.user.role;
                    if (role === 'ADMIN') router.push('/admin/dashboard');
                    else if (role === 'BUSINESS') router.push('/business/dashboard');
                    else router.push('/search'); // CLIENT default to explore
                    router.refresh();
                } else {
                    router.push('/');
                    router.refresh();
                }
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('auth.login')}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('auth.noAccount')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <Input
                            label={t('auth.email')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            autoComplete="new-password"
                        />

                        <PasswordInput
                            label={t('auth.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            {t('auth.signIn')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.noAccount')}{' '}
                            <Link href="/register" className="text-primary-600 hover:underline">
                                {t('auth.signUp')}
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.businessAccount', { defaultValue: 'Business?' })}{' '}
                            <Link href="/business/register" className="text-primary-600 hover:underline">
                                {t('auth.registerHere', { defaultValue: 'Register Here' })}
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
