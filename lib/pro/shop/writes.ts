'use client';

// lib/pro/shop/writes.ts
// =============================================================================
// LES ÉCRITURES DU VOLET BOUTIQUE DU BUREAU, par la même voie que l'application :
//   • stock, ventes, arrivages, tailles des commandes, étapes et encaissements :
//     les callables du carnet (`callPro`), comme `shopWrites.ts` du téléphone ;
//   • PRIX d'un article : comme l'écran « Modifier l'article » de l'application
//     (`updateCatalogueArticle` puis `syncArticleToAd`) : le catalogue et
//     l'annonce, dans UN lot (les deux ou rien). Pour un changement de prix
//     seul, la resynchronisation de l'application ne change que `price` sur
//     l'annonce (`price: prixSurDemande ? null : prix`) : c'est ce lot.
//     `price` n'est pas un champ modéré (`adContentModeration.ts`) : pas de
//     nouvelle vérification ; une baisse prévient les favoris (comme l'app).
//     Article programmé : son instantané d'annonce (`adDraft.price`) suit.
// =============================================================================

import { Timestamp, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Etape, MoyenPaiement, SaisieOperation } from '@/lib/pro-core';
import { db } from '@/lib/firebase';
import { callPro, newProId, ProCallableError } from '../callables';
import { SHOP_ERROR_REASONS } from '../texts/shop';
import type { ArrivalLineInput, ArticleEdit, ShopArticle, StockSet } from './catalogue';

/** Clé de texte d'un refus (`boutique.err.*`). */
export function shopErrorKey(error: unknown): string {
  if (error instanceof ProCallableError) {
    if (error.reason && SHOP_ERROR_REASONS.has(error.reason)) return `boutique.err.${error.reason}`;
    if (error.code === 'permission-denied') return 'boutique.err.permission';
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') return 'boutique.err.network';
    return 'boutique.err.generic';
  }
  const code = (error as { code?: unknown } | null)?.code;
  if (code === 'permission-denied') return 'boutique.err.permission';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'boutique.err.network';
  return 'boutique.err.generic';
}

/** Prix d'un article : catalogue et annonce ensemble (les deux ou rien). */
export async function writeArticlePrice(bid: string, article: Pick<ShopArticle, 'id' | 'adId' | 'statut' | 'hasAdDraft'>, prix: number): Promise<void> {
  const batch = writeBatch(db);
  const catalogue: Record<string, unknown> = { prix, updatedAt: serverTimestamp() };
  if (article.statut === 'programme' && article.hasAdDraft) catalogue['adDraft.price'] = prix;
  batch.update(doc(db, 'boutiques', bid, 'catalogue', article.id), catalogue);
  if (article.adId) batch.update(doc(db, 'ads', article.adId), { price: prix, updatedAt: serverTimestamp() });
  await batch.commit();
}

/**
 * Titre et promotion d'un article : catalogue et annonce ensemble (les deux ou rien), comme
 * la resynchronisation de l'application (`title`, `price`, `promo`). Un titre changé sur une
 * annonce en ligne repasse par la vérification habituelle (champ modéré), comme dans l'app.
 */
export async function writeArticleEdit(bid: string, article: Pick<ShopArticle, 'id' | 'adId' | 'statut' | 'hasAdDraft'>, edit: ArticleEdit): Promise<void> {
  const promo =
    edit.promo === undefined ? undefined : edit.promo === null ? null : { prixBarre: edit.promo.prixBarre, ...(edit.promo.finMs !== null ? { fin: Timestamp.fromMillis(edit.promo.finMs) } : {}) };
  const catalogue: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const ad: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const draft = article.statut === 'programme' && article.hasAdDraft;
  if (edit.titre !== undefined) {
    catalogue.titre = edit.titre;
    ad.title = edit.titre;
    if (draft) catalogue['adDraft.title'] = edit.titre;
  }
  if (edit.prix !== undefined) {
    catalogue.prix = edit.prix;
    ad.price = edit.prix;
    if (draft) catalogue['adDraft.price'] = edit.prix;
  }
  if (promo !== undefined) {
    catalogue.promo = promo;
    ad.promo = promo;
    if (draft) catalogue['adDraft.promo'] = promo;
  }
  const batch = writeBatch(db);
  batch.update(doc(db, 'boutiques', bid, 'catalogue', article.id), catalogue);
  if (article.adId) batch.update(doc(db, 'ads', article.adId), ad);
  await batch.commit();
}

