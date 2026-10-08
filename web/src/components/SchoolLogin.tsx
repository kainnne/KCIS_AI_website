'use client';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { clearSchoolSession, refreshSchoolSession, schoolRequest, sessionChanged, useSchoolSession } from '@/lib/shared-auth';
function returnDestination(){
  const raw=new URLSearchParams(location.search).get('returnTo');if(!raw)return '';
  try{const url=new URL(raw,location.origin);if(url.username||url.password)return '';
    if(url.origin===location.origin||url.origin==='https://wikinb.kcis.kainnne.com')return url.href;
    if(['localhost','127.0.0.1'].includes(location.hostname)&&url.hostname===location.hostname&&url.protocol==='http:'&&url.port==='4322')return url.href;
  }catch{}return '';
}
export function SchoolLogin(){
  const {locale}=useI18n(),t=(zh:string,en:string)=>locale==='en'?en:zh;
  const {session,ready,error:sessionError}=useSchoolSession(),dialog=useRef<HTMLDialogElement>(null),openedFromLink=useRef(false);
  const [view,setView]=useState<'login'|'account'|'logout'|null>(null),[step,setStep]=useState<'email'|'code'|'nickname'>('email');
  const [email,setEmail]=useState(''),[code,setCode]=useState(''),[nickname,setNickname]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{if(view)dialog.current?.showModal();else dialog.current?.close();},[view]);
  useEffect(()=>{
    const trial=process.env.NEXT_PUBLIC_TRIAL_URL;
    if(trial&&!['localhost','127.0.0.1'].includes(location.hostname)&&new URL(trial).origin!==location.origin)location.replace(new URL(location.pathname+location.search+location.hash,trial).href);
  },[]);
  useEffect(()=>{
    if(!ready||openedFromLink.current)return;const query=new URLSearchParams(location.search);
    if(query.get('signin')==='1'||query.get('account')==='1'){
      openedFromLink.current=true;setError('');
      if(session){if(query.get('account')==='1'){setNickname(session.user.nickname);setView('account');}else{const destination=returnDestination();if(destination)location.assign(destination);}}
      else setView('login');
    }
  },[ready,session]);
  function close(){if(!busy){setView(null);setError('');}}
  function openAccount(){setNickname(session?.user.nickname||'');setError('');setNotice('');setView('account');}
  async function finishLogin(){
    const verified=await refreshSchoolSession(true);if(!verified)throw Error(t('未完成登入，請重試。','Sign-in did not complete. Please try again.'));
    sessionChanged();setView(null);setCode('');setNotice(t('已登入','Signed in'));const destination=returnDestination();if(destination)location.assign(destination);
  }
  async function submit(){
    setBusy(true);setError('');try{
      if(view==='logout'){await schoolRequest('logout',{});clearSchoolSession();setView(null);setNotice(t('已登出','Signed out'));}
      else if(view==='account'){await schoolRequest('nickname',{nickname:nickname.trim()},'PATCH');await refreshSchoolSession(true);sessionChanged();setView(null);setNotice(t('暱稱已更新','Display name updated'));const query=new URLSearchParams(location.search);['account','signin','returnTo'].forEach(key=>query.delete(key));history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash);}
      else if(step==='email'){const normalized=email.trim().toLowerCase();await schoolRequest('send-code',{email:normalized,purpose:'login'});setEmail(normalized);setCode('');setStep('code');}
      else if(step==='code'){const check=await schoolRequest('verify-code',{email,code,purpose:'login'});if(check.needsNickname){setNickname('');setStep('nickname');}else{await schoolRequest('login-with-code',{email,code,purpose:'login'});await finishLogin();}}
      else{await schoolRequest('complete-setup',{email,code,nickname:nickname.trim(),purpose:'login'});await finishLogin();}
    }catch(e){setError(e instanceof Error?e.message:t('連線失敗','Connection failed.'));}finally{setBusy(false);}
  }
  const account=view==='account',logout=view==='logout';
  return <>
    <button type="button" className="kc-signin" disabled={!ready} onClick={()=>{if(session){openAccount();return;}setError('');setNotice('');setStep('email');setCode('');setView('login');}}>{!ready?t('確認中…','Checking…'):session?session.user.nickname||session.user.name:t('登入','Sign in')}</button>
    {(notice||sessionError)&&<span className="kc-auth-status" role="status">{notice||sessionError}</span>}
    <dialog ref={dialog} className="kc-login-dialog" aria-labelledby="kc-login-title" onCancel={e=>{if(busy)e.preventDefault();else close();}} onClose={()=>{if(!busy)setView(null);}}>
      <button type="button" className="kc-login-close" disabled={busy} aria-label={t('關閉','Close')} onClick={close}>×</button>
      <h2 id="kc-login-title">{logout?t('確定登出？','Sign out?'):account?t('帳號','Account'):step==='nickname'?t('設定暱稱','Set display name'):t('校內登入','School sign-in')}</h2>
      {account&&<p className="kc-account-email">{session?.user.email}</p>}
      <form onSubmit={e=>{e.preventDefault();void submit();}}>
        {!logout&&(account||step==='nickname'?<label>{t('暱稱','Display name')}<input key="nickname" value={nickname} autoComplete="nickname" minLength={2} maxLength={20} onChange={e=>setNickname(e.target.value)} required autoFocus /><small>{t('2–20 字：中文、英文、_ 或 .','2–20 characters: Chinese, English, _ or .')}</small></label>:step==='email'?<label>{t('校內信箱','School email')}<input key="email" type="email" value={email} autoComplete="email" onChange={e=>setEmail(e.target.value)} required autoFocus /></label>:<label>{t('信箱驗證碼','Email verification code')}<input key="code" value={code} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} onChange={e=>setCode(e.target.value)} required autoFocus /><small>{email}</small></label>)}
        {error&&<p role="alert">{error}</p>}
        <button className="kc-signin" disabled={busy}>{busy?t('處理中…','Please wait…'):logout?t('登出','Sign out'):account?t('儲存','Save'):step==='email'?t('寄送驗證碼','Send code'):t('確認','Continue')}</button>
        {logout&&<button type="button" className="kc-auth-secondary" disabled={busy} onClick={openAccount}>{t('取消','Cancel')}</button>}
        {account&&<button type="button" className="kc-auth-secondary" disabled={busy} onClick={()=>{setError('');setView('logout');}}>{t('登出','Sign out')}</button>}
        {!account&&!logout&&step!=='email'&&<button type="button" className="kc-auth-secondary" disabled={busy} onClick={()=>{setStep('email');setCode('');setError('');}}>{t('重新寄送／更換信箱','Resend / change email')}</button>}
      </form>
    </dialog>
  </>;
}
