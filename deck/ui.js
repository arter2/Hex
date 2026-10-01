/* Hexmancers deck prototype — screens, HUD and controls for the collecting loop:
   camp -> fight -> card drops -> deck builder / collection / shop -> camp. */

const $=s=>document.querySelector(s);
let save=loadSave();
const persist=()=>writeSave(save);
const activeDeck=()=>save.decks[save.active];

function show(id){ $('#tip').classList.remove('on'); document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); if(id==='scrBattle') resizeView(); window.scrollTo(0,0); }
let tipT=0; function tip(msg){ const t=$('#tip'); t.textContent=msg; t.classList.add('on'); clearTimeout(tipT); tipT=setTimeout(()=>t.classList.remove('on'),1400); }
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function cardEl(c,extra,locked){
  const el=document.createElement('button'), col=COLORS[c.color];
  el.className='card'+(c.rarity==='legendary'?' leg':'')+(c.rarity==='hero'?' hero':'')+(locked?' locked':''); el.style.setProperty('--c',col.c);
  const stat=c.pow||(c.boon!=='gauge'&&c.amt)||c.hp||'';
  el.innerHTML=locked?`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div><div class="art"></div><div class="cn">???</div><div class="ty">${TYPES[c.type].name}</div><div class="tx"></div><div class="cp"><span></span><small>${RARITY[c.rarity].g}</small></div>`
    :`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div>
    <img class="art" src="${artURL(c)}" alt=""><div class="cn">${esc(c.name)}</div><div class="ty">${TYPES[c.type].name}</div><div class="tx">${esc(cardText(c))}</div>
    <div class="cp"><span>${stat}</span><small title="${RARITY[c.rarity].n}">${RARITY[c.rarity].g}</small></div>`;
  if(extra) el.insertAdjacentHTML('beforeend',extra);
  return el;
}
function showDetail(c){
  const box=$('#dtCard'); box.innerHTML=''; box.appendChild(cardEl(c,'',!save.seen[c.id]));
  const inDeck=activeDeck().list.filter(id=>id===c.id).length;
  $('#dtInfo').textContent=save.seen[c.id]?COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0)+' · in deck '+inDeck
    :'Not found yet. '+RARITY[c.rarity].n+' '+COLORS[c.color].name+' '+TYPES[c.type].name+'.';
  if(c.uses&&save.owned[c.id]) $('#dtInfo').textContent+=' · uses left per copy: '+Array.from({length:save.owned[c.id]},(_,k)=>chargeLeft(save,c.id,k)+'/'+c.uses).join(', ');
  $('#detail').classList.add('on');
}
$('#dtClose').onclick=()=>$('#detail').classList.remove('on');
// long-press (or right-click) any card in a grid for its detail
let pressT=0, pressed=false;
function longPress(el,c){
  el.addEventListener('pointerdown',()=>{ pressed=false; clearTimeout(pressT); pressT=setTimeout(()=>{ pressed=true; showDetail(c); },450); });
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>el.addEventListener(ev,()=>clearTimeout(pressT)));
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); showDetail(c); });
}

function reveal(title,body,results,buttons,extras){
  $('#rvTitle').textContent=title; $('#rvBody').textContent=body;
  const g=$('#rvCards'); g.innerHTML='';
  (extras||[]).forEach((x,i)=>{ const el=document.createElement('div'); el.className='reward flip'; el.style.animationDelay=(i*.12)+'s'; el.innerHTML=`<b>${x.icon}</b><span>${esc(x.name)}</span><small>${esc(x.text)}</small>`; g.appendChild(el); });
  results.forEach((r,i)=>{ const el=cardEl(r.card,r.isNew?'<span class="badge new">NEW</span>':''); el.style.animationDelay=(i*.12)+'s'; el.classList.add('flip'); el.onclick=()=>showDetail(r.card); g.appendChild(el); });
  const bb=$('#rvBtns'); bb.innerHTML=''; bb.classList.toggle('two',buttons.length>1);
  buttons.forEach(([label,fn,ghost])=>{ const b=document.createElement('button'); b.className='btn'+(ghost?' ghost':''); b.textContent=label; b.onclick=()=>{ $('#reveal').classList.remove('on'); fn(); }; bb.appendChild(b); });
  $('#reveal').classList.add('on');
}

