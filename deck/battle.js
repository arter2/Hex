/* Hexmancers deck prototype — real-time battle on the 37-tile hex board, drawn with an
   orthographic isometric projection on a 2D canvas. Your side is lower-left, the enemy
   side upper-right, and three rift tiles in the middle are impassable. */

const SQ3=Math.sqrt(3), TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- board ---------------- */
const DIRS={E:[1,0],NE:[1,-1],NW:[0,-1],W:[-1,0],SW:[-1,1],SE:[0,1]};
const DIRLIST=Object.values(DIRS);
const BOARD=new Map(), TILES=[];
for(let r=-3;r<=3;r++) for(let q=Math.max(-3,-3-r);q<=Math.min(3,3-r);q++){
  const x=q+r/2, t={q,r,x,side:x<-.01?'p':x>.01?'e':'n',wx:SQ3*x,wz:1.5*r,key:q+','+r,occ:null,flash:0,flashC:'#fff'};
  BOARD.set(t.key,t); TILES.push(t);
}
const P_TILES=TILES.filter(t=>t.side==='p'), E_TILES=TILES.filter(t=>t.side==='e');
const tileAt=(q,r)=>BOARD.get(q+','+r);
const neighbors=t=>DIRLIST.map(d=>tileAt(t.q+d[0],t.r+d[1])).filter(Boolean);
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

/* ---------------- enemies ---------------- */
const ENEMY_DEFS={
  gloop: {name:'Gloop',       color:'verdant', hp:120, atk:'shot', dmg:12, rate:[3,4.2]},
  wisp:  {name:'Cinder Wisp', color:'fire',    hp:85,  atk:'shot', dmg:10, rate:[2.2,3]},
  mite:  {name:'Frost Mite',  color:'frost',   hp:95,  atk:'slam', dmg:14, rate:[3,4]},
  beetle:{name:'Volt Beetle', color:'storm',   hp:110, atk:'both', dmg:12, rate:[2.6,3.6]},
  shade: {name:'Shade',       color:'shadow',  hp:100, atk:'slam', dmg:16, rate:[3.2,4.2]},
  sprite:{name:'Rune Sprite', color:'arcane',  hp:90,  atk:'shot', dmg:11, rate:[2.5,3.4]},
  golem: {name:'Rune Golem',  color:'arcane',  hp:340, atk:'quake',dmg:22, rate:[3.6,4.6], boss:true, scale:1.45},
};
const WEAK_TO={}; for(const k in BEATS) WEAK_TO[BEATS[k]]=k;

/* ---------------- state ---------------- */
let B=null;
const GAUGE_MAX=10;

function startBattle(list,depth,hooks){
  TILES.forEach(t=>{ t.occ=null; t.flash=0; });
  const p={kind:'player', hp:120, maxHp:120, tile:tileAt(-2,0), path:[], moveCd:0, castCd:0, wandCd:0, charging:false, chargeT:0,
           barrier:0, invT:0, dodge:false, powerT:0, pactT:0, hasteT:0, regenT:0, regenAmt:0};
  p.tile.occ=p;
  B={depth, hooks:hooks||{}, piles:createPiles(list), player:p, aim:null, enemies:[], allies:[], walls:[], shots:[], lobs:[], teles:[], fx:[], floaters:[], parts:[],
     timers:[], gauge:0, phase:'custom', time:0, log:[]};
  const hs=1+.2*(depth-1), ds=1+.1*(depth-1);
  const pool=Object.keys(ENEMY_DEFS).filter(k=>!ENEMY_DEFS[k].boss);
  const ids=depth%4===0?['golem',pick(pool)]:Array.from({length:depth===1?2:3},()=>pick(pool));
  const spots=[tileAt(2,-1),tileAt(1,1),tileAt(3,-2),tileAt(0,2),tileAt(2,0)];
  ids.forEach((id,i)=>{ const d=ENEMY_DEFS[id], t=spots[i];
    const e={kind:'enemy', id, def:d, name:d.name, color:d.color, hp:Math.round(d.hp*hs), maxHp:Math.round(d.hp*hs), dmg:Math.round(d.dmg*ds),
             tile:t, atkT:rnd(2,3.5)+i*.7, moveT:rnd(1,2), windT:0, burnT:0, burnAcc:0, freezeT:0, stunT:0, slowT:0, poisonT:0, poisonAmt:0, curseT:0, hitT:0};
    t.occ=e; B.enemies.push(e); });
  openCustomScreen();
  return B;
}

const alive=()=>B.enemies.filter(e=>e.hp>0);
function later(sec,fn){ B.timers.push({t:sec,fn}); }
function floater(text,t,color,big){ B.floaters.push({text,wx:t.wx,wz:t.wz,y:1.6,t:0,color:color||'#fff',big}); }
function flash(t,color,amt){ t.flash=Math.max(t.flash,amt||1); t.flashC=color; }
function burst(t,color,n,y){ for(let i=0;i<(n||10);i++) B.parts.push({wx:t.wx,wz:t.wz,y:y||.8,vx:rnd(-2,2),vz:rnd(-2,2),vy:rnd(1,3.5),t:0,life:rnd(.4,.8),color}); }
function colorOf(card){ return card&&card.color?COLORS[card.color].c:'#e8e0ff'; }

