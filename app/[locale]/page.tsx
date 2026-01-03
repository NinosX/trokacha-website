"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { EmailForm } from "@/components/EmailForm";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { TransportSection } from "@/components/TransportSection";
import { AlgeriaMap } from "@/components/AlgeriaMap";
import { FAQ } from "@/components/FAQ";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Animation du tutoriel de swipe
function SwipeTutorial() {
  const t = useTranslations("swipeTutorial");
  const [step, setStep] = useState(0);

  const steps = [
    { icon: "📱", text: t("step1"), emoji: "👀" },
    { icon: "❤️", text: t("step2"), emoji: "✨" },
    { icon: "🎯", text: t("step3"), emoji: "📦" },
    { icon: "👉", text: t("step4"), emoji: "💫" },
    { icon: "✅", text: t("step5"), emoji: "🎉" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      {/* Phone mockup */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-[320px] h-[600px]"
      >
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Animated content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-8xl mb-6"
                >
                  {steps[step].icon}
                </motion.div>
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  {steps[step].text}
                </motion.h3>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-4xl"
                >
                  {steps[step].emoji}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Swipe indicator */}
            {step === 3 && (
              <motion.div
                initial={{ x: "50%", opacity: 0 }}
                animate={{ x: ["50%", "80%", "50%"], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-20 left-0 right-0 flex justify-center"
              >
                <div className="bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-lg">
                  👉 Swipe →
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Floating emojis */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-8 -right-8 text-6xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -bottom-8 -left-8 text-6xl"
        >
          💫
        </motion.div>
      </motion.div>

      {/* Step indicators */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-8">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === step ? "w-8 bg-white" : "w-2 bg-white/30"
            }`}
          />
        ))}
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
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
          >
            <span className="text-3xl mb-1">{feature.icon}</span>
            <span className="text-sm font-medium">{feature.text}</span>
          </motion.div>
        ))}
      </div>
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
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {t("hero.badge")}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                {t("hero.title")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed"
              >
                <span className="inline-flex items-center gap-2">
                  {t("hero.subtitle")} ✨
                </span>
                <br />
                <span className="text-lg text-white/80">
                  {t("hero.description")}
                </span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                {/* App Store Button - Coming Soon */}
                <div
                  className="inline-flex items-center justify-center px-6 py-4 bg-black/50 text-white/70 rounded-2xl font-semibold cursor-not-allowed"
                >
                  <svg className="w-8 h-8 me-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-start">
                    <div className="text-xs opacity-80">{t("hero.comingSoon")}</div>
                    <div className="text-lg font-bold">{t("hero.appStore")}</div>
                  </div>
                </div>

                {/* Play Store Button - Coming Soon */}
                <div
                  className="inline-flex items-center justify-center px-6 py-4 bg-white/50 text-gray-500 rounded-2xl font-semibold cursor-not-allowed"
                >
                  <svg className="w-8 h-8 me-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-start">
                    <div className="text-xs opacity-80">{t("hero.comingSoon")}</div>
                    <div className="text-lg font-bold">{t("hero.playStore")}</div>
                  </div>
                </div>
              </motion.div>

              {/* Email Notification Form */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md"
              >
                <div className="text-lg font-semibold mb-3 flex items-center gap-2">
                  🔔 {t("hero.notifyTitle")}
                </div>
                <EmailForm variant="hero" />
                <p className="text-white/60 text-xs mt-3">
                  {t("hero.notifyNote")} 🚀
                </p>
              </motion.div>
            </motion.div>

            {/* Right Content - Animated Tutorial */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative lg:flex justify-center hidden"
            >
              <SwipeTutorial />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t("features.title")} 🎯
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {featuresList.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <span className="text-5xl">{feature.emoji}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* How it works */}
      <HowItWorks />

      {/* Transport Section */}
      <TransportSection />

      {/* Algeria Map */}
      <AlgeriaMap />

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
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
          </motion.div>
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
