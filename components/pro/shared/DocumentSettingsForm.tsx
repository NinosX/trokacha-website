'use client';

// components/pro/shared/DocumentSettingsForm.tsx
// =============================================================================
// « VOS DOCUMENTS » (Réglages du bureau) : le nom sur les documents, l'adresse,
// le téléphone, le RC, le NIF, les conditions de location et de vente. Même
// réglage que « En-tête et conditions » du téléphone (`prive/reglages.documents`).
// Laissé vide : le document prend le nom, la wilaya et le téléphone de l'espace.
// =============================================================================

import { useEffect, useState } from 'react';
import { DOCUMENTS_LIMITES, saisieReglagesDocuments, type CleReglageDocument, type ReglagesDocuments } from '@/lib/pro-core';
import { saveReglagesDocuments, useReglagesDocuments } from '@/lib/pro/shared/hooks';
import type { ProTexts } from '@/lib/pro/texts';
import { inputClass } from '../agency/ui';

type Draft = Record<CleReglageDocument, string>;

function draftOf(r: ReglagesDocuments): Draft {
  return {
    raisonSociale: r.raisonSociale ?? '',
    adresse: r.adresse ?? '',
    tel: r.tel ?? '',
    rc: r.rc ?? '',
    nif: r.nif ?? '',
    conditionsLocation: r.conditionsLocation ?? '',
    conditionsVente: r.conditionsVente ?? '',
  };
}

export function DocumentSettingsForm({ bid, texts: x, rental, sale }: { bid: string; texts: ProTexts; rental: boolean; sale: boolean }) {
  const reglages = useReglagesDocuments(bid);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Le formulaire part des réglages lus, une fois (la saisie en cours n'est pas écrasée).
  useEffect(() => {
    if (reglages.status === 'ready' && draft === null) setDraft(draftOf(reglages.data));
  }, [draft, reglages.data, reglages.status]);

  if (reglages.status === 'loading' || !draft) return <p className="text-inkMuted">{x.t('common.loading')}</p>;

  const set = (cle: CleReglageDocument, value: string) => {
    setMessage(null);
    setDraft((d) => (d ? { ...d, [cle]: value } : d));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const checked = saisieReglagesDocuments(draft);
    if (!checked.ok) {
      setMessage({ tone: 'error', text: x.t('doc.tooLong', { max: DOCUMENTS_LIMITES[checked.champ] }) });
      return;
    }
    setBusy(true);
    try {
      await saveReglagesDocuments(bid, checked.value);
      setDraft(checked.value);
      setMessage({ tone: 'ok', text: x.t('doc.saved') });
    } catch {
      setMessage({ tone: 'error', text: x.t('doc.saveError') });
    } finally {
      setBusy(false);
    }
  };

  const input = (cle: CleReglageDocument, opts: { dir?: 'ltr' | 'auto'; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`doc-${cle}`} className="mb-1.5 block text-[14px] font-semibold text-inkSoft">
        {x.t(`doc.field.${cle}`)}
      </label>
      <input
        id={`doc-${cle}`}
        value={draft[cle]}
        onChange={(e) => set(cle, e.target.value)}
        maxLength={DOCUMENTS_LIMITES[cle]}
        dir={opts.dir ?? 'auto'}
        placeholder={opts.placeholder}
        className={inputClass}
      />
    </div>
  );

  const area = (cle: 'conditionsLocation' | 'conditionsVente') => (
    <div>
      <label htmlFor={`doc-${cle}`} className="mb-1.5 block text-[14px] font-semibold text-inkSoft">
        {x.t(`doc.field.${cle}`)}
      </label>
      <textarea
        id={`doc-${cle}`}
        value={draft[cle]}
        onChange={(e) => set(cle, e.target.value)}
        maxLength={DOCUMENTS_LIMITES[cle]}
        rows={6}
        dir="auto"
        placeholder={x.t(`doc.placeholder.${cle}`)}
        className={`${inputClass} leading-6`}
      />
      <p className="mt-1 text-end text-[13px] text-inkMuted">
        {draft[cle].length} / {DOCUMENTS_LIMITES[cle]}
      </p>
    </div>
  );

  return (
    <form onSubmit={submit} className="max-w-[760px] space-y-4 rounded-card border border-line bg-white px-5 py-5">
      <p className="text-[15px] leading-6 text-inkSoft">{x.t('doc.settingsBody')}</p>
      {input('raisonSociale', { placeholder: x.t('doc.placeholder.raisonSociale') })}
      {input('adresse')}
      <div className="grid gap-4 sm:grid-cols-3">
        {input('tel', { dir: 'ltr' })}
        {input('rc', { dir: 'ltr' })}
        {input('nif', { dir: 'ltr' })}
      </div>
      {rental ? area('conditionsLocation') : null}
      {sale ? area('conditionsVente') : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-full bg-cash px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-cashInk disabled:opacity-60">
          {x.t('doc.save')}
        </button>
        {message ? (
          <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-[15px] font-semibold ${message.tone === 'error' ? 'text-tradeInk' : 'text-matchInk'}`}>
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
