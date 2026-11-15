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
        // Chemins EXACTS (`/pro$`, `/pro/`, `/pro?`) : un simple `/pro` bloquerait
        // aussi `/profile` et `/proposal` (règle par préfixe), pages partagées par
        // l'app et les e-mails dont Google doit pouvoir lire le noindex (relecture
        // de Main, 15/11, S1). `/__/` : relais de connexion Firebase.
        disallow: [
          '/api/',
          '/__/',
          ...['', '/fr', '/en', '/kab'].flatMap((l) => [`${l}/pro$`, `${l}/pro/`, `${l}/pro?`, `${l}/connexion`]),
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
