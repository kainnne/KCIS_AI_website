const DAY = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, text) => { throw new HttpError(status, text); };
export function emailOf(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@(kcis\.com\.tw|kcis\.ntpc\.edu\.tw)$/.test(email) || email.length > 254) fail(400, '請使用康橋信箱');
  return email;
}
function bodyOf(value) { const body = String(value || '').trim(); if (!body || body.length > 4000) fail(400, '內容須為 1–4000 字'); return body; }
function idOf(value) { if (!UUID.test(String(value))) fail(400, '無效的識別碼'); return value; }
const hex = bytes => Array.from(new Uint8Array(bytes), v => v.toString(16).padStart(2, '0')).join('');
export async function hash(value) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
async function mac(secret, value) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))); }
function equal(a, b) { if (a.length !== b.length) return false; let d = 0; for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0; }
const safeUser = u => ({id:u.id,nickname:u.nickname,role:u.role,status:u.status});
export function createHandler(sendMail) {
  return async function handle(request, env) {
    const origin = request.headers.get('origin');
    const cors = {'Vary':'Origin','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
    if (origin === env.ALLOWED_ORIGIN) Object.assign(cors, {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'});
    const json = (value, status=200) => new Response(JSON.stringify(value), {status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
    try {
      const url = new URL(request.url), path = url.pathname, method=request.method, now=Date.now();
      if (origin && origin!==env.ALLOWED_ORIGIN) fail(403,'不允許的來源');
      if (method==='OPTIONS') return new Response(null,{status:204,headers:cors});
      const db=env.DB;
      const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
      if (path==='/api/health' && method==='GET') { await stmt('SELECT 1').first(); return json({ok:true}); }
      if (!env.OTP_SECRET || !env.ADMIN_EMAIL || !env.SMTP_USER || !env.SMTP_PASS) fail(503,'登入暫時無法使用');
      let input={};
      if (['POST','PATCH'].includes(method)) {
        if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415,'格式不符');
        if (Number(request.headers.get('content-length')||0)>20000) fail(413,'內容過長');
        const reader=request.body?.getReader(); let size=0; const chunks=[];
        if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>20000){await reader.cancel();fail(413,'內容過長');}chunks.push(value);}
        const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
        try { input=JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400,'格式不符'); }
        if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'格式不符');
      }
      async function rate(key, maximum, windowMs) {
        const bucket=Math.floor(now/windowMs), full=`${key}:${bucket}`;
        const row=await stmt('INSERT INTO limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count',full,(bucket+1)*windowMs,maximum).first();
        if(!row)fail(429,'操作過於頻繁，請稍後再試');
      }
      if(path==='/api/auth/code' && method==='POST') {
        const email=emailOf(input.email), emailKey=await mac(env.OTP_SECRET,email);
        const ip=await mac(env.OTP_SECRET,request.headers.get('CF-Connecting-IP')||'unknown');
        const old=await stmt('SELECT sent_at FROM otp WHERE email=?',email).first();
        if(old && now-old.sent_at<60000)fail(429,'請等候 60 秒再重寄');
        await rate(`mail:email:${emailKey}`,5,DAY);await rate(`mail:ip:${ip}`,100,DAY);await rate('mail:global',200,DAY);
        const random=new Uint32Array(1);do{crypto.getRandomValues(random);}while(random[0]>=4294000000);
        const code=String(random[0]%1000000).padStart(6,'0'), challenge=crypto.randomUUID();
        const codeHash=await mac(env.OTP_SECRET,`${email}|${challenge}|${code}`);
        const reserved=await stmt('INSERT INTO otp(email,challenge,hash,expires_at,attempts,sent_at) VALUES(?,?,?,?,0,?) ON CONFLICT(email) DO UPDATE SET challenge=excluded.challenge,hash=excluded.hash,expires_at=excluded.expires_at,attempts=0,sent_at=excluded.sent_at WHERE otp.sent_at<=? RETURNING challenge',email,challenge,codeHash,now+600000,now,now-60000).first();
        if(!reserved)fail(429,'請等候 60 秒再重寄');
        try { await sendMail(env,email,code); } catch {
          await stmt('DELETE FROM otp WHERE email=? AND challenge=?',email,challenge).run();fail(503,'驗證信寄送失敗，請稍後再試');
        }
        return json({ok:true,expiresIn:600});
      }
      if(path==='/api/auth/verify' && method==='POST') {
        const email=emailOf(input.email),code=String(input.code||'');
        if(!/^\d{6}$/.test(code))fail(400,'請輸入六位數驗證碼');
        const row=await stmt('UPDATE otp SET attempts=attempts+1 WHERE email=? AND expires_at>? AND attempts<5 RETURNING *',email,now).first();
        if(!row || !equal(row.hash,await mac(env.OTP_SECRET,`${email}|${row.challenge}|${code}`)))fail(401,'驗證碼錯誤或已過期');
        if(!await stmt('DELETE FROM otp WHERE email=? AND challenge=? RETURNING email',email,row.challenge).first())fail(401,'驗證碼已使用');
        const admin=email===env.ADMIN_EMAIL.trim().toLowerCase();
        await stmt('INSERT OR IGNORE INTO users(id,email,role,status,created_at) VALUES(?,?,?,?,?)',crypto.randomUUID(),email,admin?'admin':'teacher',admin?'active':'pending',now).run();
        const user=await stmt('SELECT * FROM users WHERE email=?',email).first();
        if(user.status==='suspended')fail(403,'帳號已停用');
        const token=hex(crypto.getRandomValues(new Uint8Array(32)));
        await stmt('INSERT INTO sessions(hash,user_id,expires_at) VALUES(?,?,?)',await hash(token),user.id,now+DAY).run();
        return json({token,user:safeUser(user)});
      }
      const bearer=request.headers.get('authorization')||'';
      if(!/^Bearer [a-f0-9]{64}$/.test(bearer))fail(401,'請先登入');
      const tokenHash=await hash(bearer.slice(7));
      const user=await stmt('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires_at>?',tokenHash,now).first();
      if(!user)fail(401,'登入已過期');
      if(path==='/api/auth/logout' && method==='POST') {await stmt('DELETE FROM sessions WHERE hash=?',tokenHash).run();return json({ok:true});}
      if(user.status==='suspended')fail(403,'帳號已停用');
      if(path==='/api/me' && method==='GET')return json({user:safeUser(user)});
      if(path==='/api/me' && method==='PATCH') {
        const nickname=String(input.nickname||'').normalize('NFKC').trim();
        if(nickname.length<2||nickname.length>20||/[\u0000-\u001f\u007f<>@]/.test(nickname))fail(400,'暱稱須為 2–20 字');
        await stmt('UPDATE users SET nickname=? WHERE id=?',nickname,user.id).run();return json({user:{...safeUser(user),nickname}});
      }
      if(user.status!=='active')fail(403,'等待管理員開通教師權限');
      if(!user.nickname)fail(403,'請先設定暱稱');
      if(method!=='GET')await rate(`write:${user.id}`,30,60000);
      async function audit(target,action) {return stmt('INSERT INTO audit(id,actor_id,target_id,action,created_at) VALUES(?,?,?,?,?)',crypto.randomUUID(),user.id,target,action,now);}
      if(path==='/api/members' && method==='GET') {
        if(user.role!=='admin')fail(403,'沒有管理權限');
        return json({members:(await stmt("SELECT id,email,nickname,role,status FROM users ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 200").all()).results});
      }
      const member=path.match(/^\/api\/members\/([a-f0-9-]+)$/);
      if(member && method==='PATCH') {
        if(user.role!=='admin')fail(403,'沒有管理權限');
        const target=idOf(member[1]);if(target===user.id||!['active','suspended'].includes(input.status))fail(400,'無效操作');
        const found=await stmt('SELECT role FROM users WHERE id=?',target).first();if(!found||found.role==='admin')fail(403,'無法變更此帳號');
        await db.batch([stmt('UPDATE users SET status=? WHERE id=?',input.status,target),stmt('DELETE FROM sessions WHERE user_id=?',target),await audit(target,`member:${input.status}`)]);return json({ok:true});
      }
      const selectQ="SELECT q.id,q.author_id,CASE WHEN q.deleted_at IS NULL THEN q.body ELSE '' END body,q.resolved,q.created_at,q.updated_at,q.deleted_at,q.version,u.nickname,(SELECT COUNT(*) FROM replies r WHERE r.question_id=q.id AND r.deleted_at IS NULL) reply_count FROM questions q JOIN users u ON u.id=q.author_id";
      const selectR="SELECT r.id,r.question_id,r.author_id,CASE WHEN r.deleted_at IS NULL THEN r.body ELSE '' END body,r.created_at,r.updated_at,r.deleted_at,r.version,u.nickname,u.role FROM replies r JOIN users u ON u.id=r.author_id";
      if(path==='/api/questions' && method==='GET') {
        const filter=url.searchParams.get('filter'),offset=Math.max(0,Math.min(10000,Number(url.searchParams.get('offset'))||0));
        const extra=filter==='mine'?' AND q.author_id=?':filter==='unanswered'?' AND NOT EXISTS(SELECT 1 FROM replies r WHERE r.question_id=q.id AND r.deleted_at IS NULL)':'';
        const args=filter==='mine'?[user.id,offset]:[offset];
        return json({questions:(await stmt(`${selectQ} WHERE q.deleted_at IS NULL${extra} ORDER BY q.created_at DESC,q.id LIMIT 30 OFFSET ?`,...args).all()).results});
      }
      if(path==='/api/questions' && method==='POST') {
        const id=idOf(input.id),body=bodyOf(input.body);
        const old=await stmt('SELECT author_id,body FROM questions WHERE id=?',id).first();
        if(old && (old.author_id!==user.id||old.body!==body))fail(409,'問題已變更');
        await stmt('INSERT OR IGNORE INTO questions(id,author_id,body,created_at,updated_at) VALUES(?,?,?,?,?)',id,user.id,body,now,now).run();return json({id},201);
      }
      const question=path.match(/^\/api\/questions\/([a-f0-9-]+)$/);
      if(question) {
        const id=idOf(question[1]),q=await stmt('SELECT * FROM questions WHERE id=?',id).first();if(!q)fail(404,'找不到問題');
        if(method==='GET') {
          const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('replyOffset'))||0));
          const rows=(await stmt(`${selectR} WHERE r.question_id=? ORDER BY r.created_at,r.id LIMIT 101 OFFSET ?`,id,offset).all()).results;
          return json({question:await stmt(`${selectQ} WHERE q.id=?`,id).first(),replies:rows.slice(0,100),has_more:rows.length>100});
        }
        if(user.id!==q.author_id && !(method==='DELETE'&&user.role==='admin'))fail(403,'只能修改自己的問題');
        if(q.deleted_at)fail(409,'問題已撤回');
        if(method==='DELETE') {await db.batch([stmt('UPDATE questions SET body=?,deleted_at=?,updated_at=?,version=version+1 WHERE id=?','',now,now,id),await audit(id,'question:delete')]);return json({ok:true});}
        if(method==='PATCH') {
          const body=input.body===undefined?q.body:bodyOf(input.body),resolved=input.resolved===undefined?q.resolved:input.resolved?1:0;
          if(!await stmt('UPDATE questions SET body=?,resolved=?,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING id',body,resolved,now,id,input.version).first())fail(409,'內容已更新，請重新載入');
          return json({ok:true});
        }
      }
      if(path==='/api/replies' && method==='POST') {
        const id=idOf(input.id),qid=idOf(input.question_id),body=bodyOf(input.body);
        if(!await stmt('SELECT id FROM questions WHERE id=? AND deleted_at IS NULL',qid).first())fail(404,'問題已撤回或不存在');
        const old=await stmt('SELECT author_id,body,question_id FROM replies WHERE id=?',id).first();if(old&&(old.author_id!==user.id||old.body!==body||old.question_id!==qid))fail(409,'回覆已變更');
        await stmt('INSERT OR IGNORE INTO replies(id,question_id,author_id,body,created_at,updated_at) VALUES(?,?,?,?,?,?)',id,qid,user.id,body,now,now).run();return json({id},201);
      }
      const reply=path.match(/^\/api\/replies\/([a-f0-9-]+)$/);
      if(reply && ['PATCH','DELETE'].includes(method)) {
        const id=idOf(reply[1]),r=await stmt('SELECT * FROM replies WHERE id=?',id).first();if(!r||r.deleted_at)fail(404,'找不到回覆');
        if(user.id!==r.author_id&&!(method==='DELETE'&&user.role==='admin'))fail(403,'只能修改自己的回覆');
        if(method==='DELETE'){await db.batch([stmt('UPDATE replies SET body=?,deleted_at=?,updated_at=?,version=version+1 WHERE id=?','',now,now,id),await audit(id,'reply:delete')]);return json({ok:true});}
        if(!await stmt('UPDATE replies SET body=?,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING id',bodyOf(input.body),now,id,input.version).first())fail(409,'內容已更新，請重新載入');return json({ok:true});
      }
      fail(404,'找不到頁面');
    } catch(error) {return json({error:error instanceof HttpError?error.message:'服務暫時無法使用'},error instanceof HttpError?error.status:503);}
  };
}
export async function cleanup(env) {
  const now=Date.now();await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM otp WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM limits WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM audit WHERE created_at<?').bind(now-90*DAY)
  ]);
}
