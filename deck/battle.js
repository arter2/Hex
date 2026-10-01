/* Hexmancers deck prototype — real-time battle on an 8 x 12 hex board, drawn with an
   orthographic isometric projection on a 2D canvas. Your side is the six columns
   nearest you, the enemy side the six across from you. A turn ends each time the
   Custom screen opens; shields and everything cards put on the board last a set
   number of turns or until their HP runs out. */

const SQ3=Math.sqrt(3), TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- board ---------------- */
const BOARD_ROWS=8, BOARD_COLS=12;
const DIRS={E:[1,0],NE:[1,-1],NW:[0,-1],W:[-1,0],SW:[-1,1],SE:[0,1]}, DIRLIST=Object.values(DIRS);
// The arrays below are rebuilt in place by buildBoard, so references to them stay valid.
const BOARD=new Map(), CR=new Map(), TILES=[], P_TILES=[], E_TILES=[];
function buildBoard(){
  BOARD.clear(); CR.clear(); TILES.length=0; P_TILES.length=0; E_TILES.length=0;
  for(let r=0;r<BOARD_ROWS;r++) for(let c=0;c<BOARD_COLS;c++){
    // odd rows are offset by half a tile; q is the axial column so a row keeps one r
    const q=c-Math.floor(r/2), x=c+(r%2)*.5-(BOARD_COLS-.5)/2, side=c<BOARD_COLS/2?'p':'e';
    const t={q,r,col:c,x,side,wx:SQ3*x,wz:1.5*(r-(BOARD_ROWS-1)/2),key:q+','+r,occ:null,flash:0,flashC:'#fff'};
    BOARD.set(t.key,t); CR.set(c+','+r,t); TILES.push(t); (side==='p'?P_TILES:E_TILES).push(t);
  }
}
buildBoard();
const tileAt=(q,r)=>BOARD.get(q+','+r);
const tileCR=(c,r)=>CR.get(c+','+r);   // by board column and row
// Floor patterns for lobs, environments and traps, kept to one side of the board.
function patternTiles(t,pat,side){
  let ts;
  switch(pat){
    case 'burst': ts=[t,...around(t)]; break;
    case 'ring': ts=around(t); break;
    case 'cross': ts=TILES.filter(x=>(x.r===t.r&&Math.abs(x.col-t.col)<=2)||(x.col===t.col&&Math.abs(x.r-t.r)<=2)); break;
    case 'column': ts=TILES.filter(x=>x.col===t.col); break;
    case 'row': ts=TILES.filter(x=>x.r===t.r); break;
    default: ts=[t];
  }
  return side?ts.filter(x=>x.side===side):ts;
}
const neighbors=t=>DIRLIST.map(d=>tileAt(t.q+d[0],t.r+d[1])).filter(Boolean);
const around=neighbors;   // area effects hit the 6 surrounding tiles
const hexDist=(a,b)=>{ const dq=a.q-b.q, dr=a.r-b.r; return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2; };
function lineTiles(t,d){ const out=[]; let q=t.q,r=t.r; for(;;){ q+=d[0]; r+=d[1]; const n=tileAt(q,r); if(!n) break; out.push(n); } return out; }
function wedgeTiles(t,len){ return TILES.filter(o=>{ const dx=o.wx-t.wx, dz=o.wz-t.wz; return dx>.1 && Math.hypot(dx,dz)<=len*SQ3 && Math.abs(dz)<=dx*1.2; }); }
function pathTo(from,to){ // BFS over free tiles on your side
  if(to.side!=='p') return [];
  const prev=new Map([[from,null]]), q=[from];
  while(q.length){ const c=q.shift(); if(c===to) break;
    for(const n of neighbors(c)) if(n.side==='p'&&!prev.has(n)&&(!n.occ||n===to)){ prev.set(n,c); q.push(n); } }
  if(!prev.has(to)||to.occ) return [];
  const path=[]; for(let c=to;c&&c!==from;c=prev.get(c)) path.unshift(c); return path;
}

/* enemies, encounters and terrain live in enemies.js */

/* ---------------- state ---------------- */
let B=null;
const GAUGE_MAX=10;

function startBattle(list,depth,hooks,opts){
  buildBoard();
  const p={kind:'player', hp:120, maxHp:120, tile:P_TILES.find(t=>t.col===1&&t.r===(BOARD_ROWS>>1)), path:[], moveCd:0, castCd:0, wandCd:0, charging:false, chargeT:0,
           barrier:0, shieldTurns:0, hurtT:0, invT:0, dodge:false, powerT:0, pactT:0, courageT:0, intervene:0, hasteT:0, regenT:0, regenAmt:0, hero:null};
  p.tile.occ=p;
  B={depth, hooks:hooks||{}, piles:createPiles(list), player:p, aim:null, enemies:[], allies:[], walls:[], shots:[], lobs:[], teles:[], fx:[], floaters:[], parts:[],
     timers:[], gauge:0, phase:'custom', time:0, log:[]};
  B.waves=makeEncounter(depth); B.wave=0;
  makeTerrain(depth);
  spawnWave(0);
  if(opts&&opts.prepare) opts.prepare(B.piles);
  applyGear(p,opts&&opts.gear); p.look=opts&&opts.look; B.piles.surgeLuck=(opts&&opts.gear&&opts.gear.surge)||0;
  openCustomScreen();
  return B;
}

// Your equipped weapon and armor (see gear.js): wand damage, speed and element, max HP, damage
// taken off every hit, a starting shield, and any curse's drawback.
function applyGear(p,m){
  m=Object.assign({tap:0,charged:0,cd:1,charge:1,hp:0,guard:0,shield:0,kind:'wand'},m||{});
  const K=(typeof WEAPON_KINDS!=='undefined'&&WEAPON_KINDS[m.kind])||{tap:3,charged:7,cd:.3,ccd:.5};
  p.wand={kind:m.kind, tap:Math.max(1,K.tap+m.tap), charged:Math.max(2,K.charged+m.charged), cd:K.cd*m.cd, ccd:K.ccd*m.cd, charge:.9*m.charge, color:m.color||null,
    chill:m.chill||0, zap:m.zap||0, drain:m.drain||0, glow:m.glow||0, burn:m.burn||0, misfire:m.misfire||0, hpPerShot:m.hpPerShot||0};
  p.guard=m.guard; p.slow=m.slow||1; p.hurt=m.hurt||1; p.gaugeMult=m.gauge||1;
  p.dodgeChance=m.dodge||0; p.block=m.block||0; p.blocksLeft=p.block; p.counter=m.counter||0; p.regenGear=m.regen||0; p.castSlow=m.castSlow||1; p.power=m.power||{};
  p.maxHp+=m.hp; p.hp=p.maxHp;
  if(m.shield){ p.barrier=m.shield; p.shieldTurns=2; }
}
const alive=()=>B.enemies.filter(e=>e.hp>0);
function later(sec,fn){ B.timers.push({t:sec,fn}); }
// units slide between tiles instead of jumping
const INTENT_ICON={shot:'➶',firebomb:'🔥',iceslam:'❄',cross:'✚',rush:'➤',blink:'☾',mend:'✚',quake:'⚠',boulders:'●'};
const posOf=u=>[u.rx??u.tile.wx, u.rz??u.tile.wz];
function shake(a){ View.shake=Math.max(View.shake||0,a); }
function floater(text,t,color,big){ B.floaters.push({text,wx:t.wx,wz:t.wz,y:1.6,t:0,color:color||'#fff',big}); }
function flash(t,color,amt){ t.flash=Math.max(t.flash,amt||1); t.flashC=color; }
function burst(t,color,n,y){ for(let i=0;i<(n||10);i++) B.parts.push({wx:t.wx,wz:t.wz,y:y||.8,vx:rnd(-2,2),vz:rnd(-2,2),vy:rnd(1,3.5),t:0,life:rnd(.4,.8),color}); }
function colorOf(card){ return card&&card.color?COLORS[card.color].c:'#e6f4ff'; }

/* ---------------- custom screen ---------------- */
function openCustomScreen(){
  const b=B; if(!b||b.phase==='win'||b.phase==='lose') return;
  if(b.turn!=null) endTurn(); b.turn=(b.turn==null?0:b.turn+1);
  b.phase='custom'; b.player.charging=false; b.player.path=[];
  b.justDrawn=new Set(openCustom(b.piles).map(c=>c.uid));
  b.hooks.onCustom&&b.hooks.onCustom();
}
function closeCustomScreen(){
  const b=B; if(!b||b.phase!=='custom') return;
  commitCustom(b.piles); b.phase='fight'; b.gauge=0;
  if(b.turn>0&&b.hooks.onTurn) b.hooks.onTurn(b.turn+1);
  for(const cb of b.piles.combos||[]){ if(cb.kind==='recipe'){ b.hooks.onRecipe&&b.hooks.onRecipe(cb.recipe); continue; } if(cb.kind!=='straight') b.hooks.onCombo&&b.hooks.onCombo(cb.label); }
  b.hooks.onFight&&b.hooks.onFight();
}
const gaugeFull=()=>B.gauge>=GAUGE_MAX;

