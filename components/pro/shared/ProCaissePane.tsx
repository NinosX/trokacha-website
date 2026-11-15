'use client';

// components/pro/shared/ProCaissePane.tsx
// =============================================================================
// CAISSE : l'argent d'une période (aujourd'hui, 7 jours, ce mois, ou une autre
// période de 92 jours au plus). Totaux lus dans les agrégats du jour : net
// encaissé, rendu aux clients, gardé sur les cautions, par moyen de paiement et
// par personne ; puis jour par jour, avec le détail des mouvements d'un jour
// (`caisse/{id}`) et l'export de la période pour Excel (CSV avec BOM, « ; »).
// Droit « voir les chiffres » requis (règles) : sinon, on le dit simplement.
// =============================================================================

import { useMemo, useState } from 'react';
import type { MoyenPaiement, NatureMouvement } from '@/lib/pro-core';
import { useAlgiersToday } from '@/lib/pro/hooks';
import {
  clampRange,
  daysOfRange,
  moyensOf,
  mouvementsCsv,
  rangeOf,
  sortMouvements,
  sumJours,
  type CaisseJour,
  type DayRange,
  type RangeKind,
} from '@/lib/pro/shared/caisse';
import { algiersTime } from '@/lib/pro/shared/format';
import { fetchMouvements, useCaisseJours, useMouvementsDuJour, useTeamNames } from '@/lib/pro/shared/hooks';
import type { ProTextKey, ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { useProSession } from '../ProSession';

const KINDS: readonly RangeKind[] = ['jour', 'semaine', 'mois', 'perso'];
const NATURE_TONE: Record<NatureMouvement, string> = { paiement: 'text-ink', remboursement: 'text-[#B45309]', retenue: 'text-cashInk' };

function Tile({ label, value, hint, big = false }: { label: string; value: string; hint?: string; big?: boolean }) {
  return (
    <div className={`rounded-card border border-line px-5 py-4 shadow-card ${big ? 'bg-ink text-white' : 'bg-white'}`}>
      <p className={`text-[14px] ${big ? 'text-white/80' : 'text-inkMuted'}`}>{label}</p>
      <p className={`mt-1 font-display font-bold ${big ? 'text-[30px]' : 'text-[22px] text-ink'}`}>{value}</p>
      {hint ? <p className={`mt-1 text-[13px] leading-5 ${big ? 'text-white/70' : 'text-inkMuted'}`}>{hint}</p> : null}
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: { key: string; label: string; value: string }[] }) {
  if (!rows.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-[17px] font-semibold text-ink">{title}</h2>
      <ul className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[15px] first:border-t-0">
            <bdi className="text-inkSoft">{r.label}</bdi>
            <span className="font-semibold text-ink">{r.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayDetail({ bid, day, jour, onClose, moyenLabel, parLabel }: { bid: string; day: string; jour: CaisseJour | null; onClose: () => void; moyenLabel: (m: MoyenPaiement) => string; parLabel: (uid: string) => string }) {
  const { texts: x } = useProSession();
  const live = useMouvementsDuJour(bid, day);
  const list = useMemo(() => sortMouvements(live.data), [live.data]);
  const sum = list.reduce((s, m) => s + m.montant, 0);
  const partial = live.status === 'ready' && !!jour && jour.encaisse !== sum;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-[560px] overflow-y-auto bg-paper p-6 shadow-cardHover" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-[24px] font-bold text-ink">{x.t('cai.detailTitle', { day: x.dayHeading(day) })}</h2>
          <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-ink hover:bg-paperHard">
            {x.t('cai.detailClose')}
          </button>
        </div>
        {live.status === 'loading' ? <p className="text-inkMuted">{x.t('common.loading')}</p> : null}
        {live.status === 'error' ? <p className="text-inkMuted">{x.t('common.error')}</p> : null}
        {live.status === 'ready' && !list.length ? <p className="text-inkMuted">{x.t('cai.detailEmpty')}</p> : null}
        {list.length ? (
          <ul className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            {list.map((m) => (
              <li key={m.id} className="border-t border-line px-5 py-3 first:border-t-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-[15px] font-semibold ${NATURE_TONE[m.nature]}`}>{x.t(`cai.nature.${m.nature}` as ProTextKey)}</span>
                  <span className={`text-[16px] font-bold ${NATURE_TONE[m.nature]}`}>{x.money(m.montant)}</span>
                </div>
                <p className="mt-0.5 text-[14px] text-inkMuted">
                  <span dir="ltr">{m.at ? algiersTime(m.at) : ''}</span> · {moyenLabel(m.moyen)} · <bdi>{m.itemTitre}</bdi>
                  {m.clientNom ? (
                    <>
                      {' · '}
                      <bdi>{m.clientNom}</bdi>
                    </>
                  ) : null}{' '}
                  · <bdi>{parLabel(m.par)}</bdi>
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        {partial ? <p className="mt-3 text-[14px] text-inkMuted">{x.t('cai.detailPartial')}</p> : null}
      </div>
    </div>
  );
}

function download(text: string, name: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function ProCaissePane() {
  const { texts: x, user } = useProSession();
  const { space } = useProDesk();
  const today = useAlgiersToday();
  const [kind, setKind] = useState<RangeKind>('jour');
  const [custom, setCustom] = useState<DayRange>(() => ({ start: today, end: today }));
  const [draft, setDraft] = useState<DayRange>(custom);
  const range = useMemo(() => (kind === 'perso' ? clampRange(custom.start, custom.end, today) : rangeOf(kind, today)), [kind, custom, today]);
  const jours = useCaisseJours(space.id, range);
  const names = useTeamNames(space.id);
  const [detail, setDetail] = useState<string | null>(null);
  const [exportState, setExportState] = useState<{ busy: boolean; message: string | null }>({ busy: false, message: null });

  const totals = useMemo(() => sumJours(jours.data), [jours.data]);
  const byDay = useMemo(() => new Map(jours.data.map((j) => [j.jour, j])), [jours.data]);
  const days = useMemo(() => daysOfRange(range), [range]);
  const moyenLabel = (m: MoyenPaiement) => x.t(`cai.moyen.${m}` as ProTextKey) || m;
  const parLabel = (uid: string) => (uid === user.uid ? x.t('cai.you') : names.get(uid) ?? x.t('cai.member'));

  const exportCsv = async () => {
    setExportState({ busy: true, message: null });
    try {
      const { list, truncated } = await fetchMouvements(space.id, range);
      if (!list.length) {
        setExportState({ busy: false, message: x.t('cai.exportEmpty') });
        return;
      }
      const csv = mouvementsCsv(list, {
        headers: [x.t('cai.csv.date'), x.t('cai.csv.time'), x.t('cai.csv.nature'), x.t('cai.csv.means'), x.t('cai.csv.amount'), x.t('cai.csv.item'), x.t('cai.csv.client'), x.t('cai.csv.by')],
        nature: { paiement: x.t('cai.nature.paiement'), remboursement: x.t('cai.nature.remboursement'), retenue: x.t('cai.nature.retenue') },
        moyen: moyenLabel,
        par: parLabel,
      });
      const slug = space.nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'trokacha';
      download(csv, `${x.t('cai.exportFile')}-${slug}-${range.start}_${range.end}.csv`);
      setExportState({ busy: false, message: truncated ? x.t('cai.exportTruncated') : null });
    } catch {
      setExportState({ busy: false, message: x.t('cai.exportError') });
    }
  };

  const noRight = jours.status === 'error' && jours.errorCode === 'permission-denied';

  return (
    <div>
      <ProPaneTitle title={x.t('pane.caisse')}>
        {!noRight ? (
          <button type="button" disabled={exportState.busy} onClick={() => void exportCsv()} className="rounded-full border border-line bg-white px-5 py-2.5 text-[15px] font-semibold text-ink hover:bg-paperSoft disabled:opacity-60">
            {exportState.busy ? x.t('cai.exporting') : x.t('cai.export')}
          </button>
        ) : null}
      </ProPaneTitle>

      {noRight ? (
        <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
          <p className="text-[19px] font-semibold text-ink">{x.t('cai.noRightTitle')}</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('cai.noRightBody')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-full border px-4 py-2 text-[15px] font-semibold ${kind === k ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-paperSoft'}`}
              >
                {x.t(`cai.range.${k}` as ProTextKey)}
              </button>
            ))}
            {kind === 'perso' ? (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCustom(clampRange(draft.start, draft.end, today));
                }}
              >
                <label className="flex items-center gap-2 text-[15px] text-inkSoft">
                  {x.t('cai.from')}
                  <input type="date" value={draft.start} max={today} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value || d.start }))} className="rounded-[12px] border border-line bg-white px-3 py-2 text-ink" />
                </label>
                <label className="flex items-center gap-2 text-[15px] text-inkSoft">
                  {x.t('cai.to')}
                  <input type="date" value={draft.end} max={today} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value || d.end }))} className="rounded-[12px] border border-line bg-white px-3 py-2 text-ink" />
                </label>
                <button type="submit" className="rounded-full bg-cash px-4 py-2 text-[15px] font-semibold text-white hover:bg-cashInk">
                  {x.t('cai.apply')}
                </button>
                <span className="text-[13px] text-inkMuted">{x.t('cai.rangeCapped')}</span>
              </form>
            ) : null}
          </div>

          {exportState.message ? <p className="mb-4 text-[14px] text-inkMuted">{exportState.message}</p> : null}

          {jours.status === 'loading' ? (
            <p className="text-inkMuted">{x.t('common.loading')}</p>
          ) : jours.status === 'error' ? (
            <p className="text-inkMuted">{x.t('common.error')}</p>
          ) : (
            <CaisseBody totals={totals} days={days} byDay={byDay} x={x} moyenLabel={moyenLabel} parLabel={parLabel} onOpenDay={setDetail} />
          )}
        </>
      )}

      {detail ? <DayDetail bid={space.id} day={detail} jour={byDay.get(detail) ?? null} onClose={() => setDetail(null)} moyenLabel={moyenLabel} parLabel={parLabel} /> : null}
    </div>
  );
}

