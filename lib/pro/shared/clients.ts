// lib/pro/shared/clients.ts
// =============================================================================
// VOLET CLIENTS du bureau (module PUR) : recherche par nom ou numéro, et ce
// qu'on sait de l'argent d'un client à partir de ses opérations (reste dû,
// trop-perçu à rendre, cautions détenues). Les fiches et les opérations sont
// lues en direct (`hooks.ts`) ; rien n'est recalculé côté serveur.
// =============================================================================

import { totalPaye, type ClientFiche, type Garantie, type Operation } from '@/lib/pro-core';
import { phoneDigitsIntl, searchKey } from './format';

/** Une fiche répond-elle à la recherche ? Chiffres : le numéro ; sinon : le nom. */
export function matchClient(client: Pick<ClientFiche, 'nom' | 'tel'>, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const digits = q.replace(/[\s.+()-]/g, '');
  if (/^\d{3,}$/.test(digits)) {
    const tel = (client.tel ?? '').replace(/\D/g, '');
    if (!tel) return false;
    return tel.includes(digits) || tel.includes(phoneDigitsIntl(digits));
  }
  return searchKey(client.nom).includes(searchKey(q));
}

/** Opérations qui ne comptent plus dans l'argent dû (annulées, client pas venu). */
const HORS_ARGENT: ReadonlySet<string> = new Set(['annulee', 'non_presentee']);

export interface ClientMoney {
  operations: number;
  /** Payé au total sur ses opérations (remboursements déduits). */
  paye: number;
  /** Reste dû (opérations encore à payer). */
  du: number;
  /** Trop-perçu à lui rendre. */
  aRendre: number;
  /** Cautions en argent encore détenues. */
  cautions: number;
  /** Documents gardés (passeport, permis…) encore détenus. */
  documents: number;
}

export function clientMoney(ops: readonly Operation[]): ClientMoney {
  const out: ClientMoney = { operations: ops.length, paye: 0, du: 0, aRendre: 0, cautions: 0, documents: 0 };
  for (const op of ops) {
    out.paye += totalPaye(op.paiements);
    if (!HORS_ARGENT.has(op.statut)) {
      if (op.solde > 0) out.du += op.solde;
      if (op.solde < 0) out.aRendre += -op.solde;
    }
    for (const g of op.garanties) {
      if (g.etat !== 'recue') continue;
      if (g.forme === 'document') out.documents += 1;
      else out.cautions += g.montant ?? 0;
    }
  }
  return out;
}

/** Cautions encore détenues, avec l'opération qui les porte (fiche client). */
export function heldGuarantees(ops: readonly Operation[]): { op: Operation; garantie: Garantie }[] {
  return ops.flatMap((op) => op.garanties.filter((g) => g.etat === 'recue').map((garantie) => ({ op, garantie })));
}

/** Plus récentes d'abord. */
export function sortOpsRecentFirst(ops: readonly Operation[]): Operation[] {
  return [...ops].sort((a, b) => b.creeLe - a.creeLe || b.id.localeCompare(a.id));
}

