/* Hexmancers deck prototype — card data.
   Every card is a row of data (color, type, rank, rarity, power, keywords), not custom code.
   Keywords: burn/freeze/stun/slow/curse = seconds, poison = damage per enemy step,
   drain = fraction of damage healed, self = HP you pay on cast. */

const COLORS={
  fire:   {name:'Fire',   c:'#ff6a3d', icon:'🔥'},
  frost:  {name:'Frost',  c:'#6fd6ff', icon:'❄️'},
  storm:  {name:'Storm',  c:'#ffe24d', icon:'⚡'},
  verdant:{name:'Verdant',c:'#6fdc7a', icon:'🌿'},
  light:  {name:'Light',  c:'#fff0b3', icon:'☀'},
  shadow: {name:'Shadow', c:'#e0588f', icon:'☾'},
  gray:   {name:'Gray',   c:'#b4b8c8', icon:'🐾', neutral:true},
  brown:  {name:'Brown',  c:'#c08a55', icon:'⚙', neutral:true},
};
const SIX=['fire','frost','storm','verdant','light','shadow'];
// Weakness ring: each color beats the next one.
// Arcane (purple) is set aside for now; Light takes its place in the ring.
const BEATS={fire:'verdant', verdant:'storm', storm:'frost', frost:'shadow', shadow:'light', light:'fire'};
const WEAK_MULT=1.75;
function colorMult(atk,def){ return atk&&BEATS[atk]===def ? WEAK_MULT : 1; }

const TYPES={
  strike:{name:'Strike', icon:'➶', text:'Hits the first enemy down your row'},
  lob:   {name:'Lob',    icon:'☄', text:'Arcs over blockers onto the nearest enemy'},
  ward:  {name:'Ward',   icon:'🛡', text:'Builds a defense on your side'},
  sentry:{name:'Sentry', icon:'♜', text:'A tower that fires on its own'},
  boon:  {name:'Boon',   icon:'✚', text:'Upgrades you for this battle'},
  charge:{name:'Charge', icon:'⚗', text:'Limited uses; stays queued until spent'},
  utility:{name:'Utility',icon:'✎', text:'Draw, recall, copy or cleanse'},
  trap:  {name:'Trap',   icon:'⌖', text:'Set on an enemy tile; springs when an enemy steps on it'},
  environment:{name:'Environment',icon:'⛰', text:'Changes the ground on the enemy side'},
  piece: {name:'Legendary piece', icon:'♛', text:'Part of a legendary combo recipe (phase 4)'},
  summon:{name:'Summon', icon:'🐾', text:'A creature that fights for a set time'},
  machine:{name:'Machine',icon:'⚙', text:'A turret, wall or construct'},
  hero:  {name:'Hero',   icon:'♔', text:'Calls a hero to fight beside you and empower you'},
};
const RARITY={common:{n:'Common',g:'●'}, uncommon:{n:'Uncommon',g:'◆'}, rare:{n:'Rare',g:'★'}, legendary:{n:'Legendary',g:'✹'}, hero:{n:'Hero',g:'♔'}};