/* ---------------- start ---------------- */
function buildStart(){
  const box=$('#starters'); box.innerHTML='';
  for(const s of STARTERS){
    const d=document.createElement('div'); d.className='starter';
    d.innerHTML=`<h3>${s.name}</h3><div class="cols">${s.colors.map(c=>`<span class="chip" style="--c:${COLORS[c].c}">${COLORS[c].icon} ${COLORS[c].name}</span>`).join('')}</div>
      <p>${s.text}</p><div class="row"><button class="btn">Start with this deck</button></div>`;
    d.querySelector('.btn').onclick=()=>{ save=newSave(s); persist(); openCamp(); };
    box.appendChild(d);
  }
  show('scrStart');
}

/* ---------------- camp ---------------- */
let pickDepth=1;
function openCamp(){
  pickDepth=Math.min(Math.max(1,pickDepth),save.deepest);
  if(pickDepth===1&&save.deepest>1) pickDepth=save.deepest;
  const d=activeDeck(), v=validateDeck(d.list,CARDS,save.owned);
  $('#campGold').textContent='🪙 '+save.gold+' gold';
  $('#campColl').textContent='🂠 '+ownedUnique(save)+' / '+CARD_LIST.length+' cards'+(itemCount(save)?' · 🧪 '+itemCount(save):'');
  $('#campDeck').textContent=d.name;
  const cnt=$('#campDeckCount'); cnt.textContent=v.count+' / '+RULES.max; cnt.classList.toggle('bad',!v.ok);
  $('#campDeckErr').textContent=v.ok?'':v.errors[0]+(v.errors.length>1?' (+'+(v.errors.length-1)+' more)':'')+'. Fix it in the deck builder.';
  $('#btnDescend').textContent='Fight at depth '+pickDepth+(pickDepth%4===0?' · boss':'');
  $('#btnDescend').disabled=!v.ok;
  $('#depthDown').disabled=pickDepth<=1; $('#depthUp').disabled=pickDepth>=save.deepest;
  show('scrCamp');
}
$('#depthDown').onclick=()=>{ pickDepth--; openCamp(); };
$('#depthUp').onclick=()=>{ pickDepth++; openCamp(); };
$('#btnDescend').onclick=()=>fight(pickDepth);
$('#goBuilder').onclick=()=>openBuilder();
$('#goCollection').onclick=()=>openCollection();
$('#goShop').onclick=()=>openShop();
// Two-tap confirmation in the page itself (browser confirm dialogs are blocked in some viewers):
// the first tap arms the button and changes its label, a second tap within 3 seconds acts.
function armed(btn,label,act){ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; act(); return; }
  btn.dataset.label=btn.textContent; btn.dataset.armed='1'; btn.textContent=label;
  setTimeout(()=>{ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; } },3000); }
$('#btnReset').onclick=e=>armed(e.currentTarget,'Tap again to erase your collection',()=>{ clearSave(); save=null; buildStart(); });
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
    Object.keys(TYPES).filter(k=>byType[k]).map(k=>`<span class="chip" style="--c:#b9a3ff">${TYPES[k].icon} ${TYPES[k].name} ${byType[k]}</span>`).join('');
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
$('#cTabMine').onclick=()=>{ cf.mine=true; cf.owned=''; openCollection(); };
$('#cTabAll').onclick=()=>{ cf.mine=false; openCollection(); };
$('#cSort').onchange=e=>{ cf.sort=e.target.value; renderCollection(); };
const SORTS={family:byFamily, rank:(a,b)=>a.rank-b.rank||byFamily(a,b), rarity:(a,b)=>RAR_ORDER.indexOf(b.rarity)-RAR_ORDER.indexOf(a.rarity)||byFamily(a,b),
  copies:(a,b)=>(save.owned[b.id]||0)-(save.owned[a.id]||0)||byFamily(a,b), name:(a,b)=>a.name.localeCompare(b.name)};