/** Fixe le stock compté d'un article (ou d'une variante). Valeur absolue. */
export function adjustStock(bid: string, set: Pick<StockSet, 'itemId' | 'variante' | 'stock'>): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = { bid, itemId: set.itemId, stock: set.stock };
  if (set.variante) data.variante = set.variante;
  return callPro('proAdjustStock', data);
}

/** Une vente déjà validée (`lireSaisieOperation`). */
export function saveSale(saisie: SaisieOperation): Promise<Record<string, unknown>> {
  return callPro('proSaveOperation', saisie as unknown as Record<string, unknown>);
}

/** Un arrivage : identifiant `ar_…` fait par l'appelant (rejouable sans doublon). */
export function receiveArrival(bid: string, input: { arrivageId: string; lignes: ArrivalLineInput[]; fournisseur: string | null }): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = { bid, arrivageId: input.arrivageId, lignes: input.lignes };
  if (input.fournisseur) data.fournisseur = input.fournisseur;
  return callPro('proReceiveArrival', data);
}

/** Taille d'une commande Trokacha (`m_<matchId>`). */
export function assignVariant(bid: string, opId: string, variante: string): Promise<Record<string, unknown>> {
  return callPro('proAssignVariant', { bid, opId, variante });
}

/**
 * Relecture 8 de Main (I8-1) : « Pièce déjà partie ». Commande Trokacha sans taille soldée sans toucher
 * au stock (le pro a déjà refait le compte) ; aucun recomptage ne le fait de lui-même.
 */
export function settleOrder(bid: string, opId: string): Promise<Record<string, unknown>> {
  return callPro('proAssignVariant', { bid, opId, dejaPartie: true });
}

/** Étape d'une vente (version lue à l'écran : un écart refuse au lieu d'écraser). */
export function saleStep(bid: string, input: { opId: string; etape: Etape; version: number; suivi?: string | null }): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = { bid, opId: input.opId, etape: input.etape, version: input.version };
  if (input.etape === 'expediee' && input.suivi) data.suivi = input.suivi;
  return callPro('proOperationStep', data);
}

/** Encaissement sur une vente (identifiant `pa_…` fait par l'appelant). */
export function recordPayment(bid: string, input: { opId: string; moyen: MoyenPaiement; montant: number }): Promise<Record<string, unknown>> {
  return callPro('proRecordPayment', { bid, opId: input.opId, paiementId: newProId('pa'), paiement: { moyen: input.moyen, montant: input.montant } });
}

export interface SeriesResult {
  done: number;
  failed: number;
  /** Clé de texte du premier refus (`boutique.err.*`). */
  firstErrorKey: string | null;
}

/**
 * Gestes EN SÉRIE (prix, stock de dizaines d'articles) : quelques appels à la fois, jamais tous
 * d'un coup ; chaque geste réussit ou échoue seul, le compte rendu dit combien.
 */
export async function runSeries<T>(items: readonly T[], run: (item: T) => Promise<unknown>, onProgress?: (done: number, total: number) => void, concurrency = 4): Promise<SeriesResult> {
  let next = 0;
  let done = 0;
  let failed = 0;
  let firstErrorKey: string | null = null;
  const total = items.length;
  const worker = async () => {
    while (next < total) {
      const item = items[next];
      next += 1;
      try {
        await run(item);
        done += 1;
      } catch (error) {
        failed += 1;
        if (!firstErrorKey) firstErrorKey = shopErrorKey(error);
      }
      onProgress?.(done + failed, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  return { done, failed, firstErrorKey };
}

export { newProId };
