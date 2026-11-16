// lib/pro/shop/catalogue.ts
// =============================================================================
// CATALOGUE D'UNE BOUTIQUE vu par le bureau web (module PUR, aucun Firebase).
// PORT de `src/v2/domain/proShopStock.ts` (application Trokacha) : mêmes règles
// de stock, de tailles et de vente au comptoir, à garder alignées.
// =============================================================================
//
// Deux sortes d'articles de vente cohabitent dans le catalogue :
//   • article À VARIANTES (`variantes` non vide) : le stock se compte par
//     combinaison taille × couleur (`stock[cle]`), écrit par le SERVEUR seul
//     (callables du carnet) ; ce qui reste = la somme des variantes ;
//   • article SANS variantes : le compteur `quantiteRestante`, ou une pièce
//     unique (`quantite` absente) qui est là tant qu'elle n'est pas « rupture ».
// Les locations (`rental`) et les articles dont l'annonce est supprimée ne sont
// pas des articles de vente du bureau.
//
// En plus de l'application : le TABLEAU (tri, filtre, sélection) et les gestes
// EN SÉRIE (prix en montant ou en pourcentage, épuisé, remise en stock).
// =============================================================================

import { libelleVariante, lireSaisieOperation, STOCK_MAX_PAR_VARIANTE, type Resultat, type SaisieOperation } from '@/lib/pro-core';
import { isRecord, readMillis, readNumber, readString } from '../carnet';

// =============================================================================
// LECTURE D'UN ARTICLE
// =============================================================================

export type ArticleStatut = 'draft' | 'publie' | 'masque' | 'rupture' | 'programme';

export interface ShopVariant {
  cle: string;
  taille: string | null;
  couleur: string | null;
}

/** Le strict nécessaire d'un article du catalogue pour le bureau. */
export interface ShopArticle {
  id: string;
  titre: string | null;
  prix: number | null;
  prixSurDemande: boolean;
  photo: string | null;
  statut: ArticleStatut;
  variantes: ShopVariant[];
  stock: Record<string, number>;
  quantite: number | null;
  quantiteRestante: number | null;
  taillesDispo: string[];
  taillesEpuisees: string[];
  tailleUnique: string | null;
  couleur: string | null;
  codeBarre: string | null;
  waitlistCount: number;
  adId: string | null;
  /** Miroir serveur de la modération de l'annonce (`approved`, `pending`, `rejected`, `deleted`…). */
  moderation: string | null;
  /** Article en promotion : le prix se change en retirant la promotion (prix barré à garder cohérent). */
  promo: boolean;
  /** Prix barré de la promotion (l'ancien prix), `null` : pas de prix barré. */
  promoPrixBarre: number | null;
  /** Fin de la promotion (millisecondes), `null` : sans date de fin. */
  promoFinMs: number | null;
  /** Article programmé dont l'instantané d'annonce porte aussi le prix. */
  hasAdDraft: boolean;
  /** Commandes Trokacha dont la taille est choisie (`m_<matchId>` → clé). */
  variantesAffectees: Record<string, string>;
  rental: boolean;
  updatedAt: number;
}

const STATUTS: ReadonlySet<string> = new Set(['draft', 'publie', 'masque', 'rupture', 'programme']);

function count(value: unknown): number {
  const n = readNumber(value);
  return n === null || !Number.isFinite(n) || n <= 0 ? 0 : Math.floor(n);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.trim()) : [];
}

