import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed' // Pas de prefixe pour la langue par defaut (fr)
});

export type Locale = (typeof routing.locales)[number];