/* ---------------- custom screen ---------------- */
function openCustomScreen(){
  const b=B; if(!b||b.phase==='win'||b.phase==='lose') return;
  b.phase='custom'; b.player.charging=false; b.player.path=[];
  openCustom(b.piles);
  b.hooks.onCustom&&b.hooks.onCustom();
}
function closeCustomScreen(){
  const b=B; if(!b||b.phase!=='custom') return;
  b.phase='fight'; b.gauge=0;
  b.hooks.onFight&&b.hooks.onFight();
}
const gaugeFull=()=>B.gauge>=GAUGE_MAX;

/* ---------------- damage ---------------- */
function hitEnemy(e,base,card,opts){
  if(!e||e.hp<=0) return 0;
  opts=opts||{};
  let mult=opts.raw?1:colorMult(card&&card.color,e.color)*(e.curseT>0?1.3:1)*(B.player.pactT>0?1.3:1);
  const dmg=Math.max(1,Math.round(base*mult));
  e.hp-=dmg; e.hitT=.18;
  floater(dmg+(mult>=WEAK_MULT?' WEAK!':''),e.tile,mult>=WEAK_MULT?'#ffe24d':opts.raw?'#b8ffb0':'#fff',mult>=WEAK_MULT);
  flash(e.tile,colorOf(card),.8);
  if(card&&!opts.raw) applyStatus(e,card);
  if(card&&card.drain&&!opts.raw) healPlayer(Math.round(dmg*card.drain));
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
}
function cancelAttack(e){
  const had=e.windT>0||B.teles.some(t=>t.owner===e);
  e.windT=0; B.teles=B.teles.filter(t=>t.owner!==e);
  if(had) floater('cancelled',e.tile,'#6fd6ff');
}
function killEnemy(e){
  e.hp=0; if(e.tile.occ===e) e.tile.occ=null; cancelAttack(e); burst(e.tile,COLORS[e.color].c,24);
  if(!alive().length&&B.phase==='fight'){ B.phase='win'; B.player.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(true)); }
}
function healPlayer(n){ const p=B.player; if(n<=0||p.hp<=0) return; const h=Math.min(n,p.maxHp-p.hp); p.hp+=h; if(h>0) floater('+'+h,p.tile,'#6dff9a'); }
function hitPlayer(dmg){
  const p=B.player; if(B.phase!=='fight') return;
  if(p.invT>0){ floater('miss',p.tile,'#c58bff'); return; }
  if(p.dodge){ p.dodge=false; floater('dodge',p.tile,'#6fd6ff'); return; }
  if(p.barrier>0){ const a=Math.min(p.barrier,dmg); p.barrier-=a; dmg-=a; floater('🛡'+a,p.tile,'#6fd6ff'); }
  if(dmg<=0) return;
  p.hp-=dmg; floater('-'+dmg,p.tile,'#ff5d6c',true); flash(p.tile,'#ff5d6c',1);
  if(p.hp<=0){ p.hp=0; B.phase='lose'; p.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(false)); }
}
function hitBlock(o,dmg,src){
  o.hp-=dmg; floater('-'+dmg,o.tile,'#ffb3a0'); flash(o.tile,'#ffb3a0',.6);
  if(o.thorns&&src&&src.hp>0) hitEnemy(src,o.thorns,o.card);
  if(o.hp<=0) removeBlock(o);
}
function removeBlock(o){
  if(o.tile.occ===o) o.tile.occ=null; burst(o.tile,colorOf(o.card),12);
  B.walls=B.walls.filter(w=>w!==o); B.allies=B.allies.filter(s=>s!==o);
}
function payHp(n){ const p=B.player; if(!n) return; const c=Math.min(n,p.hp-1); p.hp-=c; floater('-'+c,p.tile,'#e0588f'); }

