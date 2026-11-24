import {isComplete,gradeQuestion} from './core.js?v=19';

export function recordAttempt(session,q,{reveal=false,timeMs=0}={}){
 if(session.attempts[q.id])return session.attempts[q.id];
 const answer=[...(session.answers[q.id]??[])],complete=isComplete(q,answer);
 if(!complete&&!reveal)return null;
 const status=!complete?'unknown':gradeQuestion(q,answer)?'correct':'wrong';
 const record=Object.freeze({status,answer:Object.freeze(answer),timeMs:Math.max(0,timeMs)});
 session.attempts[q.id]=record;return record;
}
export function summarizeAttempts(session,byId){
 const total=session.questionIds.length,counts={correct:0,wrong:0,unknown:0},units=new Set();
 for(const id of session.questionIds){counts[session.attempts[id]?.status??'unknown']++;for(const u of byId.get(id)?.units??[])if(u!=='U10')units.add(u);}
 return {...counts,total,notCorrect:counts.wrong+counts.unknown,percent:Math.round(counts.correct/total*1000)/10,coverage:units.size};
}
export function readinessFeedback(report,unit){
 if(report.total<20)return {title:'先累積題量',text:`這回只有 ${report.total} 題，可用來確認個別概念，還不足以判斷應考準備度。下一回可選至少 40 題跨單元，先不看答案，觀察首答是否穩定。`};
 if(report.percent<60)return {title:'先打好基礎',text:'先從不會題目的概念開始，再回頭看答錯題為什麼會混淆。練習用自己的話說明各選項的用途，配合短程式跑一次輸入到輸出的流程，會比連續猜題更有幫助；目前不宜只憑這回表現安排應考。'};
 if(report.percent<80)return {title:'需要補強',text:'先比較答錯題中相近選項的差別，再把不會題目的基本概念補起來。能不用答案說明資料方向、服務用途與程式流程後，再做跨單元練習；目前還適合繼續準備。'};
 if(unit!=='all')return {title:'先確認跨單元表現',text:report.percent>=85?'這個單元的首答表現不錯，可以換到全部題目，確認其他領域也掌握。應考前還需要能讀懂 SDK、API 與非同步流程，不能只用單一單元的高分判斷。':'先把這個單元答錯與不會的概念釐清，再換不同題目驗證。補強後再做跨單元練習，才能看出整體準備程度。'};
 if(report.percent>=90&&report.total>=40&&report.coverage>=6&&report.unknown/report.total<=.05)return {title:'接近應考',text:'這回跨單元的首答表現良好，可以進入完整模擬與實作核對。若不同題組仍能維持這個水準，並能獨立完成模型呼叫、工具或內容擷取的基本流程，可考慮安排應考；練習正確率不能直接換算正式考試量尺分數。'};
 if(report.percent>=80)return {title:'接近穩定',text:'主要概念已經掌握一些，但還要把答錯與不會的題目補齊，再換題組確認。若本回題量或領域不夠廣，先增加跨單元練習，也要實際跑過 Foundry 與 SDK 的基本操作，再判斷是否安排應考。'};

}
