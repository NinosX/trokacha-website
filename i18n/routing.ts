import { defineRouting } from 'next-intl/routing';

// Arabe par défaut (décision Lyes 08/09, confirmée 26/10) :
// - `/x` = arabe, les autres langues sont préfixées (`/fr/x`, `/en/x`, `/kab/x`).
// - Pas de détection Accept-Language : un Algérien sur un PC en français doit
//   tomber sur l'arabe.
// - Le seul signal qui l'emporte sur l'arabe pour une URL sans préfixe est un
//   CHOIX MANUEL fait avec le sélecteur de langue (cookie LOCALE_COOKIE). Ce
//   cookie est géré à la main (middleware.ts + components/Navbar.tsx), pas par
//   next-intl : son middleware le réécrirait à chaque visite d'une URL
//   préfixée, ce qui confondrait « page visitée » et « langue choisie ».
export const routing = defineRouting({
  locales: ['ar', 'fr', 'en', 'kab'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed', // Pas de préfixe pour la langue par défaut (ar)
  localeDetection: false,
  localeCookie: false
});

export type Locale = (typeof routing.locales)[number];

/** Cookie du choix de langue manuel (même nom que celui de next-intl). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Durée de vie du choix manuel : un an. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (routing.locales as readonly string[]).includes(value);
}
