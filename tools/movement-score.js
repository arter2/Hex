// Movement feel scorer (dev tool, not part of the game). Usage: node tools/movement-score.js '<json settings>' [--holdout]
// Drives the Movement lab headless at a fixed 60 fps with scripted joystick input on a hex and a square board and
// prints measurements and a 0-100 score per board (docs/movement-tuning.md says what it measures). A JSON array
// scores several sets in one run, one line each. Needs Playwright and Chromium.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const arg=JSON.parse(process.argv[2]||'{}'), list=Array.isArray(arg)?arg:[arg], brief=process.argv.includes('--brief')||list.length>1, hold=process.argv.includes('--holdout');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await br.newContext({viewport:{width:400,height:860},hasTouch:true,isMobile:true}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+require('path').resolve(__dirname,'../game/index.html')); await pg.evaluate(()=>localStorage.clear()); await pg.reload(); await pg.waitForTimeout(1200);
await pg.evaluate(()=>openMenu()); await pg.tap('#mmMove'); await pg.waitForTimeout(2500);
const all=[];
for(const [ix,over] of [[-1,list[0]],...list.map((o,i)=>[i,o])]){ const out={};
for(const square of [false,true]){
 out[square?'square':'hex']=await pg.evaluate(({square,over,hold})=>{
  for(const k in MV_DEF) XLIT[k]=MV_DEF[k]; Object.assign(XLIT,over); XLIT.mvShow=false;
  MLAB.square=square; MLAB.turrets=0; MLAB.cols=hold?(square?5:7):6; MLAB.rows=hold?(square?6:8):7; const H=hold?20*Math.PI/180:0; mlabStart(); paused=true;
  const p=B.player, F=1/60;
  const tick=()=>{ stickWalk(); update(F); arenaCamera(F,B.time); };
  for(let i=0;i<240;i++) arenaCamera(F,B.time);
  const scr=()=>proj(p.fx,0,p.fz);
  const cx=P_TILES.reduce((s,t)=>s+t.wx,0)/P_TILES.length, cz=P_TILES.reduce((s,t)=>s+t.wz,0)/P_TILES.length;
  const mid=P_TILES.slice().sort((a,b)=>Math.hypot(a.wx-cx,a.wz-cz)-Math.hypot(b.wx-cx,b.wz-cz))[0];
  const sp=Math.min(...neighbors(mid).map(n=>Math.hypot(n.wx-mid.wx,n.wz-mid.wz)));
  const place=(h=mid)=>{ dragging=null; p.free=null; p.path=[]; p.snap=null; p.momo=false; p.vx=p.vz=0; p.lastSpd=0; p.tile.occ=null; p.tile=h; h.occ=p; p.fx=h.wx; p.fz=h.wz; p.fTile=h; p.rx=h.wx; p.rz=h.wz; p.moving=false; p.moveFrom=h; for(let i=0;i<20;i++) tick(); };
  const R=()=>MV('mvStickR');
  // the tile to start a push from so there is room ahead: back from the middle against the way the thumb goes
  const nearT=(x,z)=>P_TILES.slice().sort((a,b)=>Math.hypot(a.wx-x,a.wz-z)-Math.hypot(b.wx-x,b.wz-z))[0];
  const back=(ang,n)=>{ const [sx,sy]=proj(cx,0,cz), [wx,wz]=unprojGround(sx+Math.cos(ang+H)*60,sy+Math.sin(ang+H)*60,cx,cz), l=Math.hypot(wx-cx,wz-cz)||1; return nearT(cx-(wx-cx)/l*n*sp,cz-(wz-cz)/l*n*sp); };
  const thumb=(ang0,mag=1)=>{ const ang=ang0+H; if(!dragging) dragging={id:1,x0:200,y0:500,x:200,y:500,t0:-1e9,moved:true,stick:true}; dragging.x=200+Math.cos(ang)*R()*mag*1.1; dragging.y=500+Math.sin(ang)*R()*mag*1.1; };
  const letGo=()=>{ dragging=null; freeEnd(); };
  const rec=(n,fn)=>{ const L=[]; let prev=scr(); for(let i=0;i<n;i++){ fn&&fn(i); tick(); const s=scr(); L.push({px:Math.hypot(s[0]-prev[0],s[1]-prev[1]),sx:s[0]-prev[0],sy:s[1]-prev[1],x:p.fx,z:p.fz,v:Math.hypot(p.vx||0,p.vz||0),w:!!p.walled}); prev=s; } return L; };
  const r2=x=>Math.round(x*100)/100, deg=Math.PI/180, m={};
  // top screen speed for a full push right, once settled
  place(back(0,2)); const run=rec(50,()=>thumb(0)); const topPx=Math.max(...run.slice(15,30).map(l=>l.px))||1;
  const t50=run.findIndex(l=>l.px>=.5*topPx), t90=run.findIndex(l=>l.px>=.9*topPx);
  m.start={t50:r2((t50+1)*F), t90:r2((t90+1)*F), firstMoveFrame:run.findIndex(l=>l.px>.05)+1};
  // let go at speed: stop time, slide, and how much the magnet pulls you back against the way you went
  const rel={}; for(const [name,ang] of [['right',0],['up',-90*deg],['diag',-45*deg],['down',90*deg]]){
    place(back(ang,1.5)); const P0=rec(24,()=>thumb(ang)); const pushW=P0.filter(l=>l.w).length, pushSlow=P0.slice(10).filter(l=>l.px<.5*topPx).length; const x0=p.fx, z0=p.fz, d=[p.vx,p.vz], dl=Math.hypot(...d)||1; letGo();
    const L=rec(90); let stop=L.length; for(let i=L.length-1;i>=0;i--){ if(L[i].px>.05){ stop=i+1; break; } if(i===0) stop=0; }
    let fw=0, bk=0, maxFw=0; for(const l of L){ fw=((l.x-x0)*d[0]+(l.z-z0)*d[1])/dl; maxFw=Math.max(maxFw,fw); bk=Math.max(bk,maxFw-fw); }
    // a pause mid-settle: any frame standing still before the last move
    let pause=0, seen=false; for(let i=0;i<stop;i++){ if(L[i].px<=.05&&seen) pause++; if(L[i].px>.05) seen=true; }
    rel[name]={stop:r2(stop*F), slide:r2(maxFw/sp), pullback:r2(bk/sp), off:r2(Math.hypot(p.fx-p.tile.wx,p.fz-p.tile.wz)/sp), pauseFrames:pause, pushW, pushSlow}; }
  m.release=rel;
  // hard reverse: right at speed, then left: time until moving left at half speed
  place(back(0,2)); rec(24,()=>thumb(0)); const rv=rec(40,()=>thumb(Math.PI)); m.reverse=r2((rv.findIndex(l=>l.sx<-.5*topPx)+1)*F);
  // 90 degree turn: up at speed, then right: time until the screen path is within 10 degrees of right
  place(nearT(cx-2*sp,cz+1.5*sp)); rec(20,()=>thumb(-90*deg)); const tu=rec(40,()=>thumb(0)); m.turn90=r2((tu.findIndex(l=>l.px>.3*topPx&&Math.abs(Math.atan2(l.sy,l.sx))<10*deg)+1)*F);
  // steady pushes in 16 directions from the middle: speed ripple and stalls (not counting walls), and drift
  let ripple=0, stalls=0, drift=0, wallLoss=0, nW=0;
  for(let a=0;a<16;a++){ const ang=a/16*2*Math.PI; place(back(ang,2)); const L=rec(40,()=>thumb(ang)).slice(10); const free=L.filter(l=>!l.w);
    if(free.length>8){ const s=free.map(l=>l.px).sort((x,y)=>x-y), med=s[s.length>>1]||1; ripple=Math.max(ripple,(s[s.length-1]-s[0])/med); stalls+=free.filter(l=>l.px<.5*med).length;
      for(const l of free){ if(l.px>.3*med) drift=Math.max(drift,Math.abs((Math.atan2(l.sy,l.sx)-ang+5*Math.PI)%(2*Math.PI)-Math.PI)); } }
    // against the edge: how much of the push along it is kept
    const W=L.filter(l=>l.w); if(W.length>4){ nW++; const along=W.map(l=>l.px).reduce((s,x)=>s+x,0)/W.length; wallLoss+=Math.max(0,1-along/(topPx*Math.max(.3,Math.abs(Math.cos(ang-Math.round(ang/(Math.PI/2))*Math.PI/2)))*1)); } }
  m.steady={ripple:r2(ripple), stallFrames:stalls, driftDeg:Math.round(Math.abs(drift)/deg)};
  // along the board's edge: start near a corner, push 30 degrees off the edge into it; frames crawling (under 40% of
  // top speed) while walled, before reaching the far corner
  let edgeStuck=0; const xs=P_TILES.map(t=>t.wx), zs=P_TILES.map(t=>t.wz), X0=Math.min(...xs), X1=Math.max(...xs), Z0=Math.min(...zs), Z1=Math.max(...zs);
  const near=(x,z)=>P_TILES.slice().sort((a,b)=>Math.hypot(a.wx-x,a.wz-z)-Math.hypot(b.wx-x,b.wz-z))[0];
  // each wall of your half, both ways along it: start against it, push 30 degrees into it (45 in the hold-out)
  const inc=(hold?45:30)*deg, eb=[];
  for(const [wall,nx,nz] of [['x+',1,0],['x-',-1,0],['z+',0,1],['z-',0,-1]]) for(const sg of [1,-1]){
    const tx=nz*sg, tz=nx*sg;   // along the wall
    const W=nx>0?X1:nx<0?X0:nz>0?Z1:Z0, A0=tx?(tx>0?X0:X1):(tz>0?Z0:Z1), A1=tx?(tx>0?X1:X0):(tz>0?Z1:Z0);
    const st=near(nx?W:A0+(A1-A0)*.15, nz?W:A0+(A1-A0)*.15); place(st);
    const dx=tx*Math.cos(inc)+nx*Math.sin(inc), dz=tz*Math.cos(inc)+nz*Math.sin(inc);
    const q0=proj(st.wx,0,st.wz), q1=proj(st.wx+dx*.5,0,st.wz+dz*.5), ang=Math.atan2(q1[1]-q0[1],q1[0]-q0[0])-H;
    const L=rec(60,()=>thumb(ang)); let n=0;
    for(const l of L.slice(10)){ const al=tx?l.x:l.z; if(Math.abs(al-A1)<.7*sp) break; if(l.px<.4*topPx) n++; }
    eb.push([wall+(sg>0?'>':'<'),n]); edgeStuck+=n; }
  m.edgeCases=eb;
  m.edgeStuckFrames=edgeStuck;
  // flicks: a short push then let go; where you end up and how long until still
  const fl={}; for(const ms of [80,150,250]){ place(back(0,1.5)); const n=Math.round(ms/1000/F); rec(n,()=>thumb(0)); letGo(); const L=rec(90); const t=back(0,1.5); let st=0; for(let i=L.length-1;i>=0;i--) if(L[i].px>.05){ st=i+1; break; }
    fl[ms]={tiles:r2(Math.hypot(p.fx-t.wx,p.fz-t.wz)/sp), settle:r2(st*F)}; }
  m.flick=fl;
  // swipe straight through the middle of the stick (right to left in 3 frames): any stop
  place(back(0,1.5)); rec(20,()=>thumb(0)); const sw=rec(20,i=>{ if(i===0) dragging.x=200+.5*R(); else if(i===1){ dragging.x=200+.05*R(); dragging.y=500; } else thumb(Math.PI); }); m.swipeStopFrames=Math.max(0,sw.slice(0,14).filter(l=>l.px<.05).length-1);
  // slow push (40%): speed matches the stick
  place(back(0,2)); const sl=rec(40,()=>thumb(0,.4*(MV('mvStickFull')))); m.slowShare=r2(Math.max(...sl.slice(15,30).map(l=>l.px))/topPx);
  // dodge: from standing, push up (or down); time until your hit tile changes
  const dg=[]; for(const ang of [-90*deg,90*deg]){ place(back(ang,1)); const t0=p.tile; let n=0; while(p.tile===t0&&n<60){ thumb(ang); tick(); n++; } dg.push(n*F); letGo(); }
  m.dodge=r2(Math.max(...dg));
  // stop accuracy: a player who has learned the slide lets go that far short of the tile they want, give or take
  // up to 4 frames (67 ms) of thumb timing; how often you end on that tile
  let hits=0, tries=0; const rs={0:rel.right, [-Math.PI/2]:rel.up};
  for(const ang of [0,-Math.PI/2]) for(const n of [1,2]) for(const j of (hold?[-5,-3,-1,1,3,5]:[-4,-2,0,2,4])){
    const st=back(ang,1.5); place(st); const [sx,sy]=proj(st.wx,0,st.wz), [wx,wz]=unprojGround(sx+Math.cos(ang+H)*60,sy+Math.sin(ang+H)*60,st.wx,st.wz), l=Math.hypot(wx-st.wx,wz-st.wz)||1, ux=(wx-st.wx)/l, uz=(wz-st.wz)/l;
    const tg=nearT(st.wx+ux*n*sp,st.wz+uz*n*sp), lead=Math.max(0,rs[ang].slide*sp), goal=(tg.wx-st.wx)*ux+(tg.wz-st.wz)*uz-lead;
    let k=0; while(k<90&&((p.fx-st.wx)*ux+(p.fz-st.wz)*uz)<goal){ thumb(ang); tick(); k++; }
    if(j>0) for(let i=0;i<j;i++){ thumb(ang); tick(); }
    letGo(); if(j<0){ /* let go early: rewind is impossible, so start again and stop j frames sooner */ place(st); for(let i=0;i<Math.max(1,k+j);i++){ thumb(ang); tick(); } letGo(); }
    rec(60); tries++; if(p.tile===tg) hits++; }
  m.accuracy=r2(hits/tries);
  // score
  const lin=(x,good,bad)=>Math.max(0,Math.min(1,(bad-x)/(bad-good)));
  const R0=Object.values(m.release);
  const parts={
   start:lin(m.start.t90,.06,.3)*7,
   stop:lin(Math.max(...R0.map(r=>r.stop)),.12,.6)*7,
   slide:lin(Math.max(...R0.map(r=>Math.max(0,Math.abs(r.slide-.25)-.1))),0,.8)*6,
   pullback:lin(Math.max(...R0.map(r=>r.pullback)),.02,.35)*12,
   settlePause:lin(R0.reduce((s,r)=>s+r.pauseFrames,0),0,10)*4,
   reverse:lin(m.reverse,.08,.4)*7,
   turn:lin(m.turn90,.06,.35)*6,
   ripple:lin(m.steady.ripple,.08,.8)*4,
   stalls:lin(m.steady.stallFrames,0,40)*6,
   edge:lin(m.edgeStuckFrames,0,60)*5,
   flick:(fl[80].tiles<.75?3:0)+(Math.abs(fl[150].tiles-1)<.3?1.5:0)+lin(Math.max(fl[80].settle,fl[150].settle),.15,.6)*1.5,
   swipe:m.swipeStopFrames?0:2,
   land:R0.filter(r=>r.off<=.1).length/R0.length*4,
   dodge:lin(m.dodge,.1,.35)*9,
   accuracy:lin(m.accuracy,1,.4)*15};
  m.parts=Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,r2(v)]));
  m.score=Math.round(Object.values(parts).reduce((s,x)=>s+x,0));
  return m; },{square,over,hold});
}
out.score=Math.round((out.hex.score+out.square.score)/2); if(ix<0) continue; all.push(out);
if(brief) console.log(JSON.stringify({score:out.score,hex:out.hex.score,square:out.square.score,set:over}));
else console.log(JSON.stringify(out,null,1)); }
if(errs.length) console.log('errs',errs);
await br.close()})();
