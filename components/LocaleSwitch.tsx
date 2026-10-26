"use client";

import type { MouseEvent, ReactNode } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { getPathname, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { rememberLocaleChoice } from "@/lib/localeChoice";

// Nom de chaque langue écrit DANS cette langue (endonyme) : un francophone
// tombé sur l'arabe doit reconnaître « Français » sans lire l'arabe.
export const localeEndonyms: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
  kab: "Taqbaylit",
};

/**
 * Lien de changement de langue. Pose le cookie du choix manuel AVANT de
 * naviguer : sans lui, le middleware renverrait `/x` (arabe) vers l'ancienne
 * langue choisie. Rendu en vrai <a href> (crawlable, clic molette) ; le clic
 * simple navigue côté client en gardant la query (?token=, ?sender=…).
 */
export function LocaleLink({
  locale,
  onSwitched,
  className,
  children,
}: {
  locale: Locale;
  onSwitched?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Pas de `forcePrefix` (contrairement au Link de next-intl) : l'arabe garde
  // son URL sans préfixe, `/ar/x` coûterait une redirection 308 de plus en 3G.
  const href = getPathname({ href: pathname, locale });

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    rememberLocaleChoice(locale);
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    router.replace(`${href}${window.location.search}${window.location.hash}`);
    onSwitched?.();
  };

  return (
    <a
      href={href}
      hrefLang={locale}
      lang={locale}
      onClick={handleClick}
      onAuxClick={() => rememberLocaleChoice(locale)}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Bascule en UN geste entre les deux langues du marché : sur l'arabe (langue
 * par défaut) on propose « Français », ailleurs « العربية ». Les autres langues
 * restent accessibles dans le menu à drapeaux de la Navbar.
 */
export function LanguageQuickSwitch({
  onSwitched,
  className = "",
}: {
  onSwitched?: () => void;
  className?: string;
}) {
  const locale = useLocale();
  const target: Locale = locale === "ar" ? "fr" : "ar";
  return (
    <LocaleLink
      locale={target}
      onSwitched={onSwitched}
      className={`inline-flex shrink-0 items-center rounded-full border border-line px-3 py-[6px] text-[13px] font-bold text-ink transition-colors hover:bg-paperHard ${className}`}
    >
      {localeEndonyms[target]}
    </LocaleLink>
  );
}
