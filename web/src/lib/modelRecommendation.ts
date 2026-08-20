import type { Locale } from "./types";
import type { KusePromptInput, KuseTaskKind } from "./kusePrompt";

type ModelId =
  | "claude-opus"
  | "claude-sonnet"
  | "gpt-5-5"
  | "gpt-4-5"
  | "gemini-pro"
  | "gemini-flash"
  | "nano-banana-pro"
  | "gpt-image-2";

type ModelProfile = {
  id: ModelId;
  name: string;
  strength: Record<Locale, string>;
  tradeoff: Record<Locale, string>;
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
  allModels: ModelChoice[];
};

const MODELS: ModelProfile[] = [
  {
    id: "claude-opus",
    name: "Claude Opus",
    strength: {
      en: "deep analysis, high-stakes documents, and complex planning",
      "zh-TW": "深度分析、高重要性文件與複雜規劃",
    },
    tradeoff: {
      en: "it is only moderate in speed, so a short everyday task can be overkill",
      "zh-TW": "速度較中等，短小的日常任務可能有點大材小用",
    },
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    strength: {
      en: "reliable everyday drafting, clear writing, and balanced speed",
      "zh-TW": "穩定的日常草擬、清楚文字與均衡速度",
    },
    tradeoff: {
      en: "for very long, high-stakes analysis, Opus gives the task more depth",
      "zh-TW": "遇到很長、很重要的深度分析，Opus 通常更合適",
    },
  },
  {
    id: "gpt-5-5",
    name: "GPT-5.5",
    strength: {
      en: "general reasoning, coding, and turning requirements into working structures",
      "zh-TW": "通用推理、程式與把需求轉成可運作結構",
    },
    tradeoff: {
      en: "it uses the highest cost tier on Kuse, so it is unnecessary for a very simple quick draft",
      "zh-TW": "在 Kuse 屬於較高點數層級，很簡單的快速初稿不一定需要用到它",
    },
  },
  {
    id: "gpt-4-5",
    name: "GPT-4.5",
    strength: {
      en: "code generation, review, and debugging",
      "zh-TW": "程式生成、檢查與除錯",
    },
    tradeoff: {
      en: "its advantage is more technical, so it is less natural as the first choice for ordinary teaching copy or visual presentations",
      "zh-TW": "優勢比較偏技術工作，一般教材文字或視覺簡報不一定要先選它",
    },
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    strength: {
      en: "multimodal sources, long documents, data, and visual deliverables",
      "zh-TW": "多模態材料、長文件、資料與視覺型產出",
    },
    tradeoff: {
      en: "it uses more account traffic, so reserve it for tasks that truly need multimodal sources or long-context understanding",
      "zh-TW": "它會使用較多帳號流量，適合保留給真的需要多模態材料或長文理解的任務",
    },
  },
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    strength: {
      en: "fast iteration, simple tasks, and lightweight first versions",
      "zh-TW": "快速迭代、簡單任務與輕量第一版",
    },
    tradeoff: {
      en: "it prioritizes speed, so complex planning or high-stakes documents deserve a deeper model and human review",
      "zh-TW": "它偏重速度，複雜規劃或重要文件仍適合換深度模型並人工複核",
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    strength: {
      en: "high-quality image generation, style control, and visual workflow integration",
      "zh-TW": "高品質圖片生成、風格控制與視覺工作流整合",
    },
    tradeoff: {
      en: "it is an image model, so it should not replace a language model for research or long-form writing",
      "zh-TW": "它是圖片模型，不適合取代語言模型做研究或長篇寫作",
    },
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    strength: {
      en: "photorealistic scenes, natural-language control, and image editing",
      "zh-TW": "寫實畫面、自然語言控制與圖片編修",
    },
    tradeoff: {
      en: "for stylized visual systems or workflow integration, Nano Banana Pro may be a smoother first choice",
      "zh-TW": "若重視風格系統或工作流整合，Nano Banana Pro 可能更順手",
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
  poster: { en: "a clear, finished visual artifact", "zh-TW": "清楚而完整的視覺成品" },
  image: { en: "a finished image with controlled style and composition", "zh-TW": "風格與構圖可控制的圖片成品" },
  research: { en: "a sourced, verifiable research answer", "zh-TW": "附來源、可查證的研究結論" },
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

  // Gemini Pro uses more account traffic, so it starts lower and must earn its way back
  // through a task that genuinely benefits from deep multimodal or long-context work.
  add(scores, ["gemini-pro"], -4);

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
    add(scores, ["gemini-pro"], 8);
    add(scores, ["claude-sonnet", "gpt-5-5"], 5);
    signals.push(locale === "zh-TW" ? "簡報需要視覺結構與素材理解" : "The presentation needs visual structure and source understanding");
  } else if (input.taskKind === "poster") {
    add(scores, ["nano-banana-pro"], 11);
    add(scores, ["gpt-image-2"], 9);
    add(scores, ["gemini-flash"], 3);
    signals.push(locale === "zh-TW" ? "海報成品需要視覺理解與清楚層級" : "A poster artifact needs visual understanding and clear hierarchy");
  } else if (input.taskKind === "image") {
    add(scores, ["nano-banana-pro"], 12);
    add(scores, ["gpt-image-2"], 10);
    add(scores, ["gemini-flash"], 3);
    signals.push(locale === "zh-TW" ? "圖片任務優先使用專用圖片模型" : "The image task prioritizes dedicated image models");
  } else if (input.taskKind === "research") {
    add(scores, ["claude-opus"], 11);
    add(scores, ["gpt-5-5"], 10);
    add(scores, ["claude-sonnet"], 5);
    add(scores, ["gemini-pro"], 2);
    signals.push(locale === "zh-TW" ? "研究需要來源整合、推理與可查證結論" : "Research needs source synthesis, reasoning, and verifiable conclusions");
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

  const hasDeepMultimodalSources = input.sources.some((source) => ["uploaded_pdf", "spreadsheet", "reference_image"].includes(source));
  const genuinelyMultimodalTask = ["presentation", "research", "report"].includes(input.taskKind);
  if (hasDeepMultimodalSources && genuinelyMultimodalTask) {
    add(scores, ["gemini-pro"], 7);
    signals.push(locale === "zh-TW" ? "任務同時需要理解 PDF、數據或視覺材料" : "The task genuinely combines PDF, data, or visual sources");
  }

  if (input.sources.length >= 3 || input.materialDetails.length > 280) {
    add(scores, ["claude-opus"], 3);
    if (genuinelyMultimodalTask) add(scores, ["gemini-pro"], 3);
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
  add(scores, ["claude-opus", "gpt-5-5"], 1);

  const ranked = [...MODELS].sort((a, b) => scores[b.id] - scores[a.id]);
  const focus = TASK_FOCUS[input.taskKind][locale];
  const explain = (model: ModelProfile) => locale === "zh-TW"
    ? `這次要做的是${focus}，選 ${model.name} 會比較順手。它很會${model.strength[locale]}；不過${model.tradeoff[locale]}。`
    : `You need ${focus}, so ${model.name} should feel like the smoother choice. It is good at ${model.strength[locale]}; however, ${model.tradeoff[locale]}.`;

  const recommended = ranked[0];
  const alternative = ranked[1];

  return {
    recommended: { ...recommended, score: scores[recommended.id], explanation: explain(recommended) },
    alternative: { ...alternative, score: scores[alternative.id], explanation: explain(alternative) },
    signals: signals.slice(0, 3),
    method: locale === "zh-TW"
      ? "依任務、材料與專案範圍推薦。Gemini Pro 因流量較高會先降低權重，只有多模態或長材料真的適合時才會升回來。"
      : "The score uses task, sources, and project scope. Gemini Pro starts lower because of its heavier usage and rises only for genuinely suitable multimodal or long-context work.",
    alternativeLabel: locale === "zh-TW" ? "想換一種取向，也可以考慮" : "For a different balance, also consider",
    availabilityNote: locale === "zh-TW"
      ? "Kuse 的模型名稱可能更新；請選同系列最接近且帳號中可用的版本。未公開能力定位的模型不會被本工具猜測評分。"
      : "Model names in Kuse may change. Choose the closest available version in the same family. Models without a published capability profile are not guessed or scored.",
    allModels: ranked.map((model) => ({
      ...model,
      score: scores[model.id],
      explanation: explain(model),
    })),
  };
}
