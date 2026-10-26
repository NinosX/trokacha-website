import { routing } from '@/i18n/routing';

/** Domaine canonique du site (sans www). */
export const SITE_URL = 'https://trokacha.com';

/**
 * URL absolue d'une page dans une langue, au format des URLs du site :
 * l'arabe (langue par défaut) n'a PAS de préfixe, les autres en ont un.
 *   localizedUrl('ar', '/privacy') → https://trokacha.com/privacy
 *   localizedUrl('fr', '/privacy') → https://trokacha.com/fr/privacy
 *   localizedUrl('fr', '')         → https://trokacha.com/fr
 * @param path chemin SANS préfixe de langue, '' pour l'accueil.
 */
export function localizedUrl(locale: string, path = ''): string {
  const p = path === '/' ? '' : path;
  if (locale === routing.defaultLocale) return p ? `${SITE_URL}${p}` : SITE_URL;
  return `${SITE_URL}/${locale}${p}`;
}

/**
 * `alternates` Next.js d'une page : canonical = l'URL de la langue affichée,
 * hreflang = les 4 langues + x-default → arabe (langue par défaut).
 *
 * À déclarer PAGE PAR PAGE : le layout racine n'en déclare plus, sinon toutes
 * les pages héritaient du canonical de l'accueil.
 */
export function localeAlternates(locale: string, path = '') {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localizedUrl(l, path);
  languages['x-default'] = localizedUrl(routing.defaultLocale, path);
  return { canonical: localizedUrl(locale, path), languages };
}

/** Locale OpenGraph (kab n'a pas de code OG reconnu : repli sur le français). */
export function ogLocale(locale: string): string {
  if (locale === 'ar') return 'ar_DZ';
  if (locale === 'en') return 'en_US';
  return 'fr_FR';
}