// shape (strike): line = first enemy in row, row = every enemy in row, wedge = short cone,
//                 all = every enemy, missiles = n hits on random enemies
// ward: wall (n blocks with hp), thorns (walls that hit back), barrier (absorbs amt)
// boon: power (wand x2.5), pact (cards and wand +30%), haste, dodge, phase, regen, heal, gauge
// Signature cards: hand-authored, they define each color's strategies.
const SIGNATURE=[
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

  // Light — healing, divine intervention, courage
  {id:'holy_bolt',   name:'Holy Bolt',    color:'light', type:'strike', rank:1, rarity:'common',   pow:26, shape:'line', mend:4},
  {id:'radiant_motes',name:'Radiant Motes',color:'light',type:'strike', rank:3, rarity:'uncommon', pow:14, shape:'missiles', n:4, mend:2},
  {id:'judgment',    name:'Judgment',     color:'light', type:'lob',    rank:2, rarity:'common',   pow:48, radius:0, delay:.9},
  {id:'sanctuary',   name:'Sanctuary',    color:'light', type:'ward',   rank:2, rarity:'common',   ward:'barrier', amt:55},
  {id:'beacon_hope', name:'Beacon of Hope',color:'light',type:'sentry', rank:3, rarity:'uncommon', pow:7, rate:1, dur:12, mend:3},
  {id:'blessing',    name:'Blessing',     color:'light', type:'boon',   rank:1, rarity:'common',   boon:'heal', amt:45},
  {id:'courage',     name:'Courage',      color:'light', type:'boon',   rank:4, rarity:'uncommon', boon:'courage', dur:8},
  {id:'intervention',name:'Divine Intervention',color:'light',type:'boon',rank:5,rarity:'rare',   boon:'intervene', amt:60},
  {id:'dawnbreaker', name:'Dawnbreaker',  color:'light', type:'strike', rank:6, rarity:'legendary',pow:55, shape:'all', mend:10, valor:1},

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
SIGNATURE.forEach(c=>c.sig=true);

/* ---------------- template cards ----------------
   The rest of the 800 are built from templates with a power budget: higher rank and rarity
   buy more damage, duration or uses. A seeded generator keeps every card id stable between
   loads, so saved collections stay valid. Change a template and ids may shift: bump SAVE_KEY. */

// Type split per family of 100 (from the design doc's 800-card plan).
const TYPE_PLAN={
  color:{strike:32, lob:15, ward:13, sentry:11, boon:12, charge:17, utility:7, trap:6, environment:8, piece:4},
  gray: {charge:8, piece:4, summon:113},
  brown:{charge:8, piece:4, machine:113},
};
const RARITY_PLAN={common:50, uncommon:38, rare:25, legendary:12};
const PATTERN_MULT={single:1, burst:.8, ring:.85, cross:.75, column:.8, row:.8};
const RARITY_MULT={common:1, uncommon:1.12, rare:1.25, legendary:1.45};
// Ranks 1-12 in every family, spread evenly and not tied to rarity, so three in a row (a Straight)
// takes the right cards rather than coming up by itself. A card's power still grows with its rank.

const TRAITS={
  fire:   {shapes:['line','line','wedge','row','zigzag'], kws:['burn','burn','self','push'], traps:['blast','spike'], envs:['burn','burn','tremor'],     boons:['power','haste','pact'],  wards:['thorns','wall','barrier'], util:['draw','cleanse'], piece:'lob'},
  frost:  {shapes:['line','row','row','wedge','dig'], kws:['freeze','slow','slow','pull'], traps:['snare','spike'], envs:['freeze','freeze','tremor'],   boons:['dodge','phase','regen'], wards:['wall','barrier','barrier'],util:['cleanse','draw'], piece:'strike'},
  storm:  {shapes:['line','line','row','all','diag','zigzag'], kws:['stun','stun','confuse','push'], traps:['blast','snare'], envs:['tremor','tremor','burn'],       boons:['haste','gauge','power'], wards:['barrier','barrier','wall'],util:['draw','recall'],  piece:'lob'},
  verdant:{shapes:['line','wedge','wedge','line','dig'], kws:['poison','slow','drain','pull'], traps:['snare','spike','spike'], envs:['bramble','bramble','freeze'],  boons:['heal','regen','regen'],  wards:['thorns','wall','barrier'], util:['cleanse','draw'], piece:'boon'},
  light:  {shapes:['line','missiles','all','line','diag'], kws:['mend','valor','mend','push'], traps:['snare','blast'], envs:['burn','tremor'],     boons:['heal','courage','intervene','regen'], wards:['barrier','barrier','wall'], util:['cleanse','draw','copy'], piece:'boon'},
  shadow: {shapes:['line','row','line','all','dig'], kws:['curse','drain','self','confuse','pull'], traps:['spike','snare'], envs:['bramble','burn'],   boons:['pact','pact','heal'],    wards:['wall','thorns','wall'],    util:['copy','draw','cleanse'], piece:'strike'},
  gray:   {kws:[null], piece:'summon'},
  brown:  {kws:[null], piece:'machine'},
};
const WORDS={
  fire:   ['Cinder','Ember','Blaze','Scorch','Ash','Magma','Flare','Pyre','Inferno','Kindling','Char','Smolder','Searing','Molten','Wildfire','Brand','Sunfire','Flame','Hearth','Ignis'],
  frost:  ['Rime','Frost','Glacial','Hoarfrost','Ice','Sleet','Snow','Winter','Crystal','Polar','Boreal','Chill','Permafrost','Hail','Frozen','Icicle','Tundra','Arctic','Numbing','Pale'],
  storm:  ['Thunder','Volt','Static','Spark','Gale','Tempest','Lightning','Squall','Surge','Arc','Storm','Charged','Zephyr','Cyclone','Flash','Crackling','Galvanic','Monsoon','Sky','Ion'],
  verdant:['Briar','Thorn','Moss','Vine','Root','Bramble','Fern','Oak','Bloom','Spore','Willow','Thistle','Wild','Sap','Grove','Nettle','Ivy','Verdant','Seed','Hollow'],
  light:  ['Radiant','Holy','Dawn','Solar','Sacred','Gleaming','Blessed','Valiant','Aurora','Halo','Hallowed','Brave','Luminous','Seraph','Gilded','Shining','Dawnlit','Bright','Pure','Vigil'],
  shadow: ['Hex','Grave','Dusk','Blood','Bone','Night','Umbral','Wraith','Soul','Crypt','Gloom','Shade','Raven','Dread','Cursed','Black','Vile','Ghoul','Eclipse','Tomb'],
  gray:   ['Loyal','Feral','Stone','Tiny','Ancient','Wild','Grim','Swift','Brave','Old','Lucky','Dire','Pale','Clever','Hungry','Gentle','Sly','Mossy','Scrappy','Noble'],
  brown:  ['Clockwork','Brass','Steam','Iron','Copper','Rusted','Gear','Cog','Tin','Bolted','Riveted','Piston','Spring','Gyro','Dwarven','Forge','Oiled','Ratchet','Valve','Anvil'],
};
const NOUNS={
  strike:['Lance','Dart','Bolt','Arrow','Spear','Fang','Lash','Shot','Needle','Ray','Javelin','Blade','Claw','Spike','Beam'],
  lob:['Bomb','Orb','Pot','Mortar','Comet','Stone','Globe','Burst','Seed'],
  ward:['Wall','Ward','Aegis','Barrier','Bulwark','Veil','Screen','Rampart','Mantle'],
  sentry:['Sentry','Spire','Totem','Beacon','Obelisk','Pylon','Idol','Lantern','Watcher'],
  boon:['Blessing','Rite','Gift','Vigor','Focus','Stride','Oath','Trance','Hymn'],
  charge:['Flask','Quiver','Satchel','Pouch','Vial','Cask','Bundle','Charm','Censer'],
  utility:['Scroll','Tome','Lens','Codex','Map','Key','Compass','Candle'],
  trap:['Snare','Trap','Glyph','Mine','Tripwire','Pitfall','Jaw','Rune'],
  environment:['Field','Storm','Ground','Mire','Tide','Rain','Quake','Blight'],
  summon:['Imp','Wolf','Hound','Owl','Toad','Bat','Knight','Squire','Spirit','Golem','Rat','Boar','Hawk','Mole','Beetle','Serpent','Bear','Fox','Ogre','Sprite'],
  turret:['Turret','Ballista','Cannon','Crossbow','Tower'], repeater:['Repeater','Drone','Automaton','Gatling'],
  mortar:['Mortar','Catapult','Engine','Trebuchet'], bulwark:['Barricade','Bulwark','Bastion','Rampart','Palisade'],
  piece:['Crown','Heart','Eye','Sigil'],
};

function mulberry32(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function seedOf(s){ let h=2166136261; for(const ch of s){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }

function generateCards(){
  const out=[], names=new Set(SIGNATURE.map(c=>c.name));
  for(const fam of Object.keys(COLORS)){
    const rng=mulberry32(seedOf('hexmancers:'+fam)), ri=(a,b)=>a+Math.floor(rng()*(b-a+1)), pk=a=>a[Math.floor(rng()*a.length)];
    const neutral=COLORS[fam].neutral, plan=TYPE_PLAN[neutral?fam:'color'], tr=TRAITS[fam];
    const sig=SIGNATURE.filter(c=>c.color===fam);
    const need=Object.assign({},plan); sig.forEach(c=>need[c.type]--);
    const rar=Object.assign({},RARITY_PLAN); sig.forEach(c=>rar[c.rarity]--);
    rar.legendary-=need.piece;
    const pool=[]; for(const r in rar) for(let i=0;i<rar[r];i++) pool.push(r);
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    const slots=[]; for(const t in need) for(let i=0;i<need[t];i++) slots.push(t);
    const ranks=slots.map((_,i)=>i%12+1); for(let i=ranks.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [ranks[i],ranks[j]]=[ranks[j],ranks[i]]; }
    const count={};
    for(const type of slots){
      const rarity=type==='piece'?'legendary':pool.pop();
      const rank=ranks.pop();
      const F=(1+.06*(rank-1))*RARITY_MULT[rarity]*(type==='piece'?1.2:1);
      count[type]=(count[type]||0)+1;
      const c={id:fam+'_'+type+'_'+String(count[type]).padStart(2,'0'), color:fam, type, rank, rarity};
      const kwChance={common:.4,uncommon:.6,rare:.8,legendary:1}[rarity];
      const kw=rng()<kwChance?pk(tr.kws):null;
      const base=type==='piece'?tr.piece:type;
      BUILD[base](c,F,rank,kw,tr,pk,ri);
      if(type==='piece'){ c.base=base; c.piece=true; }
      // name: family word + type noun, unique across the whole set
      let name='';
      for(let tries=0;tries<400&&(!name||names.has(name));tries++)
        name=type==='piece'?pk(NOUNS.piece)+' of the '+pk(WORDS[fam]):pk(WORDS[fam])+' '+pk(NOUNS[base==='machine'?c.ai:base]);
      if(names.has(name)) name+=' '+count[type];
      names.add(name); c.name=name;
      out.push(c);
    }
  }
  return out;
}
const r1=v=>Math.round(v*10)/10;
function applyKw(c,kw,rank){
  if(!kw) return 1;
  const v={burn:r1(2+rank/3), freeze:r1(1+rank*.15), stun:r1(.8+rank*.1), slow:r1(2+rank*.3), poison:3+rank, curse:r1(3+rank*.3), drain:r1(.25+rank*.03), self:8+rank,
           mend:2+Math.round(rank/3), valor:1, push:1, pull:1, confuse:r1(3+rank*.2)}[kw];
  c[kw]=v; return kw==='self'?1.4:kw==='valor'||kw==='push'||kw==='pull'?.95:.85;
}
const BUILD={
  strike(c,F,rank,kw,tr,pk){
    c.shape=pk(tr.shapes); const k=applyKw(c,kw,rank);
    if(c.shape==='missiles'){ c.n=3+Math.floor(rank/3); c.pow=Math.round(9*F*k); }
    else c.pow=Math.round({line:30,row:26,wedge:30,all:18,dig:28,zigzag:28,diag:22}[c.shape]*F*k);
  },
  // lobs land in a floor pattern; bigger patterns trade power for area
  lob(c,F,rank,kw,tr,pk){ c.pattern=pk(['single','single','burst','cross','column','ring','row']); const k=applyKw(c,kw,rank);
    c.pow=Math.round(32*F*PATTERN_MULT[c.pattern]*k*(c.rarity==='legendary'?1.3:1)); if(c.rarity==='legendary') c.delay=.9; },
  trap(c,F,rank,kw,tr,pk){ c.trap=pk(tr.traps); const k=kw==='self'?1:applyKw(c,kw,rank);
    c.pow=Math.round({spike:38,snare:18,blast:26}[c.trap]*F*k); if(c.trap==='snare') c.stun=r1(1.5+rank*.1); },
  environment(c,F,rank,kw,tr,pk){ c.env=pk(tr.envs); c.pattern=pk(['burst','cross','column','row']); c.dur=6+Math.round(rank/2);
    if(c.env==='bramble') c.pow=Math.round(8*F); if(c.env==='tremor'){ c.pow=Math.round(14*F); c.stun=r1(.8+rank*.08); delete c.dur; } },
  ward(c,F,rank,kw,tr,pk){ c.ward=pk(tr.wards);
    if(c.ward==='barrier') c.amt=Math.round(45*F); else { c.n=2+(rank>6?1:0); c.hp=Math.round(35*F); if(c.ward==='thorns') c.thorns=Math.round(6*F); } },
  sentry(c,F,rank,kw,tr,pk){ c.rate=pk([.6,.9,1.2,1.5]); const k=kw==='self'?1:applyKw(c,kw,rank); c.pow=Math.max(3,Math.round(9*F*c.rate*k)); c.dur=8+Math.round(rank/2); },
  boon(c,F,rank,kw,tr,pk){ c.boon=pk(tr.boons); c.dur=8+Math.round(rank/2);
    if(c.boon==='heal') c.amt=Math.round(35*F); if(c.boon==='regen'){ c.amt=Math.round(3*F); c.dur=8; }
    if(c.boon==='gauge') c.amt=r1(Math.min(.9,.35+rank*.04)); if(c.boon==='pact') c.self=10+rank;
    if(c.boon==='intervene') c.amt=Math.round(40*F); if(c.boon==='courage') c.dur=6+Math.round(rank/2);
    if(['dodge','heal','gauge','intervene'].includes(c.boon)) delete c.dur; if(c.boon==='phase') c.dur=r1(1.5+rank*.15); },
  charge(c,F,rank,kw,tr,pk,ri){
    c.fx=c.color==='brown'?'lob':pk(['bolt','bolt','lob']);
    c.uses=ri(...{common:[3,5],uncommon:[5,8],rare:[8,12],legendary:[12,20]}[c.rarity]);
    const k=kw==='self'?1:applyKw(c,kw,rank);
    c.pow=Math.max(4,Math.round(16*F*k/Math.sqrt(c.uses/3)));
  },
  utility(c,F,rank,kw,tr,pk){ c.util=pk(tr.util);
    if(c.util==='draw') c.n=1+(rank>5?1:0)+(rank>9?1:0); if(c.util==='cleanse') c.amt=Math.round(15*F); },
  summon(c,F,rank,kw,tr,pk){ c.ai=pk(['shooter','shooter','bomber','healer','guardian']);
    c.hp=Math.round(40*F*(c.ai==='guardian'?2.5:1)); c.dur=Math.round(12+rank*1.5+(c.ai==='guardian'?6:0));
    if(c.ai==='shooter'){ c.pow=Math.round(10*F); c.rate=1.2; }
    if(c.ai==='bomber'){ c.pow=Math.round(18*F); c.rate=2.2; }
    if(c.ai==='healer'){ c.amt=Math.round(4*F); c.rate=2; }
    if(c.ai==='guardian'){ c.pow=Math.round(6*F); c.rate=1.5; } },
  machine(c,F,rank,kw,tr,pk){ c.ai=pk(['turret','turret','bulwark','mortar','repeater']);
    if(c.ai==='turret'){ c.pow=Math.round(9*F); c.rate=1.4; c.hp=Math.round(45*F); c.dur=30; }
    if(c.ai==='repeater'){ c.pow=Math.round(5*F); c.rate=.5; c.hp=Math.round(35*F); c.dur=20; }
    if(c.ai==='mortar'){ c.pow=Math.round(22*F); c.rate=2.5; c.hp=Math.round(30*F); c.dur=15; }
    if(c.ai==='bulwark'){ c.n=1+(c.rank>3?1:0); c.hp=Math.round(90*F); } },
};

/* Heroes: the rarest cards. A boss sometimes drops one (more often deeper down), and a pack
   very rarely holds one. Casting a hero calls it onto your side for a few turns: it fights on
   its own, and while it stands it empowers you. One hero per deck. Added after the 1,000, so
   the generated ids are unchanged. */
const HEROES=[
  {id:'hero_pyra',  name:'Pyra, the Ember Queen', color:'fire',    hero:'pyra',        pow:40, rate:1.6, hp:150, burn:3,
   attack:'hurls fireballs of {pow} that splash',          aura:'your cards and wand deal +30%'},
  {id:'hero_ysolde',name:'Ysolde of the Rime',    color:'frost',   hero:'ysolde',      pow:26, rate:1.4, hp:170, freeze:1.2, amt:30,
   attack:'fires freezing bolts of {pow}',                 aura:'you get a shield of 30 now and at the start of each turn'},
  {id:'hero_volta', name:'Captain Volta',         color:'storm',   hero:'volta',       pow:22, rate:1.3, hp:140, stun:.6,
   attack:'chains lightning of {pow} through 3 enemies',   aura:'your Custom gauge fills 50% faster and you cast faster'},
  {id:'hero_thorn', name:'The Thornfather',       color:'verdant', hero:'thornfather', pow:20, rate:1.5, hp:200, poison:6, amt:3,
   attack:'bursts thorns of {pow} around an enemy',        aura:'you get +30 max HP and heal 3 a second'},
  {id:'hero_aurel', name:'Sir Aurelion',          color:'light',   hero:'aurelion',    pow:30, rate:1.5, hp:180, heal:6, amt:60,
   attack:'calls down holy light of {pow} on an enemy and heals you 6', aura:'your cards deal +25%, and the next lethal hit leaves you standing and heals 60'},
  {id:'hero_widow', name:'The Nightwidow',        color:'shadow',  hero:'widow',       pow:28, rate:1.4, hp:140, curse:4,
   attack:'casts curses of {pow} on the nearest enemy',    aura:'you heal 20% of all damage you deal'},
  // more Souls (added after the first six). style: how it attacks; aurae: what it grants while it stands
  {id:'hero_brann', name:'Brann the Forgemaster',  color:'fire',    hero:'brann',   style:'lob',   pow:36, rate:1.7, hp:220, burn:2, aurae:{armor:.2},
   attack:'hurls molten slag of {pow} that splashes',     aura:'you take 20% less damage'},
  {id:'hero_cinder',name:'Cinder, the Ash Dancer', color:'fire',    hero:'cinder',  style:'multi', n:4, pow:14, rate:1.3, hp:130, burn:3, aurae:{haste:1},
   attack:'flings 4 embers of {pow} at random enemies',   aura:'you cast faster'},
  {id:'hero_winter',name:'Old Man Winter',         color:'frost',   hero:'winter',  style:'sky',   pow:30, rate:1.6, hp:180, freeze:.8, aurae:{slowfoes:.25},
   attack:'drops hail of {pow} from above that freezes',  aura:'enemies act 25% slower'},
  {id:'hero_glacia',name:'Glacia the Mirror',      color:'frost',   hero:'glacia',  style:'row',   pow:24, rate:1.5, hp:160, slow:2, aurae:{shield:20},
   attack:'fires a piercing ray of {pow} down its row',   aura:'you get a shield of 20 now and at the start of each turn'},
  {id:'hero_zephyra',name:'Zephyra, Wind Rider',   color:'storm',   hero:'zephyra', style:'multi', n:3, pow:16, rate:1.2, hp:130, aurae:{dodge:.2},
   attack:'looses 3 gusts of {pow}',                       aura:'you dodge 20% of hits'},
  {id:'hero_raijin',name:'Raijin, the Thunder King',color:'storm',  hero:'raijin',  style:'chain', n:4, pow:24, rate:1.5, hp:170, stun:.4, aurae:{gauge:1.3},
   attack:'chains lightning of {pow} through 4 enemies',   aura:'your Custom gauge fills 30% faster'},
  {id:'hero_briar', name:'Mother Briar',           color:'verdant', hero:'briar',   style:'burst', pow:18, rate:1.5, hp:200, poison:5, aurae:{regen:2},
   attack:'bursts poison thorns of {pow} around an enemy', aura:'you heal 2 a second'},
  {id:'hero_fang',  name:'Fang the Beastcaller',   color:'verdant', hero:'fang',    style:'arc',   pow:32, rate:1.3, hp:170, slow:2, aurae:{dmg:.2},
   attack:'pounces on an enemy for {pow}',                 aura:'your cards and wand deal +20%'},
  {id:'hero_lumina',name:'Saint Lumina',           color:'light',   hero:'lumina',  style:'sky',   pow:24, rate:1.6, hp:170, heal:8, aurae:{regen:3},
   attack:'calls light of {pow} on an enemy and heals you 8', aura:'you heal 3 a second'},
  {id:'hero_solaris',name:'Solaris, Dawn Archer',  color:'light',   hero:'solaris', style:'multi', n:5, pow:12, rate:1.4, hp:140, aurae:{dmg:.2},
   attack:'rains 5 sun arrows of {pow}',                   aura:'your cards and wand deal +20%'},
  {id:'hero_oracle',name:'The Oracle',             color:'light',   hero:'oracle',  style:'row',   pow:22, rate:1.5, hp:150, aurae:{gauge:1.4},
   attack:'fires a ray of {pow} down its row',             aura:'your Custom gauge fills 40% faster'},
  {id:'hero_morrow',name:'Morrow the Lich',        color:'shadow',  hero:'morrow',  style:'burst', pow:20, rate:1.5, hp:160, curse:3, aurae:{drain:.15},
   attack:'bursts grave frost of {pow} that curses',       aura:'you heal 15% of all damage you deal'},
  {id:'hero_vex',   name:'Vex, the Night Blade',   color:'shadow',  hero:'vex',     style:'arc',   pow:40, rate:1.4, hp:130, aurae:{crit:.2},
   attack:'strikes from the dark for {pow}',               aura:'your hits have a 20% chance to deal double'},
  {id:'hero_jester',name:'The Hollow Jester',      color:'shadow',  hero:'jester',  style:'multi', n:3, pow:18, rate:1.4, hp:140, confuse:2, aurae:{dodge:.15},
   attack:'tosses 3 trick knives of {pow} that confuse',   aura:'you dodge 15% of hits'},
].map(h=>Object.assign({type:'hero', rank:7, rarity:'hero', turns:3},h));
// Signature cards spread over 1-12 as well: damage cards take the odd ranks, the rest the even ones.
SIGNATURE.forEach(c=>{ c.rank=c.rank*2-(c.type==='strike'||c.type==='lob'?1:0); });
/* Potions: four gray cards you can put in any deck. Added after the heroes so ids stay put. */
const POTIONS=[
  {id:'potion_heal',  name:'Healing Draught',   type:'boon',    boon:'heal',  amt:40,          rank:3, rarity:'common'},
  {id:'potion_tonic', name:'Iron Tonic',        type:'ward',    ward:'barrier', amt:40, turns:2, rank:5, rarity:'common'},
  {id:'potion_elixir',name:'Quicksilver Elixir',type:'boon',    boon:'haste', dur:10,          rank:7, rarity:'uncommon'},
  {id:'potion_wind',  name:'Second Wind',       type:'utility', util:'draw',  n:2,             rank:9, rarity:'uncommon'},
].map(c=>Object.assign({color:'gray', potion:true},c));
/* The Brood (verdant): each card summons a little creature that pounces on the nearest enemy.
   Queue 2 Brood cards for a Pack (each brings two, +25%), 3 for a Swarm (two each, +50%, and a
   Bramble Ogre leads them), and 4 (with the Rune Surge slot) to fuse them into the Elder Grovebeast,
   a hero that fights for 3 turns. Brood cards carry the wild rune, so they queue with anything. */
const BROOD=[
  {id:'brood_imp',   name:'Sprout Imp',     color:'verdant', type:'summon', ai:'critter', brood:1, rank:1, rarity:'common',   pow:8,  hp:30, rate:.9, dur:20},
  {id:'brood_snake', name:'Thorn Serpent',  color:'verdant', type:'summon', ai:'critter', brood:1, rank:2, rarity:'common',   pow:9,  hp:26, rate:1,  dur:20, poison:2},
  {id:'brood_hawk',  name:'Moss Hawk',      color:'verdant', type:'summon', ai:'critter', brood:1, rank:3, rarity:'uncommon', pow:9,  hp:22, rate:.7, dur:20},
];
const BROOD_LEADER={id:'brood_ogre', name:'Bramble Ogre', color:'verdant', type:'summon', ai:'critter', rank:4, rarity:'rare', pow:22, hp:70, rate:1.2, turns:2, slow:1};
const GROVEBEAST={id:'hero_grovebeast', name:'Elder Grovebeast', color:'verdant', type:'hero', hero:'grovebeast', style:'burst', rank:7, rarity:'hero', turns:3,
  pow:34, rate:1.4, hp:300, poison:4, aurae:{regen:3}, attack:'stamps thorns of {pow} around an enemy', aura:'you heal 3 a second, and it calls two Sprout Imps'};
const CARD_LIST=SIGNATURE.concat(generateCards(),HEROES,POTIONS,BROOD);
/* Nothing a card puts on the board lasts forever: shields, walls, towers, summons, machines,
   traps and changed ground each have HP (or a strength) and a turn limit. A turn ends each time
   the Custom screen opens. Applied after generation, so card ids are unchanged. */
function boardTurns(c){
  const k=c.type==='piece'?c.base:c.type, big=c.rarity==='rare'||c.rarity==='legendary';
  if(k==='ward') c.turns=big?3:2;
  else if(k==='sentry'){ c.turns=Math.max(1,Math.round(c.dur/7)); c.hp=40; delete c.dur; }
  else if(k==='summon'||(k==='machine'&&c.ai!=='bulwark')){ c.turns=Math.max(1,Math.round(c.dur/10)); delete c.dur; }
  else if(k==='machine') c.turns=3;
  else if(k==='trap') c.turns=2;
  else if(k==='environment'&&c.dur){ c.turns=c.dur>=10?2:1; delete c.dur; }
}
CARD_LIST.forEach(boardTurns);

/* Rune codes (Battle Network style). Every card carries a rune, A to F, or the rare wild ✱.
   The cards you queue in one turn must share a rune or a name (✱ fits any rune), so a combo
   takes a deck built around a few runes. Signature cards are grouped by hand: each color
   uses three runes, a starter deck's two colors use all six, and each color has one rune
   whose three cards make a Straight (Fire: Cinder Lance 3, Ember Wall 4, Flame Fan 5).
   Heroes are wild. */
const RUNES=['A','B','C','D','E','F'], WILD='✱';
const SIG_RUNES={
  A:['cinder_lance','ember_wall','flame_fan', 'frost_ward','hail_lob','rime_wall','glacial_veil', 'mend','briar_bomb','bramble_wall'],
  B:['ember_dart','fire_pot','kindle', 'ice_shard','frost_lance','icicle_spire', 'thorn_dart','vine_lash','regrowth'],
  C:['brazier','blaze_bolt','meteor', 'absolute_zero', 'bark_skin','spore_pod','world_tree'],
  D:['static_ward','ball_light','tailwind', 'blessing','judgment','sanctuary', 'grave_pit','wraith_totem','blood_lance'],
  E:['thunder_row','coil_sentry','spark', 'holy_bolt','radiant_motes','beacon_hope', 'hex_bolt','soul_drain','bone_wall'],
  F:['chain_light','stormcall', 'courage','intervention','dawnbreaker', 'dark_pact','eclipse'],
};
{ const sig={}; for(const k in SIG_RUNES) SIG_RUNES[k].forEach(id=>sig[id]=k);
  for(const c of CARD_LIST){
    if(c.rarity==='hero'||c.brood) c.code=WILD;
    else if(sig[c.id]) c.code=sig[c.id];
    else { const h=seedOf('rune:'+c.id); c.code=h%33===0?WILD:RUNES[h%6]; } } }

/* Recipes (Program Advance style): queue exactly these cards, in any order, and they fuse into
   one stronger card. Recipes ignore runes. Four-card recipes need the 4th slot (Rune Surge).
   Each recipe also needs one 'key' card you have to find: a generated card picked from the
   collection by `key` (color, type, rarity), so a starter deck alone never makes one.
   The fused card is not collected; it exists only for the cast. */
const RECIPES=[
  {id:'r_inferno',  name:'Inferno Lance',   cards:['ember_dart','cinder_lance'],      key:{color:'fire',type:'strike',rarity:'rare'}, card:{color:'fire',   type:'strike', pow:150, shape:'row', burn:6}},
  {id:'r_firestorm',name:'Firestorm',       cards:['fire_pot','flame_fan'],               key:{color:'fire',type:'lob',rarity:'uncommon'}, card:{color:'fire',   type:'lob',    pow:110, pattern:'cross', burn:5}},
  {id:'r_glacier',  name:'Glacier',         cards:['ice_shard','frost_lance'],         key:{color:'frost',type:'ward',rarity:'uncommon'}, card:{color:'frost',  type:'strike', pow:60,  shape:'all', freeze:3}},
  {id:'r_fortress', name:'Frozen Fortress', cards:['rime_wall','frost_ward'],       key:{color:'frost',type:'boon',rarity:'rare'}, card:{color:'frost',  type:'ward',   ward:'barrier', amt:150, turns:3}},
  {id:'r_thunder',  name:'Thunderhead',     cards:['spark','thunder_row'],           key:{color:'storm',type:'strike',rarity:'rare'}, card:{color:'storm',  type:'strike', pow:70,  shape:'all', stun:2}},
  {id:'r_coil',     name:'Tempest Coil',    cards:['coil_sentry','static_ward'],        key:{color:'storm',type:'sentry',rarity:'uncommon'}, card:{color:'storm',  type:'sentry', pow:18,  rate:.4, hp:120, turns:3}},
  {id:'r_overgrow', name:'Overgrowth',      cards:['thorn_dart','vine_lash'],         key:{color:'verdant',type:'lob',rarity:'uncommon'}, card:{color:'verdant',type:'strike', pow:90,  shape:'wedge', poison:12, slow:4}},
  {id:'r_grove',    name:'Ancient Grove',   cards:['mend','regrowth'],                 key:{color:'verdant',type:'boon',rarity:'rare'}, card:{color:'verdant',type:'boon',   boon:'heal', amt:100}},
  {id:'r_holylance',name:'Choir of Light',  cards:['holy_bolt','radiant_motes'],        key:{color:'light',type:'lob',rarity:'uncommon'}, card:{color:'light',  type:'strike', pow:22,  shape:'missiles', n:8, mend:3}},
  {id:'r_sanctum',  name:'Sanctum',         cards:['sanctuary','blessing'],              key:{color:'light',type:'ward',rarity:'rare'}, card:{color:'light',  type:'boon',   boon:'courage', dur:16}},
  {id:'r_harvest',  name:'Soul Harvest',    cards:['hex_bolt','soul_drain'],           key:{color:'shadow',type:'lob',rarity:'uncommon'}, card:{color:'shadow', type:'strike', pow:60,  shape:'all', drain:.5, curse:6}},
  {id:'r_citadel',  name:'Bone Citadel',    cards:['bone_wall','wraith_totem'],        key:{color:'shadow',type:'sentry',rarity:'rare'}, card:{color:'shadow', type:'ward',   ward:'thorns', n:4, hp:90, thorns:15, turns:3}},
  {id:'r_embers',   name:'Storm of Embers', cards:['ember_dart','spark'],             key:{color:'gray',type:'summon',rarity:'rare'}, card:{color:'storm',  type:'lob',    pow:100, pattern:'burst', burn:4, stun:1}},
  {id:'r_dawnfrost',name:'Dawnfrost',       cards:['ice_shard','holy_bolt'],           key:{color:'brown',type:'machine',rarity:'rare'}, card:{color:'light',  type:'strike', pow:90,  shape:'row', freeze:2, mend:6}},
  {id:'r_rot',      name:'Rot Bloom',       cards:['thorn_dart','hex_bolt'],           key:{color:'gray',type:'summon',rarity:'uncommon'}, card:{color:'shadow', type:'lob',    pow:90,  pattern:'burst', poison:10, curse:5}},
  {id:'r_sunforge', name:'Sun Forge',       cards:['ember_dart','cinder_lance','meteor'],        key:{color:'fire',type:'lob',rarity:'legendary'}, card:{color:'fire',   type:'lob',    pow:300, pattern:'burst', burn:8, delay:1}},
  {id:'r_winter',   name:'Absolute Winter', cards:['ice_shard','frost_lance','absolute_zero'],   key:{color:'frost',type:'lob',rarity:'legendary'}, card:{color:'frost',  type:'strike', pow:120, shape:'all', freeze:5}},
  {id:'r_skyfall',  name:'Skyfall',         cards:['spark','thunder_row','stormcall'],         key:{color:'storm',type:'lob',rarity:'legendary'}, card:{color:'storm',  type:'strike', pow:140, shape:'all', stun:3}},
  {id:'r_heart',    name:"World's Heart",   cards:['mend','regrowth','world_tree'],             key:{color:'verdant',type:'boon',rarity:'legendary'}, card:{color:'verdant',type:'boon',   boon:'heal', amt:220}},
  {id:'r_dawn',     name:'Final Dawn',      cards:['holy_bolt','courage','dawnbreaker'],         key:{color:'light',type:'strike',rarity:'legendary'}, card:{color:'light',  type:'strike', pow:160, shape:'all', mend:20}},
  {id:'r_night',    name:'Endless Night',   cards:['hex_bolt','soul_drain','eclipse'],        key:{color:'shadow',type:'strike',rarity:'legendary'}, card:{color:'shadow', type:'strike', pow:170, shape:'all', drain:.5, curse:8}},
];
RECIPES.forEach((r,i)=>{
  const base=CARD_LIST.filter(c=>!SIGNATURE.includes(c)&&!c.potion&&c.rarity!=='hero'&&c.color===r.key.color), kind=c=>c.type==='piece'?c.base:c.type;
  let pool=base.filter(c=>kind(c)===r.key.type&&c.rarity===r.key.rarity); if(!pool.length) pool=base.filter(c=>c.rarity===r.key.rarity); if(!pool.length) pool=base;
  const taken=new Set(RECIPES.slice(0,i).map(x=>x.keyId)); r.keyId=(pool.find(c=>!taken.has(c.id))||pool[0]).id;
  r.cards.push(r.keyId);
  r.card=Object.assign({id:r.id, name:r.name, rank:12, rarity:'legendary', code:WILD, recipe:true},r.card); });
const CARDS={}; CARD_LIST.forEach(c=>CARDS[c.id]=c);

/* What a card is for, at a glance (shown on loaded cards while you fight):
   attack = damages enemies, defense = shields, walls and healing, turret = towers, summons,
   machines and heroes that act on their own, status = buffs, debuffs, ground and card tricks. */
const ROLES={attack:{name:'Attack',icon:'⚔',c:'#ff5d6c'}, defense:{name:'Defense',icon:'🛡',c:'#7fd4ff'}, turret:{name:'Turret',icon:'♜',c:'#39ff8a'}, status:{name:'Status',icon:'✦',c:'#f2c94c'}};
function cardRole(c){ const k=c.type==='piece'?c.base:c.type;
  if(['strike','lob','charge','trap'].includes(k)) return 'attack';
  if(['sentry','summon','machine','hero'].includes(k)) return c.ai==='bulwark'?'defense':'turret';
  if(k==='ward') return 'defense';
  if(k==='boon') return ['heal','regen','dodge','phase','intervene'].includes(c.boon)?'defense':'status';
  if(k==='utility') return c.util==='cleanse'?'defense':'status';
  return 'status'; }

// One-line rules text built from the data, so new cards need no hand-written text.
const PATTERN_TEXT={single:'', burst:' and around it', ring:' in a ring around it', cross:' in a cross', column:' down its column', row:' along its row'};
const AREA_TEXT={burst:' on the tile you aim and around it', cross:' in a cross on the tile you aim', column:" down the aimed tile's column", row:" along the aimed tile's row"};
const lobPattern=c=>c.pattern||(c.radius?'burst':'single');
const tn=n=>n+' turn'+(n>1?'s':'');
function cardText(c){
  const kw=[];
  if(c.burn) kw.push('Burn '+c.burn+'s'); if(c.freeze) kw.push('Freeze '+c.freeze+'s'); if(c.stun) kw.push('Stun '+c.stun+'s');
  if(c.slow) kw.push('Slow '+c.slow+'s'); if(c.poison) kw.push('Poison '+c.poison); if(c.curse) kw.push('Curse '+c.curse+'s');
  if(c.drain) kw.push('Drain '+Math.round(c.drain*100)+'%'); if(c.mend) kw.push('Mend '+c.mend); if(c.valor) kw.push('Valor');
  if(c.confuse) kw.push('Confuse '+c.confuse+'s'); if(c.push) kw.push('Knockback'); if(c.pull) kw.push('Pull');
  if(c.self) kw.push('Costs '+c.self+' HP');
  let t='';
  const kind=c.type==='piece'?c.base:c.type;
  if(kind==='strike') t={line:c.pow+' to the first enemy in your row', row:c.pow+' to every enemy in your row', wedge:c.pow+' in a short cone ahead',
                         all:c.pow+' to every enemy', missiles:c.n+' missiles of '+c.pow+' at random enemies',
                         dig:c.pow+' tunnelling under walls and shields to the first enemy in your row', zigzag:c.pow+' zigzagging between your row and the next',
                         diag:c.pow+' in two diagonal bolts'}[c.shape];
  else if(kind==='lob') t=c.pow+' on the tile you aim'+PATTERN_TEXT[lobPattern(c)]+', over blockers';
  else if(kind==='trap') t={spike:'Spike trap: '+c.pow, snare:'Snare: '+c.pow+' and roots', blast:'Blast trap: '+c.pow+' to it and around it'}[c.trap]+' when an enemy steps on the tile you aim; '+tn(c.turns);
  else if(kind==='environment') t={burn:'Sets the ground burning', freeze:'Ices the ground, halving enemy speed,', bramble:'Grows brambles that deal '+c.pow+' per step',
                                   tremor:'Tremor deals '+c.pow}[c.env]+AREA_TEXT[c.pattern]+(c.turns?' for '+tn(c.turns):'');
  else if(kind==='ward') t=c.ward==='barrier'?'Shield of '+c.amt+' for '+tn(c.turns)+'; replaces your current shield':c.n+' walls of '+c.hp+' HP'+(c.ward==='thorns'?' that hit back for '+c.thorns:'')+', '+tn(c.turns);
  else if(kind==='sentry') t='Tower: '+c.pow+' every '+c.rate+'s, '+c.hp+' HP, '+tn(c.turns);
  else if(kind==='boon') t={power:'Wand ×2.5 for '+c.dur+'s', pact:'Cards and wand +30% for '+c.dur+'s', haste:'Faster moves and casts for '+c.dur+'s',
                           dodge:'Dodge the next hit', phase:'Untouchable for '+c.dur+'s', regen:'Heal '+c.amt+'/s for '+c.dur+'s', heal:'Heal '+c.amt,
                           gauge:'Fill '+Math.round(c.amt*100)+'% of the Custom gauge', courage:'Cards and wand +30% for '+c.dur+'s, no HP cost',
                           intervene:'The next hit that would defeat you leaves you standing and heals '+c.amt}[c.boon];
  else if(kind==='charge') t=c.uses+' uses: '+(c.fx==='lob'?'lob '+c.pow+' on the tile you aim':'bolt of '+c.pow+' down your row');
  else if(kind==='utility') t={draw:'Draw '+c.n+' card'+(c.n>1?'s':'')+' into your hand', recall:'Put the top card of your deck into your queue',
                              copy:'Copy the next queued card', cleanse:'Cancel incoming attacks and heal '+c.amt}[c.util];
  else if(kind==='summon') t={critter:'Pounces on the nearest enemy for '+c.pow+' every '+c.rate+'s. Brood: 2 queued = Pack, 3 = Swarm, 4 = Elder Grovebeast', shooter:'Shoots '+c.pow+' down its row', bomber:'Lobs '+c.pow+' every '+c.rate+'s', healer:'Heals you '+c.amt+' every '+c.rate+'s',
                             guardian:'Blocks with '+c.hp+' HP, hits for '+c.pow}[c.ai]+'. '+(c.ai==='guardian'?'':c.hp+' HP, ')+tn(c.turns);
  else if(kind==='machine') t=c.ai==='bulwark'?c.n+' iron wall'+(c.n>1?'s':'')+' of '+c.hp+' HP, '+tn(c.turns):
                              {turret:'Turret: '+c.pow+' every '+c.rate+'s', repeater:'Repeater: '+c.pow+' every '+c.rate+'s', mortar:'Mortar: lobs '+c.pow+' every '+c.rate+'s'}[c.ai]+', '+c.hp+' HP, '+tn(c.turns);
  else if(kind==='hero') t='Calls '+c.name.split(',')[0]+' for '+tn(c.turns)+' ('+c.hp+' HP), who '+c.attack.replace('{pow}',c.pow)+'. While it stands, '+c.aura;
  if(c.piece) t='Legendary piece. '+t;
  return t+(kw.length?'. '+kw.join(', '):'');
}

// Premade decks: two colors, legendary x1 and everything else x4, then the highest-rank
// cards lose copies (never below 2) until the deck fits.
const STARTERS=[
  {id:'burn_storm', name:'Burn Rush',   colors:['fire','storm'],    text:'Fast damage and stuns. End fights before the enemy acts.'},
  {id:'frost_light',name:'Hold the Line', colors:['frost','light'],  text:'Freeze, shield and heal. Cancel attacks and outlast.'},
  {id:'verd_shadow',name:'Bulwark Drain',colors:['verdant','shadow'],text:'Walls, poison and drain. Outlast the enemy.'},
];
function starterList(colors,size){
  size=size||60;
  const count={};
  for(const col of colors) for(const c of SIGNATURE.concat(BROOD)) if(c.color===col) count[c.id]=c.rarity==='legendary'?1:c.brood?3:4;
  let total=Object.values(count).reduce((a,b)=>a+b,0);
  while(total>size){
    const cut=Object.keys(count).filter(id=>CARDS[id].rarity!=='legendary'&&count[id]>2).sort((a,b)=>CARDS[b].rank-CARDS[a].rank||count[b]-count[a])[0];
    if(!cut) break; count[cut]--; total--;
  }
  const list=[]; for(const id in count) for(let i=0;i<count[id];i++) list.push(id);
  return list;
}

if(typeof module!=='undefined') module.exports={BROOD,GROVEBEAST,BROOD_LEADER,ROLES,cardRole,RUNES,WILD,RECIPES,POTIONS,HEROES,PATTERN_MULT,lobPattern,SIX,SIGNATURE,TYPE_PLAN,RARITY_PLAN,COLORS,BEATS,WEAK_MULT,colorMult,TYPES,RARITY,CARD_LIST,CARDS,cardText,STARTERS,starterList};
