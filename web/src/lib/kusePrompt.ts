import type { Locale } from "./types";

export type KuseRole = "teacher" | "admin";
export type KuseTaskKind =
  | "teaching_material"
  | "lesson_plan"
  | "worksheet"
  | "assessment"
  | "class_activity"
  | "presentation"
  | "website"
  | "notice"
  | "meeting_minutes"
  | "event_plan"
  | "sop"
  | "form"
  | "report"
  | "resource_guide"
  | "other";
export type KuseSource =
  | "kuse_textbook"
  | "uploaded_pdf"
  | "lesson_text"
  | "own_notes"
  | "transcript"
  | "official_document"
  | "spreadsheet"
  | "existing_template";
export type KuseFormat =
  | "structured"
  | "table"
  | "slides"
  | "webpage"
  | "checklist"
  | "notice";
export type KuseTone = "clear" | "friendly" | "formal" | "concise";
export type KuseRequirement =
  | "learning_objectives"
  | "teaching_steps"
  | "answer_key"
  | "differentiation"
  | "source_alignment"
  | "action_items"
  | "owners_deadlines"
  | "review_markers"
  | "source_notes"
  | "privacy_check";

export type KusePromptInput = {
  role: KuseRole;
  taskKind: KuseTaskKind;
  task: string;
  sources: KuseSource[];
  materialDetails: string;
  audience: string;
  amount: string;
  format: KuseFormat | null;
  tone: KuseTone | null;
  requirements: KuseRequirement[];
  extraConstraints: string;
  problemToSolve: string;
  primaryAction: string;
  visualStyle: string;
  outputLanguage: Locale;
};

type LabelMap<T extends string> = Record<T, Record<Locale, string>>;

export const SOURCE_LABELS: LabelMap<KuseSource> = {
  kuse_textbook: { en: "Kang Hsuan textbook / chapter", "zh-TW": "康軒教材／章節" },
  uploaded_pdf: { en: "Uploaded PDF", "zh-TW": "上傳的 PDF" },
  lesson_text: { en: "Lesson text / reference passage", "zh-TW": "課文／參考文字" },
  own_notes: { en: "My notes or draft", "zh-TW": "自己的筆記／草稿" },
  transcript: { en: "Meeting transcript", "zh-TW": "會議逐字稿" },
  official_document: { en: "Official document / policy", "zh-TW": "正式文件／規定" },
  spreadsheet: { en: "Spreadsheet or data", "zh-TW": "試算表／數據" },
  existing_template: { en: "Existing template", "zh-TW": "既有範本" },
};

export const FORMAT_LABELS: LabelMap<KuseFormat> = {
  structured: { en: "Structured sections", "zh-TW": "分段結構" },
  table: { en: "Table", "zh-TW": "表格" },
  slides: { en: "Slide outline", "zh-TW": "簡報大綱" },
  webpage: { en: "Webpage specification", "zh-TW": "網頁規格" },
  checklist: { en: "Checklist", "zh-TW": "檢核清單" },
  notice: { en: "Notice / message", "zh-TW": "公告／訊息格式" },
};

export const TONE_LABELS: LabelMap<KuseTone> = {
  clear: { en: "Clear and practical", "zh-TW": "清楚實用" },
  friendly: { en: "Friendly and approachable", "zh-TW": "親切易懂" },
  formal: { en: "Formal and professional", "zh-TW": "正式專業" },
  concise: { en: "Concise and direct", "zh-TW": "精簡直接" },
};

export const REQUIREMENT_LABELS: LabelMap<KuseRequirement> = {
  learning_objectives: { en: "Learning objectives", "zh-TW": "學習目標" },
  teaching_steps: { en: "Teaching steps", "zh-TW": "教學步驟" },
  answer_key: { en: "Answer key and explanations", "zh-TW": "答案與解析" },
  differentiation: { en: "Difficulty levels", "zh-TW": "分級難度" },
  source_alignment: { en: "Align with supplied material", "zh-TW": "對齊提供的教材" },
  action_items: { en: "Action items", "zh-TW": "待辦事項" },
  owners_deadlines: { en: "Owners and deadlines", "zh-TW": "負責人與期限" },
  review_markers: { en: "Mark items needing review", "zh-TW": "標記需確認內容" },
  source_notes: { en: "Source / evidence notes", "zh-TW": "來源／依據註記" },
  privacy_check: { en: "Privacy check", "zh-TW": "個資檢查" },
};

function selectedLabels<T extends string>(
  selected: T[],
  labels: LabelMap<T>,
  locale: Locale,
): string {
  return selected.map((item) => labels[item][locale]).join(locale === "zh-TW" ? "、" : ", ");
}