function renderCollection(){
  $('#cTabMine').classList.toggle('on',cf.mine); $('#cTabAll').classList.toggle('on',!cf.mine); $('#cSort').value=cf.sort;
  const copies=Object.keys(save.owned).reduce((a,id)=>a+(CARDS[id]?save.owned[id]:0),0);
  $('#cTitle').textContent=cf.mine?'My cards':'All cards';
  $('#cCount').textContent=cf.mine?ownedUnique(save)+' cards · '+copies+' copies':ownedUnique(save)+' / '+CARD_LIST.length;
  renderItems($('#cItems'),false); $('#cItems').hidden=!cf.mine;
  if(cf.mine){ const inDeck={}; activeDeck().list.forEach(id=>inDeck[id]=(inDeck[id]||0)+1);
    const fam={}; Object.keys(save.owned).forEach(id=>{ const c=CARDS[id]; if(c&&save.owned[id]>0) fam[c.color]=(fam[c.color]||0)+save.owned[id]; });
    $('#cProgress').innerHTML=FAM_ORDER.filter(k=>fam[k]).map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k]}</span>`).join('');
    const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&passes(c,cf)).sort(SORTS[cf.sort]);
    paged($('#cGrid'),items,c=>{ const el=cardEl(c,`<span class="badge">×${save.owned[c.id]}${inDeck[c.id]?' · '+inDeck[c.id]+' in deck':''}</span>`); el.onclick=()=>showDetail(c); return el; });
    if(!items.length) $('#cGrid').innerHTML='<p class="hint">No cards match.</p>';
    return; }
  const fam={}; CARD_LIST.forEach(c=>{ fam[c.color]=fam[c.color]||[0,0]; fam[c.color][1]++; if(save.seen[c.id]) fam[c.color][0]++; });
  $('#cProgress').innerHTML=FAM_ORDER.map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k][0]}/${fam[k][1]}</span>`).join('');
  const items=CARD_LIST.filter(c=>passes(c,cf)).sort(SORTS[cf.sort]);
  paged($('#cGrid'),items,c=>{ const own=save.owned[c.id]||0; const el=cardEl(c,own?`<span class="badge">×${own}</span>`:'',!save.seen[c.id]); el.onclick=()=>showDetail(c); return el; });
}

/* ---------------- shop ---------------- */
function openShop(){
  $('#sGold').textContent='🪙 '+save.gold;
  $('#buyBooster').textContent='Buy · '+PACK_PRICE.booster+' gold'; $('#buyBooster').disabled=save.gold<PACK_PRICE.booster;
  const box=$('#famPacks'); box.innerHTML='';
  for(const k of FAM_ORDER){ const b=document.createElement('button'); b.className='btn ghost fam'; b.style.setProperty('--c',COLORS[k].c);
    b.innerHTML=`${COLORS[k].icon} ${COLORS[k].name}<small>${PACK_PRICE.family} gold</small>`; b.disabled=save.gold<PACK_PRICE.family; b.onclick=()=>buyPack(k); box.appendChild(b); }
  show('scrShop');
}
$('#buyBooster').onclick=()=>buyPack(null);
function buyPack(color){
  const price=color?PACK_PRICE.family:PACK_PRICE.booster; if(save.gold<price) return;
  save.gold-=price; const res=addCards(save,openPack(save.deepest,color)); persist(); openShop();
  reveal(color?COLORS[color].name+' pack':'Booster pack',res.filter(r=>r.isNew).length+' new cards',res,[['Continue',()=>{}]]);
}

/* ---------------- battle flow ---------------- */
function fight(depth){
  const d=activeDeck(); if(!validateDeck(d.list,CARDS,save.owned).ok) return openCamp();
  $('#reveal').classList.remove('on');
  show('scrBattle');
  startBattle(d.list,depth,{
    onCustom:renderCustom,
    onFight:()=>{ $('#custom').classList.remove('on'); hud(true); },
    onCast:(c,inst)=>{ showCast(c,inst); buzz(12); },
    onHurt:d=>{ buzz(d>=15?60:30); const h=$('#hurtFx'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); },
    onTurn:n=>banner('Turn '+n,'#9b7bff'),
    onWave:i=>banner('Wave '+(i+1),'#ff5d6c'),
    onCombo:label=>banner('✦ '+label.split(':')[0],'#ffe066'),
    onHero:c=>banner('♔ '+c.name.split(',')[0]+' joins the fight!','#ffe066'),
    onEnd:win=>win?victory():defeat(),
  },{prepare:p=>assignChargeUses(save,p,d.list)});
  hud(true);
}
// charge uses spent this fight carry over; a copy that ran dry burns up
function settleCharges(){ const burned=settleChargeUses(save,B.piles); persist();
  return burned.length?' Burned up: '+burned.map(x=>x.card.name+(x.n>1?' ×'+x.n:'')).join(', ')+'.':''; }
