'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "📬",
    "title": "Une proposition pour toi",
    "subtitle": "Ouvre Trokacha pour voir la proposition et répondre.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "📬",
    "title": "A proposal for you",
    "subtitle": "Open Trokacha to view the proposal and reply.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "📬",
    "title": "عندك عرض جديد",
    "subtitle": "حلّ تروكاشا باش تشوف العرض وتجاوب.",
    "cta": "حلّ التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`proposal/${id}`} texts={TEXTS} />;
}
