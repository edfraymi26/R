// iOS keyboards shrink the visual viewport, not necessarily 100dvh.
export function bindChatViewport(root,input){
 if(!root||!input||!window.visualViewport)return;
 const viewport=window.visualViewport,mobile=matchMedia('(max-width: 700px), (pointer: coarse)');
 let frame=0,baseline=window.innerHeight,lastWidth=window.innerWidth;
 const inline=root.classList.contains('inline-chat');
 function update(){
  frame=0;
  // Do not fight pinch zoom or change desktop layout.
  const enabled=mobile.matches&&Math.abs(viewport.scale-1)<.05;
  if(Math.abs(window.innerWidth-lastWidth)>30){baseline=window.innerHeight;lastWidth=window.innerWidth;}
  baseline=Math.max(baseline,window.innerHeight);
  const keyboard=enabled&&baseline-viewport.height>120;
  const focused=root.contains(document.activeElement);
  const fit=enabled&&(!inline||(keyboard&&focused));
  root.classList.toggle('viewport-fit',fit);
  root.classList.toggle('viewport-compact',fit&&viewport.height<450);
  root.classList.toggle('viewport-tiny',fit&&viewport.height<320);
  document.body.classList.toggle('inline-keyboard-open',inline&&fit);
  if(fit){
   root.style.setProperty('--chat-visible-height',`${viewport.height}px`);
   root.style.setProperty('--chat-visible-top',`${viewport.offsetTop}px`);
   root.style.setProperty('--chat-input-max',`${Math.min(130,Math.max(48,viewport.height*.2))}px`);
  }else{
   for(const name of ['--chat-visible-height','--chat-visible-top','--chat-input-max'])root.style.removeProperty(name);
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 viewport.addEventListener('resize',schedule);viewport.addEventListener('scroll',schedule);
 window.addEventListener('resize',schedule);mobile.addEventListener('change',schedule);
 root.addEventListener('focusin',schedule);root.addEventListener('focusout',schedule);
 window.addEventListener('orientationchange',()=>{baseline=window.innerHeight;schedule();});
 update();
}
