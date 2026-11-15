// lib/pro/agency/text.ts
// =============================================================================
// Dates et montants du volet agence, avec les mots de l'application (clés
// `ag.*` de `lib/pro/texts/agency.ts`, recopiées de `v2.pro.*`). PORT de
// `src/v2/screens/pro/agencyText.ts`. Module PUR.
// =============================================================================

import { errorReason } from './errors';
import { groupDigits } from '../shared/format';
import type { ProTexts } from '../texts';
import type { RentalKind } from './units';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;

function partsOf(iso: string): { weekday: (typeof WEEKDAYS)[number]; day: number; month: (typeof MONTHS)[number]; year: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (!Number.isFinite(date.getTime())) return null;
  return { weekday: WEEKDAYS[date.getUTCDay()], day: date.getUTCDate(), month: MONTHS[date.getUTCMonth()], year: date.getUTCFullYear() };
}

/** « M » (mardi) : en-tête des colonnes du planning. */
export function weekdayLetter(iso: string, x: ProTexts): string {
  const p = partsOf(iso);
  return p ? x.t(`ag.planning.weekdayLetter.${p.weekday}`) : '';
}

/** « ven. 20 » ou, avec le mois, « lun. 23 nov. ». */
export function shortDay(iso: string, x: ProTexts, withMonth: boolean): string {
  const p = partsOf(iso);
  if (!p) return iso;
  const weekday = x.t(`ag.planning.weekdayShort.${p.weekday}`);
  if (!withMonth) return x.t('ag.planning.dayShort', { weekday, day: p.day });
  return x.t('ag.planning.dayShortMonth', { weekday, day: p.day, month: x.t(`ag.planning.monthShort.${p.month}`) });
}

/** « ven. 20 au lun. 23 nov. » (le jour du retour en second : fin EXCLUSIVE). */
export function shortRange(start: string, end: string, x: ProTexts): string {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return x.t('ag.requests.range', { start: shortDay(start, x, !sameMonth), end: shortDay(end, x, true) });
}

/** « Du jeu. 19 au dim. 22 nov. ». */
export function bookingRangeText(start: string, end: string, x: ProTexts): string {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return x.t('ag.booking.datesRange', { start: shortDay(start, x, !sameMonth), end: shortDay(end, x, true) });
}

/** « 3 jours » (voiture) ou « 3 nuits » (logement). */
export function lengthText(count: number, kind: RentalKind | null | undefined, x: ProTexts): string {
  return x.tp(kind === 'immo' ? 'ag.booking.nights' : 'ag.booking.days', count);
}

/** « Novembre 2026 » (nom du mois, majuscule en tête hors arabe, et l'année). */
export function monthTitle(iso: string, x: ProTexts): string {
  const p = partsOf(iso);
  if (!p) return '';
  const name = x.t(`ag.monthName.${p.month}`);
  const cap = x.locale === 'ar' ? name : name.charAt(0).toUpperCase() + name.slice(1);
  return `${cap} ${p.year}`;
}

/** « 71 % loué · 486 000 DA ». */
export function monthRest(occupancyPct: number, revenue: number, x: ProTexts): string {
  return x.t('ag.planning.monthRest', { pct: Math.max(0, Math.round(occupancyPct)), amount: x.money(revenue) });
}


/** « 3 × 6 500 = ». */
export function priceCalcText(days: number, perDay: number, x: ProTexts): string {
  return x.t('ag.booking.priceCalc', { days, perDay: groupDigits(perDay) });
}

/** « 6 500 DA/j » ou « 9 000 DA/nuit ». */
export function perDayText(amount: number, kind: RentalKind | null | undefined, x: ProTexts): string {
  return x.t(kind === 'immo' ? 'ag.unit.perNight' : 'ag.unit.perDay', { amount: x.money(amount) });
}

/** Le refus d'une callable dit avec les mots de l'application. */
export function errorText(error: unknown, x: ProTexts): string {
  const reason = errorReason(error);
  if (reason === 'offline') return x.t('ag.errors.offline');
  const key = `ag.errors.${reason}`;
  const text = x.t(key);
  return text && text !== key ? text : x.t('ag.errors.generic');
}
