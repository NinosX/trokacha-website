import { ProPane } from '@/components/pro/ProPane';

// /pro/[bid]/[volet] : aujourdhui, planning, demandes, catalogue, commandes,
// clients, caisse, reglages (le volet hors de la sorte d'espace renvoie vers
// Aujourd'hui).
export default async function Page({ params }: { params: Promise<{ pane: string }> }) {
  const { pane } = await params;
  return <ProPane pane={pane} />;
}
