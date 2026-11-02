'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "title": "Vérification d’identité",
    "subtitle": "Ouvrez Trokacha pour finaliser votre vérification.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "title": "Identity verification",
    "subtitle": "Open Trokacha to complete your verification.",
    "cta": "Open in the app"
  },
  "ar": {
    "title": "التحقق من الهوية",
    "subtitle": "افتح تروكاشا لإكمال التحقق من هويتك.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  return <OpenInAppInterstitial deepPath="verify" texts={TEXTS} icon="id" />;
}