/* ---------------- damage ---------------- */
function hitEnemy(e,base,card,opts){
  if(!e||e.hp<=0) return 0;
  opts=opts||{};
  const pl=B.player;
  let mult=opts.raw?1:colorMult(card&&card.color,e.color)*(e.curseT>0?1.3:1)*(pl.pactT>0||pl.courageT>0?1.3:1)*(card&&card.valor&&pl.hp<=pl.maxHp/2?1.5:1)*heroMult(card)*((card&&pl.power&&pl.power[card.color])||1);
  let dmg=Math.max(1,Math.round(base*mult));
  if(e.barrier>0&&!opts.raw&&!opts.dig){ const a=Math.min(e.barrier,dmg); e.barrier-=a; dmg-=a; if(!dmg){ floater('🛡',e.tile,'#fff0b3'); return 0; } }
  e.hp-=dmg; e.hitT=.18; if(dmg>=40||mult>=WEAK_MULT) shake(dmg>=60?5:3);
  floater(dmg+(mult>=WEAK_MULT?' WEAK!':''),e.tile,mult>=WEAK_MULT?'#ffe24d':opts.raw?'#b8ffb0':'#fff',mult>=WEAK_MULT);
  flash(e.tile,colorOf(card),.8);
  if(card&&!opts.raw) applyStatus(e,card);
  if(card&&!opts.raw&&!opts.noShove) shove(e,card,base);
  if(card&&card.drain&&!opts.raw) healPlayer(Math.round(dmg*card.drain));
  if(card&&card.mend&&!opts.raw) healPlayer(card.mend);
  if(heroOn('widow')&&!opts.raw) healPlayer(Math.round(dmg*.2),true);
  if(e.hp<=0) killEnemy(e);
  return dmg;
}
function applyStatus(e,c){
  if(c.burn) e.burnT=Math.max(e.burnT,c.burn);
  if(c.slow) e.slowT=Math.max(e.slowT,c.slow);
  if(c.curse) e.curseT=Math.max(e.curseT,c.curse);
  if(c.poison){ e.poisonT=8; e.poisonAmt=Math.max(e.poisonAmt,c.poison); }
  if(c.freeze){ e.freezeT=Math.max(e.freezeT,c.freeze); cancelAttack(e); }
  if(c.stun){ e.stunT=Math.max(e.stunT,c.stun); cancelAttack(e); }
  if(c.confuse) e.confuseT=Math.max(e.confuseT||0,c.confuse);
}
// Knockback shoves an enemy one column back; if something is in the way it slams into it for 50% more.
// Pull drags it one column toward you.
function shove(e,c,base){
  if(e.hp<=0||(!c.push&&!c.pull)) return;
  const to=tileCR(e.tile.col+(c.push?1:-1),e.tile.r);
  if(to&&to.side==='e'&&!to.occ){ e.tile.occ=null; e.tile=to; to.occ=e; burst(to,'#e6f4ff',6,.3); if(to.trap) springTrap(to,e); }
  else if(c.push){ floater('slam!',e.tile,'#ffe24d'); hitEnemy(e,Math.round(base*.5),null,{raw:true}); }
}
function cancelAttack(e){
  const had=e.windT>0||e.casting||B.teles.some(t=>t.owner===e);
  e.windT=0; e.casting=null; B.teles=B.teles.filter(t=>t.owner!==e);
  if(had) floater('cancelled',e.tile,'#6fd6ff');
}
function killEnemy(e){
  e.hp=0; e.deathT=.5; if(e.tile.occ===e) e.tile.occ=null; cancelAttack(e); burst(e.tile,COLORS[e.color].c,30,1); shake(4);
  if(e.def.split){ const spots=around(e.tile).filter(t=>t.side==='e'&&!t.occ).slice(0,2);   // a Gloop splits in two
    if(!spots.length&&!e.tile.occ) spots.push(e.tile);
    spots.forEach(t=>{ const m=makeEnemy(e.def.split,t,B.depth); m.atkT+=1; B.enemies.push(m); }); }
  if(!alive().length&&B.phase==='fight'){
    if(B.wave<B.waves.length-1){ const nx=B.wave+1; later(1.1,()=>spawnWave(nx)); B.wave=nx-.5; return; }
    B.phase='win'; B.player.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(true)); }
}
function healPlayer(n,quiet){ const p=B.player; if(n<=0||p.hp<=0) return; const h=Math.min(n,p.maxHp-p.hp); p.hp+=h; if(h>0&&!quiet) floater('+'+h,p.tile,'#39ff8a'); }
function hitPlayer(dmg){
  const p=B.player; if(B.phase!=='fight') return;
  if(p.invT>0){ floater('miss',p.tile,'#7fd4ff'); return; }
  if(p.dodge){ p.dodge=false; floater('dodge',p.tile,'#6fd6ff'); return; }
  if(p.dodgeChance&&Math.random()<p.dodgeChance){ floater('dodge',p.tile,'#9fdcff'); return; }
  if(p.blocksLeft>0){ p.blocksLeft--; floater('blocked',p.tile,'#f2c94c'); burst(p.tile,'#f2c94c',8,1); return; }
  if(p.barrier>0){ const a=Math.min(p.barrier,dmg); p.barrier-=a; dmg-=a; floater('🛡'+a,p.tile,'#6fd6ff'); }
  if(p.guard&&dmg>0) dmg=Math.max(1,Math.round(dmg*(1-p.guard)));
  if(p.hurt&&p.hurt!==1&&dmg>0) dmg=Math.round(dmg*p.hurt);
  if(dmg<=0) return;
  if(p.counter){ const foe=alive().filter(e=>hexDist(e.tile,p.tile)<=5).sort((a,b)=>hexDist(a.tile,p.tile)-hexDist(b.tile,p.tile))[0];
    if(foe){ B.fx.push({kind:'beam',a:p.tile,b:foe.tile,color:'#e6f4ff',t:0,life:.2}); hitEnemy(foe,p.counter,null,{raw:true}); } }
  p.hp-=dmg; p.hurtT=.25; shake(dmg>=15?8:5); floater('-'+dmg,p.tile,'#ff5d6c',true); flash(p.tile,'#ff5d6c',1); B.hooks.onHurt&&B.hooks.onHurt(dmg);
  // Divine Intervention: a lethal hit leaves you at 1 HP, then heals
  if(p.hp<=0&&p.intervene){ p.hp=1; const h=p.intervene; p.intervene=0; floater('Divine Intervention',p.tile,'#fff0b3',true); burst(p.tile,'#fff0b3',30,1); healPlayer(h); }
  if(p.hp<=0){ p.hp=0; B.phase='lose'; p.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(false)); }
}
function hitBlock(o,dmg,src){
  o.hp-=dmg; floater('-'+dmg,o.tile,'#ffb3a0'); flash(o.tile,'#ffb3a0',.6);
  if(o.thorns&&src&&src.hp>0) hitEnemy(src,o.thorns,o.card);
  if(o.hp<=0) removeBlock(o);
}
function removeBlock(o){
  if(o.tile.occ===o) o.tile.occ=null; burst(o.tile,colorOf(o.card),12);
  if(o===B.player.hero) heroLeaves();
  B.walls=B.walls.filter(w=>w!==o); B.allies=B.allies.filter(s=>s!==o);
}
function payHp(n){ const p=B.player; if(!n) return; const c=Math.min(n,p.hp-1); p.hp-=c; floater('-'+c,p.tile,'#e0588f'); }

/* ---------------- casting ---------------- */
// A card as cast: numbers scaled by any combo on its queue slot.
function scaled(c,m){ if(!m||m===1) return c; const o=Object.assign({},c); for(const k of ['pow','amt','thorns','hp']) if(typeof o[k]==='number') o[k]=Math.round(o[k]*m); return o; }
function playCard(inst){
  const b=B, p=b.player, c=scaled(inst.card,inst.mult);
  b.log.push(c.name);
  b.hooks.onCast&&b.hooks.onCast(c,inst);
  B.fx.push({kind:'ring',a:p.tile,color:colorOf(c),t:0,life:.45}); burst(p.tile,colorOf(c),10,1.2);
  if(c.self&&c.type!=='boon') payHp(c.self);
  CAST[c.type==='piece'?c.base:c.type](c,p);
}
function castCard(){
  const b=B; if(!b||b.phase!=='fight') return;
  const p=b.player; if(p.castCd>0) return;
  const inst=castNext(b.piles); if(!inst) return;
  p.castCd=(p.hasteT>0||heroOn('volta')?.25:.45)*(p.castSlow||1);
  playCard(inst);
  if(inst.straight){ // Straight: the next two cards follow in one chain, then a finisher
    const chain=[]; for(let i=0;i<inst.straight.length-1;i++){ const n=castNext(b.piles); if(n) chain.push(n); }
    const grand=inst.straight.length>=4;
    b.hooks.onCombo&&b.hooks.onCombo(grand?'Grand Straight!':'Straight!');
    chain.forEach((n,i)=>later(.28*(i+1),()=>playCard(n)));
    const total=[inst,...chain].reduce((a,n)=>a+(scaled(n.card,n.mult).pow||20),0);
    later(.28*(chain.length+1)+.15,()=>{ const e=nearestEnemyTile(p.tile); if(!e) return; const t=e;
      B.fx.push({kind:'beam',a:p.tile,b:t,color:'#ffe066',t:0,life:.45}); floater(grand?'GRAND STRAIGHT!':'STRAIGHT!',t,'#ffe066',true); shake(grand?10:7); hitAt(t,Math.round(total*(grand?.9:.5)),null); });
    p.castCd=.28*(chain.length+1)+.4;
  }
}
const CAST={
  strike(c,p){
    const row=lineTiles(p.tile,DIRS.E);
    if(c.shape==='line') shoot(p.tile,row,{card:c,dmg:c.pow,from:'p'});
    else if(c.shape==='row'){ row.forEach((t,i)=>{ flash(t,colorOf(c),1); hitAt(t,c.pow,c); });
      B.fx.push({kind:'beam',a:p.tile,b:row[row.length-1]||p.tile,color:colorOf(c),t:0,life:.3}); }
    else if(c.shape==='wedge'){ const ts=wedgeTiles(p.tile,2.6); ts.forEach(t=>{ flash(t,colorOf(c),1); hitAt(t,c.pow,c); }); }
    else if(c.shape==='all') alive().forEach(e=>{ B.fx.push({kind:'bolt',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.35}); hitEnemy(e,c.pow,c); });
    else if(c.shape==='dig') shoot(p.tile,row,{card:c,dmg:c.pow,from:'p',dig:true});
    else if(c.shape==='zigzag'){ const alt=tileCR(p.tile.col,p.tile.r+1)?1:-1, path=[];
      for(let i=1;i<BOARD_COLS;i++){ const t=tileCR(p.tile.col+i,p.tile.r+(i%2?alt:0)); if(t) path.push(t); } shoot(p.tile,path,{card:c,dmg:c.pow,from:'p'}); }
    else if(c.shape==='diag') for(const d of [-1,1]){ const path=[]; for(let i=1;i<BOARD_COLS;i++){ const t=tileCR(p.tile.col+i,p.tile.r+d*i); if(!t) break; path.push(t); } shoot(p.tile,path,{card:c,dmg:c.pow,from:'p'}); }
    else if(c.shape==='missiles') for(let i=0;i<c.n;i++) later(i*.09,()=>{ const e=pick(alive()); if(!e) return;
      B.fx.push({kind:'arc',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.25}); hitEnemy(e,c.pow,c); });
  },
  lob(c,p){ lobFrom(p.tile,c,c.pow,c.radius,c.delay||.6,B.aim); B.aim=null; },
  ward(c,p){
    if(c.ward==='barrier'){ p.barrier=c.amt; p.shieldTurns=c.turns||2; floater('🛡'+c.amt,p.tile,'#6fd6ff'); return; }   // shields replace, never stack
    placementTiles(c.n).forEach(t=>{ const w={kind:'wall',card:c,tile:t,hp:c.hp,maxHp:c.hp,thorns:c.thorns||0,turns:c.turns||2,maxTurns:c.turns||2}; t.occ=w; B.walls.push(w); burst(t,colorOf(c),8,.3); });
  },
  sentry(c,p){ placeAlly(c,'sentry',c.hp||40,c.turns); },
  trap(c,p){ // on the aimed tile, or a free tile next to the nearest enemy
    const e=alive().sort((a,b)=>hexDist(p.tile,a.tile)-hexDist(p.tile,b.tile))[0];
    let t=B.aim&&!B.aim.occ&&!B.aim.trap?B.aim:null; B.aim=null;
    if(!t&&e) t=pick(around(e.tile).filter(x=>x.side==='e'&&!x.occ&&!x.trap));
    if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
    t.trap={card:c,turns:c.turns||2}; burst(t,colorOf(c),10,.2); },
  environment(c,p){
    const t=B.aim||nearestEnemyTile(p.tile); B.aim=null; if(!t) return;
    for(const x of patternTiles(t,c.pattern,'e')){ flash(x,colorOf(c),.8);
      if(c.turns) x.envTurns=Math.max(x.envTurns||0,c.turns);   // lasts until that many turns end
      if(c.env==='burn') x.burnT=1e9;
      if(c.env==='freeze'){ x.iceT=1e9; if(x.occ&&x.occ.kind==='enemy') x.occ.slowT=Math.max(x.occ.slowT,2); }
      if(c.env==='bramble'){ x.thornT=1e9; x.thornPow=c.pow; x.thornCard=c; }
      if(c.env==='tremor') hitAt(x,c.pow,c); } },
  charge(c,p){ if(c.fx==='lob') lobFrom(p.tile,c,c.pow,0,.45,B.aim); else shoot(p.tile,lineTiles(p.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); },
  utility(c,p){
    const pl=B.piles;
    if(c.util==='draw'){ const got=drawCards(pl,c.n); floater(got.length?'+'+got.length+' to hand':'deck empty',p.tile,'#7fd4ff'); }
    else if(c.util==='recall'){ const got=recallTop(pl); floater(got?'Recall: '+got.card.name:'nothing to recall',p.tile,'#7fd4ff'); }
    else if(c.util==='copy'){ const got=copyNext(pl); floater(got?'Copy: '+got.card.name:'nothing to copy',p.tile,'#7fd4ff'); }
    else if(c.util==='cleanse'){ const n=B.teles.filter(t=>!t.friendly).length; B.teles=B.teles.filter(t=>t.friendly); B.enemies.forEach(e=>e.windT=0);
      if(n) floater('cleansed',p.tile,'#e6f4ff'); healPlayer(c.amt); }
    burst(p.tile,colorOf(c),10,1);
  },
  summon(c,p){ placeAlly(c,c.ai,c.hp,c.turns); },
  hero(c,p){ callHero(c); },
  machine(c,p){
    if(c.ai==='bulwark') return CAST.ward({ward:'wall',n:c.n,hp:c.hp,turns:c.turns,color:c.color,name:c.name},p);
    placeAlly(c,c.ai,c.hp,c.turns);
  },
  boon(c,p){
    const col=colorOf(c);
    switch(c.boon){
      case 'power': p.powerT=c.dur; break;
      case 'pact': payHp(c.self); p.pactT=c.dur; break;
      case 'haste': p.hasteT=c.dur; break;
      case 'dodge': p.dodge=true; break;
      case 'phase': p.invT=c.dur; break;
      case 'regen': p.regenT=c.dur; p.regenAmt=c.amt; break;
      case 'heal': healPlayer(c.amt); break;
      case 'gauge': B.gauge=Math.min(GAUGE_MAX,B.gauge+c.amt*GAUGE_MAX); break;
      case 'courage': p.courageT=c.dur; break;
      case 'intervene': p.intervene=c.amt; break;
    }
    burst(p.tile,col,16,1); floater(c.name,p.tile,col);
  },
};
// Arc onto the aimed tile, or the enemy nearest to `from`, over walls and allies.
// The tile is fixed at cast, so an enemy that moves during the flight is missed.
const nearestEnemyTile=from=>{ const e=alive().sort((a,b)=>hexDist(from,a.tile)-hexDist(from,b.tile))[0]; return e?e.tile:null; };
// damage whatever enemy thing stands on a tile: an enemy, or its wall or sentry
function hitAt(t,pow,c){ const o=t.occ; if(!o) return; if(o.kind==='enemy') hitEnemy(o,pow,c); else if(o.enemy) hitBlock(o,pow,null); }
function lobFrom(from,c,pow,radius,dur,target){
  const t=target||nearestEnemyTile(from); if(!t) return;
  const ts=patternTiles(t,c.pattern||(radius?'burst':'single'),'e');
  B.lobs.push({a:from,b:t,t:0,dur,card:c});
  B.teles.push({tiles:ts,t:0,dur,friendly:true});
  later(dur,()=>ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),6,.2); hitAt(x,pow,c); }));
}
// Sentries, summons and machines stand on a free tile of your side, nearest your row and the rift.
// where walls, towers, summons and machines go: free tiles on your side, nearest your row and the front
function placementTiles(n){ const p=B.player; return P_TILES.filter(t=>!t.occ).sort((a,b)=>Math.abs(a.r-p.tile.r)-Math.abs(b.r-p.tile.r)||b.x-a.x).slice(0,n); }
function placeAlly(c,ai,hp,turns){
  const p=B.player, t=placementTiles(1)[0];
  if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
  const a={kind:'ally',ai,card:c,tile:t,hp,maxHp:hp,turns:turns||1,maxTurns:turns||1,fireT:.4}; t.occ=a; B.allies.push(a); burst(t,colorOf(c),10,.4);
  return a;
}

