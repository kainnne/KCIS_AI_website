import { HttpError } from './http-error.mjs';
const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export async function verifiedAccount(request,env,now=Date.now()) {
  const header=request.headers.get('Authorization')||request.headers.get('X-Forum-Admin')||'';
  const token=header.replace(/^Bearer /,'');
  if(!token || /^[a-f0-9]{64}$/.test(token))return null;
  if(!env.SESSION_SECRET||env.SESSION_SECRET.length<32)throw new HttpError(503,'auth_unavailable');
  try {
    if(token.length>8192)throw Error();
    const [head,body,signature,...rest]=token.split('.');if(rest.length||!signature)throw Error();
    if(JSON.parse(new TextDecoder().decode(decode(head))).alg!=='HS256')throw Error();
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('HMAC',key,decode(signature),new TextEncoder().encode(head+'.'+body)))throw Error();
    const user=JSON.parse(new TextDecoder().decode(decode(body))), email=String(user.email||'').toLowerCase();
    const domains=(env.ALLOWED_EMAIL_DOMAINS||'kcis.com.tw,kcis.ntpc.edu.tw').split(',').map(v=>v.trim());
    const exceptions=String(env.EXTRA_ALLOWED_EMAILS ?? 'chaos60649@gmail.com,st101031616@gmail.com').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
    if(!Number.isInteger(user.exp)||user.exp*1000<=now||user.nbf&&user.nbf*1000>now||! /^[^@\s]+@[^@\s]+$/.test(email)||(!domains.includes(email.split('@')[1])&&!exceptions.includes(email))||user.authType!=='email-otp')throw Error();
    return {...user,email,token};
  } catch {throw new HttpError(401,'auth');}
}
export const isAdministrator=user=>user?.email==='kainnne@kcis.com.tw';
