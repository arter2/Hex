/* Hexmancers — puzzles (round 4 of the dungeon plan).
   Puzzle rooms (one per floor at most, as before; solving one opens a rich chest at its heart):
     path      Pressure path: cross a field of carved stones, stepping only in the colour order shown
               on the tablet by the start plate. A wrong stone bites and sends you back.
     memory    Memory tiles: step on the start plate and the safe path glows for a few seconds, then
               goes dark. Walk it from memory to the far plate.
     bells     Echo bells: strike the gong and listen; ring the bells back in the same order.
     ice       Sliding ice: on the ice you slide until something stops you. Reach the pedestal.
     scales    Weight scales: put exactly three stones on the scale to make the weight it asks for.
     shift     Shifting stones: step on a channel stone to turn it; join the light from inlet to outlet.
     riddle    Guardian riddle: a statue asks a question. Two wrong answers and it falls silent.
     braziers  Braziers: take fire from the lit brazier and light the three cold ones in other rooms
               before the flame you carry dies (30 s; any lit brazier gives you a fresh flame).
   Floor features (yours):
     circuit   Switch circuit (a special room): coloured switches all over the floor, pulled in the
               order of the mural on the sealed door, open a vault. A wrong one resets them all.
     ghosttable The ghost's table (a special room): bring back the 3 element relics of the floor (one
               lies about, one is in the secret closet, one is carried by a foe); a rare ghost rises,
               and the 3 elements you returned decide which of 20 artifacts it leaves.
     cursed    Cursed idol (never shown on the path map): pick up the glittering idol and you are
               cursed: a hex fills one of your card slots in every fight on this floor and the stairs
               down stay sealed, until you cleanse it at an altar far away. */

/* ---------------- small helpers ---------------- */
function pzTone(f,dur){ if(typeof sfxOn==='function'&&!sfxOn()) return; try{ const A=XSFX.ctx||(XSFX.ctx=new (window.AudioContext||window.webkitAudioContext)()); if(A.state==='suspended') A.resume();
  const t=A.currentTime, o=A.createOscillator(), g=A.createGain(); o.type='triangle'; o.frequency.value=f; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.22,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+(dur||.6));
  o.connect(g); g.connect(A.destination); o.start(t); o.stop(t+(dur||.6)+.05); }catch(e){} }
const pzCells=pz=>pz._cells||(pz._cells=new Set(pz.tiles.map(t=>t.cell).concat([pz.start.cell,pz.end.cell])));
const SYM=[{k:'sun',c:0xf2c94c,css:'#f2c94c',i:'☀'},{k:'frost',c:0x7fe3ff,css:'#7fe3ff',i:'❄'},{k:'moon',c:0xb48cff,css:'#b48cff',i:'☾'}];
function pzGrid(r){ const x0=r.x+1,x1=r.x+r.w-2,y0=r.y+1,y1=r.y+r.h-2; if(x1-x0+1<4||y1-y0+1<3) return null; return {x0,x1,y0,y1}; }
function pzWalk(G){ let y=xri(G.y0,G.y1); const sy=y, cells=[];
  for(let x=G.x0;x<=G.x1;x++){ cells.push(xi(x,y)); if(x<G.x1&&XR()<.6){ const ty=xri(G.y0,G.y1); while(y!==ty){ y+=Math.sign(ty-y); cells.push(xi(x,y)); } } }
  return {cells,sy,ey:y}; }
// the field of stones for the pressure path and memory tiles
function pzField(r,mem){ const G=pzGrid(r); if(!G) return null; const W=pzWalk(G), safe=new Set(W.cells), start=xi(r.x,W.sy), end=xi(r.x+r.w-1,W.ey);
  const grid=[]; for(let y=G.y0;y<=G.y1;y++) for(let x=G.x0;x<=G.x1;x++) grid.push(xi(x,y));
  if(grid.concat([start,end]).some(c=>EX.taken.has(c))) return null;
  const order=mem?null:(EX.depth>=6?[0,1,2]:[0,1]).sort(()=>XR()-.5), tiles=[];
  for(const c of grid){ const i=W.cells.indexOf(c); tiles.push(xProp('ptile',c,{solid:false, safe:safe.has(c), sym:mem?-1:i>=0?order[i%order.length]:xri(0,2)})); }
  const sp=xProp('pplate',start,{solid:false, role:'start'}), ep=xProp('pplate',end,{solid:false, role:'end'});
  if(!mem){ const t=[start+XN,start-XN].find(c=>c>=0&&EX.room[c]===r.id&&!EX.taken.has(c)&&xSolidOK(c)); if(t==null) return null; xProp('tablet',t,{text:'Carved by the plate: step only in this order, again and again: '+order.map(k=>SYM[k].i).join(' → ')+'. Every other stone bites.'}); }
  return {tiles, start:sp, end:ep, run:false, showT:0, mem:!!mem, order}; }

