// Run with: node deck/engine.test.js
const assert=require('assert');
const D=require('./cards.js');
const E=require('./engine.js');
Object.assign(global,D,E);   // collection.js uses the browser globals
const C=require('./collection.js');

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
  assert.strictEqual(D.colorMult('light','fire'),1.75);
  assert.strictEqual(D.colorMult('verdant','fire'),1);
  assert.strictEqual(D.colorMult(null,'fire'),1);
  assert.strictEqual(new Set(Object.values(D.BEATS)).size,6);
});
t('custom draws up to 7, queue holds 3, cast goes to discard', ()=>{
  const p=E.createPiles(D.starterList(['frost','light']),rng,D.CARDS);
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

t('800 cards: 100 per family, doc type split and 40/30/20/10 rarity', ()=>{
  assert.strictEqual(D.CARD_LIST.length,800);
  assert.strictEqual(new Set(D.CARD_LIST.map(c=>c.name)).size,800);
  for(const fam of Object.keys(D.COLORS)){
    const cs=D.CARD_LIST.filter(c=>c.color===fam); assert.strictEqual(cs.length,100,fam);
    const plan=D.TYPE_PLAN[D.COLORS[fam].neutral?fam:'color'];
    for(const t in plan) assert.strictEqual(cs.filter(c=>c.type===t).length,plan[t],fam+' '+t);
    for(const r in D.RARITY_PLAN) assert.strictEqual(cs.filter(c=>c.rarity===r).length,D.RARITY_PLAN[r],fam+' '+r);
  }
  assert(D.CARD_LIST.every(c=>!/undefined|NaN/.test(D.cardText(c))));
});
t('card ids are stable between loads', ()=>{
  delete require.cache[require.resolve('./cards.js')];
  const again=require('./cards.js');
  assert.deepStrictEqual(again.CARD_LIST.map(c=>c.id+c.name+c.rank),D.CARD_LIST.map(c=>c.id+c.name+c.rank));
});
t('charge cards stay queued until their uses are spent', ()=>{
  const id=D.CARD_LIST.find(c=>c.type==='charge'&&c.uses===4).id;
  const p={draw:[],hand:[],queue:[{uid:1,card:D.CARDS[id]}],discard:[],uid:2};
  for(let i=0;i<3;i++){ E.castNext(p); assert.strictEqual(p.queue.length,1); }
  E.castNext(p); assert.strictEqual(p.queue.length,0); assert.strictEqual(p.discard.length,1);
});
t('utility: draw, recall and copy', ()=>{
  const p=E.createPiles(D.starterList(['frost','light']),rng,D.CARDS); E.openCustom(p);
  assert.strictEqual(E.drawCards(p,2).length,2); assert.strictEqual(p.hand.length,9);
  E.toggleQueue(p,p.hand[0].uid);
  assert(E.recallTop(p)); assert.strictEqual(p.queue.length,2);
  const cp=E.copyNext(p); assert(cp&&cp.temp); assert.strictEqual(p.queue.length,3); assert(!E.copyNext(p));
  E.castNext(p); assert.strictEqual(p.discard.length,0, 'a copy is not discarded');
  E.openCustom(p); assert(!p.hand.some(c=>c.temp));
});
t('deck must fit the collection', ()=>{
  const list=D.starterList(['fire','storm']), owned={}; list.forEach(id=>owned[id]=(owned[id]||0)+1);
  assert(E.validateDeck(list,D.CARDS,owned).ok);
  owned[list[0]]--; assert(!E.validateDeck(list,D.CARDS,owned).ok);
});
t('new save: starter deck is legal and owned', ()=>{
  const s=C.newSave(D.STARTERS[0]); assert(E.validateDeck(s.decks[0].list,D.CARDS,s.owned).ok);
  assert.strictEqual(s.decks.length,5); assert.strictEqual(C.ownedUnique(s),17);
});
t('drops and packs: depth shifts rarity, boss adds a rare+', ()=>{
  const w1=C.rarityWeights(1), w9=C.rarityWeights(9); assert(w9.legendary>w1.legendary&&w9.common<w1.common);
  const d=C.battleDrops(['fire','frost'],4,true,rng); assert.strictEqual(d.length,3); assert(['rare','legendary'].includes(d[2].rarity));
  for(let i=0;i<50;i++){ const pk=C.openPack(1,'gray',rng); assert.strictEqual(pk.length,5); assert(pk.every(c=>c.color==='gray')); assert(pk[4].rarity!=='common'); }
});
t('auto-fill builds a legal 60 from what you own', ()=>{
  const s=C.newSave(D.STARTERS[2]); for(let i=0;i<30;i++) C.addCards(s,C.openPack(3,null,rng));
  const list=C.autoFill(s.decks[0].list.slice(0,20),s.owned);
  const v=E.validateDeck(list,D.CARDS,s.owned); assert(v.ok,v.errors.join('; ')); assert.strictEqual(list.length,60);
  assert(C.autoFill([],{}).length===0);
});

t('draw bonus: each empty queue slot draws 1 more next time', ()=>{
  const p=E.createPiles(D.starterList(['fire','storm']),rng,D.CARDS); E.openCustom(p);
  E.toggleQueue(p,p.hand[0].uid); assert.strictEqual(E.commitCustom(p),2);
  E.castNext(p); E.openCustom(p); assert.strictEqual(p.hand.length,9);
  p.hand.slice(0,3).forEach(c=>E.toggleQueue(p,c.uid)); assert.strictEqual(E.commitCustom(p),0);
  E.castNext(p); E.castNext(p); E.castNext(p); E.openCustom(p); assert.strictEqual(p.hand.length,7, 'bonus is spent once');
});
t('charge uses carry across battles and spent copies burn up', ()=>{
  const s=C.newSave(D.STARTERS[0]); const id=D.CARD_LIST.find(c=>c.type==='charge'&&c.uses===3&&c.color==='fire').id;
  s.owned[id]=2; s.decks[0].list=s.decks[0].list.slice(0,58).concat([id,id]);
  const fight=spend=>{ const p=E.createPiles(s.decks[0].list,rng,D.CARDS); C.assignChargeUses(s,p,s.decks[0].list);
    const ch=p.draw.filter(c=>c.card.id===id).sort((a,b)=>a.copy-b.copy); p.queue=[ch[0]]; p.draw=p.draw.filter(c=>c!==ch[0]);
    for(let i=0;i<spend;i++) E.castNext(p); return C.settleChargeUses(s,p); };
  assert.strictEqual(fight(2).length,0); assert.deepStrictEqual(s.charge[id],[1,3]);
  const burned=fight(1); assert.strictEqual(burned.length,1); assert.strictEqual(s.owned[id],1);
  assert.deepStrictEqual(s.charge[id],[3]); assert.strictEqual(s.decks[0].list.filter(x=>x===id).length,1);
});
t('everything a card puts on the board has a turn limit and HP', ()=>{
  for(const c of D.CARD_LIST){ const k=c.type==='piece'?c.base:c.type;
    if(['ward','sentry','summon','machine','trap'].includes(k)) assert(c.turns>=1, c.id+' turns');
    if(k==='environment'&&c.env!=='tremor') assert(c.turns>=1, c.id+' turns');
    if(['sentry','summon','machine'].includes(k)||(k==='ward'&&c.ward!=='barrier')) assert(c.hp>0, c.id+' hp');
    if(k==='ward'&&c.ward==='barrier') assert(c.amt>0, c.id+' shield');
    if(k!=='boon') assert(c.dur==null, c.id+' should count turns, not seconds'); }
});
t('every card has 32 x 32 pixel art of hex colors, all unique, and the CSV files match', ()=>{
  const A=require('./art.js'), fs=require('fs'), path=require('path');
  for(const c of D.CARD_LIST){ const a=A.cardArt(c); assert.strictEqual(a.length,32,c.id); assert(a.every(r=>r.length===32&&r.every(x=>/^#[0-9a-f]{6}$/.test(x))),c.id);
    const f=path.join(__dirname,'art',c.id+'.csv'); assert(fs.existsSync(f),c.id+' csv missing (run node deck/tools/export-art.js)');
    assert.strictEqual(fs.readFileSync(f,'utf8'),A.artCSV(c),c.id+' csv is stale (run node deck/tools/export-art.js)'); }
  assert.strictEqual(new Set(D.CARD_LIST.map(c=>A.artCSV(c))).size,D.CARD_LIST.length,'every picture is different');
});
