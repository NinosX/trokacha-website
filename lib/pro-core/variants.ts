// COPIE GÉNÉRÉE depuis functions/src/pro/core/variants.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/variants.ts
 *
 * Tailles et couleurs d'un article, et LA règle du stock vu par la marketplace.
 * Copié dans l'application et le site : voir `types.ts`.
 *
 * Règle unique (pré-mortem, section I, B3) : pour un article à variantes,
 *   quantiteRestante = somme des stocks des variantes − commandes Trokacha acceptées
 *                      dont le pro n'a pas encore choisi la taille.
 * Le serveur seul l'écrit, sur l'article ET l'annonce, dans la transaction de chaque
 * vente, arrivage, inventaire ou commande.
 */

import type { StockParVariante, Variante } from './types';

export const VARIANTES_MAX = 120;
export const STOCK_MAX_PAR_VARIANTE = 100_000;
const CLE_RE = /^[a-z0-9_]{1,40}$/;

export function isCleVariante(v: unknown): v is string {
  return typeof v === 'string' && CLE_RE.test(v);
}

function slug(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18);
}

/**
 * Clé d'une nouvelle variante, lisible quand la taille et la couleur sont en lettres
 * latines (« m_noir »), sinon « v1 », « v2 »… Jamais une clé déjà prise.
 */
export function nouvelleCle(taille: string | null | undefined, couleur: string | null | undefined, prises: readonly string[]): string {
  const base = [slug(taille), slug(couleur)].filter(Boolean).join('_');
  const taken = new Set(prises);
  if (base && !taken.has(base)) return base;
  for (let i = 1; i <= VARIANTES_MAX * 2; i++) {
    const cle = base ? `${base}_${i}`.slice(0, 40) : `v${i}`;
    if (!taken.has(cle)) return cle;
  }
  return `v${Date.now().toString(36)}`;
}

/** Libellé affiché (« M · Noir »). */
export function libelleVariante(v: Pick<Variante, 'taille' | 'couleur'>): string {
  return [v.taille, v.couleur].filter((x) => !!x && String(x).trim()).join(' · ');
}

/** `null` si la liste est valide, sinon un code d'erreur. */
export function erreurVariantes(variantes: unknown): string | null {
  if (!Array.isArray(variantes)) return 'VARIANTES_INVALIDES';
  if (variantes.length > VARIANTES_MAX) return 'TROP_DE_VARIANTES';
  const cles = new Set<string>();
  const couples = new Set<string>();
  for (const v of variantes) {
    if (!v || typeof v !== 'object') return 'VARIANTES_INVALIDES';
    const { cle, taille, couleur } = v as Variante;
    if (!isCleVariante(cle) || cles.has(cle)) return 'CLE_VARIANTE_INVALIDE';
    cles.add(cle);
    const couple = `${(taille ?? '').trim().toLowerCase()}|${(couleur ?? '').trim().toLowerCase()}`;
    if (couple === '|') return 'VARIANTE_VIDE';
    if (couples.has(couple)) return 'VARIANTE_EN_DOUBLE';
    couples.add(couple);
  }
  return null;
}

export function stockTotal(stock: StockParVariante | null | undefined): number {
  if (!stock) return 0;
  return Object.values(stock).reduce((sum, n) => sum + (Number.isInteger(n) && n > 0 ? n : 0), 0);
}

/** Le total vu par la marketplace (jamais négatif). */
export function quantiteMarketplace(stock: StockParVariante | null | undefined, commandesSansTaille: number): number {
  return Math.max(0, stockTotal(stock) - Math.max(0, commandesSansTaille));
}

/** Tailles encore en stock, dans l'ordre des variantes, sans doublon (projection `taillesDispo`). */
export function taillesEnStock(variantes: readonly Variante[], stock: StockParVariante | null | undefined): string[] {
  const out: string[] = [];
  for (const v of variantes) {
    const taille = (v.taille ?? '').trim();
    if (!taille || out.includes(taille)) continue;
    if ((stock?.[v.cle] ?? 0) > 0) out.push(taille);
  }
  return out;
}

/** Commandes Trokacha acceptées sans taille choisie : décomptées dans l'annonce mais pas encore affectées. */
export function commandesSansTaille(
  quantityDecrementedBy: readonly string[] | null | undefined,
  variantesAffectees: Record<string, string> | null | undefined,
): number {
  if (!quantityDecrementedBy) return 0;
  const affectees = variantesAffectees ?? {};
  return quantityDecrementedBy.filter((pid) => typeof pid === 'string' && !(pid in affectees)).length;
}
