// COPIE GÉNÉRÉE depuis functions/src/pro/core/dates.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/dates.ts
 *
 * Jours et plages du carnet. Mêmes règles que `utils/rental.ts` et
 * `functions/src/utils/rentalDates.ts` (fin EXCLUSIVE, comparaison lexicographique,
 * zéro fuseau sur les jours). Copié dans l'application et le site : voir `types.ts`.
 */

export interface Plage {
  start: string;
  end: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEURE_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Bornes d'un jour du carnet : rien avant 2000 ni après 2100 (relecture de Main, M1 : « 9999 » passait). */
export const JOUR_MIN = '2000-01-01';
export const JOUR_MAX = '2100-12-31';

export function isValidDay(v: unknown): v is string {
  return typeof v === 'string' && DATE_RE.test(v) && v >= JOUR_MIN && v <= JOUR_MAX && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

export function isValidHeure(v: unknown): v is string {
  return typeof v === 'string' && HEURE_RE.test(v);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS);
}

export function plagesSeChevauchent(a: Plage, b: Plage): boolean {
  return a.start < b.end && b.start < a.end;
}

export function chevaucheUne(plage: Plage, plages: readonly (Plage | null | undefined)[] | null | undefined): boolean {
  if (!plages) return false;
  return plages.some((p) => !!p && isValidDay(p.start) && isValidDay(p.end) && plagesSeChevauchent(plage, p));
}

/** « Aujourd'hui » au sens du marché (Alger), pas de l'appareil. */
export function aujourdhuiAlger(nowMs: number = Date.now()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date(nowMs));
  } catch {
    // Alger = UTC+1 toute l'année (pas d'heure d'été).
    return new Date(nowMs + 60 * 60 * 1000).toISOString().slice(0, 10);
  }
}

/** Jour d'Alger d'un instant (pour ranger un paiement dans `jours/{jour}`). */
export function jourAlgerDe(ms: number): string {
  return aujourdhuiAlger(ms);
}
