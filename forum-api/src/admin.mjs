import { verifiedAccount, isAdministrator } from './identity.mjs';
import { HttpError } from './http-error.mjs';
export async function requireAdmin(request,env,now) {
 const user=await verifiedAccount(request,env,now);
 if(!isAdministrator(user))throw new HttpError(401,'admin_auth');
 return user;
}
export async function startAdminSession(input,env,now) {
 const user=await requireAdmin(new Request('https://auth.local/',{headers:{Authorization:'Bearer '+String(input.token||'')}}),env,now);
 return {token:user.token,expires_at:user.exp*1000};
}
