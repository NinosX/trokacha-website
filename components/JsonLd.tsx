export function JsonLd({ locale }: { locale: string }) {
  const baseUrl = "https://trokacha.com";

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Trokacha",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": locale === "ar"
      ? "تطبيق جزائري، للجزائريين! مقايضة، بيع، شراء، خدمات، عقارات، طرود، مشاركة السيارات"
      : locale === "en"
      ? "An Algerian App, for Algerians! Barter, Sale, Purchase, Services, Real Estate, Parcels, Carpooling"
      : "Une App Algérienne, pour les Algériens ! Troc, Vente, Achat, Services, Immobilier, Colis, Covoiturage",
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
      "availableLanguage": ["French", "English", "Arabic"]
    }
  };

  // MobileApplication Schema
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Trokacha",
    "operatingSystem": ["iOS", "Android"],
    "applicationCategory": "LifestyleApplication",
    "description": locale === "ar"
      ? "تطبيق جزائري، للجزائريين! مقايضة، بيع، شراء، خدمات، عقارات، طرود، مشاركة السيارات"
      : locale === "en"
      ? "An Algerian App, for Algerians! Barter, Sale, Purchase, Services, Real Estate, Parcels, Carpooling"
      : "Une App Algérienne, pour les Algériens ! Troc, Vente, Achat, Services, Immobilier, Colis, Covoiturage",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "DZD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Troc et échange de biens",
      "Vente et achat sécurisés",
      "Transport collaboratif de colis",
      "Covoiturage",
      "Chat intégré avec messages vocaux",
      "Vérification d'identité",
      "Système de notation"
    ]
  };

  // WebSite Schema with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Trokacha",
    "url": baseUrl,
    "inLanguage": locale === "ar" ? "ar-DZ" : locale === "en" ? "en" : "fr-FR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // FAQ Schema (pour la page d'accueil)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": locale === "en" ? "When will Trokacha be available?" : locale === "ar" ? "متى سيكون تروكاشا متاحاً؟" : "Quand sera disponible Trokacha ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": locale === "en"
            ? "Trokacha will be available very soon on iOS and Android."
            : locale === "ar"
            ? "تروكاشا سيكون متاحاً قريباً جداً على iOS و Android."
            : "Trokacha sera disponible très prochainement sur iOS et Android."
        }
      },
      {
        "@type": "Question",
        "name": locale === "en" ? "Is Trokacha free?" : locale === "ar" ? "هل تروكاشا مجاني؟" : "Trokacha est-il gratuit ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": locale === "en"
            ? "Yes, Trokacha is completely free! No hidden fees, no subscription."
            : locale === "ar"
            ? "نعم، تروكاشا مجاني تماماً! بدون رسوم خفية، بدون اشتراك."
            : "Oui, Trokacha est entièrement gratuit ! Pas de frais cachés, pas d'abonnement."
        }
      },
      {
        "@type": "Question",
        "name": locale === "en" ? "Is parcel transport secure?" : locale === "ar" ? "هل نقل الطرود آمن؟" : "Le transport de colis est-il sécurisé ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": locale === "en"
            ? "Yes! Each carrier is verified and rated by the community. You can track your parcel in real-time."
            : locale === "ar"
            ? "نعم! كل ناقل موثق ومُقيَّم من المجتمع. يمكنك تتبع طردك مباشرة."
            : "Oui ! Chaque transporteur est vérifié et noté par la communauté. Vous pouvez suivre votre colis en temps réel."
        }
      }
    ]
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