/* ---------------- heroes ----------------
   A hero stands on your side for a few turns, attacks on its own, and while it stands it
   empowers you (its aura). One at a time: calling another sends the first one home. */
const heroOn=id=>{ const h=B&&B.player.hero; return !!(h&&h.hp>0&&h.card.hero===id); };
const heroMult=card=>(heroOn('pyra')?1.3:1)*(heroOn('aurelion')&&card?1.25:1);
function callHero(c){
  const p=B.player; if(p.hero) removeBlock(p.hero);
  const a=placeAlly(c,'hero',c.hp,c.turns); if(!a) return;
  p.hero=a; a.fireT=.8;
  if(c.hero==='thornfather'){ p.maxHp+=30; healPlayer(30); }
  if(c.hero==='aurelion') p.intervene=Math.max(p.intervene||0,c.amt);
  if(c.hero==='ysolde') heroShield();
  burst(a.tile,colorOf(c),40,1.6); burst(a.tile,'#ffe066',20,2); flash(a.tile,'#ffe066',1); shake(6);
  B.fx.push({kind:'ring',a:p.tile,color:'#ffe066',t:0,life:.7});
  B.hooks.onHero&&B.hooks.onHero(c);
}
function heroShield(){ const p=B.player, c=p.hero.card; if(p.barrier<c.amt){ p.barrier=c.amt; p.shieldTurns=1; floater('🛡'+c.amt,p.tile,'#6fd6ff'); } }
function heroLeaves(){ const p=B.player, c=p.hero.card; p.hero=null; floater(c.name.split(',')[0]+' departs',p.tile,'#ffe066');
  if(c.hero==='thornfather'){ p.maxHp-=30; p.hp=Math.min(p.hp,p.maxHp); } }
function heroStrike(a,near){
  const c=a.card, col=colorOf(c), es=alive(); if(!es.length) return;
  near=near||es[0];
  switch(c.hero){
    case 'pyra': lobFrom(a.tile,c,c.pow,1,.6,near.tile); break;
    case 'ysolde': B.fx.push({kind:'beam',a:a.tile,b:near.tile,color:col,t:0,life:.3}); hitEnemy(near,c.pow,c); break;
    case 'volta': { let from=a.tile; es.sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile)).slice(0,3).forEach((e,i)=>{ const f=from;
      later(i*.12,()=>{ B.fx.push({kind:'bolt',a:f,b:e.tile,color:col,t:0,life:.3}); hitEnemy(e,c.pow,c); }); from=e.tile; }); break; }
    case 'thornfather': [near.tile,...around(near.tile)].forEach(t=>{ flash(t,col,.8); burst(t,col,4,.3); hitAt(t,c.pow,c); }); break;
    case 'aurelion': B.fx.push({kind:'beam',a:near.tile,b:near.tile,y0:6,color:'#fff6c8',t:0,life:.45}); flash(near.tile,'#fff6c8',1); burst(near.tile,'#fff6c8',14,1.5); hitEnemy(near,c.pow,c); healPlayer(c.heal); break;
    case 'widow': B.fx.push({kind:'arc',a:a.tile,b:near.tile,color:col,t:0,life:.35}); hitEnemy(near,c.pow,c); break;
  }
}
// A turn ends: shields and board pieces count down, and expire at 0.
function endTurn(){
  const b=B, p=b.player;
  if(p.shieldTurns>0&&--p.shieldTurns<=0&&p.barrier>0){ p.barrier=0; floater('shield fades',p.tile,'#6fd6ff'); }
  for(const e of alive()) if(e.shieldTurns>0&&--e.shieldTurns<=0) e.barrier=0;
  for(const o of [...b.walls,...b.allies]) if(--o.turns<=0){ floater('expired',o.tile,'#9fdcff'); removeBlock(o); }
  for(const t of TILES){
    if(t.trap&&--t.trap.turns<=0) t.trap=null;
    if(t.envTurns>0&&--t.envTurns<=0){ t.burnT=0; t.iceT=0; t.thornT=0; }
  }
  if(heroOn('ysolde')) heroShield();
  p.blocksLeft=p.block||0;   // a shield is ready again each turn
}
function updateAlly(a,dt){
  a.fireT-=dt;
  if(a.fireT>0) return;
  const c=a.card; a.fireT=c.rate||1;
  if(a.enemy){ shoot(a.tile,lineTiles(a.tile,DIRS.W),{dmg:a.pow,from:'e',owner:null,color:colorOf(c)}); return; }
  const es=alive(); if(!es.length&&a.ai!=='healer') return;
  const inRow=es.filter(e=>e.tile.r===a.tile.r);
  const near=(inRow.length?inRow:es).sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0];
  switch(a.ai){
    case 'sentry': case 'turret': case 'repeater': case 'guardian':
      if(near){ B.fx.push({kind:'bolt',a:a.tile,b:near.tile,color:colorOf(c),t:0,life:.18,y0:1.3}); hitEnemy(near,c.pow,c); } break;
    case 'shooter': shoot(a.tile,lineTiles(a.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); break;
    case 'bomber': case 'mortar': lobFrom(a.tile,c,c.pow,a.ai==='mortar'?1:0,.7); break;
    case 'healer': healPlayer(c.amt); break;
    case 'hero': heroStrike(a,near); break;
  }
}
// a trap springs when an enemy steps on it
function springTrap(t,e){ const c=t.trap.card; t.trap=null; floater(c.name,t,colorOf(c));
  const ts=c.trap==='blast'?patternTiles(t,'burst','e'):[t]; ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),8,.3); hitAt(x,c.pow,c); }); }
function shoot(from,tiles,o){ B.shots.push(Object.assign({a:from,tiles,i:-1,stepT:0,speed:o.from==='p'?.045:.08,hit:new Set()},o)); }

