/* Hexmancers deck prototype — gear: what your wizard wears, in seven slots: weapon, off-hand,
   head, body, arms and two rings.

   - Weapons fire differently by kind (see WEAPON_KINDS): wands are quick, staffs pierce, bows
     shoot volleys, crossbows knock back and break shields, spears hit hard up close. Staffs,
     bows and crossbows take both hands, so no shield.
   - Body armor has a weight: heavy armor takes more off each hit but slows moving and casting.

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
  basic_wand:    {slot:'weapon', tier:1, starter:true, name:'Basic Wand',           icon:'🪄', mods:{}, text:'Where every wizard starts'},
  oak_wand:      {slot:'weapon', tier:1, name:'Oak Wand',             icon:'🪄', mods:{tap:1, charged:2}},
  quick_wand:    {slot:'weapon', tier:1, name:'Quick Wand',           icon:'🪄', mods:{cd:.8}},
  ice_wand:      {slot:'weapon', tier:2, name:'Thin Wand of Ice',     icon:'❄', mods:{color:'frost', chill:.8}, text:'Charged shots freeze'},
  volt_wand:     {slot:'weapon', tier:2, name:'Wand of Electricity',  icon:'⚡', mods:{color:'storm', tap:-1, cd:.7, zap:.25}, text:'Fast; every shot may stun'},
  dark_wand:     {slot:'weapon', tier:2, name:'Wand of Darkness',     icon:'☾', mods:{color:'shadow', charged:1, drain:.3}, text:'Shots drain life'},
  light_wand:    {slot:'weapon', tier:2, name:'Wand of Light',        icon:'☀', mods:{color:'light', glow:5}, text:'Charged shots heal you'},
  focus_rod:     {slot:'weapon', kind:'staff', tier:2, name:'Focus Rod',            icon:'🔮', mods:{charge:.65, charged:3}},
  storm_scepter: {slot:'weapon', tier:2, name:'Storm Scepter',        icon:'⚡', mods:{tap:2, charged:4}},
  archmage_staff:{slot:'weapon', kind:'staff', tier:3, name:"Archmage's Staff",     icon:'✨', mods:{tap:3, charged:6, cd:.85}},
  rune_staff:    {slot:'weapon', kind:'staff', tier:3, name:'Runecarved Staff',     icon:'ᚱ', mods:{tap:2, charged:4, surge:.2}},
  // armor
  oak_staff:     {slot:'weapon', kind:'staff', tier:1, name:'Oak Staff',          icon:'🦯', mods:{}, text:'Charged orbs pierce 2 enemies'},
  elven_bow:     {slot:'weapon', kind:'bow',   tier:1, name:'Elven Bow',          icon:'🏹', mods:{}, text:'Arrows pierce; charged: a 3-row volley'},
  ashwood_bow:   {slot:'weapon', kind:'bow',   tier:2, name:'Ashwood Bow',        icon:'🏹', mods:{color:'verdant', tap:1, charged:2}, text:'Verdant arrows'},
  iron_crossbow: {slot:'weapon', kind:'crossbow', tier:1, name:'Iron Crossbow',   icon:'🎯', mods:{}, text:'Bolts knock back; charged bolts break shields'},
  thunder_repeater:{slot:'weapon', kind:'crossbow', tier:3, name:'Thunderbolt Repeater', icon:'🎯', mods:{color:'storm', cd:.75, charged:3, zap:.2}},
  hunter_spear:  {slot:'weapon', kind:'spear', tier:1, name:"Hunter's Spear",     icon:'🔱', mods:{}, text:'Reaches 3 tiles for double damage; charged: thrown down the row'},
  storm_trident: {slot:'weapon', kind:'spear', tier:3, name:'Storm Trident',      icon:'🔱', mods:{color:'storm', tap:2, charged:4, zap:.15}},
  // body armor: light, medium, heavy
  cloth_shirt:   {slot:'body', weight:'light',  tier:1, name:'Cloth Shirt',        icon:'👕', mods:{hp:10}},
  padded_robe:   {slot:'body', weight:'light',  tier:1, name:'Padded Robe',        icon:'👘', mods:{hp:20}},
  apprentice_robes:{slot:'body', weight:'light', tier:1, name:'Apprentice Robes',  icon:'🥻', mods:{hp:5, charge:.85}},
  ember_robes:   {slot:'body', weight:'light',  tier:2, name:'Robes of Embers',    icon:'🥻', mods:{hp:10, charge:.85, power:{fire:1.1}}, text:'Fire cards +10%'},
  frost_robes:   {slot:'body', weight:'light',  tier:2, name:'Robes of Frost',     icon:'🥻', mods:{hp:10, charge:.85, power:{frost:1.1}}, text:'Frost cards +10%'},
  warded_cloak:  {slot:'body', weight:'light',  tier:1, name:'Warded Cloak',       icon:'🧥', mods:{shield:30}},
  leather_armor: {slot:'body', weight:'medium', tier:1, name:'Leather Armor',      icon:'🦺', mods:{hp:25, guard:.1}},
  thief_outfit:  {slot:'body', weight:'medium', tier:2, name:'Black Thief Outfit', icon:'🥷', mods:{hp:10, dodge:.15, slow:.8}, text:'Dodge 15% of hits, move faster'},
  runed_vest:    {slot:'body', weight:'medium', tier:2, name:'Runed Vestments',    icon:'🥋', mods:{hp:30, shield:20}},
  iron_mail:     {slot:'body', weight:'heavy',  tier:2, name:'Iron Mail',          icon:'⛓', mods:{guard:.15, hp:30, slow:1.15}},
  plate_armor:   {slot:'body', weight:'heavy',  tier:2, name:'Plate Armor',        icon:'🛡', mods:{hp:50, guard:.25, slow:1.3, castSlow:1.15}},
  samurai_suit:  {slot:'body', weight:'heavy',  tier:3, name:'Samurai Suit',       icon:'🏯', mods:{hp:40, guard:.2, slow:1.15, counter:10}, text:'Strikes back at the nearest enemy when hit'},
  dragonscale:   {slot:'body', weight:'medium', tier:3, name:'Dragonscale Coat',   icon:'🐉', mods:{hp:50, guard:.15}},
  // head
  leather_cap:   {slot:'head', tier:1, name:'Leather Cap',        icon:'🧢', mods:{hp:10}},
  wizard_hat:    {slot:'head', tier:1, name:'Pointed Hat',        icon:'🎩', mods:{hp:5, charge:.9}},
  iron_helm:     {slot:'head', tier:2, name:'Iron Helm',          icon:'⛑', mods:{hp:15, guard:.05, slow:1.05}},
  kabuto:        {slot:'head', tier:3, name:'Kabuto',             icon:'🪖', mods:{hp:20, guard:.08}},
  // off-hand
  buckler:       {slot:'offhand', tier:1, name:'Buckler',         icon:'🛡', mods:{block:1}, text:'Blocks the first hit each turn'},
  tower_shield:  {slot:'offhand', tier:2, name:'Tower Shield',    icon:'🛡', mods:{block:1, guard:.1, slow:1.1}},
  // arms
  leather_bracers:{slot:'arms', tier:1, name:'Leather Bracers',   icon:'🧤', mods:{cd:.9}},
  runed_bracers: {slot:'arms', tier:2, name:'Runed Bracers',      icon:'🧤', mods:{charged:2, charge:.9}},
  // rings
  ring_embers:   {slot:'ring', tier:1, name:'Ring of Embers',     icon:'💍', mods:{burn:1}},
  ring_frost:    {slot:'ring', tier:2, name:'Ring of Frost',      icon:'💍', mods:{chill:.4}},
  ring_vigor:    {slot:'ring', tier:1, name:'Ring of Vigor',      icon:'💍', mods:{hp:20}},
  ring_regen:    {slot:'ring', tier:2, name:'Ring of Regeneration', icon:'💍', mods:{regen:1}, text:'Heal 1 HP a second'},
  ring_runes:    {slot:'ring', tier:2, name:'Ring of Runes',      icon:'💍', mods:{surge:.1}},
  ring_gold:     {slot:'ring', tier:1, name:'Ring of Fortune',    icon:'💍', mods:{gold:.25}, text:'25% more gold from fights'},
  // legendary
  first_flame:   {slot:'weapon', kind:'staff', tier:4, legendary:true, name:'Staff of the First Flame', icon:'🔥', mods:{color:'fire', tap:4, charged:10, burn:3, cd:.85}, text:'Every shot sets enemies burning'},
  frostfang:     {slot:'weapon', kind:'spear', tier:4, legendary:true, name:'Frostfang Scepter',        icon:'❄', mods:{color:'frost', tap:3, charged:9, chill:1.5, charge:.6}},
  dawn_aegis:    {slot:'offhand', tier:4, legendary:true, name:'Aegis of Dawn',            icon:'🌅', mods:{hp:40, shield:40, block:1}},
  night_shroud:  {slot:'body', weight:'medium', tier:4, legendary:true, name:'Shroud of the Long Night', icon:'🌑', mods:{hp:40, guard:.25, dodge:.1}},
  ring_dragon:   {slot:'ring', tier:4, legendary:true, name:'Ring of the Dragon King', icon:'💍', mods:{burn:2, hp:30, regen:1}},
  // cursed: a plain name until worn
  thirsting_wand:{slot:'weapon', tier:2, cursed:true, disguise:'Gleaming Wand', rune:'C', name:'Thirsting Wand',  icon:'🩸', mods:{tap:4, charged:8, hpPerShot:1}, curse:'each shot costs 1 HP'},
  hungry_staff:  {slot:'weapon', kind:'staff', tier:3, cursed:true, disguise:'Polished Staff', rune:'E', name:'Hungering Staff', icon:'🕳', mods:{tap:3, charged:14, gauge:.75}, curse:'the Custom gauge fills 25% slower'},
  leaden_robe:   {slot:'body', weight:'heavy', tier:2, cursed:true, disguise:'Sturdy Robe',   rune:'A', name:'Leaden Robe',      icon:'⛓', mods:{hp:60, slow:1.4}, curse:'you move 40% slower'},
  omen_cloak:    {slot:'body', weight:'light', tier:3, cursed:true, disguise:'Silken Cloak',  rune:'F', name:'Cloak of Ill Omen', icon:'🦇', mods:{guard:.3, shield:30, hurt:1.35}, curse:'hits that get through deal 35% more'},
};
// how each kind of weapon fires: base damage, seconds between shots, and its special
const WEAPON_KINDS={
  wand:    {name:'Wand',     tap:3, charged:7,  cd:.3,  ccd:.5, text:'quick shots down your row'},
  staff:   {name:'Staff',    tap:4, charged:10, cd:.45, ccd:.6, twoHand:true, text:'slower; charged orbs pierce 2 enemies'},
  bow:     {name:'Bow',      tap:3, charged:5,  cd:.35, ccd:.6, twoHand:true, text:'arrows pierce the first enemy (60% to the next); charged: a volley down 3 rows'},
  crossbow:{name:'Crossbow', tap:6, charged:9,  cd:.6,  ccd:.7, twoHand:true, text:'slow heavy bolts that knock back; charged bolts go under shields and walls'},
  spear:   {name:'Spear',    tap:6, charged:9,  cd:.35, ccd:.6, text:'reaches only 3 tiles; charged: thrown through the whole row'},
};
const kindOf=id=>GEAR[id]&&GEAR[id].slot==='weapon'?GEAR[id].kind||'wand':null;
// the seven slots, and which kind of piece each takes
const SLOTS=['weapon','offhand','head','body','arms','ring1','ring2'];
const SLOT_NAMES={weapon:'Weapon',offhand:'Off-hand',head:'Head',body:'Body',arms:'Arms',ring1:'Ring',ring2:'Ring'};
const slotType=slot=>slot.startsWith('ring')?'ring':slot;
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
const MULT_KEYS=['cd','charge','slow','gauge','hurt','castSlow'];

function gearState(save){ save.items=save.items||{}; save.gear=save.gear||{}; save.gearLv=save.gearLv||{}; save.ench=save.ench||{}; save.ident=save.ident||{}; save.cursed=save.cursed||{}; save.scrolls=save.scrolls||{}; return save; }
// what a piece shows as: its disguise until worn once
const gearName=(save,id)=>{ const g=GEAR[id], s=gearState(save); if(g.cursed&&!s.ident[id]) return g.disguise;
  return g.name+(s.gearLv[id]?' +'+s.gearLv[id]:'')+(s.ench[id]?' '+ENCHANTS[s.ench[id]].name:''); };
const isStuck=(save,id)=>!!(GEAR[id]&&GEAR[id].cursed&&gearState(save).cursed[id]);
// the piece's mods with its level and enchantment; a broken curse drops the drawback
function pieceMods(save,id){
  const g=GEAR[id], s=gearState(save), m=Object.assign({},g.mods), lv=s.gearLv[id]||0;
  if(g.cursed&&s.ident[id]&&!s.cursed[id]) CURSE_KEYS.forEach(k=>delete m[k]);
  if(lv){ if(g.slot==='weapon'){ m.tap=(m.tap||0)+lv; m.charged=(m.charged||0)+2*lv; } else { m.hp=(m.hp||0)+(g.slot==='ring'?5:10)*lv; if(m.shield) m.shield+=10*lv; if(m.guard) m.guard+=.02*lv; } }
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
  if(m.dodge) t.push('dodge '+Math.round(m.dodge*100)+'% of hits'); if(m.block) t.push('blocks the first hit each turn'); if(m.counter) t.push('strikes back for '+m.counter);
  if(m.regen) t.push('heal '+m.regen+' HP a second'); if(m.gold) t.push('+'+Math.round(m.gold*100)+'% gold');
  if(m.power) for(const c in m.power) t.push(c+' cards +'+Math.round((m.power[c]-1)*100)+'%');
  if(m.castSlow) t.push('cast '+Math.round((m.castSlow-1)*100)+'% slower');
  if(m.misfire) t.push(Math.round(m.misfire*100)+'% of shots fizzle'); if(m.hpPerShot) t.push('each shot costs '+m.hpPerShot+' HP');
  if(m.gauge) t.push('gauge '+Math.round((1-m.gauge)*100)+'% slower'); if(m.slow&&m.slow>1) t.push('move '+Math.round((m.slow-1)*100)+'% slower'); if(m.slow&&m.slow<1) t.push('move '+Math.round((1-m.slow)*100)+'% faster'); if(m.hurt) t.push('take '+Math.round((m.hurt-1)*100)+'% more from hits');
  return t.join(', ')||'no bonuses'; }
// what you see before wearing it: a disguised piece looks like a decent ordinary one
const gearText=(save,id)=>{ const g=GEAR[id]; if(g.cursed&&!gearState(save).ident[id]) return 'Unidentified. Put it on to learn what it does.'; return modsText(pieceMods(save,id)); };

// everything you wear, combined, for the battle
function gearMods(save){ const out={tap:0,charged:0,cd:1,charge:1,hp:0,guard:0,shield:0,surge:0,kind:'wand',power:{}};
  for(const [slot,id] of Object.entries(gearState(save).gear)){ if(!GEAR[id]) continue; const m=pieceMods(save,id);
    if(slot==='weapon') out.kind=kindOf(id);
    for(const k in m){ if(k==='color'){ if(slot==='weapon'||!out.color) out.color=m.color; }
      else if(k==='power'){ for(const c in m.power) out.power[c]=(out.power[c]||1)*m.power[c]; }
      else if(MULT_KEYS.includes(k)) out[k]=(out[k]||1)*m[k]; else out[k]=(out[k]||0)+m[k]; } }
  out.guard=Math.min(.6,out.guard); out.dodge=Math.min(.4,out.dodge||0);
  return out; }

// Put a piece on (or take it off with id=null). Cursed pieces reveal themselves and stick.
// Returns {ok, msg}.
function equip(save,slot,id){
  const s=gearState(save);
  if(id&&GEAR[id]&&GEAR[id].slot==='ring'&&slot!=='ring1'&&slot!=='ring2') slot=!s.gear.ring1?'ring1':!s.gear.ring2?'ring2':'ring1';
  if(!SLOTS.includes(slot)) return {ok:false, msg:'No such slot'};
  const cur=s.gear[slot];
  if(cur&&isStuck(save,cur)) return {ok:false, msg:gearName(save,cur)+' is cursed: it will not come off'};
  if(id&&(!s.items[id]||GEAR[id].slot!==slotType(slot))) return {ok:false, msg:'You don’t have that'};
  if(id&&GEAR[id].slot==='ring'&&SLOTS.some(k=>k!==slot&&s.gear[k]===id)&&s.items[id]<2) return {ok:false, msg:'You have only one '+gearName(save,id)};
  // two hands: a staff, bow or crossbow and a shield don't go together
  if(id&&slot==='weapon'&&WEAPON_KINDS[kindOf(id)].twoHand&&s.gear.offhand){ if(isStuck(save,s.gear.offhand)) return {ok:false, msg:'Your cursed '+gearName(save,s.gear.offhand)+' keeps a hand busy'}; s.gear.offhand=null; }
  if(id&&slot==='offhand'&&s.gear.weapon&&WEAPON_KINDS[kindOf(s.gear.weapon)].twoHand) return {ok:false, msg:'Your '+gearName(save,s.gear.weapon)+' takes both hands'};
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
  const t=GEAR[id].slot, free=SLOTS.find(k=>slotType(k)===t&&!s.gear[k]);
  if(free&&!(t==='offhand'&&s.gear.weapon&&WEAPON_KINDS[kindOf(s.gear.weapon)].twoHand)) return equip(save,free,id);
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
  const g=GEAR[k]; return {icon:g.cursed&&!gearState(save).ident[k]?'❔':g.icon, name:gearName(save,k)+(g.legendary?' ✹':''), text:SLOT_NAMES[g.slot==='ring'?'ring1':g.slot]+': '+gearText(save,k)}; }
function addLoot(save,k){ if(k.startsWith('scroll:')){ addScroll(save,k.slice(7)); return null; } return addGear(save,k); }
// every save starts with the basic wand in hand
function ensureStarterGear(save){ const s=gearState(save);
  // saves from before the seven slots kept body armor under 'armor'
  if('armor' in s.gear){ const a=s.gear.armor; delete s.gear.armor; if(a&&GEAR[a]) s.gear[GEAR[a].slot==='ring'?'ring1':GEAR[a].slot]=a; }
  if(!s.items.basic_wand) s.items.basic_wand=1; if(!s.gear.weapon) s.gear.weapon='basic_wand'; return save; }

if(typeof module!=='undefined') module.exports={WEAPON_KINDS,SLOTS,SLOT_NAMES,slotType,kindOf,GEAR,ENCHANTS,SCROLLS,MAX_LEVEL,SACRIFICE,gearState,gearName,isStuck,pieceMods,modsText,gearText,gearMods,equip,mergeGear,enchantGear,purifyGear,sacrificeFor,addGear,addScroll,itemCount,rollLoot,lootLabel,addLoot,ensureStarterGear};