/* ---------------- casting ---------------- */
function castCard(){
  const b=B; if(!b||b.phase!=='fight') return;
  const p=b.player; if(p.castCd>0) return;
  const inst=castNext(b.piles); if(!inst) return;
  const c=inst.card; p.castCd=p.hasteT>0?.25:.45;
  b.log.push(c.name);
  b.hooks.onCast&&b.hooks.onCast(c);
  if(c.self&&c.type!=='boon') payHp(c.self);
  CAST[c.type==='piece'?c.base:c.type](c,p);
}
const CAST={
  strike(c,p){
    const row=lineTiles(p.tile,DIRS.E);
    if(c.shape==='line') shoot(p.tile,row,{card:c,dmg:c.pow,from:'p'});
    else if(c.shape==='row'){ row.forEach((t,i)=>{ flash(t,colorOf(c),1); if(t.occ&&t.occ.kind==='enemy') hitEnemy(t.occ,c.pow,c); });
      B.fx.push({kind:'beam',a:p.tile,b:row[row.length-1]||p.tile,color:colorOf(c),t:0,life:.3}); }
    else if(c.shape==='wedge'){ const ts=wedgeTiles(p.tile,2.6); ts.forEach(t=>{ flash(t,colorOf(c),1); if(t.occ&&t.occ.kind==='enemy') hitEnemy(t.occ,c.pow,c); }); }
    else if(c.shape==='all') alive().forEach(e=>{ B.fx.push({kind:'bolt',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.35}); hitEnemy(e,c.pow,c); });
    else if(c.shape==='missiles') for(let i=0;i<c.n;i++) later(i*.09,()=>{ const e=pick(alive()); if(!e) return;
      B.fx.push({kind:'arc',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.25}); hitEnemy(e,c.pow,c); });
  },
  lob(c,p){ lobFrom(p.tile,c,c.pow,c.radius,c.delay||.6,B.aim); B.aim=null; },
  ward(c,p){
    if(c.ward==='barrier'){ p.barrier+=c.amt; floater('🛡+'+c.amt,p.tile,'#6fd6ff'); return; }
    const free=P_TILES.filter(t=>!t.occ).sort((a,b)=>Math.abs(a.r-p.tile.r)-Math.abs(b.r-p.tile.r)||b.x-a.x);
    free.slice(0,c.n).forEach(t=>{ const w={kind:'wall',card:c,tile:t,hp:c.hp,maxHp:c.hp,thorns:c.thorns||0}; t.occ=w; B.walls.push(w); burst(t,colorOf(c),8,.3); });
  },
  sentry(c,p){ placeAlly(c,'sentry',40,c.dur); },
  charge(c,p){ if(c.fx==='lob') lobFrom(p.tile,c,c.pow,0,.45,B.aim); else shoot(p.tile,lineTiles(p.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); },
  utility(c,p){
    const pl=B.piles;
    if(c.util==='draw'){ const got=drawCards(pl,c.n); floater(got.length?'+'+got.length+' to hand':'deck empty',p.tile,'#c58bff'); }
    else if(c.util==='recall'){ const got=recallTop(pl); floater(got?'Recall: '+got.card.name:'nothing to recall',p.tile,'#c58bff'); }
    else if(c.util==='copy'){ const got=copyNext(pl); floater(got?'Copy: '+got.card.name:'nothing to copy',p.tile,'#c58bff'); }
    else if(c.util==='cleanse'){ const n=B.teles.filter(t=>!t.friendly).length; B.teles=B.teles.filter(t=>t.friendly); B.enemies.forEach(e=>e.windT=0);
      if(n) floater('cleansed',p.tile,'#e8e0ff'); healPlayer(c.amt); }
    burst(p.tile,colorOf(c),10,1);
  },
  summon(c,p){ placeAlly(c,c.ai,c.hp,c.dur); },
  machine(c,p){
    if(c.ai==='bulwark') return CAST.ward({ward:'wall',n:c.n,hp:c.hp,color:c.color,name:c.name},p);
    placeAlly(c,c.ai,c.hp,c.dur);
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
    }
    burst(p.tile,col,16,1); floater(c.name,p.tile,col);
  },
};
// Arc onto the aimed tile, or the enemy nearest to `from`, over walls and allies.
// The tile is fixed at cast, so an enemy that moves during the flight is missed.
const nearestEnemyTile=from=>{ const e=alive().sort((a,b)=>hexDist(from,a.tile)-hexDist(from,b.tile))[0]; return e?e.tile:null; };
function lobFrom(from,c,pow,radius,dur,target){
  const t=target||nearestEnemyTile(from); if(!t) return;
  const ts=[t].concat(radius?neighbors(t).filter(n=>n.side==='e'):[]);
  B.lobs.push({a:from,b:t,t:0,dur,card:c});
  B.teles.push({tiles:ts,t:0,dur,friendly:true});
  later(dur,()=>ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),6,.2); if(x.occ&&x.occ.kind==='enemy') hitEnemy(x.occ,pow,c); }));
}
// Sentries, summons and machines stand on a free tile of your side, nearest your row and the rift.
function placeAlly(c,ai,hp,dur){
  const p=B.player, t=P_TILES.filter(t=>!t.occ).sort((a,b)=>Math.abs(a.r-p.tile.r)-Math.abs(b.r-p.tile.r)||b.x-a.x)[0];
  if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
  const a={kind:'ally',ai,card:c,tile:t,hp,maxHp:hp,t:dur,dur,fireT:.4}; t.occ=a; B.allies.push(a); burst(t,colorOf(c),10,.4);
}
function updateAlly(a,dt){
  a.t-=dt; a.fireT-=dt;
  if(a.t<=0){ removeBlock(a); return; }
  if(a.fireT>0) return;
  const c=a.card; a.fireT=c.rate||1;
  const es=alive(); if(!es.length&&a.ai!=='healer') return;
  const inRow=es.filter(e=>e.tile.r===a.tile.r);
  const near=(inRow.length?inRow:es).sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0];
  switch(a.ai){
    case 'sentry': case 'turret': case 'repeater': case 'guardian':
      if(near){ B.fx.push({kind:'bolt',a:a.tile,b:near.tile,color:colorOf(c),t:0,life:.18,y0:1.3}); hitEnemy(near,c.pow,c); } break;
    case 'shooter': shoot(a.tile,lineTiles(a.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); break;
    case 'bomber': case 'mortar': lobFrom(a.tile,c,c.pow,a.ai==='mortar'?1:0,.7); break;
    case 'healer': healPlayer(c.amt); break;
  }
}
function shoot(from,tiles,o){ B.shots.push(Object.assign({a:from,tiles,i:-1,stepT:0,speed:o.from==='p'?.045:.08,hit:new Set()},o)); }

