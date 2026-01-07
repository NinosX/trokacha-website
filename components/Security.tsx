"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Shield, UserCheck, Star, Lock, BadgeCheck, Car, Package } from "lucide-react";

export function Security() {
  const t = useTranslations("security");

  const features = [
    {
      icon: UserCheck,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Star,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: Lock,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Shield,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  return (
    <section id="security" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium mb-6">
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

        {/* Two Badges Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
          {/* Blue Badge - Identity */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/30 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-blue-500/30 text-blue-300 text-xs font-medium rounded-full">
                {t("badges.blue.optional")}
              </span>
            </div>

            {/* Badge icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <BadgeCheck className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3 text-blue-300">{t("badges.blue.title")}</h3>
            <p className="text-white/70 mb-6">{t("badges.blue.description")}</p>

            {/* Requirements */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg">🪪</span>
                </div>
                <span className="text-white/80">{t("badges.blue.req1")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg">🤳</span>
                </div>
                <span className="text-white/80">{t("badges.blue.req2")}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="pt-4 border-t border-blue-500/20">
              <p className="text-sm text-blue-300 font-medium mb-2">{t("badges.benefits")}</p>
              <ul className="text-sm text-white/60 space-y-1">
                <li>✓ {t("badges.blue.benefit1")}</li>
                <li>✓ {t("badges.blue.benefit2")}</li>
                <li>✓ {t("badges.blue.benefit3")}</li>
              </ul>
            </div>
          </motion.div>

          {/* Green Badge - Driver/Transporter */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-3xl p-8 border border-green-500/30 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-500/30 text-green-300 text-xs font-medium rounded-full">
                {t("badges.green.required")}
              </span>
            </div>

            {/* Badge icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
              <BadgeCheck className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3 text-green-300">{t("badges.green.title")}</h3>
            <p className="text-white/70 mb-6">{t("badges.green.description")}</p>

            {/* Requirements */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg">🪪</span>
                </div>
                <span className="text-white/80">{t("badges.green.req1")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg">🤳</span>
                </div>
                <span className="text-white/80">{t("badges.green.req2")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg">🚗</span>
                </div>
                <span className="text-white/80">{t("badges.green.req3")}</span>
              </div>
            </div>

            {/* Who needs it */}
            <div className="pt-4 border-t border-green-500/20">
              <p className="text-sm text-green-300 font-medium mb-2">{t("badges.green.whoNeeds")}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full text-xs text-white/80">
                  <Car className="w-3 h-3" /> {t("badges.green.driver")}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full text-xs text-white/80">
                  <Package className="w-3 h-3" /> {t("badges.green.transporter")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Verification Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20"
        >
          <h3 className="text-2xl font-bold text-center mb-10">{t("processTitle")}</h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {[
              { icon: "📱", step: 1 },
              { icon: "🪪", step: 2 },
              { icon: "🤳", step: 3 },
              { icon: "⏳", step: 4 },
              { icon: "✅", step: 5 },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-3">
                    {item.icon}
                  </div>
                  <span className="text-sm text-white/80 text-center max-w-[100px]">
                    {t(`process.step${item.step}`)}
                  </span>
                </motion.div>
                {index < 4 && (
                  <div className="hidden md:block w-12 h-0.5 bg-white/20 mx-2" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
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
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h4 className="font-semibold text-sm mb-1">{t(`features.feature${index + 1}.title`)}</h4>
                <p className="text-white/50 text-xs">{t(`features.feature${index + 1}.description`)}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: "100%", label: t("stats.stat1"), color: "text-blue-400" },
            { value: "24/7", label: t("stats.stat2"), color: "text-green-400" },
            { value: "5★", label: t("stats.stat3"), color: "text-yellow-400" },
            { value: "0", label: t("stats.stat4"), color: "text-red-400" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 bg-white/5 rounded-2xl"
            >
              <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
