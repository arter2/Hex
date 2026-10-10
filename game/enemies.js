/* Hexmancers deck prototype — enemies, encounters and terrain.
   Monsters have signature attacks; humanoids carry a small deck of real cards of their color
   and cast them back at you, announcing each one first. An encounter is one group that
   arrives in up to 3 waves, with no healing between them. */

const ENEMY_DEFS={
  // monsters
  gloop:    {name:'Gloop',        color:'verdant', hp:120, dmg:12, rate:[3,4.2],   moves:['shot'],            ai:'align', split:'gloopling'},
  gloopling:{name:'Gloopling',    color:'verdant', hp:36,  dmg:7,  rate:[2.6,3.6], moves:['shot'],            ai:'align', minion:true, scale:.7},
  wisp:     {name:'Cinder Wisp',  color:'fire',    hp:85,  dmg:10, rate:[2.4,3.2], moves:['shot','firebomb'], ai:'align'},
  mite:     {name:'Frost Mite',   color:'frost',   hp:95,  dmg:13, rate:[3,4],     moves:['iceslam'],         ai:'wander'},
  beetle:   {name:'Volt Beetle',  color:'storm',   hp:110, dmg:13, rate:[2.8,3.8], moves:['cross','shot'],    ai:'align'},
  ram:      {name:'Thunder Ram',  color:'storm',   hp:130, dmg:18, rate:[4,5],     moves:['rush'],            ai:'align'},
  shade:    {name:'Shade',        color:'shadow',  hp:100, dmg:15, rate:[3.2,4.2], moves:['blink'],           ai:'wander'},
  sprite:   {name:'Halo Sprite',  color:'light',   hp:80,  dmg:9,  rate:[2.6,3.4], moves:['mend','shot'],     ai:'back'},
  golem:    {name:'Radiant Golem',color:'light',   hp:300, dmg:22, rate:[3.4,4.4], moves:['quake','boulders'],ai:'wander', boss:true, scale:1.45},
  // humanoids: a basic shot plus a deck of 8 cards of their color
  cultist:  {name:'Ember Cultist',color:'fire',    hp:110, dmg:9,  rate:[3,4],     moves:['shot'], ai:'align', deck:true},
  witch:    {name:'Frost Witch',  color:'frost',   hp:105, dmg:9,  rate:[3,4],     moves:['shot'], ai:'back',  deck:true},
  caller:   {name:'Storm Caller', color:'storm',   hp:100, dmg:9,  rate:[2.8,3.6], moves:['shot'], ai:'align', deck:true},
  warden:   {name:'Grove Warden', color:'verdant', hp:125, dmg:9,  rate:[3.2,4.2], moves:['shot'], ai:'back',  deck:true},
  paladin:  {name:'Dawn Paladin', color:'light',   hp:130, dmg:10, rate:[3.2,4.2], moves:['shot'], ai:'align', deck:true},
  knight:   {name:'Hex Knight',   color:'shadow',  hp:115, dmg:10, rate:[3,4],     moves:['shot'], ai:'align', deck:true},
  // outlaws: ordinary people with steel instead of spells. No element of their own, so each has
  // its own weakness, and each fights its own way. They carry coin (more gold when you win).
  bandit:   {name:'Bandit',        color:'gray',  weak:'fire',    hp:105, dmg:14, rate:[2.6,3.4], moves:['lunge','shot'], ai:'align', outlaw:true},
  cutpurse: {name:'Cutpurse',      color:'gray',  weak:'light',   hp:80,  dmg:8,  rate:[2.4,3.2], moves:['steal','blink'], ai:'wander', outlaw:true},
  marksman: {name:'Crossbowman',   color:'brown', weak:'storm',   hp:90,  dmg:22, rate:[3.6,4.6], moves:['snipe'], ai:'back', outlaw:true},
  sellsword:{name:'Sellsword',     color:'brown', weak:'frost',   hp:170, dmg:16, rate:[3.4,4.4], moves:['guard','cleave'], ai:'align', outlaw:true},
  // spellfolk: humans who twist the fight rather than just hit
  darkwiz:  {name:'Dark Wizard',   color:'shadow',  hp:110, dmg:13, rate:[3,4],     moves:['hex','shot','summon'], ai:'back', spell:true},
  shifter:  {name:'Shapeshifter',  color:'gray', weak:'light', hp:120, dmg:12, rate:[2.8,3.8], moves:['shift'], ai:'wander', spell:true},
  collector:{name:'Card Collector',color:'brown', weak:'shadow', hp:115, dmg:10, rate:[2.8,3.6], moves:['collect','shot'], ai:'back', spell:true, collector:true},
  hedgewitch:{name:'Witch Healer', color:'verdant', hp:95,  dmg:9,  rate:[3,4],     moves:['brew','snare','mend'], ai:'back', spell:true},
  priest:   {name:'Priest',        color:'light',   hp:100, dmg:8,  rate:[3.2,4.2], moves:['revive','bless'], ai:'back', spell:true},
  bomber:   {name:'Powder Monkey', color:'gray',  weak:'verdant', hp:85,  dmg:15, rate:[3.2,4.2], moves:['bomb'], ai:'back', outlaw:true},
};
const WEAK_TO={}; for(const k in BEATS) WEAK_TO[BEATS[k]]=k;
const MONSTERS=['gloop','wisp','mite','beetle','ram','shade','sprite'];
const HUMANOIDS=['cultist','witch','caller','warden','paladin','knight'];
const OUTLAWS=['bandit','cutpurse','marksman','sellsword','bomber'];
const SPELLFOLK=['darkwiz','shifter','collector','hedgewitch','priest'];
const SHIFT_FORMS=['gloop','wisp','mite','beetle','ram','shade','sprite'];
const ENEMY_CARD_TYPES=['strike','lob','ward','sentry','boon','charge'];

