"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildKusePrompt,
  FORMAT_LABELS,
  REQUIREMENT_LABELS,
  SOURCE_LABELS,
  TONE_LABELS,
  type KuseFormat,
  type KusePromptInput,
  type KuseRequirement,
  type KuseRole,
  type KuseSource,
  type KuseTaskKind,
  type KuseTone,
} from "@/lib/kusePrompt";
import type { Locale } from "@/lib/types";
import { OptionCard, StepPanel } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type BuilderStep = "role" | "task" | "materials" | "specs" | "result";

const TASK_OPTIONS: Record<KuseRole, Array<{ id: KuseTaskKind; label: Record<Locale, string> }>> = {
  teacher: [
    { id: "teaching_material", label: { en: "Teaching material", "zh-TW": "教材／講義" } },
    { id: "lesson_plan", label: { en: "Lesson plan", "zh-TW": "教案／備課" } },
    { id: "worksheet", label: { en: "Worksheet", "zh-TW": "學習單" } },
    { id: "assessment", label: { en: "Assessment or exam", "zh-TW": "試卷／測驗設計" } },
    { id: "class_activity", label: { en: "Classroom activity", "zh-TW": "課堂活動" } },
    { id: "presentation", label: { en: "Presentation", "zh-TW": "簡報" } },
    { id: "website", label: { en: "Practical website", "zh-TW": "實用網站" } },
    { id: "other", label: { en: "Another task", "zh-TW": "其他任務" } },
  ],
  admin: [
    { id: "notice", label: { en: "Notice or message", "zh-TW": "公告／通知" } },
    { id: "meeting_minutes", label: { en: "Meeting minutes", "zh-TW": "會議紀錄" } },
    { id: "event_plan", label: { en: "Event plan", "zh-TW": "活動規劃" } },
    { id: "presentation", label: { en: "Presentation", "zh-TW": "簡報" } },
    { id: "website", label: { en: "Practical website", "zh-TW": "實用網站" } },
    { id: "sop", label: { en: "Workflow or SOP", "zh-TW": "流程／SOP" } },
    { id: "form", label: { en: "Form questions", "zh-TW": "表單題目" } },
    { id: "report", label: { en: "Report or data brief", "zh-TW": "報告／數據摘要" } },
    { id: "resource_guide", label: { en: "Resource guide or FAQ", "zh-TW": "資源指南／FAQ" } },
    { id: "other", label: { en: "Another task", "zh-TW": "其他任務" } },
  ],
};

const ROLE_SOURCES: Record<KuseRole, KuseSource[]> = {
  teacher: ["kuse_textbook", "uploaded_pdf", "lesson_text", "own_notes"],
  admin: ["transcript", "official_document", "spreadsheet", "existing_template", "own_notes"],
};

const ROLE_REQUIREMENTS: Record<KuseRole, KuseRequirement[]> = {
  teacher: ["learning_objectives", "teaching_steps", "answer_key", "differentiation", "source_alignment"],
  admin: ["action_items", "owners_deadlines", "review_markers", "source_notes", "privacy_check"],
};

const FORMATS: KuseFormat[] = ["structured", "table", "slides", "webpage", "checklist", "notice"];
const TONES: KuseTone[] = ["clear", "friendly", "formal", "concise"];
const DEFAULT_FORMAT_BY_TASK: Partial<Record<KuseTaskKind, KuseFormat>> = {
  presentation: "slides",
  website: "webpage",
  notice: "notice",
  meeting_minutes: "table",
  sop: "checklist",
  report: "structured",
};

function initialInput(locale: Locale): KusePromptInput {
  return {
    role: "teacher",
    taskKind: "other",
    task: "",
    sources: [],
    materialDetails: "",
    audience: "",
    amount: "",
    format: null,
    tone: null,
    requirements: [],
    extraConstraints: "",
    problemToSolve: "",
    primaryAction: "",
    visualStyle: "",
    outputLanguage: locale,
  };
}

