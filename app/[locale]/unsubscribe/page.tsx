import type { Metadata } from 'next';
import { LinkCard, LinkIconTile, LinkPageShell } from '@/components/LinkPage';

// Cible du lien « Se désinscrire » du footer des emails de notification.
// La désactivation fine (par catégorie) se fait dans l'app ; cette page guide
// l'utilisateur au lieu d'un 404. (Désinscription one-click côté serveur =
// chantier backend séparé, le token est déjà présent dans l'URL.)

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { absolute: 'Trokacha' },
};

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const texts: Record<string, { title: string; body: string; steps: string[] }> = {
    fr: {
      title: 'Se désinscrire des e-mails',
      body: 'Pour ne plus recevoir d’e-mails de notification, désactivez-les directement dans l’app Trokacha :',
      steps: ['Compte', 'Notifications', 'E-mails'],
    },
    en: {
      title: 'Unsubscribe from emails',
      body: 'To stop receiving notification emails, turn them off directly in the Trokacha app:',
      steps: ['Account', 'Notifications', 'Emails'],
    },
    ar: {
      title: 'إلغاء الاشتراك في البريد',
      body: 'لإيقاف رسائل البريد الإلكتروني، عطّلها مباشرة من تطبيق تروكاشا:',
      steps: ['الحساب', 'الإشعارات', 'رسائل البريد الإلكتروني'],
    },
  };
  const t = texts[locale] || texts.fr;

  return (
    <LinkPageShell locale={locale}>
      <LinkCard className="grid justify-items-center gap-4 text-center">
        <LinkIconTile name="mail" />
        <h1 className="font-display text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink text-balance">{t.title}</h1>
        <p className="max-w-[36ch] text-[16px] leading-[1.55] text-inkSoft">{t.body}</p>
        {/* Chemin dans l'app, comme une suite d'onglets */}
        <ol className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {t.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-inkMuted rtl:rotate-180" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
              <span className="rounded-full bg-cashBg px-3 py-[6px] text-[14px] font-bold text-cashInk">{step}</span>
            </li>
          ))}
        </ol>
      </LinkCard>
    </LinkPageShell>
  );
}
