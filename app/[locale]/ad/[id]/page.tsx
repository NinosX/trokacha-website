'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { openTrokachaApp } from '@/lib/openInApp';
import {
  LinkCard,
  LinkIcon,
  LinkIconTile,
  LinkPageShell,
  StoreButtons,
  primaryButtonClass,
} from '@/components/LinkPage';

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
  adType?: string;
  userId?: string;
}

// Type d'annonce tel que l'app l'enregistre (« Vendre », « Louer », « echanger »).
type Kind = 'sale' | 'rental' | 'exchange' | null;
function kindOf(adType?: string): Kind {
  const t = (adType || '').toLowerCase();
  if (t === 'vendre') return 'sale';
  if (t === 'louer') return 'rental';
  if (t === 'echanger' || t === 'échanger') return 'exchange';
  return null;
}
// Prix comme dans l'app : chiffres latins, espaces fines, « DA » / « دج ».
function formatPrice(price: number, locale: string): string {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price);
  return locale === 'ar' ? `${n} دج` : `${n} DA`;
}

/** Laisse la page se peindre avant la tentative auto d'ouverture de l'app. */
const AUTO_OPEN_DELAY_MS = 400;

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

  // Ouverture de l'app — mécanique alignée sur l'interstitiel (lib/openInApp) :
  // Android via intent:// (repli Play Store natif) au lieu du simple scheme
  // trokacha:// qui ne repliait sur rien, iOS via scheme + repli App Store.
  const openInApp = useCallback(() => {
    openTrokachaApp(`ad/${id}`);
  }, [id]);

  // Tentative automatique une fois l'annonce chargée (mobile uniquement).
  // On attend la fin du fetch pour ne pas envoyer vers l'app/le store si
  // l'annonce n'existe plus — dans ce cas l'écran « introuvable » doit rester.
  const autoAttemptedRef = useRef(false);
  useEffect(() => {
    if (loading || error || !ad) return;
    if (autoAttemptedRef.current) return;
    autoAttemptedRef.current = true;
    const timer = window.setTimeout(() => openTrokachaApp(`ad/${id}`, { auto: true }), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loading, error, ad, id]);

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
      fallbackTitle: 'Annonce Trokacha',
      kinds: { sale: 'Vente', rental: 'Location', exchange: 'Échange' },
      openHint: 'Faites une offre ou discutez avec le membre dans l’app.',
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
      fallbackTitle: 'Trokacha listing',
      kinds: { sale: 'For sale', rental: 'For rent', exchange: 'Swap' },
      openHint: 'Make an offer or chat with the member in the app.',
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
      fallbackTitle: 'إعلان على تروكاشا',
      kinds: { sale: 'بيع', rental: 'كراء', exchange: 'مقايضة' },
      openHint: 'قدّم عرضاً أو تواصل مع العضو في التطبيق.',
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.fr;

  if (loading) {
    return (
      <LinkPageShell locale={locale} wide>
        <div className="grid justify-items-center gap-4 py-16" role="status">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-cash" />
          <p className="text-[15px] text-inkMuted">{t.loading}</p>
        </div>
      </LinkPageShell>
    );
  }

  if (error || !ad) {
    return (
      <LinkPageShell locale={locale}>
        <LinkCard className="grid justify-items-center gap-4 text-center">
          <LinkIconTile name="search" />
          <h1 className="font-display text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink text-balance">{t.notFound}</h1>
          <p className="max-w-[34ch] text-[16px] leading-[1.55] text-inkSoft">{t.notFoundDesc}</p>
          <div className="w-full border-t border-line pt-5">
            <StoreButtons locale={locale} />
          </div>
        </LinkCard>
      </LinkPageShell>
    );
  }

  const imageUrl = ad.images?.[0] || '/logo.png';
  const locationText = [ad.location?.city, ad.location?.wilaya].filter(Boolean).join(', ');
  const kind = kindOf(ad.adType);
  const showPrice = kind === 'sale' && typeof ad.price === 'number' && ad.price > 0;
  const kindStyle =
    kind === 'sale' ? 'bg-cashBg text-cashInk' : kind === 'rental' ? 'bg-matchBg text-matchInk' : 'bg-tradeBg text-tradeInk';

  return (
    <LinkPageShell locale={locale} wide>
      <article className="overflow-hidden rounded-[24px] border border-line bg-white shadow-card">
        <div className="relative aspect-[4/3] bg-paperHard">
          <Image src={imageUrl} alt={ad.title || t.fallbackTitle} fill className="object-cover" unoptimized />
          {kind && (
            <span className={`absolute start-4 top-4 rounded-full px-3 py-[5px] text-[13px] font-bold ${kindStyle}`}>
              {t.kinds[kind]}
            </span>
          )}
        </div>
        <div className="grid gap-5 p-6 sm:p-7">
          <div className="grid gap-2">
            {/* En arabe, un titre en lettres latines reste aligné à droite, comme dans l'app */}
            <h1 dir={locale === 'ar' ? 'rtl' : 'auto'} className="font-display text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-ink">
              {ad.title || t.fallbackTitle}
            </h1>
            {showPrice && (
              <p className="font-display text-[22px] font-bold text-ink">
                {formatPrice(ad.price as number, locale)}
              </p>
            )}
            {locationText && (
              <p dir="auto" className="flex items-center gap-[6px] text-[14.5px] text-inkMuted">
                <LinkIcon name="pin" size={16} />
                {locationText}
              </p>
            )}
          </div>
          {ad.description && (
            <p dir="auto" className="line-clamp-3 text-[15.5px] leading-[1.6] text-inkSoft">
              {ad.description}
            </p>
          )}
          <div className="grid gap-3">
            <button type="button" onClick={openInApp} className={primaryButtonClass}>
              {t.openInApp}
            </button>
            <p className="text-center text-[13.5px] text-inkMuted">{t.openHint}</p>
          </div>
          <div className="border-t border-line pt-5">
            <StoreButtons locale={locale} />
          </div>
        </div>
      </article>
    </LinkPageShell>
  );
}
