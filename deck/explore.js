/* Hexmancers — the overworld. Each depth is a dungeon floor in the spirit of Rogue and NetHack:
   rooms joined by corridors, drawn in 3D and hidden until you walk through them. A lit room
   shows whole when you step in; corridors and dark rooms show only what is right around you.
   Enemies sleep, wander or hunt you, and you only see them once they are in your sight, so a
   patrol can catch you off guard. Some doors are secret and some floors are trapped: search (F)
   to find both, then disarm (E) a trap before you cross it. Chests hold cards, gold or gear.
   Touching an enemy starts a battle: reach a sleeping one first for an ambush, or get caught
   unawares and it strikes first. Stairs down lead deeper; the stairs up lead back to camp.
   What else fills a floor (people and quests, merchants, sanctuaries, keys and locked doors,
   puzzles, minibosses, visible traps and secrets) lives in dungeon.js, which this file calls
   through a few hooks (xFloorPlan, xPopulate, xBumpExtra, xEnterExtra, xDungeonTick...). */

const XN=48, XCS=2, XWALL=1.7;           // grid cells per side, world units per cell, wall height
const XSPEED=7;                          // your walking speed, in world units a second (3.5 tiles)
const XSPR=2.8;                          // height of a person on the map, in world units
const T_ROCK=0, T_FLOOR=1, T_DOOR=2;
const TRAPS={
  spike:{name:'spike trap', dmg:[9,14],  col:'#9aa4b0', text:'Spikes shoot up through the floor!'},
  dart: {name:'dart trap',  dmg:[6,10],  col:'#6bd36b', text:'A poisoned dart flies out of the wall!'},
  fire: {name:'fire rune',  dmg:[12,18], col:'#ff7a2a', text:'A rune flares and fire washes over you!'},
  pit:  {name:'pit',        dmg:[8,12],  col:'#2a2230', text:'The floor gives way and you fall into a pit!', stuck:1.6},
  alarm:{name:'alarm rune', dmg:[0,0],   col:'#f2c94c', text:'A rune shrieks! Everything on this floor heard that.'},
  blocks:{name:'falling block trap', dmg:[10,15], col:'#8a8398', text:'Stones crash down from the ceiling!', stun:1},
  explosive:{name:'explosive rune', dmg:[14,20], col:'#ff9a3a', text:'A rune detonates under your feet!'},
  trapdoor:{name:'trapdoor', dmg:[6,9], col:'#140a10', text:'The floor collapses beneath you!', fall:true},
};
// which hidden traps a floor can hold: deeper floors add worse ones (a trapdoor never sits on a boss floor, so no one falls past a boss)
function xTrapKinds(depth){ const k=['spike','spike','dart','dart'];
  if(depth>=2) k.push('fire','pit'); if(depth>=3) k.push('alarm','blocks'); if(depth>=4) k.push('explosive','fire'); if(depth>=5&&!isBossDepth(depth)) k.push('trapdoor');
  return k; }
let EX=null, X3=null;
const xi=(x,y)=>y*XN+x, xcx=i=>i%XN, xcy=i=>(i/XN)|0;
const xw=i=>(xcx(i)+.5)*XCS, xz=i=>(xcy(i)+.5)*XCS;
const xcell=(x,z)=>{ const cx=Math.floor(x/XCS), cy=Math.floor(z/XCS); return cx<0||cy<0||cx>=XN||cy>=XN?-1:xi(cx,cy); };
// your max HP: 120 plus gear and blessings (gear.js), less a fifth while a curse totem's curse is on you (dungeon.js)
const xmaxHp=()=>Math.round((120+((typeof gearMods==='function'&&gearMods(save).hp)||0))*(EX&&EX.ail&&EX.ail.curse?.8:1));

/* ---------------- the floor plan ----------------
   Main rooms joined in a chain by L-shaped corridors, plus a few extra corridors (some behind
   secret doors). Side rooms hang off the main rooms, each behind one kind of door: the hidden
   closet behind a secret door, a vault behind a silver or gold lock, a prison cell behind a
   bronze lock. A plan (dungeon.js) can also ask for bronze-locked doors on the main rooms, a
   shortcut gate from the stairs up toward the stairs down, and a boss door on a boss floor.
   Rules that keep every floor playable: the stairs down can always be reached from the stairs
   up with no key at all, every main room that is not behind a planned lock is reachable, and a
   lock only ever shuts off at most two rooms. */
function genFloor(depth,plan){
  const seed=t=>caveRng((Date.now()&0xffffff)^(depth*7919)^(t*104729));
  for(let tries=0;tries<120;tries++){ const f=tryFloor(depth,seed(tries),plan); if(f) return f; }
  // a plan too crowded for the dice: keep only the closet, then nothing extra
  for(let tries=0;tries<200;tries++){ const f=tryFloor(depth,seed(500+tries),{side:[{kind:'closet',lock:'secret'}]}); if(f) return f; }
  for(let tries=0;;tries++){ const f=tryFloor(depth,seed(900+tries),{side:[]}); if(f) return f; }
}
const xAdj4=i=>{ const x=xcx(i), y=xcy(i); return [x>0?i-1:-1, x<XN-1?i+1:-1, y>0?i-XN:-1, y<XN-1?i+XN:-1].filter(n=>n>=0); };
function tryFloor(depth,R,plan){
  plan=plan||{};
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const t=new Uint8Array(XN*XN), room=new Int16Array(XN*XN).fill(-1), rooms=[];
  const free=(x,y,w,h,m)=>!rooms.some(r=>x<r.x+r.w+m&&x+w+m>r.x&&y<r.y+r.h+m&&y+h+m>r.y);
  const want=plan.small?6:10;
  for(let k=0;k<400&&rooms.length<want;k++){ const w=ri(5,10), h=ri(4,8), x=ri(2,XN-w-3), y=ri(2,XN-h-3);
    if(free(x,y,w,h,4)) rooms.push({x,y,w,h,lit:R()<.68}); }
  if(rooms.length<(plan.small?4:6)) return null;
  rooms.sort((a,b)=>(a.x+a.w/2)-(b.x+b.w/2));
  // side rooms: the closet (secret door), a vault (silver or gold lock), a prison cell (bronze lock)
  const sides=plan.side||[{kind:'closet',lock:'secret'}];
  for(const sd of sides){ const w=sd.w||3, h=sd.h||3;
    for(let k=0;k<200;k++){ const x=ri(2,XN-w-3), y=ri(2,XN-h-3); if(free(x,y,w,h,3)){ rooms.push({x,y,w,h,lit:sd.kind==='cell',side:sd.kind,lock:sd.lock,content:sd.content||null,closet:sd.kind==='closet'}); break; } } }
  if(sides.some(sd=>sd.kind==='closet')&&!rooms.some(r=>r.closet)) return null;
  rooms.forEach((r,id)=>{ r.id=id; r.cx=r.x+(r.w>>1); r.cy=r.y+(r.h>>1);
    for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++){ t[xi(i,j)]=T_FLOOR; room[xi(i,j)]=id; } });
  const doors=new Map();
  // an L-shaped corridor between two room centres; the cells where it leaves a room become doors.
  // A secret door is only ever placed on newly dug rock, so it never blocks another corridor.
  const carve=(a,b,secretAt)=>{
    let x=a.cx, y=a.cy; const path=[[x,y]];
    const step=(tx,ty)=>{ while(x!==tx){ x+=Math.sign(tx-x); path.push([x,y]); } while(y!==ty){ y+=Math.sign(ty-y); path.push([x,y]); } };
    if(R()<.5){ step(b.cx,y); step(b.cx,b.cy); } else { step(x,b.cy); step(b.cx,b.cy); }
    const dug=new Set();
    for(const [px,py] of path){ const i=xi(px,py); if(t[i]===T_ROCK){ t[i]=T_FLOOR; dug.add(i); } }
    for(let k=1;k<path.length;k++){ const pi=xi(...path[k-1]), ci=xi(...path[k]);
      const mk=(i,r)=>{ if(room[i]>=0||doors.has(i)) return;
        const secret=secretAt&&r===secretAt.id&&dug.has(i);
        doors.set(i,{state:secret?'secret':R()<.3?'closed':'open'}); t[i]=T_DOOR; };
      if(room[pi]>=0&&room[ci]<0) mk(ci,room[pi]); if(room[pi]<0&&room[ci]>=0) mk(pi,room[ci]); }
  };
  const main=rooms.filter(r=>!r.side), sideRooms=rooms.filter(r=>r.side);
  for(let k=1;k<main.length;k++) carve(main[k-1],main[k],null);
  for(let n=0;n<2;n++){ const a=pick(main), b=pick(main); if(a!==b) carve(a,b,R()<.6?b:null); }
  for(const s of sideRooms){ const near=main.slice().sort((p,q)=>Math.hypot(p.cx-s.cx,p.cy-s.cy)-Math.hypot(q.cx-s.cx,q.cy-s.cy))[0]; carve(s,near,null); }
  // a shortcut: one more corridor from the first room toward the far end of the floor
  const startI=xi(main[0].cx,main[0].cy);
  let gateDoors=null;
  if(plan.gate){ const d0=xbfs(t,doors,startI,false); let far=null, fd=-1; for(const r of main){ const d=d0[xi(r.cx,r.cy)]; if(d>fd){ fd=d; far=r; } }
    if(far&&far!==main[0]){ const before=new Set(doors.keys()); carve(main[0],far,null); gateDoors=[...doors.keys()].filter(i=>!before.has(i)); } }
  // corridors that clip a room corner can leave doors with no wall either side; keep only real doorways
  for(const [i] of doors){ const x=xcx(i), y=xcy(i), open=d=>t[d]!==T_ROCK;
    const ew=open(xi(x-1,y))&&open(xi(x+1,y)), ns=open(xi(x,y-1))&&open(xi(x,y+1));
    if(ew===ns){ doors.delete(i); t[i]=T_FLOOR; } }
  main[0].lit=true;   // you always arrive somewhere you can see
  const touching=(i,r)=>xAdj4(i).some(c=>room[c]===r.id);
  // seal each side room behind its kind of door; one that cannot be sealed (a corridor runs
  // straight into it) becomes an ordinary nook, except the closet, which must stay hidden
  for(let pass=0;pass<2;pass++) for(const s of sideRooms){ if(!s.side) continue; let n=0;
    for(const [i,d] of doors) if(touching(i,s)){ n++; if(s.lock==='secret'){ d.state='secret'; d.lock=null; } else { d.state='locked'; d.lock=s.lock; } }
    if(n&&xbfs(t,doors,startI,false)[xi(s.cx,s.cy)]<0) continue;
    if(s.closet) return null;
    for(const [i,d] of doors) if(touching(i,s)&&d.lock===s.lock){ d.state='closed'; d.lock=null; }
    s.side=null; s.nook=true; s.content=null; }
  // every main room must be reachable before any planned lock goes on
  const all=xbfs(t,doors,startI,false); if(main.some(r=>all[xi(r.cx,r.cy)]<0)) return null;
  const start=main[0];
  let exit=main[main.length-1], far=-1; for(const r of main){ const d=all[xi(r.cx,r.cy)]; if(d>far){ far=d; exit=r; } }
  if(far<(plan.small?14:22)) return null;
  const exitI=xi(exit.cx,exit.cy), reach=()=>xbfs(t,doors,startI,false);
  // bronze-locked doors on the main rooms: never on the way to the stairs down, at most two rooms behind each
  let locks=0;
  if(plan.locks){ const cand=[...doors].filter(([i,d])=>(d.state==='open'||d.state==='closed')&&!touching(i,start)&&!touching(i,exit)&&!sideRooms.some(s=>touching(i,s))).sort(()=>R()-.5);
    for(const [i,d] of cand){ if(locks>=plan.locks) break; const prev=d.state; d.state='locked'; d.lock='bronze';
      const dd=reach(), cut=main.filter(r=>dd[xi(r.cx,r.cy)]<0);
      if(dd[exitI]<0||cut.length>2){ d.state=prev; d.lock=null; continue; }
      locks++; cut.forEach(r=>r.behind='bronze'); } }
  // the shortcut gate: the new corridor's door out of the first room, worth having only if it saves real walking
  let gate=null;
  if(gateDoors){ const g=gateDoors.find(i=>doors.has(i)&&touching(i,start)&&doors.get(i).state!=='secret');
    if(g!=null){ const d=doors.get(g), prev=d.state; d.state='open'; const open=reach()[exitI]; d.state='locked'; d.lock='gate'; const shut=reach()[exitI];
      const side=xAdj4(g).find(c=>t[c]!==T_ROCK&&room[c]!==start.id);
      const lever=side!=null&&xAdj4(side).find(c=>t[c]===T_ROCK&&!doors.has(c));
      if(shut<0||open<0||shut-open<6||lever==null||lever===false){ d.state=prev==='locked'?'closed':prev; d.lock=null; }
      else if(main.some(r=>!r.behind&&reach()[xi(r.cx,r.cy)]<0)){ d.state=prev==='locked'?'closed':prev; d.lock=null; }   // a gate may not cut a room off
      else gate={cell:g, side, lever, saves:shut-open}; } }
  // the boss door: every way into the boss's room needs the floor's boss key
  let bossDoor=false;
  if(plan.bossDoor){ const ds=[...doors].filter(([i,d])=>touching(i,exit)&&d.state!=='secret');
    const keep=ds.map(([i,d])=>[d,d.state,d.lock]); ds.forEach(([i,d])=>{ d.state='locked'; d.lock='boss'; });
    const dd=reach(), lost=main.filter(r=>r!==exit&&!r.behind&&dd[xi(r.cx,r.cy)]<0);
    if(ds.length&&dd[exitI]<0&&!lost.length) bossDoor=true; else keep.forEach(([d,st,lk])=>{ d.state=st; d.lock=lk; }); }
  return {t,room,rooms,doors,start,exit,gate,bossDoor};
}
// breadth-first distances; secret and locked doors block; `seenOnly` limits it to explored cells
function xbfs(t,doors,s,seenOnly,blockFn){
  const d=new Int16Array(XN*XN).fill(-1), q=[s]; d[s]=0;
  for(let h=0;h<q.length;h++){ const c=q[h], x=xcx(c), y=xcy(c);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=XN||ny>=XN) continue; const n=xi(nx,ny);
      if(d[n]>=0||t[n]===T_ROCK) continue; const dr=doors.get(n); if(dr&&(dr.state==='secret'||dr.state==='locked')) continue;
      if(seenOnly&&!seenOnly[n]) continue; if(blockFn&&blockFn(n)) continue; d[n]=d[c]+1; q.push(n); } }
  return d;
}

