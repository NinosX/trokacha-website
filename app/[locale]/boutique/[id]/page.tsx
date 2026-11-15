import type { Metadata } from 'next';
import { Clock, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BoutiqueInterstitial } from '@/components/BoutiqueInterstitial';
import { BoutiqueAdsLive } from '@/components/BoutiqueAdsLive';
import { OpenInAppButton } from '@/components/OpenInAppButton';
import { SHOW_BOUTIQUES } from '@/lib/featureFlags';
import { localeAlternates, localizedUrl } from '@/lib/seo';
import {
  boutiqueBio,
  boutiqueCity,
  boutiqueHoursLabel,
  boutiquePlaceLabel,
  buildItineraireUrl,
  espaceKindOf,
  getActiveBoutique,
  listBoutiqueAds,
  modesVenteBadges,
  normalizePhoneDigits,
  secteurLabel,
  toSiteLocale,
  toWhatsAppNumber,
  type Boutique,
  type EspaceKind,
  type SiteLocale,
} from '@/lib/boutiques';
import { todayInAlgiers } from '@/lib/boutiquePublic';

// /boutique/[id] — page boutique PUBLIQUE (§7 des fondations : c'est la surface
// SEO du chantier, la seule page Trokacha qu'un client peut envoyer à un ami
// sans lui demander d'installer l'app).
//
// Rendu SERVEUR (le HTML doit contenir le nom, la ville et les articles pour
// être indexable — /ad/[id] rend côté client et n'expose que ses metadata).
// ISR : la vitrine bouge peu, 5 min de cache suffisent et évitent de taper
// Firestore à chaque crawl.
//
// Flag off, boutique inexistante, `pending`/`suspended` ou lecture refusée par
// les rules → interstitiel « ouvrir dans l'app ». JAMAIS de 404 ni d'erreur brute.
//
// Agence ou boutique (15/11, socle pros) : même page, mots différents. Une agence
// ne déclare que des secteurs de location (`espaceKindOf`, miroir de l'app). Les
// annonces sont écoutées EN DIRECT dans le navigateur (`BoutiqueAdsLive`) :
// « Libre aujourd'hui » / « Libre à partir du … » pour une location, tailles en
// stock pour un article. Jamais un article masqué, un brouillon ou le catalogue
// privé du pro (seules les annonces publiques `approved` sont lues).

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

const TEXTS: Record<SiteLocale, Record<string, string>> = {
  fr: {
    metaSuffix: 'Boutique à',
    metaSuffixAgence: 'Agence de location à',
    metaFallbackTitleAgence: 'Agence de location Trokacha',
    metaFallbackDescAgence: 'Découvrez cette agence de location sur Trokacha.',
    forRent: 'À louer',
    noRentals: 'Aucune location publiée pour le moment.',
    appPitchAgence: 'Choisis tes dates, discute et suis ta réservation directement dans l’app.',
    metaFallbackTitle: 'Boutique Trokacha',
    metaFallbackDesc: 'Découvrez cette boutique sur Trokacha.',
    hiddenTitle: 'Trokacha · Boutique',
    sectors: 'Secteurs',
    hours: 'Horaires',
    ramadan: 'Horaires Ramadan',
    call: 'Appeler',
    whatsapp: 'WhatsApp',
    directions: 'Itinéraire',
    delivery: 'Livraison & retrait',
    articles: 'Les articles',
    noArticles: 'Aucun article publié pour le moment.',
    remaining: 'restants',
    lastOne: 'Dernière pièce',
    soldOut: 'Épuisé',
    onRequest: 'Prix sur demande',
    openInApp: 'Voir dans l’app Trokacha',
    appPitch: 'Commande, discute et suis ta livraison directement dans l’app.',
    directory: 'Toutes les agences et boutiques',
  },
  en: {
    metaSuffix: 'Shop in',
    metaSuffixAgence: 'Rental agency in',
    metaFallbackTitleAgence: 'Trokacha rental agency',
    metaFallbackDescAgence: 'Discover this rental agency on Trokacha.',
    forRent: 'For rent',
    noRentals: 'No rental published yet.',
    appPitchAgence: 'Pick your dates, chat and follow your booking straight from the app.',
    metaFallbackTitle: 'Trokacha shop',
    metaFallbackDesc: 'Discover this shop on Trokacha.',
    hiddenTitle: 'Trokacha · Shop',
    sectors: 'Sectors',
    hours: 'Opening hours',
    ramadan: 'Ramadan hours',
    call: 'Call',
    whatsapp: 'WhatsApp',
    directions: 'Directions',
    delivery: 'Delivery & pickup',
    articles: 'Items',
    noArticles: 'No item published yet.',
    remaining: 'left',
    lastOne: 'Last one',
    soldOut: 'Sold out',
    onRequest: 'Price on request',
    openInApp: 'Open in the Trokacha app',
    appPitch: 'Order, chat and follow your delivery straight from the app.',
    directory: 'All agencies and shops',
  },
  ar: {
    metaSuffix: 'محل في',
    metaSuffixAgence: 'وكالة كراء في',
    metaFallbackTitleAgence: 'وكالة كراء في تروكاشا',
    metaFallbackDescAgence: 'اكتشف وكالة الكراء هذه في تروكاشا.',
    forRent: 'للكراء',
    noRentals: 'لا يوجد أي كراء منشور حاليًا.',
    appPitchAgence: 'اختر تواريخك، تحدّث مع الوكالة وتابع حجزك مباشرة في التطبيق.',
    metaFallbackTitle: 'محل تروكاشا',
    metaFallbackDesc: 'اكتشف هاد المحل في تروكاشا.',
    hiddenTitle: 'تروكاشا · محل',
    sectors: 'القطاعات',
    hours: 'أوقات العمل',
    ramadan: 'أوقات رمضان',
    call: 'اتصل',
    whatsapp: 'واتساب',
    directions: 'الطريق',
    delivery: 'التوصيل والاستلام',
    articles: 'السلع',
    noArticles: 'ما كاين حتى سلعة منشورة للدرك.',
    remaining: 'باقين',
    lastOne: 'آخر قطعة',
    soldOut: 'نفدت الكمية',
    onRequest: 'السعر على الطلب',
    openInApp: 'شوفها في تطبيق تروكاشا',
    appPitch: 'اطلب، هدر مع البائع وتبّع التوصيل ديريكت في التطبيق.',
    directory: 'كل الوكالات والمحلات',
  },
};

