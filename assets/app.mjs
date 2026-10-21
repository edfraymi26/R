import {company,services,extras,sources,pick,route,contactLinks,findService} from './data.mjs';
import {localGuide,hasSensitiveData,utilization} from './guide.mjs';
import {readSSE} from './stream.mjs';
import {createTextPacer} from './text-pacer.mjs';
import {bindChatViewport} from './chat-viewport.mjs';
const lang=document.body.dataset.lang==='en'?'en':'es',en=lang==='en',tr=(es,eng)=>en?eng:es;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const contactDialog=$('#contact-dialog'),chatDialog=$('#chat-dialog'),inline=$('#inline-chat');
let epoch=0,statusReason='not_configured',lastStatusAt=0;
let lastFocus=null,chatController=null,busy=false,history=[],mode='unknown',statusPromise=null,initialized=false;
const chatRoot=inline||chatDialog,log=chatRoot&&$('[data-chat-log]',chatRoot),status=chatRoot&&$('[data-chat-status]',chatRoot),input=chatRoot&&$('[data-chat-input]',chatRoot),send=chatRoot&&$('[data-chat-send]',chatRoot);
const icons={send:'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/></svg>',stop:'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>'};
function toast(message){const t=$('.toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,3500);}
async function copy(value){try{await navigator.clipboard.writeText(value);toast(tr('Copiado','Copied'));}catch{toast(tr('No se pudo copiar. Selecciona el texto manualmente.','Could not copy. Please select the text manually.'));}}
function syncLock(){document.body.classList.toggle('locked',!!$('dialog[open]'));}
function closeMenu(){if($('#mobile-nav')?.contains(document.activeElement))$('.menu-toggle')?.focus();const b=$('.menu-toggle');b?.setAttribute('aria-expanded','false');$('#mobile-nav').hidden=true;}
$('.menu-toggle')?.addEventListener('click',e=>{const b=e.currentTarget,open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));$('#mobile-nav').hidden=!open;});
$$('.navgroup').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('.navgroup').filter(x=>x!==d).forEach(x=>x.open=false);}));
document.addEventListener('click',e=>{if(!e.target.closest('.navgroup'))$$('.navgroup').forEach(d=>d.open=false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$$('.navgroup').forEach(d=>d.open=false);}});
window.addEventListener('resize',()=>{if(window.innerWidth>1200)closeMenu();});
function serviceLabel(id){const s=findService(id)||extras.find(s=>s.id===id);return s?pick(s.title,lang):'';}
function openContact(id=''){
 lastFocus=chatDialog?.open?lastFocus:document.activeElement;const label=serviceLabel(id),links=contactLinks(label,lang);
 for(const a of $$('[data-contact-link]',contactDialog)){const key=a.dataset.contactLink;let href=links[key];if(key==='sms'&&/iPhone|iPad|iPod/.test(navigator.userAgent))href=href.replace('?body=','&body=');a.href=href;}
 $('[data-contact-context]',contactDialog).textContent=(label?tr('Consulta: ','Inquiry: ')+label+'. ':'')+tr('El mensaje se abre para que lo revises y lo envíes. En computadora, también puedes escribir al número desde tu teléfono.','The message opens for you to review and send. On a computer, you can also text the number from your phone.');
 closeMenu();if(chatDialog?.open)chatDialog.close();contactDialog.showModal();syncLock();
}
$$('[data-contact]').forEach(b=>b.addEventListener('click',()=>openContact(b.dataset.contact)));
$('[data-close-contact]').addEventListener('click',()=>contactDialog.close());
for(const dialog of [contactDialog,chatDialog].filter(Boolean)){
 dialog.addEventListener('close',()=>{syncLock();if(!$('dialog[open]')&&lastFocus?.isConnected)lastFocus.focus();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
}
$('[data-copy-number]')?.addEventListener('click',()=>copy('+1 '+company.displayPhone));
$('#goal-select')?.addEventListener('change',e=>{const host=$('#finder-result');host.replaceChildren();const s=findService(e.target.value);if(!s){host.textContent=tr('También puedes preguntarle a Niklaus.','You can also ask Niklaus.');return;}const a=document.createElement('a');a.className='text-link';a.href=route(s.slug,lang);a.textContent=tr('Explorar: ','Explore: ')+pick(s.title,lang)+' ↗';host.append(a);});
function appendInline(parent,line){
 // Never inject model HTML. Only allow known source hosts and this site's own paths.
 const allowed=new Set(['sam.gov','www.irs.gov','www.pa.gov','www.gsa.gov','www.ftc.gov','www.consumerfinance.gov','www.annualcreditreport.com','www.dnb.com','www.experian.com']);
 const pattern=/(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\))/g;let last=0,m;
 while((m=pattern.exec(line))){parent.append(document.createTextNode(line.slice(last,m.index)));if(m[2]){const b=document.createElement('strong');b.textContent=m[2];parent.append(b);}else{let url;try{url=new URL(m[4],location.origin);}catch{}if(url&&((url.origin===location.origin&&url.pathname.startsWith('/'))||(url.protocol==='https:'&&allowed.has(url.hostname)))){const a=document.createElement('a');a.href=url.href;a.textContent=m[3];if(url.origin!==location.origin){a.target='_blank';a.rel='noopener noreferrer';}parent.append(a);}else parent.append(document.createTextNode(m[3]));}last=pattern.lastIndex;}parent.append(document.createTextNode(line.slice(last)));
}
function renderText(parent,text){parent.replaceChildren();let list=null;for(const line of text.split('\n')){if(!line.trim()){list=null;continue;}const bullet=line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.+)$/);if(bullet){if(!list){list=document.createElement('ul');parent.append(list);}const li=document.createElement('li');appendInline(li,bullet[1]);list.append(li);}else{list=null;const p=document.createElement('p');appendInline(p,line.replace(/^#{1,4}\s+/,''));parent.append(p);}}}
function scrollLog(force=false){if(force||log.scrollHeight-log.scrollTop-log.clientHeight<160)log.scrollTop=log.scrollHeight;}
function message(role,text,label=''){
 const outer=document.createElement('div');outer.className='chat-msg '+role;const tag=document.createElement('div');tag.className='msg-label';tag.textContent=label||(role==='user'?tr('Tú','You'):'Niklaus');const body=document.createElement('div');body.className='msg-body';renderText(body,text);outer.append(tag,body);log.append(outer);scrollLog(true);return{outer,body,tag};
}
function addCopy(msg,text){const b=document.createElement('button');b.type='button';b.className='msg-copy';b.textContent=tr('Copiar respuesta','Copy answer');b.addEventListener('click',()=>copy(text));msg.outer.append(b);}
function modeLabel(){
 const label=mode==='connected'?tr('IA · respuesta recibida de Groq','AI · response received from Groq'):mode==='configured'?tr('IA configurada · conexión por comprobar','AI configured · connection not yet checked'):tr('Guía local · IA no disponible','Local guide · AI unavailable');
 $('[data-chat-mode]',chatRoot).textContent=label;
}
async function detectMode(){
 if(statusPromise)return statusPromise;
 if(Date.now()-lastStatusAt<30000)return mode;
 statusPromise=(async()=>{try{
  const res=await fetch('/api/niklaus-status',{signal:AbortSignal.timeout(5000),cache:'no-store'});
  if(!res.ok)throw Error();const d=await res.json();
  if(d.configured===true){if(mode!=='connected')mode='configured';statusReason='';}
  else {mode='guide';statusReason=d.reason||'not_configured';}
 }catch{mode='guide';statusReason='unavailable';}
 lastStatusAt=Date.now();modeLabel();return mode;
 })().finally(()=>{statusPromise=null;});return statusPromise;
}
function suggestions(){
 const host=document.createElement('div');host.className='chat-suggestions';
 for(const [text,question]of [[tr('Crear empresa','Form a business'),tr('¿Qué necesito para crear una LLC?','What do I need to form an LLC?')],['SAM.gov',tr('¿Cómo registro o renuevo mi empresa en SAM.gov?','How do I register or renew my business in SAM.gov?')],[tr('Crédito empresarial','Business credit'),tr('Quiero construir crédito empresarial. ¿Por dónde empiezo?','I want to build business credit. Where should I start?')],[tr('Crédito personal','Personal credit'),tr('¿Cuál es la diferencia entre construir y reparar crédito personal?','What is the difference between building and repairing personal credit?')]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>sendMessage(question));host.append(b);}log.append(host);
}
function initialize(){if(initialized)return;initialized=true;message('assistant',tr('Hola, soy Niklaus, el asistente de Rivera. Puedo ayudarte a entender servicios y organizar tus próximos pasos. ¿Qué te gustaría lograr?','Hi, I’m Niklaus, Rivera’s assistant. I can help you understand services and organize your next steps. What would you like to achieve?'));suggestions();detectMode();}
function openChat(question=''){
 closeMenu();if(inline){inline.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}else{lastFocus=document.activeElement;if(contactDialog.open)contactDialog.close();if(!chatDialog.open)chatDialog.showModal();syncLock();}
 initialize();if(question)sendMessage(question);else input.focus({preventScroll:true});
}
$$('[data-chat]').forEach(b=>b.addEventListener('click',()=>openChat(b.dataset.question||'')));
$('[data-close-chat]')?.addEventListener('click',()=>chatDialog.close());
function setBusy(value){busy=value;send.innerHTML=value?icons.stop:icons.send;send.setAttribute('aria-label',value?tr('Detener respuesta','Stop response'):tr('Enviar mensaje','Send message'));input.setAttribute('aria-busy',String(value));}
function resetChat(){if(history.length&&!confirm(tr('¿Borrar esta conversación de la pestaña y empezar de nuevo?','Clear this conversation from the tab and start again?')))return;epoch++;chatController?.abort();chatController=null;history=[];lastStatusAt=0;log.replaceChildren();initialized=false;setBusy(false);status.textContent='';initialize();input.focus();}
$('[data-reset-chat]',chatRoot)?.addEventListener('click',resetChat);
$('[data-handoff]',chatRoot)?.addEventListener('click',()=>openContact(document.body.dataset.context));
function addSource(msg,event){try{const u=new URL(event.url);if(u.protocol!=='https:'||!sources.some(s=>s.url===u.href))return;const a=document.createElement('a');a.className='chat-source';a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=event.name+' · '+(event.live?tr('consultada ahora','checked now'):tr('referencia; consulta en vivo no disponible','reference; live lookup unavailable'));msg.outer.append(a);}catch{}}
async function guideReply(text,reason=''){
 if(reason)message('assistant',reason,tr('Estado del servicio','Service status'));
 mode='guide';lastStatusAt=0;modeLabel();const result=localGuide(text,document.body.dataset.context,lang);const msg=message('assistant',result,tr('Guía local · respuesta informativa','Local guide · informational response'));addCopy(msg,result);history.push({role:'assistant',content:result});
}
const errorLabels={
 not_configured:tr('La IA aún no está configurada. Puedes usar la guía local o hablar con el equipo.','AI has not been configured yet. You can use the local guide or contact the team.'),
 disabled:tr('La IA está desactivada. La guía local sigue disponible.','AI is switched off. The local guide remains available.'),
 authentication:tr('El proveedor no aceptó la credencial del servidor. El equipo debe revisar su configuración.','The provider did not accept the server credential. The team needs to review its configuration.'),
 model:tr('El modelo seleccionado no está disponible. El equipo debe revisar la configuración de Groq.','The selected model is unavailable. The team needs to review its Groq configuration.'),
 provider_request:tr('El proveedor rechazó la configuración de la solicitud. El equipo debe revisarla.','The provider rejected the request configuration. The team needs to review it.'),
 quota:tr('Se alcanzó un límite temporal de IA. Usa la guía local o contacta al equipo; puedes volver a intentarlo más tarde.','A temporary AI limit was reached. Use the local guide or contact the team; you can try again later.'),
 unavailable:tr('No se pudo conectar con la IA. Puedes usar la guía local o contactar al equipo.','Could not connect to AI. You can use the local guide or contact the team.'),
 timeout:tr('La respuesta tardó demasiado y se interrumpió. Puedes volver a intentarlo.','The response took too long and was interrupted. You can try again.'),
 empty:tr('La IA no devolvió una respuesta. Puedes volver a intentarlo.','AI did not return an answer. You can try again.'),
 interrupted:tr('La conexión terminó antes de completar la respuesta. No la consideres completa.','The connection ended before the answer was complete. Do not treat it as complete.'),
 truncated:tr('La respuesta alcanzó su límite de longitud. Puedes pedir que continúe.','The response reached its length limit. You can ask it to continue.')
};
async function sendMessage(raw){
 const text=String(raw||'').trim();if(!text||busy)return;if(text.length>2500){toast(tr('Escribe un mensaje de hasta 2500 caracteres.','Please use up to 2500 characters.'));return;}
 if(hasSensitiveData(text)){toast(tr('Retira SSN, números financieros o contraseñas antes de enviar.','Remove SSNs, financial numbers or passwords before sending.'));return;}
 initialize();$$('.chat-suggestions',log).forEach(n=>n.remove());message('user',text);history.push({role:'user',content:text});history=history.slice(-18);input.value='';input.style.height='auto';setBusy(true);status.textContent=tr('Preparando respuesta…','Preparing a response…');
 const turnId=++epoch;let msg=null,answer='',done=false,streamError='',notice='';const currentController=new AbortController();chatController=currentController;
 const pacer=createTextPacer({signal:currentController.signal,render(value){
  if(turnId!==epoch||!msg)return;
  const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<160;
  renderText(msg.body,value);if(nearBottom)scrollLog(true);
 }});
 try{
  await detectMode();if(turnId!==epoch)return;if(currentController.signal.aborted)return;
  if(!['configured','connected'].includes(mode)){await guideReply(text,errorLabels[statusReason]||errorLabels.unavailable);return;}
  const payload=[];let total=0;for(const original of history.toReversed()){const m={role:original.role,content:original.content.slice(0,4800)};if(total+m.content.length>18000)break;payload.unshift(m);total+=m.content.length;}
  const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:payload,lang,context:document.body.dataset.context}),signal:AbortSignal.any([currentController.signal,AbortSignal.timeout(52000)])});
  if(turnId!==epoch)return;
  if(!res.ok){let err={};try{err=await res.json();}catch{}if(turnId!==epoch)return;if(err.error==='sensitive'){history.pop();message('assistant',tr('Retira la información sensible antes de continuar.','Remove sensitive information before continuing.'));return;}await guideReply(text,res.status===429?errorLabels.quota:(errorLabels[err.error]||errorLabels.unavailable));return;}
  for await(const event of readSSE(res.body,currentController.signal)){
   if(turnId!==epoch)return;if(currentController.signal.aborted)break;
   if(event.type==='status'){status.textContent=event.key==='source'?tr('Consultando una fuente seleccionada…','Checking a selected source…'):event.key==='tool'?tr('Preparando información con una herramienta…','Preparing information with a tool…'):tr('Preparando respuesta…','Preparing a response…');}
   if(event.type==='delta'&&typeof event.text==='string'&&event.text.length>0){mode='connected';modeLabel();if(!msg)msg=message('assistant','');answer+=event.text;pacer.push(event.text);status.textContent=tr('Escribiendo…','Writing…');}
   if(event.type==='source'){if(!msg)msg=message('assistant','');addSource(msg,event);}
   if(event.type==='calculation'){if(!msg)msg=message('assistant','');const c=document.createElement('div');c.className='chat-calculation';c.textContent=tr('Utilización calculada: ','Calculated utilization: ')+event.percent+'% · '+event.balance+' / '+event.limit;msg.outer.append(c);}
   if(event.type==='notice'){notice=errorLabels[event.key]||'';}
   if(event.type==='error'){streamError=event.key||'unavailable';done=false;break;}
   if(event.type==='done')done=true;
  }
  answer=await pacer.end();if(turnId!==epoch)return;
  if(currentController.signal.aborted){done=false;notice=tr('Respuesta detenida.','Response stopped.');}
  else if(!done&&!streamError)streamError='interrupted';
  if(answer){
   history.push({role:'assistant',content:answer+(done?'':tr('\n[Respuesta interrumpida]','\n[Response interrupted]'))});addCopy(msg,answer);
   if(streamError||notice){const p=document.createElement('p');p.className='notice';p.textContent=errorLabels[streamError]||notice;msg.outer.append(p);}
  }else if(!currentController.signal.aborted){
   if(msg)msg.outer.remove();await guideReply(text,errorLabels[streamError]||errorLabels.empty);
  }
 }catch(e){
  answer=pacer.stop();if(turnId!==epoch)return;
  const reason=currentController.signal.aborted?tr('Respuesta detenida.','Response stopped.'):e.name==='TimeoutError'?errorLabels.timeout:errorLabels.unavailable;
  if(answer){history.push({role:'assistant',content:answer+tr('\n[Respuesta interrumpida]','\n[Response interrupted]')});addCopy(msg,answer);message('assistant',reason,tr('Estado del servicio','Service status'));}
  else if(!currentController.signal.aborted){if(msg)msg.outer.remove();await guideReply(text,reason);}
  notice=reason;
 }
 finally{pacer.stop();if(turnId===epoch&&chatController===currentController){setBusy(false);status.textContent=currentController.signal.aborted?tr('Respuesta detenida.','Response stopped.'):notice;chatController=null;}scrollLog();}
}
$('[data-chat-form]',chatRoot)?.addEventListener('submit',e=>{e.preventDefault();if(busy){chatController?.abort();return;}sendMessage(input.value);});
input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,130)+'px';});
input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!matchMedia('(pointer: coarse)').matches){e.preventDefault();if(!busy)sendMessage(input.value);}});
bindChatViewport(chatRoot,input);
if(inline)initialize();

const reviewForm=document.querySelector('[data-review-form]');
reviewForm?.addEventListener('submit',event=>{
 const text=reviewForm.elements.review.value,name=reviewForm.elements['public-name'].value;
 const error=reviewForm.querySelector('[data-review-error]');
 const publicText=name+' '+text;
 if(name.trim().length<2||text.trim().length<20||hasSensitiveData(publicText)||/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(publicText)){
  event.preventDefault();error.textContent=tr('Usa al menos 2 caracteres para el nombre y 20 para tu experiencia. Retira datos privados del nombre o comentario; tu correo debe ir únicamente en el campo privado.','Use at least 2 characters for your name and 20 for your experience. Remove private information from your public name or review; your email belongs only in the private email field.');error.hidden=false;error.focus();
 }else error.hidden=true;
});

reviewForm?.addEventListener('input',()=>{reviewForm.querySelector('[data-review-error]').hidden=true;});