/** Un article lu sans jamais lever ; `null` si le document n'en est pas un. */
export function readShopArticle(id: string, data: unknown): ShopArticle | null {
  if (!isRecord(data)) return null;
  const variantes: ShopVariant[] = Array.isArray(data.variantes)
    ? data.variantes.flatMap((v): ShopVariant[] => {
        if (!isRecord(v)) return [];
        const cle = readString(v.cle);
        if (!cle) return [];
        return [{ cle, taille: readString(v.taille)?.trim() || null, couleur: readString(v.couleur)?.trim() || null }];
      })
    : [];
  const stock: Record<string, number> = {};
  if (isRecord(data.stock)) for (const [cle, n] of Object.entries(data.stock)) stock[cle] = count(n);
  const affectees: Record<string, string> = {};
  if (isRecord(data.variantesAffectees)) for (const [op, cle] of Object.entries(data.variantesAffectees)) if (typeof cle === 'string') affectees[op] = cle;
  const details = isRecord(data.details) ? data.details : {};
  const moderation = isRecord(data.adModeration) ? readString(data.adModeration.status) : null;
  const photos = stringList(data.photos);
  const prix = readNumber(data.prix);
  const quantite = readNumber(data.quantite);
  const restante = readNumber(data.quantiteRestante);
  const statut = typeof data.statut === 'string' && STATUTS.has(data.statut) ? (data.statut as ArticleStatut) : 'draft';
  return {
    id,
    titre: readString(data.titre)?.trim() || null,
    prix: prix === null || prix < 0 ? null : Math.round(prix),
    prixSurDemande: data.prixSurDemande === true,
    photo: photos[0] ?? null,
    statut,
    variantes,
    stock,
    quantite: quantite === null ? null : Math.max(0, Math.floor(quantite)),
    quantiteRestante: restante === null ? null : Math.max(0, Math.floor(restante)),
    taillesDispo: stringList(data.taillesDispo),
    taillesEpuisees: stringList(data.taillesEpuisees),
    tailleUnique: readString(data.tailleUnique)?.trim() || null,
    couleur: readString(details.couleur)?.trim() || null,
    codeBarre: readString(data.codeBarre),
    waitlistCount: count(data.waitlistCount),
    adId: readString(data.adId),
    moderation,
    promo: isRecord(data.promo) && Object.keys(data.promo).length > 0,
    promoPrixBarre: isRecord(data.promo) ? (readNumber(data.promo.prixBarre) ?? null) : null,
    promoFinMs: isRecord(data.promo) ? (readMillis(data.promo.fin) ?? null) : null,
    hasAdDraft: isRecord(data.adDraft),
    variantesAffectees: affectees,
    rental: !!data.rental,
    updatedAt: readMillis(data.updatedAt) ?? 0,
  };
}

/** Un article de VENTE : ni une location, ni un article dont l'annonce est supprimée. */
export function isSaleArticle(a: Pick<ShopArticle, 'rental' | 'adId' | 'moderation'>): boolean {
  return !a.rental && !(a.adId && a.moderation === 'deleted');
}

export function hasVariants(a: Pick<ShopArticle, 'variantes'>): boolean {
  return a.variantes.length > 0;
}

/** Une combinaison taille × couleur et ce qu'il en reste. */
export interface VariantStock extends ShopVariant {
  label: string;
  stock: number;
}

export function variantStocks(a: Pick<ShopArticle, 'variantes' | 'stock'>): VariantStock[] {
  return a.variantes.map((v) => ({ ...v, label: libelleVariante({ taille: v.taille, couleur: v.couleur }), stock: a.stock[v.cle] ?? 0 }));
}

/** Ce qui reste en boutique : somme des variantes, sinon le compteur, sinon la pièce unique. */
export function stockOf(a: ShopArticle): number {
  if (hasVariants(a)) return variantStocks(a).reduce((sum, v) => sum + v.stock, 0);
  if (a.quantiteRestante !== null) return a.quantiteRestante;
  return a.statut === 'rupture' ? 0 : 1;
}

export function isSoldOut(a: ShopArticle): boolean {
  return stockOf(a) === 0;
}

export function variantStockOf(a: ShopArticle, cle: string | null | undefined): number {
  if (!cle) return 0;
  return variantStocks(a).find((v) => v.cle === cle)?.stock ?? 0;
}

export function availableFor(a: ShopArticle, variante: string | null | undefined): number {
  return hasVariants(a) ? variantStockOf(a, variante) : stockOf(a);
}

export function variantColors(a: ShopArticle): string[] {
  const out: string[] = [];
  for (const v of variantStocks(a)) if (v.couleur && !out.some((c) => c.toLowerCase() === v.couleur?.toLowerCase())) out.push(v.couleur);
  return out;
}

/** Plusieurs couleurs : une puce dit « 42 · Noir » ; une seule : « 42 ». */
export function variantChipLabel(v: Pick<VariantStock, 'taille' | 'label'>, severalColors: boolean): string {
  return !severalColors && v.taille ? v.taille : v.label;
}

/** Toutes les tailles du modèle (même épuisées) ; sans taille : les couleurs. */
export function sizesOf(a: ShopArticle): string[] {
  if (hasVariants(a)) {
    const sizes: string[] = [];
    for (const v of variantStocks(a)) if (v.taille && !sizes.includes(v.taille)) sizes.push(v.taille);
    return sizes.length ? sizes : variantColors(a);
  }
  const all = [...a.taillesDispo, ...a.taillesEpuisees.filter((s) => !a.taillesDispo.includes(s))];
  if (all.length) return all;
  return a.tailleUnique ? [a.tailleUnique] : [];
}

