// node tools/tap-turn-test.js — v123: one tap on a statue or a puzzle mirror turns it exactly once (it used to spin a statue 8-9 times, and a mirror opened the Mirror room's dialog)
// tap a statue / mirror the way a player does (path-to-tap onto its cell) and count how many times it turns
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await br.newPage({viewport:{width:400,height:800}}); await pg.goto('file://'+require('path').resolve(__dirname,'../game/index.html')+''); await pg.waitForTimeout(800);
 const r=await pg.evaluate(()=>{ let VT=0; window.setTimeout=()=>0; window.requestAnimationFrame=()=>0; performance.now=()=>VT*1000;
   let gs=99; Math.random=()=>{ gs=(gs+0x6D2B79F5)>>>0; let t=gs; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; XR=Math.random;
   const fp=xFloorPlan; xFloorPlan=function(d,o){ const pl=fp.apply(this,arguments); pl.feats.puzzle=1; return pl; };
   const res={}; for(const want of ['statues','mirrors']){ const turns=[];
     for(let n=0;n<12&&turns.length<8;n++){ const all=Object.assign({},PUZZLE_BUILD); for(const k in PUZZLE_BUILD) if(k!==want) delete PUZZLE_BUILD[k];
       save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); save.deepest=6; XRUN=null; try{ enterExplore(6); } finally { Object.assign(PUZZLE_BUILD,all); }
       const pz=EX.puzzle; if(!pz||pz.kind!==want) continue; EX.groups=[]; for(const t of EX.traps) t.armed=false; for(let c=0;c<XN*XN;c++) EX.seen[c]=1;
       const p=(pz.statues||pz.mirrors)[0]; const st=xAdj4(p.cell).find(c=>xPassable(c)&&!xSolid(c)); EX.pc=st; EX.px=xw(st); EX.pz=xz(st); EX.needInput=false; EX.stairLock=null;
       const key=()=>pz.kind==='statues'?p.face:p.o; let k0=key(), flips=0;
       // the tap: path-to-tap onto the thing's cell, like xGoalAt
       const path=xPathToCell(p.cell); EX.goal={cell:p.cell,x:xw(p.cell),z:xz(p.cell)}; EX.path=path||[];
       for(let t=0;t<3;t+=1/60){ VT+=1/60; xMove(1/60); const k=key(); if(k!==k0){ flips++; k0=k; } }
       turns.push(flips); stopExplore(); EX=null; }
     res[want]=turns; }
   return res; });
 console.log(JSON.stringify(r)); await br.close(); })();
