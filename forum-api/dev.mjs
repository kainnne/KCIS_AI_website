// Local-only adapter for the existing Worker handler. Requires Node 22.13+.
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHandler } from './src/core.mjs';
import { fileURLToPath } from 'node:url';

const storage = new URL('./.local/', import.meta.url);
mkdirSync(storage, { recursive:true });
const adminConfigFile = new URL('admin-config.json',storage);
const localAdmin = existsSync(adminConfigFile) ? JSON.parse(readFileSync(adminConfigFile,'utf8')) : {};
const sql = new DatabaseSync(new URL('forum.sqlite', storage));
sql.exec('PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
for (const name of readdirSync(new URL('./migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()) {
  if (sql.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)) continue;
  sql.exec('BEGIN');
  try { sql.exec(readFileSync(new URL('./migrations/'+name,import.meta.url),'utf8'));sql.prepare('INSERT INTO local_migrations VALUES(?)').run(name);sql.exec('COMMIT'); }
  catch(error) { sql.exec('ROLLBACK');throw error; }
}
function prepare(query) {
  let args=[];
  return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}};
}
const env={ALLOWED_ORIGIN:process.env.LOCAL_FORUM_ORIGIN||'http://localhost:3000',DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}}};
Object.assign(env, {
 SESSION_SECRET:process.env.SESSION_SECRET,
 ALLOWED_EMAIL_DOMAINS:process.env.ALLOWED_EMAIL_DOMAINS,
 EXTRA_ALLOWED_EMAILS:process.env.EXTRA_ALLOWED_EMAILS,
 WIKINB_API_URL:process.env.WIKINB_API_URL,
 WIKINB_INGEST_SECRET:process.env.WIKINB_INGEST_SECRET,
 LOCAL_MODE:'1'
});
const {syncWikiNBSolutions,syncWikiNBArticles}=await import('./src/solutions.mjs');
const solutionSync=setInterval(()=>Promise.all([syncWikiNBSolutions(env),syncWikiNBArticles(env)]).catch(()=>{}),5000);

const handle=createHandler();
const port=Number(process.env.LOCAL_FORUM_PORT||8787);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('LOCAL_FORUM_PORT must be a valid port number.');
const server=createServer(async(req,res)=>{
  try {
    const request=new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
    const response=await handle(request,env);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"unavailable"}');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local forum API: http://localhost:'+port+'; SQLite: forum-api/.local/forum.sqlite'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(async()=>{clearInterval(solutionSync);sql.close();process.exit(0);}));