/**
 * Ligne de tailles du catalogue : celles encore en boutique (passage simulateur du 15/11) ;
 * article épuisé : toutes, comme la maquette B1 ; sans taille : les couleurs encore là.
 */
export function catalogueSizesLine(a: ShopArticle): string {
  if (hasVariants(a)) {
    const live = variantStocks(a).filter((v) => v.stock > 0);
    if (!live.length) return sizesOf(a).join(' · ');
    const sizes: string[] = [];
    for (const v of live) if (v.taille && !sizes.includes(v.taille)) sizes.push(v.taille);
    if (sizes.length) return sizes.join(' · ');
    const colors: string[] = [];
    for (const v of live) if (v.couleur && !colors.some((c) => c.toLowerCase() === v.couleur?.toLowerCase())) colors.push(v.couleur);
    return colors.join(' · ');
  }
  return a.taillesDispo.length ? a.taillesDispo.join(' · ') : sizesOf(a).join(' · ');
}

/** Prix de l'article en dinars, `null` sans prix (prix sur demande). */
export function articlePrice(a: Pick<ShopArticle, 'prix' | 'prixSurDemande'>): number | null {
  return a.prixSurDemande ? null : a.prix;
}

/** Personnes qui attendent le retour d'un article épuisé. */
export function waitingCountOf(a: ShopArticle): number {
  return isSoldOut(a) ? a.waitlistCount : 0;
}

/** « Robe longue fleurie · M · Noir ». */
export function articleLineLabel(title: string, variant: Pick<VariantStock, 'label'> | null | undefined): string {
  return variant?.label ? `${title} · ${variant.label}` : title;
}

// =============================================================================
// ÉTAT AFFICHÉ (colonne « État » du tableau)
// =============================================================================

export type ArticleState = 'soldOut' | 'online' | 'inReview' | 'rejected' | 'withdrawn' | 'hidden' | 'draft' | 'scheduled';

const IN_REVIEW: ReadonlySet<string> = new Set(['pending', 'pending_review', 'review']);
const WITHDRAWN: ReadonlySet<string> = new Set(['hidden', 'suspended', 'removed', 'blocked', 'disabled']);

export function articleStateOf(a: ShopArticle): ArticleState {
  if (a.adId && a.moderation === 'rejected') return 'rejected';
  if (a.adId && a.moderation && WITHDRAWN.has(a.moderation)) return 'withdrawn';
  if (a.statut === 'draft') return 'draft';
  if (a.statut === 'programme') return 'scheduled';
  if (a.statut === 'masque') return 'hidden';
  if (isSoldOut(a)) return 'soldOut';
  if (a.adId && a.moderation && IN_REVIEW.has(a.moderation)) return 'inReview';
  return 'online';
}

// =============================================================================
// TABLEAU : RECHERCHE, FILTRE, TRI
// =============================================================================

