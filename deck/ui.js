/* Hexmancers deck prototype — screens, HUD and controls for the collecting loop:
   camp -> fight -> card drops -> deck builder / collection / shop -> camp. */

const $=s=>document.querySelector(s);
let save=loadSave();
const persist=()=>writeSave(save);
const activeDeck=()=>save.decks[save.active];

function show(id){ $('#tip').classList.remove('on'); document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); if(id==='scrBattle') resizeView(); window.scrollTo(0,0); }
let tipT=0; function tip(msg){ const t=$('#tip'); t.textContent=msg; t.classList.add('on'); clearTimeout(tipT); tipT=setTimeout(()=>t.classList.remove('on'),1400); }
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
// the same HP bar and gold readout everywhere: battle, dungeon, camp, shop, character
function hpMeter(bar,txt,hp,max){ hp=Math.max(0,Math.ceil(hp)); bar.style.width=Math.min(100,hp/max*100)+'%'; txt.textContent='HP '+hp+'/'+max; bar.parentElement.classList.toggle('low',hp/max<=.3); }
function goldText(el,n){ el.innerHTML=uiIcon('coin',20)+'<span>'+(n==null?save.gold:n)+'</span>'; el.classList.add('goldtxt'); }

// Card faces: each family has its own textured face (drawn by uikit.js) in a deep, toned-down
// color with white text, except light's pale marble, which keeps dark ink. acc colors the type line, bd the rim band and rank, tb the text panel.
const CARD_PAL={
  fire:   {face:'#4a1f16', ink:'#fff4ec', acc:'#ffb08a', bd:'#b5452e', tb:'rgba(0,0,0,.34)'},
  frost:  {face:'#173452', ink:'#f0f7ff', acc:'#9fd0ff', bd:'#2f6ea6', tb:'rgba(0,0,0,.32)'},
  storm:  {face:'#4a3c12', ink:'#fff8e2', acc:'#ffd866', bd:'#b48a2a', tb:'rgba(0,0,0,.48)'},
  verdant:{face:'#1c3a24', ink:'#f0fbf2', acc:'#9fdca8', bd:'#2f7448', tb:'rgba(0,0,0,.32)'},
  light:  {face:'#d9d2bc', ink:'#2a2416', acc:'#7a5c1e', bd:'#b8a46a', tb:'rgba(255,255,255,.42)'},
  shadow: {face:'#1e1a1d', ink:'#f2eef0', acc:'#d6b6c6', bd:'#5a4a52', tb:'rgba(0,0,0,.30)'},
  gray:   {face:'#6f7378', ink:'#f4f5f7', acc:'#d6dade', bd:'#9aa0a6', tb:'rgba(0,0,0,.30)'},
  brown:  {face:'#3a2c22', ink:'#fbf2e8', acc:'#e0b080', bd:'#8a6644', tb:'rgba(0,0,0,.34)'},
};
function cardEl(c,extra,locked){
  const el=document.createElement('button'), col=COLORS[c.color];
  el.className='card'+(c.rarity==='legendary'?' leg':'')+(c.rarity==='hero'?' hero':'')+(locked?' locked':''); el.style.setProperty('--c',col.c);
  const stat=c.pow||(c.boon!=='gauge'&&c.amt)||c.hp||'';
  const rune=c.code?`<span class="rune${c.code==='✱'?' wild':''}" title="Rune ${c.code}">${c.code}</span>`:'';
  const R=ROLES[cardRole(c)]; el.style.setProperty('--rc',R.c);
  const CP=CARD_PAL[c.color]||CARD_PAL.gray;
  el.classList.add(/^#[ef]/i.test(CP.ink)?'dk':'lt');
  for(const [k,v] of [['--cface',CP.face],['--cink',CP.ink],['--cacc',CP.acc],['--cbd',CP.bd],['--ctb',CP.tb],['--ctex','var(--tex-'+(CARD_PAL[c.color]?c.color:'gray')+')']]) el.style.setProperty(k,v);
  if(typeof cardFrame==='function') el.style.setProperty('--cf',cardFrame(c.rarity==='hero'?'#c9a03a':CP.bd,c.rarity));
  el.innerHTML=locked?`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div><div class="art"></div><div class="cn">???</div><div class="ty">${TYPES[c.type].name}</div><div class="tx"></div><div class="cp"><span></span><small>${RARITY[c.rarity].g}</small></div>`
    :`<div class="ct"><span>${col.icon} ${TYPES[c.type]?TYPES[c.type].icon:''}</span><span class="tr">${rune}<span class="rank">${c.rank}</span></span></div>
    <img class="art" src="${artURL(c)}" alt=""><div class="cn">${esc(c.name)}</div><div class="ty">${TYPES[c.type].name} <span class="rl">${R.icon} ${R.name}</span></div><div class="tx">${esc(cardText(c))}</div>
    <div class="cp"><span>${stat}</span><small title="${RARITY[c.rarity].n}">${RARITY[c.rarity].g}</small></div>`;
  if(extra) el.insertAdjacentHTML('beforeend',extra);
  return el;
}

function showDetail(c){
  const box=$('#dtCard'); box.innerHTML=''; box.appendChild(cardEl(c,'',!c.recipe&&!save.seen[c.id]));
  if(c.recipe){ const r=RECIPES.find(x=>x.id===c.id); $('#dtInfo').textContent='Recipe: '+r.cards.map(id=>CARDS[id].name).join(' + ')+'. Queue these together and they fuse into this card.'; $('#detail').classList.add('on'); return; }
  const inDeck=activeDeck().list.filter(id=>id===c.id).length;
  $('#dtInfo').textContent=save.seen[c.id]?COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0)+' · in deck '+inDeck
    :'Not found yet. '+RARITY[c.rarity].n+' '+COLORS[c.color].name+' '+TYPES[c.type].name+'.';
  if(c.uses&&save.owned[c.id]) $('#dtInfo').textContent+=' · uses left per copy: '+Array.from({length:save.owned[c.id]},(_,k)=>chargeLeft(save,c.id,k)+'/'+c.uses).join(', ');
  $('#detail').classList.add('on');
}
$('#dtClose').onclick=()=>$('#detail').classList.remove('on');
// Hold a card in a grid to peek at it: it grows to a big, readable card for as long as the
// finger stays down and shrinks back on release (the tap that ends a peek does nothing else).
// Right-click still opens the full detail.
let pressT=0, pressed=false;
function peek(c,on){ const box=$('#peek');
  if(!on){ box.classList.remove('on'); return; }
  box.innerHTML=''; const el=cardEl(c,'',!c.recipe&&!save.seen[c.id]); el.classList.add('big'); box.appendChild(el);
  if(save.seen[c.id]){ const n=document.createElement('p'); n.className='peekinfo'; n.textContent=COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0); box.appendChild(n); }
  box.classList.add('on'); }
function longPress(el,c){
  let x0=0, y0=0;
  el.addEventListener('pointerdown',e=>{ pressed=false; x0=e.clientX; y0=e.clientY; clearTimeout(pressT); pressT=setTimeout(()=>{ pressed=true; peek(c,true); if(navigator.vibrate) navigator.vibrate(12); },320); });
  el.addEventListener('pointermove',e=>{ if(!pressed&&Math.hypot(e.clientX-x0,e.clientY-y0)>10) clearTimeout(pressT); });
  const end=()=>{ clearTimeout(pressT); if(pressed) peek(c,false); };
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,end));
  el.addEventListener('pointerleave',()=>{ if(!pressed) clearTimeout(pressT); });
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); if(!pressed) showDetail(c); });
}
addEventListener('pointerup',()=>{ if(pressed) setTimeout(()=>peek(null,false),0); });

function reveal(title,body,results,buttons,extras){
  $('#rvTitle').textContent=title; $('#rvBody').textContent=body;
  const g=$('#rvCards'); g.innerHTML='';
  (extras||[]).forEach((x,i)=>{ const el=document.createElement('div'); el.className='reward flip'; el.style.animationDelay=(i*.12)+'s'; el.innerHTML=`<b>${x.pic||x.icon}</b><span>${esc(x.name)}</span><small>${esc(x.text)}</small>`; g.appendChild(el); });
  results.forEach((r,i)=>{ const el=cardEl(r.card,r.isNew?'<span class="badge new">NEW</span>':''); el.style.animationDelay=(i*.12)+'s'; el.classList.add('flip'); el.onclick=()=>showDetail(r.card); g.appendChild(el); });
  const bb=$('#rvBtns'); bb.innerHTML=''; bb.classList.toggle('two',buttons.length>1);
  // a lone button is always the main one
  buttons.forEach(([label,fn,ghost])=>{ const b=document.createElement('button'); b.className='btn'+(ghost&&buttons.length>1?' ghost':''); b.textContent=label; b.onclick=()=>{ $('#reveal').classList.remove('on'); fn(); }; bb.appendChild(b); });
  $('#reveal').classList.add('on');
  const main=bb.querySelector('.btn:not(.ghost)')||bb.querySelector('.btn'); if(main) setTimeout(()=>main.focus(),50);
}

/* ---------------- start ---------------- */
function buildStart(){
  const box=$('#starters'); box.innerHTML='';
  for(const s of STARTERS){
    const d=document.createElement('div'); d.className='starter';
    d.innerHTML=`<h3>${s.name}</h3><div class="cols">${s.colors.map(c=>`<span class="chip" style="--c:${COLORS[c].c}">${COLORS[c].icon} ${COLORS[c].name}</span>`).join('')}</div>
      <p>${s.text}</p><div class="row"><button class="btn">Start with this deck</button></div>`;
    d.querySelector('.btn').onclick=()=>{ if(typeof XPARK!=='undefined') XPARK=null; save=newSave(s); persist(); pickDepth=1; openCamp(); };
    box.appendChild(d);
  }
  $('#startBack').style.display=save?'':'none';
  $('#startWarn').textContent=save?'Starting a new game replaces your current save: your cards, gold and gear.':'';
  show('scrStart');
}

