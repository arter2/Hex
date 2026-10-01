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
t('runes: queued cards must share a rune or a name; wild fits any; recipe steps are allowed', ()=>{
  const C=id=>D.CARDS[id];
  assert(E.runesFit([C('cinder_lance'),C('ember_wall'),C('frost_ward')]),'all rune A');
  assert(!E.runesFit([C('cinder_lance'),C('brazier')]),'A and C');
  assert(E.runesFit([C('ember_dart'),C('ember_dart')]),'same name');
  const wild=D.CARD_LIST.find(c=>c.code==='✱'&&c.rarity!=='hero'); assert(E.runesFit([C('cinder_lance'),wild]));
  const r=D.RECIPES[0]; assert(E.runesFit(r.cards.slice(0,2).map(C))&&new Set(r.cards.slice(0,2).map(id=>C(id).code)).size>1,'a recipe step ignores runes');
  const p=stacked(['cinder_lance','brazier','ember_wall','spark','ice_shard','holy_bolt','mend']); E.openCustom(p);
  assert(E.toggleQueue(p,p.hand[0].uid)); assert(!E.toggleQueue(p,p.hand[0].uid),'brazier is rune C'); assert(E.toggleQueue(p,p.hand[1].uid),'ember_wall is rune A');
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
  cb=E.detectCombos([I('ember_dart',1),I('cinder_lance',2),I('flame_fan',3)]); assert(cb.some(c=>c.kind==='flush'),'three fire strikes');
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
  assert(!E.placeCard(p,e,'queue',0),'a rune B card cannot swap into a rune A queue');
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
    assert.strictEqual(n,1); kinds[r.cards.length?'card':r.gold?'gold':'item']++; r.items.forEach(id=>assert(C.GEAR[id])); }
  assert(kinds.card>1400&&kinds.gold>700&&kinds.item>300,JSON.stringify(kinds));
  const b=C.battleRewards(['fire'],4,true,rng); assert(b.cards.length+(b.gold?1:0)+b.items.length>=4);
});
t('gear: weapons and armor, one of each equipped, duplicates become gold, tiers by depth', ()=>{
  const s=C.newSave(D.STARTERS[0]); assert.strictEqual(C.itemCount(s),0);
  assert.strictEqual(C.addGear(s,'oak_wand'),0); assert.strictEqual(s.gear.weapon,'oak_wand','the first weapon equips itself');
  C.addGear(s,'storm_scepter'); assert.strictEqual(s.gear.weapon,'oak_wand'); const g0=s.gold; assert.strictEqual(C.addGear(s,'oak_wand'),50); assert.strictEqual(s.gold,g0+50);
  C.addGear(s,'iron_mail'); s.gear.weapon='storm_scepter'; const m=C.gearMods(s); assert.strictEqual(m.tap,2); assert.strictEqual(m.charged,4); assert.strictEqual(m.guard,.1); assert.strictEqual(m.hp,10);
  for(let i=0;i<200;i++){ assert(C.GEAR[C.rollGear(1,rng)].tier<=1); assert(C.GEAR[C.rollGear(9,rng)].tier>=2); }
  assert(Object.values(C.GEAR).every(g=>C.gearText(g).length>5));
});
t('potions are gray cards, and potions in an old save become those cards', ()=>{
  assert.strictEqual(D.POTIONS.length,4); D.POTIONS.forEach(c=>{ assert(D.CARDS[c.id]); assert.strictEqual(c.color,'gray'); assert(D.cardText(c).length>5); });
  const s=C.newSave(D.STARTERS[0]); s.items={draught:2,wind:1};
  global.localStorage={getItem:()=>JSON.stringify(s)}; const m=C.loadSave(); delete global.localStorage;
  assert.strictEqual(m.owned.potion_heal,2); assert.strictEqual(m.owned.potion_wind,1); assert.deepStrictEqual(m.items,{});
});
