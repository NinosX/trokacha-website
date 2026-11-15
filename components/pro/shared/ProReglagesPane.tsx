'use client';

// components/pro/shared/ProReglagesPane.tsx
// =============================================================================
// RÉGLAGES du bureau : pour l'instant, l'import d'un tableur (flotte d'une
// agence, articles d'une boutique, les deux pour une boutique qui loue aussi).
// Les autres réglages de l'espace restent dans l'application.
// =============================================================================

import type { SorteImport } from '@/lib/pro-core';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { useProSession } from '../ProSession';
import { ProImportPanel } from './ProImportPanel';

export function ProReglagesPane() {
  const { texts: x } = useProSession();
  const { space } = useProDesk();
  const sortes: SorteImport[] = space.kind === 'agence' ? ['flotte'] : space.hasRentals ? ['articles', 'flotte'] : ['articles'];
  return (
    <div className="max-w-[1100px]">
      <ProPaneTitle title={x.t('pane.reglages')} />
      <section>
        <h2 className="mb-3 text-[20px] font-semibold text-ink">{x.t('reg.importTitle')}</h2>
        <ProImportPanel key={space.id} bid={space.id} sortes={sortes} />
      </section>
      <p className="mt-8 text-[15px] text-inkMuted">{x.t('reg.appNote')}</p>
    </div>
  );
}
