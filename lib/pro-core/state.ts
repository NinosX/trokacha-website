// COPIE GÉNÉRÉE depuis functions/src/pro/core/state.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/state.ts
 *
 * Cycle de vie d'une opération du carnet. Une seule table de transitions, appliquée
 * par le serveur ; l'application et le site s'en servent pour n'afficher que les
 * boutons possibles. Copié dans l'application et le site : voir `types.ts`.
 */

import type { Operation, OperationType, StatutLocation, StatutOperation, StatutVente } from './types';
import { addDays, type Plage } from './dates';

export const STATUTS_LOCATION: readonly StatutLocation[] = ['reservee', 'en_cours', 'rendue', 'cloturee', 'annulee', 'non_presentee'];
export const STATUTS_VENTE: readonly StatutVente[] = [
  'mise_de_cote',
  'a_expedier',
  'expediee',
  'livree',
  'refusee',
  'retournee',
  'vendue',
  'annulee',
];

/** Étapes demandées par l'écran (`proOperationStep`). */
export type Etape =
  | 'depart'
  | 'retour'
  | 'cloture'
  | 'annulation'
  | 'non_presentation'
  | 'a_expedier'
  | 'expediee'
  | 'livree'
  | 'refusee'
  | 'retournee'
  | 'vendue';

const TRANSITIONS: Record<OperationType, Partial<Record<StatutOperation, Partial<Record<Etape, StatutOperation>>>>> = {
  location: {
    reservee: { depart: 'en_cours', annulation: 'annulee', non_presentation: 'non_presentee' },
    en_cours: { retour: 'rendue' },
    rendue: { cloture: 'cloturee' },
  },
  vente: {
    mise_de_cote: { vendue: 'vendue', a_expedier: 'a_expedier', annulation: 'annulee' },
    a_expedier: { expediee: 'expediee', annulation: 'annulee' },
    expediee: { livree: 'livree', refusee: 'refusee' },
    refusee: { retournee: 'retournee' },
  },
};

/** Statut d'arrivée d'une étape, ou `null` si l'étape est impossible depuis ce statut. */
export function statutApres(type: OperationType, statut: StatutOperation, etape: Etape): StatutOperation | null {
  return TRANSITIONS[type][statut]?.[etape] ?? null;
}

export function etapesPossibles(type: OperationType, statut: StatutOperation): Etape[] {
  return Object.keys(TRANSITIONS[type][statut] ?? {}) as Etape[];
}

export function isStatutValide(type: OperationType, statut: unknown): statut is StatutOperation {
  return type === 'location'
    ? (STATUTS_LOCATION as readonly unknown[]).includes(statut)
    : (STATUTS_VENTE as readonly unknown[]).includes(statut);
}

/** Une location qui occupe encore le calendrier du bien. */
export function occupeLeCalendrier(op: Pick<Operation, 'type' | 'statut'>): boolean {
  return op.type === 'location' && (op.statut === 'reservee' || op.statut === 'en_cours');
}

/** Une vente qui retient encore une pièce du stock. */
export function retientDuStock(op: Pick<Operation, 'type' | 'statut'>): boolean {
  return op.type === 'vente' && op.statut !== 'annulee' && op.statut !== 'retournee';
}

/**
 * Plage que la location occupe : [debut, fin + tampon), prolongée jusqu'à demain
 * si la voiture est encore dehors après `fin` (`enRetard`).
 */
export function plageOccupee(
  op: Pick<Operation, 'debut' | 'fin' | 'tamponJours' | 'enRetard' | 'statut'>,
  aujourdhui: string,
): Plage | null {
  if (!op.debut || !op.fin) return null;
  let end = addDays(op.fin, Math.max(0, Math.floor(op.tamponJours ?? 0)));
  if (op.statut === 'en_cours' && op.fin <= aujourdhui) {
    const demain = addDays(aujourdhui, 1);
    if (demain > end) end = demain;
  }
  return { start: op.debut, end };
}