/* ---------------- the puzzle builders ---------------- */
Object.assign(PUZZLE_BUILD,{
  path(r){ return pzField(r,false); },
  memory(r){ return pzField(r,true); },
  bells(r){ const n=EX.depth>=6?5:4, bells=[];
    for(let k=0;k<4;k++){ const c=xFreeSolid(r,true); if(c<0) return null; bells.push(xProp('bell',c,{idx:k})); }
    const g=xFreeSolid(r,false); if(g<0) return null; xProp('gong',g,{});
    return {bells, seq:Array.from({length:n},()=>xri(0,3)), step:0, heard:false}; },
  ice(r){ const x0=r.x+1,x1=r.x+r.w-2,y0=r.y+1,y1=r.y+r.h-2; if(x1-x0+1<5||y1-y0+1<3) return null;
    const ice=[]; for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) ice.push(xi(x,y)); if(ice.some(c=>EX.taken.has(c))) return null;
    const inner=ice.filter(c=>xcx(c)>x0&&xcx(c)<x1&&xcy(c)>y0&&xcy(c)<y1);
    for(let t=0;t<400;t++){ const goal=xpick(inner), rocks=new Set();
      // block each straight line into the pedestal, so it can't be reached in one slide; then a stray boulder or two
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){ const line=[]; for(let k=1;;k++){ const x=xcx(goal)+dx*k, y=xcy(goal)+dy*k, c=xi(x,y); if(x<x0||x>x1||y<y0||y>y1) break; line.push(c); } if(line.length&&XR()<.85) rocks.add(xpick(line)); }
      for(let k=xri(1,2);k>0;k--){ const c=xpick(ice); if(c!==goal) rocks.add(c); }
      const iceSet=new Set(ice), steps=pzIceSolve(r,iceSet,rocks,goal); if(steps==null||steps<2) continue;
      xProp('icefloor',xi(r.cx,r.cy),{solid:false, room:r.id, x0,x1,y0,y1});
      for(const c of rocks) xProp('iceboulder',c,{}); const gp=xProp('icegoal',goal,{});
      for(const c of ice) if(!rocks.has(c)&&c!==goal) EX.taken.add(c);
      return {ice:[...iceSet], goal:gp, rocks:[...rocks]}; }
    return null; },
  scales(r){ const vals=[1,2,3,4,5,6,7,8,9].sort(()=>XR()-.5).slice(0,5), pick3=vals.slice().sort(()=>XR()-.5).slice(0,3), target=pick3.reduce((a,b)=>a+b,0), stones=[];
    for(const v of vals){ const c=xFreeSolid(r,true); if(c<0) return null; stones.push(xProp('weight',c,{v, on:false})); }
    const s=xFreeSolid(r,true); if(s<0) return null; const sc=xProp('scale',s,{});
    const t=xFreeSolid(r,false); if(t<0) return null; xProp('tablet',t,{text:'Chiselled under the scale: “Three stones, and the scale weighs '+target+'.”'});
    return {stones, target, scale:sc}; },
  shift(r){ const ix0=r.x+1, iy0=r.y+1, iw=r.w-2, ih=r.h-2; if(iw<5||ih<3) return null;
    const gx=ix0+((iw-3)>>1)+0, gy=iy0+((ih-3)>>1); if(gx-1<r.x||gx+3>r.x+r.w-1) return null;
    const cells=[]; for(let y=0;y<3;y++) for(let x=0;x<3;x++) cells.push(xi(gx+x,gy+y));
    let y=xri(0,2); const y0=y, path=[]; for(let x=0;x<3;x++){ path.push([x,y]); if(x<2&&XR()<.6){ const ty=xri(0,2); while(y!==ty){ y+=Math.sign(ty-y); path.push([x,y]); } } }
    const inlet=xi(gx-1,gy+y0), outlet=xi(gx+3,gy+y); if(cells.concat([inlet,outlet]).some(c=>EX.taken.has(c))) return null;
    const dirTo=(a,b)=>b[0]>a[0]?1:b[0]<a[0]?3:b[1]>a[1]?2:0, tiles=[];
    for(let k=0;k<9;k++){ const x=k%3, yy=(k/3)|0, pi=path.findIndex(([px,py])=>px===x&&py===yy); let type, sol=null;
      if(pi>=0){ const inD=pi===0?3:(dirTo(path[pi],path[pi-1])), outD=pi===path.length-1?1:dirTo(path[pi],path[pi+1]); type=(inD+2)%4===outD?'line':'bend'; sol=[inD,outD]; }
      else type=XR()<.5?'line':'bend';
      const t=xProp('pipe',cells[k],{solid:false, type, rot:xri(0,3), gx:x, gy:yy, need:sol}); tiles.push(t); }
    // scramble: no path stone starts in a position that already fits
    for(const t of tiles) if(t.need){ let g=0; while(pzFits(t)&&g++<8) t.rot=(t.rot+1)%4; }
    xProp('pipeend',inlet,{solid:false, out:false}); xProp('pipeend',outlet,{solid:false, out:true});
    return {tiles, y0, y1:y}; },
  riddle(r){ const c=xi(r.cx,r.cy); if(!xSolidOK(c)) return null; xProp('guardian',c,{}); return {wrong:0}; },
  braziers(r){ const c=xFreeSolid(r,true); if(c<0) return null; const src=xProp('pbrazier',c,{lit:true, src:true});
    const reach=xReach(), d=xbfs(EX.t,EX.doors,c,false), rooms=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r&&d[xi(x.cx,x.cy)]>=0&&d[xi(x.cx,x.cy)]<=48).sort((a,b)=>d[xi(a.cx,a.cy)]-d[xi(b.cx,b.cy)]).slice(0,6).sort(()=>XR()-.5).slice(0,3);
    if(rooms.length<3) return null; const cold=[];
    for(const rr of rooms){ const s=xFreeSolid(rr,true); if(s<0) return null; cold.push(xProp('pbrazier',s,{lit:false})); }
    return {src, cold}; },
});
// the ice: fewest slides from the room's dry rim to a stop beside the pedestal, or null
function pzIceSolve(r,ice,rocks,goal){ const inRoom=c=>c>=0&&EX.room[c]===r.id, free=c=>inRoom(c)&&!rocks.has(c)&&c!==goal&&!EX.taken.has(c)||ice.has(c)&&!rocks.has(c)&&c!==goal;
  const D=[[0,-1],[1,0],[0,1],[-1,0]], step=(c,[dx,dy])=>{ const x=xcx(c)+dx, y=xcy(c)+dy; return x<0||y<0||x>=XN||y>=XN?-1:xi(x,y); };
  const rim=xRoomCells(r).filter(c=>!ice.has(c)&&!EX.taken.has(c)), seen=new Map(), q=[];
  for(const c of rim){ seen.set(c,0); q.push(c); }
  for(let h=0;h<q.length;h++){ const c=q[h], n0=seen.get(c);
    for(const dv of D){ let cur=c, n=step(cur,dv); if(n<0||!free(n)&&n!==goal) continue; if(n===goal){ if(ice.has(c)) return n0; continue; }
      if(!ice.has(n)) continue;   // walking along the rim costs nothing; the rim cells are already seeds
      cur=n; for(;;){ const nx=step(cur,dv); if(nx===goal) return n0+1; if(nx<0||!free(nx)) break; cur=nx; if(!ice.has(cur)) break; }
      if(!seen.has(cur)){ seen.set(cur,n0+1); q.push(cur); } } }
  return null; }
