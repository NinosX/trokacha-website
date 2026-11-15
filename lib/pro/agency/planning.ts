// lib/pro/agency/planning.ts
// =============================================================================
// PLANNING DU MOIS DE L'AGENCE (bureau web) : module PUR. PORT de
// `src/v2/domain/proPlanning.ts` (application Trokacha, maquette L2) avec une
// fenêtre d'un MOIS entier (le téléphone montre 30 jours à partir d'aujourd'hui).
// Mêmes barres, mêmes règles : à garder aligné avec l'application.
// =============================================================================
//
// Une ligne par BIEN du catalogue (voiture, logement), publié ou non : le carnet
// sert même sans annonce. Sur chaque ligne :
//   • une RÉSERVATION du carnet (téléphone, comptoir, WhatsApp… et les échanges
//     Trokacha recopiés) : le prénom du client, l'avion si remise à l'aéroport,
//     le combiné si notée hors Trokacha, orange si en retard ;
//   • un BLOCAGE du pro : hachuré, « Bloqué » (la note privée n'est pas montrée) ;
//   • une DEMANDE Trokacha en attente : pointillés.
// Les barres qui se chevauchent passent sur une voie de plus.
// En tête : « Novembre · 71 % loué · 486 000 DA » (jours occupés / jours possibles
// du mois affiché ; chiffre = total des réservations qui commencent dans le mois,
// annulées exclues).
// =============================================================================

import { addDays, daysBetween, plageOccupee, type Operation } from '@/lib/pro-core';
import { shortClientName } from '../today';
import type { RentalUnit } from './units';

export type PlanningBarKind = 'booking' | 'blocked' | 'request';

export interface PlanningBar {
  key: string;
  kind: PlanningBarKind;
  /** Premier jour affiché (rogné au début du mois). */
  start: string;
  /** Fin EXCLUSIVE affichée (rognée à la fin du mois). */
  end: string;
  clippedStart: boolean;
  clippedEnd: boolean;
  label: string;
  lane: number;
  opId: string | null;
  offTrokacha: boolean;
  airport: boolean;
  late: boolean;
  returnsToday: boolean;
  requestId: string | null;
  /** Colonnes [startIndex, endIndex) dans le mois. */
  startIndex: number;
  endIndex: number;
}

export interface PlanningRow {
  unit: RentalUnit;
  bars: PlanningBar[];
  lanes: number;
}

export interface PlanningRequest {
  id: string;
  itemId: string;
  start: string;
  end: string;
  name: string | null;
}

export interface MonthPlanning {
  /** Premier jour du mois affiché. */
  first: string;
  /** Premier jour du mois suivant (fin exclusive). */
  next: string;
  days: string[];
  rows: PlanningRow[];
  occupancyPct: number;
  revenue: number;
}

const OPEN_RENTAL = new Set(['reservee', 'en_cours', 'rendue', 'cloturee']);

