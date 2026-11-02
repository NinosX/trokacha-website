'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "⭐",
    "title": "Votre avis compte",
    "subtitle": "Ouvrez Trokacha pour noter cet échange.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "emoji": "⭐",
    "title": "Your review matters",
    "subtitle": "Open Trokacha to rate this exchange.",
    "cta": "Open in the app"
  },
  "ar": {
    "emoji": "⭐",
    "title": "رأيك يهمّنا",
    "subtitle": "افتح تروكاشا لتقييم هذا التبادل.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`match/${id}`} texts={TEXTS} />;
}