function metaTitle(boutique: Boutique, kind: EspaceKind, t: Record<string, string>): string {
  const agence = kind === 'agence';
  const fallback = agence ? t.metaFallbackTitleAgence : t.metaFallbackTitle;
  const nom = (boutique.nom || '').trim() || fallback;
  const city = boutiqueCity(boutique);
  return city ? `${nom} · ${agence ? t.metaSuffixAgence : t.metaSuffix} ${city}` : `${nom} · ${fallback}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = TEXTS[toSiteLocale(locale)];

  // Flag off : rien à indexer, la page rend l'interstitiel.
  if (!SHOW_BOUTIQUES) {
    return { title: t.hiddenTitle, robots: { index: false, follow: false } };
  }

  const boutique = await getActiveBoutique(id);
  if (!boutique) {
    return { title: t.hiddenTitle, robots: { index: false, follow: false } };
  }

  const site = toSiteLocale(locale);
  const kind = espaceKindOf(boutique.secteurs);
  const title = metaTitle(boutique, kind, t);
  const description = (
    boutiqueBio(boutique, 'fr') || (kind === 'agence' ? t.metaFallbackDescAgence : t.metaFallbackDesc)
  ).slice(0, 160);
  const image = boutique.logo || boutique.banner || 'https://trokacha.com/logo.png';
  const url = localizedUrl(locale, `/boutique/${id}`);

  return {
    title,
    description,
    alternates: localeAlternates(locale, `/boutique/${id}`),
    openGraph: {
      title: `${title} | Trokacha`,
      description,
      type: 'website',
      url,
      siteName: 'Trokacha',
      images: [{ url: image, alt: boutique.nom || 'Trokacha' }],
      locale: site === 'ar' ? 'ar_DZ' : site === 'en' ? 'en_US' : 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Trokacha`,
      description,
      images: [image],
    },
    other: {
      'al:ios:url': `trokacha://boutique/${id}`,
      'al:ios:app_store_id': '6757157373',
      'al:ios:app_name': 'Trokacha',
      'al:android:url': `trokacha://boutique/${id}`,
      'al:android:package': 'com.trokacha.app',
      'al:android:app_name': 'Trokacha',
    },
  };
}

