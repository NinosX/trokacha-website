'use client';

// components/pro/shared/ExportPanel.tsx
// =============================================================================
// RÉGLAGES, « Votre carnet » : tout le carnet dans un fichier Excel (fait dans
// le navigateur, téléchargé tout de suite) et le relevé d'un mois (page
// bilingue imprimée ou enregistrée en PDF par le navigateur). Le bureau ne
// montre que les espaces du compte (propriétaire) : il voit les chiffres.
// =============================================================================

import { useMemo, useState } from 'react';
import { derniersMois, libelleMois } from '@/lib/pro-core';
import { useTeamNames } from '@/lib/pro/shared/hooks';
import { buildCarnetFile, buildReleve, downloadBlob } from '@/lib/pro/shared/exportCarnet';
import { printDocumentHtml } from '@/lib/pro/shared/printDocument';
import { useProDesk } from '../ProDeskShell';
import { useProSession } from '../ProSession';

type Message = { tone: 'ok' | 'error'; text: string } | null;

export function ExportPanel() {
  const { texts: x, user } = useProSession();
  const { space } = useProDesk();
  const names = useTeamNames(space.id);
  const langue = x.locale === 'ar' ? 'ar' : 'fr';
  const months = useMemo(() => derniersMois(Date.now(), 12), []);
  const monthLabel = (m: string) =>
    x.locale === 'en'
      ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${m}-15T12:00:00Z`))
      : libelleMois(m, langue);

  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(0);
  const [message, setMessage] = useState<Message>(null);
  const [mois, setMois] = useState(months[0]);
  const [printing, setPrinting] = useState(false);
  const [releveMessage, setReleveMessage] = useState<Message>(null);

  const exportNow = async () => {
    if (busy) return;
    setBusy(true);
    setRows(0);
    setMessage(null);
    try {
      const file = await buildCarnetFile({ bid: space.id, spaceName: space.nom, uid: user.uid, langue, voirChiffres: true, names, onRows: setRows });
      downloadBlob(file.blob, file.name);
      setMessage({ tone: 'ok', text: x.t('exp.done', { name: file.name }) });
    } catch {
      setMessage({ tone: 'error', text: x.t('exp.error') });
    } finally {
      setBusy(false);
    }
  };

  const printReleve = async () => {
    if (printing) return;
    setPrinting(true);
    setReleveMessage(null);
    try {
      const releve = await buildReleve({ bid: space.id, mois, space });
      if (releve.vide) setReleveMessage({ tone: 'ok', text: x.t('exp.releveEmpty') });
      await printDocumentHtml(releve.html);
    } catch {
      setReleveMessage({ tone: 'error', text: x.t('exp.error') });
    } finally {
      setPrinting(false);
    }
  };

  const note = (m: Message) =>
    m ? (
      <p role={m.tone === 'error' ? 'alert' : 'status'} className={`text-[15px] font-semibold ${m.tone === 'error' ? 'text-tradeInk' : 'text-matchInk'}`}>
        {m.text}
      </p>
    ) : null;

  return (
    <div className="grid max-w-[760px] gap-4">
      <div className="space-y-3 rounded-card border border-line bg-white px-5 py-5" data-testid="pro-export-carnet">
        <h3 className="text-[17px] font-semibold text-ink">{x.t('exp.fileTitle')}</h3>
        <p className="text-[15px] leading-6 text-inkSoft">{x.t('exp.body')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportNow}
            disabled={busy}
            className="rounded-full bg-cash px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-cashInk disabled:opacity-60"
            data-testid="pro-export-download"
          >
            {x.t('exp.download')}
          </button>
          {busy ? (
            <p role="status" className="text-[15px] text-inkSoft">
              {x.t('exp.loading', { count: rows })}
            </p>
          ) : (
            note(message)
          )}
        </div>
      </div>
      <div className="space-y-3 rounded-card border border-line bg-white px-5 py-5" data-testid="pro-export-releve">
        <h3 className="text-[17px] font-semibold text-ink">{x.t('exp.releveTitle')}</h3>
        <p className="text-[15px] leading-6 text-inkSoft">{x.t('exp.releveBody')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[15px] font-semibold text-inkSoft">
            {x.t('exp.month')}
            <select
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="rounded-[12px] border border-line2 bg-white px-3 py-2 text-[15px] font-normal text-ink"
              data-testid="pro-export-month"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={printReleve}
            disabled={printing}
            className="rounded-full border border-line2 bg-white px-5 py-2.5 text-[15px] font-semibold text-ink hover:bg-paperSoft disabled:opacity-60"
            data-testid="pro-export-print"
          >
            {printing ? x.t('exp.preparing') : x.t('exp.print')}
          </button>
          {note(releveMessage)}
        </div>
      </div>
    </div>
  );
}
