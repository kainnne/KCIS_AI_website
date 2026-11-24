// Interface language for the practice site. Grading always uses the original Chinese answer values;
// English only changes what is displayed.
const KEY = 'ai901-lang';
let current = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; } })();

export const lang = () => current;
export function setLang(value) {
  current = value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(KEY, current); } catch {}
  document.documentElement.lang = current === 'en' ? 'en' : 'zh-Hant';
}

const S = {
  zh: {
    enter: '進入', pinLabel: '四碼密碼', pinRequired: '請輸入四碼密碼', pinWrong: '密碼不正確', loadFailed: '題庫載入失敗，請重新整理',
    kcisQ: '是否為康橋秀岡校區的學生？', yes: '是', no: '不是', kcisRequired: '請先完成身分選擇',
    category: '分類', allQuestions: '全部題目', count: '題數', countUnit: '題', start: '開始作答', home: '分類設定', autoCount: n => `${n} 題・自動`, customCount: '自訂題數', useAuto: '自動題數', suggested: '建議單元', allPassed: '九個單元都已達 80%，進入綜合測驗。', custom: '自訂練習', backToSuggested: '建議單元',
    selectAnswer: '選擇答案', selectN: n => `選 ${n} 項`, selectCount: n => `選擇 ${n} 項`, chooseOption: '選擇答案',
    reveal: '顯示答案', viewExplanation: '查看詳解', hideExplanation: '隱藏詳解', previous: '上一題', next: '下一題', finish: '完成作答',
    progress: '題目進度', correct: '答對', wrong: '答錯', unknown: '不會', isCorrect: '正確答案', notCorrect: '非正確答案',
    explanation: '詳解', fullZh: '完整詳解（中文）', glossary: '專有名詞解釋', firstTry: '首答正確率', total: n => `${n} 題`, retry: n => `再練 ${n} 題`, review: '查看題目',
    item: n => `項目 ${n}`, notes: '學習筆記', language: '語言',
    kcisNote: '學號僅用於保存錯題紀錄。', studentId: '學號', studentPlaceholder: 'j12345', confirmId: () => '確認學號', confirmCode: () => '確認編號或暱稱',
    confirm: '確認', edit: '修改', next2: '下一步', role: '選擇身分', roles: {student: '學生', teacher: '老師', staff: '教職員'}, code: '員工編號或暱稱', codePlaceholder: '例如 c1234567 或暱稱', codeNote: '可填寫員工編號或暱稱，僅用於保存錯題紀錄。',
    pinSet: '設定個人四碼', pinSetNote: '登入錯題紀錄時使用。', pinAgain: '再次輸入四碼確認', pinEnter: '輸入個人四碼', pinMismatch: '兩次輸入的四碼不一致',
    badStudent: '學號格式是 j 加數字，例如 j12345', badCode: '編號或暱稱需為 2–20 個字（中英文、數字、- 或 _），且不可使用學號格式', wrongPin: n => `四碼不正確，剩餘 ${n} 次嘗試`, locked: m => `嘗試次數過多，請於 ${m} 分鐘後再試`, network: '連線失敗，請稍後再試',
    mistakes: n => `錯題複習（${n} 題）`, signedIn: id => `${id}`, signOut: '登出', back: '返回',
    helper: '問小助手', helperOpen: '開啟 AI-901 小助手', helperTitle: 'AI-901 小助手', helperClose: '關閉小助手', helperAsk: '輸入你的問題', helperSend: '送出', helperNote: '回答由 AI 產生，可能有錯，重要觀念請對照官方文件。', helperChips: ['這題在考什麼？', '為什麼其他選項不對？', '用生活中的例子解釋'], helperEmpty: '可以問這一題、題目裡的名詞，或任何 AI-901 的觀念。', helperEmptyAnswer: '沒有取得回答，請換個問法再試一次。', helperLimit: '這一小時的提問次數已達上限，請稍後再試。', helperCap: '今天的小助手用量已滿，請明天再試。', helperOff: '小助手尚未啟用。', helperError: '連線失敗，請再試一次。', helperPersonCap: '今天的提問量已達上限，請明天再試。', helperThread: '這一題已經問了很多次，換一題或重新整理後再問。', helperTrace: '追溯碼',
    track: '題目類型', trackAll: '全部', trackConcept: '概念', trackHands: '實作', labs: '實作引導', labsNote: '依官方練習的步驟出題，沒有 Azure 環境也能先看懂流程。', steps: n => `${n} 步`, stepOf: (n, m) => `步驟 ${n}／${m}`, practiceSteps: '在 Foundry 實際操作', openLab: '開啟官方練習',
  },
  en: {
    enter: 'Enter', pinLabel: '4-digit code', pinRequired: 'Enter the 4-digit code', pinWrong: 'Incorrect code', loadFailed: "Couldn't load the question bank. Refresh to try again.",
    kcisQ: 'Are you a student at Kang Chiao International School, Xiugang campus?', yes: 'Yes', no: 'No', kcisRequired: 'Answer the question above first',
    category: 'Category', allQuestions: 'All questions', count: 'Questions', countUnit: '', start: 'Start', home: 'Categories', autoCount: n => `${n} questions · auto`, customCount: 'Custom count', useAuto: 'Auto count', suggested: 'Suggested unit', allPassed: 'All nine units are at 80% or above. Move on to the comprehensive review.', custom: 'Custom practice', backToSuggested: 'Suggested unit',
    selectAnswer: 'Select an answer', selectN: n => `Select ${n}`, selectCount: n => `Select ${n}`, chooseOption: 'Select an answer',
    reveal: 'Show answer', viewExplanation: 'Show explanation', hideExplanation: 'Hide explanation', previous: 'Previous', next: 'Next', finish: 'Finish',
    progress: 'Progress', correct: 'Correct', wrong: 'Incorrect', unknown: "Don't know", isCorrect: 'Correct answer', notCorrect: 'Not the correct answer',
    explanation: 'Explanation', fullZh: 'Full explanation (Chinese)', glossary: 'Glossary (Chinese)', firstTry: 'First-attempt score', total: n => `${n} questions`, retry: n => `Practice ${n} more`, review: 'Review questions',
    item: n => `Item ${n}`, notes: 'Notes', language: 'Language',
    kcisNote: 'Your student ID is used only to store your mistake record.', studentId: 'Student ID', studentPlaceholder: 'j12345', confirmId: () => 'Confirm student ID', confirmCode: () => 'Confirm ID or nickname',
    confirm: 'Confirm', edit: 'Edit', next2: 'Next', role: 'Select your role', roles: {student: 'Student', teacher: 'Teacher', staff: 'Staff'}, code: 'Staff ID or nickname', codePlaceholder: 'e.g. c1234567 or a nickname', codeNote: 'Enter a staff ID or nickname. Used only to store your mistake record.',
    pinSet: 'Set a personal PIN', pinSetNote: 'Used to sign in to your mistake record.', pinAgain: 'Confirm PIN', pinEnter: 'Enter personal PIN', pinMismatch: 'The two PINs do not match',
    badStudent: 'Student IDs start with j followed by digits, e.g. j12345', badCode: 'Use 2–20 characters: letters, digits, - or _ (not a student ID format)', wrongPin: n => `Incorrect PIN. ${n} attempts remaining`, locked: m => `Too many attempts. Try again in ${m} min`, network: 'Connection failed. Try again',
    mistakes: n => `Review mistakes (${n})`, signedIn: id => `${id}`, signOut: 'Sign out', back: 'Back',
    helper: 'Ask the assistant', helperOpen: 'Open the AI-901 assistant', helperTitle: 'AI-901 assistant', helperClose: 'Close the assistant', helperAsk: 'Type your question', helperSend: 'Send', helperNote: 'Answers are AI-generated and may contain mistakes. Check key concepts against Microsoft Learn.', helperChips: ['What is this question testing?', 'Why are the other options wrong?', 'Explain it with an everyday example'], helperEmpty: 'Ask about this question, a term in it, or any AI-901 concept.', helperEmptyAnswer: 'No answer came back. Try asking another way.', helperLimit: 'You have reached this hour\'s question limit. Try again later.', helperCap: 'Today\'s assistant quota is used up. Try again tomorrow.', helperOff: 'The assistant is not available yet.', helperError: 'Connection failed. Try again.', helperPersonCap: 'You have reached today\'s question limit. Try again tomorrow.', helperThread: 'This question has had many follow-ups. Move on or reload to ask again.', helperTrace: 'Trace',
    track: 'Question type', trackAll: 'All', trackConcept: 'Concepts', trackHands: 'Hands-on', labs: 'Guided labs', labsNote: 'Questions follow the steps of the official exercises, so you can learn the flow before you have an Azure environment.', steps: n => `${n} steps`, stepOf: (n, m) => `Step ${n} of ${m}`, practiceSteps: 'Try it in Foundry', openLab: 'Open the official exercise',
  },
};
export const t = (key, ...args) => { const v = S[current][key] ?? S.zh[key]; return typeof v === 'function' ? v(...args) : v; };

