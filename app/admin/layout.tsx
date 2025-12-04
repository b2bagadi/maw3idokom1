import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Check if user is logged in and is Super Admin
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        redirect('/admin/login');
    }

    return <>{children}</>;
}
