'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useClientTranslation } from '@/i18n/client';

function ContactContent() {
    const searchParams = useSearchParams();
    const reason = searchParams?.get('reason');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useClientTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, message })
            });

            if (!res.ok) throw new Error('failed');
            toast.success(t('contact.successMessage'));
            setName('');
            setEmail('');
            setPhone('');
            setMessage('');
        } catch {
            toast.error(t('contact.errorMessage'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {reason === 'awaiting-approval' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                            {t('contact.awaitingApprovalTitle')}
                        </h2>
                        <p className="text-yellow-700 dark:text-yellow-400">
                            {t('contact.awaitingApproval')}
                        </p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-2">{t('contact.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {t('contact.description')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label={t('contact.nameLabel')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('contact.namePlaceholder')}
                            required
                        />

                        <Input
                            label={t('contact.emailLabel')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('contact.emailPlaceholder')}
                            required
                        />

                        <Input
                            label={t('contact.phoneLabel')}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={t('contact.phonePlaceholder', { defaultValue: '+1 234 567 8900' })}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('contact.message')}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                placeholder={t('contact.messagePlaceholder')}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            {t('contact.sendMessage')}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold mb-4">{t('contact.otherWays')}</h3>
                        <div className="space-y-2 text-gray-600 dark:text-gray-400">
                            <p>📧 {t('contact.emailLabel')}: contact@maw3idokom.com</p>
                            <p>📱 {t('contact.phoneLabel')}: +1 234 567 8900</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
            <ContactContent />
        </Suspense>
    );
}