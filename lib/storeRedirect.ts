import { APP_STORE_URL, PLAY_STORE_URL } from './openInApp';

/** Lien court de téléchargement : `https://trokacha.com/app`. */
export const STORE_LINK_PATH = '/app';

const TAG = /^[a-z0-9_-]{1,40}$/;

function tag(value: string | null, fallback: string): string {
  const cleaned = (value ?? '').toLowerCase();
  return TAG.test(cleaned) ? cleaned : fallback;
}

/**
 * Où envoyer un visiteur de `/app` : le store de son appareil, ou `null`
 * (ordinateur, robot) pour le laisser sur l'accueil du site.
 *
 * `?c=` nomme la campagne et `?s=` la source (`/app?s=meta&c=v00`). Ils partent
 * dans le `referrer` du Play Store, que la Play Console restitue dans son
 * rapport d'acquisition. L'App Store n'a pas d'équivalent sans jeton de
 * fournisseur (`pt`) : le lien iPhone reste nu.
 */
export function storeUrlFor(userAgent: string, params: URLSearchParams): string | null {
  const ua = userAgent.toLowerCase();
  if (/android/.test(ua)) {
    const referrer =
      `utm_source=${tag(params.get('s'), 'lien')}` +
      `&utm_medium=app&utm_campaign=${tag(params.get('c'), 'aucune')}`;
    return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
  }
  if (/iphone|ipad|ipod/.test(ua)) return APP_STORE_URL;
  return null;
}
