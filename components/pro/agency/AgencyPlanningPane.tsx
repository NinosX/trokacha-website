'use client';

// components/pro/agency/AgencyPlanningPane.tsx
// =============================================================================
// PLANNING DU MOIS (bureau web, agence et boutique qui loue) : « Novembre 2026 ·
// 71 % loué · 486 000 DA », mois précédent et suivant, la grille (une ligne par
// bien, publié ou non : le carnet sert sans annonce), la légende.
//   • un jour libre (aujourd'hui ou plus tard) → « Nouvelle réservation » sur ce
//     bien, ce jour ; le bouton « Nouvelle réservation » en tête aussi ;
//   • une réservation → sa fiche (gestes, argent, caution) ;
//   • une demande Trokacha (pointillés) → sa page, réponse dans l'application.
// DONNÉES : les biens loués du catalogue, les opérations ouvertes (fraîches) et
// celles qui finissent depuis le 1er du mois affiché (le taux du mois compte
// aussi les locations finies), les demandes reçues, les fiches clients.
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { getPathname } from '@/i18n/navigation';
import type { Operation } from '@/lib/pro-core';
import { useAlgiersToday, useOpenOps } from '@/lib/pro/hooks';
import { useRecentClients, useRentalProposals, useRentalUnits, useWindowOps } from '@/lib/pro/agency/hooks';
import { buildMonthPlanning, monthBounds, shiftMonth, type PlanningBar, type PlanningRow } from '@/lib/pro/agency/planning';
import { planningRequestsOf } from '@/lib/pro/agency/requests';
import { monthRest, monthTitle, shortRange } from '@/lib/pro/agency/text';
import { unitsKind } from '@/lib/pro/agency/units';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { ProCentered, useProSession } from '../ProSession';
import { AgencyIcon } from './icons';
import { NewBookingDrawer } from './NewBookingDrawer';
import { OperationDrawer } from './OperationDrawer';
import { PlanningGrid, PlanningLegend } from './PlanningGrid';
import { Button } from './ui';

