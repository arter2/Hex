/* Hexmancers deck prototype — card engine.
   Pure deck / hand / queue logic with no rendering, so it can be tested in Node.
   Flow: draw up to 7 at each Custom screen, queue up to 3, casting sends a card to the
   discard pile, unqueued cards stay in hand, and there is no reshuffle: an empty deck
   leaves you with the wand. */

const RULES={max:60, min:45, copies:4, legendaryCopies:1, hand:7, slots:3};

function validateDeck(list,cards){
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
  return {draw, hand:[], queue:[], discard:[]};
}

// Opening the Custom screen: queued cards not yet cast go back to the hand, then the hand refills to 7.
function openCustom(p){
  p.hand=p.queue.concat(p.hand); p.queue=[];
  const drawn=[];
  while(p.hand.length<RULES.hand && p.draw.length){ const c=p.draw.pop(); p.hand.push(c); drawn.push(c); }
  return drawn;
}

// Tap a card: hand -> queue (if a slot is free), or queue -> hand. Returns true if it moved.
function toggleQueue(p,uid){
  let i=p.queue.findIndex(c=>c.uid===uid);
  if(i>=0){ p.hand.push(p.queue.splice(i,1)[0]); return true; }
  i=p.hand.findIndex(c=>c.uid===uid);
  if(i>=0 && p.queue.length<RULES.slots){ p.queue.push(p.hand.splice(i,1)[0]); return true; }
  return false;
}

// Cast the next queued card: it leaves the queue for the discard pile.
function castNext(p){
  const c=p.queue.shift(); if(!c) return null;
  p.discard.push(c); return c;
}

// Nothing left to draw, hold or cast: the fight continues with the wand only.
function wandOnly(p){ return !p.draw.length && !p.hand.length && !p.queue.length; }

if(typeof module!=='undefined') module.exports={RULES,validateDeck,shuffle,createPiles,openCustom,toggleQueue,castNext,wandOnly};