/* ---------------- camp ---------------- */
let pickDepth=null;   // null until you first open camp or the menu, then your choice sticks (1 included)
function openCamp(){
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; }
  if(pickDepth==null) pickDepth=save.deepest;
  pickDepth=Math.min(Math.max(1,pickDepth),save.deepest);
  const d=activeDeck(), v=validateDeck(d.list,CARDS,save.owned);
  $('#campGold').innerHTML=uiIcon('coin',32)+save.gold;
  $('#campColl').innerHTML=uiIcon('cards',32)+ownedUnique(save)+(Object.keys(gearState(save).cursed).length?' <em class="curse">cursed</em>':'');
  $('#campDeck').textContent=d.name;
  const cnt=$('#campDeckCount'); cnt.textContent=v.count+'/'+RULES.max; cnt.classList.toggle('bad',!v.ok);
  $('#campDeckErr').textContent=v.ok?'':v.errors[0]+(v.errors.length>1?' (+'+(v.errors.length-1)+' more)':'')+'. Fix it in the deck builder.';
  const A=areaOf(pickDepth); $('#campArea').textContent=areaLabel(pickDepth); $('#campArea').style.color=A.glow;
  $('#campBoss').innerHTML=isBossDepth(pickDepth)?'<b class="gold">'+ENEMY_DEFS[bossFor(pickDepth)].name+' here</b>':'Boss at <b class="gold">'+areaBossDepth(pickDepth)+'</b>';
  $('#btnDescend').textContent='Explore depth '+pickDepth;
  $('#btnDescend').disabled=!v.ok; $('#btnQuick').disabled=!v.ok;
  $('#depthDown').disabled=pickDepth<=1; $('#depthUp').disabled=pickDepth>=save.deepest;
  drawDepthMap($('#depthMap'),pickDepth,save.deepest);
  $('#campLog').innerHTML=(campLog.length?campLog:[{t:'Each win gives a reward: a card, gold or a piece of gear. Every area is '+DEPTHS_PER_AREA+' floors deep and its boss waits on the last one. Losing costs 20% of your gold.',c:'dim'}])
    .slice(-4).map(l=>`<div class="${l.c||''}">${esc(l.t)}</div>`).join('');
  show('scrCamp'); campScene();
}
// the camp scene: the area you are about to enter, your wizard in its gear, and a fire that
// flickers while the camp is open. Drawn at a whole-number zoom so pixels stay square.
let campTimer=0;
function campScene(){
  const cv=$('#campScene'), box=cv.parentElement, w=box.clientWidth||330;
  // the scene fills the frame; pixels stay hard-edged, so this reads as pixel art at any size
  const k=w/SCENE_W;
  cv.style.width=SCENE_W*k+'px'; cv.style.height=SCENE_H*k+'px';
  const dm=$('#depthMap'); dm.style.width='100%'; dm.style.height='auto';
  clearInterval(campTimer); const t0=performance.now();
  const tick=()=>{ if(!$('#scrCamp').classList.contains('on')){ clearInterval(campTimer); return; } drawCampScene(cv,pickDepth,(performance.now()-t0)/1000,unitSprite({kind:'player',look:gearLook(save),view:'front'}).img); };
  tick(); campTimer=setInterval(tick,140);
}
// the last few things that happened, shown in the camp log
const campLog=[];
const lootPic=(k,n=64)=>k.startsWith('scroll:')?uiIcon('scroll',n,k==='scroll:purify'?'#f2c94c':'#8fe4ff'):gearIcon(k,n);
function logCamp(t,c){ campLog.push({t,c}); if(campLog.length>12) campLog.shift(); }
// Testing: start any boss straight away at its own depth
function renderTrials(){ const box=$('#bossTrials'); if(!box||typeof BOSS_ORDER==='undefined') return;
  box.innerHTML='<span class="lbl">Test a boss</span>'+BOSS_ORDER.map(id=>`<button class="chip" data-boss="${id}" style="--c:${COLORS[ENEMY_DEFS[id].color].c}">${ENEMY_DEFS[id].name} · ${bossDepth(id)}</button>`).join('');
  box.querySelectorAll('[data-boss]').forEach(b=>b.onclick=()=>fight(bossDepth(b.dataset.boss),[[b.dataset.boss]],{trial:true})); }
renderTrials();
document.querySelectorAll('.btn.mi').forEach(b=>b.insertAdjacentHTML('afterbegin',uiIcon(b.dataset.icon,48)));
addEventListener('resize',()=>{ if($('#scrCamp').classList.contains('on')) campScene(); });
$('#depthDown').onclick=()=>{ pickDepth--; openCamp(); };
$('#depthUp').onclick=()=>{ pickDepth++; openCamp(); };
$('#btnDescend').onclick=()=>enterExplore(pickDepth);
$('#btnQuick').onclick=()=>fight(pickDepth);   // the battle on its own, no dungeon
$('#goBuilder').onclick=()=>openBuilder();
$('#goCollection').onclick=()=>openCollection();
$('#goShop').onclick=()=>openShop();
$('#goChar').onclick=()=>openCharacter();
// Two-tap confirmation in the page itself (browser confirm dialogs are blocked in some viewers):
// the first tap arms the button and changes its label, a second tap within 3 seconds acts.
function armed(btn,label,act){ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; act(); return; }
  btn.dataset.label=btn.textContent; btn.dataset.armed='1'; btn.textContent=label;
  setTimeout(()=>{ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; } },3000); }
// Settings › Save › Erase: wherever you are, everything stops and the game returns to the menu
$('#btnReset').onclick=e=>armed(e.currentTarget,'Tap again to erase',()=>{
  closeSettings(); ['#pause','#reveal','#custom','#detail','#pick','#xDialog'].forEach(k=>$(k).classList.remove('on')); paused=false; B=null;
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; }
  clearSave(); save=null; campLog.length=0; pickDepth=null; openMenu(); tip('Save erased'); });
document.querySelectorAll('.back').forEach(b=>b.onclick=openCamp);

/* ---------------- filters (builder and collection) ---------------- */
function makeFilters(box,f,onChange,withOwned){
  const fams=Object.keys(COLORS);
  box.innerHTML=`<div class="chips">${fams.map(k=>`<button class="chip fc" data-k="${k}" style="--c:${COLORS[k].c}">${COLORS[k].icon}</button>`).join('')}</div>
    <div class="row"><select data-f="type"><option value="">All types</option>${Object.keys(TYPES).map(t=>`<option value="${t}">${TYPES[t].name}</option>`).join('')}</select>
    <select data-f="rarity"><option value="">All rarities</option>${Object.keys(RARITY).map(r=>`<option value="${r}">${RARITY[r].n}</option>`).join('')}</select>
    ${withOwned?'<select data-f="owned"><option value="">All cards</option><option value="owned">Found</option><option value="missing">Not found</option></select>':''}
    <input data-f="q" placeholder="Search"></div>`;
  box.querySelectorAll('.fc').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; f.colors.has(k)?f.colors.delete(k):f.colors.add(k); b.classList.toggle('on',f.colors.has(k)); onChange(); });
  box.querySelectorAll('[data-f]').forEach(el=>el.oninput=()=>{ f[el.dataset.f]=el.value; onChange(); });
}
function passes(c,f){
  if(f.colors.size&&!f.colors.has(c.color)) return false;
  if(f.type&&c.type!==f.type) return false;
  if(f.rarity&&c.rarity!==f.rarity) return false;
  if(f.owned==='owned'&&!save.seen[c.id]) return false;
  if(f.owned==='missing'&&save.seen[c.id]) return false;
  if(f.q&&!(save.seen[c.id]&&(c.name+' '+cardText(c)).toLowerCase().includes(f.q.toLowerCase()))) return false;
  return true;
}
const FAM_ORDER=Object.keys(COLORS), RAR_ORDER=Object.keys(RARITY);
const byFamily=(a,b)=>FAM_ORDER.indexOf(a.color)-FAM_ORDER.indexOf(b.color)||a.rank-b.rank||a.name.localeCompare(b.name);
// Render a long card list a page at a time.
function paged(box,items,make,page){
  page=page||90; box.innerHTML=''; let shown=0;
  const more=document.createElement('button'); more.className='btn ghost more';
  const step=()=>{ const frag=document.createDocumentFragment(); items.slice(shown,shown+page).forEach(it=>frag.appendChild(make(it))); shown=Math.min(items.length,shown+page);
    more.remove(); box.appendChild(frag); if(shown<items.length){ more.textContent='Show more ('+(items.length-shown)+')'; box.appendChild(more); } };
  more.onclick=step; step();
  if(!items.length) box.innerHTML='<p class="hint">No cards match.</p>';
}

