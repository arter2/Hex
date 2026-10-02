/* Hexmancers — bosses. One per color, one every 4th depth, each meant to last 6 to 10 minutes.
   Every boss has a signature gimmick and evolves twice, at 2/3 and 1/3 of its HP: a banner, a
   short guard, and a new strategy. The battle code calls bossTick each frame, bossHit before
   damage lands, and asks bossColorMult for the boss's current weakness. */

Object.assign(ENEMY_DEFS,{
  glacier:{name:'Glacier Queen', color:'frost',   hp:1750, dmg:14, rate:[3.2,4.2], moves:['iceslam','icewall','shot'], ai:'wander', boss:true, bossId:'glacier', scale:1.5},
  golem:  {name:'Radiant Golem', color:'light',   hp:1300, dmg:18, rate:[3.4,4.4], moves:['quake','boulders','shot'], ai:'wander', boss:true, bossId:'golem', scale:1.45},
  hollow: {name:'Hollow King',   color:'shadow',  hp:1200, dmg:17, rate:[3,4],     moves:['blink','shot','shot'],     ai:'wander', boss:true, bossId:'hollow', scale:1.5},
  treant: {name:'Elder Treant',  color:'verdant', hp:1350, dmg:16, rate:[3.4,4.4], moves:['shot','vines'],            ai:'still',  boss:true, bossId:'treant', scale:1.55},
  wyrm:   {name:'Magma Wyrm',    color:'fire',    hp:1250, dmg:18, rate:[3,4],     moves:['crack','firebomb','shot'], ai:'wander', boss:true, bossId:'wyrm', scale:1.55},
  roc:    {name:'Thunder Roc',   color:'storm',   hp:1200, dmg:17, rate:[2.8,3.8], moves:['rods','shot'],             ai:'align',  boss:true, bossId:'roc', scale:1.5},
  // helpers the bosses bring
  rootnode:{name:'Root Node',    color:'verdant', hp:110, dmg:0,  rate:[3,3],     moves:['mendboss'], ai:'still', minion:true, scale:.9},
  sapling: {name:'Sapling',      color:'verdant', hp:55,  dmg:8,  rate:[2.6,3.6], moves:['shot'],     ai:'align', minion:true, scale:.75},
  clone:   {name:'Hollow Shade', color:'shadow',  hp:60,  dmg:10, rate:[3,4],     moves:['blink'],    ai:'wander', minion:true, scale:1.1},
});
// the order bosses appear in, matched to the area of each 4th depth, then the cycle repeats
const BOSS_ORDER=['glacier','golem','hollow','treant','wyrm','roc'];
const BOSS_INFO={
  glacier:'Raises ice walls on your side; later freezes the front card of your queue, then a blizzard.',
  golem:'Its weak color changes every few seconds (shown over it); later it reflects the color it resists.',
  hollow:'Hides its side in fog and teleports; later steals cards from your hand, then splits into shades.',
  treant:'Root Nodes heal it while they stand: break them first. Later its vines root you in place.',
  wyrm:'Cracks your tiles into lava pits you cannot cross; later burrows and erupts under a row.',
  roc:'Lightning rods mark tiles, then strike; later it flies off the board and dives down a row.',
};
const bossFor=depth=>BOSS_ORDER[(Math.floor(depth/4)-1+BOSS_ORDER.length*99)%BOSS_ORDER.length];
const ROTATE_COLORS=['fire','frost','storm','verdant','shadow','light'];

