export const TYPE_NAMES = {single:'單選', multiple:'複選', truefalse:'是非', tf_group:'是非組合', matching:'配對'};

export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

export function selectQuestions(bank, {unit='all', count=40, mode='practice', ids=[], track='all'}, random=Math.random) {
  let pool;
  if (mode==='lab') return ids.filter(id=>bank.questions.some(q=>q.id===id));
  if (mode==='mistakes') pool=bank.questions.filter(q=>ids.includes(q.id));
  else if (unit==='all') pool=bank.questions.filter(q=>!q.set);
  else {
    const target=bank.units.find(u=>u.unit===unit);
    if (!target) throw new Error('找不到單元');
    const byId=new Map(bank.questions.map(q=>[q.id,q]));
    pool=target.questionIds.map(id=>byId.get(id));
  }
  if (track!=='all') pool=pool.filter(q=>(q.track??'concept')===track);
  if (!pool.length) throw new Error('目前沒有可練習的題目');
  return shuffle(pool,random).slice(0,Math.min(Math.max(1,count),pool.length)).map(q=>q.id);
}

export function requiredCount(q) {
  if(q.type==='tf_group')return q.rows.length;
  if(q.type==='matching')return q.pairCount;
  return q.answerCount;
}

export function isComplete(q, answer=[]) {
  if(!Array.isArray(answer)||answer.length!==requiredCount(q)||answer.some(a=>typeof a!=='string'||!a))return false;
  if(q.type==='tf_group')return answer.every(a=>['是','否'].includes(a));
  if(q.type==='matching')return answer.every(a=>q.choices.includes(a));
  return new Set(answer).size===answer.length&&answer.every(a=>q.options.some(o=>o.key===a));
}

export function gradeQuestion(q, answer=[]) {
  if(!isComplete(q,answer)) return false;
  const expected=q.decoded_answer_parts;
  if(q.type==='multiple')return [...answer].sort().join('\u0000')===[...expected].sort().join('\u0000');
  return answer.every((a,i)=>a===expected[i]);
}

export function progress(session, byId) {
  return session.questionIds.filter(id=>isComplete(byId.get(id),session.answers[id])).length;
}

function increment(stats, key, correct, time) {
  const s=stats[key]??={key,total:0,correct:0,timeMs:0};
  s.total++;s.correct+=Number(correct);s.timeMs+=time;
}

export function gradeSession(session, bank) {
  const byId=new Map(bank.questions.map(q=>[q.id,q]));
  const topics={},types={},results=[];
  let correct=0,unanswered=0;
  for(const id of session.questionIds) {
    const q=byId.get(id);
    if(!q)throw new Error('紀錄中的題號不在目前題庫');
    const answer=session.answers[id]??[], complete=isComplete(q,answer), ok=gradeQuestion(q,answer);
    const time=Math.max(0,Number(session.elapsedByIdMs?.[id])||0);
    correct+=Number(ok);unanswered+=Number(!complete);
    // Use the active unit's source label when available; a deduplicated cross-unit test uses the first source label.
    const sourceOccurrence=q.occurrences?.find(o=>o.unit===session.unit);
    const topic=sourceOccurrence?.topic??q.topics[0];
    increment(topics,bank.topicTitles[topic]??topic,ok,time);
    increment(types,q.type,ok,time);
    results.push({id,correct:ok,complete,answer:[...answer],timeMs:time,confidence:session.confidence?.[id]??null,topic:bank.topicTitles[topic]??topic,type:q.type});
  }
  const total=results.length;
  return {total,correct,unanswered,incorrect:total-correct,percent:Math.round(correct/total*100),
    topics:Object.values(topics),types:Object.values(types),results,
    lowConfidence:results.filter(r=>r.correct&&r.confidence==='low').length,
    confidentWrong:results.filter(r=>!r.correct&&r.confidence==='high').length};
}

export function remainingSeconds(session, now=Date.now()) {
  return session.deadline==null?null:Math.max(0,Math.ceil((session.deadline-now)/1000));
}

export function formatTime(seconds) {
  const n=Math.max(0,Math.floor(seconds));
  return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;
}

export function feedback(report) {
  const lines=[];
  if(report.total<10)lines.push('本回少於 10 題，先用來定位疑問；增加題目再觀察穩定度。');
  const weakest=[...report.topics].filter(t=>t.correct<t.total).sort((a,b)=>(a.correct/a.total)-(b.correct/b.total)||b.total-a.total)[0];
  if(weakest)lines.push(`先複習「${weakest.key}」：本回 ${weakest.correct}/${weakest.total} 題答對，從錯題的需求條件與選項差異開始。`);
  if(report.confidentWrong)lines.push(`有 ${report.confidentWrong} 題「有把握但答錯」，優先核對原本的理由，避免把誤解記熟。`);
  if(report.lowConfidence)lines.push(`有 ${report.lowConfidence} 題「不確定但答對」，換個情境再回答一次，確認不是猜中。`);
  if(report.unanswered)lines.push(`${report.unanswered} 題未完整作答；限時練習可先答能判斷的題，再回看標記題。`);
  if(!report.incorrect)lines.push('本回全部答對。下一步可改做其他單元或不看選項解釋流程，確認能運用概念。');
  if(report.total>=10&&report.percent<80&&!weakest)lines.push('先把錯題拆成工作負載、資料流、服務與程式設定，找出需要補的概念。');
  return lines;
}

export function unresolvedMistakes(history, bank) {
  const valid=new Set(bank.questions.map(q=>q.id)), latest=new Map();
  for(const attempt of [...history].sort((a,b)=>a.finishedAt-b.finishedAt)) {
    for(const result of attempt.report.results)if(valid.has(result.id))latest.set(result.id,result.correct);
  }
  return [...latest].filter(([,ok])=>!ok).map(([id])=>id);
}