/* ---------------- deck builder ---------------- */
const bf={colors:new Set(), type:'', rarity:'', q:''};
let editSlot=0;
function openBuilder(){ editSlot=save.active; makeFilters($('#bFilters'),bf,renderColl,false); renderBuilder(); show('scrBuilder'); }
function renderBuilder(){ renderSlots(); renderDeck(); renderColl(); }
function renderSlots(){
  const box=$('#bSlots'); box.innerHTML='';
  save.decks.forEach((d,i)=>{ const b=document.createElement('button'); b.className='chip slotbtn'+(i===editSlot?' on':'')+(i===save.active?' act':'');
    b.textContent=(i+1)+(i===save.active?' ★':''); b.title=d.name; b.onclick=()=>{ editSlot=i; renderBuilder(); }; box.appendChild(b); });
  const d=save.decks[editSlot]; $('#bName').value=d.name;
  $('#bUse').textContent=editSlot===save.active?'In use ★':'Use this deck';
}
$('#bName').oninput=e=>{ save.decks[editSlot].name=e.target.value||'Deck '+(editSlot+1); persist(); };
function renderDeck(){
  const d=save.decks[editSlot], v=validateDeck(d.list,CARDS,save.owned);
  const cnt=$('#bCount'); cnt.textContent=v.count+' / '+RULES.max; cnt.classList.toggle('bad',!v.ok);
  $('#bErr').textContent=v.ok?'':v.errors.slice(0,3).join(' · ');
  const byColor={}, byType={};
  d.list.forEach(id=>{ const c=CARDS[id]; byColor[c.color]=(byColor[c.color]||0)+1; byType[c.type]=(byType[c.type]||0)+1; });
  $('#bStats').innerHTML=FAM_ORDER.filter(k=>byColor[k]).map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${byColor[k]}</span>`).join('')+
    Object.keys(TYPES).filter(k=>byType[k]).map(k=>`<span class="chip" style="--c:#9fdcff">${TYPES[k].icon} ${TYPES[k].name} ${byType[k]}</span>`).join('');
  const ids=Object.keys(v.counts).map(id=>CARDS[id]).sort(byFamily);
  paged($('#bDeck'),ids,c=>{ const el=cardEl(c,`<span class="badge">×${v.counts[c.id]}</span>`); longPress(el,c);
    el.onclick=()=>{ if(pressed) return; const i=d.list.lastIndexOf(c.id); d.list.splice(i,1); persist(); renderDeck(); renderColl(); }; return el; },300);
  if(!ids.length) $('#bDeck').innerHTML='<p class="hint">Empty deck. Tap cards below, or use Auto-fill.</p>';
}
function renderColl(){
  const d=save.decks[editSlot], inDeck={}; d.list.forEach(id=>inDeck[id]=(inDeck[id]||0)+1);
  const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&passes(c,bf)).sort(byFamily);
  paged($('#bColl'),items,c=>{
    const left=Math.min(copyLimit(c),save.owned[c.id])-(inDeck[c.id]||0);
    const el=cardEl(c,`<span class="badge${left>0?'':' dim'}">${left>0?left+' left':'max'}</span>`); if(left<=0) el.classList.add('picked'); longPress(el,c);
    el.onclick=()=>{ if(pressed) return;
      if(d.list.length>=RULES.max) return tip('Deck is full (60)');
      if(left<=0) return tip(c.rarity==='legendary'?'1 copy per legendary':(inDeck[c.id]||0)>=RULES.copies?'Max 4 copies':'You own '+save.owned[c.id]);
      d.list.push(c.id); persist(); renderDeck(); renderColl(); };
    return el; });
}
$('#bAuto').onclick=()=>{ const d=save.decks[editSlot]; d.list=autoFill(d.list,save.owned); persist(); renderBuilder(); };
$('#bClear').onclick=e=>{ const d=save.decks[editSlot]; if(!d.list.length) return; armed(e.currentTarget,'Tap to confirm',()=>{ d.list=[]; persist(); renderBuilder(); }); };
$('#bUse').onclick=()=>{ save.active=editSlot; persist(); renderSlots(); tip(save.decks[editSlot].name+' is now your deck'); };

/* ---------------- collection ---------------- */
/* My cards: everything you own (with copies and how many are in your deck), your items, and
   a tab for the whole set of 1,006 with the ones you haven't found yet greyed out. */
const cf={colors:new Set(), type:'', rarity:'', q:'', owned:'', mine:true, sort:'family'};
function openCollection(){ makeFilters($('#cFilters'),cf,renderCollection,!cf.mine); renderCollection(); show('scrCollection'); }
$('#cTabMine').onclick=()=>{ cf.mine=true; cf.book=false; cf.owned=''; openCollection(); };
$('#cTabAll').onclick=()=>{ cf.mine=false; cf.book=false; openCollection(); };
$('#cTabBook').onclick=()=>{ cf.book=true; renderCollection(); };
// The recipe book: found recipes show their cards and what they make; the rest show the
// colors and types they need, with the cards you have already seen named.
function renderBook(){
  const known=save.recipes||{}, g=$('#cGrid'); g.innerHTML='';
  $('#cTitle').textContent='Recipes'; $('#cCount').textContent=Object.keys(known).length+' / '+RECIPES.length+' found';
  $('#cProgress').innerHTML=''; $('#cItems').hidden=true; $('#cFilters').hidden=true;
  for(const r of RECIPES){ const found=known[r.id], box=document.createElement('div'); box.className='recipe'+(found?' found':'');
    const parts=r.cards.map(id=>{ const c=CARDS[id]; return found||save.seen[id]?`<span class="chip" style="--c:${COLORS[c.color].c}">${esc(c.name)}</span>`:`<span class="chip" style="--c:${COLORS[c.color].c}">??? ${TYPES[c.type].name}</span>`; }).join(' + ');
    box.innerHTML=`<div class="rh">${found?'⚗ '+esc(r.name):'⚗ ???'}${r.cards.length>3?' <small>4 cards · needs the 4th slot</small>':''}</div><div class="rp">${parts}</div>`;
    if(found){ const el=cardEl(r.card); el.onclick=()=>showDetail(r.card); box.appendChild(el); }
    g.appendChild(box); }
}
$('#cSort').onchange=e=>{ cf.sort=e.target.value; renderCollection(); };
const SORTS={family:byFamily, rank:(a,b)=>a.rank-b.rank||byFamily(a,b), rarity:(a,b)=>RAR_ORDER.indexOf(b.rarity)-RAR_ORDER.indexOf(a.rarity)||byFamily(a,b),
  copies:(a,b)=>(save.owned[b.id]||0)-(save.owned[a.id]||0)||byFamily(a,b), name:(a,b)=>a.name.localeCompare(b.name)};
function renderCollection(){
  $('#cTabBook').classList.toggle('on',!!cf.book); $('#cFilters').hidden=!!cf.book; $('#cSort').hidden=!!cf.book;
  if(cf.book){ $('#cTabMine').classList.remove('on'); $('#cTabAll').classList.remove('on'); return renderBook(); }
  $('#cTabMine').classList.toggle('on',cf.mine); $('#cTabAll').classList.toggle('on',!cf.mine); $('#cSort').value=cf.sort;
  const copies=Object.keys(save.owned).reduce((a,id)=>a+(CARDS[id]?save.owned[id]:0),0);
  $('#cTitle').textContent=cf.mine?'My cards':'All cards';
  $('#cCount').textContent=cf.mine?ownedUnique(save)+' cards · '+copies+' copies':ownedUnique(save)+' / '+CARD_LIST.length;
  $('#cItems').innerHTML=`<button class="item" onclick="openCharacter()">⚔ Gear, enchanting and curses are on the Character screen →</button>`; $('#cItems').hidden=!cf.mine;
  if(cf.mine){ const inDeck={}; activeDeck().list.forEach(id=>inDeck[id]=(inDeck[id]||0)+1);
    const fam={}; Object.keys(save.owned).forEach(id=>{ const c=CARDS[id]; if(c&&save.owned[id]>0) fam[c.color]=(fam[c.color]||0)+save.owned[id]; });
    $('#cProgress').innerHTML=FAM_ORDER.filter(k=>fam[k]).map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k]}</span>`).join('');
    const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&passes(c,cf)).sort(SORTS[cf.sort]);
    paged($('#cGrid'),items,c=>{ const el=cardEl(c,`<span class="badge">×${save.owned[c.id]}${inDeck[c.id]?' · '+inDeck[c.id]+' in deck':''}</span>`); longPress(el,c); el.onclick=()=>{ if(!pressed) showDetail(c); }; return el; });
    if(!items.length) $('#cGrid').innerHTML='<p class="hint">No cards match.</p>';
    return; }
  const fam={}; CARD_LIST.forEach(c=>{ fam[c.color]=fam[c.color]||[0,0]; fam[c.color][1]++; if(save.seen[c.id]) fam[c.color][0]++; });
  $('#cProgress').innerHTML=FAM_ORDER.map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k][0]}/${fam[k][1]}</span>`).join('');
  const items=CARD_LIST.filter(c=>passes(c,cf)).sort(SORTS[cf.sort]);
  paged($('#cGrid'),items,c=>{ const own=save.owned[c.id]||0; const el=cardEl(c,own?`<span class="badge">×${own}</span>`:'',!save.seen[c.id]); longPress(el,c); el.onclick=()=>{ if(!pressed) showDetail(c); }; return el; });
}

/* ---------------- character and gear ----------------
   Your wizard, what the equipped gear adds up to, the two slots, your scrolls, and every piece
   you own: equip it, merge two copies to upgrade it, enchant it, or break its curse. */
function openCharacter(){ ensureStarterGear(save); persist(); $('#chMsg').textContent=''; renderCharacter(); show('scrCharacter'); }
function charMsg(r){ $('#chMsg').textContent=r.msg||''; $('#chMsg').className='hint'+(r.cursed?' curse':r.ok?'':' warn'); if(r.ok) persist(); renderCharacter(); }
/* The Character screen is a paper doll: your wizard in the middle, the seven slots around it
   with dashed lines to where each piece is worn, and your inventory below as a grid of pieces.
   Tap a piece (or a slot) to see it and act on it, or drag a piece onto a slot to put it on and
   drag it off a slot to take it off. */
const DOLL_LEFT=['head','arms','offhand','ring1'], DOLL_RIGHT=['body','weapon','ring2'];
// where on the 32 x 32 sprite each slot's piece is worn
const DOLL_ANCHOR={head:[16,7], body:[16,20], arms:[9,21], offhand:[6,18], weapon:[25,12], ring1:[9,24], ring2:[23,24]};
const INV_TABS=[['all','All'],['weapon','Weapons'],['offhand','Off-hand'],['head','Head'],['body','Body'],['arms','Arms'],['ring','Rings']];
let chTab='all', chSel=null;
// pick how your hexmancer looks: wizard, elf, dwarf or orc (man or woman), dark witch or necromancer; hat on or off
function renderLooks(){ const box=$('#chLooks'); if(!box||typeof PLAYER_LOOKS==='undefined') return; const cur=(typeof LOOK_ALIAS!=='undefined'&&LOOK_ALIAS[save.look])||save.look||'wizard';
  box.innerHTML='<span class="lbl">Look</span>'+Object.keys(PLAYER_LOOKS).map(id=>{ const L=PLAYER_LOOKS[id]; return `<button class="chip${id===cur?' on':''}" data-look="${id}" style="--c:#8fe4ff">${L.name}${L.gender?' · '+L.gender:''}</button>`; }).join('');
  box.innerHTML+=`<button class="chip${save.hat===false?'':' on'}" data-hat="1" style="--c:#f2c94c">${save.hat===false?'Hat off':'Hat on'}</button>`;
  box.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{ save.look=b.dataset.look; persist(); renderCharacter(); });
  box.querySelector('[data-hat]').onclick=()=>{ save.hat=save.hat===false; persist(); renderCharacter(); }; }
window.onLookLoaded=()=>{ if($('#scrCharacter').classList.contains('on')) renderCharacter(); };
function renderCharacter(){
  const s=gearState(save), m=gearMods(save), K=WEAPON_KINDS[m.kind]||WEAPON_KINDS.wand;
  goldText($('#chGold'));
  // the wizard, large, glowing in the weapon's element
  const cv=$('#chSprite'), cx=cv.getContext('2d'); cx.clearRect(0,0,256,256); cx.imageSmoothingEnabled=false;
  const col=m.color?COLORS[m.color].c:'#7fd4ff';
  // the weapon's element glows around the wizard in two dithered rings of sprite-sized pixels
  cx.fillStyle=col; for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const r=Math.hypot(x-15.5,(y-18)*1.1);
    if(r<9||(r<14&&(x+y)%2===0)){ cx.globalAlpha=r<9?.22:.16; cx.fillRect(x*8,y*8,8,8); } } cx.globalAlpha=1;
  cx.fillStyle='rgba(0,0,0,.5)'; cx.fillRect(72,240,112,8); cx.fillRect(88,248,80,4);
  const spr=unitSprite({kind:'player',look:gearLook(save),view:'front'}); cx.drawImage(spr.img,0,0,spr.img.width,spr.img.height,0,0,256,256);
  renderLooks();
  // the slots
  const slotEl=slot=>{ const id=s.gear[slot], d=document.createElement('div'); if(id) d.style.setProperty('--fc',COLORS[GEAR[id].family].c); d.className='dslot'+(id&&isStuck(save,id)?' cursed':'')+(id?' full':'')+(chSel&&chSel.slot===slot?' sel':''); d.dataset.slot=slot;
    d.innerHTML=`<span class="lbl">${SLOT_NAMES[slot]}</span>`+(id?`<b class="ic">${gearIcon(id,48)}</b><small>${esc(gearName(save,id))}</small>`:'<b class="ic dim">·</b><small class="dim">empty</small>');
    d.onclick=()=>{ chSel=id?{id,slot}:null; if(!id){ chTab=slotType(slot); } renderCharacter(); };
    if(id) dragGear(d,id,slot);
    return d; };
  const L=$('#chDoll .dcol.left'), R=$('#chDoll .dcol.right'); L.innerHTML=''; R.innerHTML='';
  DOLL_LEFT.forEach(k=>L.appendChild(slotEl(k))); DOLL_RIGHT.forEach(k=>R.appendChild(slotEl(k)));
  requestAnimationFrame(dollLines);
  // what it all adds up to
  const w=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`, pct=x=>Math.round(x*100)+'%';
  $('#chStats').innerHTML=w('Max HP',120+(m.hp||0))+w(K.name,Math.max(1,K.tap+m.tap)+' · charged '+Math.max(2,K.charged+m.charged))+w('Element',m.color?COLORS[m.color].icon+' '+COLORS[m.color].name:'none')
    +w('Fire rate',m.cd&&m.cd!==1?Math.round((1/m.cd-1)*100)+'% faster':'normal')+w('Guard',pct(m.guard||0))+w('Start shield',m.shield||0)
    +(m.dodge?w('Dodge',pct(m.dodge)):'')+(m.block?w('Shield block',m.block+' hit'+(m.block>1?'s':'')+' a turn'):'')+(m.regen?w('Regeneration',m.regen+' HP/s'):'')+(m.counter?w('Counter',m.counter):'')
    +(m.slow&&m.slow!==1?w('Move speed',m.slow<1?Math.round((1-m.slow)*100)+'% faster':Math.round((m.slow-1)*100)+'% slower'):'')+(m.castSlow&&m.castSlow>1?w('Casting',Math.round((m.castSlow-1)*100)+'% slower'):'')
    +(m.surge?w('4th slot chance',pct(m.surge)):'')+(m.gold?w('Gold','+'+pct(m.gold)):'')+(m.gauge||m.hurt||m.hpPerShot||m.misfire?w('Curses',modsText({gauge:m.gauge,hurt:m.hurt,hpPerShot:m.hpPerShot,misfire:m.misfire})):'')
    +activeSets(save).map(k=>w('Set ✦',SETS[k].name)).join('')
    +(typeof PERM!=='undefined'?Object.keys(PERM).filter(k=>save.perm&&save.perm[k]).map(k=>w('Blessing',PERM[k].name+' ×'+save.perm[k])).join(''):'');
  $('#chScrolls').innerHTML='<span class="lbl">Scrolls</span>'+Object.keys(SCROLLS).map(k=>`<span class="chip" style="--c:#7fd4ff">${lootPic('scroll:'+k,24)} ${SCROLLS[k].name} ×${s.scrolls[k]||0}</span>`).join('')
    +(typeof MATS!=='undefined'?Object.keys(MATS).filter(k=>save.mats&&save.mats[k]).map(k=>`<span class="chip" style="--c:${MATS[k].col}">${MATS[k].name} ×${save.mats[k]}</span>`).join('')+Object.keys(BAG).filter(k=>save.bag&&save.bag[k]).map(k=>`<span class="chip" style="--c:${BAG[k].col}">${BAG[k].name} ×${save.bag[k]}</span>`).join(''):'');
  // inventory tabs and grid
  const tabs=$('#chTabs'); tabs.innerHTML='';
  for(const [k,label] of INV_TABS){ const b=document.createElement('button'); b.className='chip'+(chTab===k?' on':''); b.textContent=label; b.onclick=()=>{ chTab=k; renderCharacter(); }; tabs.appendChild(b); }
  const order=['weapon','offhand','head','body','arms','ring'];
  const ids=Object.keys(GEAR).filter(id=>s.items[id]>0&&(chTab==='all'||GEAR[id].slot===chTab)).sort((a,b)=>order.indexOf(GEAR[a].slot)-order.indexOf(GEAR[b].slot)||GEAR[b].tier-GEAR[a].tier);
  const inv=$('#chInv'); inv.innerHTML=ids.length?'':'<p class="hint">Nothing here yet. Fights drop gear now and then; bosses always drop loot.</p>';
  for(const id of ids){ const G=GEAR[id], on=SLOTS.some(k=>s.gear[k]===id), t=document.createElement('div');
    t.style.setProperty('--fc',COLORS[G.family].c);
    t.className='itile'+(on?' on':'')+(G.legendary?' legend':'')+(isStuck(save,id)?' cursed':'')+(chSel&&chSel.id===id?' sel':'');
    t.innerHTML=`<span class="fam">${COLORS[G.family].icon}</span><b class="ic">${gearIcon(id,48)}</b><small>${esc(gearName(save,id))}</small><span class="st">${G.legendary?'✹':G.tier?'★'.repeat(G.tier):'·'}</span>`+(s.items[id]>1?`<span class="cnt">×${s.items[id]}</span>`:'')+(on?'<span class="worn">✓</span>':'')+(unworn(save,id)?'<span class="new">?</span>':'');
    t.onclick=()=>{ chSel={id}; renderCharacter(); };
    dragGear(t,id,null); inv.appendChild(t); }
  renderGearDetail();
}
// the selected piece: what it does, its set, and what you can do with it
function renderGearDetail(){
  const box=$('#chDetail'), s=gearState(save); if(!chSel||!s.items[chSel.id]){ box.innerHTML=''; box.className='gdetail empty'; return; }
  const id=chSel.id, G=GEAR[id], wornIn=SLOTS.filter(k=>s.gear[k]===id), on=wornIn.length>0, stuck=isStuck(save,id), set=setOf(id), lv=s.gearLv[id]||0;
  const kindTxt=G.slot==='weapon'?WEAPON_KINDS[kindOf(id)].name+': '+WEAPON_KINDS[kindOf(id)].text:G.weight?G.weight[0].toUpperCase()+G.weight.slice(1)+' armor'+(G.weight==='heavy'&&!s.ench[id]?' (slows casting until enchanted)':''):SLOT_NAMES[G.slot==='ring'?'ring1':G.slot];
  box.className='gdetail'+(stuck?' cursed':'')+(G.legendary?' legend':''); box.style.setProperty('--fc',COLORS[G.family].c);
  box.innerHTML=`<button class="dx" aria-label="Close">✕</button><div class="dh"><b class="ic">${gearIcon(id,64)}</b><div><b>${esc(gearName(save,id))}</b> <span class="tier">${G.legendary?'✹ Legendary':G.tier?'★'.repeat(G.tier):'junk'}</span>${s.items[id]>1?` <span class="cnt">×${s.items[id]}</span>`:''}
      <small class="kind"><span class="chip" style="--c:${COLORS[G.family].c}">${COLORS[G.family].icon} ${COLORS[G.family].name}</span> ${esc(kindTxt)}</small></div></div>
    <p>${esc(gearText(save,id))}${G.text?' · '+esc(G.text):''}</p>
    ${set?`<p class="set${activeSets(save).includes(set)?' on':''}">Set: ${esc(SETS[set].name)} (${SETS[set].pieces.filter(x=>s.items[x]).length}/3 owned, ${SETS[set].pieces.filter(x=>SLOTS.some(k=>s.gear[k]===x)).length}/3 worn) · ${esc(modsText(SETS[set].mods))}</p>`:''}
    ${unworn(save,id)?'<p class="fresh">Not worn yet: it may be enchanted or cursed.</p>':''}
    ${stuck?`<p class="curse">☠ Cursed ${esc(CURSES[s.cursed[id]].name)}: ${esc(CURSES[s.cursed[id]].text)}. Break it with a Scroll of Purifying or 3 rune ${curseRune(save,id)} cards.</p>`:''}
    <div class="ga"></div>`;
  box.querySelector('.dx').onclick=()=>{ chSel=null; renderCharacter(); };
  const act=box.querySelector('.ga'), btn=(label,fn,dis)=>{ const b=document.createElement('button'); b.className='btn ghost small'; b.textContent=label; b.disabled=!!dis; b.onclick=fn; act.appendChild(b); };
  if(on) btn('Take off',()=>charMsg(equip(save,wornIn[0],null)),stuck);
  if(!on||(G.slot==='ring'&&s.items[id]>1&&wornIn.length<2)) btn('Equip',()=>charMsg(equip(save,G.slot==='ring'?'ring':G.slot,id)));
  if(s.items[id]>1) btn('Merge → +'+(lv+1),()=>charMsg(mergeGear(save,id)),lv>=MAX_LEVEL);
  if(!s.ench[id]) btn('Enchant ('+(s.scrolls.enchant||0)+')',()=>charMsg(enchantGear(save,id)),!(s.scrolls.enchant>0));
  if(stuck){ btn('Purify ('+(s.scrolls.purify||0)+')',()=>charMsg(purifyGear(save,id)),!(s.scrolls.purify>0)); btn('Sacrifice 3 rune '+curseRune(save,id),()=>pickSacrifice(id)); }
}
// dashed lines from each slot to where it sits on the wizard
function dollLines(){
  const doll=$('#chDoll'), svg=doll.querySelector('.dlines'), cv=$('#chSprite'); if(!doll.offsetParent) return;
  const d=doll.getBoundingClientRect(), c=cv.getBoundingClientRect(), k=c.width/32; let html='';
  doll.querySelectorAll('.dslot').forEach(el=>{ const r=el.getBoundingClientRect(), slot=el.dataset.slot, [ax,ay]=DOLL_ANCHOR[slot], left=DOLL_LEFT.includes(slot);
    const x1=(left?r.right:r.left)-d.left, y1=r.top+r.height/2-d.top, x2=c.left-d.left+ax*k, y2=c.top-d.top+ay*k, full=!!gearState(save).gear[slot];
    html+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${full?'full':''}"/><circle cx="${x2}" cy="${y2}" r="3" class="${full?'full':''}"/>`; });
  svg.setAttribute('viewBox','0 0 '+d.width+' '+d.height); svg.innerHTML=html;
}
window.addEventListener('resize',()=>{ if($('#scrCharacter').classList.contains('on')) dollLines(); });
// drag a piece from the inventory onto a slot, or from a slot off the doll
let gdrag=null;
function dragGear(el,id,fromSlot){
  el.addEventListener('pointerdown',e=>{ if(e.button>0) return; gdrag={el,id,fromSlot,x0:e.clientX,y0:e.clientY,moved:false}; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  el.addEventListener('pointermove',e=>{ if(!gdrag||gdrag.el!==el) return;
    if(!gdrag.moved&&Math.hypot(e.clientX-gdrag.x0,e.clientY-gdrag.y0)>8){ gdrag.moved=true; const g=document.createElement('div'); g.className='gghost'; g.innerHTML=gearIcon(id,64); document.body.appendChild(g); gdrag.ghost=g; }
    if(gdrag.moved){ gdrag.ghost.style.left=e.clientX+'px'; gdrag.ghost.style.top=e.clientY+'px';
      document.querySelectorAll('.dslot.drop').forEach(x=>x.classList.remove('drop')); const t=document.elementFromPoint(e.clientX,e.clientY), sl=t&&t.closest('.dslot');
      if(sl&&slotType(sl.dataset.slot)===GEAR[id].slot) sl.classList.add('drop'); } });
  const end=e=>{ if(!gdrag||gdrag.el!==el) return; const d=gdrag; gdrag=null; if(d.ghost) d.ghost.remove(); document.querySelectorAll('.dslot.drop').forEach(x=>x.classList.remove('drop'));
    if(!d.moved||e.type==='pointercancel') return;
    const t=document.elementFromPoint(e.clientX,e.clientY), sl=t&&t.closest('.dslot');
    if(sl){ if(slotType(sl.dataset.slot)!==GEAR[id].slot) return tip('That goes in the '+SLOT_NAMES[GEAR[id].slot==='ring'?'ring1':GEAR[id].slot]+' slot');
      if(sl.dataset.slot!==d.fromSlot){ if(d.fromSlot){ const r=equip(save,d.fromSlot,null); if(!r.ok) return charMsg(r); } chSel={id,slot:sl.dataset.slot}; charMsg(equip(save,sl.dataset.slot,id)); } }
    else if(d.fromSlot&&t&&t.closest('#chInv,#chDetail,.invhead,#chTabs')){ chSel={id}; charMsg(equip(save,d.fromSlot,null)); } };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
}
// choose the cards to give up to break a curse
function pickSacrifice(id){ const G=Object.assign({},GEAR[id],{rune:curseRune(save,id)}), chosen=[];
  $('#pkTitle').textContent='Break the curse'; $('#pkBody').textContent='Give up '+SACRIFICE+' cards of rune '+G.rune+'. They leave your collection and your decks for good.';
  const box=$('#pkCards'); box.innerHTML='';
  const own=Object.keys(save.owned).map(k=>CARDS[k]).filter(c=>c&&c.code===G.rune&&save.owned[c.id]>0).sort(byFamily);
  if(!own.length) box.innerHTML='<p class="hint">You own no rune '+G.rune+' cards. Find some, or use a Scroll of Purifying.</p>';
  for(const c of own){ const el=cardEl(c,`<span class="badge">×${save.owned[c.id]}</span>`); const mark=()=>{ const n=chosen.filter(x=>x===c.id).length; el.classList.toggle('chosen',n>0); el.dataset.n=n?'×'+n:''; };
    el.onclick=()=>{ const n=chosen.filter(x=>x===c.id).length; if(n<save.owned[c.id]&&chosen.length<SACRIFICE) chosen.push(c.id); else chosen.splice(chosen.indexOf(c.id),1); mark(); $('#pkOk').disabled=chosen.length!==SACRIFICE; $('#pkOk').textContent='Sacrifice '+chosen.length+' / '+SACRIFICE; };
    box.appendChild(el); }
  $('#pkOk').disabled=true; $('#pkOk').textContent='Sacrifice 0 / '+SACRIFICE;
  $('#pkOk').onclick=()=>{ $('#pick').classList.remove('on'); charMsg(sacrificeFor(save,id,chosen)); };
  $('#pkCancel').onclick=()=>$('#pick').classList.remove('on');
  $('#pick').classList.add('on');
}
$('#chTestAll').onclick=()=>{ Object.keys(GEAR).forEach(id=>{ gearState(save).items[id]=(gearState(save).items[id]||0)+1; }); persist(); charMsg({ok:true,msg:'One of every piece added (cursed ones are still in disguise).'}); };
$('#chTestScrolls').onclick=()=>{ addScroll(save,'enchant',2); addScroll(save,'purify',2); persist(); charMsg({ok:true,msg:'+2 of each scroll'}); };

/* ---------------- shop ---------------- */
function openShop(){
  goldText($('#sGold'));
  $('#buyBooster').textContent='Buy · '+PACK_PRICE.booster+' gold'; $('#buyBooster').disabled=save.gold<PACK_PRICE.booster;
  const box=$('#famPacks'); box.innerHTML='';
  for(const k of FAM_ORDER){ const b=document.createElement('button'); b.className='btn ghost fam'; b.style.setProperty('--c',COLORS[k].c);
    b.innerHTML=`${COLORS[k].icon} ${COLORS[k].name}<small>${PACK_PRICE.family} gold</small>`; b.disabled=save.gold<PACK_PRICE.family; b.onclick=()=>buyPack(k); box.appendChild(b); }
  renderScrollShop();
  show('scrShop');
}
$('#buyBooster').onclick=()=>buyPack(null);
function renderScrollShop(){ const box=$('#scrollShop'); box.innerHTML='';
  for(const k in SCROLLS){ const sc=SCROLLS[k], b=document.createElement('button'); b.className='btn ghost fam'; b.style.setProperty('--c','#7fd4ff');
    b.innerHTML=`${lootPic('scroll:'+k,32)} ${sc.name}<small>${sc.price} gold · you have ${gearState(save).scrolls[k]||0}</small>`; b.disabled=save.gold<sc.price;
    b.onclick=()=>{ if(save.gold<sc.price) return; save.gold-=sc.price; addScroll(save,k); persist(); tip(sc.name+' bought'); openShop(); }; box.appendChild(b); } }
function buyPack(color){
  const price=color?PACK_PRICE.family:PACK_PRICE.booster; if(save.gold<price) return;
  save.gold-=price; const res=addCards(save,openPack(save.deepest,color)); persist(); openShop();
  reveal(color?COLORS[color].name+' pack':'Booster pack',res.filter(r=>r.isNew).length+' new cards',res,[['Continue',()=>{}]]);
}

/* ---------------- battle flow ---------------- */
// xo (from the overworld): {hp, opening, explore} — wounds carry in and the fight returns to the map
function fight(depth,waves,xo){
  const d=activeDeck(); if(!validateDeck(d.list,CARDS,save.owned).ok) return openCamp();
  $('#reveal').classList.remove('on');
  show('scrBattle');
  startBattle(d.list,depth,{
    onCustom:renderCustom,
    onFight:()=>{ $('#custom').classList.remove('on'); hud(true); },
    onCast:(c,inst)=>{ showCast(c,inst); buzz(12); },
    onHurt:d=>{ buzz(d>=15?60:30); const h=$('#hurtFx'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); },
    onTurn:n=>banner('Turn '+n,'#4fb3ff'),
    onBoss:(t,c,info)=>{ banner(t,c); if(info) tip(info); },
    onWave:i=>banner('Wave '+(i+1),'#ff5d6c'),
    onCombo:label=>banner('✦ '+label.split(':')[0],'#ffe066'),
    onRecipe:r=>{ const first=!(save.recipes||{})[r.id]; save.recipes=save.recipes||{}; save.recipes[r.id]=1; persist(); banner((first?'⚗ New recipe! ':'⚗ ')+r.name,'#39ff8a'); },
    onHero:c=>banner('♔ '+c.name.split(',')[0]+' joins the fight!','#ffe066'),
    onEnd:win=>win?victory():defeat(),
  },{prepare:p=>assignChargeUses(save,p,d.list), gear:gearMods(save), look:gearLook(save), waves, hp:xo&&xo.hp, opening:xo&&xo.opening, rule:xo&&xo.rule});
  B.explore=!!(xo&&xo.explore); B.trial=!!(xo&&xo.trial);
  if(B.opening) setTimeout(()=>banner(B.opening==='ambush'?'Ambush! They\'re slow to react':'Surprised! They strike first',B.opening==='ambush'?'#39ff8a':'#ff5d6c'),300);
  hud(true);
}
// charge uses spent this fight carry over; a copy that ran dry burns up
function settleCharges(){ const burned=settleChargeUses(save,B.piles); persist();
  return burned.length?' Burned up: '+burned.map(x=>x.card.name+(x.n>1?' ×'+x.n:'')).join(', ')+'.':''; }
function victory(){
  const b=B, boss=b.enemies.some(e=>e.def.boss);
  const rw=battleRewards(b.enemies.filter(e=>!e.def.minion).map(e=>e.color),b.depth,boss,null,save.owned);
  if(rw.gold) rw.gold=Math.round(rw.gold*(1+(gearMods(save).gold||0)));   // Ring of Fortune
  save.gold+=rw.gold; save.wins++; if(!b.explore&&!b.trial&&b.depth>=save.deepest) save.deepest=b.depth+1;
  const hpLeft=b.player.hp;
  const loot=rw.items.map(k=>({k, res:addLoot(save,k)}));
  const res=addCards(save,rw.cards); const burnt=settleCharges();
  const depth=b.depth;
  const hero=rw.cards.find(c=>c.rarity==='hero');
  const got=[...rw.cards.map(c=>c.name),...(rw.gold?[rw.gold+' gold']:[]),...rw.items.map(k=>{ const l=lootLabel(save,k); return l.icon+' '+l.name; })];
  logCamp((boss?'Boss defeated':'Won')+' at depth '+depth+'.','win'); got.forEach(g=>logCamp('Found '+g.replace(/^[^A-Za-z0-9]+/u,'')+'.',/gold$/.test(g)?'gold':'loot'));
  loot.forEach(l=>{ if(l.res&&l.res.cursed) logCamp(l.res.msg,'curse'); });
  reveal(hero?'♔ A hero joins you!':boss?'Boss defeated!':'Victory!',(hero?hero.name+' answers your call. ':'')+(boss&&!b.trial?'The way down to '+areaOf(depth+1).name+' is open. ':'')+(b.explore?'Won in '+Math.round(b.time)+'s. ':'Depth '+depth+' cleared in '+Math.round(b.time)+'s. ')+(boss?'Boss rewards: ':'Your reward: ')+got.join(', ')+'.'+loot.map(l=>l.res&&l.res.cursed?' '+l.res.msg:l.res&&l.res.ok?' You put it on.':'').join('')+burnt,res,
    b.explore?[['Keep exploring',()=>{ const ruleOK=!!(b.rule&&b.rule.ok); B=null; resumeExplore(hpLeft,true,{ruleOK}); }]]
    :[['Camp',()=>{ B=null; pickDepth=depth+1; openCamp(); },true],['Depth '+(depth+1)+' →',()=>fight(depth+1)]],
    [...(rw.gold?[{pic:uiIcon('coin',64),name:rw.gold+' gold',text:'Spend it on packs in the shop'}]:[]),...rw.items.map(k=>Object.assign(lootLabel(save,k),{pic:lootPic(k)}))]);
}
function defeat(){
  const lost=Math.floor(save.gold*.2); save.gold-=lost; const burnt=settleCharges();
  const depth=B.depth, xp=B.explore;
  // a sanctuary's blessing (dungeon.js): you wake at the floor's stairs up instead, for half the gold
  if(xp&&typeof xTryRevive==='function'&&xTryRevive()){ save.gold+=lost-Math.floor(lost/2); persist(); logCamp('A shrine pulled you back from defeat at depth '+depth+'.','win');
    return reveal('Pulled back','You fell, but the shrine’s blessing carries you back to the stairs up at half health. You dropped '+Math.floor(lost/2)+' gold.'+burnt,[],[['Get up',()=>{ B=null; xRevived(); }]]); }
  logCamp('Fell at depth '+depth+', dropped '+lost+' gold.','curse');
  if(xp&&typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; }
  reveal('Defeated…','You fell at depth '+depth+' and dropped '+lost+' gold. Your cards are safe.'+burnt,[],
    xp?[['Camp',()=>{ B=null; openCamp(); },true]]:[['Camp',()=>{ B=null; openCamp(); },true],['Retry',()=>fight(depth)]]);
}
// leaving a fight early: a battle-only fight costs nothing; fleeing a dungeon fight costs 10% of
// your gold and the floor; a fight you have already lost still counts as a defeat
function leaveFight(){ paused=false; $('#custom').classList.remove('on');
  if(B.phase==='lose'||B.player.hp<=0) return defeat();
  const burnt=settleCharges(); if(burnt) tip(burnt.trim());
  if(B.explore){ fleeCost('Fled a fight at depth '+B.depth); if(typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; } }
  B=null; openCamp(); }
function fleeCost(what){ const lost=Math.floor(save.gold*.1); save.gold-=lost; persist(); logCamp(what+' and dropped '+lost+' gold.','curse'); tip('You flee to camp and drop '+lost+' gold'); }
// the card you cast pops up large and flies onto the board, Hearthstone style
function showCast(c,inst){ const box=$('#castFx'); box.innerHTML=''; const el=cardEl(c,inst&&inst.combo?`<span class="tag">✦ ${esc(inst.combo.split(':')[0])}</span>`:''); box.appendChild(el); }
function banner(text,color){ const b=$('#banner'); b.textContent=text; b.style.setProperty('--bc',color); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
// phone helpers: a short buzz on hits, a pause menu, full screen
const buzz=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
let paused=false;
/* ---------------- pause ----------------
   One pause menu for the dungeon and the battle. The ⋯ button, Esc, or switching away from the
   game opens it; what "leave" does depends on where you are. */
function pauseWhere(){ if(B&&$('#scrBattle').classList.contains('on')) return B.trial?'trial':B.explore?'xfight':'battle';
  if(typeof EX!=='undefined'&&EX&&EX.active&&$('#scrExplore').classList.contains('on')) return 'map'; return null; }
function openPause(){ const w=pauseWhere(); if(!w||$('#pause').classList.contains('on')) return;
  if(w==='map'){ if(EX.busy) return; xPause(true); } else { if(B.phase!=='fight') return; paused=true; B.player.charging=false; $('#btnWand').classList.remove('charging'); }
  const d=w==='map'?EX.depth:B.depth, onStairs=w==='map'&&EX.pc===EX.up;
  $('#pauseWhere').textContent='Depth '+d+' · '+areaLabel(d);
  $('#pauseHint').textContent=w==='map'?'Tap a spot to walk there, or hold to walk toward your finger. Search for secret doors and traps, and disarm a trap before you cross it.'
    :'Tap your side of the board to move and the enemy side to aim lobs. Hold Fire to charge a shot; open Custom when it glows.';
  const L=$('#mLeave'); delete L.dataset.armed;
  L.textContent=w==='battle'?'Retreat to camp':w==='trial'?'End the test':onStairs?'Climb to camp':'Flee to camp · lose 10% gold';
  $('#pause').classList.add('on'); setTimeout(()=>$('#mResume').focus(),30); }
function closePause(){ if(!$('#pause').classList.contains('on')) return; $('#pause').classList.remove('on'); paused=false; if(typeof xPause==='function') xPause(false); }
$('#btnMenu').onclick=openPause;
$('#xMenu').onclick=openPause;
$('#mResume').onclick=closePause;
$('#mSettings').onclick=()=>openSettings();
$('#mLeave').onclick=e=>{ const w=pauseWhere(); if(!w) return closePause();
  if(w==='map'&&EX.pc===EX.up){ closePause(); return xToCamp(); }   // free from the stairs up, and the floor waits for you
  armed(e.currentTarget,w==='battle'||w==='trial'?'Tap again to leave':'Tap again to flee',()=>{ $('#pause').classList.remove('on');
    if(w==='map'){ xPause(false); fleeCost('Fled depth '+EX.depth); stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; openCamp(); }
    else leaveFight(); }); };
const isFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
let fullByUs=false;   // true while the player asked to leave full screen, so that exit does not pause
function toggleFull(){ const d=document, el=d.documentElement;
  try{ if(isFull()){ fullByUs=true; (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else{ const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el); if(r&&r.catch) r.catch(()=>tip('Full screen is not available here')); } }catch(e){ tip('Full screen is not available here'); } }
$('#mFull').onclick=toggleFull; $('#setFull').onclick=toggleFull;
function onFullChange(){ lockOrient(); setTimeout(applyViewport,120); document.querySelectorAll('.fullBtn').forEach(b=>b.textContent=isFull()?'Exit full screen':'Full screen'); setTimeout(resizeView,50);
  // thrown out of full screen by the system (an iPad pinch, a swipe): pause so the fight waits
  // and the pause menu's Full screen button is one tap away
  if(!isFull()&&!fullByUs&&pauseWhere()&&!$('#pause').classList.contains('on')) openPause();
  if(!isFull()) fullByUs=false; }
document.addEventListener('fullscreenchange',onFullChange); document.addEventListener('webkitfullscreenchange',onFullChange);
/* iPad Safari reads two thumbs on the screen (Fire plus Cast, or moving while firing) as a pinch,
   and a pinch zooms the page or closes full screen. Nothing in the game uses pinch, so swallow
   WebKit's gesture events and any multi-finger move before the browser acts on them. */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{ if(e.touches.length>1||(e.scale!=null&&e.scale!==1)) e.preventDefault(); },{passive:false});
document.addEventListener('visibilitychange',()=>{ if(document.hidden) openPause(); });
// Esc opens and closes the pause menu (the settings screen takes Esc first while it is open)
window.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if($('#pause').classList.contains('on')){ e.preventDefault(); closePause(); } else if(pauseWhere()){ e.preventDefault(); openPause(); } });

// the combos a queue makes, as gold chips
function comboChips(combos){ return combos.length?combos.map(c=>`<span>✦ ${esc(c.label)}</span>`).join(''):''; }
function renderCustom(){
  const p=B.piles, dealt=B.justDrawn||new Set();
  $('#custom').classList.add('on');
  $('#custPiles').textContent='Deck '+p.draw.length+' · Discard '+p.discard.length;
  const combos=detectCombos(p.queue), inCombo=new Set();
  for(const cb of combos){ if(cb.kind==='simple') p.queue.forEach(c=>{ if(c.card.id===cb.id) inCombo.add(c.uid); }); else p.queue.forEach(c=>inCombo.add(c.uid)); }
  $('#custCombo').innerHTML=comboChips(combos)||'<span class="none">No combo yet</span>';
  const q=$('#custQueue'); q.innerHTML='';
  const slots=slotsOf(p), runeNow=p.queue.map(c=>c.card.code).find(k=>k&&k!=='✱');
  $('#custSurge').innerHTML=slots>RULES.slots?`<b>ᚱ Rune Surge${p.surge&&p.surge!=='luck'?' ('+p.surge+')':''}!</b> A 4th slot is open this turn: 4-card recipes and Grand Straights are possible.`:'';
  q.classList.toggle('four',slots>RULES.slots);
  for(let i=0;i<slots;i++){
    const inst=p.queue[i];
    if(inst){ const el=cardEl(inst.card,`<span class="ord">${i+1}</span>`); el.dataset.zone='queue'; el.dataset.i=i; if(inCombo.has(inst.uid)) el.classList.add('combo'); dragCard(el,inst); q.appendChild(el); }
    else { const s=document.createElement('div'); s.className='slot'; s.dataset.zone='queue'; s.dataset.i=i; s.innerHTML='Slot '+(i+1)+'<small>+1 draw next</small>'; q.appendChild(s); }
  }
  const h=$('#custHand'); h.innerHTML='';
  const base=combos.length;
  p.hand.forEach((inst,i)=>{ const el=cardEl(inst.card,inst.left!=null?`<span class="badge">${inst.left} left</span>`:''); el.title='Key '+(i+1);
    el.dataset.zone='hand'; el.dataset.i=i;
    // glow if adding this card to the queue would make a new combo
    if(p.queue.length<slots&&detectCombos([...p.queue,inst]).length>base) el.classList.add('hint');
    else if(p.queue.length&&p.queue.length<slots&&recipeStep([...p.queue.map(c=>c.card),inst.card])&&!oneRune([...p.queue.map(c=>c.card),inst.card])) el.classList.add('recipe-step');   // part of a recipe with what is queued
    else if(p.queue.length&&oneRune([...p.queue.map(c=>c.card),inst.card])) el.classList.add('rune-match');   // same rune as the queue
    if(dealt.has(inst.uid)){ el.classList.add('deal'); el.style.animationDelay=(i*.06)+'s'; }
    dragCard(el,inst); h.appendChild(el); });
  B.justDrawn=null;
  $('#custEmpty').textContent=wandOnly(p)?'Your deck is empty. Fight on with your wand!':!p.draw.length?'Deck empty: these are your last cards.':'';
  const empty=Math.max(0,RULES.slots-p.queue.length);
  $('#btnFight').textContent=wandOnly(p)?'Fight!':'Fight!'+(empty?' (+'+empty+' draw next time)':'');
}
/* Drag and drop on the Custom screen. A tap moves a card between hand and queue, a hold shows
   its detail, and a drag puts it exactly where it is dropped: a slot (swapping if full), a
   place in the hand, or back out of the queue. */
let drag=null;
function dragCard(el,inst){
  el.addEventListener('pointerdown',e=>{
    if(e.button>0) return;
    drag={el,inst,x0:e.clientX,y0:e.clientY,moved:false,long:false,ghost:null,over:null};
    drag.timer=setTimeout(()=>{ if(drag&&!drag.moved){ drag.long=true; showDetail(inst.card); } },450);
    try{ el.setPointerCapture(e.pointerId); }catch(_){}
  });
  el.addEventListener('pointermove',e=>{
    if(!drag||drag.el!==el) return;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>8){
      drag.moved=true; clearTimeout(drag.timer);
      const r=el.getBoundingClientRect(), g=el.cloneNode(true); g.classList.add('drag-ghost'); g.classList.remove('deal','hint');
      g.style.width=r.width+'px'; g.style.left=r.left+'px'; g.style.top=r.top+'px'; drag.dx=e.clientX-r.left; drag.dy=e.clientY-r.top;
      document.body.appendChild(g); drag.ghost=g; el.classList.add('dragging'); buzz(8); }
    if(drag.moved){ drag.ghost.style.left=(e.clientX-drag.dx)+'px'; drag.ghost.style.top=(e.clientY-drag.dy)+'px';
      const t=dropTarget(e.clientX,e.clientY); if(drag.over&&drag.over!==t) drag.over.classList.remove('drop'); if(t) t.classList.add('drop'); drag.over=t; }
  });
  const end=e=>{
    if(!drag||drag.el!==el) return;
    clearTimeout(drag.timer); const d=drag; drag=null;
    if(d.ghost) d.ghost.remove(); if(d.over) d.over.classList.remove('drop'); el.classList.remove('dragging');
    const p=B.piles;
    if(d.moved){ const t=e.type==='pointercancel'?null:dropTarget(e.clientX,e.clientY);
      if(t){ const zone=t.dataset.zone, i=t.dataset.i!=null?+t.dataset.i:null; placeCard(p,d.inst.uid,zone,i); buzz(10); } }
    else if(!d.long){ if(!toggleQueue(p,d.inst.uid)) tip('The queue is full'); }
    renderCustom();
  };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
function dropTarget(x,y){ const el=document.elementFromPoint(x,y); return el&&el.closest('#custom [data-zone]'); }
$('#btnFight').onclick=closeCustomScreen;

/* ---------------- HUD ---------------- */
const last={};
function set(key,val,fn){ if(last[key]!==val){ last[key]=val; fn(val); } }
function hud(force){
  const b=B; if(!b) return; if(force) for(const k in last) delete last[k];
  const p=b.player, pl=b.piles;
  set('hp',p.hp+'/'+p.maxHp,()=>hpMeter($('#hpBar'),$('#hpTxt'),p.hp,p.maxHp));
  set('depth',b.depth+'|'+Math.ceil(b.wave),()=>{ const t=$('#depthTxt'); t.textContent='Depth '+b.depth+' · '+areaOf(b.depth).name+(b.waves.length>1?' · Wave '+(Math.ceil(b.wave)+1)+'/'+b.waves.length:''); t.style.color=areaOf(b.depth).glow; });
  set('piles',pl.draw.length+'|'+pl.hand.length+'|'+pl.discard.length,()=>$('#pileTxt').textContent='Deck '+pl.draw.length+' · Hand '+pl.hand.length+' · Used '+pl.discard.length);
  set('gauge',Math.round(b.gauge*10),()=>$('#gaugeBar').style.width=(b.gauge/GAUGE_MAX*100)+'%');
  const buffs=[]; if(p.barrier>0) buffs.push('🛡 '+Math.ceil(p.barrier)+' · '+p.shieldTurns+(p.shieldTurns>1?' turns':' turn')); if(p.dodge) buffs.push('💨 Dodge'); if(p.invT>0) buffs.push('🌀 Phase');
  if(p.powerT>0) buffs.push('⚡ Wand ×2.5 '+Math.ceil(p.powerT)+'s'); if(p.pactT>0) buffs.push('☾ Pact '+Math.ceil(p.pactT)+'s'); if(p.courageT>0) buffs.push('☀ Courage '+Math.ceil(p.courageT)+'s'); if(p.intervene) buffs.push('✟ Intervention');
  if(p.hero&&p.hero.hp>0) buffs.unshift('♔ '+p.hero.card.name.split(',')[0]+' · '+p.hero.turns+(p.hero.turns>1?' turns':' turn'));
  if(p.rootT>0) buffs.unshift('❦ Rooted '+p.rootT.toFixed(1)+'s');
  if(p.hasteT>0) buffs.push('🌬 Haste '+Math.ceil(p.hasteT)+'s'); if(p.regenT>0) buffs.push('🌿 Regen '+Math.ceil(p.regenT)+'s');
  set('buffs',buffs.join('   '),v=>$('#buffs').textContent=v);
  set('queue',pl.queue.map(c=>c.uid+':'+(c.left==null?'':c.left)+(c.frozenT>0?'f':'')).join(','),()=>{
    const row=$('#queueRow'); row.innerHTML='';
    const locked=pl.queue.filter(c=>c.combo), cb=$('#comboBar');
    cb.hidden=!locked.length; if(locked.length) cb.textContent='✦ '+(pl.combos||[]).map(c=>c.label.split(':')[0]).join(' · ');
    for(let i=0;i<Math.max(RULES.slots,pl.queue.length);i++){ const inst=pl.queue[i], d=document.createElement('div');
      d.className='qslot'+(inst?' full':'')+(i===0&&inst?' next':'')+(inst&&inst.combo?' combo':'')+(inst&&inst.frozenT>0?' frozen':'');
      if(inst){ const c=inst.card, uses=c.uses?' ×'+(inst.left==null?c.uses:inst.left):'', R=ROLES[cardRole(c)]; d.style.setProperty('--c',COLORS[c.color].c); d.style.setProperty('--rc',R.c);
        d.innerHTML=`<span class="role">${R.icon} ${R.name}</span><span class="nm">${inst.frozenT>0?'❄ ':''}${esc(c.name)}${uses}${inst.temp&&!inst.recipe?' (copy)':''}</span>`; }
      else d.textContent='—';
      row.appendChild(d); }
    const nx=pl.queue[0], NR=nx&&ROLES[cardRole(nx.card)]; $('#castName').textContent=nx?NR.icon+' '+nx.card.name:'queue empty';
    $('#btnCast').style.setProperty('--rc',NR?NR.c:'transparent'); $('#btnCast').classList.toggle('role',!!NR);
    $('#btnCast').disabled=!pl.queue.length;
  });
  const canCustom=b.phase==='fight'&&gaugeFull()&&!wandOnly(pl);
  set('custom',canCustom,v=>{ const bt=$('#btnCustom'); bt.disabled=!v; bt.classList.toggle('ready',v); bt.innerHTML=v?'✦ Custom<small>cards ready</small>':'Custom'; });
}

/* ---------------- battle input ---------------- */
function tryCustom(){ if(!(B&&B.phase==='fight'&&gaugeFull()&&!wandOnly(B.piles))) return;
  if(B.player.charging){ wandUp(); $('#btnWand').classList.remove('charging'); }   // a shot you were charging goes off first
  openCustomScreen(); }
/* Mobile browsers never make a click from a touch while another finger is down, so with the
   thumb holding Fire a tap on Cast did nothing. Battle buttons act on their own pointerdown
   instead (each finger is its own pointer); click is kept only for keyboard/assistive presses. */
function pressBtn(el,fn){
  el.addEventListener('pointerdown',e=>{ if(e.button>0) return; e.preventDefault(); if(!el.disabled) fn(); });
  el.addEventListener('click',e=>{ if(e.detail===0) fn(); });
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
pressBtn($('#btnCustom'),tryCustom);
pressBtn($('#btnCast'),castCard);
const wandBtn=$('#btnWand');
// the Fire button keeps its finger even if the thumb slides off it, so you can fire with one
// thumb while tapping the board to move with the other
wandBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ wandBtn.setPointerCapture(e.pointerId); }catch(_){} wandDown(); wandBtn.classList.add('charging'); });
['pointerup','pointercancel'].forEach(ev=>wandBtn.addEventListener(ev,()=>{ wandBtn.classList.remove('charging'); wandUp(); }));
wandBtn.addEventListener('contextmenu',e=>e.preventDefault());

let dragging=false;
View.canvas=$('#board'); View.ctx=View.canvas.getContext('2d');
View.canvas.addEventListener('pointerdown',e=>{ const t=pickTile(e.clientX,e.clientY); if(t&&t.side==='e'){ setAim(t); return; } dragging=true; moveTo(t); });
View.canvas.addEventListener('pointermove',e=>{ if(!dragging) return; const t=pickTile(e.clientX,e.clientY); if(t&&t.side==='p') moveTo(t); });
['pointerup','pointercancel','pointerleave'].forEach(ev=>View.canvas.addEventListener(ev,()=>dragging=false));
window.addEventListener('resize',()=>{ if($('#scrBattle').classList.contains('on')) resizeView(); });

const held=new Set();
window.addEventListener('keydown',e=>{
  if(!B||!$('#scrBattle').classList.contains('on')) return; const k=e.key.toLowerCase();
  if(B.phase==='custom'){
    const n=parseInt(k,10);
    if(n>=1&&n<=7&&B.piles.hand[n-1]){ toggleQueue(B.piles,B.piles.hand[n-1].uid); renderCustom(); }
    else if(k==='backspace'&&B.piles.queue.length){ toggleQueue(B.piles,B.piles.queue[B.piles.queue.length-1].uid); renderCustom(); }
    else if(k==='enter'||k===' '){ e.preventDefault(); closeCustomScreen(); }
    return;
  }
  if(B.phase!=='fight'||paused||held.has(k)) return; held.add(k);
  const a=typeof keyAct==='function'?keyAct(k,'battle'):null;   // your bindings, from Settings (keys.js)
  if(a) e.preventDefault();
  if(a==='left') stepDir(DIRS.W);
  else if(a==='right') stepDir(DIRS.E);
  else if(a==='up') stepVertical(true);
  else if(a==='down') stepVertical(false);
  else if(a==='fire') wandDown();
  else if(a==='cast') castCard();
  else if(a==='custom') tryCustom();
  else if(a==='aim') cycleAim();
});
window.addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); held.delete(k); if(typeof keyAct==='function'&&keyAct(k,'battle')==='fire') wandUp(); });

