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
  el.className='card'+(c.rarity==='legendary'?' leg':'')+(locked?' locked':''); el.style.setProperty('--c',col.c);
  const stat=c.pow||(c.boon!=='gauge'&&c.amt)||c.hp||'';
  el.innerHTML=locked?`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div><div class="cn">???</div><div class="ty">${TYPES[c.type].name}</div><div class="tx"></div><div class="cp"><span></span><small>${RARITY[c.rarity].g}</small></div>`
    :`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div>
    <div class="cn">${esc(c.name)}</div><div class="ty">${TYPES[c.type].name}</div><div class="tx">${esc(cardText(c))}</div>
    <div class="cp"><span>${stat}</span><small title="${RARITY[c.rarity].n}">${RARITY[c.rarity].g}</small></div>`;
  if(extra) el.insertAdjacentHTML('beforeend',extra);
  return el;
}
function showDetail(c){
  const box=$('#dtCard'); box.innerHTML=''; box.appendChild(cardEl(c,'',!save.seen[c.id]));
  const inDeck=activeDeck().list.filter(id=>id===c.id).length;
  $('#dtInfo').textContent=save.seen[c.id]?COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0)+' · in deck '+inDeck
    :'Not found yet. '+RARITY[c.rarity].n+' '+COLORS[c.color].name+' '+TYPES[c.type].name+'.';
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

