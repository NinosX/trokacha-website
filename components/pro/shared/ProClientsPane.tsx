'use client';

// components/pro/shared/ProClientsPane.tsx
// =============================================================================
// CLIENTS : les fiches du carnet (les plus récentes d'abord, par paquets de 300),
// recherche par nom ou numéro, puis la fiche d'un client (`?client=<id>`) : son
// argent (payé, reste dû, à rendre, cautions détenues), ses opérations, ses
// notes et son repère (modifiables par `proSaveClient`), ses pièces d'identité
// (photo ouverte par un lien signé de 10 minutes, `proFileUrl`).
// =============================================================================

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import type { ClientFiche, Operation, RepereClient } from '@/lib/pro-core';
import { callPro, toProCallableError } from '@/lib/pro/callables';
import { clientMoney, heldGuarantees, matchClient, sortOpsRecentFirst } from '@/lib/pro/shared/clients';
import { displayPhone } from '@/lib/pro/shared/format';
import { useClient, useClientOps, useClientsList } from '@/lib/pro/shared/hooks';
import type { ProTextKey, ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { ProIcon } from '../ProIcons';
import { ProPaneTitle } from '../ProPane';
import { ProCentered, useProSession } from '../ProSession';

const PAGE = 300;
const REPERES: readonly RepereClient[] = ['bon', 'normal', 'ne_plus_servir'];

const INTL: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-DZ-u-nu-latn' };

function shortDate(ms: number | null | undefined, x: ProTexts): string {
  if (!ms) return x.t('cli.never');
  return new Intl.DateTimeFormat(INTL[x.locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Algiers' }).format(new Date(ms));
}

function dayLabel(day: string, x: ProTexts): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL[x.locale], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12)));
}

