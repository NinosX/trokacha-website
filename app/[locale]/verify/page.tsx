'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "🪪",
    "title": "Vérification d’identité",
    "subtitle": "Ouvre Trokacha pour finaliser ta vérification.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "🪪",
    "title": "Identity verification",
    "subtitle": "Open Trokacha to complete your verification.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "🪪",
    "title": "التحقق من الهوية",
    "subtitle": "حلّ تروكاشا باش تكمّل التحقق تاعك.",
    "cta": "حلّ التطبيق"
  }
};

export default function Page() {
  return <OpenInAppInterstitial deepPath="verify" texts={TEXTS} />;
}