/* ---------------- loop ---------------- */
let prev=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-prev)/1000); prev=now;
  if(B&&$('#scrBattle').classList.contains('on')){
    if(!paused) update(dt);
    // The Custom screen never opens by itself: when the gauge is full the Custom button glows and you open it.
    render(); hud();
  }
  requestAnimationFrame(frame);
}
/* ---------------- phone or tablet layout ----------------
   Phone keeps everything in one narrow column with 4 cards to a row; tablet spreads the camp
   into two columns, shows 7 cards to a row in battle and uses bigger buttons and text. It
   starts from the screen's width and the player can switch it; the choice is remembered. */
const LAYOUT_KEY='hexmancers-layout';
function getLayout(){ try{ const v=localStorage.getItem(LAYOUT_KEY); if(v==='phone'||v==='tablet') return v; }catch(e){} let w=innerWidth; try{ const o=localStorage.getItem('hexmancers-orient'); if((o==='portrait'&&innerWidth>innerHeight)||(o==='landscape'&&innerHeight>innerWidth)) w=innerHeight; }catch(e){} return w>=700?'tablet':'phone'; }
function setLayout(m,keep){ document.body.classList.toggle('ui-tablet',m==='tablet'); document.body.classList.toggle('ui-phone',m!=='tablet');
  if(keep){ try{ localStorage.setItem(LAYOUT_KEY,m); }catch(e){} }
  document.querySelectorAll('.layoutBtn').forEach(b=>{ b.innerHTML=`<b class="${m==='phone'?'on':''}">Phone</b> ⇄ <b class="${m==='tablet'?'on':''}">Tablet</b>`; b.setAttribute('aria-label','Layout: '+m+'. Tap to switch.'); });
  if($('#scrCamp').classList.contains('on')) campScene();
  if($('#scrBattle').classList.contains('on')) resizeView(); }
