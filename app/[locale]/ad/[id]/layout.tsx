import { doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Metadata } from 'next';

// Firebase config pour le serveur
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

interface Ad {
  title?: string;
  description?: string;
  images?: string[];
  location?: {
    city?: string;
    wilaya?: string;
  };
}

async function getAd(id: string): Promise<Ad | null> {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const docRef = doc(db, 'ads', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Ad;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ad for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const ad = await getAd(id);

  const title = ad?.title || 'Annonce Trokacha';
  const description = ad?.description?.slice(0, 160) || 'Découvrez cette annonce sur Trokacha';
  const imageUrl = ad?.images?.[0] || 'https://trokacha.com/logo.png';
  const location = [ad?.location?.city, ad?.location?.wilaya].filter(Boolean).join(', ');

  return {
    title,
    description: location ? `${description} - ${location}` : description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://trokacha.com/${locale}/ad/${id}`,
      siteName: 'Trokacha',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      // Deep link pour l'app
      'al:ios:url': `trokacha://ad/${id}`,
      'al:ios:app_store_id': '6757157373',
      'al:ios:app_name': 'Trokacha',
      'al:android:url': `trokacha://ad/${id}`,
      'al:android:package': 'com.trokacha.app',
      'al:android:app_name': 'Trokacha',
    },
  };
}

export default function AdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
