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
               before the flame you carry dies (45 s; any lit brazier gives you a fresh flame).
     lanterns  Lanterns: step on a floor lantern and it and its neighbours flip. Light them all. Walk into the violet
               rune stone in the room to put them back as they were.
     sentries  Sentries: cross the hall from the green plate to the gold one while stone heads open and close their
               eyes; step into a gaze and you are back at the start. An eye flickers before it opens.
     herding   Herding: a wisp flees from you. Drive it onto the rune plate in a corner of the field.
     echo      Echo: walk into the echo stone and a ghost walks your steps a few seconds behind you. Hold both
               plates at once, one with you and one with your echo.
     bridge    Hidden bridge: a drop with a pedestal out in it. The way across only shows in the dark: put out the
               room's lamps (walk into them) and step along the planks that glow.
     mural     Sliding mural: walk into the mural on the wall and slide its eight panels back into the picture (a
               piece of painted card art).
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
/* Where a grid puzzle lies: a rectangle of the room's own floor, with a rim of the room's floor all round it to walk on
   and to set the plates in, nothing standing in it yet and no doorway beside it. Found in the room itself, not its box:
   a spacious floor's room is shaped (its box holds wall, diagonal pieces, a low wall), and the grid puzzles used to
   take the box's inside whole, so they never fitted there. In an old floor's plain room the box's inside is such a
   rectangle, so it is found as before. len x wid cells, len along x (or, with turn, along y if that fits better):
   the biggest that fits up to the caps, nearest the room's middle. Returns {x0,y0,x1,y1,ax, at(u,v)} (u along, v across). */
function pzRect(r,len,wid,turn){ const [minL,maxL]=len, [minW,maxW]=wid;
  const ok=c=>EX.room[c]===r.id&&EX.t[c]===T_FLOOR, free=c=>ok(c)&&!EX.taken.has(c)&&!nearDoor(c);
  const sizes=[]; for(let L=maxL;L>=minL;L--) for(let W=maxW;W>=minW;W--) for(const ax of turn?[0,1]:[0]) sizes.push({L,W,ax});
  sizes.sort((a,b)=>b.L*b.W-a.L*a.W);
  let area=0, best=null, bd=1e9;
  for(const s of sizes){ if(best&&s.L*s.W<area) break; const w=s.ax?s.W:s.L, h=s.ax?s.L:s.W;
    for(let y=Math.max(1,r.y);y+h<=Math.min(XN-1,r.y+r.h);y++) for(let x=Math.max(1,r.x);x+w<=Math.min(XN-1,r.x+r.w);x++){
      let good=true; for(let yy=y-1;yy<=y+h&&good;yy++) for(let xx=x-1;xx<=x+w&&good;xx++){ const c=xi(xx,yy); if(xx>=x&&xx<x+w&&yy>=y&&yy<y+h?!free(c):!ok(c)) good=false; }
      if(!good) continue; const d=Math.hypot(x+w/2-(r.x+r.w/2),y+h/2-(r.y+r.h/2))+XR()*.5;
      if(!best||d<bd){ best={x0:x,y0:y,x1:x+w-1,y1:y+h-1,ax:s.ax,L:s.L,W:s.W}; bd=d; area=s.L*s.W; } } }
  if(!best) return null; const B=best; B.at=(u,v)=>B.ax?xi(B.x0+v,B.y0+u):xi(B.x0+u,B.y0+v); return B; }
// a way across the rectangle from (0,sv) to (L-1,ev): one step along at a time, wandering across now and then
function pzWalk(R,sv,ev){ let v=sv; const cells=[];
  for(let u=0;u<R.L;u++){ cells.push(R.at(u,v)); const tv=u===R.L-1?ev:u<R.L-1&&XR()<.6?xri(0,R.W-1):v; while(v!==tv){ v+=Math.sign(tv-v); cells.push(R.at(u,v)); } }
  return cells; }
// the field of stones for the pressure path and memory tiles: the plates stand in the rim at either end
function pzField(r,mem){ const R=pzRect(r,[4,9],[3,6],true); if(!R) return null;
  const plate=(u,v)=>{ const c=R.at(u,v); return EX.taken.has(c)?-1:c; }, ends=u=>{ const vs=[]; for(let v=0;v<R.W;v++) if(plate(u,v)>=0) vs.push(v); return vs; };
  const sv0=ends(-1), ev0=ends(R.L); if(!sv0.length||!ev0.length) return null;
  const order=mem?null:(EX.depth>=6?[0,1,2]:[0,1]).sort(()=>XR()-.5), tiles=[];
  // a biting stone beside the way never shows the symbol you step on next from there, so the carved order is enough to
  // cross; a way that hems a stone in with all three symbols due beside it is walked again
  let sv, ev, walk, safe, next;
  for(let t=0;;t++){ if(t>=20) return null; sv=xpick(sv0); ev=xpick(ev0); walk=pzWalk(R,sv,ev); safe=new Set(walk); next=new Map();
    if(!mem) walk.forEach((c,k)=>{ for(const n of xAdj4(c)) if(!safe.has(n)){ if(!next.has(n)) next.set(n,new Set()); next.get(n).add(order[(k+1)%order.length]); } });
    if(![...next.values()].some(s=>s.size>=3)) break; }
  const start=R.at(-1,sv), end=R.at(R.L,ev);
  for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++){ const c=R.at(u,v), i=walk.indexOf(c); let sym=-1;
    if(!mem){ if(i>=0) sym=order[i%order.length]; else { const no=next.get(c), can=[0,1,2].filter(k=>!no||!no.has(k)); sym=can.length?xpick(can):xri(0,2); } }
    tiles.push(xProp('ptile',c,{solid:false, safe:safe.has(c), sym})); }
  const sp=xProp('pplate',start,{solid:false, role:'start'}), ep=xProp('pplate',end,{solid:false, role:'end'});
  if(!mem){ const t=xAdj4(start).find(c=>EX.room[c]===r.id&&!safe.has(c)&&!tiles.some(p=>p.cell===c)&&xSolidOK(c)); if(t==null) return null; xProp('tablet',t,{text:'Carved by the plate: step only in this order, again and again: '+order.map(k=>SYM[k].i).join(' → ')+'. Every other stone bites.'}); }
  return {tiles, start:sp, end:ep, run:false, showT:0, mem:!!mem, order}; }

