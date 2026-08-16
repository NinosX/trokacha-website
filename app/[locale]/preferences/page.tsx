import type { Metadata } from 'next';
import Image from 'next/image';

// Cible du lien « Préférences » du footer des emails de notification.
// Les préférences email se gèrent dans l'app (Profil → Réglages → Notifications).

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trokacha · Préférences email',
};

export default async function PreferencesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const texts: Record<string, { title: string; body: string; steps: string }> = {
    fr: {
      title: 'Préférences email',
      body: 'Tes préférences de notifications (email et push) se gèrent directement dans l’app Trokacha.',
      steps: 'Profil → Réglages → Notifications',
    },
    en: {
      title: 'Email preferences',
      body: 'Your notification preferences (email and push) are managed directly in the Trokacha app.',
      steps: 'Profile → Settings → Notifications',
    },
    ar: {
      title: 'إعدادات البريد الإلكتروني',
      body: 'إعدادات الإشعارات (البريد والإشعارات) تتسيّر مباشرة من تطبيق تروكاشا.',
      steps: 'البروفيل ← الإعدادات ← الإشعارات',
    },
  };
  const t = texts[locale] || texts.fr;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2E7D3] to-[#FBF6EC] flex flex-col items-center justify-center px-6 py-12">
      <div className="flex items-center gap-3 mb-10">
        <Image src="/logo.png" alt="Trokacha" width={44} height={44} className="rounded-xl" />
        <span className="font-bold text-2xl text-[#0D4F2E]">Trokacha</span>
      </div>
      <div className="w-full max-w-md bg-white/70 backdrop-blur rounded-3xl shadow-xl shadow-[#0D4F2E]/10 border border-[#E8B86A]/40 px-8 py-10 text-center">
        <div className="text-5xl mb-5">⚙️</div>
        <h1 className="text-2xl font-extrabold text-[#0D4F2E] leading-snug mb-4">{t.title}</h1>
        <p className="text-[#5b4a37] mb-6">{t.body}</p>
        <p className="font-semibold text-[#0D4F2E]">{t.steps}</p>
      </div>
    </div>
  );
}
