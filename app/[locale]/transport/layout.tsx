import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Page client : canonical + hreflang déclarés ici (cf. lib/seo.ts).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, '/transport') };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
