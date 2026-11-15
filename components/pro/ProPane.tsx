'use client';

// components/pro/ProPane.tsx
// Volet du bureau : Aujourd'hui (lecture), les autres arrivent (titre seul).
// Un volet qui n'appartient pas à la sorte d'espace renvoie vers Aujourd'hui.

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { isProPaneId } from '@/lib/pro/space';
import { PANE_LABEL, useProDesk } from './ProDeskShell';
import { useProSession } from './ProSession';
import { ProTodayPane } from './ProTodayPane';
import { AgencyPlanningPane } from './agency/AgencyPlanningPane';
import { AgencyRequestsPane } from './agency/AgencyRequestsPane';
import { ShopCataloguePane } from './shop/ShopCataloguePane';
import { ShopOrdersPane } from './shop/ShopOrdersPane';

export function ProPaneTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink md:text-[34px]">{title}</h1>
      {children}
    </div>
  );
}

export function ProPane({ pane }: { pane: string }) {
  const { texts } = useProSession();
  const { space, panes } = useProDesk();
  const router = useRouter();
  const allowed = isProPaneId(pane) && panes.includes(pane);

  useEffect(() => {
    if (!allowed) router.replace(`/pro/${encodeURIComponent(space.id)}/aujourdhui`);
  }, [allowed, router, space.id]);

  if (!allowed || !isProPaneId(pane)) return null;
  if (pane === 'aujourdhui') return <ProTodayPane />;
  if (pane === 'planning') return <AgencyPlanningPane />;
  if (pane === 'demandes') return <AgencyRequestsPane />;
  if (pane === 'catalogue') return <ShopCataloguePane />;
  if (pane === 'commandes') return <ShopOrdersPane />;
  return <ProPaneTitle title={texts.t(PANE_LABEL[pane])} />;
}