function fireWand(charged){
  const b=B, p=b.player; if(b.phase!=='fight'||p.wandCd>0) return;
  p.wandCd=charged?.5:.3;
  const dmg=Math.round((charged?24:6)*(p.powerT>0?2.5:1));
  shoot(p.tile,lineTiles(p.tile,DIRS.E),{dmg,from:'p',wand:true,big:charged});
}

/* ---------------- simulation ---------------- */
function update(dt){
  const b=B; if(!b) return;
  b.time+=dt;
  // Effects keep animating on the Custom screen, the fight itself is paused.
  for(const f of b.fx) f.t+=dt; b.fx=b.fx.filter(f=>f.t<f.life);
  for(const f of b.floaters){ f.t+=dt; f.y+=dt*1.2; } b.floaters=b.floaters.filter(f=>f.t<.9);
  for(const q of b.parts){ q.t+=dt; q.vy-=9*dt; q.wx+=q.vx*dt; q.wz+=q.vz*dt; q.y=Math.max(0,q.y+q.vy*dt); } b.parts=b.parts.filter(q=>q.t<q.life);
  for(const t of TILES) t.flash=Math.max(0,t.flash-dt*3);
  if(b.phase==='custom') return;

  for(const tm of b.timers) tm.t-=dt;
  const due=b.timers.filter(tm=>tm.t<=0); b.timers=b.timers.filter(tm=>tm.t>0); due.forEach(tm=>tm.fn());
  if(b.phase!=='fight'){ b.shots=[]; b.teles=[]; return; }

  const p=b.player, haste=p.hasteT>0;
  b.gauge=Math.min(GAUGE_MAX,b.gauge+dt);
  ['moveCd','castCd','wandCd','invT','powerT','pactT','hasteT','regenT'].forEach(k=>p[k]=Math.max(0,p[k]-dt));
  if(p.regenT>0){ p.regenAcc=(p.regenAcc||0)+p.regenAmt*dt; if(p.regenAcc>=5){ healPlayer(5); p.regenAcc-=5; } }
  if(p.charging) p.chargeT=Math.min(1.2,p.chargeT+dt);
  if(p.path.length&&p.moveCd<=0){ const n=p.path[0]; if(n.side==='p'&&!n.occ){ p.tile.occ=null; p.tile=n; n.occ=p; p.path.shift(); p.moveCd=haste?.08:.14; } else p.path=[]; }

  // your shots and enemy shots travel tile by tile
  for(const s of b.shots){
    s.stepT+=dt;
    while(s.stepT>=s.speed&&!s.done){ s.stepT-=s.speed; s.i++;
      const t=s.tiles[s.i]; if(!t){ s.done=true; break; }
      const o=t.occ;
      if(s.from==='p'&&o&&o.kind==='enemy'&&o.hp>0){ hitEnemy(o,s.dmg,s.card); s.done=true; }
      else if(s.from==='e'&&o&&o.kind!=='enemy'){ if(o.kind==='player') hitPlayer(s.dmg); else hitBlock(o,s.dmg,s.owner); s.done=true; }
      if(s.done) burst(t,s.card?colorOf(s.card):s.color||'#fff',6,.8);
    }
  }
  b.shots=b.shots.filter(s=>!s.done);

  for(const l of b.lobs) l.t+=dt; b.lobs=b.lobs.filter(l=>l.t<l.dur);

  for(const tl of b.teles){ tl.t+=dt;
    if(tl.t>=tl.dur&&!tl.friendly){ for(const t of tl.tiles){ flash(t,'#ff5d6c',1); const o=t.occ; if(!o) continue;
      if(o.kind==='player') hitPlayer(tl.dmg); else if(o.kind!=='enemy') hitBlock(o,tl.dmg,tl.owner); } } }
  b.teles=b.teles.filter(tl=>tl.t<tl.dur);

  for(const a of b.allies.slice()) updateAlly(a,dt);

  for(const e of alive()) updateEnemy(e,dt);
}

