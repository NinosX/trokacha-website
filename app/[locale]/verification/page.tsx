"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { Shield, UserCheck, Star, Lock, BadgeCheck, Car, Package, ArrowLeft, ArrowRight } from "lucide-react";
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

function BadgeCard({ type, t }: { type: "blue" | "green"; t: (key: string) => string }) {
  const { ref, isInView } = useInView();
  const isBlue = type === "blue";

  return (
    <div
      ref={ref}
      className={`${
        isBlue
          ? "bg-white border-blue-200 shadow-blue-100"
          : "bg-white border-green-200 shadow-green-100"
      } rounded-3xl p-8 border shadow-lg relative overflow-hidden ${
        isInView ? (isBlue ? "animate-slide-in-left" : "animate-slide-in-right") : "opacity-0"
      }`}
    >
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 ${isBlue ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"} text-xs font-medium rounded-full`}>
          {isBlue ? t("badges.blue.optional") : t("badges.green.required")}
        </span>
      </div>

      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${isBlue ? "from-blue-400 to-blue-600" : "from-green-400 to-emerald-600"} flex items-center justify-center mb-6 shadow-lg`}>
        <BadgeCheck className="w-10 h-10 text-white" />
      </div>

      <h3 className={`text-2xl font-bold mb-3 ${isBlue ? "text-blue-600" : "text-green-600"}`}>
        {t(`badges.${type}.title`)}
      </h3>
      <p className="text-gray-600 mb-6">{t(`badges.${type}.description`)}</p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${isBlue ? "bg-blue-100" : "bg-green-100"} flex items-center justify-center`}>
            <span className="text-lg">🪪</span>
          </div>
          <span className="text-gray-700">{t(`badges.${type}.req1`)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${isBlue ? "bg-blue-100" : "bg-green-100"} flex items-center justify-center`}>
            <span className="text-lg">🤳</span>
          </div>
          <span className="text-gray-700">{t(`badges.${type}.req2`)}</span>
        </div>
        {!isBlue && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-lg">🚗</span>
            </div>
            <span className="text-gray-700">{t("badges.green.req3")}</span>
          </div>
        )}
      </div>

      <div className={`pt-4 border-t ${isBlue ? "border-blue-100" : "border-green-100"}`}>
        {isBlue ? (
          <>
            <p className="text-sm text-blue-600 font-medium mb-2">{t("badges.benefits")}</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>✓ {t("badges.blue.benefit1")}</li>
              <li>✓ {t("badges.blue.benefit2")}</li>
              <li>✓ {t("badges.blue.benefit3")}</li>
            </ul>
          </>
        ) : (
          <>
            <p className="text-sm text-green-600 font-medium mb-2">{t("badges.green.whoNeeds")}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-xs text-green-700">
                <Car className="w-3 h-3" /> {t("badges.green.driver")}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-xs text-green-700">
                <Package className="w-3 h-3" /> {t("badges.green.transporter")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProcessStep({ item, index }: { item: { icon: string; step: number }; index: number }) {
  const { ref, isInView } = useInView();

  return (
    <div className="flex items-center">
      <div
        ref={ref}
        className={`flex flex-col items-center ${isInView ? "animate-scale-in" : "opacity-0"}`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl mb-3">
          {item.icon}
        </div>
        <span className="text-sm text-gray-600 text-center max-w-[100px]">
          Step {item.step}
        </span>
      </div>
      {index < 4 && <div className="hidden md:block w-12 h-0.5 bg-gray-200 mx-2" />}
    </div>
  );
}

export default function VerificationPage() {
  const t = useTranslations("security");

  const features = [
    { icon: UserCheck, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: Star, bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
    { icon: Lock, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Shield, bgColor: "bg-green-100", iconColor: "text-green-600" },
  ];

  const processSteps = [
    { icon: "📱", step: 1 },
    { icon: "🪪", step: 2 },
    { icon: "🤳", step: 3 },
    { icon: "⏳", step: 4 },
    { icon: "✅", step: 5 },
  ];

  const stats = [
    { value: "100%", label: t("stats.stat1"), color: "text-blue-400" },
    { value: "24/7", label: t("stats.stat2"), color: "text-green-400" },
    { value: "5★", label: t("stats.stat3"), color: "text-yellow-400" },
    { value: "0", label: t("stats.stat4"), color: "text-red-400" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-200/50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in-up">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backHome")}
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              {t("badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              {t("title")} 🛡️
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Phone Screenshot Section */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex justify-center">
            <div className="relative" style={{ width: '270px', height: '585px' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-[6px]">
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                <div className="w-full h-full bg-black rounded-[2.7rem] overflow-hidden relative">
                  <Image
                    src="/screenshots/verif.png"
                    alt="Vérification d'identité"
                    fill
                    className="object-cover"
                    sizes="270px"
                    priority
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Two Badges Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <BadgeCard type="blue" t={t} />
            <BadgeCard type="green" t={t} />
          </div>
        </div>
      </section>

      {/* Verification Process */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-gray-900">{t("processTitle")}</h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {processSteps.map((item, index) => (
                <ProcessStep key={item.step} item={item} index={index} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 shadow-md text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-900">{t(`features.feature${index + 1}.title`)}</h4>
                  <p className="text-gray-500 text-xs">{t(`features.feature${index + 1}.description`)}</p>
                </div>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-2xl shadow-md animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t("ctaTitle")} 🚀
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/echange"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {t("discoverEchange")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/transport"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
              >
                {t("discoverTransport")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Trokacha. {t("allRightsReserved")}
          </p>
        </div>
      </footer>
    </main>
  );
}
