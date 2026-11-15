// lib/pro/today.ts
// =============================================================================
// « AUJOURD'HUI » DU BUREAU PRO : module PUR. PORT de `src/v2/domain/proToday.ts`
// (application Trokacha) : à garder aligné avec lui. Mêmes règles que le
// téléphone, pour que l'ordinateur du comptoir et le téléphone de l'agent
// montrent la même journée.
// =============================================================================

import { addDays, type Operation } from '@/lib/pro-core';

export type TodayKind = 'depart' | 'retour';

export interface TodayEntry {
  kind: TodayKind;
  op: Operation;
  /** 'HH:MM' (heure d'Alger) ou `null` (heure pas notée : en fin de liste). */
  heure: string | null;
}

export interface LateEntry {
  op: Operation;
  /** Jour de retour prévu (dépassé). */
  dueDay: string;
  dueHeure: string | null;
}

export interface AgencyToday {
  day: string;
  late: LateEntry[];
  entries: TodayEntry[];
  /** Réservées dont le départ aurait dû avoir lieu (avant aujourd'hui). */
  missed: Operation[];
  /** Rendues avec une caution tenue ou un reste dû. */
  toSettle: Operation[];
  tomorrowDepartures: number;
}

const byHeure = (a: { heure: string | null; op: Operation }, b: { heure: string | null; op: Operation }): number => {
  if (a.heure !== b.heure) {
    if (a.heure === null) return 1;
    if (b.heure === null) return -1;
    return a.heure < b.heure ? -1 : 1;
  }
  return a.op.itemTitre.localeCompare(b.op.itemTitre) || a.op.id.localeCompare(b.op.id);
};

/** Location encore dehors après sa fin. */
export function isLate(op: Operation, today: string): boolean {
  return op.type === 'location' && op.statut === 'en_cours' && (op.enRetard === true || (!!op.fin && op.fin < today));
}

export function buildAgencyToday(ops: readonly Operation[], today: string): AgencyToday {
  const tomorrow = addDays(today, 1);
  const late: LateEntry[] = [];
  const entries: TodayEntry[] = [];
  const missed: Operation[] = [];
  const toSettle: Operation[] = [];
  let tomorrowDepartures = 0;
  const seen = new Set<string>();
  for (const op of ops) {
    if (seen.has(op.id)) continue;
    seen.add(op.id);
    if (op.type !== 'location') continue;
    if (op.statut === 'en_cours') {
      if (isLate(op, today)) late.push({ op, dueDay: op.fin ?? today, dueHeure: op.heureFin ?? null });
      else if (op.fin === today) entries.push({ kind: 'retour', op, heure: op.heureFin ?? null });
    } else if (op.statut === 'reservee' && op.debut) {
      if (op.debut === today) entries.push({ kind: 'depart', op, heure: op.heureDebut ?? null });
      else if (op.debut < today) missed.push(op);
      else if (op.debut === tomorrow) tomorrowDepartures += 1;
    } else if (op.statut === 'rendue' && (op.garantieOuverte || op.solde > 0)) {
      toSettle.push(op);
    }
  }
  late.sort((a, b) => (a.dueDay === b.dueDay ? (a.dueHeure ?? '99') < (b.dueHeure ?? '99') ? -1 : 1 : a.dueDay < b.dueDay ? -1 : 1));
  entries.sort(byHeure);
  missed.sort((a, b) => ((a.debut ?? '') < (b.debut ?? '') ? -1 : 1));
  toSettle.sort((a, b) => b.modifieLe - a.modifieLe);
  return { day: today, late, entries, missed, toSettle, tomorrowDepartures };
}

export interface ShopToday {
  /** Mises de côté (acompte versé, retrait attendu). */
  putAside: Operation[];
  /** À expédier (vente à distance confirmée, colis pas encore remis). */
  toShip: Operation[];
  /** Expédiées : colis en route (suivi manuel). */
  shipped: Operation[];
  /** Refusées à la livraison : colis qui revient. */
  returning: Operation[];
  /** Somme due par les clients sur les ventes ouvertes. */
  dueTotal: number;
}

export function buildShopToday(ops: readonly Operation[]): ShopToday {
  const out: ShopToday = { putAside: [], toShip: [], shipped: [], returning: [], dueTotal: 0 };
  for (const op of ops) {
    if (op.type !== 'vente') continue;
    if (op.statut === 'mise_de_cote') out.putAside.push(op);
    else if (op.statut === 'a_expedier') out.toShip.push(op);
    else if (op.statut === 'expediee') out.shipped.push(op);
    else if (op.statut === 'refusee') out.returning.push(op);
    else continue;
    if (op.solde > 0) out.dueTotal += op.solde;
  }
  const oldestFirst = (a: Operation, b: Operation) => a.creeLe - b.creeLe;
  out.putAside.sort(oldestFirst);
  out.toShip.sort(oldestFirst);
  out.shipped.sort(oldestFirst);
  out.returning.sort(oldestFirst);
  return out;
}

/**
 * Ce qui attend dans un espace, pour la liste des agences et boutiques du compte
 * (feuille du sélecteur) : agence, retards et départs ou retours du jour ;
 * boutique, colis à expédier et ventes mises de côté. Lu sur les opérations
 * ouvertes du carnet (une écoute par espace, feuille ouverte seulement).
 */
export interface ProSpaceWaiting {
  late: number;
  moves: number;
  toShip: number;
  putAside: number;
}

export function proSpaceWaiting(kind: 'agence' | 'boutique', ops: readonly Operation[], today: string): ProSpaceWaiting {
  if (kind === 'agence') {
    const day = buildAgencyToday(ops, today);
    return { late: day.late.length, moves: day.entries.length, toShip: 0, putAside: 0 };
  }
  const shop = buildShopToday(ops);
  return { late: 0, moves: 0, toShip: shop.toShip.length, putAside: shop.putAside.length };
}

/** Prénom puis initiale du nom (« Yacine M. ») ; le nom tel quel s'il n'a qu'un mot. */
export function shortClientName(name: string | null | undefined): string | null {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
