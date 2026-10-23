/* Hexmancers — fight patterns (v125). The design is in docs/fight-patterns.md.
   Roles and squads: every enemy has a role (tank, striker, controller, support, skirmisher), and a group is
     built from a squad template of roles, filled with the area's own colour where it can be.
   Rhythms: an enemy repeats a short, learnable cycle of moves (its intent icon shows the next one) instead of
     picking at random; deeper down it learns a board-shaping move too.
   Tactics: a squad acts together: crossfire on a pinned player, a flank from the rows above and below, a
     tank's shield wall in front of a hurt ally, a support's blessing that hurries the strikers.
   Board shaping: fire lanes, stone walls, frost fields and a chain that drags you forward.
   Phases: at half HP an ordinary enemy changes, once, by role.
   Elites: from depth 6 some enemies come with an affix (shielded, hasty, vampiric, splitting, thorned,
     volatile); they carry more gold.
   Hooks: enemies.js (makeEncounter, makeEnemy, updateEnemy, enemyTick) and battle.js (hitEnemy, hitPlayer,
   killEnemy and the enemy drawing) call fxInit, fxNext, fxAfterMove, fxTick, fxHit, fxHurt, fxKill. */

const ROLE={sellsword:'tank', knight:'tank', paladin:'tank', gloop:'tank',
  ram:'striker', bandit:'striker', marksman:'striker', bomber:'striker', wisp:'striker', beetle:'striker',
  mite:'controller', witch:'controller', darkwiz:'controller', caller:'controller', hedgewitch:'controller',
  sprite:'support', priest:'support', warden:'support',
  shade:'skirmisher', cutpurse:'skirmisher', cultist:'skirmisher', shifter:'skirmisher', collector:'skirmisher'};
const roleOf=e=>e&&(ROLE[e.id]||null);
const HUMANS=new Set([...HUMANOIDS,...SPELLFOLK]);

/* ---------------- squads ---------------- */
const SQUADS=[
  {name:'Pair',    from:1,  roles:['striker','any']},
  {name:'Anvil',   from:4,  roles:['tank','striker'],                 grow:{12:'striker'}},
  {name:'Snare',   from:5,  roles:['controller','striker'],           grow:{10:'skirmisher'}},
  {name:'Choir',   from:8,  roles:['support','striker','tank']},
  {name:'Hunt',    from:10, roles:['skirmisher','skirmisher','controller']},
  {name:'Warband', from:16, roles:['tank','controller','striker','support']},
];
// an enemy for a role: the area's colour more often than not; people (casters, healers) only from depth 2
function roleFoe(role,depth,A){ let pool=Object.keys(ROLE).filter(id=>(role==='any'||ROLE[id]===role)&&ENEMY_DEFS[id]&&!(depth<2&&HUMANS.has(id))&&!(depth<3&&id==='collector'));
  if(!pool.length) pool=MONSTERS.slice();
  const home=A?pool.filter(id=>ENEMY_DEFS[id].color===A.color):[]; return home.length&&Math.random()<.6?pick(home):pick(pool); }
// a squad's enemy ids; size caps it (a battle wave's size), and the deepest squads get one more
function makeSquad(depth,size){ const A=typeof areaOf==='function'?areaOf(depth):null, ok=SQUADS.filter(s=>s.from<=depth);
  const S=pick(ok.slice(-3)), roles=S.roles.slice(); for(const d in S.grow||{}) if(depth>=+d) roles.push(S.grow[d]);
  if(depth>=20&&roles.length<4) roles.push('striker');
  return roles.slice(0,Math.max(1,size||roles.length)).map(r=>roleFoe(r,depth,A)); }
// how many foes a group on the map holds: one or two early, a full squad from the middle depths
const mapSquadSize=depth=>depth<=3?2:depth<=11?3:depth<=20?3+(Math.random()<.5?1:0):4;

/* ---------------- rhythms ---------------- */
const RHYTHM={ram:['shot','shot','rush'], mite:['iceslam','shot'], beetle:['cross','shot','shot'], wisp:['shot','firebomb'], shade:['blink','shot'],
  sprite:['mend','shot'], gloop:['shot','shot'], bandit:['lunge','lunge','shot'], cutpurse:['steal','blink'], marksman:['snipe','snipe','rest'],
  sellsword:['guard','cleave','cleave'], bomber:['bomb','shot'], darkwiz:['hex','shot','summon'], hedgewitch:['snare','brew','mend'],
  priest:['bless','revive'], collector:['collect','shot'], cultist:['shot','shot'], witch:['shot','shot'], caller:['shot','shot'],
  warden:['shot','shot'], paladin:['shot','shot'], knight:['shot','shot']};
