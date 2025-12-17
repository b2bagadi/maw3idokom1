'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Language } from './settings';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import arTranslations from './locales/ar.json';

const translations = {
    en: enTranslations,
    fr: frTranslations,
    ar: arTranslations,
};

interface I18nContextType {
    lng: Language;
    t: (key: string, params?: Record<string, string | number>) => string;
    changeLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, initialLang = 'fr' }: { children: ReactNode; initialLang?: Language }) {
    const [lng, setLng] = useState<Language>(initialLang);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load language from localStorage on mount
        const savedLang = localStorage.getItem('app-language') as Language | null;
        if (savedLang && (savedLang === 'en' || savedLang === 'fr' || savedLang === 'ar')) {
            setLng(savedLang);
            document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = savedLang;
        } else {
            // Set French as default if no saved language
            setLng('fr');
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'fr';
            localStorage.setItem('app-language', 'fr');
        }
        setMounted(true);
    }, []);

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[lng];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        // Replace params
        if (params && typeof value === 'string') {
            Object.entries(params).forEach(([param, val]) => {
                value = value.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
            });
        }

        return value || key;
    };

    const changeLang = (lang: Language) => {
        setLng(lang);
        // Save to localStorage
        localStorage.setItem('app-language', lang);
        // Update HTML dir attribute for RTL
        if (typeof document !== 'undefined') {
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        }
    };

    // Don't render children until language is loaded from localStorage
    if (!mounted) {
        return null;
    }

    return <I18nContext.Provider value={{ lng, t, changeLang }}>{children}</I18nContext.Provider>;
}

export function useClientTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useClientTranslation must be used within I18nProvider');
    }
    return context;
}