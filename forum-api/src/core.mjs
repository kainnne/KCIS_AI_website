import { startAdminSession, requireAdmin } from './admin.mjs';
import { HttpError } from './http-error.mjs';
import { verifiedAccount, isAdministrator } from './identity.mjs';
import { solutionMarkdown } from './solutions.mjs';
import { backupStatus } from './drive-backup.mjs';
export { HttpError } from './http-error.mjs';

const DAY = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (status, code) => { throw new HttpError(status, code); };
function textOf(value, max, code) {
  if (typeof value !== 'string') fail(400, code);
  const text = value.trim();
  if (!text || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) fail(400, code);
  return text;
}
function idOf(value) { if (!UUID.test(String(value))) fail(400, 'invalid'); return value; }
export async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), v => v.toString(16).padStart(2, '0')).join('');
}
const publicPost = (row, owner) => {
  const {owner_hash, ...post} = row;
  return {...post, ...(post.deleted_at ? {body:'', name:'', department:'',solution_method:'',solution_steps:'',solution_result:''} : {}), mine:!post.deleted_at && !!owner && owner_hash === owner};
};
const adminPost = row => { const {owner_hash, ...post} = row; return {...post, mine:false}; };
async function readInput(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'invalid');
  if (Number(request.headers.get('content-length') || 0) > 100000) fail(413, 'length');
  const reader = request.body?.getReader(), chunks = []; let size = 0;
  if (reader) while (true) {
    const {value, done} = await reader.read(); if (done) break;
    size += value.length; if (size > 100000) { await reader.cancel(); fail(413, 'length'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let input; try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400, 'invalid'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'invalid');
  return input;
}
export function createHandler() {
  return async function handle(request, env) {
    const origin = request.headers.get('origin');
    const allowedOrigins=[env.ALLOWED_ORIGIN,...String(env.ALLOWED_ORIGINS||'').split(',')].map(value=>String(value||'').trim()).filter(Boolean);
    const cors = {'Vary':'Origin', 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'};
    if (origin && allowedOrigins.includes(origin)) Object.assign(cors, {
      'Access-Control-Allow-Origin':origin, 'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':'Authorization, Content-Type, X-Forum-Admin', 'Access-Control-Max-Age':'600'
    });
    const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
    try {
      if (origin && !allowedOrigins.includes(origin)) fail(403, 'origin');
      if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors});
      const url = new URL(request.url), path = url.pathname, method = request.method, now = Date.now();
      const db = env.DB, stmt = (sql, ...args) => db.prepare(sql).bind(...args);
      if (method === 'DELETE') fail(405,'method');
      if (path === '/api/health' && method === 'GET') { await stmt('SELECT 1 FROM public_questions LIMIT 1').first(); await stmt('SELECT 1 FROM post_archive LIMIT 1').first(); return json({ok:true}); }
      const input = ['POST','PATCH'].includes(method) ? await readInput(request) : {};
      const bearer = request.headers.get('authorization') || '';
      let account=await verifiedAccount(request,env,now);
      const owner = account ? await hash('account:'+account.email) : /^Bearer [a-f0-9]{64}$/.test(bearer) ? await hash(bearer.slice(7)) : '';
      const signedAccount=account;
      const profile=account?await stmt('SELECT * FROM account_profiles WHERE owner_hash=?',owner).first():null;
      if(profile)account={...account,nickname:profile.name,name:profile.name,department:profile.department};
      const pageOffset = key => Math.floor(Math.max(0, Math.min(100000, Number(url.searchParams.get(key)) || 0)));
      async function rate(key, maximum, windowMs) {
        const bucket = Math.floor(now / windowMs);
        const row = await stmt('INSERT INTO limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count', `${key}:${bucket}`, (bucket+1)*windowMs, maximum).first();
        if (!row) fail(429, 'rate');
      }
      if (method !== 'GET') {
        const ip = await hash(`${Math.floor(now/DAY)}:${request.headers.get('CF-Connecting-IP') || 'unknown'}`);
        await rate(`request:${ip}`, 120, 60000);
      }
      const isTeacher = account && ['teacher','admin'].includes(account.role);
      if(path==='/api/account/profile'&&method==='POST'){
        if(!signedAccount)fail(401,'auth');
        const name=textOf(signedAccount.nickname||signedAccount.name,60,'identity'),department=textOf(signedAccount.department,40,'identity'),revision=String(signedAccount.updatedAt||'');
        if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(revision)||/[\r\n]/.test(name+department))fail(400,'invalid');
        async function ownedReferences(){return {articles:(await stmt('SELECT id FROM public_articles WHERE owner_hash=?',owner).all()).results.map(row=>row.id),questions:(await stmt('SELECT id FROM public_questions WHERE owner_hash=?',owner).all()).results.map(row=>row.id)};}
        if(profile&&profile.updated_at>=revision)return json({ok:true,duplicate:true,owned:await ownedReferences()});
        const statements=[];
        for(const kind of ['questions','replies','articles'])statements.push(stmt(`UPDATE public_${kind} SET name=?,department=?,updated_at=?,version=version+1 WHERE owner_hash=? AND (name<>? OR department<>?) AND NOT EXISTS(SELECT 1 FROM account_profiles WHERE owner_hash=? AND updated_at>?)`,name,department,now,owner,name,department,owner,revision));
        statements.push(stmt('INSERT INTO account_profiles(owner_hash,name,department,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner_hash) DO UPDATE SET name=excluded.name,department=excluded.department,updated_at=excluded.updated_at WHERE excluded.updated_at>account_profiles.updated_at',owner,name,department,revision));
        await db.batch(statements);return json({ok:true,wikinb:'queued',owned:await ownedReferences()});
      }
      if (path === '/api/articles' && method === 'GET') {
        const rows=(await stmt('SELECT * FROM public_articles WHERE deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 30 OFFSET ?',pageOffset('offset')).all()).results;
        return json({articles:rows.map(row=>publicPost(row,owner))});
      }
      async function archiveArticle(row) {
        const markdown=['---','kind: forum-article','article_id: '+row.id,'version: '+row.version,'title: '+JSON.stringify(row.title),'author: '+JSON.stringify(row.name),'status: '+(row.deleted_at?'deleted':'published'),'---','','# '+row.title,'',row.body,'','作者：'+row.name].join('\n');
        return stmt('INSERT INTO article_archive(event_id,article_id,version,title,author,department,markdown,created_at,deleted_at) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM public_articles WHERE id=? AND version=? AND updated_at=?)','article:'+row.id+':v'+row.version,row.id,row.version,row.title,row.name,row.department||'教職員',markdown,row.updated_at,row.deleted_at,row.id,row.version,row.updated_at);
      }
      if (path === '/api/articles' && method === 'POST') {
        if(!account)fail(401,'auth'); if(!isTeacher)fail(403,'teacher');
        const id=idOf(input.id),title=textOf(input.title,160,'invalid'),body=textOf(input.body,20000,'article_length'),name=textOf(account.nickname||account.name,60,'identity');
        if(/[\r\n]/.test(title+name))fail(400,'invalid');
        const existing=await stmt('SELECT * FROM public_articles WHERE id=?',id).first();
        if(existing){if(existing.owner_hash!==owner||existing.title!==title||existing.body!==body||existing.deleted_at)fail(409,'conflict');return json({id,wikinb:'queued'},201);}
        await rate('article:'+owner,10,60000); await rate('article:global',500,DAY);
        const department=textOf(account.department||(account.role==='student'?'學生':'教職員'),40,'identity');
        const row={id,title,body,name,department,version:1,updated_at:now,deleted_at:null};
        await db.batch([stmt('INSERT INTO public_articles(id,owner_hash,title,body,name,department,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',id,owner,title,body,name,department,now,now),await archiveArticle(row)]);
        return json({id,wikinb:'queued'},201);
      }
      const articleModeration=path.match(/^\/api\/admin\/articles\/([a-f0-9-]+)\/moderate$/);
      if(articleModeration&&method==='POST') {
        await requireAdmin(request,env,now);
        const id=idOf(articleModeration[1]),row=await stmt('SELECT * FROM public_articles WHERE id=?',id).first();
        if(!row)fail(404,'missing');
        if(!Number.isInteger(input.version)||row.version!==input.version||!['hide','restore'].includes(input.action)||(input.action==='hide')===!!row.deleted_at)fail(409,'conflict');
        const next={...row,version:row.version+1,updated_at:now,deleted_at:input.action==='hide'?now:null};
        // Optimistic version claim and its archive/outbox commit together.
        const results=await db.batch([stmt('UPDATE public_articles SET deleted_at=?,updated_at=?,version=version+1 WHERE id=? AND version=?',next.deleted_at,now,id,row.version),await archiveArticle(next)]);
        if((results[0].meta?.changes??results[0].changes)!==1)fail(409,'conflict');
        return json({ok:true,wikinb:'queued'});
      }
      if(path==='/api/admin/articles'&&method==='GET') {
        await requireAdmin(request,env,now);
        const rows=(await stmt('SELECT * FROM public_articles ORDER BY created_at DESC LIMIT 30 OFFSET ?',pageOffset('offset')).all()).results;
        return json({articles:rows.map(adminPost)});
      }
      const selectQ = 'SELECT q.*,(SELECT COUNT(*) FROM public_replies r WHERE r.question_id=q.id AND r.deleted_at IS NULL) reply_count FROM public_questions q';
      if (path === '/api/admin/session' && method === 'POST') {
        await rate('admin:login:'+await hash(request.headers.get('CF-Connecting-IP') || 'unknown'), 10, 60000);
        const user=await requireAdmin(request,env,now); return json({token:user.token,expires_at:user.exp*1000});
      }
      if (path.startsWith('/api/admin/')) {
        await requireAdmin(request, env, now);
        if (path === '/api/admin/backup-status' && method === 'GET') return json(await backupStatus(env));
        if (path === '/api/admin/archive' && method === 'GET') {
          const kind=url.searchParams.get('kind'),id=idOf(url.searchParams.get('post_id'));
          if (!['questions','replies'].includes(kind)) fail(400,'invalid');
          const rows=(await stmt('SELECT * FROM post_archive WHERE kind=? AND post_id=? ORDER BY version DESC LIMIT 101 OFFSET ?',kind,id,pageOffset('offset')).all()).results;
          return json({versions:rows.slice(0,100),has_more:rows.length>100});
        }
        if (path === '/api/admin/questions' && method === 'GET') {
          const filter = url.searchParams.get('filter');
          const where = filter === 'deleted' ? ' WHERE q.deleted_at IS NOT NULL' : ' WHERE q.deleted_at IS NULL';
          const rows = (await stmt(selectQ+where+' ORDER BY q.created_at DESC,q.id LIMIT 30 OFFSET ?', pageOffset('offset')).all()).results;
          return json({questions:rows.map(adminPost)});
        }
        const adminPath = path.match(/^\/api\/admin\/(questions|replies)\/([a-f0-9-]+)(\/moderate)?$/);
        if (adminPath) {
          const kind = adminPath[1], id = idOf(adminPath[2]);
          if (kind === 'questions' && !adminPath[3] && method === 'GET') {
            const post = await stmt('SELECT * FROM public_questions WHERE id=?', id).first();
            if (!post) fail(404,'missing');
            const rows = (await stmt('SELECT * FROM public_replies WHERE question_id=? ORDER BY created_at,id LIMIT 101 OFFSET ?', id, pageOffset('replyOffset')).all()).results;
            return json({question:adminPost(post), replies:rows.slice(0,100).map(adminPost), has_more:rows.length>100});
          }
          if (adminPath[3] && method === 'POST') {
            if (!['hide','restore'].includes(input.action) || !Number.isInteger(input.version)) fail(400,'invalid');
            const restoring = input.action === 'restore';
            const changed = await stmt(`UPDATE public_${kind} SET deleted_at=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND deleted_at IS ${restoring?'NOT ':''}NULL${restoring?" AND body<>''":''} RETURNING id`, restoring?null:now, now, id, input.version).first();
            if (!changed) fail(409,'conflict');
            await stmt('DELETE FROM translations WHERE kind=? AND post_id=?',kind,id).run();
            return json({ok:true});
          }
        }
        fail(404,'missing');
      }
      if (path === '/api/questions' && method === 'GET') {
        const filter = url.searchParams.get('filter');
        const extra = filter === 'mine' ? ' AND q.owner_hash=?' : '';
        const args = filter === 'mine' ? [owner, pageOffset('offset')] : [pageOffset('offset')];
        const rows = (await stmt(`${selectQ} WHERE q.deleted_at IS NULL${extra} ORDER BY q.created_at DESC,q.id LIMIT 30 OFFSET ?`, ...args).all()).results;
        return json({questions:rows.map(row => publicPost(row,owner))});
      }
      if ((path === '/api/questions' || path === '/api/replies') && method === 'POST') {
        if (path === '/api/questions' && !account) fail(401,'auth');
        if (!owner) fail(400,'identity');
        const name = textOf(account?.nickname || account?.name || input.name,60,'identity'), department = textOf(account?(account.department||(account.role==='student'?'學生':'教職員')):input.department,40,'identity');
        if (/[\r\n]/.test(name+department)) fail(400,'identity');
        const id = idOf(input.id), body = textOf(input.body,4000,'length'), kind = path.endsWith('questions') ? 'questions' : 'replies';
        const qid = kind === 'replies' ? idOf(input.question_id) : null;
        if (qid && !await stmt('SELECT id FROM public_questions WHERE id=? AND deleted_at IS NULL',qid).first()) fail(404,'missing');
        await rate(`post:${owner}`,20,60000);
        await rate('post:global',2000,DAY);
        await stmt(`INSERT OR IGNORE INTO public_${kind}(id,owner_hash,name,department,body,created_at,updated_at${qid?',question_id':',uploader_role'}) VALUES(?,?,?,?,?,?,?,?)`,id,owner,name,department,body,now,now,...(qid?[qid]:[account.role==='student'?'students':'teachers'])).run();
        const saved = await stmt(`SELECT * FROM public_${kind} WHERE id=?`,id).first();
        if (saved.owner_hash !== owner || saved.body !== body || saved.name !== name || saved.department !== department || saved.deleted_at || (qid && saved.question_id !== qid)) fail(409,'conflict');
        return json({id},201);
      }
      const resolution=path.match(/^\/api\/questions\/([a-f0-9-]+)\/resolve$/);
      if(resolution && method==='POST') {
        if(!account)fail(401,'auth');
        const id=idOf(resolution[1]);
        const post=await stmt('SELECT * FROM public_questions WHERE id=? AND deleted_at IS NULL',id).first();
        if(!post)fail(404,'missing');
        if(post.owner_hash!==owner&&!isAdministrator(account))fail(403,'owner');
        if(!Number.isInteger(input.version)||typeof input.resolved!=='boolean')fail(400,'invalid');
        const methodText=input.resolved?textOf(input.method,4000,'solution'):post.solution_method;
        const steps=input.resolved?textOf(input.steps,4000,'solution'):post.solution_steps;
        const result=input.resolved?textOf(input.result,2000,'solution'):post.solution_result;
        const next={...post,resolved:input.resolved?1:0,solution_method:methodText,solution_steps:steps,solution_result:result,updated_at:now,version:post.version+1};
        const eventId='solution:'+id+':v'+next.version;
        const results=await db.batch([
          stmt('UPDATE public_questions SET resolved=?,solution_method=?,solution_steps=?,solution_result=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND deleted_at IS NULL',next.resolved,methodText,steps,result,now,id,input.version),
          stmt('INSERT OR IGNORE INTO solution_archive(event_id,question_id,version,markdown,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM public_questions WHERE id=? AND version=? AND updated_at=?)',eventId,id,next.version,solutionMarkdown(next),now,id,next.version,now)
        ]);
        const changed=results[0].meta?.changes ?? results[0].changes;
        if(changed!==1)fail(409,'conflict');
        return json({ok:true,wikinb:'queued'});
      }
      const postPath = path.match(/^\/api\/(questions|replies)\/([a-f0-9-]+)$/);
      if (postPath) {
        const kind = postPath[1], id = idOf(postPath[2]);
        const post = await stmt(`SELECT * FROM public_${kind} WHERE id=?`,id).first();
        if (!post) fail(404,'missing');
        if (kind === 'questions' && method === 'GET') {
          if (post.deleted_at) return json({question:publicPost(post,owner), replies:[], has_more:false});
          const rows = (await stmt('SELECT * FROM public_replies WHERE question_id=? ORDER BY created_at,id LIMIT 101 OFFSET ?',id,pageOffset('replyOffset')).all()).results;
          return json({question:publicPost(post,owner), replies:rows.slice(0,100).map(row=>publicPost(row,owner)), has_more:rows.length>100});
        }
        if (method === 'PATCH') {
          if (!owner || post.owner_hash !== owner) fail(403,'owner');
          if (post.deleted_at || (kind==='questions' && post.resolved)) fail(409,'conflict');
          if (kind === 'replies' && !await stmt('SELECT id FROM public_questions WHERE id=? AND deleted_at IS NULL',post.question_id).first()) fail(409,'conflict');
          if (!Number.isInteger(input.version) || input.resolved !== undefined) fail(400,'invalid');
          const body = input.body === undefined ? post.body : textOf(input.body,4000,'length');
          const updated = await stmt(`UPDATE public_${kind} SET body=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND deleted_at IS NULL RETURNING id`,body,now,id,input.version).first();
          if (!updated) fail(409,'conflict');
          await stmt('DELETE FROM translations WHERE kind=? AND post_id=? AND version<?',kind,id,input.version+1).run();
          return json({ok:true});
        }
      }
      fail(404,'missing');
    } catch (error) { return json({error:error instanceof HttpError ? error.message : 'unavailable'},error instanceof HttpError ? error.status : 503); }
  };
}
export async function cleanup(env) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM limits WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM translations WHERE created_at<?').bind(now-30*DAY),
    env.DB.prepare('DELETE FROM translation_jobs WHERE expires_at<?').bind(now)
  ]);
}
