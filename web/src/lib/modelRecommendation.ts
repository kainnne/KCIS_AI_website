import type { Locale } from "./types";
import type { KusePromptInput, KuseTaskKind } from "./kusePrompt";

type GeneralModelId = "claude-sonnet-5-5" | "claude-haiku-5-5" | "gpt-6-1-sol" | "gemini-3-8-flash";
type ImageModelId = "gpt-image-2-5-sunburst" | "nano-banana-2-0";

type ModelProfile<Id extends string = GeneralModelId | ImageModelId> = {
  id: Id;
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

const MODELS: ModelProfile<GeneralModelId>[] = [
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    strength: {
      en: "Natural Traditional Chinese, layout for slides, documents and handouts, video scripts, transcript cleanup, and multi-step work (1.0x)",
      "zh-TW": "繁體中文語句自然，擅長簡報、文件與講義排版，也適合影片腳本、逐字稿整理、文字修訂及多步驟任務（1.0x）",
    },
    tradeoff: {
      en: "GPT-6.1 Sol is steadier for heavy calculations and research with many facts to verify.",
      "zh-TW": "大量計算或需要逐項查證的研究，GPT-6.1 Sol 較穩定。",
    },
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    strength: {
      en: "Typo fixes, short translations, simple rewrites, and quick formatting at the lowest point multiplier (0.2x)",
      "zh-TW": "適合修正錯字、短文翻譯、簡單改寫與快速調整格式，點數倍率最低（0.2x）",
    },
    tradeoff: {
      en: "Use Sonnet 5.5 for long, complex, or design-heavy work.",
      "zh-TW": "長篇、複雜或重視版面設計的工作，較適合交給 Sonnet 5.5。",
    },
  },
  {
    id: "gpt-6-1-sol",
    name: "GPT-6.1 Sol",
    strength: {
      en: "Steady with numbers, spreadsheets, grades, survey data, and research that needs extensive fact-checking",
      "zh-TW": "擅長數字處理、試算表、成績與問卷資料分析，也適合需要逐項查證的研究",
    },
    tradeoff: {
      en: "Kuse's default costs 1.1x points. Sonnet 5.5 tends to produce more natural writing and slide layouts.",
      "zh-TW": "Kuse 的預設模型，點數倍率為 1.1x。文字表達與簡報版面通常以 Sonnet 5.5 較自然。",
    },
  },
  {
    id: "gemini-3-8-flash",
    name: "Gemini 3.8 Flash",
    strength: {
      en: "An option when you prefer Gemini or another model has fallen short",
      "zh-TW": "想用 Gemini，或其他模型的結果不符合需求時，可以試用",
    },
    tradeoff: {
      en: "This Flash model costs 2.3x points, the highest multiplier among Kuse's general models.",
      "zh-TW": "這款 Flash 模型的點數倍率為 2.3x，在 Kuse 通用模型中最高。",
    },
  },
];

const IMAGE_DEFAULT: ModelProfile<ImageModelId> = {
  id: "gpt-image-2-5-sunburst",
  name: "GPT Image 2.5 Sunburst",
  strength: {
    en: "Illustrations and other new images (1.0x)",
    "zh-TW": "適合製作插畫或其他新圖片（1.0x）",
  },
  tradeoff: {
    en: "Select it in Kuse's Image tab.",
    "zh-TW": "請在 Kuse 的圖片分頁選用。",
  },
};

const IMAGE_EDIT_ALTERNATIVE: ModelProfile<ImageModelId> = {
  id: "nano-banana-2-0",
  name: "Nano Banana 2.0",
  strength: {
    en: "An alternative for editing an existing image (1.3x)",
    "zh-TW": "編修既有圖片時可考慮的備選（1.3x）",
  },
  tradeoff: {
    en: "It uses more points than the default image model.",
    "zh-TW": "點數倍率高於預設圖片模型。",
  },
};

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