function RepereBadge({ repere, x }: { repere: RepereClient; x: ProTexts }) {
  if (repere === 'normal') return null;
  const tone = repere === 'bon' ? 'bg-matchBg text-matchInk' : 'bg-tradeBg text-tradeInk';
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${tone}`}>{x.t(`cli.repere.${repere}` as ProTextKey)}</span>;
}

function SearchIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

/* --------------------------------- Liste ---------------------------------- */

function ClientsList({ bid, onOpen }: { bid: string; onOpen: (id: string) => void }) {
  const { texts: x } = useProSession();
  const [max, setMax] = useState(PAGE);
  const [q, setQ] = useState('');
  const list = useClientsList(bid, max);
  const shown = useMemo(() => list.data.filter((c) => matchClient(c, q)), [list.data, q]);

  if (list.status === 'loading' && !list.data.length) {
    return <p className="text-inkMuted">{x.t('common.loading')}</p>;
  }
  if (list.status === 'error') {
    return <p className="text-inkMuted">{x.t('common.error')}</p>;
  }
  if (!list.data.length) {
    return (
      <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
        <p className="text-[19px] font-semibold text-ink">{x.t('cli.emptyTitle')}</p>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('cli.emptyBody')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[260px] flex-1">
          <span className="sr-only">{x.t('cli.search')}</span>
          <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-inkMuted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={x.t('cli.search')}
            className="w-full rounded-full border border-line bg-white py-3 pe-4 ps-11 text-[16px] text-ink outline-none focus:border-cash"
          />
        </label>
        <span className="text-[15px] text-inkMuted">{x.tp('cli.count', list.data.length)}</span>
      </div>

      {q && !shown.length ? <p className="mb-4 text-[15px] text-inkMuted">{x.t('cli.noMatch', { q })}</p> : null}
      {q && list.full ? <p className="mb-4 text-[14px] text-inkMuted">{x.t('cli.searchMore', { count: list.data.length })}</p> : null}

      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="hidden w-full text-start text-[15px] md:table">
          <thead className="bg-paperSoft text-[13px] font-semibold uppercase tracking-wide text-inkMuted">
            <tr>
              <th className="px-5 py-3 text-start">{x.t('cli.col.name')}</th>
              <th className="px-5 py-3 text-start">{x.t('cli.col.phone')}</th>
              <th className="px-5 py-3 text-end">{x.t('cli.col.ops')}</th>
              <th className="px-5 py-3 text-end">{x.t('cli.col.due')}</th>
              <th className="px-5 py-3 text-end">{x.t('cli.col.last')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer border-t border-line hover:bg-paperSoft">
                <td className="px-5 py-3">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    <bdi>{c.nom || displayPhone(c.tel) || c.id}</bdi>
                    <RepereBadge repere={c.repere} x={x} />
                  </span>
                </td>
                <td className="px-5 py-3 text-inkSoft" dir="ltr">
                  {displayPhone(c.tel) ?? ''}
                </td>
                <td className="px-5 py-3 text-end text-inkSoft">{c.stats.operations}</td>
                <td className={`px-5 py-3 text-end ${c.solde > 0 ? 'font-semibold text-[#B45309]' : 'text-inkMuted'}`}>{c.solde > 0 ? x.money(c.solde) : ''}</td>
                <td className="px-5 py-3 text-end text-inkMuted">{shortDate(c.derniereOperation, x)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="md:hidden">
          {shown.map((c) => (
            <li key={c.id} className="border-t border-line first:border-t-0">
              <button type="button" onClick={() => onOpen(c.id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start hover:bg-paperSoft">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold text-ink">
                    <bdi>{c.nom || displayPhone(c.tel) || c.id}</bdi>
                    <RepereBadge repere={c.repere} x={x} />
                  </span>
                  <span className="mt-0.5 block text-[14px] text-inkMuted" dir="ltr">
                    {displayPhone(c.tel) ?? ''}
                  </span>
                </span>
                {c.solde > 0 ? <span className="shrink-0 text-[15px] font-semibold text-[#B45309]">{x.money(c.solde)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {list.full ? (
        <button type="button" onClick={() => setMax((m) => m + PAGE)} className="mt-4 rounded-full border border-line bg-white px-5 py-3 text-[15px] font-semibold text-ink hover:bg-paperSoft">
          {x.t('cli.more')}
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Fiche ---------------------------------- */

function MoneyTile({ label, value, tone = 'ink' }: { label: string; value: string; tone?: 'ink' | 'warning' | 'muted' }) {
  const color = tone === 'warning' ? 'text-[#B45309]' : tone === 'muted' ? 'text-inkMuted' : 'text-ink';
  return (
    <div className="rounded-card border border-line bg-white px-5 py-4 shadow-card">
      <p className="text-[14px] text-inkMuted">{label}</p>
      <p className={`mt-1 font-display text-[22px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

function OpRow({ op, x }: { op: Operation; x: ProTexts }) {
  const when = op.debut && op.fin ? `${dayLabel(op.debut, x)} → ${dayLabel(op.fin, x)}` : shortDate(op.creeLe, x);
  const off = op.statut === 'annulee' || op.statut === 'non_presentee';
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 first:border-t-0">
      <span className="min-w-0">
        <span className={`block text-[16px] font-semibold ${off ? 'text-inkMuted line-through' : 'text-ink'}`}>
          <bdi>{op.itemTitre}</bdi>
        </span>
        <span className="block text-[14px] text-inkMuted">
          {x.t(`cli.statut.${op.statut}` as ProTextKey)} · <bdi>{when}</bdi>
        </span>
      </span>
      <span className="text-end text-[15px]">
        <span className="block font-semibold text-ink">{x.money(op.total)}</span>
        {!off && op.solde > 0 ? <span className="block text-[#B45309]">{x.t('cli.op.due', { amount: x.money(op.solde) })}</span> : null}
        {!off && op.solde < 0 ? <span className="block text-[#B45309]">{x.t('cli.op.giveBack', { amount: x.money(-op.solde) })}</span> : null}
      </span>
    </li>
  );
}

function ClientEditor({ bid, client, onDone }: { bid: string; client: ClientFiche; onDone: (message: string | null) => void }) {
  const { texts: x } = useProSession();
  const [nom, setNom] = useState(client.nom);
  const [tel, setTel] = useState(displayPhone(client.tel) ?? '');
  const [notes, setNotes] = useState(client.notes ?? '');
  const [repere, setRepere] = useState<RepereClient>(client.repere);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const telChanged = tel.trim() !== (displayPhone(client.tel) ?? '');
      await callPro('proSaveClient', {
        bid,
        client: { id: client.id, nom: nom.trim() || null, ...(telChanged ? { tel: tel.trim() || null } : {}), notes: notes.trim() || null, repere },
      });
      onDone(x.t('cli.saved'));
    } catch (e) {
      const reason = toProCallableError(e).reason;
      const key = `cli.error.${reason}` as ProTextKey;
      setError(['TEL_INVALIDE', 'CLIENT_INVALIDE', 'PAS_LE_DROIT'].includes(reason) ? x.t(key) : x.t('cli.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-[12px] border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none focus:border-cash';
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[14px] font-semibold text-inkSoft">{x.t('cli.field.name')}</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={field} maxLength={120} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[14px] font-semibold text-inkSoft">{x.t('cli.field.phone')}</span>
          <input value={tel} onChange={(e) => setTel(e.target.value)} className={field} dir="ltr" inputMode="tel" />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="mb-2 text-[14px] font-semibold text-inkSoft">{x.t('cli.field.repere')}</legend>
        <div className="flex flex-wrap gap-2">
          {REPERES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={repere === r}
              onClick={() => setRepere(r)}
              className={`rounded-full border px-4 py-2 text-[15px] font-semibold ${repere === r ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-paperSoft'}`}
            >
              {x.t(`cli.repere.${r}` as ProTextKey)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="mb-1 block text-[14px] font-semibold text-inkSoft">{x.t('cli.field.notes')}</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1000} className={field} />
      </label>
      {error ? (
        <p role="alert" className="mt-3 rounded-[12px] bg-tradeBg px-4 py-3 text-[15px] text-tradeInk">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-full bg-cash px-5 py-3 text-[15px] font-semibold text-white shadow-cash hover:bg-cashInk disabled:opacity-60">
          {busy ? x.t('cli.saving') : x.t('cli.save')}
        </button>
        <button type="button" disabled={busy} onClick={() => onDone(null)} className="rounded-full border border-line px-5 py-3 text-[15px] font-semibold text-ink hover:bg-paperHard">
          {x.t('cli.cancel')}
        </button>
      </div>
    </div>
  );
}

function Pieces({ bid, client }: { bid: string; client: ClientFiche }) {
  const { texts: x } = useProSession();
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const pieces = client.pieces ?? [];

  const open = async (path: string) => {
    setOpening(path);
    setError(false);
    // Fenêtre ouverte tout de suite (sinon le navigateur la bloque), remplie quand le lien arrive.
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    try {
      const res = await callPro<{ url?: string }>('proFileUrl', { bid, path });
      if (res.url && win) win.location.href = res.url;
      else if (res.url) window.open(res.url, '_blank', 'noopener');
      else throw new Error('no url');
    } catch {
      win?.close();
      setError(true);
    } finally {
      setOpening(null);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[19px] font-semibold text-ink">{x.t('cli.piecesTitle')}</h2>
      {pieces.length ? (
        <ul className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          {pieces.map((p, i) => (
            <li key={`${p.type}-${i}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 first:border-t-0">
              <span className="text-[15px] text-ink">
                <bdi className="font-semibold">{p.type}</bdi>
                {p.numero ? (
                  <>
                    {' · '}
                    <bdi dir="ltr">{p.numero}</bdi>
                  </>
                ) : null}
                {p.expire ? <span className="text-inkMuted"> · {x.t('cli.piece.expire', { day: dayLabel(p.expire, x) })}</span> : null}
              </span>
              {p.photoPath ? (
                <button type="button" disabled={opening === p.photoPath} onClick={() => void open(p.photoPath as string)} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-cash hover:bg-cashBg disabled:opacity-60">
                  {opening === p.photoPath ? x.t('cli.piece.opening') : x.t('cli.piece.see')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] text-inkMuted">{x.t('cli.piecesNone')}</p>
      )}
      {error ? <p className="mt-2 text-[14px] text-tradeInk">{x.t('cli.piece.linkError')}</p> : null}
      <p className="mt-2 text-[14px] text-inkMuted">{x.t('cli.piecesRetention')}</p>
    </section>
  );
}

function ClientPage({ bid, clientId, onBack }: { bid: string; clientId: string; onBack: () => void }) {
  const { texts: x } = useProSession();
  const fiche = useClient(bid, clientId);
  const ops = useClientOps(bid, clientId);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const sorted = useMemo(() => sortOpsRecentFirst(ops.data), [ops.data]);
  const money = useMemo(() => clientMoney(ops.data), [ops.data]);
  const held = useMemo(() => heldGuarantees(ops.data), [ops.data]);

  const back = (
    <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-cash hover:underline">
      <ProIcon name="chevronEnd" size={16} className="-scale-x-100 rtl:scale-x-100" />
      {x.t('cli.back')}
    </button>
  );

  if (fiche.status === 'loading') return <>{back}<p className="text-inkMuted">{x.t('common.loading')}</p></>;
  if (fiche.status === 'error') return <>{back}<p className="text-inkMuted">{x.t('common.error')}</p></>;
  const client = fiche.data;
  if (!client) return <>{back}<p className="text-inkMuted">{x.t('cli.notFound')}</p></>;
  const phone = displayPhone(client.tel);
  const waDigits = (client.tel ?? '').replace(/\D/g, '');

  return (
    <div>
      {back}
      <ProPaneTitle title={client.nom || phone || client.id}>
        <div className="flex flex-wrap items-center gap-2">
          <RepereBadge repere={client.repere} x={x} />
          {client.uid ? <span className="inline-flex rounded-full bg-cashBg px-2.5 py-0.5 text-[13px] font-semibold text-cashInk">{x.t('cli.trokacha')}</span> : null}
        </div>
      </ProPaneTitle>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {phone ? (
          <span className="text-[17px] text-inkSoft" dir="ltr">
            {phone}
          </span>
        ) : null}
        {client.tel ? (
          <a href={`tel:${client.tel}`} className="inline-flex items-center gap-2 rounded-full bg-cash px-4 py-2 text-[15px] font-semibold text-white shadow-cash hover:bg-cashInk">
            <ProIcon name="phone" size={16} />
            {x.t('cli.call')}
          </a>
        ) : null}
        {waDigits ? (
          <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard">
            {x.t('cli.whatsapp')}
          </a>
        ) : null}
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard">
            {x.t('cli.edit')}
          </button>
        ) : null}
      </div>

      {notice ? (
        <p role="status" className="mb-4 rounded-[12px] bg-matchBg px-4 py-3 text-[15px] text-matchInk">
          {notice}
        </p>
      ) : null}

      {editing ? (
        <div className="mb-8">
          <ClientEditor
            bid={bid}
            client={client}
            onDone={(message) => {
              setEditing(false);
              setNotice(message);
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyTile label={x.t('cli.money.paid')} value={x.money(money.paye)} />
        <MoneyTile label={x.t('cli.money.due')} value={x.money(money.du)} tone={money.du > 0 ? 'warning' : 'muted'} />
        {money.aRendre > 0 ? <MoneyTile label={x.t('cli.money.toGiveBack')} value={x.money(money.aRendre)} tone="warning" /> : null}
        <MoneyTile
          label={x.t('cli.money.deposits')}
          value={money.documents ? `${x.money(money.cautions)} · ${x.tp('cli.money.documents', money.documents)}` : x.money(money.cautions)}
          tone={money.cautions || money.documents ? 'ink' : 'muted'}
        />
      </div>

      {held.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-[19px] font-semibold text-ink">{x.t('cli.depositsTitle')}</h2>
          <ul className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            {held.map(({ op, garantie }) => (
              <li key={`${op.id}-${garantie.id}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 first:border-t-0">
                <span className="text-[15px] font-semibold text-ink">
                  <bdi>{op.itemTitre}</bdi>
                </span>
                <span className="text-[15px] text-inkSoft">
                  {garantie.forme === 'document' ? x.t('cli.deposit.document') : x.t('cli.deposit.held', { amount: x.money(garantie.montant ?? 0) })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 flex items-baseline gap-3 text-[19px] font-semibold text-ink">
          {x.t('cli.opsTitle')}
          <span className="text-[15px] font-normal text-inkMuted">{x.tp('cli.money.ops', sorted.length)}</span>
        </h2>
        {ops.status === 'loading' ? (
          <p className="text-inkMuted">{x.t('common.loading')}</p>
        ) : sorted.length ? (
          <ul className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            {sorted.map((op) => (
              <OpRow key={op.id} op={op} x={x} />
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-inkMuted">{x.t('cli.opsEmpty')}</p>
        )}
        {sorted.length >= 200 ? <p className="mt-2 text-[14px] text-inkMuted">{x.t('cli.opsCapped')}</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[19px] font-semibold text-ink">{x.t('cli.notesTitle')}</h2>
        <p className="whitespace-pre-line text-[16px] leading-7 text-inkSoft">
          <bdi>{client.notes || x.t('cli.notesEmpty')}</bdi>
        </p>
      </section>

      <Pieces bid={bid} client={client} />
    </div>
  );
}

/* ---------------------------------- Volet ---------------------------------- */

export function ProClientsPane() {
  const { texts: x } = useProSession();
  const { space } = useProDesk();
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get('client');
  const base = `/pro/${encodeURIComponent(space.id)}/clients`;

  if (!space.id) {
    return (
      <ProCentered>
        <p className="text-inkMuted">{x.t('common.loading')}</p>
      </ProCentered>
    );
  }

  if (clientId) return <ClientPage key={clientId} bid={space.id} clientId={clientId} onBack={() => router.push(base)} />;
  return (
    <div>
      <ProPaneTitle title={x.t('pane.clients')} />
      <ClientsList bid={space.id} onOpen={(id) => router.push({ pathname: base, query: { client: id } })} />
    </div>
  );
}
