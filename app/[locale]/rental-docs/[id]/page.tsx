'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

// Lien des e-mails « Documents demandés » d’une location. L'app sait ouvrir ce chemin (utils/deepLinks.ts) ;
// sans cette page, le lien tombait en 404 dans un navigateur.
const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "title": "Documents de location",
    "subtitle": "Ouvrez Trokacha pour envoyer les documents demandés pour cette location.",
    "cta": "Ouvrir dans l’app"
  },
  "en": {
    "title": "Rental documents",
    "subtitle": "Open Trokacha to send the documents requested for this rental.",
    "cta": "Open in the app"
  },
  "ar": {
    "title": "وثائق الكراء",
    "subtitle": "افتح تروكاشا لإرسال الوثائق المطلوبة لهذا الكراء.",
    "cta": "افتح التطبيق"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`rental-docs/${id}`} texts={TEXTS} icon="key" />;
}