function field(value: string, fallback: string) {
  return value.trim() || fallback;
}

export function buildKusePrompt(input: KusePromptInput): string {
  const locale = input.outputLanguage;
  const sources = selectedLabels(input.sources, SOURCE_LABELS, locale);
  const requirements = selectedLabels(input.requirements, REQUIREMENT_LABELS, locale);
  const format = input.format ? FORMAT_LABELS[input.format][locale] : "";
  const tone = input.tone ? TONE_LABELS[input.tone][locale] : "";
  const isWebsite = input.taskKind === "website";
  const zhTaskRule: Record<KuseTaskKind, string> = {
    teaching_material: "教材內容需對齊指定材料、使用對象與學習目標，並提供可直接使用的清楚結構。",
    lesson_plan: "教案需對齊學習目標，清楚列出教學流程、所需材料與可檢查的學習成果。",
    worksheet: "學習單需對齊指定材料與學段，題目指示清楚，並保留可直接列印或編輯的結構。",
    assessment: "試卷需對齊指定範圍與學習目標，題意明確、難度可檢查，並分開提供答案與解析。",
    class_activity: "課堂活動需列出目標、時間、材料、教師步驟、學生任務與完成判準。",
    presentation: "簡報先提出敘事架構與逐頁大綱；每頁只處理一個重點，避免大段文字與沒有依據的數據。",
    website: "網站需服務明確使用者、解決一項真實問題，並讓使用者知道下一步行動。",
    notice: "公告需先整理對象、目的、時間、地點、必要行動與承辦窗口；缺少資訊時保留待確認欄位。",
    meeting_minutes: "會議紀錄需區分討論重點、決議、待辦、負責人與期限；沒有明確說出的決議不得自行補寫。",
    event_plan: "活動規劃需整理目標、對象、流程、時程、分工、資源與風險；未提供的日期與核准狀態不得自行假設。",
    sop: "SOP 需使用可執行步驟、前置條件、責任角色、例外處理與完成檢查。",
    form: "表單需先說明蒐集目的，題目順序清楚，只蒐集完成任務所需的最少資料。",
    report: "報告需區分已知事實、分析、待確認資訊與建議；所有數據均需能回到指定來源。",
    resource_guide: "資源指南需依使用者任務分類，提供清楚入口、簡短說明與下一步行動。",
    other: "依照這項任務建立可檢查的結構與完成判準。",
  };
  const enTaskRule: Record<KuseTaskKind, string> = {
    teaching_material: "Align the material with the selected sources, audience, and learning objectives, using a structure that is ready to teach from.",
    lesson_plan: "Align the lesson plan with learning objectives and clearly list the sequence, materials, and observable learning outcomes.",
    worksheet: "Align the worksheet with the supplied source and learning stage. Keep directions unambiguous and the layout ready to print or edit.",
    assessment: "Align the assessment with the stated scope and objectives. Use unambiguous questions, checkable difficulty, and a separate answer key with explanations.",
    class_activity: "List the objective, timing, materials, teacher steps, student actions, and completion criteria.",
    presentation: "Propose the narrative and slide-by-slide outline first. Give each slide one purpose; avoid dense copy and unsupported data.",
    website: "Serve a clearly defined user, solve one real problem, and make the user's next action explicit.",
    notice: "Organize the audience, purpose, time, location, required action, and contact. Leave explicit placeholders for missing facts.",
    meeting_minutes: "Separate discussion, decisions, action items, owners, and deadlines. Never invent a decision that was not stated.",
    event_plan: "Organize objectives, audience, flow, schedule, ownership, resources, and risks. Never assume dates or approval status.",
    sop: "Use executable steps, prerequisites, responsible roles, exception handling, and completion checks.",
    form: "State the collection purpose, order questions logically, and request only the minimum information required for the task.",
    report: "Separate known facts, analysis, unverified information, and recommendations. Every figure must trace to a selected source.",
    resource_guide: "Organize resources by user task with clear entry points, brief descriptions, and an explicit next action.",
    other: "Use a checkable structure and completion criteria suited to this task.",
  };

  if (locale === "zh-TW") {
    const role =
      input.role === "teacher"
        ? "你是在 Kuse 中協助康橋教師的教學設計夥伴。"
        : "你是在 Kuse 中協助康橋行政同仁的校務工作夥伴。";

    return [
      "【角色】",
      role,
      "",
      "【任務】",
      `請只完成以下一項任務：${field(input.task, "請先詢問我要完成的單一任務")}`,
      "",
      "【材料】",
      sources ? `優先依據：${sources}。` : "目前未指定材料；若完成任務需要資料，請先向我索取。",
      input.materialDetails.trim() ? `材料說明：${input.materialDetails.trim()}` : "",
      "只能依據我提供或指定的材料，不要自行補造教材內容、數據、日期、法規或引用來源。",
      "",
      "【輸出規格】",
      `使用對象：${field(input.audience, "未指定；請先詢問")}`,
      `數量或長度：${field(input.amount, "未指定；請依任務提出合理選項供我確認")}`,
      `格式：${format || "清楚分段、可直接修改使用"}`,
      `語氣：${tone || "清楚、精準、符合使用情境"}`,
      requirements ? `必須包含：${requirements}。` : "",
      input.extraConstraints.trim() ? `其他限制：${input.extraConstraints.trim()}` : "",
      "輸出語言：繁體中文。",
      isWebsite ? "【網站需求】" : "",
      isWebsite ? `要解決的問題：${field(input.problemToSolve, "未指定；請先詢問")}` : "",
      isWebsite ? `使用者最重要的行動：${field(input.primaryAction, "未指定；請先詢問")}` : "",
      isWebsite ? `視覺風格：${field(input.visualStyle, "清楚、易讀，視覺服務於資訊與行動")}` : "",
      "",
      "【工作規則】",
      "1. 先檢查角色、任務、材料與規格是否足夠；不清楚的地方先提問，不要自行假設。",
      "2. 一次只處理這一項任務，不延伸成其他未要求的內容。",
      `3. ${zhTaskRule[input.taskKind]}`,
      "4. 先產出可直接使用的完整初稿，再列出需要人工確認的項目。",
      "5. 不使用真實學生姓名、成績、輔導、健康、人事或其他敏感資料。",
      "6. 正確性、適齡性、法規、日期與引用內容若無法從材料確認，明確標示「待人工查證」。",
      isWebsite ? "7. 先提出網站架構與區塊規劃，再完成網站；首頁要能快速說明用途與主要行動。" : "",
      isWebsite ? "8. 優先確保手機閱讀、資訊層級、按鈕文字與實際用途；避免冗長文字、無功能按鈕與不必要動畫。" : "",
    ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const role =
    input.role === "teacher"
      ? "You are an instructional design partner assisting a Kang Chiao teacher in Kuse."
      : "You are a school operations partner assisting Kang Chiao administrative staff in Kuse.";

  return [
    "[ROLE]",
    role,
    "",
    "[TASK]",
    `Complete only this one task: ${field(input.task, "Ask me to define one task before continuing")}`,
    "",
    "[MATERIALS]",
    sources ? `Use these sources first: ${sources}.` : "No source is selected. Ask me for material if the task requires it.",
    input.materialDetails.trim() ? `Material notes: ${input.materialDetails.trim()}` : "",
    "Use only the materials I provide or identify. Do not invent textbook content, data, dates, policy, or citations.",
    "",
    "[OUTPUT SPECIFICATIONS]",
    `Audience: ${field(input.audience, "Not specified — ask me first")}`,
    `Amount or length: ${field(input.amount, "Not specified — offer reasonable options for confirmation")}`,
    `Format: ${format || "Clear sections that are ready to edit and use"}`,
    `Tone: ${tone || "Clear, precise, and appropriate for the context"}`,
    requirements ? `Must include: ${requirements}.` : "",
    input.extraConstraints.trim() ? `Other constraints: ${input.extraConstraints.trim()}` : "",
    "Output language: English.",
    isWebsite ? "[WEBSITE REQUIREMENTS]" : "",
    isWebsite ? `Problem to solve: ${field(input.problemToSolve, "Not specified — ask me first")}` : "",
    isWebsite ? `Primary user action: ${field(input.primaryAction, "Not specified — ask me first")}` : "",
    isWebsite ? `Visual direction: ${field(input.visualStyle, "Clear and readable; visuals must support information and action")}` : "",
    "",
    "[WORKING RULES]",
    "1. Check whether the role, task, materials, and specifications are sufficient. Ask focused questions when anything is unclear; do not assume.",
    "2. Handle only this task. Do not expand into unrelated deliverables.",
    `3. ${enTaskRule[input.taskKind]}`,
    "4. Produce a complete, usable first draft, followed by a short list of items that need human review.",
    "5. Do not use real student names, grades, counseling, health, HR, or other sensitive data.",
    "6. Mark accuracy, age suitability, policy, dates, and citations as 'verify manually' whenever the supplied material cannot confirm them.",
    isWebsite ? "7. Propose the site structure and sections before building. The first screen must quickly explain the site's purpose and primary action." : "",
    isWebsite ? "8. Prioritize mobile reading, information hierarchy, explicit button labels, and working actions. Avoid long copy, non-functional buttons, and unnecessary animation." : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
