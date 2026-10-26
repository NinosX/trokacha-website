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
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
