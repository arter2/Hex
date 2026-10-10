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
const slotsOf=p=>p.slots||RULES.slots;
const WILD_RUNE='✱';
// Rune Surge: the rune with the most cards in hand (wild cards count for every rune)
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
const canQueue=(p,inst)=>p.queue.length<slotsOf(p);
// one rune (wild cards fit any) — what a Flush or a Straight needs
const oneRune=cards=>new Set(cards.map(c=>c.code).filter(k=>k&&k!==WILD_RUNE)).size<=1;

// Opening the Custom screen: queued cards not yet cast go back to the hand, then the hand refills to 6.
function openCustom(p){
  p.hand=p.queue.filter(c=>!c.temp).concat(p.hand); p.queue=[];
  const drawn=[];
  const size=RULES.hand+(p.bonus||0); p.bonus=0;
  while(p.hand.length<size && p.draw.length){ const c=p.draw.pop(); p.hand.push(c); drawn.push(c); }
  // Rune Surge opens a 4th slot this turn; some gear can open it by chance (p.surge)
  p.surge=surgeRune(p.hand); p.slots=RULES.slots;
  if(p.surge) p.slots=RULES.surgeSlots;
  else if(p.surgeLuck&&(p.rng||Math.random)()<p.surgeLuck){ p.slots=RULES.surgeSlots; p.surge='luck'; }
  return drawn;
}
/* Combos, read from the queue as it stands (runes already keep a queue to one rune):
   - Recipe: exactly the cards of a recipe fuse into one named card (beats everything else)
   - Double / Triple: copies of the same card merge into one cast at 1.5x / 2x power (charge uses add up)
   - Flush: 3 or more cards of one rune, one of the six colors AND one type, +25% each (+40% for 4)
   - Straight: 3 ranks in a row of one rune, cast as one chain with a finisher; 4 in a row is a Grand Straight */
const NEUTRAL=['gray','brown'];
function findRecipe(cards){ const list=typeof RECIPES!=='undefined'?RECIPES:[];
  return list.find(r=>r.cards.length===cards.length&&fitsRecipe(r,cards))||null; }
function detectCombos(queue){
  const cards=queue.filter(c=>!c.temp).map(c=>c.card), out=[];
  const r=cards.length>=3&&findRecipe(cards);
  if(r) return [{kind:'recipe', recipe:r, label:'Recipe: '+r.name}];
  const by={}; cards.forEach(c=>by[c.id]=(by[c.id]||0)+1);
  for(const id in by) if(by[id]>=2){ const c=cards.find(x=>x.id===id);
    out.push({kind:'simple', id, n:by[id], mult:by[id]>=3?2:1.5, label:(by[id]>=3?'Triple ':'Double ')+c.name+' ×'+(by[id]>=3?2:1.5)}); }
  const kind=c=>c.type==='piece'?c.base:c.type;
  if(cards.length>=3&&oneRune(cards)&&!NEUTRAL.includes(cards[0].color)&&cards.every(c=>c.color===cards[0].color&&kind(c)===kind(cards[0]))&&new Set(cards.map(c=>c.id)).size>1){
    const m=cards.length>=4?1.4:1.25, nm=cards[0].color[0].toUpperCase()+cards[0].color.slice(1);
    out.push({kind:'flush', color:cards[0].color, mult:m, label:'Flush: '+nm+' '+TYPES_NAME(kind(cards[0]))+' +'+Math.round((m-1)*100)+'%'}); }
  const brood=cards.filter(c=>c.brood).length;
  if(brood>=2) out.push({kind:'brood', n:Math.min(4,brood), label:brood>=4?'Elder Grovebeast!':brood===3?'Brood Swarm: two each +50%, an Ogre leads':'Brood Pack: two each +25%'});
  const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
  if(cards.length>=3&&oneRune(cards)&&ranks.every((x,i)=>!i||x===ranks[i-1]+1))
    out.push({kind:'straight', ranks, label:(cards.length>=4?'Grand Straight ':'Straight ')+ranks.join('-')+': chain cast + finisher'});
  const run=runeRun(cards);
  // Rune Set: every queued card has the same rune (✱ fits any): Power, wand ×2.5, for 8s (12s with 4)
  const real=cards.map(c=>c.code).filter(k=>k&&k!==WILD_RUNE);
  if(cards.length>=3&&real.length&&cards.every(c=>c.code)&&oneRune(cards)){ const dur=cards.length>=4?12:8;
    out.push({kind:'set', rune:real[0], n:cards.length, dur, label:(cards.length>=4?'Grand Rune Set ':'Rune Set ')+real[0]+'×'+cards.length+': Wand ×2.5 '+dur+'s'}); }
  if(run){ const dur=run.length>=4?12:8; out.push({kind:'run', runes:run, dur, label:(run.length>=4?'Grand Rune Run ':'Rune Run ')+run.join('-')+': Haste + Courage '+dur+'s'}); }
  return out;
}
/* Rune Run: 3 or 4 cards whose runes are letters in a row (A-B-C, B-C-D … C-D-E-F), in any order;
   a ✱ fills any gap. It gives you Haste and Courage (cards and wand +30%) for 8s, 12s with 4 cards.
   Returns the letters of the run, or null. */
