'use client';

import { useParams } from 'next/navigation';
import OpenInAppInterstitial, { InterstitialTexts } from '@/components/OpenInAppInterstitial';

const TEXTS: Record<'fr' | 'en' | 'ar', InterstitialTexts> = {
  "fr": {
    "title": "Nouveau message",
    "subtitle": "Ouvrez Trokacha pour lire le message et répondre.",
    "cta": "Ouvrir la conversation"
  },
  "en": {
    "title": "New message",
    "subtitle": "Open Trokacha to read the message and reply.",
    "cta": "Open the chat"
  },
  "ar": {
    "title": "رسالة جديدة",
    "subtitle": "افتح تروكاشا لقراءة الرسالة والرد عليها.",
    "cta": "افتح المحادثة"
  }
};

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || '';
  return <OpenInAppInterstitial deepPath={`conversation/${id}`} forwardQueryParams={['sender']} texts={TEXTS} icon="chat" />;
}
