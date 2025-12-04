'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === locale) return;

        startTransition(() => {
            // Replace the locale in the pathname
            const newPathname = pathname.replace(
                `/${locale}`,
                `/${newLocale}`
            );
            router.push(newPathname);
        });
    };

    const currentLanguage = languages.find((lang) => lang.code === locale);

    return (
        <div className="relative group">
            <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span>{currentLanguage?.flag}</span>
                <span className="hidden sm:inline">{currentLanguage?.name}</span>
            </Button>

            {/* Dropdown */}
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        disabled={isPending}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${lang.code === locale ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                            }`}
                    >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
