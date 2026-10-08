'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './Forum.module.css';
import { ForumPostText, type TranslatablePost } from './ForumPostText';
import { ForumAdmin, type AdminSession } from './ForumAdmin';
import { SchoolLogin } from './SchoolLogin';
import { useSchoolSession } from '@/lib/shared-auth';
import type { Locale } from '@/lib/types';

type Post = { id:string; body:string; name:string; department:string; mine:boolean; created_at:number; updated_at:number; deleted_at:number|null; version:number; reply_count?:number; resolved?:number; solution_method?:string; solution_steps?:string; solution_result?:string };
type Kind = 'questions'|'replies';
const API = process.env.NEXT_PUBLIC_FORUM_API_URL || '';
const OWNER_KEY = 'kcis-forum-owner';
const PROFILE_KEY = 'kcis-forum-profile';
const errors:Record<string,[string,string]> = {
  auth:['請先驗證校內信箱登入','Sign in with your school email first.'],
  solution:['請填寫解決方法、操作步驟與驗證結果','Enter the solution, steps and verification result.'],
  identity:['請填寫姓名與所屬部門','Enter your name and department.'],
  length:['內容須為 1–4000 字','Content must be 1–4,000 characters.'],
  invalid:['資料格式不符，請重新確認','Check the entered information.'],
  owner:['只能修改自己的內容','You can only edit your own posts.'],
  missing:['內容已刪除或不存在','This post was deleted or could not be found.'],
  conflict:['內容已變更，請重新載入','This post has changed. Reload to continue.'],
  rate:['操作次數已達上限，請稍後再試','Request limit reached. Try again later.'],
  translation:['翻譯暫時無法使用，請稍後再試','Translation unavailable. Try again later.'],
  unavailable:['連線失敗，請重試','Connection failed. Try again.']
};

