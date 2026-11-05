/* Hexmancers - Living Rune / Whisper dungeon UI (the handoff in docs/ui-rune; its look is rune.css).
   Built on top of the existing dungeon HUD: every element id, button handler and gameplay rule stays, this file only
   re-arranges and extends them.
     top       compact HP with its crystal, Lv and gold, the menu; D1 · F1/4 with the status icons on its baseline
               (the game's own status chips read into the stand-in icon library, runeicons.js, bounded with +N and a
               detail list on tap); a small local map
     bottom    the stair choices and what you are doing in a context strip (never a second row of actions); one
               complete log line with a faint clipped hint of the one before and the journal on the hand edge; the
               four equal actions in ONE row: Strike Search Disarm Bag (left hand) or Bag Disarm Search Strike (right)
     history   hold the journal 400 ms (or tap it, or press J) for the Dungeon log: a darker drawer above the row that
               latches open, scrolls on its own and never moves your character
     map       the big map in a titled panel (place name, D1 · F1/4, close) with its key; tap explored floor to walk
     pause     the shared pause menu in the same material: icons, gold Resume, the flee cost in red under Flee
   Settings gains Action hand (left / right) and Dungeon HUD (Living Rune / Classic, from the next start). */
(function(){
const LS=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }, LSset=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
const ON=LS('hexmancers-rune','1')!=='0';
let HAND=LS('hexmancers-hand','left')==='right'?'right':'left';
window.RUNE={on:ON};
if(!ON||typeof runeIcon!=='function') return;
const B=document.body, $q=s=>document.querySelector(s);
B.classList.add('rune'); B.classList.toggle('rune-right',HAND==='right');

// the icons the stylesheet paints with (masks would lose the gold; backgrounds keep each icon's own colour)
const crystal='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 12"><path d="M5 0 10 6 5 12 0 6z" fill="#1785bb"/><path d="M5 0 10 6H5z" fill="#7dd8e6"/><path d="M5 0 0 6h5z" fill="#d4fbff"/><path d="M5 12 0 6h5z" fill="#3aa6d8"/><path d="M5 0 10 6 5 12 0 6z" fill="none" stroke="#d4fbff" stroke-width=".6"/></svg>')+'")';
const V={'--r-crystal':crystal,'--r-i-strike':runeIconUrl('ui_strike','#f5cb60'),'--r-i-search':runeIconUrl('ui_search','#f3f1e7'),'--r-i-disarm':runeIconUrl('ui_disarm','#f3f1e7'),
  '--r-i-bag':runeIconUrl('ui_bag','#f3f1e7'),'--r-i-journal-gold':runeIconUrl('ui_journal','#f5cb60'),'--r-i-close':runeIconUrl('ui_close','#f3f1e7'),'--r-i-menu':runeIconUrl('ui_menu','#f3f1e7'),
  '--r-i-resume-gold':runeIconUrl('ui_resume','#f5cb60'),'--r-i-save':runeIconUrl('ui_save','#f3f1e7'),'--r-i-load':runeIconUrl('ui_load','#f3f1e7'),'--r-i-settings':runeIconUrl('ui_settings','#f3f1e7'),
  '--r-i-fullscreen':runeIconUrl('ui_fullscreen','#f3f1e7'),'--r-i-flag':runeIconUrl('ui_flag','#f3f1e7')};
for(const k in V) B.style.setProperty(k,V[k]);
const stop=e=>{ e.stopPropagation(); };   // nothing of ours lets a touch through to the floor

/* ---------------- the layout ---------------- */
const top=$q('#xTop'), meter=top.querySelector('.hpmeter'), info=top.querySelector('.info'), scr=$q('#scrExplore');
{ const vit=document.createElement('div'); vit.className='r-vit'; top.insertBefore(vit,meter); vit.append(meter,info);
  const tr=document.createElement('span'); tr.className='r-hptrack'; meter.insertBefore(tr,$q('#xHpBar')); tr.appendChild($q('#xHpBar')); }
