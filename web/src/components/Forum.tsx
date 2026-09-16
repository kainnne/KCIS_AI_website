'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './Forum.module.css';

type Post = { id:string; body:string; name:string; department:string; mine:boolean; created_at:number; updated_at:number; deleted_at:number|null; version:number; resolved?:number; reply_count?:number };
type Kind = 'questions'|'replies';
const API = process.env.NEXT_PUBLIC_FORUM_API_URL || '';
const OWNER_KEY = 'kcis-forum-owner';
const PROFILE_KEY = 'kcis-forum-profile';
const errors:Record<string,[string,string]> = {
  identity:['請填寫姓名與所屬部門','Enter your name and department.'],
  length:['內容須為 1–4000 字','Content must be 1–4,000 characters.'],
  invalid:['資料格式不符，請重新確認','Check the entered information.'],
  owner:['只能修改自己的內容','You can only edit your own posts.'],
  missing:['內容已撤回或不存在','This post was withdrawn or could not be found.'],
  conflict:['內容已變更，請重新載入','This post has changed. Reload to continue.'],
  rate:['操作次數已達上限，請稍後再試','Request limit reached. Try again later.'],
  translation:['翻譯暫時無法使用，請稍後再試','Translation unavailable. Try again later.'],
  unavailable:['連線失敗，請重試','Connection failed. Try again.']
};

