import type { Metadata } from 'next';
import Image from 'next/image';

// Cible du lien « Se désinscrire » du footer des emails de notification.
// La désactivation fine (par catégorie) se fait dans l'app ; cette page guide
// l'utilisateur au lieu d'un 404. (Désinscription one-click côté serveur =
// chantier backend séparé, le token est déjà présent dans l'URL.)

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trokacha — Désinscription',
};

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const texts: Record<string, { title: string; body: string; steps: string }> = {
    fr: {
      title: 'Se désinscrire des emails',
      body: 'Pour ne plus recevoir d’emails de notification, désactive-les directement dans l’app Trokacha :',
      steps: 'Profil → Réglages → Notifications → Emails',
    },
    en: {
      title: 'Unsubscribe from emails',
      body: 'To stop receiving notification emails, turn them off directly in the Trokacha app:',
      steps: 'Profile → Settings → Notifications → Emails',
    },
    ar: {
      title: 'إلغاء الاشتراك في البريد',
      body: 'باش ما تستقبلش الإيمايلات، عطّلها مباشرة من تطبيق تروكاشا:',
      steps: 'البروفيل ← الإعدادات ← الإشعارات ← البريد',
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
        <div className="text-5xl mb-5">📭</div>
        <h1 className="text-2xl font-extrabold text-[#0D4F2E] leading-snug mb-4">{t.title}</h1>
        <p className="text-[#5b4a37] mb-6">{t.body}</p>
        <p className="font-semibold text-[#0D4F2E]">{t.steps}</p>
      </div>
    </div>
  );
}
