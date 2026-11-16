// lib/pro/shop/orders.ts
// =============================================================================
// « COMMANDES » DE LA BOUTIQUE, côté bureau web (module PUR, aucun Firebase).
// =============================================================================
//
// Trois blocs, comme la maquette B4 de l'application :
//   • À traiter (Trokacha) : les offres reçues sur les annonces de la boutique
//     où c'est au pro de répondre. La RÉPONSE se fait dans l'application (zone
//     des propositions : confirmation, annulation possible, e-mail vérifié) ;
//     le bureau les montre et ouvre la page de l'offre ;
//   • Taille à choisir : commandes Trokacha recopiées au carnet (`m_<matchId>`)
//     dont la taille reste à choisir (`proAssignVariant`, comme le téléphone) ;
//   • Hors Trokacha : ventes notées à la main encore ouvertes (à expédier,
//     mises de côté, expédiées, colis qui reviennent), avec les mêmes étapes
//     que la fiche de l'opération sur le téléphone (`proOperationStep`,
//     `proRecordPayment`).
// Les règles de « à qui de répondre » et d'expiration sont celles de
// l'application (`proposalState.proposalListTab`, `offerExpiry.offerExpiryMs`).
// =============================================================================

import { etapesPossibles, type Etape, type Operation } from '@/lib/pro-core';
import { isRecord, readMillis, readNumber, readString } from '../carnet';
import { buildShopToday } from '../today';

// =============================================================================
// OFFRES TROKACHA (propositions reçues par la boutique)
// =============================================================================

/** `EXPIRE_AFTER_HOURS` des crons serveur (offres en attente et contre-offres). */
export const OFFER_EXPIRY_MS = 72 * 60 * 60 * 1000;

export interface ShopOffer {
  id: string;
  /** « Yacine M. » (prénom et initiale), `null` inconnu. */
  name: string | null;
  adId: string | null;
  /** Montant proposé en dinars (`currentPrice`, sinon `price`), `null` : échange sans argent. */
  amount: number | null;
  counter: boolean;
  createdAt: number;
  /** Instant où le serveur l'expire sans réponse, `null` : jamais par l'ancienneté. */
  expiresAt: number | null;
}

function normalizeStatus(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (['accepted', 'recipient_pending', 'recipient_filled', 'picked_up', 'collected', 'in_transit', 'delivered'].includes(s)) return 'accepted';
  if (s === 'refused' || s === 'rejected') return 'refused';
  if (s === 'expired' || s === 'cancelled' || s === 'counter_offered') return s;
  return 'pending';
}

/** Prénom puis initiale du nom (« Yacine M. ») ; le nom tel quel s'il n'a qu'un mot. */
export function shortPublicName(name: string | null | undefined): string | null {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    const s = readString(v);
    if (s) return s.trim();
  }
  return null;
}

/** Offre de LOCATION (créneau daté) : elle appartient aux Demandes d'une agence, pas aux Commandes. */
export function isRentalProposal(doc: Record<string, unknown>): boolean {
  if (doc.isRental === true) return true;
  const rental = isRecord(doc.rental) ? doc.rental : null;
  return !!rental && !!readString(rental.startDate);
}

function targetAdId(doc: Record<string, unknown>): string | null {
  const direct = readString(doc.receiverAdId);
  if (direct) return direct;
  const list = Array.isArray(doc.receiverAd) ? doc.receiverAd : doc.receiverAd ? [doc.receiverAd] : [];
  const first = list.find(isRecord);
  return first ? readString(first.id) : null;
}

function expiryOf(doc: Record<string, unknown>, status: string): number | null {
  if (isRentalProposal(doc)) return null;
  const base = status === 'counter_offered' ? readMillis(doc.updatedAt) : status === 'pending' ? readMillis(doc.createdAt) : null;
  if (base === null) return null;
  const clock = base + OFFER_EXPIRY_MS;
  const server = readMillis(doc.expiresAt);
  return server !== null && server > clock ? server : clock;
}

/**
 * Une proposition reçue par la boutique, si c'est au pro d'y répondre maintenant (offre en
 * attente qui ne vise pas un créneau gelé, ou contre-offre qui attend sa réponse) et qu'elle
 * n'est ni une location ni échue. Sinon `null`.
 */
export function readShopOffer(id: string, data: unknown, uid: string, now: number): ShopOffer | null {
  if (!isRecord(data)) return null;
  if (data.archived === true || isRentalProposal(data)) return null;
  const receiver = firstString(data.receiverId, data.toUserId);
  if (receiver !== uid) return null;
  const status = normalizeStatus(data.status);
  const pendingFrom = readString(data.pendingResponseFrom);
  const mine = (status === 'pending' && !readString(data.slotHeldBy)) || (status === 'counter_offered' && pendingFrom === uid);
  if (!mine) return null;
  const expiresAt = expiryOf(data, status);
  if (expiresAt !== null && expiresAt <= now) return null;
  const current = readNumber(data.currentPrice);
  const price = readNumber(data.price);
  const amount = current ?? price;
  return {
    id,
    name: shortPublicName(firstString(data.proposerName, data.senderName)),
    adId: targetAdId(data),
    amount: amount !== null && amount > 0 ? Math.round(amount) : null,
    counter: status === 'counter_offered',
    createdAt: readMillis(data.createdAt) ?? 0,
    expiresAt,
  };
}