export function Forum() {
  const {locale,toggleLocale}=useI18n();
  const {session,ready:sessionReady}=useSchoolSession();
  const accountToken=useRef('');accountToken.current=session?.token||'';
  const [solving,setSolving]=useState(false),[solutionMethod,setSolutionMethod]=useState(''),[solutionSteps,setSolutionSteps]=useState(''),[solutionResult,setSolutionResult]=useState('');
  const t=(zh:string,en:string)=>locale==='en'?en:zh;
  const [entered,setEntered]=useState(false),[name,setName]=useState(''),[department,setDepartment]=useState('');
  const [adminSession,setAdminSession]=useState<AdminSession|null>(null),[adminOpen,setAdminOpen]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const lock=useRef(false),token=useRef('');
  const [questions,setQuestions]=useState<Post[]>([]),[filter,setFilter]=useState('all'),[page,setPage]=useState(0);
  const [thread,setThread]=useState<Post|null>(null),[replies,setReplies]=useState<Post[]>([]),[moreReplies,setMoreReplies]=useState(false);
  const [draft,setDraft]=useState(''),[replyDraft,setReplyDraft]=useState('');
  const [composing,setComposing]=useState(false);
  const [edit,setEdit]=useState<{post:Post;kind:Kind}|null>(null),[editBody,setEditBody]=useState('');
  const questionKey=useRef(''),replyKey=useRef('');
  const questionInput=useRef<HTMLTextAreaElement>(null),threadArticle=useRef<HTMLElement>(null),askButton=useRef<HTMLButtonElement>(null);
  const threadId=thread?.id;
  useEffect(()=>{setAdminSession(session?.admin?{token:session.token,expires_at:Date.now()+3600000}:null);if(!session)setAdminOpen(false);if(session){setName(session.user.nickname||session.user.name);setEntered(true);}},[session]);
  const expireAdmin=useCallback(()=>{setAdminSession(null);setAdminOpen(false);setEntered(false);},[]);

  useEffect(()=>{
    if(!threadId)return;
    threadArticle.current?.focus({preventScroll:true});
    window.scrollTo({top:0});
  },[threadId]);

  useEffect(()=>{
    try {
      const profile=JSON.parse(sessionStorage.getItem(PROFILE_KEY)||'null');
      if(profile&&typeof profile.name==='string'&&typeof profile.department==='string'){setName(profile.name);setDepartment(profile.department);}
      token.current=localStorage.getItem(OWNER_KEY)||'';
    } catch { /* Storage is optional; the current visit still works. */ }
    if(!/^[a-f0-9]{64}$/.test(token.current)) {
      token.current=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
      try{localStorage.setItem(OWNER_KEY,token.current);}catch{/* Keep the capability for this visit. */}
    }
  },[]);
  const api=useCallback(async(path:string,method='GET',body?:unknown,signal?:AbortSignal)=>{
    if(!API)throw Error('unavailable');
    const response=await fetch(API+'/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...((accountToken.current||token.current)?{Authorization:'Bearer '+(accountToken.current||token.current)}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal});
    const data=await response.json();if(!response.ok)throw Error(data.error||'unavailable');return data;
  },[]);
  const translatePost=useCallback((post:TranslatablePost,kind:Kind,target:Locale)=>api('/'+kind+'/'+post.id+'/translate','POST',{target},AbortSignal.timeout(35000)),[api]);
  async function run(action:()=>Promise<void>){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){setError(e instanceof Error&&errors[e.message]?e.message:'unavailable');}finally{lock.current=false;setBusy(false);}
  }
  async function loadQuestions(f=filter,p=page){const data=await api('/questions?filter='+f+'&offset='+p*30);setQuestions(data.questions);setLoaded(true);}
  async function fetchThread(id:string){const data=await api('/questions/'+id);setThread(data.question);setReplies(data.replies);setMoreReplies(data.has_more);setEdit(null);}
  async function openThread(id:string){
    if((replyDraft||edit)&&!window.confirm(t('捨棄未儲存的內容？','Discard unsaved changes?')))return;
    await fetchThread(id);setReplyDraft('');replyKey.current='';
  }
  useEffect(()=>{
    if(!entered||!sessionReady)return;
    let active=true;setLoaded(false);
    api('/questions?filter='+filter+'&offset='+page*30).then(data=>{if(active){setQuestions(data.questions);setLoaded(true);}}).catch(()=>{if(active)setError('unavailable');});
    return()=>{active=false;};
    // The selected language does not change the posts being requested.
  },[entered,filter,page,api,sessionReady,session?.token]);
  useEffect(()=>{
    function warn(e:BeforeUnloadEvent){if(draft||replyDraft||edit)e.preventDefault();}
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[draft,replyDraft,edit]);
  const time=(n:number)=>new Intl.DateTimeFormat(locale==='en'?'en':'zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(n);
  function submit(e:FormEvent,action:()=>Promise<void>){e.preventDefault();void run(action);}
  function postBody(post:Post,kind:Kind){
    return <ForumPostText post={post} kind={kind} locale={locale} request={translatePost} actions={post.mine&&!post.deleted_at&&!post.resolved?<div className={styles.editActions}><button disabled={busy} onClick={()=>{setEdit({post,kind});setEditBody(post.body);}}>{t('編輯','Edit')}</button></div>:undefined} />;
  }
  function editor(post:Post,kind:Kind){
    return <form className={styles.editor} onSubmit={e=>submit(e,async()=>{await api('/'+kind+'/'+post.id,'PATCH',{body:editBody,version:post.version});setEdit(null);if(thread)await fetchThread(thread.id);await loadQuestions();})}>
      <label htmlFor={'edit-'+post.id}>{t('內容','Content')}</label><textarea id={'edit-'+post.id} value={editBody} onChange={e=>setEditBody(e.target.value)} maxLength={4000} required autoFocus />
      <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setEdit(null)}>{t('取消','Cancel')}</button><button className={styles.primary} disabled={busy||!editBody.trim()}>{t('儲存','Save')}</button></div>
    </form>;
  }
  function byline(post:Post){return <div className={styles.meta}>
    {!post.deleted_at&&<><span className={styles.author}>{post.name}</span><span>{post.department}</span></>}
    <time dateTime={new Date(post.created_at).toISOString()}>{time(post.created_at)}</time>
    {!post.deleted_at&&post.updated_at>post.created_at&&<span>{t('已編輯','Edited')}</span>}
  </div>;}
  function closeComposer(){
    if(draft&&!window.confirm(t('捨棄未儲存的內容？','Discard unsaved changes?')))return;
    setDraft('');questionKey.current='';setComposing(false);
    askButton.current?.focus();
  }
  async function backToQuestions(){
    if((replyDraft||edit)&&!window.confirm(t('捨棄未儲存的內容？','Discard unsaved changes?')))return;
    setSolving(false);setThread(null);setReplies([]);setEdit(null);setReplyDraft('');replyKey.current='';await loadQuestions();
  }

  return <div className={styles.forum}>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href={(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/'}><Icon name="back" /><span>康橋 AI Tools</span></a>
        <div className={styles.headerActions}><SchoolLogin />
          <button className={styles.locale} onClick={toggleLocale}><Icon name="language" />{locale==='en'?'中文':'English'}</button>
          {entered&&adminSession&&!adminOpen&&<button className={styles.locale} disabled={busy} onClick={()=>{if((draft||replyDraft||edit)&&!window.confirm(t('捨棄未儲存的內容？','Discard unsaved changes?')))return;setDraft('');setReplyDraft('');setEdit(null);setComposing(false);questionKey.current='';replyKey.current='';setAdminOpen(true);}}>{t('管理','Manage')}</button>}
          {entered&&<button className={styles.profile} disabled={busy} title={name+' · '+department} aria-label={t('修改姓名與部門','Change name and department')} onClick={expireAdmin}><span>{session?(department||t('所屬部門','Department')):name}{!session&&<span className={styles.profileDepartment}> · {department}</span>}</span><Icon name="chevron" /></button>}
        </div>
      </div>
    </header>
    <main className={!entered?styles.entryWorkspace:thread?styles.threadWorkspace:styles.workspace} aria-busy={busy}>
      {error&&!adminOpen&&<div role="alert" className={styles.error}><span>{errors[error]?.[locale==='en'?1:0]||t(errors.unavailable[0],errors.unavailable[1])}</span><button disabled={busy} onClick={()=>void run(async()=>{if(entered){if(thread)await fetchThread(thread.id);else await loadQuestions();}})}>{t('重新載入','Reload')}</button></div>}
      {!entered?<section className={styles.entry} aria-labelledby="forum-entry-title">
        <div className={styles.entryHeading}><Icon name="message" /><h1 id="forum-entry-title">{t('AI 論壇','AI Forum')}</h1></div>
        <form onSubmit={e=>submit(e,async()=>{if(!name.trim()||!department.trim())return;const profile={name:name.trim(),department:department.trim()};setName(profile.name);setDepartment(profile.department);setAdminSession(session?.admin?{token:session.token,expires_at:Date.now()+3600000}:null);setAdminOpen(false);try{sessionStorage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{/* Optional preference storage. */}setEntered(true);})}>
          <div className={styles.field}><label htmlFor="forum-name">{t('姓名','Name')}</label><input id="forum-name" autoComplete="name" value={name} readOnly={!!session} onChange={e=>setName(e.target.value)} maxLength={60} disabled={busy} required /></div>
          <div className={styles.field}><label htmlFor="forum-department">{t('所屬部門','Department')}</label><input id="forum-department" autoComplete="organization" placeholder={t('學務處、英文科…','Student Affairs, English Department…')} value={department} onChange={e=>setDepartment(e.target.value)} maxLength={80} disabled={busy} required /></div>
          <button className={styles.primary} disabled={busy||!name.trim()||!department.trim()}><span>{t('以訪客身分進入','Enter as guest')}</span><Icon name="forward" /></button>
        </form>
      </section>:adminOpen&&adminSession?<ForumAdmin apiBase={API} locale={locale} session={adminSession} onExpired={expireAdmin} onClose={()=>void run(async()=>{setAdminOpen(false);setSolving(false);setThread(null);setReplies([]);setEdit(null);await loadQuestions();})} />:<>
        <div className={styles.pageHeading}>
          <h1>{t('AI 論壇','AI Forum')}</h1>
          {!thread&&session&&<button ref={askButton} className={styles.primary} disabled={busy} aria-expanded={composing} aria-controls={composing?'question-composer':undefined} onClick={()=>{setComposing(true);questionInput.current?.focus();}}><Icon name="plus" />{t('提出問題','Ask a question')}</button>}
        </div>
        {thread?<>
          <nav className={styles.backNav} aria-label={t('論壇導覽','Forum navigation')}><button disabled={busy} onClick={()=>void run(backToQuestions)}><Icon name="back" />{t('所有問題','All questions')}</button></nav>
          <article className={styles.post} ref={threadArticle} tabIndex={-1} aria-label={t('問題內容','Question')}>
            {byline(thread)}
            {!!thread.resolved&&<span className={styles.resolved}>{t('已解決','Resolved')}</span>}
            {(thread.mine&&session||session?.admin)&&!thread.deleted_at&&<button className={styles.resolveButton} disabled={busy} onClick={()=>{setSolutionMethod(thread.solution_method||'');setSolutionSteps(thread.solution_steps||'');setSolutionResult(thread.solution_result||'');setSolving(true);}}>{thread.resolved?t('更新解決紀錄','Update solution'):t('標註已解決','Mark resolved')}</button>}

            {edit?.post.id===thread.id?editor(thread,'questions'):postBody(thread,'questions')}
          </article>
          {solving&&<form className={styles.compose} onSubmit={e=>submit(e,async()=>{await api('/questions/'+thread.id+'/resolve','POST',{version:thread.version,resolved:true,method:solutionMethod,steps:solutionSteps,result:solutionResult});setSolving(false);await fetchThread(thread.id);})}>
            <h2>{t('解決紀錄','Solution record')}</h2>
            <label>{t('解決方法','Solution')}<textarea value={solutionMethod} onChange={e=>setSolutionMethod(e.target.value)} maxLength={4000} required /></label>
            <label>{t('操作步驟','Steps')}<textarea value={solutionSteps} onChange={e=>setSolutionSteps(e.target.value)} maxLength={4000} required /></label>
            <label>{t('驗證結果','Verification result')}<textarea value={solutionResult} onChange={e=>setSolutionResult(e.target.value)} maxLength={2000} required /></label>
            <div className={styles.actions}><button type="button" onClick={()=>setSolving(false)}>{t('取消','Cancel')}</button>{!!thread.resolved&&<button type="button" disabled={busy} onClick={()=>void run(async()=>{await api('/questions/'+thread.id+'/resolve','POST',{version:thread.version,resolved:false});setSolving(false);await fetchThread(thread.id);})}>{t('改為未解決','Mark unresolved')}</button>}<button className={styles.primary} disabled={busy}>{t('儲存並同步 WikiNB','Save & sync WikiNB')}</button></div>
          </form>}
          {!!thread.resolved&&<section className={styles.solutionRecord}><h2>{t('解決方法','Solution')}</h2><p>{thread.solution_method}</p><h3>{t('操作步驟','Steps')}</h3><p>{thread.solution_steps}</p><h3>{t('驗證結果','Verification result')}</h3><p>{thread.solution_result}</p></section>}
          <section className={styles.replies} aria-labelledby="forum-replies-title" aria-live="polite">
            <h2 id="forum-replies-title">{t('回覆','Replies')}</h2>
            {replies.length===0&&<p className={styles.emptyReply}>{t('尚無回覆','No replies')}</p>}
            {replies.map(reply=><article className={styles.reply} key={reply.id}>{byline(reply)}{edit?.post.id===reply.id?editor(reply,'replies'):postBody(reply,'replies')}</article>)}
          </section>
          {moreReplies&&<div className={styles.more}><button disabled={busy} onClick={()=>void run(async()=>{const data=await api('/questions/'+thread.id+'?replyOffset='+replies.length);setReplies(old=>[...old,...data.replies]);setMoreReplies(data.has_more);})}>{t('更多回覆','More replies')}</button></div>}
          {!thread.deleted_at&&<form className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!replyKey.current)replyKey.current=crypto.randomUUID();await api('/replies','POST',{id:replyKey.current,question_id:thread.id,body:replyDraft,name,department:department||t('校內成員','School member')});setReplyDraft('');replyKey.current='';await fetchThread(thread.id);})}>
            <label htmlFor="forum-reply">{t('你的回覆','Your reply')}</label>
            <textarea id="forum-reply" value={replyDraft} onChange={e=>{setReplyDraft(e.target.value);replyKey.current='';}} maxLength={4000} required placeholder={t('輸入回覆…','Write a reply…')} />
            <div className={styles.composeFooter}><span className={styles.characterCount}>{replyDraft.length.toLocaleString()} / 4,000</span><button className={styles.primary} disabled={busy||!replyDraft.trim()}>{t('送出回覆','Post reply')}<Icon name="forward" /></button></div>
          </form>}
        </>:<>
          {composing&&<form id="question-composer" className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!questionKey.current)questionKey.current=crypto.randomUUID();const data=await api('/questions','POST',{id:questionKey.current,body:draft,name,department:department||t('校內同仁','School member')});setDraft('');questionKey.current='';setComposing(false);await fetchThread(data.id);})}>
            <label htmlFor="forum-question">{t('問題內容','Your question')}</label>
            <textarea id="forum-question" ref={questionInput} value={draft} onChange={e=>{setDraft(e.target.value);questionKey.current='';}} maxLength={4000} required autoFocus placeholder={t('描述你遇到的問題…','Describe your question…')} />
            <div className={styles.composeFooter}><span className={styles.characterCount}>{draft.length.toLocaleString()} / 4,000</span><div className={styles.actions}><button type="button" disabled={busy} onClick={closeComposer}>{t('取消','Cancel')}</button><button className={styles.primary} disabled={busy||!draft.trim()}>{t('發布問題','Post question')}<Icon name="forward" /></button></div></div>
          </form>}
          <div className={styles.questionsPanel}>
            <nav className={styles.tabs} aria-label={t('篩選問題','Filter questions')}>{[['all',t('全部','All')],['mine',t('我的問題','My questions')]].map(([key,label])=><button key={key} aria-pressed={key===filter} disabled={busy} onClick={()=>{setFilter(key);setPage(0);}}>{label}</button>)}</nav>
            <section aria-label={t('問題列表','Questions')}>
              {!loaded?<p role="status" className={styles.empty}>{error?t('無法載入問題','Could not load questions'):t('載入中…','Loading…')}</p>:questions.length===0?<div className={styles.empty}><Icon name="message" /><p>{t('尚無問題','No questions')}</p></div>:questions.map(q=><article className={styles.row} key={q.id}>
                <button disabled={busy} className={styles.question} onClick={()=>void run(()=>openThread(q.id))}>
                  <div className={styles.questionContent}>
                    <ForumPostText post={q} kind="questions" locale={locale} preview request={translatePost} />
                    <div className={styles.meta}><span className={styles.author}>{q.name}</span><span>{q.department}</span><time dateTime={new Date(q.created_at).toISOString()}>{time(q.created_at)}</time></div>
                  </div>
                  <div className={styles.questionStatus}>{!!q.resolved&&<span className={styles.resolved}>{t('已解決','Resolved')}</span>}<span className={styles.replyCount}><Icon name="message" />{q.reply_count} {t('則回覆',q.reply_count===1?'reply':'replies')}</span></div>
                  <span className={styles.rowArrow}><Icon name="forward" /></span>
                </button>
              </article>)}
            </section>
          </div>
          {(page>0||questions.length===30)&&<nav className={styles.pagination} aria-label={t('分頁','Pagination')}>{page>0&&<button disabled={busy} onClick={()=>setPage(p=>p-1)}><Icon name="back" />{t('上一頁','Previous')}</button>}{questions.length===30&&<button disabled={busy} onClick={()=>setPage(p=>p+1)}>{t('下一頁','Next')}<Icon name="forward" /></button>}</nav>}
        </>}
      </>}
    </main>
  </div>;
}

type IconName = 'plus'|'back'|'forward'|'message'|'language'|'chevron'|'check';
function Icon({name}:{name:IconName}){
  const paths:Record<IconName,string>={
    plus:'M12 5v14M5 12h14',
    back:'M19 12H5m6-6-6 6 6 6',
    forward:'M5 12h14m-6-6 6 6-6 6',
    message:'M20 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z',
    language:'M3 5h10M8 3v2m-3 0c0 5 3 8 7 10M11 5c0 5-3 8-8 10m11 6 4-10 4 10m-6-3h4',
    chevron:'m8 10 4 4 4-4',
    check:'m5 12 4 4L19 6',
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
