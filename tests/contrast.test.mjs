import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');
function luminance(hex){const c=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const selector of [':root',':root[data-theme=dark]'])test(`${selector} text and controls meet AA contrast against their surfaces`,()=>{
 const block=css.slice(css.indexOf(selector+'{')).split('}')[0];const tokens=Object.fromEntries([...block.matchAll(/--([\w-]+):#([a-f\d]{6})/gi)].map(m=>[m[1],m[2]]));
 for(const foreground of ['ink','muted','accent'])for(const background of ['bg','surface','raised'])assert.ok(ratio(tokens[foreground],tokens[background])>=4.5,`${foreground}/${background}`);
 assert.ok(ratio(tokens['on-button'],tokens.button)>=4.5);
 for(const background of ['bg','surface','raised'])for(const foreground of ['control','focus'])assert.ok(ratio(tokens[foreground],tokens[background])>=3,`${foreground}/${background}`);
});
