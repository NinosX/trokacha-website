import type { Metadata } from 'next';

// Métadonnées d'aperçu (OpenGraph / Twitter) : quand l'URL testDZ est collée
// sur WhatsApp, TikTok ou X, l'aperçu doit donner envie de cliquer.
const OG_IMAGE = 'https://trokacha.com/logo.png';

export const metadata: Metadata = {
  title: 'Test DZ — One, Two, Three... | Trokacha',
  description:
    "À quel point t'es Algérien dans l'âme ? 5 questions, 1 minute. Fais le Test DZ sur Trokacha 🇩🇿",
  openGraph: {
    title: "Test DZ — Toi t'es à combien ? 🇩🇿",
    description: "À quel point t'es Algérien dans l'âme ? Fais le test sur Trokacha.",
    url: 'https://trokacha.com/testDZ',
    siteName: 'Trokacha',
    images: [{ url: OG_IMAGE }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Test DZ — Toi t'es à combien ? 🇩🇿",
    description: "À quel point t'es Algérien dans l'âme ? Fais le test sur Trokacha.",
    images: [OG_IMAGE],
  },
};

export default function TestDZLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