const pzDirs=t=>(t.type==='line'?[1,3]:[0,1]).map(d=>(d+t.rot)%4);
const pzFits=t=>{ const ds=pzDirs(t); return t.need.every(d=>ds.includes(d)); };
function pzPipesJoined(pz){ const at=(x,y)=>pz.tiles.find(t=>t.gx===x&&t.gy===y); let x=0, y=pz.y0, from=3;
  for(let k=0;k<12;k++){ const t=at(x,y); if(!t) return false; const ds=pzDirs(t); if(!ds.includes(from)) return false; const out=ds.find(d=>d!==from);
    if(out===1&&x===2) return y===pz.y1; const nx=x+(out===1?1:out===3?-1:0), ny=y+(out===2?1:out===0?-1:0); if(nx<0||nx>2||ny<0||ny>2) return false; x=nx; y=ny; from=(out+2)%4; }
  return false; }

/* ---------------- touching puzzle things ---------------- */
const BELL_F=[392,494,587,698], BELL_C=[0xff7a5a,0xf2c94c,0x7fe3ff,0xb48cff];
function pzRing(b){ pzTone(BELL_F[b.idx],.7); b.flashT=.5; }
function xPuzzInteract(p){ const pz=EX.puzzle, d=EX.depth;
  switch(p.kind){
    case 'gong': { if(!pz||pz.solved) return xSay('gong','The gong hums softly. The bells are quiet now.'), true; if(pz.playing) return true; pz.playing=true; pz.step=0; pzTone(196,1.2); xLog('The gong booms. Listen…','dim');
      pz.seq.forEach((k,i)=>setTimeout(()=>{ if(!EX||EX.puzzle!==pz) return; pzRing(pz.bells[k]); if(i===pz.seq.length-1){ pz.playing=false; pz.heard=true; xLog('Now ring the bells back in the same order.','dim'); } },900+i*750)); return true; }
    case 'bell': { if(!pz||pz.kind!=='bells') return true; pzRing(p); if(pz.solved||!pz.heard||pz.playing) return true;
      if(pz.seq[pz.step]===p.idx){ pz.step++; if(pz.step>=pz.seq.length){ pz.solved=false; setTimeout(()=>xPuzzleSolved(),500); } }
      else { pz.step=0; pz.heard=false; pzTone(110,.8); xMakeNoise(8); xLog('A sour clang echoes down the halls. Strike the gong to hear it again.','bad'); } return true; }
    case 'icegoal': { if(pz&&!pz.solved) xPuzzleSolved(); return true; }
    case 'iceboulder': return xSay('boulder','A boulder frozen fast into the ice.'), true;
    case 'weight': { if(!pz||pz.solved) return true; p.on=!p.on; xSfx('grind'); const on=pz.stones.filter(s=>s.on), sum=on.reduce((a,s)=>a+s.v,0);
      xLog((p.on?'You set the '+p.v+'-stone on the scale.':'You lift the '+p.v+'-stone off.')+' It weighs '+sum+(on.length?' with '+on.length+' stone'+(on.length>1?'s':''):'')+'.','dim');
      if(on.length===3&&sum===pz.target) xPuzzleSolved(); return true; }
    case 'scale': { if(!pz) return true; const on=pz.stones.filter(s=>s.on); return xSay('scale','The scale reads '+on.reduce((a,s)=>a+s.v,0)+'. It wants '+pz.target+', with three stones.'), true; }
    case 'guardian': return pzRiddle(p), true;
    case 'pbrazier': { const P=EX.puzzle&&EX.puzzle.kind==='braziers'?EX.puzzle:null; if(!P) return true;
      if(p.lit){ EX.flameT=30; xSfx('click'); xLog('You take a flame from the brazier. It will last 30 seconds.','good'); return true; }
      if(!(EX.flameT>0)) return xSay('brazier','A cold brazier. It needs a flame from a lit one.'), true;
      p.lit=true; if(p.flame) p.flame.visible=true; { const ri=EX.room[p.cell]; if(ri>=0&&!EX.rooms[ri].dark){ EX.rooms[ri].lit=true; xUpdateVis(); } } xSfx('chime'); const left=P.cold.filter(b=>!b.lit).length; xLog(left?'The brazier catches. '+left+' still cold.':'The last brazier roars to life!','good');
      if(!left&&!P.solved) xPuzzleSolved(); return true; }
    case 'cswitch': return pzCircuitPull(p), true;
    case 'ghosttable': return pzTable(p), true;
    case 'cleanse': return pzCleanse(p), true;
    case 'ptile': case 'pplate': case 'pipe': case 'pipeend': case 'icefloor': return true;
  }
  return false; }
// stepping on things
function xPuzzEnter(p){ const pz=EX.puzzle;
  if(p.kind==='pplate'&&pz&&(pz.kind==='path'||pz.kind==='memory')){ if(pz.solved) return true;
    if(p.role==='start'){ pz.run=true; pz.idx=0; if(pz.mem){ pz.showT=3.2; xLog('The stones flare: a path, glowing. Remember it…','dim'); pzTone(523,.4); } else xLog('You step onto the plate. Follow the carved order: '+pz.order.map(k=>SYM[k].i).join(' → ')+'.','dim'); }
    else if(pz.run){ xPuzzleSolved(); pz.run=false; }
    else xLog('Start from the other plate.','dim'); return true; }
  if(p.kind==='ptile'&&pz&&(pz.kind==='path'||pz.kind==='memory')){ if(pz.solved) return true;
    if(p.safe&&pz.run) return true;
    if(!p.safe&&(pz.run||!pz.mem)){ pz.run=false; p.badT=.6; if(pz.mem){ pzTone(130,.5); xLog('The stone goes cold and dead under you. Start again from the plate.','bad'); xHurt(Math.round(2+EX.depth*.3),'a dead stone'); }
      else { xLog('The stone bites! Spikes jab up through the cracks.','bad'); xHurt(Math.round(6+EX.depth*.6),'a biting stone'); } }
    return true; }
  if(p.kind==='pipe'&&pz&&pz.kind==='shift'&&!pz.solved){ p.rot=(p.rot+1)%4; xSfx('grind'); if(pzPipesJoined(pz)){ pz.lit=true; setTimeout(()=>xPuzzleSolved(),400); } return true; }
  return false; }
