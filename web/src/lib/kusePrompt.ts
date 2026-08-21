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
        title: "協作角色",
        body: `${input.role === "teacher" ? "教學" : "行政"}專案夥伴會用清楚、容易回應的方式引導，不假設使用者熟悉 AI。`,
      },
      {
        title: "專案成果",
        body: `一起完成「${field(input.task, "這項任務")}」，建立${ARTIFACT_LABELS[input.taskKind][locale]}。`,
      },
      {
        title: "對話方式",
        body: "有助於釐清或改善成品時，Kuse 可以自然提問並依回答調整；不需要為了提問而提問。",
      },
      {
        title: "已知資訊",
        body: isNoMaterial ? "目前沒有參考資料，先透過對話理解需求。" : sources ? `可參考：${sources}。` : "先整理已知內容，再一起補充需要的資訊。",
      },
    ];

    if (input.taskKind === "website") {
      notes.push({
        title: "網站專案",
        body: "依填寫的規模與內容建立網站，並用容易理解的方式引導預覽、調整與發布。",
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
      title: "Collaboration role",
      body: `The ${input.role === "teacher" ? "teaching" : "operations"} project partner guides clearly and does not assume the user is familiar with AI.`,
    },
    {
      title: "Project outcome",
      body: `Work together on “${field(input.task, "this task")}” and create ${ARTIFACT_LABELS[input.taskKind][locale]}.`,
    },
    {
      title: "Conversation",
      body: "Kuse may ask naturally when clarification would improve the result, then adapt to the answer without asking questions for their own sake.",
    },
    {
      title: "Known information",
      body: isNoMaterial ? "There is no reference material yet, so start by understanding the need through conversation." : sources ? `Available references: ${sources}.` : "Organize what is known, then identify useful additions together.",
    },
  ];

  if (input.taskKind === "website") {
    notes.push({
      title: "Website project",
      body: "Build from the requested scope and content, then guide preview, revision, and publishing in plain language.",
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
        title: "把 AI 當成專案夥伴",
        body: input.role === "teacher"
          ? "Kuse 會協助教師發展專案，並用清楚、容易回應的方式引導，不假設使用者熟悉 AI。"
          : "Kuse 會協助行政同仁發展專案，並用清楚、容易回應的方式引導，不假設使用者熟悉 AI。",
      },
      {
        title: "說明想完成的專案",
        body: `目前想完成「${field(input.task, "這項任務")}」，目標是建立${ARTIFACT_LABELS[input.taskKind][locale]}。這是方向，不是限制模型發揮的固定步驟。`,
      },
      {
        title: "允許自然對話",
        body: "若釐清想法或補充背景能讓成品更好，Kuse 可以自然提問，再依回答持續調整；不需要為了營造互動而刻意提問。",
      },
      {
        title: "從現有資訊開始",
        body: isNoMaterial
          ? "目前沒有參考資料，Kuse 會先透過對話理解需求，再和使用者一起發展第一版。"
          : sources
            ? `目前可參考「${sources}」。Kuse 會先整理已知資訊，也可以指出哪些補充內容有助於專案。`
            : "目前尚未指定材料。Kuse 會先整理已知資訊，再和使用者確認值得補充的部分。",
      },
      {
        title: "保留真正的需求",
        body: `使用對象為「${field(input.audience, "可在對話中確認")}」，預期份量為「${field(input.amount, "可由 Kuse 建議")}」${format ? `，格式為「${format}」` : ""}${tone ? `，語氣為「${tone}」` : ""}${requirements ? `，希望包含「${requirements}」` : ""}。只有使用者實際選擇或填寫的內容會進入 Prompt。`,
      },
    ];

    if (input.taskKind === "website") {
      notes.push({
        title: "用簡單方式協作網站",
        body: "Kuse 依填寫的規模、內容與視覺方向發展網站，並用非技術使用者也容易理解的方式引導預覽、修改與發布。",
      });
    }
    if (input.taskKind === "image") {
      notes.push({
        title: "把畫面需求說清楚",
        body: `目前視覺方向為「${field(input.visualStyle, "可在對話中探索")}」，必要內容為「${field(input.mustIncludeContent, "可在對話中確認")}」。Kuse 可以透過對話協助發展畫面，再建立並保存圖片。`,
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
      title: "Treat AI as a project partner",
      body: input.role === "teacher"
        ? "Kuse helps teachers develop projects with clear guidance that does not assume familiarity with AI."
        : "Kuse helps administrative staff develop projects with clear guidance that does not assume familiarity with AI.",
    },
    {
      title: "Describe the intended project",
      body: `The current goal is “${field(input.task, "this task")},” resulting in ${ARTIFACT_LABELS[input.taskKind][locale]}. This is direction, not a rigid procedure that limits the model.`,
    },
    {
      title: "Allow natural conversation",
      body: "Kuse may ask when clarification or context would improve the result, then adapt to the answers without asking questions merely to appear interactive.",
    },
    {
      title: "Start from available information",
      body: isNoMaterial
        ? "There is no reference material yet, so Kuse starts by understanding the need through conversation and develops a first version with the user."
        : sources
          ? `Available references are “${sources}.” Kuse organizes what is known and may identify additions that would help the project.`
          : "No material is selected yet. Kuse organizes what is known, then discusses useful additions with the user.",
    },
    {
      title: "Keep the actual requirements",
      body: `Audience: “${field(input.audience, "confirm in conversation")}.” Scope: “${field(input.amount, "let Kuse suggest it")}.”${format ? ` Format: “${format}.”` : ""}${tone ? ` Tone: “${tone}.”` : ""}${requirements ? ` Include: “${requirements}.”` : ""} Only choices and details supplied by the user enter the prompt.`,
    },
  ];

  if (input.taskKind === "website") {
    notes.push({
      title: "Collaborate on the website simply",
      body: "Kuse develops the website from the supplied scope, content, and visual direction, then guides preview, revision, and publishing in language a non-technical user can follow.",
    });
  }
  if (input.taskKind === "image") {
    notes.push({
      title: "Make the visual request concrete",
      body: `The current direction is “${field(input.visualStyle, "explore in conversation")},” with required content “${field(input.mustIncludeContent, "confirm in conversation")}.” Kuse may develop the visual through conversation, then create and save it.`,
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

export function buildKusePrompt(input: KusePromptInput, locale: Locale): string {
  const sources = selectedLabels(input.sources, SOURCE_LABELS, locale);
  const requirements = selectedLabels(input.requirements, REQUIREMENT_LABELS, locale);
  const format = input.format ? FORMAT_LABELS[input.format][locale] : "";
  const tone = input.tone ? TONE_LABELS[input.tone][locale] : "";
  const isWebsite = input.taskKind === "website";
  const isVisual = input.taskKind === "image" || input.taskKind === "poster";
  const isResearch = input.taskKind === "research";
  const isNoMaterial = input.sources.includes("no_material");
  const usesWebSources = input.sources.includes("web_sources");
  const artifact = ARTIFACT_LABELS[input.taskKind][locale];

  if (locale === "zh-TW") {
    const role =
      input.role === "teacher"
        ? "你是 Kuse 中協助康橋教師的專案協作夥伴。使用者可能不熟悉 AI，請用清楚、自然、容易回應的方式引導。"
        : "你是 Kuse 中協助康橋行政同仁的專案協作夥伴。使用者可能不熟悉 AI，請用清楚、自然、容易回應的方式引導。";

    const materialLines = [
      isNoMaterial ? "目前沒有參考資料；請依現有任務內容建立第一版。" : "",
      !isNoMaterial && sources ? `可參考：${sources}。` : "",
      input.materialDetails.trim() ? `材料說明：${input.materialDetails.trim()}` : "",
      isResearch && usesWebSources ? "可補充查證公開來源，優先使用第一手、官方、近期且可追溯的資料，並保留標題、發布者、日期與網址。" : "",
    ].filter(Boolean);

    const requirementLines = [
      input.audience.trim() ? `使用對象：${input.audience.trim()}` : "",
      input.amount.trim() ? `${isWebsite ? "網站規模" : "數量或長度"}：${input.amount.trim()}` : "",
      format ? `格式：${format}` : "",
      tone ? `語氣：${tone}` : "",
      requirements ? `需要包含：${requirements}。` : "",
      isWebsite && input.problemToSolve.trim() ? `要解決的問題：${input.problemToSolve.trim()}` : "",
      isWebsite && input.primaryAction.trim() ? `使用者最重要的行動：${input.primaryAction.trim()}` : "",
      (isWebsite || isVisual) && input.visualStyle.trim() ? `視覺方向：${input.visualStyle.trim()}` : "",
      (isWebsite || isVisual) && input.mustIncludeContent.trim() ? `必要內容：${input.mustIncludeContent.trim()}` : "",
      isWebsite && input.linksAndActions.trim() ? `連結與按鈕：${input.linksAndActions.trim()}` : "",
      input.extraConstraints.trim() ? `其他要求：${input.extraConstraints.trim()}` : "",
      "產出語言：繁體中文。",
    ].filter(Boolean);

    const lines = [
      role,
      "",
      "【想完成的專案】",
      `任務：${field(input.task, "請依我提供的內容建立合適的第一版專案")}`,
      `目標成品：${artifact}。`,
      "請在 Kuse 中建立第一版專案，讓我可以預覽、修改並繼續完善。",
    ];

    if (materialLines.length) lines.push("", "【參考資料】", ...materialLines);
    if (requirementLines.length) lines.push("", "【需求】", ...requirementLines);

    if (isVisual) {
      lines.push("請使用 Kuse 可用的圖片功能建立並保存成品；有參考圖時，將它作為這個專案的視覺參考。");
    }
    if (isWebsite) {
      lines.push("網站專案請依我選擇的規模與內容發展，並用容易理解的方式引導我預覽、調整與發布。");
    }

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const role =
    input.role === "teacher"
      ? "You are a project partner assisting a Kang Chiao teacher in Kuse. The user may be unfamiliar with AI, so guide them in a clear, natural, and easy-to-answer way."
      : "You are a project partner assisting Kang Chiao administrative staff in Kuse. The user may be unfamiliar with AI, so guide them in a clear, natural, and easy-to-answer way.";

  const materialLines = [
    isNoMaterial ? "I do not have reference material yet. Create a first version from the task information currently available." : "",
    !isNoMaterial && sources ? `Available references: ${sources}.` : "",
    input.materialDetails.trim() ? `Material notes: ${input.materialDetails.trim()}` : "",
    isResearch && usesWebSources ? "You may add verified public sources. Prefer primary, official, recent, and traceable evidence, and retain the title, publisher, date, and URL." : "",
  ].filter(Boolean);

  const requirementLines = [
    input.audience.trim() ? `Audience: ${input.audience.trim()}` : "",
    input.amount.trim() ? `${isWebsite ? "Website scope" : "Amount or length"}: ${input.amount.trim()}` : "",
    format ? `Format: ${format}` : "",
    tone ? `Tone: ${tone}` : "",
    requirements ? `Include: ${requirements}.` : "",
    isWebsite && input.problemToSolve.trim() ? `Problem to solve: ${input.problemToSolve.trim()}` : "",
    isWebsite && input.primaryAction.trim() ? `Primary user action: ${input.primaryAction.trim()}` : "",
    (isWebsite || isVisual) && input.visualStyle.trim() ? `Visual direction: ${input.visualStyle.trim()}` : "",
    (isWebsite || isVisual) && input.mustIncludeContent.trim() ? `Required content: ${input.mustIncludeContent.trim()}` : "",
    isWebsite && input.linksAndActions.trim() ? `Links and button actions: ${input.linksAndActions.trim()}` : "",
    input.extraConstraints.trim() ? `Other requirements: ${input.extraConstraints.trim()}` : "",
    "Output language: English.",
  ].filter(Boolean);

  const lines = [
    role,
    "",
    "[PROJECT TO CREATE]",
    `Task: ${field(input.task, "Create a suitable first version from the information I provide")}`,
    `Target project: ${artifact}.`,
    "Create the first version of the project in Kuse so I can preview, edit, and continue improving it.",
  ];

  if (materialLines.length) lines.push("", "[REFERENCE MATERIAL]", ...materialLines);
  if (requirementLines.length) lines.push("", "[REQUIREMENTS]", ...requirementLines);

  if (isVisual) {
    lines.push("Use Kuse's available image tools to create and save the result. Treat any supplied reference image as visual guidance for this project.");
  }
  if (isWebsite) {
    lines.push("Develop the website project from the scope and content I selected, then guide me through previewing, revising, and publishing it in plain language.");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
