'use client';

// components/pro/agency/AgencyRequestsPane.tsx
// =============================================================================
// « DEMANDES » (bureau web, maquette L4) : les demandes de location Trokacha
// rangées par bien (« Peugeot 208 · 2 demandes »), chacune avec sa ligne
// d'état (dates déjà prises, chevauche une autre demande, a déjà loué chez
// vous), puis, sous le bien, le groupe « En attente » des demandes gelées par
// une location acceptée (elles ne comptent pas).
// RÉPONDRE se fait dans l'application : la page de la demande garde la
// confirmation, l'annulation possible et l'e-mail vérifié (même choix que le
// téléphone, qui ouvre la page existante). Le bureau ouvre cette page.
// =============================================================================

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useAlgiersToday, useOpenOps } from '@/lib/pro/hooks';
import { useRecentClients, useRentalProposals, useRentalUnits } from '@/lib/pro/agency/hooks';
import { buildRentalRequests, requestStatusLine, type RentalRequestEntry } from '@/lib/pro/agency/requests';
import { lengthText, shortRange } from '@/lib/pro/agency/text';
import type { ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { ProCentered, useProSession } from '../ProSession';
import { AgencyIcon } from './icons';
import { Notice, Thumb } from './ui';

function proposalHref(id: string): string {
  return `/proposal/${encodeURIComponent(id)}`;
}

function StatusLine({ entry, texts }: { entry: RentalRequestEntry; texts: ProTexts }) {
  const t = texts.t;
  const line = requestStatusLine(entry);
  if (line.kind === 'none') return null;
  const text =
    line.kind === 'taken'
      ? t('ag.requests.status.taken')
      : line.kind === 'overlap'
        ? line.name
          ? t('ag.requests.status.overlap', { name: line.name })
          : t('ag.requests.status.overlapNoName')
        : t('ag.requests.status.repeat');
  const tone = line.kind === 'repeat' ? 'text-matchInk' : 'text-[#B45309]';
  return (
    <p className={`mt-2 flex items-center gap-2 text-[15px] font-semibold ${tone}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${line.kind === 'repeat' ? 'bg-match' : 'bg-warning'}`} />
      <bdi>{text}</bdi>
    </p>
  );
}

function RequestCard({ entry, texts, held }: { entry: RentalRequestEntry; texts: ProTexts; held: boolean }) {
  const t = texts.t;
  const name = entry.name ?? t('ag.requests.someone');
  return (
    <li className={`flex flex-wrap items-start gap-4 rounded-card border px-5 py-4 ${held ? 'border-line bg-paperSoft' : 'border-line bg-white shadow-card'}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paperHard text-[15px] font-bold text-inkSoft">{entry.initials || '?'}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <bdi className="text-[17px] font-semibold text-ink">{name}</bdi>
          {entry.proposal.amount !== null ? <span className="font-display text-[18px] font-bold text-ink">{texts.money(entry.proposal.amount)}</span> : null}
        </div>
        <p className="mt-0.5 text-[15px] text-inkSoft">{t('ag.requests.line', { range: shortRange(entry.start, entry.end, texts), length: lengthText(entry.days, entry.kind, texts) })}</p>
        {held ? (
          <p className="mt-2 text-[15px] text-inkSoft">
            <bdi>{entry.holder ? t('ag.requests.status.held', { name: entry.holder }) : t('ag.requests.status.heldNoName')}</bdi>
          </p>
        ) : (
          <StatusLine entry={entry} texts={texts} />
        )}
      </div>
      <Link
        href={proposalHref(entry.id)}
        target="_blank"
        className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 self-center rounded-full px-4 py-2 text-[15px] font-semibold ${
          held ? 'bg-paperHard text-ink hover:bg-line' : 'bg-cash text-white hover:bg-cashInk'
        }`}
      >
        {held ? t('ag.web.openRequest') : t('ag.web.replyInApp')}
        <AgencyIcon name="external" size={15} className="rtl:-scale-x-100" />
      </Link>
    </li>
  );
}

export function AgencyRequestsPane() {
  const { texts, user } = useProSession();
  const { space } = useProDesk();
  const t = texts.t;
  const today = useAlgiersToday();
  const units = useRentalUnits(space.id);
  const ops = useOpenOps(space.id);
  const clients = useRecentClients(space.id);
  const proposals = useRentalProposals(user.uid, space.id, today);

  const model = useMemo(
    () => buildRentalRequests({ proposals: proposals.rows, units: units.rows, ops: ops.rows, clients: clients.rows, today }),
    [clients.rows, ops.rows, proposals.rows, today, units.rows],
  );
  const loading = proposals.status === 'loading' || units.status === 'loading';
  const failed = proposals.status === 'error';

  return (
    <>
      <ProPaneTitle title={t('pane.demandes')}>
        {model.count ? <span className="rounded-full bg-cash px-3 py-1 text-[14px] font-bold text-white">{texts.tp('ag.requests.groupCount', model.count)}</span> : null}
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
      ) : model.groups.length === 0 ? (
        <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
          <p className="text-[19px] font-semibold text-ink">{t('ag.requests.emptyTitle')}</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{t('ag.requests.emptyBody')}</p>
        </div>
      ) : (
        <div className="max-w-[860px]">
          <Notice tone="muted">{t('ag.web.replyNote')}</Notice>
          {model.groups.map((group) => (
            <section key={group.key} className="mt-8">
              <h2 className="mb-3 flex items-center gap-3">
                <Thumb url={group.photo} size={44} />
                <span className="text-[20px] font-semibold text-ink">
                  <bdi>{group.title || t('ag.requests.untitled')}</bdi>
                  {group.requests.length ? <span className="font-normal text-inkMuted"> · {texts.tp('ag.requests.groupCount', group.requests.length)}</span> : null}
                  {!group.requests.length && group.held.length ? <span className="font-normal text-inkMuted"> · {texts.tp('ag.requests.heldCount', group.held.length)}</span> : null}
                </span>
              </h2>
              {group.requests.length ? (
                <ul className="space-y-3">
                  {group.requests.map((entry) => (
                    <RequestCard key={entry.id} entry={entry} texts={texts} held={false} />
                  ))}
                </ul>
              ) : null}
              {group.held.length ? (
                <div className="mt-4">
                  <p className="mb-2 text-[14px] font-semibold uppercase tracking-wide text-inkMuted">{t('ag.requests.heldTitle')}</p>
                  <ul className="space-y-3">
                    {group.held.map((entry) => (
                      <RequestCard key={entry.id} entry={entry} texts={texts} held />
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
