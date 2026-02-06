import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { ScrollToTop } from '@/components/ScrollToTop';
import type { Viewport } from 'next';
import '../globals.css';
import { SHOW_TRANSPORT } from '@/lib/featureFlags';

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
  const metadata = messages.metadata as { title: string; description: string };

  const baseUrl = "https://trokacha.com";
  const localeUrls: Record<string, string> = {
    fr: baseUrl,
    en: `${baseUrl}/en`,
    ar: `${baseUrl}/ar`,
  };

  return {
    title: {
      default: metadata.title,
      template: `%s | Trokacha`,
    },
    description: metadata.description,
    keywords: [
      "troc", "vente", "achat", "algerie", "marketplace", "echange",
      "annonces", "occasion", "particuliers", "trokacha", "application mobile",
      ...(SHOW_TRANSPORT ? ["transport", "colis", "covoiturage", "livraison"] : []),
    ],
    authors: [{ name: "Trokacha" }],
    creator: "Trokacha",
    publisher: "Trokacha",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localeUrls[locale] || baseUrl,
      languages: {
        "fr": baseUrl,
        "en": `${baseUrl}/en`,
        "ar": `${baseUrl}/ar`,
      },
    },
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
      locale: locale === "ar" ? "ar_DZ" : locale === "en" ? "en_US" : "fr_FR",
      url: localeUrls[locale] || baseUrl,
      siteName: "Trokacha",
      title: metadata.title,
      description: metadata.description,
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
      description: metadata.description,
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
    verification: {
      google: "GOOGLE_VERIFICATION_CODE", // À remplacer avec ton code
    },
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
    <html lang={locale} dir={dir}>
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