// every frame
function xPuzzTick(dt){ const pz=EX.puzzle;
  if(EX.flameT>0){ EX.flameT-=dt; if(EX.flameT<=0){ EX.flameT=0; xLog('The flame you carried gutters out.','warn'); xHud(); } }
  if(pz&&(pz.kind==='path'||pz.kind==='memory')){ if(pz.showT>0) pz.showT-=dt;
    if(pz.run&&!pzCells(pz).has(EX.pc)){ pz.run=false; xLog('You stepped off the stones. Start again from the plate.','dim'); } }
  // sliding on ice
  if(pz&&pz.kind==='ice'){ const ice=pz._ice||(pz._ice=new Set(pz.ice));
    if(!EX.slide&&ice.has(EX.pc)&&EX.lastPc!=null&&EX.lastPc!==EX.pc){ const dx=Math.sign(xcx(EX.pc)-xcx(EX.lastPc)), dy=Math.sign(xcy(EX.pc)-xcy(EX.lastPc)); if(dx||dy) EX.slide={dx:dy&&Math.abs(xcy(EX.pc)-xcy(EX.lastPc))>=Math.abs(xcx(EX.pc)-xcx(EX.lastPc))?0:dx, dy:dx&&Math.abs(xcx(EX.pc)-xcx(EX.lastPc))>Math.abs(xcy(EX.pc)-xcy(EX.lastPc))?0:dy, t:0}; }
    if(EX.slide){ const s=EX.slide; EX.path=[]; EX.goal=null; s.t-=dt;
      if(s.t<=0){ s.t=.07; const n=xi(xcx(EX.pc)+s.dx,xcy(EX.pc)+s.dy), d=EX.doors.get(n);
        if(n===pz.goal.cell){ EX.slide=null; if(!pz.solved) xPuzzleSolved(); }
        else if(EX.t[n]===T_ROCK||xSolid(n)||(d&&d.state!=='open')||EX.room[n]!==pz.room){ EX.slide=null; xSfx('click'); }
        else { EX.pc=n; EX.px=xw(n); EX.pz=xz(n); xUpdateVis(); if(!ice.has(n)) EX.slide=null; } } } }
  EX.lastPc=EX.pc;
  if(EX.cursed&&!EX.cursed.done) EX.cursedT=(EX.cursedT||0)+dt; }
// while sliding you have no say in where you go
const xPuzzBusy=()=>!!(EX&&EX.slide);

/* ---------------- the guardian's riddles ---------------- */
function pzQuestion(){ const read=LORE.filter(l=>dState().lore[l.id]);
  if(read.length>=2&&XR()<.5){ const L=xpick(read), words=L.text.split(' '), i=Math.max(0,Math.floor(words.length/2)-4), frag=words.slice(i,i+8).join(' ');
    const wrong=LORE.filter(x=>x!==L).sort(()=>XR()-.5).slice(0,2).map(x=>x.title); return {q:'“Which tale tells of this: …'+frag+'…?”', a:L.title, opts:[L.title,...wrong].sort(()=>XR()-.5)}; }
  const c=xpick(SIX), kind=XR()<.5;
  if(kind){ const a=BEATS[c], opts=[a,...SIX.filter(x=>x!==a&&x!==c).sort(()=>XR()-.5).slice(0,2)].sort(()=>XR()-.5); return {q:'“'+COLORS[c].name+' overcomes which colour?”', a:COLORS[a].name, opts:opts.map(x=>COLORS[x].name)}; }
  const a=WEAK_TO[c], opts=[a,...SIX.filter(x=>x!==a&&x!==c).sort(()=>XR()-.5).slice(0,2)].sort(()=>XR()-.5); return {q:'“Which colour overcomes '+COLORS[c].name+'?”', a:COLORS[a].name, opts:opts.map(x=>COLORS[x].name)}; }
function pzRiddle(p){ const pz=EX.puzzle; if(!pz||pz.kind!=='riddle') return;
  if(pz.solved) return xSay('guardian','The guardian bows its stone head. It has nothing more to ask.');
  if(pz.wrong>=2) return xSay('guardian','The guardian is silent. It will not speak to you again.');
  const Q=pz.q||(pz.q=pzQuestion());
  xDlg({title:'The guardian', sub:'Guardian riddle', icon:['hero','#cfc6b8'], text:'Its eyes grind open. '+Q.q+(pz.wrong?' (It will allow one more mistake… no, none.)':' Answer wrongly twice and it falls silent.'),
    buttons:Q.opts.map(o=>[o,()=>{ pz.q=null; if(o===Q.a){ xLog('“'+o+'.” The guardian nods, and the floor at its feet slides open.','good'); xPuzzleSolved(); }
      else { pz.wrong++; xHurt(Math.round(5+EX.depth*.5),'the guardian’s anger'); xLog(pz.wrong>=2?'“Wrong.” Its eyes go dark. It will not speak again.':'“Wrong.” A jolt of stone-fire. It asks again…','bad'); if(pz.wrong<2) setTimeout(()=>pzRiddle(p),300); } }])}); }

