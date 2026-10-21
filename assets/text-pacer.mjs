// Buffer incoming deltas independently of network reads. Never invent text.
export function createTextPacer({render,signal,schedule=setTimeout,cancel=clearTimeout}){
 let pending=[],visible='',timer=null,closed=false,stopped=false,resolve;
 const drained=new Promise(r=>resolve=r);
 function tick(){
  timer=null;if(stopped)return;
  const part=pending.splice(0,3).join('');visible+=part;
  if(part)render(visible);
  if(pending.length)timer=schedule(tick,/[.!?;:\n]$/.test(part)?150:50);
  else if(closed)finish();
 }
 function finish(){signal?.removeEventListener('abort',stop);resolve(visible);}
 function stop(){stopped=true;pending=[];if(timer!==null)cancel(timer);timer=null;finish();return visible;}
 signal?.addEventListener('abort',stop,{once:true});
 if(signal?.aborted)stop();
 return {
  push(text){if(stopped||closed)return;pending.push(...Array.from(text));if(timer===null&&pending.length)timer=schedule(tick,50);},
  end(){closed=true;if(!pending.length)finish();return drained;},
  stop,
  get text(){return visible;}
 };
}
