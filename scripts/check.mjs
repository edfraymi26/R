import {readdir,readFile,stat} from 'node:fs/promises';import {join,resolve,extname} from 'node:path';import {spawnSync} from 'node:child_process';
const root=resolve('dist');const errors=[];let pages=0,links=0;const titles=new Set();
async function walk(dir){let out=[];for(const f of await readdir(dir,{withFileTypes:true})){if(['node_modules','.git','artifacts','test-results','playwright-report'].includes(f.name))continue;const p=join(dir,f.name);out.push(...(f.isDirectory()?await walk(p):[p]));}return out;}
const files=await walk(root);
for(const file of files.filter(f=>f.endsWith('.html'))){
 pages++;const html=await readFile(file,'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);if(new Set(ids).size!==ids.length)errors.push(file+': duplicate IDs');
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)errors.push(file+': expected exactly one h1');
 for(const required of ['name="viewport"','rel="canonical"','hreflang="es"','hreflang="en"','name="description"','data-chat-form','data-contact-link="sms"','data-theme-choice="light"','data-theme-choice="dark"','/assets/theme.js'])if(!html.includes(required))errors.push(file+': missing '+required);
 if(/\son(?:click|load|error)\s*=/.test(html))errors.push(file+': inline event handler');
 for(const [_,attr,value]of html.matchAll(/\b(href|src)="([^"]*)"/g)){
  const url=value.replace(/&amp;/g,'&');if(!url){errors.push(file+': empty link');continue;}if(/^(https?:|mailto:|tel:|sms:|data:)/.test(url))continue;
  const [pathname,fragment]=url.split('#');const target=pathname?resolve(root,'.'+pathname):file;if(!target.startsWith(root))errors.push(file+': unsafe path');
  let dest=target;try{const s=await stat(dest);if(s.isDirectory())dest=join(dest,'index.html');await stat(dest);links++;if(fragment&&dest.endsWith('.html')){const t=await readFile(dest,'utf8');if(!t.includes('id="'+fragment+'"'))errors.push(file+': missing anchor '+url);}}catch{errors.push(file+': missing '+attr+' '+url);}
 }
}
for(const f of (await walk(resolve('.'))).filter(f=>['.mjs','.js'].includes(extname(f))&&!f.includes('/dist/'))){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status)errors.push('JS syntax: '+f+' '+r.stderr);}
for(const f of files){const s=await stat(f);if(s.size>500000)errors.push('Oversized static asset: '+f);const text=extname(f).match(/html|mjs|js|css|json|txt|xml/)?await readFile(f,'utf8'):'';if(/gsk_[A-Za-z0-9]{20,}/.test(text))errors.push('Potential leaked provider key: '+f);}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log(`PASS: ${pages} HTML pages; ${links} local links/assets; unique IDs; headings; SEO; language routes; JS syntax; asset budgets; no embedded provider keys.`);
