"use client";

import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/useInView";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
  tintBg: string;
  badge: string;
};

function StepCard({ step, index }: { step: Step; index: number }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`relative rounded-card border border-line bg-white p-[30px_24px] shadow-card ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Numéro */}
      <span
        className="absolute -top-[15px] left-[26px] flex h-[34px] w-[34px] items-center justify-center rounded-[11px] font-display text-[15px] font-bold text-white"
        style={{ background: step.badge }}
      >
        {step.number}
      </span>

      {/* Icône */}
      <span
        className="my-4 mt-[14px] flex h-12 w-12 items-center justify-center rounded-[14px]"
        style={{ background: step.tintBg, color: step.tint }}
      >
        {step.icon}
      </span>

      <h3 className="mb-2 text-[17px] font-bold text-ink">{step.title}</h3>
      <p className="text-[14px] leading-[1.55] text-inkMuted">{step.description}</p>
    </div>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const { ref: headerRef, isInView: headerInView } = useInView();

  const steps: Step[] = [
    {
      number: "01",
      title: t("step1.title"),
      description: t("step1.description"),
      tint: "#0A66C2",
      tintBg: "#E6F0FA",
      badge: "#0A66C2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      ),
    },
    {
      number: "02",
      title: t("step2.title"),
      description: t("step2.description"),
      tint: "#0A66C2",
      tintBg: "#E6F0FA",
      badge: "#0A66C2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M4 17l5-4 5 4 3-2 3 2" />
        </svg>
      ),
    },
    {
      number: "03",
      title: t("step3.title"),
      description: t("step3.description"),
      tint: "#C8324A",
      tintBg: "#FBE9EC",
      badge: "#C8324A",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
          <path d="M4 7h14l-3-3M20 17H6l3 3" />
        </svg>
      ),
    },
    {
      number: "04",
      title: t("step4.title"),
      description: t("step4.description"),
      tint: "#2E8B57",
      tintBg: "#E6F2EB",
      badge: "#2E8B57",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="border-y border-line bg-paperSoft px-6 py-[70px]"
    >
      <div className="mx-auto max-w-[1100px]">
        <div
          ref={headerRef}
          className={`mx-auto mb-[52px] max-w-[600px] text-center ${
            headerInView ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h2 className="mb-3 font-display text-[38px] font-bold tracking-[-0.025em] text-ink">
            {t("title")}
          </h2>
          <p className="text-[17px] leading-[1.6] text-inkMuted">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