const UNIT_EN = {
  U01: 'AI Workloads and the Foundry Platform', U02: 'Responsible AI Principles', U03: 'Model Selection, Deployment and Endpoints',
  U04: 'Foundry Agent Development and SDK Integration', U05: 'Natural Language Processing and Text Analysis',
  U06: 'Speech Recognition, Synthesis and Translation', U07: 'Image Understanding and Visual Content Generation',
  U08: 'Content Understanding and Information Extraction', U09: 'RAG Retrieval and Application Integration', U10: 'AI-901 Comprehensive Review',
};
export const unitName = u => (current === 'en' && UNIT_EN[u.unit]) || u.name;

// Display text for a question in the current language, falling back to Chinese field by field.
export function qText(q, zhHeading) {
  const en = current === 'en' ? q.en : null;
  const optionText = key => en?.options?.[key] ?? q.options?.find(o => o.key === key)?.text;
  let stem = zhHeading;
  if (en?.stem) {
    stem = en.stem;
    if (q.type === 'matching' && q.pairCount > 1) stem = stem.split(/\bItems?:\s*|\s1\.\s/)[0].replace(/\s*Each [^.]*?may be used once, more than once, or not at all\.?/i, '').trim();
  }
  return {
    stem,
    option: optionText,
    row: i => en?.rows?.[i] ?? q.rows?.[i],
    choice: i => en?.choices?.[i] ?? q.choices?.[i],
    choiceOf: value => { const i = q.choices?.indexOf(value) ?? -1; return i >= 0 ? (en?.choices?.[i] ?? value) : value; },
    label: i => en?.matchLabels?.[i] ?? q.matchLabels?.[i],
    binary: value => current === 'en' ? ({是: 'Yes', 否: 'No'}[value] ?? value) : value,
  };
}

