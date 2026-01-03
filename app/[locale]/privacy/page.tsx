import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: `${t("title")} - Trokacha`,
    description: t("title"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const tFooter = await getTranslations("footer");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("backHome")}
          </Link>
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-white/80 mt-2">{t("lastUpdate")}</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">

          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {t("intro")}
          </p>

          {/* Article 1 */}
          <Section title={t("articles.a1.title")}>
            <p className="mb-4">
              <strong>Trokacha</strong><br />
              {t("articles.a1.content")}
            </p>
            <p>
              {t("articles.a1.dpo")} : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline">contact@trokacha.com</a>
            </p>
          </Section>

          {/* Article 2 */}
          <Section title={t("articles.a2.title")}>
            <p className="mb-4">{t("articles.a2.intro")}</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              {(t.raw("articles.a2.items") as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* Article 3 */}
          <Section title={t("articles.a3.title")}>
            <p className="mb-4">{t("articles.a3.intro")}</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              {(t.raw("articles.a3.items") as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* Article 4 */}
          <Section title={t("articles.a4.title")}>
            <p className="mb-4">{t("articles.a4.intro")}</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              {(t.raw("articles.a4.items") as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">
              {t("articles.a4.contact")} : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline font-semibold">contact@trokacha.com</a>
            </p>
          </Section>

          {/* Article 5 */}
          <Section title={t("articles.a5.title")}>
            <p className="mb-4">{t("articles.a5.intro")}</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              {(t.raw("articles.a5.items") as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* Article 6 */}
          <Section title={t("articles.a6.title")}>
            <p className="mb-4">{t("articles.a6.intro")}</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              {(t.raw("articles.a6.items") as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* Article 7 */}
          <Section title={t("articles.a7.title")}>
            <p>{t("articles.a7.content")}</p>
          </Section>

          {/* Article 8 */}
          <Section title={t("articles.a8.title")}>
            <p>{t("articles.a8.content")}</p>
          </Section>

          {/* Article 9 */}
          <Section title={t("articles.a9.title")}>
            <p className="mb-4">{t("articles.a9.content")}</p>
            <p>
              <strong>{t("articles.a9.website")} :</strong>{" "}
              <a href="https://www.anpdp.dz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://www.anpdp.dz/
              </a>
            </p>
          </Section>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/terms" className="text-primary hover:underline font-medium">
              {t("footerLinks.terms")} →
            </Link>
            <Link href="/contact" className="text-primary hover:underline font-medium">
              {t("footerLinks.contact")} →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 {tFooter("copyright")}</p>
        </div>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}
