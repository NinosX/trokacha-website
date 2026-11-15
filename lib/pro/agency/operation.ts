// lib/pro/agency/operation.ts
// =============================================================================
// FICHE D'UNE RÉSERVATION DU CARNET (bureau web) : module PUR. PORT de
// `src/v2/domain/proOperationView.ts` (application Trokacha) : mêmes gestes,
// même validation que le serveur. À garder aligné avec l'application.
//
//   • GESTES : ceux que la table de transitions permet (`etapesPossibles`), le
//     geste attendu d'abord. Une réservation venue de Trokacha (`origine:
//     'trokacha'`) appartient à son échange : le carnet n'y note que l'état des
//     lieux, l'argent et la caution (le serveur refuse le reste) ;
//   • ÉTAT DES LIEUX : kilomètres et jauge en huitièmes (0 vide, 8 plein) ;
//   • CAUTIONS : rendre, retenir en partie (montant et motif), retenir (motif).
// =============================================================================

import { etapesPossibles, telInternational, type Etape, type EtatDesLieux, type Garantie, type Operation } from '@/lib/pro-core';

export type OperationStepId = Etape;
export type StepTone = 'primary' | 'secondary' | 'danger';
export type StepForm = 'etat' | 'suivi' | 'confirm';

export interface OperationStep {
  id: OperationStepId;
  tone: StepTone;
  form: StepForm;
}

const STEP_RANK: Readonly<Record<OperationStepId, number>> = {
  depart: 0,
  retour: 0,
  cloture: 0,
  vendue: 0,
  expediee: 0,
  livree: 0,
  retournee: 0,
  a_expedier: 1,
  refusee: 2,
  non_presentation: 3,
  annulation: 4,
};

const STEP_TONE: Readonly<Record<OperationStepId, StepTone>> = {
  depart: 'primary',
  retour: 'primary',
  cloture: 'primary',
  vendue: 'primary',
  expediee: 'primary',
  livree: 'primary',
  retournee: 'primary',
  a_expedier: 'secondary',
  refusee: 'secondary',
  non_presentation: 'secondary',
  annulation: 'danger',
};

function stepOf(id: OperationStepId): OperationStep {
  return { id, tone: STEP_TONE[id], form: id === 'depart' || id === 'retour' ? 'etat' : id === 'expediee' ? 'suivi' : 'confirm' };
}

export function isTrokachaOperation(op: Pick<Operation, 'origine'>): boolean {
  return op.origine === 'trokacha';
}

/** Les gestes possibles, le plus attendu d'abord. */
export function operationSteps(op: Operation): OperationStep[] {
  let ids: OperationStepId[];
  if (isTrokachaOperation(op)) {
    if (op.type === 'location') {
      ids = [];
      if ((op.statut === 'reservee' || op.statut === 'en_cours') && !op.depart) ids.push('depart');
      if ((op.statut === 'en_cours' || op.statut === 'rendue') && !op.retour) ids.push('retour');
    } else {
      ids = etapesPossibles(op.type, op.statut).filter((e) => e === 'vendue');
    }
  } else {
    ids = etapesPossibles(op.type, op.statut);
  }
  return ids.map(stepOf).sort((a, b) => STEP_RANK[a.id] - STEP_RANK[b.id]);
}

/** Ce qui reste ouvert au moment de clôturer (la question le rappelle). */
export function closeWarnings(op: Pick<Operation, 'garantieOuverte' | 'solde'>): Array<'deposit' | 'due'> {
  const out: Array<'deposit' | 'due'> = [];
  if (op.garantieOuverte) out.push('deposit');
  if (op.solde > 0) out.push('due');
  return out;
}

// ── État des lieux ──────────────────────────────────────────────────────────

export const KM_MAX = 5_000_000;
export const FUEL_STEPS = 8;

export interface EtatForm {
  km: string;
  carburant: number | null;
  notes: string;
}

export interface EtatInput {
  km: number | null;
  carburant: number | null;
  notes: string | null;
}

export type EtatIssue = 'km' | 'kmBelowDeparture';

export function emptyEtatForm(): EtatForm {
  return { km: '', carburant: null, notes: '' };
}

