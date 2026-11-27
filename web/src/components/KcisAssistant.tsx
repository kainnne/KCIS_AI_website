"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

// The same "Ask KCIS AI" panel as AI-901 (public/ai-901/helper.js), placed on every AI Tools feature.
// The Worker answers with an AI Tools guide, the navigator catalogue and a note for the current feature;
// the visible page text goes along as context so it can answer about what is on screen.
export type AssistantFeature = "home" | "navigator" | "kuse" | "forum" | "videos";

const API = "https://kainnne-practice-stats.chaos60649.workers.dev";
const HELPER = "/ai-901/helper.js?v=24";
const STYLES = "/assistant/helper.css?v=1";

type Strings = Record<string, string | string[]>;
const CONTACT_ZH = "需要真人協助（回報錯誤、帳號問題）時，請找資訊組 數位教學工程師 朱璽：\n\n- 學生：Google Chat 或寄信到 kainnne@kcis.com.tw\n- 教職員：Google Chat、Email 或分機 #2702\n- 老師和學生也都可以直接到資訊組找他";
const CONTACT_EN = "For help from a person (a bug or an account problem), contact Kaine Zhu, digital learning engineer in the IT team:\n\n- Students: Google Chat or email kainnne@kcis.com.tw\n- Teachers and staff: Google Chat, email or ext. #2702\n- Anyone can also visit the IT office in person";

const FEATURE_TEXT: Record<AssistantFeature, { zh: [string, string[]]; en: [string, string[]] }> = {
  home: {
    zh: ["嗨，我是 KCIS AI。不確定從哪個功能開始？告訴我你想完成的事，我幫你找合適的功能或 AI 工具。你可以問我：\n\n- 我想做課堂小考，該用哪個工具？\n- 康橋 AI 工具包怎麼安裝？\n- 數位週報最近在講什麼？", ["我想做課堂小考", "康橋 AI 工具包怎麼安裝？", "這個網站有哪些功能？"]],
    en: ["Hi, I am KCIS AI. Not sure where to start? Tell me what you want to do and I will point you to the right feature or AI tool. You can ask me:\n\n- Which tool should I use for a class quiz?\n- How do I install the KCIS AI toolkit?\n- What has the weekly newsletter covered?", ["I want to make a class quiz", "How do I install the toolkit?", "What can this site do?"]],
  },
  navigator: {
    zh: ["嗨，我是 KCIS AI，陪你挑 AI 工具。說說你的身分和想完成的事，我會從導航裡的工具推薦最適合的幾個，並提醒使用限制。你可以問我：\n\n- 老師想做學習單，推薦哪個工具？\n- 這幾個工具差在哪裡？\n- 哪些工具可以免費使用？", ["推薦做學習單的工具", "這幾個工具差在哪？", "哪些工具免費？"]],
    en: ["Hi, I am KCIS AI. I can help you choose AI tools. Tell me your role and what you want to do, and I will recommend the best fits from the navigator with any limits to keep in mind. You can ask me:\n\n- Which tool is best for worksheets?\n- How do these tools differ?\n- Which tools are free?", ["Tools for worksheets", "How do these tools differ?", "Which tools are free?"]],
  },
  kuse: {
    zh: ["嗨，我是 KCIS AI，陪你寫出好用的 Kuse 提示詞。把你的任務、對象和想要的成品告訴我，我可以幫你補齊細節或直接改寫。你可以問我：\n\n- 這個提示詞還缺什麼？\n- 幫我改成適合七年級的版本\n- 怎麼避免放進學生個資？", ["這個提示詞還缺什麼？", "幫我改寫得更清楚", "怎麼避免放進學生個資？"]],
    en: ["Hi, I am KCIS AI. I can help you write a better Kuse prompt. Tell me the task, the audience and the result you want, and I will fill in the details or rewrite it. You can ask me:\n\n- What is this prompt missing?\n- Rewrite it for Grade 7\n- How do I keep student data out?", ["What is this prompt missing?", "Make it clearer", "Keeping student data out"]],
  },
  forum: {
    zh: ["嗨，我是 KCIS AI。想在論壇發問或找答案？我可以幫你把問題寫清楚，或整理畫面上的討論。你可以問我：\n\n- 幫我把這個問題寫得更清楚\n- 這篇討論的重點是什麼？\n- 論壇要怎麼發問？", ["幫我把問題寫清楚", "這篇討論的重點？", "論壇要怎麼發問？"]],
    en: ["Hi, I am KCIS AI. Want to ask or find something in the forum? I can help you phrase a question or summarise the discussion on screen. You can ask me:\n\n- Help me phrase this question\n- What is the main point of this thread?\n- How do I post a question?", ["Help me phrase a question", "Summarise this thread", "How do I post?"]],
  },
  videos: {
    zh: ["嗨，我是 KCIS AI。告訴我你想學什麼，我推薦最適合的影片，並說明每支影片在講什麼。你可以問我：\n\n- 想用 Kuse 出小考，看哪一支？\n- 行政同仁適合從哪支開始？\n- 康軒雲學校系列有哪些？", ["用 Kuse 出小考看哪支？", "行政同仁從哪支開始？", "康軒雲學校系列有哪些？"]],
    en: ["Hi, I am KCIS AI. Tell me what you want to learn and I will suggest the right video and what it covers. You can ask me:\n\n- Which video shows quizzes in Kuse?\n- Where should admin staff start?\n- What is in the KNSH Cloud School series?", ["Video for Kuse quizzes", "Where should admin start?", "KNSH Cloud School series"]],
  },
};

