'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/types';
import styles from './Forum.module.css';

export type AdminSession = {token:string;expires_at:number};
type Kind = 'questions'|'replies';
type Post = {id:string;name:string;department:string;body:string;created_at:number;deleted_at:number|null;version:number;reply_count?:number};
type Archive = {event_id:string;version:number;event_type:string;name:string;department:string;body:string;updated_at:number;deleted_at:number|null};
type Backup = {drive_configured:boolean;retained_versions:number;pending:number;failed:number;synced:number};
type Props = {apiBase:string;locale:Locale;session:AdminSession;onClose:()=>void;onExpired:()=>void};

export function ForumAdmin({apiBase,locale,session,onClose,onExpired}:Props){
  const t=(zh:string,en:string)=>locale==='en'?en:zh;
  const [questions,setQuestions]=useState<Post[]>([]),[thread,setThread]=useState<Post|null>(null),[replies,setReplies]=useState<Post[]>([]);
  const [filter,setFilter]=useState('active'),[page,setPage]=useState(0),[loaded,setLoaded]=useState(false),[more,setMore]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [confirm,setConfirm]=useState<{post:Post;kind:Kind}|null>(null);
  const [backup,setBackup]=useState<Backup|null>(null),[history,setHistory]=useState<{post:Post;kind:Kind;versions:Archive[];more:boolean}|null>(null);
  const lock=useRef(false),confirmationRef=useRef<HTMLDivElement>(null),detailRef=useRef<HTMLElement>(null);
  const request=useCallback(async(path:string,method='GET',body?:unknown)=>{
    const response=await fetch(apiBase+'/api/admin'+path,{method,headers:{'X-Forum-Admin':session.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'unavailable');
    return data;
  },[apiBase,session.token]);
  const threadId=thread?.id;
  useEffect(()=>{if(threadId){detailRef.current?.focus({preventScroll:true});window.scrollTo({top:0});}},[threadId]);
  useEffect(()=>{if(confirm)confirmationRef.current?.focus();},[confirm]);
  useEffect(()=>{
    const timeout=setTimeout(onExpired,Math.max(0,session.expires_at-Date.now()));
    return()=>clearTimeout(timeout);
  },[session.expires_at,onExpired]);
  useEffect(()=>{
    let active=true;setLoaded(false);
    request('/questions?filter='+filter+'&offset='+page*30).then(data=>{if(active){setQuestions(data.questions);setLoaded(true);}}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'unavailable');});
    return()=>{active=false;};
  },[filter,page,request]);
  useEffect(()=>{let active=true;request('/backup-status').then(data=>{if(active)setBackup(data);}).catch(()=>{});return()=>{active=false;};},[request]);
  async function run(action:()=>Promise<void>){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(reason){setError(reason instanceof Error?reason.message:'unavailable');}finally{lock.current=false;setBusy(false);}
  }
  async function loadQuestions(){const data=await request('/questions?filter='+filter+'&offset='+page*30);setQuestions(data.questions);setLoaded(true);}
  async function openThread(id:string){const data=await request('/questions/'+id);setThread(data.question);setReplies(data.replies);setMore(data.has_more);setConfirm(null);}
  async function moderate(post:Post,kind:Kind,action:'hide'|'restore'){
    await request('/'+kind+'/'+post.id+'/moderate','POST',{action,version:post.version});
    setConfirm(null);
    if(thread)await openThread(thread.id);
    await loadQuestions();
    setBackup(await request('/backup-status'));
  }
  async function openHistory(post:Post,kind:Kind){const data=await request('/archive?kind='+kind+'&post_id='+post.id);setHistory({post,kind,versions:data.versions,more:data.has_more});setConfirm(null);window.scrollTo({top:0});}
  function submit(event:FormEvent,action:()=>Promise<void>){event.preventDefault();void run(action);}
  const time=(n:number)=>new Intl.DateTimeFormat(locale==='en'?'en':'zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(n);
  function metadata(post:Post){return <div className={styles.meta}><span className={styles.author}>{post.name}</span><span>{post.department}</span><time dateTime={new Date(post.created_at).toISOString()}>{time(post.created_at)}</time>{!!post.deleted_at&&<span className={styles.deletedStatus}>{t('已刪除','Deleted')}</span>}</div>;}
  function moderationAction(post:Post,kind:Kind){
    if(post.deleted_at)return post.body?<button disabled={busy} onClick={()=>void run(()=>moderate(post,kind,'restore'))}>{kind==='questions'?t('復原問題','Restore question'):t('復原回覆','Restore reply')}</button>:null;
    return <button className={styles.danger} disabled={busy} onClick={()=>setConfirm({post,kind})}>{kind==='questions'?t('刪除問題','Delete question'):t('刪除回覆','Delete reply')}</button>;
  }
  function action(post:Post,kind:Kind){return <><button disabled={busy} onClick={()=>void run(()=>openHistory(post,kind))}>{t('版本紀錄','Version history')}</button>{moderationAction(post,kind)}</>;}
  return <section aria-label={t('論壇管理','Forum management')} aria-busy={busy}>
    <div className={styles.pageHeading}><h1>{t('論壇管理','Forum management')}</h1><button disabled={busy} onClick={onClose}>{t('返回論壇','Back to forum')}</button></div>
    {backup&&<p className={styles.backupStatus} role="status">{t('資料庫留存','Retained in database')} {backup.retained_versions} {t('版','versions')} · {backup.drive_configured?<>{t('Drive 已同步','Drive synced')} {backup.synced} · {t('待同步','Pending')} {backup.pending}{backup.failed>0&&<> · {t('需重試','Needs retry')} {backup.failed}</>}</>:t('Drive 未接入','Drive not connected')}</p>}
    {error&&<div className={styles.error} role="alert"><span>{error==='admin_auth'?t('管理權限已到期，請重新進入論壇','Management session expired. Enter the forum again.'):error==='conflict'?t('內容已變更，請重新載入','Content changed. Reload to continue.'):error==='rate'?t('操作次數已達上限，請稍後再試','Request limit reached. Try again later.'):t('連線失敗，請重試','Connection failed. Try again.')}</span><button disabled={busy} onClick={()=>error==='admin_auth'?onExpired():void run(async()=>{if(thread)await openThread(thread.id);await loadQuestions();})}>{error==='admin_auth'?t('重新進入','Enter again'):t('重新載入','Reload')}</button></div>}
    {confirm&&<div ref={confirmationRef} tabIndex={-1} className={styles.moderationConfirm} role="alertdialog" aria-labelledby="moderation-title" aria-describedby="moderation-description">
      <form onSubmit={event=>submit(event,()=>moderate(confirm.post,confirm.kind,'hide'))}>
        <h2 id="moderation-title">{confirm.kind==='questions'?t('刪除這則問題？','Delete this question?'):t('刪除這則回覆？','Delete this reply?')}</h2>
        <p id="moderation-description">{confirm.kind==='questions'?t('問題與回覆將從論壇隱藏，可在後台復原。','The question and its replies will be hidden. You can restore them here.'):t('回覆將從論壇隱藏，可在後台復原。','The reply will be hidden. You can restore it here.')}</p>
        <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setConfirm(null)}>{t('取消','Cancel')}</button><button className={styles.danger} disabled={busy}>{t('確認刪除','Confirm deletion')}</button></div>
      </form>
    </div>}
    {history?<section aria-label={t('版本紀錄','Version history')}>
      <nav className={styles.backNav}><button disabled={busy} onClick={()=>setHistory(null)}>{t('返回內容','Back to post')}</button></nav>
      {history.versions.length===0&&<p className={styles.emptyReply}>{t('尚無版本紀錄','No version history')}</p>}
      {history.versions.map(version=><article className={styles.historyVersion} key={version.event_id}><div className={styles.meta}><span className={styles.author}>{version.name}</span><span>{version.department}</span><span>v{version.version}</span><span>{({baseline:t('接手留存','Baseline'),published:t('發布','Published'),edited:t('編輯','Edited'),deleted:t('刪除','Deleted'),restored:t('復原','Restored')} as Record<string,string>)[version.event_type]}</span><time dateTime={new Date(version.updated_at).toISOString()}>{time(version.updated_at)}</time></div><p className={styles.body}>{version.body||t('原始內容已無法還原','Original content unavailable')}</p></article>)}
      {history.more&&<div className={styles.more}><button disabled={busy} onClick={()=>void run(async()=>{const data=await request('/archive?kind='+history.kind+'&post_id='+history.post.id+'&offset='+history.versions.length);setHistory({...history,versions:[...history.versions,...data.versions],more:data.has_more});})}>{t('更早版本','Earlier versions')}</button></div>}
    </section>:thread?<>
      <nav className={styles.backNav} aria-label={t('管理導覽','Management navigation')}><button disabled={busy} onClick={()=>{setThread(null);setReplies([]);setConfirm(null);}}>{t('所有問題','All questions')}</button></nav>
      <article ref={detailRef} tabIndex={-1} className={styles.post} aria-label={t('管理問題','Manage question')}>
        {metadata(thread)}<p className={styles.body}>{thread.body||t('內容已刪除','Content deleted')}</p><div className={styles.actions}>{action(thread,'questions')}</div>
      </article>
      <section className={styles.replies} aria-label={t('管理回覆','Manage replies')}><h2>{t('回覆','Replies')}</h2>{replies.length===0&&<p className={styles.emptyReply}>{t('尚無回覆','No replies')}</p>}{replies.map(reply=><article className={styles.reply} key={reply.id}>{metadata(reply)}<p className={styles.body}>{reply.body||t('內容已刪除','Content deleted')}</p><div className={styles.actions}>{action(reply,'replies')}</div></article>)}</section>
      {more&&<div className={styles.more}><button disabled={busy} onClick={()=>void run(async()=>{const data=await request('/questions/'+thread.id+'?replyOffset='+replies.length);setReplies(old=>[...old,...data.replies]);setMore(data.has_more);})}>{t('更多回覆','More replies')}</button></div>}
    </>:<>
      <div className={styles.questionsPanel}>
        <nav className={styles.tabs} aria-label={t('篩選管理內容','Filter managed posts')}>{[['active',t('未刪除','Active')],['deleted',t('已刪除','Deleted')]].map(([value,label])=><button key={value} disabled={busy} aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(0);setConfirm(null);}}>{label}</button>)}</nav>
        <section aria-label={t('管理問題列表','Managed questions')}>
          {!loaded?<p className={styles.empty} role="status">{error?t('無法載入問題','Could not load questions'):t('載入中…','Loading…')}</p>:questions.length===0?<p className={styles.empty}>{t('尚無問題','No questions')}</p>:questions.map(post=><article key={post.id} className={styles.row}><button className={styles.question} disabled={busy} onClick={()=>void run(()=>openThread(post.id))}><div className={styles.questionContent}><h2>{post.body.split('\n').find(line=>line.trim())?.slice(0,160)||t('內容已刪除','Content deleted')}</h2>{metadata(post)}</div><span className={styles.replyCount}>{post.reply_count} {t('則回覆',post.reply_count===1?'reply':'replies')}</span><span className={styles.rowArrow} aria-hidden="true">→</span></button></article>)}
        </section>
      </div>
      {(page>0||questions.length===30)&&<nav className={styles.pagination} aria-label={t('管理分頁','Management pagination')}>{page>0&&<button disabled={busy} onClick={()=>setPage(value=>value-1)}>{t('上一頁','Previous')}</button>}{questions.length===30&&<button disabled={busy} onClick={()=>setPage(value=>value+1)}>{t('下一頁','Next')}</button>}</nav>}
    </>}
  </section>;
}
