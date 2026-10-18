/* Hexmancers deck prototype — card engine.
   Pure deck / hand / queue logic with no rendering, so it can be tested in Node.
   Flow: draw up to 6 at each Custom screen, queue up to 3, casting sends a card to the
   discard pile, unqueued cards stay in hand, and there is no reshuffle: an empty deck
   leaves you with the wand. Each queue slot left empty draws 1 extra card next time.
   Runes: any cards can be queued, but a Flush or a Straight only counts when its cards share a
   rune (✱ fits any rune). Rune Surge: a hand holding 4 or more cards of one rune opens a 4th
   slot for that turn. */

const RULES={max:60, min:45, copies:4, legendaryCopies:1, heroes:1, hand:6, slots:3, surgeSlots:4, surgeRunes:4};

// owned (optional): {id: copies you own}; a deck can't use more copies than you have.
function validateDeck(list,cards,owned){
  cards=cards||CARDS;
  const errors=[], counts={};
  for(const id of list){
    if(!cards[id]){ errors.push('Unknown card: '+id); continue; }
    counts[id]=(counts[id]||0)+1;
  }
  if(list.length>RULES.max) errors.push('Too many cards: '+list.length+' / '+RULES.max);
  if(list.length<RULES.min) errors.push('Too few cards: '+list.length+' (minimum '+RULES.min+')');
  for(const id in counts){
    const lim=cards[id].rarity==='legendary'||cards[id].rarity==='hero'?RULES.legendaryCopies:RULES.copies;
    if(counts[id]>lim) errors.push(cards[id].name+': '+counts[id]+' copies (max '+lim+')');
    else if(owned&&counts[id]>(owned[id]||0)) errors.push(cards[id].name+': you own '+(owned[id]||0));
  }
  const heroes=Object.keys(counts).filter(id=>cards[id]&&cards[id].rarity==='hero');
  if(heroes.length>RULES.heroes) errors.push('Only '+RULES.heroes+' hero per deck ('+heroes.length+')');
  return {ok:!errors.length, errors, count:list.length, counts};
}

