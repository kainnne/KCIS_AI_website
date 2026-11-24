"use client";

import { useI18n } from "@/lib/i18n";

export function ProgressBar({ stepIndex, total }: { stepIndex: number; total: number }) {
  const { locale } = useI18n();
  const pct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 sm:pt-8">
      <div className="kc-progress-meta mb-2 flex items-center justify-between">
        <span>
          {locale === "zh-TW" ? `步驟 ${stepIndex + 1} / ${total}` : `Step ${stepIndex + 1} / ${total}`}
        </span>
        <strong>{pct}%</strong>
      </div>
      <div className="kc-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="kc-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