/** Minuscules sans accents (« Épuisé » = « epuise »). */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesArticle(a: ShopArticle, query: string): boolean {
  const q = foldText(query);
  if (!q) return true;
  const hay = foldText([a.titre ?? '', a.codeBarre ?? '', ...sizesOf(a), ...variantColors(a), a.couleur ?? ''].join(' '));
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export type CatalogueFilter = 'all' | 'inStock' | 'soldOut' | 'low';
export type CatalogueSort = 'catalogue' | 'title' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'stockDesc';

/** « Bientôt épuisé » : 1 ou 2 pièces. */
export const LOW_STOCK_MAX = 2;

export interface CatalogueRow {
  id: string;
  article: ShopArticle;
  title: string | null;
  price: number | null;
  sizes: string;
  remaining: number;
  soldOut: boolean;
  waiting: number;
  variants: boolean;
  state: ArticleState;
}

export function catalogueRowOf(a: ShopArticle): CatalogueRow {
  const remaining = stockOf(a);
  return {
    id: a.id,
    article: a,
    title: a.titre,
    price: articlePrice(a),
    sizes: catalogueSizesLine(a),
    remaining,
    soldOut: remaining === 0,
    waiting: remaining === 0 ? a.waitlistCount : 0,
    variants: hasVariants(a),
    state: articleStateOf(a),
  };
}

function passesFilter(row: CatalogueRow, filter: CatalogueFilter): boolean {
  switch (filter) {
    case 'inStock':
      return !row.soldOut;
    case 'soldOut':
      return row.soldOut;
    case 'low':
      return !row.soldOut && row.remaining <= LOW_STOCK_MAX;
    default:
      return true;
  }
}

function compareRows(sort: CatalogueSort, locale: string): (a: CatalogueRow, b: CatalogueRow) => number {
  const byTitle = (a: CatalogueRow, b: CatalogueRow) => (a.title ?? '').localeCompare(b.title ?? '', locale) || a.id.localeCompare(b.id);
  const nullLast = (x: number | null, y: number | null, dir: 1 | -1) => (x === null ? (y === null ? 0 : 1) : y === null ? -1 : dir * (x - y));
  switch (sort) {
    case 'title':
      return byTitle;
    case 'priceAsc':
      return (a, b) => nullLast(a.price, b.price, 1) || byTitle(a, b);
    case 'priceDesc':
      return (a, b) => nullLast(a.price, b.price, -1) || byTitle(a, b);
    case 'stockAsc':
      return (a, b) => a.remaining - b.remaining || byTitle(a, b);
    case 'stockDesc':
      return (a, b) => b.remaining - a.remaining || byTitle(a, b);
    default:
      return () => 0;
  }
}

/** Lignes du tableau : articles de vente, recherche, filtre, tri (« catalogue » garde l'ordre du catalogue). */
export function catalogueRows(articles: readonly ShopArticle[], opts: { query?: string; filter?: CatalogueFilter; sort?: CatalogueSort; locale?: string } = {}): CatalogueRow[] {
  const rows = articles.filter(isSaleArticle).filter((a) => matchesArticle(a, opts.query ?? '')).map(catalogueRowOf).filter((row) => passesFilter(row, opts.filter ?? 'all'));
  const sort = opts.sort ?? 'catalogue';
  return sort === 'catalogue' ? rows : [...rows].sort(compareRows(sort, opts.locale ?? 'fr'));
}

/** Ordre du catalogue : le plus récemment modifié d'abord, puis le titre (stable d'un rendu à l'autre). */
export function catalogueOrder(articles: readonly ShopArticle[]): ShopArticle[] {
  return [...articles].sort((a, b) => b.updatedAt - a.updatedAt || (a.titre ?? '').localeCompare(b.titre ?? '') || a.id.localeCompare(b.id));
}

// =============================================================================
// VENTE AU COMPTOIR (« −1 Vendu au comptoir »)
// =============================================================================

/**
 * La saisie d'une pièce vendue au comptoir, payée en espèces au prix de l'article (le serveur
 * calcule la ligne). Refus AVANT l'envoi : prix absent, taille à choisir, plus de pièce.
 */
export function counterSaleSaisie(input: { bid: string; opId: string; article: ShopArticle; variante: string | null }): Resultat<SaisieOperation> {
  const { article } = input;
  const price = articlePrice(article);
  if (price === null) return { ok: false, reason: 'PRIX_REQUIS' };
  const variants = hasVariants(article);
  if (variants && !input.variante) return { ok: false, reason: 'VARIANTE_REQUISE' };
  if (availableFor(article, variants ? input.variante : null) < 1) return { ok: false, reason: 'STOCK_INSUFFISANT' };
  return lireSaisieOperation({
    bid: input.bid,
    opId: input.opId,
    type: 'vente',
    origine: 'comptoir',
    itemId: article.id,
    variante: variants ? input.variante : null,
    quantite: 1,
    debut: null,
    fin: null,
    heureDebut: null,
    heureFin: null,
    remise: null,
    client: null,
    lignes: null,
    paiement: price > 0 ? { moyen: 'especes', montant: price } : null,
    garanties: [],
    expedition: null,
    statutVente: 'vendue',
    notes: null,
  });
}

/** Bornes d'un compte de stock saisi à la main. */
export function clampStock(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(STOCK_MAX_PAR_VARIANTE, Math.floor(value)));
}

// =============================================================================
// MONTANTS TAPÉS
// =============================================================================

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

/**
 * Montant tapé (« 7 500 », « 7500 DA », « ٧٥٠٠ ») : `null` si vide, `NaN` si illisible. Dinars
 * entiers : séparateurs de milliers ignorés, aucune décimale. (Même règle que l'application.)
 */
