import test from 'node:test';
import assert from 'node:assert/strict';
import {createTextPacer} from '../assets/text-pacer.mjs';
function setup(){let job=null;const frames=[],delays=[];const controller=new AbortController();const pacer=createTextPacer({signal:controller.signal,render:t=>frames.push(t),schedule:(fn,ms)=>{job=fn;delays.push(ms);return 1;},cancel:()=>{job=null;}});return{pacer,controller,frames,delays,tick(){const fn=job;job=null;fn?.();}};}
test('burst response stays progressive even after network completion',async()=>{
 const s=setup();s.pacer.push('Hola. Una respuesta.');let finished=false;const end=s.pacer.end().then(()=>finished=true);
 assert.deepEqual(s.frames,[]);s.tick();assert.equal(s.pacer.text,'Hol');await Promise.resolve();assert.equal(finished,false);
 for(let i=0;i<20;i++)s.tick();await end;assert.equal(s.pacer.text,'Hola. Una respuesta.');assert.ok(s.frames.length>1);
});
test('abort discards queued text and resolves draining immediately',async()=>{
 const s=setup();s.pacer.push('Texto pendiente largo');s.tick();const end=s.pacer.end();s.controller.abort();assert.equal(await end,'Tex');s.tick();s.pacer.push('stale');assert.deepEqual(s.frames,['Tex']);
});
test('separate deltas preserve Unicode and punctuation pauses',async()=>{
 const s=setup();s.pacer.push('Sí.');s.pacer.push('🙂 fin');s.tick();assert.equal(s.delays.at(-1),150);for(let i=0;i<5;i++)s.tick();assert.equal(await s.pacer.end(),'Sí.🙂 fin');
});
test('already aborted requests never render',async()=>{
 const c=new AbortController();c.abort();const p=createTextPacer({signal:c.signal,render:()=>assert.fail('rendered')});p.push('never');assert.equal(await p.end(),'');
});