/* ---------------- a new floor ----------------
   dungeon.js plans what a floor holds before it is dug (side rooms, locks, the gate, the boss
   door), gives some rooms a role (merchant, sanctuary, puzzle, lair) and fills them afterwards
   with people, puzzles, keys and secrets. The rooms without a role get chests, traps and enemies. */
function buildFloor(depth,hp,opt){
  opt=opt||{};
  const plan=typeof xFloorPlan==='function'?xFloorPlan(depth,opt):null;
  const F=genFloor(depth,plan), A=areaOf(depth);
  EX=Object.assign({depth, area:A, hp:hp==null?xmaxHp():hp, vis:new Uint8Array(XN*XN), seen:new Uint8Array(XN*XN),
    chests:[], traps:[], groups:[], log:[], action:null, stuckT:0, regenT:0, active:false, busy:false, path:[], msgT:{}, bossDead:false,
    plan, branch:!!opt.branch, props:[], items:[], propAt:new Map(), wallAt:new Map(), itemAt:new Map(), safe:new Set(), clock:0, stillT:0, sight:0, ail:{poison:0,curse:0}}, F);
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const cellIn=r=>xi(r.x+ri(0,r.w-1), r.y+ri(0,r.h-1));
  const taken=new Set([xi(F.start.cx,F.start.cy), xi(F.exit.cx,F.exit.cy)]);
  const freeCell=r=>{ for(let k=0;k<30;k++){ const c=cellIn(r); if(!taken.has(c)){ taken.add(c); return c; } } return -1; };
  EX.up=xi(F.start.cx,F.start.cy); EX.down=xi(F.exit.cx,F.exit.cy); EX.taken=taken;
  if(typeof xAssignRooms==='function') xAssignRooms();
  const others=F.rooms.filter(r=>r!==F.start&&!r.side&&!r.nook), open=others.filter(r=>!r.role);
  // chests: about every other ordinary room, sometimes trapped (side rooms are filled by dungeon.js)
  for(const r of open) if(Math.random()<.5){ const c=freeCell(r); if(c>=0) EX.chests.push({cell:c, open:false, trap:Math.random()<.22, trapKnown:false}); }
  if(typeof xFloorPlan!=='function'){ const cl=F.rooms.find(r=>r.closet); if(cl){ const c=xi(cl.cx,cl.cy); taken.add(c); EX.chests.push({cell:c, open:false, trap:false, trapKnown:false, rich:true}); } }
  // hidden traps in ordinary rooms and corridors, never on the stairs or in the first room; deeper floors hold more and worse
  const kinds=typeof xTrapKinds==='function'?xTrapKinds(depth):['spike','spike','dart','dart','fire','pit','alarm'];
  const quiet=i=>{ const r=F.room[i]; return r>=0&&(F.rooms[r]===F.start||F.rooms[r].role||F.rooms[r].side); };
  const floorCells=[]; for(let i=0;i<XN*XN;i++) if(F.t[i]===T_FLOOR&&!quiet(i)&&!taken.has(i)) floorCells.push(i);
  const nT=Math.min(14,3+Math.floor(depth*.6))-(opt.branch?2:0);
  for(let n=0;n<nT&&floorCells.length;n++){ const c=floorCells.splice(Math.floor(Math.random()*floorCells.length),1)[0]; taken.add(c); EX.traps.push({cell:c, kind:pick(kinds), known:false, armed:true}); }
  // enemy groups: some asleep, some wandering; on a boss depth the boss waits by the stairs down
  const nG=Math.min(open.length,(opt.branch?1:3)+Math.floor(depth/3));
  const rooms=open.slice().sort(()=>Math.random()-.5).filter(r=>r!==F.exit||!isBossDepth(depth)).slice(0,nG);
  for(const r of rooms){ const c=freeCell(r); if(c<0) continue; const wave=makeEncounter(depth)[0], ids=wave.slice(0,1+Math.floor(Math.random()*Math.min(3,wave.length)));
    EX.groups.push(xGroup(ids,c,Math.random()<.45?'sleep':'wander')); }
  if(isBossDepth(depth)&&!opt.branch){ const c=xi(F.exit.cx-1,F.exit.cy); taken.add(c); EX.groups.push(Object.assign(xGroup([bossFor(depth)],c,'guard'),{boss:true})); }
  EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.pc=EX.up; EX.face=1; EX.view='front';
  if(typeof xPopulate==='function') xPopulate();
  xBuildScene(); xUpdateVis();
  xLog('Depth '+depth+' · '+(opt.branch?'Hidden Sanctum':areaLabel(depth))+'. Find the stairs down.','dim');
  if(isBossDepth(depth)&&!opt.branch) xLog(ENEMY_DEFS[bossFor(depth)].name+' guards the stairs down. Beat it to open the way to '+areaOf(depth+1).name+'.','warn');
  if(typeof xArrival==='function') xArrival();
}
function xGroup(ids,cell,state){ return {ids, cell, x:xw(cell), z:xz(cell), head:Math.random()*Math.PI*2, state, home:cell, path:[], repath:0, lostT:0, wakeT:1+Math.random()*1.5, seen:false, sprite:null, mark:null, bob:Math.random()*6}; }

/* ---------------- line of sight ---------------- */
const xPassable=i=>{ if(i<0||EX.t[i]===T_ROCK) return false; const d=EX.doors.get(i); return !(d&&d.state==='secret'); };   // locked doors are handled by xBump
const xClear=i=>{ if(i<0||EX.t[i]===T_ROCK) return false; const d=EX.doors.get(i); return !d||d.state==='open'; };
function xLos(a,b){ let x0=xcx(a), y0=xcy(a); const x1=xcx(b), y1=xcy(b), dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let e=dx+dy;
  while(true){ if(x0===x1&&y0===y1) return true; const i=xi(x0,y0); if(i!==a&&!xClear(i)) return false;
    const e2=2*e; if(e2>=dy){ e+=dy; x0+=sx; } if(e2<=dx){ e+=dx; y0+=sy; } } }
function xUpdateVis(){
  const v=EX.vis; v.fill(0); const pc=EX.pc;
  const lightRoom=r=>{ for(let y=r.y-1;y<=r.y+r.h;y++) for(let x=r.x-1;x<=r.x+r.w;x++) v[xi(x,y)]=1; };
  const here=EX.room[pc]; let rad=1.6;
  if(here>=0){ const r=EX.rooms[here]; if(r.lit){ lightRoom(r); rad=7; } else rad=2.6; }
  if(EX.t[pc]===T_DOOR) for(const n of [pc-1,pc+1,pc-XN,pc+XN]){ const r=EX.room[n]; if(r>=0&&EX.rooms[r].lit&&EX.doors.get(pc).state==='open') lightRoom(EX.rooms[r]); }
  rad+=((save&&save.perm&&save.perm.insight)||0)+(EX.sight||0);   // Insight blessings and lantern oil
  const R=Math.ceil(rad), x=xcx(pc), y=xcy(pc);
  for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=XN||ny>=XN||dx*dx+dy*dy>rad*rad) continue; const i=xi(nx,ny); if(xLos(pc,i)) v[i]=1; }
  // a lit room's light shows in it from the doorway, but its walls only from inside; you never see through rock
  for(let i=0;i<v.length;i++) if(v[i]) EX.seen[i]=1;
  xPaintCells();
}

/* ---------------- 3D scene ---------------- */
function xInit3D(){
  if(X3) return X3;
  const cv=$('#xView'), renderer=new THREE.WebGLRenderer({canvas:cv, antialias:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#050608');
  const cam=new THREE.PerspectiveCamera(46,1,.1,200);
  const amb=new THREE.AmbientLight(0xffffff,.34), sun=new THREE.DirectionalLight(0xffffff,.3); sun.position.set(-4,10,6);
  const lamp=new THREE.PointLight(0xffd9a0,1.6,16,1.4);   // your light: a soft pool that falls off with distance
  scene.add(amb,sun,lamp);
  // dust drifting through the light around you, in the area's glow, as in the battle cave
  const DN=70, dpos=new Float32Array(DN*3); for(let k=0;k<DN;k++){ dpos[k*3]=(Math.random()-.5)*20; dpos[k*3+1]=Math.random()*3.2; dpos[k*3+2]=(Math.random()-.5)*16; }
  const dgeo=new THREE.BufferGeometry(); dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
  const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:0xffffff,size:.08,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
  dust.renderOrder=3; scene.add(dust);
  X3={renderer,scene,cam,amb,lamp,dust,group:null,ray:new THREE.Raycaster(),plane:new THREE.Plane(new THREE.Vector3(0,1,0),0)};
  // the search reticle: a ring as wide as the area a search covers, with a cross at its heart
  const rm=new THREE.MeshBasicMaterial({color:0x7fe3ff,transparent:true,opacity:.9,depthTest:false}), ret=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(XCS*2.3,XCS*2.5,40),rm); ring.rotation.x=-Math.PI/2; ret.add(ring);
  for(const [w,d] of [[XCS*1.2,.14],[.14,XCS*1.2]]){ const b=new THREE.Mesh(new THREE.PlaneGeometry(w,d),rm); b.rotation.x=-Math.PI/2; ret.add(b); }
  ret.renderOrder=6; ret.traverse(o=>o.renderOrder=6); ret.visible=false; scene.add(ret); X3.reticle=ret;
  cv.addEventListener('pointerdown',e=>{ if(!EX||!EX.active||xPaused) return; e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    const [ax,ay]=appXY(e.clientX,e.clientY);
    if(EX.aim){ EX.aim.id=e.pointerId; EX.aim.cell=xAimCell(ax,ay); return; }
    XHOLD.id=e.pointerId; XHOLD.x=XHOLD.x0=ax; XHOLD.y=XHOLD.y0=ay; XHOLD.t0=performance.now(); XHOLD.on=true; });
  cv.addEventListener('pointermove',e=>{ if(EX&&EX.aim&&e.pointerId===EX.aim.id){ const [ax,ay]=appXY(e.clientX,e.clientY); EX.aim.cell=xAimCell(ax,ay); return; }
    if(e.pointerId===XHOLD.id){ [XHOLD.x,XHOLD.y]=appXY(e.clientX,e.clientY); } });
  const end=e=>{ if(EX&&EX.aim&&e.pointerId===EX.aim.id) return xSearchAt(EX.aim.cell);
    if(e.pointerId!==XHOLD.id) return; const tap=performance.now()-XHOLD.t0<260&&Math.hypot(XHOLD.x-XHOLD.x0,XHOLD.y-XHOLD.y0)<14;
    XHOLD.on=false; XHOLD.id=null; if(tap) xTap(e); };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',e=>{ XHOLD.on=false; XHOLD.id=null; });
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  // hold a finger on the minimap to see it big; let go to shrink it back
  const mm=$('#xMini'); let mmT=0;
  const mmOff=()=>{ clearTimeout(mmT); mm.classList.remove('big'); };
  mm.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ mm.setPointerCapture(e.pointerId); }catch(_){} clearTimeout(mmT); mmT=setTimeout(()=>{ if(EX) xMini(); mm.classList.add('big'); },250); });
  mm.addEventListener('pointerup',mmOff); mm.addEventListener('pointercancel',mmOff); mm.addEventListener('contextmenu',e=>e.preventDefault());
  return X3;
}
function xTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
const xPhong=(o)=>new THREE.MeshPhongMaterial(Object.assign({shininess:4,specular:0x111111},o||{}));
/* Stone, drawn once per area from its `stone` look in world.js: periodic noise so big textures tile without seams, quantized to a
   few tones so it still reads as pixel art. Corridors are raw rock; rooms are cut stone in one
   of two patterns; walls are rough rock along corridors and chiseled blocks around rooms. */
