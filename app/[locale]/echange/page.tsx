"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { useInView } from "@/hooks/useInView";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/openInApp";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconSwap = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
    <path d="M4 7h14l-3-3M20 17H6l3 3" />
  </svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const IconArrowRight = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconCheck = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </svg>
);

// Teintes par étape (cash / cash / trade / match / match / cash / warning)
const stepTints = [
  { tint: "#0A66C2", tintBg: "#E6F0FA" },
  { tint: "#0A66C2", tintBg: "#E6F0FA" },
  { tint: "#C8324A", tintBg: "#FBE9EC" },
  { tint: "#2E8B57", tintBg: "#E6F2EB" },
  { tint: "#2E8B57", tintBg: "#E6F2EB" },
  { tint: "#0A66C2", tintBg: "#E6F0FA" },
  { tint: "#D97706", tintBg: "#FEF3C7" },
];

function StepItem({ n, t }: { n: number; t: (key: string) => string }) {
  const { ref, isInView } = useInView();
  const { tint, tintBg } = stepTints[n - 1];

  return (
    <div
      ref={ref}
      className={`flex gap-[18px] rounded-card border border-line bg-white p-6 shadow-card ${
        isInView ? "animate-fade-in-up" : "opacity-0"
      }`}
    >
      <span
        className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] font-display text-[17px] font-bold"
        style={{ background: tintBg, color: tint }}
      >
        {n}
      </span>
      <div>
        <h3 className="mb-2 text-[18px] font-bold text-ink">{t(`steps.step${n}.title`)}</h3>
        <p className="mb-3 text-[15px] leading-[1.6] text-inkSoft">{t(`steps.step${n}.description`)}</p>
        <div className="flex items-start gap-[9px] rounded-xl bg-paperSoft px-[14px] py-[11px]">
          <span className="mt-[1px] flex-none text-match">
            <IconCheck />
          </span>
          <span className="text-[13.5px] leading-[1.5] text-inkMuted">{t(`steps.step${n}.tip`)}</span>
        </div>
      </div>
    </div>
  );
}

export default function EchangePage() {
  const t = useTranslations("echange");
  const tHero = useTranslations("hero");
  const steps = [1, 2, 3, 4, 5, 6, 7];

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-line bg-paperSoft px-6 pb-10 pt-14">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/"
            className="mb-[26px] inline-flex items-center gap-[7px] text-[14px] font-semibold text-inkMuted transition-colors hover:text-ink"
          >
            <IconArrowLeft />
            {t("backHome")}
          </Link>
          <div className="max-w-[640px]">
            <span className="mb-4 inline-flex items-center gap-[10px] text-[12px] font-bold uppercase tracking-[0.16em] text-trade">
              <IconSwap />
              Troc · Vente · Achat
            </span>
            <h1 className="mb-4 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[46px]">
              {t("title")}
            </h1>
            <p className="text-[18px] leading-[1.6] text-inkSoft">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Parcours */}
      <section className="px-6 pb-[30px] pt-[60px]">
        <div className="mx-auto max-w-[960px]">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[300px_1fr]">
            {/* Sticky phone */}
            <div className="static flex flex-col items-center gap-4 md:sticky md:top-[96px]">
              <div className="w-[270px] rounded-[40px] bg-ink p-[6px] shadow-[0_24px_50px_rgba(26,24,20,0.24)]">
                <div className="aspect-[1320/2868] overflow-hidden rounded-[34px] bg-paperSoft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/screenshots/app-annonce.png" alt="" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-[14px] py-2 text-[13px] font-bold text-inkSoft">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cash text-[11px] font-extrabold text-white">€</span>
                Cash&nbsp;·&nbsp;
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-trade">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h14l-3-3M20 17H6l3 3" />
                  </svg>
                </span>
                Troc
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-4">
              {steps.map((n) => (
                <StepItem key={n} n={n} t={t} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* mini CTA */}
      <section className="px-6 pb-20 pt-[30px]">
        <div className="mx-auto max-w-[960px] rounded-[24px] border border-[#F3C9D1] bg-tradeBg px-10 py-11 text-center">
          <h2 className="mb-[10px] font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mb-6 max-w-[46ch] text-[16px] leading-[1.55] text-inkSoft">
            {t("ctaSubtitle")}
          </p>
          <div className="mx-auto flex w-full max-w-[360px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-[22px] py-[13px] text-[15px] font-bold text-paperSoft transition-transform hover:scale-[1.03] sm:w-auto"
            >
              {tHero("download")} iOS
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-[22px] py-[13px] text-[15px] font-bold text-paperSoft transition-transform hover:scale-[1.03] sm:w-auto"
            >
              {tHero("download")} Android
            </a>
            <Link
              href="/chat"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-white px-[22px] py-[13px] text-[15px] font-bold text-ink transition-colors hover:bg-paperSoft sm:w-auto"
            >
              {t("discoverChat")}
              <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