const chipRow=document.createElement('div'); chipRow.id='rChipRow'; chipRow.innerHTML='<span id="rChip"></span>'; scr.appendChild(chipRow); chipRow.appendChild($q('#xStatus'));
const pop=document.createElement('div'); pop.id='rStatusPop'; pop.hidden=true; scr.appendChild(pop);
const gem=document.createElement('div'); gem.id='rMiniGem'; scr.appendChild(gem);
const bottom=$q('#xBottom'), controls=bottom.querySelector('.controls');
const ctx=document.createElement('div'); ctx.id='rCtx'; ctx.append($q('#xUp'),$q('#xCamp'),$q('#xAct'));
const drawer=document.createElement('div'); drawer.id='rDrawer'; drawer.setAttribute('role','log'); drawer.setAttribute('aria-label','Dungeon log');
drawer.innerHTML='<i class="grab"></i><div class="hd">'+runeIcon('ui_journal',18,'#f5cb60')+'<b>Dungeon log</b><button class="x" type="button" aria-label="Close the log"></button></div><div class="ls" tabindex="0"></div>';
const logEl=document.createElement('div'); logEl.id='rLog';
logEl.innerHTML='<button id="rLogBtn" type="button" aria-label="Dungeon log: hold or tap for history" title="Dungeon log (J)"></button><div id="rLogText" aria-live="polite"><div class="l1"></div><div class="l2"></div></div>';
bottom.insertBefore(ctx,controls); bottom.insertBefore(drawer,controls); bottom.insertBefore(logEl,controls);
{ const g=document.createElement('i'); g.className='r-gem'; $q('#xStrike').appendChild(g); }
for(const el of [chipRow,pop,ctx,drawer,logEl]) for(const ev of ['pointerdown','touchstart','mousedown']) el.addEventListener(ev,stop);

/* ---------------- the log: one line closed, the history open ---------------- */
const LOGI=[[/\bgold\b/i,'ui_coin','#f5cb60'],[/\bdoor/i,'ui_door'],[/\bHP\b|heal|herb|rested|draught/i,'ui_heal','#8de9b5'],[/\bkey\b/i,'key_gold'],[/defeated|falls|slain|dies|beaten/i,'ui_skull'],
  [/spots you|wakes|ambush|trap|bites|hurt|poison/i,'ui_warning','#ec9384'],[/strike|hit|blow/i,'ui_strike','#f5cb60'],[/stairs|depth|climb|descend|floor/i,'ui_stairs','#7dd8e6'],[/chest|card|treasure|found|pick up|take/i,'ui_chest','#f5cb60'],
  [/\bXP\b|level/i,'ui_rune','#7dd8e6'],[/search|secret|hidden/i,'ui_search'],[/disarm/i,'ui_disarm']];
const LOGC={bad:['ui_warning','#ec9384'],good:['ui_heal','#8de9b5'],warn:['ui_warning','#f5cb60'],loot:['ui_chest','#d3b8ff'],gold:['ui_coin','#f5cb60'],xp:['ui_rune','#8de9b5']};
function logIcon(t,c){ for(const [re,id,col] of LOGI) if(re.test(t)) return runeIcon(id,16,col||(c==='dim'?'#a8b6b8':'#f3f1e7')); const d=LOGC[c]; return d?runeIcon(d[0],16,d[1]):runeIcon('ui_journal',16,'#a8b6b8'); }
const esc_=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const HIST_MAX=80, STALE_MS=9000; let staleT=0;
function hist(){ if(!EX) return []; return EX.hist||(EX.hist=(EX.log||[]).map(l=>({t:l.t,c:l.c,at:Date.now()}))); }
function renderLine(){ const H=hist(), a=H[H.length-1], b=H[H.length-2], tx=$q('#rLogText');
  tx.querySelector('.l1').innerHTML=a?esc_(a.t):''; tx.querySelector('.l1').className='l1 '+(a&&a.c||''); tx.querySelector('.l2').textContent=b?b.t:'';
  tx.classList.remove('stale'); clearTimeout(staleT); staleT=setTimeout(()=>tx.classList.add('stale'),STALE_MS); }   // a short message, then the line clears (the history keeps it)
