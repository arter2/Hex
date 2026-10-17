/* ---------------- Strike shapes (v79, card rules plan step 1) ----------------
   The 8 shapes strikes always had (line, row, wedge, all, dig, zigzag, diag, missiles) stay in
   battle.js. These 15 are new; a strike card picks one with `shape`, and can carry a rider:
     pierce  its shots go through one more enemy
     crit    1 hit in 4 deals double
     recoil  +30% power, but it throws you one tile back
     onkill  a kill with it fills 15% of the Spell gauge
   No card in the collection uses them yet (step 2); the Card lab (cardlab.js) tries them. */

const STRIKE_SHAPES={
  // shots
  twin:     {name:'Twin',          icon:'⇉', group:'shot',   pow:20, text:'{pow} down your row and the next'},
  fan:      {name:'Fan',           icon:'⋔', group:'shot',   pow:18, text:'{pow} down your row and both diagonals'},
  spear:    {name:'Spear',         icon:'➵', group:'shot',   pow:27, text:'{pow} through the first enemy in your row into the one behind it'},
  boomerang:{name:'Boomerang',     icon:'↺', group:'shot',   pow:20, text:'{pow} down your row and back up the next, hitting each enemy once'},
  gun:      {name:'Machine gun',   icon:'⁙', group:'shot',   pow:4,  text:'a stream of bolts of {pow} for {dur} seconds, following you as you move'},
  wave:     {name:'Wave',          icon:'≋', group:'shot',   pow:20, text:'{pow} in a line across every row, sweeping forward over the enemy side; each enemy is hit once'},
  // spread
  burst:    {name:'Burst',         icon:'✺', group:'spread', pow:26, text:'{pow} to the first enemy in your row, and half that around it'},
  chain:    {name:'Chain',         icon:'ϟ', group:'spread', pow:26, text:'{pow} to the first enemy in your row (or the nearest), then it jumps to 2 more, weaker each jump'},
  ricochet: {name:'Ricochet',      icon:'⟋', group:'spread', pow:22, text:'{pow} on a shot that bounces off the board\'s edges and comes back, so it can hit from behind'},
  snipe:    {name:'Snipe',         icon:'◎', group:'spread', pow:34, text:'{pow} to the enemy with the least HP, anywhere'},
  // areas and timing
  shockwave:{name:'Shockwave',     icon:'◉', group:'area',   pow:40, text:'{pow} to every enemy within 4 tiles of you'},
  column:   {name:'Column',        icon:'┃', group:'area',   pow:26, text:'{pow} at once to a line across every row of the enemy side, where you aim (or at the nearest enemy)'},
  mark:     {name:'Delayed mark',  icon:'⌖', group:'area',   pow:55, text:'marks an enemy (the one you aim at, or the nearest); 1.5 seconds later it explodes for {pow}'},
  // bombs
  cluster:  {name:'Cluster bomb',  icon:'✱', group:'bomb',   pow:20, text:'lobs {pow} where you aim, then it breaks into bomblets of {bomblet} in a {cluster}'},
  mine:     {name:'Proximity mine',icon:'✹', group:'bomb',   pow:45, text:'lays a mine on the enemy side where you aim (or in front of the nearest enemy); it blows up for {pow} around it when an enemy steps on or next to it, or when you shoot it. Lasts {secs}'},
};
const SHOCK_R=4;   // the plan said 3, but from the front of your side 3 tiles barely reaches the enemy
const STRIKE_GROUPS={shot:'Shots', spread:'Spread', area:'Areas and timing', bomb:'Bombs'};
const CLUSTER_SHAPES={ring:'ring around it', cross:'+ shape', x:'X shape', fan:'fan further on', scatter:'scatter nearby'};
const STRIKE_RIDERS={pierce:{name:'Pierce', text:'its shots go through one more enemy'}, crit:{name:'Crit', text:'1 hit in 4 deals double'},
  recoil:{name:'Recoil', text:'+30% power, but it throws you one tile back'}, onkill:{name:'Reaper', text:'a kill with it fills 15% of the Spell gauge'}};
