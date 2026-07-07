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
const IconCheck = () => (
  <span className="text-match">
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  </span>
);

const IdCard = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15h4M14 9h4M14 12h3" /></>;
const Selfie = <><circle cx="12" cy="9" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></>;
const Account = <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
const Clock = <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2 2" /></>;
const CheckCircle = <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>;
const ShieldCheck = <><path d="M12 3l9 4v5c0 5-4 9-9 9s-9-4-9-9V7z" /><path d="M9 12l2 2 4-4" /></>;
const Star = <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />;
const Lock = <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>;
const Shield = <path d="M12 3l9 4v5c0 5-4 9-9 9s-9-4-9-9V7z" />;

const processItems = [Account, IdCard, Selfie, Clock, CheckCircle];

const featureItems = [
  { tint: "#0A66C2", tintBg: "#E6F0FA", icon: Account },
  { tint: "#D97706", tintBg: "#FEF3C7", icon: Star },
  { tint: "#C8324A", tintBg: "#FBE9EC", icon: Lock },
  { tint: "#2E8B57", tintBg: "#E6F2EB", icon: Shield },
];

const stats = [
  { value: "100%", color: "#5FA8E8" },
  { value: "24/7", color: "#5BB585" },
  { value: "5★", color: "#E8A94B" },
  { value: "0", color: "#E27187" },
];

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div ref={ref} className={`${className} ${isInView ? "animate-fade-in-up" : "opacity-0"}`}>
      {children}
    </div>
  );
}

export default function VerificationPage() {
  const t = useTranslations("security");

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-line bg-paperSoft px-6 pb-10 pt-14">
        <div className="mx-auto max-w-[1100px] text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-[7px] text-[14px] font-semibold text-inkMuted transition-colors hover:text-ink">
            <IconArrowLeft />
            {t("backHome")}
          </Link>
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-matchBg px-[15px] py-[7px] text-[13px] font-bold text-matchInk">
              {svg(Shield, 16)}
              {t("badge")}
            </span>
          </div>
          <h1 className="mb-4 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[46px]">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-[60ch] text-[18px] leading-[1.6] text-inkSoft">{t("subtitle")}</p>
        </div>
      </section>

      {/* Badge + phone */}
      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-11 md:grid-cols-[270px_1fr]">
          <div className="mx-auto w-[262px] justify-self-center rounded-[38px] bg-ink p-[9px] shadow-[0_24px_50px_rgba(26,24,20,0.24)]">
            <div className="aspect-[262/536] overflow-hidden rounded-[30px] bg-paperSoft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/screenshots/verif.png" alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <AnimatedSection className="relative rounded-[24px] border border-line bg-white p-9 shadow-card">
            <span className="absolute right-[26px] top-[26px] rounded-full bg-cashBg px-3 py-[5px] text-[12px] font-bold text-cashInk">
              {t("badges.blue.optional")}
            </span>
            <span className="mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-[17px] bg-cash text-white">
              {svg(ShieldCheck, 30)}
            </span>
            <h3 className="mb-[10px] font-display text-[24px] font-bold tracking-[-0.02em] text-cashInk">
              {t("badges.blue.title")}
            </h3>
            <p className="mb-[22px] text-[15px] leading-[1.6] text-inkSoft">{t("badges.blue.description")}</p>
            <div className="mb-[22px] flex flex-col gap-[11px]">
              <div className="flex items-center gap-[11px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-cashBg text-cash">{svg(IdCard, 17)}</span>
                <span className="text-[14.5px] text-inkSoft">{t("badges.blue.req1")}</span>
              </div>
              <div className="flex items-center gap-[11px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-cashBg text-cash">{svg(Selfie, 17)}</span>
                <span className="text-[14.5px] text-inkSoft">{t("badges.blue.req2")}</span>
              </div>
            </div>
            <div className="border-t border-line pt-[18px]">
              <p className="mb-[10px] text-[13px] font-bold text-cashInk">{t("badges.benefits")}</p>
              <ul className="flex flex-col gap-[7px]">
                <li className="flex items-center gap-2 text-[14px] text-inkMuted"><IconCheck />{t("badges.blue.benefit1")}</li>
                <li className="flex items-center gap-2 text-[14px] text-inkMuted"><IconCheck />{t("badges.blue.benefit2")}</li>
                <li className="flex items-center gap-2 text-[14px] text-inkMuted"><IconCheck />{t("badges.blue.benefit3")}</li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Process */}
      <section className="px-6 pb-10 pt-5">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-[34px] text-center font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            {t("processTitle")}
          </h2>
          <div className="flex flex-wrap items-start justify-between gap-2">
            {processItems.map((icon, i) => (
              <div key={i} className="flex min-w-[130px] flex-1 flex-col items-center gap-3 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-line bg-white text-cash shadow-card">
                  {svg(icon, 24)}
                </span>
                <div>
                  <div className="mb-[3px] font-display text-[13px] font-bold text-trade">0{i + 1}</div>
                  <div className="text-[13.5px] font-semibold leading-[1.4] text-inkSoft">{t(`process.step${i + 1}`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Piliers sécurité */}
      <section className="px-6 pb-[60px] pt-10">
        <div className="mx-auto grid max-w-[960px] grid-cols-2 gap-4 md:grid-cols-4">
          {featureItems.map((f, i) => (
            <div key={i} className="rounded-[18px] border border-line bg-white p-[22px] text-center shadow-card">
              <span className="mx-auto mb-[13px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px]" style={{ background: f.tintBg, color: f.tint }}>
                {svg(f.icon, 22)}
              </span>
              <h4 className="mb-[5px] text-[15px] font-bold text-ink">{t(`features.feature${i + 1}.title`)}</h4>
              <p className="text-[13px] leading-[1.5] text-inkMuted">{t(`features.feature${i + 1}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[960px] rounded-[24px] bg-ink px-10 py-11">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="mb-1 font-display text-[36px] font-bold" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-[13px] text-inkMuted">{t(`stats.stat${i + 1}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
