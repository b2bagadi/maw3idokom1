import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
    // A list of all locales that are supported
    locales: locales,

    // Used when no locale matches
    defaultLocale: 'en',

    // Automatically set the locale based on Accept-Language header
    localeDetection: true,
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(en|fr|ar)/:path*'],
};
