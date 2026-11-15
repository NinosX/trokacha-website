// lib/pro/agency/blocks.ts
// =============================================================================
// DATES BLOQUÉES D'UN BIEN (bureau web, 15/11) : module PUR. Mêmes mots et même
// règle que l'application (`src/v2/domain/proBlocks.ts`, `blockRangeText`) :
// fin EXCLUSIVE, dernier jour bloqué = la veille du jour libre ; la raison est
// privée (lue sur l'article, jamais sur l'annonce).
// =============================================================================

import { addDays } from '@/lib/pro-core';
import type { ProTexts } from '../texts';
import { shortDay } from './text';
import type { BlockedRange, BlockReason, RentalKind, RentalUnit } from './units';

/** « Bloqué du lun. 23 au mar. 24 nov. » ou « Bloqué le lun. 23 nov. ». */
export function blockRangeText(range: { start: string; end: string }, x: ProTexts): string {
  const last = addDays(range.end, -1);
  if (last <= range.start) return x.t('ag.unit.blockRangeOne', { date: shortDay(range.start, x, true) });
  const sameMonth = range.start.slice(0, 7) === last.slice(0, 7);
  return x.t('ag.unit.blockRange', { start: shortDay(range.start, x, !sameMonth), end: shortDay(last, x, true) });
}

/** « Garage » d'une voiture, « Travaux » d'un logement. */
export function blockReasonText(reason: BlockReason, kind: RentalKind, x: ProTexts): string {
  return x.t(`ag.unit.blockReason.${reason === 'garage' && kind === 'immo' ? 'travaux' : reason}`);
}

/** Le blocage d'où vient une barre du planning (rognée au mois affiché). */
export function blockOfBar(unit: Pick<RentalUnit, 'blockedRanges'>, bar: { start: string; end: string }): BlockedRange | null {
  return unit.blockedRanges.find((b) => b.start <= bar.start && bar.end <= b.end) ?? null;
}

/**
 * Un clic dans le calendrier des dates. Réservation : premier jour puis jour du retour (fin
 * exclusive). Blocage (`inclusive`) : premier puis DERNIER jour bloqué ; le seul jour retouché
 * s'efface, le dernier jour retouché laisse le premier seul. Rend `[début, fin]`.
 */
export function pickRangeDay(start: string | null, end: string | null, day: string, inclusive: boolean): [string | null, string | null] {
  if (inclusive) {
    if (start && !end && day === start) return [null, null];
    if (start && end && day === end) return [start, null];
    if (start && day > start) return [start, day];
    return [day, null];
  }
  if (!start || end || day <= start) return [day, null];
  return [start, day];
}

/** La plage enregistrée d'un blocage choisi (fin exclusive : le lendemain du dernier jour), `null` : rien. */
export function blockRangeOfPick(start: string | null, last: string | null): { start: string; end: string } | null {
  return start ? { start, end: addDays(last ?? start, 1) } : null;
}
