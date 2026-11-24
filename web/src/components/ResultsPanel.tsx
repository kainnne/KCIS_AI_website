"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { keywordChips } from "@/lib/adaptive";
import { pickLocalized, useI18n } from "@/lib/i18n";
import { buildPrompt } from "@/lib/prompts";
import { difficultyLabel, formatStars } from "@/lib/scoring";
import type { RankedTool, UserNeed } from "@/lib/types";
import { trackSpot } from "./OptionCard";

export function ResultsPanel({
  need,
  ranked,
  onBack,
  onRestart,
}: {
  need: UserNeed;
  ranked: RankedTool[];
  onBack: () => void;
  onRestart: () => void;
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [activeHint, setActiveHint] = useState<string>("");
  const [promptText, setPromptText] = useState("");
  const [copied, setCopied] = useState(false);

  const chips = useMemo(() => {
    if (!need.role || !need.task) return [];
    if (need.role !== "admin" && !need.level) return [];
    if (need.role === "admin" && !need.department) return [];
    return keywordChips(need.role, need.level, need.task, locale, need.department);
  }, [need.role, need.level, need.department, need.task, locale]);

  const summaryBits = [
    need.role ? t.roles[need.role].label : "",
    need.department ? t.departments[need.department].label : "",
    need.level ? t.levels[need.level].label : "",
    need.task ? t.tasks[need.task as keyof typeof t.tasks] ?? need.task : "",
    need.freeOnly ? t.nav.freeOnly : "",
  ].filter(Boolean);

  function refreshPrompt() {
    setPromptText(buildPrompt(need, activeHint));
  }

  async function copyPrompt() {
    const text = promptText || buildPrompt(need, activeHint);
    if (!promptText) setPromptText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="kc-step-title text-2xl sm:text-3xl">
            <span className="kc-step-mark mr-2 inline-block" aria-hidden>
              ✦
            </span>
            {t.nav.resultsTitle}
          </h2>
          <p className="kc-step-subtitle mt-2 text-sm sm:text-base">{t.prompt.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="kc-btn-ghost" onClick={onBack}>
            {t.nav.back}
          </button>
          <button type="button" className="kc-btn-ghost" onClick={onRestart}>
            {t.nav.restart}
          </button>
        </div>
      </div>

      <div className="kc-card mt-6 p-5 sm:p-6">
        <h3 className="kc-label">{t.nav.summaryTitle}</h3>
        <p className="mt-2 text-sm text-kc-ink sm:text-base">{summaryBits.join(" · ")}</p>
        {need.note ? <p className="mt-2 text-sm text-kc-muted">{need.note}</p> : null}
        <p className="mt-3 text-xs text-kc-faint">{t.meta.privacy}</p>
      </div>

      <p className="mt-5 text-xs text-kc-muted">{t.nav.starsHint}</p>
      {ranked.some((r) => r.lowRelevance) ? (
        <p className="mt-1 text-xs text-[#8a2350]">{t.nav.lowRelevanceNote}</p>
      ) : null}

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((item, index) => (
          <motion.article
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={reduce ? undefined : { y: -3 }}
            transition={{ delay: reduce ? 0 : index * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onPointerMove={trackSpot}
            className={`kc-card kc-choice kc-result-card relative flex flex-col overflow-hidden p-5 ${
              item.pinnedCore ? "kc-core-card" : ""
            } ${item.lowRelevance ? "kc-low-relevance-card" : ""}`}
          >
            <span className="kc-spot" aria-hidden />
            <div className="relative z-[1] flex items-start justify-between gap-2">
              <div>
                {item.pinnedCore ? (
                  <span className="kc-badge kc-badge-kcis mb-2">
                    ✦ {t.nav.coreBadge}
                  </span>
                ) : null}
                {item.lowRelevance ? (
                  <span className="kc-badge kc-badge-warn mb-2">
                    {t.nav.lowRelevanceBadge}
                  </span>
                ) : null}
                <h3 className="text-xl">{item.name}</h3>
              </div>
            </div>

            <div className="kc-subcard relative z-[1] mt-3 px-3.5 py-2.5">
              <p className="kc-label">{t.nav.difficulty}</p>
              <p className="kc-stars mt-0.5 text-base" aria-label={`${item.difficultyStars} ${t.nav.stars}`}>
                {formatStars(item.difficultyStars)}
              </p>
              <p className="text-sm text-kc-ink">
                {difficultyLabel(item.difficultyStars, locale)}
                <span className="text-kc-muted"> · <span className="kc-num">{item.difficultyStars}/5</span></span>
              </p>
            </div>

            <p className="relative z-[1] mt-2 text-sm text-kc-muted">
              {pickLocalized(item.tool.shortDescription, locale)}
            </p>
            {item.lowRelevance ? (
              <p className="kc-warn-note relative z-[1] mt-2 px-3 py-2 text-xs leading-relaxed">
                {t.nav.lowRelevanceHint}
              </p>
            ) : null}
            <div className="relative z-[1] mt-3">
              <p className="kc-label">{t.nav.why}</p>
              <ul className="mt-1 space-y-1 text-sm text-kc-ink">
                {item.reasons
                  .filter((r) => !r.startsWith("excluded") && r !== "generalist_downrank")
                  .slice(0, 4)
                  .map((code) => (
                    <li key={code}>
                      · {t.reasonCodes[code as keyof typeof t.reasonCodes] ?? code}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="relative z-[1] mt-auto flex flex-wrap gap-2 pt-4">
              {item.officialUrl ? (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="kc-btn-primary"
                >
                  {t.nav.openOfficial}
                </a>
              ) : (
                <span className="text-sm text-kc-muted">
                  {locale === "zh-TW" ? "官方網址待確認" : "Official URL pending"}
                </span>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {ranked.length === 0 ? (
        <p className="mt-6 text-sm text-kc-muted">
          {locale === "zh-TW"
            ? "目前沒有符合的工具，請回上一步放寬一點條件。"
            : "No tools matched. Go back and relax the filters."}
        </p>
      ) : null}

      <div className="kc-card kc-prompt-studio relative mt-10 overflow-hidden p-5 sm:p-7">
        <h3 className="relative z-[1] text-xl sm:text-2xl">
          {t.prompt.title}
        </h3>
        <p className="relative z-[1] mt-1.5 text-sm text-kc-muted">{t.nav.promptHints}</p>

        <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = activeHint === chip;
            return (
              <button
                key={chip}
                type="button"
                className={`kc-chip ${active ? "kc-chip-active" : ""}`}
                onClick={() => {
                  setActiveHint(chip);
                  setPromptText(buildPrompt(need, chip));
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <textarea
          className="kc-field relative z-[1] mt-4 min-h-40"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={buildPrompt(need)}
        />

        <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
          <button type="button" className="kc-btn-primary" onClick={refreshPrompt}>
            {t.nav.generatePrompt}
          </button>
          <button type="button" className="kc-btn-ghost" onClick={copyPrompt}>
            {copied ? t.nav.copied : t.nav.copy}
          </button>
        </div>

        <div className="kc-launch-area relative z-[1] mt-6">
          <p className="kc-launch-label">{t.prompt.launchTitle}</p>
          <div className="kc-launch-grid">
            <LaunchLink href="https://kuse.knsh.com.tw/" name="Kuse" hint={t.prompt.kuseHint} featured />
            <LaunchLink href="https://chatgpt.com/" name="ChatGPT" hint={t.prompt.chatGptHint} />
            <LaunchLink href="https://gemini.google.com/" name="Gemini" hint={t.prompt.geminiHint} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function LaunchLink({
  href,
  name,
  hint,
  featured = false,
}: {
  href: string;
  name: string;
  hint: string;
  featured?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`kc-launch-link ${featured ? "kc-launch-featured" : ""}`}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { y: 1 }}
    >
      <span className="kc-launch-monogram" aria-hidden>{name.slice(0, 1)}</span>
      <span className="min-w-0">
        <strong>{name}</strong>
        <small>{hint}</small>
      </span>
      <span className="kc-launch-arrow" aria-hidden>↗</span>
    </motion.a>
  );
}