/* ---------------- the puzzle builders ---------------- */
Object.assign(PUZZLE_BUILD,{
  path(r){ return pzField(r,false); },
  memory(r){ return pzField(r,true); },
  bells(r){ const n=EX.depth>=6?5:4, bells=[];
    for(let k=0;k<4;k++){ const c=xFreeSolid(r,true); if(c<0) return null; bells.push(xProp('bell',c,{idx:k})); }
    const g=xFreeSolid(r,false); if(g<0) return null; xProp('gong',g,{});
    return {bells, seq:Array.from({length:n},()=>xri(0,3)), step:0, heard:false}; },
  ice(r){ const R=pzRect(r,[5,9],[3,6],true); if(!R) return null; const {x0,x1,y0,y1}=R;   // (a rim of dry floor all round it: pzRect)
    const ice=[]; for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) ice.push(xi(x,y));
    const inner=ice.filter(c=>xcx(c)>x0&&xcx(c)<x1&&xcy(c)>y0&&xcy(c)<y1);
    for(let t=0;t<400;t++){ const goal=xpick(inner), rocks=new Set();
      // block each straight line into the pedestal, so it can't be reached in one slide; then a stray boulder or two
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){ const line=[]; for(let k=1;;k++){ const x=xcx(goal)+dx*k, y=xcy(goal)+dy*k, c=xi(x,y); if(x<x0||x>x1||y<y0||y>y1) break; line.push(c); } if(line.length&&XR()<.85) rocks.add(xpick(line)); }
      for(let k=xri(1,2);k>0;k--){ const c=xpick(ice); if(c!==goal) rocks.add(c); }
      const iceSet=new Set(ice), steps=pzIceSolve(r,iceSet,rocks,goal); if(steps==null||steps<2) continue;
      xProp('icefloor',xi((x0+x1)>>1,(y0+y1)>>1),{solid:false, room:r.id, x0,x1,y0,y1});   // (the sheet's own middle: a shaped room's middle can be wall)
      for(const c of rocks) xProp('iceboulder',c,{}); const gp=xProp('icegoal',goal,{});
      for(const c of ice) if(!rocks.has(c)&&c!==goal) EX.taken.add(c);
      return {ice:[...iceSet], goal:gp, rocks:[...rocks]}; }
    return null; },
  scales(r){ const vals=[1,2,3,4,5,6,7,8,9].sort(()=>XR()-.5).slice(0,5), pick3=vals.slice().sort(()=>XR()-.5).slice(0,3), target=pick3.reduce((a,b)=>a+b,0), stones=[];
    for(const v of vals){ const c=xFreeSolid(r,true); if(c<0) return null; stones.push(xProp('weight',c,{v, on:false})); }
    const s=xFreeSolid(r,true); if(s<0) return null; const sc=xProp('scale',s,{});
    const t=xFreeSolid(r,false); if(t<0) return null; xProp('tablet',t,{text:'Chiselled under the scale: “Three stones, and the scale weighs '+target+'.”'});
    return {stones, target, scale:sc}; },
  // the 3 x 3 channel stones with the inlet and outlet either side: a 5 x 3 rectangle of the room's own floor (pzRect)
  shift(r){ const R=pzRect(r,[5,5],[3,3],false); if(!R) return null; const gx=R.x0+1, gy=R.y0;
    const cells=[]; for(let y=0;y<3;y++) for(let x=0;x<3;x++) cells.push(xi(gx+x,gy+y));
    let y=xri(0,2); const y0=y, path=[]; for(let x=0;x<3;x++){ path.push([x,y]); if(x<2&&XR()<.6){ const ty=xri(0,2); while(y!==ty){ y+=Math.sign(ty-y); path.push([x,y]); } } }
    const inlet=xi(gx-1,gy+y0), outlet=xi(gx+3,gy+y);
    const dirTo=(a,b)=>b[0]>a[0]?1:b[0]<a[0]?3:b[1]>a[1]?2:0, tiles=[];
    for(let k=0;k<9;k++){ const x=k%3, yy=(k/3)|0, pi=path.findIndex(([px,py])=>px===x&&py===yy); let type, sol=null;
      if(pi>=0){ const inD=pi===0?3:(dirTo(path[pi],path[pi-1])), outD=pi===path.length-1?1:dirTo(path[pi],path[pi+1]); type=(inD+2)%4===outD?'line':'bend'; sol=[inD,outD]; }
      else type=XR()<.5?'line':'bend';
      const t=xProp('pipe',cells[k],{solid:false, type, rot:xri(0,3), gx:x, gy:yy, need:sol}); tiles.push(t); }
    // scramble: no path stone starts in a position that already fits
    for(const t of tiles) if(t.need){ let g=0; while(pzFits(t)&&g++<8) t.rot=(t.rot+1)%4; }
    xProp('pipeend',inlet,{solid:false, out:false}); xProp('pipeend',outlet,{solid:false, out:true});
    return {tiles, y0, y1:y}; },
  riddle(r){ const R=pzRect(r,[3,3],[3,3],false); if(!R) return null; const c=R.at(1,1); if(!xSolidOK(c)) return null; xProp('guardian',c,{}); return {wrong:0}; },
  braziers(r){ const c=xFreeSolid(r,true); if(c<0) return null; const src=xProp('pbrazier',c,{lit:true, src:true});
    // the cold ones within 48 steps of it (a 45 s flame walks about 150); a spacious floor is half as wide again, so further
    const reachMax=EX.layout===2?Math.round(48*XN/68):48;
    const reach=xReach(), d=xbfs(EX.t,EX.doors,c,false), rooms=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r&&d[xi(x.cx,x.cy)]>=0&&d[xi(x.cx,x.cy)]<=reachMax).sort((a,b)=>d[xi(a.cx,a.cy)]-d[xi(b.cx,b.cy)]).slice(0,6).sort(()=>XR()-.5).slice(0,3);
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