export function AgencyPlanningPane() {
  const { texts, user } = useProSession();
  const { space } = useProDesk();
  const t = texts.t;
  const today = useAlgiersToday();
  const [month, setMonth] = useState(() => monthBounds(today).first);
  const [booking, setBooking] = useState<{ itemId: string | null; debut: string | null } | null>(null);
  const [openOpId, setOpenOpId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const units = useRentalUnits(space.id);
  const open = useOpenOps(space.id);
  const windowOps = useWindowOps(space.id, month);
  const clients = useRecentClients(space.id);
  const proposals = useRentalProposals(user.uid, space.id, today);

  const allOps = useMemo(() => {
    const byId = new Map<string, Operation>();
    // Les ouvertes d'abord : la même écoute que l'Aujourd'hui (la plus fraîche).
    for (const op of [...open.rows, ...windowOps.rows]) if (!byId.has(op.id)) byId.set(op.id, op);
    return [...byId.values()];
  }, [open.rows, windowOps.rows]);
  const requests = useMemo(() => planningRequestsOf(proposals.rows, units.rows), [proposals.rows, units.rows]);
  const planning = useMemo(() => buildMonthPlanning({ units: units.rows, ops: allOps, requests, today, month }), [allOps, month, requests, today, units.rows]);
  const kind = unitsKind(units.rows);

  const unitTitle = useCallback((row: PlanningRow) => row.unit.titre || t('ag.unit.untitled'), [t]);
  const barLabel = useCallback(
    (_row: PlanningRow, bar: PlanningBar) => {
      if (bar.kind === 'blocked') return t('ag.planning.blocked');
      if (bar.kind === 'booking' && !bar.label) return t('ag.planning.booked');
      return bar.label;
    },
    [t],
  );
  const barTitle = useCallback(
    (row: PlanningRow, bar: PlanningBar) => {
      const unit = unitTitle(row);
      const range = shortRange(bar.start, bar.end, texts);
      if (bar.kind === 'blocked') return `${t('ag.planning.a11y.blocked', { unit })} · ${range}`;
      if (bar.kind === 'request') return `${bar.label ? t('ag.planning.a11y.request', { unit, name: bar.label }) : t('ag.planning.a11y.requestNoName', { unit })} · ${range}`;
      const base = bar.label ? t('ag.planning.a11y.booking', { unit, name: bar.label }) : t('ag.planning.a11y.bookingNoName', { unit });
      const extra = bar.late ? `, ${t('ag.planning.a11y.late')}` : bar.returnsToday ? `, ${t('ag.planning.a11y.returnToday', { unit })}` : '';
      return `${base}${extra} · ${range}`;
    },
    [t, texts, unitTitle],
  );
  const onCell = useCallback((row: PlanningRow, day: string) => setBooking({ itemId: row.unit.id, debut: day }), []);
  const locale = useLocale();
  const onBar = useCallback(
    (_row: PlanningRow, bar: PlanningBar) => {
      if (bar.kind === 'booking' && bar.opId) setOpenOpId(bar.opId);
      // Une demande se répond dans l'application : sa page l'ouvre (ou propose de l'installer).
      else if (bar.kind === 'request' && bar.requestId) window.open(getPathname({ href: `/proposal/${encodeURIComponent(bar.requestId)}`, locale }), '_blank', 'noopener');
    },
    [locale],
  );

  const loading = units.status === 'loading' || (open.status === 'loading' && windowOps.status === 'loading');
  const failed = units.status === 'error' || (open.status === 'error' && windowOps.status === 'error');
  const empty = !loading && !failed && units.rows.length === 0;
  const thisMonth = monthBounds(today).first;

  return (
    <>
      <ProPaneTitle title={t('pane.planning')}>
        {!empty && !failed ? <Button label={t('ag.booking.title')} icon={<AgencyIcon name="plus" />} onClick={() => setBooking({ itemId: null, debut: null })} /> : null}
      </ProPaneTitle>

      {loading ? (
        <ProCentered>
          <p className="text-inkMuted">{t('common.loading')}</p>
        </ProCentered>
      ) : failed ? (
        <ProCentered>
          <div>
            <p className="text-ink">{t('common.error')}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
              {t('common.retry')}
            </button>
          </div>
        </ProCentered>
      ) : empty ? (
        <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
          <p className="text-[19px] font-semibold text-ink">{t('ag.planning.emptyTitle')}</p>
          <p className="mx-auto mt-2 max-w-lg text-[15px] leading-6 text-inkMuted">{t('ag.planning.emptyBody')}</p>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-inkSoft">{t('ag.web.addUnitInApp')}</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[18px] text-inkSoft">
              <span className="font-display font-bold text-ink">{monthTitle(planning.first, texts)}</span>
              {` · ${monthRest(planning.occupancyPct, planning.revenue, texts)}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                aria-label={t('ag.web.prevMonth')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-paperSoft"
              >
                <AgencyIcon name="chevronStart" className="rtl:-scale-x-100" />
              </button>
              <button
                type="button"
                onClick={() => setMonth(thisMonth)}
                disabled={month === thisMonth}
                className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-semibold text-ink hover:bg-paperSoft disabled:opacity-40"
              >
                {t('ag.web.thisMonth')}
              </button>
              <button
                type="button"
                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                aria-label={t('ag.web.nextMonth')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-paperSoft"
              >
                <AgencyIcon name="chevronEnd" className="rtl:-scale-x-100" />
              </button>
            </div>
          </div>

          {saved ? (
            <p role="status" className="mb-4 rounded-[14px] bg-matchBg px-4 py-3 text-[15px] font-semibold text-matchInk">
              {saved}
            </p>
          ) : null}

          <PlanningGrid
            planning={planning}
            today={today}
            texts={texts}
            unitTitle={unitTitle}
            barLabel={barLabel}
            barTitle={barTitle}
            cellTitle={() => t('ag.web.planningHint')}
            onCell={onCell}
            onBar={onBar}
          />
          <p className="mt-3 text-[14px] text-inkMuted">{t('ag.web.planningHint')}</p>
          <PlanningLegend texts={texts} />
        </>
      )}

      {booking ? (
        <NewBookingDrawer
          bid={space.id}
          texts={texts}
          today={today}
          units={units.rows}
          ops={open.rows}
          clients={clients.rows}
          requests={requests}
          initial={booking}
          onClose={() => setBooking(null)}
          onSaved={(_opId, title) => {
            setBooking(null);
            setSaved(t('ag.booking.saved', { title: title || t('ag.unit.untitled') }));
            window.setTimeout(() => setSaved(null), 5000);
          }}
        />
      ) : null}
      {openOpId ? <OperationDrawer bid={space.id} opId={openOpId} texts={texts} today={today} kind={kind} onClose={() => setOpenOpId(null)} /> : null}
    </>
  );
}