function updateEnemy(e,dt){
  const b=B;
  e.hitT=Math.max(0,e.hitT-dt); e.curseT=Math.max(0,e.curseT-dt); e.poisonT=Math.max(0,e.poisonT-dt);
  if(e.burnT>0){ e.burnT-=dt; e.burnAcc+=5*dt; if(e.burnAcc>=5){ e.burnAcc-=5; hitEnemy(e,5,null,{raw:true}); if(e.hp<=0) return; } }
  if(e.freezeT>0||e.stunT>0){ e.freezeT=Math.max(0,e.freezeT-dt); e.stunT=Math.max(0,e.stunT-dt); return; }
  if(e.slowT>0){ e.slowT-=dt; dt*=.5; }
  if(e.windT>0){ e.windT-=dt; if(e.windT<=0) shoot(e.tile,lineTiles(e.tile,DIRS.W),{dmg:e.dmg,from:'e',owner:e,color:COLORS[e.color].c}); return; }
  e.moveT-=dt;
  if(e.moveT<=0&&!b.teles.some(t=>t.owner===e)){
    e.moveT=rnd(1.3,2.4);
    const opts=neighbors(e.tile).filter(t=>t.side==='e'&&!t.occ);
    if(opts.length){ e.tile.occ=null; e.tile=pick(opts); e.tile.occ=e;
      if(e.poisonT>0){ hitEnemy(e,e.poisonAmt,null,{raw:true}); if(e.hp<=0) return; } }
  }
  e.atkT-=dt;
  if(e.atkT<=0){
    e.atkT=rnd(e.def.rate[0],e.def.rate[1]);
    const pt=b.player.tile, kind=e.def.atk==='both'?pick(['shot','slam']):e.def.atk;
    if(kind==='shot') e.windT=.55;
    else if(kind==='slam'){ const n=pick(neighbors(pt).filter(t=>t.side==='p'))||pt; b.teles.push({tiles:[pt,n],t:0,dur:1,dmg:e.dmg,owner:e}); }
    else if(kind==='quake'){ const safe=[pick(P_TILES)]; safe.push(...neighbors(safe[0]).filter(t=>t.side==='p').slice(0,2));
      b.teles.push({tiles:P_TILES.filter(t=>!safe.includes(t)),t:0,dur:1.7,dmg:e.dmg,owner:e}); }
  }
}

/* ---------------- input helpers ---------------- */
// Aiming lobs: tap an enemy-side tile (again to clear it). A lob card uses the aim once; a lob charge keeps it.
function nextIsLob(){ const q=B&&B.piles.queue[0]; if(!q) return false; const c=q.card, k=c.type==='piece'?c.base:c.type; return k==='lob'||(k==='charge'&&c.fx==='lob'); }
function setAim(t){ const b=B; if(!b||b.phase!=='fight'||!t||t.side!=='e') return; b.aim=b.aim===t?null:t; }
function cycleAim(){ const b=B; if(!b||b.phase!=='fight') return; const ts=alive().map(e=>e.tile).sort((a,c)=>a.r-c.r||a.q-c.q); if(!ts.length) return;
  b.aim=ts[(ts.indexOf(b.aim)+1)%ts.length]; }
function moveTo(t){ const b=B; if(!b||b.phase!=='fight'||!t) return; const p=b.player; if(t===p.tile) return; p.path=pathTo(p.tile,t); }
function stepDir(d){ const b=B; if(!b||b.phase!=='fight') return; const p=b.player, t=tileAt(p.tile.q+d[0],p.tile.r+d[1]); if(t&&t.side==='p'&&!t.occ) p.path=[t]; }
function stepVertical(up){ const p=B.player, ds=(up?[DIRS.NE,DIRS.NW]:[DIRS.SE,DIRS.SW]).filter(d=>{ const t=tileAt(p.tile.q+d[0],p.tile.r+d[1]); return t&&t.side==='p'&&!t.occ; }); if(ds.length) stepDir(pick(ds)); }
function wandDown(){ const b=B; if(!b||b.phase!=='fight') return; b.player.charging=true; b.player.chargeT=0; }
function wandUp(){ const b=B; if(!b) return; const p=b.player; if(!p.charging) return; p.charging=false; const ch=p.chargeT>=.9; p.chargeT=0; fireWand(ch); }

/* ---------------- rendering ---------------- */
const View={canvas:null, ctx:null, S:40, cx:0, cy:0, w:0, h:0, dpr:1};
const C30=Math.cos(Math.PI/6), S30=Math.sin(Math.PI/6), ISO_Y=.6, SLAB=.35;
function proj(wx,y,wz){ return [View.cx+View.S*(wx*C30+wz*S30), View.cy+View.S*((-wx*S30+wz*C30)*ISO_Y-y)]; }
const depthOf=t=>-t.wx*S30+t.wz*C30;
function hexCorners(t,rad,y){ const out=[]; for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; out.push(proj(t.wx+Math.cos(a)*rad,y||0,t.wz+Math.sin(a)*rad)); } return out; }

