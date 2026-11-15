'use client';

// components/pro/agency/NewBookingDrawer.tsx
// =============================================================================
// « NOUVELLE RÉSERVATION » sur l'ordinateur du comptoir : même saisie que le
// téléphone (`ProBookingScreen`, maquette L3), dans un panneau latéral :
// véhicule, dates (calendrier, jours pris barrés), heures, client (fiches
// récentes ou nouveau), prix (« 3 × 6 500 = 19 500 DA », modifiable), caution
// (somme et document gardé), acompte, remise des clés, « Pris par », note.
// ENVOI : `proSaveOperation` (seule voie d'écriture du carnet), saisie validée
// par `lireSaisieOperation` avant l'envoi, identifiant `op_…` fait une fois à
// l'ouverture (un second clic ne crée jamais de doublon). Disponibilité
// prévenue ici ; le serveur tranche (`DATES_PRISES`). Fermer une saisie
// commencée demande « Abandonner cette réservation ? ».
// =============================================================================

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ClientFiche, Operation } from '@/lib/pro-core';
import { callPro, newProId } from '@/lib/pro/callables';
import {
  BOOKING_ORIGINS_MAIN,
  BOOKING_ORIGINS_MORE,
  DEPOSIT_FORMS,
  HANDOVER_PLACES,
  bookingConflicts,
  bookingIssues,
  bookingQuote,
  bookingRange,
  displayPhone,
  emptyBookingDraft,
  overlappingRequests,
  parseAmount,
  readBookingSaisie,
  searchClients,
  unavailableRanges,
  type BookingDraft,
} from '@/lib/pro/agency/booking';
import type { PlanningRequest } from '@/lib/pro/agency/planning';
import { bookingRangeText, errorText, lengthText, perDayText, priceCalcText, shortRange } from '@/lib/pro/agency/text';
import { oneDayPrice, unitsKind, type RentalUnit } from '@/lib/pro/agency/units';
import { shortClientName } from '@/lib/pro/today';
import type { ProTexts } from '@/lib/pro/texts';
import { MOYENS_PAIEMENT } from '@/lib/pro-core';
import { DayRangePicker } from './DayRangePicker';
import { AgencyIcon } from './icons';
import { Button, Chip, ChipRow, Dialog, Drawer, FieldLabel, Notice, SectionTitle, inputClass } from './ui';

export interface NewBookingDrawerProps {
  bid: string;
  texts: ProTexts;
  today: string;
  units: readonly RentalUnit[];
  ops: readonly Operation[];
  clients: readonly ClientFiche[];
  requests: readonly PlanningRequest[];
  initial: { itemId: string | null; debut: string | null };
  onClose: () => void;
  onSaved: (opId: string, title: string) => void;
}

