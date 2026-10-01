/* Hexmancers deck prototype — the collecting loop: card drops, packs, auto-fill and the save. */

// Card ids come from the templates; when they change, older saves start over (v4: 1,000 cards, ranks 1-12 everywhere).
const SAVE_KEY='hexmancers-deck-v4';
const DECK_SLOTS=5;
const PACK_PRICE={booster:100, family:150};

function copyLimit(c){ return c.rarity==='legendary'||c.rarity==='hero'?RULES.legendaryCopies:RULES.copies; }

// Deeper fights shift drops toward rare and legendary.
function rarityWeights(depth){
  return {common:Math.max(25,60-2*depth), uncommon:28+depth, rare:10+1.5*depth, legendary:2+.5*depth};
}
function rollRarity(depth,rng,min){
  rng=rng||Math.random;
  const order=['common','uncommon','rare','legendary'], w=rarityWeights(depth);
  const pool=order.slice(order.indexOf(min||'common'));
  let x=rng()*pool.reduce((a,r)=>a+w[r],0);
  for(const r of pool){ x-=w[r]; if(x<=0) return r; }
  return pool[pool.length-1];
}
function rollCard(opts,rng){
  rng=rng||Math.random; opts=opts||{};
  const rarity=rollRarity(opts.depth||1,rng,opts.min);
  const pool=CARD_LIST.filter(c=>c.rarity===rarity&&(!opts.color||c.color===opts.color));
  return pool[Math.floor(rng()*pool.length)];
}
// Heroes are the rarest find: a boss drops one 4% of the time at depth 1, up to 15% deep down,
// and a pack holds one 1 time in 100. You get a hero you don't own yet when there is one.
const heroChance=depth=>Math.min(.15,.03+.012*depth);
function rollHero(rng,owned){ const fresh=HEROES.filter(h=>!(owned&&owned[h.id])), pool=fresh.length?fresh:HEROES; return pool[Math.floor(rng()*pool.length)]; }
/* Gear: weapon and armor upgrades for your wizard. You own each piece once, equip one weapon
   and one armor at camp, and it changes every fight. Better tiers drop deeper down; a piece you
   already own turns into gold. Weapon mods: tap / charged wand damage added, cd = time between
   shots (x), charge = time to charge (x). Armor mods: hp = max HP added, guard = share of damage
   taken off, shield = a shield at the start of each fight. */
const GEAR={
  oak_wand:      {slot:'weapon', tier:1, name:'Oak Wand',          icon:'🪄', mods:{tap:1, charged:2}},
  quick_wand:    {slot:'weapon', tier:1, name:'Quick Wand',        icon:'🪄', mods:{cd:.8}},
  focus_rod:     {slot:'weapon', tier:2, name:'Focus Rod',         icon:'🔮', mods:{charge:.65, charged:3}},
  storm_scepter: {slot:'weapon', tier:2, name:'Storm Scepter',     icon:'⚡', mods:{tap:2, charged:4}},
  archmage_staff:{slot:'weapon', tier:3, name:"Archmage's Staff",  icon:'✨', mods:{tap:3, charged:6, cd:.85}},
  padded_robe:   {slot:'armor',  tier:1, name:'Padded Robe',       icon:'👘', mods:{hp:20}},
  warded_cloak:  {slot:'armor',  tier:1, name:'Warded Cloak',      icon:'🧥', mods:{shield:30}},
  iron_mail:     {slot:'armor',  tier:2, name:'Iron Mail',         icon:'🛡', mods:{guard:.1, hp:10}},
  runed_vest:    {slot:'armor',  tier:2, name:'Runed Vestments',   icon:'🥋', mods:{hp:30, shield:20}},
  dragonscale:   {slot:'armor',  tier:3, name:'Dragonscale Coat',  icon:'🐉', mods:{hp:50, guard:.15}},
};
function gearText(g){ const m=g.mods, t=[];
  if(m.tap) t.push('wand +'+m.tap); if(m.charged) t.push('charged shot +'+m.charged); if(m.cd) t.push('fires '+Math.round((1/m.cd-1)*100)+'% faster');
  if(m.charge) t.push('charges '+Math.round((1-m.charge)*100)+'% faster'); if(m.hp) t.push('+'+m.hp+' max HP'); if(m.guard) t.push('take '+Math.round(m.guard*100)+'% less damage');
  if(m.shield) t.push('start each fight with a '+m.shield+' shield'); return t.join(', '); }
