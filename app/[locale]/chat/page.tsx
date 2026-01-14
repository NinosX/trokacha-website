"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, MessageCircle, Mic, Image, FileText, Heart, Shield } from "lucide-react";
import { useInView } from "@/hooks/useInView";

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
    { icon: Image, emoji: "📷", color: "from-green-500 to-emerald-500" },
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

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  <span>🏪</span>
                  {t("marketplace.badge")}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {t("marketplace.title")}
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {t("marketplace.description")}
                </p>

                {/* Use cases */}
                <div className="space-y-4">
                  {useCases.map((useCase, index) => (
                    <UseCaseItem key={index} useCase={useCase} index={index} t={t} />
                  ))}
                </div>
              </AnimatedSection>

              {/* Chat mockup */}
              <AnimatedSection className="relative">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Chat header */}
                    <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div className="text-white">
                        <p className="font-semibold">{t("mockup.userName")}</p>
                        <p className="text-xs text-white/70">{t("mockup.status")}</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="p-4 space-y-4 min-h-[300px] bg-gray-50">
                      {/* Received message */}
                      <div className="flex gap-2">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[80%]">
                          <p className="text-gray-800 text-sm">{t("mockup.message1")}</p>
                        </div>
                      </div>

                      {/* Sent message */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-[80%]">
                          <p className="text-sm">{t("mockup.message2")}</p>
                        </div>
                      </div>

                      {/* Voice message */}
                      <div className="flex gap-2">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-purple-400 rounded-full"
                                style={{ height: `${Math.random() * 20 + 5}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">0:12</span>
                        </div>
                      </div>

                      {/* Reaction */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm relative">
                          <p className="text-sm">{t("mockup.message3")}</p>
                          <div className="absolute -bottom-2 -left-2 bg-white rounded-full px-1.5 py-0.5 shadow-md text-xs">
                            ❤️
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400">
                        {t("mockup.placeholder")}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 text-4xl animate-float">
                  ✨
                </div>
                <div className="absolute -bottom-4 -left-4 text-4xl animate-float-reverse">
                  💬
                </div>
              </AnimatedSection>
            </div>
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