// the old 8, for the Card lab's list
const STRIKE_OLD={line:'Line', row:'Row', wedge:'Wedge', all:'All', dig:'Dig', zigzag:'Zigzag', diag:'Diagonals', missiles:'Missiles'};

// a strike card's numbers from its shape (F: rank and rarity, kw: its keyword)
function strikeBuild(c,F,rank,kw){
  const S=STRIKE_SHAPES[c.shape], k=kw&&typeof applyKw==='function'?applyKw(c,kw,rank):1;
  c.pow=Math.max(2,Math.round(S.pow*F*k));
  if(c.shape==='gun') c.dur=+(2+rank*.08).toFixed(1);
  if(c.shape==='cluster'){ c.cluster=c.cluster||'ring'; c.bomblet=Math.max(2,Math.round(c.pow*.6)); }
  if(c.shape==='mine') c.turns=2;
  return strikeRiders(c); }
// a rider's numbers, on any strike (old shapes too): Recoil buys 30% more power
function strikeRiders(c){ if(c.rider==='recoil'){ c.pow=Math.round(c.pow*1.3); if(c.bomblet) c.bomblet=Math.round(c.bomblet*1.3); }
  if(c.rider==='crit') c.crit=.25; if(c.rider==='onkill') c.onkill=.15; return c; }
function strikeText(c){ const S=STRIKE_SHAPES[c.shape]; if(!S) return '';
  let t=S.text.replace('{pow}',c.pow).replace('{dur}',c.dur).replace('{bomblet}',c.bomblet).replace('{cluster}',CLUSTER_SHAPES[c.cluster]||'').replace('{secs}',typeof tn==='function'?tn(c.turns||2):'20 seconds');
  t=t[0].toUpperCase()+t.slice(1);
  if(c.rider&&STRIKE_RIDERS[c.rider]) t+='. '+STRIKE_RIDERS[c.rider].name+': '+STRIKE_RIDERS[c.rider].text;
  return t; }

/* ---------------- in battle ---------------- */
const stCol=c=>colorOf(c);
const stShoot=(c,from,tiles,o)=>shoot(from,tiles,Object.assign({card:c,dmg:c.pow,from:'p',pierce:c.rider==='pierce'?1:0},o||{}));
const stRoute=fn=>{ const ts=[]; for(let i=1;i<BOARD_COLS*2;i++){ const t=fn(i); if(t===undefined) break; if(t) ts.push(t); } return ts; };
// the tile in your row, or else the nearest enemy, that a shot would reach first
function stFirst(p){ const r=shotPath(lineTiles(p.tile,DIRS.E),false); return r.hit[0]&&r.hit[0].occ; }
const stNearest=from=>alive().sort((a,b)=>hexDist(from,a.tile)-hexDist(from,b.tile))[0];
const stNextRow=t=>tileCR(t.col,t.r+1)?1:-1;
// the path of a ricochet: up and forward at a slant, bouncing off the top and bottom rows and the far edge
function ricochetPath(p){ const out=[]; let col=p.tile.col, r=p.tile.r, dc=1, dr=r>=BOARD_ROWS/2?-1:1;
  for(let i=0;i<BOARD_COLS*2+4;i++){ if(r+dr<0||r+dr>=BOARD_ROWS) dr=-dr; if(col+dc>=BOARD_COLS) dc=-1; col+=dc; r+=dr;
    if(dc<0&&col<BOARD_COLS/2) break; const t=tileCR(col,r); if(t) out.push(t); }
  return out; }