/* ---------------- your three: the switch circuit ---------------- */
Object.assign(RARE_ROOMS,{
  circuit:   {name:'Switch circuit', icon:'🔌', min:PUZZLE_MIN_DEPTH, w:3, h:3, safe:false},
  ghosttable:{name:'The ghost’s table', icon:'🕯', min:PUZZLE_MIN_DEPTH, w:4, h:3, safe:true},
});
LOCKS.circuit={name:'sealed vault', key:'boss', pick:0};
function xFillPuzzRoom(r){ const d=EX.depth;
  if(r.rare==='circuit'){ const doors=[...EX.doors].filter(([i,dd])=>xAdj4(i).some(c=>EX.room[c]===r.id)&&dd.state!=='secret'); if(!doors.length){ r.rare=null; return true; }
    const keep=doors.map(([i,dd])=>[dd,dd.state,dd.lock]); doors.forEach(([i,dd])=>{ dd.state='locked'; dd.lock='circuit'; });
    const reach=xbfs(EX.t,EX.doors,EX.up,false), lost=EX.rooms.some(x=>x!==r&&!x.side&&!x.nook&&!x.behind&&reach[xi(x.cx,x.cy)]<0);
    if(lost||reach[EX.down]<0){ keep.forEach(([dd,st,lk])=>{ dd.state=st; dd.lock=lk; }); r.rare=null; r.role=null; return true; }
    const n=d>=7?5:4, rooms=xOpenRooms(reach,{notStart:false}).filter(x=>x!==r).sort(()=>XR()-.5), cols=SIX.slice().sort(()=>XR()-.5).slice(0,n), sw=[];
    for(const rr of rooms){ if(sw.length>=n) break; const s=xWallSpot(rr,nn=>EX.doors.has(nn)); if(!s) continue; sw.push(xWallProp('cswitch',s[0],s[1],{col:cols[sw.length], on:false, room:r.id})); }
    if(sw.length<3){ keep.forEach(([dd,st,lk])=>{ dd.state=st; dd.lock=lk; }); for(const p of sw){ EX.wallAt.delete(p.cell); EX.props.splice(EX.props.indexOf(p),1); } r.rare=null; r.role=null; return true; }
    r.circuit={order:sw.map(s=>s.col).sort(()=>XR()-.5), step:0, done:false};
    const c=xFreeCell(r,true); if(c>=0) xChest(c,{rich:true,legend:XR()<.3}); const g=xFreeCell(r); if(g>=0) xItem('gold',g,{n:Math.round(80+25*d)}); const ge=xFreeCell(r); if(ge>=0) xItem('gear',ge,{gear:rollLoot(d+2,XR,true)});
    return true; }
  if(r.rare==='ghosttable'){ const c=xFreeSolid(r,true); if(c<0) return true; const els=SIX.slice().sort(()=>XR()-.5).slice(0,3);
    const t=xProp('ghosttable',c,{need:els, placed:[]}); EX.relics=EX.relics||[];
    const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r).sort((a,b)=>Math.hypot(b.cx-r.cx,b.cy-r.cy)-Math.hypot(a.cx-r.cx,a.cy-r.cy));
    // one lies about, one is in the secret closet, one is carried by a foe
    const fr=rooms[0], fc=fr?xFreeCell(fr):-1; if(fc>=0) xItem('relic',fc,{el:els[0]});
    const cl=EX.rooms.find(x=>x.closet), cc=cl?xRoomCells(cl).find(x=>!EX.taken.has(x)&&!nearDoor(x)):null;
    if(cc!=null) xItem('relic',cc,{el:els[1]}); else { const r2=rooms[1]||fr, c2=r2?xFreeCell(r2):-1; if(c2>=0) xItem('relic',c2,{el:els[1]}); }
    const foes=EX.groups.filter(g=>!g.boss&&!g.mini&&!g.relic); if(foes.length) xpick(foes).relic=els[2]; else { const r3=rooms[2]||fr, c3=r3?xFreeCell(r3):-1; if(c3>=0) xItem('relic',c3,{el:els[2]}); }
    return true; }
  return false; }
// walking into the sealed vault's door: the mural shows the order
function xCircuitDoor(c,d){ const r=EX.rooms.find(x=>x.circuit&&xAdj4(c).some(n=>EX.room[n]===x.id)); if(!r) return;
  const C=r.circuit; xDlgText('A sealed vault door','A mural of coloured runes runs across the stone: '+C.order.map(k=>WHEEL_ICON[k]+' '+COLORS[k].name).join(' → ')+'. Somewhere on this floor, switches of those colours wait in the walls. Pull them in this order.'+(C.step?' ('+C.step+' of '+C.order.length+' pulled.)':'')); }
function pzCircuitPull(p){ const r=EX.rooms[p.room], C=r&&r.circuit; if(!C||C.done) return xSay('cswitch','The switch is locked in place.'); if(p.on) return xSay('cswitch','That switch is already down.');
  if(C.order[C.step]===p.col){ p.on=true; C.step++; if(p.handle) p.handle.rotation.x=1.2; xSfx('click'); pzTone(330+60*C.step,.4);
    if(C.step>=C.order.length){ C.done=true; for(const [i,dd] of EX.doors) if(dd.lock==='circuit'&&xAdj4(i).some(n=>EX.room[n]===r.id)) xUnlock(i,dd,'Far off, a great lock turns. The sealed vault is open.'); xXp(30+3*EX.depth,'circuit closed'); }
    else xLog('The '+COLORS[p.col].name+' switch drops with a clunk. '+(C.order.length-C.step)+' to go.','good'); }
  else { C.step=0; for(const q of EX.props) if(q.kind==='cswitch'&&q.room===p.room){ q.on=false; if(q.handle) q.handle.rotation.x=0; } pzTone(110,.9); xMakeNoise(12); xLog('Wrong switch! Every switch on the floor snaps back with a clang that echoes everywhere.','bad'); } }

/* ---------------- your three: the ghost's table ---------------- */
const ART_NOUN=['Crown','Circlet','Sigil','Lantern','Talisman','Locket','Seal','Band','Idol','Reliquary','Torc','Brooch','Charm','Amulet','Diadem','Orb','Signet','Coronet','Phylactery','Mirror'];
const ART_WORD={fire:'Ember', frost:'Rime', storm:'Storm', verdant:'Thorn', light:'Dawn', shadow:'Dusk'};
const ARTIFACTS={}; (function(){ let n=0; const S=['fire','frost','storm','verdant','light','shadow'];
  for(let a=0;a<6;a++) for(let b=a+1;b<6;b++) for(let c=b+1;c<6;c++){ const els=[S[a],S[b],S[c]], id='artifact_'+els.join('_');
    GEAR[id]={slot:'ring', tier:4, artifact:true, name:ART_NOUN[n++]+' of '+els.map(e=>ART_WORD[e]).join(', ').replace(/, ([^,]*)$/,' and $1'), icon:'✶',
      mods:{power:Object.fromEntries(els.map(e=>[e,1.12])), hp:8}, text:'An artifact of the ghost’s table: +12% card damage in '+els.map(e=>COLORS[e]?COLORS[e].name:e).join(', ')+', +8 max HP'};
    ARTIFACTS[els.join('_')]=id; } })();
