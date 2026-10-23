// node tools/playtest/soak.js [minutes=20] [out.json] — a long session in real time, drawn every frame (dev tool)
// It walks the dungeon, goes down floor after floor, fights now and then, and goes back to camp every area, while it
// samples the JS heap, the GPU objects of both renderers, the page's size, frame times and long tasks. A leak shows as
// growth from the first third of the session to the last; a hitch as frames over 50 ms. The machine here draws with a
// software GPU, so absolute frame times are slow: compare builds, and watch the trend, not the number.
const {chromium}=require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs'), path=require('path');
const MIN=+(process.argv[2]||20), OUT=process.argv[3];
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info','--js-flags=--expose-gc']});
  const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../../game/index.html')); await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{ localStorage.clear(); save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); save.deepest=1; save.gold=5000; persist();
    // frame clock and long tasks
    window.SOAK={frames:[], long:0, longMs:0}; let last=performance.now(); const tick=t=>{ SOAK.frames.push(t-last); last=t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    try{ new PerformanceObserver(l=>{ for(const e of l.getEntries()){ SOAK.long++; SOAK.longMs+=e.duration; } }).observe({entryTypes:['longtask']}); }catch(e){}
    window.soakSample=(phase)=>{ const f=SOAK.frames.splice(0).sort((a,b)=>a-b), q=p=>f.length?+f[Math.min(f.length-1,Math.floor(f.length*p))].toFixed(1):null;
      if(window.gc) gc(); const mem=performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null;
      const gl=r=>r?{geo:r.info.memory.geometries, tex:r.info.memory.textures, prog:(r.info.programs||[]).length}:null;
      const s={phase, frames:f.length, p50:q(.5), p95:q(.95), p99:q(.99), over50:f.filter(x=>x>50).length, long:SOAK.long, longMs:Math.round(SOAK.longMs), heapMB:mem,
        dungeon:gl(typeof X3!=='undefined'&&X3&&X3.renderer), battle:gl(typeof AR!=='undefined'&&AR&&AR.renderer), dom:document.getElementsByTagName('*').length, depth:typeof EX!=='undefined'&&EX?EX.depth:null};
      SOAK.long=0; SOAK.longMs=0; return s; };
    // walking: a held key, changed every 1.5 s
    window.soakWalk=()=>{ for(const k in XKEY) XKEY[k]=false; const d=['up','down','left','right'][Math.floor(Math.random()*4)], k=keysFor(d)[0]; if(k) XKEY[k]=true; };
    window.soakDown=()=>{ if(!EX) return; for(const k in XKEY) XKEY[k]=false; if(EX.dlg) xDlgClose(); const nd=EX.depth+1; save.deepest=Math.max(save.deepest,nd); EX.busy=true; xKeep(); xGoFloor(nd,EX.hp,'up',null); EX.active=true; EX.busy=false; xHud(); xLoopStart(); };
    window.soakFight=()=>{ if(!EX) return; for(const k in XKEY) XKEY[k]=false; EX.active=false; fight(EX.depth,null,{hp:xmaxHp(),explore:true}); closeCustomScreen(); };
    window.soakEndFight=()=>{ if(!B||B.phase!=='fight') return; B.waves=B.waves.slice(0,Math.floor(B.wave)+1); for(const e of B.enemies) if(e.hp>0) hitEnemy(e,99999,null,{raw:true}); };
    window.soakClose=()=>{ const rv=[...document.querySelectorAll('#rvBtns .btn')]; if(rv.length&&$('#reveal').classList.contains('on')){ (rv.find(x=>!x.classList.contains('ghost'))||rv[0]).click(); return 'reveal'; }
      if($('#packOpen').classList.contains('on')){ const all=$('#poAll'); if(all&&!all.hidden) all.click(); const d=$('#poDone'); if(d&&!d.hidden) d.click(); return 'pack'; }
      if(typeof EX!=='undefined'&&EX&&EX.dlg){ xDlgClose(); return 'dialog'; } if($('#lvlUp')&&$('#lvlUp').classList.contains('on')){ closeLevelUp(true); return 'level'; } return null; };
    openCamp(); enterExplore(1); });
  console.log('start:',JSON.stringify(await pg.evaluate(()=>({ex:!!EX, depth:EX&&EX.depth, tip:$('#tip').textContent, screens:[...document.querySelectorAll('.screen.on,.overlay.on')].map(e=>e.id)}))));
  const samples=[]; const T0=Date.now(); let floor=0, cycle=0;
  const wait=async ms=>{ const t=Date.now(); while(Date.now()-t<ms){ await pg.evaluate(()=>soakClose()); await pg.waitForTimeout(250); } };
  while(Date.now()-T0<MIN*60000){ cycle++;
    // the dungeon: walk 20 s, then down a floor
    await pg.evaluate(()=>soakSample('skip')); for(let i=0;i<13;i++){ await pg.evaluate(()=>{ if(EX&&EX.active) soakWalk(); }); await wait(1500); }
    samples.push(Object.assign({t:Math.round((Date.now()-T0)/1000), cycle}, await pg.evaluate(()=>soakSample('dungeon'))));
    // a fight every other floor: 12 s of it drawn, then won
    if(cycle%2===0){ await pg.evaluate(()=>soakFight()); await pg.evaluate(()=>soakSample('skip'));
      for(let i=0;i<12;i++){ await pg.evaluate(()=>{ if(B&&B.phase==='fight'){ const p=B.player; if(p.wandCd<=0) fireWand(false); } }); await pg.waitForTimeout(1000); }
      samples.push(Object.assign({t:Math.round((Date.now()-T0)/1000), cycle}, await pg.evaluate(()=>soakSample('battle'))));
      await pg.evaluate(()=>soakEndFight()); await wait(4000); }
    floor++; if(floor%4===0){ await pg.evaluate(()=>{ stopExplore(); EX=null; openCamp(); enterExplore(Math.min(save.deepest,30)); }); await wait(1500); }
    else await pg.evaluate(()=>soakDown()); await wait(1200);
    const s=samples[samples.length-1]; console.log(`${s.t}s cycle ${cycle} depth ${s.depth} ${s.phase} heap ${s.heapMB}MB dungeon ${JSON.stringify(s.dungeon)} battle ${JSON.stringify(s.battle)} dom ${s.dom} p95 ${s.p95}ms over50 ${s.over50}/${s.frames} long ${s.long}`); }
  // first third against last third, per phase
  const trend={}; for(const ph of ['dungeon','battle']){ const a=samples.filter(s=>s.phase===ph); if(a.length<3) continue; const n=Math.max(1,Math.floor(a.length/3)), A=a.slice(0,n), Z=a.slice(-n), avg=(x,f)=>+(x.reduce((s,y)=>s+(f(y)||0),0)/x.length).toFixed(1);
    trend[ph]={samples:a.length, heapMB:[avg(A,s=>s.heapMB),avg(Z,s=>s.heapMB)], geometries:[avg(A,s=>(s[ph]||{}).geo),avg(Z,s=>(s[ph]||{}).geo)], textures:[avg(A,s=>(s[ph]||{}).tex),avg(Z,s=>(s[ph]||{}).tex)], programs:[avg(A,s=>(s[ph]||{}).prog),avg(Z,s=>(s[ph]||{}).prog)], dom:[avg(A,s=>s.dom),avg(Z,s=>s.dom)], p95:[avg(A,s=>s.p95),avg(Z,s=>s.p95)], over50PerMin:[avg(A,s=>s.over50/Math.max(1,s.frames/60*1)),avg(Z,s=>s.over50/Math.max(1,s.frames/60*1))]}; }
  const res={minutes:MIN, cycles:cycle, samples, trend, errors:errs.slice(0,10)}; if(OUT) fs.writeFileSync(OUT,JSON.stringify(res,null,1));
  console.log('trend (first third → last third):',JSON.stringify(trend,null,1)); console.log('errors',errs.slice(0,5)); await br.close(); })();