/* ---------------- lanterns and the sliding mural (the puzzles of docs/dungeon-shapes-and-puzzles.md) ---------------- */
// a lantern flips, and the ones beside it (not corner to corner)
function pzLanternFlip(tiles,p){ for(const t of tiles) if(Math.abs(t.u-p.u)+Math.abs(t.v-p.v)<=1) t.lit=!t.lit; }
// the mural: board[spot] is the panel at that spot (spots 0..8 row by row), 8 the gap; whole when board[i]===i
const pzMuralNbrs=g=>{ const x=g%3, y=(g/3)|0, o=[]; if(x>0) o.push(g-1); if(x<2) o.push(g+1); if(y>0) o.push(g-3); if(y<2) o.push(g+3); return o; };
const pzMuralDone=b=>b.every((k,i)=>k===i);
Object.assign(PUZZLE_BUILD,{
  // a 3 x 3 field of lanterns, built lit, then put out by steps a player could take (3 of them; 4 from depth 5, 5 from
  // depth 8). On a 3 x 3 field exactly one set of steps lights them all, so it can be reasoned out
  lanterns(r){ const R=pzRect(r,[3,3],[3,3],false); if(!R) return null; const tiles=[], n=EX.depth>=8?5:EX.depth>=5?4:3;
    for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++) tiles.push(xProp('lantern',R.at(u,v),{solid:false, lit:true, u, v}));
    for(let t=0;t<20&&tiles.every(p=>p.lit);t++) for(const p of tiles.slice().sort(()=>XR()-.5).slice(0,n)) pzLanternFlip(tiles,p);
    if(tiles.every(p=>p.lit)) return null;
    // the rune stone that puts them back: somewhere in the room off the lanterns' rim, so walking round them never touches it
    const rim=new Set(); for(let u=-1;u<=R.L;u++) for(let v=-1;v<=R.W;v++) rim.add(R.at(u,v));
    const spot=xRoomCells(r).filter(c=>!rim.has(c)&&!EX.taken.has(c)&&!nearDoor(c)).sort(()=>XR()-.5).find(xSolidOK); if(spot==null) return null;
    const reset=xProp('lreset',spot,{});
    return {tiles, begin:tiles.map(p=>p.lit), reset}; },
  // built whole, then slid at random (more slides deeper)
  // on a wall of the room the camera looks at (a north wall, else an east or west one: a south wall's face is turned away),
  // away from its doors
  mural(r){ const bad=(n,c)=>EX.doors.has(n)||EX.taken.has(c)||nearDoor(c);
    const s=xWallSpot(r,(n,c)=>bad(n,c)||xcy(n)>=xcy(c))||xWallSpot(r,(n,c)=>bad(n,c)||xcy(n)>xcy(c)); if(!s) return null;
    const b=[0,1,2,3,4,5,6,7,8], n=24+EX.depth*3; let gap=8, last=-1;
    for(let k=0;k<n||pzMuralDone(b);k++){ const m=xpick(pzMuralNbrs(gap).filter(x=>x!==last)); b[gap]=b[m]; b[m]=8; last=gap; gap=m; }
    const arts=pzMuralCards(), p=xWallProp('mural',s[0],s[1],{board:b, begin:b.slice(), hue:xri(0,PZM_PAL.length-1), card:arts.length?xpick(arts):null});
    if(typeof document!=='undefined') pzMuralPic(p);   // start loading the picture now: it is ready by the time you reach it
    return {mural:p}; },
});
// the old picture (murals made before card art): a sunset over hills, a river and a tower, in one of a few palettes
const PZM_PAL=[
  {sky:['#2a2350','#e8925a'], sun:'#ffe08a', far:'#6a4a72', near:'#3a2a48', land:'#2c3a2e', water:'#9fd8ff', tower:'#1c1622'},
  {sky:['#0f2a3a','#7fd0c8'], sun:'#f4f7d0', far:'#3e6a74', near:'#24424a', land:'#1e3428', water:'#d8fbff', tower:'#0e1a20'},
  {sky:['#3a1420','#f2b45a'], sun:'#fff0a0', far:'#7a3a3a', near:'#4a1e26', land:'#3a2a1a', water:'#ffd8a0', tower:'#200c10'},
  {sky:['#1a1a3e','#b48cff'], sun:'#ffffff', far:'#4a3a7a', near:'#2a2050', land:'#22243a', water:'#cfc0ff', tower:'#0e0c1e'}];
const PZM_PIC=new Map();
// the cards with painted art (cards/art-variants.js): a mural shows one of them
const pzMuralCards=()=>typeof HEX_CARD_ART_VARIANTS==='undefined'||typeof CARDS==='undefined'?[]:Object.keys(HEX_CARD_ART_VARIANTS).filter(id=>CARDS[id]&&HEX_CARD_ART_VARIANTS[id].large).sort();
// a mural's picture: its card's painted art, cropped square and framed. It loads in the background; until it has, a
// dark stone face stands in, and when it arrives the wall and an open close-up are redrawn. A mural from before this
// (or with no painted card to show) keeps the drawn sunset
function pzMuralPic(p){ const id=p.card; if(!id||typeof HEX_CARD_ART_VARIANTS==='undefined'||!HEX_CARD_ART_VARIANTS[id]) return pzMuralSunset(p.hue);
  const key='card:'+id; if(PZM_PIC.has(key)) return PZM_PIC.get(key);
  const S=240, cv=document.createElement('canvas'); cv.width=cv.height=S; const c=cv.getContext('2d');
  c.fillStyle='#2a2420'; c.fillRect(0,0,S,S); pzMuralFrame(c,S);
  const out={cv, url:cv.toDataURL(), ready:false}; PZM_PIC.set(key,out);
  const im=new Image(); im.onload=()=>{ const w=im.naturalWidth, h=im.naturalHeight, m=Math.min(w,h);
    c.drawImage(im,(w-m)/2,(h-m)/2,m,m,0,0,S,S); pzMuralFrame(c,S);
    try{ out.url=cv.toDataURL(); }catch(e){} out.ready=true;
    if(EX) for(const q of EX.props) if(q.kind==='mural'&&q.card===id){ pzMuralPaint(q); if(EX.dlg&&EX.dlg.title==='The sliding mural') pzMuralBody($('#xdBody'),q); } };
  im.src=HEX_CARD_ART_VARIANTS[id].large; return out; }
