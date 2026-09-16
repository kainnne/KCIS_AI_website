import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHandler, cleanup } from '../src/core.mjs';

function fixture() {
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;'+readFileSync(new URL('../migrations/0001_forum.sql',import.meta.url),'utf8'));
  function prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}};}
  const env={DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}},OTP_SECRET:'test-secret-'.repeat(4),ADMIN_EMAIL:'owner@kcis.com.tw',SMTP_USER:'sender@example.test',SMTP_PASS:'not-real',ALLOWED_ORIGIN:'https://ai-tools.kcis.kainnne.com'};
  const sent=[];const handler=createHandler(async(_env,email,code)=>sent.push({email,code}));
  async function call(path,{method='GET',body,token,origin=env.ALLOWED_ORIGIN}={}){
    const response=await handler(new Request('https://api.example.test/api'+path,{method,headers:{Origin:origin,...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);
    return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};
  }
  async function login(email){assert.equal((await call('/auth/code',{method:'POST',body:{email}})).status,200);const code=sent.at(-1).code;const r=await call('/auth/verify',{method:'POST',body:{email,code}});assert.equal(r.status,200);const token=r.data.token;await call('/me',{method:'PATCH',body:{nickname:'測試老師'},token});return {token,id:r.data.user.id,email};}
  return {sql,env,call,login,sent};
}

test('exact school domains, origin and request authorization are enforced',async()=>{
  const f=fixture();
  for(const email of ['x@kcis.com.tw.evil.test','x@evil-kcis.com.tw','x@gmail.com','x@kcis.ntpc.edu.tw.evil.test','a\r\nb@kcis.com.tw'])assert.equal((await f.call('/auth/code',{method:'POST',body:{email}})).status,400);
  assert.equal(f.sent.length,0);
  assert.equal((await f.call('/questions')).status,401);
  assert.equal((await f.call('/auth/code',{method:'POST',body:{email:'x@kcis.com.tw'},origin:'https://evil.test'})).status,403);
  const me=await f.login('OWNER@KCIS.COM.TW');assert.equal((await f.call('/me',{token:me.token})).data.user.role,'admin');
  assert.equal((await f.call('/questions',{token:me.token})).headers.get('cache-control'),'private, no-store');
  f.sql.close();
});

test('codes expire, lock after five attempts, enforce cooldown and are single use',async()=>{
  const f=fixture(),email='test@kcis.ntpc.edu.tw';
  await f.call('/auth/code',{method:'POST',body:{email}});const code=f.sent[0].code;
  assert.equal((await f.call('/auth/code',{method:'POST',body:{email}})).status,429);
  for(let i=0;i<5;i++)assert.equal((await f.call('/auth/verify',{method:'POST',body:{email,code:code==='000000'?'111111':'000000'}})).status,401);
  assert.equal((await f.call('/auth/verify',{method:'POST',body:{email,code}})).status,401);
  f.sql.prepare('UPDATE otp SET sent_at=0').run();await f.call('/auth/code',{method:'POST',body:{email}});
  const newCode=f.sent.at(-1).code;
  const parallel=await Promise.all([1,2].map(()=>f.call('/auth/verify',{method:'POST',body:{email,code:newCode}})));
  assert.deepEqual(parallel.map(x=>x.status).sort(),[200,401]);
  f.sql.prepare('DELETE FROM limits').run();await f.call('/auth/code',{method:'POST',body:{email}});f.sql.prepare('UPDATE otp SET expires_at=0').run();
  assert.equal((await f.call('/auth/verify',{method:'POST',body:{email,code:f.sent.at(-1).code}})).status,401);
  f.sql.close();
});

test('teacher approval, live suspension, ownership, idempotency, version conflicts and withdrawal',async()=>{
  const f=fixture(),admin=await f.login('owner@kcis.com.tw'),teacher=await f.login('teacher@kcis.ntpc.edu.tw');
  assert.equal((await f.call('/questions',{token:teacher.token})).status,403);
  assert.equal((await f.call('/members',{token:teacher.token})).status,403);
  assert.equal((await f.call('/members/'+teacher.id,{method:'PATCH',body:{status:'active'},token:admin.token})).status,200);
  assert.equal((await f.call('/me',{token:teacher.token})).status,401); // approval revokes old sessions
  f.sql.prepare('DELETE FROM otp').run();const fresh=await f.login(teacher.email);
  const qid=crypto.randomUUID();
  const q={id:qid,body:'請問怎麼使用 AI？'};
  assert.equal((await f.call('/questions',{method:'POST',body:q,token:fresh.token})).status,201);
  await f.call('/questions',{method:'POST',body:q,token:fresh.token});
  assert.equal(f.sql.prepare('SELECT count(*) n FROM questions').get().n,1);
  assert.equal((await f.call('/questions/'+qid,{method:'PATCH',body:{body:'冒充修改',version:1},token:admin.token})).status,403);
  assert.equal((await f.call('/questions/'+qid,{method:'PATCH',body:{body:'補充內容',version:1},token:fresh.token})).status,200);
  assert.equal((await f.call('/questions/'+qid,{method:'PATCH',body:{body:'舊版',version:1},token:fresh.token})).status,409);
  await f.call('/replies',{method:'POST',body:{id:crypto.randomUUID(),question_id:qid,body:'回覆'},token:admin.token});
  const view=await f.call('/questions/'+qid,{token:fresh.token});assert.equal(view.data.replies.length,1);
  assert.ok(!JSON.stringify(view.data).includes('@'));
  await f.call('/questions/'+qid,{method:'DELETE',token:fresh.token});
  const deleted=await f.call('/questions/'+qid,{token:admin.token});assert.equal(deleted.data.question.body,'');assert.equal(deleted.data.replies[0].body,'回覆');
  assert.equal((await f.call('/replies',{method:'POST',body:{id:crypto.randomUUID(),question_id:qid,body:'再回覆'},token:fresh.token})).status,404);
  await f.call('/members/'+fresh.id,{method:'PATCH',body:{status:'suspended'},token:admin.token});
  assert.equal((await f.call('/questions',{token:fresh.token})).status,401);
  f.sql.close();
});

test('server enforces length, pagination, logout and expired record cleanup',async()=>{
  const f=fixture(),admin=await f.login('owner@kcis.com.tw');
  assert.equal((await f.call('/questions',{method:'POST',body:{id:crypto.randomUUID(),body:'x'.repeat(4001)},token:admin.token})).status,400);
  const qid=crypto.randomUUID();await f.call('/questions',{method:'POST',body:{id:qid,body:'<script>alert(1)</script>'},token:admin.token});
  assert.equal((await f.call('/questions?filter=mine',{token:admin.token})).data.questions.length,1);
  assert.equal((await f.call('/questions?offset=30',{token:admin.token})).data.questions.length,0);
  await f.call('/auth/logout',{method:'POST',body:{},token:admin.token});assert.equal((await f.call('/questions',{token:admin.token})).status,401);
  f.sql.prepare('UPDATE limits SET expires_at=0').run();await cleanup(f.env);assert.equal(f.sql.prepare('SELECT count(*) n FROM limits').get().n,0);
  f.sql.close();
});

test('failed mail does not leave a usable challenge',async()=>{
  const f=fixture();const handler=createHandler(async()=>{throw Error('private transport failure');});
  const r=await handler(new Request('https://api.example.test/api/auth/code',{method:'POST',headers:{Origin:f.env.ALLOWED_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email:'test@kcis.com.tw'})}),f.env);
  assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private transport'));assert.equal(f.sql.prepare('SELECT count(*) n FROM otp').get().n,0);f.sql.close();
});
