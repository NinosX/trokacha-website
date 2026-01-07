"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Package, Car, MapPin, Clock, Shield, Users } from "lucide-react";

export default function TransportPage() {
  const t = useTranslations("transport");

  const colisSteps = [
    { icon: "📦", number: 1 },
    { icon: "🔍", number: 2 },
    { icon: "💬", number: 3 },
    { icon: "🚗", number: 4 },
    { icon: "📍", number: 5 },
    { icon: "⭐", number: 6 },
  ];

  const covoiturageSteps = [
    { icon: "🚗", number: 1 },
    { icon: "📅", number: 2 },
    { icon: "👥", number: 3 },
    { icon: "💺", number: 4 },
    { icon: "🛣️", number: 5 },
    { icon: "⭐", number: 6 },
  ];

  const features = [
    { icon: MapPin, color: "text-blue-500", bg: "bg-blue-100" },
    { icon: Clock, color: "text-green-500", bg: "bg-green-100" },
    { icon: Shield, color: "text-purple-500", bg: "bg-purple-100" },
    { icon: Users, color: "text-orange-500", bg: "bg-orange-100" },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 pt-32 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backHome")}
            </Link>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t("title")} 🚚
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>

            {/* Two modes */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <motion.a
                href="#colis"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-600 rounded-2xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Package className="w-6 h-6" />
                {t("colisMode")}
              </motion.a>
              <motion.a
                href="#covoiturage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-colors"
              >
                <Car className="w-6 h-6" />
                {t("covoiturageMode")}
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {t(`features.feature${index + 1}.title`)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t(`features.feature${index + 1}.description`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Colis Section */}
      <section id="colis" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Package className="w-4 h-4" />
              {t("colisSection.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("colisSection.title")} 📦
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("colisSection.subtitle")}
            </p>
          </motion.div>

          {/* Colis Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {colisSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{step.icon}</span>
                  <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {t(`colisSection.steps.step${step.number}.title`)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t(`colisSection.steps.step${step.number}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Covoiturage Section */}
      <section id="covoiturage" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
              <Car className="w-4 h-4" />
              {t("covoiturageSection.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("covoiturageSection.title")} 🚗
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("covoiturageSection.subtitle")}
            </p>
          </motion.div>

          {/* Covoiturage Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {covoiturageSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{step.icon}</span>
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {t(`covoiturageSection.steps.step${step.number}.title`)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t(`covoiturageSection.steps.step${step.number}.description`)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Real-time places info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 text-white text-center">
              <span className="text-5xl mb-4 block">🔴</span>
              <h3 className="text-2xl font-bold mb-3">
                {t("realtime.title")}
              </h3>
              <p className="text-white/90">
                {t("realtime.description")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("ctaTitle")} 🚀
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/echange"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 rounded-2xl font-semibold hover:bg-white/90 transition-colors"
              >
                {t("discoverEchange")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-colors"
              >
                {t("discoverChat")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
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
