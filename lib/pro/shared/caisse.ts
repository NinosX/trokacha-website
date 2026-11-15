// lib/pro/shared/caisse.ts
// =============================================================================
// VOLET CAISSE du bureau (module PUR) : période choisie, totaux des jours
// (`jours/{YYYY-MM-DD}`), mouvements (`caisse/{id}`, un par paiement,
// remboursement ou part gardée d'une caution) et export en tableur.
//
// Les totaux viennent des agrégats du jour, écrits par le serveur dans la même
// transaction que chaque mouvement : le net (`encaisse`), le détail par moyen
// et par membre, le rendu (`rembourse`) et le gardé (`retenu`) à part.
// =============================================================================

import { addDays, daysBetween, MOYENS_PAIEMENT, type MoyenPaiement, type NatureMouvement } from '@/lib/pro-core';
import { isRecord, readMillis, readNumber, readString } from '../carnet';
import { algiersTime } from './format';

export type RangeKind = 'jour' | 'semaine' | 'mois' | 'perso';

/** Une période personnalisée ne dépasse pas trois mois (lecture d'un jour par document). */
export const RANGE_MAX_DAYS = 92;

export interface DayRange {
  start: string;
  /** Inclus. */
  end: string;
}

/** Période d'une sorte, finissant aujourd'hui (jour d'Alger). */
export function rangeOf(kind: Exclude<RangeKind, 'perso'>, today: string): DayRange {
  if (kind === 'jour') return { start: today, end: today };
  if (kind === 'semaine') return { start: addDays(today, -6), end: today };
  return { start: `${today.slice(0, 8)}01`, end: today };
}

/** Période personnalisée remise d'aplomb : dans l'ordre, pas après aujourd'hui, 92 jours au plus. */
export function clampRange(start: string, end: string, today: string): DayRange {
  let a = start <= end ? start : end;
  let b = start <= end ? end : start;
  if (b > today) b = today;
  if (a > b) a = b;
  if (daysBetween(a, b) + 1 > RANGE_MAX_DAYS) a = addDays(b, -(RANGE_MAX_DAYS - 1));
  return { start: a, end: b };
}

/** Jours de la période, du plus récent au plus ancien. */
export function daysOfRange(range: DayRange): string[] {
  const out: string[] = [];
  for (let d = range.end; d >= range.start && out.length < RANGE_MAX_DAYS; d = addDays(d, -1)) out.push(d);
  return out;
}

/** Agrégat d'un jour tel que la caisse le montre. */
export interface CaisseJour {
  jour: string;
  encaisse: number;
  encaissements: Partial<Record<MoyenPaiement, number>>;
  parMembre: Record<string, number>;
  rembourse: number;
  retenu: number;
  operations: number;
  chiffre: number;
}

const int = (v: unknown): number => {
  const n = readNumber(v);
  return n === null ? 0 : Math.round(n);
};

export function readCaisseJour(jour: string, data: unknown): CaisseJour {
  const d = isRecord(data) ? data : {};
  const encaissements: Partial<Record<MoyenPaiement, number>> = {};
  if (isRecord(d.encaissements)) for (const [m, v] of Object.entries(d.encaissements)) encaissements[m as MoyenPaiement] = int(v);
  const parMembre: Record<string, number> = {};
  if (isRecord(d.parMembre)) for (const [uid, v] of Object.entries(d.parMembre)) parMembre[uid] = int(v);
  return { jour, encaisse: int(d.encaisse), encaissements, parMembre, rembourse: int(d.rembourse), retenu: int(d.retenu), operations: int(d.operations), chiffre: int(d.chiffre) };
}

export interface CaisseTotals extends Omit<CaisseJour, 'jour'> {
  jours: number;
}

