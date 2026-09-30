/* Hexmancers deck prototype — card data.
   Every card is a row of data (color, type, rank, rarity, power, keywords), not custom code.
   Keywords: burn/freeze/stun/slow/curse = seconds, poison = damage per enemy step,
   drain = fraction of damage healed, self = HP you pay on cast. */

const COLORS={
  fire:   {name:'Fire',   c:'#ff6a3d', icon:'🔥'},
  frost:  {name:'Frost',  c:'#6fd6ff', icon:'❄️'},
  storm:  {name:'Storm',  c:'#ffe24d', icon:'⚡'},
  verdant:{name:'Verdant',c:'#6fdc7a', icon:'🌿'},
  arcane: {name:'Arcane', c:'#c58bff', icon:'✦'},
  shadow: {name:'Shadow', c:'#e0588f', icon:'☾'},
};
// Weakness ring: each color beats the next one.
const BEATS={fire:'verdant', verdant:'storm', storm:'frost', frost:'shadow', shadow:'arcane', arcane:'fire'};
const WEAK_MULT=1.75;
function colorMult(atk,def){ return atk&&BEATS[atk]===def ? WEAK_MULT : 1; }

const TYPES={
  strike:{name:'Strike', icon:'➶', text:'Hits the first enemy down your row'},
  lob:   {name:'Lob',    icon:'☄', text:'Arcs over blockers onto the nearest enemy'},
  ward:  {name:'Ward',   icon:'🛡', text:'Builds a defense on your side'},
  sentry:{name:'Sentry', icon:'♜', text:'A tower that fires on its own'},
  boon:  {name:'Boon',   icon:'✚', text:'Upgrades you for this battle'},
};
const RARITY={common:{n:'Common',g:'●'}, uncommon:{n:'Uncommon',g:'◆'}, rare:{n:'Rare',g:'★'}, legendary:{n:'Legendary',g:'✹'}};