// a carved frame: the edges show which way round the panels go
function pzMuralFrame(c,S){ c.strokeStyle='rgba(20,14,10,.85)'; c.lineWidth=10; c.strokeRect(5,5,S-10,S-10); c.strokeStyle='rgba(240,220,180,.55)'; c.lineWidth=2; c.strokeRect(11,11,S-22,S-22); }
function pzMuralSunset(hue){ if(PZM_PIC.has(hue)) return PZM_PIC.get(hue); const P=PZM_PAL[hue]||PZM_PAL[0], S=240, cv=document.createElement('canvas'); cv.width=cv.height=S; const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,0,S*.7); g.addColorStop(0,P.sky[0]); g.addColorStop(1,P.sky[1]); c.fillStyle=g; c.fillRect(0,0,S,S);
  c.fillStyle='rgba(255,255,255,.8)'; for(const [x,y,r] of [[22,20,1.6],[48,38,1.2],[70,16,1.8],[30,60,1],[96,44,1.3],[60,82,.9]]){ c.beginPath(); c.arc(x,y,r,0,7); c.fill(); }
  c.strokeStyle=P.sun; c.globalAlpha=.55; c.lineWidth=3; for(let k=0;k<12;k++){ const a=k*Math.PI/6; c.beginPath(); c.moveTo(172+Math.cos(a)*36,74+Math.sin(a)*36); c.lineTo(172+Math.cos(a)*52,74+Math.sin(a)*52); c.stroke(); }
  c.globalAlpha=1; c.fillStyle=P.sun; c.beginPath(); c.arc(172,74,28,0,7); c.fill();
  const hill=(col,pts)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(0,S); for(const [x,y] of pts) c.lineTo(x,y); c.lineTo(S,S); c.fill(); };
  hill(P.far,[[0,130],[40,96],[78,124],[120,88],[160,120],[200,100],[240,128]]);
  hill(P.near,[[0,160],[30,140],[70,150],[110,126],[150,150],[196,138],[240,156]]);
  hill(P.land,[[0,176],[60,170],[120,178],[180,168],[240,174]]);
  // the river, from the hills to the bottom left
  c.fillStyle=P.water; c.beginPath(); c.moveTo(150,170); c.bezierCurveTo(130,186,190,200,120,214); c.bezierCurveTo(80,228,40,222,20,240); c.lineTo(62,240); c.bezierCurveTo(90,226,150,222,160,206); c.bezierCurveTo(176,190,150,184,160,170); c.fill();
  // the tower on the left hill, with a lit window
  c.fillStyle=P.tower; c.fillRect(34,104,18,58); c.beginPath(); c.moveTo(30,106); c.lineTo(43,84); c.lineTo(56,106); c.fill(); c.fillRect(30,104,26,5);
  c.fillStyle=P.sun; c.fillRect(40,118,6,9);
  pzMuralFrame(c,S);
  const out={cv, url:cv.toDataURL(), ready:true}; PZM_PIC.set(hue,out); return out; }
// the mural as it stands now, on the wall
function pzMuralPaint(p){ if(!p.tex) return; const S=p.tex.image.width, t=S/3, c=p.tex.image.getContext('2d'), pic=pzMuralPic(p).cv, ps=pic.width/3;
  c.fillStyle='#16110e'; c.fillRect(0,0,S,S);
  p.board.forEach((k,i)=>{ if(k===8&&!pzMuralDone(p.board)) return; c.drawImage(pic,(k%3)*ps,((k/3)|0)*ps,ps,ps,(i%3)*t+1,((i/3)|0)*t+1,t-2,t-2); });
  p.tex.needsUpdate=true; }
// close up: tap a panel beside the gap to slide it in
function pzMuralDlg(p){ const pz=EX.puzzle; if(!pz||pz.kind!=='mural') return;
  const C=p.card&&typeof CARDS!=='undefined'&&CARDS[p.card];
  if(pz.solved) return xDlgText('The mural','The picture is whole again'+(C?': '+C.name+'.':': a tower above a river, and the sun going down behind the hills.'));
  const o={title:'The sliding mural', sub:'Sliding mural', icon:['scroll','#f2c94c'], text:'Eight stone panels and a gap. Tap a panel beside the gap to slide it in, until the picture is whole. The small carving shows how it goes.',
    body:b=>pzMuralBody(b,p), buttons:[['Leave',null]]};
  xDlg(o); }
function pzMuralBody(b,p){ b.innerHTML=''; const pic=pzMuralPic(p), gap=p.board.indexOf(8), can=pzMuralNbrs(gap), box=document.createElement('div'); box.className='pzm';
  const grid=document.createElement('div'); grid.className='pzm-grid';
  p.board.forEach((k,i)=>{ const t=document.createElement('button'); t.type='button'; t.className='pzm-tile'+(k===8?' gap':can.includes(i)?' can':''); t.dataset.spot=i;
    if(k!==8){ t.style.backgroundImage='url('+pic.url+')'; t.style.backgroundPosition=(k%3)*50+'% '+((k/3)|0)*50+'%'; t.setAttribute('aria-label','Panel '+(k+1)+(can.includes(i)?', can slide':'')); t.onclick=()=>pzMuralSlide(p,i,b); }
    else { t.disabled=true; t.setAttribute('aria-label','Gap'); }
    grid.appendChild(t); });
  const side=document.createElement('div'); side.className='pzm-side';
  const goal=document.createElement('div'); goal.className='pzm-goal'; goal.style.backgroundImage='url('+pic.url+')'; side.appendChild(goal);
  const cap=document.createElement('small'); cap.textContent='The picture'; side.appendChild(cap);
  const again=document.createElement('button'); again.type='button'; again.className='btn small ghost'; again.textContent='Start over';
  again.onclick=()=>{ p.board=p.begin.slice(); xSfx('grind'); pzMuralPaint(p); pzMuralBody(b,p); }; side.appendChild(again);
  box.append(grid,side); b.appendChild(box); }
function pzMuralSlide(p,i,b){ const pz=EX.puzzle, gap=p.board.indexOf(8); if(!pz||pz.solved||!pzMuralNbrs(gap).includes(i)) return;
  p.board[gap]=p.board[i]; p.board[i]=8; xSfx('grind'); pzMuralPaint(p);
  if(pzMuralDone(p.board)){ xDlgClose(); pzTone(784,.6); xLog('The last panel grinds home. The picture is whole.','good'); xPuzzleSolved(); return; }
  pzMuralBody(b,p); }


