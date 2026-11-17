// KCIS video lessons on YouTube (康橋頻道, unlisted).
// Titles and lengths match YouTube (checked 2026-11-17). Sources:
// - AI 數位教學系列: Proposals/20261029_AI數位週報/各期/YouTube連結_中英版.md and each issue's 中文版.md
// - 康軒雲教學系列 and Level: Proposals/20261106_康軒雲學校教學/README.md, 康軒雲學校_系列課程規劃.md
// - 專題與活動報告: Proposals/20261115_Apple_AI教育論壇/README.md
// Titles below omit the "康橋秀岡校區｜系列名｜" prefix that the page shows separately.

export type SeriesId = 'ai' | 'knsh' | 'report';
export type VideoVersion = { id: string; title: string; seconds: number };
export type VideoLesson = {
  key: string;
  series: SeriesId;
  number?: string;
  level?: number;
  zh?: VideoVersion;
  en?: VideoVersion;
};

export const SERIES: { id: SeriesId; zh: string; en: string }[] = [
  { id: 'ai', zh: 'AI 數位教學系列', en: 'AI Digital Teaching Series' },
  { id: 'knsh', zh: '康軒雲教學系列', en: 'KNSH Cloud School Series' },
  { id: 'report', zh: '專題與活動報告', en: 'Reports and Events' },
];

const knsh = (number: string, level: number, id: string, title: string, seconds: number): VideoLesson =>
  ({ key: 'knsh-' + number, series: 'knsh', number, level, zh: { id, title, seconds } });

export const VIDEOS: VideoLesson[] = [
  {
    key: 'ai-01', series: 'ai', number: '01',
    zh: { id: 'BShaVHVUwQs', title: '為秀岡校區老師與行政同仁打造的 AI 應用總覽', seconds: 588 },
    en: { id: '9WugjHyJR7E', title: 'An Overview of AI for Teachers and Staff', seconds: 636 },
  },
  {
    key: 'ai-02', series: 'ai', number: '02',
    zh: { id: 'VW_ehWEIrPk', title: '使用康軒 Kuse 出卷技能、康軒教材製作課堂小考', seconds: 294 },
    en: { id: 'FZq6NB7MyaQ', title: 'Making Class Quizzes with KNSH Kuse', seconds: 301 },
  },
  {
    key: 'ai-03-1', series: 'ai', number: '03-1',
    zh: { id: '7Eqvu2NlLCw', title: '用康軒 Kuse 製作課堂簡報：講義、康軒教材與家長日說明會', seconds: 279 },
    en: { id: 'oz8R6H_ex-U', title: 'Making Class Slides with KNSH Kuse', seconds: 265 },
  },
  {
    key: 'ai-03-2', series: 'ai', number: '03-2',
    zh: { id: 'MySdfxOAu00', title: '用康軒 Kuse 製作行政簡報：招生說明會、企劃提案、經費報告與行政公告', seconds: 235 },
    en: { id: 'Mrzh1gVkjqg', title: 'Making Admin Slides with KNSH Kuse', seconds: 237 },
  },
  {
    key: 'ai-04', series: 'ai', number: '04',
    zh: { id: 'fh5aPBcXycw', title: '資料交給 AI 之前：資料分級、四種 AI 與 Kuse 去識別化示範', seconds: 343 },
    en: { id: '13NE1KDE-Fs', title: 'Before You Give Data to AI', seconds: 340 },
  },
  knsh('1', 1, 'CqCE_DjyZy8', '用一份隨堂考，看懂康軒雲能幫老師做什麼（老師版導覽）', 184),
  knsh('2', 1, 'ceM5AKYX5ZA', '學生登入康軒雲後，怎麼寫任務、訂正、自己練習（學生版導覽）', 154),
  knsh('3', 1, 'bEyXOpGGhvM', '派一份線上小考，交卷後看每題錯誤率（派測驗任務）', 190),
  knsh('4', 2, 'PWWeWrG6M4s', '隨堂考時看每個學生作答，考完先講錯最多的題（監考與檢討）', 181),
  knsh('5', 1, 'iT5UGGkiL70', '派一篇閱讀測驗，看出學生卡在哪種閱讀能力（派素養任務）', 99),
  knsh('6', 1, '_CoBVoNL-go', '用短篇閱讀當課前暖身，學生答錯有解析影片（派短篇閱讀）', 141),
  knsh('7', 1, 'ffJpjc3_l5A', '派影片給學生預習，看出誰看完、看到哪裡（派影片任務）', 175),
  knsh('8', 1, 'GcUhwAak-Rc', '學生依課次自己練習，答錯的題目再練一次（學生自主學習）', 128),
  knsh('9', 2, 'aHeQdbbg4M4', '段考前直接派康軒整理好的複習卷（成卷專區）', 106),
  knsh('10', 2, '12VtAbUDPQg', '數學非選題手寫或拍照作答，老師依會考指引批改（數學非選擇試題）', 122),
  knsh('11', 2, 'T782p-tlHtw', '用實驗影片搭配題目，帶學生做探究（自然探究式教學）', 72),
  knsh('12', 2, 'hL4cs3rPkPQ', '讓學生練英語口說，系統判斷正確率和流暢度（AI 英語口說）', 129),
  knsh('13', 2, 'fzkXERau0KA', '派過的任務不用重做，改設定或另派給其他班（任務管理）', 132),
  knsh('14', 3, 'r4jaGzTnp58', '從報表找出全班最弱的單元，追到每位學生（報表區）', 119),
  knsh('15', 3, 'itiQ3WCNNcg', '用積分排行榜帶動學生自主練習（積分排行榜與學力爭鋒賽）', 134),
  knsh('16', 1, 'nVVkk9CM98c', '康橋老師常見問題：段考時間、題目順序、作弊（常見問題）', 105),
  {
    key: 'report-forum-2026', series: 'report',
    zh: { id: 'sPil5DEfdaA', title: '2026 國際教育領袖論壇報告（地端 AI 與學校資料安全）', seconds: 232 },
  },
];
