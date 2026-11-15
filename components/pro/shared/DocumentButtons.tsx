'use client';

// components/pro/shared/DocumentButtons.tsx
// =============================================================================
// Les boutons des documents d'une opération (fiche d'une réservation, carte
// d'une vente à expédier) : chacun fait la page bilingue (`build`) et ouvre la
// boîte d'impression du navigateur (imprimante ou PDF).
// =============================================================================

import { useState } from 'react';
import type { DocumentPro, SorteDocument } from '@/lib/pro-core';
import { printDocumentHtml } from '@/lib/pro/shared/printDocument';
import type { ProTexts } from '@/lib/pro/texts';

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function DocumentButtons({ kinds, build, texts, small = false }: { kinds: readonly SorteDocument[]; build: (sorte: SorteDocument) => DocumentPro; texts: ProTexts; small?: boolean }) {
  const [error, setError] = useState(false);
  if (!kinds.length) return null;
  const make = async (sorte: SorteDocument) => {
    setError(false);
    try {
      await printDocumentHtml(build(sorte).html);
    } catch {
      setError(true);
    }
  };
  const size = small ? 'px-3 py-1.5 text-[14px]' : 'px-4 py-2 text-[15px]';
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {kinds.map((sorte) => (
          <button
            key={sorte}
            type="button"
            onClick={() => void make(sorte)}
            className={`inline-flex items-center gap-2 rounded-full border border-line2 bg-white font-semibold text-ink hover:bg-paperHard ${size}`}
          >
            <DocIcon />
            {texts.t(`doc.kind.${sorte}`)}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[14px] text-tradeInk">
          {texts.t('doc.error')}
        </p>
      ) : null}
    </div>
  );
}