function xNoise(N,cells,R){ const g=new Float32Array(cells*cells).map(()=>R());
  const at=(x,y)=>g[((y%cells+cells)%cells)*cells+((x%cells+cells)%cells)], sm=t=>t*t*(3-2*t);
  return (px,py)=>{ const fx=px/N*cells, fy=py/N*cells, x0=Math.floor(fx), y0=Math.floor(fy), tx=sm(fx-x0), ty=sm(fy-y0);
    return (at(x0,y0)*(1-tx)+at(x0+1,y0)*tx)*(1-ty)+(at(x0,y0+1)*(1-tx)+at(x0+1,y0+1)*tx)*ty; }; }
function xFbm(N,R,base){ const o=[base,base*2,base*4,base*8].map(c=>xNoise(N,c,R)); return (x,y)=>o[0](x,y)*.5+o[1](x,y)*.25+o[2](x,y)*.15+o[3](x,y)*.1; }
const xHexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function xPaint(N,fn){ const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const v=fn(i,j), o=(j*N+i)*4; im.data[o]=v[0]; im.data[o+1]=v[1]; im.data[o+2]=v[2]; im.data[o+3]=255; }
  x.putImageData(im,0,0); return c; }
const xTone=(S,t)=>{ const r=S.rock, k=Math.max(0,Math.min(r.length-1.001,t*(r.length-1))), i=Math.floor(k); return xHexRGB(r[i]).map((v,n)=>Math.round(v+(xHexRGB(r[i+1])[n]-v)*(k-i>.5?1:0))); };
function xSpeck(c,S,R,n,small){ const x=c.getContext('2d'), N=c.width;
  for(let k=0;k<n;k++){ const cx=R()*N|0, cy=R()*N|0;
    if(S.detail==='moss'){ x.fillStyle=S.moss; for(let m=0;m<7;m++) x.fillRect((cx+R()*6-3)%N|0,(cy+R()*4-2)%N|0,1,1); if(R()<.3){ x.fillStyle=S.spark; x.fillRect(cx,cy,1,1); } }
    else if(S.detail==='frost'){ x.fillStyle=S.moss; x.globalAlpha=.5; let px=cx, py=cy; for(let m=0;m<8;m++){ x.fillRect(px|0,py|0,1,1); px+=R()*2-.5; py+=R()*2-1; } x.globalAlpha=1; }
    else if(S.detail==='embers'){ x.fillStyle=S.spark; let px=cx, py=cy; for(let m=0;m<6;m++){ x.globalAlpha=.35+R()*.4; x.fillRect(px|0,py|0,1,1); px+=R()*2-1; py+=R()*2-1; } x.globalAlpha=1; }
    else if(S.detail==='gold'){ if(R()<.4){ x.fillStyle=S.spark; x.globalAlpha=.6; x.fillRect(cx,cy,small?1:2,1); x.globalAlpha=1; } }
    else { x.fillStyle=R()<.5?S.spark:S.moss; x.globalAlpha=.3+R()*.5; x.fillRect(cx,cy,1,1); x.globalAlpha=1; } } }
// raw cave rock: blotchy fbm, a few ridged cracks, pebbles with a lit top and a shadow
function xRockFloor(S,seed){ const N=256, R=caveRng(seed), f=xFbm(N,R,4), cr=xNoise(N,12,R), cr2=xNoise(N,7,R);
  const c=xPaint(N,(i,j)=>{ let t=f(i,j)*1.25-.12; const k=Math.abs(cr(i,j)-.5), k2=Math.abs(cr2(i,j)-.5);
    if(k<.012||k2<.008) t-=.35; else if(k<.03) t+=.06; return xTone(S,Math.max(0,Math.min(1,t))); });
  const x=c.getContext('2d');
  for(let n=0;n<90;n++){ const px=R()*N|0, py=R()*N|0, w=1+R()*3|0, h=1+R()*2|0, tt=.5+R()*.4;
    x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(px+1,py+1,w,h); x.fillStyle='rgb('+xTone(S,tt).join(',')+')'; x.fillRect(px,py,w,h); x.fillStyle='rgb('+xTone(S,1).join(',')+')'; x.fillRect(px,py,w,1); }
  xSpeck(c,S,R,40); return c; }
// cut stone: irregular slabs in staggered rows (style 0) or a tighter running bond of smaller tiles (style 1)
function xSlabFloor(S,seed,style){ const N=256, R=caveRng(seed), f=xFbm(N,R,8), id=new Int16Array(N*N), edge=new Uint8Array(N*N), tone=[];
  const rowsH=[]; let y=0; while(y<N){ const h=style?16:(20+R()*20|0); rowsH.push([y,Math.min(h,N-y)]); y+=h; }
  let sid=0;
  for(const [y0,h] of rowsH){ const off=R()*N|0; let x0=0; while(x0<N){ const w=style?32:(26+R()*40|0), ww=Math.min(w,N-x0);
      for(let j=y0;j<y0+h;j++) for(let i=x0;i<x0+ww;i++){ const X=(i+off)%N; id[j*N+X]=sid;
        edge[j*N+X]=(j===y0?1:0)|(j===y0+h-1?2:0)|(i===x0?4:0)|(i===x0+ww-1?8:0); }
      tone.push(.35+R()*.35); sid++; x0+=ww; } }
  const c=xPaint(N,(i,j)=>{ const k=j*N+i, e=edge[k]; let t=tone[id[k]]+(f(i,j)-.5)*.35;
    if(e&(2|8)) t=.05; else if(e&(1|4)) t=Math.min(1,t+.28); return xTone(S,Math.max(0,Math.min(1,t))); });
  const x=c.getContext('2d');
  for(let n=0;n<26;n++){ let px=R()*N, py=R()*N, a=R()*6.3; x.fillStyle='rgba(0,0,0,.55)'; for(let m=0;m<6+R()*12;m++){ x.fillRect(px|0,py|0,1,1); a+=(R()-.5); px+=Math.cos(a); py+=Math.sin(a); } }
  xSpeck(c,S,R,style?18:26,true); return c; }
// walls: rough rock with strata (corridors), large ashlar blocks or small rubble stones (rooms)
function xRockWall(S,seed){ const N=64, R=caveRng(seed), f=xFbm(N,R,2), st=xNoise(N,4,R);
  return xPaint(N,(i,j)=>{ let t=f(i,j)*1.1-.05+Math.sin((j+st(i,j)*14)*.55)*.08; if(j<2) t+=.3; return xTone(S,Math.max(0,Math.min(1,t))); }); }
function xBlockWall(S,seed,rubble){ const N=64, R=caveRng(seed), f=xFbm(N,R,4);
  const rows=rubble?[0,9,18,27,36,45,54]:[0,16,32,48], H=rubble?9:16, out=new Float32Array(N*N).fill(-1);
  rows.forEach((y0,r)=>{ let x0=-(R()*20|0); while(x0<N){ const w=rubble?(8+R()*10|0):(18+R()*22|0), tn=.3+R()*.4;
      for(let j=y0;j<Math.min(N,y0+H);j++) for(let i=Math.max(0,x0);i<Math.min(N,x0+w);i++){ const e=j===y0||i===x0?.3:j===y0+H-1||i===x0+w-1?-1:0; out[j*N+i]=e<0?.04:tn+e; }
      x0+=w; } });
  return xPaint(N,(i,j)=>{ const b=out[j*N+i]; let t=b<0?.05:b+(f(i,j)-.5)*.25; if(j<2) t+=.25; return xTone(S,Math.max(0,Math.min(1,t))); }); }
function xTextSprite(txt,col){ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d');
  x.font='700 22px "Pixelify Sans",monospace'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=4; x.strokeStyle='#000'; x.strokeText(txt,16,17); x.fillStyle=col; x.fillText(txt,16,17);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:xTex(c),transparent:true,depthTest:false})); s.scale.set(.9,.9,1); s.renderOrder=5; return s; }
function xSprite(getImg,h){ const s=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,alphaTest:.35})); s.center.set(.5,.03); s.scale.set(h,h,1); s.userData={getImg,img:null,flip:false}; return s; }
// swap a sprite's picture (an animation frame, or facing the other way); each picture's texture is made once and kept
function xRefresh(s,flip){ const sp=s.userData.getImg(), im=sp&&sp.img; if(sp&&sp.front) flip=false;
  if(im&&(im!==s.userData.img||flip!==s.userData.flip)){ s.userData.img=im; s.userData.flip=flip;
    const cache=s.userData.tex||(s.userData.tex=new Map()), key=im; let pair=cache.get(key);
    if(!pair){ const a=xTex(im,true), b=xTex(im,true); b.repeat.x=-1; b.offset.x=1; pair=[a,b]; cache.set(key,pair); }
    s.material.map=pair[flip?1:0]; s.material.needsUpdate=true; } }
const xMat=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:6,specular:0x111111},o||{}));
const xBox=(w,h,d,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); return o; };

