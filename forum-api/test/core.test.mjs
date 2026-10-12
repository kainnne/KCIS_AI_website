import {createHmac} from 'node:crypto';
import { syncWikiNBSolutions } from '../src/solutions.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHandler, cleanup } from '../src/core.mjs';
import { startAdminSession } from '../src/admin.mjs';
import { backupStatus, syncDriveBackups } from '../src/drive-backup.mjs';

function fixture() {
  const sql=new DatabaseSync(':memory:');
  for(const file of ['0001_forum.sql','0002_public_forum.sql','0003_translation_jobs.sql','0004_post_archive.sql','0005_solutions.sql','0006_solution_moderation.sql','0007_articles.sql','0008_solution_roles.sql','0009_account_profiles.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  function prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}};}
  const inferences=[];
  const env={SESSION_SECRET:'s'.repeat(64),ADMIN_NAME:'Test moderator',ADMIN_DEPARTMENT:'IT',ADMIN_SESSION_SECRET:'s'.repeat(64),DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}},ALLOWED_ORIGIN:'https://ai-tools.kcis.kainnne.com',AI:{async run(model,input){inferences.push({model,input});return {response:'How do I use AI?'};}}};
  const handler=createHandler();
  async function call(path,{method='GET',body,token,admin,origin=env.ALLOWED_ORIGIN}={}){
    const response=await handler(new Request('https://api.example.test/api'+path,{method,headers:{Origin:origin,...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(admin?{'X-Forum-Admin':admin}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);
    return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};
  }
  const sign=(email,exp=Math.floor(Date.now()/1000)+3600,profile={})=>{const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),b=Buffer.from(JSON.stringify({email,nickname:'測試姓名',role:(email==='st101031616@gmail.com'||/^[sj]\d{5}(?:$|[^a-z0-9])/i.test(email.split('@')[0]))?'student':'teacher',authType:'email-otp',department:'英文科',updatedAt:new Date().toISOString(),...profile,exp})).toString('base64url');return h+'.'+b+'.'+createHmac('sha256',env.SESSION_SECRET).update(h+'.'+b).digest('base64url');};
  const token=sign('teacher@kcis.com.tw'),other=sign('other@kcis.com.tw'),adminToken=sign('kainnne@kcis.com.tw');
  const question={id:crypto.randomUUID(),body:'請問怎麼使用 AI？',name:'測試姓名',department:'英文科'};
  const create=()=>call('/questions',{method:'POST',body:question,token});
  return {sql,env,call,create,question,token,other,inferences,adminToken,sign};
}

test('public reading, required identity, no login routes and exact CORS',async()=>{
  const f=fixture();
  assert.equal((await f.call('/questions')).status,200);
  assert.equal((await f.call('/auth/code',{method:'POST',body:{email:'a@example.test'}})).status,404);
  assert.equal((await f.call('/members')).status,404);
  assert.equal((await f.call('/questions',{origin:'https://evil.test'})).status,403);
  for(const body of [{...f.question,department:''},{...f.question,department:'x\ny'}])assert.equal((await f.call('/questions',{method:'POST',body,token:f.token})).status,201);
  assert.equal((await f.call('/questions',{method:'POST',body:{...f.question,id:crypto.randomUUID()},token:f.sign('teacher@kcis.com.tw',undefined,{department:'x\ny'})})).status,400);
  assert.equal((await f.call('/questions',{method:'POST',body:f.question})).status,401);
  assert.equal((await f.create()).status,201);
  const view=await f.call('/questions');assert.equal(view.data.questions[0].department,'英文科');assert.equal(view.data.questions[0].mine,false);
  assert.ok(!JSON.stringify(view.data).includes('owner_hash'));assert.ok(!JSON.stringify(view.data).includes(f.token));
  assert.equal(view.headers.get('cache-control'),'private, no-store');f.sql.close();
});

test('capability ownership, idempotency, version conflicts, reply pagination and disabled withdrawal',async()=>{
  const f=fixture(),id=f.question.id;
  assert.equal((await f.create()).status,201);assert.equal((await f.create()).status,201);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM public_questions').get().n,1);
  assert.equal((await f.call('/questions?filter=mine',{token:f.token})).data.questions.length,1);
  assert.equal((await f.call('/questions?filter=mine',{token:f.other})).data.questions.length,0);
  assert.equal((await f.call('/questions/'+id,{method:'PATCH',body:{body:'冒充修改',version:1},token:f.other})).status,403);
  assert.equal((await f.call('/questions/'+id,{method:'PATCH',body:{body:'補充內容',version:1},token:f.token})).status,200);
  assert.equal((await f.call('/questions/'+id,{method:'PATCH',body:{body:'舊版',version:1},token:f.token})).status,409);
  const reply={id:crypto.randomUUID(),question_id:id,body:'回覆',name:'回覆者',department:'學務處'};
  assert.equal((await f.call('/replies',{method:'POST',body:reply,token:f.other})).status,201);
  assert.equal((await f.call('/questions')).data.questions[0].reply_count,1);
  assert.equal((await f.call('/questions/'+id,{method:'PATCH',body:{version:2,resolved:true},token:f.token})).status,400);
  const view=await f.call('/questions/'+id,{token:f.token});assert.equal(view.data.question.mine,true);assert.equal(view.data.replies[0].mine,false);
  for(const token of [undefined,f.token,f.other]) {
    assert.equal((await f.call('/replies/'+reply.id,{method:'DELETE',token})).status,405);
    assert.equal((await f.call('/questions/'+id,{method:'DELETE',token})).status,405);
  }
  assert.equal((await f.call('/questions')).headers.get('Access-Control-Allow-Methods').includes('DELETE'),false);
  assert.equal((await f.call('/questions/'+id+'?replyOffset=1')).data.replies.length,0);
  const kept=await f.call('/questions/'+id);assert.equal(kept.data.question.body,'補充內容');assert.equal(kept.data.replies[0].body,'回覆');
  assert.equal((await f.call('/questions')).data.questions.length,1);
  f.sql.close();
});

test('retired translation routes never call an AI provider',async()=>{
 const f=fixture();await f.create();
 assert.equal((await f.call('/questions/'+f.question.id+'/translate',{method:'POST',body:{target:'en'}})).status,404);
 assert.equal(f.inferences.length,0);
});

test('admin is only the verified school address; hidden profile, forged and expired identities fail',async()=>{
 const f=fixture();
 assert.equal((await f.call('/admin/session',{method:'POST',body:{name:f.env.ADMIN_NAME,department:f.env.ADMIN_DEPARTMENT}})).status,401);
 assert.equal((await f.call('/admin/questions',{token:f.token})).status,401);
 assert.equal((await f.call('/admin/questions',{admin:f.adminToken})).status,200);
 assert.equal((await f.call('/admin/questions',{admin:f.sign('kainnne@gmail.com')})).status,401);
 assert.equal((await f.call('/admin/questions',{admin:f.sign('kainnne@kcis.com.tw',1)})).status,401);
 assert.equal((await f.call('/admin/questions',{admin:f.adminToken.slice(0,-8)+'forgery!'})).status,401);
 delete f.env.SESSION_SECRET;
 assert.equal((await f.call('/admin/questions',{admin:f.adminToken})).status,503);f.sql.close();
});

test('moderators hide and restore other authors posts without exposing hidden content or replies',async()=>{
  const f=fixture();await f.create();const id=f.question.id;
  const reply={id:crypto.randomUUID(),question_id:id,body:'A private-on-removal reply',name:'Reply author',department:'Other'};
  await f.call('/replies',{method:'POST',body:reply,token:f.other});
  const session=await f.call('/admin/session',{method:'POST',token:f.adminToken,body:{}}),admin=session.data.token;
  const q='/admin/questions/'+id,r='/admin/replies/'+reply.id;
  assert.equal((await f.call(q+'/moderate',{method:'POST',body:{action:'hide',version:1},token:f.token})).status,401);
  assert.equal((await f.call(q+'/moderate',{method:'POST',body:{action:'erase',version:1},admin})).status,400);
  assert.equal((await f.call(r+'/moderate',{method:'POST',body:{action:'hide',version:1},admin})).status,200);
  const publicReply=(await f.call('/questions/'+id)).data.replies[0];
  assert.equal(publicReply.body,'');assert.equal(publicReply.name,'');assert.equal(publicReply.department,'');
  const managed=(await f.call(q,{admin})).data;assert.equal(managed.replies[0].body,reply.body);assert.ok(!JSON.stringify(managed).includes('owner_hash'));
  assert.equal((await f.call(r+'/moderate',{method:'POST',body:{action:'restore',version:1},admin})).status,409);
  assert.equal((await f.call(r+'/moderate',{method:'POST',body:{action:'restore',version:2},admin})).status,200);
  await f.call('/questions/'+id+'/translate',{method:'POST',body:{target:'en'}});
  await f.call('/replies/'+reply.id+'/translate',{method:'POST',body:{target:'en'}});
  assert.equal((await f.call(q+'/moderate',{method:'POST',body:{action:'hide',version:1},admin})).status,200);
  assert.equal((await f.call('/questions')).data.questions.length,0);
  const hidden=(await f.call('/questions/'+id)).data;
  assert.equal(hidden.question.body,'');assert.equal(hidden.question.name,'');assert.equal(hidden.replies.length,0);
  assert.equal((await f.call('/questions/'+id+'/translate',{method:'POST',body:{target:'en'}})).status,404);
  assert.equal((await f.call('/replies/'+reply.id+'/translate',{method:'POST',body:{target:'en'}})).status,404);
  assert.equal((await f.call('/replies/'+reply.id,{method:'PATCH',body:{version:3,body:'Trying edit'},token:f.other})).status,409);
  assert.equal((await f.call('/admin/questions?filter=deleted',{admin})).data.questions.length,1);
  assert.equal((await f.call(q,{admin})).data.replies[0].body,reply.body);
  assert.equal((await f.call(q+'/moderate',{method:'POST',body:{action:'restore',version:2},admin})).status,200);
  const restored=(await f.call('/questions/'+id)).data;
  assert.equal(restored.question.body,f.question.body);assert.equal(restored.question.version,3);assert.equal(restored.replies[0].body,reply.body);
  assert.equal((await f.call('/questions/'+id,{method:'DELETE',token:f.token})).status,405);
  f.sql.close();
});

test('published versions remain immutable through edit, hide, restore and cleanup',async()=>{
  const f=fixture();await f.create();await f.create();
  const id=f.question.id,admin=(await f.call('/admin/session',{method:'POST',token:f.adminToken,body:{}})).data.token;
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM post_archive').get().n,1);
  await f.call('/questions/'+id,{method:'PATCH',token:f.token,body:{version:1,body:'Edited content'}});
  assert.equal((await f.call('/questions/'+id,{method:'PATCH',token:f.token,body:{version:1,body:'Stale'}})).status,409);
  await f.call('/admin/questions/'+id+'/moderate',{method:'POST',admin,body:{version:2,action:'hide'}});
  await f.call('/admin/questions/'+id+'/moderate',{method:'POST',admin,body:{version:3,action:'restore'}});
  const rows=f.sql.prepare('SELECT * FROM post_archive ORDER BY version').all();
  assert.deepEqual(rows.map(row=>row.event_type),['published','edited','deleted','restored']);
  assert.equal(rows[0].body,f.question.body);assert.equal(rows[2].body,'Edited content');assert.ok(rows[2].deleted_at);
  assert.throws(()=>f.sql.prepare('UPDATE post_archive SET body=?').run('overwrite'),/append-only/);
  assert.throws(()=>f.sql.exec('DELETE FROM post_archive'),/append-only/);
  assert.throws(()=>f.sql.exec('DELETE FROM public_questions'),/reversible moderation/);
  await cleanup(f.env);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM post_archive').get().n,4);
  assert.equal((await f.call('/admin/archive?kind=questions&post_id='+id)).status,401);
  const history=(await f.call('/admin/archive?kind=questions&post_id='+id,{admin})).data;
  assert.equal(history.versions.length,4);assert.ok(!JSON.stringify(history).includes('owner_hash'));
  const status=(await f.call('/admin/backup-status',{admin})).data;
  assert.equal(status.retained_versions,4);assert.equal(status.pending,4);assert.equal(status.drive_configured,false);
  f.sql.close();
});

test('a missing archive outbox prevents publishing rather than losing its archive',async()=>{
  const f=fixture();f.sql.exec('DROP TABLE drive_outbox');
  assert.equal((await f.create()).status,503);
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM public_questions').get().n,0);
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM post_archive').get().n,0);f.sql.close();
});

test('archive migration preserves existing content as a baseline without inventing earlier versions',()=>{
  const sql=new DatabaseSync(':memory:');
  for(const file of ['0001_forum.sql','0002_public_forum.sql','0003_translation_jobs.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  const id=crypto.randomUUID();
  sql.prepare('INSERT INTO public_questions(id,owner_hash,name,department,body,created_at,updated_at,version,deleted_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'owner','Existing author','Department','Existing deleted text',1,2,7,2);
  sql.exec(readFileSync(new URL('../migrations/0004_post_archive.sql',import.meta.url),'utf8'));
  const row=sql.prepare('SELECT * FROM post_archive').get();assert.equal(row.version,7);assert.equal(row.body,'Existing deleted text');assert.equal(row.event_type,'baseline');assert.equal(row.deleted_at,2);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM drive_outbox').get().n,1);sql.close();
});

function driveFixture(){
  const f=fixture();Object.assign(f.env,{DRIVE_FOLDER_ID:'private-folder',DRIVE_CLIENT_ID:'test-client',DRIVE_CLIENT_SECRET:'test-secret',DRIVE_REFRESH_TOKEN:'test-refresh'});
  const files=new Map(),calls=[];let generated=0,timeoutOnce=false;
  const fetcher=async(url,options={})=>{
    calls.push({url,options});
    if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'test-access'});
    if(url.includes('/files/generateIds'))return Response.json({ids:['file-'+(++generated)]});
    if(url.includes('/upload/drive/v3/files')){
      const chunks=options.body.split('\r\n');
      const metadata=JSON.parse(chunks[3]),content=options.body.split('Content-Type: application/json; charset=UTF-8\r\n\r\n')[2].split('\r\n--kcis-')[0];
      if(files.has(metadata.id))return Response.json({error:'already exists'},{status:409});
      files.set(metadata.id,{metadata,content});
      if(timeoutOnce){timeoutOnce=false;throw Error('network timeout after successful upload');}
      return Response.json({id:metadata.id});
    }
    const id=new URL(url).pathname.split('/').at(-1),file=files.get(id);
    if(!file)return Response.json({error:'missing'},{status:404});
    return url.includes('alt=media')?new Response(file.content):Response.json({...file.metadata,trashed:false});
  };
  return {...f,files,calls,fetcher,timeoutNext:()=>{timeoutOnce=true;}};
}

test('Drive receives separate immutable JSON versions, including the deleted state',async()=>{
  const f=driveFixture();await f.create();
  const admin=(await f.call('/admin/session',{method:'POST',token:f.adminToken,body:{}})).data.token;
  await f.call('/admin/questions/'+f.question.id+'/moderate',{method:'POST',admin,body:{version:1,action:'hide'}});
  const result=await syncDriveBackups(f.env,f.fetcher);
  assert.equal(result.uploaded,2);assert.equal(f.files.size,2);
  const versions=[...f.files.values()].map(file=>JSON.parse(file.content)).sort((a,b)=>a.version-b.version);
  assert.equal(versions[0].body,f.question.body);assert.equal(versions[1].event_type,'deleted');assert.ok(versions[1].deleted_at);
  assert.ok(!JSON.stringify(versions).includes('owner_hash'));assert.ok(!JSON.stringify(versions).includes(f.env.DRIVE_REFRESH_TOKEN));
  const status=await backupStatus(f.env);assert.equal(status.pending,0);assert.equal(status.synced,2);
  assert.equal((await syncDriveBackups(f.env,f.fetcher)).uploaded,0);assert.equal(f.files.size,2);f.sql.close();
});

test('Drive upload timeout retries the persisted file ID and verifies content before acknowledging',async()=>{
  const f=driveFixture();await f.create();const now=Date.now();f.timeoutNext();
  const first=await syncDriveBackups(f.env,f.fetcher,{now});assert.equal(first.failed,1);
  assert.equal((await backupStatus(f.env)).pending,1);assert.equal(f.files.size,1);
  const second=await syncDriveBackups(f.env,f.fetcher,{now:now+120000});assert.equal(second.uploaded,1);assert.equal(f.files.size,1);
  assert.equal(f.calls.filter(call=>call.url.includes('generateIds')).length,1);
  assert.ok(f.calls.some(call=>call.url.includes('alt=media')));f.sql.close();
});

test('Drive failure preserves pending originals, detects conflicting remote content and deduplicates workers',async()=>{
  const f=driveFixture();await f.create();const now=Date.now();f.timeoutNext();
  await syncDriveBackups(f.env,f.fetcher,{now});
  [...f.files.values()][0].content='tampered';
  assert.equal((await syncDriveBackups(f.env,f.fetcher,{now:now+120000})).failed,1);
  assert.equal((await backupStatus(f.env)).pending,1);assert.equal(f.sql.prepare('SELECT body FROM post_archive').get().body,f.question.body);
  f.sql.close();
  const concurrent=driveFixture();await concurrent.create();
  const results=await Promise.all([syncDriveBackups(concurrent.env,concurrent.fetcher),syncDriveBackups(concurrent.env,concurrent.fetcher)]);
  assert.equal(results.reduce((sum,result)=>sum+result.uploaded,0),1);assert.equal(concurrent.files.size,1);concurrent.sql.close();
  const offline=fixture();await offline.create();
  assert.equal((await syncDriveBackups(offline.env,()=>{throw Error('must not call Drive');})).configured,false);
  assert.equal((await backupStatus(offline.env)).pending,1);offline.sql.close();
});

test('only verified author or school admin can resolve, required fields, durable Markdown, failed delivery and idempotency',async()=>{
 const f=fixture();await f.create();const path='/questions/'+f.question.id+'/resolve',solution={version:1,resolved:true,method:'使用範例提示詞',steps:'1. 開啟工具\n2. 貼上提示詞',result:'已成功產生教案'};
 assert.equal((await f.call(path,{method:'POST',body:solution,token:'c'.repeat(64)})).status,401);
 assert.equal((await f.call(path,{method:'POST',body:solution,token:f.other})).status,403);
 assert.equal((await f.call(path,{method:'POST',body:{...solution,result:''},token:f.token})).status,400);
 assert.equal((await f.call(path,{method:'POST',body:solution,token:f.token})).status,200);
 assert.equal((await f.call(path,{method:'POST',body:solution,token:f.token})).status,409);
 const view=(await f.call('/questions/'+f.question.id)).data.question;assert.equal(view.resolved,1);assert.equal(view.solution_method,solution.method);
 assert.equal((await f.call('/questions/'+f.question.id,{method:'PATCH',body:{version:2,body:'overwrite solution question'},token:f.token})).status,409);
 const record=f.sql.prepare('SELECT * FROM solution_archive').get();assert.ok(record.markdown.includes('## 解決方法'));assert.ok(record.markdown.includes(solution.result));
 assert.throws(()=>f.sql.prepare('DELETE FROM solution_archive').run(),/append-only/);
 assert.throws(()=>f.sql.prepare("UPDATE solution_archive SET markdown='wrong'").run(),/append-only/);
 assert.equal((await syncWikiNBSolutions(f.env)).configured,false);
 f.env.WIKINB_API_URL='https://school-api.example.test';f.env.WIKINB_INGEST_SECRET='i'.repeat(64);
 assert.equal((await syncWikiNBSolutions(f.env,{fetcher:async()=>new Response('',{status:503})})).synced,0);
 assert.equal(f.sql.prepare('SELECT synced_at FROM wikinb_outbox').get().synced_at,null);
 let received;const later=Date.now()+61000;
 assert.equal((await syncWikiNBSolutions(f.env,{now:later,fetcher:async(url,options)=>{assert.equal(new URL(url).pathname,'/api/library/forum-solutions');received=JSON.parse(options.body);return Response.json({id:'stored'});}})).synced,1);
 assert.equal(received.questionId,f.question.id);assert.equal(received.version,2);
 assert.equal((await syncWikiNBSolutions(f.env,{now:later+1,fetcher:async()=>{throw Error('must not redeliver');}})).synced,0);
 assert.equal((await f.call(path,{method:'POST',body:{version:2,resolved:false},token:f.adminToken})).status,200);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM solution_archive').get().n,2);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM post_archive').get().n,3);
 f.sql.close();
});

test('guest may answer but cannot ask; account ownership persists across new signed sessions',async()=>{
 const f=fixture();await f.create();
 assert.equal((await f.call('/questions',{method:'POST',body:{...f.question,id:crypto.randomUUID()},token:'c'.repeat(64)})).status,401);
 assert.equal((await f.call('/replies',{method:'POST',body:{id:crypto.randomUUID(),question_id:f.question.id,name:'Guest',department:'校外',body:'訪客回覆'},token:'c'.repeat(64)})).status,201);
 assert.equal((await f.call('/questions?filter=mine',{token:f.sign('teacher@kcis.com.tw',Math.floor(Date.now()/1000)+7200)})).data.questions.length,1);
 assert.equal((await f.call('/questions',{token:f.sign('stranger@gmail.com')})).status,401);f.sql.close();
});

test('admin moderation propagates solution tombstones and Drive retains full solution snapshots',async()=>{
 const f=driveFixture();await f.create();const id=f.question.id;
 await f.call('/questions/'+id+'/resolve',{method:'POST',token:f.token,body:{version:1,resolved:true,method:'解決方法',steps:'操作步驟',result:'驗證完成'}});
 assert.equal((await f.call('/admin/questions/'+id+'/moderate',{method:'POST',token:f.token,body:{version:2,action:'hide'}})).status,401);
 assert.equal((await f.call('/admin/questions/'+id+'/moderate',{method:'POST',admin:f.adminToken,body:{version:2,action:'hide'}})).status,200);
 assert.equal((await f.call('/questions')).data.questions.length,0);
 const snapshots=f.sql.prepare('SELECT * FROM solution_archive ORDER BY version').all();assert.equal(snapshots.length,2);assert.ok(snapshots[1].deleted_at);assert.ok(snapshots[1].markdown.includes('status: deleted'));
 await syncDriveBackups(f.env,f.fetcher);const versions=[...f.files.values()].map(v=>JSON.parse(v.content));assert.ok(versions.find(v=>v.version===2).solution.markdown.includes('驗證完成'));assert.ok(versions.find(v=>v.version===3).solution.deleted_at);
 f.env.WIKINB_API_URL='https://school-api.example.test';f.env.WIKINB_INGEST_SECRET='i'.repeat(64);const received=[];
 await syncWikiNBSolutions(f.env,{fetcher:async(url,opts)=>{received.push(JSON.parse(opts.body));return Response.json({ok:true});}});assert.ok(received.find(r=>r.version===3).deleted);
 assert.equal((await f.call('/admin/questions/'+id+'/moderate',{method:'POST',admin:f.adminToken,body:{version:3,action:'restore'}})).status,200);assert.equal(f.sql.prepare('SELECT deleted_at FROM solution_archive WHERE version=4').get().deleted_at,null);f.sql.close();
});

test('exact approved Gmail accounts can post; other Gmail and suffix aliases remain blocked',async()=>{
 const f=fixture();
 try{
  for(const email of ['chaos60649@gmail.com','st101031616@gmail.com']){
   const body={...f.question,id:crypto.randomUUID()};
   assert.equal((await f.call('/questions',{method:'POST',body,token:f.sign(email)})).status,201);
  }
  for(const email of ['other@gmail.com','chaos60649+other@gmail.com','st101031616@gmail.com.evil'])assert.equal((await f.call('/questions',{method:'POST',body:{...f.question,id:crypto.randomUUID()},token:f.sign(email)})).status,401);
  f.env.EXTRA_ALLOWED_EMAILS='';
  assert.equal((await f.call('/questions',{method:'POST',body:{...f.question,id:crypto.randomUUID()},token:f.sign('chaos60649@gmail.com')})).status,401);
 }finally{f.sql.close();}
});

test('only verified teachers publish articles; immutable archive, atomic outboxes, dedupe and admin moderation',async()=>{
 const f=fixture(),article={id:crypto.randomUUID(),title:'AI lesson',body:'An article with complete context.'};
 assert.equal((await f.call('/articles',{method:'POST',body:article})).status,401);
 assert.equal((await f.call('/articles',{method:'POST',body:article,token:f.sign('st101031616@gmail.com')})).status,403);
 assert.equal((await f.call('/articles',{method:'POST',body:article,token:f.sign('s12345@kcis.com.tw')})).status,403);
 assert.equal((await f.call('/articles',{method:'POST',body:article,token:f.token})).status,201);
 assert.equal((await f.call('/articles',{method:'POST',body:article,token:f.token})).status,201);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM article_archive').get().n,1);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM article_outbox').get().n,1);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM article_drive_outbox').get().n,1);
 assert.equal((await f.call('/articles')).data.articles[0].owner_hash,undefined);
 assert.throws(()=>f.sql.exec('DELETE FROM article_archive'));
 assert.throws(()=>f.sql.exec('DELETE FROM public_articles'));
 assert.equal((await f.call('/admin/articles/'+article.id+'/moderate',{method:'POST',body:{version:1,action:'hide'},token:f.other})).status,401);
 assert.equal((await f.call('/admin/articles/'+article.id+'/moderate',{method:'POST',body:{version:1,action:'hide'},token:f.adminToken})).status,200);
 assert.equal((await f.call('/articles')).data.articles.length,0);
 assert.equal((await f.call('/admin/articles/'+article.id+'/moderate',{method:'POST',body:{version:1,action:'restore'},token:f.adminToken})).status,409);
 assert.equal((await f.call('/admin/articles/'+article.id+'/moderate',{method:'POST',body:{version:2,action:'restore'},token:f.adminToken})).status,200);
 assert.equal((await f.call('/articles')).data.articles.length,1);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM article_archive').get().n,3);
 const broken=fixture();broken.sql.exec('DROP TABLE article_outbox');
 assert.equal((await broken.call('/articles',{method:'POST',body:{...article,id:crypto.randomUUID()},token:broken.token})).status,503);
 assert.equal(broken.sql.prepare('SELECT COUNT(*) n FROM public_articles').get().n,0);
});

