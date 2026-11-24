import {selectQuestions,requiredCount,isComplete,gradeQuestion,formatTime} from './core.js?v=18';
import {questionLimit,questionCount,paceFeedback,optionCorrect,questionHeading} from './practice.js?v=18';
import {recordAttempt,summarizeAttempts,readinessFeedback} from './attempts.js?v=18';
import {unlockVault} from './vault.js?v=18';
import {mountHelper} from './helper.js?v=18';
import {API_BASE,lang,setLang,t,unitName,qText,readinessText,paceText,account,saveAccount,clearAccount,api,apiMessage,recordProgress,suggestedUnit} from './i18n.js?v=18';

const main=document.querySelector('#main');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AUTO_COUNT=20;
// account mode (KCIS deployment): identity step + server mistake book. Local mode (default): shared code only, mistakes kept in this browser.
const ACCOUNT_MODE=document.querySelector('meta[name="practice-mode"]')?.content==='account';
const ASSISTANT_API=(document.querySelector('meta[name="assistant-api"]')?.content??'').replace(/\/$/,'');
const LOCAL_MISTAKES='practice-mistakes';
const readLocalMistakes=()=>{try{return JSON.parse(localStorage.getItem(LOCAL_MISTAKES))??[];}catch{return [];}};
const writeLocalMistakes=ids=>{try{localStorage.setItem(LOCAL_MISTAKES,JSON.stringify(ids));}catch{}};
let bank,byId,session,unit='all',track='all',count=AUTO_COUNT,customCount=false,customMode=false,busy=false,mistakeIds=[],screen=login;
const button=(label,action,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
function icon(ok,hidden=true){return `<svg class="verdict-icon" viewBox="0 0 24 24" ${hidden?'aria-hidden="true"':`role="img" aria-label="${ok?t('isCorrect'):t('notCorrect')}"`}><path d="${ok?'M5 12l4 4L19 6':'M6 6l12 12M18 6L6 18'}"/></svg>`;}
const clockIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const langSwitch=()=>`<div class="lang-switch" role="group" aria-label="${t('language')}">${[['zh','中文'],['en','English']].map(([code,label])=>`<button type="button" data-lang="${code}" aria-pressed="${lang()===code}">${label}</button>`).join('')}</div>`;
function helperContext(){
 const q=session&&current();if(!q)return {};
 const text=qText(q,questionHeading(q)),en=lang()==='en';
 return {screen:q.set?`guided lab: ${q.set.en}`:`practice round (${session.unit})`,position:`${session.position+1} of ${session.questionIds.length}`,stem:text.stem,options:q.options?.map(o=>({key:o.key,text:text.option(o.key)})),rows:q.rows?.map((_,i)=>text.row(i)),learnerAnswer:(session.answers[q.id]??[]).join('、')||undefined,referenceAnswer:q.decoded_answer,explanation:en&&q.en?.explanation?q.en.explanation:q.lesson.paragraphs.join(' ')};
}
const helper=mountHelper({apiBase:ASSISTANT_API,token:()=>ACCOUNT_MODE?account()?.token:null,context:helperContext,lang,t});
function applyChrome(){
 helper.hide();
 document.documentElement.lang=lang()==='en'?'en':'zh-Hant';
 const notes=document.querySelector('.training-nav a[href="./notes/"]');if(notes)notes.textContent=t('notes');
}
const pinInput=(id,label,extra='')=>`<label class="sr-only" for="${id}">${label}</label><input id="${id}" type="password" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]{4}" placeholder="••••" ${extra}>`;
const digitsOnly=input=>input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,4);});

