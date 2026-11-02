import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Space_Grotesk } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { ScrollToTop } from '@/components/ScrollToTop';
import type { Viewport } from 'next';
import '../globals.css';
import { SHOW_LOCATIONS, SHOW_TRANSPORT, withRentals } from '@/lib/featureFlags';
import { SITE_URL, ogLocale } from '@/lib/seo';

// Police display de l'app (titres, prix, wordmark)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const metadata = messages.metadata as Record<string, string>;
  const description = metadata[withRentals('description')];

  return {
    title: {
      default: metadata.title,
      template: `%s | Trokacha`,
    },
    description,
    keywords: [
      "troc", "vente", "achat", "algerie", "marketplace", "echange",
      "annonces", "occasion", "particuliers", "trokacha", "application mobile",
      ...(SHOW_LOCATIONS ? ["location", "louer", "location voiture", "location appartement"] : []),
      ...(SHOW_TRANSPORT ? ["transport", "colis", "covoiturage", "livraison"] : []),
    ],
    authors: [{ name: "Trokacha" }],
    creator: "Trokacha",
    publisher: "Trokacha",
    metadataBase: new URL(SITE_URL),
    // Pas de `alternates` ici : canonical + hreflang sont déclarés PAGE PAR
    // PAGE (lib/seo.ts → localeAlternates). Déclarés dans ce layout, ils
    // étaient hérités par toutes les pages, qui pointaient alors leur
    // canonical vers l'accueil.
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
      shortcut: "/favicon-32x32.png",
    },
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      // Pas d'og:url global : hérité, il désignait l'accueil sur toutes les
      // pages. Sans lui, les aperçus (WhatsApp, Facebook) prennent l'URL partagée.
      siteName: "Trokacha",
      title: metadata.title,
      description,
      images: [
        {
          url: "/logo.png",
          width: 464,
          height: 520,
          alt: "Trokacha Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description,
      images: ["/logo.png"],
      creator: "@trokacha",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    // Pas de balise google-site-verification tant qu'il n'y a pas de vrai code
    // (l'ancienne valeur « GOOGLE_VERIFICATION_CODE » partait telle quelle).
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  // Determine text direction
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={spaceGrotesk.variable}>
      <head>
        <JsonLd locale={locale} />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
          <ScrollToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
