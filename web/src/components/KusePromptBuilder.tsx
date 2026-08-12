"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildKusePrompt,
  buildPromptDesignNotes,
  FORMAT_LABELS,
  REQUIREMENT_LABELS,
  SOURCE_LABELS,
  TONE_LABELS,
  type KuseFormat,
  type KusePromptInput,
  type KuseRequirement,
  type KuseRole,
  type KuseSiteScope,
  type KuseSource,
  type KuseTaskKind,
  type KuseTone,
} from "@/lib/kusePrompt";
import { recommendKuseModels } from "@/lib/modelRecommendation";
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
  teacher: ["kuse_textbook", "no_material", "uploaded_pdf", "lesson_text", "own_notes"],
  admin: ["no_material", "transcript", "official_document", "spreadsheet", "existing_template", "own_notes"],
};

const ROLE_REQUIREMENTS: Record<KuseRole, KuseRequirement[]> = {
  teacher: ["learning_objectives", "teaching_steps", "answer_key", "differentiation", "source_alignment"],
  admin: ["action_items", "owners_deadlines", "review_markers", "source_notes", "privacy_check"],
};

function requirementOptions(role: KuseRole, taskKind: KuseTaskKind): KuseRequirement[] {
  if (taskKind === "website") {
    return ["shareable_page", "mobile_first", "working_actions", "source_alignment", "privacy_check"];
  }
  if (taskKind === "assessment") {
    return ["learning_objectives", "answer_key", "differentiation", "source_alignment", "privacy_check"];
  }
  if (taskKind === "presentation") {
    return role === "teacher"
      ? ["learning_objectives", "speaker_notes", "source_alignment", "privacy_check"]
      : ["speaker_notes", "source_notes", "review_markers", "privacy_check"];
  }
  return ROLE_REQUIREMENTS[role];
}

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

type TaskHints = {
  task: string;
  materials: string;
  audience: string;
  amount: string;
  extra: string;
};

