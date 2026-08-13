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
      <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label={t.meta.brand}>
        <Image
          src={asset("/brand/kangchiao-logo.png")}
          alt=""
          width={154}
          height={28}
          className="h-8 w-auto sm:h-9"
          priority
        />
      </Link>

      <div className="flex items-center gap-2">
        {onHome ? (
          <button type="button" className="kc-btn-ghost kc-header-home" onClick={onHome}>
            {t.nav.allTools}
          </button>
        ) : null}
        <a
          href="https://kcis.kainnne.com/me"
          target="_blank"
          rel="noreferrer"
          className="kc-btn-kainnne"
        >
          <span className="kc-kainnne-dot" aria-hidden />
          <span>Kainnne</span>
          <span aria-hidden>↗</span>
        </a>
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
