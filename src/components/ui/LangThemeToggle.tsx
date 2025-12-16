'use client';

import { useTheme } from 'next-themes';
import { useClientTranslation } from '@/i18n/client';
import { Button } from './Button';
import { Moon, Sun, Languages } from 'lucide-react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

export function LangThemeToggle() {
    const { theme, setTheme } = useTheme();
    const { lng, changeLang } = useClientTranslation();

    const supportedLangs = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    ];

    const currentFlag = supportedLangs.find(l => l.code === lng)?.flag || '🌐';

    return (
        <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button as={Fragment}>
                    <Button variant="ghost" size="sm" className="px-2 h-9 w-9">
                        <span className="text-xl leading-none">{currentFlag}</span>
                    </Button>
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="px-1 py-1">
                            {supportedLangs.map((lang) => (
                                <Menu.Item key={lang.code}>
                                    {({ active }) => (
                                        <button
                                            onClick={() => changeLang(lang.code as any)}
                                            className={cn(
                                                active ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100',
                                                'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                            )}
                                        >
                                            <span className="mr-3 text-lg">{lang.flag}</span>
                                            {lang.label}
                                        </button>
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
