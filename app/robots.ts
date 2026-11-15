import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://trokacha.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ n'est plus bloqué : Google doit pouvoir charger le JS/CSS
        // pour rendre les pages (et voir le sélecteur de langue, le dir=rtl…).
        // Bureau des pros et connexion : privés, jamais indexés (balise robots
        // sur les pages aussi). Arabe sans préfixe, autres langues préfixées.
        disallow: [
          '/api/',
          '/pro',
          '/connexion',
          ...['fr', 'en', 'kab'].flatMap((l) => [`/${l}/pro`, `/${l}/connexion`]),
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