const COMMON: { zh: Strings; en: Strings } = {
  zh: { helperEyebrow: "AI TOOLS", helper: "問 KCIS AI", helperOpen: "開啟 KCIS AI", helperTitle: "KCIS AI", helperClose: "關閉 KCIS AI", helperAsk: "輸入你的問題", helperSend: "送出", helperNote: "回答由 AI 產生，可能有錯，重要內容請再確認。", helperEmptyAnswer: "沒有取得回答，請換個問法再試一次。", helperLimit: "這一小時的提問次數已達上限，請稍後再試。", helperCap: "今天的 KCIS AI 用量已滿，請明天再試。", helperOff: "KCIS AI 尚未啟用。", helperError: "連線失敗，請再試一次。", helperPersonCap: "今天的提問量已達上限，請明天再試。", helperThread: "這段對話已經問了很多次，重新整理後再問。", helperTrace: "追溯碼", helperExpand: "放大視窗", helperShrink: "縮小視窗", helperPaused: "KCIS AI 暫停中，管理員正在檢查用量，請稍後再試。急需協助請用 Google Chat 或寄信到 kainnne@kcis.com.tw 找資訊組 朱璽，或直接到資訊組。", helperBlocked: "你過去一小時的用量異常偏高，KCIS AI 已暫停你的使用，明天會自動恢復。如有疑問請用 Google Chat 或寄信到 kainnne@kcis.com.tw 找資訊組 朱璽，或直接到資訊組。" },
  en: { helperEyebrow: "AI TOOLS", helper: "Ask KCIS AI", helperOpen: "Open KCIS AI", helperTitle: "KCIS AI", helperClose: "Close KCIS AI", helperAsk: "Type your question", helperSend: "Send", helperNote: "Answers are AI-generated and may contain mistakes. Check anything important.", helperEmptyAnswer: "No answer came back. Try asking another way.", helperLimit: "You have reached this hour's question limit. Try again later.", helperCap: "Today's KCIS AI quota is used up. Try again tomorrow.", helperOff: "KCIS AI is not available yet.", helperError: "Connection failed. Try again.", helperPersonCap: "You have reached today's question limit. Try again tomorrow.", helperThread: "This conversation has had many follow-ups. Reload to start again.", helperTrace: "Trace", helperExpand: "Enlarge", helperShrink: "Make smaller", helperPaused: "KCIS AI is paused while the administrator checks usage. Try again later. For urgent help, contact Kaine Zhu in the IT team by Google Chat or email (kainnne@kcis.com.tw), or visit the IT office.", helperBlocked: "Your usage in the last hour was unusually high, so KCIS AI is paused for you until tomorrow. Questions? Contact Kaine Zhu in the IT team by Google Chat or email (kainnne@kcis.com.tw), or visit the IT office." },
};

type Helper = { show(): void; hide(): void; question(id: string): void; refresh?(): void };
let helper: Helper | null = null;
let loading: Promise<Helper | null> | null = null;
const state: { feature: AssistantFeature; lang: "zh" | "en"; context?: () => Record<string, unknown> } = { feature: "home", lang: "zh" };

function pageText() {
  const main = document.querySelector("main") || document.body;
  return (main as HTMLElement).innerText.replace(/\n{3,}/g, "\n\n").slice(0, 2500);
}

function load(): Promise<Helper | null> {
  if (helper) return Promise.resolve(helper);
  if (loading) return loading;
  if (!document.querySelector('link[data-kcis-assistant]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = STYLES; link.dataset.kcisAssistant = "";
    document.head.append(link);
  }
  loading = import(/* webpackIgnore: true */ HELPER as string)
    .then((mod: { mountHelper: (options: unknown) => Helper }) => {
      helper = mod.mountHelper({
        apiBase: API,
        feature: () => state.feature,
        token: () => null,
        lang: () => state.lang,
        context: () => ({ screen: "AI Tools · " + state.feature, page: pageText(), details: state.context?.() || undefined }),
        t: (key: string) => {
          const [greeting, chips] = FEATURE_TEXT[state.feature][state.lang];
          if (key === "helperGreeting") return greeting + "\n\n" + (state.lang === "en" ? CONTACT_EN : CONTACT_ZH);
          if (key === "helperChips") return chips;
          return COMMON[state.lang][key] ?? key;
        },
      });
      return helper;
    })
    .catch(() => null);
  return loading;
}

export function KcisAssistant({ feature, context }: { feature: AssistantFeature; context?: () => Record<string, unknown> }) {
  const { locale } = useI18n();
  const contextRef = useRef(context);
  contextRef.current = context;
  useEffect(() => {
    state.feature = feature;
    state.lang = locale === "en" ? "en" : "zh";
    state.context = () => contextRef.current?.() || {};
    let active = true;
    void load().then((h) => {
      if (!active || !h) return;
      h.question("tools-" + feature);
      h.show();
    });
    return () => { active = false; helper?.hide(); };
  }, [feature, locale]);
  return null;
}
