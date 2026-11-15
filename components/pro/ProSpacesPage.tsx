'use client';

// components/pro/ProSpacesPage.tsx
// /pro : les agences et boutiques du compte. Un seul espace : on y entre tout
// de suite. Aucun : on dit comment l'ouvrir depuis l'application.

import { useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { LanguageQuickSwitch } from '@/components/LocaleSwitch';
import { ProCentered, useProSession } from './ProSession';
import { ProIcon } from './ProIcons';

export function ProSpacesPage() {
  const { spaces, spacesStatus, texts, signOutNow, user } = useProSession();
  const { t } = texts;
  const router = useRouter();

  useEffect(() => {
    if (spacesStatus === 'ready' && spaces.length === 1) router.replace(`/pro/${encodeURIComponent(spaces[0].id)}/aujourdhui`);
  }, [spacesStatus, spaces, router]);

  return (
    <div dir={texts.dir} className="min-h-screen bg-paper">
      <header className="flex items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-display text-[24px] font-bold tracking-tight text-ink">
          trokacha
        </Link>
        <div className="flex items-center gap-3">
          <LanguageQuickSwitch />
          <button
            type="button"
            onClick={() => void signOutNow()}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-[6px] text-[13px] font-bold text-ink hover:bg-paperHard"
          >
            <ProIcon name="logout" size={16} />
            {t('common.signOut')}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] px-6 pb-16 pt-4">
        {spacesStatus === 'loading' || (spacesStatus === 'ready' && spaces.length === 1) ? (
          <ProCentered>
            <p className="text-inkMuted">{t('common.loading')}</p>
          </ProCentered>
        ) : spacesStatus === 'error' ? (
          <ProCentered>
            <div>
              <p className="text-ink">{t('common.error')}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
                {t('common.retry')}
              </button>
            </div>
          </ProCentered>
        ) : spaces.length === 0 ? (
          <ProCentered>
            <div className="max-w-md">
              <h1 className="font-display text-[26px] font-bold text-ink">{t('desk.noSpaceTitle')}</h1>
              <p className="mt-3 text-[16px] leading-6 text-inkSoft">{t('desk.noSpaceBody')}</p>
              <p className="mt-6 text-[14px] text-inkMuted">{t('signin.signedInAs', { name: user.displayName || user.email || '' })}</p>
            </div>
          </ProCentered>
        ) : (
          <>
            <h1 className="font-display text-[30px] font-bold text-ink">{t('desk.spacesTitle')}</h1>
            <ul className="mt-6 space-y-3">
              {spaces.map((space) => (
                <li key={space.id}>
                  <Link
                    href={`/pro/${encodeURIComponent(space.id)}/aujourdhui`}
                    className="flex items-center gap-4 rounded-card border border-line bg-paperSoft p-4 shadow-card transition hover:shadow-cardHover"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-cashBg text-cash">
                      <ProIcon name={space.kind === 'agence' ? 'key' : 'shop'} size={24} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <bdi className="block truncate text-[18px] font-semibold text-ink">{space.nom || space.id}</bdi>
                      <span className="block text-[14px] text-inkMuted">
                        {space.kind === 'agence' ? t('desk.kindAgence') : t('desk.kindBoutique')}
                        {space.statut === 'pending' ? ` · ${t('desk.pending')}` : ''}
                      </span>
                    </span>
                    <ProIcon name="chevronEnd" size={20} className="text-inkMuted rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
