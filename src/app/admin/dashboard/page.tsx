'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountsTable from '@/components/admin/AccountsTable';
import SubscriptionsTable from '@/components/admin/SubscriptionsTable';
import GlobalSettings from '@/components/admin/GlobalSettings';
import CategoriesManager from '@/components/admin/CategoriesManager';
import MessagesManager from '@/components/admin/MessagesManager';
import AdminChat from '@/components/admin/AdminChat';
import AdminProfile from '@/components/admin/AdminProfile';
import AdminBookingsTable from '@/components/admin/AdminBookingsTable';
import RatingsManager from '@/components/admin/RatingsManager';
import { useClientTranslation } from '@/i18n/client';
import { Users, CreditCard, Settings, LayoutDashboard, MessageSquare, UserCog, Mail, CalendarCheck, Star } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('accounts');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const { t } = useClientTranslation();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

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
        { id: 'accounts', label: t('admin.accounts'), icon: Users },
        { id: 'bookings', label: t('business.bookings'), icon: CalendarCheck },
        { id: 'subscriptions', label: t('admin.subscriptions'), icon: CreditCard },
        { id: 'chats', label: t('admin.chats'), icon: MessageSquare },
        { id: 'messages', label: t('admin.contactMessages'), icon: Mail },
        { id: 'categories', label: t('admin.categories'), icon: LayoutDashboard },
        { id: 'ratings', label: t('common.rating'), icon: Star },
        { id: 'settings', label: t('admin.settings'), icon: Settings },
        { id: 'profile', label: t('admin.account'), icon: UserCog },
    ];

    return (
        <DashboardShell
            title={t('admin.portal')}
            subtitle={t('admin.dashboard')}
            logoUrl={logoUrl}
            icon={LayoutDashboard}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[600px]">
                {activeTab === 'accounts' && <AccountsTable />}
                {activeTab === 'bookings' && <AdminBookingsTable />}
                {activeTab === 'subscriptions' && <SubscriptionsTable />}
                {activeTab === 'chats' && <AdminChat />}
                {activeTab === 'messages' && <MessagesManager />}
                {activeTab === 'settings' && <GlobalSettings />}
                {activeTab === 'categories' && <CategoriesManager />}
                {activeTab === 'profile' && <AdminProfile />}
                {activeTab === 'ratings' && <RatingsManager />}
            </div>
        </DashboardShell>
    );
}