/* ---------------- encounters ---------------- */
// Deeper fights: more waves, bigger waves, more humanoids. Half the enemies belong to the area's
// own color (frost mites and frost witches in the Frozen Deeps), the rest wander in from anywhere.
// The last floor of every area is its boss's (world.js).
function makeEncounter(depth){
  const waves=depth<=2?1:depth<=5?2:3, size=Math.min(4,2+(depth>=4?1:0)+(depth>=9?1:0));
  const human=Math.min(.6,depth<2?0:.15+.05*depth);
  const A=typeof areaOf==='function'?areaOf(depth):null;
  const one=list=>{ const home=A?list.filter(id=>ENEMY_DEFS[id].color===A.color):[]; return home.length&&Math.random()<.5?pick(home):pick(list); };
  const out=[];
  // an outlaw gang: a wave of outlaws (from depth 1), otherwise monsters with casters mixed in
  for(let w=0;w<waves;w++){ if(Math.random()<(depth<2?.2:.25)){ out.push(Array.from({length:size},()=>pick(OUTLAWS))); continue; }
    out.push(Array.from({length:size},()=>one(Math.random()<human?(Math.random()<.45?SPELLFOLK:HUMANOIDS):MONSTERS))); }
  const boss=typeof isBossDepth==='function'?isBossDepth(depth):depth%4===0;
  if(boss) out[out.length-1]=[typeof bossFor==='function'?bossFor(depth):'golem'].concat(depth>=8?[one(MONSTERS)]:[]);   // a boss and its helpers carry the fight
  return out;
}
function enemyDeck(color,depth){
  const rar=depth<5?['common','uncommon']:depth<10?['common','uncommon','rare']:['uncommon','rare','legendary'];
  const pool=CARD_LIST.filter(c=>c.color===color&&ENEMY_CARD_TYPES.includes(c.type)&&rar.includes(c.rarity));
  return Array.from({length:8},()=>pick(pool));
}
function makeEnemy(id,t,depth){
  const d=ENEMY_DEFS[id], hs=1+.13*(depth-1), ds=1+.1*(depth-1);
  const e={kind:'enemy', id, def:d, name:d.name, color:d.color, hp:Math.round(d.hp*hs), maxHp:Math.round(d.hp*hs), dmg:Math.round(d.dmg*ds), ds,
           tile:t, atkT:rnd(1.8,3.2), moveT:rnd(.8,1.8), windT:0, burnT:0, burnAcc:0, freezeT:0, stunT:0, slowT:0, poisonT:0, poisonAmt:0, curseT:0, hitT:0,
           barrier:0, powerT:0, castT:0, casting:null, weak:d.weak||null, nextMove:pick(d.moves), deck:d.deck?enemyDeck(d.color,depth):null, deckCd:rnd(3,5)};
  if(d.collector) e.deck=[];   // a Card Collector's deck is whatever it takes from you
  t.occ=e; return e;
}
const openEnemyTiles=()=>E_TILES.filter(t=>!t.occ&&t.terrain!=='lava');
function spawnWave(i){
  const b=B; b.wave=i;
  const ids=b.waves[i], rows=Array.from({length:BOARD_ROWS},(_,r)=>r).sort(()=>Math.random()-.5);
  ids.forEach((id,k)=>{ const free=openEnemyTiles(), back=free.filter(t=>t.r===rows[k%BOARD_ROWS]&&t.col>=BOARD_COLS/2+1);
    const t=pick(back.length?back:free); if(!t) return; const e=makeEnemy(id,t,b.depth); b.enemies.push(e); burst(t,COLORS[e.color].c,16); });
  if(i>0){ floater('Wave '+(i+1)+' of '+b.waves.length,b.player.tile,'#ffe24d',true); b.hooks.onWave&&b.hooks.onWave(i); }
}

