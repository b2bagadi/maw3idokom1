'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { useClientTranslation } from '@/i18n/client';

export default function PlanSelectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const businessId = searchParams.get('businessId');
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useClientTranslation();

    useEffect(() => {
        if (!businessId) {
            router.push('/');
            return;
        }

        fetch('/api/plans')
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error('Failed to load plans');
                setIsLoading(false);
            });
    }, [businessId, router]);

    const handleSelect = async () => {
        if (!selectedPlanId || !businessId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/business/set-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    planId: selectedPlanId
                })
            });

            if (!res.ok) throw new Error('Failed to set plan');

            toast.success('Plan selected successfully');
            router.push('/contact?reason=awaiting-approval');
        } catch (error) {
            toast.error('Failed to select plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                        {t('plans.chooseYourPlan') || 'Choose your plan'}
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                        {t('plans.selectBestFit') || 'Select the plan that best fits your business needs'}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-sm flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                selectedPlanId === plan.id
                                    ? 'border-primary-600 ring-2 ring-primary-600 dark:border-primary-500 dark:ring-primary-500'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setSelectedPlanId(plan.id)}
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                    {plan.name}
                                </h3>
                                <p className="mt-4">
                                    <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {plan.pricePerMonth / 100}
                                    </span>
                                    <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                                        /mo
                                    </span>
                                </p>
                            </div>

                            <ul className="space-y-4 flex-1 mb-8">
                                {plan.features.split(',').map((feature: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Check className="h-6 w-6 text-green-500" />
                                        </div>
                                        <p className="ml-3 text-base text-gray-500 dark:text-gray-400">
                                            {feature.trim()}
                                        </p>
                                    </li>
                                ))}
                                <li className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <Check className="h-6 w-6 text-green-500" />
                                    </div>
                                    <p className="ml-3 text-base text-gray-500 dark:text-gray-400">
                                        Up to {plan.maxServices} services
                                    </p>
                                </li>
                            </ul>

                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPlanId(plan.id);
                                }}
                                variant={selectedPlanId === plan.id ? 'primary' : 'outline'}
                                className="w-full"
                            >
                                {selectedPlanId === plan.id ? (t('plans.selected') || 'Selected') : (t('plans.select') || 'Select Plan')}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <Button
                        size="lg"
                        className="px-12 py-6 text-lg"
                        onClick={handleSelect}
                        disabled={!selectedPlanId || isSubmitting}
                        isLoading={isSubmitting}
                    >
                        {t('common.continue') || 'Continue'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