function victory(){
  const b=B, boss=b.enemies.some(e=>e.def.boss);
  const rw=battleRewards(b.enemies.filter(e=>!e.def.minion).map(e=>e.color),b.depth,boss,null,save.owned);
  save.gold+=rw.gold; save.wins++; if(b.depth>=save.deepest) save.deepest=b.depth+1;
  rw.items.forEach(id=>addItem(save,id));
  const res=addCards(save,rw.cards); const burnt=settleCharges();
  const depth=b.depth;
  const hero=rw.cards.find(c=>c.rarity==='hero');
  const got=[...rw.cards.map(c=>c.name),...(rw.gold?['🪙 '+rw.gold+' gold']:[]),...rw.items.map(id=>ITEMS[id].icon+' '+ITEMS[id].name)];
  reveal(hero?'♔ A hero joins you!':boss?'Boss defeated!':'Victory!',(hero?hero.name+' answers your call. ':'')+'Depth '+depth+' cleared in '+Math.round(b.time)+'s. '+(boss?'Boss rewards: ':'Your reward: ')+got.join(', ')+'.'+burnt,res,
    [['Camp',()=>{ B=null; pickDepth=depth+1; openCamp(); },true],['Depth '+(depth+1)+' →',()=>fight(depth+1)]],
    [...(rw.gold?[{icon:'🪙',name:rw.gold+' gold',text:'Spend it on packs in the shop'}]:[]),...rw.items.map(id=>ITEMS[id])]);
}
function defeat(){
  const lost=Math.floor(save.gold*.2); save.gold-=lost; const burnt=settleCharges();
  const depth=B.depth;
  reveal('Defeated…','You fell at depth '+depth+' and dropped '+lost+' gold. Your cards are safe.'+burnt,[],
    [['Camp',()=>{ B=null; openCamp(); },true],['Retry',()=>fight(depth)]]);
}
$('#btnRetreat').onclick=e=>{ if(B) armed(e.currentTarget,'Tap again to retreat',()=>{ const burnt=settleCharges(); if(burnt) tip(burnt.trim()); B=null; paused=false; $('#bMenu').classList.remove('on'); $('#custom').classList.remove('on'); openCamp(); }); };
// the card you cast pops up large and flies onto the board, Hearthstone style
function showCast(c,inst){ const box=$('#castFx'); box.innerHTML=''; const el=cardEl(c,inst&&inst.combo?`<span class="tag">✦ ${esc(inst.combo.split(':')[0])}</span>`:''); box.appendChild(el); }
function banner(text,color){ const b=$('#banner'); b.textContent=text; b.style.setProperty('--bc',color); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
// phone helpers: a short buzz on hits, a pause menu, full screen
const buzz=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
let paused=false;
$('#btnMenu').onclick=()=>{ paused=true; if(B) B.player.charging=false; $('#bMenu').classList.add('on'); };
$('#mResume').onclick=()=>{ paused=false; $('#bMenu').classList.remove('on'); };
$('#mFull').onclick=()=>{ const d=document, el=d.documentElement;
  try{ if(d.fullscreenElement||d.webkitFullscreenElement) (d.exitFullscreen||d.webkitExitFullscreen).call(d); else{ const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el); if(r&&r.catch) r.catch(()=>tip('Full screen is not available here')); } }catch(e){ tip('Full screen is not available here'); } };
document.addEventListener('fullscreenchange',()=>{ $('#mFull').textContent=document.fullscreenElement?'Exit full screen':'Full screen'; setTimeout(resizeView,50); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&B&&B.phase==='fight'&&$('#scrBattle').classList.contains('on')) $('#btnMenu').onclick(); });

