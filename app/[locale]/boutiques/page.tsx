import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BoutiqueInterstitial } from '@/components/BoutiqueInterstitial';
import { SHOW_BOUTIQUES } from '@/lib/featureFlags';
import {
  boutiquePlaceLabel,
  listActiveBoutiques,
  secteurLabel,
  toSiteLocale,
  type SiteLocale,
} from '@/lib/boutiques';

// /boutiques — annuaire V1 (liste simple des boutiques actives).
// Flag off → interstitiel « ouvrir dans l'app », jamais un 404.
//
// La requête est bornée par firestore.rules pour un visiteur non authentifié
// (statut == 'active' + limit <= 50) : cf. lib/boutiques. Un annuaire paginé /
// filtré par wilaya viendra quand il y aura de quoi paginer.

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
}

const TEXTS: Record<SiteLocale, Record<string, string>> = {
  fr: {
    title: 'Les boutiques Trokacha',
    metaTitle: 'Boutiques',
    metaDesc: 'Découvrez les boutiques algériennes présentes sur Trokacha.',
    subtitle: 'Des vitrines de commerçants algériens, wilaya par wilaya.',
    empty: 'Aucune boutique pour le moment. Reviens vite !',
    hiddenTitle: 'Trokacha · Boutiques',
  },
  en: {
    title: 'Trokacha shops',
    metaTitle: 'Shops',
    metaDesc: 'Discover the Algerian shops on Trokacha.',
    subtitle: 'Storefronts from Algerian sellers, wilaya by wilaya.',
    empty: 'No shop yet. Check back soon!',
    hiddenTitle: 'Trokacha · Shops',
  },
  ar: {
    title: 'محلات تروكاشا',
    metaTitle: 'المحلات',
    metaDesc: 'اكتشف المحلات الجزائرية الموجودة في تروكاشا.',
    subtitle: 'واجهات تجار جزائريين، ولاية بولاية.',
    empty: 'ما كاين حتى محل للدرك. ارجع قريب!',
    hiddenTitle: 'تروكاشا · المحلات',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = TEXTS[toSiteLocale(locale)];

  if (!SHOW_BOUTIQUES) {
    return { title: t.hiddenTitle, robots: { index: false, follow: false } };
  }

  const url = `https://trokacha.com/${locale === 'fr' ? '' : `${locale}/`}boutiques`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: { canonical: url },
    openGraph: {
      title: `${t.title} | Trokacha`,
      description: t.metaDesc,
      type: 'website',
      url,
      siteName: 'Trokacha',
      images: [{ url: 'https://trokacha.com/logo.png', alt: 'Trokacha' }],
    },
  };
}

export default async function BoutiquesDirectoryPage({ params }: PageProps) {
  const { locale } = await params;

  if (!SHOW_BOUTIQUES) {
    return <BoutiqueInterstitial variant="directory" />;
  }

  const site = toSiteLocale(locale);
  const t = TEXTS[site];
  const boutiques = await listActiveBoutiques();

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="font-display text-[32px] font-bold tracking-[-0.02em] text-ink sm:text-[40px]">
          {t.title}
        </h1>
        <p className="mt-2 max-w-[60ch] text-[16px] text-inkMuted">{t.subtitle}</p>

        {boutiques.length === 0 ? (
          <p className="mt-10 text-[15px] text-inkMuted">{t.empty}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boutiques.map((boutique) => {
              const place = boutiquePlaceLabel(boutique);
              const secteurs = Array.isArray(boutique.secteurs) ? boutique.secteurs.slice(0, 3) : [];

              return (
                <Link
                  key={boutique.id}
                  href={`/boutique/${boutique.id}`}
                  className="flex items-center gap-4 rounded-card border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-cardHover"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-paperHard">
                    {boutique.logo ? (
                      // Images Firebase Storage : hôtes non déclarés dans
                      // next.config.js (images.domains = []) → balise native.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={boutique.logo}
                        alt={boutique.nom || ''}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🏪</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold text-ink">{boutique.nom || '·'}</p>
                    {place && (
                      <p className="mt-[2px] flex items-center gap-1 truncate text-[14px] text-inkMuted">
                        <MapPin className="h-[14px] w-[14px] shrink-0" />
                        {place}
                      </p>
                    )}
                    {secteurs.length > 0 && (
                      <p className="mt-1 truncate text-[13px] text-inkSoft">
                        {secteurs.map((s) => secteurLabel(s, site)).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
