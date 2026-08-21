import en from "../locales/en.json";
import zhTW from "../locales/zh-TW.json";
import type { Department, Level, Locale, UserNeed } from "./types";

function levelLabel(level: Level, locale: Locale): string {
  const map: Record<Level, { "zh-TW": string; en: string }> = {
    kindergarten: { "zh-TW": "幼兒園", en: "kindergarten" },
    elementary: { "zh-TW": "國小", en: "elementary school" },
    middle: { "zh-TW": "國中", en: "middle school" },
    high: { "zh-TW": "高中", en: "high school" },
    university: { "zh-TW": "大學", en: "university" },
  };
  return map[level][locale];
}

function departmentLabel(department: Department, locale: Locale): string {
  const map: Record<Department, { "zh-TW": string; en: string }> = {
    general_affairs: { "zh-TW": "總務處", en: "General Affairs" },
    hr: { "zh-TW": "人事處／人資", en: "HR" },
    it: { "zh-TW": "資訊處", en: "IT" },
    academic_affairs: { "zh-TW": "教務處", en: "Academic Affairs" },
    student_affairs: { "zh-TW": "學務處", en: "Student Affairs" },
    accounting: { "zh-TW": "會計／出納", en: "Accounting" },
    library: { "zh-TW": "圖書館", en: "Library" },
    other_office: { "zh-TW": "其他行政單位", en: "another administrative office" },
  };
  return map[department][locale];
}

function taskLabel(task: string | null, locale: Locale): string {
  if (!task) return locale === "zh-TW" ? "依我提供的內容完成一項任務" : "Complete a task from the information I provide";

  const tasks = locale === "zh-TW" ? zhTW.tasks : en.tasks;
  return tasks[task as keyof typeof tasks] ?? task.replaceAll("_", " ");
}

function roleContext(need: UserNeed): string {
  const locale = need.locale;

  if (locale === "zh-TW") {
    if (need.role === "admin") {
      const department = need.department ? departmentLabel(need.department, locale) : "行政單位";
      return `你是協助康橋${department}同仁的 AI 工作夥伴。使用者可能不熟悉 AI，請用清楚、自然、容易回應的方式協助。`;
    }

    const level = levelLabel(need.level ?? "middle", locale);
    if (need.role === "teacher") {
      return `你是協助康橋${level}教師的 AI 教學夥伴。使用者可能不熟悉 AI，請用清楚、自然、容易回應的方式協助。`;
    }
    return `你是協助一位${level}學生的 AI 學習夥伴。請用符合這個學習階段、清楚自然的方式協助。`;
  }

  if (need.role === "admin") {
    const department = need.department ? departmentLabel(need.department, locale) : "an administrative office";
    return `You are an AI work partner assisting Kang Chiao staff in ${department}. The user may be unfamiliar with AI, so help in a clear, natural, and easy-to-answer way.`;
  }

  const level = levelLabel(need.level ?? "middle", locale);
  if (need.role === "teacher") {
    return `You are an AI teaching partner assisting a Kang Chiao ${level} teacher. The user may be unfamiliar with AI, so help in a clear, natural, and easy-to-answer way.`;
  }
  return `You are an AI learning partner assisting a ${level} student. Help in a clear, natural way that suits this learning stage.`;
}

function selectedPreferences(need: UserNeed, hint?: string): string[] {
  const values = [hint, ...need.keywords]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return [...new Set(values)];
}

export function buildPrompt(need: UserNeed, hint?: string): string {
  const locale = need.locale;
  const customTask = need.task === "other" && need.note.trim();
  const task = customTask || taskLabel(need.task, locale);
  const details = customTask ? "" : need.note.trim();
  const preferences = selectedPreferences(need, hint);

  if (locale === "zh-TW") {
    return [
      roleContext(need),
      "",
      "【想完成的事情】",
      `任務：${task}`,
      details ? `補充：${details}` : "",
      preferences.length ? `希望包含：${preferences.join("；")}` : "",
      "請依目前資訊產出第一版，讓我可以直接查看、修改並繼續完善。",
    ]
      .filter((line, index) => line || index === 1)
      .join("\n");
  }

  return [
    roleContext(need),
    "",
    "[WHAT I WANT TO CREATE]",
    `Task: ${task}`,
    details ? `Additional context: ${details}` : "",
    preferences.length ? `Please include: ${preferences.join("; ")}` : "",
    "Create a first version from the information currently available so I can review, edit, and continue improving it.",
  ]
    .filter((line, index) => line || index === 1)
    .join("\n");
}
