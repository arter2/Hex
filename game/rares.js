/* Hexmancers — rare foes. Past floor 4, now and then (about 1 fight in 30, a little more often
   deeper) an encounter is a single rare foe instead: tougher than a miniboss, short of a boss, with
   a gold shimmer, a ★ over it in the dungeon, a trait of its own, and great loot when it falls:
   a rare card, a second rare that is often legendary, boss-grade gear, a sealed pack, shards and
   triple gold. One of them, the Gilded Scarab, runs off with its loot if you are too slow.
   They keep their own element (no elemental versions). */

Object.assign(ENEMY_DEFS,{
  gildscarab:  {name:'★ Gilded Scarab',    color:'light',   hp:700, dmg:16, rate:[2.4,3.2], moves:['cross','coins','shot'],      ai:'wander', rare:'flee',   look:'beetle', tint:'#d4a017', scale:1.3},
  prismram:    {name:'★ Prism Ram',        color:'storm',   hp:900, dmg:21, rate:[3,3.8],   moves:['rush','quake','shot'],       ai:'align',  rare:'ward',   look:'ram',    tint:'#b48cff', scale:1.35},
  voidlantern: {name:'★ Void Lantern',     color:'shadow',  hp:760, dmg:19, rate:[2.4,3.2], moves:['blink','firebomb','beam'],   ai:'wander', rare:'blink',  look:'wisp',   tint:'#5a2a8a', scale:1.35},
  rimematron:  {name:'★ Rimeborn Matron',  color:'frost',   hp:820, dmg:18, rate:[2.8,3.6], moves:['iceslam','shot','flask'],    ai:'back',   rare:'brood',  look:'witch',  tint:'#9fe3ff', scale:1.3},
  cinderchamp: {name:'★ Cinder Champion',  color:'fire',    hp:880, dmg:22, rate:[2.8,3.6], moves:['cleave','firebomb','lunge'], ai:'align',  rare:'enrage', look:'knight', tint:'#ff6a3d', scale:1.35},
  mossback:    {name:'★ Old Mossback',     color:'verdant', hp:1000,dmg:17, rate:[3,4],     moves:['shot','flask','quake'],      ai:'wander', rare:'regen',  look:'gloop',  tint:'#2f6b2a', scale:1.6},
});
const RARE_IDS=['gildscarab','prismram','voidlantern','rimematron','cinderchamp','mossback'];
const RARE_TRAIT={flee:'Runs off with its loot after a while', ward:'Shields itself every 10 s', blink:'Vanishes and reappears when hit hard',
  brood:'Calls frost mites at half health', enrage:'Enrages at 40% health', regen:'Regrows 1% of its health every second'};
const RARE_FLEE_T=30;
// how often an encounter is a rare foe: none to floor 4, then 3% rising to 5%
const rareChance=d=>d<=4?0:Math.min(.05,.03+.0015*(d-5));
const isRare=id=>!!(ENEMY_DEFS[id]&&ENEMY_DEFS[id].rare);
function rollRareEncounter(depth){ return Math.random()<rareChance(depth)?[[pick(RARE_IDS)]]:null; }

// every frame of a fight: shimmer, the trait, and the first sight of it
function rareTick(dt){ const b=B; if(!b||b.phase!=='fight') return;
  for(const e of b.enemies){ const d=e.def; if(!d.rare||e.hp<=0) continue;
    if(!e.rareSeen){ e.rareSeen=true; e.rareT=0; if(typeof banner==='function') banner('★ A rare foe!','#ffd166'); if(typeof tip==='function') tip('★ '+d.name.slice(2)+': '+RARE_TRAIT[d.rare]+'. Beat it for great loot.',5000); }
    e.rareT+=dt; e.shT=(e.shT||0)+dt;
    if(e.shT>.18){ e.shT=0; spray(e.tile,1,{shape:'glow',color:['#ffd166','#fff3b0'],v0:.4,v:1.2,up0:1,up:2.5,g:-1,drag:1,life:.8,s:3,add:true,shrink:1}); }
    if(d.rare==='flee'){ const left=RARE_FLEE_T-e.rareT, s=Math.ceil(left);
      if(s<=10&&s!==e.fleeS&&s>0){ e.fleeS=s; floater('escaping in '+s,e.tile,'#ffd166'); }
      if(left<=0){ e.fled=true; e.hp=0; e.deathT=.5; if(e.tile.occ===e) e.tile.occ=null; cancelAttack(e); burst(e.tile,'#ffd166',30,1); floater('It got away!',e.tile,'#ffd166',true); b.rareFled=true; } }
    if(d.rare==='ward'){ e.wardT=(e.wardT||0)+dt; if(e.wardT>=10){ e.wardT=0; e.barrier=Math.max(e.barrier||0,Math.round(e.maxHp*.12)); floater('shield!',e.tile,'#c9b6ff'); ring(e.tile,'#c9b6ff',1.2,.4,5); } }
    if(d.rare==='regen'){ e.regAcc=(e.regAcc||0)+dt; if(e.regAcc>=1){ e.regAcc=0; if(e.hp<e.maxHp){ e.hp=Math.min(e.maxHp,e.hp+Math.round(e.maxHp*.01)); spray(e.tile,3,{shape:'glow',color:'#7dffa8',v0:.3,v:1,up0:.5,up:2,g:-1,drag:1,life:.6,s:3,add:true}); } } }
    if(d.rare==='brood'&&!e.brooded&&e.hp<=e.maxHp/2){ e.brooded=true; floater('Rise, little ones!',e.tile,'#9fe3ff',true);
      for(const t of around(e.tile).filter(t=>t.side==='e'&&!t.occ).slice(0,2)){ const m=makeEnemy('mite',t,b.depth); m.def={...m.def, minion:true}; m.atkT+=1.5; b.enemies.push(m); burst(t,'#9fe3ff',12,.5); } }
    if(d.rare==='enrage'&&!e.enraged&&e.hp<=e.maxHp*.4){ e.enraged=true; e.def={...d, rate:[d.rate[0]*.7,d.rate[1]*.7]}; floater('ENRAGED!',e.tile,'#ff6a3d',true); shake(6); burst(e.tile,'#ff6a3d',30,1); } } }
// a big hit makes the Void Lantern vanish and reappear elsewhere (battle.js calls this after a hit)
function rareHit(e,dmg){ if(!e||e.hp<=0||e.def.rare!=='blink'||dmg<e.maxHp*.06||(e.blinkCd||0)>B.time) return; e.blinkCd=B.time+3;
  const to=pick(E_TILES.filter(t=>!t.occ&&!t.terrain&&!(t.holeT>0))); if(!to) return; burst(e.tile,'#9b4dff',14,.6); e.tile.occ=null; e.tile=to; to.occ=e; burst(to,'#9b4dff',14,.6); floater('blinks',to,'#c49bff'); }

// the loot of a rare foe that fell (not one that got away): added to the battle's rewards
function rareLoot(b,rw){ const rares=b.enemies.filter(e=>e.def.rare&&!e.fled); if(!rares.length) return null;
  const d=b.depth, extra={cards:[rollCard({depth:d,min:'rare'}),rollCard({depth:d,min:Math.random()<.4?'legendary':'rare'})], gold:3*battleGold(d,false), items:[rollLoot(d,Math.random,true)], shards:40+4*d};
  rw.cards.push(...extra.cards); rw.gold+=extra.gold; rw.items.push(...extra.items); save.shards=(save.shards||0)+extra.shards; return extra; }
