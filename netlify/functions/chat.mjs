import {randomUUID} from 'node:crypto';
import {validateMessages,systemPrompt,tools,runTool,readSSE} from '../../src/niklaus-core.mjs';
import {configuration,DEFAULT_MODEL,providerError} from '../../src/provider.mjs';
export const config={path:'/api/chat',rateLimit:{action:'rate_limit',windowLimit:8,windowSize:60,aggregateBy:['ip','domain']}};
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function requestText(req){
 const reader=req.body?.getReader();if(!reader)return '';
 let bytes=0,text='';const decoder=new TextDecoder();
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>40000){await reader.cancel();throw Error('SIZE');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{reader.releaseLock();}
}
export function createHandler({env=process.env,fetcher=fetch,logger=entry=>console.info(JSON.stringify(entry)),timeoutMs=45000}={}){
 return async function handler(req){
  if(req.method!=='POST')return json({error:'method'},405);
  const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)return json({error:'origin'},403);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'content_type'},415);
  if(Number(req.headers.get('content-length'))>40000)return json({error:'size'},413);
  let data,messages;try{data=JSON.parse(await requestText(req));messages=validateMessages(data?.messages);}catch(e){return json({error:e.message==='SENSITIVE'?'sensitive':e.message==='SIZE'?'size':'invalid_request'},e.message==='SIZE'?413:400);}
  const requestId=randomUUID(),started=Date.now();
  const report=(outcome,status)=>{try{logger({event:'niklaus',request_id:requestId,outcome,...(status?{provider_status:status}:{}),duration_ms:Date.now()-started});}catch{}};
  const state=configuration(env);
  if(!state.configured){report(state.reason);return json({error:state.reason,mode:'guide',request_id:requestId},503);}
  const lang=data.lang==='en'?'en':'es',context=typeof data.context==='string'?data.context.slice(0,80):'';
  const model=env.GROQ_MODEL?.trim()||DEFAULT_MODEL;
  const controller=new AbortController();let timedOut=false,stopped=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  const requestAbort=()=>controller.abort();req.signal.addEventListener('abort',requestAbort,{once:true});
  if(req.signal.aborted)controller.abort();
  const encoder=new TextEncoder();
  const stream=new ReadableStream({
   async start(out){
    const emit=(type,payload={})=>{if(!stopped)out.enqueue(encoder.encode(`data: ${JSON.stringify({type,...payload})}\n\n`));};
    const fail=(key,status)=>{emit('error',{key,request_id:requestId});report(key,status);};
    const history=[{role:'system',content:systemPrompt(messages.at(-1).content,context,lang)},...messages];
    try{
     if(controller.signal.aborted)throw Error('Aborted');
     emit('status',{key:'thinking'});
     for(let round=0;round<2;round++){
      const payload={model,messages:history,stream:true,max_completion_tokens:round===1?1300:1000,temperature:0.35};
      if(model.startsWith('openai/gpt-oss-'))payload.reasoning_effort='low';
      if(round===0){payload.tools=tools;payload.tool_choice='auto';}
      const res=await fetcher('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(!res.ok){let code='';try{code=(await res.json())?.error?.code||'';}catch{}fail(providerError(res.status,code),res.status);return;}
      if(!res.body){fail('unavailable');return;}
      const calls=new Map();let content='',finish='';
      for await(const event of readSSE(res.body,controller.signal)){
       if(event.error){fail(providerError(event.error.status,event.error.code));return;}
       const choice=event.choices?.[0];if(!choice)continue;const d=choice.delta||{};
       if(typeof d.content==='string'){content+=d.content;if(content.length>16000)throw Error('Output budget');emit('delta',{text:d.content});}
       for(const part of d.tool_calls||[]){
        if(round!==0||!Number.isInteger(part.index)||part.index<0||part.index>1)throw Error('Tool budget');
        const current=calls.get(part.index)||{id:'',type:'function',function:{name:'',arguments:''}};
        if(part.id)current.id=part.id;if(part.function?.name)current.function.name+=part.function.name;if(part.function?.arguments)current.function.arguments+=part.function.arguments;
        if(current.function.arguments.length>8000||current.function.name.length>100)throw Error('Tool budget');calls.set(part.index,current);
       }
       if(choice.finish_reason)finish=choice.finish_reason;
      }
      if(controller.signal.aborted)throw Error('Aborted');
      if(!calls.size){
       if(!['stop','length'].includes(finish)){fail('interrupted');return;}
       if(!content.trim()){fail('empty');return;}
       if(finish==='length')emit('notice',{key:'truncated'});
       emit('done');report(finish==='length'?'truncated':'complete');return;
      }
      if(finish!=='tool_calls')throw Error('Incomplete tool call');
      history.push({role:'assistant',content:content||null,tool_calls:[...calls.values()]});
      for(const call of calls.values()){
       emit('status',{key:call.function.name==='read_official_source'?'source':'tool'});
       let result;try{result=await runTool(call.function.name,JSON.parse(call.function.arguments),lang,fetcher,controller.signal);}catch{result={error:'Tool unavailable or invalid arguments. Do not invent a result.'};}
       if(controller.signal.aborted)throw Error('Aborted');
       if(call.function.name==='read_official_source'&&result.url)emit('source',{name:result.source,url:result.url,live:result.live});
       if(call.function.name==='calculate_utilization'&&!result.error)emit('calculation',{percent:result.percent,balance:result.balance,limit:result.limit});
       history.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});
      }
     }
    }catch{if(stopped||req.signal.aborted)report('cancelled');else fail(timedOut?'timeout':'unavailable');}
    finally{clearTimeout(timer);req.signal.removeEventListener('abort',requestAbort);if(!stopped){try{out.close();}catch{}}}
   },
   cancel(){stopped=true;controller.abort();clearTimeout(timer);req.signal.removeEventListener('abort',requestAbort);}
  });
  return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-store, no-transform','X-Content-Type-Options':'nosniff','X-Accel-Buffering':'no','X-Request-ID':requestId}});
 };
}
export default createHandler();
