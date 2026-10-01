/* Hexmancers deck prototype — gear: your wizard's weapon (a wand or staff) and armor.

   - Every piece is owned in copies. Merging two copies upgrades the piece one level (+1 to +3).
   - A scroll of enchanting adds one enchantment to a piece; a scroll of purifying lifts a curse.
     Both drop as loot and sell in the shop (later: found and bought while exploring).
   - Legendary pieces are rare finds, mostly from bosses.
   - Cursed pieces hide under a plain name until you put them on. Then they show their true name
     and stick: you can't take them off until the curse is broken, either with a scroll of
     purifying or by sacrificing 3 cards of the curse's rune. A broken curse also loses its
     drawback, so a cursed piece you were brave enough to keep can end up the best you own.
   - A wand of an element shoots in that color (weak-color damage counts) and its charged shot
     carries that element's effect.

   Mods: tap / charged = wand damage added (the basic wand is 3 and 7), cd = time between shots
   (x), charge = time to charge (x), color = the wand's element, chill / zap / drain / glow /
   burn = what the charged shot (zap: every shot) adds, hp = max HP, guard = share of each hit
   taken off, shield = shield at the start of a fight, surge = chance each turn to open the 4th
   slot. Curses: hpPerShot = HP each wand shot costs, slow = slower moving (x), gauge = Custom
   gauge speed (x), hurt = extra damage taken (x), misfire = chance a shot fizzles. */

const GEAR={
  // wands and staffs
  broken_wand:   {slot:'weapon', tier:0, name:'Broken Wand',          icon:'🥢', mods:{tap:-1, charged:-3, misfire:.15}, text:'Splintered and unreliable'},
  basic_wand:    {slot:'weapon', tier:1, name:'Basic Wand',           icon:'🪄', mods:{}, text:'Where every wizard starts'},
  oak_wand:      {slot:'weapon', tier:1, name:'Oak Wand',             icon:'🪄', mods:{tap:1, charged:2}},
  quick_wand:    {slot:'weapon', tier:1, name:'Quick Wand',           icon:'🪄', mods:{cd:.8}},
  ice_wand:      {slot:'weapon', tier:2, name:'Thin Wand of Ice',     icon:'❄', mods:{color:'frost', chill:.8}, text:'Charged shots freeze'},
  volt_wand:     {slot:'weapon', tier:2, name:'Wand of Electricity',  icon:'⚡', mods:{color:'storm', tap:-1, cd:.7, zap:.25}, text:'Fast; every shot may stun'},
  dark_wand:     {slot:'weapon', tier:2, name:'Wand of Darkness',     icon:'☾', mods:{color:'shadow', charged:1, drain:.3}, text:'Shots drain life'},
  light_wand:    {slot:'weapon', tier:2, name:'Wand of Light',        icon:'☀', mods:{color:'light', glow:5}, text:'Charged shots heal you'},
  focus_rod:     {slot:'weapon', tier:2, name:'Focus Rod',            icon:'🔮', mods:{charge:.65, charged:3}},
  storm_scepter: {slot:'weapon', tier:2, name:'Storm Scepter',        icon:'⚡', mods:{tap:2, charged:4}},
  archmage_staff:{slot:'weapon', tier:3, name:"Archmage's Staff",     icon:'✨', mods:{tap:3, charged:6, cd:.85}},
  rune_staff:    {slot:'weapon', tier:3, name:'Runecarved Staff',     icon:'ᚱ', mods:{tap:2, charged:4, surge:.2}},
  // armor
  padded_robe:   {slot:'armor',  tier:1, name:'Padded Robe',          icon:'👘', mods:{hp:20}},
  warded_cloak:  {slot:'armor',  tier:1, name:'Warded Cloak',         icon:'🧥', mods:{shield:30}},
  iron_mail:     {slot:'armor',  tier:2, name:'Iron Mail',            icon:'🛡', mods:{guard:.1, hp:10}},
  runed_vest:    {slot:'armor',  tier:2, name:'Runed Vestments',      icon:'🥋', mods:{hp:30, shield:20}},
  dragonscale:   {slot:'armor',  tier:3, name:'Dragonscale Coat',     icon:'🐉', mods:{hp:50, guard:.15}},
  // legendary
  first_flame:   {slot:'weapon', tier:4, legendary:true, name:'Staff of the First Flame', icon:'🔥', mods:{color:'fire', tap:4, charged:10, burn:3, cd:.85}, text:'Every shot sets enemies burning'},
  frostfang:     {slot:'weapon', tier:4, legendary:true, name:'Frostfang Scepter',        icon:'❄', mods:{color:'frost', tap:3, charged:9, chill:1.5, charge:.6}},
  dawn_aegis:    {slot:'armor',  tier:4, legendary:true, name:'Aegis of Dawn',            icon:'🌅', mods:{hp:60, shield:40, guard:.1}},
  night_shroud:  {slot:'armor',  tier:4, legendary:true, name:'Shroud of the Long Night', icon:'🌑', mods:{hp:40, guard:.25}},
  // cursed: a plain name until worn
  thirsting_wand:{slot:'weapon', tier:2, cursed:true, disguise:'Gleaming Wand', rune:'C', name:'Thirsting Wand',  icon:'🩸', mods:{tap:4, charged:8, hpPerShot:1}, curse:'each shot costs 1 HP'},
  hungry_staff:  {slot:'weapon', tier:3, cursed:true, disguise:'Polished Staff', rune:'E', name:'Hungering Staff', icon:'🕳', mods:{tap:3, charged:14, gauge:.75}, curse:'the Custom gauge fills 25% slower'},
  leaden_robe:   {slot:'armor',  tier:2, cursed:true, disguise:'Sturdy Robe',   rune:'A', name:'Leaden Robe',      icon:'⛓', mods:{hp:60, slow:1.4}, curse:'you move 40% slower'},
  omen_cloak:    {slot:'armor',  tier:3, cursed:true, disguise:'Silken Cloak',  rune:'F', name:'Cloak of Ill Omen', icon:'🦇', mods:{guard:.3, shield:30, hurt:1.35}, curse:'hits that get through deal 35% more'},
};
const CURSE_KEYS=['hpPerShot','gauge','slow','hurt','misfire'];
const ENCHANTS={
  vigor:  {name:'of Vigor',    mods:{hp:15},      text:'+15 max HP'},
  haste:  {name:'of Haste',    mods:{cd:.9},      text:'fires 10% faster'},
  focus:  {name:'of Focus',    mods:{charge:.85}, text:'charges 15% faster'},
  warding:{name:'of Warding',  mods:{shield:15},  text:'+15 starting shield'},
  might:  {name:'of Might',    mods:{tap:1, charged:2}, text:'wand +1, charged +2'},
  runes:  {name:'of Runes',    mods:{surge:.08},  text:'8% chance each turn to open the 4th slot'},
};
const MAX_LEVEL=3, SACRIFICE=3;
const MULT_KEYS=['cd','charge','slow','gauge','hurt'];

