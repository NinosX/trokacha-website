"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/useInView";
import { SHOW_TRANSPORT } from "@/lib/featureFlags";

function FAQItem({ faq, index, isOpen, onToggle }: { faq: { question: string; answer: string }; index: number; isOpen: boolean; onToggle: () => void }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-2xl border border-line bg-white ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-[22px] py-5 text-start"
      >
        <span className="text-[16.5px] font-bold text-ink pe-2">{faq.question}</span>
        <div
          className={`flex-shrink-0 text-inkMuted transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-[22px] pb-5 text-[15px] leading-[1.65] text-inkSoft">
            {faq.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref: headerRef, isInView: headerInView } = useInView();

  const faqs = [
    {
      question: t("questions.q1.question"),
      answer: t("questions.q1.answer"),
    },
    {
      question: t("questions.q2.question"),
      answer: t("questions.q2.answer"),
    },
    ...(SHOW_TRANSPORT ? [{
      question: t("questions.q3.question"),
      answer: t("questions.q3.answer"),
    }] : []),
    {
      question: t("questions.q4.question"),
      answer: t("questions.q4.answer"),
    },
    {
      question: t("questions.q5.question"),
      answer: t("questions.q5.answer"),
    },
    ...(SHOW_TRANSPORT ? [{
      question: t("questions.q6.question"),
      answer: t("questions.q6.answer"),
    }] : []),
  ];

  return (
    <section id="faq" className="bg-paper px-6 py-[70px]">
      <div className="mx-auto max-w-[760px]">
        <div
          ref={headerRef}
          className={`mb-11 text-center ${headerInView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="mb-3 font-display text-[38px] font-bold tracking-[-0.025em] text-ink">
            {t("title")}
          </h2>
          <p className="text-[17px] leading-[1.6] text-inkMuted">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto flex max-w-[760px] flex-col gap-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
