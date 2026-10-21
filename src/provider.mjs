// Server-only provider configuration. Never copied into dist.
export const DEFAULT_MODEL='openai/gpt-oss-120b';
export function configuration(env){
 if(env.NIKLAUS_ENABLED==='false')return {configured:false,reason:'disabled'};
 if(!env.GROQ_API_KEY?.trim())return {configured:false,reason:'not_configured'};
 return {configured:true,reason:null};
}
export function providerError(status,code=''){
 if(status===401||status===403)return 'authentication';
 if(status===429)return 'quota';
 if(status===404||['model_not_found','model_decommissioned','model_not_supported'].includes(code))return 'model';
 if(status===400||status===422)return 'provider_request';
 if(status===408||status===504)return 'timeout';
 return 'unavailable';
}
