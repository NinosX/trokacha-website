// lib/pro/shared/format.ts
// =============================================================================
// Petits formats communs aux volets Clients, Caisse et Import (module PUR).
// =============================================================================

/**
 * Numéro algérien lisible : « +213771554433 » → « 0771 55 44 33 », « +21321234567 »
 * → « 021 23 45 67 ». Un numéro d'un autre pays reste tel quel.
 */
export function displayPhone(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  const national = digits.startsWith('213') ? `0${digits.slice(3)}` : digits.startsWith('0') ? digits : null;
  if (!national) return tel;
  if (national.length === 10) return `${national.slice(0, 4)} ${national.slice(4, 6)} ${national.slice(6, 8)} ${national.slice(8)}`;
  if (national.length === 9) return `${national.slice(0, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7)}`;
  return tel;
}

/** Chiffres d'un numéro sous la forme internationale algérienne (« 0550… » → « 213550… »). */
export function phoneDigitsIntl(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `213${digits.slice(1)}`;
  return digits;
}

/** Texte comparable pour une recherche : casse, accents, tatweel et espaces ignorés. */
export function searchKey(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯـ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const ALGIERS_TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Algiers' });

/** Heure d'Alger (« 14:05 ») d'un instant en millisecondes. */
export function algiersTime(ms: number): string {
  return ALGIERS_TIME.format(new Date(ms));
}