export function NewBookingDrawer({ bid, texts, today, units, ops, clients, requests, initial, onClose, onSaved }: NewBookingDrawerProps) {
  const t = texts.t;
  const [opId] = useState(() => newProId('op'));
  const [draft, setDraft] = useState<BookingDraft>(() =>
    emptyBookingDraft({ itemId: initial.itemId ?? (units.length === 1 ? units[0].id : null), debut: initial.debut && initial.debut >= today ? initial.debut : null }),
  );
  const [depositTouched, setDepositTouched] = useState(false);
  const initialDraft = useRef(draft);
  const dirty = depositTouched || JSON.stringify(draft) !== JSON.stringify(initialDraft.current);
  const patch = useCallback((next: Partial<BookingDraft>) => setDraft((previous) => ({ ...previous, ...next })), []);

  const unit = useMemo(() => units.find((u) => u.id === draft.itemId) ?? null, [draft.itemId, units]);
  const kind = unit?.kind ?? unitsKind(units);
  // La caution annoncée du bien remplit la sienne tant qu'on n'y a pas touché.
  const caution = depositTouched ? draft.caution : draft.caution ?? unit?.caution ?? null;
  const effective = useMemo<BookingDraft>(() => ({ ...draft, caution }), [caution, draft]);
  const quote = useMemo(() => bookingQuote(unit?.pricingTiers ?? [], effective.debut, effective.fin, effective.totalSaisi), [effective.debut, effective.fin, effective.totalSaisi, unit]);

  const range = effective.debut && effective.fin && effective.debut < effective.fin ? bookingRange(effective.debut, effective.fin, unit?.tamponJours) : null;
  const conflicts = useMemo(
    () => (range && unit ? bookingConflicts(range, { itemId: unit.id, blockedRanges: unit.blockedRanges, ops, today }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, ops, range?.start, range?.end, today],
  );
  const refused = range && unit ? overlappingRequests(range, unit.id, requests) : [];
  const unavailable = useMemo(() => (unit ? unavailableRanges({ itemId: unit.id, blockedRanges: unit.blockedRanges, ops, today }) : []), [unit, ops, today]);

  // ── Client : fiches récentes, ou nouveau ──────────────────────────────────
  const [clientQuery, setClientQuery] = useState('');
  const suggestions = useMemo(() => (draft.client.id ? [] : searchClients(clients, clientQuery || draft.client.nom, 6)), [clients, clientQuery, draft.client.id, draft.client.nom]);
  const pickedClient = draft.client.id ? clients.find((c) => c.id === draft.client.id) ?? null : null;
  const [phoneText, setPhoneText] = useState('');

  // ── Prix modifiable ───────────────────────────────────────────────────────
  const [priceFocus, setPriceFocus] = useState(false);
  const [priceText, setPriceText] = useState('');

  // ── Envoi ─────────────────────────────────────────────────────────────────
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const close = useCallback(() => {
    if (busy) return;
    if (dirty) setLeaving(true);
    else onClose();
  }, [busy, dirty, onClose]);

  const title = unit ? unit.titre || t('ag.unit.untitled') : '';

  const submit = useCallback(async () => {
    if (busy) return;
    setError(null);
    const issues = bookingIssues(effective, quote);
    if (issues.length) {
      setError(t(`ag.booking.issues.${issues[0]}`));
      return;
    }
    const read = readBookingSaisie(effective, { bid, opId, libelle: title || t('ag.unit.untitled'), quote });
    if (read.ok === false) {
      setError(errorText(read.reason, texts));
      return;
    }
    setBusy(true);
    try {
      await callPro('proSaveOperation', read.value as unknown as Record<string, unknown>);
      onSaved(opId, title);
    } catch (e) {
      setError(errorText(e, texts));
    } finally {
      setBusy(false);
    }
  }, [bid, busy, effective, onSaved, opId, quote, t, texts, title]);

  const originMore = (BOOKING_ORIGINS_MORE as readonly string[]).includes(effective.origine);
  const dayCount = quote.days;

  return (
    <>
      <Drawer
        open
        wide
        onClose={close}
        closeLabel={t('ag.booking.close')}
        title={<h2 className="font-display text-[26px] font-bold leading-tight text-ink">{t('ag.booking.title')}</h2>}
        footer={
          <div className="space-y-3">
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button label={t('ag.booking.submit')} onClick={() => void submit()} busy={busy} full />
          </div>
        }
      >
        {/* Véhicule */}
        <SectionTitle>{t(`ag.booking.unit.${kind}`)}</SectionTitle>
        {units.length === 0 ? (
          <Notice tone="muted">{t('ag.booking.unitNone')}</Notice>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {units.map((u) => {
              const selected = u.id === draft.itemId;
              const price = oneDayPrice(u);
              return (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    // Un autre bien : d'autres prix, une autre caution.
                    patch({ itemId: u.id, totalSaisi: null, ...(depositTouched ? {} : { caution: null }) });
                  }}
                  className={`rounded-[14px] border px-4 py-3 text-start transition ${selected ? 'border-ink bg-white ring-2 ring-ink' : 'border-line bg-white hover:bg-paperSoft'}`}
                >
                  <bdi className="block truncate text-[15px] font-semibold text-ink">{u.titre || t('ag.unit.untitled')}</bdi>
                  {price !== null ? <span className="text-[13px] text-inkMuted">{perDayText(price, u.kind, texts)}</span> : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Dates */}
        <SectionTitle>{t('ag.booking.dates')}</SectionTitle>
        <DayRangePicker
          texts={texts}
          today={today}
          start={effective.debut}
          end={effective.fin}
          kind={kind}
          unavailable={unavailable}
          onChange={(start, end) => patch({ debut: start, fin: end, totalSaisi: null })}
        />
        {effective.debut && effective.fin ? (
          <p className="mt-2 text-[15px] text-ink">
            {bookingRangeText(effective.debut, effective.fin, texts)} · {lengthText(dayCount, kind, texts)}
          </p>
        ) : null}

        {/* Heures */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="bk-h1">{t(`ag.booking.timeStart.${kind}`)}</FieldLabel>
            <input id="bk-h1" dir="ltr" className={inputClass} value={draft.heureDebut} placeholder={t('ag.booking.timePlaceholder')} onChange={(e) => patch({ heureDebut: e.target.value })} maxLength={5} />
          </div>
          <div>
            <FieldLabel htmlFor="bk-h2">{t(`ag.booking.timeEnd.${kind}`)}</FieldLabel>
            <input id="bk-h2" dir="ltr" className={inputClass} value={draft.heureFin} placeholder={t('ag.booking.timePlaceholder')} onChange={(e) => patch({ heureFin: e.target.value })} maxLength={5} />
          </div>
        </div>

        {/* Client */}
        <SectionTitle>{t('ag.booking.client')}</SectionTitle>
        {pickedClient || draft.client.id ? (
          <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3">
            <div className="min-w-0">
              <bdi className="block truncate text-[16px] font-semibold text-ink">{draft.client.nom || pickedClient?.nom}</bdi>
              <span dir="ltr" className="text-[14px] text-inkMuted">
                {displayPhone(draft.client.tel) ?? t('ag.booking.clientNoPhone')}
              </span>
              {pickedClient?.repere === 'ne_plus_servir' ? <p className="mt-1 text-[14px] font-semibold text-tradeInk">{t('ag.booking.clientBanned')}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => {
                patch({ client: { id: null, nom: '', tel: '' } });
                setPhoneText('');
                setClientQuery('');
              }}
              className="rounded-full bg-paperHard px-4 py-1.5 text-[14px] font-semibold text-ink hover:bg-line"
            >
              {t('ag.booking.clientClear')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor="bk-name">{t('ag.booking.clientName')}</FieldLabel>
              <input
                id="bk-name"
                className={inputClass}
                value={draft.client.nom}
                placeholder={t('ag.booking.clientSearch')}
                onChange={(e) => {
                  patch({ client: { id: null, nom: e.target.value, tel: draft.client.tel } });
                  setClientQuery(e.target.value);
                }}
                maxLength={120}
                autoComplete="off"
              />
            </div>
            <div>
              <FieldLabel htmlFor="bk-tel">{t('ag.booking.clientPhone')}</FieldLabel>
              <input
                id="bk-tel"
                dir="ltr"
                inputMode="tel"
                className={inputClass}
                value={phoneText}
                placeholder="0550 12 34 56"
                onChange={(e) => {
                  setPhoneText(e.target.value);
                  patch({ client: { id: null, nom: draft.client.nom, tel: e.target.value } });
                  setClientQuery(e.target.value);
                }}
                maxLength={24}
                autoComplete="off"
              />
            </div>
            {suggestions.length ? (
              <div>
                <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-inkMuted">{t('ag.booking.clientRecent')}</p>
                <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-white">
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          patch({ client: { id: c.id, nom: c.nom, tel: c.tel ?? '' } });
                          setPhoneText(displayPhone(c.tel) ?? '');
                          setClientQuery('');
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start hover:bg-paperSoft"
                      >
                        <bdi className="truncate text-[15px] font-semibold text-ink">{c.nom || t('ag.requests.someone')}</bdi>
                        <span dir="ltr" className="shrink-0 text-[14px] text-inkMuted">
                          {displayPhone(c.tel) ?? t('ag.booking.clientNoPhone')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {/* Prix */}
        <SectionTitle>{t('ag.booking.price')}</SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          {quote.perDay !== null && quote.days > 0 ? <span className="text-[16px] text-inkSoft">{priceCalcText(quote.days, quote.perDay, texts)}</span> : null}
          <div className={`flex items-center gap-2 rounded-[14px] border bg-white px-4 py-2 ${quote.edited ? 'border-cash' : 'border-line2'}`}>
            <input
              aria-label={t('ag.booking.priceEditA11y')}
              className="w-36 bg-transparent font-display text-[18px] font-bold text-ink placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-inkMuted focus:outline-none"
              value={priceFocus ? priceText : quote.total !== null ? texts.money(quote.total) : ''}
              placeholder={t('ag.booking.priceNoTier')}
              inputMode="numeric"
              onFocus={() => {
                setPriceFocus(true);
                setPriceText(quote.total !== null ? String(quote.total) : '');
              }}
              onBlur={() => setPriceFocus(false)}
              onChange={(e) => {
                setPriceText(e.target.value);
                const value = parseAmount(e.target.value);
                patch({ totalSaisi: value === null || value === quote.computed ? null : value });
              }}
              maxLength={12}
            />
            <AgencyIcon name="pencil" size={16} className="text-inkMuted" />
          </div>
          {quote.edited && quote.computed !== null ? (
            <button type="button" onClick={() => patch({ totalSaisi: null })} className="text-[14px] font-semibold text-cash hover:underline">
              {t('ag.booking.priceReset')}
            </button>
          ) : null}
        </div>

        {/* Caution */}
        <SectionTitle>{t('ag.booking.deposit')}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <FieldLabel htmlFor="bk-dep">{t('ag.booking.depositAmount')}</FieldLabel>
            <input
              id="bk-dep"
              inputMode="numeric"
              className={inputClass}
              value={caution !== null && caution > 0 ? String(caution) : ''}
              placeholder={t('ag.booking.depositNone')}
              onChange={(e) => {
                setDepositTouched(true);
                patch({ caution: parseAmount(e.target.value) });
              }}
              maxLength={12}
            />
          </div>
          <ChipRow>
            {DEPOSIT_FORMS.map((forme) => (
              <Chip key={forme} label={t(`ag.booking.depositForm.${forme}`)} selected={effective.cautionForme === forme} onClick={() => patch({ cautionForme: forme })} />
            ))}
          </ChipRow>
        </div>
        <div className="mt-3">
          <FieldLabel htmlFor="bk-doc">{t('ag.booking.document')}</FieldLabel>
          <input id="bk-doc" className={inputClass} value={draft.document} placeholder={t('ag.booking.documentPlaceholder')} onChange={(e) => patch({ document: e.target.value })} maxLength={60} />
        </div>

        {/* Acompte */}
        <SectionTitle>{t('ag.booking.advanceSheetTitle')}</SectionTitle>
        <div>
          <FieldLabel htmlFor="bk-adv">{t('ag.booking.advanceAmount')}</FieldLabel>
          <input
            id="bk-adv"
            inputMode="numeric"
            className={inputClass}
            value={draft.acompte !== null && draft.acompte > 0 ? String(draft.acompte) : ''}
            placeholder={t('ag.booking.advanceNone')}
            onChange={(e) => patch({ acompte: parseAmount(e.target.value) })}
            maxLength={12}
          />
        </div>
        {draft.acompte !== null && draft.acompte > 0 ? (
          <div className="mt-3">
            <FieldLabel>{t('ag.booking.advanceMoyen')}</FieldLabel>
            <ChipRow>
              {MOYENS_PAIEMENT.map((moyen) => (
                <Chip key={moyen} label={t(`ag.operation.moyen.${moyen}`)} selected={draft.acompteMoyen === moyen} onClick={() => patch({ acompteMoyen: moyen })} />
              ))}
            </ChipRow>
          </div>
        ) : null}

        {/* Remise des clés */}
        <SectionTitle>{t('ag.booking.handover')}</SectionTitle>
        <ChipRow>
          {HANDOVER_PLACES.map((place) => (
            <Chip key={place} label={t(`ag.booking.place.${place}`)} selected={draft.remise === place} onClick={() => patch({ remise: place })} />
          ))}
        </ChipRow>
        {draft.remise !== 'agence' ? (
          <input className={`${inputClass} mt-3`} value={draft.adresse} placeholder={t('ag.booking.address')} onChange={(e) => patch({ adresse: e.target.value })} maxLength={200} />
        ) : null}

        {/* Pris par */}
        <SectionTitle>{t('ag.booking.origin')}</SectionTitle>
        <ChipRow>
          {BOOKING_ORIGINS_MAIN.map((origin) => (
            <Chip key={origin} label={t(`ag.origin.${origin}`)} selected={draft.origine === origin} onClick={() => patch({ origine: origin })} />
          ))}
          <Chip label={t('ag.origin.autre')} selected={originMore} onClick={() => patch({ origine: 'autre' })} />
        </ChipRow>
        {originMore ? (
          <div className="mt-2">
            <ChipRow>
              {BOOKING_ORIGINS_MORE.filter((o) => o !== 'autre').map((origin) => (
                <Chip key={origin} label={t(`ag.origin.${origin}`)} selected={draft.origine === origin} onClick={() => patch({ origine: origin })} />
              ))}
            </ChipRow>
          </div>
        ) : null}

        {/* Note */}
        <SectionTitle>{t('ag.booking.notes')}</SectionTitle>
        <textarea className={`${inputClass} min-h-[84px]`} value={draft.notes} placeholder={t('ag.booking.notesPlaceholder')} onChange={(e) => patch({ notes: e.target.value })} maxLength={1000} />

        {/* Avis */}
        <div className="mt-5 space-y-2">
          {conflicts.map((c, i) => (
            <Notice key={`${c.kind}-${c.opId ?? i}`} tone="warning">
              {c.kind === 'blocked'
                ? t('ag.booking.conflict.blocked', { range: shortRange(c.start, c.end, texts) })
                : c.name
                  ? t('ag.booking.conflict.booking', { name: shortClientName(c.name) ?? c.name, range: shortRange(c.start, c.end, texts) })
                  : t('ag.booking.conflict.bookingNoName', { range: shortRange(c.start, c.end, texts) })}
            </Notice>
          ))}
          {conflicts.length ? <Notice tone="muted">{t('ag.booking.conflict.note')}</Notice> : null}
          {refused.length ? (
            <Notice tone="warning">{t('ag.booking.requestsRefused', { names: refused.map((r) => shortClientName(r.name) ?? t('ag.requests.someone')).join(', ') })}</Notice>
          ) : null}
          {unit?.adId ? (
            <p className="flex items-center gap-2 text-[14px] text-inkMuted">
              <AgencyIcon name="lock" size={16} />
              {t('ag.booking.lock')}
            </p>
          ) : null}
        </div>
      </Drawer>

      <Dialog open={leaving} title={t('ag.booking.leave.title')} onClose={() => setLeaving(false)} closeLabel={t('ag.booking.leave.stay')}>
        <p className="text-[16px] leading-6 text-inkSoft">{t('ag.booking.leave.body')}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button label={t('ag.booking.leave.stay')} tone="secondary" onClick={() => setLeaving(false)} />
          <Button
            label={t('ag.booking.leave.confirm')}
            tone="danger"
            onClick={() => {
              setLeaving(false);
              onClose();
            }}
          />
        </div>
      </Dialog>
    </>
  );
}