function fireWand(charged){
  const b=B, p=b.player; if(b.phase!=='fight'||p.wandCd>0) return;
  const w=p.wand||{kind:'wand',tap:3,charged:7,cd:.3,ccd:.5};
  p.wandCd=charged?w.ccd||.5:w.cd||.3;
  if(w.hpPerShot) payHp(w.hpPerShot);
  if(w.misfire&&Math.random()<w.misfire){ floater('fizzle',p.tile,'#93a9ba'); burst(p.tile,'#56606a',5,1); return; }
  const dmg=Math.round((charged?w.charged:w.tap)*(p.powerT>0?2.5:1));
  // an elemental weapon shoots in its color, and its effects ride on the shot like a card's
  const card=w.color||w.burn||w.drain||w.zap||w.chill||w.glow?{id:'wand', name:'Wand', color:w.color, burn:w.burn||0, drain:w.drain||0,
    freeze:charged?w.chill:0, stun:w.zap&&Math.random()<w.zap?.5:0, mend:charged?w.glow:0}:null;
  const row=lineTiles(p.tile,DIRS.E), o=()=>({dmg,from:'p',wand:true,big:charged,card});
  // each kind of weapon fires its own way (see WEAPON_KINDS in gear.js)
  switch(w.kind){
    case 'staff': shoot(p.tile,row,Object.assign(o(),{pierce:charged?1:0})); break;
    case 'bow': if(charged){ for(const dr of [-1,0,1]){ const st=dr?tileCR(p.tile.col,p.tile.r+dr):p.tile; if(st) shoot(st,lineTiles(st,DIRS.E),o()); } }
      else shoot(p.tile,row,Object.assign(o(),{pierce:1,falloff:.6})); break;
    case 'crossbow': shoot(p.tile,row,Object.assign(o(),charged?{dig:true}:{push:true})); break;
    case 'spear': shoot(p.tile,charged?row:row.slice(0,6),Object.assign(o(),charged?{pierce:9}:{})); break;
    default: shoot(p.tile,row,o());
  }
}

/* ---------------- simulation ---------------- */
const PACE=.7;
function update(dt){
  const b=B; if(!b) return;
  b.time+=dt;
  // Effects keep animating on the Custom screen, the fight itself is paused.
  for(const f of b.fx) f.t+=dt; b.fx=b.fx.filter(f=>f.t<f.life);
  for(const f of b.floaters){ f.t+=dt; f.y+=dt*1.2; } b.floaters=b.floaters.filter(f=>f.t<.9);
  const k=1-Math.exp(-dt*16);
  for(const u of [b.player,...b.enemies,...b.allies]){ u.rx=u.rx==null?u.tile.wx:u.rx+(u.tile.wx-u.rx)*k; u.rz=u.rz==null?u.tile.wz:u.rz+(u.tile.wz-u.rz)*k; }
  for(const e of b.enemies) if(e.hp<=0&&e.deathT>0) e.deathT-=dt;
  View.shake=(View.shake||0)*Math.exp(-dt*9);
  for(const q of b.parts){ q.t+=dt; q.vy-=9*dt; q.wx+=q.vx*dt; q.wz+=q.vz*dt; q.y=Math.max(0,q.y+q.vy*dt); } b.parts=b.parts.filter(q=>q.t<q.life);
  for(const t of TILES) t.flash=Math.max(0,t.flash-dt*3);
  if(b.phase==='custom') return;
  // The fight runs at PACE speed (70%) so enemies, shots and attacks are easier to follow.
  // Your own moving, firing and charging stay at full speed.
  const rdt=dt; dt*=PACE;

  for(const tm of b.timers) tm.t-=dt;
  const due=b.timers.filter(tm=>tm.t<=0); b.timers=b.timers.filter(tm=>tm.t>0); due.forEach(tm=>tm.fn());
  if(b.phase!=='fight'){ b.shots=[]; b.teles=[]; return; }

  const p=b.player, haste=p.hasteT>0;
  b.gauge=Math.min(GAUGE_MAX,b.gauge+dt*(heroOn('volta')?1.5:1)*(p.gaugeMult||1));
  ['moveCd','wandCd','hurtT'].forEach(k=>p[k]=Math.max(0,p[k]-rdt));
  ['castCd','invT','powerT','pactT','courageT','hasteT','regenT'].forEach(k=>p[k]=Math.max(0,p[k]-dt));
  if(p.regenT>0){ p.regenAcc=(p.regenAcc||0)+p.regenAmt*dt; if(p.regenAcc>=5){ healPlayer(5); p.regenAcc-=5; } }
  if(p.regenGear){ p.gearAcc=(p.gearAcc||0)+p.regenGear*dt; if(p.gearAcc>=3){ healPlayer(3,true); p.gearAcc-=3; } }
  if(heroOn('thornfather')){ p.heroAcc=(p.heroAcc||0)+3*dt; if(p.heroAcc>=6){ healPlayer(6); p.heroAcc-=6; } }
  if(p.charging) p.chargeT=Math.min(1.2,p.chargeT+rdt);
  if(p.path.length&&p.moveCd<=0){ const n=p.path[0]; if(n.side==='p'&&!n.occ){ p.tile.occ=null; p.tile=n; n.occ=p; p.path.shift(); p.moveCd=(haste?.08:.14)*(icy(n)?2.2:1)*(p.slow||1); } else p.path=[]; }

  // your shots and enemy shots travel tile by tile
  for(const s of b.shots){
    s.stepT+=dt;
    while(s.stepT>=s.speed&&!s.done){ s.stepT-=s.speed; s.i++;
      const t=s.tiles[s.i]; if(!t){ s.done=true; break; }
      const o=t.occ;
      if(s.dig&&o&&(o.kind==='rock'||o.enemy)) continue;   // diggers tunnel under walls and rocks
      if(o&&o.kind==='rock'){ hitRock(o,s.dmg); s.done=true; }
      else if(s.from==='p'&&o&&o.kind==='enemy'&&o.hp>0){ if(s.hit.has(o)) continue; s.hit.add(o);
        hitEnemy(o,s.dmg,s.card,{dig:s.dig}); if(s.push&&o.hp>0) shove(o,{push:1},s.dmg);
        if(s.pierce>0){ s.pierce--; s.dmg=Math.max(1,Math.round(s.dmg*(s.falloff||1))); burst(t,'#ffffff',4,.8); } else s.done=true; }
      else if(s.from==='p'&&o&&o.enemy){ hitBlock(o,s.dmg,null); s.done=true; }
      else if(s.from==='e'&&o&&o.kind!=='enemy'&&!o.enemy){ if(o.kind==='player') hitPlayer(s.dmg); else hitBlock(o,s.dmg,s.owner); s.done=true; }
      if(s.done) burst(t,s.card?colorOf(s.card):s.color||'#fff',6,.8);
    }
  }
  b.shots=b.shots.filter(s=>!s.done);

  for(const l of b.lobs) l.t+=dt; b.lobs=b.lobs.filter(l=>l.t<l.dur);

  for(const tl of b.teles){ tl.t+=dt;
    if(tl.t>=tl.dur&&!tl.friendly){ if(tl.owner&&tl.owner.hp<=0) continue;
      for(const t of tl.tiles){ flash(t,'#ff5d6c',1); const o=t.occ; if(!o) continue;
        if(o.kind==='player') hitPlayer(tl.dmg); else if(o.kind!=='enemy'&&o.kind!=='rock'&&!o.enemy) hitBlock(o,tl.dmg,tl.owner); }
      if(tl.after) tl.after(); } }
  b.teles=b.teles.filter(tl=>tl.t<tl.dur);

  for(const a of b.allies.slice()) updateAlly(a,dt);

  updateTerrain(dt);
  for(const e of alive()) updateEnemy(e,dt);
}


/* ---------------- input helpers ---------------- */
// Aiming lobs: tap an enemy-side tile (again to clear it). A lob card uses the aim once; a lob charge keeps it.
// cards that land on a tile you aim: lobs, lob charges, traps and environments
/* ---------------- cast preview ----------------
   What the next queued card will do if cast right now, drawn on the board until it is cast:
   the tiles it covers, the enemies it would hit (with the damage they would take), or where
   it would place walls and units. It follows you as you move. */
// the path of a shot from you: stops at the first enemy (or enemy wall, or rock) unless it digs under
function shotPath(tiles,dig){ const path=[];
  for(const t of tiles){ path.push(t); const o=t.occ; if(!o) continue;
    if(o.kind==='enemy'&&o.hp>0) return {path,hit:[t]};
    if(!dig&&(o.kind==='rock'||o.enemy)) return {path,hit:[]}; }
  return {path,hit:[]}; }
function estDamage(c,e,m){ const pl=B.player;
  return Math.max(1,Math.round((c.pow||0)*(m||1)*colorMult(c.color,e.color)*(e.curseT>0?1.3:1)*(pl.pactT>0||pl.courageT>0?1.3:1)*(c.valor&&pl.hp<=pl.maxHp/2?1.5:1)*heroMult(c)*((pl.power&&pl.power[c.color])||1))); }
function castPreview(){
  const b=B, inst=b&&b.piles.queue[0]; if(!inst||b.phase!=='fight') return null;
  const c=inst.card, k=c.type==='piece'?c.base:c.type, p=b.player, row=lineTiles(p.tile,DIRS.E), out={card:c,mult:inst.mult||1,area:[],hit:[],place:[],paths:[],arc:null,self:false,note:''};
  const enemyTiles=()=>alive().map(e=>e.tile), path=(tiles,dig)=>{ const r=shotPath(tiles,dig); out.area.push(...r.path); out.hit.push(...r.hit); out.paths.push(r.path); };
  const route=fn=>{ const ts=[]; for(let i=1;i<BOARD_COLS;i++){ const t=fn(i); if(!t) break; ts.push(t); } return ts; };
  if(k==='strike'||(k==='charge'&&c.fx!=='lob')){
    const sh=k==='charge'?'line':c.shape;
    if(sh==='line') path(row,false);
    else if(sh==='dig') path(row,true);
    else if(sh==='row'){ out.area.push(...row); out.paths.push(row); out.hit.push(...row.filter(t=>t.occ&&t.occ.kind==='enemy')); }
    else if(sh==='wedge'){ const ts=wedgeTiles(p.tile,2.6); out.area.push(...ts); out.hit.push(...ts.filter(t=>t.occ&&t.occ.kind==='enemy')); }
    else if(sh==='zigzag'){ const alt=tileCR(p.tile.col,p.tile.r+1)?1:-1; path(route(i=>tileCR(p.tile.col+i,p.tile.r+(i%2?alt:0))),false); }
    else if(sh==='diag'){ for(const d of [-1,1]) path(route(i=>tileCR(p.tile.col+i,p.tile.r+d*i)),false); }
    else if(sh==='all'){ out.hit.push(...enemyTiles()); out.area.push(...out.hit); }
    else if(sh==='missiles'){ out.hit.push(...enemyTiles()); out.area.push(...out.hit); out.note=c.n+' random hits'; }
  }
  else if(k==='lob'||k==='trap'||k==='environment'||(k==='charge'&&c.fx==='lob')){
    const t=b.aim||nearestEnemyTile(p.tile); if(t){ const ts=patternTiles(t,aimPattern(),'e'); out.area.push(...ts); out.arc=t; if(k!=='trap') out.hit.push(...ts.filter(x=>x.occ&&x.occ.kind==='enemy')); }
  }
  else if(k==='ward'&&c.ward==='barrier') out.self=true;
  else if(k==='ward'||(k==='machine'&&c.ai==='bulwark')) out.place.push(...placementTiles(c.n||1));
  else if(k==='sentry'||k==='summon'||k==='machine'||k==='hero') out.place.push(...placementTiles(1));
  else out.self=true;   // boons and utilities act on you
  return out;
}
function nextIsLob(){ const q=B&&B.piles.queue[0]; if(!q) return false; const c=q.card, k=c.type==='piece'?c.base:c.type; return k==='lob'||k==='trap'||k==='environment'||(k==='charge'&&c.fx==='lob'); }
function aimPattern(){ const q=B.piles.queue[0]; if(!q) return 'single'; const c=q.card; return c.type==='trap'?(c.trap==='blast'?'burst':'single'):c.type==='environment'?c.pattern:lobPattern(c); }
function setAim(t){ const b=B; if(!b||b.phase!=='fight'||!t||t.side!=='e') return; b.aim=b.aim===t?null:t; }
function cycleAim(){ const b=B; if(!b||b.phase!=='fight') return; const ts=alive().map(e=>e.tile).sort((a,c)=>a.r-c.r||a.q-c.q); if(!ts.length) return;
  b.aim=ts[(ts.indexOf(b.aim)+1)%ts.length]; }
