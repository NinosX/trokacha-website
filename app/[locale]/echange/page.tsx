"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { VideoPhone } from "@/components/VideoPhone";
import { useState } from "react";

const steps = [
  { number: 1, icon: "📝", color: "from-blue-500 to-cyan-500", timestamp: 0 },
  { number: 2, icon: "👀", color: "from-purple-500 to-pink-500", timestamp: 5 },
  { number: 3, icon: "💡", color: "from-orange-500 to-amber-500", timestamp: 10 },
  { number: 4, icon: "🎯", color: "from-green-500 to-emerald-500", timestamp: 15 },
  { number: 5, icon: "🤝", color: "from-indigo-500 to-purple-500", timestamp: 20 },
  { number: 6, icon: "📦", color: "from-teal-500 to-cyan-500", timestamp: 25 },
  { number: 7, icon: "⭐", color: "from-yellow-500 to-orange-500", timestamp: 30 },
];

function StepItem({ 
  step, 
  index, 
  t, 
  isActive 
}: { 
  step: typeof steps[0]; 
  index: number; 
  t: (key: string) => string;
  isActive: boolean;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-500 ${
        isActive ? "scale-105" : "scale-100 opacity-70"
      } ${isInView ? (index % 2 === 0 ? "animate-slide-in-left" : "animate-slide-in-right") : "opacity-0"}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`flex items-start gap-6 ${index % 2 === 1 ? "flex-row-reverse" : ""}`}>
        <div className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transition-all duration-300 ${isActive ? "ring-4 ring-white/50 shadow-xl" : ""}`}>
          <span className="text-4xl">{step.icon}</span>
        </div>

        <div className={`flex-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-300 ${index % 2 === 1 ? "text-right" : ""} ${isActive ? "border-primary/30 shadow-xl" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${step.color} text-white text-sm font-bold`}>
              {step.number}
            </span>
            <h3 className="text-xl font-bold text-gray-900">
              {t(`steps.step${step.number}.title`)}
            </h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {t(`steps.step${step.number}.description`)}
          </p>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-500">
                {t(`steps.step${step.number}.tip`)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {index < steps.length - 1 && (
        <div className="absolute left-10 top-20 w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent" />
      )}
    </div>
  );
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div ref={ref} className={`${className} ${isInView ? "animate-fade-in-up" : "opacity-0"}`}>
      {children}
    </div>
  );
}

export default function EchangePage() {
  const t = useTranslations("echange");
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary pt-32 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
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
              {t("title")} 🔄
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section with Video */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("stepsTitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("stepsSubtitle")}
            </p>
          </AnimatedSection>

          {/* Video Phone */}
          <div className="flex justify-center mb-16">
            <VideoPhone 
              src="/videos/troc-vente.mp4"
              steps={steps}
              onStepChange={setActiveStep}
            />
          </div>

          {/* Steps */}
          <div className="space-y-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <StepItem 
                key={step.number} 
                step={step} 
                index={index} 
                t={t}
                isActive={index === activeStep}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary text-white">
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
                href="/transport"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-2xl font-semibold hover:bg-white/90 transition-colors"
              >
                {t("discoverTransport")}
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
