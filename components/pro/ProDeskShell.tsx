'use client';

// components/pro/ProDeskShell.tsx
// =============================================================================
// Coque du bureau d'un espace (/pro/[bid]/…) : barre latérale (ordinateur et
// tablette) avec, en haut, l'espace ouvert et le changement d'espace, puis les
// volets de sa sorte (agence : Aujourd'hui, Planning, Demandes ; boutique :
// Aujourd'hui, Catalogue, Commandes ; puis Clients, Caisse, Réglages). Sur un
// petit écran, les volets passent en onglets sous l'en-tête.
// =============================================================================

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { LanguageQuickSwitch } from '@/components/LocaleSwitch';
import { proPanesOf, type ProPaneId, type ProSpace } from '@/lib/pro/space';
import type { ProTextKey } from '@/lib/pro/texts';
import { ProCentered, useProSession } from './ProSession';
import { ProIcon, type ProIconName } from './ProIcons';

export interface ProDeskValue {
  space: ProSpace;
  panes: ProPaneId[];
}

const ProDeskContext = createContext<ProDeskValue | null>(null);

export function useProDesk(): ProDeskValue {
  const value = useContext(ProDeskContext);
  if (!value) throw new Error('useProDesk hors de <ProDeskShell>');
  return value;
}

const PANE_ICON: Record<ProPaneId, ProIconName> = {
  aujourdhui: 'sun',
  planning: 'calendar',
  demandes: 'inbox',
  catalogue: 'tag',
  commandes: 'box',
  clients: 'users',
  caisse: 'cash',
  reglages: 'gear',
};

export const PANE_LABEL: Record<ProPaneId, ProTextKey> = {
  aujourdhui: 'pane.aujourdhui',
  planning: 'pane.planning',
  demandes: 'pane.demandes',
  catalogue: 'pane.catalogue',
  commandes: 'pane.commandes',
  clients: 'pane.clients',
  caisse: 'pane.caisse',
  reglages: 'pane.reglages',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.charAt(0) ?? '').concat(parts[1]?.charAt(0) ?? '').toUpperCase() || 'T';
}

function SpaceSwitcher({ space }: { space: ProSpace }) {
  const { spaces, texts } = useProSession();
  const { t } = texts;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const others = spaces.filter((s) => s.id !== space.id);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const head = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-white">{initials(space.nom || 'T')}</span>
      <span className="min-w-0 flex-1 text-start">
        <bdi className="block truncate text-[16px] font-semibold text-ink">{space.nom || space.id}</bdi>
        <span className="block truncate text-[13px] text-inkMuted">
          {space.kind === 'agence' ? t('desk.tabAgence') : t('desk.tabBoutique')}
          {space.statut === 'pending' ? ` · ${t('desk.pending')}` : ''}
        </span>
      </span>
    </>
  );

  if (!others.length) return <div className="flex items-center gap-3 px-2 py-2">{head}</div>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${space.nom}, ${t('desk.switch')}`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2 hover:bg-paperHard"
      >
        {head}
        <ProIcon name="chevronDown" size={18} className="text-inkMuted" />
      </button>
      {open ? (
        <div role="menu" className="absolute inset-x-0 top-full z-30 mt-2 rounded-[16px] border border-line bg-white p-2 shadow-cardHover">
          <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wide text-inkMuted">{t('desk.spacesTitle')}</p>
          {others.map((s) => (
            <Link
              key={s.id}
              role="menuitem"
              href={`/pro/${encodeURIComponent(s.id)}/aujourdhui`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-paperSoft"
            >
              <ProIcon name={s.kind === 'agence' ? 'key' : 'shop'} size={18} className="text-cash" />
              <span className="min-w-0 flex-1">
                <bdi className="block truncate text-[15px] font-semibold text-ink">{s.nom || s.id}</bdi>
                <span className="block text-[12px] text-inkMuted">
                  {s.kind === 'agence' ? t('desk.kindAgence') : t('desk.kindBoutique')}
                  {s.statut === 'pending' ? ` · ${t('desk.pending')}` : ''}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProDeskShell({ bid, children }: { bid: string; children: ReactNode }) {
  const { spaces, spacesStatus, texts, signOutNow } = useProSession();
  const { t } = texts;
  const params = useParams<{ pane?: string }>();
  const current = params?.pane ?? 'aujourdhui';
  const router = useRouter();
  const space = spaces.find((s) => s.id === bid) ?? null;

  if (spacesStatus === 'loading') {
    return (
      <div dir={texts.dir} className="min-h-screen bg-paper">
        <ProCentered>
          <p className="text-inkMuted">{t('common.loading')}</p>
        </ProCentered>
      </div>
    );
  }

  if (!space) {
    return (
      <div dir={texts.dir} className="min-h-screen bg-paper">
        <ProCentered>
          <div>
            <p className="text-[17px] text-ink">{spacesStatus === 'error' ? t('common.error') : t('desk.notYours')}</p>
            <button type="button" onClick={() => router.replace('/pro')} className="mt-5 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
              {t('desk.backToList')}
            </button>
          </div>
        </ProCentered>
      </div>
    );
  }

  const panes = proPanesOf(space);
  const href = (pane: ProPaneId) => `/pro/${encodeURIComponent(space.id)}/${pane}`;

  return (
    <ProDeskContext.Provider value={{ space, panes }}>
      <div dir={texts.dir} className="min-h-screen bg-paper md:flex">
        {/* Barre latérale : ordinateur et tablette */}
        <aside className="hidden w-[260px] shrink-0 flex-col border-e border-line bg-paperSoft px-4 py-6 md:flex lg:w-[280px]">
          <Link href="/" className="px-2 font-display text-[26px] font-bold tracking-tight text-ink">
            trokacha
          </Link>
          <div className="mt-6 border-b border-line pb-4">
            <SpaceSwitcher space={space} />
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label={space.nom}>
            {panes.map((pane) => {
              const active = pane === current;
              return (
                <Link
                  key={pane}
                  href={href(pane)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[16px] transition ${
                    active ? 'bg-cashBg font-semibold text-cash' : 'text-inkSoft hover:bg-paperHard'
                  }`}
                >
                  <ProIcon name={PANE_ICON[pane]} size={20} />
                  {t(PANE_LABEL[pane])}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
            <LanguageQuickSwitch />
            <button
              type="button"
              onClick={() => void signOutNow()}
              className="inline-flex items-center gap-2 rounded-full px-3 py-[6px] text-[13px] font-bold text-inkSoft hover:bg-paperHard"
            >
              <ProIcon name="logout" size={16} />
              {t('common.signOut')}
            </button>
          </div>
        </aside>

        {/* Petit écran : en-tête et onglets */}
        <div className="border-b border-line bg-paperSoft md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <div className="min-w-0 flex-1">
              <SpaceSwitcher space={space} />
            </div>
            <LanguageQuickSwitch />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 py-3" aria-label={space.nom}>
            {panes.map((pane) => (
              <Link
                key={pane}
                href={href(pane)}
                aria-current={pane === current ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[14px] ${
                  pane === current ? 'bg-cashBg font-semibold text-cash' : 'text-inkSoft hover:bg-paperHard'
                }`}
              >
                {t(PANE_LABEL[pane])}
              </Link>
            ))}
          </nav>
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">{children}</main>
      </div>
    </ProDeskContext.Provider>
  );
}
