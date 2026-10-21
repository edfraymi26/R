import {configuration} from '../../src/provider.mjs';
export const config={path:'/api/niklaus-status'};
export function createStatusHandler(env=process.env){
 return async req=>{
  if(req.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
  const state=configuration(env);
  // Presence is not a provider health check; no quota consumed by status requests.
  return Response.json({mode:state.configured?'configured':'guide',configured:state.configured,connection:'unchecked',reason:state.reason},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 };
}
export default createStatusHandler();
