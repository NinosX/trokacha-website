'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "🤝",
    "title": "Ton match t’attend",
    "subtitle": "Ouvre Trokacha pour voir ton match et finaliser l’échange.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "🤝",
    "title": "Your match is waiting",
    "subtitle": "Open Trokacha to view your match and complete the trade.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "🤝",
    "title": "الماتش تاعك يستنى فيك",
    "subtitle": "حلّ تروكاشا باش تشوف الماتش وتكمّل الصفقة.",
    "cta": "حلّ التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`match/${id}`} texts={TEXTS} />;
}
