import Link from "next/link";

export const metadata = {
  title: "Politique de Confidentialité - Trokacha",
  description: "Politique de confidentialité de Trokacha - Protection des données personnelles conformément à la Loi 18-07",
};

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold">Politique de Confidentialité</h1>
          <p className="text-white/80 mt-2">Dernière mise à jour : Décembre 2025</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">

          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Conformément à la <strong>Loi 18-07 du 10 juin 2018</strong> relative à la protection des personnes physiques
            dans le traitement des données à caractère personnel, modifiée par la <strong>Loi 11-25 de juillet 2025</strong>,
            Trokacha s'engage à protéger les données personnelles de ses utilisateurs.
          </p>

          {/* Article 1 */}
          <Section title="Article 1 - Responsable du Traitement">
            <p className="mb-4">
              <strong>Trokacha</strong><br />
              Plateforme d'intermédiation en ligne<br />
              Algérie
            </p>
            <p>
              Délégué à la Protection des Données (DPO) : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline">contact@trokacha.com</a>
            </p>
          </Section>

          {/* Article 2 */}
          <Section title="Article 2 - Données Collectées">
            <p className="mb-4">Trokacha collecte uniquement les données nécessaires au fonctionnement du service :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Données d'identification (nom, prénom, date de naissance)</li>
              <li>Coordonnées (adresse email, numéro de téléphone)</li>
              <li>Pour les conducteurs : copie du permis de conduire</li>
              <li>Données de navigation et d'utilisation de la plateforme</li>
              <li>Données de transaction (historique des annonces, échanges, évaluations)</li>
            </ul>
          </Section>

          {/* Article 3 */}
          <Section title="Article 3 - Base Légale du Traitement">
            <p className="mb-4">Les traitements sont fondés sur :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Le consentement exprès et éclairé de l'utilisateur</li>
              <li>L'exécution du contrat de service</li>
              <li>Les obligations légales de Trokacha</li>
              <li>Les intérêts légitimes (prévention de la fraude, amélioration du service)</li>
            </ul>
          </Section>

          {/* Article 4 */}
          <Section title="Article 4 - Vos Droits">
            <p className="mb-4">Conformément à la Loi 18-07, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification des données inexactes</li>
              <li>Droit de suppression des données ("droit à l'oubli")</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p className="mt-4">
              Ces droits peuvent être exercés en contactant : <a href="mailto:contact@trokacha.com" className="text-primary hover:underline font-semibold">contact@trokacha.com</a>
            </p>
          </Section>

          {/* Article 5 */}
          <Section title="Article 5 - Conservation des Données">
            <p className="mb-4">Les données personnelles sont conservées :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Pendant la durée d'utilisation active du compte</li>
              <li>3 ans après la dernière activité du compte</li>
              <li>Puis archivées conformément aux obligations légales</li>
              <li>Supprimées définitivement à l'issue de cette période</li>
            </ul>
          </Section>

          {/* Article 6 */}
          <Section title="Article 6 - Sécurité des Données">
            <p className="mb-4">Trokacha met en œuvre des mesures techniques et organisationnelles appropriées :</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Chiffrement des données sensibles</li>
              <li>Contrôles d'accès stricts</li>
              <li>Audits de sécurité réguliers</li>
              <li>Formation du personnel</li>
            </ul>
          </Section>

          {/* Article 7 */}
          <Section title="Article 7 - Notification des Violations">
            <p>
              En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés,
              Trokacha notifiera l'ANPDP dans un délai de 5 jours (conformément à la Loi 11-25) et les utilisateurs
              concernés dans les meilleurs délais.
            </p>
          </Section>

          {/* Article 8 */}
          <Section title="Article 8 - Transferts de Données">
            <p>
              Les données personnelles sont hébergées en Algérie. Tout transfert vers un pays étranger nécessitera
              une autorisation préalable de l'ANPDP et des garanties appropriées.
            </p>
          </Section>

          {/* Article 9 */}
          <Section title="Article 9 - Droit de Réclamation">
            <p className="mb-4">
              Vous pouvez déposer une réclamation auprès de l'Autorité Nationale de Protection des Données Personnelles
              (ANPDP) si vous estimez que vos droits n'ont pas été respectés.
            </p>
            <p>
              <strong>Site web ANPDP :</strong>{" "}
              <a href="https://www.anpdp.dz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://www.anpdp.dz/
              </a>
            </p>
          </Section>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Conditions Générales d'Utilisation →
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
