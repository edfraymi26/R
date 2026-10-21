// Continuous gentle beam rotation; the base never moves and pans counter-rotate.
const media=matchMedia('(prefers-reduced-motion: reduce)');
for(const scale of document.querySelectorAll('[data-scale-animate]')){
 const beam=scale.querySelector('[data-scale-beam]'),pans=[...scale.querySelectorAll('[data-scale-pan]')];
 const toggle=scale.parentElement.querySelector('[data-scale-toggle]');
 const english=document.documentElement.lang==='en';
 let frame=0,last=null,elapsed=0,paused=false,visible=true;
 function stop(){cancelAnimationFrame(frame);frame=0;last=null;}
 function sync(){
  stop();toggle.hidden=media.matches;
  toggle.textContent=paused?(english?'Resume animation':'Reanudar animación'):(english?'Pause animation':'Pausar animación');
  if(media.matches){beam.removeAttribute('transform');pans.forEach(p=>p.removeAttribute('transform'));scale.dataset.motion='settled';return;}
  scale.dataset.motion=paused||document.hidden||!visible?'paused':'running';
  if(scale.dataset.motion==='running')frame=requestAnimationFrame(tick);
 }
 function tick(now){
  if(last!==null)elapsed+=Math.min(now-last,100);last=now;
  const phase=elapsed/1000*Math.PI*2/5.6;
  const tilt=2.4*Math.sin(phase);
  beam.setAttribute('transform',`rotate(${tilt} 550 184)`);
  pans.forEach((pan,i)=>{const sway=.65*Math.sin(phase-.65+(i?.15:0));pan.setAttribute('transform',`rotate(${-tilt+sway})`);});
  frame=requestAnimationFrame(tick);
 }
 toggle.addEventListener('click',()=>{paused=!paused;sync();});
 media.addEventListener('change',sync);
 document.addEventListener('visibilitychange',sync);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(scale);
 sync();
}
