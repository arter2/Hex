/* Hexmancers - the opening, played once per page load over whatever the game opened on (the main menu, or
   character creation on the very first launch):
     1. the studio card (Uhh Games?, a stand-in mark) fades in, holds, fades out
     2. the Hexmancers art (the menu's hero painting and logo) fades in, holds, fades out
     3. the cover fades away to the main menu underneath
   A tap, click or any key moves on to the next page. Skipped for automated browsers (navigator.webdriver,
   so the playtest runners are not blocked) and with ?nointro in the address. */
(function(){
const el=document.getElementById('intro'); if(!el) return;
const done=()=>{ el.remove(); window.dispatchEvent(new Event('hexintro:done')); };
if(navigator.webdriver||/[?&]nointro\b/.test(location.search)){ done(); return; }

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FADE=reduced?250:900;                 // matches --in-fade in intro.css
const HOLD={inStudio:1600, inTitle:2600};   // time each page stays fully up
const pages=['inStudio','inTitle'];
let i=-1, timer=0, busy=false;

function next(){
  clearTimeout(timer);
  if(i>=0) document.getElementById(pages[i]).classList.remove('on');
  i++;
  if(i>=pages.length){ // last page has faded: fade the black cover off the menu
    busy=true; timer=setTimeout(()=>{ el.classList.add('gone'); setTimeout(done,FADE); },FADE); return; }
  busy=true;
  timer=setTimeout(()=>{ // wait for the previous page to fade to black, then bring this one up
    document.getElementById(pages[i]).classList.add('on');
    timer=setTimeout(()=>{ busy=false; timer=setTimeout(next,HOLD[pages[i]]); },FADE);
  }, i===0?200:FADE);
}
// tap or key: move on, but only once the page is fully up (so a page is never skipped half-seen)
const skip=e=>{ if(e.type==='keydown'&&(e.metaKey||e.ctrlKey||e.altKey)) return; e.preventDefault(); e.stopPropagation(); if(!busy) next(); };
el.addEventListener('pointerdown',skip);
const key=e=>{ if(!document.body.contains(el)){ removeEventListener('keydown',key,true); return; } skip(e); };
addEventListener('keydown',key,true);

// start once the title art is ready, so page two never pops in half-loaded (never wait more than 1.5 s)
const img=el.querySelector('.in-scene'); let started=false; const go=()=>{ if(!started){ started=true; next(); } };
if(img&&!img.complete){ img.addEventListener('load',go,{once:true}); img.addEventListener('error',go,{once:true}); setTimeout(go,1500); } else go();
})();
