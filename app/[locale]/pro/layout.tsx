import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ProSession } from '@/components/pro/ProSession';

// /pro : bureau privé des agences et boutiques. Jamais indexé (balise robots,
// robots.txt, absent du sitemap). Tout se passe dans le navigateur, une fois
// le compte connecté : aucune donnée du carnet n'est rendue par le serveur.

export const metadata: Metadata = {
  title: 'Trokacha Pro',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function ProLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProSession>{children}</ProSession>;
}