function xBuildScene(){
  const G=xInit3D();
  if(G.group){ G.scene.remove(G.group); G.group.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material&&o.material.map) o.material.map.dispose(); }); }
  const grp=new THREE.Group(); G.group=grp; G.scene.add(grp);
  const A=EX.area, S=A.stone||AREAS[0].stone, seed=EX.depth*31;
  // floor: one plane per stone kind, cut to its cells with a mask, so textures run across cells without seams
  const variant=new Int8Array(XN*XN).fill(-1);
  EX.rooms.forEach(r=>{ r.style=r.closet?1:Math.random()<.5?0:1; });
  for(let i=0;i<XN*XN;i++) if(EX.t[i]!==T_ROCK) variant[i]=EX.room[i]>=0?1+EX.rooms[EX.room[i]].style:0;
  const span=XN*XCS, texCells=8, mk=(i,v)=>variant[i]===v?255:0;
  const floorTex=[xRockFloor(S,seed+1),xSlabFloor(S,seed+2,0),xSlabFloor(S,seed+3,1)];
  floorTex.forEach((cv,v)=>{ const pos=[], uv=[], k=texCells*XCS;
    for(let i=0;i<XN*XN;i++){ if(variant[i]!==v) continue; const x0=xcx(i)*XCS, z0=xcy(i)*XCS, x1=x0+XCS, z1=z0+XCS;
      pos.push(x0,0,z0, x0,0,z1, x1,0,z1,  x0,0,z0, x1,0,z1, x1,0,z0);
      uv.push(x0/k,-z0/k, x0/k,-z1/k, x1/k,-z1/k,  x0/k,-z0/k, x1/k,-z1/k, x1/k,-z0/k); }
    if(!pos.length) return;
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.computeVertexNormals();
    grp.add(new THREE.Mesh(geo,xPhong({map:xTex(cv,true)}))); });
  // darkness: a black veil over the floor whose alpha comes from a per-cell light map with linear
  // filtering, so light fades smoothly from cell to cell instead of cutting off
  EX.fog=new Uint8Array(XN*XN*4).fill(255); EX.fogCur=new Float32Array(XN*XN); EX.fogTgt=new Float32Array(XN*XN);
  const ft=new THREE.DataTexture(EX.fog,XN,XN,THREE.RGBAFormat); ft.magFilter=ft.minFilter=THREE.LinearFilter; ft.needsUpdate=true; EX.fogTex=ft;
  const veil=new THREE.Mesh(new THREE.PlaneGeometry(span,span),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,alphaMap:ft,depthWrite:false}));
  veil.rotation.x=-Math.PI/2; veil.position.set(span/2,.04,span/2); veil.renderOrder=1; grp.add(veil); EX.veil=veil;
  xFovMesh(grp);
  // walls: rough rock beside corridors, chiseled blocks (large or rubble) around rooms
  const walls=[[],[],[]];
  for(let i=0;i<XN*XN;i++){ const d=EX.doors.get(i); if(!(EX.t[i]===T_ROCK||(d&&d.state==='secret'))) continue;
    const x=xcx(i), y=xcy(i); let near=-1;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const nx=x+dx, ny=y+dy; if((dx||dy)&&nx>=0&&ny>=0&&nx<XN&&ny<XN){ const n=xi(nx,ny); if(EX.t[n]!==T_ROCK&&!(EX.doors.get(n)&&EX.doors.get(n).state==='secret')){ const r=EX.room[n]; near=Math.max(near,r>=0?1+EX.rooms[r].style:0); } } }
    if(near>=0) walls[near].push(i); }
  const wallTex=[xRockWall(S,seed+4),xBlockWall(S,seed+5,false),xBlockWall(S,seed+6,true)];
  EX.wIdx=new Map(); EX.wms=[]; EX.shown=new Uint8Array(XN*XN);
  const zero=new THREE.Matrix4().makeScale(0,0,0), black=new THREE.Color(0,0,0);
  walls.forEach((list,v)=>{ const wm=new THREE.InstancedMesh(new THREE.BoxGeometry(XCS,XWALL,XCS),xPhong({map:xTex(wallTex[v])}),Math.max(1,list.length));
    wm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(wm); EX.wms.push(wm);
    for(let k=0;k<wm.count;k++){ wm.setMatrixAt(k,zero); wm.setColorAt(k,black); }
    list.forEach((c,k)=>EX.wIdx.set(c,[wm,k])); });
  // doors: a frame on every doorway, a plank door while it is closed
  const wood=xMat(0x6a4426), iron=xMat(0x2a2a30), frame=xMat(0x3a2414);
  // a locked door shows its lock: a bronze, silver or gold plate, iron bars on a shortcut gate, red bands on a boss door
  const LOCK_COL={bronze:0xc8843a, silver:0xcfd8e6, gold:0xf2c94c, boss:0xff5d6c};
  for(const [i,d] of EX.doors){ const ew=EX.t[i-1]!==T_ROCK&&EX.t[i+1]!==T_ROCK, g=new THREE.Group(); g.position.set(xw(i),0,xz(i)); if(ew) g.rotation.y=Math.PI/2;
    g.add(xBox(.22,XWALL,.4,frame,-XCS/2+.11,XWALL/2,0), xBox(.22,XWALL,.4,frame,XCS/2-.11,XWALL/2,0), xBox(XCS,.22,.4,frame,0,XWALL-.11,0));
    const leaf=new THREE.Group();
    if(d.lock==='gate'){ for(let k=0;k<5;k++) leaf.add(xBox(.07,XWALL-.24,.07,iron,-.6+k*.3,(XWALL-.24)/2,0)); leaf.add(xBox(XCS-.44,.08,.09,iron,0,.5,0), xBox(XCS-.44,.08,.09,iron,0,1.2,0)); }
    else { leaf.add(xBox(XCS-.44,XWALL-.24,.16,d.lock==='boss'?xMat(0x3a1418):wood,0,(XWALL-.24)/2,0), xBox(XCS-.44,.1,.18,d.lock==='boss'?xMat(0xff5d6c,{emissive:0x401010}):iron,0,.4,0), xBox(XCS-.44,.1,.18,d.lock==='boss'?xMat(0xff5d6c,{emissive:0x401010}):iron,0,1.1,0));
      if(LOCK_COL[d.lock]) for(const zz of [-.1,.1]) leaf.add(xBox(.26,.32,.04,xMat(LOCK_COL[d.lock],{emissive:new THREE.Color(LOCK_COL[d.lock]).multiplyScalar(.25)}),.38,.78,zz)); }
    g.add(leaf); d.mesh=g; d.leaf=leaf; leaf.visible=d.state==='closed'||d.state==='locked'; g.visible=false; grp.add(g); }
  // stairs
  const glow=new THREE.Color(isBossDepth(EX.depth)?'#ff5d6c':A.glow);
  const down=new THREE.Group(); down.position.set(xw(EX.down),0,xz(EX.down));
  down.add(xBox(XCS*.8,.32,XCS*.8,xMat(0x050507),0,.02,0));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.75,.08,6,20),new THREE.MeshBasicMaterial({color:glow})); ring.rotation.x=Math.PI/2; ring.position.y=.2; down.add(ring);
  down.userData.ring=ring; down.visible=false; grp.add(down); EX.downMesh=down;
  // the way back up: a worn stone circle under a shaft of daylight
  const up=new THREE.Group(); up.position.set(xw(EX.up),0,xz(EX.up));
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.82,.88,.05,20),xMat(new THREE.Color(A.lit).lerp(new THREE.Color(0x8a8478),.5))); disc.position.y=.025; up.add(disc);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.72,.06,6,20),new THREE.MeshBasicMaterial({color:0xfff2c0})); halo.rotation.x=Math.PI/2; halo.position.y=.08; up.add(halo);
  up.visible=false; grp.add(up); EX.upMesh=up;
  // chests
  for(const c of EX.chests) grp.add(xChestMesh(c));
  // known traps get a plate when found
  for(const tr of EX.traps){ tr.mesh=null; tr.tell=null; if(tr.armed&&!tr.known) xTrapTell(tr,grp); }
  // the area's light: the same color as its battle cave, in the air, in your lamp and in the
  // crystals, lava, veins or motes along the room walls
  const glowC=new THREE.Color(A.glow);
  G.scene.background=new THREE.Color(A.fog).multiplyScalar(.3);
  G.amb.color.set(0xffffff).lerp(glowC,.25); G.lamp.color.set(0xffd9a0).lerp(glowC,.3); G.dust.material.color.copy(glowC);
  xAreaLights(grp,A);
  // you and the enemies are flat sprites standing in the 3D rooms, like the old dungeon crawlers
  // you are seen from behind and above, as in battle: the same four poses (stand, walk, cast, attack)
  EX.me=xSprite(()=>unitSprite({kind:'player',look:gearLook(save),view:EX.view||'front',pose:EX.pose||'idle'}),XSPR); grp.add(EX.me);
  for(const gp of EX.groups) xGroupSprites(gp,grp);
  if(typeof xBuildProps==='function') xBuildProps();   // people, puzzles, keys and the rest (dungeon.js)
}
// a chest: plain wood, a purple lid when rich, gold trim glowing on a legendary hoard
function xChestMesh(c){ const cwood=xMat(0x7a4a22), gold=xMat(0xf2c94c,{emissive:c.legend?0x806010:0x402a08});
  const g=new THREE.Group(); g.position.set(xw(c.cell),0,xz(c.cell)); g.rotation.y=(Math.random()-.5)*.6;
  g.add(xBox(1,.5,.66,cwood,0,.25,0), xBox(.12,.54,.7,gold,0,.27,0));
  const lid=new THREE.Group(); lid.position.set(0,.5,-.33); lid.add(xBox(1,.22,.66,c.rich?xMat(0x5a3a8a):cwood,0,.11,.33), xBox(.14,.24,.7,gold,0,.12,.33)); g.add(lid);
  if(c.open) lid.rotation.x=-1.9;
  g.userData.lid=lid; g.visible=false; c.mesh=g; return g; }
// a soft round glow, tinted by the sprite's color and added to what is behind it
function xGlowTex(){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(.35,'rgba(255,255,255,.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c); return t; }
/* Two or three light sources grow from the walls of every room, in the area's look (world.js):
   crystals (Hollows, Storm Vault), ice (Deeps), lava cracks (Rifts), gold veins (Ruins) or
   floating motes (Abyss). They show once you have seen the floor in front of them and dim with
   it, so a remembered room glows faintly and the room you stand in glows bright. */
function xAreaLights(grp,A){
  EX.glows=[]; const R=caveRng(EX.depth*53+7), tex=xGlowTex(), col=new THREE.Color(A.glow), pale=col.clone().lerp(new THREE.Color(0xffffff),.55);
  for(const r of EX.rooms){ if(r.side||r.nook) continue; const cand=[];
    for(let x=r.x;x<r.x+r.w;x++){ cand.push([x,r.y-1,0,1],[x,r.y+r.h,0,-1]); }
    for(let y=r.y;y<r.y+r.h;y++){ cand.push([r.x-1,y,1,0],[r.x+r.w,y,-1,0]); }
    const ok=cand.filter(([x,y])=>x>=0&&y>=0&&x<XN&&y<XN&&EX.t[xi(x,y)]===T_ROCK);
    const n=Math.min(ok.length,2+(R()*2|0));
    for(let k=0;k<n;k++){ const [wx,wy,dx,dy]=ok.splice(R()*ok.length|0,1)[0], floor=xi(wx+dx,wy+dy);
      const g=new THREE.Group(); g.position.set((wx+.5+dx*.5)*XCS+dx*.08,0,(wy+.5+dy*.5)*XCS+dy*.08); g.rotation.y=Math.atan2(dx,dy);
      const mats=[], mat=c=>{ const m=new THREE.MeshBasicMaterial({color:c,transparent:true}); mats.push(m); return m; };
      if(A.veins==='crystal'||A.veins==='ice'||A.veins==='storm'){
        for(let m=0;m<3;m++){ const h=.45+R()*.55, cone=new THREE.Mesh(new THREE.ConeGeometry(.09+R()*.05,h,4),mat(m===1?pale:col));
          cone.position.set((m-1)*.2+(R()-.5)*.08,h/2-.02,.06+R()*.1); cone.rotation.z=(m-1)*.35+(R()-.5)*.2; cone.rotation.x=.18; g.add(cone); } }
      else if(A.veins==='lava'){ for(let m=0;m<4;m++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(.5+R()*.6,.03,.07),mat(m%2?pale:col)); sl.position.set((R()-.5)*1.2,.02,.15+R()*.5); sl.rotation.y=(R()-.5)*1.4; g.add(sl); } }
      else if(A.veins==='gold'){ let x0=-.5, y0=.4; for(let m=0;m<4;m++){ const x1=x0+.25+R()*.15, y1=y0+(R()-.3)*.35, len=Math.hypot(x1-x0,y1-y0), v=new THREE.Mesh(new THREE.BoxGeometry(len,.05,.04),mat(m%2?pale:col));
          v.position.set((x0+x1)/2,(y0+y1)/2+.4,.02); v.rotation.z=Math.atan2(y1-y0,x1-x0); g.add(v); x0=x1; y0=y1; } }
      else { for(let m=0;m<4;m++){ const s=new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),mat(pale)); s.position.set((R()-.5)*1.1,.5+R()*1.1,.2+R()*.4); s.userData.y0=s.position.y; g.add(s); } }
      const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      halo.scale.set(2.6,2.6,1); halo.position.set(0,.55,.25); halo.renderOrder=2; g.add(halo);
      g.visible=false; grp.add(g); EX.glows.push({g,floor,mats,halo,ph:R()*6}); } }
}
function xGroupSprites(gp,grp){ const id=gp.ids[0], d=ENEMY_DEFS[id], h=XSPR*Math.max(.75,Math.min(1.7,d.scale||1));
  gp.sprite=xSprite(()=>unitSprite({kind:'enemy',id,color:d.color}),h); gp.sprite.visible=false; grp.add(gp.sprite);
  gp.zz=xTextSprite('z','#9fd8ff'); gp.bang=xTextSprite('!','#ff4d5e'); gp.zz.visible=gp.bang.visible=false; grp.add(gp.zz,gp.bang); gp.h=h;
  // a miniboss stands on a ring of its colour, so you know it for a big threat from afar
  if(gp.mini){ const r=new THREE.Mesh(new THREE.TorusGeometry(.95,.07,6,24),new THREE.MeshBasicMaterial({color:new THREE.Color(COLORS[d.color].c)})); r.rotation.x=Math.PI/2; r.position.y=.06; r.visible=false; grp.add(r); gp.ring=r; }
  // a mission's mark over the group: ♛ a bounty, ☠ a nest's brood (missions.js)
  if(gp.tagTxt){ gp.tag=(typeof xmTagSprite==='function'?xmTagSprite:xTextSprite)(gp.tagTxt,gp.tagCol||'#ffd166'); gp.tag.visible=false; grp.add(gp.tag); } }
