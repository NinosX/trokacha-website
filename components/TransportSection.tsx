"use client";

import { motion } from "framer-motion";
import { Package, MapPin, Shield, Clock, Users, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const routes = [
  { from: "Alger", to: "Oran", emoji: "🚗" },
  { from: "Constantine", to: "Annaba", emoji: "🚐" },
  { from: "Setif", to: "Bejaia", emoji: "🚙" },
  { from: "Tlemcen", to: "Alger", emoji: "🚗" },
];

export function TransportSection() {
  const t = useTranslations("transportSection");

  const features = [
    {
      icon: Package,
      title: t("features.send.title"),
      description: t("features.send.description"),
    },
    {
      icon: Clock,
      title: t("features.fast.title"),
      description: t("features.fast.description"),
    },
    {
      icon: Shield,
      title: t("features.secure.title"),
      description: t("features.secure.description"),
    },
    {
      icon: Users,
      title: t("features.community.title"),
      description: t("features.community.description"),
    },
  ];

  return (
    <section id="transport" className="py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-[200px]">🚚</div>
        <div className="absolute bottom-20 right-10 text-[150px]">📦</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <Truck className="w-4 h-4" />
              {t("badge")}
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("title")}
            </h2>

            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {t("subtitle")}
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right content - Animated routes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("popularRoutes")}
              </h3>

              <div className="space-y-4">
                {routes.map((route, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-3xl">{route.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{route.from}</span>
                        <span className="text-white/50">→</span>
                        <span className="font-semibold">{route.to}</span>
                      </div>
                      <p className="text-sm text-white/60">{t("transportersAvailable")}</p>
                    </div>
                    <div className="text-end">
                      <div className="text-sm text-white/60">{t("startingFrom")}</div>
                      <div className="font-bold">500 DA</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-white/60 text-sm mt-6">
                {t("moreRoutes")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
