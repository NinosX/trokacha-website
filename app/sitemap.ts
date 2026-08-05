import { MetadataRoute } from 'next';
import { SHOW_BOUTIQUES } from '@/lib/featureFlags';
import { listActiveBoutiques } from '@/lib/boutiques';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trokacha.com';
  const locales = ['fr', 'en', 'ar'];
  const pages = ['', '/privacy', '/terms', '/contact', '/echange', '/transport', '/chat', '/verification'];

  const sitemap: MetadataRoute.Sitemap = [];

  // Add pages for each locale
  for (const locale of locales) {
    for (const page of pages) {
      const url = locale === 'fr'
        ? `${baseUrl}${page}`
        : `${baseUrl}/${locale}${page}`;

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1 : 0.8,
      });
    }
  }

  // Boutiques (chantier 2026-08) — UNIQUEMENT derrière le flag : tant qu'il est
  // off, aucune lecture Firestore n'est faite et le sitemap reste identique à
  // l'actuel. /boutique (page « ouvre l'app » des emails) n'y figure jamais :
  // elle est noindex par construction.
  if (SHOW_BOUTIQUES) {
    const boutiques = await listActiveBoutiques();
    for (const locale of locales) {
      const prefix = locale === 'fr' ? baseUrl : `${baseUrl}/${locale}`;
      sitemap.push({
        url: `${prefix}/boutiques`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      for (const boutique of boutiques) {
        sitemap.push({
          url: `${prefix}/boutique/${boutique.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  return sitemap;
}