// the tiles a column strike covers: the column you aim at, or the nearest enemy's
function columnTiles(p,aim){ const t=aim||(stFirst(p)||stNearest(p.tile)||{}).tile; const col=t?t.col:BOARD_COLS/2+1; return E_TILES.filter(x=>x.col===col); }
// bomblets: where a cluster bomb's pieces land around its target
function clusterTiles(t,shape){ const at=(dc,dr)=>tileCR(t.col+dc,t.r+dr), E=x=>x&&x.side==='e'&&x!==t;
  const offs={ring:null, cross:[[2,0],[-2,0],[0,2],[0,-2]], x:[[1,1],[1,-1],[-1,1],[-1,-1],[2,2],[2,-2]], fan:[[2,0],[2,1],[2,-1],[3,0],[3,2],[3,-2]], scatter:null}[shape];
  if(shape==='ring') return around(t).filter(E);
  if(shape==='scatter'){ const pool=E_TILES.filter(x=>x!==t&&hexDist(x,t)<=2); return pool.sort(()=>Math.random()-.5).slice(0,5); }
  return offs.map(([a,b])=>at(a,b)).filter(E); }
// where a mine goes: the aimed free tile, or the free tile in front of the nearest enemy
// (two tiles in front of it if it can, so it isn't set off the moment it lands)
function mineTile(p,aim){ if(aim&&aim.side==='e'&&!aim.occ&&!aim.mine) return aim;
  const e=stFirst(p)||stNearest(p.tile); if(!e) return null; const es=alive(), near=t=>Math.min(...es.map(x=>hexDist(x.tile,t)));
  const free=E_TILES.filter(t=>!t.occ&&!t.mine&&!burning(t)&&hexDist(t,e.tile)<=3&&t.col<=e.tile.col);
  return free.sort((a,b)=>(near(a)>=2?0:1)-(near(b)>=2?0:1)||Math.abs(hexDist(a,e.tile)-2)-Math.abs(hexDist(b,e.tile)-2)||Math.abs(a.r-e.tile.r)-Math.abs(b.r-e.tile.r))[0]||null; }
// hit everything of the enemy's on a tile (an enemy, its wall or a rock)
function stHitTile(t,pow,c){ flash(t,stCol(c),1); const o=t.occ; if(!o) return groundHit(t,c); if(o.kind==='enemy') return hitEnemy(o,pow,c); if(o.enemy) return hitBlock(o,pow,null); if(o.kind==='rock') return hitRock(o,pow); }