/* ---------------- sentries, herding, echo and the hidden bridge ---------------- */
// put you back on a cell (caught by a sentry's gaze)
function pzSendTo(c){ EX.pc=c; EX.px=xw(c); EX.pz=xz(c); EX.path=[]; EX.goal=null; xUpdateVis(); }
// a sentry's eye: open for `on` seconds of every `per`, from its own phase; it flickers for .6 s before it opens
const pzEye=(s,t)=>{ const k=((t+s.ph)%s.per+s.per)%s.per; return {open:k<s.on, warn:k>=s.per-.6, left:k<s.on?s.on-k:s.per-k}; };
// the echo's place: where you were `delay` seconds ago
function pzEchoAt(pz){ const tr=pz.trail; if(!tr||!tr.length) return null; const t=pz.clock-pz.delay; if(t<tr[0].t) return null;
  let i=tr.length-1; while(i>0&&tr[i].t>t) i--; return tr[i]; }
Object.assign(PUZZLE_BUILD,{
  // a hall three cells wide: the start plate at one end, the gold plate at the other; stone heads in the rim look across
  // their column of it. Each eye is shut longer than it takes to cross a column, so there is always a gap
  sentries(r){ const R=pzRect(r,[5,7],[3,3],true); if(!R) return null; const d=EX.depth;
    const sc=R.at(-1,1), ec=R.at(R.L,1); if(EX.taken.has(sc)||EX.taken.has(ec)) return null;
    const cols=[]; for(let u=1;u<=R.L-2;u+=2) cols.push(u); if(cols.length<2) return null;
    const heads=[], per=d>=6?3.2:3.6, on=d>=6?1.6:1.4;
    for(const u of cols){ const side=XR()<.5?-1:R.W, alt=side<0?R.W:-1;
      let c=R.at(u,side), dv=side<0?1:-1; if(EX.taken.has(c)||!xSolidOK(c)){ c=R.at(u,alt); dv=-dv; if(EX.taken.has(c)||!xSolidOK(c)) continue; }
      heads.push(xProp('sentry',c,{u, dv, W:R.W, per, on, ph:XR()*per})); }
    if(heads.length<2) return null;
    const field=[]; for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++){ const c=R.at(u,v); field.push(c); xProp('hall',c,{solid:false}); }
    const start=xProp('pplate',sc,{solid:false, role:'start'}), end=xProp('pplate',ec,{solid:false, role:'end'});
    return {heads, field, start, end, run:false, clock:0, ax:R.ax, x0:R.x0, y0:R.y0}; },
  // a field of the room's own floor with the rune plate in one corner; the wisp starts at the far side
  herding(r){ const R=pzRect(r,[4,6],[3,5],true); if(!R) return null;
    const corner=[[0,0],[0,R.W-1],[R.L-1,0],[R.L-1,R.W-1]][xri(0,3)], pc=R.at(corner[0],corner[1]);
    const wu=corner[0]?1:R.L-2, wv=corner[1]?1:R.W-2, wc=R.at(wu,wv);
    const area=[]; for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++){ const c=R.at(u,v); area.push(c); if(c!==pc) xProp('hall',c,{solid:false, pale:true}); }
    const plate=xProp('wplate',pc,{solid:false}), wisp=xProp('wisp',wc,{solid:false});
    if(EX.propAt.get(wc)===wisp) EX.propAt.delete(wc);   // it moves: never a thing to walk into
    return {area, plate, wisp, wt:0, stuck:0}; },
  // the echo stone in the rim, and two plates a short walk apart (closer than the echo's delay)
  echo(r){ const R=pzRect(r,[4,7],[3,5],true); if(!R) return null; const cells=[];
    for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++) cells.push(R.at(u,v));
    let a=-1, b=-1; for(let t=0;t<60&&b<0;t++){ const x=xpick(cells), y=xpick(cells), m=Math.abs(xcx(x)-xcx(y))+Math.abs(xcy(x)-xcy(y)); if(m>=3&&m<=5){ a=x; b=y; } }
    if(b<0) return null;
    const rim=[]; for(let u=-1;u<=R.L;u++) for(const v of [-1,R.W]) rim.push(R.at(u,v)); for(let v=0;v<R.W;v++) for(const u of [-1,R.L]) rim.push(R.at(u,v));
    const sc=rim.filter(c=>!EX.taken.has(c)).sort(()=>XR()-.5).find(xSolidOK); if(sc==null) return null;
    const stone=xProp('echostone',sc,{}), A=xProp('eplate',a,{solid:false}), B=xProp('eplate',b,{solid:false});
    return {stone, plates:[A,B], delay:EX.depth>=6?2.5:3, clock:0, trail:null, echoT:0}; },
  // a drop filling a rectangle of the room, a pedestal on an island in it, and a winding plank way to it that only shows
  // in the dark; the lamps that light the room stand round it, and walking into one puts it out
  bridge(r){ const R=pzRect(r,[4,6],[3,4],true); if(!R) return null;
    const iu=R.L-2, iv=R.W>=3?xri(1,R.W-2):1, way=[]; let v=xri(0,R.W-1);
    for(let u=0;u<=iu;u++){ way.push(R.at(u,v)); const tv=u===iu?iv:u<iu&&XR()<.5?xri(0,R.W-1):v; while(v!==tv){ v+=Math.sign(tv-v); way.push(R.at(u,v)); } }
    const isle=R.at(iu,iv), ws=new Set(way); ws.delete(isle);
    const drop=[], planks=[];
    for(let u=0;u<R.L;u++) for(let v=0;v<R.W;v++){ const c=R.at(u,v); if(c===isle) continue;
      if(ws.has(c)) planks.push(xProp('plank',c,{solid:false})); else drop.push(xProp('pzdrop',c,{})); }
    // the lamps stand round the drop, a cell back from its edge (the ring right round it stays a clear walkway), spread out
    const goal=xProp('isle',isle,{solid:false}), lamps=[], near=new Set();
    for(let u=-1;u<=R.L;u++) for(let v=-1;v<=R.W;v++) near.add(R.at(u,v));
    const ring=k=>xRoomCells(r).filter(c=>{ if(near.has(c)) return false; const x=xcx(c), y=xcy(c), dx=Math.max(R.x0-x,0,x-R.x1), dy=Math.max(R.y0-y,0,y-R.y1); return Math.max(dx,dy)===k; });
    for(const c of [...ring(2).sort(()=>XR()-.5),...ring(3).sort(()=>XR()-.5)]){ if(lamps.length>=3) break;
      if(EX.taken.has(c)||nearDoor(c)||lamps.some(l=>Math.hypot(xcx(l.cell)-xcx(c),xcy(l.cell)-xcy(c))<3)) continue;
      if(xSolidOK(c)) lamps.push(xProp('pzlamp',c,{lit:true})); }
    if(lamps.length<2) return null;
    return {drop, planks, goal, lamps, dark:false}; },
});