// a board-shaping move each kind learns deeper down (controllers from depth 8, the rest from 16)
const SHAPER={mite:'frostfield', witch:'frostfield', caller:'drag', darkwiz:'firelane', hedgewitch:'frostfield', cultist:'firelane', wisp:'firelane',
  sellsword:'stonewall', paladin:'stonewall', knight:'stonewall', gloop:'stonewall', shade:'drag', ram:'drag', beetle:'drag', bandit:'drag', bomber:'firelane'};
function fxRhythm(e,depth){ const base=RHYTHM[e.id]; if(!base) return null; const seq=base.slice(), sh=SHAPER[e.id];
  if(sh&&(depth>=16||depth>=8&&roleOf(e)==='controller')) seq.splice(1,0,sh);
  if(depth>=12&&seq.length<4) seq.push(seq[0]);   // a longer cycle deeper down
  return seq; }
function fxNext(e){ if(e.moves||!e.seq) return pick(e.moves||e.def.moves); const m=e.seq[e.si%e.seq.length]; e.si++; return m; }

/* ---------------- board shaping (new moves) ---------------- */
Object.assign(MOVES,{
  rest(e){ floater('…',e.tile,'#9aa3b5'); },   // a breath in the rhythm: your window
  // a row on your side bursts into flame for 4 s (one tile spared)
  firelane(e){ const r=aimT().r, ts=pTilesInRow(r), gap=pick(ts); tele(e,ts.filter(t=>t!==gap),1.2,Math.round(e.dmg*.5),()=>ts.forEach(t=>{ if(t!==gap){ t.burnT=Math.max(t.burnT||0,4); burst(t,'#ff6a3d',8,.4); } })); },
  // stone walls rise beside you: they block your way for 8 s
  stonewall(e){ const p=aimT(), ts=neighbors(p).filter(t=>t.side==='p'&&!t.occ).sort(()=>Math.random()-.5).slice(0,2); if(!ts.length) return MOVES.shot(e);
    tele(e,ts,.9,0,()=>ts.forEach(t=>{ if(!t.occ) dropRock(t,8); })); floater('Stone wall',e.tile,'#b8b0c8'); },
  // three tiles round you turn to ice (moving on ice takes twice as long)
  frostfield(e){ const p=aimT(), ts=[p,...neighbors(p).filter(t=>t.side==='p')].sort(()=>Math.random()-.5).slice(0,3);
    tele(e,ts,.9,Math.round(e.dmg*.3),()=>ts.forEach(t=>{ t.iceT=Math.max(t.iceT||0,6); burst(t,'#bfefff',8,.4); })); },
  // a chain on your tile: if you are still there it drags you one tile toward the enemy
  drag(e){ const t=aimT(); tele(e,[t],1,Math.round(e.dmg*.4),()=>{ const p=B.player; if(p.tile!==t) return; const to=tileCR(t.col+1,t.r);
    if(to&&to.side==='p'&&!to.occ&&!burning(to)){ if(t.occ===p) t.occ=null; p.tile=to; to.occ=p; p.path=[]; p.snap=null; floater('Dragged!',to,'#c8b8ff',true); burst(to,'#c8b8ff',12,.5); } }); },
});

/* ---------------- elites ---------------- */
const ELITE={shielded:{name:'Shielded',col:'#9fdcff'}, hasty:{name:'Hasty',col:'#ffe066'}, vampiric:{name:'Vampiric',col:'#ff4d6d'},
  splitting:{name:'Splitting',col:'#6fdc7a'}, thorned:{name:'Thorned',col:'#c8a06a'}, volatile:{name:'Volatile',col:'#ff9a3a'}};
const eliteChance=depth=>depth<5?0:Math.min(.35,.06+(depth-5)*.012);
/* the danger ramp: how much harder an enemy hits, how much quicker its cycle runs, and how soon it opens, by depth.
   Tuned with the bots against docs/fight-patterns.md's targets for HP lost a fight */