/* ---------------- moves only bosses use ---------------- */
Object.assign(MOVES,{
  // Glacier Queen: a short wall of ice on your side, blocking moves and your shots
  icewall(e){ const n=e.phase>=3?4:3, col=1+Math.floor(Math.random()*Math.max(1,P_COLS()-2)), r0=Math.floor(Math.random()*Math.max(1,BOARD_ROWS-n+1));
    const ts=P_TILES.filter(t=>t.col===col&&t.r>=r0&&t.r<r0+n&&!t.occ);
    tele(e,ts,1.1,Math.round(e.dmg*.6),()=>ts.forEach(t=>{ if(!t.occ){ dropRock(t,9); t.iceT=9; } })); },
  // Magma Wyrm: crack tiles into lava pits that cannot be walked on for a while
  crack(e){ const p=B.player, ts=[p.tile,...P_TILES.filter(t=>t!==p.tile&&!t.occ&&!(t.holeT>0)).sort(()=>Math.random()-.5).slice(0,e.phase>=3?4:2)];
    tele(e,ts,1.2,e.dmg,()=>ts.forEach(t=>openPit(t,e.phase>=3?12:8))); },
  // Thunder Roc: lightning rods mark tiles, then strike hard; at phase 3 the bolts chain along the rows
  rods(e){ const n=e.phase>=3?5:3, ts=[B.player.tile,...P_TILES.filter(t=>t!==B.player.tile).sort(()=>Math.random()-.5).slice(0,n-1)];
    let hit=ts; if(e.phase>=3){ const rows=new Set(ts.slice(0,2).map(t=>t.r)); hit=[...new Set(ts.concat(P_TILES.filter(t=>rows.has(t.r))))]; }
    tele(e,hit,2,Math.round(e.dmg*1.2),()=>hit.forEach(t=>burst(t,'#fff39a',6,.6))); },
  // Elder Treant: vines grab the tile you stand on; if they catch you, you are rooted
  vines(e){ if(e.phase<2) return MOVES.shot(e); const t=B.player.tile;
    tele(e,[t],1,Math.round(e.dmg*.5),()=>{ if(B.player.tile===t){ B.player.rootT=2.2; floater('Rooted!',t,'#9fdca8',true); } }); },
  // a Root Node pours life into its boss
  mendboss(e){ const boss=e.summoner; if(!boss||boss.hp<=0) return;
    const h=Math.round(boss.maxHp*.025); boss.hp=Math.min(boss.maxHp,boss.hp+h); floater('+'+h,boss.tile||e.tile,'#9fdca8');
    if(boss.tile) B.fx.push({kind:'bolt',a:e.tile,b:boss.tile,color:'#9fdca8',t:0,life:.35}); },
});
Object.assign(INTENT_ICON,{icewall:'▤',crack:'◎',rods:'⚡',vines:'❦',mendboss:'✚'});
const P_COLS=()=>Math.max(...P_TILES.map(t=>t.col))+1;

// a lava pit: nothing can stand in it; whoever is on it when it opens is burned and thrown clear
function openPit(t,sec){ t.holeT=sec; t.burnT=Math.max(t.burnT||0,.1); burst(t,'#ff6a3d',14,.5);
  const p=B.player; if(p.tile===t){ hitPlayer(6); const to=pick(neighbors(t).filter(x=>x.side==='p'&&!x.occ&&!(x.holeT>0))); if(to){ t.occ=null; p.tile=to; to.occ=p; p.path=[]; } } }

/* ---------------- helpers ---------------- */
function summon(boss,id,n,tiles){ const free=(tiles||E_TILES).filter(t=>!t.occ&&!burning(t)); const out=[];
  for(let i=0;i<n&&free.length;i++){ const t=free.splice(Math.floor(Math.random()*free.length),1)[0]; const m=makeEnemy(id,t,B.depth); m.summoner=boss; m.atkT+=1; B.enemies.push(m); burst(t,COLORS[m.color].c,14); out.push(m); }
  return out; }
const helpers=(boss,id)=>alive().filter(m=>m.summoner===boss&&(!id||m.id===id));
// leave the board (burrowed or flying): untouchable, not drawn, its tile free
function leave(e){ if(e.tile&&e.tile.occ===e) e.tile.occ=null; e.under=true; cancelAttack(e); burst(e.tile,COLORS[e.color].c,18,.5); }
function come(e,t){ t=t&&!t.occ?t:pick(E_TILES.filter(x=>!x.occ&&!burning(x))); if(!t) return; e.tile=t; t.occ=e; e.under=false; burst(t,COLORS[e.color].c,18,.6); }