function resizeView(){
  const cv=View.canvas, r=cv.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  View.dpr=dpr; View.w=r.width; View.h=r.height; cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  // fit the projected board (plus headroom for units) into the canvas
  View.S=1; View.cx=0; View.cy=0;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const t of TILES) for(const [x,y] of hexCorners(t,1)){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
  y0-=2.2; y1+=SLAB+.2;
  View.S=Math.min((r.width-72)/(x1-x0),(r.height-16)/(y1-y0));
  View.cx=r.width/2-View.S*(x0+x1)/2; View.cy=r.height/2-View.S*(y0+y1)/2;
}
function pickTile(clientX,clientY){
  const r=View.canvas.getBoundingClientRect(), x=clientX-r.left, y=clientY-r.top;
  let best=null, bd=1e9;
  for(const t of TILES){ const [sx,sy]=proj(t.wx,0,t.wz); const d=Math.hypot((sx-x)/C30,(sy-y)/ISO_Y); if(d<bd){ bd=d; best=t; } }
  return bd<View.S*1.1?best:null;
}

function poly(ctx,pts){ ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); }
function mixHex(a,b,t){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const r=Math.round(((pa>>16)&255)*(1-t)+((pb>>16)&255)*t), g=Math.round(((pa>>8)&255)*(1-t)+((pb>>8)&255)*t), bl=Math.round((pa&255)*(1-t)+(pb&255)*t);
  return 'rgb('+r+','+g+','+bl+')'; }

