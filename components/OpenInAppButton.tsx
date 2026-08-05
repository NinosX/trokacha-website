'use client';

import { useCallback } from 'react';
import { openTrokachaApp } from '@/lib/openInApp';

// Bouton « Voir dans l'app » à poser dans une page SERVEUR (page boutique).
// Même mécanique que l'interstitiel et /ad/[id] : intent:// sur Android (repli
// Play Store natif), scheme + repli App Store sur iOS — cf. lib/openInApp.ts.
// Pas de tentative automatique ici : la page a du contenu à lire, on ne détourne
// pas un visiteur qui vient du référencement.

interface OpenInAppButtonProps {
  /** Chemin deep link SANS scheme, ex : `boutique/abc123`. */
  deepPath: string;
  label: string;
  className?: string;
}

export function OpenInAppButton({ deepPath, label, className }: OpenInAppButtonProps) {
  const onClick = useCallback(() => {
    openTrokachaApp(deepPath);
  }, [deepPath]);

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

export default OpenInAppButton;
