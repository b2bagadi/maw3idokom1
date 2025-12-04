'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    Building2,
    Calendar,
    Star,
    Settings,
    LogOut
} from 'lucide-react';
import { Button } from './ui/button';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Businesses', href: '/admin/businesses', icon: Building2 },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Maw3idokom
                </h1>
                <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export function AdminDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto">
                {children}
            </main>
        </div>
    );
}
