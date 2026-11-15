'use client';

// components/pro/shop/ShopUi.tsx
// =============================================================================
// Petites pièces du volet boutique du bureau : fenêtre (dialog), boutons,
// puces, champ, avis passager, vignette, icônes propres au volet. Même dessin
// que le reste du bureau (couleurs `paper`, `ink`, `cash` ; coins arrondis).
// =============================================================================

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useProSession } from '../ProSession';

// ── Icônes au trait (celles qui manquent à `ProIcons`) ─────────────────────

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  package: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10M7.5 5l9 4" />
    </>
  ),
  photo: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
} as const;

export type ShopIconName = keyof typeof PATHS;

export function ShopIcon({ name, size = 18, className }: { name: ShopIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} {...STROKE}>
      {PATHS[name]}
    </svg>
  );
}

// ── Boutons ────────────────────────────────────────────────────────────────

type Tone = 'primary' | 'soft' | 'outline' | 'danger' | 'ghost';

const TONES: Record<Tone, string> = {
  primary: 'bg-cash text-white hover:bg-cashInk disabled:bg-line2',
  soft: 'bg-cashBg text-cash hover:bg-[#d7e7f7] disabled:text-inkMuted',
  outline: 'border border-line bg-white text-ink hover:bg-paperSoft disabled:text-inkMuted',
  danger: 'bg-[#FBE9EC] text-danger hover:bg-[#f6d6dc] disabled:text-inkMuted',
  ghost: 'text-inkSoft hover:bg-paperHard disabled:text-inkMuted',
};

export function ShopButton({
  children,
  onClick,
  tone = 'primary',
  disabled,
  busy,
  small,
  type = 'button',
  className = '',
  title,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: Tone;
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      title={title}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed ${small ? 'px-3.5 py-1.5 text-[14px]' : 'px-5 py-2.5 text-[15px]'} ${TONES[tone]} ${busy ? 'opacity-70' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Puces (choix d'une taille, d'un moyen de paiement…) ─────────────────────

export function ShopChip({ label, sub, selected, onClick, disabled, ariaLabel }: { label: string; sub?: string; selected?: boolean; onClick: () => void; disabled?: boolean; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`inline-flex min-w-[52px] flex-col items-center rounded-[14px] border px-3 py-1.5 text-[15px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? 'border-cash bg-cashBg font-semibold text-cash' : 'border-line bg-white text-ink hover:bg-paperSoft'
      }`}
    >
      <bdi>{label}</bdi>
      {sub ? <span className="text-[12px] text-inkMuted">{sub}</span> : null}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

// ── Champ ──────────────────────────────────────────────────────────────────

export function ShopField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[13px] text-inkMuted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-inkMuted focus:border-cash focus:ring-2 focus:ring-cash/20';

// ── Fenêtre ────────────────────────────────────────────────────────────────

export function ShopDialog({ title, sub, onClose, children, footer, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { texts } = useProSession();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Une seule fois à l'ouverture (sinon chaque frappe redonnerait la main au premier champ).
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', escape);
    const previous = document.activeElement as HTMLElement | null;
    // Le premier champ (ou la fenêtre) prend la main au clavier.
    const first = panel.current?.querySelector<HTMLElement>('input, select, textarea, button[data-autofocus]');
    (first ?? panel.current)?.focus();
    return () => {
      document.removeEventListener('keydown', escape);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        dir={texts.dir}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-[24px] bg-paperSoft shadow-cardHover outline-none sm:rounded-[24px] ${wide ? 'sm:max-w-[760px]' : 'sm:max-w-[480px]'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h2>
            {sub ? (
              <p className="mt-1 truncate text-[15px] text-inkMuted">
                <bdi>{sub}</bdi>
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} aria-label={texts.t('boutique.cat.close')} className="rounded-full p-2 text-inkSoft hover:bg-paperHard">
            <ShopIcon name="x" size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

// ── Avis passager ──────────────────────────────────────────────────────────

export type NoticeTone = 'success' | 'error' | 'info';
export interface Notice {
  tone: NoticeTone;
  text: string;
}

/** Un avis à la fois, effacé au bout de 5 s. */
export function useNotice(): { notice: Notice | null; show: (tone: NoticeTone, text: string) => void; clear: () => void } {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<number | null>(null);
  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setNotice(null);
  }, []);
  const show = useCallback((tone: NoticeTone, text: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    setNotice({ tone, text });
    timer.current = window.setTimeout(() => setNotice(null), tone === 'error' ? 8000 : 5000);
  }, []);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return { notice, show, clear };
}

export function NoticeBar({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const { texts } = useProSession();
  if (!notice) return null;
  const tone = notice.tone === 'error' ? 'border-[#F3C2CB] bg-[#FBE9EC] text-danger' : notice.tone === 'success' ? 'border-[#BFDCCB] bg-matchBg text-matchInk' : 'border-line bg-white text-ink';
  return (
    <div dir={texts.dir} role={notice.tone === 'error' ? 'alert' : 'status'} className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className={`pointer-events-auto flex max-w-[560px] items-center gap-3 rounded-[16px] border px-5 py-3 text-[15px] shadow-cardHover ${tone}`}>
        <span className="min-w-0 flex-1">
          <bdi>{notice.text}</bdi>
        </span>
        <button type="button" onClick={onClose} aria-label={texts.t('boutique.cat.close')} className="rounded-full p-1 hover:bg-black/5">
          <ShopIcon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}

/** Message d'erreur sous un formulaire. */
export function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-3 rounded-[12px] bg-[#FBE9EC] px-4 py-2.5 text-[14px] text-danger">
      {text}
    </p>
  );
}

// ── Vignette d'article ─────────────────────────────────────────────────────

export function ArticleThumb({ url, size = 52 }: { url: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size };
  if (!url || broken) {
    return (
      <span style={box} className="flex shrink-0 items-center justify-center rounded-[12px] bg-paperHard text-inkMuted">
        <ShopIcon name="photo" size={Math.round(size * 0.42)} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" style={box} loading="lazy" decoding="async" onError={() => setBroken(true)} className="shrink-0 rounded-[12px] bg-paperHard object-cover" />
  );
}
