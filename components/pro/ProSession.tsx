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

  useEffect(() => {
    if (ready && !user) router.replace({ pathname: '/connexion', query: { next: pathname } });
  }, [ready, user, pathname, router]);

  const value = useMemo<ProSessionValue | null>(
    () =>
      user
        ? {
            user,
            spaces: usableProSpaces(spaces.rows),
            spacesStatus: spaces.status,
            texts,
            signOutNow: async () => {
              await signOut(clientAuth());
              router.replace('/connexion');
            },
          }
        : null,
    [user, spaces.rows, spaces.status, texts, router],
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

  return <ProSessionContext.Provider value={value}>{children}</ProSessionContext.Provider>;
}