test('article delivery retries and version payloads retain the original title and author',async()=>{
 const {syncWikiNBArticles}=await import('../src/solutions.mjs');
 const f=fixture(),id=crypto.randomUUID();await f.call('/articles',{method:'POST',body:{id,title:'Teacher article',body:'Full source body'},token:f.token});
 Object.assign(f.env,{WIKINB_API_URL:'https://library.example.test',WIKINB_INGEST_SECRET:'i'.repeat(64)});
 const now=Date.now();assert.equal((await syncWikiNBArticles(f.env,{now,fetcher:async()=>new Response('',{status:503})})).synced,0);
 assert.equal(f.sql.prepare('SELECT synced_at FROM article_outbox').get().synced_at,null);
 let payload;assert.equal((await syncWikiNBArticles(f.env,{now:now+61000,fetcher:async(url,options)=>{assert.equal(new URL(url).pathname,'/api/library/forum-articles');payload=JSON.parse(options.body);return new Response('{}');}})).synced,1);
 assert.equal(payload.articleId,id);assert.equal(payload.title,'Teacher article');assert.match(payload.markdown,/Full source body/);assert.equal(payload.author,'測試姓名');
 assert.equal((await syncWikiNBArticles(f.env)).synced,0);
});

test('article Drive snapshots retain full Markdown, title, author and admin deletion without credentials',async()=>{
 const f=driveFixture(),id=crypto.randomUUID();
 await f.call('/articles',{method:'POST',token:f.token,body:{id,title:'AI article title',body:'Complete article text'}});
 await f.call('/admin/articles/'+id+'/moderate',{method:'POST',token:f.adminToken,body:{version:1,action:'hide'}});
 const result=await syncDriveBackups(f.env,f.fetcher,{collection:'articles'});assert.equal(result.uploaded,2);
 const snapshots=[...f.files.values()].map(file=>JSON.parse(file.content)).sort((a,b)=>a.version-b.version);
 assert.equal(snapshots[0].title,'AI article title');assert.match(snapshots[0].markdown,/Complete article text/);assert.equal(snapshots[0].author,'測試姓名');assert.ok(snapshots[1].deleted_at);
 assert.ok(!JSON.stringify(snapshots).includes('owner_hash'));assert.ok(!JSON.stringify(snapshots).includes(f.env.SESSION_SECRET));
 assert.equal((await backupStatus(f.env)).synced,2);assert.equal((await backupStatus(f.env)).pending,0);f.sql.close();
});


