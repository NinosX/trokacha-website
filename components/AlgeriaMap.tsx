"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function AlgeriaMap() {
  const t = useTranslations("algeriaMap");

  const regions = [
    { name: t("regions.nord"), cities: ["Alger", "Oran", "Constantine", "Annaba"], emoji: "🏙️" },
    { name: t("regions.centre"), cities: ["Setif", "Bejaia", "Tizi Ouzou", "Blida"], emoji: "🏔️" },
    { name: t("regions.ouest"), cities: ["Tlemcen", "Sidi Bel Abbes", "Mostaganem"], emoji: "🌊" },
    { name: t("regions.est"), cities: ["Batna", "Biskra", "Jijel", "Skikda"], emoji: "🌄" },
    { name: t("regions.sud"), cities: ["Ghardaia", "Ouargla", "Bechar", "Tamanrasset"], emoji: "🏜️" },
  ];

  const stats = [
    { value: "69", label: t("stats.wilayas") },
    { value: "100%", label: t("stats.coverage") },
    { value: "24/7", label: t("stats.available") },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {t("title")} 🇩🇿
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Regions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-16">
          {regions.map((region, index) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="text-3xl mb-3">{region.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-2">{region.name}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {region.cities.map((city) => (
                  <li key={city} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    {city}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
