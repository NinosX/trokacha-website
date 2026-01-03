"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";

interface EmailFormProps {
  variant?: "hero" | "cta";
}

export function EmailForm({ variant = "hero" }: EmailFormProps) {
  const t = useTranslations("emailForm");
  const tHero = useTranslations("hero");
  const tCta = useTranslations("cta");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(t("success"));
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || t("errorServer"));
      }
    } catch {
      setStatus("error");
      setMessage(t("errorConnection"));
    }

    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 4000);
  };

  const isHero = variant === "hero";

  if (status === "success") {
    return (
      <div className={`flex items-center justify-center gap-2 ${isHero ? "py-4" : "py-6"} text-green-400`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        required
        className={`flex-1 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 ${
          isHero ? "px-4 py-3" : "px-5 py-4 text-center sm:text-start"
        }`}
        dir="ltr"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed ${
          isHero ? "px-6 py-3" : "px-8 py-4 font-bold"
        }`}
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        ) : isHero ? tHero("notifyButton") : tCta("button")}
      </button>
      {status === "error" && (
        <p className="text-red-300 text-sm mt-2">{message}</p>
      )}
    </form>
  );
}
