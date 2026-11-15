'use client';

// components/pro/agency/BlockDatesDrawer.tsx
// =============================================================================
// BLOQUER DES DATES (bureau web, 15/11) : le bien, la raison (garage, usage
// personnel, ménage, autre), les dates ; la callable `proBlockDates` (droit
// « saisir »). Bien publié : l'annonce reçoit les dates (les demandes qui
// chevauchent sont refusées par le serveur) ; la raison reste dans le carnet.
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import { daysBetween, type Operation } from '@/lib/pro-core';
import { callPro, newProId } from '@/lib/pro/callables';
import { unavailableRanges } from '@/lib/pro/agency/booking';
import { blockRangeOfPick, blockRangeText, blockReasonText } from '@/lib/pro/agency/blocks';
import { errorReason } from '@/lib/pro/agency/errors';
import { BLOCK_REASONS, type BlockReason, type RentalKind, type RentalUnit } from '@/lib/pro/agency/units';
import type { ProTexts } from '@/lib/pro/texts';
import { DayRangePicker } from './DayRangePicker';
import { Button, Chip, ChipRow, Drawer, Notice, SectionTitle } from './ui';

export function BlockDatesDrawer({ bid, texts, today, units, ops, initialItemId, onClose, onSaved }: {
  bid: string;
  texts: ProTexts;
  today: string;
  units: readonly RentalUnit[];
  ops: readonly Operation[];
  initialItemId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = texts.t;
  const [itemId, setItemId] = useState<string | null>(initialItemId ?? (units.length === 1 ? units[0].id : null));
  const unit = units.find((u) => u.id === itemId) ?? null;
  const kind: RentalKind = unit?.kind ?? 'car';
  const [reason, setReason] = useState<BlockReason>(kind === 'immo' ? 'menage' : 'garage');
  // Sélection INCLUSIVE (passe du 15/11) : `last` = dernier jour bloqué, `null` = un seul jour.
  const [start, setStart] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  // Plage enregistrée : fin exclusive, le lendemain du dernier jour bloqué.
  const range = blockRangeOfPick(start, last);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un identifiant par tentative : un double clic ou un rejeu ne bloque jamais deux fois.
  const [blocId] = useState(() => newProId('bl'));
  const unavailable = useMemo(() => (unit ? unavailableRanges({ itemId: unit.id, blockedRanges: unit.blockedRanges, ops, today }) : []), [ops, today, unit]);

  const submit = useCallback(async () => {
    if (busy) return;
    if (!unit) {
      setError(t('ag.booking.unitNone'));
      return;
    }
    if (!range) {
      setError(t('ag.web.blockPick'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await callPro('proBlockDates', { bid, itemId: unit.id, blocId, debut: range.start, fin: range.end, motif: reason });
      onSaved(`${t('ag.unit.blockSaved')} ${blockRangeText(range, texts)} · ${unit.titre || t('ag.unit.untitled')}`);
    } catch (e) {
      const why = errorReason(e);
      setError(why === 'DATES_PRISES' ? t('ag.unit.blockTaken') : why === 'offline' ? t('ag.unit.blockOffline') : why === 'generic' ? t('ag.unit.blockFailed') : t(`ag.errors.${why}`));
    } finally {
      setBusy(false);
    }
  }, [bid, blocId, busy, onSaved, range, reason, t, texts, unit]);

  const days = range ? daysBetween(range.start, range.end) : 0;

  return (
    <Drawer
      open
      onClose={onClose}
      closeLabel={t('ag.booking.close')}
      title={<h2 className="font-display text-[26px] font-bold leading-tight text-ink">{t('ag.web.blockButton')}</h2>}
      footer={
        <div className="space-y-3">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button label={days > 0 ? texts.tp('ag.unit.blockConfirm', days) : t('ag.unit.block')} onClick={() => void submit()} busy={busy} disabled={!unit || !range} full />
        </div>
      }
    >
      <p className="text-[15px] leading-6 text-inkMuted">{t('ag.web.blockHint')}</p>

      <SectionTitle>{t(`ag.web.blockUnit.${kind}`)}</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {units.map((u) => {
          const selected = u.id === itemId;
          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setItemId(u.id);
                setStart(null);
                setLast(null);
                setError(null);
              }}
              className={`rounded-[14px] border px-4 py-3 text-start transition ${selected ? 'border-ink bg-white ring-2 ring-ink' : 'border-line bg-white hover:bg-paperSoft'}`}
            >
              <bdi className="block truncate text-[15px] font-semibold text-ink">{u.titre || t('ag.unit.untitled')}</bdi>
            </button>
          );
        })}
      </div>

      <SectionTitle>{t('ag.unit.blockReasonLabel')}</SectionTitle>
      <ChipRow>
        {BLOCK_REASONS.map((r) => (
          <Chip key={r} label={blockReasonText(r, kind, texts)} selected={reason === r} onClick={() => setReason(r)} />
        ))}
      </ChipRow>

      <SectionTitle>{t('ag.web.blockDates')}</SectionTitle>
      {unit ? (
        <>
          <DayRangePicker
            texts={texts}
            today={today}
            start={start}
            end={last}
            kind={kind}
            unavailable={unavailable}
            inclusive
            onChange={(s, e) => {
              setStart(s);
              setLast(e);
              setError(null);
            }}
          />
          {/* Place gardée dès l'ouverture : la plage qui s'écrit ne fait pas bouger le tiroir. */}
          <p className="mt-2 min-h-[24px] text-[15px] font-semibold text-ink">{range ? blockRangeText(range, texts) : ''}</p>
        </>
      ) : (
        <Notice tone="muted">{t('ag.web.blockPick')}</Notice>
      )}
    </Drawer>
  );
}
