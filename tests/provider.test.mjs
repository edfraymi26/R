import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../netlify/functions/chat.mjs';
import {createStatusHandler} from '../netlify/functions/niklaus-status.mjs';
import {readSSE,utilization} from '../src/niklaus-core.mjs';
const base='https://riverafinancialgroup.net';
const request=content=>new Request(base+'/api/chat',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({lang:'en',messages:[{role:'user',content:content||'Compare the services'}]})});
const collect=async response=>{const events=[];for await(const event of readSSE(response.body))events.push(event);return events;};
const mockEnv={GROQ_API_KEY:'test-credential-never-log'};
const silent=()=>{};
test('status distinguishes missing, disabled and configured without claiming connection',async()=>{
 for(const [env,mode,reason] of [[{},'guide','not_configured'],[{...mockEnv,NIKLAUS_ENABLED:'false'},'guide','disabled'],[mockEnv,'configured',null]]){
  const h=createStatusHandler(env);const res=await h(new Request(base+'/api/niklaus-status'));const d=await res.json();
  assert.equal(d.mode,mode);assert.equal(d.reason,reason);assert.equal(d.connection,'unchecked');assert.equal(d.configured,mode==='configured');assert.equal(res.headers.get('cache-control'),'no-store');
  assert.equal((await h(new Request(base,{method:'POST'}))).status,405);
 }
});
for(const [status,code,key] of [[401,'','authentication'],[403,'','authentication'],[404,'','model'],[400,'model_decommissioned','model'],[429,'','quota'],[400,'','provider_request'],[422,'','provider_request'],[504,'','timeout'],[503,'','unavailable']]){
 test(`provider ${status}/${code||'default'} maps to ${key} without a success event`,async()=>{
  const logs=[];const h=createHandler({env:mockEnv,logger:e=>logs.push(e),fetcher:async()=>Response.json({error:{code,message:'provider internal details'}},{status})});
  const events=await collect(await h(request('private-conversation-marker')));const error=events.find(e=>e.type==='error');assert.equal(error.key,key);assert.ok(error.request_id);assert.ok(!events.some(e=>e.type==='done'));
  assert.equal(logs.length,1);assert.equal(logs[0].outcome,key);const encoded=JSON.stringify(logs);for(const value of ['private-conversation-marker',mockEnv.GROQ_API_KEY,'provider internal details'])assert.ok(!encoded.includes(value));
 });
}
test('server deadline aborts upstream and emits timeout',async()=>{
 let aborted=false;const h=createHandler({env:mockEnv,logger:silent,timeoutMs:15,fetcher:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error('abort'));},{once:true}))});
 const events=await collect(await h(request()));assert.ok(aborted);assert.equal(events.at(-1).key,'timeout');assert.ok(!events.some(e=>e.type==='done'));
});
test('truncated stream is not falsely marked complete',async()=>{
 const h=createHandler({env:mockEnv,logger:silent,fetcher:async()=>new Response('data: {"choices":[{"delta":{"content":"Partial answer"}}]}\n\n')});
 const events=await collect(await h(request()));assert.equal(events[1].text,'Partial answer');assert.equal(events.at(-1).key,'interrupted');assert.ok(!events.some(e=>e.type==='done'));
});
test('empty answer is an error, never done',async()=>{
 const h=createHandler({env:mockEnv,logger:silent,fetcher:async()=>new Response('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n')});
 const events=await collect(await h(request()));assert.equal(events.at(-1).key,'empty');assert.ok(!events.some(e=>e.type==='done'));
});
test('disabled AI never contacts the provider',async()=>{
 let calls=0;const h=createHandler({env:{...mockEnv,NIKLAUS_ENABLED:'false'},logger:silent,fetcher:async()=>{calls++;}});
 const res=await h(request());assert.equal(res.status,503);assert.equal((await res.json()).error,'disabled');assert.equal(calls,0);
});
test('size limit counts UTF-8 bytes and handles null JSON',async()=>{
 const h=createHandler({env:{},logger:silent});assert.equal((await h(request('€'.repeat(14000)))).status,413);
 const res=await h(new Request(base+'/api/chat',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'null'}));assert.equal(res.status,400);
});
test('calculation rejects null, booleans and coerced empty strings',()=>{for(const v of [null,false,'',[],{}])assert.throws(()=>utilization(v,100));});
test('SSE rejects unbounded frames and cancellation releases a stalled read',async()=>{
 await assert.rejects(()=>collect(new Response('data: '+ 'x'.repeat(200001))),/too large/);
 let cancelled=false;const stream=new ReadableStream({cancel(){cancelled=true;}});const controller=new AbortController();const read=(async()=>{for await(const _ of readSSE(stream,controller.signal)){}})();controller.abort();await read;assert.ok(cancelled);
});
test('a first real stream delta arrives before upstream completion',async()=>{
 let upstreamController;const encoder=new TextEncoder();
 const h=createHandler({env:mockEnv,logger:silent,fetcher:async()=>new Response(new ReadableStream({start(c){upstreamController=c;c.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"First "}}]}\n\n'));}}))});
 const iterator=readSSE((await h(request())).body)[Symbol.asyncIterator]();assert.equal((await iterator.next()).value.type,'status');assert.equal((await iterator.next()).value.text,'First ');
 upstreamController.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"second"},"finish_reason":"stop"}]}\n\n'));upstreamController.close();
 assert.equal((await iterator.next()).value.text,'second');assert.equal((await iterator.next()).value.type,'done');assert.equal((await iterator.next()).done,true);
});
