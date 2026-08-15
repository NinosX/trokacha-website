"use client";

import { EmailForm } from "@/components/EmailForm";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/openInApp";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useInView } from "@/hooks/useInView";
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";

// Lazy load composants below the fold
const HowItWorks = dynamic(() => import("@/components/HowItWorks").then((mod) => mod.HowItWorks), {
  loading: () => <div className="bg-paperSoft py-[70px]" />,
});
const FAQ = dynamic(() => import("@/components/FAQ").then((mod) => mod.FAQ), {
  loading: () => <div className="bg-paper py-[70px]" />,
});

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Icônes ligne
const IconSwap = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" {...stroke}>
    <path d="M4 7h14l-3-3M20 17H6l3 3" />
  </svg>
);
const IconChat = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" {...stroke}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconShield = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" {...stroke}>
    <path d="M12 3l9 4v5c0 5-4 9-9 9s-9-4-9-9V7z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IconTrophy = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" {...stroke}>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 0-3 3" />
  </svg>
);
const IconArrow = (p: { size?: number }) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const AppleIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);
const AndroidIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
  </svg>
);

// Petit trait bicolore (motif drapeau)
function EyebrowBar() {
  return <span className="h-[3px] w-[30px] rounded-[2px] dz-bar" />;
}

function SupportCard({
  icon,
  tint,
  tintBg,
  title,
  description,
  href,
  index,
}: {
  icon: React.ReactNode;
  tint: string;
  tintBg: string;
  title: string;
  description: string;
  href?: string;
  index: number;
}) {
  const { ref, isInView } = useInView();
  const inner = (
    <>
      <span
        className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-[15px]"
        style={{ background: tintBg, color: tint }}
      >
        {icon}
      </span>
      <h3 className="mb-2 text-[19px] font-bold text-ink">{title}</h3>
      <p className="text-[14.5px] leading-[1.55] text-inkMuted">{description}</p>
    </>
  );
  const cls = `block h-full rounded-card border border-line bg-white p-[28px] text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover ${
    isInView ? "animate-fade-in-up" : "opacity-0"
  }`;
  return (
    <div ref={ref} style={{ animationDelay: `${index * 0.1}s` }} className="h-full">
      {href ? (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </div>
  );
}

const heroScreens = [
  { src: "/screenshots/app-accueil.png", alt: "Accueil — parcourir les annonces" },
  { src: "/screenshots/app-annonce.png", alt: "Annonce — proposer un échange ou une offre cash" },
  { src: "/screenshots/app-offres.png", alt: "Suivi des propositions" },
  { src: "/screenshots/app-matchs.png", alt: "Vos matchs" },
  { src: "/screenshots/app-chat.png", alt: "Discussion intégrée" },
];

export default function Home() {
  const t = useTranslations();

  const categories = t("hero.description")
    .split(/[.·]/)
    .map((s) => s.trim())
    .filter((s) => s && !/transport|covoiturage|colis/i.test(s));

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* HERO */}
      <section className="px-6 pb-10 pt-[56px] md:pt-[72px]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-in-up">
            <span className="mb-[22px] inline-flex items-center gap-[11px] text-[12px] font-bold uppercase tracking-[0.16em] text-inkMuted">
              <EyebrowBar />
              {t("hero.badge")} · Algérie
            </span>
            <h1 className="mb-5 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.035em] text-ink text-balance md:text-[60px]">
              {t("hero.subtitle")}
            </h1>
            <p className="mb-[14px] max-w-[34ch] text-[19px] leading-[1.55] text-inkSoft text-pretty">
              {t("footer.tagline")}
            </p>

            <div className="mb-[30px] flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-line bg-paperSoft px-3 py-[5px] text-[13px] font-semibold text-inkMuted"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Mobile carousel */}
            <div className="mb-8 lg:hidden">
              <ScreenshotCarousel size="compact" screenshots={heroScreens} />
            </div>

            <div className="mb-[26px] flex flex-wrap gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[11px] rounded-2xl bg-ink px-[22px] py-[14px] font-semibold text-paperSoft transition-transform hover:scale-[1.03]"
              >
                <AppleIcon />
                <span className="text-left">
                  <span className="block text-[11px] opacity-70">{t("hero.appStore")}</span>
                  <span className="block text-[16px] font-bold">{t("hero.download")} iOS</span>
                </span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[11px] rounded-2xl border border-line bg-white px-[22px] py-[14px] font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                <AndroidIcon />
                <span className="text-left">
                  <span className="block text-[11px] opacity-60">{t("hero.playStore")}</span>
                  <span className="block text-[16px] font-bold">{t("hero.download")} Android</span>
                </span>
              </a>
            </div>

            {/* Social proof */}
            <div className="inline-flex items-center gap-[11px]">
              <span className="flex">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-paper bg-cash text-[13px] font-bold text-white">A</span>
                <span className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-paper bg-trade text-[13px] font-bold text-white">K</span>
                <span className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-paper bg-match text-[13px] font-bold text-white">S</span>
              </span>
              <span className="text-[14px] font-semibold text-inkSoft">
                {t("socialProof.text", { count: "50" })}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="hidden animate-fade-in-up justify-center lg:flex">
            <div className="relative w-[320px] animate-float">
              <ScreenshotCarousel screenshots={heroScreens} />
            </div>
          </div>
        </div>
      </section>

      {/* PILIERS / FEATURES */}
      <section id="features" className="px-6 py-[70px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-12 max-w-[620px] text-center">
            <span className="mb-4 inline-flex items-center gap-[10px] text-[12px] font-bold uppercase tracking-[0.16em] text-inkMuted">
              <span className="h-[3px] w-[24px] rounded-[2px] dz-bar" />
              {t("navbar.features")}
              <span className="h-[3px] w-[24px] rounded-[2px] dz-bar" />
            </span>
            <h2 className="mb-3 font-display text-[38px] font-bold tracking-[-0.025em] text-ink">
              {t("features.title")}
            </h2>
            <p className="text-[17px] leading-[1.6] text-inkMuted">{t("features.subtitle")}</p>
          </div>

          {/* Grand pilier Troc/Vente/Achat */}
          <Link
            href="/echange"
            className="group mb-5 block overflow-hidden rounded-[24px] border border-line bg-white shadow-card transition-shadow hover:shadow-cardHover"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-10">
                <span className="mb-[22px] flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-tradeBg text-trade">
                  <IconSwap size={30} />
                </span>
                <h3 className="mb-3 font-display text-[26px] font-bold tracking-[-0.02em] text-ink">
                  {t("features.trocVenteAchat.title")}
                </h3>
                <p className="mb-5 max-w-[44ch] text-[16px] leading-[1.6] text-inkSoft">
                  {t("features.trocVenteAchat.description")}
                </p>
                <span className="inline-flex items-center gap-2 text-[15px] font-bold text-trade transition-all group-hover:gap-3">
                  {t("features.learnMore")}
                  <IconArrow />
                </span>
              </div>
              <div className="relative hidden items-center justify-center border-l border-line bg-paperSoft p-8 md:flex">
                <div className="w-[150px] rounded-[26px] bg-ink p-[5px] shadow-[0_18px_40px_rgba(26,24,20,0.2)]">
                  <div className="aspect-[1320/2868] overflow-hidden rounded-[21px] bg-paperSoft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/screenshots/app-annonce.png" alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 3 supports */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SupportCard
              index={0}
              icon={<IconChat size={26} />}
              tint="#0A66C2"
              tintBg="#E6F0FA"
              title={t("features.chat.title")}
              description={t("features.chat.description")}
              href="/chat"
            />
            <SupportCard
              index={1}
              icon={<IconShield size={26} />}
              tint="#2E8B57"
              tintBg="#E6F2EB"
              title={t("features.verification.title")}
              description={t("features.verification.description")}
              href="/verification"
            />
            <SupportCard
              index={2}
              icon={<IconTrophy size={26} />}
              tint="#D97706"
              tintBg="#FEF3C7"
              title={t("features.gamification.title")}
              description={t("features.gamification.description")}
            />
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <HowItWorks />

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <section id="cta" className="px-6 pb-20 pt-5">
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] bg-ink px-10 py-[60px] text-center">
          <span className="mb-6 inline-block h-[4px] w-[56px] rounded-[2px] dz-bar" />
          <h2 className="mb-[14px] font-display text-[40px] font-bold tracking-[-0.025em] text-paperSoft">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mb-[30px] max-w-[52ch] text-[18px] leading-[1.55] text-line2">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[11px] rounded-2xl bg-paperSoft px-6 py-[14px] font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              <AppleIcon />
              {t("hero.appStore")}
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[11px] rounded-2xl border border-inkSoft bg-transparent px-6 py-[14px] font-bold text-paperSoft transition-colors hover:bg-white/5"
            >
              <AndroidIcon />
              {t("hero.playStore")}
            </a>
          </div>

          {/* Notification email (optionnel) */}
          <div className="mx-auto mt-9 max-w-md border-t border-inkSoft pt-7">
            <p className="mb-3 text-sm text-line2">{t("hero.notifyTitle")}</p>
            <EmailForm variant="cta" />
            <p className="mt-3 text-xs text-inkMuted">{t("hero.notifyNote")}</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