const TASK_HINTS: Record<KuseTaskKind, Record<Locale, TaskHints>> = {
  teaching_material: {
    en: { task: "e.g. Create a buoyancy handout for Grade 8", materials: "e.g. Book 3, Chapter 2 or the attached PDF", audience: "e.g. Grade 8 students", amount: "e.g. 2 pages", extra: "e.g. Include one worked example" },
    "zh-TW": { task: "例如：製作八年級浮力單元教材", materials: "例如：第三冊第二章或附件 PDF", audience: "例如：八年級學生", amount: "例如：2 頁", extra: "例如：加入一個示範例題" },
  },
  lesson_plan: {
    en: { task: "e.g. Plan a 45-minute inquiry lesson on buoyancy", materials: "e.g. Use the attached lesson text", audience: "e.g. Grade 8 mixed-ability class", amount: "e.g. 45 minutes", extra: "e.g. End with a 3-minute check" },
    "zh-TW": { task: "例如：設計 45 分鐘的浮力探究課", materials: "例如：依附件課文設計", audience: "例如：八年級混合程度班級", amount: "例如：45 分鐘", extra: "例如：最後安排 3 分鐘檢核" },
  },
  worksheet: {
    en: { task: "e.g. Make a practice worksheet about density", materials: "e.g. Use textbook pages 42–47", audience: "e.g. Grade 7 students", amount: "e.g. 10 questions", extra: "e.g. Printable on two A4 pages" },
    "zh-TW": { task: "例如：製作密度單元練習單", materials: "例如：依課本第 42–47 頁", audience: "例如：七年級學生", amount: "例如：10 題", extra: "例如：可用兩張 A4 列印" },
  },
  assessment: {
    en: { task: "e.g. Create a quiz for the buoyancy unit", materials: "e.g. Use Chapters 2–3 only", audience: "e.g. Grade 8 students", amount: "e.g. 15 questions", extra: "e.g. Separate answers from questions" },
    "zh-TW": { task: "例如：設計浮力單元小考", materials: "例如：只使用第二、三章內容", audience: "例如：八年級學生", amount: "例如：15 題", extra: "例如：答案與題目分開" },
  },
  class_activity: {
    en: { task: "e.g. Design a group activity about ecosystems", materials: "e.g. Use the attached reading", audience: "e.g. Groups of four in Grade 7", amount: "e.g. 25 minutes", extra: "e.g. Use materials already in class" },
    "zh-TW": { task: "例如：設計生態系小組活動", materials: "例如：使用附件閱讀材料", audience: "例如：七年級、每組四人", amount: "例如：25 分鐘", extra: "例如：只用教室現有材料" },
  },
  presentation: {
    en: { task: "e.g. Create a parent briefing presentation", materials: "e.g. Use the event brief and schedule", audience: "e.g. Parents", amount: "e.g. 8 slides", extra: "e.g. One idea per slide" },
    "zh-TW": { task: "例如：製作家長說明會簡報", materials: "例如：使用活動企劃與行程表", audience: "例如：家長", amount: "例如：8 頁", extra: "例如：每頁只放一個重點" },
  },
  website: {
    en: { task: "e.g. Make a field-trip information site for parents", materials: "e.g. Use the itinerary and response-form link", audience: "e.g. Parents reading on phones", amount: "e.g. One page, 4–6 sections", extra: "e.g. No login or database" },
    "zh-TW": { task: "例如：製作家長用的校外教學資訊站", materials: "例如：使用行程表與回覆表單連結", audience: "例如：用手機閱讀的家長", amount: "例如：一頁、4–6 個區塊", extra: "例如：不需要登入或資料庫" },
  },
  notice: {
    en: { task: "e.g. Draft a schedule-change notice", materials: "e.g. Use the approved dates in the memo", audience: "e.g. All staff", amount: "e.g. Under 200 words", extra: "e.g. Put required action first" },
    "zh-TW": { task: "例如：撰寫行程異動通知", materials: "例如：沿用公文核定日期", audience: "例如：全體教職員", amount: "例如：200 字內", extra: "例如：先寫需要採取的行動" },
  },
  meeting_minutes: {
    en: { task: "e.g. Organize the department meeting minutes", materials: "e.g. Use the transcript and my notes", audience: "e.g. Meeting participants", amount: "e.g. One-page summary", extra: "e.g. Highlight owners and deadlines" },
    "zh-TW": { task: "例如：整理處室會議紀錄", materials: "例如：使用逐字稿與我的筆記", audience: "例如：與會同仁", amount: "例如：一頁摘要", extra: "例如：標出負責人與期限" },
  },
  event_plan: {
    en: { task: "e.g. Plan a new-teacher orientation", materials: "e.g. Use last year's schedule", audience: "e.g. New teachers", amount: "e.g. Half-day event", extra: "e.g. Mark decisions still pending" },
    "zh-TW": { task: "例如：規劃新進教師研習", materials: "例如：參考去年流程", audience: "例如：新進教師", amount: "例如：半日活動", extra: "例如：標示尚未核定項目" },
  },
  sop: {
    en: { task: "e.g. Create an equipment-booking SOP", materials: "e.g. Use the current policy file", audience: "e.g. New staff", amount: "e.g. 6–8 steps", extra: "e.g. Include exception handling" },
    "zh-TW": { task: "例如：製作設備借用 SOP", materials: "例如：依現行規定檔案", audience: "例如：新進同仁", amount: "例如：6–8 個步驟", extra: "例如：加入例外處理" },
  },
  form: {
    en: { task: "e.g. Design a workshop registration form", materials: "e.g. Use the event requirements", audience: "e.g. Teachers", amount: "e.g. Under 10 questions", extra: "e.g. Collect no unnecessary personal data" },
    "zh-TW": { task: "例如：設計研習報名表", materials: "例如：依活動需求設計", audience: "例如：校內教師", amount: "例如：10 題以內", extra: "例如：不蒐集不必要個資" },
  },
  report: {
    en: { task: "e.g. Summarize the survey findings", materials: "e.g. Use the uploaded spreadsheet", audience: "e.g. School leadership", amount: "e.g. Two-page brief", extra: "e.g. Separate facts from recommendations" },
    "zh-TW": { task: "例如：整理問卷結果報告", materials: "例如：使用上傳的試算表", audience: "例如：校務主管", amount: "例如：兩頁摘要", extra: "例如：事實與建議分開" },
  },
  resource_guide: {
    en: { task: "e.g. Build a new-teacher resource guide", materials: "e.g. Use the existing links list", audience: "e.g. New teachers", amount: "e.g. 5 categories", extra: "e.g. Add one next step per resource" },
    "zh-TW": { task: "例如：製作新進教師資源指南", materials: "例如：使用既有連結清單", audience: "例如：新進教師", amount: "例如：5 個分類", extra: "例如：每項資源附一個下一步" },
  },
  other: {
    en: { task: "Describe one result you want Kuse to create", materials: "What should Kuse use? You can also leave this blank.", audience: "Who will use the result?", amount: "How long or how many?", extra: "Anything Kuse should avoid or remember?" },
    "zh-TW": { task: "用一句話說明想請 Kuse 完成的成果", materials: "Kuse 要依據什麼？也可以留白", audience: "誰會使用這個成果？", amount: "要多長或多少份量？", extra: "有什麼要避免或記得的嗎？" },
  },
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
    siteScope: "mvp",
    mustIncludeContent: "",
    linksAndActions: "",
    executionMode: "quick",
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
      materialDetails: source === "no_material" ? "" : current.materialDetails,
      sources: source === "no_material"
        ? (current.sources.includes(source) ? [] : [source])
        : current.sources.includes(source)
          ? current.sources.filter((item) => item !== source)
          : [...current.sources.filter((item) => item !== "no_material"), source],
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
  const modelRecommendation = useMemo(
    () => recommendKuseModels(input, locale),
    [input, locale],
  );
  const promptDesignNotes = useMemo(
    () => buildPromptDesignNotes(input, locale),
    [input, locale],
  );
  const taskHints = TASK_HINTS[input.taskKind][locale];

  function selectTask(taskKind: KuseTaskKind) {
    const isWebsite = taskKind === "website";
    setInput((current) => ({
      ...current,
      taskKind,
      task: "",
      amount: isWebsite ? (locale === "zh-TW" ? "一頁式，4–6 個必要區塊" : "One page with 4–6 essential sections") : "",
      format: DEFAULT_FORMAT_BY_TASK[taskKind] ?? null,
      requirements: isWebsite ? ["shareable_page", "mobile_first", "working_actions"] : [],
      siteScope: "mvp",
    }));
  }

  function selectSiteScope(siteScope: KuseSiteScope) {
    setInput((current) => ({
      ...current,
      siteScope,
      amount: siteScope === "mvp"
        ? (locale === "zh-TW" ? "一頁式，4–6 個必要區塊" : "One page with 4–6 essential sections")
        : (locale === "zh-TW" ? "先完成核心頁面，再分階段擴充" : "Core pages first, then expand in stages"),
    }));
  }

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
                  onClick={() => selectTask(option.id)}
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
              placeholder={taskHints.task}
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
            {input.sources.includes("no_material") ? (
              <p className="kc-no-material-note">{t.kuseBuilder.materials.noMaterialHint}</p>
            ) : (
              <BuilderTextarea
                id="kuse-materials"
                label={t.kuseBuilder.materials.label}
                value={input.materialDetails}
                onChange={(materialDetails) => setInput((current) => ({ ...current, materialDetails }))}
                placeholder={taskHints.materials}
                compact
              />
            )}
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
            <button
              type="button"
              className={`kc-quick-mode ${input.executionMode === "quick" ? "is-active" : ""}`}
              aria-pressed={input.executionMode === "quick"}
              onClick={() => setInput((current) => ({
                ...current,
                executionMode: current.executionMode === "quick" ? "standard" : "quick",
              }))}
            >
              <span aria-hidden>⚡</span>
              <span>
                <strong>{t.kuseBuilder.quick.title}</strong>
                <small>{input.executionMode === "quick" ? t.kuseBuilder.quick.on : t.kuseBuilder.quick.off}</small>
              </span>
              <span className="kc-quick-state">{input.executionMode === "quick" ? t.kuseBuilder.quick.enabled : t.kuseBuilder.quick.disabled}</span>
            </button>

            <div className="kc-spec-grid">
              <BuilderInput
                id="kuse-audience"
                label={t.kuseBuilder.specs.audience}
                value={input.audience}
                onChange={(audience) => setInput((current) => ({ ...current, audience }))}
                placeholder={taskHints.audience}
              />
              <BuilderInput
                id="kuse-amount"
                label={input.taskKind === "website" ? t.kuseBuilder.website.size : t.kuseBuilder.specs.amount}
                value={input.amount}
                onChange={(amount) => setInput((current) => ({ ...current, amount }))}
                placeholder={input.taskKind === "website" ? t.kuseBuilder.website.sizePlaceholder : taskHints.amount}
              />
            </div>

            {input.taskKind === "website" ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="kc-website-specs"
              >
                <p className="kc-builder-section-label">{t.kuseBuilder.website.title}</p>
                <div className="kc-site-scope-grid">
                  <button
                    type="button"
                    className={`kc-site-scope ${input.siteScope === "mvp" ? "is-active" : ""}`}
                    aria-pressed={input.siteScope === "mvp"}
                    onClick={() => selectSiteScope("mvp")}
                  >
                    <span>{t.kuseBuilder.website.mvpBadge}</span>
                    <strong>{t.kuseBuilder.website.mvp}</strong>
                    <small>{t.kuseBuilder.website.mvpHint}</small>
                  </button>
                  <button
                    type="button"
                    className={`kc-site-scope ${input.siteScope === "complete" ? "is-active" : ""}`}
                    aria-pressed={input.siteScope === "complete"}
                    onClick={() => selectSiteScope("complete")}
                  >
                    <span>{t.kuseBuilder.website.completeBadge}</span>
                    <strong>{t.kuseBuilder.website.complete}</strong>
                    <small>{t.kuseBuilder.website.completeHint}</small>
                  </button>
                </div>
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
              </motion.div>
            ) : null}

            <details className="kc-advanced-options">
              <summary>
                <span>
                  <strong>{t.kuseBuilder.advanced.title}</strong>
                  <small>{t.kuseBuilder.advanced.hint}</small>
                </span>
                <span aria-hidden>⌄</span>
              </summary>
              <div className="kc-advanced-body">
                {input.taskKind === "website" ? (
                  <>
                    <BuilderInput
                      id="kuse-style"
                      label={t.kuseBuilder.website.style}
                      value={input.visualStyle}
                      onChange={(visualStyle) => setInput((current) => ({ ...current, visualStyle }))}
                      placeholder={t.kuseBuilder.website.stylePlaceholder}
                    />
                    <div className="kc-spec-grid">
                      <BuilderTextarea
                        id="kuse-content"
                        label={t.kuseBuilder.website.content}
                        value={input.mustIncludeContent}
                        onChange={(mustIncludeContent) => setInput((current) => ({ ...current, mustIncludeContent }))}
                        placeholder={t.kuseBuilder.website.contentPlaceholder}
                        compact
                      />
                      <BuilderTextarea
                        id="kuse-links"
                        label={t.kuseBuilder.website.links}
                        value={input.linksAndActions}
                        onChange={(linksAndActions) => setInput((current) => ({ ...current, linksAndActions }))}
                        placeholder={t.kuseBuilder.website.linksPlaceholder}
                        compact
                      />
                    </div>
                  </>
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
                  {requirementOptions(input.role, input.taskKind).map((requirement) => (
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
                  placeholder={taskHints.extra}
                  compact
                />
              </div>
            </details>

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

            <section className="kc-model-guide" aria-labelledby="kuse-model-guide-title">
              <div className="kc-model-guide-head">
                <div>
                  <p className="kc-builder-section-label">{t.kuseBuilder.model.eyebrow}</p>
                  <h3 id="kuse-model-guide-title">{t.kuseBuilder.model.title}</h3>
                </div>
                <span>{t.kuseBuilder.model.qualityFirst}</span>
              </div>
              <p className="kc-model-method">{modelRecommendation.method}</p>
              <div className="kc-model-grid">
                <article className="kc-model-card is-primary">
                  <span>{t.kuseBuilder.model.recommended}</span>
                  <strong>{modelRecommendation.recommended.name}</strong>
                  <p>{modelRecommendation.recommended.explanation}</p>
                </article>
                <article className="kc-model-card">
                  <span>{modelRecommendation.alternativeLabel}</span>
                  <strong>{modelRecommendation.alternative.name}</strong>
                  <p>{modelRecommendation.alternative.explanation}</p>
                </article>
              </div>
              <div className="kc-model-signals">
                <span>{t.kuseBuilder.model.signals}</span>
                {modelRecommendation.signals.map((signal) => <small key={signal}>{signal}</small>)}
              </div>
              <p className="kc-model-note">{modelRecommendation.availabilityNote}</p>
            </section>

            <details className="kc-prompt-learning">
              <summary>
                <span className="kc-learning-mark" aria-hidden>?</span>
                <span>
                  <strong>{t.kuseBuilder.learning.title}</strong>
                  <small>{t.kuseBuilder.learning.hint}</small>
                </span>
                <span className="kc-learning-chevron" aria-hidden>⌄</span>
              </summary>
              <div className="kc-learning-body">
                <p>{t.kuseBuilder.learning.intro}</p>
                <ol>
                  {promptDesignNotes.map((note) => (
                    <li key={note.title}>
                      <strong>{note.title}</strong>
                      <span>{note.body}</span>
                    </li>
                  ))}
                </ol>
                <div className="kc-learning-transfer">
                  <strong>{t.kuseBuilder.learning.transferTitle}</strong>
                  <p>{t.kuseBuilder.learning.transferBody}</p>
                  <div>
                    {t.kuseBuilder.learning.framework.map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
              </div>
            </details>

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