export function KusePromptBuilder({ onHome }: { onHome: () => void }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<BuilderStep>("role");
  const [input, setInput] = useState<KusePromptInput>(() => initialInput(locale));
  const [draftPrompt, setDraftPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const stepIndex = Math.max(0, ["role", "task", "materials", "specs"].indexOf(step));

  function go(next: BuilderStep) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function selectRole(role: KuseRole) {
    setInput((current) => ({
      ...initialInput(locale),
      role,
      outputLanguage: current.outputLanguage,
    }));
    go("task");
  }

  function toggleSource(source: KuseSource) {
    setInput((current) => ({
      ...current,
      sources: current.sources.includes(source)
        ? current.sources.filter((item) => item !== source)
        : [...current.sources, source],
    }));
  }

  function toggleRequirement(requirement: KuseRequirement) {
    setInput((current) => ({
      ...current,
      requirements: current.requirements.includes(requirement)
        ? current.requirements.filter((item) => item !== requirement)
        : [...current.requirements, requirement],
    }));
  }

  function finish() {
    setDraftPrompt(buildKusePrompt(input));
    go("result");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(draftPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function restart() {
    setInput(initialInput(locale));
    setDraftPrompt("");
    setCopied(false);
    go("role");
  }

  const selectedTaskLabel = useMemo(
    () => TASK_OPTIONS[input.role].find((option) => option.id === input.taskKind)?.label[locale] ?? "",
    [input.role, input.taskKind, locale],
  );

  return (
    <main className="kc-builder-shell">
      {step !== "result" ? <ProgressBar stepIndex={stepIndex} total={4} /> : null}

      <AnimatePresence mode="wait">
        {step === "role" ? (
          <StepPanel key="kuse-role" title={t.kuseBuilder.role.title} subtitle={t.kuseBuilder.role.subtitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                large
                title={t.kuseBuilder.role.teacher}
                hint={t.kuseBuilder.role.teacherHint}
                selected={input.role === "teacher"}
                onClick={() => selectRole("teacher")}
              />
              <OptionCard
                large
                title={t.kuseBuilder.role.admin}
                hint={t.kuseBuilder.role.adminHint}
                selected={input.role === "admin"}
                onClick={() => selectRole("admin")}
              />
            </div>
            <div className="mt-6">
              <button type="button" className="kc-btn-ghost" onClick={onHome}>{t.nav.allTools}</button>
            </div>
          </StepPanel>
        ) : null}

        {step === "task" ? (
          <StepPanel key="kuse-task" title={t.kuseBuilder.task.title} subtitle={t.kuseBuilder.task.subtitle}>
            <div className="kc-builder-presets">
              {TASK_OPTIONS[input.role].map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`kc-task-preset ${input.taskKind === option.id ? "is-active" : ""}`}
                  aria-pressed={input.taskKind === option.id}
                  onClick={() => setInput((current) => ({
                    ...current,
                    taskKind: option.id,
                    task: option.id === "other" ? "" : option.label[locale],
                    format: DEFAULT_FORMAT_BY_TASK[option.id] ?? null,
                  }))}
                >
                  {option.label[locale]}
                </button>
              ))}
            </div>
            <BuilderTextarea
              id="kuse-task"
              label={t.kuseBuilder.task.label}
              value={input.task}
              onChange={(task) => setInput((current) => ({ ...current, task }))}
              placeholder={input.role === "teacher" ? t.kuseBuilder.task.teacherPlaceholder : t.kuseBuilder.task.adminPlaceholder}
            />
            <BuilderNav
              back={t.nav.back}
              next={t.nav.next}
              onBack={() => go("role")}
              onNext={() => go("materials")}
              nextDisabled={!input.task.trim()}
            />
          </StepPanel>
        ) : null}

        {step === "materials" ? (
          <StepPanel key="kuse-materials" title={t.kuseBuilder.materials.title} subtitle={t.kuseBuilder.materials.subtitle}>
            <div className="flex flex-wrap gap-2">
              {ROLE_SOURCES[input.role].map((source) => (
                <button
                  type="button"
                  key={source}
                  className={`kc-chip ${input.sources.includes(source) ? "kc-chip-active" : ""}`}
                  aria-pressed={input.sources.includes(source)}
                  onClick={() => toggleSource(source)}
                >
                  {SOURCE_LABELS[source][locale]}
                </button>
              ))}
            </div>
            <BuilderTextarea
              id="kuse-materials"
              label={t.kuseBuilder.materials.label}
              value={input.materialDetails}
              onChange={(materialDetails) => setInput((current) => ({ ...current, materialDetails }))}
              placeholder={t.kuseBuilder.materials.placeholder}
              compact
            />
            <BuilderNav
              back={t.nav.back}
              next={t.nav.next}
              onBack={() => go("task")}
              onNext={() => go("specs")}
            />
          </StepPanel>
        ) : null}

        {step === "specs" ? (
          <StepPanel key="kuse-specs" title={t.kuseBuilder.specs.title} subtitle={t.kuseBuilder.specs.subtitle}>
            <div className="kc-spec-grid">
              <BuilderInput
                id="kuse-audience"
                label={t.kuseBuilder.specs.audience}
                value={input.audience}
                onChange={(audience) => setInput((current) => ({ ...current, audience }))}
                placeholder={input.role === "teacher" ? t.kuseBuilder.specs.teacherAudience : t.kuseBuilder.specs.adminAudience}
              />
              <BuilderInput
                id="kuse-amount"
                label={t.kuseBuilder.specs.amount}
                value={input.amount}
                onChange={(amount) => setInput((current) => ({ ...current, amount }))}
                placeholder={t.kuseBuilder.specs.amountPlaceholder}
              />
            </div>

            {input.taskKind === "website" ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="kc-website-specs"
              >
                <p className="kc-builder-section-label">{t.kuseBuilder.website.title}</p>
                <div className="kc-spec-grid">
                  <BuilderInput
                    id="kuse-problem"
                    label={t.kuseBuilder.website.problem}
                    value={input.problemToSolve}
                    onChange={(problemToSolve) => setInput((current) => ({ ...current, problemToSolve }))}
                    placeholder={t.kuseBuilder.website.problemPlaceholder}
                  />
                  <BuilderInput
                    id="kuse-action"
                    label={t.kuseBuilder.website.action}
                    value={input.primaryAction}
                    onChange={(primaryAction) => setInput((current) => ({ ...current, primaryAction }))}
                    placeholder={t.kuseBuilder.website.actionPlaceholder}
                  />
                </div>
                <BuilderInput
                  id="kuse-style"
                  label={t.kuseBuilder.website.style}
                  value={input.visualStyle}
                  onChange={(visualStyle) => setInput((current) => ({ ...current, visualStyle }))}
                  placeholder={t.kuseBuilder.website.stylePlaceholder}
                />
              </motion.div>
            ) : null}

            <ChoiceGroup label={t.kuseBuilder.specs.format}>
              {FORMATS.map((format) => (
                <ChoiceButton
                  key={format}
                  active={input.format === format}
                  onClick={() => setInput((current) => ({ ...current, format }))}
                >
                  {FORMAT_LABELS[format][locale]}
                </ChoiceButton>
              ))}
            </ChoiceGroup>

            <ChoiceGroup label={t.kuseBuilder.specs.tone}>
              {TONES.map((tone) => (
                <ChoiceButton
                  key={tone}
                  active={input.tone === tone}
                  onClick={() => setInput((current) => ({ ...current, tone }))}
                >
                  {TONE_LABELS[tone][locale]}
                </ChoiceButton>
              ))}
            </ChoiceGroup>

            <ChoiceGroup label={t.kuseBuilder.specs.mustInclude}>
              {ROLE_REQUIREMENTS[input.role].map((requirement) => (
                <ChoiceButton
                  key={requirement}
                  active={input.requirements.includes(requirement)}
                  onClick={() => toggleRequirement(requirement)}
                >
                  {REQUIREMENT_LABELS[requirement][locale]}
                </ChoiceButton>
              ))}
            </ChoiceGroup>

            <BuilderTextarea
              id="kuse-constraints"
              label={t.kuseBuilder.specs.extra}
              value={input.extraConstraints}
              onChange={(extraConstraints) => setInput((current) => ({ ...current, extraConstraints }))}
              placeholder={t.kuseBuilder.specs.extraPlaceholder}
              compact
            />

            <ChoiceGroup label={t.kuseBuilder.specs.outputLanguage}>
              <ChoiceButton
                active={input.outputLanguage === "en"}
                onClick={() => setInput((current) => ({ ...current, outputLanguage: "en" }))}
              >
                English
              </ChoiceButton>
              <ChoiceButton
                active={input.outputLanguage === "zh-TW"}
                onClick={() => setInput((current) => ({ ...current, outputLanguage: "zh-TW" }))}
              >
                繁體中文
              </ChoiceButton>
            </ChoiceGroup>

            <BuilderNav
              back={t.nav.back}
              next={t.kuseBuilder.specs.build}
              onBack={() => go("materials")}
              onNext={finish}
            />
          </StepPanel>
        ) : null}

        {step === "result" ? (
          <motion.section
            key="kuse-result"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6"
          >
            <div className="kc-builder-result-heading">
              <div>
                <p className="kc-eyebrow"><span />{t.kuseBuilder.result.eyebrow}</p>
                <h2>{t.kuseBuilder.result.title}</h2>
              </div>
              <button type="button" className="kc-btn-ghost" onClick={restart}>{t.kuseBuilder.result.restart}</button>
            </div>

            <div className="kc-builder-summary">
              <SummaryItem label={t.kuseBuilder.summary.role} value={input.role === "teacher" ? t.kuseBuilder.role.teacher : t.kuseBuilder.role.admin} />
              <SummaryItem label={t.kuseBuilder.summary.task} value={input.task || selectedTaskLabel} />
              <SummaryItem
                label={t.kuseBuilder.summary.materials}
                value={input.sources.length ? input.sources.map((source) => SOURCE_LABELS[source][locale]).join(" · ") : t.kuseBuilder.summary.none}
              />
              <SummaryItem label={t.kuseBuilder.summary.output} value={input.outputLanguage === "en" ? "English" : "繁體中文"} />
            </div>

            <div className="kc-card kc-kuse-result-card">
              <label htmlFor="kuse-result-prompt">{t.kuseBuilder.result.promptLabel}</label>
              <textarea
                id="kuse-result-prompt"
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
              />
              <div className="kc-result-actions">
                <button type="button" className="kc-btn-ghost" onClick={() => go("specs")}>{t.nav.back}</button>
                <button type="button" className="kc-btn-primary" onClick={copyPrompt}>{copied ? t.nav.copied : t.kuseBuilder.result.copy}</button>
                <motion.a
                  href="https://kuse.knsh.com.tw/"
                  target="_blank"
                  rel="noreferrer"
                  className="kc-btn-kuse-final"
                  whileHover={reduce ? undefined : { y: -3, scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  <span className="kc-launch-monogram" aria-hidden>K</span>
                  <span>{t.kuseBuilder.result.openKuse}</span>
                  <span aria-hidden>↗</span>
                </motion.a>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function BuilderInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="kc-builder-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function BuilderTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <label className="kc-builder-field kc-builder-textarea" htmlFor={id}>
      <span>{label}</span>
      <textarea
        id={id}
        className={compact ? "is-compact" : ""}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="kc-choice-group">
      <legend>{label}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`kc-chip ${active ? "kc-chip-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BuilderNav({
  back,
  next,
  onBack,
  onNext,
  nextDisabled = false,
}: {
  back: string;
  next: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-7 flex flex-wrap gap-2">
      <button type="button" className="kc-btn-ghost" onClick={onBack}>{back}</button>
      <button type="button" className="kc-btn-primary" onClick={onNext} disabled={nextDisabled}>{next}</button>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