function reveal(title,body,results,buttons){
  $('#rvTitle').textContent=title; $('#rvBody').textContent=body;
  const g=$('#rvCards'); g.innerHTML='';
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
  $('#campColl').textContent='🂠 '+ownedUnique(save)+' / '+CARD_LIST.length+' cards';
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
$('#btnReset').onclick=()=>{ if(confirm('Reset your save? Your collection and decks will be lost.')){ clearSave(); save=null; buildStart(); } };
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
$('#bClear').onclick=()=>{ const d=save.decks[editSlot]; if(d.list.length&&!confirm('Remove all cards from '+d.name+'?')) return; d.list=[]; persist(); renderBuilder(); };
$('#bUse').onclick=()=>{ save.active=editSlot; persist(); renderSlots(); tip(save.decks[editSlot].name+' is now your deck'); };

/* ---------------- collection ---------------- */
const cf={colors:new Set(), type:'', rarity:'', q:'', owned:''};
function openCollection(){ makeFilters($('#cFilters'),cf,renderCollection,true); renderCollection(); show('scrCollection'); }
function renderCollection(){
  $('#cCount').textContent=ownedUnique(save)+' / '+CARD_LIST.length;
  const fam={}; CARD_LIST.forEach(c=>{ fam[c.color]=fam[c.color]||[0,0]; fam[c.color][1]++; if(save.seen[c.id]) fam[c.color][0]++; });
  $('#cProgress').innerHTML=FAM_ORDER.map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k][0]}/${fam[k][1]}</span>`).join('');
  const items=CARD_LIST.filter(c=>passes(c,cf)).sort(byFamily);
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
    onCast:c=>tip(COLORS[c.color].icon+' '+c.name),
    onEnd:win=>win?victory():defeat(),
  });
  hud(true);
}
function victory(){
  const b=B, boss=b.enemies.some(e=>e.def.boss);
  const gold=battleGold(b.depth,boss), drops=battleDrops(b.enemies.map(e=>e.color),b.depth,boss);
  save.gold+=gold; save.wins++; if(b.depth>=save.deepest) save.deepest=b.depth+1;
  const res=addCards(save,drops); persist();
  const depth=b.depth;
  reveal('Victory!','Depth '+depth+' cleared in '+Math.round(b.time)+'s · +'+gold+' gold · '+res.filter(r=>r.isNew).length+' new cards',res,
    [['Camp',()=>{ B=null; pickDepth=depth+1; openCamp(); },true],['Depth '+(depth+1)+' →',()=>fight(depth+1)]]);
}
function defeat(){
  const lost=Math.floor(save.gold*.2); save.gold-=lost; persist();
  const depth=B.depth;
  reveal('Defeated…','You fell at depth '+depth+' and dropped '+lost+' gold. Your cards are safe.',[],
    [['Camp',()=>{ B=null; openCamp(); },true],['Retry',()=>fight(depth)]]);
}
$('#btnRetreat').onclick=()=>{ if(B&&confirm('Retreat to camp? You keep your gold.')){ B=null; $('#custom').classList.remove('on'); openCamp(); } };

function renderCustom(){
  const p=B.piles;
  $('#custom').classList.add('on');
  $('#custPiles').textContent='Deck '+p.draw.length+' · Discard '+p.discard.length;
  const q=$('#custQueue'); q.innerHTML='';
  for(let i=0;i<RULES.slots;i++){
    const inst=p.queue[i];
    if(inst){ const el=cardEl(inst.card,`<span class="ord">${i+1}</span>`); el.onclick=()=>{ toggleQueue(p,inst.uid); renderCustom(); }; q.appendChild(el); }
    else { const s=document.createElement('div'); s.className='slot'; s.textContent='Slot '+(i+1); q.appendChild(s); }
  }
  const h=$('#custHand'); h.innerHTML='';
  p.hand.forEach((inst,i)=>{ const el=cardEl(inst.card,inst.left!=null?`<span class="badge">${inst.left} left</span>`:''); el.title='Key '+(i+1);
    el.onclick=()=>{ if(!toggleQueue(p,inst.uid)) tip('The queue holds '+RULES.slots+' cards'); renderCustom(); }; h.appendChild(el); });
  $('#custEmpty').textContent=wandOnly(p)?'Your deck is empty. Fight on with your wand!':!p.draw.length?'Deck empty: these are your last cards.':'';
  $('#btnFight').textContent=p.queue.length||wandOnly(p)?'Fight!':'Fight with an empty queue';
}
$('#btnFight').onclick=closeCustomScreen;

/* ---------------- HUD ---------------- */
const last={};
function set(key,val,fn){ if(last[key]!==val){ last[key]=val; fn(val); } }
function hud(force){
  const b=B; if(!b) return; if(force) for(const k in last) delete last[k];
  const p=b.player, pl=b.piles;
  set('hp',p.hp+'/'+p.maxHp,v=>{ $('#hpTxt').textContent='HP '+v; $('#hpBar').style.width=(p.hp/p.maxHp*100)+'%'; });
  set('depth',b.depth,v=>$('#depthTxt').textContent='Depth '+v);
  set('piles',pl.draw.length+'|'+pl.hand.length+'|'+pl.discard.length,()=>$('#pileTxt').textContent='Deck '+pl.draw.length+' · Hand '+pl.hand.length+' · Used '+pl.discard.length);
  set('gauge',Math.round(b.gauge*10),()=>$('#gaugeBar').style.width=(b.gauge/GAUGE_MAX*100)+'%');
  const buffs=[]; if(p.barrier>0) buffs.push('🛡 '+Math.ceil(p.barrier)); if(p.dodge) buffs.push('💨 Dodge'); if(p.invT>0) buffs.push('🌀 Phase');
  if(p.powerT>0) buffs.push('⚡ Wand ×2.5 '+Math.ceil(p.powerT)+'s'); if(p.pactT>0) buffs.push('☾ Pact '+Math.ceil(p.pactT)+'s');
  if(p.hasteT>0) buffs.push('🌬 Haste '+Math.ceil(p.hasteT)+'s'); if(p.regenT>0) buffs.push('🌿 Regen '+Math.ceil(p.regenT)+'s');
  set('buffs',buffs.join('   '),v=>$('#buffs').textContent=v);
  set('queue',pl.queue.map(c=>c.uid+':'+(c.left==null?'':c.left)).join(','),()=>{
    const row=$('#queueRow'); row.innerHTML='';
    for(let i=0;i<RULES.slots;i++){ const inst=pl.queue[i], d=document.createElement('div');
      d.className='qslot'+(inst?' full':'')+(i===0&&inst?' next':'');
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
wandBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); wandDown(); });
['pointerup','pointerleave','pointercancel'].forEach(ev=>wandBtn.addEventListener(ev,wandUp));

let dragging=false;
View.canvas=$('#board'); View.ctx=View.canvas.getContext('2d');
View.canvas.addEventListener('pointerdown',e=>{ dragging=true; moveTo(pickTile(e.clientX,e.clientY)); });
View.canvas.addEventListener('pointermove',e=>{ if(dragging) moveTo(pickTile(e.clientX,e.clientY)); });
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
});
window.addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); held.delete(k); if(k===' ') wandUp(); });

/* ---------------- loop ---------------- */
let prev=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-prev)/1000); prev=now;
  if(B&&$('#scrBattle').classList.contains('on')){
    update(dt);
    // The Custom screen opens by itself when the gauge fills and nothing is left to cast.
    if(B.phase==='fight'&&gaugeFull()&&!B.piles.queue.length&&!wandOnly(B.piles)) openCustomScreen();
    render(); hud();
  }
  requestAnimationFrame(frame);
}
if(save) openCamp(); else buildStart();
requestAnimationFrame(frame);
