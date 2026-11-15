const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Compression
  compress: true,

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header


  // Headers for caching and security
  async headers() {
    return [
      {
        // Universal Links iOS : Apple exige application/json sur le fichier
        // AASA (servi sans extension depuis public/.well-known/)
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Connexion Google relayée par le site (/__/auth/*, voir rewrites) :
        // Firebase charge /__/auth/iframe dans une iframe de la MÊME origine.
        // DENY (règle ci-dessus) la casserait ; la dernière règle l'emporte.
        source: '/__/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },

  // Connexion Google sur trokacha.com (bureau des pros) : le gestionnaire de
  // connexion de Firebase est servi depuis le domaine du site, comme le
  // recommande Firebase pour les navigateurs qui bloquent le stockage tiers
  // (Safari, Chrome mobile). N'a d'effet qu'une fois `authDomain` passé à
  // trokacha.com côté Vercel (étapes : admin/REFONTE_2026-10/PROS_2026-11/
  // WEB_LIVRAISON_NOTES.md). Sans identifiant de projet, aucune réécriture.
  async rewrites() {
    const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim();
    if (!/^[a-z0-9-]{4,40}$/.test(projectId) || projectId.startsWith('demo-')) return [];
    const origin = `https://${projectId}.firebaseapp.com`;
    return {
      beforeFiles: [
        { source: '/__/auth/:path*', destination: `${origin}/__/auth/:path*` },
        { source: '/__/firebase/:path*', destination: `${origin}/__/firebase/:path*` },
      ],
    };
  },
};

module.exports = withNextIntl(nextConfig);