function xPaintCells(){
  // brightness each cell is heading for: full near you and dimmer toward the edge of sight,
  // a low glow where you have been, black where you have not
  const px=xcx(EX.pc), py=xcy(EX.pc), here=EX.room[EX.pc], rad=here>=0&&EX.rooms[here].lit?9:4;
  const m=new THREE.Matrix4();
  for(let c=0;c<XN*XN;c++){ let b=0;
    if(EX.vis[c]){ const d=Math.hypot(xcx(c)-px,xcy(c)-py); b=1-.55*Math.min(1,Math.max(0,(d-1)/rad)); }
    else if(EX.seen[c]) b=.24;
    EX.fogTgt[c]=b;
    if(EX.seen[c]&&!EX.shown[c]){ EX.shown[c]=1; const w=EX.wIdx.get(c); if(w){ m.makeTranslation(xw(c),XWALL/2-.05,xz(c)); w[0].setMatrixAt(w[1],m); w[0].instanceMatrix.needsUpdate=true; } } }
  for(const [i,d] of EX.doors) if(d.mesh) d.mesh.visible=!!EX.seen[i]&&d.state!=='secret';
  for(const c of EX.chests) c.mesh.visible=!!EX.seen[c.cell];
  EX.downMesh.visible=!!EX.seen[EX.down]; EX.upMesh.visible=!!EX.seen[EX.up];
  for(const L of EX.glows) L.g.visible=!!EX.seen[L.floor];
  if(typeof xPaintExtra==='function') xPaintExtra();
}
// ease every cell toward its brightness, so newly seen ground fades in and ground you leave fades out
function xFadeCells(dt){
  const k=Math.min(1,dt*5), col=new THREE.Color(); let moved=false;
  for(let c=0;c<XN*XN;c++){ const cur=EX.fogCur[c], tg=EX.fogTgt[c]; if(Math.abs(cur-tg)<.004) continue; moved=true;
    const v=cur+(tg-cur)*k; EX.fogCur[c]=v; const y=XN-1-xcy(c), o=(y*XN+xcx(c))*4; EX.fog[o]=EX.fog[o+1]=EX.fog[o+2]=Math.round((1-v)*255);
    const w=EX.wIdx.get(c); if(w){ col.setRGB(v,v,v*1.05); w[0].setColorAt(w[1],col); w[0].instanceColor.needsUpdate=true; } }
  if(moved) EX.fogTex.needsUpdate=true;
}
/* Trap tells: a hidden trap is never shown, but it leaves small signs an attentive player can
   read. Its floor stone sits in a faint seam; spikes leave pin holes, runes give off a faint pulse
   of their colour now and then, pits and trapdoors have a darker, scuffed seam, falling blocks
   leave grit, and metal (spikes, darts, blocks) catches the lamp in a brief glint when you come
   within 3 tiles. Tells show only on cells in sight (the veil hides the rest) and go away once
   the trap is found or disarmed. Built from the floor's state, so kept floors and save points
   get them back. */
const XTELL={spike:{dots:5,glint:'#dfe6f0'}, dart:{glint:'#c8ffb8'}, fire:{rune:1}, explosive:{rune:1}, alarm:{rune:1}, pit:{dark:1}, trapdoor:{dark:1}, blocks:{grit:1,glint:'#d8d0e8'}};
function xTrapTell(tr,grp){ const T=TRAPS[tr.kind], K=XTELL[tr.kind]||{}, g=new THREE.Group(); g.position.set(xw(tr.cell),0,xz(tr.cell));
  const m=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false}), flat=(geo,mat,x,z,y)=>{ const o=new THREE.Mesh(geo,mat); o.rotation.x=-Math.PI/2; o.position.set(x||0,y||.012,z||0); g.add(o); return o; };
  // the seam: four thin dark strips round a stone a little smaller than the cell
  const s=XCS*.42, w=.035, seam=m(0x000000,K.dark?.32:.18);
  for(const [x,z,a,b] of [[0,-s,2*s,w],[0,s,2*s,w],[-s,0,w,2*s],[s,0,w,2*s]]) flat(new THREE.PlaneGeometry(a,b),seam,x,z);
  if(K.dark){ const sc=m(0x000000,.16); flat(new THREE.PlaneGeometry(.5,.03),sc,-.2,.25); flat(new THREE.PlaneGeometry(.35,.03),sc,.25,-.15); }
  if(K.dots){ const h=m(0x000000,.3); for(let k=0;k<K.dots;k++) flat(new THREE.CircleGeometry(.035,6),h,-.4+k*.2,(k%2-.5)*.4); }
  if(K.grit){ const gm=m(0xb8b0c8,.22); for(let k=0;k<7;k++) flat(new THREE.CircleGeometry(.025,5),gm,Math.sin(k*2.3)*.5,Math.cos(k*1.7)*.5); }
  if(K.rune){ const r=flat(new THREE.RingGeometry(.3,.34,16),m(new THREE.Color(T.col),0),0,0,.014); g.userData.rune=r; }
  if(K.glint){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:xGlowTex(),color:new THREE.Color(K.glint),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
    sp.scale.set(.32,.32,1); sp.position.set(.2,.08,-.1); g.add(sp); g.userData.glint=sp; }
  g.userData.ph=Math.random()*10; g.visible=false; grp.add(g); tr.tell=g; }
// each frame: show the tells you can see, pulse runes and flash glints
function xTellDraw(T){ for(const tr of EX.traps){ const g=tr.tell; if(!g) continue;
  const on=tr.armed&&!tr.known&&!!EX.vis[tr.cell]; g.visible=on; if(!on) continue;
  const near=Math.hypot(xw(tr.cell)-EX.px,xz(tr.cell)-EX.pz)/XCS<=3, ph=g.userData.ph, cyc=(T+ph)%4.5;
  if(g.userData.rune) g.userData.rune.material.opacity=cyc<.9?.16*Math.sin(cyc/.9*Math.PI):0;   // a faint breath of colour every few seconds
  if(g.userData.glint) g.userData.glint.material.opacity=near&&cyc>3.9&&cyc<4.15?.9*Math.sin((cyc-3.9)/.25*Math.PI):0; } }
function xTrapMesh(tr){ if(tr.mesh||!X3) return; if(tr.tell) tr.tell.visible=false; const T=TRAPS[tr.kind], g=new THREE.Group(); g.position.set(xw(tr.cell),0,xz(tr.cell));
  g.add(xBox(1.3,.06,1.3,xMat(new THREE.Color(T.col).multiplyScalar(.6)),0,.03,0));
  if(tr.kind==='spike') for(let k=0;k<5;k++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.1,.4,4),xMat(0xb8c0cc)); s.position.set(-.4+k*.2,.2,(k%2-.5)*.4); g.add(s); }
  else { const r=new THREE.Mesh(new THREE.TorusGeometry(.42,.06,4,12),new THREE.MeshBasicMaterial({color:T.col})); r.rotation.x=Math.PI/2; r.position.y=.08; g.add(r); }
  tr.mesh=g; X3.group.add(g); }

/* ---------------- input ---------------- */
const XKEY={}, XHOLD={on:false,id:null,x:0,y:0,x0:0,y0:0,t0:0};
// paused (ui.js): the floor stands still and keys and touches are let go
let xPaused=false;
function xPause(on){ xPaused=!!on; for(const k in XKEY) XKEY[k]=false; XHOLD.on=false; XHOLD.id=null; }
document.addEventListener('keydown',e=>{ if(!EX||!EX.active||xPaused) return; const k=e.key.toLowerCase(), a=keyAct(k,'map'); XKEY[k]=true;
  if(a==='search'){ if(EX.aim) xSearch(); else xSearchAt(EX.pc); } else if(a==='disarm') xDisarm(); else if(a==='camp') xToCamp();
  if(a||k===' '){ e.preventDefault(); } if(['up','down','left','right'].includes(a)) EX.path=[]; });
document.addEventListener('keyup',e=>{ XKEY[e.key.toLowerCase()]=false; });
function xTap(e){ if(!EX||!EX.active||EX.busy) return; const G=X3, r=appBox(e.target), [ex,ey]=appXY(e.clientX,e.clientY);
  const v=new THREE.Vector2((ex-r.left)/r.width*2-1,-(ey-r.top)/r.height*2+1), hit=new THREE.Vector3();
  G.ray.setFromCamera(v,G.cam); if(!G.ray.ray.intersectPlane(G.plane,hit)) return;
  const c=xcell(hit.x,hit.z); if(c<0||!EX.seen[c]) return;
  const goal=c, blocked=n=>xKnownTrap(n)||xChestAt(n)&&n!==goal||typeof xSolid==='function'&&xSolid(n)&&n!==goal;
  const d=xbfs(EX.t,EX.doors,goal,EX.seen,n=>blocked(n)&&n!==EX.pc);
  if(d[EX.pc]<0) return; const path=[]; let cur=EX.pc;
  while(cur!==goal){ const x=xcx(cur), y=xcy(cur); let best=-1;
    for(const n of [xi(x+1,y),xi(x-1,y),xi(x,y+1),xi(x,y-1)]) if(d[n]>=0&&d[n]<d[cur]&&(best<0||d[n]<d[best])) best=n;
    if(best<0) break; path.push(best); cur=best; }
  EX.path=path; }
const xKnownTrap=c=>EX.traps.find(t=>t.cell===c&&t.armed&&t.known);
const xChestAt=c=>EX.chests.find(ch=>ch.cell===c&&!ch.open);

/* ---------------- you ---------------- */
function xMove(dt){
  if(EX.action){ EX.stillT=0; EX.action.t-=dt; if(EX.action.t<=0){ const a=EX.action; EX.action=null; a.done(); } return; }
  if(EX.stuckT>0){ EX.stuckT-=dt; if(EX.stuckT<=0) xHud(); return; }
  let ix=0, iz=0;
  const held=id=>keysFor(id).some(k=>XKEY[k]);   // your bindings, from Settings (keys.js)
  if(held('left')) ix-=1; if(held('right')) ix+=1; if(held('up')) iz-=1; if(held('down')) iz+=1;
  // holding a finger (or the mouse) down walks toward it, steering as it moves
  if(!ix&&!iz&&XHOLD.on&&performance.now()-XHOLD.t0>120){ const r=appBox($('#xView')), v=new THREE.Vector3(EX.px,.8,EX.pz).project(X3.cam);
    const sx=r.left+(v.x+1)/2*r.width, sy=r.top+(1-v.y)/2*r.height, dx=XHOLD.x-sx, dy=XHOLD.y-sy, l=Math.hypot(dx,dy);
    if(l>18){ ix=dx/l; iz=dy/l; EX.path=[]; } }
  if(!ix&&!iz&&EX.path.length){ const n=EX.path[0], tx=xw(n)-EX.px, tz=xz(n)-EX.pz, d=Math.hypot(tx,tz); if(d<.25){ EX.path.shift(); } else { ix=tx/d; iz=tz/d; } }
  const len=Math.hypot(ix,iz); if(len<.1){ EX.walk=0; EX.stillT=(EX.stillT||0)+dt; return; }   // standing still: you notice hidden things (dungeon.js)
  EX.stillT=0;
  ix/=len; iz/=len; const sp=XSPEED*dt, r=.42;
  EX.moveDir=Math.abs(ix)>Math.abs(iz)?[Math.sign(ix),0]:[0,Math.sign(iz)];   // which way a pushed block goes
  const front=xcell(EX.px+ix*XCS*.6,EX.pz+iz*XCS*.6);
  const tryAxis=(nx,nz)=>{ for(const [ox,oz] of [[-r,-r],[r,-r],[-r,r],[r,r]]){ const c=xcell(nx+ox,nz+oz); if(c===EX.pc) continue; if(!xBump(c,c===front)) return false; } return true; };
  const okX=tryAxis(EX.px+ix*sp,EX.pz), okZ=tryAxis(EX.px,EX.pz+iz*sp);
  if(okX) EX.px+=ix*sp; if(okZ) EX.pz+=iz*sp;
  // caught on a door frame or corner: ease toward the middle of the cell so you slide through
  const cx=(xcx(EX.pc)+.5)*XCS, cz=(xcy(EX.pc)+.5)*XCS, ease=(a,b)=>Math.max(-sp,Math.min(sp,b-a));
  if(!okZ&&Math.abs(iz)>.3&&!okX) EX.px+=ease(EX.px,cx); else if(!okZ&&Math.abs(iz)>.3&&Math.abs(ix)<.3) EX.px+=ease(EX.px,cx);
  if(!okX&&Math.abs(ix)>.3&&Math.abs(iz)<.3) EX.pz+=ease(EX.pz,cz);
  if(Math.abs(ix)>.2) EX.face=ix<0?-1:1; if(iz<-.35) EX.view='back'; else if(iz>.35) EX.view='front'; EX.walk=(EX.walk||0)+dt*10*XSPEED/5.4;
  const c=xcell(EX.px,EX.pz); if(c!==EX.pc&&c>=0){ EX.pc=c; xEnter(c); }
}
// walking into a cell: walls stop you, doors open, chests open, a trap you know about stops you
function xBump(c,front){
  if(typeof xBumpExtra==='function'){ const r=xBumpExtra(c,front); if(r!==undefined) return r; }   // locks, people, puzzles, levers (dungeon.js)
  if(c<0||!xPassable(c)) return false;
  const d=EX.doors.get(c); if(d&&d.state==='closed'){ if(!front) return false; d.state='open'; d.leaf.visible=false; xLog('You open the door.','dim'); xUpdateVis(); return false; }
  const ch=xChestAt(c); if(ch){ if(front) xOpenChest(ch); return false; }
  const tr=xKnownTrap(c); if(tr){ xSay('trap'+c,'There is a '+TRAPS[tr.kind].name+' there. Disarm it (E) or go around.'); EX.path=[]; return false; }
  return true;
}
function xEnter(c){
  xUpdateVis();
  const tr=EX.traps.find(t=>t.cell===c&&t.armed); if(tr) xSpring(tr);
  if(EX.busy) return;
  if(typeof xEnterExtra==='function') xEnterExtra(c);
  if(c===EX.down&&!EX.busy) xStairsDown();
  xHud();
}
// experience on the map: a line in the log, and the level-up panel when a level comes
function xXp(n,why){ if(typeof gainXp!=='function'||!save) return; const up=gainXp(save,n); persist(); xLog('+'+Math.round(n)+' XP · '+why,'xp');
  if(up){ xLog('Level up! You are now level '+save.level+'.','good'); setTimeout(()=>{ if(EX&&EX.active&&!EX.busy) maybeLevelUp(); },400); } xHud(); }
