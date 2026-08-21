"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const asset = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path.startsWith("/") ? path : `/${path}`}`;

export function SiteHeader({ onHome }: { onHome?: () => void }) {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="kc-site-header mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link
        href="/"
        className="kc-brand-home group flex min-w-0 items-center gap-3"
        aria-label={`${t.meta.brand}｜${t.nav.home}`}
        onClick={(event) => {
          if (onHome) {
            event.preventDefault();
            onHome();
          }
        }}
      >
        <Image
          src={asset("/brand/kangchiao-logo.png")}
          alt=""
          width={154}
          height={28}
          className="h-8 w-auto sm:h-9"
          priority
        />
        <span aria-hidden>｜</span>
        <strong>{t.nav.home}</strong>
      </Link>

      <div className="flex items-center gap-2">
        <div className="kc-language-switch" role="group" aria-label="Site language">
          <button
            type="button"
            className={locale === "en" ? "is-active" : ""}
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={locale === "zh-TW" ? "is-active" : ""}
            aria-pressed={locale === "zh-TW"}
            onClick={() => setLocale("zh-TW")}
          >
            中文
          </button>
        </div>
      </div>
    </header>
  );
}
