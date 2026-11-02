'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "title": "Vous avez reçu une offre",
    "subtitle": "Ouvrez Trokacha pour voir l’offre et répondre.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "title": "You received an offer",
    "subtitle": "Open Trokacha to view the offer and reply.",
    "cta": "Open in the app"
  },
  "ar": {
    "title": "لديك عرض جديد",
    "subtitle": "افتح تروكاشا لرؤية العرض والرد عليه.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`proposal/${id}`} texts={TEXTS} icon="offer" />;
}
