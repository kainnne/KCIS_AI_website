export function solutionMarkdown(post) {
  return `---\nkind: forum-solution\nquestion_id: ${post.id}\nversion: ${post.version}\nstatus: ${post.resolved?'resolved':'unresolved'}\nupdated: ${new Date(post.updated_at).toISOString()}\n---\n\n# AI 論壇解決紀錄\n\n## 問題\n${post.body}\n\n## 提問者\n${post.name} · ${post.department}\n\n## 解決方法\n${post.solution_method}\n\n## 操作步驟\n${post.solution_steps}\n\n## 驗證結果\n${post.solution_result}\n`;
}
export async function syncWikiNBSolutions(env,{fetcher=fetch,now=Date.now()}={}) {
  if(!env.WIKINB_API_URL||!env.WIKINB_INGEST_SECRET)return {configured:false,synced:0};
  const target=new URL('/api/library/forum-solutions',env.WIKINB_API_URL);
  if(target.protocol!=='https:'&&!(env.LOCAL_MODE==='1'&&['127.0.0.1','localhost'].includes(target.hostname)))throw Error('WikiNB needs HTTPS');
  const pending=(await env.DB.prepare('SELECT o.event_id,a.question_id,a.version,a.markdown,a.deleted_at,a.uploader_role FROM wikinb_outbox o JOIN solution_archive a USING(event_id) WHERE o.synced_at IS NULL AND o.next_attempt_at<=? AND o.lease_until<=? ORDER BY a.created_at LIMIT 10').bind(now,now).all()).results;
  let synced=0;
  for(const row of pending) {
    const lease=crypto.randomUUID();
    const claimed=await env.DB.prepare('UPDATE wikinb_outbox SET lease_until=?,lease_token=?,attempts=attempts+1 WHERE event_id=? AND synced_at IS NULL AND lease_until<=? RETURNING event_id').bind(now+120000,lease,row.event_id,now).first();
    if(!claimed)continue;
    try {
      const response=await fetcher(target,{method:'POST',headers:{Authorization:'Bearer '+env.WIKINB_INGEST_SECRET,'Content-Type':'application/json'},body:JSON.stringify({questionId:row.question_id,role:row.uploader_role,version:row.version,markdown:row.markdown,deleted:row.deleted_at!==null}),signal:AbortSignal.timeout(30000),redirect:'error'});
      if(!response.ok)throw Error('HTTP '+response.status);
      await env.DB.prepare('UPDATE wikinb_outbox SET synced_at=?,lease_until=0,last_error=NULL WHERE event_id=? AND lease_token=?').bind(now,row.event_id,lease).run();synced++;
    } catch {
      await env.DB.prepare("UPDATE wikinb_outbox SET next_attempt_at=?,lease_until=0,last_error='delivery_failed' WHERE event_id=? AND lease_token=?").bind(now+60000,row.event_id,lease).run();
    }
  }
  return {configured:true,synced};
}

export async function syncWikiNBArticles(env,{fetcher=fetch,now=Date.now()}={}) {
 if(!env.WIKINB_API_URL||!env.WIKINB_INGEST_SECRET)return {configured:false,synced:0};
 const target=new URL('/api/library/forum-articles',env.WIKINB_API_URL);
 if(target.protocol!=='https:'&&!(env.LOCAL_MODE==='1'&&['localhost','127.0.0.1'].includes(target.hostname)))throw Error('WikiNB needs HTTPS');
 const rows=(await env.DB.prepare('SELECT o.event_id,a.* FROM article_outbox o JOIN article_archive a USING(event_id) WHERE o.synced_at IS NULL AND o.next_attempt_at<=? AND o.lease_until<=? ORDER BY a.created_at LIMIT 10').bind(now,now).all()).results;
 let synced=0;
 for(const row of rows){
  const lease=crypto.randomUUID();
  if(!await env.DB.prepare('UPDATE article_outbox SET lease_until=?,lease_token=?,attempts=attempts+1 WHERE event_id=? AND synced_at IS NULL AND lease_until<=? RETURNING event_id').bind(now+120000,lease,row.event_id,now).first())continue;
  try{
   const response=await fetcher(target,{method:'POST',headers:{Authorization:'Bearer '+env.WIKINB_INGEST_SECRET,'Content-Type':'application/json'},body:JSON.stringify({articleId:row.article_id,title:row.title,author:row.author,version:row.version,markdown:row.markdown,deleted:row.deleted_at!==null}),signal:AbortSignal.timeout(30000),redirect:'error'});
   if(!response.ok)throw Error();
   await env.DB.prepare('UPDATE article_outbox SET synced_at=?,lease_until=0,last_error=NULL WHERE event_id=? AND lease_token=?').bind(now,row.event_id,lease).run();synced++;
  }catch{await env.DB.prepare("UPDATE article_outbox SET next_attempt_at=?,lease_until=0,last_error='delivery_failed' WHERE event_id=? AND lease_token=?").bind(now+60000,row.event_id,lease).run();}
 }
 return {configured:true,synced};
}