function xHurt(n,why){ EX.hp=Math.max(0,EX.hp-n); xFlash(); xHud(); if(EX.hp<=0) xDie(why); }
function xSpring(tr,remote){ const T=TRAPS[tr.kind]; tr.known=true; xTrapMesh(tr);
  xLog(remote&&tr.kind==='pit'?'The pit\'s lid snaps and catches your arm!':T.text,'bad'); const dmg=T.dmg[1]?Math.round(rnd(T.dmg[0],T.dmg[1])+EX.depth*.8):0;
  if(tr.kind==='alarm'){ tr.armed=false; if(tr.mesh) tr.mesh.visible=false; for(const g of EX.groups) if(!g.boss&&!g.dormant){ g.state='chase'; g.lostT=0; }
    // from depth 3 the alarm also calls the floor's Dungeon Warden
    if(EX.depth>=3&&!EX.wardenCalled&&typeof xMiniGroup==='function'){ EX.wardenCalled=true; const far=EX.rooms.filter(r=>!r.side&&!r.safe&&!r.behind).sort((a,b)=>Math.hypot(b.cx-xcx(EX.pc),b.cy-xcy(EX.pc))-Math.hypot(a.cx-xcx(EX.pc),a.cy-xcy(EX.pc)))[0];
      if(far){ const g=xMiniGroup('dungeonwarden',xi(far.cx,far.cy),{beh:'hunt',huntT:0}); EX.groups.push(g); xGroupSprites(g,X3.group); xLog('Far off, chains rattle: the Dungeon Warden answers the alarm.','bad'); } } }
  if(tr.kind==='pit'&&!remote) EX.stuckT=T.stuck;
  if(T.stun&&!remote) EX.stuckT=T.stun;
  if(tr.kind==='dart') EX.ail.poison=Math.max(EX.ail.poison||0,10+EX.depth);
  if(tr.kind==='explosive'||tr.kind==='blocks'||tr.kind==='trapdoor'){ tr.armed=false; }
  if(dmg) xHurt(dmg,'a '+T.name);
  if(T.fall&&!remote&&EX.hp>0&&typeof xFall==='function') xFall(1,'You tumble down to the floor below!'); }

/* ---------------- search, disarm, chests ---------------- */
// Search: a reticle appears and follows your finger (the floor holds still while you aim); let go
// to search the 5 x 5 tiles under it. Pressing Search again (or F) searches where it is.
const XAIM_R=4;   // how far from you the reticle can go, in tiles
function xSearch(){ if(!EX||EX.action||EX.busy) return;
  if(EX.aim) return xSearchAt(EX.aim.cell);
  EX.path=[]; XHOLD.on=false; EX.aim={cell:EX.pc}; xLog('Drag to aim your search; let go to search there.','dim'); xHud(); }
function xSearchAt(c){ if(!EX||EX.action||EX.busy) return; EX.aim=null; EX.path=[]; EX.searchCell=c; xLog('You search the area…','dim');
  EX.action={t:1.1, done(){ EX.searchCell=null; if(!xSearchRoll(1,false,c)) xLog('You find nothing.','dim'); } };
  xHud(); }
// the cell under a screen point, kept within reach of you
function xAimCell(ex,ey){ const G=X3, r=appBox($('#xView')), v=new THREE.Vector2((ex-r.left)/r.width*2-1,-(ey-r.top)/r.height*2+1), hit=new THREE.Vector3();
  G.ray.setFromCamera(v,G.cam); if(!G.ray.ray.intersectPlane(G.plane,hit)) return EX.aim.cell;
  const px=xcx(EX.pc), py=xcy(EX.pc), cl=(a,b)=>Math.max(b-XAIM_R,Math.min(b+XAIM_R,a));
  return xi(Math.max(0,Math.min(XN-1,cl(Math.floor(hit.x/XCS),px))),Math.max(0,Math.min(XN-1,cl(Math.floor(hit.z/XCS),py)))); }
// one search of everything within 2 tiles you can see: k is the chance (1 for the Search button,
// a third while you stand still); deeper traps are a little harder to spot
function xSearchRoll(k,quiet,at){ k*=(typeof gearMods==='function'&&gearMods(save).search)||1; const ctr=at==null?EX.pc:at, x=xcx(ctr), y=xcy(ctr); let found=0; const hard=Math.max(.75,1-EX.depth*.01);
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const i=xi(x+dx,y+dy), d=EX.doors.get(i);
    if(d&&d.state==='secret'&&xLos(EX.pc,i)&&Math.random()<.55*k){ d.state='closed'; d.leaf.visible=true; found++; xLog(quiet?'Standing still, you notice the outline of a hidden door!':'You find a hidden door!','good');
      const w=EX.wIdx.get(i); if(w){ w[0].setMatrixAt(w[1],new THREE.Matrix4().makeScale(0,0,0)); w[0].instanceMatrix.needsUpdate=true; EX.wIdx.delete(i); } EX.seen[i]=1; } }
  for(const tr of EX.traps) if(tr.armed&&!tr.known&&xLos(EX.pc,tr.cell)&&Math.max(Math.abs(xcx(tr.cell)-x),Math.abs(xcy(tr.cell)-y))<=2&&Math.random()<.65*k*hard){ tr.known=true; xTrapMesh(tr); found++; xLog('You find a '+TRAPS[tr.kind].name+'.','good'); }
  for(const ch of EX.chests) if(!ch.open&&ch.trap&&!ch.trapKnown&&Math.max(Math.abs(xcx(ch.cell)-x),Math.abs(xcy(ch.cell)-y))<=1&&Math.random()<.65*k){ ch.trapKnown=true; found++; xLog('The chest\'s lock is trapped.','good'); }
  if(typeof xSearchExtra==='function') found+=xSearchExtra(k,quiet,at);
  if(found){ xUpdateVis(); xHud(); xXp(found*(10+EX.depth),found>1?found+' secrets found':'secret found'); } return found; }
function xDisarmTarget(){ const x=xcx(EX.pc), y=xcy(EX.pc), near=c=>Math.max(Math.abs(xcx(c)-x),Math.abs(xcy(c)-y))<=1;
  return EX.traps.find(t=>t.armed&&t.known&&near(t.cell))||EX.chests.find(c=>!c.open&&c.trap&&c.trapKnown&&near(c.cell)); }
function xDisarm(){ if(!EX||EX.action||EX.busy) return; const tg=xDisarmTarget();
  if(!tg){ const alt=typeof xDisarmAlt==='function'&&xDisarmAlt(); if(alt){ EX.path=[]; xLog(alt.start,'dim'); EX.action={t:alt.t, done(){ alt.run(); xHud(); }}; xHud(); return; }
    xLog('There is nothing here you know how to disarm.','dim'); return; }
  EX.path=[]; const isChest=tg.open!==undefined; xLog('You carefully work at the '+(isChest?'lock':TRAPS[tg.kind].name)+'…','dim');
  EX.action={t:1.3, done(){ const ok=Math.random()<Math.max(.55,.74-EX.depth*.008);
    if(ok) xXp(12+EX.depth,'trap disarmed');
    if(isChest){ if(ok){ tg.trap=false; xLog('You disarm the needle in the lock.','good'); } else { tg.trap=false; xLog('Click. A needle jabs your hand!','bad'); xHurt(Math.round(5+EX.depth),'a trapped lock'); } }
    else if(ok){ tg.armed=false; if(tg.mesh) tg.mesh.visible=false; xLog('You disarm the '+TRAPS[tg.kind].name+'.','good'); if(Math.random()<.3){ const g=Math.round(5+EX.depth*3); save.gold+=g; persist(); xLog('You salvage '+g+' gold of parts.','gold'); } }
    else { xLog('You slip!','bad'); xSpring(tg,true); tg.armed=false; if(tg.mesh) tg.mesh.visible=false; }
    xHud(); } };
  xHud(); }
function xOpenChest(ch){
  if(typeof xChestExtra==='function'&&xChestExtra(ch)) return;   // a mimic (dungeon.js)
  if(ch.trap&&ch.trapKnown){ xSay('chest','The lock is trapped. Disarm it first (E).'); return; }
  if(ch.trap){ ch.trap=false; xLog('A needle in the lock pricks you!','bad'); xHurt(Math.round(5+EX.depth),'a trapped chest'); if(EX.hp<=0) return; }
  ch.open=true; ch.mesh.userData.lid.rotation.x=-1.9; EX.path=[];
  const rolls=ch.rich?2:1; for(let n=0;n<rolls;n++) xLoot(ch.rich); xXp(ch.rich?15:5,'chest opened');
  if(typeof xChestAfter==='function') xChestAfter(ch);
  persist(); xHud();
}
// chest loot: a card, gold or a piece of gear
function xLoot(rich){ const d=EX.depth+(rich?2:0), r=Math.random();
  if(r<.42){ const c=rollCard({depth:d,min:rich?'uncommon':null}); const res=addCards(save,[c]); xLog('The chest holds a card: '+c.name+(res[0]&&res[0].isNew?' (new!)':'')+'.','loot'); tip('Card: '+c.name); }
  else if(r<.76){ const g=Math.round(battleGold(d,false)*rnd(.5,1.1)); save.gold+=g; xLog('The chest holds '+g+' gold.','gold'); tip('+'+g+' gold'); }
  else { const k=rollLoot(d,Math.random,rich); const l=lootLabel(save,k), res=addLoot(save,k); xLog('The chest holds '+l.name+'.'+(res&&res.cursed?' '+res.msg:''),'loot'); tip(l.name); }
}

