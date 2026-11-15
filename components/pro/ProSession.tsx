'use client';

// components/pro/ProSession.tsx
// =============================================================================
// Session du bureau pro : compte connecté (sinon renvoi vers /connexion avec
// l'adresse de retour), adresse e-mail confirmée (sinon les règles refusent
// la lecture du carnet : on le dit au lieu d'afficher une erreur), et les
// agences et boutiques du compte, écoutées une seule fois pour tout le bureau.
// =============================================================================

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import type { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { usePathname, useRouter } from '@/i18n/navigation';
import { clientAuth } from '@/lib/firebaseClient';
import { useAuthUser, useMySpaces, type LiveStatus } from '@/lib/pro/hooks';
import { usableProSpaces, type ProSpace } from '@/lib/pro/space';
import { espacesOuverts, porteDuBureau } from '@/lib/pro/pilot';
import { useProPilotes } from '@/lib/pro/pilotHooks';
import { APP_STORE_URL, PLAY_STORE_URL, detectPlatform, openTrokachaApp } from '@/lib/openInApp';
import { proTexts, type ProTexts } from '@/lib/pro/texts';
import { ProIcon } from './ProIcons';

export interface ProSessionValue {
  user: User;
  spaces: ProSpace[];
  spacesStatus: LiveStatus;
  texts: ProTexts;
  signOutNow: () => Promise<void>;
}

const ProSessionContext = createContext<ProSessionValue | null>(null);

export function useProSession(): ProSessionValue {
  const value = useContext(ProSessionContext);
  if (!value) throw new Error('useProSession hors de <ProSession>');
  return value;
}

export function useProTexts(): ProTexts {
  const locale = useLocale();
  return useMemo(() => proTexts(locale), [locale]);
}

export function ProCentered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center px-6 py-16 text-center">{children}</div>;
}

export function ProSession({ children }: { children: ReactNode }) {
  const texts = useProTexts();
  const { user, ready } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const verified = !!user?.emailVerified;
  const spaces = useMySpaces(user && verified ? user.uid : null);
  // Mise en ligne anticipée (15/11) : seuls les espaces pilotes s'ouvrent ici, comme sur le serveur.
  const pilot = useProPilotes(user && verified ? user.uid : null);
  const usable = useMemo(() => usableProSpaces(spaces.rows), [spaces.rows]);
  const porte = porteDuBureau({
    spaces: usable,
    spacesReady: spaces.status !== 'loading',
    spacesError: spaces.status === 'error',
    pilotes: pilot.pilotes,
    pilotesError: pilot.error,
  });
  const ouverts = useMemo(() => espacesOuverts(usable, pilot.pilotes ?? new Set<string>()), [usable, pilot.pilotes]);

  useEffect(() => {
    if (ready && !user) router.replace({ pathname: '/connexion', query: { next: pathname } });
  }, [ready, user, pathname, router]);

  const value = useMemo<ProSessionValue | null>(
    () =>
      user
        ? {
            user,
            spaces: ouverts,
            spacesStatus: porte === 'attente' ? 'loading' : spaces.status,
            texts,
            signOutNow: async () => {
              await signOut(clientAuth());
              router.replace('/connexion');
            },
          }
        : null,
    [user, ouverts, porte, spaces.status, texts, router],
  );

  if (!ready || !user || !value) {
    return (
      <div dir={texts.dir} className="min-h-screen bg-paper">
        <ProCentered>
          <p className="text-inkMuted">{texts.t('common.loading')}</p>
        </ProCentered>
      </div>
    );
  }

  if (!verified) {
    return (
      <div dir={texts.dir} className="min-h-screen bg-paper">
        <ProCentered>
          <div className="max-w-md">
            <p className="text-[17px] leading-7 text-ink">{texts.t('desk.emailNotVerified')}</p>
            <button
              type="button"
              onClick={() => void value.signOutNow()}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard"
            >
              <ProIcon name="logout" size={18} />
              {texts.t('common.signOut')}
            </button>
          </div>
        </ProCentered>
      </div>
    );
  }

  if (porte === 'erreur') return <ProReadError texts={texts} onSignOut={() => void value.signOutNow()} />;
  if (porte === 'ferme') return <ProClosed texts={texts} onSignOut={() => void value.signOutNow()} />;

  return <ProSessionContext.Provider value={value}>{children}</ProSessionContext.Provider>;
}

/**
 * Lecture des espaces du compte en échec (réseau, règles) : on le dit et on propose de réessayer
 * (relecture 2 de Main, SM2). Recharger la page relance toutes les écoutes du bureau.
 */
function ProReadError({ texts, onSignOut }: { texts: ProTexts; onSignOut: () => void }) {
  return (
    <div dir={texts.dir} className="min-h-screen bg-paper">
      <ProCentered>
        <div className="max-w-md" data-testid="pro-read-error">
          <h1 className="font-display text-[24px] font-bold text-ink">{texts.t('gate.errorTitle')}</h1>
          <p className="mt-3 text-[16px] leading-6 text-inkSoft">{texts.t('gate.errorBody')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-white hover:opacity-90"
              data-testid="pro-read-error-retry"
            >
              {texts.t('common.retry')}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard"
            >
              <ProIcon name="logout" size={18} />
              {texts.t('common.signOut')}
            </button>
          </div>
        </div>
      </ProCentered>
    </div>
  );
}

/** Compte dont aucun espace n'est encore pilote : une page calme, sans erreur. */
function ProClosed({ texts, onSignOut }: { texts: ProTexts; onSignOut: () => void }) {
  const mobile = typeof window !== 'undefined' && detectPlatform() !== 'other';
  return (
    <div dir={texts.dir} className="min-h-screen bg-paper">
      <ProCentered>
        <div className="max-w-md" data-testid="pro-closed">
          <h1 className="font-display text-[24px] font-bold text-ink">{texts.t('gate.closedTitle')}</h1>
          <p className="mt-3 text-[16px] leading-6 text-inkSoft">{texts.t('gate.closedBody')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {mobile ? (
              <button
                type="button"
                onClick={() => openTrokachaApp('boutique')}
                className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-white hover:opacity-90"
              >
                {texts.t('gate.openApp')}
              </button>
            ) : (
              <>
                <a href={APP_STORE_URL} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard">
                  App Store
                </a>
                <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard">
                  Google Play
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[15px] font-semibold text-ink hover:bg-paperHard"
            >
              <ProIcon name="logout" size={18} />
              {texts.t('common.signOut')}
            </button>
          </div>
        </div>
      </ProCentered>
    </div>
  );
}
