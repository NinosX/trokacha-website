'use client';

// components/pro/agency/ui.tsx
// Petites pièces du volet agence : panneau latéral, fenêtre de confirmation,
// puces, boutons, champs, lignes d'avis. Mêmes couleurs que le reste du bureau.

import { useEffect, useRef, type ReactNode } from 'react';
import { ProIcon } from '../ProIcons';

/** Panneau latéral (côté fin de lecture), plein écran sur un petit écran. Échap ferme. */
export function Drawer({ open, title, onClose, closeLabel, children, footer, wide = false }: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <button type="button" aria-label={closeLabel} tabIndex={-1} className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative flex h-full w-full flex-col bg-paper shadow-cardHover outline-none ${wide ? 'sm:max-w-[620px]' : 'sm:max-w-[520px]'}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">{title}</div>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paperHard text-ink hover:bg-line">
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-line bg-paperSoft px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Petite fenêtre centrée (question, saisie courte). */
export function Dialog({ open, title, onClose, closeLabel, children }: { open: boolean; title: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label={closeLabel} tabIndex={-1} className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-[460px] rounded-card bg-paper p-6 shadow-cardHover">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paperHard text-ink hover:bg-line">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Chip({ label, selected, onClick, disabled = false }: { label: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[15px] font-semibold transition disabled:opacity-40 ${
        selected ? 'border-ink bg-ink text-white' : 'border-line2 bg-white text-ink hover:bg-paperSoft'
      }`}
    >
      {label}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'soft';

const BUTTON_TONE: Record<ButtonTone, string> = {
  primary: 'bg-cash text-white hover:bg-cashInk',
  secondary: 'bg-paperHard text-ink hover:bg-line',
  danger: 'bg-tradeBg text-tradeInk hover:bg-[#F6D5DB]',
  soft: 'bg-cashBg text-cash hover:bg-[#D6E6F7]',
};

export function Button({ label, onClick, tone = 'primary', busy = false, disabled = false, full = false, type = 'button', icon }: {
  label: string;
  onClick?: () => void;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
  type?: 'button' | 'submit';
  icon?: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_TONE[tone]} ${full ? 'w-full' : ''}`}
    >
      {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon}
      {label}
    </button>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[14px] font-semibold text-inkSoft">
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[14px] border border-line2 bg-white px-4 py-2.5 text-[16px] text-ink placeholder:text-inkMuted focus:border-cash focus:outline-none focus:ring-2 focus:ring-cash/20';

export function Notice({ tone, children }: { tone: 'warning' | 'muted' | 'error'; children: ReactNode }) {
  const cls =
    tone === 'warning'
      ? 'border-[#F5D58A] bg-[#FEF3C7] text-[#92400E]'
      : tone === 'error'
        ? 'border-[#F3C5CD] bg-tradeBg text-tradeInk'
        : 'border-line bg-paperSoft text-inkSoft';
  return (
    <p role={tone === 'error' ? 'alert' : undefined} className={`rounded-[14px] border px-4 py-3 text-[15px] leading-6 ${cls}`}>
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-7 text-[17px] font-semibold text-ink first:mt-0">{children}</h3>;
}

export function Thumb({ url, size = 44 }: { url: string | null; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-paperHard text-inkMuted" style={{ width: size, height: size }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ProIcon name="box" size={Math.round(size * 0.45)} />
      )}
    </span>
  );
}