/** Lit le formulaire ; au retour, un compteur plus bas qu'au départ est une faute de frappe. */
export function readEtatForm(form: EtatForm, departure?: Pick<EtatDesLieux, 'km'> | null): { ok: true; value: EtatInput } | { ok: false; issue: EtatIssue } {
  const digits = form.km.replace(/[\s.  ]/g, '');
  let km: number | null = null;
  if (digits) {
    if (!/^\d+$/.test(digits)) return { ok: false, issue: 'km' };
    km = Number(digits);
    if (!Number.isSafeInteger(km) || km > KM_MAX) return { ok: false, issue: 'km' };
    if (departure && typeof departure.km === 'number' && km < departure.km) return { ok: false, issue: 'kmBelowDeparture' };
  }
  const carburant = form.carburant === null ? null : Math.max(0, Math.min(FUEL_STEPS, Math.round(form.carburant)));
  const notes = form.notes.trim().slice(0, 1000) || null;
  return { ok: true, value: { km, carburant, notes } };
}

/** Kilomètres faits et huitièmes de carburant en moins entre le départ et le retour. */
export function tripDelta(op: Pick<Operation, 'depart' | 'retour'>): { km: number | null; fuel: number | null } {
  const d = op.depart;
  const r = op.retour;
  const km = d && r && typeof d.km === 'number' && typeof r.km === 'number' ? r.km - d.km : null;
  const fuel = d && r && typeof d.carburant === 'number' && typeof r.carburant === 'number' ? d.carburant - r.carburant : null;
  return { km, fuel };
}

/** La charge de `proOperationStep` (avec la version lue : une copie périmée est refusée). */
export function stepPayload(bid: string, op: Pick<Operation, 'id' | 'version'>, etape: OperationStepId, extra: { etat?: EtatInput | null; suivi?: string | null } = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = { bid, opId: op.id, etape, version: op.version };
  if (etape === 'depart' || etape === 'retour') payload.etatDesLieux = extra.etat ?? null;
  if (etape === 'expediee') payload.suivi = extra.suivi?.trim().slice(0, 60) || null;
  return payload;
}

// ── Argent ──────────────────────────────────────────────────────────────────

export function totalPaid(op: Pick<Operation, 'paiements'>): number {
  return op.paiements.reduce((sum, p) => sum + p.montant, 0);
}

// ── Cautions ────────────────────────────────────────────────────────────────

export type SettleChoice = 'rendue' | 'retenue_partielle' | 'retenue';
export type SettleIssue = 'amount' | 'reason';

export interface SettleInput {
  etat: SettleChoice;
  retenue: number | null;
  motif: string | null;
}

/** Choix possibles pour une caution encore tenue (un document se rend ou se garde, jamais « en partie »). */
export function settleChoices(g: Pick<Garantie, 'etat' | 'montant' | 'forme'>): SettleChoice[] {
  if (g.etat !== 'recue') return [];
  return g.montant !== null && g.montant > 0 ? ['rendue', 'retenue_partielle', 'retenue'] : ['rendue', 'retenue'];
}

/** Valide un règlement avec les règles du serveur (motif exigé dès qu'on retient). */
export function readSettle(g: Pick<Garantie, 'montant'>, etat: SettleChoice, retenueText: string, motifText: string): { ok: true; value: SettleInput } | { ok: false; issue: SettleIssue } {
  const motif = motifText.trim().slice(0, 500) || null;
  if (etat === 'rendue') return { ok: true, value: { etat, retenue: null, motif } };
  let retenue: number | null = null;
  if (etat === 'retenue_partielle') {
    const digits = retenueText.replace(/[^\d]/g, '');
    retenue = digits ? Number(digits) : null;
    if (retenue === null || !(retenue > 0) || (g.montant !== null && retenue >= g.montant)) return { ok: false, issue: 'amount' };
  }
  if (!motif) return { ok: false, issue: 'reason' };
  return { ok: true, value: { etat, retenue, motif } };
}

/** Une caution peut encore être ajoutée (location réservée ou en cours, 5 au plus). */
export function canAddDeposit(op: Pick<Operation, 'type' | 'statut' | 'garanties'>): boolean {
  return op.type === 'location' && (op.statut === 'reservee' || op.statut === 'en_cours') && op.garanties.length < 5;
}

// ── Contact ─────────────────────────────────────────────────────────────────

export function telUrl(tel: string | null | undefined): string | null {
  const intl = telInternational(tel ?? '');
  return intl ? `tel:${intl}` : null;
}

export function whatsappUrl(tel: string | null | undefined): string | null {
  const intl = telInternational(tel ?? '');
  return intl ? `https://wa.me/${intl.slice(1)}` : null;
}

export function operationDays(op: Pick<Operation, 'debut' | 'fin'>): number {
  if (!op.debut || !op.fin || !(op.debut < op.fin)) return 0;
  return Math.round((Date.parse(`${op.fin}T00:00:00Z`) - Date.parse(`${op.debut}T00:00:00Z`)) / 86_400_000);
}