export function parseAmount(text: string): number | null {
  const ascii = text.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));
  const clean = ascii.replace(/[\s  .,'’]/g, '').replace(/(DA|DZD|دج)$/i, '');
  if (!clean) return null;
  return /^\d{1,10}$/.test(clean) ? Number(clean) : Number.NaN;
}

// =============================================================================
// GESTES EN SÉRIE
// =============================================================================

export type PriceChange = { kind: 'percent'; direction: 'down' | 'up'; value: number } | { kind: 'amount'; direction: 'down' | 'up'; value: number } | { kind: 'set'; value: number };

/** Arrondi des prix calculés en pourcentage (6 500 − 15 % = 5 525 → 5 500). */
export const PRICE_ROUNDING = 50;

/** Nouveau prix d'un article, `null` si le changement ne s'applique pas (prix inconnu, résultat négatif ou nul). */
export function nextPrice(current: number | null, change: PriceChange): number | null {
  if (change.kind === 'set') return change.value > 0 ? Math.round(change.value) : null;
  if (current === null) return null;
  const sign = change.direction === 'down' ? -1 : 1;
  const raw = change.kind === 'percent' ? current * (1 + (sign * change.value) / 100) : current + sign * change.value;
  const rounded = change.kind === 'percent' ? Math.round(raw / PRICE_ROUNDING) * PRICE_ROUNDING : Math.round(raw);
  return rounded > 0 ? rounded : null;
}

export type PriceSkipReason = 'promo' | 'onRequest' | 'noPrice' | 'invalid' | 'same';

export interface PricePlanLine {
  article: ShopArticle;
  before: number | null;
  after: number;
}

export interface PricePlan {
  lines: PricePlanLine[];
  skipped: Array<{ article: ShopArticle; reason: PriceSkipReason }>;
}

/**
 * Plan d'un changement de prix en série. Restent à faire dans l'application, article par
 * article : les articles en promotion (prix barré à garder cohérent) et ceux « prix sur demande ».
 */
export function planPriceChange(articles: readonly ShopArticle[], change: PriceChange): PricePlan {
  const lines: PricePlanLine[] = [];
  const skipped: PricePlan['skipped'] = [];
  for (const article of articles) {
    if (article.promo) {
      skipped.push({ article, reason: 'promo' });
      continue;
    }
    if (article.prixSurDemande) {
      skipped.push({ article, reason: 'onRequest' });
      continue;
    }
    if (change.kind !== 'set' && article.prix === null) {
      skipped.push({ article, reason: 'noPrice' });
      continue;
    }
    const after = nextPrice(article.prix, change);
    if (after === null) {
      skipped.push({ article, reason: 'invalid' });
      continue;
    }
    if (after === article.prix) {
      skipped.push({ article, reason: 'same' });
      continue;
    }
    lines.push({ article, before: article.prix, after });
  }
  return { lines, skipped };
}

/** Un réglage de stock à envoyer (`proAdjustStock`, valeur absolue : un rejeu ne double rien). */
export interface StockSet {
  itemId: string;
  variante: string | null;
  stock: number;
  label: string;
}

/** « Épuisé » en série : chaque variante encore en stock (ou l'article) passe à 0. */
export function planSoldOut(articles: readonly ShopArticle[], untitled: string): StockSet[] {
  const out: StockSet[] = [];
  for (const a of articles) {
    const title = a.titre ?? untitled;
    if (hasVariants(a)) {
      for (const v of variantStocks(a)) if (v.stock > 0) out.push({ itemId: a.id, variante: v.cle, stock: 0, label: articleLineLabel(title, v) });
    } else if (stockOf(a) > 0) {
      out.push({ itemId: a.id, variante: null, stock: 0, label: title });
    }
  }
  return out;
}

/**
 * « Mettre le stock à N » en série : articles SANS variantes seulement (un article à tailles se
 * règle taille par taille, dans sa ligne dépliée).
 */
export function planStockSet(articles: readonly ShopArticle[], stock: number, untitled: string): { sets: StockSet[]; skippedVariants: number } {
  const sets: StockSet[] = [];
  let skippedVariants = 0;
  const value = clampStock(stock);
  for (const a of articles) {
    if (hasVariants(a)) {
      skippedVariants += 1;
      continue;
    }
    if (stockOf(a) === value && a.quantiteRestante !== null) continue;
    sets.push({ itemId: a.id, variante: null, stock: value, label: a.titre ?? untitled });
  }
  return { sets, skippedVariants };
}

// =============================================================================
// ARRIVAGE (port de `src/v2/domain/proShopArrival.ts`)
// =============================================================================

/** Plafond du serveur (`LIGNES_ARRIVAGE_MAX`). */
export const ARRIVAL_LINES_MAX = 100;
/** Clé de la quantité d'un article sans variantes. */
export const ARRIVAL_SOLO_KEY = '_';

export interface ArrivalDraftItem {
  itemId: string;
  quantities: Readonly<Record<string, string>>;
  prixAchatText: string;
}

export interface ArrivalLineInput {
  itemId: string;
  variante: string | null;
  quantite: number;
  prixAchat: number | null;
}

function quantityOf(text: string | undefined): number | null {
  const value = parseAmount(text ?? '');
  if (value === null || value === 0) return 0;
  if (Number.isNaN(value) || value > STOCK_MAX_PAR_VARIANTE) return null;
  return value;
}

export function draftPieces(item: ArrivalDraftItem): number {
  return Object.values(item.quantities).reduce((sum, text) => sum + (quantityOf(text) ?? 0), 0);
}

/** Le brouillon → les lignes de `proReceiveArrival`. Raisons : `QUANTITE_INVALIDE`, `MONTANT_INVALIDE`, `ARRIVAGE_VIDE`, `TROP_DE_LIGNES`. */
export function buildArrivalLines(items: readonly ArrivalDraftItem[], articles: readonly ShopArticle[]): Resultat<{ lignes: ArrivalLineInput[]; pieces: number; articles: number }> {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const lignes: ArrivalLineInput[] = [];
  const touched = new Set<string>();
  for (const item of items) {
    const article = byId.get(item.itemId);
    if (!article || !isSaleArticle(article)) continue;
    const prix = parseAmount(item.prixAchatText);
    if (prix !== null && Number.isNaN(prix)) return { ok: false, reason: 'MONTANT_INVALIDE' };
    const prixAchat = prix ?? null;
    if (hasVariants(article)) {
      for (const v of variantStocks(article)) {
        const quantite = quantityOf(item.quantities[v.cle]);
        if (quantite === null) return { ok: false, reason: 'QUANTITE_INVALIDE' };
        if (quantite > 0) {
          lignes.push({ itemId: article.id, variante: v.cle, quantite, prixAchat });
          touched.add(article.id);
        }
      }
    } else {
      const quantite = quantityOf(item.quantities[ARRIVAL_SOLO_KEY]);
      if (quantite === null) return { ok: false, reason: 'QUANTITE_INVALIDE' };
      if (quantite > 0) {
        lignes.push({ itemId: article.id, variante: null, quantite, prixAchat });
        touched.add(article.id);
      }
    }
  }
  if (!lignes.length) return { ok: false, reason: 'ARRIVAGE_VIDE' };
  if (lignes.length > ARRIVAL_LINES_MAX) return { ok: false, reason: 'TROP_DE_LIGNES' };
  return { ok: true, value: { lignes, pieces: lignes.reduce((sum, l) => sum + l.quantite, 0), articles: touched.size } };
}

// =============================================================================
// VENTE À EXPÉDIER (bureau web, 15/11) : même règle que l'application
// (`src/v2/domain/proSaleDraft.ts`, mode « À expédier »)
// =============================================================================

/** Transporteurs proposés d'un clic ; le champ reste libre (mêmes noms que l'application). */
export const SALE_CARRIERS: readonly string[] = ['Yalidine', 'ZR Express', 'Maystro', 'Ecotrack', 'Noest'];

export interface ShipDraft {
  transporteur: string;
  livraison: 'domicile' | 'bureau';
  /** Code wilaya du référentiel (« 16 »), `null` : pas encore choisie. */
  wilaya: string | null;
  commune: string;
  fraisText: string;
}

/** Le colis d'une vente à expédier, ou la raison du refus (`TRANSPORTEUR_REQUIS`, `WILAYA_REQUISE`, `MONTANT_INVALIDE`). */
export interface ShipExpedition {
  transporteur: string;
  mode: 'domicile' | 'bureau';
  wilaya: string;
  commune: string | null;
  frais: number | null;
}

export function shipExpeditionOf(draft: ShipDraft): { ok: true; value: ShipExpedition } | { ok: false; reason: string } {
  const transporteur = draft.transporteur.trim();
  if (!transporteur) return { ok: false, reason: 'TRANSPORTEUR_REQUIS' };
  if (!draft.wilaya) return { ok: false, reason: 'WILAYA_REQUISE' };
  const frais = parseAmount(draft.fraisText);
  if (frais !== null && Number.isNaN(frais)) return { ok: false, reason: 'MONTANT_INVALIDE' };
  return { ok: true, value: { transporteur: transporteur.slice(0, 60), mode: draft.livraison, wilaya: draft.wilaya, commune: draft.commune.trim().slice(0, 80) || null, frais } };
}

// =============================================================================
// MODIFIER UN ARTICLE (bureau web, 15/11) : le titre, une promotion (prix barré)
// =============================================================================
//
// Promotion = le nouveau prix devient `prix` et l'ancien part dans `promo.prixBarre`
// (ce que lisent la page boutique et la carte : `promoStrikeOf`, barré seulement s'il
// dépasse le prix). La retirer remet le prix barré comme prix. Même projection sur
// l'annonce que la resynchronisation de l'application (`title`, `price`, `promo`).

export const ARTICLE_TITLE_MAX = 80;

export interface ArticleEdit {
  titre?: string;
  prix?: number;
  /** `null` : promotion retirée. */
  promo?: { prixBarre: number; finMs: number | null } | null;
}

/** Fin d'une promotion choisie au jour (« 2026-11-30 ») : 23 h 59 à Alger (UTC+1). */
export function promoEndMs(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ms = Date.parse(`${day}T22:59:59Z`);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Ce que la fenêtre « Modifier l'article » écrit, ou la raison du refus : `TITRE_REQUIS`,
 * `PRIX_REQUIS` (pas de prix à barrer), `MONTANT_INVALIDE`, `PROMO_TROP_HAUTE` (le prix promo
 * doit être sous le prix actuel), `FIN_PASSEE`, `RIEN_A_CHANGER`.
 */
export function planArticleEdit(
  article: Pick<ShopArticle, 'titre' | 'prix' | 'prixSurDemande' | 'promo' | 'promoPrixBarre'>,
  input: { titleText: string; promoText: string; promoEndDay: string; removePromo: boolean },
  today: string,
): { ok: true; value: ArticleEdit } | { ok: false; reason: string } {
  const edit: ArticleEdit = {};
  const titre = input.titleText.trim().replace(/\s+/g, ' ').slice(0, ARTICLE_TITLE_MAX);
  if (!titre) return { ok: false, reason: 'TITRE_REQUIS' };
  if (titre !== (article.titre ?? '')) edit.titre = titre;
  if (article.promo && input.removePromo) {
    edit.promo = null;
    if (article.promoPrixBarre !== null && article.promoPrixBarre > 0) edit.prix = article.promoPrixBarre;
  } else if (!article.promo && input.promoText.trim()) {
    const current = articlePrice(article);
    if (current === null || current <= 0) return { ok: false, reason: 'PRIX_REQUIS' };
    const promoPrice = parseAmount(input.promoText);
    if (promoPrice === null || Number.isNaN(promoPrice) || promoPrice <= 0) return { ok: false, reason: 'MONTANT_INVALIDE' };
    if (promoPrice >= current) return { ok: false, reason: 'PROMO_TROP_HAUTE' };
    let finMs: number | null = null;
    if (input.promoEndDay) {
      if (input.promoEndDay < today) return { ok: false, reason: 'FIN_PASSEE' };
      finMs = promoEndMs(input.promoEndDay);
    }
    edit.prix = promoPrice;
    edit.promo = { prixBarre: current, finMs };
  }
  if (Object.keys(edit).length === 0) return { ok: false, reason: 'RIEN_A_CHANGER' };
  return { ok: true, value: edit };
}

/**
 * Marque serveur d'une commande Trokacha SOLDÉE au passage aux tailles (`COMMANDE_AVANT_TAILLES`,
 * `functions/src/pro/stockProjection.ts` de l'application) : sa pièce est déjà partie.
 */
export const ORDER_SETTLED_MARK = '@avant';

/** Relecture 7 de Main (m7-3) : la commande de cette proposition est soldée sur cet article. */
export function isSettledOrder(article: Pick<ShopArticle, 'variantesAffectees'> | null | undefined, proposalId: string | null | undefined): boolean {
  if (!article || !proposalId) return false;
  return article.variantesAffectees[proposalId] === ORDER_SETTLED_MARK;
}