test('account profile updates only owned current metadata, preserves archives, retries are idempotent and stale sessions cannot restore old names',async()=>{
 const f=fixture();await f.create();const id=crypto.randomUUID();await f.call('/articles',{method:'POST',body:{id,title:'Complete lesson',body:'Original full body'},token:f.token});
 await f.call('/questions/'+f.question.id+'/resolve',{method:'POST',body:{version:1,resolved:true,method:'Original method',steps:'Original steps',result:'Verified'},token:f.token});
 const otherId=crypto.randomUUID();await f.call('/questions',{method:'POST',body:{...f.question,id:otherId},token:f.other});
 const token=f.sign('teacher@kcis.com.tw',undefined,{nickname:'王_老師',department:'資源中心',updatedAt:'2030-01-01T00:00:00.000Z'});
 assert.equal((await f.call('/account/profile',{method:'POST',body:{nickname:'Impersonator'},token})).status,200);
 const latest=f.sql.prepare('SELECT * FROM public_questions WHERE id=?').get(f.question.id);assert.equal(latest.name,'王_老師');assert.equal(latest.department,'資源中心');assert.equal(latest.body,f.question.body);assert.equal(latest.resolved,1);
 assert.equal(f.sql.prepare('SELECT name FROM public_questions WHERE id=?').get(otherId).name,'測試姓名');
 assert.equal(f.sql.prepare('SELECT author FROM article_archive WHERE article_id=? AND version=1').get(id).author,'測試姓名');
 assert.equal(f.sql.prepare('SELECT author FROM article_archive WHERE article_id=? AND version=2').get(id).author,'王_老師');
 const count=f.sql.prepare('SELECT count(*) n FROM article_archive').get().n;
 assert.equal((await f.call('/account/profile',{method:'POST',body:{},token})).data.duplicate,true);assert.equal(f.sql.prepare('SELECT count(*) n FROM article_archive').get().n,count);
 assert.equal((await f.call('/account/profile',{method:'POST',body:{},token:f.token})).data.duplicate,true);
 const next=crypto.randomUUID();await f.call('/questions',{method:'POST',body:{...f.question,id:next,name:'fake',department:'fake'},token:f.token});
 assert.equal(f.sql.prepare('SELECT name FROM public_questions WHERE id=?').get(next).name,'王_老師');
 assert.equal((await f.call('/account/profile',{method:'POST',body:{}})).status,401);
 assert.ok(!JSON.stringify((await f.call('/articles')).data).includes('owner_hash'));f.sql.close();
});
