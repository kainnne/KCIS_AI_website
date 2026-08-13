import type { Locale } from "./types";

export type KuseRole = "teacher" | "admin";
export type KuseTaskKind =
  | "teaching_material"
  | "lesson_plan"
  | "worksheet"
  | "assessment"
  | "class_activity"
  | "presentation"
  | "poster"
  | "image"
  | "research"
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
  | "existing_template"
  | "web_sources"
  | "reference_image";
export type KuseFormat =
  | "structured"
  | "table"
  | "slides"
  | "poster"
  | "image"
  | "webpage"
  | "checklist"
  | "notice";
export type KuseTone = "clear" | "friendly" | "formal" | "concise";
export type KuseSiteScope = "mvp" | "complete";
export type KuseExecutionMode = "quick" | "standard";
export type KuseDeliveryMode = "artifact" | "conversation";
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
  | "shareable_page"
  | "citations"
  | "evidence_gaps"
  | "key_takeaways"
  | "visual_hierarchy"
  | "accurate_text";

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
  deliveryMode: KuseDeliveryMode;
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
  web_sources: { en: "Public web sources", "zh-TW": "公開網路來源" },
  reference_image: { en: "Reference image", "zh-TW": "參考圖片" },
};

export const FORMAT_LABELS: LabelMap<KuseFormat> = {
  structured: { en: "Structured sections", "zh-TW": "分段結構" },
  table: { en: "Table", "zh-TW": "表格" },
  slides: { en: "Presentation / slides", "zh-TW": "簡報／投影片" },
  poster: { en: "Poster / visual", "zh-TW": "海報／視覺成品" },
  image: { en: "Generated image", "zh-TW": "生成圖片" },
  webpage: { en: "Kuse Page / webpage", "zh-TW": "Kuse Page／網頁" },
  checklist: { en: "Checklist", "zh-TW": "檢核清單" },
  notice: { en: "Notice / message", "zh-TW": "公告／訊息格式" },
};