const READINESS_EN = {
  先累積題量: r => ['More questions needed', `This round has only ${r.total} questions. That is enough to check individual concepts, not exam readiness. Next time, try at least 40 questions across units without looking at answers, and see whether your first attempts hold up.`],
  先打好基礎: () => ['Foundations first', 'Start with the concepts behind the questions you did not know, then look at why the wrong answers confused you. Explaining each option in your own words and running a short script from input to output helps more than more guessing. This round alone is not a basis for booking the exam.'],
  需要補強: () => ['Needs reinforcement', 'Compare similar options in the questions you missed, then fill in the basics behind the ones you did not know. Once you can explain data direction, service purpose and code flow without the answer, move to cross-unit practice. Keep preparing for now.'],
  先確認跨單元表現: r => ['Check cross-unit performance', r.percent >= 85 ? 'Your first attempts in this unit are strong. Switch to all questions to confirm the other areas. Before the exam you also need to read SDK, API and asynchronous flows, so one unit\'s score is not enough.' : 'Clear up what you missed or did not know in this unit, then verify with different questions. Cross-unit practice afterwards shows your overall readiness.'],
  接近應考: () => ['Close to exam-ready', 'Your first attempts across units were strong. Move on to full mock exams and hands-on checks. If you keep this level on different question sets and can complete a basic model call, tool call or content extraction yourself, consider booking the exam. Practice scores do not convert to the official scaled score.'],
  接近穩定: () => ['Nearly stable', 'You have the main concepts, but finish reviewing what you missed and did not know, then confirm with another set. If this round was small or narrow, add cross-unit practice, and run the basic Foundry and SDK steps yourself before deciding on the exam.'],
};
export function readinessText(feedback, report) {
  if (current !== 'en') return feedback;
  const f = READINESS_EN[feedback.title];
  if (!f) return feedback;
  const [title, text] = f(report);
  return {title, text};
}
export function paceText(feedback) {
  if (!feedback) return '';
  if (current !== 'en') return `${feedback.seconds} 秒／題 · ${feedback.text}`;
  const text = {quick: 'Fast, check the wording', slow: 'Slow, answer the sure ones first', steady: 'Steady pace'}[feedback.tone] ?? '';
  return `${feedback.seconds}s per question · ${text}`;
}

