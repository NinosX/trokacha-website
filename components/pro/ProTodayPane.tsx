'use client';

// components/pro/ProTodayPane.tsx
// =============================================================================
// AUJOURD'HUI, en lecture : mêmes lectures (opérations ouvertes, agrégat du
// jour) et même logique (`lib/pro/today.ts`, port de l'application) que le
// téléphone. Agence : retards, départs et retours à l'heure, pas encore
// partis, à régler, demain, encaissé. Boutique : mis de côté, à expédier,
// colis en route, colis qui reviennent, reste dû, encaissé.
// =============================================================================

import { useMemo } from 'react';
import type { Operation } from '@/lib/pro-core';
import { useAlgiersToday, useJour, useOpenOps, useVariantLabels, type VariantLabels } from '@/lib/pro/hooks';
import { buildAgencyToday, buildShopToday, shortClientName, type TodayEntry } from '@/lib/pro/today';
import { wilayaName } from '@/lib/pro/shared/wilayas';
import type { ProTexts } from '@/lib/pro/texts';
import { useProDesk } from './ProDeskShell';
import { ProIcon } from './ProIcons';
import { ProPaneTitle } from './ProPane';
import { ProCentered, useProSession } from './ProSession';

type Tone = 'muted' | 'warning';
interface Line {
  text: string;
  tone: Tone;
  icon: 'cash' | 'plane';
}

function titleOf(op: Operation): string {
  const client = shortClientName(op.clientNom);
  return client ? `${op.itemTitre} · ${client}` : op.itemTitre;
}

function entryLines(op: Operation, kind: TodayEntry['kind'], x: ProTexts): Line[] {
  const out: Line[] = [];
  if (kind === 'depart') {
    if (op.remise?.lieu === 'aeroport') out.push({ icon: 'plane', tone: 'muted', text: op.remise.adresse ? x.t('today.airportAt', { place: op.remise.adresse }) : x.t('today.airport') });
    if (!op.garanties.length && op.origine !== 'trokacha') out.push({ icon: 'cash', tone: 'warning', text: x.t('today.takeDeposit') });
  } else if (op.garantieOuverte) {
    out.push({ icon: 'cash', tone: 'muted', text: x.t('today.returnDeposit') });
  }
  if (op.solde > 0) out.push({ icon: 'cash', tone: 'warning', text: x.t('today.due', { amount: x.money(op.solde) }) });
  return out;
}

