'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

// Lien de l’e-mail de bienvenue (« Créer une annonce »). L'app sait ouvrir ce chemin (utils/deepLinks.ts) ;
// sans cette page, le lien tombait en 404 dans un navigateur.
const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "📸",
    "title": "Publiez votre annonce",
    "subtitle": "Ouvrez Trokacha pour publier votre première annonce.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "📸",
    "title": "Post your listing",
    "subtitle": "Open Trokacha to post your first listing.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "📸",
    "title": "انشر إعلانك",
    "subtitle": "افتح تروكاشا لنشر إعلانك الأول.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  return <OpenInAppInterstitial deepPath="create-ad" texts={TEXTS} />;
}