/* ---------------- touching puzzle things ---------------- */
const BRAZIER_FLAME=45;   // seconds a carried flame lasts (30 before v123: it kept dying between rooms)
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
      if(p.lit){ EX.flameT=BRAZIER_FLAME; xSfx('click'); xLog('You take a flame from the brazier. It will last '+BRAZIER_FLAME+' seconds.','good'); return true; }
      if(!(EX.flameT>0)) return xSay('brazier','A cold brazier. It needs a flame from a lit one.'), true;
      p.lit=true; if(p.flame) p.flame.visible=true; { const ri=EX.room[p.cell]; if(ri>=0&&!EX.rooms[ri].dark){ EX.rooms[ri].lit=true; xUpdateVis(); } } xSfx('chime'); const left=P.cold.filter(b=>!b.lit).length; xLog(left?'The brazier catches. '+left+' still cold.':'The last brazier roars to life!','good');
      if(!left&&!P.solved) xPuzzleSolved(); return true; }
    case 'cswitch': return pzCircuitPull(p), true;
    case 'ghosttable': return pzTable(p), true;
    case 'cleanse': return pzCleanse(p), true;
    case 'mural': return pzMuralDlg(p), true;
    case 'sentry': return xSay('sentry','A stone head. Its eyes open and shut, and its gaze falls across the hall.'), true;
    case 'echostone': { if(!pz||pz.kind!=='echo') return true; if(pz.solved) return xSay('echo','The echo stone is quiet.'), true;
      pz.trail=[]; pz.echoT=25; pzTone(523,.5); setTimeout(()=>pzTone(523,.4),pz.delay*1000); xLog('The stone hums. Something walks where you walk, '+pz.delay+' seconds behind.','dim'); return true; }
    case 'pzdrop': return xSay('pzdrop','A sheer drop. Something might cross it, if you could see it.'), true;
    case 'pzlamp': { const P=pz&&pz.kind==='bridge'?pz:null; if(!P||!p.lit) return true;
      p.lit=false; xSfx('whisper'); const left=P.lamps.filter(l=>l.lit).length;
      if(!left){ P.dark=true; const rr=EX.rooms[P.goal&&EX.room[P.goal.cell]]; if(rr){ rr.lit=false; xUpdateVis(); } xLog('The last lamp goes out. In the dark, planks glow faintly across the drop.','good'); }
      else xLog('You pinch out the lamp. '+left+' still burning.','dim'); return true; }
    case 'lreset': { if(!pz||pz.kind!=='lanterns'||pz.solved) return xSay('lreset','A violet rune stone. It is quiet now.'), true;
      if(pz.tiles.every((t,i)=>t.lit===pz.begin[i])) return xSay('lreset','A violet rune stone. The lanterns are as they were when you came.'), true;
      pz.tiles.forEach((t,i)=>{ t.lit=pz.begin[i]; }); xSfx('grind'); xLog('The rune stone hums. The lanterns go back as they were.','dim'); return true; }
    case 'ptile': case 'pplate': case 'pipe': case 'pipeend': case 'icefloor': case 'lantern': case 'wplate': case 'wisp': case 'hall': case 'eplate': case 'plank': case 'isle': return true;
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
    // a stone only bites once you have started from the plate (before v123, the pressure path's stones bit anyone crossing the room)
    if(!p.safe&&pz.run){ pz.run=false; p.badT=.6; if(pz.mem){ pzTone(130,.5); xLog('The stone goes cold and dead under you. Start again from the plate.','bad'); xHurt(Math.round(2+EX.depth*.3),'a dead stone'); }
      else { xLog('The stone bites! Spikes jab up through the cracks.','bad'); xHurt(Math.round(6+EX.depth*.6),'a biting stone'); } }
    return true; }
  if(p.kind==='pplate'&&pz&&pz.kind==='sentries'){ if(pz.solved) return true;
    if(p.role==='start'){ if(!pz.run) xLog('You step onto the plate. Cross to the gold one without a stone head seeing you.','dim'); pz.run=true; }
    else if(pz.run){ pz.run=false; xPuzzleSolved(); }
    else xLog('Start from the other plate.','dim'); return true; }
  if(p.kind==='isle'&&pz&&pz.kind==='bridge'&&!pz.solved){ xPuzzleSolved(); return true; }
  if(p.kind==='lantern'&&pz&&pz.kind==='lanterns'&&!pz.solved){ pzLanternFlip(pz.tiles,p); pzTone(p.lit?660:330,.25); if(pz.tiles.every(t=>t.lit)) xPuzzleSolved(); return true; }
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
  if(pz&&!pz.solved&&pz.kind==='sentries'){ pz.clock+=dt; const F=pz._f||(pz._f=new Set(pz.field));
    if(pz.run&&!F.has(EX.pc)&&EX.pc!==pz.start.cell&&EX.pc!==pz.end.cell){ pz.run=false; xLog('You left the hall. Start again from the green plate.','dim'); }
    if(pz.run&&F.has(EX.pc)) for(const h of pz.heads){ if(!pzEye(h,pz.clock).open) continue; const u=pz.ax?xcy(EX.pc)-pz.y0:xcx(EX.pc)-pz.x0;
      if(u===h.u){ pzTone(140,.5); xMakeNoise(6); xLog('A stone head’s gaze falls on you. You are back at the start.','bad'); pzSendTo(pz.start.cell); break; } } }
  if(pz&&!pz.solved&&pz.kind==='herding'){ const w=pz.wisp, A=pz._a||(pz._a=new Set(pz.area)); pz.wt+=dt;
    const dist=c=>Math.hypot(xcx(c)-xcx(EX.pc),xcy(c)-xcy(EX.pc));
    if(pz.wt>=.38&&dist(w.cell)<=2.6){ pz.wt=0; const opts=xAdj4(w.cell).filter(c=>A.has(c)&&c!==EX.pc), here=dist(w.cell);
      if(opts.length){ const best=opts.map(c=>[c,dist(c)+XR()*.2]).sort((a,b)=>b[1]-a[1])[0];
        if(best[1]>here+.05){ w.cell=best[0]; pz.stuck=0; } else if(++pz.stuck>=3){ w.cell=xpick(opts); pz.stuck=0; } }   // cornered: it darts past
      if(w.cell===pz.plate.cell){ pzTone(784,.5); xLog('The wisp drifts onto the rune plate and is caught in a ring of light.','good'); xPuzzleSolved(); } } }
  if(pz&&!pz.solved&&pz.kind==='echo'&&pz.echoT>0){ pz.clock+=dt; pz.echoT-=dt; pz.trail.push({t:pz.clock, c:EX.pc, x:EX.px, z:EX.pz});
    while(pz.trail.length>2&&pz.trail[1].t<pz.clock-pz.delay-.5) pz.trail.shift();
    const g=pzEchoAt(pz), [A,B]=pz.plates;
    if(g&&(EX.pc===A.cell&&g.c===B.cell||EX.pc===B.cell&&g.c===A.cell)){ pz.echoT=0; xLog('You and your echo hold both plates. Stone grinds.','good'); xPuzzleSolved(); }
    else if(pz.echoT<=0){ pz.trail=null; xLog('The echo fades. Walk into the stone to call it again.','dim'); } }
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
// a soft warm glow on the floor round a lit lantern (one texture for all)
let PZ_GLOW=null;
function pzGlowTex(){ const P=typeof envArtFx==='function'&&envArtFx('lantern'); if(P&&!pzGlowTex.painted){ pzGlowTex.painted=1; return PZ_GLOW=xTexSmooth(P,false); }   // (the painted lantern glow: envart.js)
  if(PZ_GLOW) return PZ_GLOW; const S=64, cv=document.createElement('canvas'); cv.width=cv.height=S; const c=cv.getContext('2d'), g=c.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(255,214,130,.75)'); g.addColorStop(.45,'rgba(255,170,70,.32)'); g.addColorStop(1,'rgba(255,140,40,0)'); c.fillStyle=g; c.fillRect(0,0,S,S);
  return PZ_GLOW=new THREE.CanvasTexture(cv); }
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
    case 'lantern': { g.add(xBox(XCS*.9,.08,XCS*.9,xMat(0x4e4a46),0,.04,0), xCyl(.26,.1,iron,0,.12,0));
      const m=xGlowMat(0xffd27a,{transparent:true,opacity:.95}); const d=new THREE.Mesh(new THREE.SphereGeometry(.24,12,8,0,Math.PI*2,0,Math.PI/2),m); d.position.y=.16; g.add(d); p.bulb=m;
      // lit: a flame in the dome and a warm pool of light on the stone round it
      p.flame=xCone(.1,.32,xGlowMat(0xfff4c0),0,.36,0); g.add(p.flame);
      const pool=new THREE.Mesh(new THREE.PlaneGeometry(XCS*1.1,XCS*1.1),new THREE.MeshBasicMaterial({map:pzGlowTex(), transparent:true, depthWrite:false})); pool.rotation.x=-Math.PI/2; pool.position.y=.09; g.add(pool); p.pool=pool; return true; }
    case 'lreset': { g.add(xBox(.6,1.05,.4,stone,0,.52,0), xBox(.36,.36,.02,xGlowMat(0xb48cff),0,.75,.21), xBox(.36,.36,.02,xGlowMat(0xb48cff),0,.75,-.21)); return true; }
    case 'mural': { const S=192, cv=document.createElement('canvas'); cv.width=cv.height=S; p.tex=new THREE.CanvasTexture(cv);
      g.add(xBox(1.6,1.6,.1,xMat(0x4a3a2c),0,1.25,.02), new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:p.tex, color:0xd8cfc0})));
      g.children[1].position.set(0,1.25,.08); pzMuralPaint(p); return true; }
    case 'sentry': { g.add(xBox(.8,.5,.8,stone,0,.25,0), xBox(.62,.7,.56,stone,0,.85,0), xBox(.7,.12,.62,xMat(0x5a5650),0,1.25,0));
      p.eyes=[]; for(const x of [-.14,.14]){ const e=xBall(.07,xGlowMat(0xff5d6c),x,.95,.29*p.dv); g.add(e); p.eyes.push(e); }
      p.gaze=new THREE.Mesh(new THREE.PlaneGeometry(XCS*.9,XCS*p.W),new THREE.MeshBasicMaterial({color:0xff4a4a,transparent:true,opacity:0,depthWrite:false}));
      p.gaze.rotation.x=-Math.PI/2; p.gaze.position.set(0,.07,p.dv*(p.W+1)/2*XCS); g.add(p.gaze); return true; }
    case 'wplate': { g.add(xCyl(.6,.08,stone,0,.04,0), xCyl(.42,.04,xGlowMat(0x8fe4ff),0,.09,0)); const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.03,6,24),xGlowMat(0x8fe4ff)); ring.rotation.x=Math.PI/2; ring.position.y=.12; g.add(ring); return true; }
    case 'wisp': { p.orb=xBall(.28,xGlowMat(0xe6fbff),0,.8,0); p.halo=xBall(.5,xGlowMat(0x7fd8ff,{transparent:true,opacity:.32,depthWrite:false}),0,.8,0); g.add(p.orb,p.halo); return true; }
    case 'echostone': { g.add(xBox(.7,1.2,.5,stone,0,.6,0)); p.rune=xBox(.34,.34,.02,xGlowMat(0x9fd0ff,{transparent:true,opacity:.6}),0,.8,.26); g.add(p.rune); return true; }
    case 'eplate': { g.add(xCyl(.55,.08,stone,0,.04,0), xCyl(.38,.04,xGlowMat(0x9fd0ff),0,.09,0)); return true; }
    case 'hall': { g.add(xBox(XCS*.94,.04,XCS*.94,xMat(p.pale?0x5e6a70:0x4a4642),0,.02,0)); return true; }
    case 'pzdrop': { g.add(xBox(XCS,.04,XCS,new THREE.MeshBasicMaterial({color:0x040408}),0,.02,0)); return true; }
    case 'plank': { const m=new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:0,depthWrite:false}); p.glowMat=m;
      g.add(xBox(XCS,.04,XCS,new THREE.MeshBasicMaterial({color:0x040408}),0,.02,0)); for(let k=-1;k<=1;k++) g.add(xBox(XCS*.9,.03,XCS*.24,m,0,.06,k*XCS*.3)); return true; }
    case 'isle': { g.add(xBox(XCS*.9,.3,XCS*.9,stone,0,.15,0), xBox(.4,.6,.4,xMat(0x8a8478),0,.6,0)); p.orb=xBall(.16,xGlowMat(0xf2c94c),0,1.05,0); g.add(p.orb); return true; }
    case 'pzlamp': { g.add(xCyl(.3,.12,iron,0,.06,0), xCyl(.09,1.3,iron,0,.7,0), xCyl(.36,.16,iron,0,1.38,0)); for(const a of [0,2.1,4.2]) g.add(xBox(.05,.36,.05,iron,Math.cos(a)*.3,1.22,Math.sin(a)*.3));
      p.flame=xCone(.26,.62,xGlowMat(0xffb060,{transparent:true,opacity:.92}),0,1.76,0); g.add(p.flame); return true; }
    case 'cleanse': { g.add(xBox(1.1,.7,.7,stone,0,.35,0), xCyl(.4,.12,xMat(0x8a8478),0,.76,0)); const w=xCyl(.34,.02,xGlowMat(0x9fdcff,{transparent:true,opacity:.75}),0,.83,0); g.add(w); return true; }
  }
  return false; }
