'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "emoji": "💬",
    "title": "Nouveau message",
    "subtitle": "Ouvre Trokacha pour lire le message et répondre.",
    "cta": "Ouvrir la conversation"
  },
  "en": {
    "emoji": "💬",
    "title": "New message",
    "subtitle": "Open Trokacha to read the message and reply.",
    "cta": "Open the chat"
  },
  "ar": {
    "emoji": "💬",
    "title": "رسالة جديدة",
    "subtitle": "حلّ تروكاشا باش تقرا الرسالة وتجاوب.",
    "cta": "حلّ المحادثة"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`conversation/${id}`} forwardQueryParams={['sender']} texts={TEXTS} />;
}
