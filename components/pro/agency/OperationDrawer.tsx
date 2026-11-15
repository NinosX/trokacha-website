'use client';

// components/pro/agency/OperationDrawer.tsx
// =============================================================================
// FICHE D'UNE RÉSERVATION, ouverte depuis le planning (même fiche que
// `ProOperationScreen` du téléphone) : état, client, dates, gestes permis
// (Départ, Retour, Clôturer, Pas venu, Annuler), état des lieux (compteur,
// jauge en huitièmes, remarques), argent (encaisser, rendre un trop-perçu),
// cautions (prendre, rendre, retenir en partie, retenir). Chaque geste passe
// par sa callable (`proOperationStep`, `proRecordPayment`, `proSettleGuarantee`,
// `proAddGuarantee`) avec un identifiant fait ici : rejouer ne double rien.
// La fiche suit l'opération en direct jusqu'au bout (même clôturée).
// =============================================================================

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { argentRetenu, jourAlgerDe, MOYENS_PAIEMENT, type Garantie, type MoyenPaiement, type Operation } from '@/lib/pro-core';
import { callPro, newProId } from '@/lib/pro/callables';
import { bookingGuarantees, DEPOSIT_FORMS, displayPhone, parseAmount, type DepositForm } from '@/lib/pro/agency/booking';
import { useOperation } from '@/lib/pro/agency/hooks';
import {
  canAddDeposit,
  closeWarnings,
  emptyEtatForm,
  FUEL_STEPS,
  isTrokachaOperation,
  operationDays,
  operationSteps,
  readEtatForm,
  readSettle,
  settleChoices,
  stepPayload,
  telUrl,
  totalPaid,
  tripDelta,
  whatsappUrl,
  type EtatForm,
  type EtatInput,
  type OperationStep,
  type SettleChoice,
} from '@/lib/pro/agency/operation';
import { bookingRangeText, errorText, lengthText, shortDay } from '@/lib/pro/agency/text';
import type { RentalKind, RentalUnit } from '@/lib/pro/agency/units';
import { buildDeskDocument, deskDocuments } from '@/lib/pro/shared/documents';
import { useClient, useReglagesDocuments } from '@/lib/pro/shared/hooks';
import type { ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { DocumentButtons } from '../shared/DocumentButtons';
import { AgencyIcon } from './icons';
import { Button, Chip, ChipRow, Dialog, Drawer, FieldLabel, Notice, inputClass } from './ui';

type Sheet =
  | { kind: 'step'; step: OperationStep }
  | { kind: 'pay'; paiementId: string; refund: boolean }
  | { kind: 'settle'; garantie: Garantie; choice: SettleChoice }
  | { kind: 'deposit' };

function statusTone(op: Operation): string {
  if (op.statut === 'annulee' || op.statut === 'non_presentee') return 'bg-tradeBg text-tradeInk';
  if (op.statut === 'rendue') return 'bg-[#FEF3C7] text-[#92400E]';
  if (op.statut === 'cloturee') return 'bg-matchBg text-matchInk';
  return 'bg-cashBg text-cash';
}

function stepLabel(step: OperationStep, kind: RentalKind, op: Operation, x: ProTexts): string {
  if (isTrokachaOperation(op) && (step.id === 'depart' || step.id === 'retour')) return x.t(`ag.operation.stepTrokacha.${step.id}`);
  if (kind === 'immo' && (step.id === 'depart' || step.id === 'retour')) return x.t(`ag.operation.stepImmo.${step.id}`);
  return x.t(`ag.operation.step.${step.id}`);
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 font-display text-[19px] font-bold text-ink">{title}</h3>
      <div className="space-y-2 rounded-card border border-line bg-white px-5 py-4">{children}</div>
    </section>
  );
}

