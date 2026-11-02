import { getTranslations } from "next-intl/server";
import { SHOW_LOCATIONS, SHOW_TRANSPORT, withRentals } from "@/lib/featureFlags";
import { SITE_URL } from "@/lib/seo";

// Données structurées (Google) : mêmes textes que les pages, dans la langue
// de la page (messages/*.json). Pas de note moyenne ni de recherche interne :
// l'app n'a pas encore d'avis publics agrégés, et /search n'existe pas.
export async function JsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const description = t(withRentals("metadata.description"));

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Trokacha",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "description": description,
    "foundingDate": "2024",
    "foundingLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "DZ"
      }
    },
    "sameAs": [
      "https://www.instagram.com/trokacha",
      "https://www.facebook.com/trokacha",
      "https://www.tiktok.com/@trokacha"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact@trokacha.com",
      "availableLanguage": ["Arabic", "French", "English", "Kabyle"]
    }
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Trokacha",
    "operatingSystem": ["iOS", "Android"],
    "applicationCategory": "LifestyleApplication",
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "DZD"
    },
    "featureList": [
      t(withRentals("features.trocVenteAchat.title")),
      t("features.chat.title"),
      t("features.verification.title"),
      t("features.meetup.title"),
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Trokacha",
    "url": SITE_URL,
    "inLanguage": locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : locale,
  };

  // Mêmes questions, dans le même ordre, que la FAQ affichée (components/FAQ.tsx).
  const questions = [
    "q1",
    "q2",
    ...(SHOW_LOCATIONS ? ["q7"] : []),
    ...(SHOW_TRANSPORT ? ["q3"] : []),
    "q4",
    "q5",
    ...(SHOW_TRANSPORT ? ["q6"] : []),
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map((q) => ({
      "@type": "Question",
      "name": t(`faq.questions.${q}.question`),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": t(`faq.questions.${q}.answer`)
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