// the combined mods of what you have equipped
function gearMods(save){ const out={tap:0,charged:0,cd:1,charge:1,hp:0,guard:0,shield:0};
  for(const id of Object.values(save.gear||{})){ const g=GEAR[id]; if(!g) continue; for(const k in g.mods) if(k==='cd'||k==='charge') out[k]*=g.mods[k]; else out[k]+=g.mods[k]; }
  return out; }
// a gear drop: tier 1 at first, tier 2 from depth 4, tier 3 from depth 8 (a boss rolls one tier up)
function rollGear(depth,rng,boss){ const top=Math.min(3,1+Math.floor(depth/4)+(boss?1:0));
  const tier=rng()<.6?top:Math.max(1,top-1), pool=Object.keys(GEAR).filter(id=>GEAR[id].tier===tier); return pool[Math.floor(rng()*pool.length)]; }
// Returns how much gold a duplicate was worth (0 for a new piece).
function addGear(save,id){ save.items=save.items||{}; if(save.items[id]) { const g=50*GEAR[id].tier; save.gold+=g; return g; }
  save.items[id]=1; save.gear=save.gear||{}; if(!save.gear[GEAR[id].slot]) save.gear[GEAR[id].slot]=id; return 0; }
function itemCount(save){ return Object.keys(save.items||{}).filter(id=>GEAR[id]).length; }

/* Rewards. A normal fight gives exactly one thing: a card (55%, half the time in the color of
   a monster you beat), a pile of gold (30%) or a piece of gear (15%). A boss gives more: gold, a
   rare or better card, another card, a piece of gear, and sometimes a hero.
   Returns {cards:[], gold, items:[]}. */
function battleGold(depth,boss){ return boss?60+20*depth:40+15*depth; }
function battleRewards(enemyColors,depth,boss,rng,owned){
  rng=rng||Math.random;
  const color=()=>rng()<.5&&enemyColors.length?enemyColors[Math.floor(rng()*enemyColors.length)]:null;
  const item=()=>rollGear(depth,rng,boss);
  if(boss){ const r={cards:[rollCard({depth,min:'rare'},rng),rollCard({depth,color:color()},rng)], gold:battleGold(depth,true), items:[item()]};
    if(rng()<heroChance(depth)) r.cards.push(rollHero(rng,owned));
    return r; }
  const x=rng();
  if(x<.55) return {cards:[rollCard({depth,color:color()},rng)], gold:0, items:[]};
  if(x<.85) return {cards:[], gold:battleGold(depth,false), items:[]};
  return {cards:[], gold:0, items:[item()]};
}
// Five cards; the last is uncommon or better.
function openPack(depth,color,rng){
  rng=rng||Math.random;
  const out=[]; for(let i=0;i<5;i++) out.push(rollCard({depth,color,min:i===4?'uncommon':null},rng));
  if(rng()<.01){ const h=rollHero(rng); if(!color||h.color===color) out[4]=h; }
  return out;
}

// Fill a deck to 60 from the collection, favoring the deck's own colors, then rarity and rank.
function autoFill(list,owned,size){
  size=size||RULES.max;
  const counts={}; list.forEach(id=>counts[id]=(counts[id]||0)+1);
  const colorN={}; list.forEach(id=>{ const c=CARDS[id]; if(!COLORS[c.color].neutral) colorN[c.color]=(colorN[c.color]||0)+1; });
  let main=Object.keys(colorN).sort((a,b)=>colorN[b]-colorN[a]).slice(0,2);
  if(main.length<2){ // pick the colors you own the most of
    const own={}; for(const id in owned){ const c=CARDS[id]; if(c&&!COLORS[c.color].neutral) own[c.color]=(own[c.color]||0)+owned[id]; }
    main=main.concat(Object.keys(own).filter(k=>!main.includes(k)).sort((a,b)=>own[b]-own[a])).slice(0,2);
  }
  const rv={hero:5,legendary:4,rare:3,uncommon:2,common:1};
  const score=c=>(main.includes(c.color)?100:COLORS[c.color].neutral?50:0)+rv[c.rarity]*10+c.rank;
  const cands=Object.keys(owned).filter(id=>CARDS[id]).map(id=>CARDS[id]).sort((a,b)=>score(b)-score(a));
  const out=list.slice();
  let hero=out.some(id=>CARDS[id].rarity==='hero');
  for(const c of cands){
    if(c.rarity==='hero'){ if(hero) continue; hero=true; }
    while(out.length<size&&(counts[c.id]||0)<Math.min(copyLimit(c),owned[c.id])){ out.push(c.id); counts[c.id]=(counts[c.id]||0)+1; }
    if(out.length>=size) break;
  }
  return out;
}

