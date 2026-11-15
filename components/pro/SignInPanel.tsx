'use client';

// components/pro/SignInPanel.tsx
// =============================================================================
// CONNEXION au site avec le compte Trokacha (Firebase Auth web) : e-mail et mot
// de passe, Google (fenêtre ; page entière si le navigateur bloque la fenêtre),
// « mot de passe oublié » par l'e-mail de Firebase, déconnexion.
// Après connexion : retour à `?next=` (chemin interne seulement), sinon /pro.
// =============================================================================

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  getRedirectResult,
  type UserCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { Link, useRouter } from '@/i18n/navigation';
import { LanguageQuickSwitch } from '@/components/LocaleSwitch';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clientAuth } from '@/lib/firebaseClient';
import { useAuthUser } from '@/lib/pro/hooks';
import { proTexts, type ProTextKey } from '@/lib/pro/texts';
import { safeNext } from '@/lib/pro/safeNext';
import { ProIcon } from './ProIcons';


function errorKey(error: unknown): ProTextKey {
  const code = String((error as { code?: unknown } | null)?.code ?? '');
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
    case 'auth/missing-password':
      return 'signin.error.invalid';
    case 'auth/too-many-requests':
      return 'signin.error.tooMany';
    case 'auth/network-request-failed':
      return 'signin.error.network';
    case 'auth/user-disabled':
      return 'signin.error.disabled';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'signin.error.popupClosed';
    default:
      return 'signin.error.generic';
  }
}

/**
 * Compte Google sans compte Trokacha (mise en ligne anticipée du 15/11, aucun compte orphelin) :
 * un compte que CETTE connexion vient de créer est supprimé tout de suite ; un compte plus
 * ancien sans document `users` est seulement déconnecté (jamais supprimé d'ici). Rend vrai
 * quand la connexion est refusée.
 */
export async function refuserCompteInconnu(credential: UserCredential | null): Promise<boolean> {
  if (!credential) return false;
  const user = credential.user;
  if (getAdditionalUserInfo(credential)?.isNewUser) {
    try {
      await user.delete();
    } catch {
      await signOut(clientAuth());
    }
    return true;
  }
  let existe = true;
  try {
    existe = (await getDoc(doc(db, 'users', user.uid))).exists();
  } catch {
    existe = true; // Lecture impossible : le bureau dira lui-même ce qui manque.
  }
  if (existe) return false;
  await signOut(clientAuth());
  return true;
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export function SignInPanel() {
  const locale = useLocale();
  const texts = useMemo(() => proTexts(locale), [locale]);
  const { t } = texts;
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get('next'), typeof window === 'undefined' ? 'https://trokacha.com' : window.location.origin);
  const { user, ready } = useAuthUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // Vérification d'un compte Google (retour de page entière ou fenêtre) : pas de renvoi au bureau avant.
  const [verifying, setVerifying] = useState(true);

  // Retour d'une connexion Google par page entière.
  useEffect(() => {
    const auth = clientAuth();
    auth.languageCode = texts.locale;
    getRedirectResult(auth)
      .then(async (credential) => {
        if (await refuserCompteInconnu(credential)) setError(t('signin.error.noAccount'));
      })
      .catch((e: unknown) => setError(t(errorKey(e))))
      .finally(() => setVerifying(false));
  }, [texts.locale, t]);

  // Déjà connecté et venu d'une page du bureau : on y retourne.
  useEffect(() => {
    if (ready && user && !verifying && search.get('next')) router.replace(next);
  }, [ready, user, verifying, search, next, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(clientAuth(), email.trim(), password);
      router.replace(next);
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    const auth = clientAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setVerifying(true);
    try {
      const credential = await signInWithPopup(auth, provider);
      if (await refuserCompteInconnu(credential)) {
        setError(t('signin.error.noAccount'));
        return;
      }
      router.replace(next);
    } catch (e) {
      const code = String((e as { code?: unknown } | null)?.code ?? '');
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
      setVerifying(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setInfo(null);
    const address = email.trim();
    if (!address) {
      setError(t('signin.resetNeedEmail'));
      return;
    }
    try {
      const auth = clientAuth();
      auth.languageCode = texts.locale;
      await sendPasswordResetEmail(auth, address);
    } catch {
      // Même réponse que l'adresse existe ou non : on ne dit pas quels comptes existent.
    }
    setInfo(t('signin.resetSent', { email: address }));
  };

  const field =
    'w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none transition focus:border-cash focus:ring-2 focus:ring-cashBg';

  return (
    <div dir={texts.dir} className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-[24px] font-bold tracking-tight text-ink">
          trokacha
        </Link>
        <LanguageQuickSwitch />
      </header>

      <main className="mx-auto w-full max-w-[420px] px-6 pb-16 pt-6">
        <h1 className="font-display text-[32px] font-bold leading-tight text-ink">{t('signin.title')}</h1>
        <p className="mt-2 text-[16px] leading-6 text-inkSoft">{t('signin.subtitle')}</p>

        {ready && user ? (
          <div className="mt-8 rounded-card border border-line bg-paperSoft p-5">
            <p className="text-[15px] text-inkSoft">{t('signin.signedInAs', { name: user.displayName || user.email || '' })}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/pro" className="inline-flex items-center rounded-full bg-cash px-5 py-3 text-[15px] font-semibold text-white shadow-cash hover:bg-cashInk">
                {t('signin.goToDesk')}
              </Link>
              <button
                type="button"
                onClick={() => void signOut(clientAuth())}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-[15px] font-semibold text-ink hover:bg-paperHard"
              >
                <ProIcon name="logout" size={18} />
                {t('common.signOut')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-semibold text-inkSoft">{t('signin.email')}</span>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-semibold text-inkSoft">{t('signin.password')}</span>
                <span className="relative block">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${field} pe-24`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 end-3 my-auto h-8 rounded-full px-3 text-[14px] font-semibold text-cash hover:bg-cashBg"
                  >
                    {showPassword ? t('signin.hide') : t('signin.show')}
                  </button>
                </span>
              </label>

              <button type="button" onClick={() => void forgot()} className="text-[14px] font-semibold text-cash hover:underline">
                {t('signin.forgot')}
              </button>

              {error ? (
                <p role="alert" className="rounded-[12px] bg-tradeBg px-4 py-3 text-[15px] text-tradeInk">
                  {error}
                </p>
              ) : null}
              {info ? (
                <p role="status" className="rounded-[12px] bg-matchBg px-4 py-3 text-[15px] text-matchInk">
                  {info}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-cash px-5 py-3.5 text-[16px] font-semibold text-white shadow-cash transition hover:bg-cashInk disabled:opacity-60"
              >
                {t('signin.submit')}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[14px] text-inkMuted">
              <span className="h-px flex-1 bg-line" />
              {t('signin.or')}
              <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={() => void google()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-5 py-3.5 text-[16px] font-semibold text-ink transition hover:bg-paperSoft disabled:opacity-60"
            >
              <GoogleMark />
              {t('signin.google')}
            </button>

            <p className="mt-8 text-[14px] leading-6 text-inkMuted">{t('signin.noAccount')}</p>
          </>
        )}
      </main>
    </div>
  );
}
