// Blocking head script: apply preference before CSS and the first body paint.
(()=>{
 const key='rivera-appearance',root=document.documentElement;
 const media=matchMedia('(prefers-color-scheme: dark)');
 let stored=null;
 try{const value=localStorage.getItem(key);if(value==='light'||value==='dark')stored=value;}catch{}
 function apply(theme){
  root.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#20211F':'#F3F0EA');
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
 }
 apply(stored||(media.matches?'dark':'light'));
 document.addEventListener('DOMContentLoaded',()=>{
  apply(root.dataset.theme);
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{
   stored=button.dataset.themeChoice;apply(stored);try{localStorage.setItem(key,stored);}catch{}
  }));
 });
 media.addEventListener('change',()=>{if(!stored)apply(media.matches?'dark':'light');});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){stored=['light','dark'].includes(event.newValue)?event.newValue:null;apply(stored||(media.matches?'dark':'light'));}});
})();