/* Step 1: language + shared four-digit code */
function login(){
 screen=login;applyChrome();
 main.innerHTML=`<section class="gate">${langSwitch()}<h1>AI-901</h1><form id="pin-form">${pinInput('pin',t('pinLabel'),'aria-describedby="pin-error"')}<p id="pin-error" class="error" role="status" aria-live="polite"></p><button class="primary" type="submit">${t('enter')}</button></form></section>`;
 const input=main.querySelector('#pin');
 input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,4);if(input.value.length===4)unlock();});
 main.querySelector('form').addEventListener('submit',event=>{event.preventDefault();unlock();});input.focus();
}
async function unlock(){
 if(busy)return;
 const input=main.querySelector('#pin'),error=main.querySelector('#pin-error');
 if(!/^\d{4}$/.test(input.value)){error.textContent=t('pinRequired');return;}
 busy=true;input.disabled=true;main.querySelector('button[type=submit]').disabled=true;error.textContent='';
 try{
  const response=await fetch(API_BASE?`${API_BASE}/api/bank`:'./bank.encrypted.json',{cache:'no-cache'});if(!response.ok)throw new Error('load');
  const envelope=await response.json();try{bank=await unlockVault(input.value,envelope);}catch{throw new Error('pin');}
  byId=new Map(bank.questions.map(q=>[q.id,q]));
  const linked=new URLSearchParams(location.search).get('unit');if(linked&&bank.units.some(u=>u.unit===linked)){unit=linked;customMode=true;}
  if(!ACCOUNT_MODE||account())await enterHome();else identity();
 }catch(err){error.textContent=err.message==='pin'?t('pinWrong'):t('loadFailed');input.value='';input.disabled=false;main.querySelector('button[type=submit]').disabled=false;input.focus();}
 finally{busy=false;}
}