const STRIKE_CAST={
  twin(c,p){ stShoot(c,p.tile,lineTiles(p.tile,DIRS.E)); const n=tileCR(p.tile.col,p.tile.r+stNextRow(p.tile)); if(n) stShoot(c,n,lineTiles(n,DIRS.E)); },
  fan(c,p){ stShoot(c,p.tile,lineTiles(p.tile,DIRS.E)); for(const d of [-1,1]) stShoot(c,p.tile,stRoute(i=>tileCR(p.tile.col+i,p.tile.r+d*i)||undefined)); },
  spear(c,p){ stShoot(c,p.tile,lineTiles(p.tile,DIRS.E),{pierce:1+(c.rider==='pierce'?1:0)}); },
  boomerang(c,p){ const d=stNextRow(p.tile), out=lineTiles(p.tile,DIRS.E), back=[], last=out[out.length-1];
    for(let col=last?last.col:BOARD_COLS-1;col>=BOARD_COLS/2;col--){ const t=tileCR(col,p.tile.r+d); if(t) back.push(t); }
    stShoot(c,p.tile,out.concat(back),{pierce:9}); },
  gun(c,p){ const n=Math.round(c.dur/.15); for(let i=0;i<n;i++) later(i*.15,()=>{ if(B.phase!=='fight') return; const P=B.player; stShoot(c,P.tile,lineTiles(P.tile,DIRS.E),{speed:.03}); }); },
  wave(c,p){ const hit=new Set(); for(let col=BOARD_COLS/2, i=0;col<BOARD_COLS;col++,i++){ const k=col; later(i*.09,()=>{ for(const t of E_TILES.filter(x=>x.col===k)){ flash(t,stCol(c),1); burst(t,stCol(c),2,.2); const o=t.occ;
      if(o&&o.kind==='enemy'&&!hit.has(o)){ hit.add(o); hitEnemy(o,c.pow,c); } } }); } },
  burst(c,p){ stShoot(c,p.tile,lineTiles(p.tile,DIRS.E),{onHit:(e,t)=>{ ring(t,stCol(c),1.3,.35); for(const n of around(t)){ const o=n.occ; flash(n,stCol(c),.7); if(o&&o.kind==='enemy'&&o!==e&&o.hp>0) hitEnemy(o,Math.round(c.pow*.5),c); } }}); },
  chain(c,p){ let e=stFirst(p)||stNearest(p.tile), from=p.tile; const done=new Set();
    for(let i=0;i<3&&e;i++){ const f=from, t=e, k=[1,.7,.5][i]; done.add(e); later(i*.12,()=>{ if(t.hp<=0) return; B.fx.push({kind:'bolt',a:f,b:t.tile,color:stCol(c),t:0,life:.22,y0:1.1}); hitEnemy(t,Math.round(c.pow*k),c); });
      from=e.tile; e=alive().filter(x=>!done.has(x)).sort((x,y)=>hexDist(from,x.tile)-hexDist(from,y.tile))[0]; } },
  ricochet(c,p){ stShoot(c,p.tile,ricochetPath(p),{pierce:9,falloff:.85}); },
  snipe(c,p){ const e=alive().sort((a,b)=>a.hp-b.hp)[0]; if(!e) return; B.fx.push({kind:'beam',a:p.tile,b:e.tile,color:stCol(c),t:0,life:.25}); hitEnemy(e,c.pow,c); },
  shockwave(c,p){ ring(p.tile,stCol(c),4.2,.5,9); shake(5); for(const e of alive()) if(hexDist(p.tile,e.tile)<=SHOCK_R) later(hexDist(p.tile,e.tile)*.06,()=>hitEnemy(e,c.pow,c));
    for(const t of TILES) if(hexDist(p.tile,t)<=SHOCK_R&&t.side==='e') flash(t,stCol(c),.7); },
  column(c,p){ const ts=columnTiles(p,B.aim); B.aim=null; B.fx.push({kind:'beam',a:ts[0]||p.tile,b:ts[ts.length-1]||p.tile,color:stCol(c),t:0,life:.3}); ts.forEach(t=>stHitTile(t,c.pow,c)); },
  mark(c,p){ const at=B.aim&&B.aim.occ&&B.aim.occ.kind==='enemy'?B.aim.occ:null; B.aim=null; const e=at||stFirst(p)||stNearest(p.tile); if(!e) return;
    e.markBomb={t:1.5,card:c,pow:c.pow}; floater('marked',e.tile,stCol(c),true); },
  cluster(c,p){ const t=B.aim||(stFirst(p)||stNearest(p.tile)||{}).tile; B.aim=null; if(!t) return; const dur=.6;
    B.lobs.push({a:p.tile,b:t,t:0,dur,card:c}); B.teles.push({tiles:[t],t:0,dur,friendly:true});
    later(dur,()=>{ stHitTile(t,c.pow,c); burst(t,stCol(c),10,.4); const bs=clusterTiles(t,c.cluster);
      bs.forEach((x,i)=>{ B.fx.push({kind:'arc',a:t,b:x,color:stCol(c),t:0,life:.2}); later(.2+i*.05,()=>{ burst(x,stCol(c),5,.3); stHitTile(x,c.bomblet,c); }); }); }); },
  mine(c,p){ const t=mineTile(p,B.aim); B.aim=null; if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
    t.mine={card:c,pow:c.pow,life:secs(c.turns||2),arm:.6}; burst(t,stCol(c),10,.2); floater('mine set',t,stCol(c)); },
};
// Recoil: you are thrown one tile back as it fires (any strike shape)
function strikeRecoil(c,p){
  if(c.rider==='recoil'){ const back=[tileCR(p.tile.col-1,p.tile.r),...neighbors(p.tile).filter(t=>t.col<p.tile.col)].find(t=>t&&t.side==='p'&&!t.occ&&!(t.holeT>0));
    if(back){ p.tile.occ=null; p.tile=back; back.occ=p; p.path=[]; } shake(4); floater('recoil',p.tile,'#ffb3a0'); } }

