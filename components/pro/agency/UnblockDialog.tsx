'use client';

// components/pro/agency/UnblockDialog.tsx
// Débloquer une période (bureau web, 15/11) : la période, sa raison, « Garder »
// ou « Débloquer » (callable `proUnblockDates`, par identifiant ou, pour un vieux
// blocage sans identifiant, par ses dates ; rejouable).

import { useCallback, useState } from 'react';
import { callPro } from '@/lib/pro/callables';
import { blockRangeText, blockReasonText } from '@/lib/pro/agency/blocks';
import { errorReason } from '@/lib/pro/agency/errors';
import type { BlockedRange, RentalUnit } from '@/lib/pro/agency/units';
import type { ProTexts } from '@/lib/pro/texts';
import { Button, Dialog, Notice } from './ui';

export function UnblockDialog({ bid, texts, unit, block, onClose, onDone }: {
  bid: string;
  texts: ProTexts;
  unit: RentalUnit;
  block: BlockedRange;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const t = texts.t;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const range = blockRangeText(block, texts);

  const confirm = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await callPro('proUnblockDates', block.id ? { bid, itemId: unit.id, blocId: block.id } : { bid, itemId: unit.id, debut: block.start, fin: block.end });
      onDone(`${t('ag.unit.unblockSaved')} ${range} · ${unit.titre || t('ag.unit.untitled')}`);
    } catch (e) {
      const why = errorReason(e);
      setError(why === 'offline' ? t('ag.unit.blockOffline') : why === 'generic' ? t('ag.unit.blockFailed') : t(`ag.errors.${why}`));
    } finally {
      setBusy(false);
    }
  }, [bid, block, busy, onDone, range, t, unit.id, unit.titre]);

  return (
    <Dialog open title={t('ag.unit.unblockTitle')} onClose={onClose} closeLabel={t('ag.unit.unblockKeep')}>
      <p className="text-[16px] font-semibold text-ink">
        <bdi>{unit.titre || t('ag.unit.untitled')}</bdi>
      </p>
      <p className="mt-1 text-[15px] leading-6 text-inkSoft">{t('ag.unit.unblockBody', { range })}</p>
      {block.reason ? <p className="mt-1 text-[15px] text-inkMuted">{t('ag.web.blockReasonLine', { reason: blockReasonText(block.reason, unit.kind, texts) })}</p> : null}
      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-5 flex gap-3">
        <Button label={t('ag.unit.unblockKeep')} tone="secondary" onClick={onClose} full />
        <Button label={t('ag.unit.unblock')} onClick={() => void confirm()} busy={busy} full />
      </div>
    </Dialog>
  );
}