export const ARTIFACT_LABELS: LabelMap<KuseTaskKind> = {
  teaching_material: { en: "an editable teaching-material document", "zh-TW": "可編輯的教材文件" },
  lesson_plan: { en: "an editable lesson-plan document", "zh-TW": "可編輯的教案文件" },
  worksheet: { en: "a printable, editable worksheet", "zh-TW": "可列印、可編輯的學習單" },
  assessment: { en: "a complete, editable assessment file", "zh-TW": "完整可編輯的試卷檔案" },
  class_activity: { en: "a ready-to-use activity guide", "zh-TW": "可直接使用的活動指引" },
  presentation: { en: "a complete, editable presentation", "zh-TW": "完整可編輯的簡報成品" },
  poster: { en: "a finished poster or the closest editable visual artifact", "zh-TW": "完整海報或最接近的可編輯視覺成品" },
  image: { en: "a finished image saved in the Kuse workspace", "zh-TW": "儲存在 Kuse 工作區的完整圖片成品" },
  research: { en: "a sourced, editable research report", "zh-TW": "附來源、可編輯的研究報告" },
  website: { en: "a shareable Kuse Page", "zh-TW": "可分享的 Kuse Page 網站" },
  notice: { en: "an editable notice document", "zh-TW": "可編輯的公告文件" },
  meeting_minutes: { en: "an editable meeting-minutes document", "zh-TW": "可編輯的會議紀錄文件" },
  event_plan: { en: "an editable event-plan document", "zh-TW": "可編輯的活動企劃文件" },
  sop: { en: "an editable SOP document", "zh-TW": "可編輯的 SOP 文件" },
  form: { en: "a complete, editable form artifact", "zh-TW": "完整可編輯的表單成品" },
  report: { en: "an editable report document or report page", "zh-TW": "可編輯的報告文件或報告頁面" },
  resource_guide: { en: "an editable resource guide", "zh-TW": "可編輯的資源指南" },
  other: { en: "the closest complete, editable artifact for the task", "zh-TW": "最符合任務的完整可編輯成品" },
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
  citations: { en: "Sources for key claims", "zh-TW": "重要結論附來源" },
  evidence_gaps: { en: "Evidence gaps and conflicts", "zh-TW": "證據不足與衝突" },
  key_takeaways: { en: "Key takeaways", "zh-TW": "關鍵結論" },
  visual_hierarchy: { en: "Clear visual hierarchy", "zh-TW": "清楚的視覺層級" },
  accurate_text: { en: "Check all text in the image", "zh-TW": "檢查圖片內文字" },
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
        title: "交付",
        body: input.deliveryMode === "artifact" ? `建立${ARTIFACT_LABELS[input.taskKind][locale]}，不只給大綱。` : "先在對話中回答，不建立檔案。",
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
      notes.push({ title: "速度", body: input.deliveryMode === "artifact" ? "少問、少規劃，先交付小而可用的成品。" : "少問、少規劃，先給可用草稿。" });
    }
    if (input.taskKind === "website") {
      notes.push({
        title: "網站",
        body: input.deliveryMode === "artifact"
          ? (input.siteScope === "mvp" ? "一頁、4–6 區塊；完成後點 Publish now。" : "先做核心頁面；完成後點 Publish now。")
          : "先在對話中確認網站架構，不建立或發布頁面。",
      });
    }
    if (input.taskKind === "image") {
      notes.push({ title: "圖片", body: "指定主體、構圖與風格；成品要保存到工作區。" });
    }
    if (input.taskKind === "research") {
      notes.push({ title: "研究", body: "重要結論附來源，證據不足也要說明。" });
    }
    return notes;
  }

  const notes: PromptDesignNote[] = [
    {
      title: "Task",
      body: `${input.role === "teacher" ? "Teaching partner" : "Operations partner"} · only “${field(input.task, "this task")}.”`,
    },
    {
      title: "Delivery",
      body: input.deliveryMode === "artifact" ? `Create ${ARTIFACT_LABELS[input.taskKind][locale]}, not just an outline.` : "Answer in the conversation first; do not create a file.",
    },
    {
      title: "Sources",
      body: isNoMaterial ? "Start without sources; leave school facts blank." : sources ? `Use first: ${sources}.` : "Let Kuse ask once if sources are needed.",
    },
    { title: "Output", body: `${field(input.audience, "Audience to confirm")} · ${field(input.amount, "Let Kuse suggest the length")}` },
  ];

  if (input.executionMode === "quick") {
    notes.push({ title: "Speed", body: input.deliveryMode === "artifact" ? "Ask less, plan less, and deliver a small usable artifact first." : "Ask less, plan less, and give a usable draft first." });
  }
  if (input.taskKind === "website") {
    notes.push({
      title: "Website",
      body: input.deliveryMode === "artifact"
        ? (input.siteScope === "mvp" ? "One page, 4–6 sections; then click Publish now." : "Build core pages first; then click Publish now.")
        : "Confirm the site structure in conversation; do not create or publish a page yet.",
    });
  }
  if (input.taskKind === "image") {
    notes.push({ title: "Image", body: "Define subject, composition, and style; save the result in the workspace." });
  }
  if (input.taskKind === "research") {
    notes.push({ title: "Research", body: "Cite key findings and state where evidence is limited." });
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
        title: "先說 AI 是誰",
        body: input.role === "teacher"
          ? "我把 AI 設定成教學設計夥伴，讓它用老師真正能採用的方式整理內容。"
          : "我把 AI 設定成行政工作夥伴，讓它優先考慮清楚、可執行與方便交接。",
      },
      {
        title: "一次只做一件事",
        body: `這次只完成「${field(input.task, "這項任務")}」，避免 Kuse 自動延伸成不需要的簡報、報告或其他成品。`,
      },
      {
        title: "選擇交付方式",
        body: input.deliveryMode === "artifact"
          ? `你要求 Kuse 直接建立「${ARTIFACT_LABELS[input.taskKind][locale]}」。對話只需要簡短交代成果，不可以用大綱或製作建議代替成品。`
          : "你選擇先在對話中回答，適合討論方向、比較方案或確認大綱；這一步不建立檔案，確認後再切換成品模式。",
      },
      {
        title: "說清楚資料邊界",
        body: isNoMaterial
          ? "你選擇沒有資料，所以 Kuse 可以先做通用初稿；校內日期、數字、規定與連結必須留待補。"
          : sources
            ? `你指定優先使用「${sources}」。沒有出現在材料裡的校內事實，Kuse 不應自己猜。`
            : "你沒有指定材料。若任務真的需要資料，Kuse 會集中問一次；不需要時就直接先做。",
      },
      {
        title: "設定怎樣才算完成",
        body: `使用對象是「${field(input.audience, "尚未指定")}」，份量是「${field(input.amount, "交給 Kuse 建議")}」${format ? `，格式採「${format}」` : ""}${tone ? `，語氣採「${tone}」` : ""}${requirements ? `，並加入「${requirements}」` : ""}。這些都是驗收條件，不是漂亮但空泛的形容詞。`,
      },
    ];

    if (input.executionMode === "quick") {
      notes.push({
        title: "用精簡模式換速度",
        body: input.deliveryMode === "artifact" ? "Kuse 最多集中問一次、一次不超過三題；它會略過長篇規劃，先交付最小可用成品，再讓你決定要不要加深。" : "Kuse 最多集中問一次、一次不超過三題；它會略過長篇規劃，先給可用草稿。",
      });
    }

    if (input.taskKind === "website") {
      notes.push({
        title: input.deliveryMode === "artifact" ? "網站要能真的分享" : "網站先確認方向",
        body: input.deliveryMode === "artifact"
          ? (input.siteScope === "mvp" ? "網站先限制成一頁、4–6 個必要區塊與一個主要行動。完成後使用 Kuse Page 的 Publish now 取得網址，不下載獨立 HTML。" : "網站先完成核心頁面再擴充。完成後使用 Kuse Page 的 Publish now 取得網址，不下載獨立 HTML。")
          : "這一步只在對話中確認網站架構、區塊與內容草稿，不建立或發布 Kuse Page。",
      });
    }
    if (input.taskKind === "image") {
      notes.push({
        title: "把畫面需求說清楚",
        body: `圖片 Prompt 會說明主體、用途、構圖與風格「${field(input.visualStyle, "尚未指定")}」，並列出必要元素「${field(input.mustIncludeContent, "依任務安排")}」。成品模式要求直接生成圖片並保存，不能只回傳生成描述。`,
      });
    }
    if (input.taskKind === "research") {
      notes.push({
        title: "讓研究可以被查證",
        body: "研究會先回答問題，再列關鍵發現與來源；若資料不足或互相矛盾，也必須明確標示，避免把推論寫成事實。",
      });
    }

    notes.push({
      title: "最後仍要由人判斷",
      body: "AI 可以加快初稿，但日期、規定、引用、適齡性與敏感資料仍要由同仁確認；沒有依據的內容應標示待查證。",
    });
    return notes;
  }

  const notes: PromptDesignNote[] = [
    {
      title: "Give AI a role",
      body: input.role === "teacher"
        ? "AI is a teaching-design partner, so it should organize work in a form teachers can actually use."
        : "AI is an operations partner, so it should prioritize clarity, action, and handoff.",
    },
    {
      title: "Keep it to one task",
      body: `Kuse should complete only “${field(input.task, "this task")}” instead of expanding into slides, reports, or other unrequested deliverables.`,
    },
    {
      title: "Choose how Kuse should deliver",
      body: input.deliveryMode === "artifact"
        ? `Kuse must create ${ARTIFACT_LABELS[input.taskKind][locale]}. The chat reply may summarize the result, but an outline or production advice cannot replace the artifact.`
        : "You chose a conversation response for discussing direction, comparing options, or reviewing an outline. No file is created until you switch to artifact mode.",
    },
    {
      title: "Set a source boundary",
      body: isNoMaterial
        ? "You have no source material, so Kuse can draft generally but must leave school-specific dates, figures, policy, and links as placeholders."
        : sources
          ? `Use “${sources}” first. Kuse should not guess school facts that are absent from those sources.`
          : "No source is selected. Kuse can ask once if the task truly needs one; otherwise it should start.",
    },
    {
      title: "Define what done looks like",
      body: `Audience: “${field(input.audience, "not specified")}.” Scope: “${field(input.amount, "let Kuse suggest it")}.”${format ? ` Format: “${format}.”` : ""}${tone ? ` Tone: “${tone}.”` : ""}${requirements ? ` Include: “${requirements}.”` : ""} These are practical review criteria.`,
    },
  ];

  if (input.executionMode === "quick") {
    notes.push({
      title: "Trade depth for speed when appropriate",
      body: input.deliveryMode === "artifact" ? "Kuse asks only one consolidated set of up to three questions, skips a long planning speech, and delivers the smallest usable artifact first." : "Kuse asks only one consolidated set of up to three questions, skips a long planning speech, and gives a usable draft first.",
    });
  }

  if (input.taskKind === "website") {
    notes.push({
      title: input.deliveryMode === "artifact" ? "Make the website genuinely shareable" : "Confirm the website direction first",
      body: input.deliveryMode === "artifact"
        ? (input.siteScope === "mvp" ? "Keep it to one page, 4–6 essential sections, and one primary action. Use Publish now for a Kuse Page URL instead of downloading standalone HTML." : "Build the core pages first, then expand. Use Publish now for a Kuse Page URL instead of downloading standalone HTML.")
        : "Use the conversation to confirm the site structure, sections, and content draft. Do not create or publish a Kuse Page in this step.",
    });
  }
  if (input.taskKind === "image") {
    notes.push({
      title: "Make the visual request concrete",
      body: `The prompt defines the subject, purpose, composition, and style “${field(input.visualStyle, "not specified")},” plus required elements “${field(input.mustIncludeContent, "based on the task")}.” Artifact mode must generate and save the image, not return only a generation prompt.`,
    });
  }
  if (input.taskKind === "research") {
    notes.push({
      title: "Make the research verifiable",
      body: "The report answers the question first, then gives sourced findings. Limited or conflicting evidence must be labeled instead of being presented as fact.",
    });
  }

  notes.push({
    title: "Keep a human in the loop",
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
  const isVisual = input.taskKind === "image" || input.taskKind === "poster";
  const isResearch = input.taskKind === "research";
  const isMvpWebsite = isWebsite && input.siteScope === "mvp";
  const isNoMaterial = input.sources.includes("no_material");
  const usesWebSources = input.sources.includes("web_sources");
  const isArtifact = input.deliveryMode === "artifact";
  const artifact = ARTIFACT_LABELS[input.taskKind][locale];
  const zhTaskRule: Record<KuseTaskKind, string> = {
    teaching_material: "教材內容需對齊指定材料、使用對象與學習目標，並提供可直接使用的清楚結構。",
    lesson_plan: "教案需對齊學習目標，清楚列出教學流程、所需材料與可檢查的學習成果。",
    worksheet: "學習單需對齊指定材料與學段，題目指示清楚，並保留可直接列印或編輯的結構。",
    assessment: "試卷需對齊指定範圍與學習目標，題意明確、難度可檢查，並分開提供答案與解析。",
    class_activity: "課堂活動需列出目標、時間、材料、教師步驟、學生任務與完成判準。",
    presentation: "簡報需有清楚敘事與逐頁結構；每頁只處理一個重點，避免大段文字與沒有依據的數據。選擇成品模式時直接建立完整投影片，不要停在逐頁大綱。",
    poster: "海報需有單一溝通目標、清楚視覺層級與可快速閱讀的重點。選擇成品模式時直接建立海報或最接近的可編輯視覺成品，不要只提供文案或版面建議。",
    image: "圖片需先抓住主體、用途、構圖、風格、色彩、光線與尺寸。選擇成品模式時直接生成並保存圖片，不要只提供圖片 Prompt 或描述。圖片內文字必須精簡且逐字檢查。",
    research: "研究需先界定問題與範圍，再蒐集、比較與整合可信來源。重要結論需附可追溯來源，並分開標示已知事實、分析推論、證據不足與互相衝突之處。",
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
    presentation: "Use a clear narrative and slide-by-slide structure. Give each slide one purpose; avoid dense copy and unsupported data. In artifact mode, create the complete presentation instead of stopping at an outline.",
    poster: "Give the poster one communication goal, clear visual hierarchy, and scannable key points. In artifact mode, create the poster or closest editable visual artifact instead of returning only copy or layout advice.",
    image: "Define the subject, purpose, composition, style, color, lighting, and dimensions. In artifact mode, generate and save the image instead of returning only an image prompt or description. Keep in-image text minimal and verify it character by character.",
    research: "Define the question and scope before gathering, comparing, and synthesizing credible sources. Cite every key claim and separate established facts, analysis, evidence gaps, and conflicting findings.",
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
      isResearch && usesWebSources ? "可搜尋公開網路來源；優先使用第一手、官方、近期且可追溯的資料，記錄標題、發布者、日期與網址。" : "",
      isNoMaterial ? "不要自行補造校內資訊、數據、日期、法規或引用來源。" : isResearch && usesWebSources ? "除指定材料外可使用已查證的公開來源；不得補造資料、引文或不存在的網址。" : "只能依據我提供或指定的材料，不要自行補造教材內容、數據、日期、法規或引用來源。",
      "",
      "【輸出規格】",
      `使用對象：${field(input.audience, "未指定；請先詢問")}`,
      `數量或長度：${field(input.amount, "未指定；請依任務提出合理選項供我確認")}`,
      `格式：${format || "清楚分段、可直接修改使用"}`,
      `語氣：${tone || "清楚、精準、符合使用情境"}`,
      requirements ? `必須包含：${requirements}。` : "",
      input.extraConstraints.trim() ? `其他限制：${input.extraConstraints.trim()}` : "",
      "輸出語言：繁體中文。",
      "【交付方式】",
      isArtifact ? "直接建立成品。" : "先在對話中回答。",
      isArtifact ? `目標成品：${artifact}。` : "請在目前對話中提供清楚的大綱、草稿或建議，不建立檔案、頁面或其他成品。",
      isArtifact ? "請使用 Kuse 內建的內容／檔案建立能力，把成品存入工作區並開啟讓我檢查。不要只回覆大綱、示例文案、製作步驟或「你可以如何製作」。" : "完成對話回答後，只問我是否要把這個版本轉成正式成品。",
      isArtifact ? "若 Kuse 沒有完全對應的原生格式，請建立最接近且可編輯的成品，並用一句話說明格式差異；不要自行退回成純文字大綱。" : "",
      isVisual ? "【視覺需求】" : "",
      isVisual ? `視覺風格：${field(input.visualStyle, "清楚、符合使用對象與用途")}` : "",
      isVisual ? `必要元素：${field(input.mustIncludeContent, "依任務描述安排主體與畫面；沒有提供的校徽、人物或品牌素材不得自行仿造")}` : "",
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
      isResearch ? "7. 研究報告開頭先直接回答研究問題，再列關鍵結論；每項重要結論旁附來源，結尾列出來源清單、證據不足與需要人工複核處。" : "",
      isResearch ? "8. 不把搜尋摘要當成完整證據；遇到來源互相矛盾時並列呈現，不自行挑選方便的答案。" : "",
      isVisual && isArtifact ? "7. 使用 Kuse 的圖片建立能力與建議的圖片模型生成成品，保存到工作區並開啟檢查。若有參考圖，只參考指定的構圖或風格，不複製可識別人物、受保護角色或未授權品牌。" : "",
      isVisual && !isArtifact ? "7. 只在對話中提供圖片創意方向、構圖與可用的生成描述；這一步不要生成圖片。" : "",
      isWebsite && isArtifact ? "7. 請使用 Kuse 的 Web Page／AI Pages 能力建立網站成品，不要只回傳下載用或無法分享的獨立 HTML 檔案，也不要改做成簡報。" : "",
      isWebsite && !isArtifact ? "7. 只在對話中提供網站架構、區塊與內容草稿；這一步不要建立或發布 Kuse Page。" : "",
      isWebsite && isArtifact ? "8. 先用極短架構確認區塊後直接製作；最多一次集中詢問必要缺漏，能用清楚的待補欄位處理時就繼續，不要反覆來回規劃。" : "",
      isWebsite ? (isMvpWebsite ? `${isArtifact ? "9" : "8"}. MVP 限制為一頁式、4–6 個必要區塊、單一主要行動。先完成可用的小版本，不增加登入、資料庫、後台或未要求的複雜功能。` : `${isArtifact ? "9" : "8"}. 完整版本仍要先交付可用的核心頁面，再逐步補上次要頁面與功能；避免一次擴張成難以完成的系統。`) : "",
      isWebsite ? `${isArtifact ? "10" : "9"}. 優先確保手機閱讀、資訊層級、按鈕文字與實際用途；避免冗長文字、無功能按鈕與不必要動畫。` : "",
      isWebsite && isArtifact ? "11. 網站完成後使用 Kuse 內建發布流程。若畫面出現「Publish now」且必須由我操作，請只明確提醒我點擊一次；發布完成後回傳可分享的公開 URL。不要要求我下載 HTML 或到其他平台部署。" : "",
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
    isResearch && usesWebSources ? "You may search public web sources. Prefer primary, official, recent, and traceable evidence, recording the title, publisher, date, and URL." : "",
    isNoMaterial ? "Do not invent school-specific facts, figures, dates, policy, or citations." : isResearch && usesWebSources ? "You may supplement selected materials with verified public sources. Never invent data, quotations, or URLs." : "Use only the materials I provide or identify. Do not invent textbook content, data, dates, policy, or citations.",
    "",
    "[OUTPUT SPECIFICATIONS]",
    `Audience: ${field(input.audience, "Not specified — ask me first")}`,
    `Amount or length: ${field(input.amount, "Not specified — offer reasonable options for confirmation")}`,
    `Format: ${format || "Clear sections that are ready to edit and use"}`,
    `Tone: ${tone || "Clear, precise, and appropriate for the context"}`,
    requirements ? `Must include: ${requirements}.` : "",
    input.extraConstraints.trim() ? `Other constraints: ${input.extraConstraints.trim()}` : "",
    "Output language: English.",
    "[DELIVERY MODE]",
    isArtifact ? "Create the artifact now." : "Answer in the conversation first.",
    isArtifact ? `Target artifact: ${artifact}.` : "Provide a clear outline, draft, or recommendation in this conversation. Do not create a file, page, or other artifact yet.",
    isArtifact ? "Use Kuse's built-in content and file-creation capabilities, save the artifact in the workspace, and open it for review. Do not return only an outline, sample copy, production steps, or advice about how I could make it." : "After the conversation response, ask only whether I want to turn this version into a finished artifact.",
    isArtifact ? "If Kuse does not support the exact native format, create the closest editable artifact and explain the format difference in one sentence. Do not silently fall back to a text outline." : "",
    isVisual ? "[VISUAL REQUIREMENTS]" : "",
    isVisual ? `Visual style: ${field(input.visualStyle, "Clear and appropriate for the audience and purpose")}` : "",
    isVisual ? `Required elements: ${field(input.mustIncludeContent, "Arrange the subject and scene from the task; do not imitate an unprovided school logo, identifiable person, protected character, or unauthorized brand asset")}` : "",
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
    isResearch ? "7. Open the research report with a direct answer to the question, followed by key findings. Cite every important claim, then finish with a source list, evidence gaps, and items requiring human review." : "",
    isResearch ? "8. Do not treat search snippets as complete evidence. When sources conflict, present the disagreement instead of selecting the most convenient answer." : "",
    isVisual && isArtifact ? "7. Use Kuse's image-creation capability and the recommended image model to generate the artifact, save it in the workspace, and open it for review. If a reference image is supplied, use only the requested composition or style cues; do not copy identifiable people, protected characters, or unauthorized brand assets." : "",
    isVisual && !isArtifact ? "7. Provide only the creative direction, composition, and a usable generation description in the conversation. Do not generate an image in this step." : "",
    isWebsite && isArtifact ? "7. Use Kuse's Web Page / AI Pages capability to create the website deliverable. Do not return only a downloadable or unshareable standalone HTML file, and do not turn the task into a slide deck." : "",
    isWebsite && !isArtifact ? "7. Provide the site structure, sections, and content draft only in the conversation. Do not create or publish a Kuse Page in this step." : "",
    isWebsite && isArtifact ? "8. Confirm the section plan briefly, then build. Ask at most one consolidated set of essential questions; continue with clearly labeled placeholders when possible instead of prolonging planning." : "",
    isWebsite ? (isMvpWebsite ? `${isArtifact ? "9" : "8"}. Keep the MVP to one page, 4–6 essential sections, and one primary action. Finish a small usable version first; do not add authentication, databases, admin panels, or unrequested complex features.` : `${isArtifact ? "9" : "8"}. For the complete version, deliver the usable core pages first and add secondary pages or features in stages. Do not expand it into an unnecessarily large system.`) : "",
    isWebsite ? `${isArtifact ? "10" : "9"}. Prioritize mobile reading, information hierarchy, explicit button labels, and working actions. Avoid long copy, non-functional buttons, and unnecessary animation.` : "",
    isWebsite && isArtifact ? "11. When the site is ready, use Kuse's built-in publishing flow. If a 'Publish now' button appears and requires my action, tell me clearly to click it once. After publishing, return the public share URL. Do not ask me to download HTML or deploy it on another platform." : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
