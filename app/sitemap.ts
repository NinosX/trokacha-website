import { MetadataRoute } from 'next';
import { SHOW_BOUTIQUES, SHOW_TRANSPORT } from '@/lib/featureFlags';
import { listActiveBoutiques } from '@/lib/boutiques';
import { routing } from '@/i18n/routing';
import { localeAlternates, localizedUrl } from '@/lib/seo';

// Une entrée par page ET par langue, chacune avec ses alternatives hreflang
// (ar sans préfixe = langue par défaut, puis /fr, /en, /kab ; x-default → ar).
function entries(
  path: string,
  changeFrequency: 'weekly' | 'monthly',
  priority: number,
): MetadataRoute.Sitemap {
  const { languages } = localeAlternates(routing.defaultLocale, path);
  return routing.locales.map((locale) => ({
    url: localizedUrl(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /transport redirige vers l'accueil tant que le flag est off : pas de
  // sitemap pour une URL qui redirige.
  const pages = ['', '/privacy', '/terms', '/contact', '/echange', ...(SHOW_TRANSPORT ? ['/transport'] : []), '/chat', '/verification'];

  const sitemap: MetadataRoute.Sitemap = pages.flatMap((page) =>
    entries(page, page === '' ? 'weekly' : 'monthly', page === '' ? 1 : 0.8),
  );

  // Boutiques (chantier 2026-08) — UNIQUEMENT derrière le flag : tant qu'il est
  // off, aucune lecture Firestore n'est faite et le sitemap reste identique à
  // l'actuel. /boutique (page « ouvre l'app » des emails) n'y figure jamais :
  // elle est noindex par construction.
  if (SHOW_BOUTIQUES) {
    const boutiques = await listActiveBoutiques();
    sitemap.push(...entries('/boutiques', 'weekly', 0.8));
    for (const boutique of boutiques) {
      sitemap.push(...entries(`/boutique/${boutique.id}`, 'weekly', 0.7));
    }
  }

  return sitemap;
}
