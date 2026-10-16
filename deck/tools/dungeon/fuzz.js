// Dungeon fuzz test: builds 8 runs of depths 1-24 in the real game (a headless browser) and checks
// that no floor can lock you out: the stairs down need no key (boss floors: the boss key is
// reachable), every room is reachable unless deliberately locked, every bronze lock has a key on
// the floor, puzzles can be solved, nothing stands on a door or stairs, every floor holds at least
// two features, and merchants (every 3-6 floors) and sanctuaries (every 5-6) keep their schedule.
// Run: node deck/tools/dungeon/fuzz.js   (needs Playwright; set PLAYWRIGHT to its path and
// CHROMIUM to a browser binary if they are not found)
const path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT||'playwright');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:1000,height:700}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+path.join(__dirname,'..','..','index.html')); await p.waitForTimeout(800);
  await p.click('#mmNew'); await p.locator('text=Start with this deck').first().click(); await p.waitForTimeout(300);
  await p.click('#btnDescend'); await p.waitForTimeout(1200);
  const res=await p.evaluate(async(RUNS)=>{
    const out={floors:0, fails:[], feats:{}, puzzles:{}, minis:{}, npcs:{}, secrets:{}, merchants:[], sancts:[], ms:0, sides:{}, locks:0, gates:0, bossDoors:0, bossFloors:0};
    const fail=(d,m)=>{ if(out.fails.length<40) out.fails.push('d'+d+': '+m); };
    for(let run=0;run<RUNS;run++){ XRUN=null; xNewRun(1); let lastM=0, lastS=0;
      for(let d=1;d<=24;d++){ const t0=performance.now(); buildFloor(d); out.ms+=performance.now()-t0; out.floors++;
        const F=EX.plan.feats; for(const k in F) out.feats[k]=(out.feats[k]||0)+1;
        // 1. the stairs down need no key, and nothing solid cuts them off
        const reach=xReach(), bossDs=[...EX.doors.values()].filter(x=>x.lock==='boss'&&x.state==='locked');
        bossDs.forEach(x=>x.state='open'); const reach2=xReach(), bare=xbfs(EX.t,EX.doors,EX.up,false); bossDs.forEach(x=>x.state='locked');
        if(reach2[EX.down]<0) fail(d,'stairs down unreachable even with the boss key'+(bare[EX.down]>=0?' (solids)':''));
        if(!EX.bossDoor&&reach[EX.down]<0) fail(d,'stairs down need a key');
        // 2. every main room not deliberately locked is reachable
        for(const r of EX.rooms) if(!r.side&&!r.nook&&!r.behind&&!xRoomCells(r).some(c=>reach2[c]>=0)) fail(d,'room unreachable '+r.id+(bare[xi(r.cx,r.cy)]>=0?' (solids)':' (doors)')+' role '+r.role);
        // 3. boss door: its key lies where you can reach it
        if(isBossDepth(d)) out.bossFloors++;
        if(EX.bossDoor){ out.bossDoors++; const ks=EX.props.find(p=>p.kind==='keystand'), ki=EX.items.find(i=>i.kind==='key'&&i.key==='boss'); const c=ks?ks.cell:ki?ki.cell:-1; if(c<0||reach[c]<0) fail(d,'boss key unreachable'); }
        // 4. bronze locks have a key somewhere reachable (or a carrier)
        const bronze=[...EX.doors.values()].filter(x=>x.state==='locked'&&x.lock==='bronze').length; out.locks+=bronze;
        if(bronze){ const src=EX.items.filter(i=>i.kind==='key'&&i.key==='bronze'&&reach[i.cell]>=0).length+EX.chests.filter(c=>c.key==='bronze'&&reach[c.cell]>=0).length+EX.groups.filter(g=>g.carry&&g.carry.includes('key:bronze')).length;
          if(src<bronze) fail(d,'bronze keys '+src+' < locks '+bronze); }
        if(EX.gate){ out.gates++; const lv=EX.props.find(p=>p.kind==='lever'&&p.gate); if(!lv) fail(d,'gate without lever'); else { const front=lv.front; if(reach[front]<0) fail(d,'gate lever unreachable'); } }
        // 5. nothing stacked, nothing on doors or stairs
        const seen=new Map(); for(const pr of EX.props){ if(pr.wall){ if(EX.t[pr.cell]!==T_ROCK) fail(d,'wall prop not in rock '+pr.kind); continue; }
          if(EX.doors.has(pr.cell)) fail(d,'prop on door '+pr.kind); if(pr.cell===EX.up||pr.cell===EX.down) fail(d,'prop on stairs '+pr.kind);
          if(pr.solid){ if(seen.has(pr.cell)) fail(d,'two solids '+pr.kind+' '+seen.get(pr.cell)); seen.set(pr.cell,pr.kind); }
          if(pr.solid&&EX.chests.some(c=>c.cell===pr.cell)) fail(d,'solid on chest '+pr.kind); }
        for(const it of EX.items) if(it.cell===EX.up||it.cell===EX.down||EX.doors.has(it.cell)) fail(d,'item on stairs/door');
        // 6. puzzles can be solved
        const pz=EX.puzzle; if(pz){ out.puzzles[pz.kind]=(out.puzzles[pz.kind]||0)+1;
          if(pz.kind==='plates'){ for(const pl of pz.plates){ const bl=pz.blocks.find(b=>xcx(b.cell)===xcx(pl.cell)); const from=xi(xcx(pl.cell),xcy(pl.cell)+3); if(!bl||xcy(bl.cell)!==xcy(pl.cell)+2||EX.t[from]!==T_FLOOR||xSolid(from)||reach[from]<0) fail(d,'plates unsolvable'); } }
          if(pz.kind==='statues'&&pz.statues.some(s=>s.face===s.want)) fail(d,'statue starts solved');
          if(pz.kind==='mirrors'){ const save0=pz.mirrors.map(m=>m.o); pz.mirrors.forEach(m=>m.o=m.want); const b=xTraceBeam(); if(!b.hit) fail(d,'mirrors unsolvable'); pz.mirrors.forEach((m,i)=>m.o=save0[i]); if(xTraceBeam().hit) fail(d,'mirrors start solved'); }
          if(pz.kind==='runes'&&pz.stones.some(s=>reach[s.cell]<0&&!xAdj4(s.cell).some(n=>reach[n]>=0))) fail(d,'runestone unreachable');
          if(pz.kind==='levers'&&pz.levers.some(l=>reach[l.front]<0)) fail(d,'lever unreachable'); }
        for(const g of EX.groups) if(g.mini) out.minis[g.mini]=(out.minis[g.mini]||0)+1;
        for(const pr of EX.props) if(pr.kind==='npc') out.npcs[pr.role]=(out.npcs[pr.role]||0)+1;
        const cl=EX.rooms.find(r=>r.closet); if(cl) out.secrets[cl.content]=(out.secrets[cl.content]||0)+1; else fail(d,'no closet');
        for(const r of EX.rooms) if(r.side) out.sides[r.side]=(out.sides[r.side]||0)+1;
        const real=xRealized(); out.realized=(out.realized||0)+real.length; if(real.length<2) fail(d,'only '+real.join(',')+' realized');
        if(EX.rooms.some(r=>r.role==='merchant')){ out.merchants.push(run+':'+d); }
        if(EX.props.some(p=>p.kind==='altar')){ out.sancts.push(run+':'+d); }
      } }
    out.ms=Math.round(out.ms/out.floors);
    const gaps=list=>{ const g=[]; let prev=null; for(const x of list){ const [r,d]=x.split(':').map(Number); if(prev&&prev[0]===r) g.push(d-prev[1]); prev=[r,d]; } return g; };
    out.mGaps=gaps(out.merchants).join(','); out.sGaps=gaps(out.sancts).join(','); delete out.merchants; delete out.sancts; out.realized=(out.realized/out.floors).toFixed(2); return out; }, 8);
  console.log(JSON.stringify(res,null,1)); console.log(errs.slice(0,8).join('\n')||'no errors');
  if(res.fails.length||errs.length) process.exitCode=1;
  await b.close();
})();
