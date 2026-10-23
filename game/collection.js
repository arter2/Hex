/* Hexmancers deck prototype — the collecting loop: card drops, packs, auto-fill and the save. */

// Card ids come from the templates; when they change, older saves start over (v4: 1,000 cards, ranks 1-12 everywhere).
const SAVE_KEY='hexmancers-deck-v4';
const DECK_SLOTS=5;
const PACK_PRICE={booster:90, family:130};   // 3 cards a pack, at depth 0
// packs cost more the deeper you have been (and hold better cards): about 1.5 fights' gold for a booster, 2 for a family pack
const PACK_STEP={booster:15, family:20};
function packPrice(fam,deepest){ const d=Math.max(1,deepest||1), k=fam?'family':'booster'; return PACK_PRICE[k]+PACK_STEP[k]*d; }

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
/* Gear (weapons, armor, scrolls) lives in gear.js. */

/* Rewards. A normal fight gives exactly one thing: a card (70%, half the time in the color of
   a monster you beat), a pile of gold (20%) or loot (10%: gear or a scroll, see gear.js). A boss gives more:
   gold, a rare or better card, another card, loot, and sometimes a hero.
   Returns {cards:[], gold, items:[]}. */
// gold grows with depth up to 20, then slowly (deep runs were buying 80+ packs)
function battleGold(depth,boss){ const d=Math.min(depth,20)+.35*Math.max(0,depth-20); return Math.round(boss?60+20*d:40+15*d); }
function battleRewards(enemyColors,depth,boss,rng,owned){
  rng=rng||Math.random;
  const color=()=>rng()<.5&&enemyColors.length?enemyColors[Math.floor(rng()*enemyColors.length)]:null;
  const item=()=>rollLoot(depth,rng,boss);
  if(boss){ const r={cards:[rollCard({depth,min:'rare'},rng),rollCard({depth,color:color()},rng)], gold:battleGold(depth,true), items:[item()]};
    if(rng()<heroChance(depth)) r.cards.push(rollHero(rng,owned));
    return r; }
  const x=rng();
  if(x<.7) return {cards:[rollCard({depth,color:color()},rng)], gold:0, items:[]};
  if(x<.9) return {cards:[], gold:battleGold(depth,false), items:[]};
  return {cards:[], gold:0, items:[item()]};
}
// Five cards; the last is uncommon or better.
// A pack is 3 cards, each rolled on its own (no slot is promised a rarity), so every pack is a real
// gamble; very rarely one of them is a hero.
const PACK_SIZE=3;
function openPack(depth,color,rng){
  rng=rng||Math.random;
  const out=[]; for(let i=0;i<PACK_SIZE;i++) out.push(rollCard({depth,color},rng));
  if(rng()<.01){ const h=rollHero(rng); if(!color||h.color===color) out[Math.floor(rng()*PACK_SIZE)]=h; }
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

/* Heroes are summoned by their card. Every hexmancer owns the six first heroes (one per color),
   and a starter deck carries the hero of its first color. */
const STARTER_HEROES=['hero_pyra','hero_ysolde','hero_volta','hero_thorn','hero_aurel','hero_widow'];
const heroOfColor=col=>STARTER_HEROES.find(id=>CARDS[id]&&CARDS[id].color===col);
function giveStarterHeroes(s){ for(const id of STARTER_HEROES) if(CARDS[id]&&!s.owned[id]){ s.owned[id]=1; s.seen[id]=1; } }
// put a hero card into a deck that has none, dropping one copy of its most-copied low card if the deck is full
function addHeroToDeck(list,id){ if(!id||list.some(x=>CARDS[x]&&CARDS[x].rarity==='hero')) return;
  if(list.length>=RULES.max){ const n={}; list.forEach(x=>n[x]=(n[x]||0)+1);
    const cut=Object.keys(n).filter(x=>CARDS[x]&&CARDS[x].rarity!=='legendary'&&n[x]>1).sort((x,y)=>n[y]-n[x]||CARDS[x].rank-CARDS[y].rank)[0];
    if(!cut) return; list.splice(list.lastIndexOf(cut),1); }
  list.push(id); }
/* A new character's cards: 80 dealt at random, leaning to one of the six colors (STARTER_DEAL).
   About 32 of that color, 8 Gray, 8 Brown and the rest from 2 or 3 other colors; about 64 commons,
   12 uncommons and 4 rares, all rank 1-6. The lean color's cards favor one "home" rune, so a few
   Flushes and Straights are there to find. The 60-card first deck is built from them (startDeck).
   (The premade starter decks, STARTERS in cards.js, are kept for later: newSave still takes one.) */
const STARTER_DEAL={size:80, lean:32, gray:8, brown:8, rare:4, uncommon:12, maxRank:6, homeRune:3};
function dealStart(lean,rng){ rng=rng||Math.random; const D=STARTER_DEAL;
  const pk=a=>a[Math.floor(rng()*a.length)], shuf=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const pool=CARD_LIST.filter(c=>c.rank<=D.maxRank&&['common','uncommon','rare'].includes(c.rarity)&&!c.brood&&!c.recipe&&!c.mastery&&c.type!=='claim');
  // how many cards of each color: the lean, the two neutrals, and 2-3 others sharing the rest
  const others=shuf(SIX.filter(k=>k!==lean)).slice(0,rng()<.5?2:3), rest=D.size-D.lean-D.gray-D.brown, by={[lean]:D.lean, gray:D.gray, brown:D.brown};
  const w=others.map(()=>.6+rng()), ws=w.reduce((a,b)=>a+b,0); let left=rest;
  others.forEach((k,i)=>{ const n=i===others.length-1?left:Math.round(rest*w[i]/ws); by[k]=n; left-=n; });
  // rarity: half the rares and a third of the uncommons go to the lean color, the rest anywhere
  const slots=[]; for(const k in by) for(let i=0;i<by[k];i++) slots.push({color:k, rarity:'common'});
  const give=(r,n,pref)=>{ let k=0; for(const sl of shuf(slots.slice())){ if(k>=n) break; if(sl.rarity!=='common'||(pref&&sl.color!==pref)) continue; sl.rarity=r; k++; } return k; };
  give('rare',D.rare-give('rare',Math.ceil(D.rare/2),lean)); give('uncommon',D.uncommon-give('uncommon',Math.ceil(D.uncommon/3),lean));
  const home=pk(RUNES), out=[];
  const groups={}; slots.forEach(sl=>{ const g=sl.color+'|'+sl.rarity; groups[g]=(groups[g]||0)+1; });
  for(const g in groups){ const [col,rar]=g.split('|'); let n=groups[g];
    // the lean color's home rune is a few times likelier, so Flushes and Straights can form
    const cand=pool.filter(c=>c.color===col&&c.rarity===rar).map(c=>({c, k:rng()*(col===lean&&c.code===home?D.homeRune:1)})).sort((a,b)=>b.k-a.k).map(x=>x.c);
    let i=0; while(n>0&&cand.length){ const c=cand[i%cand.length]; i++;
      const have=out.filter(x=>x===c.id).length, cap=Math.min(copyLimit(c), rar==='common'?3:rar==='uncommon'?2:1)-have; if(cap<=0){ if(i>cand.length*4) break; continue; }
      const k=Math.min(n,cap,1+Math.floor(rng()*cap)); for(let j=0;j<k;j++) out.push(c.id); n-=k; } }
  return {lean, home, list:out}; }
// the first deck: every card of the lean color and the neutrals, then the biggest other colors, to 60 with the hero
function startDeck(ids,lean){ const n={}; ids.forEach(id=>{ const k=CARDS[id].color; n[k]=(n[k]||0)+1; });
  const rank=k=>k===lean?0:k==='gray'||k==='brown'?1:2+1/(1+n[k]);
  const list=ids.slice().sort((a,b)=>rank(CARDS[a].color)-rank(CARDS[b].color)||CARDS[a].rank-CARDS[b].rank).slice(0,RULES.max-1);
  list.push(heroOfColor(lean)); return list; }
function newSave(starter){
  if(starter&&starter.lean) return newDealtSave(starter.lean,starter.rng);
  const list=starterList(starter.colors,60,starter.recipe), owned={};
  addHeroToDeck(list,heroOfColor(starter.colors[0]));
  list.forEach(id=>owned[id]=(owned[id]||0)+1);
  const decks=[{name:starter.name, list}]; for(let i=1;i<DECK_SLOTS;i++) decks.push({name:'Deck '+(i+1), list:[]});
  const sv={v:1, gold:100, depth:1, deepest:1, owned, seen:Object.assign({},owned), decks, active:0, wins:0, items:{basic_wand:1}, gear:{weapon:'basic_wand'}, worn:{basic_wand:1}, heroCards:1};
  giveStarterHeroes(sv); return sv;
}
function newDealtSave(lean,rng){
  const deal=dealStart(lean,rng), owned={}; deal.list.forEach(id=>owned[id]=(owned[id]||0)+1);
  const list=startDeck(deal.list,lean), decks=[{name:COLORS[lean].name+' deck', list}];
  for(let i=1;i<DECK_SLOTS;i++) decks.push({name:'Deck '+(i+1), list:[]});
  const sv={v:1, gold:100, depth:1, deepest:1, owned, seen:Object.assign({},owned), decks, active:0, wins:0, items:{basic_wand:1}, gear:{weapon:'basic_wand'}, worn:{basic_wand:1}, heroCards:1, lean, homeRune:deal.home};
  giveStarterHeroes(sv); return sv; }
/* Shards. Break a spare card (one that no deck needs) for shards, and spend shards to craft any
   card you have seen. Breaking is always your choice; nothing turns to shards on its own.
   Heroes and recipe cards can't be broken or crafted. [break for, craft for] */
const SHARDS={common:[5,20], uncommon:[15,60], rare:[40,160], legendary:[150,600]};
const shardOf=c=>c&&!c.recipe&&!c.mastery&&SHARDS[c.rarity]||null;
const deckKeeps=(save,id)=>Math.max(0,...(save.decks||[]).map(d=>(d.list||[]).filter(x=>x===id).length));
const spareCopies=(save,id)=>Math.max(0,(save.owned[id]||0)-deckKeeps(save,id));
const canBreak=(save,c)=>!!shardOf(c)&&spareCopies(save,c.id)>0;
// you can craft a card you have seen, up to the copies a deck can hold
const craftRoom=(save,c)=>!!shardOf(c)&&!!save.seen[c.id]&&(save.owned[c.id]||0)<copyLimit(c);
const canCraft=(save,c)=>craftRoom(save,c)&&(save.shards||0)>=shardOf(c)[1];
function breakCard(save,id){ const c=CARDS[id]; if(!canBreak(save,c)) return 0;
  save.owned[id]--; if(save.owned[id]<=0) delete save.owned[id];
  const a=save.charge&&save.charge[id]; if(a&&a.length>(save.owned[id]||0)) a.length=save.owned[id]||0;
  const n=shardOf(c)[0]; save.shards=(save.shards||0)+n; return n; }
function craftCard(save,id){ const c=CARDS[id]; if(!canCraft(save,c)) return null;
  save.shards-=shardOf(c)[1]; return addCards(save,[c])[0]; }
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

/* Three save slots. Slot 1 keeps the original key, so a save from before slots is slot 1.
   SAVE_SLOT is the slot in use; the choice is remembered in this browser. */
const SAVE_SLOTS=3, SLOT_KEY='hexmancers-slot';
const slotKey=n=>n===1?SAVE_KEY:SAVE_KEY+'-slot'+n;
let SAVE_SLOT=1; try{ const n=+localStorage.getItem(SLOT_KEY); if(n>=1&&n<=SAVE_SLOTS) SAVE_SLOT=n; }catch(e){}
function setSlot(n){ SAVE_SLOT=n; try{ localStorage.setItem(SLOT_KEY,String(n)); }catch(e){} }
// a save that will not read is kept aside (never overwritten by a new game), and the game says so
let SAVE_DAMAGED=null;
function loadSave(n){ const k=slotKey(n||SAVE_SLOT); let raw=null;
  try{ raw=localStorage.getItem(k); const s=JSON.parse(raw||'null'); if(s&&s.v===1) return migrate(s); }
  catch(e){ if(raw){ const bk=k+'-damaged-'+Date.now(); try{ localStorage.setItem(bk,raw); localStorage.removeItem(k); }catch(e2){} SAVE_DAMAGED={slot:n||SAVE_SLOT, key:bk}; } }
  return null;
}
// Potions used to be items; they are cards now.
const OLD_POTIONS={draught:'potion_heal', tonic:'potion_tonic', elixir:'potion_elixir', wind:'potion_wind'};
function migrate(s){ s.items=s.items||{}; s.gear=s.gear||{}; if(typeof ensureStarterGear==='function') ensureStarterGear(s);
  for(const k in OLD_POTIONS) if(s.items[k]){ const id=OLD_POTIONS[k]; s.owned[id]=(s.owned[id]||0)+s.items[k]; s.seen[id]=1; delete s.items[k]; }
  // the Soul used to stand beside every fight: now its hero is a card in the deck
  if(!s.heroCards){ s.heroCards=1; giveStarterHeroes(s);
    for(const d of s.decks||[]) if(d.list&&d.list.length){ let id=d.soul&&s.owned[d.soul]?d.soul:null;
      if(!id){ const n={}; d.list.forEach(x=>{ const c=CARDS[x]; if(c&&SIX.includes(c.color)) n[c.color]=(n[c.color]||0)+1; }); id=heroOfColor(Object.keys(n).sort((a,b)=>n[b]-n[a])[0]); }
      addHeroToDeck(d.list,id); delete d.soul; } }
  return s; }
// SAVE_STALE: another tab saved this slot since; saving here would undo it, so this tab stops saving
let SAVE_STALE=false, SAVE_FAILT=0;
function writeSave(s){ if(SAVE_STALE){ if(typeof saveStaleNote==='function') saveStaleNote(); return; }
  try{ localStorage.setItem(slotKey(SAVE_SLOT),JSON.stringify(s)); }
  catch(e){ const now=Date.now(); if(now-SAVE_FAILT>20000&&typeof tip==='function'){ SAVE_FAILT=now; tip('Could not save: this browser\'s storage is full or blocked. Your progress since the last save may be lost.',6000); } } }
function clearSave(n){ try{ localStorage.removeItem(slotKey(n||SAVE_SLOT)); }catch(e){} }

if(typeof module!=='undefined') module.exports={SHARDS,shardOf,spareCopies,canBreak,canCraft,craftRoom,breakCard,craftCard,PACK_SIZE,packPrice,loadSave,SAVE_SLOTS,slotKey,setSlot,battleRewards,heroChance,rollHero,assignChargeUses,settleChargeUses,chargeLeft,SAVE_KEY,DECK_SLOTS,PACK_PRICE,copyLimit,rarityWeights,rollRarity,rollCard,battleGold,openPack,autoFill,newSave,addCards,ownedUnique};
