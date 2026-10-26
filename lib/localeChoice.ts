import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from '@/i18n/routing';

/**
 * Mémorise le choix de langue fait avec le sélecteur (cookie lu par
 * middleware.ts). C'est le SEUL endroit qui écrit ce cookie : une URL sans
 * préfixe reste en arabe tant que le visiteur n'a pas choisi autre chose.
 */
export function rememberLocaleChoice(locale: Locale): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
