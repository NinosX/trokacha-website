import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Groupe de routes (home) : n'existe que pour donner à l'accueil, page client,
// son propre canonical + hreflang (cf. lib/seo.ts). Aucun effet sur l'URL.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, '') };
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