function runeRun(cards){ if(cards.length<3) return null;
  const L=typeof RUNES!=='undefined'?RUNES:['A','B','C','D','E','F'], codes=cards.map(c=>c.code);
  const wild=codes.filter(k=>k===WILD_RUNE).length, idx=codes.filter(k=>k!==WILD_RUNE).map(k=>L.indexOf(k));
  if(idx.length<2||idx.some(i=>i<0)||new Set(idx).size!==idx.length) return null;
  const lo=Math.min(...idx), hi=Math.max(...idx); if(hi-lo+1>cards.length||(hi-lo+1)-idx.length>wild) return null;
  const start=Math.max(0,Math.min(lo,L.length-cards.length)); return L.slice(start,start+cards.length); }
const TYPES_NAME=k=>typeof TYPES!=='undefined'&&TYPES[k]?TYPES[k].name+'s':k;
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
    if(cb.kind==='flush') p.queue.forEach(c=>{ c.mult=(c.mult||1)*cb.mult; c.combo=c.combo||cb.label; });
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
  if(index==null) index=dst.length;
  if(src!==dst&&zone==='queue'&&p.queue.length>=slotsOf(p)){ const ti=Math.min(index,slotsOf(p)-1), other=p.queue[ti];
    p.queue[ti]=card; p.hand[si]=other; return true; }
  if(src!==dst&&zone==='queue'&&!canQueue(p,card)) return false;
  src.splice(si,1); dst.splice(Math.max(0,Math.min(index,dst.length)),0,card); return true;
}

// Tap a card: hand -> queue (if a slot is free), or queue -> hand. Returns true if it moved.
function toggleQueue(p,uid){
  let i=p.queue.findIndex(c=>c.uid===uid);
  if(i>=0){ p.hand.push(p.queue.splice(i,1)[0]); return true; }
  i=p.hand.findIndex(c=>c.uid===uid);
  if(i>=0 && canQueue(p,p.hand[i])){ p.queue.push(p.hand.splice(i,1)[0]); return true; }
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
function drawCards(p,n){ const got=[]; while(got.length<n&&p.draw.length){ const c=p.draw.pop(); p.hand.push(c); got.push(c); } return got; }
function recallTop(p){ if(!p.draw.length||p.queue.length>=slotsOf(p)) return null; const c=p.draw.pop(); p.queue.push(c); return c; }
function copyNext(p){ const c=p.queue[0]; if(!c||p.queue.length>=slotsOf(p)) return null;
  const cp={uid:p.uid++, card:c.card, temp:true}; p.queue.unshift(cp); return cp; }

// Nothing left to draw, hold or cast: the fight continues with the wand only.
function wandOnly(p){ return !p.draw.length && !p.hand.length && !p.queue.length; }

if(typeof module!=='undefined') module.exports={oneRune,slotsOf,surgeRune,runesFit,canQueue,findRecipe,RULES,detectCombos,placeCard,validateDeck,shuffle,createPiles,openCustom,commitCustom,toggleQueue,castNext,drawCards,recallTop,copyNext,wandOnly};
