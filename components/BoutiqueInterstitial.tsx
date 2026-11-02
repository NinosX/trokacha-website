'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

// Interstitiel « ouvrir dans l'app » des routes boutique.
//
// Trois usages, un seul composant :
//  • `manage`    → /boutique, cible du bouton « Ma boutique » des emails
//                  transactionnels (functions/src/email/templates/boutiqueBatchTemplate.ts).
//                  TOUJOURS servi, quel que soit SHOW_BOUTIQUES : ce lien est
//                  déjà dans des emails partis, il ne doit jamais tomber en 404.
//  • `shop`      → /boutique/[id] quand le flag est off, quand la boutique
//                  n'existe pas, ou qu'elle n'est pas `active` (rules).
//  • `directory` → /boutiques quand le flag est off.
//
// ⚠️ Les deep links `boutique` / `boutique/{id}` ne sont pas encore routés par
// `utils/deepLinks.ts` côté app : aujourd'hui l'app s'ouvre sur son écran par
// défaut. Le repli store et le CTA restent corrects ; le routage fin viendra
// avec le lot deep links boutique de l'app.

export type BoutiqueInterstitialVariant = 'manage' | 'shop' | 'directory';

const TEXTS: Record<BoutiqueInterstitialVariant, Record<'fr' | 'en' | 'ar', InterstitialTexts>> = {
  manage: {
    fr: {
      title: 'Gérez votre boutique dans l’app Trokacha',
      subtitle:
        'Ouvrez Trokacha pour publier vos articles, suivre vos ventes et tenir votre vitrine à jour.',
      cta: 'Ouvrir dans l’app',
    },
    en: {
      title: 'Manage your shop in the Trokacha app',
      subtitle: 'Open Trokacha to publish your items, follow your sales and update your shop.',
      cta: 'Open in the app',
    },
    ar: {
      title: 'أدِر محلّك في تطبيق تروكاشا',
      subtitle: 'افتح تروكاشا لإضافة سلعك، ومتابعة مبيعاتك، وتحديث محلّك.',
      cta: 'افتح التطبيق',
    },
  },
  shop: {
    fr: {
      title: 'Cette boutique vous attend dans l’app',
      subtitle: 'Ouvrez Trokacha pour voir la vitrine, les articles et contacter le vendeur.',
      cta: 'Ouvrir dans l’app',
    },
    en: {
      title: 'This shop is waiting in the app',
      subtitle: 'Open Trokacha to browse the shop and contact the seller.',
      cta: 'Open in the app',
    },
    ar: {
      title: 'هذا المحل في انتظارك في التطبيق',
      subtitle: 'افتح تروكاشا لرؤية المحل وسلعه والتواصل مع البائع.',
      cta: 'افتح التطبيق',
    },
  },
  directory: {
    fr: {
      title: 'Les boutiques sont dans l’app Trokacha',
      subtitle: 'Ouvrez Trokacha pour découvrir les boutiques près de chez vous.',
      cta: 'Ouvrir dans l’app',
    },
    en: {
      title: 'Shops live in the Trokacha app',
      subtitle: 'Open Trokacha to discover the shops near you.',
      cta: 'Open in the app',
    },
    ar: {
      title: 'المحلات موجودة في تطبيق تروكاشا',
      subtitle: 'افتح تروكاشا لاكتشاف المحلات القريبة منك.',
      cta: 'افتح التطبيق',
    },
  },
};

interface BoutiqueInterstitialProps {
  variant: BoutiqueInterstitialVariant;
  /** Id de boutique, pour le deep link de la variante `shop`. */
  boutiqueId?: string;
}

export function BoutiqueInterstitial({ variant, boutiqueId }: BoutiqueInterstitialProps) {
  const deepPath =
    variant === 'shop' && boutiqueId
      ? `boutique/${boutiqueId}`
      : variant === 'directory'
        ? 'boutiques'
        : 'boutique';

  return <OpenInAppInterstitial deepPath={deepPath} texts={TEXTS[variant]} icon="shop" />;
}

export default BoutiqueInterstitial;
