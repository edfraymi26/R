// Post-deployment smoke check. Never prints keys, prompts or generated transcripts.
import {readSSE} from '../src/niklaus-core.mjs';
const arg=process.argv.find(x=>x.startsWith('--url='));
if(!arg){console.error('Usage: node scripts/doctor.mjs --url=https://riverafinancialgroup.net [--ai]');process.exit(1);}
const base=new URL(arg.slice(6));if(base.protocol!=='https:')throw new Error('Use an HTTPS deployment URL');
let failed=false;
for(const path of ['/','/en/','/sam-gov/','/reparacion-credito-personal/','/niklaus/','/assets/app.mjs','/assets/site.css','/api/niklaus-status']){
 try{
  const r=await fetch(new URL(path,base),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);console.log('PASS',path);
  if(path==='/api/niklaus-status'){
   const d=await r.json();console.log('Configuration:',d.configured===true?'present':'missing or disabled','Connection:',d.connection==='unchecked'?'not checked':'legacy/unknown');
   if(d.configured!==true)console.log('ACTION: Configure GROQ_API_KEY in Netlify Functions and redeploy to enable generative AI.');
   else console.log('A configured key is not proof of a working connection. Run --ai for a real request.');
  }
 }catch(e){failed=true;console.error('FAIL',path,e.message);}
}
if(process.argv.includes('--ai')){
 try{
  const r=await fetch(new URL('/api/chat',base),{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:JSON.stringify({lang:'es',context:'sam',messages:[{role:'user',content:'¿El registro oficial de SAM.gov es gratuito? Responde en dos frases.'}]}),signal:AbortSignal.timeout(55000)});
  if(!r.ok){let error;try{error=(await r.json()).error;}catch{}throw Error(`HTTP ${r.status}; ${['not_configured','disabled','sensitive','quota'].includes(error)?error:'check function diagnostics'}`);}
  let deltas=0,done=false;for await(const e of readSSE(r.body)){
   if(e.type==='delta'&&typeof e.text==='string'&&e.text.trim())deltas++;
   if(e.type==='error')throw Error(['authentication','model','quota','timeout','provider_request','unavailable','empty','interrupted'].includes(e.key)?e.key:'provider error');
   if(e.type==='done')done=true;
  }
  if(!deltas||!done)throw Error('No complete AI answer');
  console.log('PASS live AI stream: text received and completed (quota consumed; answer quality not evaluated).');
 }catch(e){failed=true;console.error('FAIL live AI:',e.message);}
}
if(failed)process.exitCode=1;
