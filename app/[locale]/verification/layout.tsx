import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

// Page client : titre, description, aperçu de partage, canonical + hreflang
// déclarés ici (cf. lib/seo.ts).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'security' });
  return pageMetadata(locale, '/verification', t("pageTitle"), t("subtitle"));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
