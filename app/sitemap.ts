import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
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

  return sitemap;
}
