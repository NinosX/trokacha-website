'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface Ad {
  id: string;
  title?: string;
  description?: string;
  images?: string[];
  category?: string;
  market?: string;
  location?: {
    city?: string;
    wilaya?: string;
  };
  price?: number;
  userId?: string;
}

const APP_STORE_URL = 'https://apps.apple.com/app/trokacha/id6740211562';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.trokacha.app';

export default function AdPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = params?.locale as string || 'fr';

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      try {
        const docRef = doc(db, 'ads', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAd({ id: docSnap.id, ...docSnap.data() } as Ad);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  // Essayer d'ouvrir l'app
  const openInApp = () => {
    const deepLink = `trokacha://ad/${id}`;

    // Essayer d'ouvrir l'app
    window.location.href = deepLink;

    // Si l'app n'est pas installée, rediriger vers le store après un délai
    setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = APP_STORE_URL;
      } else if (/android/.test(userAgent)) {
        window.location.href = PLAY_STORE_URL;
      }
    }, 1500);
  };

  const texts = {
    fr: {
      loading: 'Chargement...',
      notFound: 'Annonce introuvable',
      notFoundDesc: 'Cette annonce n\'existe plus ou a été supprimée.',
      openInApp: 'Ouvrir dans Trokacha',
      downloadApp: 'Télécharger l\'app',
      or: 'ou',
      category: 'Catégorie',
      location: 'Localisation',
    },
    en: {
      loading: 'Loading...',
      notFound: 'Ad not found',
      notFoundDesc: 'This ad no longer exists or has been deleted.',
      openInApp: 'Open in Trokacha',
      downloadApp: 'Download the app',
      or: 'or',
      category: 'Category',
      location: 'Location',
    },
    ar: {
      loading: '...جاري التحميل',
      notFound: 'الإعلان غير موجود',
      notFoundDesc: 'هذا الإعلان لم يعد موجودًا أو تم حذفه.',
      openInApp: 'فتح في تروكاشا',
      downloadApp: 'تحميل التطبيق',
      or: 'أو',
      category: 'الفئة',
      location: 'الموقع',
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.fr;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.notFound}</h1>
          <p className="text-gray-600 mb-8">{t.notFoundDesc}</p>
          <button
            onClick={openInApp}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
          >
            {t.downloadApp}
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = ad.images?.[0] || '/logo.png';
  const locationText = [ad.location?.city, ad.location?.wilaya].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image src="/logo.png" alt="Trokacha" width={40} height={40} className="rounded-lg" />
          <span className="font-bold text-xl text-emerald-600">Trokacha</span>
        </div>
      </header>

      {/* Ad Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Image */}
          <div className="relative aspect-square bg-gray-100">
            <Image
              src={imageUrl}
              alt={ad.title || 'Annonce'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ad.title || 'Annonce Trokacha'}
            </h1>

            {locationText && (
              <p className="text-gray-500 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locationText}
              </p>
            )}

            {ad.description && (
              <p className="text-gray-700 mb-6 line-clamp-3">
                {ad.description}
              </p>
            )}

            {/* CTA Button */}
            <button
              onClick={openInApp}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg shadow-lg shadow-emerald-500/30"
            >
              {t.openInApp}
            </button>

            {/* Store Links */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Play Store
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
