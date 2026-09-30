/* Hexmancers deck prototype — the collecting loop: card drops, packs, auto-fill and the save. */

// v2: Arcane set aside for Light, so card ids changed and older saves start over.
const SAVE_KEY='hexmancers-deck-v2';
const DECK_SLOTS=5;
const PACK_PRICE={booster:100, family:150};

function copyLimit(c){ return c.rarity==='legendary'?RULES.legendaryCopies:RULES.copies; }

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
// Each monster drops a card, half the time from its own color; a boss adds a rare or better.
function battleDrops(enemyColors,depth,boss,rng){
  rng=rng||Math.random;
  const drops=enemyColors.map(col=>rollCard({depth,color:rng()<.5?col:null},rng));
  if(boss) drops.push(rollCard({depth,min:'rare'},rng));
  return drops;
}
function battleGold(depth,boss){ return 15+8*depth+(boss?40:0); }
// Five cards; the last is uncommon or better.
function openPack(depth,color,rng){
  const out=[]; for(let i=0;i<5;i++) out.push(rollCard({depth,color,min:i===4?'uncommon':null},rng));
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
  const rv={legendary:4,rare:3,uncommon:2,common:1};
  const score=c=>(main.includes(c.color)?100:COLORS[c.color].neutral?50:0)+rv[c.rarity]*10+c.rank;
  const cands=Object.keys(owned).filter(id=>CARDS[id]).map(id=>CARDS[id]).sort((a,b)=>score(b)-score(a));
  const out=list.slice();
  for(const c of cands){
    while(out.length<size&&(counts[c.id]||0)<Math.min(copyLimit(c),owned[c.id])){ out.push(c.id); counts[c.id]=(counts[c.id]||0)+1; }
    if(out.length>=size) break;
  }
  return out;
}

function newSave(starter){
  const list=starterList(starter.colors), owned={};
  list.forEach(id=>owned[id]=(owned[id]||0)+1);
  const decks=[{name:starter.name, list}]; for(let i=1;i<DECK_SLOTS;i++) decks.push({name:'Deck '+(i+1), list:[]});
  return {v:1, gold:100, depth:1, deepest:1, owned, seen:Object.assign({},owned), decks, active:0, wins:0};
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
  try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s&&s.v===1) return s; }catch(e){}
  return null;
}
function writeSave(s){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(s)); }catch(e){} }
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

if(typeof module!=='undefined') module.exports={assignChargeUses,settleChargeUses,chargeLeft,SAVE_KEY,DECK_SLOTS,PACK_PRICE,copyLimit,rarityWeights,rollRarity,rollCard,battleDrops,battleGold,openPack,autoFill,newSave,addCards,ownedUnique};
