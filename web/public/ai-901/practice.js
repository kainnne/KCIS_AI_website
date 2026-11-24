export function questionLimit(bank,unit='all',track='all') {
  const pool=unit==='all'?bank.questions.filter(q=>!q?.set):(bank.units.find(u=>u.unit===unit)?.questionIds??[]).map(id=>bank.questions.find(q=>q?.id===id)??{id});
  const size=track!=='all'?pool.filter(q=>(q?.track??'concept')===track).length:unit==='all'?bank.questions.length-bank.questions.filter(q=>q?.set).length:pool.length;
  return Math.min(100,size);
}
export function questionCount(value,max=100) {
  const n=Number(value);
  return Math.min(max,Math.max(Math.min(5,max),Number.isFinite(n)?Math.round(n):20));
}
export function paceFeedback(samples) {
  const times=Object.values(samples).filter(t=>Number.isFinite(t)&&t>=0);
  if(times.length<5)return null;
  const seconds=Math.max(1,Math.round(times.reduce((a,b)=>a+b,0)/times.length/1000));
  if(seconds<25)return {seconds,tone:'quick',text:'偏快，確認題意'};
  if(seconds>90)return {seconds,tone:'slow',text:'偏慢，先答確定的'};
  return {seconds,tone:'steady',text:'節奏穩定'};
}
export function optionCorrect(q,value,row=0) {
  return q.type==='tf_group'||q.type==='matching'?q.decoded_answer_parts[row]===value:q.decoded_answer_parts.includes(value);
}

export function questionHeading(q) {
 if(q.type!=='matching')return q.stem;
 if(q.id==='bank-NEW03')return '將下列語音功能配對到相應的資料方向。';
 if(['bank-SC53','bank-SC54'].includes(q.id))return '將下列語音功能配對到相應的能力。';
 const quote=q.stem.match(/「([^」]+)」/);
 if(['bank-SC55','bank-SC56','bank-SC57'].includes(q.id)&&quote)return `保險報價系統有下列要求，應採用哪項負責任 AI 原則？\n${quote[1]}`;
 if(q.pairCount>1)return q.stem.split(/項目：|1\.\s/)[0].replace(/每個(?:選項|原則)可使用一次、多次或不使用。/g,'').trim();
 return q.stem;
}