/** Bornes du mois d'un jour : [1er, 1er du mois suivant). */
export function monthBounds(day: string): { first: string; next: string } {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const first = `${day.slice(0, 7)}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return { first, next };
}

/** Premier jour du mois d'avant / d'après. */
export function shiftMonth(first: string, delta: number): string {
  const year = Number(first.slice(0, 4));
  const month = Number(first.slice(5, 7)) - 1 + delta;
  const y = year + Math.floor(month / 12);
  const m = ((month % 12) + 12) % 12;
  return `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

function clip(start: string, end: string, winStart: string, winEnd: string): { start: string; end: string; clippedStart: boolean; clippedEnd: boolean } | null {
  if (end <= winStart || start >= winEnd) return null;
  return { start: start < winStart ? winStart : start, end: end > winEnd ? winEnd : end, clippedStart: start < winStart, clippedEnd: end > winEnd };
}

/** Une barre prend la première voie libre (ordre de début). */
export function assignLanes<T extends { start: string; end: string; lane: number }>(bars: T[]): number {
  const laneEnds: string[] = [];
  const sorted = [...bars].sort((a, b) => (a.start === b.start ? (a.end < b.end ? -1 : 1) : a.start < b.start ? -1 : 1));
  for (const bar of sorted) {
    let lane = laneEnds.findIndex((end) => end <= bar.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(bar.end);
    } else laneEnds[lane] = bar.end;
    bar.lane = lane;
  }
  return Math.max(1, laneEnds.length);
}

export interface BuildMonthInput {
  units: readonly RentalUnit[];
  ops: readonly Operation[];
  requests?: readonly PlanningRequest[];
  today: string;
  /** N'importe quel jour du mois à afficher. */
  month: string;
}

export function buildMonthPlanning({ units, ops, requests = [], today, month }: BuildMonthInput): MonthPlanning {
  const { first, next } = monthBounds(month);
  const dayCount = daysBetween(first, next);
  const days = Array.from({ length: dayCount }, (_, i) => addDays(first, i));
  const opsByItem = new Map<string, Operation[]>();
  const seen = new Set<string>();
  for (const op of ops) {
    if (seen.has(op.id) || op.type !== 'location' || !OPEN_RENTAL.has(op.statut)) continue;
    seen.add(op.id);
    const list = opsByItem.get(op.itemId) ?? [];
    list.push(op);
    opsByItem.set(op.itemId, list);
  }

  const index = (day: string) => daysBetween(first, day);
  const rows: PlanningRow[] = units.map((unit) => {
    const bars: PlanningBar[] = [];
    const base = { lane: 0, opId: null, offTrokacha: false, airport: false, late: false, returnsToday: false, requestId: null };
    for (const op of opsByItem.get(unit.id) ?? []) {
      // Plage occupée (tampon de ménage compris, prolongée si encore dehors) pour une
      // réservation vivante ; la plage louée telle quelle pour une location terminée.
      const live = op.statut === 'reservee' || op.statut === 'en_cours';
      const range = live ? plageOccupee(op, today) : op.debut && op.fin ? { start: op.debut, end: op.fin } : null;
      if (!range) continue;
      const c = clip(range.start, range.end, first, next);
      if (!c) continue;
      bars.push({
        ...base,
        key: `op:${op.id}`,
        kind: 'booking',
        ...c,
        label: shortClientName(op.clientNom) ?? '',
        opId: op.id,
        offTrokacha: op.origine !== 'trokacha',
        airport: op.remise?.lieu === 'aeroport',
        late: op.statut === 'en_cours' && (op.enRetard === true || (!!op.fin && op.fin < today)),
        returnsToday: op.statut === 'en_cours' && op.fin === today,
        startIndex: index(c.start),
        endIndex: index(c.end),
      });
    }
    for (const [i, range] of unit.blockedRanges.entries()) {
      const c = clip(range.start, range.end, first, next);
      if (!c) continue;
      bars.push({ ...base, key: `bl:${range.id ?? i}`, kind: 'blocked', ...c, label: '', startIndex: index(c.start), endIndex: index(c.end) });
    }
    for (const request of requests) {
      if (request.itemId !== unit.id) continue;
      const c = clip(request.start, request.end, first, next);
      if (!c) continue;
      bars.push({
        ...base,
        key: `rq:${request.id}`,
        kind: 'request',
        ...c,
        label: shortClientName(request.name) ?? '',
        requestId: request.id,
        startIndex: index(c.start),
        endIndex: index(c.end),
      });
    }
    // Réservations et blocages d'abord, puis chaque demande sur la première voie où elle
    // ne chevauche rien (deux demandes des mêmes jours passent l'une sous l'autre).
    const firm = bars.filter((b) => b.kind !== 'request');
    const asked = bars.filter((b) => b.kind === 'request').sort((a, b) => (a.start < b.start ? -1 : 1));
    let lanes = assignLanes(firm);
    const placed: PlanningBar[] = [...firm];
    for (const r of asked) {
      let lane = 0;
      while (placed.some((o) => o.lane === lane && o.start < r.end && r.start < o.end)) lane += 1;
      r.lane = lane;
      placed.push(r);
      lanes = Math.max(lanes, lane + 1);
    }
    return { unit, bars: placed, lanes };
  });

  const metrics = monthMetrics(units, ops, first, next);
  return { first, next, days, rows, ...metrics };
}

/** Taux d'occupation et chiffre d'un mois [first, next). */
export function monthMetrics(units: readonly RentalUnit[], ops: readonly Operation[], first: string, next: string): { occupancyPct: number; revenue: number } {
  const monthDays = daysBetween(first, next);
  const unitIds = new Set(units.map((u) => u.id));
  let booked = 0;
  let revenue = 0;
  const seen = new Set<string>();
  for (const op of ops) {
    if (seen.has(op.id) || op.type !== 'location' || !OPEN_RENTAL.has(op.statut) || !op.debut || !op.fin || !unitIds.has(op.itemId)) continue;
    seen.add(op.id);
    const s = op.debut < first ? first : op.debut;
    const e = op.fin > next ? next : op.fin;
    if (s < e) booked += daysBetween(s, e);
    if (op.debut >= first && op.debut < next) revenue += op.total;
  }
  const possible = monthDays * unitIds.size;
  return { occupancyPct: possible ? Math.round((booked / possible) * 100) : 0, revenue };
}

/** La barre sous une colonne d'une ligne (n'importe quelle voie), sinon `null`. */
export function barAtColumn(row: Pick<PlanningRow, 'bars'>, column: number): PlanningBar | null {
  return row.bars.find((bar) => bar.startIndex <= column && column < bar.endIndex) ?? null;
}
