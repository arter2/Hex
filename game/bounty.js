/* Hexmancers — the Bounty board at camp. Three contracts at a time, each asking for a kind of deck
   (mostly a colour you don't already play). A contract stays until you finish it; claim it at the
   board for shards, gold and a pack, and a new one takes its place.
   save.bounty = {list:[contract], n:<contracts made so far>}
   contract = {id, kind, color?, type?, depth?, need, got, done, reward:{shards, gold, pack}} */

const BOUNTY_N=3;
const cName=k=>COLORS[k].name, tName=k=>TYPES[k].name;
const BOUNTY_TYPES=['strike','lob','ward','sentry','summon','trap'];

// What a deck is made of: share of each colour, the colours it really uses, cards of each type.
function deckStats(list){ const by={}, types={}, n=list.length||1;
  for(const id of list){ const c=CARDS[id]; if(!c) continue; by[c.color]=(by[c.color]||0)+1; types[c.type]=(types[c.type]||0)+1; }
  const colors=SIX.filter(k=>(by[k]||0)>=5);
  return {by, types, colors, n, share:k=>(by[k]||0)/n}; }

// The kinds of contract. ok(stats, contract, battle) says whether a won fight counts.
const BOUNTY_KINDS={
  share:{need:4, w:3, col:true, ok:(s,k)=>s.share(k.color)>=.6,
    text:k=>`Win ${k.need} fights with a deck that's at least 60% ${cName(k.color)}.`, check:(s,k)=>Math.round(s.share(k.color)*100)+'% '+cName(k.color)},
  deep:{need:1, w:2, col:true, ok:(s,k,b)=>s.share(k.color)>=.7&&b.depth>=k.depth,
    text:k=>`Win a fight at depth ${k.depth} or deeper with a deck that's at least 70% ${cName(k.color)}.`, check:(s,k)=>Math.round(s.share(k.color)*100)+'% '+cName(k.color)},
  noType:{need:4, w:2, typ:true, ok:(s,k)=>!s.types[k.type],
    text:k=>`Win ${k.need} fights with no ${tName(k.type)} cards in your deck.`, check:(s,k)=>(s.types[k.type]||0)+' '+tName(k.type)+' cards'},
  manyType:{need:3, w:2, typ:true, ok:(s,k)=>(s.types[k.type]||0)>=12,
    text:k=>`Win ${k.need} fights with at least 12 ${tName(k.type)} cards in your deck.`, check:(s,k)=>(s.types[k.type]||0)+' / 12 '+tName(k.type)},
  duo:{need:1, w:2, col:true, boss:true, ok:(s,k,b)=>b.boss&&s.colors.length===2&&!s.by[k.color],
    text:k=>`Beat a boss with a two-colour deck that has no ${cName(k.color)}.`, check:(s,k)=>s.colors.length+' colours'+(s.by[k.color]?', has '+cName(k.color):'')},
  mono:{need:3, w:1, ok:s=>s.colors.length===1,
    text:k=>`Win ${k.need} fights with a one-colour deck (neutral cards are fine).`, check:s=>s.colors.length+' colours'},
  combos:{need:1, w:1, ok:(s,k,b)=>(b.combos||0)>=3,
    text:()=>'Win a fight in which you make 3 combos.', check:null},
  weak:{need:30, w:2, col:true, hits:true, ok:()=>false,
    text:k=>`Land ${k.need} WEAK hits on ${cName(k.color)} enemies.`, check:null},
};

// the colour your deck leans on most (the one contracts try to move you away from)
function mainColor(list){ const s=deckStats(list); return SIX.slice().sort((a,b)=>(s.by[b]||0)-(s.by[a]||0))[0]; }
// copies of a colour or type you could put in decks
function ownedOf(test){ let n=0; for(const id in save.owned){ const c=CARDS[id]; if(c&&test(c)) n+=Math.min(copyLimit(c),save.owned[id]); } return n; }

