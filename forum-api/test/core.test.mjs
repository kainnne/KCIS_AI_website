import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHandler, cleanup } from '../src/core.mjs';

function fixture() {
  const sql=new DatabaseSync(':memory:');
  for(const file of ['0001_forum.sql','0002_public_forum.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  function prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}};}
  const inferences=[];
  const env={DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}},ALLOWED_ORIGIN:'https://ai-tools.kcis.kainnne.com',AI:{async run(model,input){inferences.push({model,input});return {response:'How do I use AI?'};}}};
  const handler=createHandler();
  async function call(path,{method='GET',body,token,origin=env.ALLOWED_ORIGIN}={}){
    const response=await handler(new Request('https://api.example.test/api'+path,{method,headers:{Origin:origin,...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);
    return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};
  }
  const token='a'.repeat(64),other='b'.repeat(64);
  const question={id:crypto.randomUUID(),body:'請問怎麼使用 AI？',name:'測試姓名',department:'英文科'};
  const create=()=>call('/questions',{method:'POST',body:question,token});
  return {sql,env,call,create,question,token,other,inferences};
}

test('public reading, required identity, no login routes and exact CORS',async()=>{
  const f=fixture();
  assert.equal((await f.call('/questions')).status,200);
  assert.equal((await f.call('/auth/code',{method:'POST',body:{email:'a@example.test'}})).status,404);
  assert.equal((await f.call('/members')).status,404);
  assert.equal((await f.call('/questions',{origin:'https://evil.test'})).status,403);
  for(const body of [{...f.question,name:''},{...f.question,department:''},{...f.question,name:42},{...f.question,department:'x\ny'}])assert.equal((await f.call('/questions',{method:'POST',body,token:f.token})).status,400);
  assert.equal((await f.call('/questions',{method:'POST',body:f.question})).status,400);
  assert.equal((await f.create()).status,201);
  const view=await f.call('/questions');assert.equal(view.data.questions[0].department,'英文科');assert.equal(view.data.questions[0].mine,false);
  assert.ok(!JSON.stringify(view.data).includes('owner_hash'));assert.ok(!JSON.stringify(view.data).includes(f.token));
  assert.equal(view.headers.get('cache-control'),'private, no-store');f.sql.close();
});

test('capability ownership, idempotency, version conflicts, reply pagination and withdrawal',async()=>{
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
  assert.equal((await f.call('/questions?filter=unanswered')).data.questions.length,0);
  const view=await f.call('/questions/'+id,{token:f.token});assert.equal(view.data.question.mine,true);assert.equal(view.data.replies[0].mine,false);
  assert.equal((await f.call('/replies/'+reply.id,{method:'DELETE',token:f.token})).status,403);
  assert.equal((await f.call('/questions/'+id+'?replyOffset=1')).data.replies.length,0);
  assert.equal((await f.call('/questions/'+id,{method:'DELETE',token:f.token})).status,200);
  const deleted=await f.call('/questions/'+id);assert.equal(deleted.data.question.body,'');assert.equal(deleted.data.question.name,'');assert.equal(deleted.data.replies[0].body,'回覆');
  assert.equal((await f.call('/questions')).data.questions.length,0);
  assert.equal((await f.call('/replies',{method:'POST',body:{...reply,id:crypto.randomUUID()},token:f.other})).status,404);
  f.sql.close();
});

test('translation targets, caching, invalidation and unavailable service',async()=>{
  const f=fixture();await f.create();const path='/questions/'+f.question.id;
  assert.equal((await f.call(path+'/translate',{method:'POST',body:{target:'fr'}})).status,400);
  const translated=await f.call(path+'/translate',{method:'POST',body:{target:'en'}});
  assert.equal(translated.data.body,'How do I use AI?');assert.equal(translated.data.version,1);
  await f.call(path+'/translate',{method:'POST',body:{target:'en'}});assert.equal(f.inferences.length,1);
  await f.call(path+'/translate',{method:'POST',body:{target:'zh-TW'}});assert.equal(f.inferences.length,2);
  assert.ok(f.inferences[1].input.messages[0].content.includes('Traditional Chinese'));
  await f.call(path,{method:'PATCH',body:{body:'新內容',version:1},token:f.token});
  const changed=await f.call(path+'/translate',{method:'POST',body:{target:'en'}});assert.equal(changed.data.version,2);assert.equal(f.inferences.length,3);
  f.env.AI=undefined;
  assert.equal((await f.call(path+'/translate',{method:'POST',body:{target:'zh-TW'}})).status,503);
  await f.call(path,{method:'DELETE',token:f.token});
  assert.equal((await f.call(path+'/translate',{method:'POST',body:{target:'en'}})).status,404);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM translations').get().n,0);f.sql.close();
});

test('daily translation cap reserves atomically, post length and cleanup',async()=>{
  const f=fixture();await f.create();const bucket=Math.floor(Date.now()/86400000);
  f.sql.prepare('INSERT INTO limits VALUES(?,?,?)').run(`translation:global:${bucket}`,40,Date.now()+86400000);
  assert.equal((await f.call('/questions/'+f.question.id+'/translate',{method:'POST',body:{target:'en'}})).status,429);assert.equal(f.inferences.length,0);
  assert.equal((await f.call('/questions',{method:'POST',body:{...f.question,id:crypto.randomUUID(),body:'x'.repeat(4001)},token:f.token})).status,400);
  f.sql.prepare('UPDATE limits SET expires_at=0').run();await cleanup(f.env);assert.equal(f.sql.prepare('SELECT count(*) n FROM limits').get().n,0);f.sql.close();
});
