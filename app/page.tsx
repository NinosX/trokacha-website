"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, ArrowRight, Repeat, ShoppingBag, Truck, Sparkles, Heart, MessageCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

// Animation du tutoriel de swipe
function SwipeTutorial() {
  const [step, setStep] = useState(0);

  const steps = [
    { icon: "📱", text: "Parcourez les annonces", emoji: "👀" },
    { icon: "❤️", text: "Cette annonce vous intéresse ?", emoji: "✨" },
    { icon: "🎯", text: "Choisissez une de vos annonces", emoji: "📦" },
    { icon: "👉", text: "Swipe à droite", emoji: "💫" },
    { icon: "✅", text: "Proposition envoyée !", emoji: "🎉" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
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
                Bientôt disponible
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                Trokacha
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed"
              >
                <span className="inline-flex items-center gap-2">
                  L'app qui fait <em className="font-semibold not-italic">tout</em> ✨
                </span>
                <br />
                <span className="text-lg text-white/80">
                  Troc • Vente • Achat • Transport de Colis • Covoiturage
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
                  <svg className="w-8 h-8 mr-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Bientôt sur</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </div>

                {/* Play Store Button - Coming Soon */}
                <div
                  className="inline-flex items-center justify-center px-6 py-4 bg-white/50 text-gray-500 rounded-2xl font-semibold cursor-not-allowed"
                >
                  <svg className="w-8 h-8 mr-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Bientôt sur</div>
                    <div className="text-lg font-bold">Play Store</div>
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
                  🔔 Soyez informé du lancement
                </div>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105"
                  >
                    M'avertir
                  </button>
                </form>
                <p className="text-white/60 text-xs mt-3">
                  Pas de spam, juste une notification au lancement 🚀
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
              Une seule app pour tout 🎯
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plus besoin de jongler entre plusieurs apps. Trokacha centralise tous vos besoins d'échange en Algérie
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                emoji: "🔄",
                title: "Troc & Échange",
                description: "Échangez vos biens avec d'autres utilisateurs en toute simplicité",
                color: "from-red-500 to-pink-500",
              },
              {
                emoji: "🛍️",
                title: "Vente & Achat",
                description: "Vendez ou achetez des articles en toute sécurité",
                color: "from-blue-500 to-cyan-500",
              },
              {
                emoji: "🚚",
                title: "Transport de Colis",
                description: "Envoyez ou transportez des colis partout en Algérie",
                color: "from-green-500 to-emerald-500",
              },
              {
                emoji: "🚗",
                title: "Covoiturage",
                description: "Partagez vos trajets et économisez sur vos déplacements",
                color: "from-yellow-500 to-orange-500",
              },
              {
                emoji: "⚡",
                title: "Interface Intuitive",
                description: "Système de swipe ultra-rapide et simple à utiliser",
                color: "from-purple-500 to-pink-500",
              },
              {
                emoji: "🎨",
                title: "Design Élégant",
                description: "Une expérience visuelle moderne et agréable",
                color: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
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
              Soyez parmi les premiers ! 🚀
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              L'app arrive bientôt. Inscrivez-vous pour être notifié dès le lancement et profiter d'avantages exclusifs.
            </p>

            {/* Email Form CTA */}
            <div className="max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="flex-1 px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-center sm:text-left"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105"
                >
                  Je m'inscris
                </button>
              </form>
              <p className="text-white/60 text-sm mt-4">
                🎁 Les premiers inscrits auront accès à des fonctionnalités exclusives
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
                L'app algérienne qui fait tout
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Liens Utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/terms" className="hover:text-white transition-colors">Conditions d'Utilisation</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Politique de Confidentialité</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:contact@trokacha.com" className="hover:text-white transition-colors">contact@trokacha.com</a></li>
                <li><a href="mailto:support@trokacha.com" className="hover:text-white transition-colors">support@trokacha.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="text-gray-500 text-sm">
              © 2025 Trokacha. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
