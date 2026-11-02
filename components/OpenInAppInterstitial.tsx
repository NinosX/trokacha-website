'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { openTrokachaApp } from '@/lib/openInApp';
import {
  LinkCard,
  LinkIconTile,
  LinkPageShell,
  StoreButtons,
  primaryButtonClass,
  type LinkIconName,
} from '@/components/LinkPage';

// Page interstitielle générique pour les liens des emails de notification
// (match, proposition, conversation, profil, vérification).
//
// 1. TENTATIVE AUTOMATIQUE au montage (sans clic) : c'est le cas nominal quand
//    l'utilisateur a l'app — il ne doit pas avoir à cliquer.
// 2. BOUTON MANUEL conservé : Chrome/Safari bloquent les navigations vers un
//    scheme custom sans geste utilisateur dans plusieurs contextes (webviews
//    in-app WhatsApp/Instagram notamment) → le bouton reste indispensable.
//
// Android : URL intent:// = Chrome ouvre l'app OU bascule Play Store nativement
// (S.browser_fallback_url) — chemin principal tant que les App Links natifs
// (/match, /proposal, …) ne sont pas dans le manifest du build courant.
// iOS : trokacha://… (l'app est déclarée sur le scheme) + fallback App Store.
// Mécanique partagée avec /ad/[id] : lib/openInApp.ts.

/** Laisse la page se peindre (bouton visible) avant la tentative auto. */
const AUTO_OPEN_DELAY_MS = 400;

export interface InterstitialTexts {
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
  /** Icône au trait de la carte (style de l'app V2, plus d'emoji). */
  icon: LinkIconName;
}

// Chemin complet du deep link, avec les paramètres à faire suivre (ex :
// ?sender=<uid> pour le chat). Lu dans l'URL au moment de l'ouverture : la page
// n'a plus besoin de useSearchParams, donc plus de Suspense vide, et la carte
// s'affiche dès le HTML.
function buildPath(deepPath: string, forwardQueryParams: string[]): string {
  const search = new URLSearchParams(window.location.search);
  const forwarded = forwardQueryParams
    .map((k) => {
      const v = search.get(k);
      return v ? `${k}=${encodeURIComponent(v)}` : null;
    })
    .filter(Boolean)
    .join('&');
  return forwarded ? `${deepPath}?${forwarded}` : deepPath;
}

export default function OpenInAppInterstitial({ deepPath, forwardQueryParams = [], texts, icon }: OpenInAppInterstitialProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = texts[locale as keyof typeof texts] || texts.fr;
  const forwardKey = forwardQueryParams.join(',');

  const openInApp = useCallback(() => {
    openTrokachaApp(buildPath(deepPath, forwardKey ? forwardKey.split(',') : []));
  }, [deepPath, forwardKey]);

  // Tentative automatique au chargement (mobile uniquement). Le ref évite le
  // double déclenchement du StrictMode de React 19 en dev.
  const autoAttemptedRef = useRef(false);
  useEffect(() => {
    if (autoAttemptedRef.current) return;
    autoAttemptedRef.current = true;
    const fullPath = buildPath(deepPath, forwardKey ? forwardKey.split(',') : []);
    const timer = window.setTimeout(() => openTrokachaApp(fullPath, { auto: true }), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [deepPath, forwardKey]);

  return (
    <LinkPageShell locale={locale}>
      <LinkCard className="grid gap-6 text-center">
        <div className="grid justify-items-center gap-4">
          <LinkIconTile name={icon} />
          <h1 className="font-display text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink text-balance">
            {t.title}
          </h1>
          <p className="max-w-[34ch] text-[16px] leading-[1.55] text-inkSoft">{t.subtitle}</p>
        </div>
        <button type="button" onClick={openInApp} className={primaryButtonClass}>
          {t.cta}
        </button>
        <div className="border-t border-line pt-5">
          <StoreButtons locale={locale} />
        </div>
      </LinkCard>
    </LinkPageShell>
  );
}
