// components/pro/Ltr.tsx
// =============================================================================
// Isolat gauche-à-droite pour un numéro de téléphone, un montant signé (« −1 »,
// « −2 000 DA ») ou un code : dans une page arabe, sans lui, le navigateur
// affiche « 213699876543+ » ou « 1− ». `<bdi dir="ltr">` isole le morceau ET
// fixe son sens, quel que soit le texte autour.
// =============================================================================

import type { ReactNode } from 'react';

export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {children}
    </bdi>
  );
}
