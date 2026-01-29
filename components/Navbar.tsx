"use client";

import { useState, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Image from "next/image";

const localeNames: Record<string, string> = {
  fr: "FR",
  en: "EN",
  ar: "AR",
};

const localeFlags: Record<string, string> = {
  fr: "/flags/fr.png",
  en: "/flags/gb.png",
  ar: "/flags/dz.png",
};

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isHomePage = pathname === "/" || pathname === "";
  
  const navLinks = [
    ...(isHomePage ? [{ href: "#features", label: t("features"), isSection: true }] : []),
    { href: "/echange", label: t("echange"), isSection: false },
    { href: "/transport", label: t("transport"), isSection: false },
    { href: "/chat", label: t("chat"), isSection: false },
    { href: "/verification", label: t("verification"), isSection: false },
    ...(isHomePage ? [{ href: "#faq", label: t("faq"), isSection: true }] : []),
  ];

  const mobileNavLinks = [
    { href: "/", label: t("home"), isSection: false },
    ...(isHomePage ? [{ href: "#features", label: t("features"), isSection: true }] : []),
    { href: "/echange", label: t("echange"), isSection: false },
    { href: "/transport", label: t("transport"), isSection: false },
    { href: "/chat", label: t("chat"), isSection: false },
    { href: "/verification", label: t("verification"), isSection: false },
    ...(isHomePage ? [{ href: "#faq", label: t("faq"), isSection: true }] : []),
    { href: "/terms", label: t("terms"), isSection: false },
    { href: "/privacy", label: t("privacy"), isSection: false },
    { href: "/contact", label: t("contact"), isSection: false },
  ];

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        } ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 pt-[max(env(safe-area-inset-top),0.5rem)] md:pt-3">
            <Link
              href="/"
              className={`flex items-center transition-colors ${
                isScrolled ? "text-primary" : "text-white"
              }`}
            >
              <Image
                src="/logo-text.png"
                alt="Trokacha"
                width={295}
                height={351}
                className="w-10 h-auto md:w-16"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                link.isSection ? (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className={`font-medium transition-colors hover:opacity-80 ${
                      isScrolled ? "text-gray-700" : "text-white/90"
                    }`}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium transition-colors hover:opacity-80 ${
                      isScrolled ? "text-gray-700" : "text-white/90"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-all hover:scale-105 ${
                    isScrolled
                      ? "bg-gray-100 text-gray-700"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <img src={localeFlags[locale]} alt="" className="w-5 h-4 object-cover rounded-sm" />
                  <span>{localeNames[locale]}</span>
                </button>

                <div
                  className={`absolute top-full end-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden min-w-[120px] transition-all duration-200 ${
                    isLangMenuOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {routing.locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={`w-full px-4 py-3 text-start font-medium transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                        locale === loc ? "bg-primary/10 text-primary" : "text-gray-700"
                      }`}
                    >
                      <img src={localeFlags[loc]} alt="" className="w-5 h-4 object-cover rounded-sm" />
                      <span>{localeNames[loc]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => scrollToSection("#cta")}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all hover:scale-105 ${
                  isScrolled
                    ? "bg-primary text-white"
                    : "bg-white text-primary"
                }`}
              >
                {t("signup")}
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile Language Switcher */}
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                <img src={localeFlags[locale]} alt="" className="w-6 h-5 object-cover rounded-sm" />
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Language Menu */}
      <div
        className={`fixed inset-x-0 top-16 z-50 bg-white shadow-xl md:hidden transition-all duration-200 ${
          isLangMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-center gap-4">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                locale === loc
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <img src={localeFlags[loc]} alt="" className="w-5 h-4 object-cover rounded-sm" />
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-x-0 top-16 z-40 bg-white shadow-xl md:hidden transition-all duration-200 ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 py-6 space-y-4">
          {mobileNavLinks.map((link) => (
            link.isSection ? (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-start px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-start px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
          <button
            onClick={() => scrollToSection("#cta")}
            className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("signup")}
          </button>
        </div>
      </div>
    </>
  );
}