function gearState(save){ save.items=save.items||{}; save.gear=save.gear||{}; save.gearLv=save.gearLv||{}; save.ench=save.ench||{}; save.ident=save.ident||{}; save.cursed=save.cursed||{}; save.scrolls=save.scrolls||{}; return save; }
// what a piece shows as: its disguise until worn once
const gearName=(save,id)=>{ const g=GEAR[id], s=gearState(save); if(g.cursed&&!s.ident[id]) return g.disguise;
  return g.name+(s.gearLv[id]?' +'+s.gearLv[id]:'')+(s.ench[id]?' '+ENCHANTS[s.ench[id]].name:''); };
const isStuck=(save,id)=>!!(GEAR[id]&&GEAR[id].cursed&&gearState(save).cursed[id]);
// the piece's mods with its level and enchantment; a broken curse drops the drawback
function pieceMods(save,id){
  const g=GEAR[id], s=gearState(save), m=Object.assign({},g.mods), lv=s.gearLv[id]||0;
  if(g.cursed&&s.ident[id]&&!s.cursed[id]) CURSE_KEYS.forEach(k=>delete m[k]);
  if(lv){ if(g.slot==='weapon'){ m.tap=(m.tap||0)+lv; m.charged=(m.charged||0)+2*lv; } else { m.hp=(m.hp||0)+10*lv; if(m.shield) m.shield+=10*lv; if(m.guard) m.guard+=.02*lv; } }
  const e=s.ench[id]&&ENCHANTS[s.ench[id]]; if(e) for(const k in e.mods) m[k]=MULT_KEYS.includes(k)?(m[k]||1)*e.mods[k]:(m[k]||0)+e.mods[k];
  return m;
}
function modsText(m){ const t=[];
  if(m.color) t.push(m.color[0].toUpperCase()+m.color.slice(1)+' shots');
  if(m.tap) t.push('wand '+(m.tap>0?'+':'')+m.tap); if(m.charged) t.push('charged '+(m.charged>0?'+':'')+m.charged);
  if(m.cd&&m.cd!==1) t.push('fires '+Math.round((1/m.cd-1)*100)+'% faster'); if(m.charge&&m.charge!==1) t.push('charges '+Math.round((1-m.charge)*100)+'% faster');
  if(m.chill) t.push('charged shots freeze '+m.chill+'s'); if(m.zap) t.push(Math.round(m.zap*100)+'% of shots stun'); if(m.drain) t.push('shots heal '+Math.round(m.drain*100)+'% of damage');
  if(m.glow) t.push('charged shots heal '+m.glow); if(m.burn) t.push('shots burn '+m.burn+'s');
  if(m.hp) t.push('+'+m.hp+' max HP'); if(m.guard) t.push('take '+Math.round(m.guard*100)+'% less damage'); if(m.shield) t.push(m.shield+' shield each fight');
  if(m.surge) t.push(Math.round(m.surge*100)+'% chance of a 4th slot');
  if(m.misfire) t.push(Math.round(m.misfire*100)+'% of shots fizzle'); if(m.hpPerShot) t.push('each shot costs '+m.hpPerShot+' HP');
  if(m.gauge) t.push('gauge '+Math.round((1-m.gauge)*100)+'% slower'); if(m.slow) t.push('move '+Math.round((m.slow-1)*100)+'% slower'); if(m.hurt) t.push('take '+Math.round((m.hurt-1)*100)+'% more from hits');
  return t.join(', ')||'no bonuses'; }