/* ---------------- terrain ---------------- */
// Rocks block moves and shots on both sides; lava burns whoever stands on it; ice doubles move time.
function makeTerrain(depth){
  if(depth<2) return;
  const avoid=t=>t.occ||t.col===0||t.col===BOARD_COLS-1;
  const place=(side,n,kind)=>{ for(let i=0;i<n;i++){ const t=pick((side==='p'?P_TILES:E_TILES).filter(x=>!avoid(x)&&!x.terrain)); if(!t) return;
    t.terrain=kind; if(kind==='rock') t.occ={kind:'rock',tile:t,hp:ROCK_HP,maxHp:ROCK_HP}; } };
  place('p',rnd(1,2.99)|0,'rock'); place('e',rnd(1,2.99)|0,'rock');
  if(depth>=3){ const k=pick(['lava','ice']); place('p',1+(depth>=7?1:0),k); place('e',1,k==='lava'?'ice':'lava'); }
}
const burning=t=>t.terrain==='lava'||t.burnT>0||t.holeT>0;
const icy=t=>t.terrain==='ice'||t.iceT>0;
function dropRock(t,sec){ if(t.occ) return; t.terrain='rock'; t.rockT=sec; t.occ={kind:'rock',tile:t,hp:ROCK_HP*.6,maxHp:ROCK_HP*.6}; burst(t,'#8a8398',14,.4); }
// Rocks are cover, not walls forever: shots chip them, and at 0 they crumble.
const ROCK_HP=30;
function hitRock(r,dmg){ r.hp-=dmg; flash(r.tile,'#8a8398',.5); burst(r.tile,'#8a8398',4,.4);
  if(r.hp<=0){ const t=r.tile; if(t.occ===r) t.occ=null; t.terrain=null; t.rockT=0; burst(t,'#b8b4c4',16,.6); floater('crumbles',t,'#b8b4c4'); } }
function updateTerrain(dt){
  for(const t of TILES){
    if(t.burnT>0) t.burnT-=dt; if(t.iceT>0) t.iceT-=dt; if(t.thornT>0) t.thornT-=dt; if(t.holeT>0) t.holeT-=dt; if(t.gT>0) t.gT-=dt; if(t.zapT>0) t.zapT-=dt; if(t.voidT>0) t.voidT-=dt;
    if(t.rockT>0){ t.rockT-=dt; if(t.rockT<=0){ t.rockT=0; if(t.occ&&t.occ.kind==='rock') t.occ=null; t.terrain=null; } }
  }
  const p=B.player;
  if(burning(p.tile)&&p.invT<=0){ p.burnAcc=(p.burnAcc||0)+dt; if(p.burnAcc>=.5){ p.burnAcc=0; hitPlayer(3); } } else p.burnAcc=0;
  for(const e of alive()) groundTick(e,dt);
  for(const e of alive()) if(burning(e.tile)){ e.lavaAcc=(e.lavaAcc||0)+dt; if(e.lavaAcc>=.5){ e.lavaAcc=0; hitEnemy(e,3,null,{raw:true}); } }
}

/* ---------------- enemy turns ---------------- */
function tele(e,tiles,dur,dmg,after){ tiles=tiles.filter(Boolean);
  if(e&&e.confuseT>0) tiles=tiles.map(t=>pick(neighbors(t).filter(x=>x.side==='p'))||t);   // confusion throws attacks off by a tile
  B.teles.push({tiles,t:0,dur,dmg,owner:e,after}); }