document.querySelectorAll('.layoutBtn').forEach(b=>b.onclick=()=>setLayout(document.body.classList.contains('ui-tablet')?'phone':'tablet',true));
setLayout(getLayout());
/* Testing tools (boss tests at camp, free gear and scrolls on the Character screen) stay hidden
   unless switched on in Settings, or by opening the game with ?dev in the address. */
const DEV_KEY='hexmancers-dev';
try{ if(/[?&]dev\b/.test(location.search)) localStorage.setItem(DEV_KEY,'1'); }catch(e){}
function applyDev(){ let on=false; try{ on=localStorage.getItem(DEV_KEY)==='1'; }catch(e){} document.body.classList.toggle('dev',on); $('#setDev').textContent=on?'On':'Off'; }
$('#setDev').onclick=()=>{ const on=!document.body.classList.contains('dev'); try{ localStorage.setItem(DEV_KEY,on?'1':'0'); }catch(e){} applyDev(); };
applyDev();
// sound effects in the dungeon (dungeon.js), on unless switched off
function applySfx(){ let on=true; try{ on=localStorage.getItem('hexmancers-sfx')!=='0'; }catch(e){} $('#setSfx').textContent=on?'On':'Off'; }
$('#setSfx').onclick=()=>{ let on=true; try{ on=localStorage.getItem('hexmancers-sfx')!=='0'; localStorage.setItem('hexmancers-sfx',on?'0':'1'); }catch(e){} applySfx(); };
applySfx();
/* the window's shape and size: .wide or .tall, and --ui, the scale for menus and the HUD.
   1 on phones; on bigger screens it grows so text and buttons stay a comfortable size. */