// dungeon groups are small, so they hit hard; battle mode's whole encounters (waves of squads) ramp gently
const fxOnMap=()=>typeof EX!=='undefined'&&!!EX&&!!EX.fighting;
const fxDanger=depth=>fxOnMap()?{dmg:depth<=3?2.6:depth<=7?2.7:depth<=12?1.85:depth<=20?2.35:1.7, rate:Math.max(.75,1-.01*depth), first:depth<4?.8:.6}
  :{dmg:1+.01*depth, rate:Math.max(.85,1-.005*depth), first:.85};
function fxInit(e,depth){ e.seq=fxRhythm(e,depth); e.si=Math.floor(Math.random()*3); if(e.seq) e.nextMove=fxNext(e);
  if(!e.def.boss){ const D=fxDanger(depth); e.dmg=Math.round(e.dmg*D.dmg); e.spd=(e.spd||1)*D.rate; e.atkT*=D.first; }
  const d=e.def; if(d.boss||d.mini||d.rare||d.minion||d.vermin||e.noElite||!ROLE[e.id]) return;
  if(Math.random()<eliteChance(depth)){ const a=pick(Object.keys(ELITE)); e.elite=a; e.name=ELITE[a].name+' '+e.name;
    if(a==='shielded'){ e.barrier=Math.round(e.maxHp*.2); e.shieldRe=8; }
    if(a==='hasty') e.spd=(e.spd||1)*.65;
    e.maxHp=e.hp=Math.round(e.maxHp*1.25); } }

/* ---------------- every frame: phases, tactics, elite upkeep ---------------- */
function fxTick(dt){ const b=B; if(!b||b.phase!=='fight') return; const T=b.tac||(b.tac={cross:0,flank:0,wall:0}); T.cross-=dt; T.flank-=dt; T.wall-=dt;
  const es=alive(), p=b.player;
  for(const e of es){
    if(e.elite==='shielded'&&(e.shieldRe-=dt)<=0){ e.shieldRe=8; e.barrier=Math.max(e.barrier,Math.round(e.maxHp*.15)); burst(e.tile,'#9fdcff',8,1); }
    if(e.elite==='hasty') e.moveT-=dt*.5;
    if(!e.phased&&e.hp<=e.maxHp*.5&&ROLE[e.id]&&!e.def.boss&&!e.def.mini&&!e.def.minion) fxPhase(e); }
  // crossfire: you are pinned (rooted, hexed or on ice); the strikers fire at your tile and where you would go
  const pinned=p.rootT>0||p.hexT>0||icy(p.tile);
  if(pinned&&T.cross<=0){ const st=es.filter(e=>roleOf(e)==='striker'&&!e.windT&&!e.casting&&!b.teles.some(t=>t.owner===e)&&e.freezeT<=0&&e.stunT<=0);
    if(st.length&&es.some(e=>roleOf(e)==='controller')){ T.cross=7; floater('Crossfire!',p.tile,'#ff5d6c',true);
      st.slice(0,2).forEach((e,i)=>later(.2+.25*i,()=>{ if(e.hp<=0) return; const at=B.player.tile, ts=[at,...neighbors(at).filter(x=>x.side==='p')]; tele(e,i?ts.slice(1):[at],.9,Math.round(e.dmg*.8)); e.atkT=Math.max(e.atkT,2); })); } }
  // flank: two skirmishers strike the rows above and below you together (stay in your row, step sideways)
  const sk=es.filter(e=>roleOf(e)==='skirmisher'&&!e.windT&&!e.casting&&e.freezeT<=0&&e.stunT<=0);
  if(sk.length>=2&&T.flank<=0&&sk.every(e=>e.atkT<1.6)){ T.flank=9; const r=p.tile.r;
    [r-1,r+1].forEach((row,i)=>{ const e=sk[i]; const ts=P_TILES.filter(t=>t.r===row); if(ts.length){ tele(e,ts,1.1,Math.round(e.dmg*.9)); e.atkT=Math.max(e.atkT,2.4); } }); floater('Flank!',p.tile,'#e0588f',true); }
  // shield wall: a tank steps in front of a hurt ally and shields it
  if(T.wall<=0){ T.wall=3; for(const tk of es.filter(e=>roleOf(e)==='tank')){ const hurt=es.filter(x=>x!==tk&&roleOf(x)!=='tank'&&x.hp<x.maxHp*.6).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0]; if(!hurt) continue;
      const front=tileCR(hurt.tile.col-1,hurt.tile.r); if(front&&front.side==='e'&&!front.occ&&!burning(front)&&front!==tk.tile){ stepEnemy(tk,front); }
      hurt.barrier=Math.max(hurt.barrier,25); floater('Shield wall',hurt.tile,'#e6f4ff'); burst(hurt.tile,'#e6f4ff',8,1); T.wall=8; break; } }
}
// half HP, once: each role turns
function fxPhase(e){ e.phased=true; const r=roleOf(e), d=B.depth;
  if(r==='striker'){ e.spd=(e.spd||1)*.7; e.atkT=Math.min(e.atkT,1); floater('Enraged!',e.tile,'#ff5d6c',true); burst(e.tile,'#ff5d6c',16,1); }
  else if(r==='tank'){ e.barrier=Math.max(e.barrier,30); floater('Hardens',e.tile,'#e6f4ff',true); burst(e.tile,'#e6f4ff',14,1); }
  else if(r==='support'){ const t=pick(openEnemyTiles()); if(t&&alive().length<5){ const m=makeEnemy(pick(VERMIN),t,d); m.noElite=true; m.atkT+=1.5; B.enemies.push(m); floater('Calls for help!',e.tile,'#fff0b3',true); burst(t,'#fff0b3',16,1); } }
  else if(r==='skirmisher'){ const back=E_TILES.filter(t=>!t.occ&&!burning(t)).sort((a,c)=>c.col-a.col)[0]; if(back) stepEnemy(e,back); const h=Math.round(e.maxHp*.15); e.hp=Math.min(e.maxHp,e.hp+h); floater('+'+h+' slips back',e.tile,'#6dff9a',true); }
  else if(r==='controller'){ const sh=SHAPER[e.id]; if(sh&&MOVES[sh]){ e.curMove=sh; MOVES[sh](e); e.curMove=null; } floater('!',e.tile,'#b48cff',true); } }