function newSave(starter){
  const list=starterList(starter.colors), owned={};
  list.forEach(id=>owned[id]=(owned[id]||0)+1);
  const decks=[{name:starter.name, list}]; for(let i=1;i<DECK_SLOTS;i++) decks.push({name:'Deck '+(i+1), list:[]});
  return {v:1, gold:100, depth:1, deepest:1, owned, seen:Object.assign({},owned), decks, active:0, wins:0, items:{}, gear:{}};
}
function addCards(save,cards){ return cards.map(c=>{ const isNew=!save.owned[c.id]; save.owned[c.id]=(save.owned[c.id]||0)+1; save.seen[c.id]=1; return {card:c,isNew}; }); }
function ownedUnique(save){ return Object.keys(save.owned).filter(id=>CARDS[id]&&save.owned[id]>0).length; }

/* Charge cards wear out across battles: each owned copy keeps its remaining uses in
   save.charge[id] (one number per copy). The k-th copy of a card in a deck list is the
   k-th owned copy. A copy that reaches 0 burns up and leaves the collection. */
function copyIndexes(list){ const seen={}; return list.map(id=>seen[id]=(seen[id]||0)+1).map(n=>n-1); }
function chargeLeft(save,id,k){ const a=save.charge&&save.charge[id]; return a&&a[k]!=null?a[k]:CARDS[id].uses; }
// Before a fight: every charge instance starts with its copy's remaining uses.
function assignChargeUses(save,piles,list){
  const ks=copyIndexes(list);
  for(const inst of piles.draw) if(inst.card.uses){ const i=inst.uid-1; inst.copy=ks[i]; inst.left=chargeLeft(save,inst.card.id,ks[i]); }
}
// After a fight (won, lost or retreated): store what is left and burn up spent copies.
function settleChargeUses(save,piles){
  save.charge=save.charge||{};
  const all=[...piles.draw,...piles.hand,...piles.queue,...piles.discard].filter(c=>c.card.uses&&!c.temp);
  for(const inst of all){ const id=inst.card.id, a=save.charge[id]=save.charge[id]||[];
    while(a.length<=inst.copy) a.push(inst.card.uses); a[inst.copy]=inst.left==null?inst.card.uses:inst.left; }
  const burned=[];
  for(const id in save.charge){ const a=save.charge[id], n=a.filter(v=>v<=0).length; if(!n) continue;
    save.charge[id]=a.filter(v=>v>0); save.owned[id]=Math.max(0,(save.owned[id]||0)-n); if(!save.owned[id]) delete save.owned[id];
    for(const d of save.decks){ while(d.list.filter(x=>x===id).length>(save.owned[id]||0)) d.list.splice(d.list.lastIndexOf(id),1); }
    burned.push({card:CARDS[id],n}); }
  return burned;
}

function loadSave(){
  try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s&&s.v===1) return migrate(s); }catch(e){}
  return null;
}
// Potions used to be items; they are cards now.
const OLD_POTIONS={draught:'potion_heal', tonic:'potion_tonic', elixir:'potion_elixir', wind:'potion_wind'};
function migrate(s){ s.items=s.items||{}; s.gear=s.gear||{};
  for(const k in OLD_POTIONS) if(s.items[k]){ const id=OLD_POTIONS[k]; s.owned[id]=(s.owned[id]||0)+s.items[k]; s.seen[id]=1; delete s.items[k]; }
  return s; }
function writeSave(s){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(s)); }catch(e){} }
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

if(typeof module!=='undefined') module.exports={GEAR,gearText,gearMods,rollGear,addGear,itemCount,loadSave,battleRewards,heroChance,rollHero,assignChargeUses,settleChargeUses,chargeLeft,SAVE_KEY,DECK_SLOTS,PACK_PRICE,copyLimit,rarityWeights,rollRarity,rollCard,battleGold,openPack,autoFill,newSave,addCards,ownedUnique};
