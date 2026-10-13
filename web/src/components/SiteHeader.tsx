"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useSchoolSession } from "@/lib/shared-auth";
import { SchoolLogin } from "./SchoolLogin";
import "./SharedHeader.css";
const asset=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH??""}${path}`;
const wiki=(process.env.NEXT_PUBLIC_WIKINB_URL||"https://wikinb.kcis.kainnne.com/").replace(/\/$/,"");
export function SiteHeader({onHome,onManage}:{onHome?:()=>void;onManage?:()=>void}){
 const {locale,toggleLocale}=useI18n(),{session,ready}=useSchoolSession();
 const [open,setOpen]=useState(false),wrap=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement>(null);
 const text=(en:string,zh:string)=>locale==='en'?en:zh;
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!wrap.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 const act=(fn:()=>void)=>{setOpen(false);fn();};
 return <><header className="kc-shared-school-header"><div className="kc-shared-school-nav-shell">
 <Link href="/" className="kc-shared-school-brand" aria-label={text('Back to main','返回首頁')} onClick={e=>{setOpen(false);if(onHome){e.preventDefault();onHome();}}}><img src={asset('/brand/kangchiao-logo.png')} alt="KCIS" width={176} height={32}/></Link>
 <nav aria-label="Primary" className="kc-shared-school-nav"><a className="kc-shared-nav-control kc-shared-nav-ai" href={wiki+'/codex/'}>KCIS AI</a>
 <div className="kc-shared-nav-popover" ref={wrap}><button ref={toggle} type="button" className="kc-shared-nav-control kc-shared-nav-menu-toggle" aria-label={text('Menu','選單')} aria-expanded={open} aria-controls="kcis-shared-menu" onClick={()=>setOpen(!open)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
 <div id="kcis-shared-menu" className={'kc-shared-nav-panel'+(open?'':' kc-shared-hidden')}>
 <Link href="/" className="kc-shared-nav-item kc-shared-nav-tools" onClick={e=>{setOpen(false);if(onHome){e.preventDefault();onHome();}}}><svg className="kc-shared-nav-tools-icon" viewBox="0 0 24 24" aria-hidden="true">{[[3,3],[14,3],[3,14],[14,14]].map(([x,y])=><rect key={x+','+y} x={x} y={y} width="7" height="7" rx="1.5"/>)}</svg><span>AI Tools</span></Link>
 <a href={wiki+'/search/'} className="kc-shared-nav-item">WikiNB</a>
 {session&&['teacher','admin'].includes(session.user.role)&&<><a href={wiki+'/notes/'} className="kc-shared-nav-item">{text('Upload documents','上傳文件')}</a><a href={wiki+'/my-notes/'} className="kc-shared-nav-item">{text('My documents','我的文件')}</a></>}
 {onManage&&<button className="kc-shared-nav-item" onClick={()=>act(onManage)}>{text('Manage','管理')}</button>}
 <div className="kc-shared-nav-divider"/>
 <SchoolLogin renderTrigger={({openAccount,openSignOut})=><>{session?<><button className="kc-shared-nav-item kc-shared-nav-profile" aria-label={text('Account','帳號')} aria-haspopup="dialog" onClick={()=>act(openAccount)}><span>{session?.user.nickname||session?.user.name}</span><small>{session?.user.department=== '教職員'?text('Staff','教職員'):session?.user.department==='學生'?text('Student','學生'):session?.user.department}</small><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button><button className="kc-shared-nav-item" onClick={()=>act(openSignOut)}>{text('Sign out','登出')}</button></>:<button disabled={!ready} className="kc-shared-nav-item" onClick={()=>act(openAccount)}>{ready?text('Sign in','登入'):text('Checking…','確認中…')}</button>}</>}/>
 <div className="kc-shared-nav-divider"/>
 <button className="kc-shared-nav-item kc-shared-nav-language" aria-label={text('Switch to Chinese','切換為英文')} onClick={toggleLocale}><span>{text('Language','語言')}</span><span className="kc-shared-nav-language-options" aria-hidden="true"><span className={locale==='en'?'is-active':''}>EN</span><span className={locale==='zh-TW'?'is-active':''}>中文</span></span></button>
 </div></div></nav></div></header><div className="kc-shared-header-space" aria-hidden="true"/></>;
}
