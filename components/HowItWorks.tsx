"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      number: "01",
      title: t("step1.title"),
      description: t("step1.description"),
      icon: "📱",
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "02",
      title: t("step2.title"),
      description: t("step2.description"),
      icon: "📸",
      color: "from-purple-500 to-pink-500",
    },
    {
      number: "03",
      title: t("step3.title"),
      description: t("step3.description"),
      icon: "👆",
      color: "from-orange-500 to-red-500",
    },
    {
      number: "04",
      title: t("step4.title"),
      description: t("step4.description"),
      icon: "🤝",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 start-1/2 w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-100 rtl:bg-gradient-to-l" />
              )}

              <div className="relative bg-gray-50 rounded-3xl p-8 text-center hover:shadow-xl transition-shadow duration-300">
                {/* Number badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div className="text-6xl mb-6 mt-4">{step.icon}</div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
