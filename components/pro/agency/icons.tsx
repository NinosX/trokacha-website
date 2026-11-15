// components/pro/agency/icons.tsx
// Icônes au trait propres au volet agence (même dessin que `../ProIcons`).

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  chevronStart: <path d="M15 6l-6 6 6 6" />,
  chevronEnd: <path d="M9 6l6 6-6 6" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  plane: <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L20 3M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  whatsapp: <path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6zM8.5 9.5c.5 2.5 3 5 5.5 5.5l1.5-1.5 2 1-1 2c-4 0-9-5-9-9l2-1 1 2z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};

export type AgencyIconName = keyof typeof PATHS;

export function AgencyIcon({ name, size = 18, className = '' }: { name: AgencyIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden className={className}>
      {PATHS[name]}
    </svg>
  );
}