const DATA_TASK = /試算表|分析.{0,10}(?:成績|問卷|數據|資料)|(?:成績|問卷|數據|資料).{0,10}(?:分析|統計)|問卷結果|統計.{0,10}(?:成績|問卷|數據|資料)|\b(?:spreadsheets?|data analysis|analy[sz]e (?:the )?(?:student )?(?:data|grades|survey|results)|survey (?:data|results|analysis)|grade analysis)\b/i;
const QUICK_EDIT = /(?:錯[別别]?字|別字|漏字|短文翻譯|翻譯.{0,8}(?:短文|一小段|一句)|簡單(?:改寫|修正)|小幅修[改訂]|微調格式|快速排版|只(?:要|需).{0,8}(?:改寫|校對|調整格式))|\b(?:typos?|short translation|translate (?:this |a )?(?:short (?:text|passage|paragraph|sentence)|sentence)|simple rewrite|quick (?:fix|formatting)|minor (?:edits?|fixes))\b/i;
const SUBSTANTIAL_EDIT = /長篇|整[份篇本部]|整理.{0,8}逐字稿|製作.{0,8}(?:影片|簡報)|\b(?:long-form|full[- ]length|(?:whole|entire) (?:document|transcript|script)|\d{2,}[- ]page)\b/i;
const IMAGE_EDIT = /(?:編[修輯]|修[改圖]|調整|去背|換背景).{0,12}(?:原圖|現有|既有|附件|上傳|這張|圖片|照片)|(?:圖片|照片|原圖).{0,12}(?:去背|換背景|編修)|\b(?:edit|retouch|modify|crop) (?:\w+ ){0,4}(?:image|photo|picture|illustration)\b|\b(?:remove|replace) (?:the )?background\b/i;
const GEMINI_REQUEST = /(?:想(?:試|用)|請(?:試用|使用|用)|改用|換成|指定|希望(?:用|使用)|偏好|優先使用)\s*Gemini\b|\b(?:use|try|switch to|prefer|want) Gemini\b|^Gemini(?: 3\.8(?: Flash)?)?[.!。]?$/im;
const GEMINI_EXCLUDED = /(?:不要|請勿|避免)(?:使用|用|改用|試用)\s*Gemini\b|\b(?:do not|don['’]t|never|avoid) (?:us(?:e|ing)|try(?:ing)?) Gemini\b/i;
const MODEL_FALLBACK = /(?:其他|前面|先前|原本的|兩個).{0,18}(?:模型|結果).{0,12}(?:不適合|不符合|不理想|不好|不行|不滿意|失敗|沒成功|無法)|\b(?:other|previous|both) (?:models?|options?) (?:did not work|didn['’]t work|failed|fell short)\b/i;

export function recommendKuseModels(input: KusePromptInput, locale: Locale): ModelRecommendation {
  const { taskKind } = input;
  const request = [input.task, input.extraConstraints].map((value) => value.trim()).join("\n");
  const isImage = taskKind === "image" || taskKind === "poster" || input.format === "image" || input.format === "poster";
  const needsDataAnalysis = DATA_TASK.test(input.task) ||
    ((taskKind === "report" || taskKind === "other") && input.sources.includes("spreadsheet"));
  const isQuickEdit = QUICK_EDIT.test(input.task) && !SUBSTANTIAL_EDIT.test(request) &&
    input.sources.length < 3 && input.materialDetails.length <= 280;

  const scores: Record<GeneralModelId, number> = {
    "claude-sonnet-5-5": 8,
    "claude-haiku-5-5": 2,
    "gpt-6-1-sol": 5,
    "gemini-3-8-flash": 0,
  };
  const signal = (en: string, zh: string) => locale === "zh-TW" ? zh : en;
  const focus = TASK_FOCUS[taskKind][locale];
  const signals = [focus];

  if (isImage) {
    signals.push(signal("Image output uses Kuse's Image tab", "圖片成品使用 Kuse 的圖片分頁"));
  } else if (needsDataAnalysis || taskKind === "research" || taskKind === "website") {
    scores["gpt-6-1-sol"] = 10;
    if (needsDataAnalysis) {
      signals.push(signal("The task needs spreadsheet work or data analysis", "任務需要處理試算表或分析數據"));
    }
  } else if (isQuickEdit) {
    scores["claude-haiku-5-5"] = 10;
    signals.push(signal("The request is a small text or formatting fix", "只需簡單修訂文字或格式"));
  }

  if (!isImage && !GEMINI_EXCLUDED.test(request) && (GEMINI_REQUEST.test(request) || MODEL_FALLBACK.test(request))) {
    scores["gemini-3-8-flash"] = Math.max(...Object.values(scores)) - 1;
  }

  const choice = (model: ModelProfile, score: number): ModelChoice => ({
    ...model,
    score,
    explanation: `${model.strength[locale]}${signal(". ", "。")}${model.tradeoff[locale]}`,
  });
  const allModels = MODELS.map((model) => choice(model, scores[model.id]))
    .sort((a, b) => b.score - a.score);
  const editsImage = isImage && IMAGE_EDIT.test(request);
  const recommended = isImage ? choice(IMAGE_DEFAULT, 10) : allModels[0];
  let alternative = allModels[1];
  let alternativeLabel = signal("For a different balance, also consider", "想換一種取向，也可以考慮");

  if (editsImage) {
    alternative = choice(IMAGE_EDIT_ALTERNATIVE, 8);
    alternativeLabel = signal("Alternative for editing an existing image", "編修既有圖片的備選");
  } else if (isImage) {
    alternative = {
      ...allModels[0],
      explanation: signal(
        "Use Sonnet 5.5 to refine the image brief, composition, or poster copy before generating the image.",
        "生成圖片前，可以用 Sonnet 5.5 整理畫面需求、構圖或海報文案。",
      ),
    };
    alternativeLabel = signal("For preparing the image prompt", "撰寫圖片提示詞可用");
  }

  return {
    recommended,
    alternative,
    signals,
    method: signal(
      "Recommendations weigh task fit and Kuse points. Kuse lists image models in a separate tab.",
      "推薦依任務需求與 Kuse 點數評估。圖片模型列在 Kuse 的獨立分頁。",
    ),
    alternativeLabel,
    availabilityNote: signal(
      "The list matches the Kuse model menu as of 2026-11-27. Kuse shows each model's point multiplier in the selector.",
      "模型清單依 2026-11-27 的 Kuse 選單整理。Kuse 會在選單中顯示各模型的點數倍率。",
    ),
    allModels,
  };
}