// API base: same origin by default; a static host (GitHub Pages) points this meta tag at the practice Worker.
export const API_BASE=(document.querySelector('meta[name="practice-api"]')?.content??'').replace(/\/$/,'');

// Account + mistake book. The server stores only a keyed hash of the ID and an encrypted record.
const TOKEN = 'practice-token', ACCOUNT = 'practice-account';
export const account = () => { try { const token = localStorage.getItem(TOKEN), id = localStorage.getItem(ACCOUNT); return token ? {token, id} : null; } catch { return null; } };
export function saveAccount(token, id) { try { localStorage.setItem(TOKEN, token); localStorage.setItem(ACCOUNT, id); } catch {} }
export function clearAccount() { try { localStorage.removeItem(TOKEN); localStorage.removeItem(ACCOUNT); } catch {} }
export async function api(path, body) {
  let response;
  try { response = await fetch(`${API_BASE}/api/${path}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), keepalive: path === 'mistakes/update'}); }
  catch { throw Object.assign(new Error('network'), {data: {}}); }
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'network'), {data});
  return data;
}
export function apiMessage(err) {
  const d = err?.data ?? {};
  if (err?.message === 'wrong_pin') return t('wrongPin', d.remaining ?? 0);
  if (err?.message === 'locked') return t('locked', Math.max(1, Math.ceil((d.retryAfter ?? 60) / 60)));
  if (err?.message === 'bad_account') return null;
  return t('network');
}

// Learning path: U01→U09 in order; a unit counts as passed at ≥80% first-try on ≥20 questions. Then U10.
const progressKey = () => `practice-progress:${account()?.id ?? 'guest'}`;
export function readProgress() { try { return JSON.parse(localStorage.getItem(progressKey())) ?? {}; } catch { return {}; } }
export function recordProgress(unit, report) {
  if (!/^U\d\d$/.test(unit) || report.total < 20) return;
  const p = readProgress(); const prev = p[unit] ?? {best: 0};
  p[unit] = {best: Math.max(prev.best, report.percent), last: report.percent, total: report.total};
  try { localStorage.setItem(progressKey(), JSON.stringify(p)); } catch {}
}
export function suggestedUnit(units) {
  const p = readProgress();
  const next = units.find(u => u.unit !== 'U10' && !((p[u.unit]?.best ?? 0) >= 80));
  return next ? {unit: next, done: false} : {unit: units.find(u => u.unit === 'U10') ?? units.at(-1), done: true};
}