// the combos a queue makes, as gold chips
function comboChips(combos){ return combos.length?combos.map(c=>`<span>✦ ${esc(c.label)}</span>`).join(''):''; }
function renderCustom(){
  const p=B.piles, dealt=B.justDrawn||new Set();
  $('#custom').classList.add('on');
  $('#custPiles').textContent='Deck '+p.draw.length+' · Discard '+p.discard.length;
  const combos=detectCombos(p.queue), inCombo=new Set();
  for(const cb of combos){ if(cb.kind==='simple') p.queue.forEach(c=>{ if(c.card.id===cb.id) inCombo.add(c.uid); }); else p.queue.forEach(c=>inCombo.add(c.uid)); }
  $('#custCombo').innerHTML=comboChips(combos)||'<span class="none">No combo yet: match copies, colors, or ranks in a row</span>';
  const q=$('#custQueue'); q.innerHTML='';
  for(let i=0;i<RULES.slots;i++){
    const inst=p.queue[i];
    if(inst){ const el=cardEl(inst.card,`<span class="ord">${i+1}</span>`); el.dataset.zone='queue'; el.dataset.i=i; if(inCombo.has(inst.uid)) el.classList.add('combo'); dragCard(el,inst); q.appendChild(el); }
    else { const s=document.createElement('div'); s.className='slot'; s.dataset.zone='queue'; s.dataset.i=i; s.innerHTML='Slot '+(i+1)+'<small>+1 draw next</small>'; q.appendChild(s); }
  }
  const h=$('#custHand'); h.innerHTML='';
  const base=combos.length;
  p.hand.forEach((inst,i)=>{ const el=cardEl(inst.card,inst.left!=null?`<span class="badge">${inst.left} left</span>`:''); el.title='Key '+(i+1);
    el.dataset.zone='hand'; el.dataset.i=i;
    // glow if adding this card to the queue would make a new combo
    if(p.queue.length<RULES.slots&&detectCombos([...p.queue,inst]).length>base) el.classList.add('hint');
    if(dealt.has(inst.uid)){ el.classList.add('deal'); el.style.animationDelay=(i*.06)+'s'; }
    dragCard(el,inst); h.appendChild(el); });
  B.justDrawn=null;
  renderItems($('#custItems'),true);
  $('#custEmpty').textContent=wandOnly(p)?'Your deck is empty. Fight on with your wand!':!p.draw.length?'Deck empty: these are your last cards.':'';
  const empty=RULES.slots-p.queue.length;
  $('#btnFight').textContent=wandOnly(p)?'Fight!':'Fight!'+(empty?' (+'+empty+' draw next time)':'');
}
// Your potions: on the Custom screen a tap drinks one; in My cards they are just listed.
function renderItems(box,usable){
  const its=Object.keys(ITEMS).filter(id=>(save.items||{})[id]>0);
  box.innerHTML=its.length?(usable?'<span class="lbl">Items</span>':'<span class="lbl">Your items</span>'):usable?'':'<span class="lbl">No items yet. Normal fights sometimes give one, bosses always do.</span>';
  for(const id of its){ const it=ITEMS[id], b=document.createElement('button'); b.className='item'; b.title=it.text;
    b.innerHTML=`${it.icon} ${esc(it.name)} <b>×${save.items[id]}</b><small>${esc(it.text)}</small>`;
    if(usable) b.onclick=()=>{ if(!useItem(id)) return tip('That would do nothing right now');
      save.items[id]--; if(!save.items[id]) delete save.items[id]; persist(); buzz(15); tip(it.name+'!'); renderCustom(); };
    else b.disabled=true;
    box.appendChild(b); }
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
    else if(!d.long){ if(!toggleQueue(p,d.inst.uid)) tip('The queue holds '+RULES.slots+' cards'); }
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
  set('hp',p.hp+'/'+p.maxHp,v=>{ $('#hpTxt').textContent='HP '+v; $('#hpBar').style.width=(p.hp/p.maxHp*100)+'%'; });
  set('depth',b.depth+'|'+Math.ceil(b.wave),()=>$('#depthTxt').textContent='Depth '+b.depth+(b.waves.length>1?' · Wave '+(Math.ceil(b.wave)+1)+'/'+b.waves.length:''));
  set('piles',pl.draw.length+'|'+pl.hand.length+'|'+pl.discard.length,()=>$('#pileTxt').textContent='Deck '+pl.draw.length+' · Hand '+pl.hand.length+' · Used '+pl.discard.length);
  set('gauge',Math.round(b.gauge*10),()=>$('#gaugeBar').style.width=(b.gauge/GAUGE_MAX*100)+'%');
  const buffs=[]; if(p.barrier>0) buffs.push('🛡 '+Math.ceil(p.barrier)+' · '+p.shieldTurns+(p.shieldTurns>1?' turns':' turn')); if(p.dodge) buffs.push('💨 Dodge'); if(p.invT>0) buffs.push('🌀 Phase');
  if(p.powerT>0) buffs.push('⚡ Wand ×2.5 '+Math.ceil(p.powerT)+'s'); if(p.pactT>0) buffs.push('☾ Pact '+Math.ceil(p.pactT)+'s'); if(p.courageT>0) buffs.push('☀ Courage '+Math.ceil(p.courageT)+'s'); if(p.intervene) buffs.push('✟ Intervention');
  if(p.hero&&p.hero.hp>0) buffs.unshift('♔ '+p.hero.card.name.split(',')[0]+' · '+p.hero.turns+(p.hero.turns>1?' turns':' turn'));
  if(p.hasteT>0) buffs.push('🌬 Haste '+Math.ceil(p.hasteT)+'s'); if(p.regenT>0) buffs.push('🌿 Regen '+Math.ceil(p.regenT)+'s');
  set('buffs',buffs.join('   '),v=>$('#buffs').textContent=v);
  set('queue',pl.queue.map(c=>c.uid+':'+(c.left==null?'':c.left)).join(','),()=>{
    const row=$('#queueRow'); row.innerHTML='';
    const locked=pl.queue.filter(c=>c.combo), cb=$('#comboBar');
    cb.hidden=!locked.length; if(locked.length) cb.textContent='✦ '+(pl.combos||[]).map(c=>c.label.split(':')[0]).join(' · ');
    for(let i=0;i<RULES.slots;i++){ const inst=pl.queue[i], d=document.createElement('div');
      d.className='qslot'+(inst?' full':'')+(i===0&&inst?' next':'')+(inst&&inst.combo?' combo':'');
      if(inst){ const c=inst.card, uses=c.uses?' ×'+(inst.left==null?c.uses:inst.left):''; d.style.setProperty('--c',COLORS[c.color].c);
        d.innerHTML=`<span class="n">${TYPES[c.type].icon}</span>${esc(c.name)}${uses}${inst.temp?' (copy)':''}`; }
      else d.textContent='—';
      row.appendChild(d); }
    $('#castName').textContent=pl.queue[0]?pl.queue[0].card.name:'queue empty';
    $('#btnCast').disabled=!pl.queue.length;
  });
  const canCustom=b.phase==='fight'&&gaugeFull()&&!wandOnly(pl);
  set('custom',canCustom,v=>{ $('#btnCustom').disabled=!v; $('#btnCustom').classList.toggle('ready',v); });
}