function moveTo(t){ const b=B; if(!b||b.phase!=='fight'||!t) return; const p=b.player; if(t===p.tile) return; p.path=pathTo(p.tile,t); }
function stepDir(d){ const b=B; if(!b||b.phase!=='fight') return; const p=b.player, t=tileAt(p.tile.q+d[0],p.tile.r+d[1]); if(t&&t.side==='p'&&!t.occ) p.path=[t]; }
function stepVertical(up){ const p=B.player, ts=neighbors(p.tile).filter(t=>(up?t.r<p.tile.r:t.r>p.tile.r)&&t.side==='p'&&!t.occ); if(ts.length) p.path=[pick(ts)]; }
function wandDown(){ const b=B; if(!b||b.phase!=='fight') return; b.player.charging=true; b.player.chargeT=0; }
function wandUp(){ const b=B; if(!b) return; const p=b.player; if(!p.charging) return; p.charging=false; const ch=p.chargeT>=chargeNeed(p); p.chargeT=0; fireWand(ch); }
const chargeNeed=p=>p.wand?p.wand.charge:.9;

/* ---------------- rendering ---------------- */
// A perspective camera behind you and up: the board is turned so your side is at the bottom and the
// enemy straight ahead (ca/sa, 90 degrees), centered on screen, and the camera looks down the board
// over your shoulder, so near tiles and units are bigger than far ones.
// u = across the screen, v = toward the camera. iy/cp = sin/cos of how far it looks down; dist = how
// far back it sits (in tiles), which sets how strong the perspective is.
const View={canvas:null, ctx:null, S:40, cx:0, cy:0, w:0, h:0, dpr:1, ca:Math.cos(Math.PI/6), sa:Math.sin(Math.PI/6), iy:.6, cp:.8, dist:22, u0:0, v0:0};
const SLAB=.35;
let ISO_Y=.6;
const boardUV=(wx,wz)=>[wx*View.ca+wz*View.sa, -wx*View.sa+wz*View.ca];
// how much nearer than the board's centre a point is: 1 at the centre, above 1 close to the camera
function nearK(wx,y,wz){ const dv=-wx*View.sa+wz*View.ca-View.v0; return View.dist/(View.dist-y*View.iy-dv*View.cp); }
function proj(wx,y,wz){ const [u,v]=boardUV(wx,wz), du=u-View.u0, dv=v-View.v0, k=nearK(wx,y,wz);
  return [View.cx+View.S*k*du, View.cy+View.S*k*(dv*View.iy-y)]; }
// the pixel size of one tile at a point on the board, for sizing units, rings and labels
const scaleAt=(wx,wz)=>View.S*nearK(wx,0,wz);
const depthOf=t=>-t.wx*View.sa+t.wz*View.ca;
function hexCorners(t,rad,y){ const out=[];
  for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; out.push(proj(t.wx+Math.cos(a)*rad,y||0,t.wz+Math.sin(a)*rad)); } return out; }
// the sides of a raised tile that face the camera (edges whose outward normal points down the screen)
function frontFaces(ctx,top,drop){ const n=top.length, cx=top.reduce((a,p)=>a+p[0],0)/n, cy=top.reduce((a,p)=>a+p[1],0)/n;
  for(let i=0;i<n;i++){ const a=top[i], b=top[(i+1)%n]; if((a[1]+b[1])/2<=cy) continue;
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(b[0],b[1]+drop); ctx.lineTo(a[0],a[1]+drop); ctx.closePath(); ctx.fill(); } }

function resizeView(){
  const cv=View.canvas, r=cv.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  View.dpr=dpr; View.w=r.width; View.h=r.height; cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  const portrait=r.height>r.width*1.05, ang=Math.PI/2;
  View.ca=Math.cos(ang); View.sa=Math.sin(ang); View.iy=ISO_Y=portrait?.8:.62; View.cp=Math.sqrt(1-View.iy*View.iy);
  // look at the middle of the board from a camera about 1.3 boards back
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
  for(const t of TILES){ const [u,v]=boardUV(t.wx,t.wz); u0=Math.min(u0,u); u1=Math.max(u1,u); v0=Math.min(v0,v); v1=Math.max(v1,v); }
  View.u0=(u0+u1)/2; View.v0=(v0+v1)/2; View.dist=Math.max(12,(v1-v0)*(portrait?1.3:1.8));
  // fit the projected board (plus headroom for units) into the canvas
  View.S=1; View.cx=0; View.cy=0;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const t of TILES) for(const [x,y] of hexCorners(t,1).concat(hexCorners(t,0,2.2))){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
  y1+=SLAB+.2;
  View.S=Math.min((r.width-(portrait?24:72))/(x1-x0),(r.height-16)/(y1-y0));
  View.cx=r.width/2-View.S*(x0+x1)/2; View.cy=r.height/2-View.S*(y0+y1)/2;
}
// screen -> tile: the tile whose top face is under the finger, or the nearest one close by
function pickTile(clientX,clientY){
  const r=View.canvas.getBoundingClientRect(), x=clientX-r.left, y=clientY-r.top;
  let best=null, bd=1e9;
  for(const t of TILES){ const hc=hexCorners(t,1);
    let inside=false; for(let i=0,j=5;i<6;j=i++){ const [xi,yi]=hc[i], [xj,yj]=hc[j]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside; }
    if(inside) return t;
    const [cx,cy]=proj(t.wx,0,t.wz), d=Math.hypot(x-cx,(y-cy)/View.iy)/scaleAt(t.wx,t.wz); if(d<bd){ bd=d; best=t; } }
  return bd<1.1?best:null;
}

function poly(ctx,pts){ ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); }
function mixHex(a,b,t){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const r=Math.round(((pa>>16)&255)*(1-t)+((pb>>16)&255)*t), g=Math.round(((pa>>8)&255)*(1-t)+((pb>>8)&255)*t), bl=Math.round((pa&255)*(1-t)+(pb&255)*t);
  return 'rgb('+r+','+g+','+bl+')'; }

/* ---------------- the cave around the board ----------------
   The area you fight in is built around the board in the same perspective: a rock floor past
   the tiles, a back wall and side walls rising out of it with a dark ceiling, stalactites and
   rubble, and the area's own light: green crystals, blue ice, gold veins and pillars, or white
   motes in the black. The area changes every 3 depths and the cycle repeats. The still part is
   drawn once into a cached canvas; glows, mist and drifting dust animate every frame. */
