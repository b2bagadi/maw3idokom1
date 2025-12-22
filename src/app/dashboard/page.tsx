'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, CalendarCheck, Star } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import ClientProfileEditor from '@/components/client/ProfileEditor';
import MyBookings from '@/components/client/MyBookings';
import ClientRatings from '@/components/client/ClientRatings';
import { useClientTranslation } from '@/i18n/client';

export default function ClientDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('bookings');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const { t } = useClientTranslation();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data.system_logo_url) setLogoUrl(data.system_logo_url);
            })
            .catch(() => { });
    }, []);

    if (status === 'loading') return null;

    const tabs = [
        { id: 'bookings', label: t('booking.myBookings', { defaultValue: 'My Bookings' }), icon: CalendarCheck },
        { id: 'ratings', label: t('common.rating', { defaultValue: 'Ratings' }), icon: Star },
        { id: 'profile', label: t('nav.profile', { defaultValue: 'Profile' }), icon: User },
    ];

    return (
        <DashboardShell
            title={t('common.appName')}
            subtitle={t('nav.client', { defaultValue: 'Client' })}
            logoUrl={logoUrl}
            icon={User}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 min-h-[400px] border border-gray-100 dark:border-gray-700">
                {activeTab === 'bookings' && <MyBookings />}
                {activeTab === 'ratings' && <ClientRatings />}
                {activeTab === 'profile' && <ClientProfileEditor />}
            </div>
        </DashboardShell>
    );
}