ENEMY_DEFS.tableghost={name:'The Hungry Ghost', color:'shadow', hp:520, dmg:20, rate:[2.6,3.4], moves:['blink','shot','hex'], ai:'wander', mini:true, look:'wisp', tint:'#cfe6ff', scale:1.5,
  info:'It rose from the table to claim what you brought. Beat it and the artifact is yours.'};
function pzTable(p){ const need=p.need, carry=EX.relics||[];
  if(p.done) return xSay('table','The table is bare. The ghost is gone.');
  const put=need.filter(e=>carry.includes(e)&&!p.placed.includes(e)); if(put.length){ p.placed.push(...put); EX.relics=carry.filter(e=>!put.includes(e)); xSfx('chime'); }
  const left=need.filter(e=>!p.placed.includes(e));
  if(!left.length){ p.done=true; return xDlg({title:'The table is set', sub:'The ghost’s table', icon:['skull','#cfe6ff'], text:'You lay the last relic down. The candles gutter blue, and something pale and starving rises from the table, reaching for what you brought.',
    buttons:[['Face it',()=>{ const g=xGroup(['tableghost'],EX.pc,'wander'); g.tableFor=p; g.x=EX.px; g.z=EX.pz; g.seen=true; EX.groups.push(g); xEngage(g,null); }]]}); }
  xDlgText('A table set for a ghost','Three places, each with an empty dish marked with a rune: '+need.map(e=>(p.placed.includes(e)?'✓ ':'')+WHEEL_ICON[e]+' '+COLORS[e].name).join(', ')+'. '+(put.length?'You set down what you carry. ':'')+'Still missing: '+left.map(e=>COLORS[e].name).join(', ')+'. One lies somewhere on this floor, one is hidden behind a secret, and one is carried by a creature.'); }
function xPuzzAfterFight(g){ if(!g) return;
  if(g.relic){ EX.relics=EX.relics||[]; EX.relics.push(g.relic); xLog('It was carrying a '+COLORS[g.relic].name+' relic. You take it.','loot'); xSfx('chime'); }
  if(g.tableFor){ const els=g.tableFor.need.slice().sort((a,b)=>SIX.indexOf(a)-SIX.indexOf(b)), id=ARTIFACTS[['fire','frost','storm','verdant','light','shadow'].filter(e=>els.includes(e)).join('_')];
    if(id){ const s=gearState(save); s.items[id]=(s.items[id]||0)+1; persist(); xLog('The ghost fades with a sigh, and leaves an artifact on the table: '+GEAR[id].name+'. Put it on from your Character screen.','loot'); tip(GEAR[id].name+'!',4000); xXp(40+4*EX.depth,'ghost laid to rest'); } } }

/* ---------------- your three: the cursed idol ---------------- */
function xPuzzPlan(depth,F,boss){ if(depth>=PUZZLE_MIN_DEPTH&&!boss&&XR()<.18) F.cursedIdol=1; }
function xPuzzPopulate(){ const F=EX.plan?EX.plan.feats:{}; if(!F.cursedIdol||EX.branch) return;
  const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true}); if(rooms.length<2) return; const r=xpick(rooms), c=xFreeCell(r); if(c<0) return;
  xItem('idol',c,{}); const far=rooms.filter(x=>x!==r).sort((a,b)=>Math.hypot(b.cx-r.cx,b.cy-r.cy)-Math.hypot(a.cx-r.cx,a.cy-r.cy))[0], a=far?xFreeSolid(far,true):-1; if(a>=0) xProp('cleanse',a,{}); }
const CURSES_CARD={thorns:{name:'Hex of Thorns', text:'CURSED. When cast it pierces you instead: you lose HP. It can’t be moved.'},
  lead:{name:'Leaden Hex', text:'CURSED. When cast you are rooted and slowed. It can’t be moved.'},
  hollow:{name:'Hollow Hex', text:'CURSED. When cast your shield breaks and every enemy heals 5%. It can’t be moved.'}};
function xPuzzPickup(it){
  if(it.kind==='relic'){ EX.relics=EX.relics||[]; EX.relics.push(it.el); xSfx('chime'); xLog('A '+COLORS[it.el].name+' relic, cold to the touch. It belongs on a table somewhere on this floor.','loot'); return true; }
  if(it.kind==='idol'){ const k=xpick(Object.keys(CURSES_CARD)); EX.cursed={k}; xSfx('thud'); if(typeof xFlashView==='function') xFlashView(500);
    xLog('A glittering idol… and a chill climbs your arm. You are cursed! A '+CURSES_CARD[k].name+' will fill one of your card slots in every fight here, and the stairs down are sealed against you. Find the cleansing altar.','bad'); tip('Cursed! Find the cleansing altar',5000); return true; }
  return false; }
function pzCleanse(p){ if(!EX.cursed||EX.cursed.done) return xSay('cleanse','A basin of clear water on an old altar. It is very still.');
  EX.cursed.done=true; const g=Math.round(80+20*EX.depth); save.gold+=g; EX.hp=Math.min(xmaxHp(),EX.hp+Math.round(xmaxHp()*.2)); persist(); xSfx('chime');
  xLog('You plunge the idol into the basin. The curse washes away, and the idol is only gold now: '+g+' gold. The stairs down are open to you.','good'); tip('Curse lifted!'); xHud(); }
