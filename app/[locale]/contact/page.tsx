import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("title")} - Trokacha`,
    description: t("subtitle"),
  };
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tFooter = await getTranslations("footer");
  const tPrivacy = await getTranslations("privacy");

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-line bg-paperSoft px-6 pb-10 pt-14">
        <div className="mx-auto max-w-[1000px]">
          <Link href="/" className="mb-6 inline-flex items-center gap-[7px] text-[14px] font-semibold text-inkMuted transition-colors hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={2} className="rtl:rotate-180">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            {tPrivacy("backHome")}
          </Link>
          <span className="mb-[14px] inline-flex items-center gap-[10px] text-[12px] font-bold uppercase tracking-[0.16em] text-inkMuted">
            <span className="h-[3px] w-[26px] rounded-[2px] dz-bar" />
            {tFooter("contact")}
          </span>
          <h1 className="mb-3 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[44px]">
            {t("title")}
          </h1>
          <p className="text-[18px] leading-[1.6] text-inkSoft">{t("subtitle")}</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-20 pt-14">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-2">
          {/* Coordonnées */}
          <div className="rounded-[22px] border border-line bg-white p-9 shadow-card">
            <h2 className="mb-[26px] font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
              {tFooter("contactTitle")}
            </h2>
            <div className="flex flex-col gap-[22px]">
              <div className="flex items-start gap-[15px]">
                <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] bg-cashBg text-cash">
                  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <div>
                  <h3 className="mb-[3px] text-[15px] font-bold text-ink">Email</h3>
                  <a href="mailto:contact@trokacha.com" className="text-[15px] text-cash hover:underline">
                    contact@trokacha.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-[15px]">
                <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] bg-matchBg text-match">
                  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <div>
                  <h3 className="mb-[3px] text-[15px] font-bold text-ink">Support</h3>
                  <a href="mailto:support@trokacha.com" className="text-[15px] text-cash hover:underline">
                    support@trokacha.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-[15px]">
                <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] bg-[#FEF3C7] text-warning">
                  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
                    <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
                    <circle cx="12" cy="9" r="3" />
                  </svg>
                </span>
                <div>
                  <h3 className="mb-[3px] text-[15px] font-bold text-ink">Localisation</h3>
                  <p className="text-[15px] text-inkSoft">Algérie</p>
                </div>
              </div>
            </div>
          </div>

          {/* Récap marque */}
          <div className="rounded-[22px] bg-ink p-9 text-line2">
            <div className="mb-4 flex items-center gap-[10px]">
              <Image src="/logo.png" alt="" width={512} height={512} className="h-8 w-8" />
              <span className="font-display text-[20px] font-bold tracking-[-0.03em] text-paperSoft">trokacha</span>
            </div>
            <p className="mb-6 text-[15px] leading-[1.6] text-inkMuted">{tFooter("tagline")}</p>
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[11px] rounded-xl bg-[#2A2620] px-[15px] py-[13px]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#3D1A1F] text-[#E27187]">
                  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
                    <path d="M4 7h14l-3-3M20 17H6l3 3" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold text-paperSoft">{tFooter("echange")}</span>
              </div>
              <div className="flex items-center gap-[11px] rounded-xl bg-[#2A2620] px-[15px] py-[13px]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#0E2B47] text-[#5FA8E8]">
                  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
                    <path d="M6 2l1.5 3h9L18 2M4 7h16l-1.5 12a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8z" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold text-paperSoft">Vente</span>
              </div>
              <div className="flex items-center gap-[11px] rounded-xl bg-[#2A2620] px-[15px] py-[13px]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#1A3D2E] text-[#5BB585]">
                  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
                    <path d="M12 3l9 4v5c0 5-4 9-9 9s-9-4-9-9V7z" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold text-paperSoft">{tFooter("verification")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
