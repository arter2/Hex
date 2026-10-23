// Movement in real 12x7 hex fights (dev tool, not part of the game). Usage: node tools/battle-move-test.js [new,old] [2,4,6,8,11]
// Real 12x7 hex fights with the default (v118) feel against the v117 feel: walking, flicks, rocking, edges, and a live
// fight with a dodging autopilot. Deterministic: the game is stepped at 60 fps with a simulated thumb.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await br.newContext({viewport:{width:400,height:860},hasTouch:true,isMobile:true}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+require('path').resolve(__dirname,'../game/index.html')); await pg.evaluate(()=>localStorage.clear()); await pg.reload(); await pg.waitForTimeout(1200);
const res={};
for(const feel of (process.argv[2]||'new,old').split(',')) for(const depth of (process.argv[3]||'2,4,6,8,11').split(',').map(Number)){
 res[feel+' d'+depth]=await pg.evaluate(({feel,depth})=>{
  for(const k in MV_DEF) XLIT[k]=(feel==='new'?MV_DEF:MV_V117)[k]; XLIT.mvShow=false;
  let seed=depth*7919+1; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); fight(depth); closeCustomScreen(); paused=true;
  const p=B.player, F=1/60, out={board:BOARD_COLS+'x'+BOARD_ROWS+(SQUARE?' square':' hex'), enemies:B.enemies.length};
  const tick=()=>{ stickWalk(); update(F); arenaCamera(F,B.time); };
  const freeze=on=>{ for(const e of B.enemies){ if(on){ e._a=e.atkT; e._m=e.moveT; e.atkT=1e9; e.moveT=1e9; } else { e.atkT=e._a; e.moveT=e._m; } } };
  for(let i=0;i<240;i++) arenaCamera(F,B.time);
  const sp=Math.min(...neighbors(p.tile).map(n=>Math.hypot(n.wx-p.tile.wx,n.wz-p.tile.wz)));
  const R=()=>MV('mvStickR'), r2=x=>Math.round(x*100)/100, deg=Math.PI/180;
  const thumb=(ang,mag=1)=>{ if(!dragging) dragging={id:1,x0:200,y0:560,x:200,y:560,t0:-1e9,moved:true,stick:true,hist:[]}; dragging.x=200+Math.cos(ang)*R()*mag*1.1; dragging.y=560+Math.sin(ang)*R()*mag*1.1; };
  const letGo=()=>{ dragging=null; freeEnd(); };
  const mid=()=>P_TILES.slice().sort((a,b)=>Math.hypot(a.wx-(P_TILES.reduce((s,t)=>s+t.wx,0)/P_TILES.length),a.wz-(P_TILES.reduce((s,t)=>s+t.wz,0)/P_TILES.length))-Math.hypot(b.wx-(P_TILES.reduce((s,t)=>s+t.wx,0)/P_TILES.length),b.wz-(P_TILES.reduce((s,t)=>s+t.wz,0)/P_TILES.length)))[0];
  const place=h=>{ dragging=null; p.free=null; p.path=[]; p.snap=null; p.momo=false; p.vx=p.vz=0; p.lastSpd=0; p.tile.occ=null; p.tile=h; h.occ=p; p.fx=h.wx; p.fz=h.wz; p.fTile=h; p.rx=h.wx; p.rz=h.wz; p.moving=false; p.moveFrom=h; for(let i=0;i<20;i++) tick(); };
  const offMid=()=>r2(Math.hypot(p.fx-p.tile.wx,p.fz-p.tile.wz)/sp);
  const settle=(max=180)=>{ let n=0, still=0; while(n<max){ const a=[p.fx,p.fz]; tick(); n++; if(Math.hypot(p.fx-a[0],p.fz-a[1])<1e-4){ if(++still>=3) break; } else still=0; } return r2((n-3)*F); };
  const bad=[]; const check=tag=>{ if(p.tile.side!=='p') bad.push(tag+': off own side'); if(TILES.filter(t=>t.occ===p).length!==1) bad.push(tag+': occ'); if(!(isFinite(p.fx)&&isFinite(p.fz))) bad.push(tag+': NaN'); };
  // screen directions on the board (the thumb's screen angle that walks along +z / -x on screen)
  const dirs={right:0,left:180*deg,up:-90*deg,down:90*deg};
  freeze(true);
  // 1. push 0.35 s and let go, each way, from the middle
  out.push={}; for(const [n,a] of Object.entries(dirs)){ const h=mid(); place(h); const tr=[]; const T=()=>tr.push(p.tile.col+','+p.tile.r+(p.walled?'W':'')); for(let i=0;i<21;i++){ thumb(a); tick(); check('push'); if(i%4==0) T(); } letGo(); const t=settle(); check('push'); T();
    out.push[n]={tiles:r2(Math.hypot(p.tile.wx-h.wx,p.tile.wz-h.wz)/sp), settle:t, offMid:offMid(), from:h.col+','+h.r, trail:[...new Set(tr)].join(' '), blocked:P_TILES.filter(t=>t.occ&&t.occ!==p||t.holeT>0).map(t=>t.col+','+t.r).join(' ')}; }
  // 2. flicks from the middle: the thumb moves for 60 ms then lets go
  const flick=(a,pxs)=>{ const now=performance.now(); dragging={id:1,x0:200,y0:560,x:200,y:560,t0:now-120,moved:true,stick:true,hist:[[now-60,200,560],[now,200+Math.cos(a)*pxs*.06,560+Math.sin(a)*pxs*.06]]}; dragEnd({pointerId:1,type:'pointerup'}); };
  out.flick={}; for(const [n,a] of [['right',0],['left',180*deg],['up',-90*deg]]) for(const v of [600,1000,1500]){ const h=mid(); place(h); flick(a,v); const t=settle(); check('flick');
    out.flick[n+' '+v]={tiles:r2(Math.hypot(p.tile.wx-h.wx,p.tile.wz-h.wz)/sp), settle:t, offMid:offMid()}; }
  // 3. rock the thumb left and right every 0.25 s for 3 s; how far you drift and how much you actually move
  { const h=mid(); place(h); let path=0, prev=[p.fx,p.fz], zs=[]; for(let i=0;i<180;i++){ thumb((Math.floor(i/15)%2)?180*deg:0); tick(); path+=Math.hypot(p.fx-prev[0],p.fz-prev[1]); prev=[p.fx,p.fz]; zs.push(p.fz); check('rock'); }
    letGo(); settle(); out.rock={swing:r2((Math.max(...zs)-Math.min(...zs))/sp), path:r2(path/sp), drift:r2(Math.hypot(p.tile.wx-h.wx,p.tile.wz-h.wz)/sp), offMid:offMid()}; }
  // 4. edges: hold into each edge and diagonally along it for 1.5 s; frames stuck (pushing along the edge, under 10% of top speed)
  out.edge={}; for(const [n,a] of [['up',-90*deg],['down',90*deg],['left',180*deg],['right',0],['up-right',-45*deg],['down-left',135*deg]]){ place(mid()); let stuck=0;
    for(let i=0;i<120;i++){ const a0=[p.fx,p.fz]; thumb(a); tick(); check('edge'); if(i>60&&n.includes('-')&&Math.hypot(p.fx-a0[0],p.fz-a0[1])<.1*MV('mvStickSpeed')*sp*F) stuck++; }
    letGo(); settle(); out.edge[n]={tile:p.tile.col+','+p.tile.r, stuck, offMid:offMid()}; }
  // 5. live fight for 25 s, auto-firing: an autopilot that sees an enemy shot coming down its row and steps out of it with the stick
  freeze(false); place(mid()); const hp0=p.hp; let dodges=0, hits=0, lastHp=p.hp, holdT=0, holdA=0, frames=0, moved=0, prev=[p.fx,p.fz];
  const seen=new Set(); for(let i=0;i<25*60&&B.phase==='fight';i++){ frames++; for(const s of B.shots) if(s.from!=='p') seen.add(s); for(const l of B.lobs) seen.add(l);
    const danger=B.shots.some(s=>s.from!=='p'&&s.tiles&&s.tiles.slice(Math.max(0,s.i),Math.max(0,s.i)+5).includes(p.tile))||B.lobs.some(l=>l.b===p.tile&&l.a&&l.a.side!=='p'&&l.t<l.dur);
    if(danger&&holdT<=0){ const up=p.tile.r>0&&(p.tile.r>=BOARD_ROWS-1||rnd()<.5); holdA=up?-90*deg:90*deg; holdT=.18; dodges++; }
    if(holdT>0){ thumb(holdA); holdT-=F; if(holdT<=0) letGo(); }
    if(i%40===0) wandDown(); if(i%40===20) wandUp();
    tick(); check('fight'); moved+=Math.hypot(p.fx-prev[0],p.fz-prev[1]); prev=[p.fx,p.fz]; if(p.hp<lastHp) hits++; lastHp=p.hp; }
  letGo(); out.fight={secs:r2(frames*F), phase:B.phase, dodges, hitsTaken:hits, shotsSeen:seen.size, hpLost:hp0-p.hp, tilesWalked:r2(moved/sp), enemiesLeft:B.enemies.filter(e=>e.hp>0).length};
  out.bad=[...new Set(bad)];
  return out; },{feel,depth});
}
for(const [k,o] of Object.entries(res)){ console.log('\n##',k,o.board,'enemies',o.enemies);
  console.log('push 0.35 s (tiles/settle s/off middle):',Object.entries(o.push).map(([n,v])=>n+' '+v.tiles+'/'+v.settle+'/'+v.offMid).join(' | '));
  console.log('flick (px/s):',Object.entries(o.flick).map(([n,v])=>n+' '+v.tiles+'/'+v.settle+'/'+v.offMid).join(' | '));
  console.log('rock:',JSON.stringify(o.rock)); console.log('edge:',Object.entries(o.edge).map(([n,v])=>n+' '+v.tile+' off '+v.offMid).join(' | '));
  console.log('fight:',JSON.stringify(o.fight)); if(o.bad.length) console.log('BROKEN:',o.bad.join('; ')); } console.log('errs',errs.slice(0,5)); await br.close()})();
