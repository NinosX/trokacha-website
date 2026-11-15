// lib/pro/agency/requests.ts
// =============================================================================
// « DEMANDES » DE L'AGENCE (bureau web) : module PUR. PORT de
// `src/v2/domain/proRequests.ts` (application Trokacha, maquette L4) : les
// demandes de location Trokacha rangées par BIEN, chacune avec UNE ligne
// d'état (dates déjà prises, chevauche une autre demande, a déjà loué chez
// vous), et le groupe « En attente » des demandes gelées par une location
// acceptée (le serveur pose `slotHeldBy` ; elles ne comptent jamais).
//
// Lecture des propositions : on garde ce que le téléphone classe « à traiter »
// (ouverte, c'est au pro de répondre), « j'attends le locataire » (ouverte,
// c'est au membre) pour les pointillés du planning, et « gelée » (`slotHeldBy`).
// Version allégée de `deriveProposalView` : une demande dont le premier jour
// est passé (Alger) est close, comme la nuit du serveur le fera.
// Répondre (accepter, refuser) reste dans l'application : la page de la
// demande garde la confirmation, l'annulation possible et l'e-mail vérifié.
// =============================================================================

import { occupeLeCalendrier, plageOccupee, plagesSeChevauchent, type ClientFiche, type Operation } from '@/lib/pro-core';
import { isRecord, readMillis, readNumber, readString } from '../carnet';
import type { PlanningRequest } from './planning';
import type { RentalUnit } from './units';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const PAST_RENTAL = new Set(['en_cours', 'rendue', 'cloturee']);

export type ProposalPhase = 'todo' | 'waiting' | 'held';

/** Une demande de location reçue par l'espace, lue sans jamais lever. */
export interface RentalProposal {
  id: string;
  phase: ProposalPhase;
  adId: string | null;
  start: string;
  end: string;
  kind: 'car' | 'immo';
  proposerId: string | null;
  /** « Yacine M. » (prénom et initiale), sinon `null`. */
  name: string | null;
  amount: number | null;
  createdAt: number | null;
  /** Match qui tient les dates (demande gelée). */
  heldBy: string | null;
  adTitle: string | null;
  adImage: string | null;
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    const s = readString(v);
    if (s) return s.trim();
  }
  return null;
}

