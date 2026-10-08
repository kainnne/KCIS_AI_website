'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/types';
import styles from './Forum.module.css';

export type TranslatablePost = {id:string;body:string;version:number;deleted_at:number|null};
type Translation = {body?:string;version?:number;pending?:boolean};
type Entry = {readers:number;ready:boolean;promise:Promise<Translation>};
const cache=new Map<string,Entry>();
let queue=Promise.resolve();
function subscribe(key:string,load:()=>Promise<Translation>){
  let entry=cache.get(key);
  if(!entry){
    entry={readers:0,ready:false,promise:Promise.resolve({})};
    const current=entry;
    current.promise=queue.then(async()=>{
      for(let attempt=0;attempt<4;attempt++){
        if(current.readers===0)throw Error('cancelled');
        const result=await load();
        if(!result.pending){current.ready=true;return result;}
        await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
      }
      throw Error('translation');
    }).catch(error=>{if(cache.get(key)===current)cache.delete(key);throw error;});
    queue=current.promise.then(()=>undefined,()=>undefined);
    cache.set(key,current);
    if(cache.size>200)for(const [oldKey,old] of cache){if(old.ready&&old.readers===0){cache.delete(oldKey);if(cache.size<=200)break;}}
  }
  entry.readers++;
  return {promise:entry.promise,release:()=>{entry.readers--;}};
}

type Props={
  post:TranslatablePost;kind:'questions'|'replies';locale:Locale;preview?:boolean;actions?:ReactNode;
  request:(post:TranslatablePost,kind:'questions'|'replies',target:Locale)=>Promise<Translation>;
};
export function ForumPostText({post,kind,locale,preview=false,actions,request}:Props){
  const {id,body:sourceBody,version,deleted_at}=post;
  const ref=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false),[attempt,setAttempt]=useState(0),[original,setOriginal]=useState(false);
  const [result,setResult]=useState<{body:string;target:Locale;version:number}|null>(null);
  const [status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle'),[error,setError]=useState('');
  const t=(zh:string,en:string)=>locale==='en'?en:zh;
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'80px'});
    observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    setOriginal(false);
    if(!visible||deleted_at)return;
    let active=true;setStatus('loading');setError('');
    const key=kind+':'+id+':'+version+':'+locale;
    const subscription=subscribe(key,()=>request({id,body:sourceBody,version,deleted_at},kind,locale));
    subscription.promise.then(data=>{
      if(!active)return;
      if(data.version!==version||typeof data.body!=='string')throw Error('conflict');
      setResult({body:data.body,target:locale,version:version});setStatus('ready');
    }).catch(reason=>{if(active){setError(reason instanceof Error?reason.message:'translation');setStatus('error');}});
    return()=>{active=false;subscription.release();};
  },[visible,id,version,sourceBody,deleted_at,kind,locale,attempt,request]);
  const current=result?.target===locale&&result.version===post.version?result:null;
  const body=post.deleted_at?t('內容已刪除','Content deleted'):!original&&current?current.body:post.body;
  if(preview)return <div ref={ref}><h2>{body.split('\n').find(line=>line.trim())?.slice(0,160)}</h2></div>;
  return <div ref={ref}>
    <p className={styles.body} lang={!original&&current?locale:undefined}>{body}</p>
    {!post.deleted_at&&<div className={styles.postActions}>
      <div className={styles.translation}>
        {status==='loading'&&<span className={styles.translationStatus} role="status"><span className={styles.spinner} />{t('翻譯中…','Translating…')}</span>}
        {status==='ready'&&current&&current.body!==post.body&&<><span className={styles.translationStatus}>{original?t('原文','Original'):t('已翻譯','Translated')}</span><button className={styles.textButton} onClick={()=>setOriginal(value=>!value)}>{original?t('顯示譯文','Show translation'):t('查看原文','View original')}</button></>}
        {status==='error'&&<><span className={styles.translationStatus} role="status">{error==='translation_limit'?t('今日翻譯額度已用完','Daily translation limit reached'):t('暫時顯示原文','Showing original')}</span>{error!=='translation_limit'&&<button className={styles.textButton} onClick={()=>setAttempt(value=>value+1)}>{t('重試翻譯','Retry translation')}</button>}</>}
      </div>
      {actions}
    </div>}
  </div>;
}
