import { createHandler, cleanup } from './core.mjs';
import { syncWikiNBSolutions, syncWikiNBArticles } from './solutions.mjs';
import { syncDriveBackups } from './drive-backup.mjs';
export default {
  async fetch(request,env,ctx) {
    const response=await createHandler()(request,env);
    if(request.method==='POST'&&response.ok&&ctx?.waitUntil){ctx.waitUntil(syncWikiNBSolutions(env));ctx.waitUntil(syncWikiNBArticles(env));}
    return response;
  },
  scheduled(event,env,ctx) {
    ctx.waitUntil(syncDriveBackups(env));
    ctx.waitUntil(syncDriveBackups(env,fetch,{collection:'articles'}));
    ctx.waitUntil(syncWikiNBSolutions(env));
    ctx.waitUntil(syncWikiNBArticles(env));
    if(event.cron==='17 19 * * *')ctx.waitUntil(cleanup(env));
  }
};
