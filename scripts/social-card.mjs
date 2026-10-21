// Optional asset maintenance command; generates a static card with the same scale parts.
import {chromium} from 'playwright';
import {scale} from '../src/scale.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.setContent(`<!doctype html><html><head><base href="${base}"><style>body{margin:0;background:linear-gradient(120deg,#F3F0EA,#D7EAE2);color:#272724;font-family:system-ui,sans-serif;width:1200px;height:630px;display:grid;grid-template-columns:1fr 1fr;align-items:center;box-sizing:border-box;padding:60px;gap:30px}h1{font-size:52px;line-height:1.08;letter-spacing:-2px;font-weight:650;margin:18px 0 28px}small{font-size:18px;color:#11645E;letter-spacing:2px}p{font-size:22px;color:#505E58;line-height:1.6}svg{width:100%;height:auto;filter:saturate(.32)}footer{font-size:17px;color:#505E58;margin-top:40px}</style></head><body><section><small>RIVERA FINANCIAL GROUP LLC</small><h1>Una base sólida.<br>A solid foundation.</h1><p>Empresas y crédito.<br>Business & credit.</p><footer>riverafinancialgroup.net</footer></section>${scale()}</body></html>`);
 await page.waitForFunction(()=>[...document.querySelectorAll('image')].every(i=>i.getBoundingClientRect().width>0));await page.waitForTimeout(600);
 await page.screenshot({path:new URL('../assets/social-card.png',import.meta.url).pathname});
}finally{await browser.close();}
