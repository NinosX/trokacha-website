import Link from "next/link";

export const metadata = {
  title: "Conditions Générales d'Utilisation - Trokacha",
  description: "CGU de Trokacha - Conditions d'utilisation de la plateforme conformément à la législation algérienne",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold">Conditions Générales d'Utilisation</h1>
          <p className="text-white/80 mt-2">Dernière mise à jour : Décembre 2025</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">

          {/* Article 1 */}
          <Section title="Article 1 - Nature du Service">
            <p className="mb-4">
              Trokacha est une plateforme d'intermédiation en ligne qui met en relation des utilisateurs pour faciliter :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
              <li>L'achat et la vente de biens d'occasion entre particuliers et/ou professionnels</li>
              <li>Le partage de frais de transport (covoiturage, livraison de colis)</li>
              <li>L'échange et le troc de biens entre utilisateurs</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <p className="text-amber-800">
                <strong>Important :</strong> Trokacha agit uniquement en qualité d'intermédiaire technique et hébergeur.
                Les contrats de vente, de prestation de services ou d'échange sont conclus directement entre les utilisateurs.
                Trokacha n'est ni vendeur, ni acheteur, ni partie aux transactions réalisées par l'intermédiaire de la plateforme.
              </p>
            </div>
          </Section>

          {/* Article 2 */}
          <Section title="Article 2 - Responsabilité et Limitations">
            <p className="mb-4 font-semibold">Trokacha ne garantit pas :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
              <li>L'exactitude, l'exhaustivité ou la véracité des annonces publiées par les utilisateurs</li>
              <li>La qualité, la sécurité, la légalité ou la conformité des biens ou services proposés</li>
              <li>La capacité des utilisateurs à conclure une transaction</li>
              <li>La bonne exécution des obligations contractuelles entre utilisateurs</li>
            </ul>
            <p>
              Conformément à la législation algérienne (Loi 18-05 sur le commerce électronique), Trokacha facilite la mise
              en relation mais ne se substitue pas aux obligations légales des e-fournisseurs envers les e-consommateurs.
            </p>
          </Section>

          {/* Article 3 */}
          <Section title="Article 3 - Exonération de Responsabilité">
            <p className="mb-4 font-semibold">Trokacha ne peut être tenue responsable :</p>

            <SubSection title="a) Des transactions entre utilisateurs">
              <p>
                Trokacha n'est pas partie aux contrats conclus entre utilisateurs. Toute contestation relative à une
                transaction doit être directement réglée entre les parties concernées. Les produits et services ne
                peuvent être ni repris ni échangés par Trokacha.
              </p>
            </SubSection>

            <SubSection title="b) Du contenu des annonces">
              <p>
                Les annonces sont rédigées et publiées par les utilisateurs sous leur responsabilité. Trokacha ne
                garantit pas l'exactitude des informations fournies et intervient uniquement sur notification d'un
                contenu manifestement illicite.
              </p>
            </SubSection>

            <SubSection title="c) Des rencontres physiques et échanges">
              <p>
                Les rencontres en personne pour les transactions s'effectuent sous la responsabilité exclusive des
                utilisateurs. Trokacha recommande de se rencontrer dans des lieux publics et de vérifier les biens
                avant échange. Trokacha n'est pas responsable des dommages corporels, matériels ou immatériels
                survenant lors des rencontres.
              </p>
            </SubSection>

            <SubSection title="d) Des services de transport">
              <p>
                Pour le covoiturage, le conducteur est responsable de ses passagers. Les utilisateurs doivent s'assurer
                d'avoir une assurance valide. Trokacha vérifie l'identité et les permis mais ne garantit pas la sécurité
                des trajets. En cas d'accident, l'assurance du conducteur doit couvrir les passagers.
              </p>
            </SubSection>
          </Section>

          {/* Article 4 */}
          <Section title="Article 4 - Services de Transport">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
              <p className="text-blue-800">
                Le service de partage de trajets constitue un partage de frais de transport entre particuliers
                (covoiturage) et non un service de transport commercial. Les conducteurs ne sont pas des transporteurs
                professionnels.
              </p>
            </div>

            <p className="mb-4 font-semibold">Obligations du conducteur :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Détenir un permis de conduire valide en Algérie</li>
              <li>Disposer d'une assurance automobile valide incluant la responsabilité civile</li>
              <li>S'assurer que son véhicule est en bon état de fonctionnement</li>
              <li>Respecter le Code de la route algérien</li>
              <li>Ne pas demander une contribution supérieure aux frais réels du trajet</li>
            </ul>

            <p className="mb-4 font-semibold">Vérifications par Trokacha :</p>
            <p className="mb-6">
              Trokacha vérifie l'identité des conducteurs et la validité des permis de conduire. Cependant, ces
              vérifications ne constituent pas une garantie de la sécurité du trajet. Trokacha ne contrôle pas l'état
              technique des véhicules ni les compétences de conduite.
            </p>

            <p className="mb-4 font-semibold">En cas d'accident :</p>
            <p>
              Le conducteur est seul responsable et son assurance doit couvrir les passagers. Trokacha n'est pas
              responsable des dommages corporels, matériels ou immatériels. Les utilisateurs doivent contacter
              immédiatement les autorités et échanger leurs informations d'assurance.
            </p>
          </Section>

          {/* Article 5 */}
          <Section title="Article 5 - Sécurité des Transactions en Personne">
            <p className="mb-4 font-semibold">Recommandations de sécurité :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Choisir un lieu de rencontre public et fréquenté (café, centre commercial, commissariat)</li>
              <li>Se rencontrer en journée</li>
              <li>Être accompagné d'une autre personne si possible</li>
              <li>Informer un proche de la rencontre (lieu, heure, identité de l'autre partie)</li>
              <li>Vérifier soigneusement le bien avant de finaliser la transaction</li>
              <li>Ne jamais communiquer d'informations bancaires ou personnelles sensibles</li>
            </ul>

            <p className="mb-4 font-semibold">Paiement :</p>
            <p>
              Trokacha recommande le paiement en espèces lors de la remise pour les transactions entre particuliers,
              l'utilisation de moyens de paiement traçables pour les montants importants, et de ne jamais effectuer
              de paiement avant d'avoir vérifié le bien.
            </p>
          </Section>

          {/* Article 6 */}
          <Section title="Article 6 - Produits et Services Interdits">
            <p className="mb-4">Conformément à la Loi 18-05, les annonces suivantes sont strictement interdites :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Jeux de hasard, paris et loteries</li>
              <li>Boissons alcoolisées et tabac</li>
              <li>Produits pharmaceutiques et médicaments</li>
              <li>Armes et munitions</li>
              <li>Drogues et substances illicites</li>
              <li>Produits contrefaits</li>
              <li>Documents officiels falsifiés</li>
            </ul>
          </Section>

          {/* Article 7 */}
          <Section title="Article 7 - Droit Applicable">
            <p className="mb-4">
              Les présentes Conditions Générales d'Utilisation sont régies par le droit algérien, notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
              <li>La Loi 18-05 sur le commerce électronique</li>
              <li>La Loi 04-02 sur la protection du consommateur</li>
              <li>La Loi 18-07 sur la protection des données personnelles</li>
              <li>Le Code civil et le Code de commerce algériens</li>
            </ul>
            <p>
              En cas de litige, et à défaut de résolution amiable, les tribunaux d'Alger, Algérie, seront seuls compétents.
            </p>
          </Section>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Politique de Confidentialité →
            </Link>
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Nous contacter →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Trokacha. Tous droits réservés.</p>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 pl-4 border-l-2 border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
