import { redirect } from '@/i18n/navigation';

// /pro/[bid] ouvre Aujourd'hui.
export default async function Page({ params }: { params: Promise<{ locale: string; bid: string }> }) {
  const { locale, bid } = await params;
  redirect({ href: `/pro/${encodeURIComponent(bid)}/aujourdhui`, locale });
}
