'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "title": "Votre échange est en cours",
    "subtitle": "Ouvrez Trokacha pour le suivre et fixer le rendez-vous.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "title": "Your exchange is in progress",
    "subtitle": "Open Trokacha to follow it and set the meeting.",
    "cta": "Open in the app"
  },
  "ar": {
    "title": "لديك تبادل جارٍ",
    "subtitle": "افتح تروكاشا لمتابعته وتحديد الموعد.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`match/${id}`} texts={TEXTS} icon="swap" />;
}
