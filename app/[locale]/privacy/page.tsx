import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />
      {/* Header */}
      <header className="bg-ink text-paperSoft py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-line2 hover:text-paperSoft mb-4 transition-colors">
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("backHome")}
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em]">{t("title")}</h1>
          <p className="text-line2 mt-2">{t("lastUpdate")}</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-line shadow-card p-8 md:p-12">

          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {t("intro")}
          </p>

          {/* Article 1 – Responsable du Traitement */}
          <Section title={t("articles.a1.title")}>
            <p className="mb-4">
              <strong>Trokacha</strong><br />
              {t("articles.a1.content")}
            </p>
            <p>
              {t("articles.a1.dpo")} : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline">contact@trokacha.com</a>
            </p>
          </Section>

          {/* Article 2 – Données Collectées (avec sous-sections) */}
          <Section title={t("articles.a2.title")}>
            <p className="mb-6">{t("articles.a2.intro")}</p>

            {/* 2.1 – Données d'identification */}
            <SubSection title={t("articles.a2.s1.title")}>
              <ItemList items={t.raw("articles.a2.s1.items") as string[]} />
            </SubSection>

            {/* 2.2 – Données de vérification d'identité */}
            <SubSection title={t("articles.a2.s2.title")}>
              <ItemList items={t.raw("articles.a2.s2.items") as string[]} />
              <p className="mt-3 text-sm text-gray-500 italic">{t("articles.a2.s2.note")}</p>
            </SubSection>

            {/* 2.3 – Données de géolocalisation */}
            <SubSection title={t("articles.a2.s3.title")}>
              <ItemList items={t.raw("articles.a2.s3.items") as string[]} />
            </SubSection>

            {/* 2.4 – Données de transaction et d'utilisation */}
            <SubSection title={t("articles.a2.s4.title")}>
              <ItemList items={t.raw("articles.a2.s4.items") as string[]} />
            </SubSection>

            {/* 2.5 – Données techniques */}
            <SubSection title={t("articles.a2.s5.title")}>
              <ItemList items={t.raw("articles.a2.s5.items") as string[]} />
            </SubSection>
          </Section>

          {/* Article 3 – Base Légale du Traitement */}
          <Section title={t("articles.a3.title")}>
            <p className="mb-4">{t("articles.a3.intro")}</p>
            <ItemList items={t.raw("articles.a3.items") as string[]} />
          </Section>

          {/* Article 4 – Services Tiers et Sous-traitants (avec sous-sections) */}
          <Section title={t("articles.a4.title")}>
            <p className="mb-6">{t("articles.a4.intro")}</p>

            {/* 4.1 – Firebase (Google LLC) */}
            <SubSection title={t("articles.a4.s1.title")}>
              <ItemList items={t.raw("articles.a4.s1.items") as string[]} />
              <p className="mt-3">
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                  {t("articles.a4.s1.linkText")} →
                </a>
              </p>
            </SubSection>

            {/* 4.2 – Expo / React Native */}
            <SubSection title={t("articles.a4.s2.title")}>
              <p>{t("articles.a4.s2.content")}</p>
              <p className="mt-3">
                <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                  {t("articles.a4.s2.linkText")} →
                </a>
              </p>
            </SubSection>

            {/* 4.3 – Services d'analyse */}
            <SubSection title={t("articles.a4.s3.title")}>
              <p>{t("articles.a4.s3.content")}</p>
            </SubSection>
          </Section>

          {/* Article 5 – Vos Droits */}
          <Section title={t("articles.a5.title")}>
            <p className="mb-4">{t("articles.a5.intro")}</p>
            <ItemList items={t.raw("articles.a5.items") as string[]} />
            <p className="mt-4">
              {t("articles.a5.contact")} : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline font-semibold">contact@trokacha.com</a>
            </p>
            <p className="mt-2 text-sm text-gray-500">{t("articles.a5.responseDelay")}</p>
          </Section>

          {/* Article 6 – Conservation des Données */}
          <Section title={t("articles.a6.title")}>
            <p className="mb-4">{t("articles.a6.intro")}</p>
            <ItemList items={t.raw("articles.a6.items") as string[]} />
          </Section>

          {/* Article 7 – Sécurité des Données */}
          <Section title={t("articles.a7.title")}>
            <p className="mb-4">{t("articles.a7.intro")}</p>
            <ItemList items={t.raw("articles.a7.items") as string[]} />
          </Section>

          {/* Article 8 – Notification des Violations */}
          <Section title={t("articles.a8.title")}>
            <p className="mb-4">{t("articles.a8.intro")}</p>
            <ItemList items={t.raw("articles.a8.items") as string[]} />
          </Section>

          {/* Article 9 – Transferts de Données */}
          <Section title={t("articles.a9.title")}>
            <p className="mb-4">{t("articles.a9.content")}</p>
            <p className="mb-4">{t("articles.a9.guarantees")}</p>
            <ItemList items={t.raw("articles.a9.items") as string[]} />
          </Section>

          {/* Article 10 – Utilisateurs Mineurs */}
          <Section title={t("articles.a10.title")}>
            <p className="mb-4">{t("articles.a10.content")}</p>
            <p className="mb-4">{t("articles.a10.discovery")}</p>
            <p>
              {t("articles.a10.parent")} <a href="mailto:contact@trokacha.com" className="text-primary hover:underline font-semibold">contact@trokacha.com</a>.
            </p>
          </Section>

          {/* Article 11 – Identifiants Techniques et Cookies */}
          <Section title={t("articles.a11.title")}>
            <p className="mb-4">{t("articles.a11.intro")}</p>
            <ItemList items={t.raw("articles.a11.items") as string[]} />
            <p className="mt-4 text-sm text-gray-500">{t("articles.a11.website")}</p>
          </Section>

          {/* Article 12 – Modifications de la Politique */}
          <Section title={t("articles.a12.title")}>
            <p className="mb-4">{t("articles.a12.intro")}</p>
            <ItemList items={t.raw("articles.a12.items") as string[]} />
            <p className="mt-4 text-sm text-gray-500">{t("articles.a12.note")}</p>
          </Section>

          {/* Article 13 – Droit de Réclamation */}
          <Section title={t("articles.a13.title")}>
            <p className="mb-4">{t("articles.a13.intro")}</p>
            <ItemList items={t.raw("articles.a13.items") as string[]} />
            <p className="mt-4">
              <strong>{t("articles.a13.website")} :</strong>{" "}
              <a href="https://www.anpdp.dz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://www.anpdp.dz/
              </a>
            </p>
          </Section>

          {/* Section Contact */}
          <section className="mb-8 mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("contactSection.title")}</h2>
            <div className="text-gray-600 leading-relaxed">
              <p className="mb-4">{t("contactSection.intro")}</p>
              <p className="mb-2">
                <strong>{t("contactSection.email")} :</strong>{" "}
                <a href="mailto:contact@trokacha.com" className="text-primary hover:underline">contact@trokacha.com</a>
              </p>
              <p className="mb-2">
                <strong>{t("contactSection.support")} :</strong>{" "}
                <a href="mailto:support@trokacha.com" className="text-primary hover:underline">support@trokacha.com</a>
              </p>
              <p>
                <strong>{t("contactSection.website")} :</strong>{" "}
                <a href="https://www.trokacha.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.trokacha.com</a>
              </p>
            </div>
          </section>

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

      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-bold text-ink mb-4">{title}</h2>
      <div className="text-inkSoft leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 ps-4 border-s-2 border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc ps-6 space-y-2 text-gray-600">
      {items.map((item: string, index: number) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
