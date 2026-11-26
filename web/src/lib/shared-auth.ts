'use client';
import { useEffect, useSyncExternalStore } from 'react';
export type SchoolSession={user:{email:string;nickname:string;name:string;department:string;updatedAt?:string;role:string};token:string;admin:boolean};
const configured=process.env.NEXT_PUBLIC_AUTH_API_URL||'';
export function authBase(){
  const local=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname);
  if(configured){const url=new URL(configured);if(local&&['localhost','127.0.0.1'].includes(url.hostname))url.hostname=location.hostname;return url.href.replace(/\/$/,'');}
  return local?'http://'+location.hostname+':8790':'';
}
// The sign-in cookie comes from another site (the API's workers.dev address), and iPhone Safari and other
// browsers block such cookies, so sign-in looked like it failed after a correct code. The API also returns a
// signed token; keep it in this browser and send it as a Bearer header, like WikiNB does. The cookie still works where allowed.
const TOKEN_KEY='kcis_school_token';
function storedToken(){try{return localStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
function storeToken(token:string){try{if(token)localStorage.setItem(TOKEN_KEY,token);else localStorage.removeItem(TOKEN_KEY);}catch{}}
export async function schoolRequest(path:string,body?:unknown,method?:string){
  const base=authBase();if(!base)throw Error('登入服務尚未連接 / Sign-in is not connected yet.');
  const headers:Record<string,string>={'Content-Type':'application/json'},token=storedToken();if(token)headers.Authorization='Bearer '+token;
  const res=await fetch(base+'/api/auth/'+path,{method:method||(body===undefined?'GET':'POST'),credentials:'include',headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(['send-code','lookup'].includes(path)?75000:15000)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===401&&token&&path==='shared-session')storeToken('');throw Object.assign(Error(data.error||'連線失敗 / Connection failed.'),{status:res.status});}
  if(path==='login-with-code'&&typeof data.token==='string')storeToken(data.token);
  if(path==='logout')storeToken('');
  return data;
}
type Snapshot={session:SchoolSession|null;ready:boolean;error:string};
const initial:Snapshot={session:null,ready:false,error:''};
let snapshot=initial,pending:Promise<SchoolSession|null>|null=null,generation=0;
const listeners=new Set<()=>void>();
function publish(next:Snapshot){snapshot=next;listeners.forEach(fn=>fn());}
export function refreshSchoolSession(force=false):Promise<SchoolSession|null>{
  if(pending)return force?pending.catch(()=>null).then(()=>refreshSchoolSession()):pending;
  if(!authBase()){publish({session:null,ready:true,error:'登入服務尚未連接 / Sign-in is not connected yet.'});return Promise.resolve(null);}
  const requestedGeneration=generation;
  pending=schoolRequest('shared-session').then(session=>{if(generation!==requestedGeneration)return snapshot.session;publish({session,ready:true,error:''});return session as SchoolSession;}).catch(error=>{
    if(generation!==requestedGeneration)return snapshot.session;
    if([401,403].includes(error.status)){publish({session:null,ready:true,error:''});return null;}
    publish({...snapshot,ready:true,error:error.message});throw error;
  }).finally(()=>{pending=null;});return pending;
}
export function sessionChanged(){try{localStorage.setItem('kcis:auth-change',String(Date.now()));}catch{}window.dispatchEvent(new Event('kcis:session'));}
export function clearSchoolSession(){storeToken('');generation++;publish({session:null,ready:true,error:''});sessionChanged();}
export function useSchoolSession(){
  const state=useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>snapshot,()=>initial);
  useEffect(()=>{
    const refresh=()=>{void refreshSchoolSession().catch(()=>{});};
    const storage=(e:StorageEvent)=>{if(e.key==='kcis:auth-change')refresh();};
    const visible=()=>{if(document.visibilityState==='visible')refresh();};
    if(!snapshot.ready)refresh();const timer=setInterval(refresh,10*60*1000);
    window.addEventListener('kcis:session',refresh);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);window.removeEventListener('kcis:session',refresh);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visible);};
  },[]);return {...state,refresh:refreshSchoolSession};
}