function LineList({ lines }: { lines: Line[] }) {
  if (!lines.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {lines.map((line, i) => (
        <li key={i} className={`flex items-center gap-2 text-[15px] ${line.tone === 'warning' ? 'text-[#B45309]' : 'text-inkSoft'}`}>
          <ProIcon name={line.icon} size={16} />
          {line.text}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-[19px] font-semibold text-ink">
        {title}
        {count ? <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cash px-2 text-[13px] font-bold text-white">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function CashCard({ bid, today }: { bid: string; today: string }) {
  const { texts } = useProSession();
  const { jour, status } = useJour(bid, today);
  if (status !== 'ready' || !jour) return null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-paperSoft px-5 py-4">
      <span className="text-[16px] text-inkSoft">{texts.t('today.cash')}</span>
      <span className="font-display text-[22px] font-bold text-ink">{texts.money(jour.encaisse)}</span>
    </div>
  );
}

function AgencyToday({ ops, today, bid }: { ops: Operation[]; today: string; bid: string }) {
  const { texts } = useProSession();
  const x = texts;
  const model = useMemo(() => buildAgencyToday(ops, today), [ops, today]);
  const empty = !model.late.length && !model.entries.length && !model.missed.length && !model.toSettle.length;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {model.late.map(({ op, dueDay, dueHeure }) => (
          <div key={op.id} className="mb-3 flex flex-wrap items-center gap-4 rounded-card border border-[#F5D58A] bg-[#FEF3C7] px-5 py-4">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
            <p className="min-w-0 flex-1 text-[16px] leading-6 text-[#92400E]">
              <bdi>
                <span className="font-semibold">{op.itemTitre}</span>
                {op.clientNom ? ` · ${shortClientName(op.clientNom)}` : ''}
              </bdi> · {x.t('today.lateLine', { since: x.dayAndTime(dueDay, dueHeure, today) })}
            </p>
            {op.clientTel ? (
              <a href={`tel:${op.clientTel}`} dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[15px] font-semibold text-[#92400E] hover:bg-paperSoft">
                <ProIcon name="phone" size={16} />
                {x.t('today.call')}
              </a>
            ) : null}
          </div>
        ))}

        {empty ? (
          <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
            <p className="text-[19px] font-semibold text-ink">{x.t('today.emptyTitle')}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('today.emptyBody')}</p>
          </div>
        ) : null}

        {model.entries.length ? (
          <ol className="mt-2 space-y-3">
            {model.entries.map((entry) => (
              <li key={`${entry.kind}-${entry.op.id}`} className="flex gap-4">
                <span className="w-16 shrink-0 pt-4 font-display text-[18px] font-bold text-ink" dir="ltr">
                  {entry.heure ?? '·'}
                </span>
                <div className="min-w-0 flex-1 rounded-card border border-line bg-white px-5 py-4 shadow-card">
                  <p className={`flex items-center gap-1.5 text-[14px] font-semibold ${entry.kind === 'depart' ? 'text-cash' : 'text-inkSoft'}`}>
                    <ProIcon name={entry.kind === 'depart' ? 'arrowOut' : 'arrowIn'} size={16} className="rtl:-scale-x-100" />
                    {entry.kind === 'depart' ? x.t('today.depart') : x.t('today.retour')}
                    {entry.heure ? null : <span className="font-normal text-inkMuted"> · {x.t('today.noTime')}</span>}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-ink">
                    <bdi>{titleOf(entry.op)}</bdi>
                  </p>
                  <LineList lines={entryLines(entry.op, entry.kind, x)} />
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="space-y-6">
        <CashCard bid={bid} today={today} />
        {model.tomorrowDepartures > 0 ? <p className="px-1 text-[15px] text-inkSoft">{x.tp('today.tomorrow', model.tomorrowDepartures)}</p> : null}

        {model.missed.length ? (
          <Section title={x.t('today.missedTitle')} count={model.missed.length}>
            <ul className="space-y-2">
              {model.missed.map((op) => (
                <li key={op.id} className="rounded-[16px] border border-line bg-white px-4 py-3">
                  <p className="text-[16px] font-semibold text-ink">
                    <bdi>{titleOf(op)}</bdi>
                  </p>
                  <p className="text-[14px] text-inkMuted">{x.t('today.missedLine', { day: x.relativeDay(op.debut ?? today, today) })}</p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {model.toSettle.length ? (
          <Section title={x.t('today.toSettleTitle')} count={model.toSettle.length}>
            <ul className="space-y-2">
              {model.toSettle.map((op) => (
                <li key={op.id} className="rounded-[16px] border border-line bg-white px-4 py-3">
                  <p className="text-[16px] font-semibold text-ink">
                    <bdi>{titleOf(op)}</bdi>
                  </p>
                  <p className="text-[14px] text-inkMuted">{op.garantieOuverte ? x.t('today.returnDeposit') : x.t('today.due', { amount: x.money(op.solde) })}</p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function shopLine(op: Operation, x: ProTexts): Line {
  const exp = op.expedition;
  const carrier = exp?.transporteur ? [exp.transporteur, wilayaName(exp.wilaya, x.locale)].filter(Boolean).join(' · ') : '';
  switch (op.statut) {
    case 'mise_de_cote':
      return op.solde > 0 ? { icon: 'cash', tone: 'warning', text: x.t('shop.line.putAsideDue', { amount: x.money(op.solde) }) } : { icon: 'cash', tone: 'muted', text: x.t('shop.line.putAside') };
    case 'a_expedier':
      return { icon: 'cash', tone: 'warning', text: carrier ? x.t('shop.line.toShip', { carrier }) : x.t('shop.line.toShipBare') };
    case 'expediee':
      if (exp?.suivi && exp.transporteur) return { icon: 'cash', tone: 'muted', text: x.t('shop.line.shippedTracking', { carrier: exp.transporteur, tracking: exp.suivi }) };
      return { icon: 'cash', tone: 'muted', text: exp?.transporteur ? x.t('shop.line.shipped', { carrier: exp.transporteur }) : x.t('shop.line.shippedBare') };
    default:
      return { icon: 'cash', tone: 'warning', text: x.t('shop.line.returning') };
  }
}

function shopTitle(op: Operation, labels: VariantLabels): string {
  // Le carnet ne garde que la clé de la variante (« m_noir ») : son libellé vient du catalogue.
  const variant = op.variante ? labels.get(op.itemId)?.get(op.variante) ?? null : null;
  return [shortClientName(op.clientNom), op.itemTitre, variant].filter(Boolean).join(' · ');
}

function ShopBlock({ title, ops, labels }: { title: string; ops: Operation[]; labels: VariantLabels }) {
  const { texts } = useProSession();
  if (!ops.length) return null;
  return (
    <Section title={title} count={ops.length}>
      <ul className="grid gap-3 2xl:grid-cols-2">
        {ops.map((op) => {
          const line = shopLine(op, texts);
          return (
            <li key={op.id} className="rounded-card border border-line bg-white px-5 py-4 shadow-card">
              <p className="text-[17px] font-semibold text-ink">
                <bdi>{shopTitle(op, labels)}</bdi>
              </p>
              <p className={`mt-1 text-[15px] ${line.tone === 'warning' ? 'text-[#B45309]' : 'text-inkSoft'}`}>{line.text}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function ShopToday({ ops, today, bid }: { ops: Operation[]; today: string; bid: string }) {
  const { texts } = useProSession();
  const x = texts;
  const sales = useMemo(() => buildShopToday(ops), [ops]);
  const labels = useVariantLabels(bid);
  const empty = !sales.putAside.length && !sales.toShip.length && !sales.shipped.length && !sales.returning.length;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {empty ? (
          <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
            <p className="text-[19px] font-semibold text-ink">{x.t('shop.emptyTitle')}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('shop.emptyBody')}</p>
          </div>
        ) : null}
        <ShopBlock title={x.t('shop.putAsideTitle')} ops={sales.putAside} labels={labels} />
        <ShopBlock title={x.t('shop.toShipTitle')} ops={sales.toShip} labels={labels} />
        <ShopBlock title={x.t('shop.shippedTitle')} ops={sales.shipped} labels={labels} />
        <ShopBlock title={x.t('shop.returningTitle')} ops={sales.returning} labels={labels} />
      </div>
      <div className="space-y-4">
        <CashCard bid={bid} today={today} />
        {sales.dueTotal > 0 ? (
          <div className="rounded-card border border-line bg-paperSoft px-5 py-4 text-[16px] text-inkSoft">{x.t('shop.due', { amount: x.money(sales.dueTotal) })}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ProTodayPane() {
  const { texts } = useProSession();
  const { space } = useProDesk();
  const today = useAlgiersToday();
  const ops = useOpenOps(space.id);

  return (
    <>
      <ProPaneTitle title={texts.t('pane.aujourdhui')}>
        <p className="text-[17px] text-inkSoft">{texts.dayHeading(today)}</p>
      </ProPaneTitle>
      {ops.status === 'loading' ? (
        <ProCentered>
          <p className="text-inkMuted">{texts.t('common.loading')}</p>
        </ProCentered>
      ) : ops.status === 'error' ? (
        <ProCentered>
          <div>
            <p className="text-ink">{texts.t('common.error')}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
              {texts.t('common.retry')}
            </button>
          </div>
        </ProCentered>
      ) : space.kind === 'agence' ? (
        <AgencyToday ops={ops.rows} today={today} bid={space.id} />
      ) : (
        <ShopToday ops={ops.rows} today={today} bid={space.id} />
      )}
    </>
  );
}
