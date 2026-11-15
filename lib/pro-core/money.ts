// COPIE GÉNÉRÉE depuis functions/src/pro/core/money.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/money.ts
 *
 * Total, solde et garanties d'une opération. Calculés par le serveur à chaque écriture ;
 * les écrans les affichent sans les recalculer. Copié dans l'application et le site :
 * voir `types.ts`.
 */

import type { FormeGarantie, Garantie, LigneMontant, MoyenPaiement, Paiement } from './types';

/** Plafond de sécurité d'un montant (1 milliard de dinars) : refuse les fautes de frappe absurdes. */
export const MONTANT_MAX = 1_000_000_000;

export function isMontant(v: unknown, { negatifPermis = false } = {}): v is number {
  return (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    Math.abs(v) <= MONTANT_MAX &&
    (negatifPermis || v >= 0)
  );
}

export function totalDesLignes(lignes: readonly LigneMontant[]): number {
  return lignes.reduce((sum, l) => sum + l.prix * l.quantite, 0);
}

export function totalPaye(paiements: readonly Paiement[]): number {
  return paiements.reduce((sum, p) => sum + p.montant, 0);
}

/** Ce que le client doit encore (négatif = trop-perçu à rendre). Les garanties n'y entrent pas. */
export function soldeDe(total: number, paiements: readonly Paiement[]): number {
  return total - totalPaye(paiements);
}

/** Une garantie encore entre les mains du pro (à rendre ou à régler). */
export function garantieEnCours(g: Pick<Garantie, 'etat'>): boolean {
  return g.etat === 'recue';
}

export function aUneGarantieOuverte(garanties: readonly Pick<Garantie, 'etat'>[]): boolean {
  return garanties.some(garantieEnCours);
}

/** Palier de prix dégressif d'une location (forme de `rental.pricingTiers`). */
export interface PalierPrix {
  upToDays: number | null;
  pricePerDay: number;
}

/** Prix par jour applicable pour une durée (même règle que `tierFor` de `utils/rental.ts`). */
export function prixParJour(paliers: readonly PalierPrix[] | null | undefined, jours: number): number | null {
  if (!Array.isArray(paliers) || paliers.length === 0 || !Number.isFinite(jours) || jours <= 0) return null;
  for (const p of paliers) {
    if (p.upToDays == null || jours <= p.upToDays) return isMontant(p.pricePerDay) ? p.pricePerDay : null;
  }
  const dernier = paliers[paliers.length - 1];
  return isMontant(dernier.pricePerDay) ? dernier.pricePerDay : null;
}

/** Somme des garanties en argent encore détenues (pour « cautions à rendre cette semaine »). */
export function montantGarantiesDetenues(garanties: readonly Garantie[]): number {
  return garanties.filter(garantieEnCours).reduce((sum, g) => sum + (g.montant ?? 0), 0);
}

/**
 * Moyen de caisse d'une garantie en argent, pour compter la part retenue dans l'argent du jour.
 * Carte : CIB (la carte bancaire, la plus proche des moyens de paiement). Document gardé : `null`.
 */
export function moyenDeGarantie(forme: FormeGarantie): MoyenPaiement | null {
  switch (forme) {
    case 'especes':
      return 'especes';
    case 'cheque':
      return 'cheque';
    case 'virement':
      return 'virement';
    case 'carte':
      return 'cib';
    default:
      return null;
  }
}

/**
 * Argent gardé par le pro sur une garantie réglée (retenue totale ou partielle) : il entre dans
 * l'argent reçu du jour. 0 pour une garantie rendue ou encore tenue, et pour un document gardé.
 * N'entre ni dans le payé ni dans le solde de l'opération (la garantie couvre un dommage, pas le prix).
 */
export function argentRetenu(g: Pick<Garantie, 'forme' | 'etat' | 'retenue'>): number {
  if (g.etat !== 'retenue' && g.etat !== 'retenue_partielle') return 0;
  if (moyenDeGarantie(g.forme) === null) return 0;
  return isMontant(g.retenue) && g.retenue > 0 ? g.retenue : 0;
}
