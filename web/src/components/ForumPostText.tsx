'use client';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/types';
import styles from './Forum.module.css';
export type ForumTextPost={id:string;body:string;version:number;deleted_at:number|null};
export function ForumPostText({post,locale,preview=false,actions}: {post:ForumTextPost;locale:Locale;preview?:boolean;actions?:ReactNode}) {
 const body=post.deleted_at?(locale==='en'?'Content deleted':'內容已刪除'):post.body;
 if(preview)return <h2>{body.split('\n').find(line=>line.trim())?.slice(0,160)}</h2>;
 return <div><p className={styles.body}>{body}</p>{!post.deleted_at&&actions&&<div className={styles.postActions}>{actions}</div>}</div>;
}