function renderDrawer(keepPos){ const ls=drawer.querySelector('.ls'), H=hist(), atEnd=ls.scrollHeight-ls.scrollTop-ls.clientHeight<24;
  ls.innerHTML=H.map(l=>'<div class="ln '+(l.c||'')+'">'+logIcon(l.t,l.c)+'<span>'+esc_(l.t)+'</span></div>').join('')||'<div class="ln dim">Nothing yet.</div>';
  if(!keepPos||atEnd) ls.scrollTop=ls.scrollHeight; }
const histOpen=()=>B.classList.contains('r-histopen');
function setHist(on){ B.classList.toggle('r-histopen',!!on); $q('#rLogBtn').setAttribute('aria-expanded',on?'true':'false'); if(on) renderDrawer(false); else renderLine(); }
window.runeHistory=setHist;
const oldLog=window.xLog;
window.xLog=function(t,c){ oldLog(t,c); if(!EX) return; const H=hist(); H.push({t,c,at:Date.now()}); if(H.length>HIST_MAX) H.splice(0,H.length-HIST_MAX); renderLine(); if(histOpen()) renderDrawer(true); };
drawer.querySelector('.x').addEventListener('click',()=>setHist(false));
// the journal: hold 400 ms to open, or tap; a drag of 10 px cancels; the drawer then stays open until closed
{ const btn=$q('#rLogBtn'); let t=0, x0=0, y0=0, held=false, live=false;
  btn.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); live=true; held=false; x0=e.clientX; y0=e.clientY; btn.classList.add('held'); try{ btn.setPointerCapture(e.pointerId); }catch(_){}
    clearTimeout(t); t=setTimeout(()=>{ if(!live) return; held=true; setHist(true); },400); });
  btn.addEventListener('pointermove',e=>{ if(live&&Math.hypot(e.clientX-x0,e.clientY-y0)>10){ live=false; clearTimeout(t); btn.classList.remove('held'); } });
  const up=e=>{ if(!live) return; live=false; clearTimeout(t); btn.classList.remove('held'); if(!held) setHist(!histOpen()); };
  btn.addEventListener('pointerup',up); btn.addEventListener('pointercancel',()=>{ live=false; clearTimeout(t); btn.classList.remove('held'); });
  btn.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); setHist(!histOpen()); } }); }
window.addEventListener('keydown',e=>{ if(!EX||!EX.active||!$q('#scrExplore').classList.contains('on')) return; if(e.key==='j'||e.key==='J'){ if(typeof keyAct==='function'&&keyAct('j','map')) return; setHist(!histOpen()); } });

/* ---------------- statuses: the game's chips as icons on the depth chip's baseline ---------------- */
const ST=[[/bronze key/i,'key_bronze'],[/silver key/i,'key_silver'],[/gold key/i,'key_gold'],[/skeleton key/i,'key_skeleton'],[/boss key/i,'key_boss'],[/key/i,'key_gold'],
  [/Threat on this floor/,'threat'],[/Wayshard/,'wayshard'],[/Sealed/,'sealed'],[/Satchel/,'lost_satchel'],[/🔥/,'carried_flame'],[/Cleanse it at the altar/,'hex_hollow'],[/🕯|Relics/,'relics'],
  [/🔌/,'circuit'],[/⏳/,'rescue_timer'],[/🛡/,'escort'],[/Poison/i,'poisoned'],[/Cursed/i,'cursed'],[/Blessed/i,'blessed'],[/📜/,'quest'],[/📦|crate/i,'carrying_crate'],[/torch/i,'torch'],[/bones?/i,'bones'],[/planks?/i,'planks']];
