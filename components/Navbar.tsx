"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SHOW_TRANSPORT } from "@/lib/featureFlags";
import Image from "next/image";

const localeNames: Record<string, string> = {
  fr: "FR",
  en: "EN",
  ar: "AR",
  kab: "KAB",
};

const localeFlags: Record<string, string> = {
  fr: "/flags/fr.png",
  en: "/flags/gb.png",
  ar: "/flags/dz.png",
  kab: "/flags/amazigh.png",
};

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isHomePage = pathname === "/" || pathname === "";

  const navLinks = [
    { href: "/echange", label: t("echange"), isSection: false },
    ...(SHOW_TRANSPORT ? [{ href: "/transport", label: t("transport"), isSection: false }] : []),
    { href: "/chat", label: t("chat"), isSection: false },
    { href: "/verification", label: t("verification"), isSection: false },
    { href: "/contact", label: t("contact"), isSection: false },
  ];

  const mobileNavLinks = [
    { href: "/", label: t("home"), isSection: false },
    ...(isHomePage ? [{ href: "#features", label: t("features"), isSection: true }] : []),
    { href: "/echange", label: t("echange"), isSection: false },
    ...(SHOW_TRANSPORT ? [{ href: "/transport", label: t("transport"), isSection: false }] : []),
    { href: "/chat", label: t("chat"), isSection: false },
    { href: "/verification", label: t("verification"), isSection: false },
    ...(isHomePage ? [{ href: "#faq", label: t("faq"), isSection: true }] : []),
    { href: "/terms", label: t("terms"), isSection: false },
    { href: "/privacy", label: t("privacy"), isSection: false },
    { href: "/contact", label: t("contact"), isSection: false },
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLangMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`sticky top-0 left-0 right-0 z-[60] border-b border-line bg-paper/[0.86] backdrop-blur-md transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex h-[72px] items-center justify-between gap-6">
            <Link href="/" aria-label="Trokacha" className="shrink-0">
              <Image
                src="/logo-text.png"
                alt="Trokacha"
                width={295}
                height={351}
                className="h-11 w-auto md:h-12"
                priority
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) =>
                link.isSection ? (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="rounded-[10px] px-[14px] py-[9px] text-[15px] font-semibold text-inkSoft transition-colors hover:bg-paperHard"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-[10px] px-[14px] py-[9px] text-[15px] font-semibold text-inkSoft transition-colors hover:bg-paperHard"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            <div className="hidden items-center gap-[10px] md:flex">
              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="inline-flex items-center gap-[6px] rounded-full bg-paperHard px-3 py-[7px] text-[13px] font-bold tracking-[0.02em] text-inkSoft transition-colors hover:bg-line"
                >
                  <img src={localeFlags[locale]} alt="" className="h-4 w-5 rounded-sm object-cover" />
                  <span>{localeNames[locale]}</span>
                </button>

                <div
                  className={`absolute end-0 top-full mt-2 min-w-[120px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_32px_rgba(26,24,20,0.10)] transition-all duration-200 ${
                    isLangMenuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-2 opacity-0"
                  }`}
                >
                  {routing.locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-start font-medium transition-colors hover:bg-paperSoft ${
                        locale === loc ? "bg-cashBg text-cashInk" : "text-inkSoft"
                      }`}
                    >
                      <img src={localeFlags[loc]} alt="" className="h-4 w-5 rounded-sm object-cover" />
                      <span>{localeNames[loc]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => scrollToSection("#cta")}
                className="inline-flex items-center rounded-full bg-cash px-[18px] py-[10px] text-[14px] font-bold text-white shadow-cash transition-transform hover:scale-105"
              >
                {t("signup")}
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="rounded-lg p-2 text-inkSoft"
                aria-label="Langue"
              >
                <img src={localeFlags[locale]} alt="" className="h-5 w-6 rounded-sm object-cover" />
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-inkSoft"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile language menu */}
      <div
        className={`fixed inset-x-0 top-[72px] z-50 border-b border-line bg-paper shadow-[0_12px_32px_rgba(26,24,20,0.10)] md:hidden ${
          isLangMenuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        } transition-all duration-200`}
      >
        <div className="mx-auto flex justify-center gap-4 px-4 py-4">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors ${
                locale === loc ? "bg-cash text-white" : "bg-paperHard text-inkSoft"
              }`}
            >
              <img src={localeFlags[loc]} alt="" className="h-4 w-5 rounded-sm object-cover" />
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-0 top-[72px] z-40 border-b border-line bg-paper shadow-[0_12px_32px_rgba(26,24,20,0.10)] md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        } transition-all duration-200`}
      >
        <div className="mx-auto space-y-1 px-4 py-6">
          {mobileNavLinks.map((link) =>
            link.isSection ? (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full rounded-lg px-4 py-3 text-start font-medium text-inkSoft transition-colors hover:bg-paperSoft"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full rounded-lg px-4 py-3 text-start font-medium text-inkSoft transition-colors hover:bg-paperSoft"
              >
                {link.label}
              </Link>
            )
          )}
          <button
            onClick={() => scrollToSection("#cta")}
            className="w-full rounded-full bg-cash px-4 py-3 font-semibold text-white shadow-cash"
          >
            {t("signup")}
          </button>
        </div>
      </div>
    </>
  );
}