const AREAS=[
  {name:'Glowworm Hollows', rock:'#151c22', wall:'#1d262f', lit:'#3a4c5a', glow:'#39ff8a', fog:'#0d3a2a', veins:'crystal'},
  {name:'Frozen Deeps',     rock:'#122131', wall:'#182c42', lit:'#3a6488', glow:'#7fd4ff', fog:'#0e2f4f', veins:'ice'},
  {name:'Gilded Ruins',     rock:'#17191c', wall:'#22252a', lit:'#4a4f57', glow:'#f2c94c', fog:'#2a2410', veins:'gold'},
  {name:'The Abyss',        rock:'#07090b', wall:'#0d1115', lit:'#26303a', glow:'#e9fbff', fog:'#0a1a24', veins:'stars'},
];
const areaOf=d=>AREAS[Math.floor((Math.max(1,d)-1)/3)%AREAS.length];
function caveRng(seed){ let a=seed|0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function buildCave(depth){
  const A=areaOf(depth), cv=document.createElement('canvas'); cv.width=Math.round(View.w*View.dpr); cv.height=Math.round(View.h*View.dpr);
  const ctx=cv.getContext('2d'); ctx.setTransform(View.dpr,0,0,View.dpr,0,0);
  const R=caveRng(depth*977+13), lights=[];
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z0=Math.min(z0,t.wz); z1=Math.max(z1,t.wz); }
  const back=x1+2.2, near=x0-9, side=z1+2.6;
  // the dark of the cave, a little lighter low down where the area's light pools
  const g=ctx.createLinearGradient(0,0,0,View.h); g.addColorStop(0,'#000000'); g.addColorStop(.55,A.wall); g.addColorStop(1,'#000000');
  ctx.fillStyle=g; ctx.fillRect(0,0,View.w,View.h);
  const P=(wx,y,wz)=>proj(wx,y,wz);
  const fillPoly=(pts,c)=>{ ctx.fillStyle=c; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); };
  // floor: rock, darker toward the back, with cracks
  const fl=[P(back,0,-side),P(back,0,side),P(near,0,side),P(near,0,-side)];
  const fg=ctx.createLinearGradient(0,fl[0][1],0,fl[2][1]); fg.addColorStop(0,'#000'); fg.addColorStop(.35,A.rock); fg.addColorStop(1,mixHex(A.rock,'#000000',.4));
  ctx.fillStyle=fg; ctx.beginPath(); fl.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=mixHex(A.rock,'#000000',.55); ctx.lineWidth=1;
  for(let i=0;i<26;i++){ let wx=near+R()*(back-near), wz=(R()*2-1)*side; ctx.beginPath(); ctx.moveTo(...P(wx,0,wz)); for(let k=0;k<4;k++){ wx+=R()*1.4-.7; wz+=R()*1.4-.7; ctx.lineTo(...P(wx,0,wz)); } ctx.stroke(); }
  // back wall up into the ceiling, then the side walls from far to near
  const wallFace=(pts,top,shade)=>{ fillPoly(pts,shade); ctx.strokeStyle=A.lit; ctx.lineWidth=1.5; ctx.beginPath(); top.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); };
  { const n=24, tops=[], bots=[]; for(let i=0;i<=n;i++){ const wz=-side+2*side*i/n, h=4.2+R()*2.4+Math.sin(i*.9)*.8; tops.push(P(back,h,wz)); bots.push(P(back,0,wz)); }
    fillPoly([[tops[0][0],0],[tops[n][0],0],...tops.slice().reverse()],'#000');   // the ceiling over the back wall
    wallFace([...bots,...tops.slice().reverse()],tops,A.wall);
    for(let i=0;i<n;i++) if(R()<.6){ const a=bots[i], b2=tops[i+1]; ctx.globalAlpha=.25; fillPoly([a,bots[i+1],b2],mixHex(A.wall,'#000000',.5)); ctx.globalAlpha=1; } }
  for(const s2 of [-1,1]){ const n=18;
    for(let i=0;i<n;i++){ const wa=back-(back-near)*i/n, wb=back-(back-near)*(i+1)/n, ha=4.5+R()*2.2, hb=4.5+R()*2.2, z=s2*side, zz=s2*(side+.8+R()*.6);
      const pts=[P(wa,0,z),P(wb,0,z),P(wb,hb,zz),P(wa,ha,zz)];
      fillPoly(pts,mixHex(A.wall,'#000000',.15+.25*(i/n)+R()*.12)); ctx.strokeStyle=A.lit; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(...pts[3]); ctx.lineTo(...pts[2]); ctx.stroke();
      fillPoly([pts[3],pts[2],[pts[2][0]+s2*View.w,pts[2][1]-View.h],[pts[3][0]+s2*View.w,pts[3][1]-View.h]],'#000');   // rock above, out of the light
      if(R()<.5){ const k=R(), wx=wa+(wb-wa)*k, h=.6+R()*(Math.min(ha,hb)-1.2); lights.push({p:P(wx,h,s2*(side+.3)),r:.5+R()*.6,wall:true}); } } }
  // stalactites hanging from the dark above the back wall
  for(let i=0;i<22;i++){ const x=R()*View.w, w=4+R()*12, h=18+R()*70, y0=-4; fillPoly([[x-w,y0],[x+w,y0],[x+R()*4-2,y0+h]],mixHex(A.wall,'#000000',.35+R()*.3));
    ctx.strokeStyle=mixHex(A.lit,'#000000',.4); ctx.beginPath(); ctx.moveTo(x-w*.6,y0); ctx.lineTo(x,y0+h*.9); ctx.stroke(); }
  // rubble and boulders on the floor around the board
  for(let i=0;i<40;i++){ let wx=near+R()*(back-near), wz=(R()*2-1)*side; if(Math.abs(wz)<z1+1.2&&wx>x0-1.2&&wx<x1+1.2) continue;
    const r=.25+R()*.7, h=.2+R()*.6, top=[], bot=[]; for(let k=0;k<6;k++){ const a=k/6*TAU+R()*.4; top.push(P(wx+Math.cos(a)*r,h,wz+Math.sin(a)*r*.9)); bot.push(P(wx+Math.cos(a)*r,0,wz+Math.sin(a)*r*.9)); }
    fillPoly(bot,mixHex(A.rock,'#000000',.5)); fillPoly(top,mixHex(A.wall,A.lit,.25+R()*.2)); }
  // the area's light: crystals, ice, gold, or white motes
  for(const L of lights){ const [x,y]=L.p, S2=scaleAt(0,0)*L.r;
    if(A.veins==='crystal'||A.veins==='ice'){ for(let k=0;k<3;k++){ const a=-Math.PI/2+(k-1)*.5+R()*.3, len=S2*(.6+R()*.7);
        fillPoly([[x-S2*.12,y],[x+Math.cos(a)*len,y+Math.sin(a)*len],[x+S2*.12,y]],k===1?'#ffffff':A.glow); } }
    else if(A.veins==='gold'){ ctx.strokeStyle=A.glow; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-S2,y+S2*.3); for(let k=0;k<4;k++) ctx.lineTo(x-S2+S2*.6*(k+1),y+(R()-.5)*S2*.8); ctx.stroke(); }
    else { ctx.fillStyle='#ffffff'; ctx.fillRect(x-1,y-1,2,2); } }
  if(A.veins==='gold') for(const s2 of [-1,1]) for(let i=0;i<3;i++){ const wx=near*.3+back*.7-i*5, wz=s2*(z1+1.9), b0=P(wx,0,wz), t0=P(wx,1.8+R()*2.5,wz), w=scaleAt(wx,wz)*.32;
      fillPoly([[b0[0]-w,b0[1]],[b0[0]+w,b0[1]],[t0[0]+w,t0[1]],[t0[0]-w,t0[1]]],A.lit); fillPoly([[t0[0]-w*1.3,t0[1]],[t0[0]+w*1.3,t0[1]],[t0[0]+w*1.3,t0[1]+w*.5],[t0[0]-w*1.3,t0[1]+w*.5]],A.glow); }
  return {cv,lights,area:A,key:View.w+'x'+View.h+':'+depth};
}
function drawCave(ctx,b,T){
  if(!View.cave||View.cave.key!==View.w+'x'+View.h+':'+b.depth) View.cave=buildCave(b.depth);
  const C=View.cave, A=C.area; ctx.drawImage(C.cv,0,0,View.w,View.h);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  C.lights.forEach((L,i)=>{ const [x,y]=L.p, r=scaleAt(0,0)*(1.2+L.r)*(.85+.15*Math.sin(T*1.7+i)), g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,A.glow+'55'); g.addColorStop(1,A.glow+'00'); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r); });
  // dust drifting through the light
  ctx.fillStyle=A.glow; for(let i=0;i<34;i++){ const x=((i*97.3+T*(6+i%5))%View.w+View.w)%View.w, y=((i*53.1-T*(4+i%3)*2)%View.h+View.h)%View.h;
    ctx.globalAlpha=.25+.25*Math.sin(T*2+i); ctx.fillRect(x,y,1.6,1.6); }
  ctx.restore(); ctx.globalAlpha=1;
}

