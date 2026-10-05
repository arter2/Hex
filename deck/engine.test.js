// Run with: node deck/engine.test.js
const assert=require('assert');
const D=require('./cards.js');
const E=require('./engine.js');
Object.assign(global,D,E);   // collection.js uses the browser globals
const C=require('./collection.js');
const G=require('./gear.js'); Object.assign(global,G);   // collection.js rolls loot from gear.js

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
// piles whose next draws are exactly these cards, in order
const stacked=(ids,extra)=>{ let uid=1; const draw=(extra||[]).concat(ids.slice().reverse()).map(id=>({uid:uid++,card:D.CARDS[id]})); return {draw,hand:[],queue:[],discard:[],uid,bonus:0,slots:3}; };
// four rune-A fire/frost cards and some others
const A4=['cinder_lance','ember_wall','flame_fan','frost_ward'], MIX=['ember_dart','spark','ice_shard'];
t('custom draws up to 7, queue holds 3, cast goes to discard', ()=>{
  const p=stacked(['cinder_lance','ember_wall','flame_fan','ember_dart','spark','ice_shard','holy_bolt'],D.starterList(['frost','light']).slice(0,10));
  E.openCustom(p); assert.strictEqual(p.hand.length,7); assert.strictEqual(p.draw.length,10);
  const uids=p.hand.map(c=>c.uid);
  uids.slice(0,3).forEach(u=>E.toggleQueue(p,u)); assert(!E.toggleQueue(p,uids[3]),'full');
  assert.strictEqual(p.queue.length,3); assert.strictEqual(p.hand.length,4);
  assert(E.toggleQueue(p,uids[0])); assert.strictEqual(p.queue.length,2);
  const c=E.castNext(p); assert(c); assert.strictEqual(p.discard[0],c); assert.strictEqual(p.queue.length,1);
});
t('runes: any cards can be queued, but a flush or straight needs one rune (wild fits any)', ()=>{
  const C=id=>D.CARDS[id], I=(id,uid)=>({uid,card:D.CARDS[id]});
  assert(E.oneRune([C('cinder_lance'),C('ember_wall'),C('frost_ward')]),'all rune A'); assert(!E.oneRune([C('cinder_lance'),C('brazier')]),'A and C');
  const wild=D.CARD_LIST.find(c=>c.code==='✱'&&c.rarity!=='hero'); assert(E.oneRune([C('cinder_lance'),wild]));
  const p=stacked(['cinder_lance','brazier','ember_wall','spark','ice_shard','holy_bolt','mend']); E.openCustom(p);
  assert(E.toggleQueue(p,p.hand[0].uid)); assert(E.toggleQueue(p,p.hand[0].uid),'a rune C card can follow a rune A card');
  // a straight of mixed runes does not count: Ember Dart 1 (B), Ember Wall... build ranks 3,4,5 with one off-rune card
  const off=D.CARD_LIST.find(c=>c.rank===5&&c.code!=='A'&&c.color==='fire'&&c.type!=='strike');
  assert(E.detectCombos([I('cinder_lance',1),I('ember_wall',2),I('flame_fan',3)]).some(c=>c.kind==='straight'),'rune A 3-4-5');
  assert(!E.detectCombos([I('cinder_lance',1),I('ember_wall',2),{uid:3,card:off}]).some(c=>c.kind==='straight'),'mixed runes: no straight');
});
t('Rune Surge: 4 cards of one rune in hand open a 4th slot for that turn', ()=>{
  const p=stacked(A4.concat(MIX)); E.openCustom(p); assert.strictEqual(p.surge,'A'); assert.strictEqual(E.slotsOf(p),4);
  p.hand.slice(0,4).map(c=>c.uid).forEach(u=>assert(E.toggleQueue(p,u))); assert.strictEqual(p.queue.length,4);
  const q=stacked(['cinder_lance','ember_wall','flame_fan','ember_dart','spark','ice_shard','holy_bolt']); E.openCustom(q); assert.strictEqual(E.slotsOf(q),3);
  const g=stacked(['cinder_lance','ember_dart','spark','ice_shard','holy_bolt','mend','hex_bolt']); g.surgeLuck=1; E.openCustom(g); assert.strictEqual(E.slotsOf(g),4,'gear luck');
});
t('recipes fuse their cards into one card; four-card recipes need the 4th slot', ()=>{
  const r=D.RECIPES.find(x=>x.cards.length===3), I=(id,uid)=>({uid,card:D.CARDS[id]});
  const p={draw:[],hand:[],queue:r.cards.map((id,i)=>I(id,i+1)),discard:[],uid:9,slots:3};
  const cb=E.detectCombos(p.queue); assert.strictEqual(cb[0].kind,'recipe'); assert.strictEqual(cb.length,1);
  E.commitCustom(p); assert.strictEqual(p.queue.length,1); assert.strictEqual(p.queue[0].card.name,r.name); assert.strictEqual(p.discard.length,3); assert.strictEqual(p.bonus,0);
  E.castNext(p); assert.strictEqual(p.discard.length,3,'the fused card is not discarded');
  assert(D.RECIPES.some(x=>x.cards.length===4)); assert(D.RECIPES.every(x=>x.cards.every(id=>D.CARDS[id])));
  for(const st of D.STARTERS){ const own=new Set(D.starterList(st.colors)); assert(D.RECIPES.every(x=>!x.cards.every(id=>own.has(id))),'a starter deck alone makes no recipe'); }
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

t('1,000 cards: 125 per family, type split and 50/38/25/12 rarity, plus 6 heroes', ()=>{
  assert.strictEqual(D.CARD_LIST.length,1010); assert.strictEqual(D.HEROES.length,6);
  assert.strictEqual(new Set(D.CARD_LIST.map(c=>c.name)).size,1010);
  assert.deepStrictEqual(D.HEROES.map(h=>h.color).sort(),D.SIX.slice().sort(),'one hero per color');
  for(const fam of Object.keys(D.COLORS)){
    const cs=D.CARD_LIST.filter(c=>c.color===fam&&c.rarity!=='hero'&&!c.potion); assert.strictEqual(cs.length,125,fam);
    for(let r=1;r<=12;r++){ const n=cs.filter(c=>c.rank===r).length; assert(n>=8&&n<=13,fam+' rank '+r+': '+n); }
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
  const d=C.battleRewards(['fire','frost'],4,true,rng); assert(d.cards.length>=2&&d.gold>0&&d.items.length===1); assert(['rare','legendary'].includes(d.cards[0].rarity));
  for(let i=0;i<50;i++){ const pk=C.openPack(1,'gray',rng); assert.strictEqual(pk.length,5); assert(pk.every(c=>c.color==='gray')); assert(pk[4].rarity!=='common'); }
});
t('auto-fill builds a legal 60 from what you own', ()=>{
  const s=C.newSave(D.STARTERS[2]); for(let i=0;i<30;i++) C.addCards(s,C.openPack(3,null,rng));
  const list=C.autoFill(s.decks[0].list.slice(0,20),s.owned);
  const v=E.validateDeck(list,D.CARDS,s.owned); assert(v.ok,v.errors.join('; ')); assert.strictEqual(list.length,60);
  assert(C.autoFill([],{}).length===0);
});

t('draw bonus: each empty queue slot draws 1 more next time', ()=>{
  const p=stacked(['cinder_lance','ember_dart','spark','ice_shard','holy_bolt','mend','hex_bolt'],D.starterList(['fire','storm']).slice(0,30)); E.openCustom(p);
  E.toggleQueue(p,p.hand[0].uid); assert.strictEqual(E.commitCustom(p),2);
  E.castNext(p); E.openCustom(p); assert.strictEqual(p.hand.length,9);
  const p2=stacked(['cinder_lance','ember_wall','flame_fan','ember_dart','spark','ice_shard','holy_bolt'],D.starterList(['fire','storm']).slice(0,30)); E.openCustom(p2);
  p2.hand.slice(0,3).forEach(c=>E.toggleQueue(p2,c.uid)); assert.strictEqual(E.commitCustom(p2),0);
  E.castNext(p2); E.castNext(p2); E.castNext(p2); E.openCustom(p2); assert.strictEqual(p2.hand.length,7, 'no bonus when the queue was full');
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
t('every card has 64 x 64 pixel art of hex colors, all unique, and the CSV files match', ()=>{
  const A=require('./art.js'), fs=require('fs'), path=require('path');
  for(const c of D.CARD_LIST){ const a=A.cardArt(c); assert.strictEqual(a.length,64,c.id); assert(a.every(r=>r.length===64&&r.every(x=>/^#[0-9a-f]{6}$/.test(x))),c.id);
    const f=path.join(__dirname,'art',c.id+'.csv'); assert(fs.existsSync(f),c.id+' csv missing (run node deck/tools/export-art.js)');
    assert.strictEqual(fs.readFileSync(f,'utf8'),A.artCSV(c),c.id+' csv is stale (run node deck/tools/export-art.js)'); }
  assert.strictEqual(new Set(D.CARD_LIST.map(c=>A.artCSV(c))).size,D.CARD_LIST.length,'every picture is different');
});

t('combos: double, triple, flush (one color and one type) and straight are detected and locked in', ()=>{
  const I=(id,uid)=>({uid,card:D.CARDS[id]});
  let cb=E.detectCombos([I('ember_dart',1),I('ember_dart',2),I('fire_pot',3)]); assert(cb.some(c=>c.kind==='simple'&&c.mult===1.5)); assert(!cb.some(c=>c.kind==='flush'),'strike+lob is no flush');
  cb=E.detectCombos([I('ember_dart',1),I('ember_dart',2),I('ember_dart',3)]); assert(cb.some(c=>c.kind==='simple'&&c.mult===2)); assert(!cb.some(c=>c.kind==='flush'),'copies alone are no flush');
  const fs=D.CARD_LIST.filter(c=>c.color==='fire'&&c.type==='strike'&&c.code==='A').slice(0,3); assert.strictEqual(fs.length,3);
  cb=E.detectCombos(fs.map((c,i)=>({uid:i+1,card:c}))); assert(cb.some(c=>c.kind==='flush'),'three rune A fire strikes');
  cb=E.detectCombos([I('ember_dart',1),I('cinder_lance',2),I('flame_fan',3)]); assert(!cb.some(c=>c.kind==='flush'),'fire strikes of mixed runes: no flush');
  cb=E.detectCombos([I('cinder_lance',1),I('ember_wall',2),I('flame_fan',3)]);   // ranks 3,4,5, all rune A
  assert(cb.some(c=>c.kind==='straight')); assert(!cb.some(c=>c.kind==='flush'));
  const G=D.CARD_LIST.filter(c=>c.color==='fire'&&c.code==='A'&&c.type!=='piece').slice(0,0);
  const p={draw:[],hand:[],queue:[I('ember_dart',1),I('ember_dart',2),I('fire_pot',3)],discard:[],slots:3};
  E.commitCustom(p); assert.strictEqual(p.queue.length,2); assert.strictEqual(p.queue[0].mult,1.5); assert.strictEqual(p.discard.length,1); assert.strictEqual(p.bonus,0);
  const p2={draw:[],hand:[],queue:[I('cinder_lance',1),I('ember_wall',2),I('flame_fan',3)],discard:[],slots:3};
  E.commitCustom(p2); assert(p2.queue[0].straight);
});
t('drag and drop: reorder, move between hand and queue, swap into a full queue', ()=>{
  const p=stacked(['cinder_lance','ember_wall','flame_fan','frost_ward','ember_dart','spark','ice_shard']); E.openCustom(p); p.slots=3;
  const [a,b,c,d,e]=p.hand.map(x=>x.uid);
  E.placeCard(p,a,'queue',0); E.placeCard(p,b,'queue',0); assert.deepStrictEqual(p.queue.map(x=>x.uid),[b,a]);
  E.placeCard(p,c,'queue',1); assert.deepStrictEqual(p.queue.map(x=>x.uid),[b,c,a]);
  E.placeCard(p,d,'queue',2); assert.deepStrictEqual(p.queue.map(x=>x.uid),[b,c,d]); assert(p.hand.some(x=>x.uid===a),'swapped out to the hand');
  E.placeCard(p,b,'hand',0); assert.strictEqual(p.hand[0].uid,b); assert.strictEqual(p.queue.length,2);
  const last=p.hand.at(-1).uid; E.placeCard(p,last,'hand',1); assert.strictEqual(p.hand[1].uid,last);
  assert.strictEqual(p.hand.length+p.queue.length,7);
});
t('heroes: one per deck, one copy, rare drops that favor new ones', ()=>{
  const s=C.newSave(D.STARTERS[0]), list=s.decks[0].list.slice(0,58);
  assert(E.validateDeck(list.concat(['hero_pyra']),D.CARDS).ok);
  assert(E.validateDeck(list.concat(['hero_pyra','hero_volta']),D.CARDS).errors.some(e=>e.startsWith('Only 1 hero')));
  assert(E.validateDeck(list.concat(['hero_pyra','hero_pyra']),D.CARDS).errors.some(e=>e.startsWith('Pyra')));
  assert(C.heroChance(1)<C.heroChance(9)&&C.heroChance(40)<=.15);
  let heroes=0; for(let i=0;i<2000;i++) heroes+=C.battleRewards(['fire'],5,true,rng).cards.filter(c=>c.rarity==='hero').length;
  assert(heroes>60&&heroes<240,'about 9% of boss fights at depth 5: '+heroes);
  for(let i=0;i<300;i++) assert(C.battleRewards(['fire'],5,false,rng).cards.every(c=>c.rarity!=='hero'),'only bosses drop heroes');
  const owned={}; D.HEROES.slice(0,5).forEach(h=>owned[h.id]=1); assert.strictEqual(C.rollHero(rng,owned).id,D.HEROES[5].id);
  owned.hero_widow=1; owned.hero_aurel=1; const f=C.autoFill([],Object.assign({},s.owned,owned)); assert.strictEqual(f.filter(id=>D.CARDS[id].rarity==='hero').length,1);
});
t('combos are uncommon: with runes, a starter hand rarely offers a flush or straight', ()=>{
  const N=1500; let fl=0, st=0, surge=0;
  const subs=h=>{ const o=[]; for(let i=0;i<h.length;i++) for(let j=i+1;j<h.length;j++) for(let k=j+1;k<h.length;k++) o.push([h[i],h[j],h[k]]); return o; };
  for(let i=0;i<N;i++){ const p=E.createPiles(D.starterList(['fire','storm']),rng,D.CARDS); E.openCustom(p); if(E.slotsOf(p)>3) surge++;
    const ok=subs(p.hand).filter(q=>E.runesFit(q.map(c=>c.card))).map(q=>E.detectCombos(q).map(c=>c.kind)).flat();
    if(ok.includes('flush')) fl++; if(ok.includes('straight')) st++; }
  assert(fl/N<.15,'flush '+fl/N); assert(st/N<.18,'straight '+st/N); assert(surge/N>.03&&surge/N<.18,'surge '+surge/N);
});
t('a normal fight gives exactly one reward: a card, gold or an item; a boss gives more', ()=>{
  const kinds={card:0,gold:0,item:0};
  for(let i=0;i<3000;i++){ const r=C.battleRewards(['fire','frost'],3,false,rng), n=r.cards.length+(r.gold?1:0)+r.items.length;
    assert.strictEqual(n,1); kinds[r.cards.length?'card':r.gold?'gold':'item']++; r.items.forEach(k=>assert(G.GEAR[k]||k.startsWith('scroll:'),k)); }
  assert(kinds.card>1400&&kinds.gold>700&&kinds.item>300,JSON.stringify(kinds));
  const b=C.battleRewards(['fire'],4,true,rng); assert(b.cards.length+(b.gold?1:0)+b.items.length>=4);
});
t('gear: every save starts with the basic wand; copies merge up to +3; enchanting adds one enchantment', ()=>{
  const s=C.newSave(D.STARTERS[0]); assert.strictEqual(s.gear.weapon,'basic_wand'); assert.strictEqual(G.itemCount(s),1);
  const base=G.gearMods(s); assert.strictEqual(base.tap,0);
  G.addGear(s,'ice_wand'); assert.strictEqual(s.gear.weapon,'basic_wand','a full slot is not changed');
  assert(G.equip(s,'weapon','ice_wand').ok); let m=G.gearMods(s); assert.strictEqual(m.color,'frost'); assert(m.chill>0);
  assert(!G.mergeGear(s,'ice_wand').ok,'one copy cannot merge'); G.addGear(s,'ice_wand'); G.addGear(s,'ice_wand');
  assert(G.mergeGear(s,'ice_wand').ok); assert(G.mergeGear(s,'ice_wand').ok); assert.strictEqual(s.gearLv.ice_wand,2); assert.strictEqual(s.items.ice_wand,1);
  m=G.gearMods(s); assert.strictEqual(m.tap,2); assert.strictEqual(m.charged,4); assert(G.gearName(s,'ice_wand').endsWith('+2'));
  assert(!G.enchantGear(s,'ice_wand').ok,'needs a scroll'); G.addScroll(s,'enchant'); assert(G.enchantGear(s,'ice_wand',()=>.99).ok); assert(s.ench.ice_wand); assert(!G.enchantGear(s,'ice_wand').ok,'one enchantment');
  ['broken_wand','basic_wand','ice_wand','volt_wand','dark_wand','light_wand'].forEach(id=>assert(G.GEAR[id]&&G.GEAR[id].slot==='weapon',id));
  assert(Object.values(G.GEAR).filter(g=>g.legendary).length>=4);
});
t('gear is identified, but enchantments and curses stay hidden until worn; a curse sticks until broken', ()=>{
  const s=C.newSave(D.STARTERS[0]); G.addGear(s,'plate_armor'); s.hidden.plate_armor={curse:'lead'};
  s.gear.body=null; delete s.worn.plate_armor; assert.strictEqual(G.gearName(s,'plate_armor'),'Plate Armor','named, curse unknown'); assert(G.unworn(s,'plate_armor'));
  const r=G.equip(s,'body','plate_armor'); assert(r.cursed); assert(G.isStuck(s,'plate_armor')); assert.strictEqual(G.gearName(s,'plate_armor'),'Plate Armor of Lead');
  assert(G.gearMods(s).slow>1.3*1.3,'the curse adds to the armor'); assert(!G.equip(s,'body',null).ok,'it will not come off');
  // break it with 3 rune A cards (the curse's rune)
  assert.strictEqual(G.curseRune(s,'plate_armor'),'A');
  const runeA=Object.keys(s.owned).filter(id=>D.CARDS[id].code==='A'); const pick=[]; for(const id of runeA) for(let i=0;i<s.owned[id]&&pick.length<3;i++) pick.push(id);
  const wrong=Object.keys(s.owned).find(id=>D.CARDS[id].code!=='A'); assert(!G.sacrificeFor(s,'plate_armor',[wrong,wrong,wrong]).ok);
  assert(G.sacrificeFor(s,'plate_armor',pick).ok); assert(!G.isStuck(s,'plate_armor')); assert(G.equip(s,'body',null).ok);
  assert(s.decks[0].list.every(id=>(s.owned[id]||0)>=s.decks[0].list.filter(x=>x===id).length),'decks only hold cards you still own');
  // a hidden enchantment shows up when worn; heavy armor stops slowing casting once enchanted
  const t=C.newSave(D.STARTERS[0]); G.addGear(t,'iron_mail'); t.gear.body=null; delete t.worn.iron_mail; t.hidden.iron_mail={ench:'vigor'};
  assert(G.gearMods(t).castSlow===undefined||G.gearMods(t).castSlow===1); G.equip(t,'body','iron_mail'); assert.strictEqual(t.ench.iron_mail,'vigor'); assert(!G.gearMods(t).castSlow,'enchanted heavy armor casts at full speed');
  const u=C.newSave(D.STARTERS[0]); G.addGear(u,'iron_mail'); assert(G.gearMods(u).castSlow>1,'plain heavy armor slows casting');
  // or a scroll
  const v=C.newSave(D.STARTERS[0]); G.addGear(v,'oak_wand'); v.hidden.oak_wand={curse:'thirst'}; delete v.worn.oak_wand; assert(G.equip(v,'weapon','oak_wand').cursed); assert(!G.purifyGear(v,'oak_wand').ok);
  G.addScroll(v,'purify'); assert(G.purifyGear(v,'oak_wand').ok); assert(!G.gearMods(v).hpPerShot);
  // new loot hides traits now and then, never on legendaries
  let cursed=0, ench=0; for(let i=0;i<2000;i++){ const w=C.newSave(D.STARTERS[0]); G.addGear(w,'elven_bow',rng); const h=w.hidden.elven_bow; if(h&&h.curse) cursed++; if(h&&h.ench) ench++; }
  assert(cursed>200&&cursed<420,'cursed '+cursed); assert(ench>140&&ench<340,'enchanted '+ench);
  for(let i=0;i<300;i++){ const w=C.newSave(D.STARTERS[0]); G.addGear(w,'first_flame',rng); assert(!(w.hidden.first_flame&&w.hidden.first_flame.curse)); }
});
t('sets: all three pieces give the bonus; old cursed items become ordinary pieces with a curse; the look follows the gear', ()=>{
  const s=C.newSave(D.STARTERS[0]); ['kabuto','samurai_suit','lacquered_bracers'].forEach(id=>G.addGear(s,id));
  assert.deepStrictEqual(G.activeSets(s),['samurai']); assert(G.gearMods(s).counter>=25);
  const L=G.gearLook(s); assert.strictEqual(L.body,'samurai'); assert.strictEqual(L.hat,'kabuto');
  G.addGear(s,'elven_bow'); G.equip(s,'weapon','elven_bow'); assert.strictEqual(G.gearLook(s).weapon,'bow');
  const o=C.newSave(D.STARTERS[0]); o.items.leaden_robe=1; o.gear.body='leaden_robe'; o.cursed={leaden_robe:1}; G.ensureStarterGear(o);
  assert.strictEqual(o.gear.body,'plate_armor'); assert.strictEqual(o.cursed.plate_armor,'lead'); assert(!o.items.leaden_robe);
});
t('seven slots: two-handed weapons push out a shield, rings fill two slots, old saves move armor to body', ()=>{
  const s=C.newSave(D.STARTERS[0]);
  G.addGear(s,'buckler'); assert.strictEqual(s.gear.offhand,'buckler');
  G.addGear(s,'oak_staff'); assert(G.equip(s,'weapon','oak_staff').ok); assert(!s.gear.offhand,'a staff takes both hands');
  assert(!G.equip(s,'offhand','buckler').ok,'no shield with a staff');
  G.addGear(s,'ring_vigor'); G.addGear(s,'ring_regen'); assert.strictEqual(s.gear.ring1,'ring_vigor'); assert.strictEqual(s.gear.ring2,'ring_regen');
  G.equip(s,'ring1',null); assert(G.equip(s,'ring','ring_vigor').ok); assert.strictEqual(s.gear.ring1,'ring_vigor'); assert(!('ring' in s.gear));
  const m=G.gearMods(s); assert.strictEqual(m.kind,'staff'); assert.strictEqual(m.hp,20); assert.strictEqual(m.regen,1);
  G.addGear(s,'plate_armor'); G.addGear(s,'iron_helm'); assert.strictEqual(s.gear.body,'plate_armor'); assert(G.gearMods(s).slow>1.3&&G.gearMods(s).castSlow>1);
  for(const k of ['wand','staff','bow','crossbow','spear']) assert(Object.values(G.GEAR).some(g=>(g.kind||'wand')===k&&g.slot==='weapon'),k);
  for(const n of ['Cloth Shirt','Plate Armor','Leather Armor','Samurai Suit','Black Thief Outfit','Iron Helm','Buckler','Leather Bracers']) assert(Object.values(G.GEAR).some(g=>g.name===n),n);
  const old=C.newSave(D.STARTERS[0]); old.gear={weapon:'basic_wand',armor:'iron_mail'}; old.items.iron_mail=1; G.ensureStarterGear(old);
  assert.strictEqual(old.gear.body,'iron_mail'); assert(!('armor' in old.gear));
});
t('loot: scrolls, gear by depth, rare legendaries', ()=>{
  const n={scroll:0,legend:0,t3:0}; const N=4000;
  for(let i=0;i<N;i++){ const k=G.rollLoot(9,rng,true); if(k.startsWith('scroll:')){ n.scroll++; continue; } const g=G.GEAR[k]; assert(g,k); if(g.legendary) n.legend++; else if(g.tier===3) n.t3++; }
  assert(n.scroll>600&&n.scroll<1000,JSON.stringify(n)); assert(n.legend>150&&n.legend<400,JSON.stringify(n)); assert(n.t3>1000,JSON.stringify(n));
  for(let i=0;i<500;i++){ const k=G.rollLoot(1,rng,false); if(G.GEAR[k]&&!G.GEAR[k].legendary) assert(G.GEAR[k].tier<=1,k); }
  const s=C.newSave(D.STARTERS[0]); G.addLoot(s,'scroll:purify'); assert.strictEqual(s.scrolls.purify,1);
});
t('potions are gray cards, and potions in an old save become those cards', ()=>{
  assert.strictEqual(D.POTIONS.length,4); D.POTIONS.forEach(c=>{ assert(D.CARDS[c.id]); assert.strictEqual(c.color,'gray'); assert(D.cardText(c).length>5); });
  const s=C.newSave(D.STARTERS[0]); s.items={draught:2,wind:1};
  global.localStorage={getItem:()=>JSON.stringify(s)}; const m=C.loadSave(); delete global.localStorage;
  assert.strictEqual(m.owned.potion_heal,2); assert.strictEqual(m.owned.potion_wind,1); assert(!m.items.draught&&!m.items.wind); assert.strictEqual(m.gear.weapon,'basic_wand','old saves get the basic wand');
});

const CH=require('./chars.js');
t('every race baseline adds up to 90 and has a man and a woman look', ()=>{
  for(const k of CH.RACE_KEYS){ const R=CH.RACES[k]; assert.strictEqual(CH.STAT_KEYS.reduce((a,s)=>a+R.base[s],0),90,k); assert.strictEqual(R.looks.length,2,k); }
});
t('every race splits its baseline the same way: 60 in combat stats, 30 in dungeon stats', ()=>{
  for(const k of CH.RACE_KEYS){ const b=CH.RACES[k].base; assert.strictEqual(['str','dex','con','int','rch','cst'].reduce((a,s)=>a+b[s],0),60,k); assert.strictEqual(b.wis+b.cha+b.stl,30,k); }
});
t('12 points to spend, never below the race baseline or above the cap', ()=>{
  const c=CH.newChar('orc',1); assert.strictEqual(c.look,'orc_f'); assert.strictEqual(CH.pointsLeft(c),12);
  assert(!CH.spendPoint(c,'str',-1),'cannot go below baseline');
  let n=0; while(CH.spendPoint(c,'str',1)) n++; assert.strictEqual(CH.statOf(c,'str'),CH.STAT_MAX); assert.strictEqual(n,CH.STAT_MAX-CH.RACES.orc.base.str);
  while(CH.spendPoint(c,'wis',1)); assert.strictEqual(CH.pointsLeft(c),0); assert.strictEqual(CH.statOf(c,'wis'),CH.RACES.orc.base.wis+CH.STAT_POINTS-n); assert(!CH.spendPoint(c,'dex',1),'no points left');
  assert(CH.spendPoint(c,'wis',-1)); assert.strictEqual(CH.pointsLeft(c),1);
});
t('stats change play: average is no change, a strong stat helps', ()=>{
  const h=CH.statMods(CH.newChar('human',0)); for(const k of ['shotMult','shotSpeed','spell','search','price','cd','charge','gauge','castSlow']) assert.strictEqual(h[k],1,k); assert.strictEqual(h.hp,0);
  const o=CH.newChar('orc',0); const m=CH.statMods(o); assert(m.shotMult>1&&m.hp>0&&m.spell<1);
  assert.deepStrictEqual(CH.statMods(null).hp,0);
  const G2=require('./gear.js'); const sv={char:o}; global.statMods=CH.statMods; assert.strictEqual(G2.gearMods(sv).hp,m.hp);
});
t('experience: levels bring stat points, confirmed points stay, the cap rises', ()=>{
  const sv={look:'wizard'}; CH.ensureChar(sv); assert.strictEqual(sv.level,1); assert.strictEqual(CH.pointsLeft(sv.char),12,'old saves get their creation points');
  const c=CH.newChar('elf',0); CH.lockChar(c); sv.char=c; assert.strictEqual(CH.pointsLeft(c),12);
  for(const k of CH.STAT_KEYS) while(CH.pointsLeft(c)&&CH.spendPoint(c,k,1)); CH.lockChar(c); assert.strictEqual(CH.pointsLeft(c),0);
  assert.strictEqual(CH.gainXp(sv,CH.xpNeed(1)+CH.xpNeed(2)),2); assert.strictEqual(sv.level,3); assert.strictEqual(CH.pointsLeft(c),2*CH.LEVEL_POINTS); assert(sv.lvlNew);
  assert(!CH.spendPoint(c,'str',-1),'confirmed points are locked');
  assert(CH.spendPoint(c,'str',1)); assert(CH.spendPoint(c,'str',-1),'new points can be taken back');
  assert.strictEqual(CH.statCap(c),CH.STAT_CAP);
  assert(CH.fightXp([{boss:true}],4)>CH.fightXp([{}],4)&&CH.fightXp([{minion:true}],4)<CH.fightXp([{}],4));
});
t('enchanted and cursed gear raise and lower your stats while worn', ()=>{
  const G3=require('./gear.js'); global.statMods=CH.statMods; global.STATS=CH.STATS;
  const id=Object.keys(G3.GEAR).find(k=>G3.GEAR[k].slot==='weapon'), sv={char:CH.newChar('human',0)}; G3.gearState(sv);
  const before=G3.gearMods(sv); sv.items[id]=1; sv.gear.weapon=id; sv.ench[id]='might';
  const m=G3.gearMods(sv); assert.strictEqual(m.stats.str,2); assert(m.shotMult>before.shotMult,'+2 STR adds shot damage');
  sv.cursed[id]='thirst'; const c=G3.gearMods(sv); assert.strictEqual(c.stats.con,-2); assert(c.hp<m.hp,'−2 CON lowers max HP');
  assert(/Strength/.test(G3.gearText(sv,id)),'piece text names the stat');
  assert.strictEqual(CH.statOf(sv.char,'str',c.stats),12); assert.strictEqual(CH.statOf(sv.char,'str'),10,'spending ignores gear');
});
t('three save slots, slot 1 keeps the original save key', ()=>{
  const C2=require('./collection.js'); assert.strictEqual(C2.SAVE_SLOTS,3); assert.strictEqual(C2.slotKey(1),C2.SAVE_KEY);
  assert.strictEqual(new Set([1,2,3].map(C2.slotKey)).size,3);
});
t('save points keep shared objects, maps, sets and typed arrays', ()=>{
  const SP=require('./savepoint.js'); const prop={kind:'lever',on:false}, a={props:[prop], at:new Map([[5,prop]]), seen:new Uint8Array([0,1,1]), safe:new Set([3]), mesh:{isObject3D:true}, fn(){}, n:Infinity};
  a.self=a; const b=SP.snapDecode(JSON.parse(JSON.stringify(SP.snapEncode(a))));
  assert.strictEqual(b.at.get(5),b.props[0],'same object in the list and the map'); assert(b.seen instanceof Uint8Array&&b.seen[2]===1);
  assert(b.safe.has(3)); assert.strictEqual(b.self,b); assert.strictEqual(b.mesh,undefined); assert.strictEqual(b.fn,undefined); assert.strictEqual(b.n,Infinity);
});
