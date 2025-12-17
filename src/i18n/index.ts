import { fallbackLng, languages, type Language } from './settings';

// Simple translation function for server components
export async function useTranslation(lng: Language = fallbackLng) {
    // Dynamically import the translations
    let translations: any;
    try {
        translations = await import(`./locales/${lng}.json`);
    } catch {
        translations = await import(`./locales/${fallbackLng}.json`);
    }

    return {
        t: (key: string, params?: Record<string, string | number>) => {
            const keys = key.split('.');
            let value: any = translations.default || translations;

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
        },
        lng,
    };
}