function xPuzzAnim(T,dt){ if(!EX) return; const pz=EX.puzzle; pzEchoMesh(pz);
  for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
    if(p.kind==='ptile'&&p.glow){ const show=pz&&pz.mem&&pz.showT>0&&p.safe; p.badT=Math.max(0,(p.badT||0)-(dt||.016)); p.glow.material.opacity=p.badT>0?.6:show?.55+.2*Math.sin(T*8):0; p.glow.material.color.setHex(p.badT>0?0xff5d6c:0x9dffc0); }
    if(p.kind==='bell'&&p.bellMat){ p.flashT=Math.max(0,(p.flashT||0)-(dt||.016)); p.bellMat.emissive.copy(p.col3).multiplyScalar(.15+(p.flashT>0?1.2*p.flashT:0)); }
    if(p.kind==='pipe'&&p.ch){ const want=-p.rot*Math.PI/2; p.ch.rotation.y+=(want-p.ch.rotation.y)*.25; if(pz&&pz.lit) p.chMat.color.setHex(0xf2c94c); }
    if(p.kind==='weight'&&p.stone){ const y=p.on?.75:.4; p.stone.position.y+=(y-p.stone.position.y)*.2; if(p.mark) p.mark.position.y=p.stone.position.y+.02+.15+p.v*.05; }
    if(p.kind==='lantern'&&p.bulb){ p.bulb.color.setHex(p.lit?0xffd27a:0x22222c); p.flame.visible=p.pool.visible=!!p.lit; if(p.lit){ const f=.85+.15*Math.sin(T*7+p.cell); p.flame.scale.set(1,f,1); p.pool.material.opacity=.75+.25*f; } }
    if(p.kind==='sentry'&&p.gaze&&pz&&pz.kind==='sentries'){ const e=pz.solved?{open:false,warn:false}:pzEye(p,pz.clock);
      p.gaze.material.opacity=e.open?.38:e.warn?.12+.1*Math.sin(T*30):0; for(const y of p.eyes) y.material.color.setHex(e.open?0xff5d6c:e.warn?0xffa040:0x3a2020); }
    if(p.kind==='wisp'&&p.orb){ const g=p.mesh, tx=xw(p.cell), tz=xz(p.cell); g.position.x+=(tx-g.position.x)*.18; g.position.z+=(tz-g.position.z)*.18; p.orb.position.y=p.halo.position.y=.8+Math.sin(T*3)*.1; }
    if(p.kind==='plank'&&p.glowMat){ const P=pz&&pz.kind==='bridge'?pz:null; p.glowMat.opacity=P&&(P.dark||P.solved)?.55+.15*Math.sin(T*2+p.cell):0; }
    if(p.kind==='pzlamp'&&p.flame){ p.flame.visible=!!p.lit; p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); }
    if(p.kind==='isle'&&p.orb) p.orb.position.y=1.05+Math.sin(T*2)*.05;
    if(p.kind==='icegoal'&&p.orb) p.orb.position.y=1.2+Math.sin(T*2)*.06;
    if(p.kind==='pbrazier'&&p.flame){ p.flame.visible=!!p.lit; p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); }
    if(p.kind==='ghosttable'&&p.dish) p.need.forEach((e,i)=>{ p.dish[i].visible=p.placed.includes(e); });
    if(p.kind==='guardian'&&p.eyes){ const pzr=EX.puzzle; p.eyes.visible=!(pzr&&pzr.kind==='riddle'&&(pzr.wrong>=2||pzr.solved)); } } }

// your echo: a pale figure where you were a few seconds ago (one mesh, made when first needed)
function pzEchoMesh(pz){ const on=pz&&pz.kind==='echo'&&!pz.solved&&pz.echoT>0, g=on&&pzEchoAt(pz);
  if(EX.echoMesh&&X3&&EX.echoMesh.parent!==X3.group) EX.echoMesh=null;   // the scene was built again
  if(!EX.echoMesh){ if(!g||!X3||!X3.group) return; const m=new THREE.Group(), mat=new THREE.MeshBasicMaterial({color:0xbfe4ff,transparent:true,opacity:.62,depthWrite:false}), aura=new THREE.MeshBasicMaterial({color:0x7fc8ff,transparent:true,opacity:.22,depthWrite:false});
    m.add(xCyl(.3,1.1,mat,0,.65,0), xBall(.26,mat,0,1.45,0), xCyl(.48,1.5,aura,0,.8,0), xCyl(.5,.03,xGlowMat(0x9fd0ff,{transparent:true,opacity:.5}),0,.03,0)); X3.group.add(m); EX.echoMesh=m; }
  EX.echoMesh.visible=!!g; if(g) EX.echoMesh.position.set(g.x,0,g.z); }
