'use client';

// components/BoutiqueAdsLive.tsx
// =============================================================================
// Les annonces d'une agence ou d'une boutique, EN DIRECT.
//
// Le serveur rend la liste (HTML indexable, `initialAds`) ; dans le navigateur,
// la même requête publique est écoutée (`onSnapshot`) : une réservation notée
// par le loueur déplace « Libre à partir du … », une vente retire une taille ou
// masque l'article épuisé, sans recharger la page. Aucune donnée privée : seuls
// les champs publics du document `ads` sont lus (cf. `toBoutiqueAd`).
//
// « Aujourd'hui » : la date du rendu serveur au premier affichage (pas d'écart
// d'hydratation), puis celle du navigateur (Africa/Algiers), revue chaque minute.
// =============================================================================

import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Link } from '@/i18n/navigation';
import { boutiqueAdsQuery } from '@/lib/boutiques';
import {
  availabilityLabel,
  formatAmount,
  rentalPriceLabel,
  sizesLabel,
  todayInAlgiers,
  toBoutiqueAd,
  visibleSorted,
  type BoutiqueAd,
  type EspaceKind,
  type SiteLocale,
} from '@/lib/boutiquePublic';

export interface BoutiqueAdsTexts {
  title: string;
  empty: string;
  remaining: string;
  lastOne: string;
  soldOut: string;
  onRequest: string;
}

interface Props {
  boutiqueId: string;
  locale: SiteLocale;
  kind: EspaceKind;
  initialAds: BoutiqueAd[];
  initialToday: string;
  texts: BoutiqueAdsTexts;
}

const LRI = '⁦';
const PDI = '⁩';

export function BoutiqueAdsLive({ boutiqueId, locale, kind, initialAds, initialToday, texts }: Props) {
  const [ads, setAds] = useState<BoutiqueAd[]>(initialAds);
  const [today, setToday] = useState(initialToday);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      boutiqueAdsQuery(boutiqueId),
      (snap) => setAds(visibleSorted(snap.docs.map((d) => toBoutiqueAd(d.id, d.data() as Record<string, unknown>)))),
      (error) => {
        // Écoute refusée ou coupée : la liste du rendu serveur reste affichée.
        console.warn('[boutiques] live ads listener stopped:', error.code ?? error.message);
      },
    );
    return unsubscribe;
  }, [boutiqueId]);

  useEffect(() => {
    const tick = () => setToday(todayInAlgiers());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fallbackIcon = kind === 'agence' ? '🚗' : '🛍️';

  return (
    <section className="mt-12">
      <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">{texts.title}</h2>

      {ads.length === 0 ? (
        <p className="mt-4 text-[15px] text-inkMuted">{texts.empty}</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {ads.map((ad) => {
            const image = ad.images?.[0];
            const availability = ad.rental ? availabilityLabel(ad.rental, today, locale) : null;
            const remaining = ad.quantiteRestante;
            // Badge de rareté d'un article : « X restants » sous 5 pièces, « Épuisé » à 0.
            const showRemaining = !ad.rental && typeof remaining === 'number' && remaining >= 0 && remaining <= 5;
            const price = ad.rental
              ? rentalPriceLabel(ad.rental, ad.price, locale)
              : typeof ad.price === 'number'
                ? `${LRI}${formatAmount(ad.price)} ${locale === 'ar' ? 'دج' : 'DA'}${PDI}`
                : null;
            const sizes = ad.rental ? '' : sizesLabel(ad.taillesDispo, locale);

            return (
              <Link
                key={ad.id}
                href={`/ad/${ad.id}`}
                className="group overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow hover:shadow-cardHover"
              >
                <div className="relative aspect-square bg-paperHard">
                  {image ? (
                    // Images Firebase Storage : hôtes non déclarés dans next.config.js → balise native.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={ad.title || ''} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      {ad.rental?.kind === 'immo' ? '🏠' : ad.rental ? '🚗' : fallbackIcon}
                    </div>
                  )}

                  {availability && (
                    <span
                      className={`absolute start-2 top-2 rounded-full px-[10px] py-1 text-[12px] font-bold ${
                        availability.free ? 'bg-matchBg text-match' : 'bg-tradeBg text-tradeInk'
                      }`}
                    >
                      {availability.text}
                    </span>
                  )}

                  {showRemaining && (
                    <span
                      className={`absolute start-2 top-2 rounded-full px-[10px] py-1 text-[12px] font-bold ${
                        remaining === 0 ? 'bg-ink/80 text-paperSoft' : 'bg-tradeBg text-tradeInk'
                      }`}
                    >
                      {remaining === 0 ? texts.soldOut : remaining === 1 ? texts.lastOne : `${remaining} ${texts.remaining}`}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="line-clamp-2 text-[14.5px] font-semibold text-ink">{ad.title || '·'}</p>
                  {sizes && <p className="mt-1 line-clamp-1 text-[13px] text-inkMuted">{sizes}</p>}
                  <p className="mt-1 font-display text-[15px] font-bold text-cash">{price ?? texts.onRequest}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
