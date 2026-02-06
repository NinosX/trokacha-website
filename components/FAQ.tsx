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
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-start"
      >
        <span className="font-semibold text-gray-900 pe-4">{faq.question}</span>
        <div
          className={`flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5 text-gray-600 leading-relaxed">
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
    <section id="faq" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`text-center mb-16 ${headerInView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
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