// what you see before wearing it: a disguised piece looks like a decent ordinary one
const gearText=(save,id)=>{ const g=GEAR[id]; if(g.cursed&&!gearState(save).ident[id]) return 'Unidentified. Put it on to learn what it does.'; return modsText(pieceMods(save,id)); };

// everything you wear, combined, for the battle
function gearMods(save){ const out={tap:0,charged:0,cd:1,charge:1,hp:0,guard:0,shield:0,surge:0};
  for(const id of Object.values(gearState(save).gear)){ if(!GEAR[id]) continue; const m=pieceMods(save,id);
    for(const k in m){ if(k==='color') out.color=m.color; else if(MULT_KEYS.includes(k)) out[k]=(out[k]||1)*m[k]; else out[k]=(out[k]||0)+m[k]; } }
  return out; }

// Put a piece on (or take it off with id=null). Cursed pieces reveal themselves and stick.
// Returns {ok, msg}.
function equip(save,slot,id){
  const s=gearState(save), cur=s.gear[slot];
  if(cur&&isStuck(save,cur)) return {ok:false, msg:gearName(save,cur)+' is cursed: it will not come off'};
  if(id&&(!s.items[id]||GEAR[id].slot!==slot)) return {ok:false, msg:'You don’t have that'};
  s.gear[slot]=id||null;
  if(id&&GEAR[id].cursed&&!s.ident[id]){ s.ident[id]=1; s.cursed[id]=1; return {ok:true, cursed:true, msg:'It was the '+GEAR[id].name+'! Cursed: '+GEAR[id].curse+'. It won’t come off.'}; }
  return {ok:true, msg:id?gearName(save,id)+' equipped':'Taken off'};
}
// Merge two copies into one piece a level higher.
function mergeGear(save,id){ const s=gearState(save), lv=s.gearLv[id]||0;
  if((s.items[id]||0)<2) return {ok:false, msg:'You need 2 copies to merge'};
  if(lv>=MAX_LEVEL) return {ok:false, msg:'Already +'+MAX_LEVEL};
  s.items[id]--; s.gearLv[id]=lv+1; return {ok:true, msg:gearName(save,id)+'!'}; }
function enchantGear(save,id,rng){ const s=gearState(save);
  if(!(s.scrolls.enchant>0)) return {ok:false, msg:'No scroll of enchanting'};
  if(s.ench[id]) return {ok:false, msg:'Already enchanted'};
  const ks=Object.keys(ENCHANTS).filter(k=>GEAR[id].slot==='weapon'||!['haste','focus','might'].includes(k));
  s.ench[id]=ks[Math.floor((rng||Math.random)()*ks.length)]; s.scrolls.enchant--; return {ok:true, msg:gearName(save,id)}; }
function purifyGear(save,id){ const s=gearState(save);
  if(!isStuck(save,id)) return {ok:false, msg:'Not cursed'};
  if(!(s.scrolls.purify>0)) return {ok:false, msg:'No scroll of purifying'};
  s.scrolls.purify--; delete s.cursed[id]; return {ok:true, msg:'The curse on the '+GEAR[id].name+' is broken'}; }
