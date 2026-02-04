"use client";

import { Sparkles } from "lucide-react";
import { EmailForm } from "@/components/EmailForm";
import { Navbar } from "@/components/Navbar";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useInView } from "@/hooks/useInView";
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";
import { TypewriterCategories } from "@/components/TypewriterCategories";

// Lazy load composants below the fold
const HowItWorks = dynamic(() => import("@/components/HowItWorks").then(mod => mod.HowItWorks), {
  loading: () => <div className="py-24 bg-white" />,
});
const FAQ = dynamic(() => import("@/components/FAQ").then(mod => mod.FAQ), {
  loading: () => <div className="py-24 bg-gray-50" />,
});

// Phone mockup avec vidéo intro
function SwipeTutorial() {
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      {/* Phone mockup */}
      <div className="relative w-[320px] h-[600px] animate-fade-in-up">
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
          <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
            {/* Video */}
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/videos/intro.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Floating emojis */}
        <div className="absolute -top-8 -right-8 text-6xl animate-float">
          ✨
        </div>
        <div className="absolute -bottom-8 -left-8 text-6xl animate-float-reverse">
          💫
        </div>
      </div>
    </div>
  );
}

// Version mobile simplifiee des fonctionnalites
function MobileFeatures() {
  const t = useTranslations("mobileFeatures");

  const features = [
    { icon: "🔄", text: t("troc") },
    { icon: "🛍️", text: t("vente") },
    { icon: "🚚", text: t("transport") },
    { icon: "🚗", text: t("covoiturage") },
  ];

  return (
    <div className="lg:hidden mt-8">
      <div className="flex justify-center gap-4 flex-wrap">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 animate-fade-in-up"
            style={{ animationDelay: `${0.6 + index * 0.1}s` }}
          >
            <span className="text-3xl mb-1">{feature.icon}</span>
            <span className="text-sm font-medium">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour les feature cards avec animation au scroll
function FeatureCard({ feature, index }: { feature: { emoji: string; title: string; description: string; color: string }; index: number }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover-lift ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        <span className="text-5xl">{feature.emoji}</span>
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
    </div>
  );
}

// Composant pour les sections avec animation au scroll
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? "animate-fade-in-up" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const t = useTranslations();

  const featuresList = [
    {
      emoji: "🔄",
      title: t("features.troc.title"),
      description: t("features.troc.description"),
      color: "from-red-500 to-pink-500",
    },
    {
      emoji: "🛍️",
      title: t("features.vente.title"),
      description: t("features.vente.description"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      emoji: "🚚",
      title: t("features.transport.title"),
      description: t("features.transport.description"),
      color: "from-green-500 to-emerald-500",
    },
    {
      emoji: "🚗",
      title: t("features.covoiturage.title"),
      description: t("features.covoiturage.description"),
      color: "from-yellow-500 to-orange-500",
    },
    {
      emoji: "⚡",
      title: t("features.interface.title"),
      description: t("features.interface.description"),
      color: "from-purple-500 to-pink-500",
    },
    {
      emoji: "🎨",
      title: t("features.design.title"),
      description: t("features.design.description"),
      color: "from-indigo-500 to-purple-500",
    },
    {
      emoji: "✅",
      title: t("features.verification.title"),
      description: t("features.verification.description"),
      color: "from-teal-500 to-cyan-500",
    },
    {
      emoji: "🏆",
      title: t("features.gamification.title"),
      description: t("features.gamification.description"),
      color: "from-amber-500 to-yellow-500",
    },
    {
      emoji: "💬",
      title: t("features.chat.title"),
      description: t("features.chat.description"),
      color: "from-rose-500 to-red-500",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow-reverse" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 md:pt-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white animate-fade-in-up">
              <div className="flex items-center gap-2 md:gap-4 mb-1 animate-fade-in-up delay-300">
                <h1 className="text-4xl md:text-7xl font-bold leading-tight">
                  {t("hero.title")}
                </h1>
                <span className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-full text-[10px] md:text-sm font-semibold shadow-lg whitespace-nowrap animate-scale-in delay-500">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  {t("hero.badge")}
                </span>
              </div>

              <p className="text-sm md:text-base mb-6 text-white/70 animate-fade-in-up delay-400">
                <span className="inline-flex items-center gap-1">
                  {t("hero.subtitle")} <img src="/flags/dz.png" alt="🇩🇿" className="inline w-4 h-3 object-cover rounded-sm" />
                </span>
              </p>

              {/* Desktop: TypewriterCategories reste ici */}
              <div className="hidden lg:block mb-8 animate-fade-in-up delay-500">
                <TypewriterCategories
                  categories={[
                    { icon: "🔄", key: "troc", label: t("hero.categories.troc") },
                    { icon: "🛍️", key: "vente", label: t("hero.categories.vente") },
                    { icon: "🛒", key: "achat", label: t("hero.categories.achat") },
                    { icon: "🔧", key: "services", label: t("hero.categories.services") },
                    { icon: "🏠", key: "immobilier", label: t("hero.categories.immobilier") },
                    { icon: "📦", key: "colis", label: t("hero.categories.colis") },
                    { icon: "🚗", key: "covoiturage", label: t("hero.categories.covoiturage") },
                  ]}
                />
              </div>

              {/* Mobile: TypewriterCategories au-dessus du téléphone */}
              <div className="lg:hidden mb-4 animate-fade-in-up delay-500">
                <div className="flex justify-center">
                  <TypewriterCategories
                    size="small"
                    categories={[
                      { icon: "🔄", key: "troc", label: t("hero.categories.troc") },
                      { icon: "🛍️", key: "vente", label: t("hero.categories.vente") },
                      { icon: "🛒", key: "achat", label: t("hero.categories.achat") },
                      { icon: "🔧", key: "services", label: t("hero.categories.services") },
                      { icon: "🏠", key: "immobilier", label: t("hero.categories.immobilier") },
                      { icon: "📦", key: "colis", label: t("hero.categories.colis") },
                      { icon: "🚗", key: "covoiturage", label: t("hero.categories.covoiturage") },
                    ]}
                  />
                </div>
              </div>

              {/* Mobile Screenshot Carousel */}
              <div className="lg:hidden mb-8 animate-fade-in-up delay-500">
                <ScreenshotCarousel size="compact" />
              </div>

              <div className="flex flex-row gap-2 sm:gap-4 mb-10 animate-fade-in-up delay-500">
                {/* App Store Button - TestFlight BETA */}
                <a
                  href="https://testflight.apple.com/join/8bUpfbkS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-2 sm:px-6 py-2 sm:py-4 bg-black hover:bg-gray-800 text-white rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex-1 sm:flex-none"
                >
                  <svg className="w-5 h-5 sm:w-8 sm:h-8 me-1.5 sm:me-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-start">
                    <div className="text-[9px] sm:text-xs opacity-80">{t("hero.betaVersion")}</div>
                    <div className="text-xs sm:text-lg font-bold">TestFlight</div>
                  </div>
                </a>

                {/* Play Store Button - APK BETA */}
                <a
                  href="https://expo.dev/artifacts/eas/sq6WofN5TU49gcBRoxdNc4.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-2 sm:px-6 py-2 sm:py-4 bg-white hover:bg-gray-100 text-gray-800 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex-1 sm:flex-none"
                >
                  <svg className="w-5 h-5 sm:w-8 sm:h-8 me-1.5 sm:me-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-start">
                    <div className="text-[9px] sm:text-xs opacity-80">{t("hero.betaVersion")}</div>
                    <div className="text-xs sm:text-lg font-bold">Android APK</div>
                  </div>
                </a>
              </div>

              {/* Email Notification Form */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md animate-fade-in delay-700">
                <div className="text-lg font-semibold mb-3 flex items-center gap-2">
                  🔔 {t("hero.notifyTitle")}
                </div>
                <EmailForm variant="hero" />
                <p className="text-white/60 text-xs mt-3">
                  {t("hero.notifyNote")} 🚀
                </p>
              </div>
            </div>

            {/* Right Content - Screenshot Carousel */}
            <div className="relative lg:flex justify-center hidden animate-fade-in-up delay-500">
              <ScreenshotCarousel />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-scroll-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t("features.title")} 🎯
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>


      {/* How it works */}
      <HowItWorks />



      {/* FAQ */}
      <FAQ />

      {/* CTA Section */}
      <section id="cta" className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">✨</div>
          <div className="absolute bottom-10 right-10 text-9xl">💫</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5">🚀</div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("cta.title")} 🚀
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>

            {/* Email Form CTA */}
            <div className="max-w-md mx-auto">
              <EmailForm variant="cta" />
              <p className="text-white/60 text-sm mt-4">
                🎁 {t("cta.note")}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                Trokacha <span className="text-3xl">✨</span>
              </h3>
              <p className="text-gray-400">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">{t("footer.links")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">{t("footer.terms")}</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t("footer.privacy")}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">{t("footer.contact")}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">{t("footer.contactTitle")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:contact@trokacha.com" className="hover:text-white transition-colors">contact@trokacha.com</a></li>
                <li><a href="mailto:support@trokacha.com" className="hover:text-white transition-colors">support@trokacha.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="text-gray-500 text-sm">
              © 2025 {t("footer.copyright")}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