/* ---------------- enemies ---------------- */
function xEnemies(dt){
  const safe=EX.safe&&EX.safe.has(EX.pc), now=performance.now();
  // Stealth (chars.js) shrinks how far enemies see you and how easily sleepers wake
  if(!(EX.sneakT>now)){ EX.sneakT=now+1000; EX.sneak=(typeof gearMods==='function'&&gearMods(save).sneak)||1; } const sn=EX.sneak||1;
  for(const g of EX.groups){
    if(g.dormant) continue;
    const d=Math.hypot(g.x-EX.px,g.z-EX.pz), cells=d/XCS;
    if(EX.vis[g.cell]&&g.state!=='sleep'&&cells>2.2&&!(g.stealth&&cells>3.2)){ g.seen=true; g.surprise=false; }
    if(g.mini&&typeof xMiniStep==='function') xMiniStep(g,dt,cells);
    else if(g.state==='sleep'){ g.wakeT-=dt; if(g.wakeT<=0){ g.wakeT=1; if(xSeesCell(g,EX.pc,sn)&&Math.random()<.3*sn){ g.state='chase'; g.surprise=!EX.vis[g.cell]; if(EX.vis[g.cell]) xLog(ENEMY_DEFS[g.ids[0]].name+' wakes up!','warn'); } } }
    else if(g.state==='guard'){ if(EX.room[EX.pc]===EX.room[g.home]&&EX.room[EX.pc]>=0){ g.state='chase'; xLog(ENEMY_DEFS[g.ids[0]].name+' rises to face you!','warn'); } }
    else { const sees=!safe&&xSeesCell(g,EX.pc,sn);
      if(sees){ if(g.state!=='chase'&&EX.vis[g.cell]) xLog(ENEMY_DEFS[g.ids[0]].name+' spots you!','warn'); g.state='chase'; g.lostT=0; }
      else if(g.state==='chase'){ g.lostT+=dt; if(g.lostT>6){ g.state='wander'; g.path=[]; g.seen=false; } }
      g.repath-=dt;
      if(g.repath<=0){ g.repath=g.state==='chase'?.4:2.5;
        const goal=g.state==='chase'?EX.pc:(g.path.length?null:xWanderGoal(g));
        if(goal!=null){ const dist=xbfs(EX.t,EX.doors,goal,null,typeof xEnemyBlock==='function'?xEnemyBlock:null); g.path=xPathTo(dist,g.cell,goal); } }
      const sp=(g.state==='chase'?4.1:2)*dt;
      if(g.path.length){ const n=g.path[0], tx=xw(n)-g.x, tz=xz(n)-g.z, l=Math.hypot(tx,tz);
        if(l<.2){ g.path.shift(); const dr=EX.doors.get(n); if(dr&&dr.state==='closed'){ dr.state='open'; dr.leaf.visible=false; if(EX.seen[n]) xUpdateVis(); } }
        else { g.x+=tx/l*Math.min(sp,l); g.z+=tz/l*Math.min(sp,l); g.face=tx<0?-1:1; g.head=Math.atan2(tz,tx); } }
      const c=xcell(g.x,g.z); if(c>=0) g.cell=c; }
    if(d<1.15&&!EX.busy&&!safe){ xEngage(g); return; }   // nothing fights you inside a sanctuary or a merchant's room
  }
}
/* What an enemy can see. Awake, it looks the way it walks: a 120° cone out to 7.5 tiles, plus
   1.5 tiles all around; once chasing it looks every way. Asleep, it wakes to you within 2.6
   tiles. Walls block it all, and Stealth shrinks the distances. The map draws these zones on
   the floor (xFov), so you can see where to sneak past or creep up for an ambush. */
const XFOV={r:7.5, half:Math.PI/3, near:1.5, wake:2.6};
function xSeesCell(g,c,sn){ const dx=xw(c)-g.x, dz=xz(c)-g.z, d=Math.hypot(dx,dz)/XCS;
  if(g.state==='sleep'){ if(d>XFOV.wake*sn) return false; }
  else { if(d>XFOV.r*sn) return false;
    if(g.state!=='chase'&&d>XFOV.near*sn){ let a=Math.atan2(dz,dx)-(g.head||0); a=Math.atan2(Math.sin(a),Math.cos(a)); if(Math.abs(a)>XFOV.half) return false; } }
  return c===g.cell||xLos(g.cell,c); }
// the zones, painted on a canvas laid over the floor: a faint fill and a dotted edge per enemy
const XFOV_PX=12;
function xFovMesh(grp){ const span=XN*XCS, cv=document.createElement('canvas'); cv.width=cv.height=XN*XFOV_PX;
  const tex=new THREE.CanvasTexture(cv); tex.magFilter=THREE.LinearFilter; tex.minFilter=THREE.LinearFilter;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(span,span),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(span/2,.03,span/2); m.renderOrder=0; grp.add(m); EX.fov={cv,tex,mesh:m,t:0,key:''}; }
function xFov(dt){ const F=EX.fov; if(!F) return; F.t-=dt; if(F.t>0) return; F.t=.12;
  const sn=EX.sneak||1, shown=EX.groups.filter(g=>g.sprite&&g.sprite.visible&&!g.dormant&&g.state!=='guard');
  const key=shown.map(g=>g.cell+':'+g.state+':'+Math.round((g.head||0)*8)).join('|')+'@'+sn;
  if(key===F.key) return; F.key=key;
  const x=F.cv.getContext('2d'), P=XFOV_PX; x.clearRect(0,0,F.cv.width,F.cv.height);
  for(const g of shown){ const R=Math.ceil((g.state==='sleep'?XFOV.wake:XFOV.r)*sn)+1, gx=xcx(g.cell), gy=xcy(g.cell), zone=new Set();
    for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ const cx=gx+dx, cy=gy+dy; if(cx<0||cy<0||cx>=XN||cy>=XN) continue; const c=xi(cx,cy);
      if(EX.t[c]!==T_ROCK&&xSeesCell(g,c,sn)) zone.add(c); }
    const col=g.state==='chase'?'255,77,94':g.state==='sleep'?'127,180,255':'255,196,64';
    x.fillStyle=`rgba(${col},.1)`; for(const c of zone) x.fillRect(xcx(c)*P,xcy(c)*P,P,P);
    // the dotted edge: every side of a zone cell that borders a cell outside the zone
    x.strokeStyle=`rgba(${col},.5)`; x.lineWidth=.6; x.setLineDash([1.5,3]); x.beginPath();
    for(const c of zone){ const X=xcx(c)*P, Y=xcy(c)*P;
      if(!zone.has(c-XN)){ x.moveTo(X,Y); x.lineTo(X+P,Y); } if(!zone.has(c+XN)){ x.moveTo(X,Y+P); x.lineTo(X+P,Y+P); }
      if(!zone.has(c-1)||xcx(c)===0){ x.moveTo(X,Y); x.lineTo(X,Y+P); } if(!zone.has(c+1)||xcx(c)===XN-1){ x.moveTo(X+P,Y); x.lineTo(X+P,Y+P); } }
    x.stroke(); x.setLineDash([]); }
  F.tex.needsUpdate=true; }
function xWanderGoal(g){ const r=pick(EX.rooms.filter(r=>!r.side&&!r.nook&&!r.behind&&!r.safe)); return xi(r.x+Math.floor(Math.random()*r.w),r.y+Math.floor(Math.random()*r.h)); }
function xPathTo(dist,from,goal){ if(dist[from]<0) return []; const out=[]; let cur=from;
  for(let k=0;k<200&&cur!==goal;k++){ const x=xcx(cur), y=xcy(cur); let best=-1;
    for(const n of [xi(x+1,y),xi(x-1,y),xi(x,y+1),xi(x,y-1)]) if(n>=0&&n<XN*XN&&dist[n]>=0&&dist[n]<dist[cur]&&(best<0||dist[n]<dist[best])) best=n;
    if(best<0) break; out.push(best); cur=best; }
  return out; }
// how the fight opens: reach a sleeping enemy first and you ambush it; one you never saw coming strikes first
function xEngage(g,forced){
  const opening=forced!==undefined?forced:g.state==='sleep'?'ambush':(g.surprise||!g.seen)?'surprised':null;
  EX.busy=true; EX.path=[]; EX.fighting=g; xHud();
  const name=ENEMY_DEFS[g.ids[0]].name;
  if(opening==='ambush') xLog('You catch the '+name+' asleep!','good'); else if(opening==='surprised') xLog('The '+name+' was waiting for you!','bad');
  const b=$('#xBang'); b.textContent=opening==='ambush'?'Ambush!':opening==='surprised'?'Surprised!':'!'; b.dataset.key='fight'; b.className='x-bang on '+(opening||'');
  setTimeout(()=>{ b.className='x-bang'; if(!EX||EX.fighting!==g) return; EX.active=false; fight(EX.depth,[g.ids.slice()],{hp:EX.hp,opening,explore:true,rule:g.rule||null}); },700);
}

/* ---------------- floors, camp, death ---------------- */
function xStairsDown(){
  if(EX.groups.some(g=>g.boss)){ xSay('boss','The stairs are sealed while the guardian of this floor lives.'); return; }
  EX.busy=true; if(typeof xEscortCheck==='function') xEscortCheck(); xLog('You descend…','dim'); const nd=EX.depth+1, hp=Math.min(xmaxHp(),EX.hp+Math.round(xmaxHp()*.2));
  if(nd>save.deepest) xXp(20+2*nd,'new depth'); save.deepest=Math.max(save.deepest,nd); persist(); if(typeof XRUN!=='undefined'&&XRUN){ XRUN.keys.boss=0; if(XRUN.chute===EX.depth) XRUN.chute=0; }
  xKeep(); setTimeout(()=>{ xGoFloor(nd,hp,'up'); EX.active=true; xHud(); xLoopStart(); xBanner(nd); },500);
}
// floors you have been on this run are kept as you left them, so the stairs work both ways
function xFloors(){ return typeof XRUN!=='undefined'&&XRUN?(XRUN.floors||(XRUN.floors=new Map())):null; }
function xKeep(){ const m=xFloors(); if(m&&EX&&!EX.branch) m.set(EX.depth,EX); }
// go to a floor, arriving on its stairs up or down (or a cell): a kept floor comes back as it was;
// a new one reached from below has its guardian already beaten, since you came past it
function xGoFloor(depth,hp,at){ const m=xFloors(), F=m&&m.get(depth), ail=EX&&EX.ail;
  if(F){ EX=F; EX.hp=hp; EX.busy=false; EX.path=[]; EX.action=null; EX.aim=null; EX.searchCell=null; EX.stuckT=0; EX.fighting=null; if(ail) EX.ail=ail; xBuildScene(); for(const tr of EX.traps) if(tr.known&&tr.armed) xTrapMesh(tr); }
  else { buildFloor(depth,hp);
    if(at==='down') for(const g of EX.groups.filter(g=>g.boss)){ EX.groups.splice(EX.groups.indexOf(g),1); [g.sprite,g.zz,g.bang,g.ring].forEach(o=>o&&X3.group.remove(o)); EX.bossDead=true; } }
  const c=typeof at==='number'?at:at==='down'?EX.down:EX.up; EX.pc=c; EX.px=xw(c); EX.pz=xz(c); EX.view=at==='down'?'back':'front'; xUpdateVis(); }
// the stairs up: to the floor above (or the main floor, from a hidden branch); from depth 1, to camp
function xStairsUp(){
  if(!EX||EX.busy||EX.pc!==EX.up) return;
  const m=xFloors(), main=EX.branch&&m&&m.get(EX.depth);
  if(!main&&EX.depth<=1) return xToCamp();
  if(typeof xEscortCheck==='function') xEscortCheck();
  EX.busy=true; xLog('You climb the stairs…','dim'); const hp=EX.hp, nd=main?EX.depth:EX.depth-1;
  if(!main) xKeep();
  const at=main?((main.props.find(p=>p.kind==='hstair')||{}).cell??'up'):'down';
  setTimeout(()=>{ xGoFloor(nd,hp,at); EX.active=true; xHud(); xLoopStart(); xBanner(nd); },450);
}
let XPARK=null;
function xToCamp(){ if(!EX||EX.busy||EX.pc!==EX.up) return; if(typeof xEscortCheck==='function') xEscortCheck(); logCamp('Climbed back to camp from depth '+EX.depth+'. The floor stays as you left it.','dim'); stopExplore(); pickDepth=EX.depth; XPARK=EX; EX=null; openCamp(); }
function xDie(why){
  // a sanctuary's blessing pulls you back once: to the stairs up of this floor, at half health
  if(typeof xTryRevive==='function'&&xTryRevive()){ const lost=Math.floor(save.gold*.1); save.gold-=lost; persist(); EX.hp=Math.round(xmaxHp()*.5); EX.ail={poison:0,curse:0};
    EX.pc=EX.up; EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.path=[]; EX.stuckT=0; xUpdateVis(); xHud(); xFlash();
    xLog('Brought down by '+why+', but the shrine pulls you back to the stairs up. You dropped '+lost+' gold.','good'); return; }
  XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; EX.busy=true; const lost=Math.floor(save.gold*.2); save.gold-=lost; persist(); const depth=EX.depth;
  logCamp('Killed by '+why+' at depth '+depth+', dropped '+lost+' gold.','curse'); stopExplore();
  reveal('Defeated…','Brought down by '+why+' at depth '+depth+'. You dropped '+lost+' gold. Your cards are safe.',[],[['Camp',()=>{ EX=null; openCamp(); },true],...(typeof peekPoint==='function'&&peekPoint()?[['Load save',()=>loadPoint()]]:[])]); }
