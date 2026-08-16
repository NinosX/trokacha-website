import type { Metadata } from 'next';
import { BoutiqueInterstitial } from '@/components/BoutiqueInterstitial';

// /boutique — cible du bouton « Ma boutique » des emails transactionnels
// (MY_BOUTIQUE_URL dans functions/src/email/templates/boutiqueBatchTemplate.ts).
//
// ⚠️ TOUJOURS ACTIVE, indépendamment de SHOW_BOUTIQUES : des emails contenant ce
// lien sont déjà partis, la page ne doit jamais répondre 404. Elle ne montre
// aucun contenu boutique — c'est une page « ouvre l'app », donc pas indexée.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trokacha · Ma boutique',
};

export default function Page() {
  return <BoutiqueInterstitial variant="manage" />;
}