/* Screen orientation (Settings): auto follows the device; portrait or landscape keeps the game that way.
   Where the browser can lock the screen (full screen on most phones) it does; otherwise, when the
   device is held the other way, the whole game is turned a quarter so it stays as chosen. */
const ORIENT_KEY='hexmancers-orient';
const getOrient=()=>{ try{ const v=localStorage.getItem(ORIENT_KEY); if(v==='portrait'||v==='landscape') return v; }catch(e){} return 'auto'; };
function lockOrient(){ const o=getOrient(), so=screen.orientation;
  try{ if(!so) return; if(o==='auto'){ if(so.unlock) so.unlock(); return; } if(so.lock&&(document.fullscreenElement||document.webkitFullscreenElement)) so.lock(o).catch(()=>{}); }catch(e){} }
function applyOrient(){ const o=getOrient(), portraitNow=innerHeight>=innerWidth, app=$('#app');
  const turn=o!=='auto'&&(o==='portrait')!==portraitNow;
  app.classList.toggle('rot',turn); document.body.classList.toggle('rot',turn);
  if(turn){ app.style.width=innerHeight+'px'; app.style.height=innerWidth+'px'; } else { app.style.width=''; app.style.height=''; }
  const b=$('#setOrient'); if(b) b.textContent={auto:'Auto',portrait:'Portrait',landscape:'Landscape'}[o]; }