function render(){
  const ctx=View.ctx, b=B; if(!ctx) return;
  ctx.setTransform(View.dpr,0,0,View.dpr,0,0);
  ctx.clearRect(0,0,View.w,View.h);
  if(!b) return;
  const T=b.time, S=View.S;
  const telMap=new Map();
  for(const tl of b.teles) for(const t of tl.tiles) telMap.set(t,tl);

  const tiles=TILES.slice().sort((a,c)=>depthOf(a)-depthOf(c));
  for(const t of tiles){
    const top=hexCorners(t,.96), base={p:'#2b2f63',e:'#4a2346',n:'#1a1030'}[t.side];
    let fill=base;
    const tl=telMap.get(t);
    if(tl){ const k=tl.t/tl.dur; fill=mixHex(base,tl.friendly?'#e8e0ff':'#ff3b4e',.25+.5*k*(.6+.4*Math.sin(T*18))); }
    if(t.flash>0) fill=mixHex(base,t.flashC[0]==='#'&&t.flashC.length===7?t.flashC:'#ffffff',Math.min(.8,t.flash));
    ctx.fillStyle='#0c0818'; poly(ctx,top.map(([x,y])=>[x,y+SLAB*S])); ctx.fill();
    ctx.fillStyle=mixHex(base,'#000000',.45);
    ctx.beginPath(); // front skirt
    for(let i=0;i<4;i++){ const [x,y]=top[i]; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    for(let i=3;i>=0;i--){ const [x,y]=top[i]; ctx.lineTo(x,y+SLAB*S); } ctx.closePath(); ctx.fill();
    ctx.fillStyle=fill; poly(ctx,top); ctx.fill();
    ctx.strokeStyle=t.side==='p'?'rgba(140,160,255,.45)':t.side==='e'?'rgba(255,120,170,.35)':'rgba(190,140,255,.5)'; ctx.lineWidth=1; ctx.stroke();
    if(t.side==='n'){ const [x,y]=proj(t.wx,.1,t.wz); ctx.fillStyle='rgba(180,130,255,.85)'; ctx.beginPath();
      ctx.moveTo(x,y-S*1.1-Math.sin(T*2+t.r)*3); ctx.lineTo(x+S*.22,y-S*.45); ctx.lineTo(x,y); ctx.lineTo(x-S*.22,y-S*.45); ctx.closePath(); ctx.fill(); }
  }
  // lob reticle: your aim, or a faint marker on the default target when a lob is next
  const aimT=b.aim||(nextIsLob()&&b.phase==='fight'?nearestEnemyTile(b.player.tile):null);
  if(aimT){ const [x,y]=proj(aimT.wx,.02,aimT.wz), pulse=1+Math.sin(T*6)*.06;
    ctx.strokeStyle=b.aim?'#ffe24d':'rgba(255,226,77,.45)'; ctx.lineWidth=b.aim?3:2; if(!b.aim) ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.ellipse(x,y,S*.62*pulse,S*.62*ISO_Y*pulse,0,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-S*.8,y); ctx.lineTo(x-S*.45,y); ctx.moveTo(x+S*.45,y); ctx.lineTo(x+S*.8,y); ctx.stroke(); ctx.setLineDash([]); }
  // path preview
  if(b.player.path.length){ ctx.fillStyle='rgba(160,180,255,.35)'; for(const t of b.player.path){ const [x,y]=proj(t.wx,0,t.wz); ctx.beginPath(); ctx.ellipse(x,y,S*.18,S*.18*ISO_Y,0,0,TAU); ctx.fill(); } }

  const units=[b.player,...b.walls,...b.allies,...alive()].sort((a,c)=>depthOf(a.tile)-depthOf(c.tile));
  for(const u of units) DRAW[u.kind](ctx,u,T,S);

  for(const s of b.shots){
    const from=s.i<0?s.a:s.tiles[s.i], to=s.tiles[s.i+1]||from, k=clamp(s.stepT/s.speed,0,1);
    const wx=from.wx+(to.wx-from.wx)*k, wz=from.wz+(to.wz-from.wz)*k, [x,y]=proj(wx,1,wz);
    const col=s.card?colorOf(s.card):s.color||(s.wand?'#e8e0ff':'#fff');
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(x,y,S*(s.big?.26:s.wand?.13:.19),0,TAU); ctx.fill(); ctx.shadowBlur=0;
  }
  for(const l of b.lobs){ const k=l.t/l.dur, wx=l.a.wx+(l.b.wx-l.a.wx)*k, wz=l.a.wz+(l.b.wz-l.a.wz)*k, [x,y]=proj(wx,1+Math.sin(k*Math.PI)*3,wz);
    const col=colorOf(l.card); ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(x,y,S*.24,0,TAU); ctx.fill(); ctx.shadowBlur=0; }
  for(const f of b.fx){
    const a=proj(f.a.wx,f.y0||1,f.a.wz), c=proj(f.b.wx,1,f.b.wz), al=1-f.t/f.life;
    ctx.strokeStyle=f.color; ctx.globalAlpha=al; ctx.lineWidth=f.kind==='beam'?S*.35:3; ctx.shadowColor=f.color; ctx.shadowBlur=10; ctx.beginPath(); ctx.moveTo(a[0],a[1]);
    if(f.kind==='bolt'){ for(let i=1;i<6;i++){ const k=i/6; ctx.lineTo(a[0]+(c[0]-a[0])*k+rnd(-6,6),a[1]+(c[1]-a[1])*k+rnd(-6,6)); } }
    else if(f.kind==='arc'){ ctx.quadraticCurveTo((a[0]+c[0])/2,Math.min(a[1],c[1])-S*1.5,c[0],c[1]); }
    ctx.lineTo(c[0],c[1]); ctx.stroke(); ctx.globalAlpha=1; ctx.shadowBlur=0;
  }
  for(const q of b.parts){ const [x,y]=proj(q.wx,q.y,q.wz); ctx.globalAlpha=1-q.t/q.life; ctx.fillStyle=q.color; ctx.fillRect(x-2,y-2,4,4); } ctx.globalAlpha=1;
  ctx.textAlign='center';
  for(const f of b.floaters){ const [x,y]=proj(f.wx,f.y,f.wz); ctx.globalAlpha=1-f.t/.9; ctx.font=(f.big?'800 ':'700 ')+Math.round(S*(f.big?.5:.4))+'px Rajdhani,system-ui,sans-serif';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.strokeText(f.text,x,y); ctx.fillStyle=f.color; ctx.fillText(f.text,x,y); } ctx.globalAlpha=1;
}

function shadow(ctx,t,S,r){ const [x,y]=proj(t.wx,0,t.wz); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y,S*r,S*r*ISO_Y,0,0,TAU); ctx.fill(); }
function bar(ctx,x,y,w,k,col){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x-w/2-1,y-1,w+2,6); ctx.fillStyle=col; ctx.fillRect(x-w/2,y,w*clamp(k,0,1),4); }
const DRAW={
  player(ctx,p,T,S){
    shadow(ctx,p.tile,S,.4);
    const [x,y]=proj(p.tile.wx,0,p.tile.wz), bob=Math.sin(T*3)*S*.03;
    ctx.globalAlpha=p.invT>0?.45:1;
    ctx.fillStyle='#5b46c9'; ctx.beginPath(); ctx.moveTo(x-S*.34,y); ctx.lineTo(x+S*.34,y); ctx.lineTo(x,y-S*1.05+bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#f0d2b0'; ctx.beginPath(); ctx.arc(x,y-S*1.05+bob,S*.17,0,TAU); ctx.fill();
    ctx.fillStyle='#3a2b8f'; ctx.beginPath(); ctx.moveTo(x-S*.26,y-S*1.12+bob); ctx.lineTo(x+S*.26,y-S*1.12+bob); ctx.lineTo(x+S*.12,y-S*1.75+bob); ctx.closePath(); ctx.fill();
    const glow=p.charging?(p.chargeT>=.9?'#ffffff':'#c58bff'):p.powerT>0?'#ff6a3d':'#9b7bff';
    ctx.strokeStyle='#b58a5a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+S*.3,y-S*.2); ctx.lineTo(x+S*.45,y-S*1.1); ctx.stroke();
    ctx.fillStyle=glow; ctx.shadowColor=glow; ctx.shadowBlur=p.charging?8+p.chargeT*14:8; ctx.beginPath(); ctx.arc(x+S*.45,y-S*1.15,S*(.09+(p.charging?p.chargeT*.08:0)),0,TAU); ctx.fill(); ctx.shadowBlur=0;
    if(p.barrier>0){ ctx.strokeStyle='rgba(111,214,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y-S*.6,S*.55,S*.85,0,0,TAU); ctx.stroke(); }
    if(p.dodge){ ctx.strokeStyle='rgba(200,240,255,.7)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.ellipse(x,y,S*.55,S*.55*ISO_Y,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha=1;
  },
  enemy(ctx,e,T,S){
    const sc=e.def.scale||1; shadow(ctx,e.tile,S,.42*sc);
    const [x,y]=proj(e.tile.wx,0,e.tile.wz), col=COLORS[e.color].c, frozen=e.freezeT>0, h=S*.55*sc, bob=frozen?0:Math.sin(T*4+e.tile.q)*S*.05;
    ctx.fillStyle=e.hitT>0?'#ffffff':frozen?mixHex(col,'#bfefff',.6):col;
    ctx.beginPath(); ctx.ellipse(x,y-h+bob,S*.38*sc,h,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#120a1e'; ctx.beginPath(); ctx.arc(x-S*.12*sc,y-h*1.2+bob,S*.06*sc,0,TAU); ctx.arc(x+S*.12*sc,y-h*1.2+bob,S*.06*sc,0,TAU); ctx.fill();
    const top=y-h*2-S*.15;
    bar(ctx,x,top,S*.9,e.hp/e.maxHp,'#ff5d6c');
    ctx.font='700 '+Math.round(S*.28)+'px Rajdhani,system-ui,sans-serif'; ctx.textAlign='center';
    const st=[]; if(e.burnT>0) st.push('🔥'); if(frozen) st.push('❄️'); if(e.stunT>0) st.push('💫'); if(e.slowT>0) st.push('🐌'); if(e.poisonT>0) st.push('☠'); if(e.curseT>0) st.push('☾');
    ctx.fillStyle='#fff'; ctx.fillText(e.name+'  weak: '+COLORS[WEAK_TO[e.color]].icon,x,top-4);
    if(st.length) ctx.fillText(st.join(''),x,top-4-S*.3);
    if(e.windT>0){ ctx.fillStyle='#ff5d6c'; ctx.font='800 '+Math.round(S*.6)+'px Rajdhani,system-ui,sans-serif'; ctx.fillText('!',x+S*.5,y-h*1.6); }
  },
  wall(ctx,w,T,S){
    const col=colorOf(w.card), top=hexCorners(w.tile,.62,.9), bot=hexCorners(w.tile,.62,0);
    ctx.fillStyle=mixHex(col,'#000000',.5); ctx.beginPath();
    for(let i=0;i<4;i++){ const [x,y]=top[i]; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } for(let i=3;i>=0;i--) ctx.lineTo(bot[i][0],bot[i][1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle=mixHex(col,'#ffffff',.15); poly(ctx,top); ctx.fill();
    if(w.thorns){ ctx.fillStyle='#fff'; const [x,y]=proj(w.tile.wx,1,w.tile.wz); ctx.font='700 '+Math.round(S*.3)+'px system-ui'; ctx.textAlign='center'; ctx.fillText('✶',x,y); }
    const [x,y]=proj(w.tile.wx,1.15,w.tile.wz); bar(ctx,x,y,S*.7,w.hp/w.maxHp,'#6fd6ff');
  },
  ally(ctx,a,T,S){
    const col=colorOf(a.card); shadow(ctx,a.tile,S,.32);
    const [x,y]=proj(a.tile.wx,0,a.tile.wz), creature=['shooter','bomber','healer','guardian'].includes(a.ai);
    let top;
    if(creature){ const h=S*(a.ai==='guardian'?.55:.4), bob=Math.sin(T*5+a.tile.r)*S*.04;
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y-h+bob,S*.3,h,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#120a1e'; ctx.beginPath(); ctx.arc(x+S*.05,y-h*1.25+bob,S*.05,0,TAU); ctx.arc(x+S*.17,y-h*1.25+bob,S*.05,0,TAU); ctx.fill();
      ctx.font=Math.round(S*.32)+'px system-ui'; ctx.textAlign='center'; ctx.fillText({shooter:'➶',bomber:'☄',healer:'✚',guardian:'🛡'}[a.ai],x-S*.02,y-h*.55+bob);
      top=y-h*2-S*.2; }
    else { const tall=a.ai==='mortar'?.6:1.1;
      ctx.fillStyle=a.card.color==='brown'?'#6b4a2e':'#4a4468'; ctx.fillRect(x-S*.18,y-S*tall,S*.36,S*tall);
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(x,y-S*(tall+.15),S*.2,0,TAU); ctx.fill(); ctx.shadowBlur=0;
      top=y-S*(tall+.55); }
    ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x-S*.45,top+S*.1,S*.12,-Math.PI/2,-Math.PI/2+TAU*clamp(a.t/a.dur,0,1)); ctx.stroke();
    if(a.hp<a.maxHp) bar(ctx,x,top,S*.6,a.hp/a.maxHp,'#6fd6ff');
  },
};

if(typeof module!=='undefined') module.exports={TILES,P_TILES,E_TILES,tileAt,neighbors,hexDist,lineTiles,wedgeTiles,pathTo};