/** « Yacine Meziane » → « Yacine M. » (même abrégé que l'application). */
export function abbreviateName(full: string | null | undefined): string | null {
  const name = String(full ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return null;
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  const last = Array.from(parts[parts.length - 1])[0] ?? '';
  return `${parts.slice(0, -1).join(' ')} ${last.toLocaleUpperCase()}.`;
}

function receiverAds(doc: Record<string, unknown>): Record<string, unknown>[] {
  const raw = doc.receiverAd;
  const list = Array.isArray(raw) ? raw : isRecord(raw) ? [raw] : [];
  return list.filter(isRecord);
}

function imageOf(snapshot: Record<string, unknown> | null): string | null {
  if (!snapshot) return null;
  const direct = readString(snapshot.image) ?? readString(snapshot.imageUrl);
  if (direct) return direct;
  const images = Array.isArray(snapshot.images) ? snapshot.images : [];
  for (const image of images) {
    const url = typeof image === 'string' ? image : isRecord(image) ? readString(image.url) : null;
    if (url) return url;
  }
  return null;
}

const CLOSED = new Set(['accepted', 'recipient_pending', 'recipient_filled', 'picked_up', 'collected', 'in_transit', 'delivered', 'refused', 'rejected', 'expired', 'cancelled']);

/**
 * Une proposition REÇUE par `uid`, datée (location), encore ouverte et pas passée ;
 * `null` sinon (achat, troc, close, dates passées, envoyée par le pro lui-même).
 */
export function readRentalProposal(id: string, data: unknown, uid: string, today: string): RentalProposal | null {
  if (!isRecord(data)) return null;
  const status = String(data.status ?? '').trim().toLowerCase();
  if (CLOSED.has(status)) return null;
  const rental = isRecord(data.rental) ? data.rental : null;
  const start = rental ? readString(rental.startDate) : null;
  const end = rental ? readString(rental.endDate) : null;
  if (!start || !end || !DAY_RE.test(start) || !DAY_RE.test(end) || !(start < end)) return null;
  // Premier jour passé : la demande est close (miroir de la nuit du serveur).
  if (start < today) return null;
  const receiverId = firstString(data.receiverId, data.toUserId);
  const proposerId = firstString(data.proposerId, data.senderId, data.fromUserId);
  if (receiverId !== uid || proposerId === uid) return null;
  const heldBy = readString(data.slotHeldBy);
  const pendingFrom = readString(data.pendingResponseFrom) ?? receiverId;
  const phase: ProposalPhase = heldBy ? 'held' : pendingFrom === uid ? 'todo' : 'waiting';
  const ads = receiverAds(data);
  const adId = readString(data.receiverAdId) ?? readString(ads[0]?.id);
  const snapshot = (adId ? ads.find((ad) => readString(ad.id) === adId) : null) ?? ads[0] ?? null;
  const name = firstString(data.proposerName, data.senderName, snapshot?.ownerName);
  return {
    id,
    phase,
    adId,
    start,
    end,
    kind: readString(rental?.kind) === 'immo' ? 'immo' : 'car',
    proposerId,
    name: abbreviateName(name),
    amount: readNumber(data.currentPrice) ?? readNumber(data.price),
    createdAt: readMillis(data.createdAt),
    heldBy,
    adTitle: readString(snapshot?.title),
    adImage: imageOf(snapshot),
  };
}

/** « Nadia B. » → « NB », « Sara » → « S ». */
export function initialsOfName(name: string | null | undefined): string {
  const parts = (name ?? '').replace(/[.]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = Array.from(parts[0])[0] ?? '';
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

/** Prénom seul (« Nadia B. » → « Nadia »). */
export function firstNameOfName(name: string | null | undefined): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? first : null;
}

export interface RentalRequestEntry {
  proposal: RentalProposal;
  id: string;
  itemId: string | null;
  start: string;
  end: string;
  days: number;
  name: string | null;
  initials: string;
  kind: 'car' | 'immo';
  /** Prénom de la demande arrivée avant sur les mêmes jours (`''` : nom inconnu), sinon `null`. */
  overlapsWith: string | null;
  /** Les jours sont déjà pris au carnet (réservation ou blocage). */
  taken: boolean;
  repeatClient: boolean;
  /** Demande gelée : prénom de la location acceptée qui tient ses dates (`''` : inconnu) ; `null` sinon. */
  holder: string | null;
}

export interface RequestGroup {
  key: string;
  itemId: string | null;
  adId: string | null;
  title: string | null;
  photo: string | null;
  requests: RentalRequestEntry[];
  held: RentalRequestEntry[];
}

export interface RentalRequests {
  groups: RequestGroup[];
  /** Demandes à traiter (les demandes en attente n'y sont pas). */
  count: number;
}

/** Le membre a-t-il déjà loué chez ce pro ? */
export function isRepeatClient(uid: string | null, clients: readonly ClientFiche[], ops: readonly Operation[]): boolean {
  if (!uid) return false;
  const ficheId = `uid_${uid}`;
  if (clients.some((c) => (c.id === ficheId || c.uid === uid) && c.stats.operations > 0)) return true;
  return ops.some((op) => op.clientId === ficheId && op.type === 'location' && PAST_RENTAL.has(op.statut));
}

function byArrival(a: RentalRequestEntry, b: RentalRequestEntry): number {
  return (
    (a.start < b.start ? -1 : a.start > b.start ? 1 : 0) ||
    (a.proposal.createdAt ?? Number.MAX_SAFE_INTEGER) - (b.proposal.createdAt ?? Number.MAX_SAFE_INTEGER) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export interface RentalRequestsInput {
  proposals: readonly RentalProposal[];
  units: readonly RentalUnit[];
  ops: readonly Operation[];
  clients?: readonly ClientFiche[];
  today: string;
}

export function buildRentalRequests({ proposals, units, ops, clients = [], today }: RentalRequestsInput): RentalRequests {
  const byAd = new Map<string, RentalUnit>();
  for (const unit of units) if (unit.adId) byAd.set(unit.adId, unit);
  const groups = new Map<string, RequestGroup>();
  let count = 0;
  const seen = new Set<string>();

  for (const proposal of proposals) {
    if (seen.has(proposal.id) || proposal.phase === 'waiting') continue;
    seen.add(proposal.id);
    const frozen = proposal.phase === 'held';
    const unit = proposal.adId ? byAd.get(proposal.adId) ?? null : null;
    const key = unit ? `item:${unit.id}` : `ad:${proposal.adId ?? proposal.id}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, itemId: unit?.id ?? null, adId: proposal.adId, title: unit?.titre || proposal.adTitle || null, photo: unit?.photo ?? proposal.adImage, requests: [], held: [] };
      groups.set(key, group);
    }
    const range = { start: proposal.start, end: proposal.end };
    const blocked = (unit?.blockedRanges ?? []).some((b) => plagesSeChevauchent(range, b));
    const booked =
      !!unit &&
      ops.some((op) => {
        if (op.itemId !== unit.id || !occupeLeCalendrier(op)) return false;
        const p = plageOccupee(op, today);
        return !!p && plagesSeChevauchent(range, p);
      });
    const holderName = frozen && proposal.heldBy ? ops.find((op) => op.matchId === proposal.heldBy || op.id === `m_${proposal.heldBy}`)?.clientNom ?? null : null;
    const entry: RentalRequestEntry = {
      proposal,
      id: proposal.id,
      itemId: unit?.id ?? null,
      start: proposal.start,
      end: proposal.end,
      days: Math.round((Date.parse(`${proposal.end}T00:00:00Z`) - Date.parse(`${proposal.start}T00:00:00Z`)) / DAY_MS),
      name: proposal.name,
      initials: initialsOfName(proposal.name),
      kind: unit?.kind === 'immo' || proposal.kind === 'immo' ? 'immo' : 'car',
      overlapsWith: null,
      taken: blocked || booked,
      repeatClient: isRepeatClient(proposal.proposerId, clients, ops),
      holder: frozen ? firstNameOfName(holderName) ?? '' : null,
    };
    if (frozen) group.held.push(entry);
    else {
      count += 1;
      group.requests.push(entry);
    }
  }

  const ordered = [...groups.values()];
  for (const group of ordered) {
    group.requests.sort(byArrival);
    group.held.sort(byArrival);
    group.requests.forEach((entry, index) => {
      const before = group.requests.slice(0, index).find((other) => plagesSeChevauchent(entry, other));
      if (before) entry.overlapsWith = firstNameOfName(before.name) ?? '';
    });
  }
  const firstStart = (g: RequestGroup) => (g.requests[0] ?? g.held[0])?.start ?? '';
  ordered.sort((a, b) => {
    const wa = a.requests.length ? 0 : 1;
    const wb = b.requests.length ? 0 : 1;
    if (wa !== wb) return wa - wb;
    const sa = firstStart(a);
    const sb = firstStart(b);
    return (sa < sb ? -1 : sa > sb ? 1 : 0) || (a.key < b.key ? -1 : 1);
  });
  return { groups: ordered, count };
}

export type RequestStatusLine = { kind: 'taken' } | { kind: 'overlap'; name: string | null } | { kind: 'repeat' } | { kind: 'none' };

/** La ligne d'état d'une demande (une seule). */
export function requestStatusLine(entry: Pick<RentalRequestEntry, 'taken' | 'overlapsWith' | 'repeatClient'>): RequestStatusLine {
  if (entry.taken) return { kind: 'taken' };
  if (entry.overlapsWith !== null) return { kind: 'overlap', name: entry.overlapsWith || null };
  if (entry.repeatClient) return { kind: 'repeat' };
  return { kind: 'none' };
}

/** Les demandes en pointillés du planning : à traiter et où l'on attend le locataire (bien connu seulement). */
export function planningRequestsOf(proposals: readonly RentalProposal[], units: readonly RentalUnit[]): PlanningRequest[] {
  const byAd = new Map<string, string>();
  for (const unit of units) if (unit.adId) byAd.set(unit.adId, unit.id);
  const out: PlanningRequest[] = [];
  const seen = new Set<string>();
  for (const p of proposals) {
    if (seen.has(p.id) || p.phase === 'held') continue;
    seen.add(p.id);
    const itemId = p.adId ? byAd.get(p.adId) : undefined;
    if (!itemId) continue;
    out.push({ id: p.id, itemId, start: p.start, end: p.end, name: p.name });
  }
  return out;
}