/* ---------------- each boss's gimmick, every frame ---------------- */
function bossStart(e){ e.phase=1; e.gT=0; e.g2=0;
  if(e.def.bossId==='golem'){ e.weak=pick(ROTATE_COLORS.filter(c=>c!=='light')); e.resist=null; }
  if(e.def.bossId==='treant') summon(e,'rootnode',2);
  if(e.def.bossId==='hollow') B.fog=true;
  B.hooks.onBoss&&B.hooks.onBoss(e.name,COLORS[e.color].c,BOSS_INFO[e.def.bossId]);
}
// at 2/3 and 1/3 HP: a banner, a 2.5s guard, a new strategy
function evolve(e,ph){ e.phase=ph; e.guardT=2.5; cancelAttack(e); shake(8); burst(e.tile||B.player.tile,COLORS[e.color].c,40,1);
  const lines={glacier:['','','Her glare locks your queue','Blizzard!'], golem:['','','The prism turns: it reflects','Overcharge!'], hollow:['','','It reaches for your hand','It splits into shades'],
               treant:['','','Vines stir under you','The grove wakes'], wyrm:['','','It burrows','Molten core!'], roc:['','','It takes to the sky','The storm chains']};
  const txt=e.name+(ph===2?' II':' III')+' · '+lines[e.def.bossId][ph];
  floater(txt,e.tile||B.player.tile,COLORS[e.color].c,true); B.hooks.onBoss&&B.hooks.onBoss(txt,COLORS[e.color].c);
  if(e.def.bossId==='glacier'&&ph===3){ for(const t of P_TILES) t.iceT=Math.max(t.iceT||0,999); summon(e,'mite',2); }
  if(e.def.bossId==='golem'&&ph>=2) e.reflect=true;
  if(e.def.bossId==='golem'&&ph===3){ e.def={...e.def, moves:['quake','quake','boulders'], rate:[2.6,3.4]}; }
  if(e.def.bossId==='hollow'&&ph===3) summon(e,'clone',2);
  if(e.def.bossId==='treant'&&ph===3){ summon(e,'rootnode',Math.max(0,2-helpers(e,'rootnode').length)); summon(e,'sapling',2); }
  if(e.def.bossId==='wyrm'&&ph===3){ e.def={...e.def, rate:[2.4,3.2]}; }
}
function bossTick(e,dt){
  if(e.phase==null) bossStart(e);
  const f=e.hp/e.maxHp;
  if(e.phase<2&&f<=2/3) evolve(e,2); else if(e.phase<3&&f<=1/3) evolve(e,3);
  e.guardT=Math.max(0,(e.guardT||0)-dt); e.gT+=dt;
  const id=e.def.bossId, p=B.player;
  if(id==='glacier'&&e.phase>=2&&e.gT>=9){ e.gT=0; const q=B.piles.queue[0];   // freeze the front card of your queue
    if(q){ q.frozenT=4; floater('❄ '+q.card.name+' frozen',p.tile,'#9fd0ff',true); } }
  if(id==='golem'){ e.g2+=dt; if(e.g2>=(e.phase>=3?8:12)){ e.g2=0; const opts=ROTATE_COLORS.filter(c=>c!==e.weak&&c!=='light'); e.weak=pick(opts);
      e.resist=e.reflect?pick(ROTATE_COLORS.filter(c=>c!==e.weak)):null; floater('weak: '+COLORS[e.weak].name+(e.resist?' · reflects '+COLORS[e.resist].name:''),e.tile,COLORS[e.weak].c,true); } }
  if(id==='hollow'){ if(e.gT>=6&&!e.under){ e.gT=0; const to=pick(E_TILES.filter(t=>!t.occ&&!burning(t))); if(to){ burst(e.tile,'#e0588f',12); e.tile.occ=null; e.tile=to; to.occ=e; burst(to,'#e0588f',12); } }
    e.g2+=dt; if(e.phase>=2&&e.g2>=10){ e.g2=0; const hand=B.piles.hand; if(hand.length){ const c=hand.splice(Math.floor(Math.random()*hand.length),1)[0]; B.piles.discard.push(c); floater('Stolen: '+c.card.name,p.tile,'#e0588f',true); } } }
  if(id==='treant'){ e.g2+=dt; if(e.phase>=3&&e.g2>=14){ e.g2=0; if(helpers(e,'sapling').length<3) summon(e,'sapling',1); if(!helpers(e,'rootnode').length) summon(e,'rootnode',1); } }
  if(id==='wyrm'||id==='roc'){
    if(e.under){ e.awayT-=dt; if(e.awayT<=0&&!e.diving){ e.diving=true; const r=p.tile.r, row=P_TILES.filter(t=>t.r===r);
        tele(null,row,1.1,Math.round(e.dmg*1.3),()=>{ if(id==='wyrm') row.forEach(t=>{ if(Math.random()<.4) openPit(t,8); }); come(e,pick(E_TILES.filter(t=>t.r===r&&!t.occ))); e.diving=false; e.gT=0; });
        floater(id==='wyrm'?'It erupts!':'It dives!',p.tile,COLORS[e.color].c,true); } return 'away'; }
    if(e.phase>=2&&e.gT>=(id==='wyrm'?14:12)&&!B.teles.some(t=>t.owner===e)){ e.gT=0; e.awayT=id==='wyrm'?3:4; leave(e); floater(id==='wyrm'?'It burrows…':'It takes to the sky…',p.tile,COLORS[e.color].c,true); return 'away'; }
  }
  if(e.guardT>0) return 'guard';
}
// before damage lands: untouchable while away or guarding; the golem reflects its resisted color
function bossHit(e,card,base){
  if(e.under){ return 0; }
  if(e.guardT>0){ floater('guarded',e.tile,'#e6f4ff'); return 0; }
  if(e.reflect&&card&&card.color===e.resist){ floater('reflected!',e.tile,COLORS[e.resist].c,true); hitPlayer(Math.max(1,Math.round(base*.35))); return 0; }
  return null;
}
function bossColorMult(atk,e){ if(e&&e.weak) return atk===e.weak?WEAK_MULT:atk&&atk===e.resist?.5:1; return colorMult(atk,e&&e.color); }
// when a boss falls, everything it brought falls with it
function bossDown(e){ B.fog=false; for(const m of helpers(e)) killEnemy(m); }

if(typeof module!=='undefined') module.exports={BOSS_ORDER,bossFor};