export function Forum() {
  const {locale,toggleLocale}=useI18n();
  const t=(zh:string,en:string)=>locale==='en'?en:zh;
  const [entered,setEntered]=useState(false),[name,setName]=useState(''),[department,setDepartment]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const lock=useRef(false),token=useRef('');
  const [questions,setQuestions]=useState<Post[]>([]),[filter,setFilter]=useState('all'),[page,setPage]=useState(0);
  const [thread,setThread]=useState<Post|null>(null),[replies,setReplies]=useState<Post[]>([]),[moreReplies,setMoreReplies]=useState(false);
  const [draft,setDraft]=useState(''),[replyDraft,setReplyDraft]=useState('');
  const [edit,setEdit]=useState<{post:Post;kind:Kind}|null>(null),[editBody,setEditBody]=useState('');
  const [translations,setTranslations]=useState<Record<string,{body:string;target:string}>>({});
  const questionKey=useRef(''),replyKey=useRef('');

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
  async function api(path:string,method='GET',body?:unknown) {
    if(!API)throw Error('unavailable');
    const response=await fetch(API+'/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token.current?{Authorization:'Bearer '+token.current}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    const data=await response.json();if(!response.ok)throw Error(data.error||'unavailable');return data;
  }
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
    if(!entered)return;
    let active=true;setLoaded(false);
    api('/questions?filter='+filter+'&offset='+page*30).then(data=>{if(active){setQuestions(data.questions);setLoaded(true);}}).catch(()=>{if(active)setError('unavailable');});
    return()=>{active=false;};
    // The selected language does not change the posts being requested.
  },[entered,filter,page]);
  useEffect(()=>{
    function warn(e:BeforeUnloadEvent){if(draft||replyDraft||edit)e.preventDefault();}
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[draft,replyDraft,edit]);
  const time=(n:number)=>new Intl.DateTimeFormat(locale==='en'?'en':'zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(n);
  function submit(e:FormEvent,action:()=>Promise<void>){e.preventDefault();void run(action);}
  async function remove(post:Post,kind:Kind){
    if(!window.confirm(t('撤回這則內容？','Withdraw this post?')))return;
    await api('/'+kind+'/'+post.id,'DELETE');if(thread)await fetchThread(thread.id);await loadQuestions();
  }
  function postBody(post:Post,kind:Kind){
    const key=post.id+':'+post.version,translated=translations[key];
    if(post.deleted_at)return <p className={styles.body}>{t('內容已撤回','Post withdrawn')}</p>;
    return <>
      <p className={styles.body} lang={translated?.target}>{translated?.body||post.body}</p>
      <div className={styles.postActions}>
        <label className={styles.translateLabel} htmlFor={'translate-'+post.id}>{t('翻譯','Translate')}</label>
        <select id={'translate-'+post.id} value={translated?.target||''} disabled={busy} onChange={e=>{
          const target=e.target.value;
          if(!target){setTranslations(old=>{const next={...old};delete next[key];return next;});return;}
          void run(async()=>{const data=await api('/'+kind+'/'+post.id+'/translate','POST',{target});if(data.version!==post.version)throw Error('conflict');setTranslations(old=>({...old,[key]:{body:data.body,target}}));});
        }}><option value="">{t('原文','Original')}</option><option value="en">English</option><option value="zh-TW">繁體中文</option></select>
        {post.mine&&<><button disabled={busy} onClick={()=>{setEdit({post,kind});setEditBody(post.body);}}>{t('編輯','Edit')}</button><button disabled={busy} onClick={()=>void run(()=>remove(post,kind))}>{t('撤回','Withdraw')}</button></>}
      </div>
    </>;
  }
  function editor(post:Post,kind:Kind){
    return <form onSubmit={e=>submit(e,async()=>{await api('/'+kind+'/'+post.id,'PATCH',{body:editBody,version:post.version});setEdit(null);if(thread)await fetchThread(thread.id);await loadQuestions();})}>
      <label htmlFor={'edit-'+post.id}>{t('內容','Content')}</label><textarea id={'edit-'+post.id} value={editBody} onChange={e=>setEditBody(e.target.value)} maxLength={4000} required />
      <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setEdit(null)}>{t('取消','Cancel')}</button><button className={styles.primary} disabled={busy||!editBody.trim()}>{t('儲存','Save')}</button></div>
    </form>;
  }
  function byline(post:Post){return <div className={styles.meta}>{!post.deleted_at&&`${post.name} · ${post.department} · `}{time(post.created_at)}{!post.deleted_at&&post.updated_at>post.created_at?' · '+t('已編輯','Edited'):''}</div>;}

  return <main className={styles.forum} aria-busy={busy}>
    <header className={styles.header}><a className={styles.brand} href={(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/'}>康橋 AI Tools</a>
      <div className={styles.headerActions}><button onClick={toggleLocale}>{locale==='en'?'中文':'English'}</button>{entered&&<button disabled={busy} onClick={()=>setEntered(false)}>{name} · {department}</button>}</div>
    </header>
    {error&&<p role="alert" className={styles.error}>{errors[error]?.[locale==='en'?1:0]||t(errors.unavailable[0],errors.unavailable[1])} <button disabled={busy} onClick={()=>void run(async()=>{if(entered){if(thread)await fetchThread(thread.id);else await loadQuestions();}})}>{t('重新載入','Reload')}</button></p>}
    {!entered?<section className={styles.auth}>
      <h1>{t('AI 論壇','AI Forum')}</h1>
      <form onSubmit={e=>{e.preventDefault();if(!name.trim()||!department.trim())return;setName(name.trim());setDepartment(department.trim());try{sessionStorage.setItem(PROFILE_KEY,JSON.stringify({name:name.trim(),department:department.trim()}));}catch{/* Optional preference storage. */}setError('');setEntered(true);}}>
        <label htmlFor="forum-name">{t('姓名','Name')}</label><input id="forum-name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={60} required autoFocus />
        <label htmlFor="forum-department">{t('所屬部門','Department')}</label><input id="forum-department" autoComplete="organization-title" placeholder={t('例如：學務處、英文科','e.g. Student Affairs, English Department')} value={department} onChange={e=>setDepartment(e.target.value)} maxLength={80} required />
        <button className={styles.primary} disabled={!name.trim()||!department.trim()}>{t('進入論壇','Enter forum')}</button>
      </form>
    </section>:<>
      <h1>{t('AI 論壇','AI Forum')}</h1>
      {thread?<>
        <nav className={styles.tabs}><button disabled={busy} onClick={()=>void run(async()=>{
          if((replyDraft||edit)&&!window.confirm(t('捨棄未儲存的內容？','Discard unsaved changes?')))return;
          setThread(null);setReplies([]);setEdit(null);setReplyDraft('');replyKey.current='';await loadQuestions();
        })}>← {t('所有問題','All questions')}</button></nav>
        <article className={styles.post}>{byline(thread)}{edit?.post.id===thread.id?editor(thread,'questions'):postBody(thread,'questions')}
          {!thread.deleted_at&&<div className={styles.actions}>{thread.resolved?<span className={styles.meta}>{t('已解決','Resolved')}</span>:null}{thread.mine&&<button disabled={busy} onClick={()=>void run(async()=>{await api('/questions/'+thread.id,'PATCH',{resolved:!thread.resolved,version:thread.version});await fetchThread(thread.id);})}>{thread.resolved?t('重新開啟','Reopen'):t('標為已解決','Mark resolved')}</button>}</div>}
        </article>
        <section aria-live="polite">{replies.length===0&&<p className={styles.empty}>{t('尚無回覆','No replies')}</p>}{replies.map(reply=><article className={styles.reply} key={reply.id}>{byline(reply)}{edit?.post.id===reply.id?editor(reply,'replies'):postBody(reply,'replies')}</article>)}</section>
        {moreReplies&&<button disabled={busy} onClick={()=>void run(async()=>{const data=await api('/questions/'+thread.id+'?replyOffset='+replies.length);setReplies(old=>[...old,...data.replies]);setMoreReplies(data.has_more);})}>{t('更多回覆','More replies')}</button>}
        {!thread.deleted_at&&<form className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!replyKey.current)replyKey.current=crypto.randomUUID();await api('/replies','POST',{id:replyKey.current,question_id:thread.id,body:replyDraft,name,department});setReplyDraft('');replyKey.current='';await fetchThread(thread.id);})}>
          <label htmlFor="forum-reply">{t('回覆','Reply')}</label><textarea id="forum-reply" value={replyDraft} onChange={e=>{setReplyDraft(e.target.value);replyKey.current='';}} maxLength={4000} required />
          <div className={styles.actions}><button className={styles.primary} disabled={busy||!replyDraft.trim()}>{t('送出回覆','Reply')}</button></div>
        </form>}
      </>:<>
        <form className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!questionKey.current)questionKey.current=crypto.randomUUID();const data=await api('/questions','POST',{id:questionKey.current,body:draft,name,department});setDraft('');questionKey.current='';await fetchThread(data.id);})}>
          <label htmlFor="forum-question">{t('你遇到什麼 AI 使用問題？','What is your AI question?')}</label><textarea id="forum-question" value={draft} onChange={e=>{setDraft(e.target.value);questionKey.current='';}} maxLength={4000} required />
          <div className={styles.actions}><button className={styles.primary} disabled={busy||!draft.trim()}>{t('發布問題','Post question')}</button></div>
        </form>
        <div className={styles.tabs}>{[['all',t('全部','All')],['unanswered',t('未回覆','Unanswered')],['mine',t('我的問題','Mine')]].map(([key,label])=><button key={key} aria-pressed={key===filter} disabled={busy} onClick={()=>{setFilter(key);setPage(0);}}>{label}</button>)}</div>
        <section>{!loaded?<p role="status" className={styles.empty}>{t('載入中…','Loading…')}</p>:questions.length===0?<p className={styles.empty}>{t('尚無問題','No questions')}</p>:questions.map(q=><article className={styles.row} key={q.id}><button disabled={busy} className={styles.question} onClick={()=>void run(()=>openThread(q.id))}>{q.body.split('\n').find(x=>x.trim())?.slice(0,160)}</button><div className={styles.byline}><span>{q.name} · {q.department} · {time(q.created_at)}</span>{q.resolved?<span>{t('已解決','Resolved')}</span>:null}<span>{q.reply_count} {t('則回覆','replies')}</span></div></article>)}</section>
        <div className={styles.actions}>{page>0&&<button disabled={busy} onClick={()=>setPage(p=>p-1)}>{t('上一頁','Previous')}</button>}{questions.length===30&&<button disabled={busy} onClick={()=>setPage(p=>p+1)}>{t('下一頁','Next')}</button>}</div>
      </>}
    </>}
  </main>;
}
