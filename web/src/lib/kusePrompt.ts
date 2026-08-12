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
  | "no_material"
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
export type KuseSiteScope = "mvp" | "complete";
export type KuseExecutionMode = "quick" | "standard";
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
  | "privacy_check"
  | "speaker_notes"
  | "mobile_first"
  | "working_actions"
  | "shareable_page";

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
  siteScope: KuseSiteScope;
  mustIncludeContent: string;
  linksAndActions: string;
  executionMode: KuseExecutionMode;
  outputLanguage: Locale;
};

type LabelMap<T extends string> = Record<T, Record<Locale, string>>;

export type PromptDesignNote = {
  title: string;
  body: string;
};

export const SOURCE_LABELS: LabelMap<KuseSource> = {
  kuse_textbook: { en: "Kuse built-in teaching material", "zh-TW": "Kuse 內建教材" },
  no_material: { en: "I don't have source material", "zh-TW": "我沒有資料" },
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
  speaker_notes: { en: "Speaker notes", "zh-TW": "講者備註" },
  mobile_first: { en: "Mobile-first layout", "zh-TW": "手機優先版面" },
  working_actions: { en: "Working buttons and links", "zh-TW": "可正常使用的按鈕與連結" },
  shareable_page: { en: "A shareable Kuse Page", "zh-TW": "可分享的 Kuse Page" },
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

export function buildPromptDesignNotes(input: KusePromptInput, locale: Locale): PromptDesignNote[] {
  const sources = selectedLabels(input.sources, SOURCE_LABELS, locale);
  const isNoMaterial = input.sources.includes("no_material");

  if (locale === "zh-TW") {
    const notes: PromptDesignNote[] = [
      {
        title: "任務",
        body: `${input.role === "teacher" ? "教學夥伴" : "行政夥伴"}・只做「${field(input.task, "這項任務")}」。`,
      },
      {
        title: "材料",
        body: isNoMaterial ? "沒有資料也能先做；校內事實留待補。" : sources ? `優先使用：${sources}。` : "需要資料時，讓 Kuse 一次問完。",
      },
      {
        title: "規格",
        body: `${field(input.audience, "對象待確認")}・${field(input.amount, "長度由 Kuse 建議")}`,
      },
    ];

    if (input.executionMode === "quick") {
      notes.push({ title: "速度", body: "少問、少規劃，先交付可用初稿。" });
    }
    if (input.taskKind === "website") {
      notes.push({
        title: "網站",
        body: input.siteScope === "mvp"
          ? "一頁、4–6 區塊；完成後點 Publish now。"
          : "先做核心頁面；完成後點 Publish now。",
      });
    }
    return notes;
  }

  const notes: PromptDesignNote[] = [
    {
      title: "Task",
      body: `${input.role === "teacher" ? "Teaching partner" : "Operations partner"} · only “${field(input.task, "this task")}.”`,
    },
    {
      title: "Sources",
      body: isNoMaterial ? "Start without sources; leave school facts blank." : sources ? `Use first: ${sources}.` : "Let Kuse ask once if sources are needed.",
    },
    { title: "Output", body: `${field(input.audience, "Audience to confirm")} · ${field(input.amount, "Let Kuse suggest the length")}` },
  ];

  if (input.executionMode === "quick") {
    notes.push({ title: "Speed", body: "Ask less, plan less, deliver a usable draft first." });
  }
  if (input.taskKind === "website") {
    notes.push({
      title: "Website",
      body: input.siteScope === "mvp"
        ? "One page, 4–6 sections; then click Publish now."
        : "Build core pages first; then click Publish now.",
    });
  }
  return notes;
}

export function buildDetailedPromptDesignNotes(input: KusePromptInput, locale: Locale): PromptDesignNote[] {
  const sources = selectedLabels(input.sources, SOURCE_LABELS, locale);
  const requirements = selectedLabels(input.requirements, REQUIREMENT_LABELS, locale);
  const format = input.format ? FORMAT_LABELS[input.format][locale] : "";
  const tone = input.tone ? TONE_LABELS[input.tone][locale] : "";
  const isNoMaterial = input.sources.includes("no_material");

  if (locale === "zh-TW") {
    const notes: PromptDesignNote[] = [
      {
        title: "1. 先說 AI 是誰",
        body: input.role === "teacher"
          ? "我把 AI 設定成教學設計夥伴，讓它用老師真正能採用的方式整理內容。"
          : "我把 AI 設定成行政工作夥伴，讓它優先考慮清楚、可執行與方便交接。",
      },
      {
        title: "2. 一次只做一件事",
        body: `這次只完成「${field(input.task, "這項任務")}」，避免 Kuse 自動延伸成不需要的簡報、報告或其他成品。`,
      },
      {
        title: "3. 說清楚資料邊界",
        body: isNoMaterial
          ? "你選擇沒有資料，所以 Kuse 可以先做通用初稿；校內日期、數字、規定與連結必須留待補。"
          : sources
            ? `你指定優先使用「${sources}」。沒有出現在材料裡的校內事實，Kuse 不應自己猜。`
            : "你沒有指定材料。若任務真的需要資料，Kuse 會集中問一次；不需要時就直接先做。",
      },
      {
        title: "4. 設定怎樣才算完成",
        body: `使用對象是「${field(input.audience, "尚未指定")}」，份量是「${field(input.amount, "交給 Kuse 建議")}」${format ? `，格式採「${format}」` : ""}${tone ? `，語氣採「${tone}」` : ""}${requirements ? `，並加入「${requirements}」` : ""}。這些都是驗收條件，不是漂亮但空泛的形容詞。`,
      },
    ];

    if (input.executionMode === "quick") {
      notes.push({
        title: "5. 用精簡模式換速度",
        body: "Kuse 最多集中問一次、一次不超過三題；它會略過長篇規劃，先交付最小可用初稿，再讓你決定要不要加深。",
      });
    }

    if (input.taskKind === "website") {
      notes.push({
        title: `${notes.length + 1}. 網站要能真的分享`,
        body: input.siteScope === "mvp"
          ? "網站先限制成一頁、4–6 個必要區塊與一個主要行動。完成後使用 Kuse Page 的 Publish now 取得網址，不下載獨立 HTML。"
          : "網站先完成核心頁面再擴充。完成後使用 Kuse Page 的 Publish now 取得網址，不下載獨立 HTML。",
      });
    }

    notes.push({
      title: `${notes.length + 1}. 最後仍要由人判斷`,
      body: "AI 可以加快初稿，但日期、規定、引用、適齡性與敏感資料仍要由同仁確認；沒有依據的內容應標示待查證。",
    });
    return notes;
  }

  const notes: PromptDesignNote[] = [
    {
      title: "1. Give AI a role",
      body: input.role === "teacher"
        ? "AI is a teaching-design partner, so it should organize work in a form teachers can actually use."
        : "AI is an operations partner, so it should prioritize clarity, action, and handoff.",
    },
    {
      title: "2. Keep it to one task",
      body: `Kuse should complete only “${field(input.task, "this task")}” instead of expanding into slides, reports, or other unrequested deliverables.`,
    },
    {
      title: "3. Set a source boundary",
      body: isNoMaterial
        ? "You have no source material, so Kuse can draft generally but must leave school-specific dates, figures, policy, and links as placeholders."
        : sources
          ? `Use “${sources}” first. Kuse should not guess school facts that are absent from those sources.`
          : "No source is selected. Kuse can ask once if the task truly needs one; otherwise it should start.",
    },
    {
      title: "4. Define what done looks like",
      body: `Audience: “${field(input.audience, "not specified")}.” Scope: “${field(input.amount, "let Kuse suggest it")}.”${format ? ` Format: “${format}.”` : ""}${tone ? ` Tone: “${tone}.”` : ""}${requirements ? ` Include: “${requirements}.”` : ""} These are practical review criteria.`,
    },
  ];

  if (input.executionMode === "quick") {
    notes.push({
      title: "5. Trade depth for speed when appropriate",
      body: "Kuse asks only one consolidated set of up to three questions, skips a long planning speech, and delivers the smallest usable draft first.",
    });
  }

  if (input.taskKind === "website") {
    notes.push({
      title: `${notes.length + 1}. Make the website genuinely shareable`,
      body: input.siteScope === "mvp"
        ? "Keep it to one page, 4–6 essential sections, and one primary action. Use Publish now for a Kuse Page URL instead of downloading standalone HTML."
        : "Build the core pages first, then expand. Use Publish now for a Kuse Page URL instead of downloading standalone HTML.",
    });
  }

  notes.push({
    title: `${notes.length + 1}. Keep a human in the loop`,
    body: "AI speeds up the draft, but staff still verify dates, policy, citations, age suitability, and sensitive information. Unsupported content should be marked for review.",
  });
  return notes;
}

export function buildKusePrompt(input: KusePromptInput): string {
  const locale = input.outputLanguage;
  const sources = selectedLabels(input.sources, SOURCE_LABELS, locale);
  const requirements = selectedLabels(input.requirements, REQUIREMENT_LABELS, locale);
  const format = input.format ? FORMAT_LABELS[input.format][locale] : "";
  const tone = input.tone ? TONE_LABELS[input.tone][locale] : "";
  const isWebsite = input.taskKind === "website";
  const isMvpWebsite = isWebsite && input.siteScope === "mvp";
  const isNoMaterial = input.sources.includes("no_material");
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
      isNoMaterial ? "我目前沒有資料可提供。可用一般知識先完成初稿；校內日期、數字、規定與連結請保留待補。" : sources ? `優先依據：${sources}。` : "目前未指定材料；若完成任務需要資料，請一次向我索取。",
      input.materialDetails.trim() ? `材料說明：${input.materialDetails.trim()}` : "",
      isNoMaterial ? "不要自行補造校內資訊、數據、日期、法規或引用來源。" : "只能依據我提供或指定的材料，不要自行補造教材內容、數據、日期、法規或引用來源。",
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
      isWebsite ? `交付模式：${isMvpWebsite ? "快速 MVP（一頁式、先小後大）" : "完整版本（較完整的資訊架構與內容）"}` : "",
      isWebsite ? `要解決的問題：${field(input.problemToSolve, "未指定；請先詢問")}` : "",
      isWebsite ? `使用者最重要的行動：${field(input.primaryAction, "未指定；請先詢問")}` : "",
      isWebsite ? `視覺風格：${field(input.visualStyle, "清楚、易讀，視覺服務於資訊與行動")}` : "",
      isWebsite ? `必須出現的內容：${field(input.mustIncludeContent, "依已提供材料整理；不要自行補造事實")}` : "",
      isWebsite ? `按鈕與連結：${field(input.linksAndActions, "沒有真實網址時使用清楚標示的待補連結，不要做無功能按鈕")}` : "",
      "",
      "【工作規則】",
      input.executionMode === "quick" ? "【精簡模式】" : "",
      input.executionMode === "quick" ? "優先直接完成最小可用成果。必要時最多集中提問一次、最多 3 題；不要長篇說明計畫或重複確認。結尾最多列 3 項待人工確認內容。" : "",
      "1. 先檢查角色、任務、材料與規格是否足夠；必要缺漏集中提問，不要自行假設。",
      "2. 一次只處理這一項任務，不延伸成其他未要求的內容。",
      `3. ${zhTaskRule[input.taskKind]}`,
      "4. 先產出可直接使用的完整初稿，再列出需要人工確認的項目。",
      "5. 不使用真實學生姓名、成績、輔導、健康、人事或其他敏感資料。",
      "6. 正確性、適齡性、法規、日期與引用內容若無法從材料確認，明確標示「待人工查證」。",
      isWebsite ? "7. 請使用 Kuse 的 Web Page／AI Pages 能力建立網站成品，不要只回傳下載用或無法分享的獨立 HTML 檔案，也不要改做成簡報。" : "",
      isWebsite ? "8. 先用極短架構確認區塊後直接製作；最多一次集中詢問必要缺漏，能用清楚的待補欄位處理時就繼續，不要反覆來回規劃。" : "",
      isWebsite ? (isMvpWebsite ? "9. MVP 限制為一頁式、4–6 個必要區塊、單一主要行動。先完成可用的小版本，不增加登入、資料庫、後台或未要求的複雜功能。" : "9. 完整版本仍要先交付可用的核心頁面，再逐步補上次要頁面與功能；避免一次擴張成難以完成的系統。") : "",
      isWebsite ? "10. 優先確保手機閱讀、資訊層級、按鈕文字與實際用途；避免冗長文字、無功能按鈕與不必要動畫。" : "",
      isWebsite ? "11. 網站完成後使用 Kuse 內建發布流程。若畫面出現「Publish now」且必須由我操作，請只明確提醒我點擊一次；發布完成後回傳可分享的公開 URL。不要要求我下載 HTML 或到其他平台部署。" : "",
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
    isNoMaterial ? "I do not have source material. Use general knowledge for a first draft, but leave school-specific dates, figures, policy, and links as placeholders." : sources ? `Use these sources first: ${sources}.` : "No source is selected. Ask once for material if the task requires it.",
    input.materialDetails.trim() ? `Material notes: ${input.materialDetails.trim()}` : "",
    isNoMaterial ? "Do not invent school-specific facts, figures, dates, policy, or citations." : "Use only the materials I provide or identify. Do not invent textbook content, data, dates, policy, or citations.",
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
    isWebsite ? `Delivery mode: ${isMvpWebsite ? "Quick MVP (one page, start small)" : "Complete version (broader information architecture and content)"}` : "",
    isWebsite ? `Problem to solve: ${field(input.problemToSolve, "Not specified — ask me first")}` : "",
    isWebsite ? `Primary user action: ${field(input.primaryAction, "Not specified — ask me first")}` : "",
    isWebsite ? `Visual direction: ${field(input.visualStyle, "Clear and readable; visuals must support information and action")}` : "",
    isWebsite ? `Required content: ${field(input.mustIncludeContent, "Organize only the supplied material; do not invent facts")}` : "",
    isWebsite ? `Buttons and links: ${field(input.linksAndActions, "Use clearly marked placeholders when a real URL is unavailable; never create non-functional buttons")}` : "",
    "",
    "[WORKING RULES]",
    input.executionMode === "quick" ? "[QUICK MODE]" : "",
    input.executionMode === "quick" ? "Prioritize the smallest usable result. If essential, ask only one consolidated set of up to 3 questions. Do not give a long plan or repeat confirmations. End with no more than 3 items for human review." : "",
    "1. Check whether the role, task, materials, and specifications are sufficient. Consolidate essential questions; do not assume.",
    "2. Handle only this task. Do not expand into unrelated deliverables.",
    `3. ${enTaskRule[input.taskKind]}`,
    "4. Produce a complete, usable first draft, followed by a short list of items that need human review.",
    "5. Do not use real student names, grades, counseling, health, HR, or other sensitive data.",
    "6. Mark accuracy, age suitability, policy, dates, and citations as 'verify manually' whenever the supplied material cannot confirm them.",
    isWebsite ? "7. Use Kuse's Web Page / AI Pages capability to create the website deliverable. Do not return only a downloadable or unshareable standalone HTML file, and do not turn the task into a slide deck." : "",
    isWebsite ? "8. Confirm the section plan briefly, then build. Ask at most one consolidated set of essential questions; continue with clearly labeled placeholders when possible instead of prolonging planning." : "",
    isWebsite ? (isMvpWebsite ? "9. Keep the MVP to one page, 4–6 essential sections, and one primary action. Finish a small usable version first; do not add authentication, databases, admin panels, or unrequested complex features." : "9. For the complete version, deliver the usable core pages first and add secondary pages or features in stages. Do not expand it into an unnecessarily large system.") : "",
    isWebsite ? "10. Prioritize mobile reading, information hierarchy, explicit button labels, and working actions. Avoid long copy, non-functional buttons, and unnecessary animation." : "",
    isWebsite ? "11. When the site is ready, use Kuse's built-in publishing flow. If a 'Publish now' button appears and requires my action, tell me clearly to click it once. After publishing, return the public share URL. Do not ask me to download HTML or deploy it on another platform." : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
