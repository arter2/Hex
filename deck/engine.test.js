// Run with: node deck/engine.test.js
const assert=require('assert');
const D=require('./cards.js');
const E=require('./engine.js');

let seed=1; const rng=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
const t=(name,fn)=>{ try{ fn(); console.log('ok  '+name); }catch(e){ console.log('FAIL '+name+'\n  '+e.message); process.exitCode=1; } };

t('every card has a color, type, rank and rarity', ()=>{
  for(const c of D.CARD_LIST){
    assert(D.COLORS[c.color], c.id+' color'); assert(D.TYPES[c.type], c.id+' type');
    assert(c.rank>=1&&c.rank<=12, c.id+' rank'); assert(D.RARITY[c.rarity], c.id+' rarity');
    assert(D.cardText(c).length>5, c.id+' text');
  }
});
t('card ids are unique', ()=>assert.strictEqual(new Set(D.CARD_LIST.map(c=>c.id)).size, D.CARD_LIST.length));
t('starter decks are legal 60-card decks', ()=>{
  for(const s of D.STARTERS){ const v=E.validateDeck(D.starterList(s.colors),D.CARDS); assert(v.ok, s.name+': '+v.errors.join('; ')); assert.strictEqual(v.count,60); }
});
t('deck rules: size, copies, legendary limit', ()=>{
  const base=D.starterList(['fire','storm']);
  assert(!E.validateDeck(base.slice(0,40),D.CARDS).ok);
  assert(!E.validateDeck(base.concat(['spark']),D.CARDS).ok);
  const two=base.slice(0,50).concat(['meteor','meteor']);
  assert(E.validateDeck(two,D.CARDS).errors.some(e=>e.startsWith('Meteor')));
  const five=base.slice(0,50).concat(Array(5).fill('ice_shard'));
  assert(E.validateDeck(five,D.CARDS).errors.some(e=>e.startsWith('Ice Shard')));
});
t('color ring: each color beats the next, neutral otherwise', ()=>{
  assert.strictEqual(D.colorMult('fire','verdant'),1.75);
  assert.strictEqual(D.colorMult('arcane','fire'),1.75);
  assert.strictEqual(D.colorMult('verdant','fire'),1);
  assert.strictEqual(D.colorMult(null,'fire'),1);
  assert.strictEqual(new Set(Object.values(D.BEATS)).size,6);
});
t('custom draws up to 7, queue holds 3, cast goes to discard', ()=>{
  const p=E.createPiles(D.starterList(['frost','arcane']),rng,D.CARDS);
  E.openCustom(p); assert.strictEqual(p.hand.length,7); assert.strictEqual(p.draw.length,53);
  const uids=p.hand.map(c=>c.uid);
  uids.slice(0,4).forEach(u=>E.toggleQueue(p,u));
  assert.strictEqual(p.queue.length,3); assert.strictEqual(p.hand.length,4);
  assert(E.toggleQueue(p,uids[0])); assert.strictEqual(p.queue.length,2);
  const c=E.castNext(p); assert(c); assert.strictEqual(p.discard[0],c); assert.strictEqual(p.queue.length,1);
});
t('uncast queue returns to hand and the hand refills to 7', ()=>{
  const p=E.createPiles(D.starterList(['fire','storm']),rng,D.CARDS);
  E.openCustom(p); p.hand.slice(0,3).map(c=>c.uid).forEach(u=>E.toggleQueue(p,u));
  E.castNext(p);
  const drawn=E.openCustom(p);
  assert.strictEqual(p.queue.length,0); assert.strictEqual(p.hand.length,7); assert.strictEqual(drawn.length,1);
  assert.strictEqual(p.draw.length+p.hand.length+p.discard.length,60);
});
t('no reshuffle: an emptied deck leaves only the wand', ()=>{
  const p=E.createPiles(D.starterList(['verdant','shadow']).slice(0,45),rng,D.CARDS);
  let guard=0;
  while(!E.wandOnly(p) && guard++<100){ E.openCustom(p); p.hand.slice(0,3).map(c=>c.uid).forEach(u=>E.toggleQueue(p,u)); while(E.castNext(p)); }
  assert(E.wandOnly(p)); assert.strictEqual(p.discard.length,45);
  E.openCustom(p); assert.strictEqual(p.hand.length,0);
});
