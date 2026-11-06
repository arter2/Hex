/* Hexmancers - Settings laid out as the menu kit's screen 11: Display / Audio / Controls / Game tabs.
   It only moves the game's own setting rows into tabs and dresses their controls: every button keeps its
   own handler and text (keys.js, explore.js, rune.js, menu.js...). A button whose text reads On/Off is
   drawn as a switch; any other cycling button as a field with a down arrow. Each row shows the first
   sentence of its note; the whole note is its tooltip. Display ends with a live text-size preview. */
(function(){
const q=s=>document.querySelector(s), panel=q('#settings .panel.settings'); if(!panel) return;
const TABS=[['display','Display'],['audio','Audio'],['controls','Controls'],['game','Game']];
// which tab each control's row belongs to (by the control's id or class); anything else goes to Game
const HOME={layoutBtn:'display',setOrient:'display',setText:'display',setFull:'display',setCastFx:'display',setHud:'display',setRune:'display',
  setSfx:'audio',setMusic:'audio',setXMove:'controls',setFire:'controls',setInst:'controls',setHand:'controls'};
const bar=panel.querySelector('.bar'), tabs=document.createElement('div'); tabs.className='settabs'; tabs.setAttribute('role','tablist');
tabs.innerHTML=TABS.map(([k,n])=>`<button class="btn ghost settab" role="tab" data-tab="${k}">${n}</button>`).join('');
bar.after(tabs);
const pane={}, box=document.createElement('div'); box.className='setpanes'; tabs.after(box);
for(const [k] of TABS){ const p=document.createElement('div'); p.className='setpane'; p.dataset.tab=k; p.setAttribute('role','tabpanel'); box.appendChild(p); pane[k]=p; }
let placing=false;
function place(){ if(placing) return; placing=true; try{ placeRows(); } finally{ placing=false; } }
function placeRows(){
  panel.querySelectorAll('.srow').forEach(r=>{ if(r.closest('.setpane')) return; const c=r.querySelector('button,select');
    const key=c&&(c.id&&HOME[c.id]?c.id:[...c.classList].find(x=>HOME[x]));
    pane[key?HOME[key]:'game'].appendChild(r); dress(r); });
  const kb=q('#setKbd'); if(kb&&!kb.closest('.setpane')) pane.controls.appendChild(kb);
  panel.querySelectorAll(':scope>h3').forEach(h=>h.remove());
  const done=q('#setClose'); let foot=panel.querySelector(':scope>.setfoot'); if(!foot){ foot=document.createElement('div'); foot.className='setfoot'; panel.appendChild(foot); }
  if(done){ done.hidden=false; if(done.parentNode!==foot) foot.appendChild(done); } if(panel.lastElementChild!==foot) panel.appendChild(foot);
  // Display: the preview, after its rows
  if(!q('#setPreview')){ const pv=document.createElement('div'); pv.id='setPreview'; pv.className='setpreview';
    pv.innerHTML=`<div class="spic"><img src="menukit/elements/fire.webp" alt=""></div><div class="stxt"><b>Sample text</b><small>Shows the selected text size and button size.</small><span class="btn ghost sbtn"><img src="menukit/icons/crossed-swords.webp" alt=""><span>Sample button</span></span></div>`;
    pane.display.appendChild(pv); }
}
// the kit's short notes (the game's full note stays as the row's tooltip)
const SHORT={layoutBtn:'One column, or two on a tablet.',setOrient:'Upright, sideways or free.',setText:'',setFull:'',setCastFx:'How a card shows when you cast it.',
  setHud:'The bar at the top of a fight.',setRune:'Takes effect the next time you start.',setSfx:'Clicks, chimes and dungeon sounds.',setXMove:'How a finger moves you in the dungeon.',
  setFire:'Which side Fire sits on.',setInst:'Where instants stack up in a fight.',setHand:'Which thumb the dungeon buttons sit under.',setXTips:'A tip the first time you meet something.',
  setXStairs:'Mark the stairs on the minimap.',setSlots:'Play another save, or delete one.',setDev:'Boss tests and free gear.',btnReset:'Cards, decks, gold and gear. Cannot be undone.'};
// segmented choices for settings with a short list of values: clicking a segment clicks the game's own button until it shows that value
const SEG={setText:['Normal','Large','Larger'],layoutBtn:['Phone','Tablet']};
const valueOf=b=>b.classList.contains('layoutBtn')?(document.body.classList.contains('ui-tablet')?'Tablet':'Phone'):b.textContent.trim();
function dress(r){ const t=r.querySelector(':scope>span'); const sm=t&&t.querySelector('small'); const b=r.querySelector(':scope>button');
  const key=b&&(b.id&&b.id in SHORT?b.id:[...b.classList].find(x=>x in SHORT));
  if(t&&!t.dataset.dressed){ t.dataset.dressed='1'; const full=sm?sm.textContent.trim():''; if(full) r.title=full;
    if(key!==undefined&&key in SHORT){ if(SHORT[key]){ if(sm) sm.textContent=SHORT[key]; else t.insertAdjacentHTML('beforeend','<small>'+SHORT[key]+'</small>'); } else if(sm) sm.remove(); } }
  if(!b||b.dataset.dressed) return; b.dataset.dressed='1';
  if(key&&SEG[key]){ const seg=document.createElement('div'); seg.className='sseg'; seg.setAttribute('role','radiogroup');
    seg.innerHTML=SEG[key].map(v=>`<button type="button" class="btn ghost" role="radio" data-v="${v}">${v}</button>`).join(''); b.after(seg); b.classList.add('shid');
    const sync=()=>seg.querySelectorAll('button').forEach(x=>{ const on=x.dataset.v===valueOf(b); x.classList.toggle('on',on); x.setAttribute('aria-checked',String(on)); });
    seg.addEventListener('click',e=>{ const x=e.target.closest('button'); if(!x) return; for(let i=0;i<SEG[key].length&&valueOf(b)!==x.dataset.v;i++) b.click(); sync(); });
    sync(); new MutationObserver(sync).observe(b,{childList:true,characterData:true,subtree:true}); new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']}); return; }
  const look=()=>{ const v=b.textContent.trim(); const full=b.id==='setFull', sw=full||/^(on|off)$/i.test(v), on=full?/exit/i.test(v):/^on$/i.test(v);
    b.classList.toggle('sswitch',sw); b.classList.toggle('son',on); b.classList.toggle('sfield',!sw&&!b.classList.contains('danger')&&b.id!=='setSlots');
    if(sw) b.setAttribute('aria-pressed',String(on)); else b.removeAttribute('aria-pressed'); if(full) b.setAttribute('aria-label','Full screen'); };
  look(); new MutationObserver(look).observe(b,{childList:true,characterData:true,subtree:true}); }
let cur='display';
function show(k){ cur=k; tabs.querySelectorAll('.settab').forEach(b=>{ const on=b.dataset.tab===k; b.classList.toggle('on',on); b.setAttribute('aria-selected',String(on)); });
  for(const n in pane) pane[n].hidden=n!==k; panel.scrollTop=0; }
tabs.addEventListener('click',e=>{ const b=e.target.closest('.settab'); if(b) show(b.dataset.tab); });
tabs.addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; const i=TABS.findIndex(t=>t[0]===cur), n=TABS[(i+(e.key==='ArrowRight'?1:TABS.length-1))%TABS.length][0]; show(n); tabs.querySelector(`[data-tab="${n}"]`).focus(); });
// rows added later by other scripts land in their tab too; opening Settings starts on Display
new MutationObserver(()=>{ if(!placing) place(); }).observe(panel,{childList:true});
new MutationObserver(()=>{ if(q('#settings').classList.contains('on')){ place(); show('display'); } }).observe(q('#settings'),{attributes:true,attributeFilter:['class']});
place(); show('display');
})();