const pTilesInRow=r=>P_TILES.filter(t=>t.r===r);
function stepEnemy(e,to){ e.tile.occ=null; e.tile=to; to.occ=e; if(e.poisonT>0) hitEnemy(e,e.poisonAmt,null,{raw:true});
  if(to.thornT>0&&e.hp>0) hitEnemy(e,to.thornPow,null,{raw:true});
  if(to.trap&&e.hp>0) springTrap(to,e); }
function moveEnemy(e){
  if(e.def.ai==='still'||e.under) return;
  const p=B.player, opts=neighbors(e.tile).filter(t=>t.side==='e'&&!t.occ&&!burning(t));
  if(!opts.length) return;
  // step out of your row when you are charging the wand
  if(p.charging&&e.tile.r===p.tile.r&&Math.random()<.5){ const off=opts.filter(t=>t.r!==p.tile.r); if(off.length) return stepEnemy(e,pick(off)); }
  // enemies want a line of fire: they avoid standing behind a rock or their own wall
  const open=t=>!lineTiles(t,DIRS.W).some(x=>x.side==='e'&&x.occ&&(x.occ.kind==='rock'||x.occ.enemy));
  const good=opts.filter(open), pool=good.length?good:opts;
  let to=null;
  if(e.def.ai==='align'&&e.tile.r!==p.tile.r&&Math.random()<.75){ const d=Math.sign(p.tile.r-e.tile.r); to=pick(pool.filter(t=>Math.sign(t.r-e.tile.r)===d)); }
  // back-liners keep their distance early on, then press in once the fight drags (from turn 3)
  else if(e.def.ai==='back') to=pick(pool.filter(t=>(B.turn||0)<2&&Math.random()<.6?t.col>=e.tile.col:t.col<=e.tile.col));
  else if((B.turn||0)>=3&&Math.random()<.4) to=pick(pool.filter(t=>t.col<e.tile.col));
  stepEnemy(e,to||pick(pool));
}
// a confused enemy fires from the row next to its own
function enemyShot(e,dmg){ const from=e.confuseT>0&&pick([tileCR(e.tile.col,e.tile.r-1),tileCR(e.tile.col,e.tile.r+1)].filter(Boolean))||e.tile;
  shoot(from,lineTiles(from,DIRS.W),{dmg:Math.round(dmg),from:'e',owner:e,color:COLORS[e.color].c}); }
