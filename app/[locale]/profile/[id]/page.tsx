'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "👤",
    "title": "Voir le profil",
    "subtitle": "Ouvre Trokacha pour voir ce profil.",
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
    "title": "شوف البروفيل",
    "subtitle": "حلّ تروكاشا باش تشوف هاد البروفيل.",
    "cta": "حلّ التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`profile/${id}`} texts={TEXTS} />;
}
