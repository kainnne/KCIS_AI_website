'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clearSchoolSession, refreshSchoolSession, schoolRequest, sessionChanged, useSchoolSession } from '@/lib/shared-auth';
import './SchoolAccount.css';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n';
export type GuestProfile={name:string;department:string};
const guestKey='kcis-forum-profile';
function returnDestination(){
 const raw=new URLSearchParams(location.search).get('returnTo');if(!raw)return '';
 try{const url=new URL(raw,location.origin);if(url.username||url.password)return '';
 if(url.origin===location.origin||url.origin==='https://wikinb.kcis.kainnne.com')return url.href;
 if(['localhost','127.0.0.1'].includes(location.hostname)&&url.hostname===location.hostname&&url.protocol==='http:'&&url.port==='4322')return url.href;
 }catch{}return '';
}
export function SchoolLogin({allowGuest=false,onGuestChange,renderTrigger}:{allowGuest?:boolean;onGuestChange?:(profile:GuestProfile|null)=>void;renderTrigger?:(controls:{openAccount:()=>void;openSignOut:()=>void;guest:GuestProfile|null})=>ReactNode}){
 const {locale}=useI18n(),label=(en:string,zh:string)=>locale==='en'?en:zh;
 const {session,ready,error:sessionError}=useSchoolSession(),dialog=useRef<HTMLDialogElement>(null),openedFromLink=useRef(false),composing=useRef(false),guestCallback=useRef(onGuestChange);guestCallback.current=onGuestChange;
 const [view,setView]=useState<'login'|'account'|'logout'|'guest'|null>(null),[step,setStep]=useState<'email'|'code'>('email');
 const [guest,setGuest]=useState<GuestProfile|null>(null),[email,setEmail]=useState(''),[code,setCode]=useState(''),[nickname,setNickname]=useState(''),[department,setDepartment]=useState(''),[busy,setBusy]=useState(false),[busyLabel,setBusyLabel]=useState('Saving…'),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{if(view&&!dialog.current?.open)dialog.current?.showModal();else if(!view)dialog.current?.close();},[view]);
 useEffect(()=>{
  if(!allowGuest)return;
  try{const stored=JSON.parse(sessionStorage.getItem(guestKey)||'null');if(stored?.name&&stored?.department){setGuest(stored);guestCallback.current?.(stored);}}catch{}

 },[allowGuest,guest?.name,guest?.department,session]);
 useEffect(()=>{
  if(!ready||openedFromLink.current)return;const query=new URLSearchParams(location.search);
  if(query.get('signin')==='1'||query.get('account')==='1'){
   openedFromLink.current=true;setError('');
   if(session){if(query.get('account')==='1'){setNickname(session.user.nickname);setDepartment(session.user.department);setView('account');}else{const destination=returnDestination();if(destination)location.assign(destination);}}
   else setView('login');
  }
 },[ready,session]);
 function close(){if(!busy){setView(null);setError('');}}
 async function openAccount(){
  setStep('email');setCode('');setNickname(session?.user.nickname||guest?.name||'');setDepartment(session?.user.department||guest?.department||'');setError('');setNotice('');setView(session?'account':guest&&allowGuest?'guest':'login');
  if(!session)return;setBusyLabel('Checking…');setBusy(true);try{const latest=await refreshSchoolSession(true);if(!latest){setView('login');return;}setNickname(latest.user.nickname);setDepartment(latest.user.department);}catch(error){setError(error instanceof Error?error.message:'Connection failed.');}finally{setBusy(false);}
 }
 async function finishLogin(){
  const verified=await refreshSchoolSession(true);if(!verified)throw Error('Sign-in did not complete. Please try again.');
  sessionChanged();setView(null);setCode('');setNotice('Signed in');const destination=returnDestination();if(destination)location.assign(destination);
 }
 async function submit(){
  if(composing.current||busy)return;setBusyLabel(view==='logout'?'Signing out…':view==='login'?(step==='email'?'Sending…':'Checking…'):'Saving…');setBusy(true);setError('');
  try{
   if(view==='logout'){
    if(session){await schoolRequest('logout',{});clearSchoolSession();}setGuest(null);guestCallback.current?.(null);try{sessionStorage.removeItem(guestKey);}catch{}
    setView(null);setNotice('Signed out');
   }else if(view==='guest'){
    const profile={name:nickname.trim(),department:department.trim()};if(!profile.name||!profile.department)throw Error('Enter your name and department.');
    try{sessionStorage.setItem(guestKey,JSON.stringify(profile));}catch{}setGuest(profile);guestCallback.current?.(profile);setView(null);setNotice('Guest profile updated');
   }else if(view==='account'){
    const result=await schoolRequest('nickname',{nickname:nickname.trim(),department:department.trim(),expectedRevision:session?.user.updatedAt},'PATCH');await refreshSchoolSession(true);sessionChanged();setView(null);
    setNotice((result.sync?.library==='pending'||result.sync?.forum==='pending')?'Account saved · Sync pending':'Account updated');
    const query=new URLSearchParams(location.search);['account','signin','returnTo'].forEach(key=>query.delete(key));history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash);
   }else if(step==='email'){const normalized=email.trim().toLowerCase();await schoolRequest('send-code',{email:normalized,purpose:'login'});setEmail(normalized);setCode('');setStep('code');}
   else{await schoolRequest('login-with-code',{email,code,purpose:'login'});await finishLogin();}
  }catch(e){setError(e instanceof Error?e.message:'Connection failed.');}finally{setBusy(false);}
 }
 const account=view==='account'||view==='guest',logout=view==='logout';
 return <>
  {renderTrigger?renderTrigger({openAccount:()=>void openAccount(),openSignOut:()=>{setError('');setView('logout');},guest:allowGuest?guest:null}):<button type="button" className="kc-account-button" disabled={!ready} aria-label={!ready?'Checking account':session||guest?'Account':'Sign in'} onClick={()=>void openAccount()}>{!ready?'Checking…':session?session.user.nickname||session.user.name:guest&&allowGuest?'Guest · '+guest.name:'Sign in'}</button>}
  {ready&&(notice||sessionError)&&createPortal(<span className="kc-account-notice" role="status">{notice||sessionError}</span>,document.body)}
  {ready&&createPortal(<dialog ref={dialog} className="kc-account-dialog" aria-labelledby="kc-account-title" onCancel={e=>{if(busy)e.preventDefault();else close();}} onClose={()=>{if(!busy)setView(null);}}>
   <button type="button" className="kc-account-close" disabled={busy} aria-label="Close" onClick={close}>×</button>
   <h2 id="kc-account-title">{logout?label('Sign out?','要登出嗎？'):view==='guest'?label('Guest','訪客'):account?label('Account','帳號'):label('School sign-in','校內信箱登入')}</h2>
   {view==='account'&&<p className="kc-account-email">{session?.user.email}</p>}
   <form onSubmit={e=>{e.preventDefault();void submit();}} aria-busy={busy}>
    {!logout&&(account?<>
     <label>{label('Name','姓名')}<input value={nickname} autoComplete="nickname" minLength={2} maxLength={20} onChange={e=>setNickname(e.target.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Enter'&&(composing.current||e.nativeEvent.isComposing||e.keyCode===229))e.preventDefault();}} disabled={busy} required autoFocus /></label>
     <label>{label('Department','部門')}<input value={department} autoComplete="organization" maxLength={40} onChange={e=>setDepartment(e.target.value)} disabled={busy} required /></label>
    </>:step==='email'?<label>{label('School email','校內信箱')}<input type="email" value={email} autoComplete="email" onChange={e=>setEmail(e.target.value)} disabled={busy} required autoFocus /></label>:<label>{label('Verification code','驗證碼')}<input value={code} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} onChange={e=>setCode(e.target.value)} disabled={busy} required autoFocus /><small>{email}</small></label>)}
    {error&&<p role="alert">{error}</p>}
    <div className="kc-account-actions">
     <button className="kc-account-primary" disabled={busy}>{busy?busyLabel:logout?label('Sign out','登出'):account?label('Save','儲存'):step==='email'?label('Send code','寄送驗證碼'):label('Continue','繼續')}</button>
     {logout&&<button type="button" className="kc-account-secondary" disabled={busy} onClick={()=>void openAccount()}>{label('Cancel','取消')}</button>}
     {account&&<button type="button" className="kc-account-secondary" disabled={busy} onClick={()=>{setError('');setView('logout');}}>{label('Sign out','登出')}</button>}
    </div>
    {!account&&!logout&&step!=='email'&&<button type="button" className="kc-account-text" disabled={busy} onClick={()=>{setStep('email');setCode('');setError('');}}>Resend / change email</button>}

    {view==='guest'&&<button type="button" className="kc-account-text" disabled={busy} onClick={()=>{setStep('email');setView('login');}}>Sign in with school email</button>}
   </form>
  </dialog>,document.body)}
 </>;
}