const xCurseBlocks=()=>{ if(EX&&EX.cursed&&!EX.cursed.done){ xSay('curse','The curse holds you: the stairs down will not let you pass. Cleanse it at the altar first.'); return true; } return false; };
// in a dungeon fight while cursed: the hex sits in your first card slot, every turn
function curseSlot(b){ const C=typeof EX!=='undefined'&&EX&&EX.fighting&&EX.cursed&&!EX.cursed.done?CURSES_CARD[EX.cursed.k]:null; if(!C) return;
  const base=CARD_LIST.find(c=>c.type==='strike'&&c.rarity==='common'&&c.color==='shadow')||CARD_LIST[0];
  const card=Object.assign({},base,{id:'curse_'+EX.cursed.k, name:C.name, code:typeof WILD_RUNE!=='undefined'?WILD_RUNE:'✱', curseFx:EX.cursed.k, curseText:C.text, rarity:'common', pow:0});
  b.piles.queue.unshift({uid:b.piles.uid++, card, temp:true, cursed:true}); }
function curseCast(c,p){ const d=B.depth; floater(c.name+'!',p.tile,'#b48cff',true); burst(p.tile,'#7a2a8f',18,1);
  if(c.curseFx==='thorns') payHp(Math.round(6+d*.8));
  if(c.curseFx==='lead'){ p.rootT=Math.max(p.rootT||0,1.4); p.castCd=Math.max(p.castCd,1.1); }
  if(c.curseFx==='hollow'){ p.barrier=0; for(const e of alive()) e.hp=Math.min(e.maxHp,e.hp+Math.round(e.maxHp*.05)); } }

/* ---------------- the status strip ---------------- */
function xPuzzHud(out){ if(EX.flameT>0) out.push('<span class="xs good">🔥 '+Math.ceil(EX.flameT)+'s</span>');
  if(EX.cursed&&!EX.cursed.done) out.push('<span class="xs bad" title="Cleanse it at the altar">☠ '+CURSES_CARD[EX.cursed.k].name+'</span>');
  if(EX.relics&&EX.relics.length) out.push('<span class="xs" title="Relics for the ghost’s table">🕯 '+EX.relics.map(e=>WHEEL_ICON[e]).join('')+'</span>');
  for(const r of EX.rooms) if(r.circuit&&!r.circuit.done&&r.circuit.step) out.push('<span class="xs">🔌 '+r.circuit.step+'/'+r.circuit.order.length+'</span>'); }

/* ---------------- items ---------------- */
const REL_COL={fire:0xff6a3d, frost:0x7fe3ff, storm:0xffe24d, verdant:0x6fdc7a, light:0xfff0b3, shadow:0x9b4dff};
function xPuzzItemMesh(it){
  if(it.kind==='relic'){ const m=new THREE.Group(); m.add(xCyl(.12,.08,xMat(0x6a5a3a),0,-.12,0), xBall(.15,xGlowMat(REL_COL[it.el]||0xffffff),0,.06,0)); return m; }
  if(it.kind==='idol'){ const m=new THREE.Group(), gold=xMat(0xf2c94c,{emissive:0x604010,shininess:60}); m.add(xBox(.2,.32,.16,gold,0,0,0), xBall(.11,gold,0,.24,0), xBall(.04,xGlowMat(0xb48cff),-.04,.26,.1), xBall(.04,xGlowMat(0xb48cff),.04,.26,.1)); return m; }
  return null; }