// each frame: marks count down and blow, mines go off when an enemy comes close
function strikeTick(dt){
  for(const e of alive()) if(e.markBomb&&(e.markBomb.t-=dt)<=0){ const m=e.markBomb; e.markBomb=null; ring(e.tile,stCol(m.card),1.6,.45,8); shake(5); burst(e.tile,stCol(m.card),24,1); hitEnemy(e,m.pow,m.card); }
  for(const t of E_TILES) if(t.mine){ if((t.mine.life-=dt)<=0){ t.mine=null; continue; }
    if((t.mine.arm-=dt)<=0&&alive().some(e=>hexDist(e.tile,t)<=1)) mineBlow(t); }   // armed after .6 s
}
function mineBlow(t){ const m=t.mine; if(!m) return; t.mine=null; floater('BOOM',t,stCol(m.card),true); shake(5); ring(t,stCol(m.card),1.5,.4,8);
  for(const x of [t,...around(t)].filter(x=>x.side==='e')){ burst(x,stCol(m.card),6,.3); stHitTile(x,m.pow,m.card); } }

// what the cast preview shows for a new shape (battle.js castPreview)
function strikePreview(c,p,out,path){
  const row=lineTiles(p.tile,DIRS.E), sh=c.shape, en=t=>t.occ&&t.occ.kind==='enemy', addArea=ts=>{ out.area.push(...ts); out.hit.push(...ts.filter(en)); };
  if(sh==='twin'){ path(row,false); const n=tileCR(p.tile.col,p.tile.r+stNextRow(p.tile)); if(n) path(lineTiles(n,DIRS.E),false); }
  else if(sh==='fan'){ path(row,false); for(const d of [-1,1]) path(stRoute(i=>tileCR(p.tile.col+i,p.tile.r+d*i)||undefined),false); }
  else if(sh==='spear'||sh==='gun'||sh==='burst'){ path(row,false); if(sh==='spear'){ const r=row.filter(en); out.hit=out.hit.concat(r.slice(1,2)); } if(sh==='gun') out.note=c.dur+' s of bolts'; }
  else if(sh==='boomerang'){ const d=stNextRow(p.tile), back=E_TILES.filter(t=>t.r===p.tile.r+d); addArea(row); addArea(back); out.paths.push(row,back); }
  else if(sh==='wave'){ addArea(E_TILES); out.note='sweeps the enemy side'; }
  else if(sh==='chain'){ const e=stFirst(p)||stNearest(p.tile); if(e) out.hit.push(e.tile); out.note='jumps to 2 more'; }
  else if(sh==='ricochet'){ const ts=ricochetPath(p); addArea(ts); out.paths.push(ts); }
  else if(sh==='snipe'){ const e=alive().sort((a,b)=>a.hp-b.hp)[0]; if(e) out.hit.push(e.tile); }
  else if(sh==='shockwave') addArea(TILES.filter(t=>t.side==='e'&&hexDist(p.tile,t)<=SHOCK_R));
  else if(sh==='column') addArea(columnTiles(p,B.aim));
  else if(sh==='mark'){ const at=B.aim&&B.aim.occ&&B.aim.occ.kind==='enemy'?B.aim.occ:null, e=at||stFirst(p)||stNearest(p.tile); if(e){ out.hit.push(e.tile); out.arc=e.tile; } }
  else if(sh==='cluster'){ const t=B.aim||(stFirst(p)||stNearest(p.tile)||{}).tile; if(t){ out.arc=t; addArea([t,...clusterTiles(t,c.cluster)]); } }
  else if(sh==='mine'){ const t=mineTile(p,B.aim); if(t){ out.arc=t; out.area.push(t,...around(t).filter(x=>x.side==='e')); } }
}
// shapes you can aim by tapping the enemy side
const STRIKE_AIMED={column:1, mark:1, cluster:1, mine:1};

if(typeof module!=='undefined') module.exports={STRIKE_SHAPES,STRIKE_RIDERS,CLUSTER_SHAPES,strikeBuild,strikeText};