function stopExplore(){ if(EX) EX.active=false; xPause(false); }

/* ---------------- loop, hud ---------------- */
let xRaf=0, xLast=0;
function xLoopStart(){ cancelAnimationFrame(xRaf); xLast=performance.now(); xRaf=requestAnimationFrame(xLoop); }
function xLoop(ts){
  if(!EX||!EX.active||!$('#scrExplore').classList.contains('on')) return;
  const dt=Math.min(.1,(ts-xLast)/1000); xLast=ts;
  if(!EX.busy&&!xPaused&&!EX.aim){ xMove(dt); xEnemies(dt); if(EX.active&&!EX.busy&&typeof xDungeonTick==='function') xDungeonTick(dt);
    EX.regenT+=dt; if(EX.regenT>3){ EX.regenT=0; if(EX.hp<xmaxHp()){ EX.hp++; xHud(); } } }
  xDraw(ts/1000,dt); xRaf=requestAnimationFrame(xLoop);
}
function xResize(){ const G=X3, cv=$('#xView'), w=cv.clientWidth||400, h=cv.clientHeight||600; if(G.w===w&&G.h===h) return; G.w=w; G.h=h; G.renderer.setSize(w,h,false); G.cam.aspect=w/h; G.cam.updateProjectionMatrix(); }
function xDraw(T,dt){
  dt=dt||.016; const G=X3; xResize(); xFadeCells(dt);
  // a two-step walk: the walking pose and the standing pose in turn, rising one art pixel on the step;
  // searching or disarming shows the casting pose
  const ART=XSPR/96, step=EX.walk?Math.floor(EX.walk/1.5)%2:0;
  EX.pose=EX.action?'cast':EX.walk?(step?'walk':'idle'):'idle';
  EX.me.position.set(EX.px,step*ART,EX.pz); xRefresh(EX.me,EX.face<0);
  G.lamp.position.set(EX.px,2.6,EX.pz);
  const k=Math.max(1,Math.min(1.8,.8/G.cam.aspect)), hgt=18*k, back=10*k;   // tall screens pull back so a room still fits across
  G.cam.position.set(EX.px,hgt,EX.pz+back); G.cam.lookAt(EX.px,0,EX.pz-.5);
  // enemies show only while in sight; a Shadow Assassin only when it is close; a dormant guardian not at all
  for(const g of EX.groups){ if(!g.sprite) continue; const v=!!EX.vis[g.cell]&&!g.dormant&&!(g.stealth&&Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS>3.2); g.sprite.visible=v; g.zz.visible=v&&g.state==='sleep'; g.bang.visible=v&&g.state==='chase';
    if(g.ring){ g.ring.visible=v; g.ring.position.set(g.x,.06,g.z); }
    if(g.tag){ g.tag.visible=v; if(v) g.tag.position.set(g.x,g.h+(g.state==='chase'?1.1:.5)+Math.sin(T*2.5+g.bob)*.08,g.z); }
    if(v){ g.sprite.position.set(g.x,g.state==='sleep'?0:(Math.floor(T*(g.state==='chase'?4:1.6)+g.bob)%2)*g.h/96,g.z); xRefresh(g.sprite,(g.face||-1)<0);
      g.zz.position.set(g.x+.5,g.h+.2+Math.sin(T*2+g.bob)*.15,g.z); g.bang.position.set(g.x,g.h+.35,g.z); } }
  xFov(dt); xTellDraw(T);
  if(typeof xDungeonDraw==='function') xDungeonDraw(T);
  { const rc=EX.aim?EX.aim.cell:EX.searchCell, R=G.reticle; R.visible=rc!=null;
    if(R.visible){ R.position.set(xw(rc),.12,xz(rc)); const k=EX.aim?1+.05*Math.sin(T*8):1+.12*Math.sin(T*14); R.scale.set(k,1,k); R.children[0].material.opacity=EX.aim?.9:.6+.3*Math.sin(T*14); } }
  EX.downMesh.userData.ring.rotation.z+=.02;
  for(const L of EX.glows){ if(!L.g.visible) continue; const f=EX.fogCur[L.floor], fl=.85+.15*Math.sin(T*1.7+L.ph);
    L.halo.material.opacity=.6*f*fl; for(const m of L.mats) m.opacity=.3+.7*f;
    if(EX.area.veins==='stars') L.g.children.forEach((o,i)=>{ if(o.userData.y0!=null) o.position.y=o.userData.y0+Math.sin(T*1.3+i+L.ph)*.12; }); }
  { const P=G.dust.geometry.attributes.position, a=P.array; for(let k=0;k<a.length;k+=3){ a[k+1]+=dt*.25; a[k]+=Math.sin(T+k)*dt*.1; if(a[k+1]>3.2) a[k+1]=0; } P.needsUpdate=true;
    G.dust.position.set(EX.px,0,EX.pz); G.dust.material.opacity=.35+.15*Math.sin(T*.7); }
  for(const c of EX.chests) if(c.rich&&!c.open) c.mesh.position.y=Math.abs(Math.sin(T*2))*.05;
  G.renderer.render(G.scene,G.cam);
  if((EX.miniT=(EX.miniT||0)+1)%6===0) xMini();
}
function xMini(){
  const cv=$('#xMini'), c=cv.getContext('2d'), big=cv.classList.contains('big');
  // held big, the map zooms to the part of the floor you have explored
  let x0=0, y0=0, n=XN;
  if(big){ let a=XN, b=XN, A=0, B=0; for(let i=0;i<XN*XN;i++) if(EX.seen[i]){ const x=xcx(i), y=xcy(i); a=Math.min(a,x); b=Math.min(b,y); A=Math.max(A,x); B=Math.max(B,y); }
    if(A>=a){ n=Math.min(XN,Math.max(16,A-a+5,B-b+5)); x0=Math.max(0,Math.min(XN-n,Math.round((a+A)/2-n/2))); y0=Math.max(0,Math.min(XN-n,Math.round((b+B)/2-n/2))); } }
  const s=big?Math.max(3,Math.floor(384/n)):3; cv.width=cv.height=n*s;
  c.fillStyle='rgba(5,6,10,.8)'; c.fillRect(0,0,cv.width,cv.height); c.translate(-x0*s,-y0*s);
  for(let i=0;i<XN*XN;i++){ if(!EX.seen[i]) continue; const d=EX.doors.get(i); if(EX.t[i]===T_ROCK||(d&&d.state==='secret')){ c.fillStyle='#1a1d26'; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); continue; }
    c.fillStyle=d?'#a0703a':EX.vis[i]?'#7c8aa6':'#3c4458'; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); }
  const dot=(i,col,r)=>{ c.fillStyle=col; c.fillRect(xcx(i)*s-r+1,xcy(i)*s-r+1,s+2*r-2,s+2*r-2); };
  if(EX.seen[EX.down]) dot(EX.down,isBossDepth(EX.depth)?'#ff5d6c':EX.area.glow,2); if(EX.seen[EX.up]) dot(EX.up,'#fff2c0',2);
  for(const ch of EX.chests) if(EX.seen[ch.cell]&&!ch.open) dot(ch.cell,'#f2c94c',1);
  for(const tr of EX.traps) if(tr.known&&tr.armed) dot(tr.cell,'#ff4d5e',1);
  if(typeof xMiniExtra==='function') xMiniExtra(c,s,dot);
  for(const g of EX.groups) if(EX.vis[g.cell]&&!g.dormant&&!(g.stealth&&Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS>3.2)) dot(g.cell,g.tagCol||(g.mini?'#ff9a3a':'#ff6b6b'),g.mini||g.elite?2:1);
  dot(EX.pc,'#ffffff',2);
}
function xLog(t,c){ if(!EX) return; EX.log.push({t,c}); if(EX.log.length>5) EX.log.shift();
  const el=$('#xLog'); if(el) el.innerHTML=EX.log.map((l,i)=>`<div class="${l.c||''}" style="opacity:${.45+.55*(i+1)/EX.log.length}">${esc(l.t)}</div>`).join(''); }
function xSay(k,t){ const now=performance.now(); if((EX.msgT[k]||0)>now) return; EX.msgT[k]=now+2500; xLog(t,'warn'); }
// the floor's banner, in its area's color: the area's name first when you have just entered it
function xBanner(depth){ const b=$('#xBang'), A=areaOf(depth), first=areaFloor(depth)===1, key='d'+depth;
  b.innerHTML=first?esc(A.name)+'<small>Depth '+depth+' · '+(isBossDepth(depth)?'boss floor':'floor 1 of '+DEPTHS_PER_AREA)+'</small>':'Depth '+depth+'<small>'+esc(areaLabel(depth))+'</small>';
  b.style.setProperty('--bc',A.glow); b.dataset.key=key; b.className='x-bang on depth'; setTimeout(()=>{ if(b.dataset.key===key) b.className='x-bang'; },first?2200:1400); }
function xFlash(){ const h=$('#xHurt'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); }
function xHud(){ if(!EX) return; const m=xmaxHp();
  hpMeter($('#xHpBar'),$('#xHpTxt'),EX.hp,m);
  if(typeof xpLine==='function'){ const l=$('#xLv'), ch=ensureChar(save); l.textContent='Lv '+save.level+(pointsLeft(ch)>0?' ★':''); l.title=xpLine(); }
  $('#xDepth').textContent='Depth '+EX.depth+' · '+areaLabel(EX.depth); $('#xDepth').style.color=EX.area.glow; goldText($('#xGold'));
  $('#xSearch').disabled=!!EX.action; $('#xSearch').classList.toggle('aiming',!!EX.aim); $('#xSearch').firstChild.textContent=EX.aim?'Search here':'Search'; $('#xDisarm').disabled=!!EX.action||!(xDisarmTarget()||typeof xDisarmAlt==='function'&&xDisarmAlt());
  const onUp=EX.pc===EX.up&&!EX.busy, aboveMain=EX.branch&&xFloors()&&xFloors().get(EX.depth);
  $('#xCamp').style.display=onUp?'':'none'; $('#xUp').style.display=onUp&&(EX.depth>1||aboveMain)?'':'none';
  $('#xUp').firstChild.textContent=aboveMain?'Climb up':'Up to depth '+(EX.depth-1); $('#xAct').textContent=EX.aim?'Aim…':EX.action?'Working…':EX.stuckT>0?'Stuck!':'';
  if(typeof xHudExtra==='function') xHudExtra(); }

/* ---------------- entering and returning ---------------- */
function enterExplore(depth){
  const v=validateDeck(activeDeck().list,CARDS,save.owned); if(!v.ok) return;
  if(typeof THREE==='undefined'){ tip('The 3D map could not load; fighting directly.'); return fight(depth); }
  show('scrExplore'); xInit3D();
  if(XPARK&&XPARK.depth===depth){ EX=XPARK; XPARK=null; EX.hp=xmaxHp(); EX.busy=false; EX.path=[]; EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.pc=EX.up; xUpdateVis(); xLog('You climb back down. You feel rested.','dim'); }
  else { XPARK=null; if(typeof xNewRun==='function') xNewRun(depth); buildFloor(depth); }
  EX.active=true; xHud(); xLoopStart();
  xBanner(depth);
}
// back from a fight that started on the map: the enemy is gone and your wounds carry over
// info.ruleOK: a trial's rule was kept (dungeon.js pays out)
function resumeExplore(hp,won,info){
  if(!EX) return openCamp();
  const g=EX.fighting; EX.fighting=null;
  if(won&&g){ EX.groups=EX.groups.filter(x=>x!==g); [g.sprite,g.zz,g.bang,g.ring,g.tag].forEach(o=>{ if(!o) return; X3.group.remove(o); if(o.material.map) o.material.map.dispose(); o.material.dispose(); }); if(g.boss){ EX.bossDead=true; xLog(ENEMY_DEFS[g.ids[0]].name+' falls. The stairs down to '+areaOf(EX.depth+1).name+' are open.','good'); } }
  EX.hp=Math.max(1,hp); EX.busy=false; EX.active=true; EX.path=[]; EX.aim=null;
  for(const k in XKEY) XKEY[k]=false;
  show('scrExplore'); xUpdateVis();
  if(typeof xAfterFight==='function') xAfterFight(g,won,info);
  setTimeout(()=>{ if(typeof maybeLevelUp==='function') maybeLevelUp(); },300);
  xHud(); xLoopStart();
}
$('#xSearch').onclick=()=>xSearch();
$('#xDisarm').onclick=()=>xDisarm();
$('#xCamp').onclick=()=>xToCamp();
$('#xUp').onclick=()=>xStairsUp();
