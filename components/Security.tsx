"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Shield, UserCheck, Star, Lock, BadgeCheck, Eye } from "lucide-react";

export function Security() {
  const t = useTranslations("security");

  const features = [
    {
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: BadgeCheck,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Star,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: Lock,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const verificationSteps = [
    { icon: "📱", step: 1 },
    { icon: "🪪", step: 2 },
    { icon: "🤳", step: 3 },
    { icon: "✅", step: 4 },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            {t("badge")}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t("title")} 🛡️
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left: Verification process */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl font-bold mb-8">{t("verificationTitle")}</h3>

            <div className="space-y-6">
              {verificationSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </span>
                      <h4 className="font-semibold">{t(`steps.step${item.step}.title`)}</h4>
                    </div>
                    <p className="text-white/60 text-sm">{t(`steps.step${item.step}.description`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust badge preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{t("badgePreview.title")}</span>
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      {t("badgePreview.verified")}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{t("badgePreview.description")}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Security features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h4 className="font-bold mb-2">{t(`features.feature${index + 1}.title`)}</h4>
                  <p className="text-white/60 text-sm">{t(`features.feature${index + 1}.description`)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: "100%", label: t("stats.stat1") },
            { value: "24/7", label: t("stats.stat2") },
            { value: "5★", label: t("stats.stat3") },
            { value: "0", label: t("stats.stat4") },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 bg-white/5 rounded-2xl"
            >
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
