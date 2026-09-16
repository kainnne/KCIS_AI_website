import { createHandler, cleanup } from './core.mjs';
import { connect } from 'cloudflare:sockets';
import { createSmtpSender } from './mail.mjs';
export default {fetch:createHandler(createSmtpSender(connect)),scheduled(_event,env,ctx){ctx.waitUntil(cleanup(env));}};
