import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return {
    title: `${t("title")} - Trokacha`,
    description: t("title"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");
  const tPrivacy = await getTranslations("privacy");
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
            {tPrivacy("backHome")}
          </Link>
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-white/80 mt-2">{t("lastUpdate")}</p>
        </div>
      </header>

      {/* Content - Keep in French as legal document */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">

          {/* Article 1 */}
          <Section title="Article 1 - Nature du Service">
            <p className="mb-4">
              Trokacha est une plateforme d'intermediation en ligne qui met en relation des utilisateurs pour faciliter :
            </p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600 mb-4">
              <li>L'achat et la vente de biens d'occasion entre particuliers et/ou professionnels</li>
              <li>Le partage de frais de transport (covoiturage, livraison de colis)</li>
              <li>L'echange et le troc de biens entre utilisateurs</li>
            </ul>
            <div className="bg-amber-50 border-s-4 border-amber-400 p-4 rounded-e-lg">
              <p className="text-amber-800">
                <strong>Important :</strong> Trokacha agit uniquement en qualite d'intermediaire technique et hebergeur.
                Les contrats de vente, de prestation de services ou d'echange sont conclus directement entre les utilisateurs.
              </p>
            </div>
          </Section>

          {/* Article 2 */}
          <Section title="Article 2 - Responsabilite et Limitations">
            <p className="mb-4 font-semibold">Trokacha ne garantit pas :</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600 mb-4">
              <li>L'exactitude, l'exhaustivite ou la veracite des annonces publiees par les utilisateurs</li>
              <li>La qualite, la securite, la legalite ou la conformite des biens ou services proposes</li>
              <li>La capacite des utilisateurs a conclure une transaction</li>
              <li>La bonne execution des obligations contractuelles entre utilisateurs</li>
            </ul>
          </Section>

          {/* Article 3 */}
          <Section title="Article 3 - Services de Transport">
            <div className="bg-blue-50 border-s-4 border-blue-400 p-4 rounded-e-lg mb-6">
              <p className="text-blue-800">
                Le service de partage de trajets constitue un partage de frais de transport entre particuliers
                (covoiturage) et non un service de transport commercial.
              </p>
            </div>

            <p className="mb-4 font-semibold">Obligations du conducteur :</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600 mb-6">
              <li>Detenir un permis de conduire valide en Algerie</li>
              <li>Disposer d'une assurance automobile valide incluant la responsabilite civile</li>
              <li>S'assurer que son vehicule est en bon etat de fonctionnement</li>
              <li>Respecter le Code de la route algerien</li>
            </ul>
          </Section>

          {/* Article 4 */}
          <Section title="Article 4 - Produits et Services Interdits">
            <p className="mb-4">Conformement a la Loi 18-05, les annonces suivantes sont strictement interdites :</p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600">
              <li>Jeux de hasard, paris et loteries</li>
              <li>Boissons alcoolisees et tabac</li>
              <li>Produits pharmaceutiques et medicaments</li>
              <li>Armes et munitions</li>
              <li>Drogues et substances illicites</li>
              <li>Produits contrefaits</li>
              <li>Documents officiels falsifies</li>
            </ul>
          </Section>

          {/* Article 5 */}
          <Section title="Article 5 - Droit Applicable">
            <p className="mb-4">
              Les presentes Conditions Generales d'Utilisation sont regies par le droit algerien, notamment :
            </p>
            <ul className="list-disc ps-6 space-y-2 text-gray-600 mb-4">
              <li>La Loi 18-05 sur le commerce electronique</li>
              <li>La Loi 04-02 sur la protection du consommateur</li>
              <li>La Loi 18-07 sur la protection des donnees personnelles</li>
              <li>Le Code civil et le Code de commerce algeriens</li>
            </ul>
            <p>
              En cas de litige, et a defaut de resolution amiable, les tribunaux d'Alger, Algerie, seront seuls competents.
            </p>
          </Section>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              {tPrivacy("title")} →
            </Link>
            <Link href="/contact" className="text-primary hover:underline font-medium">
              {tFooter("contact")} →
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
