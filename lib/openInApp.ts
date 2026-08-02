// Ouverture de l'app Trokacha depuis le web (interstitiels de liens email,
// pages de partage d'annonce). Centralisé ici pour que TOUTES les pages aient
// le même mécanisme : avant, /ad/[id] utilisait un simple `trokacha://` sans
// `intent://` sur Android (aucun repli Play Store natif).
//
// Android : URL `intent://` — Chrome ouvre l'app si installée, sinon bascule
//           nativement sur `S.browser_fallback_url` (Play Store).
// iOS     : scheme `trokacha://` puis repli App Store après un court délai,
//           SAUF si l'onglet est passé en arrière-plan (= l'app s'est ouverte).

export const APP_STORE_URL = 'https://apps.apple.com/app/trokacha/id6740211562';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.trokacha.app';
export const ANDROID_PACKAGE = 'com.trokacha.app';

/** Délai avant le repli store sur iOS (l'app a le temps de prendre la main). */
const IOS_STORE_FALLBACK_MS = 1500;

export type MobilePlatform = 'android' | 'ios' | 'other';

export function detectPlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'other';
}

export interface OpenTrokachaAppOptions {
  /**
   * Tentative automatique au chargement (sans clic). Sur desktop il n'y a rien
   * à ouvrir → on ne fait rien. Le bouton manuel reste le chemin fiable :
   * certains navigateurs bloquent les navigations vers un scheme custom en
   * l'absence de geste utilisateur.
   */
  auto?: boolean;
}

/**
 * Tente d'ouvrir `trokacha://<deepPath>` avec repli store.
 * @param deepPath chemin SANS scheme, ex : `ad/abc123` ou `match/abc?sender=xyz`
 */
export function openTrokachaApp(deepPath: string, options?: OpenTrokachaAppOptions): void {
  if (typeof window === 'undefined') return;

  const platform = detectPlatform();

  // Auto-tentative : mobile uniquement (sur desktop, aucune app à ouvrir et on
  // ne veut surtout pas rediriger l'utilisateur vers un store).
  if (options?.auto && platform === 'other') return;

  if (platform === 'android') {
    // Pas de timeout : le repli Play Store est géré nativement par Chrome.
    window.location.href =
      `intent://${deepPath}#Intent;scheme=trokacha;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    return;
  }

  window.location.href = `trokacha://${deepPath}`;

  if (platform !== 'ios') return;
  window.setTimeout(() => {
    // Si l'app s'est ouverte, l'onglet est en arrière-plan → ne pas empiler
    // l'App Store derrière (l'utilisateur le retrouverait au retour).
    if (document.hidden || document.visibilityState === 'hidden') return;
    window.location.href = APP_STORE_URL;
  }, IOS_STORE_FALLBACK_MS);
}
