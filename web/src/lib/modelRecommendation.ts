import type { Locale } from "./types";
import type { KusePromptInput, KuseTaskKind } from "./kusePrompt";

type ModelId =
  | "claude-opus"
  | "claude-sonnet"
  | "gpt-5-5"
  | "gpt-4-5"
  | "gemini-pro"
  | "gemini-flash";

type ModelProfile = {
  id: ModelId;
  name: string;
  strength: Record<Locale, string>;
};

export type ModelChoice = ModelProfile & {
  explanation: string;
  score: number;
};

export type ModelRecommendation = {
  recommended: ModelChoice;
  alternative: ModelChoice;
  signals: string[];
  method: string;
  alternativeLabel: string;
  availabilityNote: string;
};

const MODELS: ModelProfile[] = [
  {
    id: "claude-opus",
    name: "Claude Opus",
    strength: {
      en: "deep analysis, high-stakes documents, and complex planning",
      "zh-TW": "深度分析、高重要性文件與複雜規劃",
    },
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    strength: {
      en: "reliable everyday drafting, clear writing, and balanced speed",
      "zh-TW": "穩定的日常草擬、清楚文字與均衡速度",
    },
  },
  {
    id: "gpt-5-5",
    name: "GPT-5.5",
    strength: {
      en: "general reasoning, coding, and turning requirements into working structures",
      "zh-TW": "通用推理、程式與把需求轉成可運作結構",
    },
  },
  {
    id: "gpt-4-5",
    name: "GPT-4.5",
    strength: {
      en: "code generation, review, and debugging",
      "zh-TW": "程式生成、檢查與除錯",
    },
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    strength: {
      en: "multimodal sources, long documents, data, and visual deliverables",
      "zh-TW": "多模態材料、長文件、資料與視覺型產出",
    },
  },
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    strength: {
      en: "fast iteration, simple tasks, and lightweight first versions",
      "zh-TW": "快速迭代、簡單任務與輕量第一版",
    },
  },
];

const TASK_FOCUS: Record<KuseTaskKind, Record<Locale, string>> = {
  teaching_material: { en: "instruction-ready teaching material", "zh-TW": "可直接教學的教材" },
  lesson_plan: { en: "structured lesson planning", "zh-TW": "有結構的教案規劃" },
  worksheet: { en: "clear, editable student practice", "zh-TW": "清楚且可編輯的學生練習" },
  assessment: { en: "accurate, checkable assessment design", "zh-TW": "正確且可檢查的評量設計" },
  class_activity: { en: "practical classroom activity design", "zh-TW": "可執行的課堂活動設計" },
  presentation: { en: "visual structure and presentation flow", "zh-TW": "視覺結構與簡報敘事" },
  website: { en: "a working, shareable website", "zh-TW": "可運作、可分享的網站" },
  notice: { en: "clear operational communication", "zh-TW": "清楚的行政溝通" },
  meeting_minutes: { en: "faithful decisions and action tracking", "zh-TW": "忠實的決議與待辦追蹤" },
  event_plan: { en: "multi-part event planning", "zh-TW": "多面向活動規劃" },
  sop: { en: "precise workflow and exception design", "zh-TW": "精準的流程與例外設計" },
  form: { en: "concise information collection", "zh-TW": "精簡的資訊蒐集" },
  report: { en: "evidence-based analysis and reporting", "zh-TW": "有依據的分析與報告" },
  resource_guide: { en: "organized, task-based guidance", "zh-TW": "依任務整理的資源指引" },
  other: { en: "general reasoning and a usable first draft", "zh-TW": "通用推理與可用初稿" },
};

function add(scores: Record<ModelId, number>, ids: ModelId[], points: number) {
  ids.forEach((id) => {
    scores[id] += points;
  });
}

