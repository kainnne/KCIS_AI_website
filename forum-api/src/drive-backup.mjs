const API = 'https://www.googleapis.com/drive/v3';
const TIMEOUT = 15000;
class BackupError extends Error {}
const failed = code => { throw new BackupError(code); };
export function driveConfigured(env) {
  return ['DRIVE_FOLDER_ID','DRIVE_CLIENT_ID','DRIVE_CLIENT_SECRET','DRIVE_REFRESH_TOKEN'].every(key=>typeof env[key]==='string'&&env[key].length>0);
}
export async function backupStatus(env) {
  const archive=await env.DB.prepare('SELECT COUNT(*) total FROM post_archive').first();
  const queue=await env.DB.prepare('SELECT COUNT(*) pending,COALESCE(SUM(last_error IS NOT NULL),0) failed,MIN(next_attempt_at) next_attempt_at FROM drive_outbox WHERE synced_at IS NULL').first();
  const synced=await env.DB.prepare('SELECT COUNT(*) synced,MAX(synced_at) last_synced_at FROM drive_outbox WHERE synced_at IS NOT NULL').first();
  const articleArchive=await env.DB.prepare('SELECT COUNT(*) total FROM article_archive').first();
  const articleQueue=await env.DB.prepare('SELECT COUNT(*) pending,COALESCE(SUM(last_error IS NOT NULL),0) failed FROM article_drive_outbox WHERE synced_at IS NULL').first();
  const articleSynced=await env.DB.prepare('SELECT COUNT(*) synced FROM article_drive_outbox WHERE synced_at IS NOT NULL').first();
  return {drive_configured:driveConfigured(env),retained_versions:archive.total+articleArchive.total,pending:queue.pending+articleQueue.pending,failed:queue.failed+articleQueue.failed,synced:synced.synced+articleSynced.synced,last_synced_at:synced.last_synced_at};
}
async function digest(text) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export async function syncDriveBackups(env,fetcher=fetch,{now=Date.now(),limit=10,collection='posts'}={}) {
  if(!driveConfigured(env))return {configured:false,uploaded:0,failed:0};
  if(!['posts','articles'].includes(collection))throw Error('Invalid backup collection');
  const stmt=(query,...args)=>env.DB.prepare(collection==='articles'?query.replaceAll('drive_outbox','article_drive_outbox'):query).bind(...args);
  const call=(url,options={})=>fetcher(url,{...options,signal:AbortSignal.timeout(TIMEOUT)});
  let accessToken,uploaded=0,failures=0;
  for(let index=0;index<Math.min(20,Math.max(1,limit));index++) {
    const lease=crypto.randomUUID();
    const job=await stmt('UPDATE drive_outbox SET lease_token=?,lease_until=? WHERE event_id=(SELECT event_id FROM drive_outbox WHERE synced_at IS NULL AND next_attempt_at<=? AND lease_until<=? ORDER BY event_id LIMIT 1) RETURNING *',lease,now+300000,now,now).first();
    if(!job)break;
    try {
      if(!accessToken) {
        const response=await call('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:env.DRIVE_CLIENT_ID,client_secret:env.DRIVE_CLIENT_SECRET,refresh_token:env.DRIVE_REFRESH_TOKEN}).toString()});
        if(!response.ok)failed('drive_auth');
        const data=await response.json();if(typeof data.access_token!=='string'||!data.access_token)failed('drive_auth');
        accessToken=data.access_token;
      }
      const headers={Authorization:'Bearer '+accessToken};
      const raw=await stmt(collection==='articles'?'SELECT * FROM article_archive WHERE event_id=?':'SELECT * FROM post_archive WHERE event_id=?',job.event_id).first();
      const record=raw&&collection==='articles'?{...raw,kind:'articles',post_id:raw.article_id}:raw;
      if(!record)failed('archive_missing');
      const solution=record.kind==='questions'?await stmt('SELECT markdown,deleted_at FROM solution_archive WHERE question_id=? AND version=?',record.post_id,record.version).first():null;
      const content=JSON.stringify({format:'kcis-forum-archive/v1',...record,...(solution?{solution}: {})},null,2)+'\n';
      const checksum=await digest(content);
      let fileId=job.drive_file_id;
      if(!fileId) {
        const response=await call(API+'/files/generateIds?count=1&space=drive',{headers});
        if(!response.ok)failed('drive_ids');
        const data=await response.json();fileId=data.ids?.[0];
        if(typeof fileId!=='string'||!/^[A-Za-z0-9_-]+$/.test(fileId))failed('drive_ids');
        const saved=await stmt('UPDATE drive_outbox SET drive_file_id=? WHERE event_id=? AND lease_token=? RETURNING event_id',fileId,job.event_id,lease).first();
        if(!saved)failed('lease_lost');
      }
      const boundary='kcis-'+crypto.randomUUID();
      const metadata={id:fileId,name:record.kind+'-'+record.post_id+'-v'+record.version+'.json',mimeType:'application/json',parents:[env.DRIVE_FOLDER_ID],appProperties:{kcisEventId:record.event_id,kcisSHA256:checksum}};
      const multipart='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+content+'\r\n--'+boundary+'--\r\n';
      const response=await call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{method:'POST',headers:{...headers,'Content-Type':'multipart/related; boundary='+boundary},body:multipart});
      if(response.status===409) {
        // A prior timeout may have completed the upload. Verify the same file before acknowledging.
        const existing=await call(API+'/files/'+encodeURIComponent(fileId)+'?supportsAllDrives=true&fields=id,parents,trashed,appProperties',{headers});
        if(!existing.ok)failed('drive_conflict');
        const data=await existing.json();
        if(data.id!==fileId||data.trashed||!data.parents?.includes(env.DRIVE_FOLDER_ID)||data.appProperties?.kcisEventId!==record.event_id||data.appProperties?.kcisSHA256!==checksum)failed('drive_conflict');
        const media=await call(API+'/files/'+encodeURIComponent(fileId)+'?alt=media&supportsAllDrives=true',{headers});
        if(!media.ok||await digest(await media.text())!==checksum)failed('drive_conflict');
      } else {
        if(!response.ok)failed('drive_upload');
        const data=await response.json();if(data.id!==fileId)failed('drive_response');
      }
      const acknowledged=await stmt('UPDATE drive_outbox SET synced_at=?,last_error=NULL,lease_until=0,lease_token=NULL WHERE event_id=? AND lease_token=? RETURNING event_id',Date.now(),job.event_id,lease).first();
      if(acknowledged)uploaded++;
    } catch(error) {
      const code=error instanceof BackupError?error.message:'drive_unavailable';
      const backoff=Math.min(86400000,60000*2**Math.min(job.attempts,10));
      await stmt('UPDATE drive_outbox SET attempts=attempts+1,last_error=?,next_attempt_at=?,lease_until=0,lease_token=NULL WHERE event_id=? AND lease_token=?',code,now+backoff,job.event_id,lease).run();
      failures++;
      if(code==='drive_auth')break;
    }
  }
  return {configured:true,uploaded,failed:failures};
}