function bountyMake(){
  const B0=save.bounty, have=B0.list.map(k=>k.kind+(k.color||'')+(k.type||'')), main=mainColor(activeDeck().list);
  const colors=SIX.filter(k=>k!==main&&ownedOf(c=>c.color===k)>=24);
  const types=BOUNTY_TYPES.filter(t=>ownedOf(c=>c.type===t)>=14);
  const kinds=Object.keys(BOUNTY_KINDS).filter(id=>{ const K=BOUNTY_KINDS[id]; return (!K.col||colors.length)&&(!K.typ||types.length)&&!(K.col||K.typ?false:have.includes(id)); });
  for(let tries=0;tries<30;tries++){
    let x=Math.random()*kinds.reduce((a,id)=>a+BOUNTY_KINDS[id].w,0), kind=kinds[0];
    for(const id of kinds){ x-=BOUNTY_KINDS[id].w; if(x<=0){ kind=id; break; } }
    const K=BOUNTY_KINDS[kind], k={id:++B0.n, kind, need:K.need, got:0, done:false};
    if(K.col) k.color=K.hits?pick(SIX.filter(c=>c!==main)):pick(colors);
    if(K.typ) k.type=pick(types);
    if(kind==='deep') k.depth=Math.max(3,save.deepest||1);
    if(have.includes(k.kind+(k.color||'')+(k.type||''))) continue;
    const hard=K.boss||kind==='deep'?2:kind==='combos'||kind==='mono'?1.3:1;
    k.reward={shards:Math.round(40*hard/5)*5, gold:Math.round((40+8*(save.deepest||1))*hard/5)*5, pack:k.color||null};
    return k; }
  return null; }

function bountyFill(){ save.bounty=save.bounty||{list:[], n:0};
  while(save.bounty.list.length<BOUNTY_N){ const k=bountyMake(); if(!k) break; save.bounty.list.push(k); } }

// a fight was won: every contract the deck and the fight meet moves on
function bountyWin(b,boss){ if(!save.bounty||b.trial) return [];
  const s=deckStats(activeDeck().list), done=[], ctx={depth:b.depth, boss, combos:b.combos||0};
  for(const k of save.bounty.list){ const K=BOUNTY_KINDS[k.kind]; if(k.done||!K||K.hits) continue;
    if(K.ok(s,k,ctx)){ k.got=Math.min(k.need,k.got+1); if(k.got>=k.need){ k.done=true; done.push(k); } } }
  return done; }
// a WEAK hit in battle (battle.js calls this)
function bountyWeak(e){ if(!save||!save.bounty||!e) return;
  for(const k of save.bounty.list) if(!k.done&&k.kind==='weak'&&e.color===k.color){ k.got++; if(k.got>=k.need){ k.done=true; if(typeof banner==='function') banner('📜 Contract complete!','#f2c94c'); } } }
const bountyReady=()=>save&&save.bounty?save.bounty.list.filter(k=>k.done).length:0;

/* ---------------- the board ---------------- */
function openBounty(){ bountyFill(); persist(); renderBounty(); show('scrBounty'); }
function rewardChips(r){ return `<span class="bchip">${uiIcon('shard',18)}${r.shards}</span><span class="bchip">${uiIcon('coin',18)}${r.gold}</span>`+
  `<span class="bchip pack" style="--c:${r.pack?COLORS[r.pack].c:'#c9b6ff'}">${r.pack?COLORS[r.pack].icon+' '+cName(r.pack)+' pack':'Booster pack'}</span>`; }
