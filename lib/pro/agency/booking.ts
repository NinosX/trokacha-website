// lib/pro/agency/booking.ts
// =============================================================================
// « NOUVELLE RÉSERVATION » NOTÉE À LA MAIN (bureau web) : module PUR. PORT de
// `src/v2/domain/proBooking.ts` (application Trokacha, maquette L3) : même
// brouillon, même prix, même saisie envoyée à `proSaveOperation`, validée par
// `lireSaisieOperation` avant l'envoi (le serveur la rejoue toujours). À garder
// aligné avec l'application.
//
//   • PRIX : jours × prix du palier qui couvre la durée (`prixParJour`, même règle
//     que le serveur). Un total retouché part en `lignes` (sinon `null`) ;
//   • CAUTION : une somme (espèces ou chèque) ET, au besoin, un document gardé ;
//   • DISPONIBILITÉ : prévenue ici (blocages, réservations vivantes, tampon de
//     ménage) ; le serveur tranche (`DATES_PRISES`) ;
//   • « PRIS PAR » : jamais `trokacha` (réservé aux recopies de la marketplace).
// =============================================================================

import {
  addDays,
  daysBetween,
  isValidDay,
  isValidHeure,
  lireSaisieOperation,
  occupeLeCalendrier,
  ORIGINES_SAISIES,
  plageOccupee,
  plagesSeChevauchent,
  prixParJour,
  telInternational,
  type ClientFiche,
  type GarantieSaisie,
  type LieuRemise,
  type LigneMontant,
  type MoyenPaiement,
  type Operation,
  type Origine,
  type PalierPrix,
  type Plage,
  type Resultat,
  type SaisieOperation,
} from '@/lib/pro-core';

export type BookingOrigin = Exclude<Origine, 'trokacha'>;

/** Les trois origines du quotidien, en tête ; « Autre » déplie le reste. */
export const BOOKING_ORIGINS_MAIN: readonly BookingOrigin[] = ['telephone', 'comptoir', 'whatsapp'];

export const BOOKING_ORIGINS_MORE: readonly BookingOrigin[] = (ORIGINES_SAISIES as readonly Origine[]).filter(
  (o): o is BookingOrigin => o !== 'trokacha' && !(BOOKING_ORIGINS_MAIN as readonly string[]).includes(o),
);

export type DepositForm = 'especes' | 'cheque';
export const DEPOSIT_FORMS: readonly DepositForm[] = ['especes', 'cheque'];
export const HANDOVER_PLACES: readonly LieuRemise[] = ['agence', 'aeroport', 'domicile'];

export interface BookingClient {
  /** Fiche existante (`tel_…`, `uid_…`, `cl_…`) ; `null` = nouveau client (le serveur fait la fiche). */
  id: string | null;
  nom: string;
  tel: string;
}

export interface BookingDraft {
  itemId: string | null;
  debut: string | null;
  /** Jour du retour (fin EXCLUSIVE). */
  fin: string | null;
  heureDebut: string;
  heureFin: string;
  client: BookingClient;
  /** Total retouché à la main ; `null` = calculé. */
  totalSaisi: number | null;
  caution: number | null;
  cautionForme: DepositForm;
  document: string;
  remise: LieuRemise;
  adresse: string;
  origine: BookingOrigin;
  acompte: number | null;
  acompteMoyen: MoyenPaiement;
  notes: string;
}

export function emptyBookingDraft(input: { itemId?: string | null; debut?: string | null; caution?: number | null } = {}): BookingDraft {
  const debut = isValidDay(input.debut) ? input.debut : null;
  return {
    itemId: input.itemId ?? null,
    debut,
    fin: null,
    heureDebut: '',
    heureFin: '',
    client: { id: null, nom: '', tel: '' },
    totalSaisi: null,
    caution: typeof input.caution === 'number' && input.caution > 0 ? Math.round(input.caution) : null,
    cautionForme: 'especes',
    document: '',
    remise: 'agence',
    adresse: '',
    origine: 'telephone',
    acompte: null,
    acompteMoyen: 'especes',
    notes: '',
  };
}

// ── Saisies tapées ──────────────────────────────────────────────────────────