// Break a curse by giving up cards of its rune: they leave your collection and your decks.
function sacrificeFor(save,id,cardIds){ const g=GEAR[id], s=gearState(save);
  if(!isStuck(save,id)) return {ok:false, msg:'Not cursed'};
  if(cardIds.length!==SACRIFICE) return {ok:false, msg:'Choose '+SACRIFICE+' cards'};
  const need={}; cardIds.forEach(c=>need[c]=(need[c]||0)+1);
  for(const c in need){ const card=CARDS[c]; if(!card||card.code!==g.rune) return {ok:false, msg:'Only rune '+g.rune+' cards will do'}; if((save.owned[c]||0)<need[c]) return {ok:false, msg:'You don’t own enough'}; }
  for(const c in need){ save.owned[c]-=need[c]; if(save.owned[c]<=0) delete save.owned[c];
    for(const d of save.decks) while(d.list.filter(x=>x===c).length>(save.owned[c]||0)) d.list.splice(d.list.lastIndexOf(c),1); }
  delete s.cursed[id]; return {ok:true, msg:'The curse on the '+g.name+' is broken'}; }

// Add loot: a piece of gear (a copy if you have it already) or a scroll. A new piece is put on
// at once if that slot is empty, which is how a cursed piece can catch you out.
function addGear(save,id){ const s=gearState(save); s.items[id]=(s.items[id]||0)+1;
  if(!s.gear[GEAR[id].slot]) return equip(save,GEAR[id].slot,id);
  return null; }
function addScroll(save,kind,n){ const s=gearState(save); s.scrolls[kind]=(s.scrolls[kind]||0)+(n||1); }
function itemCount(save){ const s=gearState(save); return Object.keys(s.items).filter(id=>GEAR[id]&&s.items[id]>0).length; }

/* Loot: 20% a scroll (enchanting 2 in 3, purifying 1 in 3), otherwise gear: legendary 1% (8% from a
   boss), cursed 15%, else a tier by depth (tier 1 early, 2 from depth 4, 3 from depth 8; a boss
   rolls one tier up). Returns 'scroll:enchant', 'scroll:purify' or a gear id. */
function rollLoot(depth,rng,boss){
  rng=rng||Math.random;
  if(rng()<.2) return rng()<.67?'scroll:enchant':'scroll:purify';
  const pick=ids=>ids[Math.floor(rng()*ids.length)], all=Object.keys(GEAR), top=Math.min(3,1+Math.floor(depth/4)+(boss?1:0));
  if(rng()<(boss?.08:.01)) return pick(all.filter(id=>GEAR[id].legendary));
  if(rng()<.15) return pick(all.filter(id=>GEAR[id].cursed&&GEAR[id].tier<=Math.max(2,top)));
  const tier=rng()<.6?top:Math.max(1,top-1);
  return pick(all.filter(id=>GEAR[id].tier===tier&&!GEAR[id].cursed&&!GEAR[id].legendary&&id!=='basic_wand').concat(tier===1?['broken_wand']:[]));
}
const SCROLLS={enchant:{name:'Scroll of Enchanting', icon:'📜', text:'Adds an enchantment to a piece of gear', price:120},
               purify: {name:'Scroll of Purifying',  icon:'🕊', text:'Breaks the curse on a piece of gear',  price:150}};
function lootLabel(save,k){ if(k.startsWith('scroll:')){ const sc=SCROLLS[k.slice(7)]; return {icon:sc.icon,name:sc.name,text:sc.text}; }
  const g=GEAR[k]; return {icon:g.cursed?'❔':g.icon, name:gearName(save,k)+(g.legendary?' ✹':''), text:(g.slot==='weapon'?'Weapon: ':'Armor: ')+gearText(save,k)}; }
function addLoot(save,k){ if(k.startsWith('scroll:')){ addScroll(save,k.slice(7)); return null; } return addGear(save,k); }
// every save starts with the basic wand in hand
function ensureStarterGear(save){ const s=gearState(save); if(!s.items.basic_wand) s.items.basic_wand=1; if(!s.gear.weapon) s.gear.weapon='basic_wand'; return save; }

if(typeof module!=='undefined') module.exports={GEAR,ENCHANTS,SCROLLS,MAX_LEVEL,SACRIFICE,gearState,gearName,isStuck,pieceMods,modsText,gearText,gearMods,equip,mergeGear,enchantGear,purifyGear,sacrificeFor,addGear,addScroll,itemCount,rollLoot,lootLabel,addLoot,ensureStarterGear};