// shape (strike): line = first enemy in row, row = every enemy in row, wedge = short cone,
//                 all = every enemy, missiles = n hits on random enemies
// ward: wall (n blocks with hp), thorns (walls that hit back), barrier (absorbs amt)
// boon: power (wand x2.5), pact (cards and wand +30%), haste, dodge, phase, regen, heal, gauge
const CARD_LIST=[
  // Fire — raw damage: burn, splash, self-damage for power
  {id:'ember_dart',  name:'Ember Dart',   color:'fire', type:'strike', rank:1, rarity:'common',   pow:24, shape:'line', burn:3},
  {id:'cinder_lance',name:'Cinder Lance', color:'fire', type:'strike', rank:2, rarity:'common',   pow:40, shape:'line'},
  {id:'flame_fan',   name:'Flame Fan',    color:'fire', type:'strike', rank:3, rarity:'uncommon', pow:34, shape:'wedge', burn:3},
  {id:'blaze_bolt',  name:'Blaze Bolt',   color:'fire', type:'strike', rank:5, rarity:'rare',     pow:72, shape:'line', self:10},
  {id:'fire_pot',    name:'Fire Pot',     color:'fire', type:'lob',    rank:3, rarity:'common',   pow:34, radius:1, burn:2},
  {id:'ember_wall',  name:'Ember Wall',   color:'fire', type:'ward',   rank:2, rarity:'common',   ward:'thorns', n:2, hp:30, thorns:10},
  {id:'brazier',     name:'Brazier',      color:'fire', type:'sentry', rank:4, rarity:'uncommon', pow:10, rate:1.2, dur:10, burn:2},
  {id:'kindle',      name:'Kindle',       color:'fire', type:'boon',   rank:4, rarity:'uncommon', boon:'power', dur:10},
  {id:'meteor',      name:'Meteor',       color:'fire', type:'lob',    rank:6, rarity:'legendary',pow:110, radius:1, burn:4, delay:1},

  // Frost — control: freeze, slow, shields
  {id:'ice_shard',   name:'Ice Shard',    color:'frost', type:'strike', rank:1, rarity:'common',   pow:30, shape:'line'},
  {id:'frost_lance', name:'Frost Lance',  color:'frost', type:'strike', rank:3, rarity:'uncommon', pow:36, shape:'row', freeze:1.5},
  {id:'hail_lob',    name:'Hail Lob',     color:'frost', type:'lob',    rank:2, rarity:'common',   pow:28, radius:1, slow:4},
  {id:'rime_wall',   name:'Rime Wall',    color:'frost', type:'ward',   rank:2, rarity:'common',   ward:'wall', n:3, hp:40},
  {id:'frost_ward',  name:'Frost Ward',   color:'frost', type:'ward',   rank:1, rarity:'common',   ward:'barrier', amt:50},
  {id:'icicle_spire',name:'Icicle Spire', color:'frost', type:'sentry', rank:3, rarity:'uncommon', pow:12, rate:1.4, dur:12, slow:2},
  {id:'glacial_veil',name:'Glacial Veil', color:'frost', type:'boon',   rank:2, rarity:'common',   boon:'dodge'},
  {id:'absolute_zero',name:'Absolute Zero',color:'frost',type:'strike', rank:6, rarity:'legendary',pow:45, shape:'all', freeze:3},

  // Storm — speed: chain lightning, stun, cast-speed boosts
  {id:'spark',       name:'Spark',        color:'storm', type:'strike', rank:1, rarity:'common',   pow:22, shape:'line'},
  {id:'thunder_row', name:'Thunder Row',  color:'storm', type:'strike', rank:3, rarity:'uncommon', pow:46, shape:'row', stun:1.2},
  {id:'chain_light', name:'Chain Lightning',color:'storm',type:'strike',rank:4, rarity:'uncommon', pow:26, shape:'all'},
  {id:'ball_light',  name:'Ball Lightning',color:'storm', type:'lob',   rank:2, rarity:'common',   pow:34, radius:0, stun:1},
  {id:'static_ward', name:'Static Ward',  color:'storm', type:'ward',   rank:1, rarity:'common',   ward:'barrier', amt:35},
  {id:'coil_sentry', name:'Coil Sentry',  color:'storm', type:'sentry', rank:3, rarity:'common',   pow:8, rate:.6, dur:12},
  {id:'tailwind',    name:'Tailwind',     color:'storm', type:'boon',   rank:2, rarity:'common',   boon:'haste', dur:12},
  {id:'stormcall',   name:'Stormcall',    color:'storm', type:'lob',    rank:6, rarity:'legendary',pow:120, radius:0, stun:2, delay:.8},

  // Verdant — growth: heal, regeneration, poison, walls and thorns
  {id:'thorn_dart',  name:'Thorn Dart',   color:'verdant', type:'strike', rank:1, rarity:'common',   pow:24, shape:'line', poison:6},
  {id:'vine_lash',   name:'Vine Lash',    color:'verdant', type:'strike', rank:3, rarity:'uncommon', pow:36, shape:'wedge', slow:3},
  {id:'briar_bomb',  name:'Briar Bomb',   color:'verdant', type:'lob',    rank:2, rarity:'common',   pow:30, radius:1},
  {id:'bramble_wall',name:'Bramble Wall', color:'verdant', type:'ward',   rank:2, rarity:'common',   ward:'thorns', n:3, hp:40, thorns:10},
  {id:'bark_skin',   name:'Bark Skin',    color:'verdant', type:'ward',   rank:4, rarity:'uncommon', ward:'barrier', amt:70},
  {id:'spore_pod',   name:'Spore Pod',    color:'verdant', type:'sentry', rank:2, rarity:'common',   pow:6, rate:1, dur:14, poison:4},
  {id:'regrowth',    name:'Regrowth',     color:'verdant', type:'boon',   rank:3, rarity:'uncommon', boon:'regen', amt:5, dur:8},
  {id:'mend',        name:'Mend',         color:'verdant', type:'boon',   rank:1, rarity:'common',   boon:'heal', amt:40},
  {id:'world_tree',  name:'World Tree',   color:'verdant', type:'boon',   rank:6, rarity:'legendary',boon:'heal', amt:120},

  // Arcane — manipulation: phase, copy, redraw, queue tricks
  {id:'arcane_bolt', name:'Arcane Bolt',  color:'arcane', type:'strike', rank:1, rarity:'common',   pow:30, shape:'line'},
  {id:'missiles',    name:'Arcane Missiles',color:'arcane',type:'strike',rank:3, rarity:'uncommon', pow:14, shape:'missiles', n:5},
  {id:'arcane_orb',  name:'Arcane Orb',   color:'arcane', type:'lob',    rank:2, rarity:'common',   pow:44, radius:0},
  {id:'mirror_ward', name:'Mirror Ward',  color:'arcane', type:'ward',   rank:2, rarity:'common',   ward:'barrier', amt:60},
  {id:'rune_sentry', name:'Rune Sentry',  color:'arcane', type:'sentry', rank:3, rarity:'common',   pow:14, rate:1.5, dur:10},
  {id:'phase_step',  name:'Phase Step',   color:'arcane', type:'boon',   rank:2, rarity:'common',   boon:'phase', dur:2.5},
  {id:'overload',    name:'Overload',     color:'arcane', type:'boon',   rank:4, rarity:'uncommon', boon:'power', dur:12},
  {id:'time_skip',   name:'Time Skip',    color:'arcane', type:'boon',   rank:3, rarity:'uncommon', boon:'gauge', amt:.6},
  {id:'starfall',    name:'Starfall',     color:'arcane', type:'strike', rank:6, rarity:'legendary',pow:16, shape:'missiles', n:10},

  // Shadow — sacrifice: curses, drain, trade HP for power
  {id:'hex_bolt',    name:'Hex Bolt',     color:'shadow', type:'strike', rank:1, rarity:'common',   pow:26, shape:'line', curse:5},
  {id:'soul_drain',  name:'Soul Drain',   color:'shadow', type:'strike', rank:2, rarity:'common',   pow:32, shape:'line', drain:.5},
  {id:'blood_lance', name:'Blood Lance',  color:'shadow', type:'strike', rank:4, rarity:'rare',     pow:80, shape:'row', self:15},
  {id:'grave_pit',   name:'Grave Pit',    color:'shadow', type:'lob',    rank:3, rarity:'uncommon', pow:34, radius:1, curse:4},
  {id:'bone_wall',   name:'Bone Wall',    color:'shadow', type:'ward',   rank:2, rarity:'common',   ward:'wall', n:2, hp:50},
  {id:'wraith_totem',name:'Wraith Totem', color:'shadow', type:'sentry', rank:3, rarity:'uncommon', pow:10, rate:1, dur:10, drain:.5},
  {id:'dark_pact',   name:'Dark Pact',    color:'shadow', type:'boon',   rank:3, rarity:'uncommon', boon:'pact', dur:10, self:15},
  {id:'eclipse',     name:'Eclipse',      color:'shadow', type:'strike', rank:6, rarity:'legendary',pow:70, shape:'all', curse:5, drain:.3},
];
const CARDS={}; CARD_LIST.forEach(c=>CARDS[c.id]=c);

