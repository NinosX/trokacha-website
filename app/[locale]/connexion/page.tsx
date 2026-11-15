import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SignInPanel } from '@/components/pro/SignInPanel';
import { proTexts } from '@/lib/pro/texts';

// /connexion : connexion au site avec le compte Trokacha (bureau des pros).
// Page privée : jamais indexée, absente du sitemap.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: proTexts(locale).t('signin.title'),
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <SignInPanel />
    </Suspense>
  );
}
