import { createHandler, cleanup } from './core.mjs';
export default {
  fetch:createHandler(),
  scheduled(_event,env,ctx) { ctx.waitUntil(cleanup(env)); }
};
