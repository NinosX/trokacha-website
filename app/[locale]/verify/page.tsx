'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "🪪",
    "title": "Vérification d’identité",
    "subtitle": "Ouvrez Trokacha pour finaliser votre vérification.",
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
    "subtitle": "افتح تروكاشا لإكمال التحقق من هويتك.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  return <OpenInAppInterstitial deepPath="verify" texts={TEXTS} />;
}