/** « 19 500 », « 19500 DA », « 19.500 » → 19500 ; vide ou illisible → `null`. */
export function parseAmount(text: string | null | undefined): number | null {
  const digits = String(text ?? '').replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

/** Heure tapée → 'HH:MM' ; vide → `null` ; illisible → `false` (« 9 », « 9h30 », « 0930 », « 21.15 »). */
export function normalizeHeure(text: string | null | undefined): string | null | false {
  const raw = String(text ?? '').trim().toLowerCase();
  if (!raw) return null;
  let h: number;
  let m: number;
  const sep = /^(\d{1,2})\s*[h:.]\s*(\d{0,2})$/.exec(raw);
  if (sep) {
    h = Number(sep[1]);
    m = sep[2] ? Number(sep[2]) : 0;
  } else if (/^\d{1,2}$/.test(raw)) {
    h = Number(raw);
    m = 0;
  } else if (/^\d{3,4}$/.test(raw)) {
    h = Number(raw.slice(0, raw.length - 2));
    m = Number(raw.slice(-2));
  } else return false;
  const out = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return isValidHeure(out) ? out : false;
}

/** Format du numéro : un seul, celui du bureau (`lib/pro/shared/format.ts`). */
export { displayPhone } from '@/lib/pro/shared/format';

/** Fiches récentes qui répondent à la recherche (nom sans accents, ou chiffres du numéro). */
export function searchClients(clients: readonly ClientFiche[], query: string, max = 6): ClientFiche[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = fold(query);
  const digits = query.replace(/\D/g, '');
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  const out = clients.filter((c) => {
    if (!q) return true;
    if (fold(c.nom).includes(q)) return true;
    if (local.length >= 3 && (c.tel ?? '').replace(/\D/g, '').includes(local)) return true;
    return false;
  });
  return out.slice(0, max);
}

// ── Prix ────────────────────────────────────────────────────────────────────

export interface BookingQuote {
  days: number;
  perDay: number | null;
  computed: number | null;
  total: number | null;
  edited: boolean;
}

export function bookingDays(debut: string | null, fin: string | null): number {
  if (!isValidDay(debut) || !isValidDay(fin) || !(debut < fin)) return 0;
  return daysBetween(debut, fin);
}

export function bookingQuote(tiers: readonly PalierPrix[] | null | undefined, debut: string | null, fin: string | null, totalSaisi: number | null): BookingQuote {
  const days = bookingDays(debut, fin);
  const perDay = days > 0 ? prixParJour(tiers, days) : null;
  const computed = perDay !== null ? days * perDay : null;
  const total = totalSaisi !== null ? totalSaisi : computed;
  return { days, perDay, computed, total, edited: totalSaisi !== null && totalSaisi !== computed };
}

/** Lignes envoyées : `null` quand le serveur calcule la même chose ; sinon le total retouché. */
export function bookingLines(quote: BookingQuote, libelle: string): LigneMontant[] | null {
  if (!quote.edited && quote.computed !== null) return null;
  if (quote.total === null || quote.days <= 0) return null;
  if (quote.total % quote.days === 0) return [{ libelle, quantite: quote.days, prix: quote.total / quote.days }];
  return [{ libelle, quantite: 1, prix: quote.total }];
}

// ── Disponibilité (avant l'envoi ; le serveur tranche) ──────────────────────

export interface BookingConflict {
  kind: 'booking' | 'blocked';
  start: string;
  end: string;
  opId: string | null;
  name: string | null;
}

/** Plage que la réservation occupera : [début, retour + tampon de ménage). */
export function bookingRange(debut: string, fin: string, tamponJours: number | null | undefined): Plage {
  return { start: debut, end: addDays(fin, Math.max(0, Math.min(30, Math.floor(tamponJours ?? 0)))) };
}

export function bookingConflicts(
  range: Plage,
  input: { itemId: string; blockedRanges?: readonly { start: string; end: string }[] | null; ops: readonly Operation[]; today: string },
): BookingConflict[] {
  const out: BookingConflict[] = [];
  for (const b of input.blockedRanges ?? []) {
    if (b && isValidDay(b.start) && isValidDay(b.end) && b.start < b.end && plagesSeChevauchent(range, b)) {
      out.push({ kind: 'blocked', start: b.start, end: b.end, opId: null, name: null });
    }
  }
  const seen = new Set<string>();
  for (const op of input.ops) {
    if (seen.has(op.id) || op.itemId !== input.itemId || !occupeLeCalendrier(op)) continue;
    seen.add(op.id);
    const p = plageOccupee(op, input.today);
    if (p && plagesSeChevauchent(range, p)) out.push({ kind: 'booking', start: p.start, end: p.end, opId: op.id, name: op.clientNom ?? null });
  }
  return out;
}

/** Plages déjà prises d'un bien (blocages, réservations vivantes avec leur tampon). */
export function unavailableRanges(input: { itemId: string; blockedRanges: readonly Plage[]; ops: readonly Operation[]; today: string }): Plage[] {
  const out: Plage[] = [...input.blockedRanges];
  for (const op of input.ops) {
    if (op.itemId !== input.itemId || !occupeLeCalendrier(op)) continue;
    const p = plageOccupee(op, input.today);
    if (p) out.push(p);
  }
  return out;
}

/** Demandes Trokacha en attente sur ces jours : le serveur les refusera dès la réservation notée. */
export function overlappingRequests<T extends { itemId: string; start: string; end: string }>(range: Plage, itemId: string, requests: readonly T[]): T[] {
  return requests.filter((r) => r.itemId === itemId && plagesSeChevauchent(range, { start: r.start, end: r.end }));
}

// ── Validation et saisie ────────────────────────────────────────────────────

export type BookingIssue = 'unit' | 'dates' | 'returnDay' | 'time' | 'phone' | 'price' | 'deposit' | 'advance';

export function bookingIssues(draft: BookingDraft, quote: BookingQuote): BookingIssue[] {
  const issues: BookingIssue[] = [];
  if (!draft.itemId) issues.push('unit');
  if (!isValidDay(draft.debut)) issues.push('dates');
  else if (!isValidDay(draft.fin) || !(draft.debut < draft.fin)) issues.push('returnDay');
  if (normalizeHeure(draft.heureDebut) === false || normalizeHeure(draft.heureFin) === false) issues.push('time');
  if (draft.client.tel.trim() && !telInternational(draft.client.tel)) issues.push('phone');
  if (quote.days > 0 && (quote.total === null || quote.total <= 0)) issues.push('price');
  if (draft.caution !== null && draft.caution < 0) issues.push('deposit');
  if (draft.acompte !== null && draft.acompte > 0 && quote.total !== null && draft.acompte > quote.total) issues.push('advance');
  return issues;
}

export function bookingGuarantees(draft: Pick<BookingDraft, 'caution' | 'cautionForme' | 'document'>): GarantieSaisie[] {
  const out: GarantieSaisie[] = [];
  if (draft.caution !== null && draft.caution > 0) out.push({ forme: draft.cautionForme, montant: draft.caution });
  const document = draft.document.trim();
  if (document) out.push({ forme: 'document', montant: null, details: { document: document.slice(0, 60) } });
  return out;
}

export interface BookingSaisieContext {
  bid: string;
  opId: string;
  libelle: string;
  quote: BookingQuote;
}

/** La saisie telle qu'elle part (avant `lireSaisieOperation`) : même forme que l'application. */
export function bookingSaisie(draft: BookingDraft, ctx: BookingSaisieContext): Record<string, unknown> {
  const heureDebut = normalizeHeure(draft.heureDebut);
  const heureFin = normalizeHeure(draft.heureFin);
  const nom = draft.client.nom.trim();
  const tel = draft.client.tel.trim();
  const client = draft.client.id || nom || tel ? { id: draft.client.id, nom: nom || null, tel: tel || null } : null;
  const adresse = draft.adresse.trim();
  return {
    bid: ctx.bid,
    opId: ctx.opId,
    type: 'location',
    origine: draft.origine,
    itemId: draft.itemId,
    variante: null,
    quantite: 1,
    debut: draft.debut,
    fin: draft.fin,
    heureDebut: heureDebut || null,
    heureFin: heureFin || null,
    remise: draft.remise === 'agence' && !adresse ? null : { lieu: draft.remise, adresse: adresse || null },
    client,
    lignes: bookingLines(ctx.quote, ctx.libelle),
    paiement: draft.acompte !== null && draft.acompte > 0 ? { moyen: draft.acompteMoyen, montant: draft.acompte } : null,
    garanties: bookingGuarantees(draft),
    expedition: null,
    statutVente: null,
    notes: draft.notes.trim() || null,
  };
}

export function readBookingSaisie(draft: BookingDraft, ctx: BookingSaisieContext): Resultat<SaisieOperation> {
  return lireSaisieOperation(bookingSaisie(draft, ctx));
}