function renderBounty(){ const box=$('#bountyList'); box.innerHTML=''; const s=deckStats(activeDeck().list);
  $('#bShards').innerHTML=uiIcon('shard',20)+(save.shards||0);
  for(const k of save.bounty.list){ const K=BOUNTY_KINDS[k.kind], el=document.createElement('div'); el.className='bounty'+(k.done?' done':'');
    if(k.color) el.style.setProperty('--c',COLORS[k.color].c);
    const meets=K.check?K.ok(s,k,{depth:99,boss:true,combos:9}):null;
    el.innerHTML=`<p class="btext">${esc(K.text(k))}</p>
      <div class="bprog"><i style="width:${Math.round(100*k.got/k.need)}%"></i><span>${k.got} / ${k.need}</span></div>
      ${K.check&&!k.done?`<p class="bcheck ${meets?'ok':'no'}">Your deck (${esc(activeDeck().name)}): ${esc(K.check(s,k))} ${meets?'✓ counts':'✗ doesn’t count yet'}</p>`:''}
      <div class="breward">${rewardChips(k.reward)}</div><div class="bbtns"></div>`;
    const bb=el.querySelector('.bbtns');
    if(k.done){ const c=document.createElement('button'); c.className='btn'; c.textContent='Claim reward'; c.onclick=()=>bountyClaim(k); bb.appendChild(c); }
    else if(K.check&&!meets){ const c=document.createElement('button'); c.className='btn ghost'; c.textContent='Build a deck for this'; c.onclick=()=>bountyDraft(k); bb.appendChild(c); }
    box.appendChild(el); }
  if(!save.bounty.list.length) box.innerHTML='<p class="hint">No contracts right now. Find more cards and come back.</p>'; }

function bountyClaim(k){ const L=save.bounty.list, i=L.indexOf(k); if(i<0||!k.done) return;
  L.splice(i,1); save.shards=(save.shards||0)+k.reward.shards; save.gold+=k.reward.gold; bountyFill(); persist();
  logCamp('Contract done: +'+k.reward.shards+' shards, +'+k.reward.gold+' gold and a pack.','gold');
  packReward(k.reward.pack,save.deepest,()=>{ show('scrBounty'); renderBounty(); }); }

// Build a deck for this: a draft in an empty deck slot (never over one of yours), opened in the builder
function bountyDraft(k){ const slot=save.decks.findIndex(d=>!d.list.length);
  if(slot<0) return tip('Empty a deck slot first: the draft never overwrites one of your decks');
  const fit=c=>k.color&&(k.kind==='share'||k.kind==='deep')?c.color===k.color:k.kind==='duo'?c.color!==k.color:k.type&&k.kind==='noType'?c.type!==k.type:k.type?c.type===k.type:true;
  const owned={}; for(const id in save.owned){ const c=CARDS[id]; if(!c) continue; if(fit(c)||(k.kind==='noType'&&c.type!==k.type)||(k.kind==='duo'&&c.color!==k.color)) owned[id]=save.owned[id]; }
  // the cards the contract asks for first, then autoFill finishes the deck around them
  const seed=[], core={}; for(const id in owned) if(fit(CARDS[id])&&CARDS[id].rarity!=='hero') core[id]=owned[id];
  const want=k.kind==='manyType'?16:k.kind==='deep'?46:k.kind==='share'?40:0;
  if(want){ const ids=Object.keys(core).sort((a,b)=>(CARDS[b].rank-CARDS[a].rank)); for(const id of ids){ let n=Math.min(copyLimit(CARDS[id]),core[id]); while(n-->0&&seed.length<want) seed.push(id); } }
  const pool=k.kind==='noType'||k.kind==='duo'?owned:save.owned;
  let list=autoFill(seed,pool);
  if(k.kind==='duo'){ const s=deckStats(list), keep=s.colors.slice(0,2); list=autoFill(list.filter(id=>{ const c=CARDS[id]; return !SIX.includes(c.color)||keep.includes(c.color); }),Object.fromEntries(Object.entries(owned).filter(([id])=>{ const c=CARDS[id]; return !SIX.includes(c.color)||keep.includes(c.color); }))); }
  if(k.kind==='mono'){ const m=mainColor(activeDeck().list), own=Object.fromEntries(Object.entries(save.owned).filter(([id])=>{ const c=CARDS[id]; return c&&(!SIX.includes(c.color)||c.color===m); })); list=autoFill([],own); }
  save.decks[slot]={name:'Bounty: '+(k.color?cName(k.color):k.type?tName(k.type):'Combo'), list}; persist();
  openDeckUI('camp'); DK.slot=slot; dkRender(); tip('Draft built in deck '+(slot+1)+'. Tap Use to fight with it.'); }

$('#goBounty').onclick=()=>openBounty();