function statusOf(el){ const title=el.getAttribute('title')||'', text=(el.textContent||'').trim(), s=title+' '+text; let id='ui_rune';
  for(const [re,k] of ST) if(re.test(s)){ id=k; break; }
  const num=(text.match(/(\d+\s*\/\s*\d+|\d+s|\d+)\s*$/)||[])[1]||'';   // a count, timer or progress to show beside it
  const bad=el.classList.contains('bad')||/poison|curse|sealed|threat/i.test(id);
  return {id,num:num.replace(/\s/g,''),label:(title||text).replace(/^[^\w]+/,'').trim()||id,bad,col:el.style.color||null}; }
function runeStatuses(){ const row=$q('#xStatus'); if(!row) return; const items=[...row.querySelectorAll('.xs')].map(statusOf);
  items.sort((a,b)=>(b.bad?1:0)-(a.bad?1:0));
  const cap=(innerWidth/(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tz'))||1))<420?4:7, shown=items.slice(0,cap), more=items.length-shown.length;
  row.querySelectorAll('.rs').forEach(n=>n.remove());
  const frag=document.createDocumentFragment();
  for(const it of shown){ const s=document.createElement('span'); s.className='rs'; s.title=it.label; s.innerHTML=runeIcon(it.id,20,it.id==='threat'&&it.col?it.col:null)+(it.num?'<small>'+esc_(it.num)+'</small>':''); frag.appendChild(s); }
  if(more>0){ const s=document.createElement('span'); s.className='rs more'; s.textContent='+'+more; frag.appendChild(s); }
  row.appendChild(frag); row._items=items;
  if(!pop.hidden) fillPop(); }
function fillPop(){ const items=$q('#xStatus')._items||[]; pop.innerHTML=items.length?items.map(it=>'<div>'+runeIcon(it.id,20)+'<span>'+esc_(it.label)+(it.num?' · '+esc_(it.num):'')+'</span></div>').join(''):'<div>No effects.</div>'; }
$q('#xStatus').addEventListener('click',e=>{ e.stopPropagation(); if(!$q('#xStatus')._items||!$q('#xStatus')._items.length) return; pop.hidden=!pop.hidden; if(!pop.hidden) fillPop(); });
pop.addEventListener('click',()=>{ pop.hidden=true; });
if(typeof window.xHudExtra==='function'){ const old=window.xHudExtra; window.xHudExtra=function(){ old(); runeStatuses(); }; }

/* ---------------- the HUD each update: HP text, the location chip ---------------- */
const chipText=()=>EX?(EX.branch?'Sanctum':'D'+EX.depth+' · F'+(typeof areaFloor==='function'?areaFloor(EX.depth):1)+'/'+(typeof DEPTHS_PER_AREA!=='undefined'?DEPTHS_PER_AREA:4)):'';
if(typeof window.xHud==='function'){ const old=window.xHud; window.xHud=function(){ old(); if(!EX) return;
  const t=$q('#xHpTxt'); if(t) t.textContent=t.textContent.replace(/^HP\s*/,''); meter.classList.toggle('low',!!(EX.maxHp&&EX.hp/EX.maxHp<=.3));
  $q('#rChip').textContent=chipText(); $q('#rChip').title=EX.branch?'A hidden branch':('Depth '+EX.depth+' · '+areaLabel(EX.depth));
  ctx.querySelectorAll('.btn').forEach(b=>b.setAttribute('aria-hidden',b.style.display==='none'?'true':'false')); }; }
// a new floor: its own history starts with its arrival lines; the line and drawer show it
if(typeof window.enterExplore==='function'){ const old=window.enterExplore; window.enterExplore=function(){ const r=old.apply(this,arguments); if(EX){ hist(); renderLine(); if(histOpen()) renderDrawer(false); } pop.hidden=true; return r; }; }

/* ---------------- the expanded map ---------------- */
const mp=document.createElement('div'); mp.id='rMapPanel'; mp.hidden=true;
mp.innerHTML='<div class="hd"><button class="x" type="button" aria-label="Close the map"></button><div><b></b><small></small></div></div>'
  +'<div class="lg"><div class="k3"><span>'+runeIcon('ui_player',14,'#ffffff')+'You</span><span>'+runeIcon('ui_chest',14,'#f5cb60')+'Chest</span><span>'+runeIcon('ui_stairs',14,'#7dd8e6')+'Stairs</span></div><p>Tap explored floor to walk</p></div>';
scr.appendChild(mp); for(const ev of ['pointerdown','touchstart','mousedown']) mp.addEventListener(ev,stop);
mp.querySelector('.x').addEventListener('click',()=>{ if(typeof xMapClose==='function') xMapClose(); });
if(typeof window.xMapOpen==='function'){ const o=window.xMapOpen, c=window.xMapClose;
  window.xMapOpen=function(){ o(); if(!(typeof xMapIsOpen==='function'&&xMapIsOpen())) return; mp.querySelector('b').textContent=EX.branch?'Hidden Sanctum':EX.area.name; mp.querySelector('small').textContent=chipText(); mp.hidden=false; B.classList.add('r-mapopen'); };
  window.xMapClose=function(){ mp.hidden=true; B.classList.remove('r-mapopen'); c(); }; }

/* ---------------- the shared pause menu ---------------- */
{ const cost=document.createElement('p'); cost.id='rLeaveCost'; $q('#mLeave').after(cost);
  const fix=()=>{ if(!$q('#pause').classList.contains('on')) return; const L=$q('#mLeave'), m=L.textContent.match(/^(.*?)\s*·\s*(lose .*)$/i);
    if(m){ L.textContent=m[1]; cost.textContent=m[2].charAt(0).toUpperCase()+m[2].slice(1); } else cost.textContent='';
    if(EX&&typeof pauseWhere==='function'&&pauseWhere()==='map') $q('#pauseWhere').textContent=chipText()+' · '+(EX.branch?'Hidden Sanctum':EX.area.name); };
  new MutationObserver(fix).observe($q('#pause'),{attributes:true,attributeFilter:['class']}); }

/* ---------------- settings: the action hand, and the HUD itself ---------------- */
{ const anchor=$q('#setXStairs'); const row=anchor&&anchor.closest('.srow');
  if(row){ const mk=(id,title,sub)=>{ const r=document.createElement('div'); r.className='srow'; r.innerHTML='<span>'+title+'<small>'+sub+'</small></span><button id="'+id+'" class="btn ghost small"></button>'; return r; };
    const h=mk('setHand','Action hand','Which thumb the dungeon buttons, log and map sit under. Left: Strike Search Disarm Bag. Right: Bag Disarm Search Strike.');
    const u=mk('setRune','Dungeon HUD','Living Rune: the compact HUD with one log line and its history. Classic: the earlier HUD. Changes the next time the game starts.');
    row.after(h,u); const hb=$q('#setHand'), ub=$q('#setRune');
    const lab=()=>{ hb.textContent=HAND==='right'?'Right hand':'Left hand'; ub.textContent=LS('hexmancers-rune','1')!=='0'?'Living Rune':'Classic'; }; lab();
    hb.onclick=()=>{ HAND=HAND==='right'?'left':'right'; LSset('hexmancers-hand',HAND); B.classList.toggle('rune-right',HAND==='right'); lab(); };
    ub.onclick=()=>{ LSset('hexmancers-rune',LS('hexmancers-rune','1')!=='0'?'0':'1'); lab(); if(typeof tip==='function') tip('The dungeon HUD changes the next time the game starts.'); }; } }
window.runeSetHand=h=>{ HAND=h==='right'?'right':'left'; LSset('hexmancers-hand',HAND); B.classList.toggle('rune-right',HAND==='right'); const hb=$q('#setHand'); if(hb) hb.textContent=HAND==='right'?'Right hand':'Left hand'; };
})();
