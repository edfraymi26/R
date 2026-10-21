import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../assets/theme.js',import.meta.url),'utf8');
function page({saved=null,systemDark=false,blocked=false}={}){
 const docEvents={},windowEvents={},mediaEvents={},store=new Map(saved?[['rivera-appearance',saved]]:[]),root={dataset:{}};
 const buttons=['light','dark'].map(theme=>({dataset:{themeChoice:theme},attributes:{},events:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.events[k]=fn;}}));
 const meta={setAttribute(k,v){this[k]=v;}},media={matches:systemDark,addEventListener(k,fn){mediaEvents[k]=fn;}};
 vm.runInNewContext(script,{document:{documentElement:root,querySelector:()=>meta,querySelectorAll:()=>buttons,addEventListener:(k,fn)=>docEvents[k]=fn},window:{addEventListener:(k,fn)=>windowEvents[k]=fn},matchMedia:()=>media,localStorage:{getItem:k=>{if(blocked)throw Error();return store.get(k);},setItem:(k,v)=>{if(blocked)throw Error();store.set(k,v);}}});
 return {root,buttons,meta,media,store,docEvents,windowEvents,mediaEvents};
}
test('saved theme beats system preference and is applied before DOM ready',()=>{const p=page({saved:'light',systemDark:true});assert.equal(p.root.dataset.theme,'light');assert.equal(p.meta.content,'#F3F0EA');p.docEvents.DOMContentLoaded();assert.equal(p.buttons[0].attributes['aria-pressed'],'true');});
test('blocked or invalid storage uses system theme; manual choice still works',()=>{for(const options of [{blocked:true,systemDark:true},{saved:'unexpected',systemDark:true}]){const p=page(options);assert.equal(p.root.dataset.theme,'dark');p.docEvents.DOMContentLoaded();p.buttons[0].events.click();assert.equal(p.root.dataset.theme,'light');p.mediaEvents.change();assert.equal(p.root.dataset.theme,'light');}});
test('system changes apply until chosen, cross-tab storage changes update controls',()=>{const p=page();p.docEvents.DOMContentLoaded();p.media.matches=true;p.mediaEvents.change();assert.equal(p.root.dataset.theme,'dark');p.buttons[0].events.click();assert.equal(p.store.get('rivera-appearance'),'light');p.windowEvents.storage({key:'rivera-appearance',newValue:'dark'});assert.equal(p.buttons[1].attributes['aria-pressed'],'true');p.windowEvents.storage({key:'rivera-appearance',newValue:null});assert.equal(p.root.dataset.theme,'dark');});