function AmountLine({ label, amount, strong = false, tone = 'ink' }: { label: string; amount: string; strong?: boolean; tone?: 'ink' | 'muted' | 'warning' | 'success' }) {
  const color = tone === 'muted' ? 'text-inkMuted' : tone === 'warning' ? 'text-[#B45309]' : tone === 'success' ? 'text-matchInk' : 'text-ink';
  return (
    <div className={`flex items-baseline justify-between gap-4 text-[15px] ${color} ${strong ? 'font-semibold' : ''}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tabular-nums">{amount}</span>
    </div>
  );
}

export function OperationDrawer({
  bid,
  opId,
  texts,
  today,
  kind,
  units,
  onClose,
}: {
  bid: string;
  opId: string;
  texts: ProTexts;
  today: string;
  kind: RentalKind;
  /** Les biens de l'espace (plaque, adresse et sorte du bien, pour les documents). */
  units: readonly RentalUnit[];
  onClose: () => void;
}) {
  const t = texts.t;
  const { op, status } = useOperation(bid, opId);
  const { space } = useProDesk();
  const reglages = useReglagesDocuments(bid);
  const fiche = useClient(bid, op?.clientId ?? null);
  const unit = op ? units.find((u) => u.id === op.itemId) ?? null : null;
  const unitKind: RentalKind = unit?.kind ?? kind;
  const docKinds = useMemo(() => (op ? deskDocuments(op, unitKind) : []), [op, unitKind]);
  const buildDocument = useCallback(
    (sorte: Parameters<typeof buildDeskDocument>[0]['sorte']) => {
      if (!op) throw new Error('no-op');
      return buildDeskDocument({
        sorte,
        op,
        space,
        bien: { titre: unit?.titre || op.itemTitre, plaque: unit?.plaque ?? null, adresse: unit?.adresse ?? null, kind: unitKind },
        client: op.clientId && fiche.data?.id === op.clientId ? fiche.data : null,
        reglages: reglages.data,
        variante: null,
        now: Date.now(),
      });
    },
    [fiche.data, op, reglages.data, space, unit, unitKind],
  );
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const openSheet = useCallback((next: Sheet) => {
    setError(null);
    setSheet(next);
  }, []);
  const closeSheet = useCallback(() => {
    if (!busy) setSheet(null);
  }, [busy]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, done: string) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        setSheet(null);
        setSaved(done);
        window.setTimeout(() => setSaved((s) => (s === done ? null : s)), 4000);
      } catch (e) {
        setError(errorText(e, texts));
      } finally {
        setBusy(false);
      }
    },
    [texts],
  );

  const dayOf = useCallback((ms: number) => texts.relativeDay(jourAlgerDe(ms), today), [texts, today]);

  const title = op ? <h2 className="font-display text-[26px] font-bold leading-tight text-ink"><bdi>{op.itemTitre || t('ag.unit.untitled')}</bdi></h2> : <span />;

  return (
    <Drawer open title={title} onClose={() => (sheet ? closeSheet() : onClose())} closeLabel={t('ag.operation.back')}>
      {status === 'loading' ? <p className="text-inkMuted">{t('ag.web.loadingBooking')}</p> : null}
      {status !== 'loading' && !op ? <Notice tone="muted">{t('ag.operation.missing')}</Notice> : null}
      {op ? (
        <OperationBody
          op={op}
          texts={texts}
          today={today}
          kind={kind}
          dayOf={dayOf}
          busy={busy}
          saved={saved}
          onStep={(step) => openSheet({ kind: 'step', step })}
          onPay={(refund) => openSheet({ kind: 'pay', paiementId: newProId('pa'), refund })}
          onSettle={(garantie, choice) => openSheet({ kind: 'settle', garantie, choice })}
          onAddDeposit={() => openSheet({ kind: 'deposit' })}
          documents={
            docKinds.length ? (
              <section className="mt-6">
                <h3 className="mb-1 font-display text-[19px] font-bold text-ink">{t('doc.section')}</h3>
                <p className="mb-3 text-[14px] text-inkMuted">{t('doc.hint')}</p>
                <DocumentButtons kinds={docKinds} build={buildDocument} texts={texts} />
              </section>
            ) : null
          }
        />
      ) : null}

      {op && sheet?.kind === 'step' ? (
        <StepDialog
          op={op}
          step={sheet.step}
          kind={kind}
          texts={texts}
          busy={busy}
          error={error}
          onClose={closeSheet}
          onSubmit={(extra) => void run(() => callPro('proOperationStep', stepPayload(bid, op, sheet.step.id, extra)), t('ag.operation.stepSaved'))}
        />
      ) : null}
      {op && sheet?.kind === 'pay' ? (
        <PayDialog
          texts={texts}
          refund={sheet.refund}
          suggested={sheet.refund ? Math.max(0, -op.solde) : op.solde > 0 ? op.solde : null}
          busy={busy}
          error={error}
          onClose={closeSheet}
          onSubmit={(value) => {
            const pay = sheet;
            // Un remboursement est un paiement négatif (droit « rembourser » au serveur).
            void run(
              () => callPro('proRecordPayment', { bid, opId: op.id, paiementId: pay.paiementId, paiement: { moyen: value.moyen, montant: pay.refund ? -value.montant : value.montant } }),
              t(pay.refund ? 'ag.operation.pay.refunded' : 'ag.operation.pay.saved', { amount: texts.money(value.montant) }),
            );
          }}
        />
      ) : null}
      {op && sheet?.kind === 'settle' ? (
        <SettleDialog
          texts={texts}
          garantie={sheet.garantie}
          choice={sheet.choice}
          busy={busy}
          error={error}
          onClose={closeSheet}
          onIssue={(issue) => setError(t(issue === 'amount' ? 'ag.operation.deposit.issueAmount' : 'ag.operation.deposit.issueReason'))}
          onSubmit={(value) =>
            void run(
              () => callPro('proSettleGuarantee', { bid, opId: op.id, garantieId: sheet.garantie.id, etat: value.etat, retenue: value.retenue, motif: value.motif }),
              t('ag.operation.deposit.saved'),
            )
          }
        />
      ) : null}
      {op && sheet?.kind === 'deposit' ? (
        <DepositDialog
          texts={texts}
          busy={busy}
          error={error}
          onClose={closeSheet}
          onSubmit={(value) => {
            const garanties = bookingGuarantees({ caution: value.caution, cautionForme: value.forme, document: value.document });
            if (!garanties.length) {
              setSheet(null);
              return;
            }
            void run(async () => {
              // Chaque garantie a son identifiant (`ga_…`) : rejouable sans doublon.
              for (const garantie of garanties) await callPro('proAddGuarantee', { bid, opId: op.id, garantieId: newProId('ga'), garantie });
            }, t('ag.operation.deposit.added'));
          }}
        />
      ) : null}
    </Drawer>
  );
}

function OperationBody({
  op,
  texts,
  today,
  kind,
  dayOf,
  busy,
  saved,
  onStep,
  onPay,
  onSettle,
  onAddDeposit,
  documents,
}: {
  op: Operation;
  texts: ProTexts;
  today: string;
  kind: RentalKind;
  dayOf: (ms: number) => string;
  busy: boolean;
  saved: string | null;
  onStep: (step: OperationStep) => void;
  onPay: (refund: boolean) => void;
  onSettle: (g: Garantie, choice: SettleChoice) => void;
  onAddDeposit: () => void;
  /** Les documents (contrat, reçu de caution), sous les gestes. */
  documents: ReactNode;
}) {
  const t = texts.t;
  const steps = useMemo(() => operationSteps(op), [op]);
  const trokacha = isTrokachaOperation(op);
  const matchId = op.matchId ?? (op.id.startsWith('m_') ? op.id.slice(2) : null);
  const late = op.statut === 'en_cours' && (op.enRetard || (!!op.fin && op.fin < today));
  const delta = tripDelta(op);
  const tel = displayPhone(op.clientTel);
  const call = telUrl(op.clientTel);
  const whatsapp = whatsappUrl(op.clientTel);

  const etatLine = (etat: Operation['depart']) =>
    etat
      ? [typeof etat.km === 'number' ? t('ag.operation.summary.km', { km: new Intl.NumberFormat('fr-FR').format(etat.km) }) : null, typeof etat.carburant === 'number' ? t('ag.operation.summary.fuel', { fuel: etat.carburant }) : null]
          .filter(Boolean)
          .join(' · ')
      : '';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${late ? 'bg-[#FEF3C7] text-[#92400E]' : statusTone(op)}`}>{t(`ag.operation.status.${op.statut}`)}</span>
        <span className="text-[14px] text-inkMuted">{t('ag.operation.takenBy', { origin: t(`ag.origin.${op.origine}`) })}</span>
      </div>
      {op.clientNom ? (
        <p className="mt-3 text-[19px] font-semibold text-ink">
          <bdi>{op.clientNom}</bdi>
        </p>
      ) : null}
      {op.debut && op.fin ? (
        <p className="mt-1 text-[16px] text-inkSoft">
          {bookingRangeText(op.debut, op.fin, texts)}
          {op.heureDebut ? ` · ${op.heureDebut}` : ''} · {lengthText(operationDays(op), kind, texts)}
        </p>
      ) : null}
      {late && op.fin ? <p className="mt-1 text-[15px] font-semibold text-[#B45309]">{t('ag.operation.lateLine', { day: shortDay(op.fin, texts, true) })}</p> : null}
      {op.remise && op.remise.lieu !== 'agence' ? (
        <p className="mt-1 flex items-center gap-2 text-[15px] text-inkSoft">
          {op.remise.lieu === 'aeroport' ? <AgencyIcon name="plane" size={16} /> : null}
          {op.remise.adresse ? t('ag.operation.handoverAt', { place: t(`ag.operation.handover.${op.remise.lieu}`), address: op.remise.adresse }) : t(`ag.operation.handover.${op.remise.lieu}`)}
        </p>
      ) : null}

      {trokacha ? (
        <div className="mt-4 space-y-2">
          <Notice tone="muted">{t('ag.operation.trokachaNote')}</Notice>
          {matchId ? (
            <Link href={`/match/${encodeURIComponent(matchId)}`} target="_blank" className="inline-flex items-center gap-2 text-[15px] font-semibold text-cash hover:underline">
              {t('ag.operation.trokachaOpen')}
              <AgencyIcon name="external" size={15} className="rtl:-scale-x-100" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {steps.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {steps.map((step) => (
            <Button
              key={step.id}
              label={stepLabel(step, kind, op, texts)}
              tone={step.tone === 'primary' ? 'primary' : step.tone === 'danger' ? 'danger' : 'secondary'}
              disabled={busy}
              onClick={() => onStep(step)}
            />
          ))}
        </div>
      ) : null}
      {saved ? (
        <p role="status" className="mt-3 rounded-[12px] bg-matchBg px-4 py-2 text-[15px] font-semibold text-matchInk">
          {saved}
        </p>
      ) : null}

      {documents}

      {op.depart || op.retour ? (
        <Block title={t('ag.operation.section.etat')}>
          {op.depart ? (
            <div>
              <p className="text-[14px] font-semibold text-inkSoft">{t('ag.operation.step.depart')}</p>
              <p className="text-[15px] text-ink">{etatLine(op.depart)}</p>
              {op.depart.notes ? <p className="text-[14px] text-inkMuted">{op.depart.notes}</p> : null}
            </div>
          ) : null}
          {op.retour ? (
            <div>
              <p className="text-[14px] font-semibold text-inkSoft">{t('ag.operation.step.retour')}</p>
              <p className="text-[15px] text-ink">{etatLine(op.retour)}</p>
              {op.retour.notes ? <p className="text-[14px] text-inkMuted">{op.retour.notes}</p> : null}
            </div>
          ) : null}
          {delta.km !== null && delta.km > 0 ? <p className="text-[15px] font-semibold text-cash">{t('ag.operation.summary.driven', { km: new Intl.NumberFormat('fr-FR').format(delta.km) })}</p> : null}
          {delta.fuel !== null && delta.fuel > 0 ? <p className="text-[15px] font-semibold text-cash">{texts.tp('ag.operation.summary.fuelLess', delta.fuel)}</p> : null}
        </Block>
      ) : null}

      <Block title={t('ag.operation.section.money')}>
        {op.lignes.map((line, i) => (
          <AmountLine
            key={`l${i}`}
            label={line.quantite > 1 ? `${line.libelle} · ${t('ag.operation.money.line', { qty: line.quantite, price: texts.money(line.prix) })}` : line.libelle}
            amount={texts.money(line.prix * line.quantite)}
          />
        ))}
        <AmountLine label={t('ag.operation.money.total')} amount={texts.money(op.total)} strong />
        {op.paiements.map((p) =>
          p.montant < 0 ? (
            <AmountLine key={p.id} tone="muted" label={t('ag.operation.money.refundLine', { moyen: t(`ag.operation.moyen.${p.moyen}`), day: dayOf(p.at) })} amount={texts.money(-p.montant)} />
          ) : (
            <AmountLine key={p.id} label={t('ag.operation.money.payment', { moyen: t(`ag.operation.moyen.${p.moyen}`), day: dayOf(p.at) })} amount={texts.money(p.montant)} />
          ),
        )}
        {op.paiements.length > 1 ? <AmountLine label={t('ag.operation.money.paid')} amount={texts.money(totalPaid(op))} /> : null}
        {op.solde > 0 ? (
          <AmountLine label={t('ag.operation.money.due')} amount={texts.money(op.solde)} strong tone="warning" />
        ) : op.solde < 0 ? (
          <AmountLine label={t('ag.operation.money.overpaid')} amount={texts.money(-op.solde)} strong tone="warning" />
        ) : op.total > 0 ? (
          <AmountLine label={t('ag.operation.money.settled')} amount="" strong tone="success" />
        ) : null}
        {op.garanties.map((g) => {
          const kept = argentRetenu(g);
          return kept > 0 ? <AmountLine key={`kept-${g.id}`} label={t('ag.operation.money.keptDeposit', { day: dayOf(g.regleeLe ?? g.at) })} amount={texts.money(kept)} /> : null;
        })}
        <div className="flex flex-wrap gap-2 pt-1">
          {op.solde > 0 && op.statut !== 'annulee' ? <Button label={t('ag.operation.money.collect')} tone="soft" disabled={busy} onClick={() => onPay(false)} /> : null}
          {op.solde < 0 ? <Button label={t('ag.operation.money.refund')} tone="secondary" disabled={busy} onClick={() => onPay(true)} /> : null}
        </div>
      </Block>

      <Block title={t('ag.operation.section.deposit')}>
        {canAddDeposit(op) ? (
          <div>
            <Button label={t('ag.operation.deposit.add')} tone="soft" disabled={busy} onClick={onAddDeposit} />
          </div>
        ) : null}
        {op.garanties.length === 0 ? <p className="text-[15px] text-inkMuted">{t('ag.operation.deposit.none')}</p> : null}
        {op.garanties.map((g) => {
          const choices = settleChoices(g);
          const forme = t(`ag.operation.deposit.forme.${g.forme}`);
          const what = g.montant !== null ? `${forme} · ${texts.money(g.montant)}` : [forme, g.details?.document].filter(Boolean).join(' · ');
          const kept =
            g.motif && g.etat !== 'recue' && g.etat !== 'rendue'
              ? g.retenue
                ? t('ag.operation.deposit.kept', { amount: texts.money(g.retenue), reason: g.motif })
                : t('ag.operation.deposit.keptNoAmount', { reason: g.motif })
              : null;
          const pill = g.etat === 'recue' ? 'bg-cashBg text-cash' : g.etat === 'rendue' ? 'bg-matchBg text-matchInk' : 'bg-[#FEF3C7] text-[#92400E]';
          return (
            <div key={g.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <bdi className="text-[16px] font-semibold text-ink">{what}</bdi>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${pill}`}>{t(`ag.operation.deposit.etat.${g.etat}`)}</span>
              </div>
              {kept ? <p className="mt-1 text-[14px] text-inkMuted">{kept}</p> : null}
              {choices.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {choices.map((choice) => (
                    <Button
                      key={choice}
                      tone={choice === 'rendue' ? 'soft' : 'secondary'}
                      disabled={busy}
                      onClick={() => onSettle(g, choice)}
                      label={choice === 'rendue' ? t('ag.operation.deposit.give') : choice === 'retenue_partielle' ? t('ag.operation.deposit.keepPart') : t('ag.operation.deposit.keep')}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </Block>

      <Block title={t('ag.operation.section.client')}>
        {op.clientNom ? (
          <p className="text-[16px] font-semibold text-ink">
            <bdi>{op.clientNom}</bdi>
          </p>
        ) : (
          <p className="text-[15px] text-inkMuted">{t('ag.operation.client.none')}</p>
        )}
        {tel ? (
          <p dir="ltr" className="text-start text-[15px] text-inkSoft">
            {tel}
          </p>
        ) : null}
        {call || whatsapp ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {call ? (
              <a href={call} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-cashBg px-4 py-2 text-[15px] font-semibold text-cash hover:bg-[#D6E6F7]">
                <AgencyIcon name="phone" size={16} />
                {t('ag.operation.client.call')}
              </a>
            ) : null}
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-paperHard px-4 py-2 text-[15px] font-semibold text-ink hover:bg-line">
                <AgencyIcon name="whatsapp" size={16} />
                {t('ag.operation.client.whatsapp')}
              </a>
            ) : null}
          </div>
        ) : null}
      </Block>

      {op.notes ? (
        <Block title={t('ag.operation.section.notes')}>
          <p className="whitespace-pre-line text-[15px] text-ink">{op.notes}</p>
        </Block>
      ) : null}
    </div>
  );
}

function StepDialog({ op, step, kind, texts, busy, error, onClose, onSubmit }: {
  op: Operation;
  step: OperationStep;
  kind: RentalKind;
  texts: ProTexts;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (extra: { etat?: EtatInput }) => void;
}) {
  const t = texts.t;
  const [form, setForm] = useState<EtatForm>(emptyEtatForm);
  const [issue, setIssue] = useState<string | null>(null);
  const immo = kind === 'immo';

  if (step.form === 'etat') {
    const isDepart = step.id === 'depart';
    const title = t(`ag.operation.etat.${isDepart ? 'titleDepart' : 'titleRetour'}${immo ? 'Immo' : ''}`);
    const confirm = isTrokachaOperation(op) ? t('ag.operation.etat.save') : t(`ag.operation.etat.${isDepart ? 'confirmDepart' : 'confirmRetour'}${immo ? 'Immo' : ''}`);
    const departure = isDepart ? null : op.depart;
    return (
      <Dialog open title={title} onClose={onClose} closeLabel={t('ag.operation.confirm.no')}>
        {departure && typeof departure.km === 'number' ? <p className="mb-3 text-[14px] font-semibold text-inkSoft">{t('ag.operation.etat.departWas', { km: new Intl.NumberFormat('fr-FR').format(departure.km) })}</p> : null}
        {departure && typeof departure.carburant === 'number' && typeof departure.km !== 'number' ? <p className="mb-3 text-[14px] font-semibold text-inkSoft">{t('ag.operation.etat.departWasFuel', { fuel: departure.carburant })}</p> : null}
        {!immo ? (
          <>
            <FieldLabel htmlFor="st-km">{t('ag.operation.etat.km')}</FieldLabel>
            <input id="st-km" dir="ltr" inputMode="numeric" className={inputClass} value={form.km} placeholder={t('ag.operation.etat.kmPlaceholder')} onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} maxLength={10} />
            <p className="mb-1.5 mt-4 text-[14px] font-semibold text-inkSoft">
              {t('ag.operation.etat.fuel')} · {form.carburant === null ? t('ag.operation.etat.fuelNone') : t('ag.operation.etat.fuelValue', { value: form.carburant })}
            </p>
            <div className="flex gap-1.5" dir="ltr">
              {Array.from({ length: FUEL_STEPS + 1 }, (_, value) => {
                const filled = form.carburant !== null && value <= form.carburant && value > 0;
                const current = form.carburant === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={current}
                    onClick={() => setForm((f) => ({ ...f, carburant: f.carburant === value ? null : value }))}
                    className={`flex h-10 flex-1 items-center justify-center rounded-[10px] border text-[14px] font-semibold ${
                      filled ? 'border-cash bg-cash text-white' : 'border-line2 bg-white text-ink'
                    } ${current ? 'ring-2 ring-ink' : ''}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        <div className="mt-4">
          <FieldLabel htmlFor="st-notes">{t('ag.operation.etat.notes')}</FieldLabel>
          <textarea id="st-notes" className={`${inputClass} min-h-[72px]`} value={form.notes} placeholder={t('ag.operation.etat.notesPlaceholder')} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} maxLength={1000} />
        </div>
        {issue || error ? <div className="mt-4"><Notice tone="error">{issue ?? error}</Notice></div> : null}
        <div className="mt-5">
          <Button
            full
            busy={busy}
            label={confirm}
            onClick={() => {
              const read = readEtatForm(form, departure);
              if (read.ok === false) {
                setIssue(read.issue === 'km' ? t('ag.operation.issues.km') : t('ag.operation.issues.kmBelowDeparture', { km: new Intl.NumberFormat('fr-FR').format(departure?.km ?? 0) }));
                return;
              }
              setIssue(null);
              onSubmit({ etat: read.value });
            }}
          />
        </div>
      </Dialog>
    );
  }

  const key = step.id === 'annulation' ? (op.type === 'location' ? 'annulationLocation' : 'annulationVente') : step.id;
  const warnings = step.id === 'cloture' ? closeWarnings(op) : [];
  return (
    <Dialog open title={t(`ag.operation.confirm.${key}.title`)} onClose={onClose} closeLabel={t('ag.operation.confirm.no')}>
      <p className="text-[16px] leading-6 text-inkSoft">{t(`ag.operation.confirm.${key}.body`)}</p>
      {warnings.map((w) => (
        <p key={w} className="mt-2 text-[15px] font-semibold text-[#B45309]">
          {w === 'deposit' ? t('ag.operation.confirm.warnDeposit') : t('ag.operation.confirm.warnDue', { amount: texts.money(op.solde) })}
        </p>
      ))}
      {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button label={t('ag.operation.confirm.no')} tone="secondary" onClick={onClose} />
        <Button label={t('ag.operation.confirm.yes')} tone={step.tone === 'danger' ? 'danger' : 'primary'} busy={busy} onClick={() => onSubmit({})} />
      </div>
    </Dialog>
  );
}

function PayDialog({ texts, refund, suggested, busy, error, onClose, onSubmit }: {
  texts: ProTexts;
  refund: boolean;
  suggested: number | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: { montant: number; moyen: MoyenPaiement }) => void;
}) {
  const t = texts.t;
  const [amount, setAmount] = useState(suggested !== null ? String(suggested) : '');
  const [moyen, setMoyen] = useState<MoyenPaiement>('especes');
  const [issue, setIssue] = useState<string | null>(null);
  const value = parseAmount(amount);
  return (
    <Dialog open title={t(refund ? 'ag.operation.pay.refundTitle' : 'ag.operation.pay.title')} onClose={onClose} closeLabel={t('ag.operation.confirm.no')}>
      <FieldLabel htmlFor="pay-amount">{t('ag.operation.pay.amount')}</FieldLabel>
      <input id="pay-amount" inputMode="numeric" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={12} autoFocus />
      <p className="mb-1.5 mt-4 text-[14px] font-semibold text-inkSoft">{t(refund ? 'ag.operation.pay.refundMoyen' : 'ag.operation.pay.moyen')}</p>
      <ChipRow>
        {MOYENS_PAIEMENT.map((m) => (
          <Chip key={m} label={t(`ag.operation.moyen.${m}`)} selected={moyen === m} onClick={() => setMoyen(m)} />
        ))}
      </ChipRow>
      {issue || error ? <div className="mt-4"><Notice tone="error">{issue ?? error}</Notice></div> : null}
      <div className="mt-5">
        <Button
          full
          busy={busy}
          label={value ? t(refund ? 'ag.operation.pay.refundConfirm' : 'ag.operation.pay.confirm', { amount: texts.money(value) }) : t('ag.operation.pay.confirmNoAmount')}
          onClick={() => {
            if (!value || value <= 0) {
              setIssue(t('ag.operation.pay.issue'));
              return;
            }
            setIssue(null);
            onSubmit({ montant: value, moyen });
          }}
        />
      </div>
    </Dialog>
  );
}

function SettleDialog({ texts, garantie, choice, busy, error, onClose, onIssue, onSubmit }: {
  texts: ProTexts;
  garantie: Garantie;
  choice: SettleChoice;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onIssue: (issue: 'amount' | 'reason') => void;
  onSubmit: (value: { etat: SettleChoice; retenue: number | null; motif: string | null }) => void;
}) {
  const t = texts.t;
  const [retenue, setRetenue] = useState('');
  const [motif, setMotif] = useState('');
  const forme = t(`ag.operation.deposit.forme.${garantie.forme}`);
  const what = garantie.montant !== null ? `${forme} · ${texts.money(garantie.montant)}` : [forme, garantie.details?.document].filter(Boolean).join(' · ');
  const confirmLabel = choice === 'rendue' ? t('ag.operation.deposit.give') : choice === 'retenue_partielle' ? t('ag.operation.deposit.keepPart') : t('ag.operation.deposit.keep');
  return (
    <Dialog open title={t('ag.operation.deposit.sheetTitle')} onClose={onClose} closeLabel={t('ag.operation.confirm.no')}>
      <p className="mb-4 text-[16px] font-semibold text-ink">
        <bdi>{what}</bdi>
      </p>
      {choice === 'retenue_partielle' ? (
        <div className="mb-4">
          <FieldLabel htmlFor="st-kept">{t('ag.operation.deposit.amountKept')}</FieldLabel>
          <input id="st-kept" inputMode="numeric" className={inputClass} value={retenue} onChange={(e) => setRetenue(e.target.value)} maxLength={12} autoFocus />
        </div>
      ) : null}
      {choice !== 'rendue' ? (
        <div>
          <FieldLabel htmlFor="st-reason">{t('ag.operation.deposit.reason')}</FieldLabel>
          <textarea id="st-reason" className={`${inputClass} min-h-[72px]`} value={motif} placeholder={t('ag.operation.deposit.reasonPlaceholder')} onChange={(e) => setMotif(e.target.value)} maxLength={500} />
        </div>
      ) : null}
      {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-5">
        <Button
          full
          busy={busy}
          tone={choice === 'rendue' ? 'primary' : 'danger'}
          label={confirmLabel}
          onClick={() => {
            const read = readSettle(garantie, choice, retenue, motif);
            if (read.ok === false) {
              onIssue(read.issue);
              return;
            }
            onSubmit(read.value);
          }}
        />
      </div>
    </Dialog>
  );
}

function DepositDialog({ texts, busy, error, onClose, onSubmit }: {
  texts: ProTexts;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: { caution: number | null; forme: DepositForm; document: string }) => void;
}) {
  const t = texts.t;
  const [amount, setAmount] = useState('');
  const [forme, setForme] = useState<DepositForm>('especes');
  const [document, setDocument] = useState('');
  return (
    <Dialog open title={t('ag.operation.deposit.addTitle')} onClose={onClose} closeLabel={t('ag.operation.confirm.no')}>
      <FieldLabel htmlFor="dp-amount">{t('ag.booking.depositAmount')}</FieldLabel>
      <input id="dp-amount" inputMode="numeric" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={12} autoFocus />
      <div className="mt-3">
        <ChipRow>
          {DEPOSIT_FORMS.map((f) => (
            <Chip key={f} label={t(`ag.booking.depositForm.${f}`)} selected={forme === f} onClick={() => setForme(f)} />
          ))}
        </ChipRow>
      </div>
      <div className="mt-4">
        <FieldLabel htmlFor="dp-doc">{t('ag.booking.document')}</FieldLabel>
        <input id="dp-doc" className={inputClass} value={document} placeholder={t('ag.booking.documentPlaceholder')} onChange={(e) => setDocument(e.target.value)} maxLength={60} />
      </div>
      {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-5">
        <Button full busy={busy} label={t('ag.booking.depositDone')} onClick={() => onSubmit({ caution: parseAmount(amount), forme, document })} />
      </div>
    </Dialog>
  );
}