function render(){
  const ctx=View.ctx, b=B; if(!ctx) return;
  ctx.setTransform(View.dpr,0,0,View.dpr,0,0);
  ctx.clearRect(0,0,View.w,View.h);
  if(!b) return;
  const T=b.time, S=View.S;
  if(View.shake>.3) ctx.translate(rnd(-1,1)*View.shake,rnd(-1,1)*View.shake);
  drawCave(ctx,b,T);
  const telMap=new Map();
  for(const tl of b.teles) for(const t of tl.tiles) telMap.set(t,tl);

  const tiles=TILES.slice().sort((a,c)=>depthOf(a)-depthOf(c));
  for(const t of tiles){
    const top=hexCorners(t,.96), base={p:'#123756',e:'#23292f',n:'#0a1a14'}[t.side];
    let fill=base;
    const tl=telMap.get(t);
    if(tl){ const k=tl.t/tl.dur; fill=mixHex(base,tl.friendly?'#e6f4ff':'#ff3b4e',.25+.5*k*(.6+.4*Math.sin(T*18))); }
    if(burning(t)) fill=mixHex(fill,'#ff5a1f',t.terrain==='lava'?.45+.12*Math.sin(T*3+t.q):.35+.15*Math.sin(T*8));
    else if(icy(t)) fill=mixHex(fill,'#bfeaff',t.terrain==='ice'?.45:.35);
    else if(t.thornT>0) fill=mixHex(fill,'#4f8a3a',.45);
    if(t.flash>0) fill=mixHex(base,t.flashC[0]==='#'&&t.flashC.length===7?t.flashC:'#ffffff',Math.min(.8,t.flash));
    ctx.fillStyle='#020406'; poly(ctx,top.map(([x,y])=>[x,y+SLAB*S])); ctx.fill();
    ctx.fillStyle=mixHex(base,'#000000',.45);
    frontFaces(ctx,top,SLAB*S);
    ctx.fillStyle=fill; poly(ctx,top); ctx.fill();
    // an incoming attack fills its tile as it gets closer; it lands when the tile is full
    if(tl&&!tl.friendly){ ctx.fillStyle='rgba(255,50,70,.6)'; poly(ctx,hexCorners(t,.96*Math.min(1,tl.t/tl.dur))); ctx.fill(); }
    ctx.strokeStyle=t.side==='p'?'rgba(127,212,255,.5)':t.side==='e'?'rgba(150,165,180,.35)':'rgba(57,255,138,.5)'; ctx.lineWidth=1; ctx.stroke();
    if(t.side==='n'){ const [x,y]=proj(t.wx,.1,t.wz); ctx.fillStyle='rgba(57,255,138,.85)'; ctx.beginPath();
      ctx.moveTo(x,y-S*1.1-Math.sin(T*2+t.r)*3); ctx.lineTo(x+S*.22,y-S*.45); ctx.lineTo(x,y); ctx.lineTo(x-S*.22,y-S*.45); ctx.closePath(); ctx.fill(); }
  }
  // lob reticle: your aim, or a faint marker on the default target when a lob is next
  const aimT=b.aim||(nextIsLob()&&b.phase==='fight'?nearestEnemyTile(b.player.tile):null);
  const pv=castPreview();
  if(pv){ const col=colorOf(pv.card), pulse=.55+.25*Math.sin(T*4), hitSet=new Set(pv.hit);
    ctx.lineWidth=2;
    for(const t of new Set(pv.area)){ const hc=hexCorners(t,.88); ctx.globalAlpha=(hitSet.has(t)?.6:.38)*pulse+.18; ctx.fillStyle=col; poly(ctx,hc); ctx.fill();
      ctx.globalAlpha=hitSet.has(t)?.95:.55; ctx.strokeStyle=hitSet.has(t)?'#ffffff':col; ctx.stroke(); }
    for(const t of pv.place){ const hc=hexCorners(t,.8); ctx.globalAlpha=.9; ctx.strokeStyle=col; ctx.setLineDash([4,3]); poly(ctx,hc); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=.25*pulse+.1; ctx.fillStyle=col; ctx.fill(); }
    if(pv.self){ const [x,y]=proj(...posOf(b.player).slice(0,1),.02,posOf(b.player)[1]), S=scaleAt(...posOf(b.player)); ctx.globalAlpha=.8; ctx.strokeStyle=col; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.ellipse(x,y,S*.7,S*.7*View.iy,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha=1; b.preview=pv; } else b.preview=null;
  if(aimT){ const [x,y]=proj(aimT.wx,.02,aimT.wz), S=scaleAt(aimT.wx,aimT.wz), pulse=1+Math.sin(T*6)*.06;
    ctx.strokeStyle=b.aim?'#ffe24d':'rgba(255,226,77,.45)'; ctx.lineWidth=b.aim?3:2; if(!b.aim) ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.ellipse(x,y,S*.62*pulse,S*.62*ISO_Y*pulse,0,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-S*.8,y); ctx.lineTo(x-S*.45,y); ctx.moveTo(x+S*.45,y); ctx.lineTo(x+S*.8,y); ctx.stroke(); ctx.setLineDash([]); }
  // traps: a rune only you can see
  for(const t of TILES) if(t.trap){ const [x,y]=proj(t.wx,.03,t.wz), S=scaleAt(t.wx,t.wz); ctx.strokeStyle=colorOf(t.trap.card); ctx.lineWidth=2; ctx.globalAlpha=.6+.3*Math.sin(T*4);
    ctx.beginPath(); ctx.ellipse(x,y,S*.4,S*.4*View.iy,0,0,TAU); ctx.moveTo(x-S*.25,y); ctx.lineTo(x+S*.25,y); ctx.moveTo(x,y-S*.25*View.iy); ctx.lineTo(x,y+S*.25*View.iy); ctx.stroke(); ctx.globalAlpha=1; }
  // path preview
  if(b.player.path.length){ ctx.fillStyle='rgba(127,212,255,.4)'; for(const t of b.player.path){ const [x,y]=proj(t.wx,0,t.wz), S=scaleAt(t.wx,t.wz); ctx.beginPath(); ctx.ellipse(x,y,S*.18,S*.18*ISO_Y,0,0,TAU); ctx.fill(); } }

  const rocks=TILES.filter(t=>t.occ&&t.occ.kind==='rock').map(t=>t.occ);
  const dying=b.enemies.filter(e=>e.hp<=0&&e.deathT>0);
  const units=[b.player,...b.walls,...b.allies,...rocks,...alive(),...dying].sort((a,c)=>depthOf(a.tile)-depthOf(c.tile));
  for(const u of units) DRAW[u.kind](ctx,u,T,scaleAt(...posOf(u)));
  if(b.preview) previewOverlay(ctx,b.preview,T);
  // expected damage on each enemy the next card would hit (★ = its weak color)
  if(b.preview&&b.preview.card.pow){ const pv=b.preview; ctx.textAlign='center'; ctx.font='800 '+Math.round(S*.34)+'px Rajdhani,system-ui,sans-serif';
    for(const t of new Set(pv.hit)){ const e=t.occ; if(!e||e.kind!=='enemy') continue; const [x,y]=proj(posOf(e)[0],0,posOf(e)[1]), S=scaleAt(...posOf(e)); ctx.font='800 '+Math.round(S*.34)+'px Rajdhani,system-ui,sans-serif';
      const d=estDamage(pv.card,e,pv.mult), weak=colorMult(pv.card.color,e.color)>1, txt=(pv.card.shape==='missiles'?pv.card.n+'× ':'')+'−'+d+(weak?' ★':'');
      const w=ctx.measureText(txt).width+12, yy=y-S*.35; ctx.fillStyle=weak?'#ffe066':'rgba(4,8,12,.88)'; ctx.strokeStyle=colorOf(pv.card); ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(x-w/2,yy-S*.28,w,S*.4,6); ctx.fill(); ctx.stroke(); ctx.fillStyle=weak?'#1a1206':'#fff'; ctx.fillText(txt,x,yy); } }

  for(const s of b.shots){
    const from=s.i<0?s.a:s.tiles[s.i], to=s.tiles[s.i+1]||from, k=clamp(s.stepT/s.speed,0,1), S=scaleAt(from.wx,from.wz);
    { const tc=s.card?colorOf(s.card):s.color||'#e6f4ff', [tx,ty]=proj(from.wx,1,from.wz), [hx,hy]=proj(from.wx+(to.wx-from.wx)*k,1,from.wz+(to.wz-from.wz)*k);
      ctx.strokeStyle=tc; ctx.globalAlpha=.45; ctx.lineWidth=S*(s.wand?.08:.14); ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(hx,hy); ctx.stroke(); ctx.globalAlpha=1; }
    const wx=from.wx+(to.wx-from.wx)*k, wz=from.wz+(to.wz-from.wz)*k, [x,y]=proj(wx,1,wz);
    const col=s.card?colorOf(s.card):s.color||(s.wand?'#e6f4ff':'#fff');
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(x,y,S*(s.big?.26:s.wand?.13:.19),0,TAU); ctx.fill(); ctx.shadowBlur=0;
  }
  for(const l of b.lobs){ const k=l.t/l.dur, wx=l.a.wx+(l.b.wx-l.a.wx)*k, wz=l.a.wz+(l.b.wz-l.a.wz)*k, [x,y]=proj(wx,1+Math.sin(k*Math.PI)*3,wz), S=scaleAt(wx,wz);
    const col=colorOf(l.card); ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(x,y,S*.24,0,TAU); ctx.fill(); ctx.shadowBlur=0; }
  for(const f of b.fx){
    if(f.kind==='ring'){ const [x,y]=proj(...posOf(b.player).slice(0,1),0,posOf(b.player)[1]), r=scaleAt(...posOf(b.player))*(.4+1.4*f.t/f.life); ctx.strokeStyle=f.color; ctx.globalAlpha=1-f.t/f.life; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(x,y,r,r*View.iy,0,0,TAU); ctx.stroke(); ctx.globalAlpha=1; continue; }
    const a=proj(f.a.wx,f.y0||1,f.a.wz), c=proj((f.b||f.a).wx,1,(f.b||f.a).wz), al=1-f.t/f.life;
    ctx.strokeStyle=f.color; ctx.globalAlpha=al; ctx.lineWidth=f.kind==='beam'?S*.35:3; ctx.shadowColor=f.color; ctx.shadowBlur=10; ctx.beginPath(); ctx.moveTo(a[0],a[1]);
    if(f.kind==='bolt'){ for(let i=1;i<6;i++){ const k=i/6; ctx.lineTo(a[0]+(c[0]-a[0])*k+rnd(-6,6),a[1]+(c[1]-a[1])*k+rnd(-6,6)); } }
    else if(f.kind==='arc'){ ctx.quadraticCurveTo((a[0]+c[0])/2,Math.min(a[1],c[1])-S*1.5,c[0],c[1]); }
    ctx.lineTo(c[0],c[1]); ctx.stroke(); ctx.globalAlpha=1; ctx.shadowBlur=0;
  }
  for(const q of b.parts){ const [x,y]=proj(q.wx,q.y,q.wz); ctx.globalAlpha=1-q.t/q.life; ctx.fillStyle=q.color; ctx.fillRect(x-2,y-2,4,4); } ctx.globalAlpha=1;
  ctx.textAlign='center';
  for(const f of b.floaters){ const [x,y]=proj(f.wx,f.y,f.wz), S=scaleAt(f.wx,f.wz), pop=1+.7*Math.max(0,1-f.t/.14); ctx.globalAlpha=Math.min(1,(1-f.t/.9)*1.6); ctx.font=(f.big?'800 ':'700 ')+Math.round(S*(f.big?.55:.42)*pop)+'px Rajdhani,system-ui,sans-serif';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.strokeText(f.text,x,y); ctx.fillStyle=f.color; ctx.fillText(f.text,x,y); } ctx.globalAlpha=1;
}

// The next card's reach, drawn again over the units so nothing hides it: the outline of every
// tile it covers, and a moving dashed line with an arrow along each path a shot will take
// (or the arc of a lob) from you to where it lands.
function previewOverlay(ctx,pv,T){
  const col=colorOf(pv.card), [px0,pz0]=posOf(B.player);
  ctx.save(); ctx.lineJoin='round';
  ctx.globalAlpha=.6; ctx.strokeStyle=col; ctx.lineWidth=2;
  for(const t of new Set(pv.area)){ poly(ctx,hexCorners(t,.88,.02)); ctx.stroke(); }
  ctx.globalAlpha=.95; ctx.shadowColor=col; ctx.shadowBlur=10;
  const arrow=(a,b2)=>{ const ang=Math.atan2(b2[1]-a[1],b2[0]-a[0]), L=Math.max(9,scaleAt(px0,pz0)*.28); ctx.setLineDash([]); ctx.fillStyle=col; ctx.beginPath();
    ctx.moveTo(b2[0]+Math.cos(ang)*L*.4,b2[1]+Math.sin(ang)*L*.4); ctx.lineTo(b2[0]-Math.cos(ang-.5)*L,b2[1]-Math.sin(ang-.5)*L); ctx.lineTo(b2[0]-Math.cos(ang+.5)*L,b2[1]-Math.sin(ang+.5)*L); ctx.closePath(); ctx.fill(); };
  const S0=scaleAt(px0,pz0); ctx.lineWidth=Math.max(3,S0*.08); ctx.setLineDash([S0*.28,S0*.18]); ctx.lineDashOffset=-T*S0*1.4;
  for(const path of pv.paths){ if(!path.length) continue; const pts=[proj(px0,.08,pz0),...path.map(t=>proj(t.wx,.08,t.wz))];
    ctx.strokeStyle=col; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); arrow(pts[pts.length-2],pts[pts.length-1]); ctx.setLineDash([S0*.28,S0*.18]); }
  if(pv.arc){ const a=proj(px0,.08,pz0), c=proj(pv.arc.wx,.05,pv.arc.wz), m=proj((px0+pv.arc.wx)/2,1.6,(pz0+pv.arc.wz)/2);
    ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo(2*m[0]-(a[0]+c[0])/2+S0*2.2,2*m[1]-(a[1]+c[1])/2,c[0],c[1]); ctx.stroke();
    arrow([c[0],c[1]-S0*.5],c); }
  ctx.restore();
}
// Draw a unit's pixel sprite standing on its tile: a soft ground shadow, a cast shadow falling
// away from the light, a little breathing and bobbing, and a white flash when hit.
// Returns the screen x and the top of the sprite, for bars and labels.
const FACES_LEFT=new Set(['ram']);
function drawSprite(ctx,u,T,S,o){
  const spr=typeof unitSprite==='function'?unitSprite(u):null, [wx,wz]=posOf(u), [x,y]=proj(wx,0,wz);
  const sc=o.scale||1, H=S*2.7*sc, k=H/32, alpha=o.alpha==null?1:o.alpha;
  const g=ctx.createRadialGradient(x,y,0,x,y,S*.62*sc); g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=alpha; ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,S*.62*sc,S*.62*sc*View.iy,0,0,TAU); ctx.fill();
  if(!spr){ ctx.globalAlpha=1; return {x,top:y-H}; }
  ctx.imageSmoothingEnabled=false;
  // cast shadow: the silhouette laid flat on the ground toward the lower right
  ctx.save(); ctx.globalAlpha=.3*alpha; ctx.translate(x,y); ctx.transform(1,0,-.7,-.28,0,0); if(o.flip) ctx.scale(-1,1);
  ctx.drawImage(spr.sil,-H/2,-31*k,H,H); ctx.restore();
  // body
  const breathe=Math.sin(T*3+(u.tile?u.tile.q:0))*.03, bob=(o.bob||0)*Math.sin(T*4+(u.tile?u.tile.r:0));
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y-bob*S); ctx.scale((o.flip?-1:1)*(1-breathe*.5),1+breathe);
  ctx.drawImage(spr.img,-H/2,-31*k,H,H);
  if(o.flash){ ctx.globalAlpha=alpha*o.flash; ctx.drawImage(spr.wht,-H/2,-31*k,H,H); }
  if(o.tint){ ctx.globalAlpha=alpha*.35; ctx.globalCompositeOperation='source-atop'; ctx.fillStyle=o.tint; ctx.fillRect(-H/2,-31*k,H,H); ctx.globalCompositeOperation='source-over'; }
  ctx.restore(); ctx.globalAlpha=1; ctx.imageSmoothingEnabled=true;
  return {x,top:y-30*k-bob*S,H,k};
}
// face whoever it is fighting: your wizard faces the nearest enemy, enemies face you
function facing(u,target,defLeft){ if(!target) return false; const a=proj(...posOf(u).slice(0,1),0,posOf(u)[1])[0], b=proj(...posOf(target).slice(0,1),0,posOf(target)[1])[0]; return (b<a)!==!!defLeft; }
function shadow(ctx,u,S,r){ const [wx,wz]=u.tile?posOf(u):[u.wx,u.wz], [x,y]=proj(wx,0,wz); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y,S*r,S*r*ISO_Y,0,0,TAU); ctx.fill(); }
// one dot per turn left, over walls and units
function turnPips(ctx,x,y,n,S){ ctx.fillStyle='#e6f4ff'; for(let i=0;i<n;i++){ ctx.beginPath(); ctx.arc(x+(i-(n-1)/2)*S*.18,y,S*.05,0,TAU); ctx.fill(); } }
function bar(ctx,x,y,w,k,col){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x-w/2-1,y-1,w+2,6); ctx.fillStyle=col; ctx.fillRect(x-w/2,y,w*clamp(k,0,1),4); }
const DRAW={
  player(ctx,p,T,S){
    const foe=alive().sort((m,n)=>hexDist(p.tile,m.tile)-hexDist(p.tile,n.tile))[0];
    const flip=facing(p,foe,false), r=drawSprite(ctx,p,T,S,{alpha:p.invT>0?.45:1,flip,bob:.03,flash:p.hurtT>0?p.hurtT*3:0});
    // the staff's orb glows, and grows while the wand charges
    const wc=p.wand&&p.wand.color?COLORS[p.wand.color].c:null;
    const glow=p.charging?(p.chargeT>=chargeNeed(p)?'#ffffff':wc||'#7fd4ff'):p.powerT>0?'#ff6a3d':wc;
    if(glow&&(!p.look||['staff','wand'].includes(p.look.weapon))){ const hs=unitSprite(p).hand, ox=r.x+(flip?-1:1)*(hs?7.5:9)*r.k, oy=r.top+(hs?5:4)*r.k; ctx.fillStyle=glow; ctx.shadowColor=glow; ctx.shadowBlur=10+(p.charging?p.chargeT*18:0);
      ctx.globalAlpha=.85; ctx.beginPath(); ctx.arc(ox,oy,S*(.12+(p.charging?p.chargeT*.12:0)),0,TAU); ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1; }
    const [x,y]=proj(posOf(p)[0],0,posOf(p)[1]);
    if(p.barrier>0){ ctx.strokeStyle='rgba(111,214,255,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(x,y-r.H*.45,S*.75,r.H*.55,0,0,TAU); ctx.stroke();
      ctx.globalAlpha=.12; ctx.fillStyle='#6fd6ff'; ctx.fill(); ctx.globalAlpha=1; }
    if(p.dodge){ ctx.strokeStyle='rgba(200,240,255,.7)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.ellipse(x,y,S*.6,S*.6*ISO_Y,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  },
  enemy(ctx,e,T,S){
    const dk=e.hp<=0?Math.max(0,e.deathT/.5):1, sc=(e.def.scale||1)*(e.def.minion?.7:1)*(e.hp<=0?.6+.4*dk:1)*(e.hitT>0?1.08:1);
    const col=COLORS[e.color].c, frozen=e.freezeT>0;
    const r=drawSprite(ctx,e,T,S,{scale:sc,alpha:dk,flip:facing(e,B.player,FACES_LEFT.has(e.id)),bob:frozen?0:.05,flash:e.hitT>0?.85:0,tint:frozen?'#bfefff':e.stunT>0?'#fff39a':null});
    const x=r.x, y=r.top+30*r.k, h=r.H*.45;
    ctx.globalAlpha=dk;
    if(e.barrier>0){ ctx.strokeStyle='rgba(255,240,179,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(x,y-h,S*.7*sc,h*1.2,0,0,TAU); ctx.stroke(); }
    const top=r.top-S*.1;
    bar(ctx,x,top,S*.9,e.hp/e.maxHp,'#ff5d6c');
    ctx.font='700 '+Math.round(S*.28)+'px Rajdhani,system-ui,sans-serif'; ctx.textAlign='center';
    const st=[]; if(e.burnT>0) st.push('🔥'); if(frozen) st.push('❄️'); if(e.stunT>0) st.push('💫'); if(e.slowT>0) st.push('🐌'); if(e.poisonT>0) st.push('☠'); if(e.curseT>0) st.push('☾'); if(e.powerT>0) st.push('⬆'); if(e.confuseT>0) st.push('❓');
    ctx.fillStyle='#fff'; ctx.fillText(e.name+'  weak: '+COLORS[WEAK_TO[e.color]].icon,x,top-4);
    if(st.length) ctx.fillText(st.join(''),x,top-4-S*.3);
    if(e.casting){ const w=Math.max(S*1.6,ctx.measureText(e.casting.name).width+14), yy=top-S*.75;   // the card it is about to cast
      ctx.fillStyle='rgba(4,8,12,.9)'; ctx.strokeStyle=COLORS[e.casting.color].c; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(x-w/2,yy-S*.32,w,S*.44,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=COLORS[e.casting.color].c; ctx.fillText(TYPES[e.casting.type].icon+' '+e.casting.name,x,yy); }
    if(e.windT>0){ ctx.fillStyle='#ff5d6c'; ctx.font='800 '+Math.round(S*.6)+'px Rajdhani,system-ui,sans-serif'; ctx.fillText('!',x+S*.5,y-h*1.6); }
    // intent: what it will do next, with a ring that closes as the attack nears
    if(e.hp>0&&!e.casting&&!e.windT&&e.nextMove&&e.atkT<1.6&&e.freezeT<=0&&e.stunT<=0){ const ix=x+S*.62, iy=top-S*.05, r=S*.26, k=1-e.atkT/1.6;
      ctx.fillStyle='rgba(4,8,12,.85)'; ctx.beginPath(); ctx.arc(ix,iy,r,0,TAU); ctx.fill();
      ctx.strokeStyle=k>.75?'#ff3a4a':'#ffb3a0'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(ix,iy,r,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke();
      ctx.font=Math.round(S*.28)+'px system-ui'; ctx.fillStyle='#fff'; ctx.fillText(INTENT_ICON[e.nextMove]||'!',ix,iy+S*.1); }
    ctx.globalAlpha=1;
  },
  rock(ctx,r,T,S){
    const top=hexCorners(r.tile,.7,.75), bot=hexCorners(r.tile,.7,0);
    ctx.fillStyle='#2a3138'; frontFaces(ctx,top,bot[0][1]-top[0][1]);
    ctx.fillStyle=r.tile.rockT>0&&r.tile.rockT<2?'#7d8894':'#56606a'; poly(ctx,top); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.stroke();
    // cracks as it takes hits
    const k=r.maxHp?1-r.hp/r.maxHp:0;
    if(k>.05){ const [cx,cy]=proj(r.tile.wx,.76,r.tile.wz); ctx.strokeStyle='rgba(10,14,18,.85)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(let i=0;i<1+Math.floor(k*4);i++){ const a=i*2.1+.4, l=S*.35*(.5+k); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*l*.6,cy+Math.sin(a)*l*.3); ctx.lineTo(cx+Math.cos(a+.4)*l,cy+Math.sin(a+.4)*l*.5); } ctx.stroke(); }
  },
  wall(ctx,w,T,S){
    const col=colorOf(w.card), top=hexCorners(w.tile,.62,.9), bot=hexCorners(w.tile,.62,0);
    ctx.fillStyle=mixHex(col,'#000000',.5); ctx.beginPath();
    frontFaces(ctx,top,bot[0][1]-top[0][1]);
    ctx.fillStyle=mixHex(col,'#ffffff',.15); poly(ctx,top); ctx.fill();
    if(w.thorns){ ctx.fillStyle='#fff'; const [x,y]=proj(w.tile.wx,1,w.tile.wz); ctx.font='700 '+Math.round(S*.3)+'px system-ui'; ctx.textAlign='center'; ctx.fillText('✶',x,y); }
    const [x,y]=proj(w.tile.wx,1.15,w.tile.wz); bar(ctx,x,y,S*.7,w.hp/w.maxHp,'#6fd6ff'); turnPips(ctx,x,y-S*.12,w.turns,S);
  },
  ally(ctx,a,T,S){
    if(a.ai==='hero') return DRAW.hero(ctx,a,T,S);
    const col=colorOf(a.card), unit=['shooter','bomber','healer','guardian'].includes(a.ai);
    const r=drawSprite(ctx,a,T,S,{scale:unit?.85:.8,bob:unit?.04:0,flip:facing(a,a.enemy?B.player:alive()[0],false),flash:a.hitT>0?.8:0});
    const x=r.x, top=r.top-S*.05;
    ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x-S*.45,top+S*.1,S*.12,-Math.PI/2,-Math.PI/2+TAU*clamp(a.turns/a.maxTurns,0,1)); ctx.stroke();
    turnPips(ctx,x,top-S*.1,a.turns,S);
    if(a.hp<a.maxHp) bar(ctx,x,top,S*.6,a.hp/a.maxHp,'#6fd6ff');
  },
  // a hero: a golden ring on the ground, a light column, its name, HP and turns
  hero(ctx,a,T,S){
    const col=colorOf(a.card), [gx,gy]=proj(...posOf(a).slice(0,1),.02,posOf(a)[1]), pulse=.5+.5*Math.sin(T*3);
    ctx.strokeStyle='#ffe066'; ctx.lineWidth=2.5; ctx.globalAlpha=.6+.3*pulse; ctx.beginPath(); ctx.ellipse(gx,gy,S*.78,S*.78*View.iy,0,0,TAU); ctx.stroke();
    const g=ctx.createLinearGradient(0,gy-S*3,0,gy); g.addColorStop(0,'rgba(255,230,120,0)'); g.addColorStop(1,'rgba(255,230,120,.28)');
    ctx.globalAlpha=1; ctx.fillStyle=g; ctx.fillRect(gx-S*.55,gy-S*3,S*1.1,S*3);
    const r=drawSprite(ctx,a,T,S,{scale:1.05,bob:.04,flip:facing(a,alive()[0],false),flash:a.hitT>0?.8:0});
    const top=r.top-S*.1; ctx.textAlign='center'; ctx.font='800 '+Math.round(S*.3)+'px Rajdhani,system-ui,sans-serif';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.7)'; const nm='♔ '+a.card.name.split(',')[0]; ctx.strokeText(nm,r.x,top-S*.18); ctx.fillStyle='#ffe066'; ctx.fillText(nm,r.x,top-S*.18);
    bar(ctx,r.x,top,S*.9,a.hp/a.maxHp,col); turnPips(ctx,r.x,top+S*.16,a.turns,S);
  },
};

if(typeof module!=='undefined') module.exports={TILES,P_TILES,E_TILES,tileAt,neighbors,hexDist,lineTiles,wedgeTiles,pathTo};
