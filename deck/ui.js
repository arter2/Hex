/* Hexmancers deck prototype — screens, HUD and controls. */

const $=s=>document.querySelector(s);
const state={deck:null, deckName:'', depth:1};

function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); if(id==='scrBattle') resizeView(); }
let tipT=0; function tip(msg){ const t=$('#tip'); t.textContent=msg; t.classList.add('on'); clearTimeout(tipT); tipT=setTimeout(()=>t.classList.remove('on'),1400); }

function cardEl(c,extra){
  const el=document.createElement('button'), col=COLORS[c.color];
  el.className='card'+(c.rarity==='legendary'?' leg':''); el.style.setProperty('--c',col.c);
  el.innerHTML=`<div class="ct"><span>${col.icon} ${TYPES[c.type].icon}</span><span class="rank">${c.rank}</span></div>
    <div class="cn">${c.name}</div><div class="ty">${TYPES[c.type].name}</div><div class="tx">${cardText(c)}</div>
    <div class="cp"><span>${c.pow||c.amt&&c.boon!=='gauge'&&c.amt||''}</span><small title="${RARITY[c.rarity].n}">${RARITY[c.rarity].g}</small></div>`;
  if(extra) el.insertAdjacentHTML('beforeend',extra);
  return el;
}

/* ---------------- menu and deck list ---------------- */
function buildMenu(){
  const box=$('#starters'); box.innerHTML='';
  for(const s of STARTERS){
    const d=document.createElement('div'); d.className='starter';
    d.innerHTML=`<h3>${s.name}</h3><div class="cols">${s.colors.map(c=>`<span class="chip" style="--c:${COLORS[c].c}">${COLORS[c].icon} ${COLORS[c].name}</span>`).join('')}</div>
      <p>${s.text}</p><div class="row"><button class="btn ghost" data-a="view">View 60 cards</button><button class="btn" data-a="play">Play</button></div>`;
    d.querySelector('[data-a=view]').onclick=()=>openDeck(s);
    d.querySelector('[data-a=play]').onclick=()=>{ pickDeck(s); begin(); };
    box.appendChild(d);
  }
}
function pickDeck(s){ state.deck=starterList(s.colors); state.deckName=s.name; state.depth=1; }
function openDeck(s){
  pickDeck(s);
  const v=validateDeck(state.deck);
  $('#deckName').textContent=s.name;
  const cnt=$('#deckCount'); cnt.textContent=v.count+' / '+RULES.max+(v.ok?' ✓':''); cnt.classList.toggle('bad',!v.ok);
  const byType={}, byColor={};
  state.deck.forEach(id=>{ const c=CARDS[id]; byType[c.type]=(byType[c.type]||0)+1; byColor[c.color]=(byColor[c.color]||0)+1; });
  $('#deckStats').innerHTML=Object.entries(byColor).map(([k,n])=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${n}</span>`).join('')+
    Object.entries(byType).map(([k,n])=>`<span class="chip" style="--c:#b9a3ff">${TYPES[k].icon} ${TYPES[k].name} ${n}</span>`).join('')+
    (v.ok?'':v.errors.map(e=>`<span class="chip" style="--c:#ff5d6c">${e}</span>`).join(''));
  const grid=$('#deckGrid'); grid.innerHTML='';
  const order=Object.keys(COLORS);
  Object.keys(v.counts).sort((a,b)=>order.indexOf(CARDS[a].color)-order.indexOf(CARDS[b].color)||CARDS[a].rank-CARDS[b].rank)
    .forEach(id=>grid.appendChild(cardEl(CARDS[id],`<span class="badge">×${v.counts[id]}</span>`)));
  show('scrDeck');
}
$('#deckBack').onclick=()=>show('scrMenu');
$('#deckPlay').onclick=begin;

/* ---------------- battle flow ---------------- */
function begin(){
  $('#result').classList.remove('on');
  show('scrBattle');
  startBattle(state.deck,state.depth,{
    onCustom:renderCustom,
    onFight:()=>{ $('#custom').classList.remove('on'); hud(true); },
    onCast:c=>tip(COLORS[c.color].icon+' '+c.name),
    onEnd:win=>{
      const b=B, left=b.piles.draw.length+b.piles.hand.length+b.piles.queue.length;
      $('#resTitle').textContent=win?'Victory!':'Defeated…';
      $('#resTitle').style.color=win?'#ffe24d':'#ff5d6c';
      $('#resBody').textContent=(win?'Depth '+b.depth+' cleared in '+Math.round(b.time)+'s. ':'You fell at depth '+b.depth+'. ')+
        'Cast '+b.log.length+' cards, '+left+' of '+state.deck.length+' left unused.';
      $('#resNext').textContent=win?'Next battle (depth '+(b.depth+1)+')':'Retry';
      $('#resNext').onclick=()=>{ if(win) state.depth++; begin(); };
      $('#result').classList.add('on');
    },
  });
  hud(true);
}
$('#resMenu').onclick=()=>{ $('#result').classList.remove('on'); B=null; show('scrMenu'); };

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
  p.hand.forEach((inst,i)=>{ const el=cardEl(inst.card); el.title='Key '+(i+1);
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
  set('queue',pl.queue.map(c=>c.uid).join(','),()=>{
    const row=$('#queueRow'); row.innerHTML='';
    for(let i=0;i<RULES.slots;i++){ const inst=pl.queue[i], d=document.createElement('div');
      d.className='qslot'+(inst?' full':'')+(i===0&&inst?' next':'');
      if(inst){ const c=inst.card; d.style.setProperty('--c',COLORS[c.color].c); d.innerHTML=`<span class="n">${TYPES[c.type].icon}</span>${c.name}`; }
      else d.textContent='—';
      row.appendChild(d); }
    $('#castName').textContent=pl.queue[0]?pl.queue[0].card.name:'queue empty';
    $('#btnCast').disabled=!pl.queue.length;
  });
  const canCustom=b.phase==='fight'&&gaugeFull()&&!wandOnly(pl);
  set('custom',canCustom,v=>{ $('#btnCustom').disabled=!v; $('#btnCustom').classList.toggle('ready',v); });
}

/* ---------------- input ---------------- */
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
  if(!B) return; const k=e.key.toLowerCase();
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
  if(B){
    update(dt);
    // The Custom screen opens by itself when the gauge fills and nothing is left to cast.
    if(B.phase==='fight'&&gaugeFull()&&!B.piles.queue.length&&!wandOnly(B.piles)) openCustomScreen();
    render(); hud();
  }
  requestAnimationFrame(frame);
}
buildMenu();
requestAnimationFrame(frame);
