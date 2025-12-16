export const fallbackLng = 'fr';
export const languages = ['en', 'fr', 'ar'] as const;
export type Language = (typeof languages)[number];

export const defaultNS = 'common';

export function getOptions(lng: Language = fallbackLng, ns: string = defaultNS) {
    return {
        supportedLngs: languages,
        fallbackLng,
        lng,
        fallbackNS: defaultNS,
        defaultNS,
        ns,
    };
}