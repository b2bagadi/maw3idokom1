'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Building2, Calendar, Scissors, Users,
    CalendarCheck, Star
} from 'lucide-react';

import ProfileEditor from '@/components/business/ProfileEditor';
import ScheduleGrid from '@/components/business/ScheduleGrid';
import EmergencyBlocks from '@/components/business/EmergencyBlocks';
import ServicesManager from '@/components/business/ServicesManager';
import StaffManager from '@/components/business/StaffManager';
import BookingsTable from '@/components/business/BookingsTable';
import ReviewsList from '@/components/business/ReviewsList';

import { useClientTranslation } from '@/i18n/client';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function BusinessDashboard() {
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
        { id: 'bookings', label: t('business.bookings', { defaultValue: 'Bookings' }), icon: CalendarCheck },
        { id: 'profile', label: t('business.profile', { defaultValue: 'Profile' }), icon: Building2 },
        { id: 'schedule', label: t('business.schedule', { defaultValue: 'Schedule' }), icon: Calendar },
        { id: 'services', label: t('business.services', { defaultValue: 'Services' }), icon: Scissors },
        { id: 'staff', label: t('business.staff', { defaultValue: 'Staff' }), icon: Users },
        { id: 'reviews', label: t('business.reviews', { defaultValue: 'Reviews' }), icon: Star },
    ];

    return (
        <DashboardShell
            title={t('common.appName')}
            subtitle={t('nav.business', { defaultValue: 'Business' })}
            logoUrl={logoUrl}
            icon={Building2}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 min-h-[600px] border border-gray-100 dark:border-gray-700">
                {activeTab === 'bookings' && <BookingsTable />}
                {activeTab === 'profile' && <ProfileEditor />}
                {activeTab === 'schedule' && (
                    <div className="space-y-8">
                        <ScheduleGrid />
                        <hr className="dark:border-gray-700" />
                        <EmergencyBlocks />
                    </div>
                )}
                {activeTab === 'services' && <ServicesManager />}
                {activeTab === 'staff' && <StaffManager />}
                {activeTab === 'reviews' && <ReviewsList />}
            </div>
        </DashboardShell>
    );
}