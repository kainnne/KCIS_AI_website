'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './Forum.module.css';

type User = { id:string; nickname:string; role:string; status:string };
type Post = { id:string; author_id:string; body:string; nickname:string; created_at:number; updated_at:number; deleted_at:number|null; version:number; resolved?:number; reply_count?:number; role?:string };
type Member = User & { email:string };
const API = process.env.NEXT_PUBLIC_FORUM_API_URL || '';
const TOKEN_KEY = 'kcis-forum-session';

export function Forum() {
  const { locale, toggleLocale }=useI18n();
  const t=(zh:string,en:string)=>locale==='en'?en:zh;
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const token=useRef('');
  const [email,setEmail]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[cooldown,setCooldown]=useState(0),[nickname,setNickname]=useState('');
  const [questions,setQuestions]=useState<Post[]>([]),[filter,setFilter]=useState('all'),[page,setPage]=useState(0),[thread,setThread]=useState<Post|null>(null),[replies,setReplies]=useState<Post[]>([]);
  const [moreReplies,setMoreReplies]=useState(false);
  const [draft,setDraft]=useState(''),[replyDraft,setReplyDraft]=useState(''),[edit,setEdit]=useState<{post:Post;kind:'questions'|'replies'}|null>(null),[editBody,setEditBody]=useState('');
  const [members,setMembers]=useState<Member[]|null>(null),[rename,setRename]=useState(false);
  const questionKey=useRef(''),replyKey=useRef('');
  function forget(){token.current='';sessionStorage.removeItem(TOKEN_KEY);setUser(null);setThread(null);setQuestions([]);setReplies([]);setMembers(null);setDraft('');setReplyDraft('');}
  async function api(path:string,method='GET',body?:unknown) {
    if(!API)throw Error(t('服務暫時無法使用','Service unavailable'));
    const response=await fetch(API+'/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token.current?{Authorization:'Bearer '+token.current}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    const data=await response.json();
    if(!response.ok){if(response.status===401&&path!=='/auth/verify')forget();throw Error(data.error||t('操作失敗','Request failed'));}
    return data;
  }
  async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await action();}catch(e){setError(e instanceof Error?e.message:t('連線失敗，請重試','Connection failed. Try again.'));}finally{setBusy(false);}}
  async function loadQuestions(f=filter,p=page){const data=await api('/questions?filter='+f+'&offset='+p*30);setQuestions(data.questions);}
  async function openThread(id:string){
    if(thread?.id!==id&&replyDraft&&!window.confirm(t('捨棄未送出的回覆？','Discard the unsent reply?')))return;
    const data=await api('/questions/'+id);if(thread?.id!==id){setReplyDraft('');replyKey.current='';}setThread(data.question);setReplies(data.replies);setMoreReplies(data.has_more);setMembers(null);setEdit(null);
  }
  useEffect(()=>{
    token.current=sessionStorage.getItem(TOKEN_KEY)||'';
    if(!token.current){setReady(true);return;}
    api('/me').then(data=>{setUser(data.user);setNickname(data.user.nickname);}).catch(e=>setError(e.message)).finally(()=>setReady(true));
    // Initial session restoration only; language changes do not reauthenticate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{if(user?.status==='active'&&user.nickname){loadQuestions().catch(e=>setError(e.message));}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user?.id,user?.status,user?.nickname,filter,page]);
  useEffect(()=>{if(!cooldown)return;const id=setTimeout(()=>setCooldown(s=>Math.max(0,s-1)),1000);return()=>clearTimeout(id);},[cooldown]);
  useEffect(()=>{function warn(e:BeforeUnloadEvent){if(draft||replyDraft||edit){e.preventDefault();}}
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[draft,replyDraft,edit]);
  const time=(n:number)=>new Intl.DateTimeFormat(locale==='en'?'en':'zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(n);
  function submit(e:FormEvent,action:()=>Promise<void>){e.preventDefault();void run(action);}
  async function saveNickname(){const data=await api('/me','PATCH',{nickname});setUser(data.user);setRename(false);}
  async function remove(post:Post,kind:'questions'|'replies') {
    if(!window.confirm(t('撤回這則內容？','Withdraw this post?')))return;
    await api('/'+kind+'/'+post.id,'DELETE');if(thread)await openThread(thread.id);await loadQuestions();
  }
  function actions(post:Post,kind:'questions'|'replies') {
    if(post.deleted_at)return null;
    const owner=post.author_id===user?.id;
    if(!owner&&user?.role!=='admin')return null;
    return <div className={styles.postActions}>
      {owner&&<button disabled={busy} onClick={()=>{setEdit({post,kind});setEditBody(post.body);}}>{t('編輯','Edit')}</button>}
      <button disabled={busy} onClick={()=>void run(()=>remove(post,kind))}>{t('撤回','Withdraw')}</button>
    </div>;
  }
  function editor(post:Post,kind:'questions'|'replies') {
    if(edit?.post.id!==post.id||edit.kind!==kind)return null;
    return <form onSubmit={e=>submit(e,async()=>{await api('/'+kind+'/'+post.id,'PATCH',{body:editBody,version:post.version});setEdit(null);if(thread)await openThread(thread.id);await loadQuestions();})}>
      <label htmlFor={'edit-'+post.id}>{t('內容','Content')}</label><textarea id={'edit-'+post.id} value={editBody} onChange={e=>setEditBody(e.target.value)} maxLength={4000} required />
      <div className={styles.actions}><button type="button" onClick={()=>setEdit(null)}>{t('取消','Cancel')}</button><button className={styles.primary} disabled={busy}>{t('儲存','Save')}</button></div>
    </form>;
  }
  return <main className={styles.forum}>
    <header className={styles.header}>
      <a className={styles.brand} href={(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/'}>康橋 AI Tools</a>
      <div className={styles.headerActions}><button onClick={toggleLocale}>{locale==='en'?'中文':'English'}</button>
        {user&&<><button onClick={()=>{setNickname(user.nickname);setRename(true);}}>{user.nickname||t('暱稱','Nickname')}</button><button disabled={busy} onClick={()=>void run(async()=>{await api('/auth/logout','POST',{});forget();})}>{t('登出','Sign out')}</button></>}
      </div>
    </header>
    <h1>{t('AI 論壇','AI Forum')}</h1>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {!ready?<p role="status">{t('載入中…','Loading…')}</p>:!user?<section className={styles.auth}>
      <form onSubmit={e=>submit(e,async()=>{
        if(!sent){await api('/auth/code','POST',{email});setSent(true);setCooldown(60);return;}
        const data=await api('/auth/verify','POST',{email,code});token.current=data.token;sessionStorage.setItem(TOKEN_KEY,data.token);setUser(data.user);setNickname(data.user.nickname);setCode('');
      })}>
        <label htmlFor="forum-email">{t('校內 Email','School email')}</label><input id="forum-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} readOnly={sent} required />
        {!sent&&<p className={styles.meta}>@kcis.com.tw · @kcis.ntpc.edu.tw</p>}
        {sent&&<><label htmlFor="forum-code">{t('六位數驗證碼','Six-digit code')}</label><input id="forum-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)} required autoFocus />
          <div className={styles.postActions}><button type="button" onClick={()=>{setSent(false);setCode('');setError('');}}>{t('更換帳號','Change email')}</button><button disabled={busy||cooldown>0} type="button" onClick={()=>void run(async()=>{await api('/auth/code','POST',{email});setCooldown(60);})}>{cooldown>0?`${cooldown}s`:t('重寄','Resend')}</button></div></>}
        <button className={styles.primary} disabled={busy}>{busy?t('處理中…','Working…'):sent?t('登入','Sign in'):t('取得驗證碼','Send code')}</button>
      </form>
    </section>:!user.nickname||rename?<section className={styles.auth}><form onSubmit={e=>submit(e,saveNickname)}>
      <label htmlFor="forum-nickname">{t('暱稱','Nickname')}</label><input id="forum-nickname" value={nickname} onChange={e=>setNickname(e.target.value)} minLength={2} maxLength={20} required autoFocus />
      <p className={styles.meta}>{t('管理員可核對帳號','Administrators can identify accounts')}</p>
      <div className={styles.actions}>{user.nickname&&<button type="button" onClick={()=>setRename(false)}>{t('取消','Cancel')}</button>}<button className={styles.primary} disabled={busy}>{t('儲存','Save')}</button></div>
    </form></section>:user.status!=='active'?<section className={styles.auth}><p>{t('等待管理員開通教師權限','Waiting for teacher access approval')}</p><button disabled={busy} onClick={()=>void run(async()=>{const data=await api('/me');setUser(data.user);})}>{t('重新確認','Check again')}</button></section>:<>
      <nav className={styles.tabs} aria-label={t('論壇導覽','Forum navigation')}>
        <button onClick={()=>void run(async()=>{setThread(null);setMembers(null);setEdit(null);await loadQuestions();})}>{t('所有問題','Questions')}</button>
        {user.role==='admin'&&<button disabled={busy} onClick={()=>void run(async()=>{const data=await api('/members');setMembers(data.members);setThread(null);})}>{t('成員管理','Members')}</button>}
      </nav>
      {members?<section>{members.map(member=><article className={styles.member} key={member.id}><div><strong>{member.nickname||'—'}</strong><p className={styles.meta}>{member.email}</p><span className={styles.meta}>{member.status==='active'?t('已開通','Active'):member.status==='pending'?t('待開通','Pending'):t('已停用','Suspended')}</span></div>{member.role!=='admin'&&<button disabled={busy} onClick={()=>void run(async()=>{await api('/members/'+member.id,'PATCH',{status:member.status==='active'?'suspended':'active'});setMembers((await api('/members')).members);})}>{member.status==='active'?t('停用','Suspend'):t('開通','Approve')}</button>}</article>)}</section>:thread?<>
        <article className={styles.post}><div className={styles.meta}>{thread.nickname} · {time(thread.created_at)}{thread.updated_at>thread.created_at?' · '+t('已編輯','Edited'):''}</div>
          {edit?.post.id===thread.id?editor(thread,'questions'):<p className={styles.body}>{thread.deleted_at?t('內容已撤回','Post withdrawn'):thread.body}</p>}
          <div className={styles.actions}>{thread.resolved? <span className={styles.meta}>{t('已解決','Resolved')}</span>:null}{!thread.deleted_at&&thread.author_id===user.id&&<button disabled={busy} onClick={()=>void run(async()=>{await api('/questions/'+thread.id,'PATCH',{resolved:!thread.resolved,version:thread.version});await openThread(thread.id);})}>{thread.resolved?t('重新開啟','Reopen'):t('標為已解決','Mark resolved')}</button>}</div>{actions(thread,'questions')}
        </article>
        <section aria-live="polite">{replies.length===0&&<p className={styles.meta}>{t('尚無回覆','No replies')}</p>}{replies.map(reply=><article className={styles.reply} key={reply.id}><div className={styles.meta}>{reply.nickname} · {time(reply.created_at)}{reply.role==='admin'?' · '+t('管理員','Admin'):''}{reply.updated_at>reply.created_at?' · '+t('已編輯','Edited'):''}</div>{edit?.post.id===reply.id?editor(reply,'replies'):<p className={styles.body}>{reply.deleted_at?t('內容已撤回','Post withdrawn'):reply.body}</p>}{actions(reply,'replies')}</article>)}</section>
        {moreReplies&&<button disabled={busy} onClick={()=>void run(async()=>{const data=await api('/questions/'+thread.id+'?replyOffset='+replies.length);setReplies(old=>[...old,...data.replies]);setMoreReplies(data.has_more);})}>{t('更多回覆','More replies')}</button>}
        {!thread.deleted_at&&<form className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!replyKey.current)replyKey.current=crypto.randomUUID();await api('/replies','POST',{id:replyKey.current,question_id:thread.id,body:replyDraft});setReplyDraft('');replyKey.current='';await openThread(thread.id);})}>
          <label htmlFor="forum-reply">{t('回覆','Reply')}</label><textarea id="forum-reply" value={replyDraft} onChange={e=>{setReplyDraft(e.target.value);replyKey.current='';}} maxLength={4000} required />
          <div className={styles.actions}><button className={styles.primary} disabled={busy}>{t('送出回覆','Reply')}</button></div>
        </form>}
      </>:<>
        <form className={styles.compose} onSubmit={e=>submit(e,async()=>{if(!questionKey.current)questionKey.current=crypto.randomUUID();const data=await api('/questions','POST',{id:questionKey.current,body:draft});setDraft('');questionKey.current='';await openThread(data.id);})}>
          <label htmlFor="forum-question">{t('你遇到什麼 AI 使用問題？','What is your AI question?')}</label><textarea id="forum-question" value={draft} onChange={e=>{setDraft(e.target.value);questionKey.current='';}} maxLength={4000} required />
          <div className={styles.actions}><button className={styles.primary} disabled={busy}>{t('發布問題','Post question')}</button></div>
        </form>
        <div className={styles.tabs}>{[['all',t('全部','All')],['unanswered',t('未回覆','Unanswered')],['mine',t('我的問題','Mine')]].map(([key,label])=><button key={key} aria-pressed={key===filter} disabled={busy} onClick={()=>{setFilter(key);setPage(0);}}>{label}</button>)}</div>
        <section>{questions.length===0?<p className={styles.meta}>{t('尚無問題','No questions')}</p>:questions.map(q=><article className={styles.row} key={q.id}><button className={styles.question} onClick={()=>void run(()=>openThread(q.id))}>{q.body.split('\n').find(x=>x.trim())?.slice(0,160)}</button><div className={styles.byline}><span>{q.nickname} · {time(q.created_at)}</span>{q.resolved?<span>{t('已解決','Resolved')}</span>:null}<span>{q.reply_count} {t('則回覆','replies')}</span></div></article>)}</section>
        <div className={styles.actions}>{page>0&&<button onClick={()=>setPage(p=>p-1)}>{t('上一頁','Previous')}</button>}{questions.length===30&&<button onClick={()=>setPage(p=>p+1)}>{t('下一頁','Next')}</button>}</div>
      </>}
    </>}
  </main>;
}