/* Step 2: who is practising. Students give a j-number, others a role and a code; both set a personal PIN. */
let draft={};
function identity(){
 screen=identity;draft={};applyChrome();
 main.innerHTML=`<section class="gate identity">${langSwitch()}<img class="school-logo" src="/brand/kangchiao-logo.png" alt="Kang Chiao International School" width="200" height="40"><h1>AI-901</h1><p class="ask">${t('role')}</p><div class="choice-row roles">${['student','teacher','staff'].map(role=>button(t('roles')[role],`role-${role}`,'class="choice"')).join('')}</div></section>`;
}
function idForm(){
 screen=idForm;applyChrome();
 const student=draft.type==='student';
 main.innerHTML=`<section class="gate identity">${langSwitch()}<img class="school-logo" src="/brand/kangchiao-logo.png" alt="Kang Chiao International School" width="200" height="40"><h1>AI-901</h1><form id="id-form"><p class="role-chip">${escape(t('roles')[draft.type])}</p>
 <label class="field-label" for="account-id">${student?t('studentId'):t('code')}</label><input id="account-id" class="id-input" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20" placeholder="${student?t('studentPlaceholder'):t('codePlaceholder')}" value="${escape(draft.account??'')}" aria-describedby="id-error id-note">
 <p id="id-note" class="note">${student?t('kcisNote'):t('codeNote')}</p><p id="id-error" class="error" role="status" aria-live="polite"></p>
 <button class="primary" type="submit">${t('next2')}</button></form>${button(t('back'),'identity','class="text-button"')}</section>`;
 const input=main.querySelector('#account-id');input.focus();
 main.querySelector('#id-form').addEventListener('submit',event=>{
  event.preventDefault();
  const value=input.value.normalize('NFC').trim().toLowerCase(),ok=student?/^j[0-9]{4,8}$/.test(value):/^[\p{L}\p{N}_-]{2,20}$/u.test(value)&&!/^j[0-9]+$/.test(value);
  if(!ok){main.querySelector('#id-error').textContent=student?t('badStudent'):t('badCode');input.focus();return;}
  draft.account=value;confirmId();
 });
}
function confirmId(){
 screen=confirmId;applyChrome();
 main.innerHTML=`<section class="gate identity">${langSwitch()}<img class="school-logo" src="/brand/kangchiao-logo.png" alt="Kang Chiao International School" width="200" height="40"><h1>AI-901</h1><p class="ask">${escape(draft.type==='student'?t('confirmId'):t('confirmCode'))}</p><p class="id-echo">${escape(draft.account)}</p><p id="id-error" class="error" role="status" aria-live="polite"></p><div class="choice-row">${button(t('edit'),'edit-id','class="choice"')}${button(t('confirm'),'confirm-id','class="choice primary"')}</div></section>`;
}
async function checkAccount(){
 if(busy)return;busy=true;
 try{const {exists}=await api('account/exists',{account:draft.account,type:draft.type});draft.exists=exists;pinStep();}
 catch(err){const message=err.message==='bad_account'?(draft.type==='student'?t('badStudent'):t('badCode')):apiMessage(err);main.querySelector('#id-error').textContent=message;}
 finally{busy=false;}
}
function pinStep(){
 screen=pinStep;applyChrome();
 const create=!draft.exists;
 main.innerHTML=`<section class="gate identity">${langSwitch()}<h1>AI-901</h1><form id="own-pin-form"><p class="ask">${create?t('pinSet'):t('pinEnter')}</p><p class="id-echo small">${escape(draft.account)}</p>${pinInput('own-pin',create?t('pinSet'):t('pinEnter'),'aria-describedby="own-pin-error"')}${create?pinInput('own-pin-2',t('pinAgain'),`aria-describedby="own-pin-error" placeholder="${t('pinAgain')}"`).replace('placeholder="••••" ',''):''}${create?`<p class="note">${t('pinSetNote')}</p>`:''}<p id="own-pin-error" class="error" role="status" aria-live="polite"></p><button class="primary" type="submit">${t('enter')}</button></form>${button(t('back'),'edit-id','class="text-button"')}</section>`;
 const first=main.querySelector('#own-pin'),second=main.querySelector('#own-pin-2'),error=main.querySelector('#own-pin-error');
 digitsOnly(first);if(second)digitsOnly(second);first.focus();
 main.querySelector('#own-pin-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(!/^\d{4}$/.test(first.value)||(second&&!/^\d{4}$/.test(second.value))){error.textContent=t('pinRequired');return;}
  if(second&&first.value!==second.value){error.textContent=t('pinMismatch');second.value='';second.focus();return;}
  busy=true;error.textContent='';
  try{
   const result=create?await api('account/register',{account:draft.account,type:draft.type,pin:first.value,site:'ai901'}):await api('account/login',{account:draft.account,pin:first.value});
   saveAccount(result.token,draft.account);busy=false;await enterHome();
  }catch(err){busy=false;if(err.message==='exists'){draft.exists=true;pinStep();return;}error.textContent=apiMessage(err);first.value='';if(second)second.value='';first.focus();}
 });
}
async function enterHome(){
 const me=ACCOUNT_MODE?account():null;mistakeIds=ACCOUNT_MODE?[]:readLocalMistakes().filter(id=>byId.has(id));
 if(me){try{mistakeIds=(await api('mistakes',{token:me.token})).ids.filter(id=>byId.has(id));}catch(err){if(err.message==='bad_token'){clearAccount();identity();return;}}}
 home();
}