$('#setOrient').onclick=()=>{ const n={auto:'portrait',portrait:'landscape',landscape:'auto'}[getOrient()]; try{ localStorage.setItem(ORIENT_KEY,n); }catch(e){} lockOrient(); applyViewport(); };
function applyViewport(){
  applyOrient();
  const rot=$('#app').classList.contains('rot'), w=rot?innerHeight:innerWidth, h=rot?innerWidth:innerHeight, wide=w>h*1.15;
  // size classes from the game's own frame (it may be turned), in place of media queries on the screen
  const B=document.body.classList; B.toggle('lsS',w>h&&h<=560); B.toggle('lsXS',w>h&&h<=500); B.toggle('hTall',h>=561); B.toggle('h460',h<=460); B.toggle('w420',w<=420); B.toggle('w520',w<=520);
  document.body.classList.toggle('wide',wide); document.body.classList.toggle('tall',!wide);
  const s=wide?Math.min(h/760,w/1250):Math.min(w/560,h/1000);
  document.documentElement.style.setProperty('--ui',Math.max(1,Math.min(2.5,s)).toFixed(3));
  if($('#scrBattle').classList.contains('on')) requestAnimationFrame(resizeView);
  if($('#scrCamp').classList.contains('on')) campScene();
}
addEventListener('resize',applyViewport); addEventListener('orientationchange',()=>setTimeout(applyViewport,150));
applyViewport();
openMenu();
requestAnimationFrame(frame);

