"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { useInView } from "@/hooks/useInView";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const svg = (path: React.ReactNode, size = 24) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    {path}
  </svg>
);

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

const features = [
  { tint: "#0A66C2", tintBg: "#E6F0FA", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  { tint: "#C8324A", tintBg: "#FBE9EC", icon: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></> },
  { tint: "#2E8B57", tintBg: "#E6F2EB", icon: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M4 17l5-4 5 4 3-2 3 2" /></> },
  { tint: "#D97706", tintBg: "#FEF3C7", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></> },
  { tint: "#C8324A", tintBg: "#FBE9EC", icon: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /> },
  { tint: "#0A66C2", tintBg: "#E6F0FA", icon: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></> },
];

const useCases = [
  { tint: "#2E8B57", tintBg: "#E6F2EB", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2-3 2-3 .9-3 2.3 1.3 2.5 3 2.5 3-1.1 3-2.5" /></> },
  { tint: "#0A66C2", tintBg: "#E6F0FA", icon: <><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" /><circle cx="12" cy="9" r="3" /></> },
  { tint: "#D97706", tintBg: "#FEF3C7", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2 2" /></> },
  { tint: "#C8324A", tintBg: "#FBE9EC", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
];

function FeatureCard({ index, t }: { index: number; t: (key: string) => string }) {
  const { ref, isInView } = useInView();
  const f = features[index];
  return (
    <div
      ref={ref}
      className={`rounded-[18px] border border-line bg-white p-6 shadow-card ${isInView ? "animate-fade-in-up" : "opacity-0"}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <span className="mb-[15px] flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: f.tintBg, color: f.tint }}>
        {svg(f.icon)}
      </span>
      <h3 className="mb-1.5 text-[17px] font-bold text-ink">{t(`features.feature${index + 1}.title`)}</h3>
      <p className="text-[14px] leading-[1.55] text-inkMuted">{t(`features.feature${index + 1}.description`)}</p>
    </div>
  );
}

export default function ChatPage() {
  const t = useTranslations("chatPage");
  const tNav = useTranslations("navbar");

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-line bg-paperSoft px-6 pb-10 pt-14">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/" className="mb-[26px] inline-flex items-center gap-[7px] text-[14px] font-semibold text-inkMuted transition-colors hover:text-ink">
            <IconArrowLeft />
            {t("backHome")}
          </Link>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              <span className="mb-4 inline-flex items-center gap-[10px] text-[12px] font-bold uppercase tracking-[0.16em] text-cash">
                {svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, 20)}
                {tNav("chat")}
              </span>
              <h1 className="mb-4 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[46px]">
                {t("title")}
              </h1>
              <p className="max-w-[46ch] text-[18px] leading-[1.6] text-inkSoft">{t("subtitle")}</p>
            </div>

            {/* Chat — capture réelle */}
            <div className="mx-auto w-[280px] justify-self-center rounded-[40px] bg-ink p-[6px] shadow-[0_24px_50px_rgba(26,24,20,0.22)]">
              <div className="aspect-[1320/2868] overflow-hidden rounded-[34px] bg-paperSoft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/screenshots/app-chat.png" alt="Chat Trokacha" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 py-[60px]">
        <div className="mx-auto max-w-[1000px]">
          <div className="mx-auto mb-11 max-w-[560px] text-center">
            <h2 className="mb-[10px] font-display text-[34px] font-bold tracking-[-0.02em] text-ink">
              {t("featuresTitle")}
            </h2>
            <p className="text-[16px] leading-[1.6] text-inkMuted">{t("featuresSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {features.map((_, index) => (
              <FeatureCard key={index} index={index} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Négociation */}
      <section className="px-6 pb-[70px] pt-5">
        <div className="mx-auto max-w-[820px] rounded-[24px] border border-line bg-paperSoft px-10 py-11 text-center">
          <span className="mb-[18px] inline-flex items-center gap-2 rounded-full bg-cashBg px-[14px] py-[6px] text-[13px] font-bold text-cashInk">
            {t("marketplace.badge")}
          </span>
          <h2 className="mb-3 font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            {t("marketplace.title")}
          </h2>
          <p className="mx-auto mb-[30px] max-w-[56ch] text-[16px] leading-[1.6] text-inkSoft">
            {t("marketplace.description")}
          </p>
          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {useCases.map((u, i) => (
              <div key={i} className="flex items-start gap-[13px] rounded-[14px] border border-line bg-white p-4">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px]" style={{ background: u.tintBg, color: u.tint }}>
                  {svg(u.icon, 20)}
                </span>
                <div>
                  <h4 className="mb-1 text-[15px] font-bold text-ink">{t(`marketplace.useCases.case${i + 1}.title`)}</h4>
                  <p className="text-[13.5px] leading-[1.5] text-inkMuted">{t(`marketplace.useCases.case${i + 1}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