function CaisseBody({
  totals,
  days,
  byDay,
  x,
  moyenLabel,
  parLabel,
  onOpenDay,
}: {
  totals: ReturnType<typeof sumJours>;
  days: string[];
  byDay: ReadonlyMap<string, CaisseJour>;
  x: ProTexts;
  moyenLabel: (m: MoyenPaiement) => string;
  parLabel: (uid: string) => string;
  onOpenDay: (day: string) => void;
}) {
  const empty = !totals.encaisse && !totals.rembourse && !totals.retenu && !totals.operations;
  const membres = Object.entries(totals.parMembre)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([uid, v]) => ({ key: uid, label: parLabel(uid), value: x.money(v) }));
  const moyens = moyensOf(totals).map(({ moyen, montant }) => ({ key: moyen, label: moyenLabel(moyen), value: x.money(montant) }));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile big label={x.t('cai.net')} value={x.money(totals.encaisse)} hint={x.t('cai.netHint')} />
        <Tile label={x.t('cai.refunds')} value={x.money(totals.rembourse)} />
        <Tile label={x.t('cai.kept')} value={x.money(totals.retenu)} />
        <Tile label={x.t('cai.ops')} value={String(totals.operations)} hint={`${x.t('cai.chiffre')} : ${x.money(totals.chiffre)}`} />
      </div>

      {empty ? (
        <div className="mt-6 rounded-card border border-line bg-paperSoft px-6 py-8 text-center">
          <p className="text-[18px] font-semibold text-ink">{x.t('cai.emptyTitle')}</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('cai.emptyBody')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ListCard title={x.t('cai.byMeans')} rows={moyens} />
          <ListCard title={x.t('cai.byMember')} rows={membres} />
        </div>
      )}

      {days.length > 1 || !empty ? (
        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-semibold text-ink">{x.t('cai.days')}</h2>
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            <table className="w-full text-[15px]">
              <thead className="bg-paperSoft text-[13px] font-semibold uppercase tracking-wide text-inkMuted">
                <tr>
                  <th className="px-5 py-3 text-start">{x.t('cai.col.day')}</th>
                  <th className="px-5 py-3 text-end">{x.t('cai.col.net')}</th>
                  <th className="hidden px-5 py-3 text-end sm:table-cell">{x.t('cai.col.refunds')}</th>
                  <th className="hidden px-5 py-3 text-end sm:table-cell">{x.t('cai.col.ops')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const j = byDay.get(day);
                  const nothing = !j || (!j.encaisse && !j.rembourse && !j.retenu && !j.operations);
                  return (
                    <tr key={day} className="border-t border-line">
                      <td className="px-5 py-3 text-ink">{x.dayHeading(day)}</td>
                      <td className={`px-5 py-3 text-end font-semibold ${nothing ? 'text-inkMuted' : 'text-ink'}`}>{nothing ? x.t('cai.dayNothing') : x.money(j?.encaisse ?? 0)}</td>
                      <td className="hidden px-5 py-3 text-end text-inkSoft sm:table-cell">{j?.rembourse ? x.money(j.rembourse) : ''}</td>
                      <td className="hidden px-5 py-3 text-end text-inkSoft sm:table-cell">{j?.operations || ''}</td>
                      <td className="px-5 py-3 text-end">
                        {!nothing ? (
                          <button type="button" onClick={() => onOpenDay(day)} className="rounded-full px-3 py-1.5 text-[14px] font-semibold text-cash hover:bg-cashBg">
                            {x.t('cai.detailSee')}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