// One-line rules text built from the data, so new cards need no hand-written text.
function cardText(c){
  const kw=[];
  if(c.burn) kw.push('Burn '+c.burn+'s'); if(c.freeze) kw.push('Freeze '+c.freeze+'s'); if(c.stun) kw.push('Stun '+c.stun+'s');
  if(c.slow) kw.push('Slow '+c.slow+'s'); if(c.poison) kw.push('Poison '+c.poison); if(c.curse) kw.push('Curse '+c.curse+'s');
  if(c.drain) kw.push('Drain '+Math.round(c.drain*100)+'%'); if(c.self) kw.push('Costs '+c.self+' HP');
  let t='';
  if(c.type==='strike') t={line:c.pow+' to the first enemy in your row', row:c.pow+' to every enemy in your row', wedge:c.pow+' in a short cone ahead',
                           all:c.pow+' to every enemy', missiles:c.n+' missiles of '+c.pow+' at random enemies'}[c.shape];
  else if(c.type==='lob') t=c.pow+' on the nearest enemy'+(c.radius?' and around it':'')+', over blockers';
  else if(c.type==='ward') t=c.ward==='barrier'?'Barrier absorbs '+c.amt:c.n+' walls of '+c.hp+' HP'+(c.ward==='thorns'?', hit back for '+c.thorns:'');
  else if(c.type==='sentry') t='Tower: '+c.pow+' every '+c.rate+'s for '+c.dur+'s';
  else if(c.type==='boon') t={power:'Wand ×2.5 for '+c.dur+'s', pact:'Cards and wand +30% for '+c.dur+'s', haste:'Faster moves and casts for '+c.dur+'s',
                             dodge:'Dodge the next hit', phase:'Untouchable for '+c.dur+'s', regen:'Heal '+c.amt+'/s for '+c.dur+'s', heal:'Heal '+c.amt,
                             gauge:'Fill '+Math.round(c.amt*100)+'% of the Custom gauge'}[c.boon];
  return t+(kw.length?'. '+kw.join(', '):'');
}

// Premade decks: two colors, legendary x1 and everything else x4, then the highest-rank
// cards lose copies (never below 2) until the deck fits.
const STARTERS=[
  {id:'burn_storm', name:'Burn Rush',   colors:['fire','storm'],    text:'Fast damage and stuns. End fights before the enemy acts.'},
  {id:'frost_arc',  name:'Freeze Lock', colors:['frost','arcane'],  text:'Freeze, ward and missiles. Cancel attacks and chip away.'},
  {id:'verd_shadow',name:'Bulwark Drain',colors:['verdant','shadow'],text:'Walls, poison and drain. Outlast the enemy.'},
];
function starterList(colors,size){
  size=size||60;
  const count={};
  for(const col of colors) for(const c of CARD_LIST) if(c.color===col) count[c.id]=c.rarity==='legendary'?1:4;
  let total=Object.values(count).reduce((a,b)=>a+b,0);
  while(total>size){
    const cut=Object.keys(count).filter(id=>CARDS[id].rarity!=='legendary'&&count[id]>2).sort((a,b)=>CARDS[b].rank-CARDS[a].rank||count[b]-count[a])[0];
    if(!cut) break; count[cut]--; total--;
  }
  const list=[]; for(const id in count) for(let i=0;i<count[id];i++) list.push(id);
  return list;
}

if(typeof module!=='undefined') module.exports={COLORS,BEATS,WEAK_MULT,colorMult,TYPES,RARITY,CARD_LIST,CARDS,cardText,STARTERS,starterList};
