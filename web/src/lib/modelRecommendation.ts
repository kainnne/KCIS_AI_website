import type { Locale } from "./types";
import type { KusePromptInput, KuseTaskKind } from "./kusePrompt";

type ModelId =
  | "claude-opus-5"
  | "claude-opus-4-8"
  | "claude-sonnet-5"
  | "gpt-5-6-sol"
  | "gpt-5-6-terra"
  | "gpt-5-6-luna"
  | "gemini-3-5-flash"
  | "gemini-3-1-pro";

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
    id: "claude-opus-5",
    name: "Claude Opus 5",
    strength: {
      en: "complex agentic work, deep reasoning, long-horizon tasks, and structured documents",
      "zh-TW": "複雜代理任務、深度推理、長流程工作與結構化文件",
    },
    tradeoff: {
      en: "Anthropic rates its latency as moderate; Sonnet 5 is the faster official balance for routine work",
      "zh-TW": "Anthropic 將延遲標為中等；一般日常工作用 Sonnet 5 會更快、更均衡",
    },
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    strength: {
      en: "reliable agentic work, knowledge work, deep research, slide building, and analysis",
      "zh-TW": "可靠的代理任務、知識工作、深度研究、簡報製作與分析",
    },
    tradeoff: {
      en: "Opus 5 is the newer successor with further gains in deep reasoning and long-horizon work",
      "zh-TW": "Opus 5 是更新一代，官方指出深度推理與長流程工作的能力又再提升",
    },
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    strength: {
      en: "Anthropic's official speed-intelligence balance for everyday professional, coding, and agentic work",
      "zh-TW": "Anthropic 官方定位的速度與智慧平衡，適合日常專業、程式與代理任務",
    },
    tradeoff: {
      en: "Opus 5 remains the better fit for the deepest complex or long-horizon work",
      "zh-TW": "遇到最深、最複雜或需要長時間推進的工作，Opus 5 仍更合適",
    },
  },
  {
    id: "gpt-5-6-sol",
    name: "GPT-5.6 Sol",
    strength: {
      en: "flagship reasoning, coding, complex professional work, and front-end design",
      "zh-TW": "旗艦級推理、程式、複雜專業工作與前端設計",
    },
    tradeoff: {
      en: "it is the highest-cost GPT-5.6 tier; Terra is the official balance for most routine work",
      "zh-TW": "它是 GPT-5.6 系列中成本最高的一級；多數日常工作用 Terra 會更均衡",
    },
  },
  {
    id: "gpt-5-6-terra",
    name: "GPT-5.6 Terra",
    strength: {
      en: "OpenAI's official balance of intelligence and cost for general professional work",
      "zh-TW": "OpenAI 官方定位的智慧與成本平衡，適合一般專業工作",
    },
    tradeoff: {
      en: "Sol is intended for the hardest reasoning and coding, while Luna is more economical at high volume",
      "zh-TW": "最困難的推理與程式工作適合 Sol；大量重複任務則用 Luna 更省",
    },
  },
  {
    id: "gpt-5-6-luna",
    name: "GPT-5.6 Luna",
    strength: {
      en: "cost-sensitive, high-volume work and fast lightweight drafts",
      "zh-TW": "重視成本的大量工作與快速輕量初稿",
    },
    tradeoff: {
      en: "it is optimized for efficiency rather than the hardest quality-first reasoning tasks",
      "zh-TW": "它以效率為主，不是最困難、品質優先推理任務的首選",
    },
  },
  {
    id: "gemini-3-5-flash",
    name: "Gemini 3.5 Flash",
    strength: {
      en: "higher-speed, lower-cost multimodal work and multi-step agent loops at scale",
      "zh-TW": "更高速度、較低成本的多模態工作與大規模多步驟代理流程",
    },
    tradeoff: {
      en: "it prioritizes speed and scale; 3.1 Pro is the stronger fit when advanced multimodal reasoning is essential",
      "zh-TW": "它偏重速度與規模；真的需要進階多模態推理時，3.1 Pro 更合適",
    },
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    strength: {
      en: "complex tasks, broad knowledge, advanced multimodal reasoning, and reliable multi-step tool use",
      "zh-TW": "複雜任務、廣泛知識、進階多模態推理與可靠的多步驟工具使用",
    },
    tradeoff: {
      en: "it is a preview text-output model, does not directly generate images, and uses more Kuse account traffic",
      "zh-TW": "它仍是預覽版文字輸出模型，不能直接生成圖片，而且會使用較多 Kuse 帳號流量",
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

  // Gemini 3.1 Pro uses more account traffic, so it starts lower and must earn its way back
  // through a task that genuinely benefits from deep multimodal or long-context work.
  add(scores, ["gemini-3-1-pro"], -4);

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
    add(scores, ["gpt-5-6-sol"], 8);
    add(scores, ["gpt-5-6-terra"], 7);
    add(scores, ["claude-sonnet-5", "gemini-3-5-flash"], 4);
    signals.push(locale === "zh-TW" ? "網站需要結構與可運作的互動" : "The website needs structure and working interactions");
  } else if (input.taskKind === "presentation") {
    add(scores, ["claude-opus-5"], 8);
    add(scores, ["gemini-3-1-pro"], 6);
    add(scores, ["claude-opus-4-8", "claude-sonnet-5", "gpt-5-6-sol"], 5);
    signals.push(locale === "zh-TW" ? "簡報需要視覺結構與素材理解" : "The presentation needs visual structure and source understanding");
  } else if (input.taskKind === "poster") {
    add(scores, ["gpt-5-6-sol"], 8);
    add(scores, ["gpt-5-6-terra"], 6);
    add(scores, ["claude-sonnet-5", "gemini-3-1-pro"], 5);
    signals.push(locale === "zh-TW" ? "海報成品需要視覺理解與清楚層級" : "A poster artifact needs visual understanding and clear hierarchy");
  } else if (input.taskKind === "image") {
    add(scores, ["gpt-5-6-sol"], 8);
    add(scores, ["gpt-5-6-terra"], 6);
    add(scores, ["claude-sonnet-5", "gemini-3-1-pro"], 5);
    signals.push(locale === "zh-TW" ? "圖片任務需要清楚描述構圖並操作 Kuse 的圖片工具" : "The image task needs clear composition directions and Kuse image-tool use");
  } else if (input.taskKind === "research") {
    add(scores, ["claude-opus-5"], 10);
    add(scores, ["gpt-5-6-sol"], 9);
    add(scores, ["claude-opus-4-8"], 6);
    add(scores, ["claude-sonnet-5", "gemini-3-1-pro"], 4);
    signals.push(locale === "zh-TW" ? "研究需要來源整合、推理與可查證結論" : "Research needs source synthesis, reasoning, and verifiable conclusions");
  } else if (everydayTasks.includes(input.taskKind)) {
    add(scores, ["gpt-5-6-terra"], 8);
    add(scores, ["claude-sonnet-5"], 7);
    add(scores, ["gpt-5-6-luna", "gemini-3-5-flash"], 4);
    signals.push(locale === "zh-TW" ? "任務重視清楚文字與穩定初稿" : "The task prioritizes clear writing and a reliable draft");
  } else if (complexTasks.includes(input.taskKind)) {
    add(scores, ["gpt-5-6-sol"], 8);
    add(scores, ["claude-opus-5"], 7);
    add(scores, ["gpt-5-6-terra"], 5);
    add(scores, ["claude-sonnet-5", "gemini-3-1-pro"], 4);
    signals.push(locale === "zh-TW" ? "任務需要較深分析與多項限制整合" : "The task needs deeper analysis and constraint handling");
  } else {
    add(scores, ["gpt-5-6-terra"], 8);
    add(scores, ["claude-sonnet-5"], 6);
    add(scores, ["gpt-5-6-luna", "gemini-3-5-flash"], 3);
    signals.push(locale === "zh-TW" ? "未指定固定類型，優先採用通用推理" : "No fixed task type is selected, so general reasoning is prioritized");
  }

  const hasDeepMultimodalSources = input.sources.some((source) => ["uploaded_pdf", "spreadsheet", "reference_image"].includes(source));
  const genuinelyMultimodalTask = ["presentation", "poster", "image", "research", "report"].includes(input.taskKind);
  if (hasDeepMultimodalSources && genuinelyMultimodalTask) {
    add(scores, ["gemini-3-1-pro"], 7);
    add(scores, ["gpt-5-6-sol"], 3);
    signals.push(locale === "zh-TW" ? "任務同時需要理解 PDF、數據或視覺材料" : "The task genuinely combines PDF, data, or visual sources");
  }

  if (input.sources.length >= 3 || input.materialDetails.length > 280) {
    add(scores, ["claude-opus-5", "gpt-5-6-sol"], 3);
    if (genuinelyMultimodalTask) add(scores, ["gemini-3-1-pro"], 3);
    signals.push(locale === "zh-TW" ? "材料量較多，需要跨材料整理" : "The larger source set needs cross-source synthesis");
  }

  if (input.taskKind === "website" && input.siteScope === "mvp") {
    add(scores, ["gpt-5-6-terra"], 3);
    add(scores, ["gpt-5-6-luna", "gemini-3-5-flash", "claude-sonnet-5"], 2);
    signals.push(locale === "zh-TW" ? "採用快速 MVP，重視先完成可用小版本" : "Quick MVP mode favors a small usable first version");
  }

  if (input.taskKind === "website" && input.siteScope === "complete") {
    add(scores, ["gpt-5-6-sol"], 3);
    add(scores, ["claude-opus-5"], 2);
    signals.push(locale === "zh-TW" ? "完整版本需要較高的規格整合能力" : "Complete mode needs stronger specification handling");
  }

  // Kang Chiao accounts have ample credits, so task fit and quality outrank cost.
  add(scores, ["claude-opus-5", "gpt-5-6-sol"], 1);

  const ranked = [...MODELS].sort((a, b) => scores[b.id] - scores[a.id]);
  const focus = TASK_FOCUS[input.taskKind][locale];
  const explain = (model: ModelProfile) => locale === "zh-TW"
    ? `這次要做的是${focus}，選 ${model.name} 會比較順手。它的官方定位優勢是${model.strength[locale]}；不過${model.tradeoff[locale]}。`
    : `You need ${focus}, so ${model.name} should feel like the smoother choice. Its official positioning emphasizes ${model.strength[locale]}; however, ${model.tradeoff[locale]}.`;

  const recommended = ranked[0];
  const alternative = ranked[1];

  return {
    recommended: { ...recommended, score: scores[recommended.id], explanation: explain(recommended) },
    alternative: { ...alternative, score: scores[alternative.id], explanation: explain(alternative) },
    signals: signals.slice(0, 3),
    method: locale === "zh-TW"
      ? "依 Kuse 現行模型清單與原廠公開定位，綜合任務、材料與專案範圍推薦。Gemini 3.1 Pro 因流量較高先降低權重，只有進階多模態或長材料真的適合時才會升回來。"
      : "The score uses Kuse's current model list, official vendor positioning, task, sources, and project scope. Gemini 3.1 Pro starts lower because of its heavier usage and rises only for genuinely suitable advanced multimodal or long-context work.",
    alternativeLabel: locale === "zh-TW" ? "想換一種取向，也可以考慮" : "For a different balance, also consider",
    availabilityNote: locale === "zh-TW"
      ? "模型清單已依目前 Kuse 畫面更新；若 Kuse 日後調整版本，請以畫面中實際可用的模型為準。"
      : "The model list matches the current Kuse screen. If Kuse changes its versions later, use the models actually available in the selector.",
    allModels: ranked.map((model) => ({
      ...model,
      score: scores[model.id],
      explanation: explain(model),
    })),
  };
}