const MOVES={
  shot(e){ e.windT=.7; },
  firebomb(e){ const t=B.player.tile; tele(e,[t],1,e.dmg,()=>{ t.burnT=5; burst(t,'#ff6a3d',14,.3); }); },
  iceslam(e){ const t=B.player.tile, n=pick(neighbors(t).filter(x=>x.side==='p')); tele(e,[t,n],1,e.dmg,()=>[t,n].forEach(x=>x&&(x.iceT=6))); },
  cross(e){ const t=B.player.tile; tele(e,P_TILES.filter(x=>x.r===t.r||(x.col===t.col&&Math.abs(x.r-t.r)<=2)),1.1,e.dmg); },
  rush(e){ tele(e,pTilesInRow(e.tile.r),1.1,e.dmg); },
  blink(e){ const p=B.player, to=pick(E_TILES.filter(t=>!t.occ&&!burning(t)&&t.col<=BOARD_COLS/2+1&&Math.abs(t.r-p.tile.r)<=1));
    if(to){ burst(e.tile,'#e0588f',10); stepEnemy(e,to); burst(to,'#e0588f',10); }
    tele(e,[p.tile].concat(neighbors(p.tile).filter(t=>t.side==='p'&&t.col>=p.tile.col)),.85,e.dmg); },
  // Bandit: closes to the front of its side and slashes your tile and the ones beside it
  lunge(e){ const p=B.player, to=E_TILES.filter(t=>!t.occ&&!burning(t)&&Math.abs(t.r-p.tile.r)<=1).sort((a,b)=>a.col-b.col)[0];
    if(to&&to.col<e.tile.col){ stepEnemy(e,to); burst(to,'#b4b8c8',8,.4); }
    tele(e,[p.tile].concat(neighbors(p.tile).filter(t=>t.side==='p'&&t.r!==p.tile.r)),.8,e.dmg); },
  // Cutpurse: grabs at you; if it lands it steals the next card in your queue. Kill it to get it back.
  steal(e){ const t=B.player.tile; tele(e,[t],.9,Math.round(e.dmg*.6),()=>{ if(B.player.tile!==t) return; const q=B.piles.queue;
    const card=q.find(c=>!c.combo); if(card&&e.hp>0){ q.splice(q.indexOf(card),1); (e.loot=e.loot||[]).push(card); floater('Stole '+card.card.name+'!',e.tile,'#ffe066',true); } }); },
  // Crossbowman: a long, slow aim on where you stand, then a heavy bolt. Move!
  snipe(e){ const t=B.player.tile; tele(e,[t],1.5,Math.round(e.dmg*1.4)); },
  // Sellsword: raises a shield for itself and the weakest ally, or swings across two rows
  guard(e){ const ally=alive().filter(x=>x!==e).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    for(const x of [e,ally]) if(x){ x.barrier=Math.max(x.barrier,30); floater('🛡30',x.tile,'#e6f4ff'); burst(x.tile,'#e6f4ff',8,1); } },
  cleave(e){ const p=B.player, rows=[p.tile.r,p.tile.r+(Math.random()<.5?-1:1)]; tele(e,P_TILES.filter(t=>rows.includes(t.r)&&t.col<=2),1.1,e.dmg); },
  // Powder Monkey: a fizzing bomb on and around you that leaves the floor burning
  bomb(e){ const t=B.player.tile, ts=[t,...neighbors(t).filter(x=>x.side==='p')].filter(()=>true).slice(0,4); tele(e,ts,1.3,e.dmg,()=>ts.forEach(x=>{ x.burnT=Math.max(x.burnT||0,3); burst(x,'#ff9a3a',10,.5); })); },
  // Dark Wizard: hexes your row (you take 30% more for 6 s), or calls a shade to its side
  hex(e){ const p=B.player, row=p.tile.r; tele(e,pTilesInRow(row),.9,Math.round(e.dmg*.5),()=>{ if(p.tile.r===row){ p.hexT=6; floater('Hexed!',p.tile,'#e0588f',true); burst(p.tile,'#7a2a8f',16,1); } }); },
  summon(e){ if(alive().length>=4) return MOVES.hex(e); const t=pick(openEnemyTiles()); if(!t) return MOVES.shot(e);
    const m=makeEnemy('shade',t,B.depth); m.hp=m.maxHp=Math.round(m.maxHp*.5); m.atkT+=1.5; B.enemies.push(m); burst(t,'#7a2a8f',20,1); floater('summoned',t,'#e0588f');
    B.fx.push({kind:'bolt',a:e.tile,b:t,color:'#e0588f',t:0,life:.35}); },
  // Shapeshifter: takes a monster's shape, its element, weakness and attacks, and shifts again later
  shift(e){ const f=pick(SHIFT_FORMS.filter(x=>x!==e.form)), d=ENEMY_DEFS[f]; e.form=f; e.color=d.color; e.weak=null; e.moves=d.moves.concat(['shift']);
    e.nextMove=pick(d.moves); burst(e.tile,COLORS[d.color].c,26,1.2); burst(e.tile,'#ffffff',10,1); floater('→ '+d.name,e.tile,COLORS[d.color].c,true); },
  // Card Collector: snatches a card from your hand, then casts it back at you. Kill it for all of them back.
  collect(e){ const t=B.player.tile; tele(e,[t],.9,Math.round(e.dmg*.5),()=>{ if(B.player.tile!==t||e.hp<=0) return; const src=B.piles.hand.length?B.piles.hand:B.piles.queue.filter(c=>!c.combo);
    const card=pick(src); if(!card) return; const L=B.piles.hand.includes(card)?B.piles.hand:B.piles.queue; L.splice(L.indexOf(card),1);
    (e.loot=e.loot||[]).push(card); e.deck.push(card.card); e.deckCd=Math.min(e.deckCd,1.2); floater('Collected '+card.card.name+'!',e.tile,'#ffe066',true); }); },
  // Witch Healer: a brew that heals every ally a little, a root that pins you in place, or a strong mend
  brew(e){ for(const x of alive()){ const h=Math.round(x.maxHp*.08); if(x.hp<x.maxHp){ x.hp=Math.min(x.maxHp,x.hp+h); floater('+'+h,x.tile,'#6dff9a'); burst(x.tile,'#6fdc7a',8,1); } } },
  snare(e){ const t=B.player.tile; tele(e,[t],.8,Math.round(e.dmg*.5),()=>{ if(B.player.tile===t){ B.player.rootT=Math.max(B.player.rootT||0,1.8); floater('Rooted!',t,'#6fdc7a',true); burst(t,'#6fdc7a',14,.4); } }); },
  // Priest: brings a fallen ally back once each, or blesses the living with a shield and strength
  revive(e){ const dead=B.enemies.find(x=>x.hp<=0&&x!==e&&!x.revived&&!x.def.boss&&!x.def.mini), t=dead&&pick(openEnemyTiles());
    if(!dead||!t) return MOVES.bless(e);
    Object.assign(dead,{hp:Math.round(dead.maxHp*.4), revived:true, deathT:0, tile:t, burnT:0, freezeT:0, stunT:0, poisonT:0, curseT:0, markT:0, mark:null, atkT:2, casting:null, windT:0}); t.occ=dead;
    floater('Revived!',t,'#fff0b3',true); burst(t,'#fff0b3',30,1.5); B.fx.push({kind:'beam',a:t,b:t,y0:6,color:'#fff6c8',t:0,life:.5}); },
  bless(e){ for(const x of alive()){ x.barrier=Math.max(x.barrier,25); x.powerT=Math.max(x.powerT,6); floater('Blessed',x.tile,'#fff0b3'); burst(x.tile,'#fff0b3',8,1); } },
  mend(e){ const hurt=alive().filter(x=>x!==e&&x.hp<x.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    if(!hurt) return MOVES.shot(e);
    const h=Math.round(hurt.maxHp*.2); hurt.hp=Math.min(hurt.maxHp,hurt.hp+h); hurt.barrier=Math.max(hurt.barrier,20); hurt.shieldTurns=Math.max(hurt.shieldTurns||0,1); floater('+'+h,hurt.tile,'#fff0b3'); burst(hurt.tile,'#fff0b3',12,1);
    B.fx.push({kind:'bolt',a:e.tile,b:hurt.tile,color:'#fff0b3',t:0,life:.3}); },
  quake(e){ const safe=[pick(P_TILES.filter(t=>!t.occ||t.occ.kind==='player'))]; safe.push(...neighbors(safe[0]).filter(t=>t.side==='p').slice(0,2));
    tele(e,P_TILES.filter(t=>!safe.includes(t)),1.7,e.dmg); },
  boulders(e){ const ts=[B.player.tile,pick(P_TILES.filter(t=>!t.occ))].filter(Boolean);
    tele(e,ts,1.3,e.dmg,()=>ts.forEach(t=>{ if(typeof palImpact==='function') palImpact(e,t); if(!t.occ) dropRock(t,10); })); },
};

/* A humanoid casts a card from its deck: announce it (.9s), then play it mirrored
   toward you at 60% power. */
function enemyCast(e,c){
  const k=.6*e.ds*(e.powerT>0?1.3:1), p=B.player, col=COLORS[c.color].c, kind=c.type==='piece'?c.base:c.type;
  const pow=Math.round((c.pow||0)*k);
  switch(kind){
    case 'strike':
      if(c.shape==='line') return enemyShot(e,pow);
      if(c.shape==='all'||c.shape==='missiles') return tele(e,[p.tile],.6,c.shape==='missiles'?Math.round(pow*c.n*.6):pow);
      return tele(e,pTilesInRow(e.tile.r),.6,pow);
    case 'lob': return tele(e,[p.tile].concat(c.radius?around(p.tile).filter(t=>t.side==='p'):[]),.9,pow);
    case 'charge': for(let i=0;i<3;i++) later(i*.35,()=>{ if(e.hp>0) enemyShot(e,pow); }); return;
    case 'ward':
      if(c.ward==='barrier'){ e.barrier=Math.round(c.amt*k); e.shieldTurns=c.turns||2; floater('🛡'+e.barrier,e.tile,col); return; }
      E_TILES.filter(t=>!t.occ&&t.col===BOARD_COLS/2&&Math.abs(t.r-e.tile.r)<=1).slice(0,c.n).forEach(t=>{
        const w={kind:'wall',enemy:true,card:c,tile:t,hp:Math.round(c.hp*k),maxHp:Math.round(c.hp*k),thorns:0,turns:c.turns||2,maxTurns:c.turns||2}; t.occ=w; B.walls.push(w); burst(t,col,8,.3); });
      return;
    case 'sentry': { const t=pick(E_TILES.filter(x=>!x.occ&&x.col>=BOARD_COLS/2+1)); if(!t) return;
      const s={kind:'ally',enemy:true,ai:'sentry',card:c,tile:t,hp:40,maxHp:40,turns:c.turns||1,maxTurns:c.turns||1,fireT:.6,pow:Math.max(3,Math.round(c.pow*k))}; t.occ=s; B.allies.push(s); burst(t,col,10,.4); return; }
    case 'boon':
      if(c.boon==='heal'||c.boon==='regen'){ const hurt=alive().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]; const h=Math.round((c.amt||30)*k*(c.boon==='regen'?4:1));
        hurt.hp=Math.min(hurt.maxHp,hurt.hp+h); floater('+'+h,hurt.tile,'#6dff9a'); return; }
      if(['power','pact','courage','haste'].includes(c.boon)){ e.powerT=8; floater('Empowered',e.tile,col); return; }
      e.barrier=Math.max(e.barrier,30); e.shieldTurns=Math.max(e.shieldTurns||0,1); floater('🛡30',e.tile,col); return;
  }
  enemyShot(e,e.dmg);
}

