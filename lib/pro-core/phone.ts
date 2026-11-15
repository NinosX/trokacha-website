// COPIE GÉNÉRÉE depuis functions/src/pro/core/phone.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/phone.ts
 *
 * Numéro de téléphone d'un client : forme internationale, et identifiant de fiche
 * (un même numéro retombe toujours sur la même fiche). Copié dans l'application et
 * le site : voir `types.ts`.
 */

/**
 * « 0550 12 34 56 », « 550123456 », « +213 550 12 34 56 », « 00213550123456 »
 * → « +213550123456 ». Un numéro étranger (diaspora) garde son indicatif :
 * « +33 6 12 34 56 78 » → « +33612345678 ». `null` si illisible.
 */
export function telInternational(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[\s.\-()/]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('+')) {
    const digits = s.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return null;
    if (digits.startsWith('2130')) return telInternational(`0${digits.slice(4)}`);
    return `+${digits}`;
  }
  if (!/^\d+$/.test(s)) return null;
  // Algérie : 0 + 9 chiffres (mobiles 05, 06, 07 ; fixes 02 à 04).
  if (/^0[2-7]\d{8}$/.test(s)) return `+213${s.slice(1)}`;
  if (/^[5-7]\d{8}$/.test(s)) return `+213${s}`;
  // Fixe à 8 chiffres après le 0 (ancien format).
  if (/^0[2-4]\d{7}$/.test(s)) return `+213${s.slice(1)}`;
  return null;
}

/** Identifiant de fiche client tiré du numéro (`tel_213550123456`). */
export function clientIdDuTel(tel: string): string {
  return `tel_${tel.replace(/\D/g, '')}`;
}

const CLIENT_ID_RE = /^(tel_\d{8,15}|cl_[A-Za-z0-9]{8,40}|uid_[A-Za-z0-9]{6,128})$/;

export function isClientId(v: unknown): v is string {
  return typeof v === 'string' && CLIENT_ID_RE.test(v);
}

/** Fiche d'un membre Trokacha (opération venue de la marketplace). */
export function clientIdDuMembre(uid: string): string {
  return `uid_${uid}`;
}