/* Step 3: practice */
function home(){
 screen=home;applyChrome();leaveQuestion();session=null;const rec=suggestedUnit(bank.units);const max=questionLimit(bank,unit,track);const labs=bank.labs??[];count=customCount?questionCount(count,max):Math.min(AUTO_COUNT,max);const me=ACCOUNT_MODE?account():null;
 main.innerHTML=`<section class="setup">${langSwitch()}<h1>AI-901</h1>${me?`<div class="account-bar"><span>${escape(t('signedIn',me.id))}</span>${button(t('signOut'),'sign-out','class="text-button"')}</div>`:''}${mistakeIds.length?button(t('mistakes',mistakeIds.length),'mistakes','class="mistakes-button"'):''}${customMode?`<div class="setup-field"><label for="category">${t('category')}</label><select id="category"><option value="all" ${unit==='all'?'selected':''}>${t('allQuestions')}</option>${bank.units.map(u=>`<option value="${escape(u.unit)}" ${unit===u.unit?'selected':''}>${escape(u.unit)} · ${escape(unitName(u))}</option>`).join('')}</select></div><div class="setup-field"><label for="track">${t('track')}</label><select id="track">${[['all','trackAll'],['concept','trackConcept'],['hands-on','trackHands']].map(([v,k])=>`<option value="${v}" ${track===v?'selected':''}>${t(k)}</option>`).join('')}</select></div><div class="count-auto" ${customCount?'hidden':''}><span id="auto-count">${t('autoCount',Math.min(AUTO_COUNT,max))}</span>${button(t('customCount'),'custom-count','class="text-button"')}</div><div class="count-field" ${customCount?'':'hidden'}><div class="count-heading"><label for="question-count">${t('count')}</label><div class="count-value"><input id="question-count" type="number" min="5" max="${max}" step="1" value="${count}" inputmode="numeric"><span>${t('countUnit')}</span></div></div><input id="count-slider" type="range" min="5" max="${max}" step="1" value="${count}" aria-label="${t('count')}"><div class="range-ends" aria-hidden="true"><span>5</span><span id="count-max">${max}</span></div>${button(t('useAuto'),'auto-count','class="text-button"')}</div>${button(t('start'),'start','class="primary"')}${button(t('backToSuggested'),'suggested','class="text-button"')}`:`<div class="suggest card-like"><p class="suggest-label">${t('suggested')}</p><p class="suggest-unit"><span>${escape(rec.unit.unit)}</span>${escape(unitName(rec.unit))}</p>${rec.done?`<p class="note">${t('allPassed')}</p>`:''}<p class="suggest-count">${t('autoCount',Math.min(AUTO_COUNT,questionLimit(bank,rec.unit.unit)))}</p>${button(t('start'),'start-suggested','class="primary"')}</div>${button(t('custom'),'custom','class="text-button custom-toggle"')}${labs.length?`<section class="labs" aria-labelledby="labs-title"><div class="labs-head"><h2 id="labs-title">${t('labs')}</h2><p class="note">${t('labsNote')}</p></div><ol class="lab-list">${labs.map((l,i)=>`<li><button type="button" class="lab-item" data-action="lab" data-lab="${escape(l.id)}"><span class="lab-index">${String(i+1).padStart(2,'0')}</span><span class="lab-name">${escape(lang()==='en'?l.en:l.zh)}</span><span class="lab-count">${t('steps',l.questionIds.length)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></li>`).join('')}</ol></section>`:''}`}</section>`;
 if(!customMode)return;
 const number=main.querySelector('#question-count'),slider=main.querySelector('#count-slider');
 function sync(value){count=questionCount(value,Number(number.max));number.value=count;slider.value=count;}
 slider.addEventListener('input',()=>sync(slider.value));number.addEventListener('change',()=>sync(number.value));
 const refit=()=>{const max=questionLimit(bank,unit,track);number.max=slider.max=max;main.querySelector('#count-max').textContent=max;main.querySelector('#auto-count').textContent=t('autoCount',Math.min(AUTO_COUNT,max));sync(customCount?number.value:AUTO_COUNT);};
 main.querySelector('#track').addEventListener('change',event=>{track=event.target.value;refit();});
 main.querySelector('#category').addEventListener('change',event=>{unit=event.target.value;const max=questionLimit(bank,unit,track);number.max=slider.max=max;main.querySelector('#count-max').textContent=max;main.querySelector('#auto-count').textContent=t('autoCount',Math.min(AUTO_COUNT,max));sync(customCount?number.value:AUTO_COUNT);});
}
function begin(questionIds,sessionUnit){session={questionIds,position:0,answers:{},attempts:{},unit:sessionUnit,startedAt:Date.now(),finishedAt:null,elapsedById:{},samples:{},viewStartedAt:null,revealed:false,synced:false};quiz();}
function start(){
 const labRun=session?.unit?.startsWith?.('lab:')&&(bank.labs??[]).find(l=>'lab:'+l.id===session.unit);
 if(labRun){begin(selectQuestions(bank,{mode:'lab',ids:labRun.questionIds}),session.unit);return;}
 unit=main.querySelector('#category')?.value??unit;track=main.querySelector('#track')?.value??track;
 count=customCount?questionCount(main.querySelector('#question-count')?.value??count,questionLimit(bank,unit,track)):Math.min(AUTO_COUNT,questionLimit(bank,unit,track));
 begin(selectQuestions(bank,{unit,count,track}),unit);
}
function startMistakes(){if(mistakeIds.length)begin(selectQuestions(bank,{mode:'mistakes',ids:mistakeIds,count:Math.min(100,mistakeIds.length)}),'mistakes');else home();}
function current(){return byId.get(session.questionIds[session.position]);}
function spent(){return (session.elapsedById[current().id]??0)+(session.viewStartedAt===null?0:Math.max(0,Date.now()-session.viewStartedAt));}
function leaveQuestion(){if(session?.viewStartedAt!==null&&session?.viewStartedAt!==undefined){session.elapsedById[current().id]=spent();session.viewStartedAt=null;}}
function updateClock(){
 if(!session)return;
 const clock=main.querySelector('#elapsed'),pace=main.querySelector('#pace');
 if(clock)clock.textContent=formatTime(((session.finishedAt??Date.now())-session.startedAt)/1000);
 if(pace){const feedback=paceFeedback(session.samples);pace.hidden=!feedback;pace.className=`pace ${feedback?.tone??''}`;pace.textContent=paceText(feedback);}
}
function answerInputs(q){
 const answers=session.answers[q.id]??[],text=qText(q);
 if(q.type==='tf_group')return q.rows.map((row,index)=>`<fieldset class="statement"><legend><span class="row-index">${index+1}</span>${escape(text.row(index))}</legend><div class="binary">${['是','否'].map(value=>`<label class="answer-option ${answers[index]===value?'chosen':''}" data-value="${value}" data-row="${index}"><input type="radio" name="row-${index}" value="${value}" data-row="${index}" ${answers[index]===value?'checked':''}><span class="binary-label">${escape(text.binary(value))}</span><span class="verdict"></span></label>`).join('')}</div></fieldset>`).join('');
 if(q.type==='matching')return `<div class="matching">${Array.from({length:q.pairCount},(_,index)=>`<div class="match-row" data-row="${index}"><label for="match-${index}" ${q.pairCount===1&&/^(?:項目|依題目)/.test(q.matchLabels?.[index]??'項目')?'class="sr-only"':''}><span class="row-index">${index+1}</span>${escape(text.label(index)??t('item',index+1))}</label><div class="match-control"><select id="match-${index}" data-row="${index}"><option value="">${t('chooseOption')}</option>${q.choices.map((choice,i)=>`<option value="${escape(choice)}" ${answers[index]===choice?'selected':''}>${escape(text.choice(i))}</option>`).join('')}</select><span class="match-verdict"></span></div><div class="match-result" hidden></div></div>`).join('')}</div>`;
 return `<fieldset class="choices"><legend class="sr-only">${q.type==='multiple'?t('selectCount',q.answerCount):t('selectAnswer')}</legend>${q.options.map(o=>`<label class="option answer-option ${answers.includes(o.key)?'chosen':''}" data-value="${escape(o.key)}"><input type="${q.type==='multiple'?'checkbox':'radio'}" name="answer" value="${escape(o.key)}" ${answers.includes(o.key)?'checked':''}>${/^[A-Z]$/.test(o.key)?`<span class="option-key">${escape(o.key)}</span>`:''}<span class="option-text">${escape(text.option(o.key))}</span><span class="verdict"></span></label>`).join('')}</fieldset>`;
}
function definitionSection(entries){
 if(!entries.length)return '';
 return `<details class="definition-section"><summary><strong>${t('glossary')}</strong></summary><div class="definition-list">${entries.map(entry=>`<section class="definition-entry"><h3>${entry.optionKeys.filter(key=>/^[A-Z]$/.test(key)).map(key=>`<span class="definition-key">${escape(key)}</span> `).join('')}${escape(entry.name)}</h3><p>${escape(entry.definition)}</p></section>`).join('')}</div></details>`;
}
function practiceBlock(q){
 const steps=(lang()==='en'?q.en?.practice:null)??q.practice;
 if(!steps?.length)return '';
 return `<section class="practice-steps"><h3>${t('practiceSteps')}</h3><ol>${steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>${q.labUrl?`<a class="lab-link" href="${escape(q.labUrl)}" target="_blank" rel="noopener">${t('openLab')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`:''}</section>`;
}
function explanation(q){
 const zh=`<div class="reason" lang="zh-Hant">${q.lesson.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</div>`;
 const glossary=q.lesson.glossary.length?`<div class="definition-panels" lang="zh-Hant">${definitionSection(q.lesson.glossary)}</div>`:'';
 if(lang()==='en'&&q.en?.explanation)return `<section class="explanation" id="explanation" hidden><h2>${t('explanation')}</h2><div class="reason"><p>${escape(q.en.explanation)}</p></div>${practiceBlock(q)}<details class="definition-section full-zh"><summary><strong>${t('fullZh')}</strong></summary>${zh}</details>${glossary}</section>`;
 return `<section class="explanation" id="explanation" lang="zh-Hant" hidden><h2>${t('explanation')}</h2>${zh}${practiceBlock(q)}${glossary}</section>`;
}
function renderVerdicts(){
 const q=current(),record=session.attempts[q.id],visible=!!record,text=qText(q);
 const status=main.querySelector('#attempt-state');status.hidden=!visible;
 if(record){status.className=`attempt-state ${record.status}`;status.innerHTML=`${record.status==='unknown'?'<span aria-hidden="true" class="unknown-icon">?</span>':icon(record.status==='correct')}<strong>${t({correct:'correct',wrong:'wrong',unknown:'unknown'}[record.status])}</strong>`;}
 for(const option of main.querySelectorAll('.answer-option')){
  const correct=optionCorrect(q,option.dataset.value,Number(option.dataset.row??0));
  option.classList.toggle('correct',visible&&correct);option.classList.toggle('incorrect',visible&&!correct);
  option.querySelector('input').disabled=visible;option.querySelector('.verdict').innerHTML=visible?icon(correct,false):'';
 }
 for(const row of main.querySelectorAll('.match-row')){
  const index=Number(row.dataset.row),answer=record?.answer[index],ok=answer===q.decoded_answer_parts[index],select=row.querySelector('select'),result=row.querySelector('.match-result');
  select.disabled=visible;select.classList.toggle('correct',visible&&ok);select.classList.toggle('incorrect',visible&&!!answer&&!ok);
  const flag=row.querySelector('.match-verdict');flag.className=`match-verdict ${visible&&answer?(ok?'correct':'incorrect'):''}`;flag.innerHTML=visible&&answer?icon(ok,false):'';
  result.hidden=!visible||ok;result.innerHTML=visible&&!ok?`<span class="match-correct">${icon(true,false)}${escape(text.choiceOf(q.decoded_answer_parts[index]))}</span>`:'';
 }
}
function revealAnswer(){
 const q=current();
 if(!session.attempts[q.id]){recordAttempt(session,q,{reveal:true,timeMs:spent()});leaveQuestion();}
 session.revealed=!session.revealed;
 const toggle=main.querySelector('#answer-toggle');toggle.textContent=session.revealed?t('hideExplanation'):t('viewExplanation');toggle.setAttribute('aria-expanded',String(session.revealed));
 main.querySelector('#explanation').hidden=!session.revealed;renderVerdicts();
 if(!session.revealed)main.querySelectorAll('.definition-section[open]').forEach(section=>section.open=false);
}
function quiz(){
 screen=quiz;applyChrome();
 const q=current();helper.show();helper.question(q.id);session.revealed=false;session.viewStartedAt=session.attempts[q.id]?null:Date.now();
 main.innerHTML=`<div class="quiz-bar">${button(t('home'),'home','class="text-button"')}<div class="quiz-status"><span class="position">${session.position+1}<span> / ${session.questionIds.length}</span></span><div class="timer">${clockIcon}<time id="elapsed"></time></div><span id="pace" class="pace" hidden></span></div></div><progress class="quiz-progress" value="${session.position+1}" max="${session.questionIds.length}" aria-label="${t('progress')}"></progress><article class="question" data-question-id="${escape(q.id)}">${q.set?`<p class="lab-step"><span>${escape(t('stepOf',session.position+1,session.questionIds.length))}</span>${escape(lang()==='en'?q.set.en:q.set.zh)}</p>`:''}<h1 class="stem">${escape(qText(q,questionHeading(q)).stem)}</h1><div id="attempt-state" class="attempt-state" role="status" aria-live="polite" hidden></div>${q.type==='multiple'?`<span class="selection-count">${t('selectN',q.answerCount)}</span>`:''}<div class="answer-inputs">${answerInputs(q)}</div>${button(session.attempts[q.id]?t('viewExplanation'):t('reveal'),'reveal','id="answer-toggle" class="answer-toggle" aria-controls="explanation" aria-expanded="false"')}${explanation(q)}<div class="question-nav">${button(t('previous'),'previous',`${session.position===0?'disabled':''}`)}${button(session.position===session.questionIds.length-1?t('finish'):t('next'),'next','class="primary"')}</div></article>`;
 main.querySelector('.answer-inputs').addEventListener('change',event=>{
  const input=event.target;if(!input.matches('input,select')||session.attempts[q.id])return;
  let answers=[...(session.answers[q.id]??[])];
  if(q.type==='tf_group'||q.type==='matching'){if(answers.length!==requiredCount(q))answers=Array(requiredCount(q)).fill('');answers[Number(input.dataset.row)]=input.value;}
  else if(q.type==='multiple')answers=[...main.querySelectorAll('input:checked')].map(i=>i.value);else answers=[input.value];
  session.answers[q.id]=answers;main.querySelectorAll('.answer-option').forEach(option=>option.classList.toggle('chosen',option.querySelector('input').checked));
  if(!session.finishedAt&&isComplete(q,answers)){
   const record=recordAttempt(session,q,{timeMs:spent()});session.samples[q.id]=record.timeMs;leaveQuestion();renderVerdicts();
   main.querySelector('#answer-toggle').textContent=t('viewExplanation');
  }
  updateClock();
 });
 renderVerdicts();updateClock();
}
function syncMistakes(){
 if(session.synced)return;session.synced=true;const me=ACCOUNT_MODE?account():null;
 const wrong=[],correct=[];
 for(const id of session.questionIds)(session.attempts[id]?.status==='correct'?correct:wrong).push(id);
 for(const id of correct)mistakeIds=mistakeIds.filter(x=>x!==id);
 for(const id of wrong)if(!mistakeIds.includes(id))mistakeIds.push(id);
 if(!ACCOUNT_MODE){writeLocalMistakes(mistakeIds);return;}
 if(!me)return;
 for(let i=0;i<wrong.length||i<correct.length;i+=200)api('mistakes/update',{token:me.token,wrong:wrong.slice(i,i+200),correct:correct.slice(i,i+200)}).catch(()=>{});
}
function finish(){
 screen=finish;applyChrome();
 leaveQuestion();session.finishedAt??=Date.now();
 for(const id of session.questionIds)if(!session.attempts[id])recordAttempt(session,byId.get(id),{reveal:true});
 syncMistakes();
 if(!session.progressSaved){session.progressSaved=true;recordProgress(session.unit,summarizeAttempts(session,byId));}
 const report=summarizeAttempts(session,byId),feedback=readinessText(readinessFeedback(report,session.unit==='mistakes'?'all':session.unit),report);
 main.innerHTML=`<section class="finish result"><h1>${t('firstTry')}<span class="result-total">${t('total',report.total)}</span></h1><div class="result-rate">${report.percent}<span>%</span></div><div class="result-stats"><div class="correct">${icon(true)}<strong>${report.correct}</strong><span>${t('correct')}</span></div><div class="wrong">${icon(false)}<strong>${report.wrong}</strong><span>${t('wrong')}</span></div><div class="unknown"><span aria-hidden="true" class="unknown-icon">?</span><strong>${report.unknown}</strong><span>${t('unknown')}</span></div></div><div class="finish-time">${clockIcon}<time id="elapsed"></time></div><section class="readiness"><h2>${escape(feedback.title)}</h2><p>${escape(feedback.text)}</p></section>${session.unit==='mistakes'?(mistakeIds.length?button(t('mistakes',mistakeIds.length),'mistakes','class="primary"'):''):button(t('retry',session.unit.startsWith('lab:')?session.questionIds.length:count),'start','class="primary"')}<div class="finish-actions">${button(t('review'),'review','class="text-button"')}${button(t('home'),'home','class="text-button"')}</div></section>`;updateClock();
}
main.addEventListener('click',event=>{
 const switcher=event.target.closest('[data-lang]');
 if(switcher){setLang(switcher.dataset.lang);if(screen===quiz)leaveQuestion();screen();return;}
 const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
 if(action==='reveal'){revealAnswer();return;}
 if(action.startsWith('role-')){draft={type:action.slice(5)};idForm();return;}
 if(action==='identity'){identity();return;}
 if(action==='edit-id'){idForm();return;}
 if(action==='confirm-id'){checkAccount();return;}
 if(action==='sign-out'){clearAccount();mistakeIds=[];identity();return;}
 if(action==='custom'||action==='suggested'){customMode=action==='custom';home();return;}
 if(action==='lab'){const l=(bank.labs??[]).find(x=>x.id===event.target.closest('[data-lab]').dataset.lab);if(l){begin(selectQuestions(bank,{mode:'lab',ids:l.questionIds}),'lab:'+l.id);main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}return;}
 if(action==='start-suggested'){const rec=suggestedUnit(bank.units);unit=rec.unit.unit;count=Math.min(AUTO_COUNT,questionLimit(bank,unit));begin(selectQuestions(bank,{unit,count}),unit);main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});return;}
 if(action==='custom-count'||action==='auto-count'){customCount=action==='custom-count';home();if(customCount)main.querySelector('#question-count')?.focus();return;}
 if(action==='home')home();else if(action==='start')start();else if(action==='mistakes')startMistakes();
 else if(action==='previous'){leaveQuestion();session.position--;quiz();}
 else if(action==='next'){leaveQuestion();if(session.position===session.questionIds.length-1)finish();else{session.position++;quiz();}}
 else if(action==='review'){session.position=0;quiz();}
 main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
});
let pressedElement;
function releasePress(){pressedElement?.classList.remove('pressed');pressedElement=null;}
document.addEventListener('pointerdown',event=>{
 releasePress();
 const target=event.target.closest('button,.answer-option,.term>summary,.definition-section>summary,select,input[type="number"],input[type="range"]');
 if(!target||target.disabled||target.querySelector('input')?.disabled||event.isPrimary===false)return;
 pressedElement=target;target.classList.add('pressed');
},{passive:true});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,releasePress,{passive:true});
window.addEventListener('blur',releasePress);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releasePress();});
setInterval(updateClock,1000);login();
