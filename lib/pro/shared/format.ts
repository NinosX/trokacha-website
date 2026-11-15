// lib/pro/shared/format.ts
// =============================================================================
// Petits formats communs au bureau pro : agence, boutique, clients, caisse, import
// (module PUR).
// =============================================================================

import { telInternational } from '@/lib/pro-core';

/**
 * Numéro lisible, LE format du bureau (agence, boutique, clients, caisse) : « +213771554433 »
 * ou « 0771554433 » → « 0771 55 44 33 », un fixe « 021 23 45 67 ». Un numéro étranger
 * (diaspora) garde son indicatif (« +33612345678 »). Illisible : rendu tel quel.
 * À l'écran, toujours dans un isolat gauche-à-droite (`<Ltr>`), sinon une page arabe
 * affiche « 213771554433+ ».
 */
export function displayPhone(tel: string | null | undefined): string | null {
  const raw = tel?.trim();
  if (!raw) return null;
  const intl = telInternational(raw);
  if (!intl) return raw;
  if (!intl.startsWith('+213')) return intl;
  const local = `0${intl.slice(4)}`;
  if (local.length === 10) return `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
  if (local.length === 9) return `${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  return local;
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
