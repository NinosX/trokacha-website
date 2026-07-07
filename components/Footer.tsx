"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SHOW_TRANSPORT } from "@/lib/featureFlags";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-ink px-6 pb-8 pt-14 text-line2">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-[14px] flex items-center gap-[10px]">
              <Image src="/logo.png" alt="" width={512} height={512} className="h-9 w-9" />
              <span className="font-display text-[21px] font-bold tracking-[-0.03em] text-paperSoft">
                trokacha
              </span>
            </div>
            <p className="max-w-[34ch] text-[14.5px] leading-relaxed text-inkMuted">
              {t("tagline")}
            </p>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h4 className="mb-[14px] text-[13px] font-bold uppercase tracking-[0.08em] text-inkMuted">
              {t("features")}
            </h4>
            <div className="flex flex-col gap-[10px]">
              <Link href="/echange" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("echange")}
              </Link>
              {SHOW_TRANSPORT && (
                <Link href="/transport" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                  {t("transport")}
                </Link>
              )}
              <Link href="/chat" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("chat")}
              </Link>
              <Link href="/verification" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("verification")}
              </Link>
            </div>
          </div>

          {/* Liens utiles */}
          <div>
            <h4 className="mb-[14px] text-[13px] font-bold uppercase tracking-[0.08em] text-inkMuted">
              {t("links")}
            </h4>
            <div className="flex flex-col gap-[10px]">
              <Link href="/terms" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("terms")}
              </Link>
              <Link href="/privacy" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("privacy")}
              </Link>
              <Link href="/contact" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                {t("contact")}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-[14px] text-[13px] font-bold uppercase tracking-[0.08em] text-inkMuted">
              {t("contactTitle")}
            </h4>
            <div className="flex flex-col gap-[10px]">
              <a href="mailto:contact@trokacha.com" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                contact@trokacha.com
              </a>
              <a href="mailto:support@trokacha.com" className="text-[14.5px] text-line2 transition-colors hover:text-paperSoft">
                support@trokacha.com
              </a>
              <span className="text-[14.5px] text-inkMuted">Algérie</span>
            </div>
          </div>
        </div>

        <div className="border-t border-inkSoft pt-6 text-center text-[13px] text-inkMuted">
          © 2026 {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