/** Totaux de la période (jours sans document : vides). */
export function sumJours(jours: readonly CaisseJour[]): CaisseTotals {
  const out: CaisseTotals = { jours: jours.length, encaisse: 0, encaissements: {}, parMembre: {}, rembourse: 0, retenu: 0, operations: 0, chiffre: 0 };
  for (const j of jours) {
    out.encaisse += j.encaisse;
    out.rembourse += j.rembourse;
    out.retenu += j.retenu;
    out.operations += j.operations;
    out.chiffre += j.chiffre;
    for (const [m, v] of Object.entries(j.encaissements)) out.encaissements[m as MoyenPaiement] = (out.encaissements[m as MoyenPaiement] ?? 0) + (v ?? 0);
    for (const [uid, v] of Object.entries(j.parMembre)) out.parMembre[uid] = (out.parMembre[uid] ?? 0) + v;
  }
  return out;
}

/** Moyens de la période, dans l'ordre de l'application, ceux à zéro écartés. */
export function moyensOf(totals: Pick<CaisseTotals, 'encaissements'>): { moyen: MoyenPaiement; montant: number }[] {
  const known = MOYENS_PAIEMENT.filter((m) => (totals.encaissements[m] ?? 0) !== 0).map((moyen) => ({ moyen, montant: totals.encaissements[moyen] ?? 0 }));
  const others = (Object.keys(totals.encaissements) as MoyenPaiement[])
    .filter((m) => !MOYENS_PAIEMENT.includes(m) && (totals.encaissements[m] ?? 0) !== 0)
    .map((moyen) => ({ moyen, montant: totals.encaissements[moyen] ?? 0 }));
  return [...known, ...others];
}

/** Un mouvement de caisse lu sans jamais lever ; `null` si le document n'en est pas un. */
export interface CaisseMouvement {
  id: string;
  jour: string;
  at: number;
  nature: NatureMouvement;
  moyen: MoyenPaiement;
  montant: number;
  opId: string;
  itemTitre: string;
  clientNom: string | null;
  par: string;
}

const NATURES: ReadonlySet<string> = new Set(['paiement', 'remboursement', 'retenue']);

export function readMouvement(id: string, data: unknown): CaisseMouvement | null {
  if (!isRecord(data)) return null;
  const jour = readString(data.jour);
  const nature = typeof data.nature === 'string' && NATURES.has(data.nature) ? (data.nature as NatureMouvement) : null;
  const opId = readString(data.opId);
  if (!jour || !nature || !opId) return null;
  return {
    id,
    jour,
    at: readMillis(data.at) ?? 0,
    nature,
    moyen: (readString(data.moyen) ?? 'especes') as MoyenPaiement,
    montant: int(data.montant),
    opId,
    itemTitre: readString(data.itemTitre) ?? '',
    clientNom: readString(data.clientNom),
    par: readString(data.par) ?? '',
  };
}

/** Plus récents d'abord. */
export function sortMouvements(list: readonly CaisseMouvement[]): CaisseMouvement[] {
  return [...list].sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
}

/** Libellés de l'export, dans la langue du bureau. */
export interface CsvLabels {
  headers: [string, string, string, string, string, string, string, string];
  nature: Record<NatureMouvement, string>;
  moyen: (m: MoyenPaiement) => string;
  par: (uid: string) => string;
}

function cell(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Mouvements en tableur : séparateur « ; » (Excel réglé en français, le cas courant en
 * Algérie), précédé du BOM UTF-8 pour qu'Excel lise l'arabe. Montants en dinars, signés
 * (un remboursement est négatif), sans séparateur de milliers.
 */
export function mouvementsCsv(list: readonly CaisseMouvement[], labels: CsvLabels): string {
  const lines = [labels.headers.map(cell).join(';')];
  for (const m of [...list].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))) {
    lines.push(
      [m.jour, m.at ? algiersTime(m.at) : '', labels.nature[m.nature], labels.moyen(m.moyen), m.montant, m.itemTitre, m.clientNom ?? '', labels.par(m.par)]
        .map(cell)
        .join(';'),
    );
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}