function shuffle(arr,rng){
  rng=rng||Math.random;
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

// A battle's piles. Each card instance has its own uid so copies can be told apart.
function createPiles(list,rng,cards){
  cards=cards||CARDS;
  let uid=1;
  const draw=shuffle(list.map(id=>({uid:uid++, card:cards[id]})),rng);
  return {draw, hand:[], queue:[], discard:[], uid, bonus:0, slots:RULES.slots};
}
// a used deck tool shuts a slot (p.locks) for the hand it was used in, or longer if the card says so
const slotsOf=p=>Math.max(0,(p.slots||RULES.slots)-(p.locks||[]).length);
const WILD_RUNE='✱';
// the rune with the most cards in hand (wild cards count for every rune), if 4 or more
function surgeRune(hand){ const n={}, wild=hand.filter(c=>c.card.code===WILD_RUNE).length;
  hand.forEach(c=>{ const k=c.card.code; if(k&&k!==WILD_RUNE) n[k]=(n[k]||0)+1; });
  let best=null; for(const k in n) if(!best||n[k]>n[best]) best=k;
  return best&&n[best]+wild>=RULES.surgeRunes?best:null; }
// Do these cards fit together in one queue? Same rune (wild fits any), or all the same card,
// or a step toward a recipe.
function runesFit(cards){
  const runes=new Set(cards.map(c=>c.code).filter(k=>k&&k!==WILD_RUNE));
  if(runes.size<=1) return true;
  if(cards.every(c=>c.name===cards[0].name)) return true;
  return recipeStep(cards);
}
// true if these cards are all part of one recipe (any order, copies counted)
function fitsRecipe(r,cards){ const need=r.cards.slice(); return cards.every(c=>{ const i=need.indexOf(c.id); if(i<0) return false; need.splice(i,1); return true; }); }
function recipeStep(cards){ const list=typeof RECIPES!=='undefined'?RECIPES:[]; return list.some(r=>fitsRecipe(r,cards)); }
/* Brown's deck tools (Search, Keep, Reshuffle) are used on the hand screen: put one in a slot and
   double-tap it there. It goes to the discard pile and its slot stays shut for `lock` hands
   (1 = only the hand it was used in; a full Reshuffle shuts it for 2). */
const DECK_TOOLS=['search','keep','reshuffle'];
const isDeckTool=c=>!!c&&c.type==='instant'&&c.as==='utility'&&DECK_TOOLS.includes(c.util);
const toolLock=c=>c.lock||(c.util==='reshuffle'?2:1);
// Instants (and Tinker) are never queued: you tap them in your hand and they act at once.
const TAP_TYPES=['instant','tinker'];
const isInstant=c=>!!c&&TAP_TYPES.includes(c.type)&&!isDeckTool(c);
const canQueue=(p,inst)=>p.queue.length<slotsOf(p)&&!(inst&&isInstant(inst.card))&&(p.queue.length!==RULES.slots||!inst||fitsFourth(p,inst.card));
/* Rune Surge, read from the slots: 3 queued cards of one rune (✱ fits any) open a 4th slot, and only
   a card of that rune (or a ✱) fits it; 3 queued cards of a 4-card recipe open it for the recipe's
   last card. Some gear opens it by chance at the start of a hand (p.surge 'luck'), for any card. */
function queueSurge(q){ const cards=q.slice(0,RULES.slots).map(c=>c.card);
  if(cards.length<RULES.slots) return null;
  if(cards.every(c=>c.code)&&oneRune(cards)) return cards.map(c=>c.code).find(k=>k!==WILD_RUNE)||WILD_RUNE;
  const list=typeof RECIPES!=='undefined'?RECIPES:[];
  return list.some(r=>r.cards.length===RULES.surgeSlots&&fitsRecipe(r,cards))?'recipe':null; }
function fitsFourth(p,card){ const s=p.surge;
  if(!s||s==='luck') return true;
  if(s==='recipe'){ const list=typeof RECIPES!=='undefined'?RECIPES:[], cards=[...p.queue.slice(0,RULES.slots).map(c=>c.card),card];
    return list.some(r=>r.cards.length===cards.length&&fitsRecipe(r,cards)); }
  return !!card.code&&(card.code===WILD_RUNE||s===WILD_RUNE||card.code===s); }
// after the queue changes on the Custom screen: open or shut the 4th slot, and send back a 4th card that no longer fits
function refreshSurge(p){ if(p.surge==='luck') return;
  p.surge=queueSurge(p.queue); p.slots=p.surge?RULES.surgeSlots:RULES.slots;
  while(p.queue.length>slotsOf(p)||(p.queue.length>RULES.slots&&!fitsFourth(p,p.queue[RULES.slots].card))){
    const i=p.queue.length-1; if(p.queue[i].cursed) break; p.hand.push(p.queue.splice(i,1)[0]); } }
// one rune (wild cards fit any) — what a Flush or a Straight needs
const oneRune=cards=>new Set(cards.map(c=>c.code).filter(k=>k&&k!==WILD_RUNE)).size<=1;

/* The hand holds 6 cards at most, at any time. Only a card in the hand that says so raises that
   (handPlus: +n while it is in your hand). Cards that would go past it stay in the deck. */
function handMax(p){ return RULES.hand+p.hand.reduce((a,c)=>a+(c.card.handPlus||0),0); }
const handRoom=p=>Math.max(0,handMax(p)-p.hand.length);
// Opening the Custom screen: queued cards not yet cast go back to the hand, then the hand refills to 6.
function openCustom(p){
  p.hand=p.queue.filter(c=>!c.temp).concat(p.hand); p.queue=[];
  p.locks=(p.locks||[]).map(l=>Object.assign({},l,{n:l.n-1})).filter(l=>l.n>0);   // shut slots open again
  const drawn=[];
  // queued cards not cast come back first; any past the limit go back on top of the deck, to be drawn next
  while(p.hand.length>handMax(p)){ const c=p.hand.pop(); if(c.temp) continue; p.draw.push(c); }
  const size=handMax(p); p.bonus=0;
  // a long fight: when the deck can't fill your hand, your discard pile is shuffled back in under it
  // (spent Charge cards stay out). Before, a 60-card deck ran dry at about 4 minutes and deep fights
  // dragged on with the wand alone.
  if(p.draw.length<size-p.hand.length){ const back=p.discard.filter(c=>!c.temp&&!(c.card.uses&&c.left!=null&&c.left<=0));
    if(back.length){ p.discard=p.discard.filter(c=>!back.includes(c)); p.draw=shuffle(back,p.rng).concat(p.draw); p.reshuffles=(p.reshuffles||0)+1; } }
  while(p.hand.length<size && p.draw.length){ const c=p.draw.pop(); p.hand.push(c); drawn.push(c); }
  // the 4th slot opens from the queue (refreshSurge); some gear can open it by chance for the whole hand
  p.surge=null; p.slots=RULES.slots;
  if(p.surgeLuck&&(p.rng||Math.random)()<p.surgeLuck){ p.slots=RULES.surgeSlots; p.surge='luck'; }
  return drawn;
}
/* Combos, read from the queue as it stands (runes already keep a queue to one rune):
   - Recipe: exactly the cards of a recipe fuse into one named card (beats everything else)
   - Double / Triple: copies of the same card merge into one cast at 1.5x / 2x power (charge uses add up)
   - Flush: 3 or more different cards of one rune and one of the six colors merge into ONE attack (flushCard):
     all their power +25% in one cast, carrying every effect they had
   - Straight: 3 ranks in a row of one rune, cast as one chain with a finisher; 4 in a row is a Grand Straight */
const NEUTRAL=['gray','brown'];
function findRecipe(cards){ const list=typeof RECIPES!=='undefined'?RECIPES:[];
  return list.find(r=>r.cards.length===cards.length&&fitsRecipe(r,cards))||null; }
function detectCombos(queue){
  const cards=queue.filter(c=>!c.temp&&!isDeckTool(c.card)).map(c=>c.card), out=[];   // a deck tool waiting in a slot is no part of a combo
  const r=cards.length>=3&&findRecipe(cards);
  if(r) return [{kind:'recipe', recipe:r, label:'Recipe: '+r.name}];
  const by={}; cards.forEach(c=>by[c.id]=(by[c.id]||0)+1);
  for(const id in by) if(by[id]>=2){ const c=cards.find(x=>x.id===id);
    out.push({kind:'simple', id, n:by[id], mult:by[id]>=3?2:1.5, label:(by[id]>=3?'Triple ':'Double ')+c.name+' ×'+(by[id]>=3?2:1.5)}); }
  // Flush: different cards of one rune and one color (any types)
  if(cards.length>=3&&oneRune(cards)&&!NEUTRAL.includes(cards[0].color)&&cards.every(c=>c.color===cards[0].color)&&new Set(cards.map(c=>c.id)).size===cards.length){   // every card different: copies merge (Double), which would make it a 2-card Flush
    // one bonus for any Flush: a stronger 4-card Flush made the 4th slot too strong
    const m=1.25, nm=cards[0].color[0].toUpperCase()+cards[0].color.slice(1);
    out.push({kind:'flush', color:cards[0].color, mult:m, label:'Flush: '+nm+', merged into one attack +'+Math.round((m-1)*100)+'%'}); }
  const brood=cards.filter(c=>c.brood).length;
  if(brood>=2) out.push({kind:'brood', n:Math.min(4,brood), label:brood>=4?'Elder Grovebeast!':brood===3?'Brood Swarm: two each +50%, an Ogre leads':'Brood Pack: two each +25%'});
  const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
  if(cards.length>=3&&oneRune(cards)&&ranks.every((x,i)=>!i||x===ranks[i-1]+1))
    out.push({kind:'straight', ranks, label:(cards.length>=4?'Grand Straight ':'Straight ')+ranks.join('-')+': chain cast + finisher'});
  const run=runeRun(cards);
  // Rune Set: every queued card has the same rune (✱ fits any): Power, wand ×1.8, for 5s (8s with 4)
  const real=cards.map(c=>c.code).filter(k=>k&&k!==WILD_RUNE);
  if(cards.length>=3&&real.length&&cards.every(c=>c.code)&&oneRune(cards)){ const dur=cards.length>=4?8:5;
    out.push({kind:'set', rune:real[0], n:cards.length, dur, label:(cards.length>=4?'Grand Rune Set ':'Rune Set ')+real[0]+'×'+cards.length+': Wand ×1.8 '+dur+'s'}); }
  if(run){ const dur=run.length>=4?12:8; out.push({kind:'run', runes:run, dur, label:(run.length>=4?'Grand Rune Run ':'Rune Run ')+run.join('-')+': Haste + Courage '+dur+'s'}); }
  return out;
}
/* Rune Run: 3 or 4 cards whose runes go up the alphabet one letter at a time, in queue order
   (left to right: A-B-C, B-C-D … C-D-E-F); a ✱ stands in for the letter in its place. It gives
   you Haste and Courage (cards and wand +30%) for 8s, 12s with 4 cards. Returns the letters of
   the run, or null. */
function runeRun(cards){ if(cards.length<3) return null;
  const L=typeof RUNES!=='undefined'?RUNES:['A','B','C','D','E','F'], codes=cards.map(c=>c.code);
  let start=null, real=0;
  for(let i=0;i<codes.length;i++){ if(codes[i]===WILD_RUNE) continue; const k=L.indexOf(codes[i]); if(k<0) return null;
    if(start===null) start=k-i; else if(k-i!==start) return null; real++; }
  if(real<2||start<0||start+cards.length>L.length) return null;
  return L.slice(start,start+cards.length); }
/* A Flush's merged attack. Every card counts for the same budget whatever its type (30 power at
   rank 1 common, growing with rank and rarity, as cards.js builds them), times any boost on its slot.
   The attack takes the shape of the first strike in the Flush (else its first lob, else a bolt down
   your row), its power is the whole budget +25%, and it carries the strongest of every effect. */
const FLUSH_KWS=['burn','freeze','stun','slow','poison','curse','drain','mend','confuse','push','pull','valor'];
const flushBudget=c=>30*(1+.06*((c.rank||1)-1))*(typeof RARITY_MULT!=='undefined'&&RARITY_MULT[c.rarity]||1.45);
function flushCard(insts,mult){
  const cards=insts.map(i=>i.card), kind=c=>c.type==='piece'?c.base:c.type;
  const total=insts.reduce((a,i)=>a+flushBudget(i.card)*(i.mult||1),0)*mult;
  const tpl=cards.find(c=>kind(c)==='strike')||cards.find(c=>kind(c)==='lob')||null;
  const color=cards[0].color, nm=color[0].toUpperCase()+color.slice(1);
  let o;
  if(tpl){ const k=total/flushBudget(tpl); o=Object.assign({},tpl,{type:kind(tpl)}); for(const f of ['pow','bomblet']) if(typeof o[f]==='number') o[f]=Math.round(o[f]*k); }
  else o={type:'strike', shape:'line', pow:Math.round(total)};
  for(const f of FLUSH_KWS){ const v=Math.max(0,...cards.map(c=>c[f]||0)); if(v) o[f]=v; else delete o[f]; }
  delete o.self; delete o.uses; delete o.sig;
  return Object.assign(o,{id:'flush_'+color+'_'+cards.map(c=>c.id).join('_'), name:nm+' Flush', color, rank:Math.max(...cards.map(c=>c.rank||1)),
    rarity:'legendary', code:cards.map(c=>c.code).find(k=>k&&k!==WILD_RUNE)||WILD_RUNE, flush:cards.map(c=>c.name)}); }
// Leaving the Custom screen: combos lock in, and every empty slot adds 1 card to the next
// draw (Battle Network style). A recipe replaces its cards with the fused card.
function commitCustom(p){
  const combos=detectCombos(p.queue), filled=p.queue.length;
  for(const cb of combos){
    if(cb.kind==='recipe'){ const used=p.queue.filter(c=>!c.temp); p.discard.push(...used);
      p.queue=[...p.queue.filter(c=>c.temp),{uid:p.uid++, card:cb.recipe.card, temp:true, recipe:true, combo:cb.label}]; }
    if(cb.kind==='simple'){ const same=p.queue.filter(c=>c.card.id===cb.id), keep=same[0];
      keep.mult=(keep.mult||1)*cb.mult; keep.combo=cb.label;
      if(keep.card.uses) keep.left=same.reduce((a,c)=>a+(c.left==null?c.card.uses:c.left),0);
      for(const c of same.slice(1)){ p.queue.splice(p.queue.indexOf(c),1); p.discard.push(c); } }
    if(cb.kind==='brood'){ const bs=p.queue.filter(c=>c.card.brood&&!c.temp);
      if(cb.n>=4&&typeof GROVEBEAST!=='undefined'){ p.discard.push(...bs); p.queue=p.queue.filter(c=>!bs.includes(c)); p.queue.unshift({uid:p.uid++, card:GROVEBEAST, temp:true, recipe:true, combo:cb.label}); }
      else bs.forEach((c,i)=>{ c.brood=cb.n; c.mult=(c.mult||1)*(cb.n>=3?1.5:1.25); c.combo=cb.label; c.leader=cb.n>=3&&i===0; }); }
    // a Flush merges into one attack (a Brood keeps its own combo instead)
    if(cb.kind==='flush'&&!combos.some(x=>x.kind==='brood')){ const used=p.queue.filter(c=>!c.temp); p.discard.push(...used);
      p.queue=[...p.queue.filter(c=>c.temp),{uid:p.uid++, card:flushCard(used,cb.mult), temp:true, recipe:true, combo:cb.label}]; }
    if(cb.kind==='run'||cb.kind==='set') p.queue.forEach(c=>c.combo=c.combo||cb.label);
    if(cb.kind==='straight'&&p.queue.length>=3){ p.queue[0].straight=cb.ranks; p.queue.forEach(c=>c.combo=c.combo||cb.label); }
  }
  p.combos=combos;
  p.bonus=Math.max(0,RULES.slots-filled);
  return p.bonus;
}
// Drag and drop on the Custom screen: put a card into the hand or the queue at a position.
// Dropping a hand card onto a full queue swaps it with the card in that slot.
function placeCard(p,uid,zone,index){
  const qi=p.queue.findIndex(c=>c.uid===uid), hi=p.hand.findIndex(c=>c.uid===uid);
  if(qi<0&&hi<0) return false;
  const src=qi>=0?p.queue:p.hand, si=qi>=0?qi:hi, dst=zone==='queue'?p.queue:p.hand, card=src[si];
  if(card.cursed) return false;
  if(zone==='queue'&&isInstant(card.card)) return false;
  if(index==null) index=dst.length;
  if(src!==dst&&zone==='queue'&&p.queue.length>=slotsOf(p)){ const ti=Math.min(index,slotsOf(p)-1), other=p.queue[ti];
    if(other&&other.cursed) return false;
    if(ti===RULES.slots&&!fitsFourth(p,card.card)) return false;
    p.queue[ti]=card; p.hand[si]=other; refreshSurge(p); return true; }
  if(src!==dst&&zone==='queue'&&!canQueue(p,card)) return false;
  src.splice(si,1); dst.splice(Math.max(0,Math.min(index,dst.length)),0,card); refreshSurge(p); return true;
}

// Tap a card: hand -> queue (if a slot is free), or queue -> hand. Returns true if it moved.
function toggleQueue(p,uid){
  let i=p.queue.findIndex(c=>c.uid===uid);
  if(i>=0&&p.queue[i].cursed) return false;   // a hex can't be moved
  if(i>=0){ p.hand.push(p.queue.splice(i,1)[0]); refreshSurge(p); return true; }
  i=p.hand.findIndex(c=>c.uid===uid);
  if(i>=0 && canQueue(p,p.hand[i])){ p.queue.push(p.hand.splice(i,1)[0]); refreshSurge(p); return true; }
  return false;
}

// Cast the next queued card: it leaves the queue for the discard pile. A charge card
// stays at the front of the queue until its last use is spent; a copy just vanishes.
function castNext(p){
  const c=p.queue[0]; if(!c) return null;
  if(c.card.uses){ if(c.left==null) c.left=c.card.uses; c.left--; if(c.left>0) return c; }
  p.queue.shift(); if(!c.temp) p.discard.push(c); return c;
}

// Utility cards
function drawCards(p,n){ const got=[]; n=Math.min(n,handRoom(p)); while(got.length<n&&p.draw.length){ const c=p.draw.pop(); p.hand.push(c); got.push(c); } return got; }
function recallTop(p){ if(!p.draw.length||p.queue.length>=slotsOf(p)) return null; const c=p.draw.pop(); p.queue.push(c); return c; }
function copyNext(p){ const c=p.queue[0]; if(!c||p.queue.length>=slotsOf(p)) return null;
  const cp={uid:p.uid++, card:c.card, temp:true}; p.queue.unshift(cp); return cp; }

/* Brown's deck tools.
   Search: a random card of your deck that passes `test` goes to your hand.
   Reshuffle: the hand (but the cards you keep) goes back into the deck, the deck is shuffled,
   and you draw back up to a full hand. */
function searchDeck(p,test){ if(!handRoom(p)) return null; const ok=p.draw.filter(c=>!test||test(c.card)); if(!ok.length) return null;
  const c=ok[Math.floor((p.rng||Math.random)()*ok.length)]; p.draw.splice(p.draw.indexOf(c),1); p.hand.push(c); return c; }
function takeFromDeck(p,uid){ if(!handRoom(p)) return null; const i=p.draw.findIndex(c=>c.uid===uid); if(i<0) return null; const c=p.draw.splice(i,1)[0]; p.hand.push(c); return c; }
function reshuffleHand(p,keep){ keep=keep||new Set();
  const back=p.hand.filter(c=>!keep.has(c.uid)&&!c.temp); p.hand=p.hand.filter(c=>keep.has(c.uid));
  p.draw.push(...back); shuffle(p.draw,p.rng);
  const got=drawCards(p,handRoom(p)); return {back:back.length, got}; }
// Recharge: every Charge card in this battle gets uses back (never past its full count)
function rechargeAll(p,n){ let k=0;
  for(const c of [...p.draw,...p.hand,...p.queue,...p.discard]) if(c.card.uses&&!c.temp){ const was=c.left==null?c.card.uses:c.left, now=Math.min(c.card.uses,was+n); if(now>was){ c.left=now; k++; } }
  return k; }

// Nothing left to draw, hold or cast: the fight continues with the wand only.
function wandOnly(p){ return !p.draw.length && !p.hand.length && !p.queue.length; }

if(typeof module!=='undefined') module.exports={queueSurge,fitsFourth,refreshSurge,handMax,handRoom,isInstant,isDeckTool,toolLock,DECK_TOOLS,TAP_TYPES,searchDeck,takeFromDeck,reshuffleHand,rechargeAll,oneRune,slotsOf,surgeRune,runesFit,canQueue,findRecipe,RULES,detectCombos,placeCard,validateDeck,shuffle,createPiles,openCustom,commitCustom,toggleQueue,castNext,drawCards,recallTop,copyNext,wandOnly};
