// Dependency-free local adapter. Production platform rate limiting is Netlify's responsibility.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Readable} from 'node:stream';
import chat from '../netlify/functions/chat.mjs';
import status from '../netlify/functions/niklaus-status.mjs';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const config=await readFile(new URL('../netlify.toml',import.meta.url),'utf8');
const redirects=[...config.matchAll(/\[\[redirects\]\]\s+from = "([^"]+)"\s+to = "([^"]+)"\s+status = (\d+)/g)].map(([,from,to,status])=>({from,to,status:Number(status)}));
const csp=config.match(/Content-Security-Policy = "([^"]+)"/)[1].replace('; upgrade-insecure-requests','');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.xml':'application/xml','.json':'application/json','.txt':'text/plain'};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',csp);res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  const handler=url.pathname==='/api/chat'?chat:url.pathname==='/api/niklaus-status'?status:null;
  if(handler){
   const controller=new AbortController();res.on('close',()=>controller.abort());
   const init={method:req.method,headers:req.headers,signal:controller.signal};
   if(!['GET','HEAD'].includes(req.method)){init.body=Readable.toWeb(req);init.duplex='half';}
   const response=await handler(new Request(url,init));res.writeHead(response.status,Object.fromEntries(response.headers));
   if(response.body)Readable.fromWeb(response.body).on('error',()=>res.destroy()).pipe(res);else res.end();return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const redirect=redirects.find(r=>r.from.endsWith('*')?url.pathname.startsWith(r.from.slice(0,-1)):r.from===url.pathname);
  if(redirect){res.writeHead(redirect.status,{Location:redirect.to});res.end();return;}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  let code=200;
  try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');await stat(file);}catch{file=path.join(root,'404.html');code=404;}
  const body=await readFile(file);res.writeHead(code,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);
 }catch{if(!res.headersSent)res.writeHead(500);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Rivera development server: port ${port}. Netlify rate limits are not emulated.`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