function updateEnemy(e,dt){
  const b=B;
  e.confuseT=Math.max(0,(e.confuseT||0)-dt);
  e.hitT=Math.max(0,e.hitT-dt); e.curseT=Math.max(0,e.curseT-dt); e.poisonT=Math.max(0,e.poisonT-dt); e.powerT=Math.max(0,e.powerT-dt);
  if(e.markT>0&&(e.markT-=dt)<=0) e.mark=null;
  if(e.burnT>0){ e.burnT-=dt; e.burnAcc+=5*dt; if(e.burnAcc>=5){ e.burnAcc-=5; hitEnemy(e,5,null,{raw:true}); if(e.hp<=0) return; } }
  if(e.def.bossId&&typeof bossTick==='function'&&bossTick(e,dt)) return;   // away, or guarding while it evolves
  if(e.def.mini&&typeof miniTick==='function'&&miniTick(e,dt)) return;   // minibosses (minibosses.js)
  if(e.under) return;
  if(e.freezeT>0||e.stunT>0){ e.freezeT=Math.max(0,e.freezeT-dt); e.stunT=Math.max(0,e.stunT-dt); return; }
  if(e.slowT>0){ e.slowT-=dt; dt*=.5; }
  if(typeof heroAura==='function'&&heroAura('slowfoes')) dt*=1-heroAura('slowfoes');   // Old Man Winter
  if(e.windT>0){ e.windT-=dt; if(e.windT<=0) enemyShot(e,e.dmg*(e.powerT>0?1.3:1)); return; }
  if(e.casting){ e.castT-=dt; if(e.castT<=0){ const c=e.casting; e.casting=null; enemyCast(e,c); } return; }
  e.moveT-=dt;
  if(e.moveT<=0&&!b.teles.some(t=>t.owner===e)){ e.moveT=rnd(1.4,2.4)*(icy(e.tile)?2:1); moveEnemy(e); if(e.hp<=0) return; }
  if(e.deck){ e.deckCd-=dt; if(e.deckCd<=0&&e.deck.length){ e.deckCd=rnd(4,6); e.casting=e.deck.shift(); e.castT=.9; return; } }
  e.atkT-=dt;
  if(e.atkT<=0){ e.atkT=rnd(e.def.rate[0],e.def.rate[1]); const ms=e.moves||e.def.moves, mv=e.nextMove||pick(ms); MOVES[mv](e); e.nextMove=pick(e.moves||e.def.moves); if(typeof palPlay==='function') palPlay(e,mv==='quake'?'quake':(mv==='shot'||mv==='boulders')?'throw':''); }   // the next move is picked early so it can be shown
}

if(typeof module!=='undefined') module.exports={ENEMY_DEFS,MONSTERS,HUMANOIDS,OUTLAWS,SPELLFOLK,makeEncounter};