/* ---------------- main menu ----------------
   The game opens here: Continue goes to camp; Explore and Battle start at the depth shown
   (any depth from 1 to your deepest); New game picks a starter deck. */
function openMenu(){
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; }
  const has=!!save;
  if(has){ if(pickDepth==null) pickDepth=save.deepest; pickDepth=Math.min(Math.max(1,pickDepth),save.deepest); }
  else pickDepth=1;
  $('#mmContinue').style.display=has?'':'none';
  $('#mmSave').innerHTML=has?'<i class="mmthumb"></i><div class="mmdeep"><span>Deepest: depth <b>'+save.deepest+'</b></span><small>'+esc(areaOf(save.deepest).name)+'</small></div><div class="mmgold"><span class="goldtxt">'+uiIcon('coin',20)+save.gold+'</span><small>'+ownedUnique(save)+' cards</small></div>'
    :'<i class="mmthumb"></i><div class="mmdeep"><small>No save yet. Start a new game to pick your first deck.</small></div>';
  $('#mmDepth').textContent=pickDepth; $('#mmArea').textContent=areaLabel(pickDepth); $('#mmArea').style.color=areaOf(pickDepth).glow;
  $('#mmDown').disabled=!has||pickDepth<=1; $('#mmUp').disabled=!has||pickDepth>=save.deepest;
  const v=has?validateDeck(activeDeck().list,CARDS,save.owned):{ok:false};
  $('#mmExplore').disabled=$('#mmBattle').disabled=!has||!v.ok;
  $('#mmWarn').textContent=!has?'':v.ok?'':'Your deck is not ready ('+(v.errors[0]||'invalid')+'). Fix it in the deck builder at camp.';
  $('#mmNew').classList.toggle('big',!has);
  show('scrMenu');
}
$('#mmDown').onclick=()=>{ pickDepth--; openMenu(); };
$('#mmUp').onclick=()=>{ pickDepth++; openMenu(); };
$('#mmContinue').onclick=()=>openCamp();
$('#mmExplore').onclick=()=>enterExplore(pickDepth);
$('#mmBattle').onclick=()=>fight(pickDepth);
$('#mmNew').onclick=()=>buildStart();
$('#mmSettings').onclick=()=>openSettings();
$('#startBack').onclick=()=>openMenu();
$('#campMenu').onclick=()=>openMenu();
