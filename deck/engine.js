/* Hexmancers deck prototype — card engine.
   Pure deck / hand / queue logic with no rendering, so it can be tested in Node.
   Flow: draw up to 7 at each Custom screen, queue up to 3, casting sends a card to the
   discard pile, unqueued cards stay in hand, and there is no reshuffle: an empty deck
   leaves you with the wand. Each queue slot left empty draws 1 extra card next time. */

const RULES={max:60, min:45, copies:4, legendaryCopies:1, hand:7, slots:3};

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
    const lim=cards[id].rarity==='legendary'?RULES.legendaryCopies:RULES.copies;
    if(counts[id]>lim) errors.push(cards[id].name+': '+counts[id]+' copies (max '+lim+')');
    else if(owned&&counts[id]>(owned[id]||0)) errors.push(cards[id].name+': you own '+(owned[id]||0));
  }
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
  return {draw, hand:[], queue:[], discard:[], uid, bonus:0};
}

// Opening the Custom screen: queued cards not yet cast go back to the hand, then the hand refills to 7.
function openCustom(p){
  p.hand=p.queue.filter(c=>!c.temp).concat(p.hand); p.queue=[];
  const drawn=[];
  const size=RULES.hand+(p.bonus||0); p.bonus=0;
  while(p.hand.length<size && p.draw.length){ const c=p.draw.pop(); p.hand.push(c); drawn.push(c); }
  return drawn;
}
/* Combos, read from the queue as it stands (Battle Network style):
   - Double / Triple: copies of the same card merge into one cast at 1.5x / 2x power (charge uses add up)
   - Flush: three cards of one of the six colors, +25% on each
   - Straight: three consecutive ranks, cast as one chain with a finisher hit */
const NEUTRAL=['gray','brown'];
function detectCombos(queue){
  const cards=queue.filter(c=>!c.temp).map(c=>c.card), out=[];
  const by={}; cards.forEach(c=>by[c.id]=(by[c.id]||0)+1);
  for(const id in by) if(by[id]>=2){ const c=cards.find(x=>x.id===id);
    out.push({kind:'simple', id, n:by[id], mult:by[id]>=3?2:1.5, label:(by[id]>=3?'Triple ':'Double ')+c.name+' ×'+(by[id]>=3?2:1.5)}); }
  if(cards.length===RULES.slots&&!NEUTRAL.includes(cards[0].color)&&cards.every(c=>c.color===cards[0].color))
    out.push({kind:'flush', color:cards[0].color, mult:1.25, label:'Flush: '+cards[0].color[0].toUpperCase()+cards[0].color.slice(1)+' +25%'});
  const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
  if(cards.length===RULES.slots&&ranks[1]===ranks[0]+1&&ranks[2]===ranks[1]+1)
    out.push({kind:'straight', ranks, label:'Straight '+ranks.join('-')+': chain cast + finisher'});
  return out;
}
// Leaving the Custom screen: combos lock in, and every empty slot adds 1 card to the next
// draw (Battle Network style).
function commitCustom(p){
  const combos=detectCombos(p.queue);
  for(const cb of combos){
    if(cb.kind==='simple'){ const same=p.queue.filter(c=>c.card.id===cb.id), keep=same[0];
      keep.mult=(keep.mult||1)*cb.mult; keep.combo=cb.label;
      if(keep.card.uses) keep.left=same.reduce((a,c)=>a+(c.left==null?c.card.uses:c.left),0);
      for(const c of same.slice(1)){ p.queue.splice(p.queue.indexOf(c),1); p.discard.push(c); } }
    if(cb.kind==='flush') p.queue.forEach(c=>{ c.mult=(c.mult||1)*cb.mult; c.combo=c.combo||cb.label; });
    if(cb.kind==='straight'&&p.queue.length===RULES.slots){ p.queue[0].straight=cb.ranks; p.queue.forEach(c=>c.combo=c.combo||cb.label); }
  }
  p.combos=combos;
  p.bonus=RULES.slots-p.queue.length-combos.filter(c=>c.kind==='simple').reduce((a,c)=>a+c.n-1,0);
  return p.bonus;
}
// Drag and drop on the Custom screen: put a card into the hand or the queue at a position.
// Dropping a hand card onto a full queue swaps it with the card in that slot.
function placeCard(p,uid,zone,index){
  const qi=p.queue.findIndex(c=>c.uid===uid), hi=p.hand.findIndex(c=>c.uid===uid);
  if(qi<0&&hi<0) return false;
  const src=qi>=0?p.queue:p.hand, si=qi>=0?qi:hi, dst=zone==='queue'?p.queue:p.hand, card=src[si];
  if(index==null) index=dst.length;
  if(src!==dst&&zone==='queue'&&p.queue.length>=RULES.slots){ const ti=Math.min(index,RULES.slots-1), other=p.queue[ti]; p.queue[ti]=card; p.hand[si]=other; return true; }
  src.splice(si,1); dst.splice(Math.max(0,Math.min(index,dst.length)),0,card); return true;
}

// Tap a card: hand -> queue (if a slot is free), or queue -> hand. Returns true if it moved.
function toggleQueue(p,uid){
  let i=p.queue.findIndex(c=>c.uid===uid);
  if(i>=0){ p.hand.push(p.queue.splice(i,1)[0]); return true; }
  i=p.hand.findIndex(c=>c.uid===uid);
  if(i>=0 && p.queue.length<RULES.slots){ p.queue.push(p.hand.splice(i,1)[0]); return true; }
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
function recallTop(p){ if(!p.draw.length||p.queue.length>=RULES.slots) return null; const c=p.draw.pop(); p.queue.push(c); return c; }
function copyNext(p){ const c=p.queue[0]; if(!c||p.queue.length>=RULES.slots) return null;
  const cp={uid:p.uid++, card:c.card, temp:true}; p.queue.unshift(cp); return cp; }

// Nothing left to draw, hold or cast: the fight continues with the wand only.
function wandOnly(p){ return !p.draw.length && !p.hand.length && !p.queue.length; }

if(typeof module!=='undefined') module.exports={RULES,detectCombos,placeCard,validateDeck,shuffle,createPiles,openCustom,commitCustom,toggleQueue,castNext,drawCards,recallTop,copyNext,wandOnly};
