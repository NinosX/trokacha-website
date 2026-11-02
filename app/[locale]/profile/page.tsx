'use client';

import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "👤",
    "title": "Voir le profil",
    "subtitle": "Ouvrez Trokacha pour voir ce profil.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "👤",
    "title": "View profile",
    "subtitle": "Open Trokacha to view this profile.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "👤",
    "title": "عرض الملف الشخصي",
    "subtitle": "افتح تروكاشا لرؤية هذا الملف الشخصي.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  return <OpenInAppInterstitial deepPath="profile" texts={TEXTS} />;
}