/* ---------------- battle input ---------------- */
function tryCustom(){ if(B&&B.phase==='fight'&&gaugeFull()&&!wandOnly(B.piles)) openCustomScreen(); }
$('#btnCustom').onclick=tryCustom;
$('#btnCast').onclick=castCard;
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
  if(B.phase!=='fight'||held.has(k)) return; held.add(k);
  if(k==='arrowleft'||k==='a') stepDir(DIRS.W);
  else if(k==='arrowright'||k==='d') stepDir(DIRS.E);
  else if(k==='arrowup'||k==='w') stepVertical(true);
  else if(k==='arrowdown'||k==='s') stepVertical(false);
  else if(k===' '){ e.preventDefault(); wandDown(); }
  else if(k==='enter'||k==='x') castCard();
  else if(k==='c') tryCustom();
  else if(k==='q'||k==='tab'){ e.preventDefault(); cycleAim(); }
});
window.addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); held.delete(k); if(k===' ') wandUp(); });

/* ---------------- loop ---------------- */
let prev=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-prev)/1000); prev=now;
  if(B&&$('#scrBattle').classList.contains('on')){
    if(!paused) update(dt);
    // The Custom screen opens by itself when the gauge fills and nothing is left to cast.
    if(B.phase==='fight'&&gaugeFull()&&!B.piles.queue.length&&!wandOnly(B.piles)) openCustomScreen();
    render(); hud();
  }
  requestAnimationFrame(frame);
}
if(save) openCamp(); else buildStart();
requestAnimationFrame(frame);