/* ---------------- how they look ---------------- */
function xPuzzMesh(p,g){ const stone=xMat(0x6e6a64), dark=xMat(0x2a2a30), iron=xMat(0x3a3a40,{shininess:40});
  switch(p.kind){
    case 'ptile': { g.add(xBox(XCS*.92,.06,XCS*.92,xMat(0x4e4a46),0,.03,0)); if(p.sym>=0){ const s=xBox(.5,.02,.5,xGlowMat(SYM[p.sym].c,{transparent:true,opacity:.8}),0,.07,0); s.rotation.y=Math.PI/4; g.add(s); }
      p.glow=xBox(XCS*.8,.02,XCS*.8,xGlowMat(0x9dffc0,{transparent:true,opacity:0}),0,.08,0); g.add(p.glow); return true; }
    case 'pplate': { g.add(xCyl(.6,.08,stone,0,.04,0), xCyl(.42,.04,xGlowMat(p.role==='start'?0x7dffa8:0xf2c94c),0,.09,0)); return true; }
    case 'bell': { const col=BELL_C[p.idx]; g.add(xBox(.12,1.3,.12,dark,-.45,.65,0), xBox(.12,1.3,.12,dark,.45,.65,0), xBox(1.0,.1,.12,dark,0,1.3,0));
      const b=new THREE.Mesh(new THREE.ConeGeometry(.32,.5,10,1,true),xMat(col,{emissive:new THREE.Color(col).multiplyScalar(.15),side:THREE.DoubleSide})); b.position.y=.95; g.add(b); p.bellMat=b.material; p.col3=new THREE.Color(col); return true; }
    case 'gong': { g.add(xBox(.12,1.6,.12,dark,-.6,.8,0), xBox(.12,1.6,.12,dark,.6,.8,0), xBox(1.4,.12,.12,dark,0,1.6,0)); const d=xCyl(.5,.06,xMat(0xc0a050,{shininess:50}),0,1,0); d.rotation.x=Math.PI/2; g.add(d); return true; }
    case 'icefloor': { const W=(p.x1-p.x0+1)*XCS, H=(p.y1-p.y0+1)*XCS, ox=((p.x0+p.x1+1)/2)*XCS-xw(p.cell), oz=((p.y0+p.y1+1)/2)*XCS-xz(p.cell);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({color:0xcff4ff,transparent:true,opacity:.42,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(ox,.05,oz); g.add(m); return true; }
    case 'iceboulder': { const b=new THREE.Mesh(new THREE.DodecahedronGeometry(.62,0),xMat(0x9fb8c8,{shininess:30})); b.position.y=.5; g.add(b); return true; }
    case 'icegoal': { g.add(xBox(.5,.9,.5,stone,0,.45,0)); p.orb=xBall(.22,xGlowMat(0x8fe4ff),0,1.2,0); g.add(p.orb); return true; }
    case 'weight': { const h=.15+p.v*.05; p.stone=new THREE.Group(); p.stone.add(xBox(.42,h,.42,xMat(0x8a8478),0,h/2,0)); g.add(xBox(.6,.4,.6,stone,0,.2,0)); p.stone.position.y=.4; g.add(p.stone);
      p.mark=xBox(.2,.02,.2,xGlowMat(0xf2c94c),0,.41+h,0); g.add(p.mark); return true; }
    case 'scale': { g.add(xBox(.3,1.2,.3,iron,0,.6,0), xBox(1.4,.08,.08,iron,0,1.2,0), xCyl(.3,.05,xMat(0xc0a050),-.65,1.0,0), xCyl(.3,.05,xMat(0xc0a050),.65,1.0,0)); return true; }
    case 'pipe': { g.add(xBox(XCS*.9,.12,XCS*.9,xMat(0x5a5650),0,.06,0)); const ch=new THREE.Group(), m=xGlowMat(0x7fe3ff); p.chMat=m;
      if(p.type==='line') ch.add(xBox(XCS*.9,.05,.26,m,0,.14,0)); else { ch.add(xBox(XCS*.45,.05,.26,m,XCS*.22,.14,0)); ch.add(xBox(.26,.05,XCS*.45,m,0,.14,-XCS*.22)); }
      g.add(ch); p.ch=ch; return true; }
    case 'pipeend': { g.add(xCyl(.35,.3,iron,0,.15,0), xBall(.18,xGlowMat(p.out?0xf2c94c:0x7fe3ff),0,.4,0)); return true; }
    case 'guardian': { g.add(xBox(.9,.4,.9,stone,0,.2,0), xBox(.6,1.4,.45,stone,0,1.1,0), xBall(.3,stone,0,2.0,0)); p.eyes=new THREE.Group(); p.eyes.add(xBall(.05,xGlowMat(0x8fe4ff),-.1,2.05,.27), xBall(.05,xGlowMat(0x8fe4ff),.1,2.05,.27)); g.add(p.eyes); return true; }
    case 'pbrazier': { g.add(xCyl(.12,.8,iron,0,.4,0), xCyl(.35,.18,iron,0,.85,0)); p.flame=xCone(.24,.6,xGlowMat(0xff9a3a,{transparent:true,opacity:.9}),0,1.25,0); p.flame.visible=!!p.lit; g.add(p.flame); return true; }
    case 'cswitch': { const col=new THREE.Color(COLORS[p.col]?COLORS[p.col].c:'#fff'); g.add(xBox(.5,.7,.12,dark,0,1.1,.04), xBox(.3,.3,.02,xGlowMat(col),0,1.25,.11));
      const h=new THREE.Group(); h.position.set(0,.95,.12); h.add(xBox(.07,.4,.07,xMat(0x8f99a3),0,.2,0), xBall(.08,xGlowMat(col),0,.42,0)); g.add(h); p.handle=h; if(p.on) h.rotation.x=1.2; return true; }
    case 'ghosttable': { const wood=xMat(0x4a3020); g.add(xBox(1.6,.12,.9,wood,0,.75,0)); for(const [x,z] of [[-.7,-.35],[.7,-.35],[-.7,.35],[.7,.35]]) g.add(xBox(.1,.75,.1,wood,x,.37,z));
      p.dish=[]; p.need.forEach((e,i)=>{ const d=xCyl(.18,.04,xMat(0xc0c0c0),(i-1)*.5,.84,0); g.add(d); const o=xBall(.12,xGlowMat(REL_COL[e]),(i-1)*.5,.96,0); o.visible=p.placed.includes(e); g.add(o); p.dish.push(o); });
      g.add(xCyl(.04,.3,xMat(0xf0e2bc),0,.97,.3), xBall(.05,xGlowMat(0x9fd0ff),0,1.15,.3)); return true; }
    case 'cleanse': { g.add(xBox(1.1,.7,.7,stone,0,.35,0), xCyl(.4,.12,xMat(0x8a8478),0,.76,0)); const w=xCyl(.34,.02,xGlowMat(0x9fdcff,{transparent:true,opacity:.75}),0,.83,0); g.add(w); return true; }
  }
  return false; }
function xPuzzAnim(T,dt){ if(!EX) return; const pz=EX.puzzle;
  for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
    if(p.kind==='ptile'&&p.glow){ const show=pz&&pz.mem&&pz.showT>0&&p.safe; p.badT=Math.max(0,(p.badT||0)-(dt||.016)); p.glow.material.opacity=p.badT>0?.6:show?.55+.2*Math.sin(T*8):0; p.glow.material.color.setHex(p.badT>0?0xff5d6c:0x9dffc0); }
    if(p.kind==='bell'&&p.bellMat){ p.flashT=Math.max(0,(p.flashT||0)-(dt||.016)); p.bellMat.emissive.copy(p.col3).multiplyScalar(.15+(p.flashT>0?1.2*p.flashT:0)); }
    if(p.kind==='pipe'&&p.ch){ const want=-p.rot*Math.PI/2; p.ch.rotation.y+=(want-p.ch.rotation.y)*.25; if(pz&&pz.lit) p.chMat.color.setHex(0xf2c94c); }
    if(p.kind==='weight'&&p.stone){ const y=p.on?.75:.4; p.stone.position.y+=(y-p.stone.position.y)*.2; if(p.mark) p.mark.position.y=p.stone.position.y+.02+.15+p.v*.05; }
    if(p.kind==='icegoal'&&p.orb) p.orb.position.y=1.2+Math.sin(T*2)*.06;
    if(p.kind==='pbrazier'&&p.flame){ p.flame.visible=!!p.lit; p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); }
    if(p.kind==='ghosttable'&&p.dish) p.need.forEach((e,i)=>{ p.dish[i].visible=p.placed.includes(e); });
    if(p.kind==='guardian'&&p.eyes){ const pzr=EX.puzzle; p.eyes.visible=!(pzr&&pzr.kind==='riddle'&&(pzr.wrong>=2||pzr.solved)); } } }