// after an enemy's move: a support's blessing or mend hurries the strikers
function fxAfterMove(e,mv){ if(roleOf(e)==='support'&&['bless','mend','brew'].includes(mv)) for(const s of alive()) if(roleOf(s)==='striker'&&s.atkT>1){ s.atkT=Math.max(.9,s.atkT*.5); floater('Hurried',s.tile,'#fff0b3'); } }

/* ---------------- hits and deaths ---------------- */
// an enemy is hit: a thorned elite answers part of it
function fxHit(e,dealt,card,opts){ if(e.elite==='thorned'&&dealt>0&&!(opts&&opts.raw)&&B.phase==='fight'){ const n=Math.max(1,Math.round(dealt*.15)); B.thornsIn=true; hitPlayer(n,null); B.thornsIn=false; floater('thorns '+n,B.player.tile,'#c8a06a'); } }
// you are hit by an enemy: a vampiric elite drinks it
function fxHurt(src,lost){ if(src&&src.elite==='vampiric'&&lost>0&&src.hp>0){ const h=Math.round(lost*.5); src.hp=Math.min(src.maxHp,src.hp+h); floater('+'+h,src.tile,'#ff4d6d'); } }
// an enemy dies: a splitting elite splits, a volatile one goes off; elites pay more
function fxKill(e){ if(!e.elite) return; B.bonusGold=(B.bonusGold||0)+Math.round(15+5*B.depth);
  if(e.elite==='splitting'){ const spots=around(e.tile).filter(t=>t.side==='e'&&!t.occ).slice(0,2); spots.forEach(t=>{ const m=makeEnemy(e.id,t,B.depth); m.noElite=true; m.elite=null; m.hp=m.maxHp=Math.round(e.maxHp*.35); m.name='Split '+ENEMY_DEFS[e.id].name; m.phased=true; m.atkT+=1.2; B.enemies.push(m); burst(t,'#6fdc7a',12,1); }); }
  if(e.elite==='volatile'){ const at=B.player.tile, ts=[at,...neighbors(at).filter(x=>x.side==='p')]; tele(e,ts,1,Math.round(e.dmg*1.2)); floater('It will blow!',e.tile,'#ff9a3a',true); } }
// the ring under an elite (battle.js draws enemies)
function fxDrawElite(ctx,e,x,y,S,sc,T){ if(!e.elite||e.hp<=0) return; const c=ELITE[e.elite].col; ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha*=.6+.3*Math.sin(T*4); ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(x,y,S*.66*sc,S*.66*sc*ISO_Y,0,0,TAU); ctx.stroke(); ctx.restore(); }
