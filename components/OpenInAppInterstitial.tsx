'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';

// Page interstitielle générique pour les liens des emails de notification
// (match, proposition, conversation, profil, vérification). Reprend le patron
// éprouvé de testDZ/page.tsx : bouton (geste utilisateur requis par Chrome
// pour les schemes) → app si installée, sinon store.
//
// Android : URL intent:// = Chrome ouvre l'app OU bascule Play Store nativement
// (S.browser_fallback_url) — chemin principal tant que les App Links natifs
// (/match, /proposal, …) ne sont pas dans le manifest du build courant.
// iOS : trokacha://… (l'app est déclarée sur le scheme) + fallback App Store.

const APP_STORE_URL = 'https://apps.apple.com/app/trokacha/id6740211562';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.trokacha.app';
const ANDROID_PACKAGE = 'com.trokacha.app';

export interface InterstitialTexts {
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
}

interface OpenInAppInterstitialProps {
  /** Chemin deep link SANS scheme, ex : `match/abc123` (query incluse si besoin) */
  deepPath: string;
  /** Query params à faire suivre dans le deep link (ex : ['sender']) */
  forwardQueryParams?: string[];
  texts: Record<'fr' | 'en' | 'ar', InterstitialTexts>;
}

function InterstitialInner({ deepPath, forwardQueryParams = [], texts }: OpenInAppInterstitialProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'fr';
  const t = texts[locale as keyof typeof texts] || texts.fr;

  // Reconstruit la query à faire suivre (ex : ?sender=<uid> pour le chat)
  const forwarded = forwardQueryParams
    .map((k) => {
      const v = searchParams?.get(k);
      return v ? `${k}=${encodeURIComponent(v)}` : null;
    })
    .filter(Boolean)
    .join('&');
  const fullPath = forwarded ? `${deepPath}?${forwarded}` : deepPath;

  const openInApp = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isAndroid) {
      // intent:// : Chrome ouvre l'app si installée, sinon redirige Play Store.
      // Pas besoin de timeout — le fallback est géré nativement par Chrome.
      window.location.href =
        `intent://${fullPath}#Intent;scheme=trokacha;package=${ANDROID_PACKAGE};` +
        `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
      return;
    }

    window.location.href = `trokacha://${fullPath}`;
    // Non installé → store après un court délai (patron identique à testDZ).
    setTimeout(() => {
      if (isIOS) {
        window.location.href = APP_STORE_URL;
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2E7D3] to-[#FBF6EC] flex flex-col items-center justify-center px-6 py-12">
      {/* Header marque */}
      <div className="flex items-center gap-3 mb-10">
        <Image src="/logo.png" alt="Trokacha" width={44} height={44} className="rounded-xl" />
        <span className="font-bold text-2xl text-[#0D4F2E]">Trokacha</span>
      </div>

      {/* Carte centrale */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur rounded-3xl shadow-xl shadow-[#0D4F2E]/10 border border-[#E8B86A]/40 px-8 py-10 text-center">
        <div className="text-5xl mb-5">{t.emoji}</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D4F2E] leading-snug mb-4">
          {t.title}
        </h1>
        <p className="text-[#5b4a37] mb-8">{t.subtitle}</p>

        <button
          onClick={openInApp}
          className="w-full bg-[#0D4F2E] hover:bg-[#0a3f25] text-[#F2E7D3] font-semibold py-4 px-8 rounded-full transition-colors text-lg shadow-lg shadow-[#0D4F2E]/25"
        >
          {t.cta}
        </button>

        {/* Store badges */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            App Store
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            Play Store
          </a>
        </div>
      </div>

      <p className="text-xs text-[#a08e75] mt-8">Trokacha — le troc nouvelle génération 🇩🇿</p>
    </div>
  );
}

// useSearchParams exige une Suspense boundary en App Router
export default function OpenInAppInterstitial(props: OpenInAppInterstitialProps) {
  return (
    <Suspense fallback={null}>
      <InterstitialInner {...props} />
    </Suspense>
  );
}
