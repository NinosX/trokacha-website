"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, MessageCircle, Mic, Image as ImageIcon, FileText, Heart, Shield } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import Image from "next/image";

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div ref={ref} className={`${className} ${isInView ? "animate-fade-in-up" : "opacity-0"}`}>
      {children}
    </div>
  );
}

function FeatureCard({ feature, index, t }: { feature: { icon: React.ElementType; emoji: string; color: string }; index: number; t: (key: string) => string }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
        <span className="text-3xl">{feature.emoji}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {t(`features.feature${index + 1}.title`)}
      </h3>
      <p className="text-gray-600">
        {t(`features.feature${index + 1}.description`)}
      </p>
    </div>
  );
}

function UseCaseItem({ useCase, index, t }: { useCase: { emoji: string; color: string }; index: number; t: (key: string) => string }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`flex items-start gap-4 ${isInView ? "animate-fade-in-up" : "opacity-0"}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`w-10 h-10 rounded-xl ${useCase.color} flex items-center justify-center flex-shrink-0`}>
        <span className="text-xl">{useCase.emoji}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">
          {t(`marketplace.useCases.case${index + 1}.title`)}
        </h4>
        <p className="text-sm text-gray-600">
          {t(`marketplace.useCases.case${index + 1}.description`)}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const t = useTranslations("chatPage");

  const features = [
    { icon: MessageCircle, emoji: "💬", color: "from-blue-500 to-cyan-500" },
    { icon: Mic, emoji: "🎤", color: "from-purple-500 to-pink-500" },
    { icon: ImageIcon, emoji: "📷", color: "from-green-500 to-emerald-500" },
    { icon: FileText, emoji: "📄", color: "from-orange-500 to-amber-500" },
    { icon: Heart, emoji: "❤️", color: "from-red-500 to-pink-500" },
    { icon: Shield, emoji: "🔒", color: "from-indigo-500 to-purple-500" },
  ];

  const useCases = [
    { emoji: "💰", color: "bg-green-100 text-green-700" },
    { emoji: "📍", color: "bg-blue-100 text-blue-700" },
    { emoji: "📦", color: "bg-orange-100 text-orange-700" },
    { emoji: "🤝", color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 pt-32 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white animate-fade-in-up">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backHome")}
            </Link>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t("title")} 💬
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Screenshots Section - Compact + Full phone side by side */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Messagerie Intégrée 💬
            </h2>
            <p className="text-lg text-gray-600">
              Communiquez facilement avec les autres utilisateurs
            </p>
          </AnimatedSection>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Mockup compact - Aperçu liste conversations */}
            <AnimatedSection>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] p-3 shadow-2xl max-w-[280px]">
                <div className="bg-white rounded-[1.5rem] overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-4">
                    <p className="text-white font-semibold text-center">Conversations</p>
                  </div>
                  
                  {/* Liste conversations - Image */}
                  <div className="relative h-[300px]">
                    <Image
                      src="/screenshots/09_Messages.png"
                      alt="Liste des conversations"
                      fill
                      className="object-cover object-top"
                      sizes="280px"
                    />
                  </div>
                </div>
              </div>
              <p className="text-center mt-4 text-sm text-gray-600">Vos conversations</p>
            </AnimatedSection>

            {/* Flèche de connexion */}
            <div className="hidden md:block text-4xl text-gray-300">
              →
            </div>

            {/* Téléphone entier - Chat détail */}
            <AnimatedSection>
              <div className="relative" style={{ width: '270px', height: '585px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-[6px]">
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                  <div className="w-full h-full bg-black rounded-[2.7rem] overflow-hidden relative">
                    <Image
                      src="/screenshots/chat.png"
                      alt="Interface de chat"
                      fill
                      className="object-cover"
                      sizes="270px"
                      priority
                    />
                  </div>
                </div>
              </div>
              <p className="text-center mt-4 text-sm text-gray-600">Discussion en détail</p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("featuresTitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("featuresSubtitle")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                <span>🏪</span>
                {t("marketplace.badge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {t("marketplace.title")}
              </h2>
              <p className="text-lg text-gray-600 mb-12">
                {t("marketplace.description")}
              </p>

              {/* Use cases grid */}
              <div className="grid sm:grid-cols-2 gap-6 text-left">
                {useCases.map((useCase, index) => (
                  <UseCaseItem key={index} useCase={useCase} index={index} t={t} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("ctaTitle")} 🚀
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/echange"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-2xl font-semibold hover:bg-white/90 transition-colors"
              >
                {t("discoverEchange")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/transport"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-colors"
              >
                {t("discoverTransport")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Trokacha. {t("allRightsReserved")}
          </p>
        </div>
      </footer>
    </main>
  );
}
