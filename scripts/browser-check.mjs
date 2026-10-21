import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const out=process.env.TEST_OUTPUT_DIR?new URL('file://'+process.env.TEST_OUTPUT_DIR.replace(/\/$/,'')+'/'):new URL('../artifacts/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY}}:{}),...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
const results=[],errors=[];let accessibility=[];
const check=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name);};
try{
 const context=await browser.newContext({ignoreHTTPSErrors:process.env.TEST_IGNORE_HTTPS_ERRORS==='1',viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const goto=p=>page.goto(base+p);
 const theme=t=>page.locator(`[data-theme-choice=${t}]`).click();
 await check('42 bilingual routes, 404, sitemap, robots and redirects over HTTP',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../dist/build-manifest.json',import.meta.url)));
  assert.equal(manifest.routes.length,42);
  for(const route of manifest.routes){const r=await context.request.get(base+new URL(route.url).pathname);assert.equal(r.status(),200);assert.ok((await r.text()).includes(`lang="${route.lang}"`));}
  assert.equal((await context.request.get(base+'/not-a-page')).status(),404);
  assert.equal((await context.request.get(base+'/sitemap.xml')).status(),200);
  assert.ok((await (await context.request.get(base+'/robots.txt')).text()).includes('Disallow: /api/'));
  const old=await context.request.get(base+'/privacy',{maxRedirects:0});assert.equal(old.status(),301);assert.equal(old.headers().location,'/privacidad/');
 });
 await check('theme persistence, keyboard selection, cross-tab sync and translated controls',async()=>{
  await goto('/');await page.locator('[data-theme-choice=dark]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('[data-theme-choice=dark]').getAttribute('aria-pressed'),'true');
  await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('.language').click();assert.ok(page.url().endsWith('/en/'));assert.equal(await page.locator('[data-theme-choice=light]').textContent(),'Light');
  const second=await context.newPage();await second.goto(base+'/');await theme('light');await second.waitForFunction(()=>document.documentElement.dataset.theme==='light');await second.close();
 });
 await check('system preference, no-storage fallback and theme set before first body frame',async()=>{
  const c=await browser.newContext({ignoreHTTPSErrors:process.env.TEST_IGNORE_HTTPS_ERRORS==='1',colorScheme:'dark'});const p=await c.newPage();
  await p.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}});window.firstBodyFrame=new Promise(resolve=>{function watch(){if(document.body)resolve({theme:document.documentElement.dataset.theme,bg:getComputedStyle(document.body).backgroundColor});else requestAnimationFrame(watch);}requestAnimationFrame(watch);});});
  await p.goto(base+'/');const first=await p.evaluate(()=>window.firstBodyFrame);assert.equal(first.theme,'dark');assert.equal(first.bg,'rgb(32, 33, 31)');
  await p.locator('[data-theme-choice=light]').click();assert.equal(await p.locator('html').getAttribute('data-theme'),'light');
  await p.emulateMedia({colorScheme:'dark'});assert.equal(await p.locator('html').getAttribute('data-theme'),'light');await c.close();
 });
 await check('responsive layouts at 320, 390, 768, 1024, 1366 and 1920 pixels in both themes',async()=>{
  for(const width of [320,390,768,1024,1366,1920])for(const mode of ['light','dark'])for(const path of ['/','/en/','/sam-gov/','/contacto/','/niklaus/','/en/privacidad/']){
   await page.setViewportSize({width,height:900});await goto(path);await theme(mode);
   const size=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,width:innerWidth}));assert.ok(size.doc<=size.width+1,`${width} ${mode} ${path}: horizontal overflow ${size.doc}`);
   assert.ok(await page.locator('[data-theme-choice=light]').isVisible());assert.ok(await page.locator('[data-theme-choice=dark]').isVisible());
  }
 });
 await check('axe WCAG A/AA checks on six representative routes in both themes',async()=>{
  await page.setViewportSize({width:1366,height:900});
  for(const mode of ['light','dark'])for(const path of ['/','/en/','/sam-gov/','/contacto/','/niklaus/','/en/privacidad/']){
   await goto(path);await theme(mode);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   accessibility.push({path,mode,violations:result.violations,incomplete:result.incomplete.map(x=>({id:x.id,impact:x.impact}))});
   assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${path} ${mode}`);
  }
 });
 await check('keyboard dropdown, mobile menu and focus restoration',async()=>{
  await page.setViewportSize({width:1440,height:900});await goto('/');const summary=page.locator('.navgroup summary').first();await summary.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.navgroup').first().getAttribute('open'),'');await page.keyboard.press('Escape');assert.equal(await page.locator('.navgroup').first().getAttribute('open'),null);
  await page.setViewportSize({width:390,height:844});const menu=page.locator('.menu-toggle');await menu.focus();await page.keyboard.press('Enter');assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.locator('#mobile-nav a').first().focus();await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.ok(await menu.evaluate(n=>n===document.activeElement));
 });
 await check('contact service context, keyboard dialog focus and dark dialog contrast',async()=>{
  await page.setViewportSize({width:390,height:844});await goto('/sam-gov/');await theme('dark');const button=page.locator('.quote-aside [data-contact]').first();await button.click();
  assert.ok(await page.locator('#contact-dialog').evaluate(d=>d.open));
  for(const key of ['whatsapp','sms','email'])assert.ok(decodeURIComponent(await page.locator(`[data-contact-link=${key}]`).getAttribute('href')).includes('SAM.gov'));
  for(let i=0;i<8;i++)await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('#contact-dialog').contains(document.activeElement)));
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);
  await page.screenshot({path:new URL('contact-dark-mobile.png',out).pathname});await page.keyboard.press('Escape');assert.ok(await button.evaluate(n=>n===document.activeElement));
 });
 await check('simulated missing key shows explicitly identified local guide',async()=>{
  await page.route('**/api/niklaus-status',r=>r.fulfill({json:{mode:'guide',configured:false,connection:'unchecked',reason:'not_configured'}}));
  await goto('/niklaus/');await page.locator('[data-chat-input]').fill('Quiero información sobre una LLC');await page.locator('[data-chat-send]').click();
  await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');assert.match(await page.locator('[data-chat-log]').textContent(),/Guía local/);await page.unroute('**/api/niklaus-status');
 });
 await check('configuration is not connection; simulated chat errors fall back and recover',async()=>{
  await page.route('**/api/niklaus-status',r=>r.fulfill({json:{mode:'configured',configured:true,connection:'unchecked',reason:null}}));
  for(const [key,expected] of [['authentication','credencial'],['model','modelo seleccionado'],['quota','límite temporal'],['timeout','tardó demasiado'],['provider_request','configuración de la solicitud']]){
   await page.route('**/api/chat',r=>r.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'error',key})}\n\n`}));
   await goto('/niklaus/');await page.waitForFunction(()=>document.querySelector('[data-chat-mode]').textContent.includes('por comprobar'));
   await page.locator('[data-chat-input]').fill('Explica SAM.gov');await page.locator('[data-chat-send]').click();await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');
   assert.ok((await page.locator('[data-chat-log]').textContent()).includes(expected));assert.match(await page.locator('[data-chat-log]').textContent(),/Guía local/);await page.unroute('**/api/chat');
  }
  await page.route('**/api/chat',r=>r.fulfill({contentType:'text/event-stream',body:'data: {"type":"delta","text":"<img src=x onerror=alert(1)> Safe answer"}\n\ndata: {"type":"done"}\n\n'}));
  await page.locator('[data-chat-input]').fill('Inténtalo de nuevo');await page.locator('[data-chat-send]').click();await page.waitForFunction(()=>document.querySelector('[data-chat-mode]').textContent.includes('respuesta recibida'));
  await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');
  assert.equal(await page.locator('.msg-body img').count(),0);assert.ok((await page.locator('[data-chat-log]').textContent()).includes('<img'));await page.unroute('**/api/chat');
 });
 await check('empty provider deltas never claim an AI answer was received',async()=>{
  await page.route('**/api/chat',r=>r.fulfill({contentType:'text/event-stream',body:'data: {"type":"delta","text":""}\n\ndata: {"type":"done"}\n\n'}));
  await goto('/niklaus/');await page.evaluate(()=>{window.auditModes=[];new MutationObserver(()=>window.auditModes.push(document.querySelector('[data-chat-mode]').textContent)).observe(document.querySelector('[data-chat-mode]'),{childList:true,subtree:true});});
  await page.locator('[data-chat-input]').fill('Explica LLC');await page.locator('[data-chat-send]').click();await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');
  assert.ok(!(await page.evaluate(()=>window.auditModes)).some(label=>label.includes('respuesta recibida')));assert.match(await page.locator('[data-chat-log]').textContent(),/no devolvió una respuesta/);await page.unroute('**/api/chat');
 });
 await check('burst SSE is paced and queued text stops or resets immediately',async()=>{
  const reply='Una respuesta que llega en un solo bloque. '.repeat(20);
  await page.route('**/api/chat',r=>r.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'delta',text:reply})}\n\ndata: {"type":"done"}\n\n`}));
  await goto('/niklaus/');await page.locator('[data-chat-input]').fill('Explica LLC');await page.locator('[data-chat-send]').click();
  await page.waitForFunction(()=>document.querySelector('.chat-msg.assistant:last-child .msg-body')?.textContent.length>0);
  const body=page.locator('.chat-msg.assistant').last().locator('.msg-body');
  const initial=(await body.textContent()).length;await page.waitForTimeout(250);const later=(await body.textContent()).length;
  assert.ok(later>initial&&later<reply.length/2);assert.equal(await page.locator('[data-chat-input]').getAttribute('aria-busy'),'true');
  await page.getByRole('button',{name:'Detener respuesta',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');
  const held=await body.textContent();await page.waitForTimeout(300);assert.equal(await body.textContent(),held);
  await page.locator('[data-chat-input]').fill('Otra vez');await page.locator('[data-chat-send]').click();await page.waitForTimeout(200);
  page.once('dialog',d=>d.accept());await page.locator('[data-reset-chat]').click();await page.waitForTimeout(300);assert.ok(!(await page.locator('[data-chat-log]').textContent()).includes('Una respuesta'));
  await page.unroute('**/api/chat');
 });
 await check('stop works with empty input; reset prevents stale answers',async()=>{
  await page.route('**/api/chat',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.fulfill({contentType:'text/event-stream',body:'data: {"type":"delta","text":"STALE_RESPONSE_MARKER"}\n\ndata: {"type":"done"}\n\n'}).catch(()=>{});});
  await goto('/niklaus/');await page.locator('[data-chat-input]').fill('Tell me about EIN');await page.locator('[data-chat-send]').click();await page.getByRole('button',{name:'Detener respuesta',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-chat-input]').getAttribute('aria-busy')==='false');assert.match(await page.locator('[data-chat-status]').textContent(),/detenida/);
  await page.locator('[data-chat-input]').fill('Otra pregunta');await page.locator('[data-chat-send]').click();page.once('dialog',d=>d.accept());await page.locator('[data-reset-chat]').click();await page.waitForTimeout(1500);assert.ok(!(await page.locator('[data-chat-log]').textContent()).includes('STALE_RESPONSE_MARKER'));await page.unroute('**/api/chat');
 });
 await check('continuous motion, pause, resume and reduced motion',async()=>{
  await goto('/');assert.equal(await page.locator('[data-scale-animate]').getAttribute('data-motion'),'settled');assert.equal(await page.locator('[data-scale-animate] [data-scale-base]').getAttribute('transform'),null);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.waitForTimeout(250);assert.equal(await page.locator('[data-scale-animate]').getAttribute('data-motion'),'running');assert.match(await page.locator('[data-scale-animate] [data-scale-beam]').getAttribute('transform'),/rotate/);assert.equal(await page.locator('[data-scale-animate] [data-scale-base]').getAttribute('transform'),null);
  assert.notEqual(await page.locator('[data-scale-animate] [data-scale-pan=left]').getAttribute('transform'),await page.locator('[data-scale-animate] [data-scale-beam]').getAttribute('transform'));
  const beam=page.locator('[data-scale-animate] [data-scale-beam]');
  await page.waitForTimeout(3400);assert.equal(await page.locator('[data-scale-animate]').getAttribute('data-motion'),'running');
  const before=await beam.getAttribute('transform');await page.waitForTimeout(400);assert.notEqual(await beam.getAttribute('transform'),before);
  await page.getByRole('button',{name:'Pausar animación',exact:true}).click();const held=await beam.getAttribute('transform');await page.waitForTimeout(350);assert.equal(await beam.getAttribute('transform'),held);
  await page.getByRole('button',{name:'Reanudar animación',exact:true}).click();await page.waitForTimeout(350);assert.notEqual(await beam.getAttribute('transform'),held);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-scale-animate]').dataset.motion==='settled');assert.equal(await beam.getAttribute('transform'),null);assert.equal(await page.locator('[data-scale-toggle]').isVisible(),false);
  await page.emulateMedia({reducedMotion:'no-preference'});await goto('/en/');await page.getByRole('button',{name:'Pause animation',exact:true}).click();await page.getByRole('button',{name:'Resume animation',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.querySelector('[data-scale-animate]').dataset.motion==='paused');
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('[data-scale-animate]').dataset.motion==='running');
  await page.emulateMedia({reducedMotion:'reduce'});
 });
 await check('skip link and 200 percent text enlargement',async()=>{
  await page.setViewportSize({width:1280,height:900});await goto('/');await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('[data-theme-choice=dark]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.reload();
 });
 await check('mobile visual viewport keeps modal and inline composers above simulated keyboard',async()=>{
  const c=await browser.newContext({ignoreHTTPSErrors:process.env.TEST_IGNORE_HTTPS_ERRORS==='1',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await c.addInitScript(()=>{
   const viewport=new EventTarget();Object.assign(viewport,{height:844,width:390,offsetTop:0,offsetLeft:0,scale:1});
   Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
   window.setTestViewport=(height,top=0,scale=1)=>{Object.assign(viewport,{height,offsetTop:top,scale});viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));};
  });
  const p=await c.newPage();
  for(const path of ['/','/en/niklaus/']){
   await p.goto(base+path);if(path==='/')await p.locator('[data-chat]').first().click();
   const root=p.locator(path==='/'?'#chat-dialog':'#inline-chat');
   await root.locator('[data-chat-input]').fill('Texto visible / Visible text');
   await p.evaluate(()=>window.setTestViewport(390,65));await p.waitForFunction(()=>document.querySelector('.viewport-fit'));
   await p.waitForTimeout(100);
   const boxes=await root.evaluate(n=>{const box=e=>{const r=e.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height};};return{root:box(n),input:box(n.querySelector('textarea')),send:box(n.querySelector('[data-chat-send]')),log:box(n.querySelector('[data-chat-log]'))};});
   assert.ok(Math.abs(boxes.root.top-65)<2);assert.ok(boxes.input.top>=65&&boxes.input.bottom<=455);assert.ok(boxes.send.bottom<=455);assert.ok(boxes.log.height>0);
   await root.locator('[data-chat-input]').fill('Line\n'.repeat(12));assert.ok((await root.locator('textarea').boundingBox()).height<=79);
   await p.screenshot({path:new URL(path==='/'?'keyboard-modal-simulated.png':'keyboard-inline-simulated.png',out).pathname});
   await p.setViewportSize({width:844,height:390});await p.evaluate(()=>window.setTestViewport(250,20));await p.waitForTimeout(100);
   const landscape=await root.locator('[data-chat-send]').boundingBox();assert.ok(landscape.y>=20&&landscape.y+landscape.height<=270);
   await p.setViewportSize({width:390,height:844});
   await p.evaluate(()=>window.setTestViewport(844));await p.waitForTimeout(100);
   if(path!=='/')assert.equal(await root.evaluate(n=>n.classList.contains('viewport-fit')),false);
   await p.evaluate(()=>window.setTestViewport(390,65,2));await p.waitForTimeout(100);assert.equal(await root.evaluate(n=>n.classList.contains('viewport-fit')),false);
  }
  await c.close();
 });
 await check('bilingual review forms, consent, privacy checks and simulated Netlify submission',async()=>{
  for(const path of ['/resenas/','/en/resenas/']){
   await page.setViewportSize({width:390,height:844});await goto(path);
   const form=page.locator('[data-review-form]');let submissions=0,body='';
   await page.route('**/resenas/gracias/',async r=>{if(r.request().method()==='POST'){submissions++;body=r.request().postData();await r.fulfill({status:303,headers:{location:new URL(path+'gracias/',base).href}});}else await r.continue();});
   await form.locator('[type=submit]').click();assert.equal(submissions,0);
   await form.locator('[name=public-name]').fill('Test fixture');await form.locator('[name=email]').fill('fixture@example.com');await form.locator('[name=service]').selectOption('formation');await form.locator('[name=rating][value="1"]').check();await form.locator('[name=review]').fill('Synthetic form test only, not a real customer review.');
   await form.locator('[type=submit]').click();assert.equal(submissions,0);
   await form.locator('[name=consent]').check();await form.locator('[name=review]').fill('Synthetic test with private email fixture@example.com');await form.locator('[type=submit]').click();assert.equal(submissions,0);assert.equal(await form.locator('[data-review-error]').isVisible(),true);
   await form.locator('[name=review]').fill('Synthetic form test only, not a real customer review.');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const mode of ['light','dark']){await theme(mode);const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);}
   await page.screenshot({path:new URL(path.startsWith('/en')?'reviews-en-mobile.png':'reviews-es-mobile.png',out).pathname,fullPage:true});
   await form.locator('[type=submit]').click();await page.waitForURL('**/resenas/gracias/');assert.equal(submissions,1);const values=new URLSearchParams(body);assert.equal(values.get('rating'),'1');assert.equal(values.get('consent'),'accepted');assert.equal(values.get('email'),'fixture@example.com');assert.equal(values.get('bot-field'),'');assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');await page.unroute('**/resenas/gracias/');
  }
 });
 await check('screenshots and no uncaught browser exceptions',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const mode of ['light','dark']){await page.setViewportSize({width:1440,height:1000});await goto('/');await theme(mode);await page.screenshot({path:new URL(`home-${mode}.png`,out).pathname,fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL(`mobile-${mode}.png`,out).pathname,fullPage:true});await goto('/en/niklaus/');await page.screenshot({path:new URL(`niklaus-${mode}.png`,out).pathname,fullPage:true});}
  assert.deepEqual(errors,[]);
 });
 await context.close();
}finally{
 await writeFile(new URL('browser-report.json',out),JSON.stringify({timestamp:new Date().toISOString(),browser:browser.version(),passed:results,accessibility,browserErrors:errors},null,2));await browser.close();
}
console.log(`${results.length} browser groups passed. Provider responses were simulated; no live AI evaluation.`);