export function recommendKuseModels(input: KusePromptInput, locale: Locale): ModelRecommendation {
  const scores = Object.fromEntries(MODELS.map((model) => [model.id, 0])) as Record<ModelId, number>;
  const signals: string[] = [];

  const everydayTasks: KuseTaskKind[] = [
    "teaching_material",
    "lesson_plan",
    "worksheet",
    "class_activity",
    "notice",
    "meeting_minutes",
    "form",
    "resource_guide",
  ];
  const complexTasks: KuseTaskKind[] = ["assessment", "event_plan", "sop", "report"];

  if (input.taskKind === "website") {
    add(scores, ["gpt-5-5"], 9);
    add(scores, ["gpt-4-5"], 6);
    add(scores, ["gemini-flash"], input.siteScope === "mvp" ? 5 : 2);
    signals.push(locale === "zh-TW" ? "網站需要結構與可運作的互動" : "The website needs structure and working interactions");
  } else if (input.taskKind === "presentation") {
    add(scores, ["gemini-pro"], 9);
    add(scores, ["claude-sonnet", "gpt-5-5"], 4);
    signals.push(locale === "zh-TW" ? "簡報需要視覺結構與素材理解" : "The presentation needs visual structure and source understanding");
  } else if (everydayTasks.includes(input.taskKind)) {
    add(scores, ["claude-sonnet"], 8);
    add(scores, ["gemini-flash", "gpt-5-5"], 3);
    signals.push(locale === "zh-TW" ? "任務重視清楚文字與穩定初稿" : "The task prioritizes clear writing and a reliable draft");
  } else if (complexTasks.includes(input.taskKind)) {
    add(scores, ["claude-opus"], 8);
    add(scores, ["claude-sonnet", "gemini-pro", "gpt-5-5"], 4);
    signals.push(locale === "zh-TW" ? "任務需要較深分析與多項限制整合" : "The task needs deeper analysis and constraint handling");
  } else {
    add(scores, ["gpt-5-5"], 6);
    add(scores, ["claude-sonnet"], 5);
    signals.push(locale === "zh-TW" ? "未指定固定類型，優先採用通用推理" : "No fixed task type is selected, so general reasoning is prioritized");
  }

  const hasMultimodalOrData = input.sources.some((source) => ["uploaded_pdf", "spreadsheet"].includes(source));
  if (hasMultimodalOrData) {
    add(scores, ["gemini-pro"], 5);
    signals.push(locale === "zh-TW" ? "包含 PDF 或試算表等材料" : "PDF or spreadsheet material is included");
  }

  if (input.sources.length >= 3 || input.materialDetails.length > 280) {
    add(scores, ["claude-opus", "gemini-pro"], 3);
    signals.push(locale === "zh-TW" ? "材料量較多，需要跨材料整理" : "The larger source set needs cross-source synthesis");
  }

  if (input.taskKind === "website" && input.siteScope === "mvp") {
    add(scores, ["gemini-flash", "claude-sonnet"], 2);
    signals.push(locale === "zh-TW" ? "採用快速 MVP，重視先完成可用小版本" : "Quick MVP mode favors a small usable first version");
  }

  if (input.taskKind === "website" && input.siteScope === "complete") {
    add(scores, ["gpt-5-5", "gpt-4-5", "claude-opus"], 2);
    signals.push(locale === "zh-TW" ? "完整版本需要較高的規格整合能力" : "Complete mode needs stronger specification handling");
  }

  // Kang Chiao accounts have ample credits, so task fit and quality outrank cost.
  add(scores, ["claude-opus", "gpt-5-5", "gemini-pro"], 1);

  const ranked = [...MODELS].sort((a, b) => scores[b.id] - scores[a.id]);
  const focus = TASK_FOCUS[input.taskKind][locale];
  const explain = (model: ModelProfile) => locale === "zh-TW"
    ? `這項任務重視${focus}；${model.name} 適合${model.strength[locale]}，因此在本次條件中得到較高權重。`
    : `This task prioritizes ${focus}. ${model.name} is strong at ${model.strength[locale]}, so it receives a higher weight for these inputs.`;

  const recommended = ranked[0];
  const alternative = ranked[1];

  return {
    recommended: { ...recommended, score: scores[recommended.id], explanation: explain(recommended) },
    alternative: { ...alternative, score: scores[alternative.id], explanation: explain(alternative) },
    signals: signals.slice(0, 3),
    method: locale === "zh-TW"
      ? "演算會綜合任務類型、材料複雜度、交付範圍與速度需求。康橋帳號點數充足，因此首選以品質與任務適配為主，不以省點數為優先。"
      : "The recommendation combines task type, source complexity, delivery scope, and speed. Because KCIS accounts have ample credits, the primary choice favors quality and task fit over point savings.",
    alternativeLabel: locale === "zh-TW" ? "若首選忙碌或想加快速度，可改用" : "Use this when the first choice is busy or you want a faster alternative",
    availabilityNote: locale === "zh-TW"
      ? "Kuse 的模型名稱可能更新；請選同系列最接近且帳號中可用的版本。未公開能力定位的模型不會被本工具猜測評分。"
      : "Model names in Kuse may change. Choose the closest available version in the same family. Models without a published capability profile are not guessed or scored.",
  };
}
