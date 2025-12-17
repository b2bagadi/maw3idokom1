"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { LucideIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
    id: string;
    label: string;
    icon: LucideIcon;
};

type DashboardShellProps = {
    title: string;
    subtitle?: string;
    logoUrl?: string | null;
    icon?: LucideIcon;
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    userName?: string | null;
    userEmail?: string | null;
    rightSlot?: ReactNode;
    children: ReactNode;
};

export function DashboardShell({
    title,
    subtitle,
    logoUrl,
    icon,
    tabs,
    activeTab,
    onTabChange,
    userName,
    userEmail,
    rightSlot,
    children,
}: DashboardShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const Icon = icon;

    const renderTabs = (onClick?: () => void) => (
        <nav className="space-y-2">
            {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            console.log('Tab clicked:', tab.id);
                            onTabChange(tab.id);
                            if (onClick) onClick();
                        }}
                        className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                            isActive
                                ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
                                : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <span className="flex items-center gap-3 truncate">
                            <TabIcon size={18} />
                            <span className="truncate">{tab.label}</span>
                        </span>
                        <span
                            className={cn(
                                "h-2 w-2 rounded-full",
                                isActive ? "bg-white/80" : "bg-gray-300 dark:bg-gray-600"
                            )}
                        />
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between gap-3">
                        <Link href="/" className="flex items-center gap-3 min-w-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={title}
                                    className="h-10 w-10 rounded-2xl object-cover border border-gray-200 dark:border-gray-800"
                                />
                            ) : (
                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-500 dark:to-primary-600 flex items-center justify-center text-white shadow-inner">
                                    {Icon ? <Icon size={20} /> : <span className="text-sm font-semibold">{title.slice(0, 1)}</span>}
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</span>
                                {subtitle && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>}
                            </div>
                        </Link>
                          <div className="flex items-center gap-3">
                              {(userName || userEmail) && (
                                  <div className="text-right hidden sm:block min-w-[140px]">
                                      {userName && <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{userName}</div>}
                                      {userEmail && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>}
                                  </div>
                              )}
                              {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
                              <button
                                type="button"
                                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
                                onClick={() => setMobileOpen((prev) => !prev)}
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="lg:hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <div className="px-4 py-3">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Menu</span>
                            </div>
                            {mobileOpen && (
                                <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-4">
                                    {renderTabs(() => setMobileOpen(false))}
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:block sticky top-28">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-center">
                                    <span className="text-xs font-semibold tracking-[0.12em] uppercase text-gray-500 dark:text-gray-400">Menu</span>
                                </div>
                                <div className="p-3">
                                    {renderTabs()}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="flex-1 min-w-0 space-y-6">
                        {children}
                    </section>
                </div>
            </main>
        </div>
    );
}