/** Offres à traiter, la plus proche de l'expiration d'abord, puis la plus récente. */
export function sortOffers(offers: readonly ShopOffer[]): ShopOffer[] {
  return [...offers].sort((a, b) => (a.expiresAt ?? Number.MAX_SAFE_INTEGER) - (b.expiresAt ?? Number.MAX_SAFE_INTEGER) || b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

export type OfferPriceLine = { kind: 'below'; amount: number; listed: number } | { kind: 'atPrice'; amount: number } | { kind: 'amount'; amount: number } | null;

/** Le montant proposé comparé au prix affiché de l'article (`listed`, `null` inconnu). */
export function offerPriceLine(amount: number | null, listed: number | null): OfferPriceLine {
  if (amount === null || amount <= 0) return null;
  if (listed === null || listed <= 0) return { kind: 'amount', amount };
  if (amount === listed) return { kind: 'atPrice', amount };
  if (amount < listed) return { kind: 'below', amount, listed };
  return { kind: 'amount', amount };
}

/** Heures restantes avant l'expiration (arrondi supérieur), `null` sans échéance. */
export function hoursLeft(expiresAt: number | null, now: number): number | null {
  if (expiresAt === null) return null;
  return Math.max(1, Math.ceil((expiresAt - now) / 3_600_000));
}

// =============================================================================
// CARNET : TAILLE À CHOISIR, VENTES HORS TROKACHA
// =============================================================================

/** La commande est conclue : sa pièce est partie (« Cette taille est partie », pas « mettre de côté »). */
export function orderGone(op: Pick<Operation, 'statut'>): boolean {
  return op.statut === 'vendue' || op.statut === 'livree';
}

/**
 * Commande Trokacha recopiée au carnet dont la taille reste à choisir (article à variantes). Relecture 7
 * de Main (m7-3) : jamais pour une commande soldée (`settled`), le serveur la refuse. Relecture 8 (I8-1) :
 * une commande conclue (`vendue`, `livree`) sans taille la demande AUSSI, sinon sa pièce resterait réservée.
 */
export function needsSizeChoice(op: Operation, hasVariants: (itemId: string) => boolean, settled?: (op: Operation) => boolean): boolean {
  return (
    !settled?.(op) &&
    op.type === 'vente' &&
    op.id.startsWith('m_') &&
    !op.variante &&
    op.statut !== 'annulee' &&
    op.statut !== 'retournee' &&
    hasVariants(op.itemId)
  );
}

export interface OutsideSales {
  toShip: Operation[];
  putAside: Operation[];
  shipped: Operation[];
  returning: Operation[];
  /** Somme due par les clients sur toutes les ventes ouvertes (Trokacha comprises). */
  dueTotal: number;
}

/** Ventes ouvertes notées hors Trokacha (une commande recopiée a déjà sa ligne Trokacha). */
export function outsideSalesOf(ops: readonly Operation[]): OutsideSales {
  const today = buildShopToday(ops);
  const handNoted = (op: Operation) => op.origine !== 'trokacha';
  return {
    toShip: today.toShip.filter(handNoted),
    putAside: today.putAside.filter(handNoted),
    shipped: today.shipped.filter(handNoted),
    returning: today.returning.filter(handNoted),
    dueTotal: today.dueTotal,
  };
}

/**
 * Les gestes d'une vente notée à la main, dans l'ordre des boutons (le premier est le geste
 * principal). Mêmes étapes que la fiche de l'opération sur le téléphone ; « encaisser » quand
 * il reste un solde. Le passage « mis de côté → à expédier » reste au téléphone (le transporteur
 * et la wilaya s'y choisissent).
 */
export type SaleAction = { kind: 'step'; etape: Etape } | { kind: 'pay' };

export function saleActionsOf(op: Operation): SaleAction[] {
  if (op.type !== 'vente' || op.origine === 'trokacha') return [];
  const possible = new Set(etapesPossibles('vente', op.statut));
  const out: SaleAction[] = [];
  const step = (etape: Etape) => {
    if (possible.has(etape)) out.push({ kind: 'step', etape });
  };
  switch (op.statut) {
    case 'mise_de_cote':
      if (op.solde > 0) out.push({ kind: 'pay' });
      step('vendue');
      step('annulation');
      break;
    case 'a_expedier':
      step('expediee');
      step('annulation');
      break;
    case 'expediee':
      step('livree');
      step('refusee');
      break;
    case 'refusee':
      step('retournee');
      break;
    default:
      break;
  }
  return out;
}