export default async function BoutiquePublicPage({ params }: PageProps) {
  const { id, locale } = await params;

  if (!SHOW_BOUTIQUES) {
    return <BoutiqueInterstitial variant="shop" boutiqueId={id} />;
  }

  const boutique = await getActiveBoutique(id);
  if (!boutique) {
    return <BoutiqueInterstitial variant="shop" boutiqueId={id} />;
  }

  const site = toSiteLocale(locale);
  const t = TEXTS[site];
  const ads = await listBoutiqueAds(id);
  const kind = espaceKindOf(boutique.secteurs);
  const agence = kind === 'agence';

  const place = boutiquePlaceLabel(boutique);
  const bio = boutiqueBio(boutique, site);
  const hours = boutiqueHoursLabel(boutique.horaires);
  const badges = modesVenteBadges(boutique.modesVente, site);
  const secteurs = Array.isArray(boutique.secteurs) ? boutique.secteurs : [];
  const phone = normalizePhoneDigits(boutique.canaux?.phone);
  const whatsapp = toWhatsAppNumber(boutique.canaux?.whatsapp);
  const itineraire = buildItineraireUrl(boutique);

  const actionClass =
    'inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-[10px] text-[14.5px] font-semibold text-inkSoft transition-colors hover:bg-paperHard';

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero : bannière + logo + identité */}
      <header className="bg-paperSoft">
        <div className="relative h-40 w-full overflow-hidden bg-paperHard sm:h-56">
          {boutique.banner ? (
            // Images Firebase Storage : hôtes non déclarés dans next.config.js
            // (images.domains = []) → balise native, pas next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={boutique.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-cashBg via-paperHard to-matchBg" />
          )}
          <div className="dz-bar absolute bottom-0 left-0 right-0 h-[3px]" />
        </div>

        <div className="mx-auto max-w-[1200px] px-6">
          {/* `relative` : sans lui, la bannière (positionnée) se peint PAR-DESSUS le logo qui la chevauche.
              Le nom commence sous la bannière (`sm:pt-[60px]`), à côté du logo : jamais sur la bande verte et rouge. */}
          <div className="relative -mt-12 flex flex-col gap-4 pb-8 sm:-mt-14 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] border-4 border-paperSoft bg-white shadow-card sm:h-28 sm:w-28">
              {boutique.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={boutique.logo} alt={boutique.nom || ''} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">{agence ? '🚗' : '🏪'}</div>
              )}
            </div>

            <div className="min-w-0 flex-1 sm:pt-[60px]">
              <h1 className="flex flex-wrap items-center gap-2 font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
                {boutique.nom || 'Trokacha'}
                {boutique.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-matchBg px-[10px] py-1 text-[12.5px] font-bold text-match">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                )}
              </h1>

              {place && (
                <p className="mt-1 flex items-center gap-[6px] text-[15px] text-inkMuted">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {place}
                </p>
              )}

              {secteurs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {secteurs.map((secteur) => (
                    <span
                      key={secteur}
                      className="rounded-full bg-paperHard px-3 py-[5px] text-[13px] font-semibold text-inkSoft"
                    >
                      {secteurLabel(secteur, site)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Canaux de commande — le tap qui compte en DZ */}
        {(phone || whatsapp || itineraire) && (
          <div className="flex flex-wrap gap-3">
            {phone && (
              <a href={`tel:${phone}`} className={actionClass}>
                <Phone className="h-[18px] w-[18px]" />
                {t.call}
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                <span aria-hidden>💬</span>
                {t.whatsapp}
              </a>
            )}
            {itineraire && (
              <a href={itineraire} target="_blank" rel="noopener noreferrer" className={actionClass}>
                <Navigation className="h-[18px] w-[18px]" />
                {t.directions}
              </a>
            )}
          </div>
        )}

        {boutique.pinnedInfo && (
          <p className="mt-6 rounded-card border border-line bg-white px-5 py-4 text-[15px] text-inkSoft shadow-card">
            📌 {boutique.pinnedInfo}
          </p>
        )}

        {bio && <p className="mt-6 max-w-[70ch] text-[16px] leading-relaxed text-inkSoft">{bio}</p>}

        {/* Horaires + livraison */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {hours.label && (
            <div className="rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-inkMuted">
                <Clock className="h-4 w-4" />
                {hours.ramadan ? t.ramadan : t.hours}
              </h2>
              <p className="text-[16px] font-semibold text-ink">{hours.label}</p>
              {hours.ramadan && <p className="mt-1 text-[13.5px] text-inkMuted">🌙 Ramadan</p>}
            </div>
          )}

          {badges.length > 0 && (
            <div className="rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-inkMuted">
                {t.delivery}
              </h2>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-cashBg px-3 py-[5px] text-[13px] font-semibold text-cashInk"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Annonces, en direct */}
        <BoutiqueAdsLive
          boutiqueId={id}
          locale={site}
          kind={kind}
          initialAds={ads}
          initialToday={todayInAlgiers()}
          texts={{
            title: agence ? t.forRent : t.articles,
            empty: agence ? t.noRentals : t.noArticles,
            remaining: t.remaining,
            lastOne: t.lastOne,
            soldOut: t.soldOut,
            onRequest: t.onRequest,
          }}
        />

        {/* CTA app */}
        <section className="mt-14 rounded-card border border-line bg-white p-8 text-center shadow-card">
          <p className="mx-auto max-w-[46ch] text-[16px] text-inkSoft">{agence ? t.appPitchAgence : t.appPitch}</p>
          <OpenInAppButton
            deepPath={`boutique/${id}`}
            label={t.openInApp}
            className="mt-5 inline-flex items-center rounded-full bg-cash px-7 py-[13px] text-[15px] font-bold text-white shadow-cash transition-transform hover:scale-105"
          />
          <div className="mt-4">
            <Link href="/boutiques" className="text-[14.5px] font-semibold text-cashInk">
              {t.directory}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
