import Image from 'next/image';
import { LanguageQuickSwitch } from '@/components/LocaleSwitch';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/openInApp';

// Coque des pages ouvertes depuis un lien (e-mails, annonce partagée,
// désinscription) : même papier, même encre et mêmes boutons que le site et
// l'app V2, à la place de l'ancien vert et beige.

type Loc = 'fr' | 'en' | 'ar';

const TAGLINE: Record<Loc, string> = {
  fr: 'L’app algérienne qui fait tout',
  en: 'The Algerian app that does it all',
  ar: 'التطبيق الجزائري الذي يفعل كل شيء',
};
const STORES_TITLE: Record<Loc, string> = {
  fr: 'Pas encore l’app ?',
  en: 'Don’t have the app yet?',
  ar: 'ليس لديك التطبيق بعد؟',
};
const DOWNLOAD: Record<Loc, string> = { fr: 'Télécharger', en: 'Download', ar: 'تحميل' };

export function linkLocale(locale: string | undefined): Loc {
  return locale === 'ar' || locale === 'en' ? locale : 'fr';
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS = {
  swap: <path d="M4 7h14l-3-3M20 17H6l3 3" />,
  offer: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  id: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 13h3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L20 3M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  shop: (
    <>
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z" />
      <path d="M5 13v7h14v-7" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
      <circle cx="12" cy="9" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
};

export type LinkIconName = keyof typeof ICONS;

// Teinte de chaque icône (palette du site : cash, trade, match, warning).
const TINT: Record<LinkIconName, { fg: string; bg: string }> = {
  swap: { fg: 'text-match', bg: 'bg-matchBg' },
  offer: { fg: 'text-trade', bg: 'bg-tradeBg' },
  star: { fg: 'text-warning', bg: 'bg-[#FEF3C7]' },
  chat: { fg: 'text-cash', bg: 'bg-cashBg' },
  user: { fg: 'text-cash', bg: 'bg-cashBg' },
  id: { fg: 'text-match', bg: 'bg-matchBg' },
  camera: { fg: 'text-trade', bg: 'bg-tradeBg' },
  key: { fg: 'text-cash', bg: 'bg-cashBg' },
  shop: { fg: 'text-trade', bg: 'bg-tradeBg' },
  bell: { fg: 'text-warning', bg: 'bg-[#FEF3C7]' },
  mail: { fg: 'text-cash', bg: 'bg-cashBg' },
  pin: { fg: 'text-inkMuted', bg: 'bg-paperHard' },
  search: { fg: 'text-inkMuted', bg: 'bg-paperHard' },
};

export function LinkIcon({ name, size = 22 }: { name: LinkIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export function LinkIconTile({ name }: { name: LinkIconName }) {
  const t = TINT[name];
  return (
    <span className={`flex h-[56px] w-[56px] items-center justify-center rounded-[16px] ${t.bg} ${t.fg}`}>
      <LinkIcon name={name} size={26} />
    </span>
  );
}

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);
const AndroidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
  </svg>
);

/** Boutons des stores, comme dans le haut de l'accueil du site. */
export function StoreButtons({ locale }: { locale: string }) {
  const l = linkLocale(locale);
  return (
    <div className="grid gap-3">
      <p className="text-center text-[13px] font-semibold text-inkMuted">{STORES_TITLE[l]}</p>
      <div className="grid grid-cols-1 gap-[10px] min-[380px]:grid-cols-2">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-ink px-4 py-[11px] text-[14px] font-bold text-paperSoft transition-transform hover:scale-[1.02]"
        >
          <AppleIcon />
          {DOWNLOAD[l]} iOS
        </a>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-line bg-white px-4 py-[11px] text-[14px] font-bold text-ink transition-transform hover:scale-[1.02]"
        >
          <AndroidIcon />
          {DOWNLOAD[l]} Android
        </a>
      </div>
    </div>
  );
}

/** Bouton principal, bleu de l'app (« تقديم عرض », « Ouvrir »…). */
export const primaryButtonClass =
  'inline-flex w-full items-center justify-center rounded-full bg-cash px-6 py-[14px] text-[16px] font-bold text-white shadow-cash transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cash';

/**
 * Page entière : en-tête (logo, mot-symbole, bascule de langue), contenu,
 * signature. `wide` pour la page d'annonce (carte plus large).
 */
export function LinkPageShell({
  locale,
  children,
  wide = false,
}: {
  locale: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const l = linkLocale(locale);
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="px-5 pt-5">
        <div className={`mx-auto flex items-center gap-[10px] ${wide ? 'max-w-[560px]' : 'max-w-[440px]'}`}>
          <Image src="/logo.png" alt="" width={512} height={512} className="h-8 w-8" priority />
          <span className="font-display text-[20px] font-bold tracking-[-0.03em] text-ink">trokacha</span>
          <LanguageQuickSwitch className="ms-auto bg-white" />
        </div>
      </header>
      <main className={`mx-auto flex w-full flex-1 flex-col justify-center px-5 py-8 ${wide ? 'max-w-[600px]' : 'max-w-[480px]'}`}>
        {children}
      </main>
      <footer className="flex items-center justify-center gap-[10px] px-5 pb-8 text-[13px] text-inkMuted">
        <span className="dz-bar h-[3px] w-[22px] rounded-[2px]" />
        {TAGLINE[l]}
        <span className="dz-bar h-[3px] w-[22px] rounded-[2px]" />
      </footer>
    </div>
  );
}

/** Carte blanche du contenu, comme les cartes du site. */
export function LinkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-line bg-white p-7 shadow-card sm:p-8 ${className}`}>{children}</div>
  );
}
