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

const XN=48, XCS=2, XWALL=2.5;           // grid cells per side, world units per cell, wall height
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
  for(const r of open) if(Math.random()<.5){ const c=freeCell(r); if(c>=0) EX.chests.push({cell:c, open:false, trap:Math.random()<.12, trapKnown:false}); }
  if(typeof xFloorPlan!=='function'){ const cl=F.rooms.find(r=>r.closet); if(cl){ const c=xi(cl.cx,cl.cy); taken.add(c); EX.chests.push({cell:c, open:false, trap:false, trapKnown:false, rich:true}); } }
  // hidden traps in ordinary rooms and corridors, never on the stairs or in the first room; deeper floors hold more and worse
  const kinds=typeof xTrapKinds==='function'?xTrapKinds(depth):['spike','spike','dart','dart','fire','pit','alarm'];
  const quiet=i=>{ const r=F.room[i]; return r>=0&&(F.rooms[r]===F.start||F.rooms[r].role||F.rooms[r].side); };
  const floorCells=[]; for(let i=0;i<XN*XN;i++) if(F.t[i]===T_FLOOR&&!quiet(i)&&!taken.has(i)) floorCells.push(i);
  const nT=Math.max(0,Math.min(5,1+Math.floor(depth*.25))-(opt.branch?1:0));   // a few, not a minefield: 1 early, up to 5 deep down
  for(let n=0;n<nT&&floorCells.length;n++){ const c=floorCells.splice(Math.floor(Math.random()*floorCells.length),1)[0]; taken.add(c); EX.traps.push({cell:c, kind:pick(kinds), known:false, armed:true}); }
  // enemy groups: some asleep, some wandering; on a boss depth the boss waits by the stairs down
  const nG=Math.min(open.length,(opt.branch?1:3)+Math.floor(depth/3));
  const rooms=open.slice().sort(()=>Math.random()-.5).filter(r=>r!==F.exit||!isBossDepth(depth)).slice(0,nG);
  for(const r of rooms){ const c=freeCell(r); if(c<0) continue; const wave=makeEncounter(depth)[0], ids=wave.slice(0,1+Math.floor(Math.random()*Math.min(3,wave.length)));
    EX.groups.push(xGroup(ids,c,Math.random()<.45?'sleep':'wander')); }
  if(isBossDepth(depth)&&!opt.branch){ const c=xi(F.exit.cx-1,F.exit.cy); taken.add(c); EX.groups.push(Object.assign(xGroup([bossFor(depth)],c,'guard'),{boss:true})); }
  // most groups keep to their own room until they see you; from depth 3 one (two from depth 8)
  // goes looking for you instead. Vermin never hunt.
  { const can=EX.groups.filter(g=>!g.boss&&!g.ids.every(id=>ENEMY_DEFS[id].vermin)), n=depth>=8?2:depth>=3?1:0;
    can.sort(()=>Math.random()-.5).slice(0,n).forEach(g=>{ g.hunter=true; g.state='wander'; }); }
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
  const amb=new THREE.AmbientLight(0xffffff,.2), sun=new THREE.DirectionalLight(0xffffff,.22); sun.position.set(-4,10,6);
  const lamp=new THREE.PointLight(0xffd9a0,1.6,16,1.4);   // your light: a soft pool that falls off with distance
  scene.add(amb,sun,lamp);
  // four real lights, moved to the torches and crystals nearest you (xLightPool): each throws a warm
  // or coloured pool on the floor and walls around it, and the rest of the room sinks into shadow
  const pool=[]; for(let k=0;k<4;k++){ const L=new THREE.PointLight(0xffa040,0,10,1.6); L.position.set(0,-50,0); scene.add(L); pool.push(L); }
  // dust drifting through the light around you, in the area's glow, as in the battle cave
  const DN=70, dpos=new Float32Array(DN*3); for(let k=0;k<DN;k++){ dpos[k*3]=(Math.random()-.5)*20; dpos[k*3+1]=Math.random()*3.2; dpos[k*3+2]=(Math.random()-.5)*16; }
  const dgeo=new THREE.BufferGeometry(); dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
  const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:0xffffff,size:.08,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
  dust.renderOrder=3; scene.add(dust);
  X3={renderer,scene,cam,amb,lamp,dust,pool,group:null,ray:new THREE.Raycaster(),plane:new THREE.Plane(new THREE.Vector3(0,1,0),0)};
  // the search reticle: a ring as wide as the area a search covers, with a cross at its heart
  const rm=new THREE.MeshBasicMaterial({color:0x7fe3ff,transparent:true,opacity:.9,depthTest:false}), ret=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(XCS*2.3,XCS*2.5,40),rm); ring.rotation.x=-Math.PI/2; ret.add(ring);
  for(const [w,d] of [[XCS*1.2,.14],[.14,XCS*1.2]]){ const b=new THREE.Mesh(new THREE.PlaneGeometry(w,d),rm); b.rotation.x=-Math.PI/2; ret.add(b); }
  ret.renderOrder=6; ret.traverse(o=>o.renderOrder=6); ret.visible=false; scene.add(ret); X3.reticle=ret;
  cv.addEventListener('pointerdown',e=>{ if(!EX||!EX.active||xPaused) return; e.preventDefault(); EX.needInput=false; try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    const [ax,ay]=appXY(e.clientX,e.clientY);
    if(EX.aim){ EX.aim.id=e.pointerId; EX.aim.cell=xAimCell(ax,ay); return; }
    XHOLD.id=e.pointerId; XHOLD.x=XHOLD.x0=ax; XHOLD.y=XHOLD.y0=ay; XHOLD.t0=performance.now(); XHOLD.on=true; XHOLD.stick=false;
    const m=xMoveMode();
    if(m==='tapstick'){}   // decided by what the finger does next (xMove and the release)
    else if(m==='goal') xGoalAt(ax,ay);
    else if(m==='fixed'){ const h=xStickHome(); if(Math.hypot(ax-h.x,ay-h.y)<XSTICK_R*1.6){ XHOLD.stick=true; XHOLD.x0=h.x; XHOLD.y0=h.y; EX.path=[]; EX.goal=null; } else xGoalAt(ax,ay); }
    else { EX.path=[]; EX.goal=null; XHOLD.stick=m==='float';
      if(m==='pad'){ const a=xFloorAt(ax,ay), b2=xFloorAt(ax+100,ay+100); XHOLD.kx=a&&b2?(b2.x-a.x)/100:.05; XHOLD.kz=a&&b2?(b2.z-a.z)/100:.05; XHOLD.px=EX.px; XHOLD.pz=EX.pz; } }
    xStickDraw(); });
  cv.addEventListener('pointermove',e=>{ if(EX&&EX.aim&&e.pointerId===EX.aim.id){ const [ax,ay]=appXY(e.clientX,e.clientY); EX.aim.cell=xAimCell(ax,ay); return; }
    if(e.pointerId===XHOLD.id){ [XHOLD.x,XHOLD.y]=appXY(e.clientX,e.clientY); if(xMoveMode()==='goal'||xMoveMode()==='fixed'&&!XHOLD.stick) xGoalAt(XHOLD.x,XHOLD.y); xStickDraw(); } });
  const end=e=>{ if(EX&&EX.aim&&e.pointerId===EX.aim.id) return xSearchAt(EX.aim.cell);
    if(e.pointerId!==XHOLD.id) return;
    if(xMoveMode()==='tapstick'&&!XHOLD.stick&&performance.now()-XHOLD.t0<XTAP_MS&&Math.hypot(XHOLD.x-XHOLD.x0,XHOLD.y-XHOLD.y0)<XTAP_PX) xGoalAt(XHOLD.x0,XHOLD.y0);   // a quick tap: walk there
    XHOLD.on=false; XHOLD.id=null; XHOLD.stick=false; xStickDraw(); };   // in Walk to touch, letting go keeps you walking to the goal
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',e=>{ XHOLD.on=false; XHOLD.id=null; XHOLD.stick=false; xStickDraw(); });
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  // the minimap: a tap opens it big, and it stays open. Tap a place you have discovered and the map
  // closes while you walk there on your own; tap the dark (or ✕) to close it.
  const mm=$('#xMini');
  mm.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); try{ mm.setPointerCapture(e.pointerId); }catch(_){} });
  mm.addEventListener('pointerup',e=>{ e.preventDefault(); e.stopPropagation(); if(!EX||!EX.active) return; if(!mm.classList.contains('big')) return xMapOpen(); xMapTap(e); });
  mm.addEventListener('contextmenu',e=>e.preventDefault());
  $('#xMapShade').addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); xMapClose(); });
  $('#xMapClose').addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); xMapClose(); });
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
function xSprite(getImg,h){ const s=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,alphaTest:.35})); s.center.set(.5,.03); s.scale.set(h,h,1); s.userData={getImg,img:null,flip:false,h}; return s; }
/* A sprite always faces the camera, so it leans back as the camera looks down, and its head
   would sink into the wall behind it. Stood up, it is slid toward the camera along the line of
   sight (and shrunk to match), so it looks exactly the same but sits in front of the back wall;
   a wall in front of it still hides its feet. */
const XPULL=1.5;
function xStand(s){ const c=X3.cam.position, p=s.position, dx=c.x-p.x, dy=c.y-p.y, dz=c.z-p.z, d=Math.hypot(dx,dy,dz); if(d<XPULL*2) return;
  const k=XPULL/d; p.set(p.x+dx*k,p.y+dy*k,p.z+dz*k); const h=(s.userData.h||s.scale.y)*(1-k); s.scale.set(h,h,1); }
// swap a sprite's picture (an animation frame, or facing the other way); each picture's texture is made once and kept
function xRefresh(s,flip){ const sp=s.userData.getImg(), im=sp&&sp.img; if(sp&&sp.front) flip=false;
  if(im&&(im!==s.userData.img||flip!==s.userData.flip)){ s.userData.img=im; s.userData.flip=flip;
    const cache=s.userData.tex||(s.userData.tex=new Map()), key=im; let pair=cache.get(key);
    if(!pair){ const a=xTex(im,true), b=xTex(im,true); b.repeat.x=-1; b.offset.x=1; pair=[a,b]; cache.set(key,pair); }
    s.material.map=pair[flip?1:0]; s.material.needsUpdate=true; } }
const xMat=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:6,specular:0x111111},o||{}));
const xBox=(w,h,d,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); return o; };

// a wall block: a box with chamfered top edges and corners; rough=true pushes its faces in and
// out a little (the same everywhere for the same point, so neighbouring faces still meet)
function xWallGeo(rough,seed){ const g=new THREE.BoxGeometry(XCS,XWALL,XCS,4,5,4), P=g.attributes.position, hw=XCS/2, hh=XWALL/2, B=rough?.13:.08;
  const hsh=(x,y,z)=>{ const v=Math.sin(x*127.1+y*311.7+z*74.7+seed*13.3)*43758.5453; return v-Math.floor(v); };
  for(let k=0;k<P.count;k++){ let x=P.getX(k), y=P.getY(k), z=P.getZ(k); const top=y>hh-1e-4, ex=Math.abs(Math.abs(x)-hw)<1e-4, ez=Math.abs(Math.abs(z)-hw)<1e-4;
    if(ex&&ez){ x-=Math.sign(x)*B*.5; z-=Math.sign(z)*B*.5; }   // the four upright corners are cut
    if(top){ const sx=(hw-B)/hw; x*=sx; z*=sx; }                  // the top face shrinks: a bevel all round
    if(rough&&!top&&y>-hh+1e-4){ const n=hsh(Math.round(x*10),Math.round(y*10),Math.round(z*10))-.5, m=hsh(Math.round(z*10),Math.round(y*10),Math.round(x*10))-.5;
      if(ex) x+=n*.14; if(ez) z+=m*.14; if(!ex&&!ez){ x+=n*.08; z+=m*.08; } y+=(hsh(x,y,z)-.5)*.06; }
    P.setXYZ(k,x,y,z); }
  g.computeVertexNormals();
  const N=g.attributes.normal, c=[];   // foot shadow up the face, a lit bevel, a near-black cap
  for(let k=0;k<P.count;k++){ const y=P.getY(k)/XWALL+.5, ny=N.getY(k); const a=ny>.85?.34:ny<-.5?.2:ny>.3?1.05:.45+.55*Math.min(1,y*1.4)-(y>.97?.12:0); c.push(a,a,a); }
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3)); return g; }
// where a wall block stands: turned a quarter (or not) and, for cave rock, a little taller or shorter, so no two look alike
function xWallMatrix(m,c,rock,cut){ const h=Math.sin(c*91.7+EX.depth*7.3)*43758.5453, r=h-Math.floor(h), sy=(rock?.9+r*.22:1)*(cut==null?1:cut);
  m.makeRotationY(Math.floor(r*4)*Math.PI/2); m.scale(new THREE.Vector3(1,sy,1)); m.setPosition(xw(c),XWALL*sy/2-.05,xz(c)); }
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
    // shade: each corner darkens with the rock around it, so floors sink softly into the walls
    const rock=(x,y)=>x<0||y<0||x>=XN||y>=XN||EX.t[xi(x,y)]===T_ROCK?1:0, col=[];
    for(let k=0;k<pos.length;k+=3){ const gx=Math.round(pos[k]/XCS), gy=Math.round(pos[k+2]/XCS);
      const n=rock(gx-1,gy-1)+rock(gx,gy-1)+rock(gx-1,gy)+rock(gx,gy); const a=n>=3?.38:n===2?.6:n===1?.78:1; col.push(a,a,a); }
    for(let k=0;k<col.length;k+=18){ const t=.9+((Math.sin(k*12.9898+seed)*43758.5453)%1+1)%1*.1; for(let j=0;j<18;j++) col[k+j]*=t; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); geo.computeVertexNormals();
    grp.add(new THREE.Mesh(geo,xPhong({map:xTex(cv,true),vertexColors:true}))); });
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
  EX.wIdx=new Map(); EX.wms=[]; EX.shown=new Uint8Array(XN*XN); EX.wCut=new Float32Array(XN*XN).fill(1); EX.wList=[];
  const zero=new THREE.Matrix4().makeScale(0,0,0), black=new THREE.Color(0,0,0);
  // each wall block is bevelled: its top edges and its corners are cut back, so blocks read as
  // stone with worn edges (and a groove runs between neighbours); cave rock is also knobbly
  const wgeos=[xWallGeo(true,seed),xWallGeo(false,seed),xWallGeo(false,seed+1)];
  walls.forEach((list,v)=>{ const wgeo=wgeos[v], wm=new THREE.InstancedMesh(wgeo,xPhong({map:xTex(wallTex[v]),vertexColors:true}),Math.max(1,list.length));
    wm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(wm); EX.wms.push(wm);
    for(let k=0;k<wm.count;k++){ wm.setMatrixAt(k,zero); wm.setColorAt(k,black); }
    list.forEach((c,k)=>EX.wIdx.set(c,[wm,k])); });
  // doors: an arched doorway of the area's stone, and while it is closed a plank door with iron
  // bands and studs, its top rounded to the arch; a locked door shows its lock: a bronze, silver or
  // gold plate, iron bars on a shortcut gate, red bands on a boss door
  const LOCK_COL={bronze:0xc8843a, silver:0xcfd8e6, gold:0xf2c94c, boss:0xff5d6c}, HR=1.4, AR=.78; EX.lanterns=[];
  const doorC=new THREE.Color('rgb('+xTone(S,.5).join(',')+')'), arcG=new THREE.TorusGeometry(.9,.13,6,14,Math.PI), topG=new THREE.CylinderGeometry(AR-.01,AR-.01,.15,16,1,false,-Math.PI/2,Math.PI), ringG=new THREE.TorusGeometry(.09,.02,4,10);
  for(const [i,d] of EX.doors){ const ew=EX.t[i-1]!==T_ROCK&&EX.t[i+1]!==T_ROCK, g=new THREE.Group(); g.position.set(xw(i),0,xz(i)); if(ew) g.rotation.y=Math.PI/2;
    // the stone: jambs, the arch, the stone above it and in its corners, merged into one mesh
    const F=xMerger(); F.add(XG.box,doorC,-XCS/2+.12,HR/2,0,0,0,0,.24,HR,.5); F.add(XG.box,doorC,XCS/2-.12,HR/2,0,0,0,0,.24,HR,.5); F.add(arcG,doorC,0,HR,0);
    F.add(XG.box,doorC,0,(XWALL+HR+1.02)/2,0,0,0,0,XCS,XWALL-(HR+1.02),.5); for(const sx of [-1,1]) F.add(XG.box,doorC,sx*.81,HR+.78,0,0,0,0,.38,.5,.5);
    g.add(F.build(xPhong({vertexColors:true})));
    const leaf=new THREE.Group(), boss=d.lock==='boss', planks=boss?0x3a1418:0x6a4426, band=boss?0xff5d6c:0x2a2a30, L=xMerger();
    if(d.lock==='gate'){ for(let k=0;k<5;k++){ const x=-.6+k*.3, top=HR+Math.sqrt(Math.max(0,AR*AR-x*x))-.04; L.add(XG.box,0x2a2a30,x,top/2,0,0,0,0,.07,top,.07); } L.add(XG.box,0x2a2a30,0,.5,0,0,0,0,XCS-.44,.08,.09); L.add(XG.box,0x2a2a30,0,1.2,0,0,0,0,XCS-.44,.08,.09); }
    else { const LW=XCS-.44;
      for(let k=0;k<4;k++) L.add(XG.box,k%2?(boss?0x2e1014:0x5a3820):planks,-LW/2+LW/8+k*LW/4,HR/2,0,0,0,0,LW/4-.025,HR,.15);
      L.add(topG,planks,0,HR,0,Math.PI/2,Math.PI,0);
      L.add(XG.box,band,0,.38,0,0,0,0,LW,.1,.18); L.add(XG.box,band,0,1.12,0,0,0,0,LW,.1,.18);
      for(const y of [.38,1.12]) for(const x of [-.55,0,.55]) for(const z of [-.1,.1]) L.add(XG.ball,0x2a2a30,x,y,z,0,0,0,.07,.07,.05);
      L.add(ringG,0x2a2a30,.5,.78,.11);
      if(LOCK_COL[d.lock]) for(const zz of [-.1,.1]) L.add(XG.box,LOCK_COL[d.lock],.38,.78,zz,0,0,0,.26,.32,.04); }
    leaf.add(L.build(xPhong({vertexColors:true,emissive:boss?0x200808:0x000000})));
    // a locked door hangs a lantern of its key's colour over the arch, both sides, seen from across the room
    if(LOCK_COL[d.lock]){ const lc=new THREE.Color(LOCK_COL[d.lock]), tex=xGlowTex.t||(xGlowTex.t=xGlowTex()), lan=[];
      for(const zz of [-.34,.34]){ const lg=new THREE.Group(); lg.position.set(0,HR+1.12,zz); lg.add(xBox(.05,.2,.05,xMat(0x2a2620),0,.12,0));
        const bulb=new THREE.Mesh(XG.ball,new THREE.MeshBasicMaterial({color:lc})); bulb.scale.set(.2,.24,.2); lg.add(bulb);
        const h=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:lc,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); h.scale.set(boss?2.6:1.8,boss?2.6:1.8,1); h.renderOrder=3; lg.add(h); g.add(lg); lan.push(h); }
      (EX.lanterns=EX.lanterns||[]).push({halos:lan,ph:Math.random()*6,boss}); }
    // the leaf hangs on a hinge at one jamb so it can swing (a gate's bars lift instead)
    const LW=XCS-.44, hinge=new THREE.Group(); if(d.lock!=='gate'){ hinge.position.x=-LW/2; leaf.position.x=LW/2; } hinge.add(leaf);
    g.add(hinge); d.mesh=g; d.leaf=hinge; d.ew=ew; d.cell=i; hinge.visible=d.state!=='secret'; if(d.state==='open') xDoorPose(d,1,1); g.visible=false; grp.add(g); }
  // stairs
  const glow=new THREE.Color(isBossDepth(EX.depth)?'#ff5d6c':A.glow);
  // the way down: a stairwell. Its steps run away from you (north), each lower and darker than the
  // last, between low stone walls, into the dark; a thin glow of the area's colour rims the top
  const W=XCS*.86, D=XCS*.86, N=5, stoneC=new THREE.Color(A.lit).lerp(new THREE.Color(0x6a6458),.55);
  const down=new THREE.Group(); down.position.set(xw(EX.down),0,xz(EX.down));
  down.add(xBox(W,.02,D,xMat(0x020203),0,.012,0));   // the dark at the bottom
  for(let k=0;k<N;k++){ const d=D/N, z=D/2-d*(k+.5), h=.3*(1-k/N);   // the nearest step is at floor level, the far ones sink
    const col=stoneC.clone().multiplyScalar(1-.17*k); down.add(xBox(W-.2,Math.max(.02,h),d*.96,xMat(col),0,Math.max(.01,h/2),z));
    down.add(xBox(W-.2,.012,d*.22,xMat(0x050506),0,Math.max(.02,h)+.004,z-d*.38)); }   // the dark lip where each step drops to the next
  const rimM=xMat(stoneC.clone().multiplyScalar(.8));
  down.add(xBox(.12,.42,D,rimM,-W/2,.21,0), xBox(.12,.42,D,rimM,W/2,.21,0), xBox(W+.12,.42,.12,rimM,0,.21,-D/2));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.05,6,12),new THREE.MeshBasicMaterial({color:glow})); ring.rotation.x=Math.PI/2; ring.position.set(0,.45,-D/2);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(W+.16,.03,.06),new THREE.MeshBasicMaterial({color:glow})); rim.position.set(0,.44,-D/2); down.add(rim);
  ring.visible=false; down.add(ring); down.userData.ring=ring; down.visible=false; grp.add(down); EX.downMesh=down;
  // the way up: worn stone steps climbing away from you toward a pale glow of daylight
  const up=new THREE.Group(); up.position.set(xw(EX.up),0,xz(EX.up));
  const upC=new THREE.Color(A.lit).lerp(new THREE.Color(0x9a9488),.5);
  for(let k=0;k<N;k++){ const d=D/N, z=D/2-d*(k+.5), h=.1+.11*k;
    const col=upC.clone().multiplyScalar(.8+.06*k); up.add(xBox(W-.2,h,d*.98,xMat(col),0,h/2,z));
    const h0=k?.1+.11*(k-1):0; up.add(xBox(W-.2,h-h0,.02,xMat(col.clone().multiplyScalar(.45)),0,h0+(h-h0)/2,z+d*.49+.011));   // each riser in shadow
    up.add(xBox(W-.2,.012,d*.12,xMat(col.clone().lerp(new THREE.Color(0xffffff),.25)),0,h+.006,z+d*.43)); }   // a worn, lighter nosing on each tread
  up.add(xBox(.12,.7,D,rimM,-W/2,.35,0), xBox(.12,.7,D,rimM,W/2,.35,0));
  const sky=new THREE.Mesh(new THREE.BoxGeometry(W-.2,.03,.08),new THREE.MeshBasicMaterial({color:0xfff2c0})); sky.position.set(0,.66,-D/2+.04); up.add(sky);
  up.visible=false; grp.add(up); EX.upMesh=up;
  // chests
  for(const c of EX.chests) grp.add(xChestMesh(c));
  // known traps get a plate when found
  for(const tr of EX.traps){ tr.mesh=null; tr.tell=null; if(tr.armed&&!tr.known) xTrapTell(tr,grp); }
  // the area's light: the same color as its battle cave, in the air, in your lamp and in the
  // crystals, lava, veins or motes along the room walls
  const glowC=new THREE.Color(A.glow);
  G.scene.background=new THREE.Color(A.fog).multiplyScalar(.3);
  G.scene.fog=new THREE.Fog(new THREE.Color(A.fog).multiplyScalar(.35),20,46);   // far things fade into the area's air
  // your own light on the floor: a soft circle in the area's colour, as in the old pixel crawlers
  EX.myGlow=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({map:xGlowTex(),color:new THREE.Color(A.glow).lerp(new THREE.Color(0xffe8c0),.5),transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}));
  EX.myGlow.rotation.x=-Math.PI/2; EX.myGlow.position.y=.05; EX.myGlow.renderOrder=2; grp.add(EX.myGlow);
  xFloorTrim(grp,A,S,seed); xChasm(grp,A,S,seed); xFloorDecals(grp,A,S,seed); xMotes(grp,A); xWeather(grp,A); EX.bats=[]; EX.drips=[]; EX.camX=null;
  if(!$('#xLowHp')){ const lo=document.createElement('div'); lo.id='xLowHp'; $('#xHurt').after(lo); }
  G.amb.color.set(0xffffff).lerp(glowC,.25); G.lamp.color.set(0xffd9a0).lerp(glowC,.3); G.dust.material.color.copy(glowC);
  xAreaLights(grp,A); xStairLights(grp,A); xWallDress(grp,A,S,seed);
  // you and the enemies are flat sprites standing in the 3D rooms, like the old dungeon crawlers
  // you are seen from behind and above, as in battle: the same four poses (stand, walk, cast, attack)
  EX.me=xSprite(()=>unitSprite({kind:'player',look:gearLook(save),view:EX.view||'front',pose:EX.pose||'idle'}),XSPR); grp.add(EX.me);
  for(const gp of EX.groups) xGroupSprites(gp,grp);
  if(typeof xBuildProps==='function') xBuildProps();   // people, puzzles, keys and the rest (dungeon.js)
}
/* The stairs are landmarks: a beam of light stands over each (the area's colour going down, red on a
   boss floor, pale daylight going up), and two torches on posts flank the way down. The beams and
   torches join the floor's lights, so the real lights find them too. */
function xStairLights(grp,A){ const tex=xGlowTex(), boss=isBossDepth(EX.depth);
  for(const [cell,col,torches] of [[EX.down,boss?'#ff5d6c':A.glow,true],[EX.up,'#fff2c0',false]]){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.75,.95,7,16,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(col),transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    beam.position.set(xw(cell),3.5,xz(cell)); beam.renderOrder=3; beam.visible=false; grp.add(beam);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:new THREE.Color(col),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); halo.scale.set(3,3,1); halo.position.set(xw(cell),.6,xz(cell)); halo.renderOrder=3; halo.visible=false; grp.add(halo);
    EX.glows.push({g:beam,floor:cell,mats:[beam.material],halo,ph:Math.random()*6,beam:true});
    if(torches){ const rr=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({map:xRuneTex(),color:new THREE.Color(col),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
      rr.rotation.x=-Math.PI/2; rr.position.set(xw(cell),.03,xz(cell)); rr.renderOrder=2; rr.visible=false; grp.add(rr); EX.runeRing=rr; }
    if(torches) for(const sx of [-1,1]){ const g=new THREE.Group(); g.position.set(xw(cell)+sx*XCS*.55,0,xz(cell)-XCS*.42); const iron=xMat(0x2a2620), mats=[];
      g.add(xBox(.1,1.5,.1,iron,0,.75,0), xBox(.3,.08,.3,iron,0,1.52,0));
      const flame=new THREE.Group(), fm=c=>{ const m=new THREE.MeshBasicMaterial({color:c,transparent:true}); mats.push(m); return m; };
      const f1=new THREE.Mesh(new THREE.ConeGeometry(.2,.6,6),fm(0xff7a2a)), f2=new THREE.Mesh(new THREE.ConeGeometry(.11,.38,6),fm(0xffe08a)); f1.position.y=.3; f2.position.y=.2; flame.add(f1,f2); flame.position.set(0,1.56,0); g.add(flame);
      const th=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffa040,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); th.scale.set(3,3,1); th.position.set(0,1.85,0); th.renderOrder=2; g.add(th);
      g.visible=false; grp.add(g); EX.glows.push({g,floor:cell,mats,halo:th,flame,torch:true,ph:Math.random()*6}); } } }
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
      g.add(xPool(tex,col,2.4)); g.visible=false; grp.add(g); EX.glows.push({g,floor,wall:xi(wx,wy),mats,halo,ph:R()*6}); }
    // one or two wall torches: an iron bracket, a flickering flame and a warm pool on the floor
    for(let k=Math.min(ok.length,1+(R()<.4?1:0));k>0;k--){ const [wx,wy,dx,dy]=ok.splice(R()*ok.length|0,1)[0], floor=xi(wx+dx,wy+dy);
      const g=new THREE.Group(); g.position.set((wx+.5+dx*.5)*XCS+dx*.04,0,(wy+.5+dy*.5)*XCS+dy*.04); g.rotation.y=Math.atan2(dx,dy);
      const iron=xMat(0x2a2620), warm=new THREE.Color(0xffa040), mats=[];
      g.add(xBox(.12,.55,.12,iron,0,1.45,.12), xBox(.34,.1,.34,iron,0,1.75,.22), xBox(.36,.06,.07,iron,0,1.45,.04));
      const flame=new THREE.Group(), fm=c=>{ const m=new THREE.MeshBasicMaterial({color:c,transparent:true}); mats.push(m); return m; };
      const f1=new THREE.Mesh(new THREE.ConeGeometry(.24,.7,6),fm(0xff7a2a)), f2=new THREE.Mesh(new THREE.ConeGeometry(.13,.45,6),fm(0xffe08a));
      f1.position.y=.35; f2.position.y=.24; flame.add(f1,f2); flame.position.set(0,1.8,.22); g.add(flame);
      const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:warm,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      halo.scale.set(4,4,1); halo.position.set(0,2.05,.35); halo.renderOrder=2; g.add(halo);
      const pool=xPool(tex,warm,4.2); g.add(pool);
      g.visible=false; grp.add(g); EX.glows.push({g,floor,wall:xi(wx,wy),mats,halo,pool,flame,torch:true,ph:R()*6}); } }
}
// the four real lights go to the lit torches and crystals nearest you; each fades in and out as it moves
function xLightPool(T,dt){ const G=X3; if(!G.pool) return; EX.lpT=(EX.lpT||0)-dt;
  if(EX.lpT<=0){ EX.lpT=.3; const near=(EX.glows||[]).filter(L=>L.g.visible&&EX.fogCur[L.floor]>.3).map(L=>[L,Math.hypot(L.g.position.x-EX.px,L.g.position.z-EX.pz)]).filter(a=>a[1]<16).sort((a,b)=>a[1]-b[1]).slice(0,G.pool.length).map(a=>a[0]);
    G.pool.forEach((P,i)=>{ const L=near[i]; P.userData.L=L||null; if(L){ const wp=new THREE.Vector3(); (L.flame||L.halo).getWorldPosition(wp); P.position.copy(wp); P.position.y=L.torch?2.1:1.1; P.color.set(L.torch?0xffa448:EX.area.glow); P.distance=L.torch?11:8; } }); }
  for(const P of G.pool){ const L=P.userData.L, tg=L?(L.torch?1.5*(.85+.1*Math.sin(T*11+L.ph)+.07*Math.sin(T*23.7+L.ph*3)):.9*(.85+.15*Math.sin(T*1.7+L.ph)))*Math.min(1,EX.fogCur[L.floor]*1.3):0;
    P.intensity+=(tg-P.intensity)*Math.min(1,dt*8); } }
/* ---------------- juice: sparks, dust, coins, flashes ----------------
   Small, short-lived effects: sparkles when you pick something up, dust puffs as you walk, coins
   that fly up to your gold, a flash as a fight begins, and the camera shake of a sprung trap. */
function xSparks(x,z,col,n,up){ if(!X3||!X3.group) return; const tex=xGlowTex.t||(xGlowTex.t=xGlowTex()); EX.fx=EX.fx||[];
  for(let k=0;k<(n||10);k++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); const a=Math.random()*6.3, v=.8+Math.random()*1.6;
    s.position.set(x,.5,z); s.scale.set(.35,.35,1); s.renderOrder=4; s.userData={vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:(up||2)+Math.random()*2,t:0,life:.55+Math.random()*.35,g:4,s:.35}; X3.group.add(s); EX.fx.push(s); } }
function xPuff(x,z){ if(!X3||!X3.group) return; const tex=xGlowTex.t||(xGlowTex.t=xGlowTex()); EX.fx=EX.fx||[];
  for(let k=0;k<2;k++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0x9a948a,transparent:true,opacity:.35,depthWrite:false})); s.position.set(x+(Math.random()-.5)*.4,.15,z+(Math.random()-.5)*.3+.2);
    s.scale.set(.4,.4,1); s.renderOrder=3; s.userData={vx:(Math.random()-.5)*.4,vz:(Math.random()-.5)*.4,vy:.4,t:0,life:.5,g:0,s:.4,grow:1.6,a0:.35}; X3.group.add(s); EX.fx.push(s); } }
function xFxTick(T,dt){
  if(EX.fx) EX.fx=EX.fx.filter(s=>{ const u=s.userData; u.t+=dt; u.vy-=u.g*dt; s.position.x+=u.vx*dt; s.position.y=Math.max(.05,s.position.y+u.vy*dt); s.position.z+=u.vz*dt;
    const k=u.t/u.life, sc=u.s*(1+(u.grow||0)*k); s.scale.set(sc,sc,1); s.material.opacity=(u.a0||1)*(1-k); if(k>=1){ X3.group.remove(s); s.material.dispose(); return false; } return true; });
  if(EX.walk&&!EX.busy){ EX.puffT=(EX.puffT||0)-dt; if(EX.puffT<=0){ EX.puffT=.26; xPuff(EX.px,EX.pz); } } }
// coins rise from where you are and fly up to the gold counter, which pops as they land
function xCoins(cell,n){ const G=X3, gold=$('#xGold'); if(!G||!gold) return; const r=appBox($('#xView')), v=new THREE.Vector3(xw(cell),1,xz(cell)).project(G.cam);
  const sx=r.left+(v.x+1)/2*r.width, sy=r.top+(1-v.y)/2*r.height, t=gold.getBoundingClientRect();
  for(let k=0;k<n;k++){ const c=document.createElement('span'); c.className='xcoin'; c.style.left=sx+'px'; c.style.top=sy+'px'; document.body.appendChild(c);
    const dx=(Math.random()-.5)*60, dy=-30-Math.random()*40, ex=t.left+12-sx, ey=t.top+t.height/2-sy;
    const an=c.animate([{transform:'translate(-50%,-50%) scale(.6)'},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1)`,offset:.35},{transform:`translate(calc(-50% + ${ex}px),calc(-50% + ${ey}px)) scale(.7)`}],{duration:650+k*45,easing:'cubic-bezier(.3,.1,.4,1)',fill:'forwards'});
    an.onfinish=()=>{ c.remove(); gold.animate([{transform:'scale(1)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:180}); }; } }
// a burst of light that swells and fades (a chest opening)
function xBloom(x,y,z,col,size){ if(!X3||!X3.group) return; const tex=xGlowTex.t||(xGlowTex.t=xGlowTex()), s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  s.position.set(x,y,z); s.renderOrder=4; s.userData={vx:0,vz:0,vy:.4,t:0,life:.6,g:0,s:size*.5,grow:1.2,a0:1}; X3.group.add(s); (EX.fx=EX.fx||[]).push(s); }
// a wide text label for names over monsters
function xLabel(txt,col){ const c=document.createElement('canvas'); c.width=256; c.height=40; const x=c.getContext('2d');
  x.font='700 24px "Pixelify Sans",monospace'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=5; x.strokeStyle='rgba(0,0,0,.85)'; x.strokeText(txt,128,21); x.fillStyle=col; x.fillText(txt,128,21);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:xTex(c),transparent:true,depthTest:false})); s.scale.set(3.2,.5,1); s.center.set(.5,0); s.renderOrder=5; return s; }
// a ring of runes for the floor round the stairs down
function xRuneTex(){ if(xRuneTex.t) return xRuneTex.t; const N=128, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), m=N/2;
  x.strokeStyle='#fff'; x.lineWidth=3; x.beginPath(); x.arc(m,m,58,0,7); x.stroke(); x.lineWidth=2; x.beginPath(); x.arc(m,m,44,0,7); x.stroke();
  x.fillStyle='#fff'; for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; x.save(); x.translate(m+Math.cos(a)*51,m+Math.sin(a)*51); x.rotate(a+Math.PI/2); x.fillRect(-3,-4,2,8); x.fillRect(-3,-4,6,2); if(k%2) x.fillRect(1,0,2,4); else x.fillRect(-1,2,4,2); x.restore(); }
  return xRuneTex.t=xTex(c); }
/* ---------------- weather and small life ----------------
   Each area has its own air around you: fireflies in the Hollows, snow in the Deeps, crackling
   sparks in the Storm Vault, ash falling in the Ember Rifts, gold dust in the Ruins and twinkling
   motes in the Abyss. Now and then bats flit over, and in damp places drips ripple on the floor. */
const XWEATHER={ crystal:'fireflies', ice:'snow', storm:'sparks', lava:'ash', gold:'gold', stars:'twinkle' };
function xWeather(grp,A){ const kind=XWEATHER[A.veins]||'twinkle', N=kind==='snow'?160:kind==='ash'?140:90, pos=new Float32Array(N*3), col=new Float32Array(N*3), st=[];
  const base=new THREE.Color({fireflies:'#9dff7a',snow:'#eef6ff',sparks:'#fff39a',ash:'#a09890',gold:'#f2c94c',twinkle:'#e9f0ff'}[kind]);
  for(let k=0;k<N;k++){ pos[k*3]=(Math.random()-.5)*30; pos[k*3+1]=Math.random()*6; pos[k*3+2]=(Math.random()-.5)*24; st.push({ph:Math.random()*6.3,sp:.5+Math.random(),ember:kind==='ash'&&Math.random()<.25}); col[k*3]=base.r; col[k*3+1]=base.g; col[k*3+2]=base.b; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({size:kind==='snow'?.12:kind==='ash'?.11:kind==='fireflies'?.24:.18,vertexColors:true,transparent:true,opacity:.85,blending:kind==='ash'?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false}));
  p.renderOrder=3; p.userData={kind,st,base}; grp.add(p); EX.weather=p; EX.lifeT=6+Math.random()*6; EX.dripT=2; }
function xWeatherTick(T,dt){ const W=EX.weather; if(!W) return; const a=W.geometry.attributes.position.array, c=W.geometry.attributes.color.array, {kind,st,base}=W.userData, cx=EX.px, cz=EX.pz;
  for(let k=0;k<st.length;k++){ const s=st[k], i=k*3; let x=a[i], y=a[i+1], z=a[i+2], b=1;
    if(kind==='snow'){ y-=dt*.9*s.sp; x+=Math.sin(T*.7+s.ph)*dt*.4; if(y<0) y=6; }
    else if(kind==='ash'){ if(s.ember){ y+=dt*1.1*s.sp; if(y>6) y=0; b=.6+.4*Math.sin(T*9+s.ph); } else { y-=dt*.45*s.sp; x+=Math.sin(T*.5+s.ph)*dt*.3; if(y<0) y=6; } }
    else if(kind==='fireflies'){ x+=Math.sin(T*.6*s.sp+s.ph)*dt*.6; z+=Math.cos(T*.5*s.sp+s.ph*2)*dt*.6; y=.4+1.8*(.5+.5*Math.sin(T*.3+s.ph)); b=Math.max(0,Math.sin(T*1.7*s.sp+s.ph))**3; }
    else if(kind==='sparks'){ b=Math.random()<.04?1:Math.max(0,b*.0); if(Math.random()<.01){ x=cx+(Math.random()-.5)*30; z=cz+(Math.random()-.5)*24; y=Math.random()*4; } }
    else if(kind==='gold'){ y+=dt*.25*s.sp; x+=Math.sin(T*.4+s.ph)*dt*.15; if(y>5) y=0; b=.5+.5*Math.sin(T*2*s.sp+s.ph); }
    else { y+=Math.sin(T*.3+s.ph)*dt*.1; b=.3+.7*Math.max(0,Math.sin(T*1.2*s.sp+s.ph)); }
    // keep the air around you
    if(x<cx-15) x+=30; else if(x>cx+15) x-=30; if(z<cz-12) z+=24; else if(z>cz+12) z-=24;
    a[i]=x; a[i+1]=y; a[i+2]=z;
    const col=s.ember?[1,.45,.15]:[base.r,base.g,base.b]; c[i]=col[0]*b; c[i+1]=col[1]*b; c[i+2]=col[2]*b; }
  W.geometry.attributes.position.needsUpdate=true; W.geometry.attributes.color.needsUpdate=true; }
function xBatTex(up){ const N=32, c=document.createElement('canvas'); c.width=N; c.height=16; const x=c.getContext('2d'); x.fillStyle='#0b0a10';
  x.fillRect(14,6,4,5); x.fillRect(15,4,1,2); x.fillRect(17,4,1,2);
  if(up){ x.beginPath(); x.moveTo(14,8); x.lineTo(2,1); x.lineTo(6,7); x.lineTo(1,9); x.closePath(); x.fill(); x.beginPath(); x.moveTo(18,8); x.lineTo(30,1); x.lineTo(26,7); x.lineTo(31,9); x.closePath(); x.fill(); }
  else { x.beginPath(); x.moveTo(14,8); x.lineTo(2,13); x.lineTo(7,10); x.lineTo(1,15); x.closePath(); x.fill(); x.beginPath(); x.moveTo(18,8); x.lineTo(30,13); x.lineTo(25,10); x.lineTo(31,15); x.closePath(); x.fill(); }
  return xTex(c); }
function xLifeTick(T,dt){ if(EX.busy) return;
  // bats: a little flock crosses high over the room now and then
  EX.lifeT=(EX.lifeT||8)-dt;
  if(EX.lifeT<=0&&['crystal','lava','stars','ice'].includes(EX.area.veins)){ EX.lifeT=9+Math.random()*10; const tu=xBatTex.u||(xBatTex.u=xBatTex(1)), td=xBatTex.d||(xBatTex.d=xBatTex(0)), dir=Math.random()<.5?1:-1, z0=EX.pz-4+Math.random()*6;
    for(let k=0;k<2+(Math.random()*3|0);k++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tu,transparent:true,depthWrite:false})); s.scale.set(1.1,.55,1); s.renderOrder=4;
      s.position.set(EX.px-dir*16-dir*k*1.2,3.6+Math.random()*1.4,z0+(Math.random()-.5)*3); s.userData={bat:1,dir,t:0,ph:Math.random()*6,tu,td,y0:s.position.y}; X3.group.add(s); (EX.bats=EX.bats||[]).push(s); } }
  if(EX.bats) EX.bats=EX.bats.filter(s=>{ const u=s.userData; u.t+=dt; s.position.x+=u.dir*dt*8; s.position.y=u.y0+Math.sin(u.t*5+u.ph)*.35; s.material.map=Math.floor(u.t*12+u.ph)%2?u.tu:u.td;
    if(u.t>4.2){ X3.group.remove(s); s.material.dispose(); return false; } return true; });
  // drips: a ring spreads on the floor near you in damp places
  if(['crystal','ice'].includes(EX.area.veins)){ EX.dripT-=dt; if(EX.dripT<=0){ EX.dripT=1.5+Math.random()*2.5; const x=EX.px+(Math.random()-.5)*12, z=EX.pz+(Math.random()-.5)*9, c=xcell(x,z);
      if(c>=0&&EX.t[c]===T_FLOOR&&EX.vis[c]){ const r=new THREE.Mesh(new THREE.RingGeometry(.12,.17,20),new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.6,depthWrite:false}));
        r.rotation.x=-Math.PI/2; r.position.set(x,.04,z); r.renderOrder=2; X3.group.add(r); (EX.drips=EX.drips||[]).push(r); r.userData.t=0; } } }
  if(EX.drips) EX.drips=EX.drips.filter(r=>{ r.userData.t+=dt; const k=r.userData.t/1.1, s=1+k*5; r.scale.set(s,s,1); r.material.opacity=.6*(1-k); if(k>=1){ X3.group.remove(r); r.geometry.dispose(); r.material.dispose(); return false; } return true; }); }
function xFlashView(ms){ const v=$('#xView'); if(v&&v.animate) v.animate([{filter:'brightness(1)'},{filter:'brightness(2.6) saturate(.6)'},{filter:'brightness(1)'}],{duration:ms||300}); }
/* ---------------- the depth around the dungeon ----------------
   The rooms are cut into rock that stands over a deep chasm. Behind the walls you have seen, the
   darkness thins and you look down: a faint glow of the area's colour far below, distant specks
   of light, and dust drifting up out of it. */
function xChasmTex(A,S,seed){ const N=256, R=caveRng(seed+5), f=xFbm(N,R,3), c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N);
  const g=xHexRGB(A.glow), fg=xHexRGB(A.fog);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const v=f(i,j), k=Math.max(0,v-.45)*1.6, o=(j*N+i)*4, q=Math.round(k*6)/6;
    im.data[o]=Math.min(255,fg[0]*.8+g[0]*q*.55); im.data[o+1]=Math.min(255,fg[1]*.8+g[1]*q*.55); im.data[o+2]=Math.min(255,fg[2]*.8+g[2]*q*.55); im.data[o+3]=255; }
  x.putImageData(im,0,0); for(let n=0;n<420;n++){ x.fillStyle=n%4?'rgba(255,255,255,.55)':A.glow; x.fillRect(R()*N|0,R()*N|0,n%9?1:2,1); }
  return c; }
function xChasm(grp,A,S,seed){ const span=XN*XCS, t=xTex(xChasmTex(A,S,seed),true); t.repeat.set(5,5);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(span*1.6,span*1.6),new THREE.MeshBasicMaterial({map:t,fog:false}));
  m.rotation.x=-Math.PI/2; m.position.set(span/2,-9,span/2); grp.add(m);
  // dust rising out of the dark below, around you
  // floating islands far below: knobbly rocks with a rim of the area's light underneath
  { const R=caveRng(seed+71), I=xMerger(), G2=xMerger(), dk=new THREE.Color('rgb('+xTone(S,.18).join(',')+')'), rim=new THREE.Color(A.glow);
    for(let n=0;n<26;n++){ const cx=R()*span, cz=R()*span; if(EX.t[xcell(cx,cz)]!==T_ROCK) continue; const y=-3.5-R()*4, s=1.2+R()*2.6;
      I.add(XG.rock,dk,cx,y,cz,R()*3,R()*3,0,s*1.4,s*.7,s*1.2); I.add(XG.rock,dk,cx+(R()-.5)*s,y-s*.45,cz+(R()-.5)*s,R()*3,R()*3,0,s*.7,s*.6,s*.6);
      G2.add(XG.ball,rim,cx,y-s*.25,cz,0,0,0,s*1.3,.08,s*1.1); }
    if(I.size()){ grp.add(I.build(new THREE.MeshBasicMaterial({vertexColors:true,fog:false}))); const gl=G2.build(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); gl.renderOrder=0; grp.add(gl); } }
  // a slow fog drifting over the deep
  { const N=128, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), R=caveRng(seed+9), f=xFbm(N,R,4), im=x.createImageData(N,N), fg=xHexRGB(A.glow);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const v=Math.max(0,f(i,j)-.5)*2.2, o=(j*N+i)*4; im.data[o]=fg[0]; im.data[o+1]=fg[1]; im.data[o+2]=fg[2]; im.data[o+3]=Math.round(Math.min(1,v)*120); }
    x.putImageData(im,0,0); const t=xTex(c,true); t.magFilter=t.minFilter=THREE.LinearFilter; t.repeat.set(3,3);
    EX.deepFog=new THREE.Mesh(new THREE.PlaneGeometry(span*1.6,span*1.6),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.6,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
    EX.deepFog.rotation.x=-Math.PI/2; EX.deepFog.position.set(span/2,-2.2,span/2); EX.deepFog.renderOrder=0; grp.add(EX.deepFog); }
  const N=170, pos=new Float32Array(N*3); for(let k=0;k<N;k++){ pos[k*3]=(Math.random()-.5)*34; pos[k*3+1]=-9+Math.random()*9; pos[k*3+2]=(Math.random()-.5)*26; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  EX.rise=new THREE.Points(g,new THREE.PointsMaterial({color:new THREE.Color(A.glow).lerp(new THREE.Color(0xffffff),.3),size:.15,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  EX.rise.renderOrder=0; grp.add(EX.rise); }
/* Floor details: cracks, moss, scorch or frost by area, and pools that glow in the area's colour
   and pulse, drawn from one small sheet of pixel decals and merged into two meshes. */
function xDecalSheet(A,S){ const T=64, c=document.createElement('canvas'); c.width=T*8; c.height=T; const x=c.getContext('2d'), R=caveRng(17), dk='rgba(0,0,0,.6)';
  // 0: a crack
  x.strokeStyle=dk; x.lineWidth=2; for(let b=0;b<3;b++){ let px=32, py=32, a=R()*6.3; x.beginPath(); x.moveTo(px,py); for(let m=0;m<9;m++){ a+=(R()-.5)*.9; px+=Math.cos(a)*4; py+=Math.sin(a)*4; x.lineTo(px,py); } x.stroke(); }
  // 1: the area's stain (moss, scorch, frost or dust)
  const kind=A.veins==='lava'?'scorch':A.veins==='ice'?'frost':A.veins==='crystal'?'moss':'dust', col={scorch:'rgba(10,6,4,.7)',frost:'rgba(220,240,255,.45)',moss:'rgba(70,130,60,.7)',dust:'rgba(120,110,100,.35)'}[kind];
  for(let n=0;n<160;n++){ const r=R()*26, a=R()*6.3, px=T+32+Math.cos(a)*r, py=32+Math.sin(a)*r*.8; x.fillStyle=col; x.globalAlpha=(1-r/28); x.fillRect(px|0,py|0,2,2); } x.globalAlpha=1;
  // 2: a glowing pool (drawn white: the mesh tints it), soft edge in steps
  for(let s=0;s<5;s++){ x.fillStyle='rgba(255,255,255,'+(.15+s*.16)+')'; x.beginPath(); x.ellipse(T*2+32,32,28-s*5,20-s*4,0,0,7); x.fill(); }
  x.fillStyle='rgba(255,255,255,.9)'; for(let n=0;n<6;n++) x.fillRect(T*2+20+R()*24|0,24+R()*16|0,2,1);
  // 3: loose stones and grit
  for(let n=0;n<14;n++){ const px=T*3+8+R()*48|0, py=8+R()*48|0, w=2+R()*3|0; x.fillStyle='rgba(0,0,0,.5)'; x.fillRect(px+1,py+1,w,w-1); x.fillStyle='rgb('+xTone(S,.7).join(',')+')'; x.fillRect(px,py,w,w-1); }
  // 4: a broken slab: a jagged dark hole with a lit lip and rubble in it
  { const o=T*4, pts=[]; for(let k=0;k<9;k++){ const a=k/9*6.28, r=18+R()*10; pts.push([o+32+Math.cos(a)*r,32+Math.sin(a)*r*.8]); }
    x.fillStyle='rgb('+xTone(S,.8).join(',')+')'; x.beginPath(); pts.forEach(([px,py],k)=>k?x.lineTo(px,py-2):x.moveTo(px,py-2)); x.closePath(); x.fill();
    x.fillStyle='rgba(10,10,12,.72)'; x.beginPath(); pts.forEach(([px,py],k)=>k?x.lineTo(px,py):x.moveTo(px,py)); x.closePath(); x.fill();
    for(let n=0;n<9;n++){ const px=o+20+R()*24|0, py=24+R()*16|0, w=2+R()*4|0; x.fillStyle='rgb('+xTone(S,.35+R()*.3).join(',')+')'; x.fillRect(px,py,w,w-1); } }
  // 5: worn stone: a lighter, smoother patch
  { const g=x.createRadialGradient(T*5+32,32,2,T*5+32,32,30); g.addColorStop(0,'rgba(255,255,255,.16)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(T*5,0,T,T); }
  // 6: a wet puddle (the mesh makes it shine)
  for(let s=0;s<3;s++){ x.fillStyle='rgba(255,255,255,'+(.35+s*.25)+')'; x.beginPath(); x.ellipse(T*6+32,32,26-s*6,17-s*4,0,0,7); x.fill(); }
  // 7: grime along a wall: dark at the top edge, gone by the bottom
  { const g=x.createLinearGradient(0,0,0,T); g.addColorStop(0,'rgba(0,0,0,.6)'); g.addColorStop(.6,'rgba(0,0,0,.15)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(T*7,0,T,T);
    for(let n=0;n<60;n++){ x.fillStyle='rgba(0,0,0,'+(.2+R()*.3)+')'; x.fillRect(T*7+R()*T|0,R()*R()*T|0,1+R()*2|0,1); } }
  return xTex(c); }
function xFloorDecals(grp,A,S,seed){ const R=caveRng(seed+333), sheet=xDecalSheet(A,S), P=[[],[]], U=[[],[]];
  P.push([]); U.push([]);   // layer 2: wet puddles that shine
  const quad=(L,cx,cz,size,k,rot,len)=>{ const h=size/2, hl=(len||size)/2, cs=Math.cos(rot), sn=Math.sin(rot), pt=(u,v)=>[cx+(u*hl*cs-v*h*sn),.02,cz+(u*hl*sn+v*h*cs)], a=pt(-1,-1), b=pt(-1,1), c=pt(1,1), d=pt(1,-1), u0=k/8, u1=(k+1)/8;
    P[L].push(...a,...b,...c,...a,...c,...d); U[L].push(u0,1, u0,0, u1,0, u0,1, u1,0, u1,1); };
  for(let c=0;c<XN*XN;c++){ if(EX.t[c]!==T_FLOOR||c===EX.up||c===EX.down||EX.traps.some(t=>t.cell===c)) continue; const r=R(), room=EX.room[c]>=0;
    const cx=xw(c)+(R()-.5)*1.2, cz=xz(c)+(R()-.5)*1.2;
    const wet=A.veins==='ice'?.1:.04;
    if(r<.05) quad(1,cx,cz,1.6+R()*1.2,2,R()*6.3);              // a glowing pool
    else if(r<.17) quad(0,cx,cz,1.4+R()*1,room?1:3,R()*6.3);     // a stain, or grit in a corridor
    else if(r<.27) quad(0,cx,cz,1.2+R()*.8,0,R()*6.3);            // a crack
    else if(r<.27+wet) quad(2,cx,cz,1.3+R()*1.1,6,R()*6.3);       // a wet puddle
    else if(r<.29+wet&&room) quad(0,xw(c),xz(c),1.5,4,(R()*4|0)*Math.PI/2); }   // a broken slab
  // grime gathers along every room wall, and the stone is worn pale on the way in from each door
  for(const r of EX.rooms){ if(r.nook) continue; const X0=r.x*XCS, X1=(r.x+r.w)*XCS, Z0=r.y*XCS, Z1=(r.y+r.h)*XCS, d=.9;
    quad(0,(X0+X1)/2,Z0+d/2,d,7,0,X1-X0); quad(0,(X0+X1)/2,Z1-d/2,d,7,Math.PI,X1-X0); quad(0,X0+d/2,(Z0+Z1)/2,d,7,-Math.PI/2,Z1-Z0); quad(0,X1-d/2,(Z0+Z1)/2,d,7,Math.PI/2,Z1-Z0); }
  for(const [i] of EX.doors){ for(const n of xAdj4(i)){ if(EX.t[n]!==T_FLOOR||EX.room[n]<0) continue; const dx=xcx(n)-xcx(i), dy=xcy(n)-xcy(i);
      for(let k=0;k<3;k++){ const c=n+k*(dx+dy*XN); if(c<0||EX.t[c]!==T_FLOOR) break; quad(0,xw(c),xz(c),2.4-k*.4,5,0); } } }
  const mk=(L,mat)=>{ if(!P[L].length) return null; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P[L],3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U[L],2)); g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.renderOrder=1; grp.add(m); return m; };
  mk(0,new THREE.MeshPhongMaterial({map:sheet,transparent:true,depthWrite:false,shininess:2,polygonOffset:true,polygonOffsetFactor:-2}));
  EX.puddles=mk(1,new THREE.MeshBasicMaterial({map:sheet,color:new THREE.Color(A.glow),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
  mk(2,new THREE.MeshPhongMaterial({map:sheet,color:new THREE.Color(A.fog).lerp(new THREE.Color(0x203040),.5),transparent:true,opacity:.55,depthWrite:false,shininess:60,specular:0x3a4a5a,polygonOffset:true,polygonOffsetFactor:-3})); }
// glowing motes that rise and wink around the lights near you
function xMotes(grp,A){ const N=48, pos=new Float32Array(N*3).fill(-50), g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  EX.motes=new THREE.Points(g,new THREE.PointsMaterial({color:0xffd9a0,size:.14,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false})); EX.motes.userData.ph=Array.from({length:N},()=>Math.random()); grp.add(EX.motes); }
function xAirTick(T,dt){
  if(EX.rise){ const a=EX.rise.geometry.attributes.position.array; for(let k=0;k<a.length;k+=3){ a[k+1]+=dt*(.6+((k*7)%5)*.12); if(a[k+1]>-.3) a[k+1]=-9; } EX.rise.geometry.attributes.position.needsUpdate=true; EX.rise.position.set(EX.px,0,EX.pz); }
  if(EX.puddles) EX.puddles.material.opacity=.42+.12*Math.sin(T*1.6);
  if(EX.deepFog){ EX.deepFog.material.map.offset.x=T*.006; EX.deepFog.material.map.offset.y=T*.004; }
  if(EX.motes){ const a=EX.motes.geometry.attributes.position.array, ph=EX.motes.userData.ph, L=(X3.pool||[]).map(P=>P.userData.L).filter(Boolean);
    for(let k=0;k<ph.length;k++){ const src=L[k%Math.max(1,L.length)]; if(!src){ a[k*3+1]=-50; continue; } ph[k]=(ph[k]+dt*.22)%1;
      const wp=X3.pool[k%L.length].position, s=Math.sin(k*12.9)*.5+.5, c=Math.cos(k*7.3)*.5+.5;
      a[k*3]=wp.x+(s-.5)*2.2+Math.sin(T*.8+k)*.15; a[k*3+1]=(src.torch?1.2:.2)+ph[k]*2; a[k*3+2]=wp.z+(c-.5)*1.6+.5; }
    EX.motes.geometry.attributes.position.needsUpdate=true; EX.motes.material.opacity=.55+.25*Math.sin(T*3); } }
/* ---------------- dressing the walls and rooms ----------------
   Room walls get a lit trim line along their top edge in the area's accent; pillars stand at room
   corners and either side of every doorway; and each room is furnished by its kind (a store, a
   shrine, a crypt or a cave) and the area: barrels, crates, sacks, urns, bones, rubble, glowing
   mushrooms, candles, statues, banners, vines and cobwebs. Furniture is merged into one mesh per
   room (and one for the things that glow) so a floor stays cheap to draw. Nothing here blocks you. */
// collect boxes, cylinders and the rest into one vertex-coloured geometry
function xMerger(){ const P=[], N=[], C=[], tmp=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
  return { add(geo,col,x,y,z,rx,ry,rz,sx,sy,sz){ const g=geo.index?geo.toNonIndexed():geo.clone(); e.set(rx||0,ry||0,rz||0); q.setFromEuler(e);
      tmp.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx||1,sy||1,sz||1)); g.applyMatrix4(tmp); const p=g.attributes.position.array, n=g.attributes.normal.array, c=new THREE.Color(col);
      for(let i=0;i<p.length;i++){ P.push(p[i]); N.push(n[i]); } for(let i=0;i<p.length/3;i++) C.push(c.r,c.g,c.b); g.dispose(); },
    size:()=>P.length,
    build(mat){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); return new THREE.Mesh(g,mat); } }; }
const XG={ box:new THREE.BoxGeometry(1,1,1), cyl:new THREE.CylinderGeometry(.5,.5,1,10), cone:new THREE.ConeGeometry(.5,1,8), ball:new THREE.SphereGeometry(.5,8,6), rock:new THREE.DodecahedronGeometry(.5,0), half:new THREE.SphereGeometry(.5,8,4,0,Math.PI*2,0,Math.PI/2) };
// one piece of furniture at (x,z), facing into the room (ry); S: the area's stone, A: the area
function xFurnish(M0,L0,kind,x,z,ry,R,A,S){ const K=1.4, sc=T=>({add:(g,c,px,py,pz,rx,ry2,rz,sx,sy,sz)=>T.add(g,c,x+(px-x)*K,py*K,z+(pz-z)*K,rx,ry2,rz,(sx||1)*K,(sy||1)*K,(sz||1)*K)}), M=sc(M0), L=sc(L0);   // furniture scaled to stand by a person
  const st=new THREE.Color('rgb('+xTone(S,.55).join(',')+')'), dk=new THREE.Color('rgb('+xTone(S,.25).join(',')+')'), glow=A.glow;
  const W=0x6e4a2a, W2=0x4a3018, IRON=0x2c2a28, BONE=0xd8d0b8;
  switch(kind){
    case 'barrel': M.add(XG.cyl,W,x,.34,z,0,ry,0,.56,.68,.56); M.add(XG.cyl,IRON,x,.14,z,0,0,0,.58,.05,.58); M.add(XG.cyl,IRON,x,.54,z,0,0,0,.58,.05,.58); M.add(XG.cyl,W2,x,.69,z,0,0,0,.5,.02,.5); break;
    case 'crate': { const s=.5+R()*.15; M.add(XG.box,0x8a6034,x,s/2,z,0,ry+R()*.4,0,s,s,s); M.add(XG.box,W2,x,s/2,z,0,ry,0,s*1.02,s*.14,s*1.02); if(R()<.5) M.add(XG.box,0x8a6034,x+.05,s+s*.35,z,0,ry+.6,0,s*.7,s*.7,s*.7); break; }
    case 'sack': M.add(XG.ball,0xb09060,x,.22,z,0,ry,0,.5,.44,.46); M.add(XG.cone,0xa08050,x,.48,z,0,0,0,.2,.16,.2); break;
    case 'urn': { const c=R()<.5?0xb05a30:0x8a6a4a; M.add(XG.ball,c,x,.3,z,0,0,0,.42,.5,.42); M.add(XG.cyl,c,x,.6,z,0,0,0,.2,.16,.2); M.add(XG.cyl,0x3a2014,x,.67,z,0,0,0,.26,.03,.26); M.add(XG.cyl,0x1a0e08,x,.3,z,0,0,0,.43,.05,.43); break; }
    case 'bones': for(let k=0;k<3;k++) M.add(XG.box,BONE,x+(R()-.5)*.5,.03,z+(R()-.5)*.5,0,R()*3,0,.42,.05,.06); M.add(XG.ball,BONE,x+(R()-.5)*.3,.1,z+(R()-.5)*.3,0,0,0,.2,.18,.2); break;
    case 'skulls': for(let k=0;k<4;k++) M.add(XG.ball,BONE,x+(k%2-.5)*.22,.1+(k>1?.15:0),z+(k>1?0:(R()-.5)*.2),0,0,0,.2,.18,.2); break;
    case 'rubble': for(let k=0;k<4;k++){ const s=.15+R()*.25; M.add(XG.rock,R()<.5?st:dk,x+(R()-.5)*.6,s*.4,z+(R()-.5)*.6,R()*3,R()*3,0,s,s,s); } break;
    case 'statue': M.add(XG.box,dk,x,.25,z,0,ry,0,.62,.5,.62); M.add(XG.box,st,x,.6,z,0,ry,0,.36,.3,.3); M.add(XG.ball,st,x,.92,z,0,0,0,.28,.3,.28); M.add(XG.box,st,x,.62,z,0,ry,0,.62,.1,.14); break;
    case 'candles': for(let k=0;k<3;k++){ const cx=x+(k-1)*.16, h=.14+R()*.14; M.add(XG.cyl,0xeae2c8,cx,h/2,z+(R()-.5)*.1,0,0,0,.07,h,.07); L.add(XG.cone,0xffc060,cx,h+.06,z,0,0,0,.05,.1,.05); } break;
    case 'shelf': { const cs=Math.cos(ry), sn=Math.sin(ry), at=(u,v)=>[x+u*cs+v*sn,z-u*sn+v*cs];   // u along the wall, v out from it
      const [a0,b0]=at(0,0); M.add(XG.box,W2,a0,.68,b0,0,ry,0,.92,1.36,.3);
      for(let r=0;r<3;r++){ const y=.18+r*.4; const [a1,b1]=at(0,.02); M.add(XG.box,W,a1,y,b1,0,ry,0,.88,.04,.3);
        let u=-.38; while(u<.36){ const w=.06+R()*.06, h=.22+R()*.1, [bx,bz]=at(u+w/2,.04); M.add(XG.box,[0x7a2a24,0x2a4a6a,0x3a5a2a,0x8a6a2a,0x5a2a5a][R()*5|0],bx,y+.02+h/2,bz,0,ry,R()<.15?.25:0,w,h,.2); u+=w+.01; } } break; }
    case 'rack': { const cs=Math.cos(ry), sn=Math.sin(ry), at=(u,v)=>[x+u*cs+v*sn,z-u*sn+v*cs]; for(const u of [-.36,.36]){ const [a,b]=at(u,0); M.add(XG.box,W2,a,.5,b,0,ry,0,.06,1,.06); }
      { const [a,b]=at(0,0); M.add(XG.box,W2,a,.82,b,0,ry,0,.82,.05,.06); M.add(XG.box,W2,a,.3,b,0,ry,0,.82,.05,.06); }
      for(let k=0;k<4;k++){ const u=-.27+k*.18, [a,b]=at(u,.06); M.add(XG.cyl,0x5a4030,a,.6,b,0,0,(R()-.5)*.1,.025,1.2,.025); L.add(XG.cone,0xb8c0c8,a,1.24,b,0,0,0,.05,.12,.05); }
      if(R()<.6){ const [a,b]=at(0,.12); M.add(XG.cyl,0x7a2a24,a,.35,b,Math.PI/2,ry,0,.3,.04,.3); M.add(XG.cyl,0xc8a040,a,.35,b,Math.PI/2,ry,0,.08,.05,.08); } break; }
    case 'table': M.add(XG.box,W,x,.42,z,0,ry,0,.8,.06,.5); for(const [u,v] of [[-.34,-.2],[.34,-.2],[-.34,.2],[.34,.2]]){ const cs=Math.cos(ry), sn=Math.sin(ry); M.add(XG.box,W2,x+u*cs+v*sn,.2,z-u*sn+v*cs,0,ry,0,.06,.4,.06); }
      M.add(XG.cyl,0x8a8070,x+.15,.5,z,0,0,0,.08,.1,.08); M.add(XG.cyl,0xeae2c8,x-.18,.52,z+.05,0,0,0,.05,.14,.05); L.add(XG.cone,0xffc060,x-.18,.63,z+.05,0,0,0,.04,.08,.04);
      if(R()<.6) M.add(XG.box,0xd8c8a0,x+.02,.47,z-.12,0,R()*2,0,.22,.02,.16); break;
    case 'skeleton': { const cs=Math.cos(ry), sn=Math.sin(ry), at=(u,v)=>[x+u*cs+v*sn,z-u*sn+v*cs], P=(u,v,y,sx,sy,sz,g)=>{ const [a,b]=at(u,v); M.add(g||XG.box,BONE,a,y,b,0,ry,0,sx,sy,sz); };
      P(0,-.05,.3,.18,.36,.1); P(0,-.04,.56,.2,.18,.18,XG.ball); P(0,.02,.62,.04,.04,.04); for(const u of [-.1,.1]){ P(u,.18,.06,.06,.06,.4); P(u*1.6,.05,.32,.04,.3,.04); }
      for(let r=0;r<3;r++) P(0,-.02,.22+r*.08,.22,.03,.08); break; }
    case 'mushrooms': for(let k=0;k<3;k++){ const mx=x+(R()-.5)*.5, mz=z+(R()-.5)*.4, h=.1+R()*.2, r=.12+R()*.12; M.add(XG.cyl,0xd8d0c0,mx,h/2,mz,0,0,0,.06,h,.06); L.add(XG.half,glow,mx,h-.01,mz,0,0,0,r*2,r*1.4,r*2); } break;
  } }
// pick what a room holds, by its kind and the area
const XROOM_KINDS={ store:['barrel','barrel','crate','crate','sack','table','rack'], shrine:['urn','urn','candles','statue','brazier','shelf'], crypt:['bones','skulls','urn','candles','skeleton','skeleton'],
  cave:['rubble','rubble','mushrooms','bones','skeleton'], study:['shelf','shelf','table','candles','urn','brazier'] };
const XAREA_KIND={ hollows:['cave','cave','store','crypt','study'], deeps:['store','cave','crypt','study'], vault:['store','shrine','study','store'], rifts:['cave','crypt','store','shrine'], ruins:['shrine','shrine','study','store','crypt'], abyss:['crypt','shrine','cave','study'] };
const XWALLSIDE=['shelf','rack','skeleton'];   // these stand right against a wall
function xWallDress(grp,A,S,seed){ const R=caveRng(seed+211), floorAt=(x,y)=>x>=0&&y>=0&&x<XN&&y<XN&&EX.t[xi(x,y)]!==T_ROCK, rock=(x,y)=>!floorAt(x,y);
  EX.dress=new Map(); EX.decor=[]; EX.onWall=[];
  // the top-edge trim and the pillars are instanced, so they can sink with the cutaway like the walls
  const trimGeo=new THREE.BoxGeometry(1,1,1), trims=[], pills=[];
  for(const c of EX.wIdx.keys()){ const x=xcx(c), y=xcy(c);
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]) if(floorAt(x+dx,y+dy)&&EX.room[xi(x+dx,y+dy)]>=0&&EX.t[xi(x+dx,y+dy)]===T_FLOOR) trims.push([c,dx,dy]); }
  for(const r of EX.rooms){ if(r.nook) continue; for(const [x,y] of [[r.x-1,r.y-1],[r.x+r.w,r.y-1],[r.x-1,r.y+r.h],[r.x+r.w,r.y+r.h]]) if(rock(x,y)&&EX.wIdx.has(xi(x,y))) pills.push(xi(x,y)); }
  for(const [i] of EX.doors){ const x=xcx(i), y=xcy(i), ew=floorAt(x-1,y)&&floorAt(x+1,y); for(const [dx,dy] of ew?[[0,-1],[0,1]]:[[-1,0],[1,0]]){ const n=xi(x+dx,y+dy); if(EX.wIdx.has(n)&&!pills.includes(n)) pills.push(n); } }
  const acc=new THREE.Color(S.spark).lerp(new THREE.Color('rgb('+xTone(S,.6).join(',')+')'),.55);
  const tm=new THREE.InstancedMesh(trimGeo,new THREE.MeshBasicMaterial({color:acc,fog:true}),Math.max(1,trims.length)), zero=new THREE.Matrix4().makeScale(0,0,0);
  for(let k=0;k<tm.count;k++) tm.setMatrixAt(k,zero); grp.add(tm); EX.trimMesh=tm;
  trims.forEach(([c,dx,dy],k)=>{ const a=EX.dress.get(c)||{}; (a.trim=a.trim||[]).push([k,dx,dy]); EX.dress.set(c,a); });
  // along the same room faces: a stone cornice at the top (the lit line sits on it) and a dark skirting at the foot
  const tone=v=>new THREE.Color('rgb('+xTone(S,v).join(',')+')'), inst=(mat,n)=>{ const im=new THREE.InstancedMesh(XG.box,mat,Math.max(1,n)); for(let k=0;k<im.count;k++) im.setMatrixAt(k,zero); grp.add(im); return im; };
  EX.corMesh=inst(xPhong({color:tone(.62)}),trims.length); EX.skirtMesh=inst(xPhong({color:tone(.16)}),trims.length);
  // pillars by area: carved columns (a base, a round shaft standing proud of the wall, a capital)
  // where the halls are built, rough rock columns in the caves
  const cave=['crystal','lava','stars'].includes(A.veins), shaftG=cave?xRockShaft():new THREE.CylinderGeometry(.5,.5,1,12), pc=tone(cave?.34:.48), pc2=tone(cave?.26:.6);
  EX.pillBase=inst(xPhong({color:pc2}),pills.length); EX.pillShaft=new THREE.InstancedMesh(shaftG,xPhong({color:pc}),Math.max(1,pills.length)); for(let k=0;k<EX.pillShaft.count;k++) EX.pillShaft.setMatrixAt(k,zero); grp.add(EX.pillShaft);
  EX.pillCap=inst(xPhong({color:pc2}),pills.length); EX.pillCave=cave;
  pills.forEach((c,k)=>{ const a=EX.dress.get(c)||{}; a.pill=k; EX.dress.set(c,a); });
  // furniture, room by room
  const used=new Set([...EX.wallAt.keys(),...(EX.glows||[]).map(L=>L.wall)]), area=A.id||'hollows';
  EX.rooms.forEach((r,ri)=>{ if(r.nook||r.w<3||r.h<3) return; const kinds=XAREA_KIND[area]||XAREA_KIND.hollows, rk=r.side==='cell'?'crypt':kinds[R()*kinds.length|0], pool=XROOM_KINDS[rk];
    const M=xMerger(), L=xMerger(), cells=[];
    const ok=c=>EX.t[c]===T_FLOOR&&!EX.taken.has(c)&&!EX.itemAt.has(c)&&!EX.chests.some(ch=>ch.cell===c)&&c!==EX.up&&c!==EX.down&&!EX.traps.some(t=>t.cell===c)&&!xAdj4(c).some(n=>EX.doors.has(n));
    const edge=[]; for(let x=r.x;x<r.x+r.w;x++){ edge.push([x,r.y,0,-1],[x,r.y+r.h-1,0,1]); } for(let y=r.y+1;y<r.y+r.h-1;y++){ edge.push([r.x,y,-1,0],[r.x+r.w-1,y,1,0]); }
    const n=Math.max(2,Math.round((r.w+r.h)/1.8));
    for(let k=0;k<n&&edge.length;k++){ const [x,y,dx,dy]=edge.splice(R()*edge.length|0,1)[0], c=xi(x,y); if(!ok(c)||!rock(x+dx,y+dy)) continue;
      const kind=pool[R()*pool.length|0], against=XWALLSIDE.includes(kind), off=against?.33:.28, wx=(x+.5+dx*off)*XCS, wz=(y+.5+dy*off)*XCS, ry=Math.atan2(-dx,-dy);
      if(kind==='brazier'){ xBrazier(grp,wx-dx*.4,wz-dy*.4,c,A); cells.push(c); continue; }
      xFurnish(M,L,kind,wx,wz,ry,R,A,S); cells.push(c);
      // barrels, crates and sacks gather in twos and threes
      if(['barrel','crate','sack'].includes(kind)) for(let j=0;j<1+(R()*2|0);j++){ const s=(j?-1:1)*(.7+R()*.2); xFurnish(M,L,R()<.6?kind:pool[R()*3|0],wx+(dy?s:0)-dx*R()*.3,wz+(dx?s:0)-dy*R()*.3,ry+R(),R,A,S); } }
    // chains hang on crypt walls
    if(rk==='crypt') for(let x=r.x;x<r.x+r.w;x++) if(rock(x,r.y-1)&&!used.has(xi(x,r.y-1))&&R()<.25){ used.add(xi(x,r.y-1)); const g=new THREE.Group(); g.position.set((x+.5)*XCS,0,r.y*XCS+.06);
      for(const cx of [-.35,.35]){ const n2=4+(R()*4|0); for(let k=0;k<n2;k++){ const ln=new THREE.Mesh(new THREE.TorusGeometry(.06,.015,4,8),xMat(0x3a3a40)); ln.position.set(cx,XWALL-.25-k*.11,0); ln.rotation.y=k%2?Math.PI/2:0; g.add(ln); } }
      g.visible=false; grp.add(g); EX.onWall.push({g,wall:xi(x,r.y-1),floor:xi(x,r.y)}); }
    // in the corners: a cobweb in crypts and caves
    if(rk==='crypt'||rk==='cave') for(const [x,y,sx,sy] of [[r.x,r.y,-1,-1],[r.x+r.w-1,r.y,1,-1]]) if(R()<.6){ const w=xi(x,y);
      const web=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshBasicMaterial({map:xWebTex(),transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));
      web.position.set((x+.5+sx*.5)*XCS-sx*.45,XWALL-.5,(y+.5+sy*.5)*XCS-sy*.08); web.rotation.y=sx<0?.6:-.6; web.visible=false; grp.add(web); EX.onWall.push({g:web,wall:xi(x+sx*0,y+sy),floor:w}); }
    // banners in shrines and stores, vines in Hollows caves, on free wall faces
    const faces=[]; for(let x=r.x;x<r.x+r.w;x++) if(rock(x,r.y-1)&&!used.has(xi(x,r.y-1))) faces.push([x,r.y-1,0,1]);
    for(let k=0;k<(rk==='shrine'?2:rk==='store'?1:area==='hollows'?2:0)&&faces.length;k++){ const [x,y,dx,dy]=faces.splice(R()*faces.length|0,1)[0]; used.add(xi(x,y));
      const g=new THREE.Group(); g.position.set((x+.5)*XCS,0,(y+1)*XCS+.03);
      if(rk==='cave'&&area==='hollows'){ for(let v=0;v<3;v++){ const h=.8+R()*1.2; g.add(xBox(.07,h,.03,xMat(0x3f7a3a),(v-1)*.35+(R()-.5)*.1,XWALL-h/2,0)); g.add(xBox(.2,.12,.03,xMat(0x5a9a4a),(v-1)*.35,XWALL-h+.1,0)); } }
      else { const cl=new THREE.Color(COLORS[A.color]?COLORS[A.color].c:'#8a2a2a').multiplyScalar(.55), cloth=new THREE.Group();
        cloth.add(xBox(.9,1.3,.03,xMat(cl),0,-.65,0), xBox(.9,.08,.04,xMat(0x2a2620),0,0,0), xBox(.24,.24,.04,xMat(new THREE.Color(A.glow).multiplyScalar(.8)),0,-.6,.01));
        cloth.position.y=XWALL-.15; g.add(xBox(1.05,.06,.06,xMat(0x2a2620),0,XWALL-.12,0), cloth); g.userData.sway=cloth; }
      g.visible=false; grp.add(g); EX.onWall.push({g,wall:xi(x,y),floor:xi(x,y+1),sway:g.userData.sway,ph:R()*6}); }
    if(!M.size()&&!L.size()) return;
    const grpR=new THREE.Group(); if(M.size()) grpR.add(M.build(xPhong({vertexColors:true}))); if(L.size()){ const lm=L.build(new THREE.MeshBasicMaterial({vertexColors:true})); grpR.add(lm); grpR.userData.glow=lm; }
    grpR.visible=false; grp.add(grpR); EX.decor.push({mesh:grpR,cells:cells.length?cells:[xi(r.x,r.y)],ph:R()*6}); });
}
// a standing brazier: an iron bowl on three legs, a fire and a real light (it joins the floor's lights)
function xBrazier(grp,x,z,cell,A){ const g=new THREE.Group(), iron=xMat(0x2c2a28), mats=[], tex=xGlowTex.t||(xGlowTex.t=xGlowTex()); g.position.set(x,0,z);
  for(let k=0;k<3;k++){ const a=k*2.1; g.add(xBox(.05,.9,.05,iron,Math.cos(a)*.22,.45,Math.sin(a)*.22)); }
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.38,.22,.24,10),iron); bowl.position.y=.95; g.add(bowl);
  const coal=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.04,10),new THREE.MeshBasicMaterial({color:0xff5a20})); coal.position.y=1.06; g.add(coal);
  const flame=new THREE.Group(), fm=c=>{ const m=new THREE.MeshBasicMaterial({color:c,transparent:true}); mats.push(m); return m; };
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.3,.75,7),fm(0xff7a2a)), f2=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,7),fm(0xffe08a)); f1.position.y=.37; f2.position.y=.25; flame.add(f1,f2); flame.position.y=1.06; g.add(flame);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffa040,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); halo.scale.set(4,4,1); halo.position.y=1.5; halo.renderOrder=2; g.add(halo);
  g.visible=false; grp.add(g); EX.glows.push({g,floor:cell,mats,halo,flame,torch:true,ph:Math.random()*6}); }
function xWebTex(){ if(xWebTex.c) return xWebTex.c; const N=32, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'); x.strokeStyle='rgba(230,235,240,.9)'; x.lineWidth=1;
  for(let a=0;a<5;a++){ x.beginPath(); x.moveTo(0,0); x.lineTo(Math.cos(a*.39)*N,Math.sin(a*.39)*N); x.stroke(); }
  for(let r=6;r<N;r+=6){ x.beginPath(); for(let a=0;a<5;a++){ const px=Math.cos(a*.39)*r, py=Math.sin(a*.39)*r; a?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }
  return xWebTex.c=xTex(c); }
// a wall cell shown or sinking: its trim line and pillar follow its height
function xDressShow(c,cut,touched){ const a=EX.dress&&EX.dress.get(c); if(!a) return; const m=new THREE.Matrix4(), top=XWALL*cut-.04;
  if(a.trim){ for(const [k,dx,dy] of a.trim){ const x=xw(c)+dx*XCS*.5, z=xz(c)+dy*XCS*.5, L=XCS, sx=dx?1:L, sz=dx?L:1, ch=Math.min(.24,XWALL*cut*.25);
      m.makeScale(dx?.22:sx,ch,dx?sz:.22); m.setPosition(x+dx*.07,top-ch/2+.02,z+dy*.07); EX.corMesh.setMatrixAt(k,m);       // the cornice, standing out from the face
      m.makeScale(dx?.06:XCS*.98,.06,dx?XCS*.98:.06); m.setPosition(x+dx*.19,top-ch*.55,z+dy*.19); EX.trimMesh.setMatrixAt(k,m);   // the lit line along it
      m.makeScale(dx?.14:sx,.3,dx?sz:.14); m.setPosition(x+dx*.04,.15,z+dy*.04); EX.skirtMesh.setMatrixAt(k,m); }               // the skirting
    EX.trimMesh.instanceMatrix.needsUpdate=EX.corMesh.instanceMatrix.needsUpdate=EX.skirtMesh.instanceMatrix.needsUpdate=true; }
  if(a.pill!=null){ const k=a.pill, x=xw(c), z=xz(c), h=XWALL*cut, cv=EX.pillCave;
    m.makeScale(XCS*(cv?1.2:1.16),cv?.4:.34,XCS*(cv?1.2:1.16)); m.setPosition(x,cv?.12:.17,z); EX.pillBase.setMatrixAt(k,m);
    m.makeScale(XCS*1.16,Math.max(.05,h),XCS*1.16); m.setPosition(x,h/2,z); EX.pillShaft.setMatrixAt(k,m);
    m.makeScale(XCS*(cv?1.0:1.22),(cv?.12:.24)*Math.max(.3,cut),XCS*(cv?1.0:1.22)); m.setPosition(x,h+.08,z); EX.pillCap.setMatrixAt(k,m);
    EX.pillBase.instanceMatrix.needsUpdate=EX.pillShaft.instanceMatrix.needsUpdate=EX.pillCap.instanceMatrix.needsUpdate=true; } }
// a rough rock column: a tapered, knobbly cylinder
function xRockShaft(){ const g=new THREE.CylinderGeometry(.42,.5,1,7,4), P=g.attributes.position;
  for(let k=0;k<P.count;k++){ const x=P.getX(k), y=P.getY(k), z=P.getZ(k), n=Math.sin(x*17.3+y*29.1+z*11.7)*43758.5453, r=n-Math.floor(n), w=1+(r-.5)*.22-(Math.abs(y)<.3?.06:0); P.setXYZ(k,x*w,y,z*w); }
  g.computeVertexNormals(); return g; }
function xDecorTick(T){ for(const W of EX.onWall||[]) if(W.sway&&W.g.visible) W.sway.rotation.x=Math.sin(T*1.3+W.ph)*.06;
  for(const D of EX.decor||[]) if(D.mesh.visible&&D.mesh.userData.glow){ const v=.75+.25*Math.sin(T*2+D.ph); D.mesh.userData.glow.material.color.setRGB(v,v,v); } }
/* Room floors are dressed: a border band of patterned trim just inside the walls (a meander of the
   area's dark stone and its accent), and in bigger rooms a centre piece: a mosaic, a rug or a rune
   seal. Pixel textures, laid over the floor at an even scale. */
function xTrimTex(S,R){ const W=32, H=10, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const dark='rgb('+xTone(S,.05).join(',')+')', mid='rgb('+xTone(S,.45).join(',')+')', hi=S.spark;
  x.fillStyle=mid; x.fillRect(0,0,W,H); x.fillStyle=dark; x.fillRect(0,0,W,1); x.fillRect(0,H-1,W,1); x.fillStyle='rgb('+xTone(S,.8).join(',')+')'; x.fillRect(0,1,W,1);
  const U=['XXXXXX.X','X....X.X','X.XX.X.X','X.X..X.X','X.XXXX.X','X......X'];
  for(let u=0;u<4;u++) U.forEach((row,j)=>[...row].forEach((ch,i)=>{ if(ch==='X'){ x.fillStyle=dark; x.fillRect(u*8+i,j+2,1,1); } }));
  x.globalAlpha=.55; x.fillStyle=hi; for(let u=0;u<4;u++) x.fillRect(u*8+3,4,2,1); x.globalAlpha=1; return c; }
function xInlayTex(S,R,kind,w,h){ const N=64, c=document.createElement('canvas'); c.width=N*w; c.height=N*h; const x=c.getContext('2d'), W=c.width, H=c.height;
  const t=v=>'rgb('+xTone(S,v).join(',')+')', hi=S.spark;
  if(kind==='rug'){ const cols=R()<.5?['#5a1e1e','#8a3a24','#c8903a','#2a1a14']:['#1e2a4a','#3a4a7a','#c8b070','#141a2a'];
    x.fillStyle=cols[0]; x.fillRect(0,0,W,H); x.fillStyle=cols[3]; x.fillRect(4,4,W-8,H-8); x.fillStyle=cols[1]; x.fillRect(8,8,W-16,H-16);
    x.fillStyle=cols[2]; for(let i=12;i<W-12;i+=8) for(let j=12;j<H-12;j+=8) if(((i+j)/8)%2<1) x.fillRect(i,j,4,4);
    x.fillStyle=cols[0]; x.fillRect(W/2-12,H/2-12,24,24); x.fillStyle=cols[2]; x.fillRect(W/2-6,H/2-6,12,12);
    x.fillStyle=cols[2]; for(let i=2;i<W-2;i+=3){ x.fillRect(i,0,1,3); x.fillRect(i,H-3,1,3); } }
  else if(kind==='seal'){ x.fillStyle=t(.12); x.fillRect(0,0,W,H); const cx=W/2, cy=H/2, r=Math.min(W,H)/2-6;
    x.strokeStyle=t(.55); x.lineWidth=3; x.beginPath(); x.arc(cx,cy,r,0,7); x.stroke(); x.lineWidth=2; x.beginPath(); x.arc(cx,cy,r*.72,0,7); x.stroke();
    x.strokeStyle=hi; x.globalAlpha=.7; x.lineWidth=2; for(const rr of [.66,.4]){ x.beginPath(); for(let k=0;k<=6;k++){ const a=k*Math.PI/3+Math.PI/6, px=cx+Math.cos(a)*r*rr, py=cy+Math.sin(a)*r*rr; k?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }   // a hex seal
    x.globalAlpha=1;
    x.fillStyle=hi; for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; x.fillRect(cx+Math.cos(a)*r*.86-2,cy+Math.sin(a)*r*.86-2,4,4); } }
  else { x.fillStyle=t(.18); x.fillRect(0,0,W,H);   // mosaic: a border of small tiles round a diamond lattice
    for(let i=0;i<W;i+=4) for(let j=0;j<H;j+=4){ const edge=i<8||j<8||i>=W-8||j>=H-8, d=(Math.abs(((i/4)%8)-4)+Math.abs(((j/4)%8)-4));
      x.fillStyle=edge?((i+j)/4%2?t(.7):t(.35)):d===4?hi:d<2?t(.6):t(.28); if(!edge&&d===4) x.globalAlpha=.3; x.fillRect(i,j,3,3); x.globalAlpha=1; } }
  return c; }
function xFloorTrim(grp,A,S,seed){ const R=caveRng(seed+99), trim=xTex(xTrimTex(S,R),true), quads=[];
  const mat=new THREE.MeshPhongMaterial({map:trim,shininess:4,specular:0x111111,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const ins=.32, bw=.62, pos=[], uv=[], seg=(x0,z0,x1,z1,horiz)=>{ const L=horiz?x1-x0:z1-z0, u=L/(bw*3.2);
    if(horiz){ pos.push(x0,0,z0, x0,0,z1, x1,0,z1, x0,0,z0, x1,0,z1, x1,0,z0); uv.push(0,1, 0,0, u,0, 0,1, u,0, u,1); }
    else { pos.push(x0,0,z0, x0,0,z1, x1,0,z1, x0,0,z0, x1,0,z1, x1,0,z0); uv.push(0,1, u,1, u,0, 0,1, u,0, 0,0); } };
  for(const r of EX.rooms){ if(r.nook||r.w<3||r.h<3) continue; const X0=r.x*XCS+ins, X1=(r.x+r.w)*XCS-ins, Z0=r.y*XCS+ins, Z1=(r.y+r.h)*XCS-ins;
    seg(X0,Z0,X1,Z0+bw,true); seg(X0,Z1-bw,X1,Z1,true); seg(X0,Z0+bw,X0+bw,Z1-bw,false); seg(X1-bw,Z0+bw,X1,Z1-bw,false);
    if(r.w>=5&&r.h>=5){ const kinds=['mosaic','rug','seal'], kind=r.w===r.h||Math.abs(r.w-r.h)<=1?kinds[R()*3|0]:kinds[R()*2|0];
      const cw=kind==='seal'?Math.max(2,Math.round(Math.min(r.w,r.h)*.55)):Math.max(2,Math.round(r.w*.55)), ch=kind==='seal'?cw:Math.max(2,Math.round(r.h*.5)), cx=(r.x+r.w/2)*XCS, cz=(r.y+r.h/2)*XCS;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(cw*XCS-.6,ch*XCS-.6),new THREE.MeshPhongMaterial({map:xTex(xInlayTex(S,R,kind,Math.min(4,cw),Math.min(4,ch))),shininess:4,specular:0x111111,polygonOffset:true,polygonOffsetFactor:-1}));
      m.rotation.x=-Math.PI/2; m.position.set(cx,.008,cz); grp.add(m); } }
  if(pos.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.computeVertexNormals();
    const band=new THREE.Mesh(g,mat); band.position.y=.012; grp.add(band); } }
// a soft pool of colored light on the floor in front of a wall light (an additive decal: cheap, no real light)
function xPool(tex,col,size){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,color:col,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(0,.06,size*.32); m.renderOrder=2; m.userData.pool=1; return m; }
function xGroupSprites(gp,grp){ const id=gp.ids[0], d=ENEMY_DEFS[id], h=XSPR*Math.max(.75,Math.min(1.7,d.scale||1));
  gp.sprite=xSprite(()=>unitSprite({kind:'enemy',id,color:d.color}),h); gp.sprite.visible=false; grp.add(gp.sprite);
  gp.zz=xTextSprite('z','#9fd8ff'); gp.bang=xTextSprite('!','#ff4d5e'); gp.zz.visible=gp.bang.visible=false; grp.add(gp.zz,gp.bang); gp.h=h;
  // every group stands on a shadow and a thin ring of its colour; a red ring pulses when it closes on you
  // the ring tells the threat: grey-green for vermin, the element's colour for most, a big red ring for a boss
  { const col=new THREE.Color(gp.boss?'#ff3b4e':d.vermin?'#8fae7a':COLORS[d.color]?COLORS[d.color].c:'#ff5d6c'), base=new THREE.Group(); if(gp.boss) base.scale.set(1.6,1,1.6);
    const sh=new THREE.Mesh(new THREE.CircleGeometry(.75*Math.max(.8,d.scale||1),20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.45,depthWrite:false}));
    const rg=new THREE.Mesh(new THREE.RingGeometry(.62*Math.max(.8,d.scale||1),.72*Math.max(.8,d.scale||1),28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.7,depthWrite:false}));
    const warn=new THREE.Mesh(new THREE.RingGeometry(1.05,1.25,32),new THREE.MeshBasicMaterial({color:0xff3b4e,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
    for(const o of [sh,rg,warn]){ o.rotation.x=-Math.PI/2; o.renderOrder=2; base.add(o); } sh.position.y=.03; rg.position.y=.045; warn.position.y=.05;
    base.visible=false; grp.add(base); gp.base=base; gp.warn=warn; gp.shadow=sh; gp.tring=rg;
    gp.label=xLabel(d.name,gp.boss?'#ff8a8a':d.vermin?'#cfe0c0':'#f2e6c8'); gp.label.visible=false; grp.add(gp.label); }
  // a miniboss stands on a ring of its colour, so you know it for a big threat from afar
  if(gp.mini){ const r=new THREE.Mesh(new THREE.TorusGeometry(.95,.07,6,24),new THREE.MeshBasicMaterial({color:new THREE.Color(COLORS[d.color].c)})); r.rotation.x=Math.PI/2; r.position.y=.06; r.visible=false; grp.add(r); gp.ring=r; }
  // a mission's mark over the group: ♛ a bounty, ☠ a nest's brood (missions.js)
  if(gp.tagTxt){ gp.tag=(typeof xmTagSprite==='function'?xmTagSprite:xTextSprite)(gp.tagTxt,gp.tagCol||'#ffd166'); gp.tag.visible=false; grp.add(gp.tag); } }
const xNearSeen=c=>{ const x=xcx(c), y=xcy(c); for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const nx=x+dx, ny=y+dy; if(nx>=0&&ny>=0&&nx<XN&&ny<XN&&EX.seen[xi(nx,ny)]&&EX.t[xi(nx,ny)]===T_ROCK&&EX.wIdx.has(xi(nx,ny))) return true; } return false; };
function xPaintCells(){
  // brightness each cell is heading for: full near you and dimmer toward the edge of sight,
  // a low glow where you have been, black where you have not
  const px=xcx(EX.pc), py=xcy(EX.pc), here=EX.room[EX.pc], rad=here>=0&&EX.rooms[here].lit?9:4;
  const m=new THREE.Matrix4();
  for(let c=0;c<XN*XN;c++){ let b=0;
    if(EX.vis[c]){ const d=Math.hypot(xcx(c)-px,xcy(c)-py); b=1-.55*Math.min(1,Math.max(0,(d-1)/rad)); }
    else if(EX.seen[c]) b=.24;
    else if(EX.t[c]===T_ROCK&&xNearSeen(c)) b=.6;   // behind a wall you have seen: the chasm below shows
    EX.fogTgt[c]=b;
    if(EX.seen[c]&&!EX.shown[c]){ EX.shown[c]=1; const w=EX.wIdx.get(c); if(w){ EX.wCut[c]=xCutTarget(c); xWallMatrix(m,c,EX.wms.indexOf(w[0])===0,EX.wCut[c]); w[0].setMatrixAt(w[1],m); w[0].instanceMatrix.needsUpdate=true; EX.wList.push(c); xDressShow(c,EX.wCut[c]); } } }
  for(const D of EX.decor||[]) D.mesh.visible=D.cells.some(c=>EX.seen[c]);
  for(const [i,d] of EX.doors) if(d.mesh) d.mesh.visible=!!EX.seen[i]&&d.state!=='secret';
  for(const c of EX.chests) c.mesh.visible=!!EX.seen[c.cell];
  EX.downMesh.visible=!!EX.seen[EX.down]; EX.upMesh.visible=!!EX.seen[EX.up];
  for(const L of EX.glows){ L.g.visible=!!EX.seen[L.floor]&&(L.cut==null||L.cut>.4); if(L.beam) L.halo.visible=L.g.visible; }
  if(typeof xPaintExtra==='function') xPaintExtra();
}
/* The cutaway: a wall nearer the camera than you (south of you, within sight) sinks to a low rim,
   so it never hides you or the room you are in; walls behind you rise again. Heights ease, and
   door frames, torches and crystals on those walls sink with them. */
const XCUT=.16;
function xCutTarget(c){ if(!EX) return 1; const dy=xcy(c)-xcy(EX.pc), dx=Math.abs(xcx(c)-xcx(EX.pc)); return dy>0&&dy<=9&&dx<=11?XCUT:1; }
function xWallCut(dt){ const m=new THREE.Matrix4(), k=Math.min(1,dt*7); let touched=new Set();
  for(const c of EX.wList){ const tg=xCutTarget(c), cur=EX.wCut[c]; if(Math.abs(cur-tg)<.005) continue;
    const v=Math.abs(cur-tg)<.02?tg:cur+(tg-cur)*k; EX.wCut[c]=v; const w=EX.wIdx.get(c); xWallMatrix(m,c,EX.wms.indexOf(w[0])===0,v); w[0].setMatrixAt(w[1],m); touched.add(w[0]); xDressShow(c,v,touched); }
  for(const wm of touched) wm.instanceMatrix.needsUpdate=true;
  for(const [i,d] of EX.doors){ if(!d.mesh) continue; const tg=xCutTarget(i), cur=d.cutY==null?1:d.cutY; if(Math.abs(cur-tg)<.005) continue; d.cutY=cur+(tg-cur)*k; d.mesh.scale.y=d.cutY; }
  for(const L of (EX.glows||[]).concat(EX.onWall||[])){ if(L.wall==null) continue; const tg=xCutTarget(L.wall), cur=L.cut==null?1:L.cut; if(Math.abs(cur-tg)<.005) continue; L.cut=cur+(tg-cur)*k; L.g.scale.y=Math.max(.05,L.cut); L.g.visible=L.cut>.4&&!!EX.seen[L.floor]; } }
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
/* Touch movement styles (Settings). The default, tapstick, mixes the first two:
   tapstick a quick tap walks you there; hold or slide and you steer with an invisible floating stick
   goal    walk to where you touch or drag, and keep going after you let go
   float   a thumbstick appears wherever your finger lands
   fixed   a thumbstick in the bottom-left corner; a tap elsewhere walks there
   follow  hold to chase your finger, let go to stop
   pad     a trackpad: slide anywhere and you move the same way (like battle) */
// tapstick (the default): a quick tap walks you there; hold or slide and it is an invisible floating stick
const XMOVES=['tapstick','goal','float','fixed','follow','pad'], XMOVE_NAME={tapstick:'Tap + hold',goal:'Walk to touch',float:'Floating stick',fixed:'Fixed stick',follow:'Follow finger',pad:'Trackpad'},
  XMOVE_ICON={tapstick:'✋',goal:'📍',float:'🕹',fixed:'🎮',follow:'👆',pad:'▭'};
const XTAP_MS=200, XTAP_PX=12;   // shorter and smaller than this is a tap; anything more becomes the stick
const xMoveMode=()=>{ let m='tapstick'; try{ m=localStorage.getItem('hexmancers-xmove')||'tapstick'; }catch(e){} return XMOVES.includes(m)?m:'tapstick'; };
function xSetMoveMode(m){ try{ localStorage.setItem('hexmancers-xmove',m); }catch(e){} xMoveUi(); }
const XSTICK_R=56;   // how far the stick's knob travels, in screen pixels
function xStickHome(){ const r=appBox($('#xView')), bot=$('#xBottom'), bb=bot?appBox(bot):null; return {x:r.left+24+XSTICK_R, y:(bb&&bb.top>0?bb.top:r.bottom)-24-XSTICK_R}; }
function xMoveUi(){ const m=xMoveMode(), b=$('#xMoveMode'); if(b){ b.textContent=XMOVE_ICON[m]; b.title='Touch movement: '+XMOVE_NAME[m]; }
  const st=$('#setXMove'); if(st) st.textContent=XMOVE_NAME[m]; xStickDraw(); }
function xStickDraw(){ const el=$('#xStick'); if(!el) return; const m=xMoveMode(), on=XHOLD.on&&XHOLD.stick;
  if(m!=='fixed'&&!(m==='float'&&on)){ el.hidden=true; return; }
  const o=on?{x:XHOLD.x0,y:XHOLD.y0}:xStickHome(); el.hidden=false; el.classList.toggle('live',!!on);
  el.style.left=(o.x-XSTICK_R)+'px'; el.style.top=(o.y-XSTICK_R)+'px';
  let dx=on?XHOLD.x-o.x:0, dy=on?XHOLD.y-o.y:0; const l=Math.hypot(dx,dy); if(l>XSTICK_R){ dx*=XSTICK_R/l; dy*=XSTICK_R/l; }
  el.firstElementChild.style.transform='translate('+dx+'px,'+dy+'px)'; }
// paused (ui.js): the floor stands still and keys and touches are let go
let xPaused=false;
// Pausing (a dialog, the bag, the menu) stops you dead: keys, finger and any walk you were on.
// Afterwards you need fresh input (a tap or a new key press, not a key still held) before
// walking into something acts on it again, so closing a talk never walks you back into the NPC.
function xPause(on){ xPaused=!!on; for(const k in XKEY) XKEY[k]=false; XHOLD.on=false; XHOLD.id=null;
  if(EX){ EX.vx=EX.vz=0; EX.path=[]; EX.goal=null; EX.blockT=0; if(!on) EX.needInput=true; } }
document.addEventListener('keydown',e=>{ if(EX&&xMapIsOpen()&&(e.key==='Escape'||e.key==='m')){ xMapClose(); return; } if(!EX||!EX.active||xPaused) return; if(e.repeat&&EX.needInput) return; EX.needInput=false; const k=e.key.toLowerCase(), a=keyAct(k,'map'); XKEY[k]=true;
  if(a==='fire'&&!e.repeat) xStrike();
  if(a==='search'){ if(EX.aim) xSearch(); else xSearchAt(EX.pc); } else if(a==='disarm') xDisarm(); else if(a==='camp') xToCamp();
  if(a||k===' '){ e.preventDefault(); } if(['up','down','left','right'].includes(a)){ EX.path=[]; EX.goal=null; } });
document.addEventListener('keyup',e=>{ XKEY[e.key.toLowerCase()]=false; });
/* Moving with a finger: wherever you touch (or drag to) is where you go. The spot on the floor
   under the finger becomes your goal, the walk there takes the shortest way round walls, and you
   keep going after you let go. Holding still does not drift the goal as the camera follows you:
   it only changes when the finger moves. */
// walking somewhere on your own goes round the stairs (stepping on them climbs or descends), unless they are where you are going
const xStairCell=(n,goal)=>n!==goal&&(n===EX.up||n===EX.down);
function xPathToCell(goal){ const blocked=n=>xKnownTrap(n)||xStairCell(n,goal)||xChestAt(n)&&n!==goal||typeof xSolid==='function'&&xSolid(n)&&n!==goal;
  const d=xbfs(EX.t,EX.doors,goal,EX.seen,n=>blocked(n)&&n!==EX.pc);
  if(d[EX.pc]<0) return null; const path=[]; let cur=EX.pc;
  while(cur!==goal){ const x=xcx(cur), y=xcy(cur); let best=-1;
    for(const n of [xi(x+1,y),xi(x-1,y),xi(x,y+1),xi(x,y-1)]) if(d[n]>=0&&d[n]<d[cur]&&(best<0||d[n]<d[best])) best=n;
    if(best<0) break; path.push(best); cur=best; }
  return path; }
function xGoalAt(ax,ay){ if(!EX||!EX.active||EX.busy) return; let g=xFloorAt(ax,ay); if(!g) return;
  let c=xcell(g.x,g.z);
  // a touch on a wall (or a spot you have not seen) aims at the nearest open cell you know
  if(c<0||!EX.seen[c]||!xPassable(c)){ let best=-1, bd=9; const cx=Math.floor(g.x/XCS), cz=Math.floor(g.z/XCS);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const x=cx+dx, y=cz+dy; if(x<0||y<0||x>=XN||y>=XN) continue; const n=xi(x,y);
      if(!EX.seen[n]||!xPassable(n)) continue; const dd=Math.hypot(xw(n)-g.x,xz(n)-g.z); if(dd<bd){ bd=dd; best=n; } }
    if(best<0) return; c=best; g={x:xw(c),z:xz(c)}; }
  if(EX.goal&&EX.goal.cell===c){ EX.goal.x=g.x; EX.goal.z=g.z; return; }   // same cell: just nudge the end point
  const path=c===EX.pc?[]:xPathToCell(c); if(!path) return;
  EX.goal={cell:c, x:g.x, z:g.z}; EX.path=path; }
function xTap(e){ const [ax,ay]=appXY(e.clientX,e.clientY); xGoalAt(ax,ay); }
// can you walk straight from (x,z) to the middle of cell n? (open floor all the way, with room for you)
function xStraight(x,z,n){ const tx=xw(n), tz=xz(n), L=Math.hypot(tx-x,tz-z), steps=Math.ceil(L/.3), r=.45;
  for(let k=1;k<=steps;k++){ const px=x+(tx-x)*k/steps, pz=z+(tz-z)*k/steps;
    for(const [ox,oz] of [[-r,-r],[r,-r],[-r,r],[r,r]]){ const c=xcell(px+ox,pz+oz); if(c===EX.pc) continue; if(!xClear(c)||xKnownTrap(c)||xChestAt(c)||xStairCell(c,EX.goal&&EX.goal.cell)||typeof xSolid==='function'&&xSolid(c)) return false; } }
  return true; }
// the point on the floor under a screen point (app coordinates), or null
function xFloorAt(ax,ay){ const G=X3; if(!G) return null; const r=appBox($('#xView')); if(!r.width) return null;
  const v=new THREE.Vector2((ax-r.left)/r.width*2-1,-(ay-r.top)/r.height*2+1), hit=new THREE.Vector3();
  G.ray.setFromCamera(v,G.cam); return G.ray.ray.intersectPlane(G.plane,hit)?hit:null; }
const xKnownTrap=c=>EX.traps.find(t=>t.cell===c&&t.armed&&t.known);
const xChestAt=c=>EX.chests.find(ch=>ch.cell===c&&!ch.open);

/* ---------------- you ---------------- */
function xMove(dt){
  if(EX.action){ EX.stillT=0; EX.action.t-=dt; if(EX.action.t<=0){ const a=EX.action; EX.action=null; a.done(); } return; }
  if(EX.stuckT>0){ EX.stuckT-=dt; if(EX.stuckT<=0) xHud(); return; }
  let ix=0, iz=0;
  const held=id=>keysFor(id).some(k=>XKEY[k]);   // your bindings, from Settings (keys.js)
  if(held('left')) ix-=1; if(held('right')) ix+=1; if(held('up')) iz-=1; if(held('down')) iz+=1;
  if(ix||iz){ EX.path=[]; EX.goal=null; }   // keys take over from a finger's goal
  else if(XHOLD.on){ const m=xMoveMode();
    if(m==='tapstick'&&!XHOLD.stick&&(performance.now()-XHOLD.t0>=XTAP_MS||Math.hypot(XHOLD.x-XHOLD.x0,XHOLD.y-XHOLD.y0)>=XTAP_PX)){ XHOLD.stick=true; EX.path=[]; EX.goal=null; }
    if(XHOLD.stick){ let dx=(XHOLD.x-XHOLD.x0)/XSTICK_R, dy=(XHOLD.y-XHOLD.y0)/XSTICK_R; const l=Math.hypot(dx,dy);
      if(l>.18){ const k=Math.min(1,(l-.18)/.62+.25)/l; ix=dx*k; iz=dy*k; } }   // a stick: screen up is up the map; how far you push sets the speed
    else if(m==='follow'){ const g=xFloorAt(XHOLD.x,XHOLD.y); if(g){ const dx=g.x-EX.px, dz=g.z-EX.pz, l=Math.hypot(dx,dz); if(l>.4){ const k=Math.min(1,l/1.5)/l; ix=dx*k; iz=dz*k; } } }
    else if(m==='pad'){ const tx=XHOLD.px+(XHOLD.x-XHOLD.x0)*XHOLD.kx*1.2, tz=XHOLD.pz+(XHOLD.y-XHOLD.y0)*XHOLD.kz*1.2, dx=tx-EX.px, dz=tz-EX.pz, l=Math.hypot(dx,dz);
      if(l>.2){ const k=Math.min(1,l/1.2)/l; ix=dx*k; iz=dz*k; } } }
  if(!ix&&!iz&&EX.path.length){
    // cut corners: head for the furthest cell on the route you can walk to in a straight line
    while(EX.path.length>1&&xStraight(EX.px,EX.pz,EX.path[1])) EX.path.shift();
    const last=EX.path.length===1&&EX.goal&&EX.path[0]===EX.goal.cell;
    const n=EX.path[0], gx=last?EX.goal.x:xw(n), gz=last?EX.goal.z:xz(n), tx=gx-EX.px, tz=gz-EX.pz, d=Math.hypot(tx,tz);
    if(d<(last?.2:.5)||EX.pc===n&&!last&&EX.path.length>1){ EX.path.shift(); if(last) EX.goal=null; } else { ix=tx/d; iz=tz/d; if(last&&d<1.2){ ix*=Math.max(.35,d/1.2); iz*=Math.max(.35,d/1.2); } } }
  // inside the goal cell: walk to the exact spot you touched
  else if(!ix&&!iz&&EX.goal&&EX.goal.cell===EX.pc){ const tx=EX.goal.x-EX.px, tz=EX.goal.z-EX.pz, d=Math.hypot(tx,tz);
    if(d<.2) EX.goal=null; else { ix=tx/d; iz=tz/d; if(d<1.2){ ix*=Math.max(.35,d/1.2); iz*=Math.max(.35,d/1.2); } } }
  // speed eases in and out over a few frames, so starts, stops and turns feel smooth, not stiff
  const len0=Math.hypot(ix,iz); if(len0>1){ ix/=len0; iz/=len0; }
  const kv=1-Math.exp(-dt*(len0>.1?22:30)); EX.vx=(EX.vx||0)+(ix-(EX.vx||0))*kv; EX.vz=(EX.vz||0)+(iz-(EX.vz||0))*kv;
  if(len0<=.1&&Math.hypot(EX.vx,EX.vz)<.15){ EX.vx=EX.vz=0; }
  ix=EX.vx; iz=EX.vz;
  const len=Math.hypot(ix,iz); if(len<.05){ EX.walk=0; EX.stillT=(EX.stillT||0)+dt; return; }   // standing still: you notice hidden things (dungeon.js)
  EX.stillT=0;
  const amt=Math.min(1,len); ix/=len; iz/=len; const sp=XSPEED*dt*amt, r=.42;
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
  // walking into something that will not give (a locked door, a person): give up the goal
  if((EX.path.length||EX.goal)&&!okX&&!okZ){ EX.blockT=(EX.blockT||0)+dt; if(EX.blockT>.5){ EX.path=[]; EX.goal=null; EX.blockT=0; } } else EX.blockT=0;
  const c=xcell(EX.px,EX.pz); if(c!==EX.pc&&c>=0){ EX.pc=c; xEnter(c); }
}
// walking into a cell: walls stop you, doors open, chests open, a trap you know about stops you
function xBump(c,front){
  if(typeof xBumpExtra==='function'){ const r=xBumpExtra(c,front); if(r!==undefined) return r; }   // locks, people, puzzles, levers (dungeon.js)
  if(c<0||!xPassable(c)) return false;
  const d=EX.doors.get(c); if(d&&d.state==='closed'){ if(!front) return false; d.state='open'; xDoorOpen(d); xLog('You open the door.','dim'); xUpdateVis(); return false; }
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
  else if(c===EX.up&&!EX.busy) xStairsUp();   // stepping back onto the stairs up climbs them (from depth 1, to camp)
  xHud();
}
// experience on the map: a line in the log, and the level-up panel when a level comes
function xXp(n,why){ if(typeof gainXp!=='function'||!save) return; const up=gainXp(save,n); persist(); xLog('+'+Math.round(n)+' XP · '+why,'xp');
  if(up){ xLog('Level up! You are now level '+save.level+'.','good'); setTimeout(()=>{ if(EX&&EX.active&&!EX.busy) maybeLevelUp(); },400); } xHud(); }
function xHurt(n,why){ EX.hp=Math.max(0,EX.hp-n); xFlash(); xHud(); if(EX.hp<=0) xDie(why); }
function xSpring(tr,remote){ const T=TRAPS[tr.kind]; tr.known=true; xTrapMesh(tr); EX.shakeT=.45; xSparks(xw(tr.cell),xz(tr.cell),0xffd08a,10,1.4);
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
    if(d&&d.state==='secret'&&xLos(EX.pc,i)&&Math.random()<.55*k){ d.state='closed'; d.leaf.visible=true; xDoorPose(d,0,1); found++; xLog(quiet?'Standing still, you notice the outline of a hidden door!':'You find a hidden door!','good');
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
  ch.open=true; xLidOpen(ch); EX.path=[]; xSparks(xw(ch.cell),xz(ch.cell),0xffd75a,ch.rich?24:16,3); xBloom(xw(ch.cell),.6,xz(ch.cell),0xffe08a,3.5);
  const rolls=ch.rich?2:1; for(let n=0;n<rolls;n++) xLoot(ch.rich); xXp(ch.rich?15:5,'chest opened');
  if(typeof xChestAfter==='function') xChestAfter(ch);
  persist(); xHud();
}
// chest loot: a card, gold or a piece of gear
function xLoot(rich){ const d=EX.depth+(rich?2:0), r=Math.random();
  if(r<.42){ const c=rollCard({depth:d,min:rich?'uncommon':null}); const res=addCards(save,[c]); xLog('The chest holds a card: '+c.name+(res[0]&&res[0].isNew?' (new!)':'')+'.','loot'); xCardPop(c,res[0]&&res[0].isNew); }
  else if(r<.76){ const g=Math.round(battleGold(d,false)*rnd(.5,1.1)); save.gold+=g; xLog('The chest holds '+g+' gold.','gold'); tip('+'+g+' gold'); xCoins(EX.pc,Math.min(10,3+(g/12|0))); }
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
      else if(g.state==='chase'){ g.lostT+=dt; if(g.lostT>(g.hunter?6:3)){ g.state='wander'; g.path=[]; g.seen=false; } }
      g.repath-=dt;
      if(g.repath<=0){ g.repath=g.state==='chase'?.5:g.hunter?4:2.5;
        const goal=g.state==='chase'?EX.pc:(g.path.length?null:xWanderGoal(g));
        if(goal!=null){ const dist=xbfs(EX.t,EX.doors,goal,null,typeof xEnemyBlock==='function'?xEnemyBlock:null); g.path=xPathTo(dist,g.cell,goal); } }
      // you walk at 7: anything chasing you is slower, so you can always get away
      const vermin=g.ids.every(id=>ENEMY_DEFS[id].vermin), sp=(g.state==='chase'?(g.hunter?3.6:vermin?2.8:3.2):g.hunter?1.8:1.4)*dt;
      if(g.path.length){ const n=g.path[0], tx=xw(n)-g.x, tz=xz(n)-g.z, l=Math.hypot(tx,tz);
        if(l<.2){ g.path.shift(); const dr=EX.doors.get(n); if(dr&&dr.state==='closed'){ dr.state='open'; xDoorOpen(dr,g.cell); if(EX.seen[n]) xUpdateVis(); } }
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
// where an awake group strolls to: a hunter heads for where you are (slowly, it does not know
// exactly); every other group stays inside its own room, and goes back there after losing you
function xWanderGoal(g){
  if(g.hunter){ const x=xcx(EX.pc)+Math.round((Math.random()-.5)*6), y=xcy(EX.pc)+Math.round((Math.random()-.5)*6), c=xi(Math.max(0,Math.min(XN-1,x)),Math.max(0,Math.min(XN-1,y))); return EX.t[c]===T_FLOOR?c:EX.pc; }
  const ri=EX.room[g.home], r=ri>=0?EX.rooms[ri]:null;
  if(!r) return g.home;
  return xi(r.x+Math.floor(Math.random()*r.w),r.y+Math.floor(Math.random()*r.h)); }
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
  if(opening==='strike') xLog('First strike on the '+name+'!','good');
  xFlashView(500); setTimeout(()=>xFlashView(260),560);
  const b=$('#xBang'); b.textContent=opening==='strike'?'First Strike!':opening==='ambush'?'Ambush!':opening==='surprised'?'Surprised!':'!'; b.dataset.key='fight'; b.className='x-bang on '+(opening==='strike'?'ambush':opening||'');
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
  EX.busy=true; const lost=Math.floor(save.gold*.2); save.gold-=lost; const depth=EX.depth, body=xDropBody(depth,lost); persist();
  XPARK=null; if(typeof XRUN!=='undefined') XRUN=null;
  logCamp('Killed by '+why+' at depth '+depth+', dropped '+lost+' gold.'+(save.corpse?' Your body lies there.':''),'curse'); stopExplore();
  reveal('Defeated…','Brought down by '+why+' at depth '+depth+'. You dropped '+lost+' gold.'+xBodyNote(body),[],[['Camp',()=>{ EX=null; openCamp(); },true],...(typeof peekPoint==='function'&&peekPoint()?[['Load save',()=>loadPoint()]]:[])]); }
function stopExplore(){ if(EX) EX.active=false; if(xMapIsOpen()) xMapClose(); xPause(false); }

/* ---------------- loop, hud ---------------- */
let xRaf=0, xLast=0;
/* Doors swing open on their hinge, away from whoever opens them; a shortcut gate's bars slide up.
   xDoorOpen starts the animation, xDoorTick runs it every frame. */
function xDoorPose(d,k,sign){ if(d.lock==='gate'||d.gate){ d.leaf.position.y=k*1.9; return; } d.leaf.rotation.y=sign*k*1.65; }
function xDoorOpen(d,by){ if(!d||!d.leaf) return; d.leaf.visible=true;
  const bx=by!=null?xw(by):EX.px, bz=by!=null?xz(by):EX.pz, rel=d.ew?bx-xw(d.cell):bz-xz(d.cell);
  d.sign=d.ew?(rel>0?-1:1):(rel>0?1:-1); d.gate=d.gate||d.lock==='gate'; d.anim=0; if(typeof xPuff==='function'&&EX.seen&&EX.seen[d.cell]) for(let k=0;k<3;k++) xPuff(xw(d.cell)+(Math.random()-.5),xz(d.cell)+(Math.random()-.5));
  if(EX.seen&&EX.seen[d.cell]){ const near=Math.hypot(xw(d.cell)-EX.px,xz(d.cell)-EX.pz)/XCS; if(near<9) xSfx(d.gate?'gate':'door',(xw(d.cell)-EX.px)/(XCS*6)); } }
// A chest lid pops up past open, falls back and bounces; gold light spills out of it.
function xLidOpen(ch){ const l=ch&&ch.mesh&&ch.mesh.userData.lid; if(!l) return; ch.lidT=0; xSfx('door'); }
function xLidTick(dt){ for(const ch of EX.chests){ if(ch.lidT==null) continue; const l=ch.mesh&&ch.mesh.userData.lid; if(!l){ ch.lidT=null; continue; }
  ch.lidT=Math.min(1,ch.lidT+dt/.55); const k=ch.lidT, e=1-Math.pow(1-k,3), wob=Math.sin(k*Math.PI*3)*(1-k)*.35;
  l.rotation.x=-(2.25*e-.35*k*k+wob); if(k>=1){ l.rotation.x=-1.9; ch.lidT=null; } } }
function xDoorTick(dt){ xLidTick(dt); if(typeof xBitsTick==='function'&&EX) xBitsTick(dt); for(const d of EX.doors.values()){ if(d.anim==null) continue;
  d.anim=Math.min(1,d.anim+dt/(d.gate?.7:.42)); const k=d.anim, e=d.gate?k*k*(3-2*k):1-Math.pow(1-k,3)*(1-.25*Math.sin(k*9)*(1-k));
  // a swung door overshoots a hair and settles
  xDoorPose(d,d.gate?e:Math.min(1.06,e+.08*Math.sin(k*Math.PI)),d.sign||1); if(k>=1){ d.anim=null; xDoorPose(d,1,d.sign||1); } } }
function xLoopStart(){ cancelAnimationFrame(xRaf); xLast=performance.now(); xRaf=requestAnimationFrame(xLoop); }
function xLoop(ts){
  if(!EX||!EX.active||!$('#scrExplore').classList.contains('on')) return;
  const dt=Math.min(.1,(ts-xLast)/1000); xLast=ts;
  if(!EX.busy&&!xPaused&&!EX.aim){ xMove(dt); if(!EX||!EX.active){ return; } xEnemies(dt); if(EX.active&&!EX.busy&&typeof xDungeonTick==='function') xDungeonTick(dt); if(EX.active&&!EX.busy) xTipScan(dt);
    EX.regenT+=dt; if(EX.regenT>3){ EX.regenT=0; if(EX.hp<xmaxHp()){ EX.hp++; xHud(); } } }
  xDoorTick(dt||.016); xDraw(ts/1000,dt); xRaf=requestAnimationFrame(xLoop);
}
function xResize(){ const G=X3, cv=$('#xView'), w=cv.clientWidth||400, h=cv.clientHeight||600; if(G.w===w&&G.h===h) return; G.w=w; G.h=h; G.renderer.setSize(w,h,false); G.cam.aspect=w/h; G.cam.updateProjectionMatrix(); }
function xDraw(T,dt){
  dt=dt||.016; const G=X3; xResize(); xFadeCells(dt);
  // a two-step walk: the walking pose and the standing pose in turn, rising one art pixel on the step;
  // searching or disarming shows the casting pose
  const ART=XSPR/96, step=EX.walk?Math.floor(EX.walk/1.5)%2:0;
  EX.pose=EX.action||EX.swingT>0?'cast':EX.walk?(step?'walk':'idle'):'idle';
  EX.me.position.set(EX.px,step*ART,EX.pz); xRefresh(EX.me,EX.face<0);
  G.lamp.position.set(EX.px,2.6,EX.pz);
  // the camera looks in at about 48 degrees, so you see the faces of the walls, not just their tops
  // (tall screens pull back so a room still fits across); walls between it and you sink (xWallCut)
  const k=Math.max(1,Math.min(1.8,.8/G.cam.aspect)), hgt=14*k, back=12.5*k;
  let zk=1; if(EX.fighting&&EX.busy){ EX.engT=(EX.engT||0)+dt; const e=Math.min(1,EX.engT/.7); zk=1-.32*e*e; } else EX.engT=0;   // a fight starting: the camera rushes in
  const sh=EX.shakeT>0?(EX.shakeT-=dt,EX.shakeT*.9):0, jx=sh?(Math.random()-.5)*sh:0, jy=sh?(Math.random()-.5)*sh:0;
  // the camera eases after you and looks a little ahead of where you are walking
  { const ax=EX.px+(EX.vx||0)*.22, az=EX.pz+(EX.vz||0)*.18, kk=1-Math.exp(-dt*5); if(EX.camX==null||Math.hypot(EX.camX-EX.px,EX.camZ-EX.pz)>12){ EX.camX=EX.px; EX.camZ=EX.pz; } EX.camX+=(ax-EX.camX)*kk; EX.camZ+=(az-EX.camZ)*kk; }
  const fx=EX.fighting&&EX.busy?EX.fighting.x:EX.camX, fz=EX.fighting&&EX.busy?EX.fighting.z:EX.camZ, cx=EX.camX+(fx-EX.camX)*(1-zk)*1.4, cz=EX.camZ+(fz-EX.camZ)*(1-zk)*1.4;
  G.cam.position.set(cx+jx,hgt*zk+jy,cz+back*zk); G.cam.lookAt(cx+jx,.6,cz-1.2); xWallCut(dt); xFxTick(T,dt);
  // enemies show only while in sight; a Shadow Assassin only when it is close; a dormant guardian not at all
  for(const g of EX.groups){ if(!g.sprite) continue; const v=!!EX.vis[g.cell]&&!g.dormant&&!(g.stealth&&Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS>3.2); g.sprite.visible=v; g.zz.visible=v&&g.state==='sleep'; g.bang.visible=v&&g.state==='chase';
    if(g.ring){ g.ring.visible=v; g.ring.position.set(g.x,.06,g.z); }
    if(g.base){ g.base.visible=v; if(v){ g.base.position.set(g.x,0,g.z); const dist=Math.hypot(g.x-EX.px,g.z-EX.pz), near=g.state==='chase'&&dist<XCS*3.5; g.warn.material.opacity=near?.45+.4*Math.sin(T*10):0; const s=near?1+.12*Math.sin(T*10):1; g.warn.scale.set(s,s,1);
      if(g.boss) g.tring.material.opacity=.55+.35*Math.sin(T*4);
      const hop=g.state==='chase'?Math.abs(Math.sin(T*9+g.bob)):0, ss=1-hop*.35; g.shadow.scale.set(ss,ss,1);   // the shadow shrinks as it leaves the ground
      const lv=dist<XCS*4&&g.state!=='sleep'||dist<XCS*2.2; g.label.visible=lv; if(lv) g.label.position.set(g.x,g.h+.25,g.z); } else g.label.visible=false; }
    if(g.tag){ g.tag.visible=v; if(v) g.tag.position.set(g.x,g.h+(g.state==='chase'?1.1:.5)+Math.sin(T*2.5+g.bob)*.08,g.z); }
    if(v){ g.sprite.position.set(g.x,g.state==='sleep'?0:g.state==='chase'?Math.abs(Math.sin(T*9+g.bob))*.28:(Math.floor(T*1.6+g.bob)%2)*g.h/96,g.z); xRefresh(g.sprite,(g.face||-1)<0);   // chasers hop
      g.zz.position.set(g.x+.5,g.h+.2+Math.sin(T*2+g.bob)*.15,g.z); g.bang.position.set(g.x,g.h+(g.label&&g.label.visible?.95:.35)+Math.abs(Math.sin(T*6))*.12,g.z); } }
  G.cam.updateMatrixWorld(); xStand(EX.me); for(const g of EX.groups) if(g.sprite&&g.sprite.visible){ xStand(g.sprite);
    // idle monsters breathe; a hopping chaser squashes as it lands
    const hop=g.state==='chase'?Math.abs(Math.sin(T*9+g.bob)):1, sq=g.state==='chase'&&hop<.25?.88+hop*.48:1+(g.state==='sleep'?.02:.03)*Math.sin(T*2.2+g.bob);
    g.sprite.scale.y*=sq; g.sprite.scale.x*=g.state==='chase'&&hop<.25?1.08-hop*.32:1; }
  xFov(dt); xTellDraw(T);
  if(typeof xDungeonDraw==='function') xDungeonDraw(T);
  { const rc=EX.aim?EX.aim.cell:EX.searchCell, R=G.reticle; R.visible=rc!=null;
    if(R.visible){ R.position.set(xw(rc),.12,xz(rc)); const k=EX.aim?1+.05*Math.sin(T*8):1+.12*Math.sin(T*14); R.scale.set(k,1,k); R.children[0].material.opacity=EX.aim?.9:.6+.3*Math.sin(T*14); } }
  EX.downMesh.userData.ring.rotation.z+=.02;
  for(const Ln of EX.lanterns||[]) for(const h of Ln.halos) h.material.opacity=(Ln.boss?.75:.6)+.25*Math.sin(T*(Ln.boss?5:2)+Ln.ph);
  if(EX.runeRing){ EX.runeRing.rotation.z=T*.25; EX.runeRing.visible=EX.downMesh.visible; EX.runeRing.material.opacity=.45+.2*Math.sin(T*1.8); }
  for(const L of EX.glows){ if(!L.g.visible) continue; const f=EX.fogCur[L.floor];
    const fl=L.torch?.8+.12*Math.sin(T*11+L.ph)+.08*Math.sin(T*23.7+L.ph*3):.85+.15*Math.sin(T*1.7+L.ph);
    L.halo.material.opacity=.6*f*fl; for(const m of L.mats) m.opacity=L.beam?(.06+.06*Math.sin(T*1.5+L.ph))*(.4+.6*f):.3+.7*f;
    for(const o of L.g.children) if(o.userData.pool) o.material.opacity=(L.torch?.6:.3)*f*fl;
    if(L.flame){ L.flame.scale.set(.9+.15*Math.sin(T*17+L.ph),.85+.3*fl,.9+.15*Math.cos(T*13+L.ph)); L.flame.rotation.z=Math.sin(T*7+L.ph)*.12; }
    if(EX.area.veins==='stars') L.g.children.forEach((o,i)=>{ if(o.userData.y0!=null) o.position.y=o.userData.y0+Math.sin(T*1.3+i+L.ph)*.12; }); }
  { const P=G.dust.geometry.attributes.position, a=P.array; for(let k=0;k<a.length;k+=3){ a[k+1]+=dt*.25; a[k]+=Math.sin(T+k)*dt*.1; if(a[k+1]>3.2) a[k+1]=0; } P.needsUpdate=true;
    G.dust.position.set(EX.px,0,EX.pz); G.dust.material.opacity=.35+.15*Math.sin(T*.7); }
  for(const c of EX.chests) if(c.rich&&!c.open) c.mesh.position.y=Math.abs(Math.sin(T*2))*.05;
  G.lamp.intensity=1.6*(.95+.04*Math.sin(T*9.3)+.03*Math.sin(T*21.1));
  xLightPool(T,dt); xDecorTick(T); xAirTick(T,dt); xWeatherTick(T,dt); xLifeTick(T,dt);
  { const lo=$('#xLowHp'); if(lo){ const r=EX.hp/xmaxHp(); lo.style.opacity=r<.3?(.55+.35*Math.sin(T*(r<.15?7:4))).toFixed(2):'0'; } } if(EX.myGlow){ EX.myGlow.position.x=EX.px; EX.myGlow.position.z=EX.pz; EX.myGlow.material.opacity=.18+.03*Math.sin(T*2.1); }
  G.renderer.render(G.scene,G.cam);
  if((EX.miniT=(EX.miniT||0)+1)%6===0) xMini();
}
function xMini(){
  const cv=$('#xMini'), c=cv.getContext('2d'), big=cv.classList.contains('big');
  // held big, the map zooms to the part of the floor you have explored
  let x0=0, y0=0, n=XN;
  if(big){ let a=XN, b=XN, A=0, B=0; for(let i=0;i<XN*XN;i++) if(EX.seen[i]){ const x=xcx(i), y=xcy(i); a=Math.min(a,x); b=Math.min(b,y); A=Math.max(A,x); B=Math.max(B,y); }
    if(A>=a){ n=Math.min(XN,Math.max(16,A-a+5,B-b+5)); x0=Math.max(0,Math.min(XN-n,Math.round((a+A)/2-n/2))); y0=Math.max(0,Math.min(XN-n,Math.round((b+B)/2-n/2))); } }
  const s=big?Math.max(3,Math.floor(384/n)):3; cv.width=cv.height=n*s; EX.miniView={x0,y0,s,n};
  c.fillStyle='rgba(5,6,10,.8)'; c.fillRect(0,0,cv.width,cv.height); c.translate(-x0*s,-y0*s);
  for(let i=0;i<XN*XN;i++){ if(!EX.seen[i]) continue; const d=EX.doors.get(i); if(EX.t[i]===T_ROCK||(d&&d.state==='secret')){ c.fillStyle='#1a1d26'; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); continue; }
    c.fillStyle=d?'#a0703a':EX.vis[i]?'#7c8aa6':'#3c4458'; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); }
  const dot=(i,col,r)=>{ c.fillStyle=col; c.fillRect(xcx(i)*s-r+1,xcy(i)*s-r+1,s+2*r-2,s+2*r-2); };
  if(EX.seen[EX.down]) dot(EX.down,isBossDepth(EX.depth)?'#ff5d6c':EX.area.glow,2); if(EX.seen[EX.up]) dot(EX.up,'#fff2c0',2);
  for(const ch of EX.chests) if(EX.seen[ch.cell]&&!ch.open) dot(ch.cell,'#f2c94c',1);
  for(const tr of EX.traps) if(tr.known&&tr.armed) dot(tr.cell,'#ff4d5e',1);
  if(typeof xMiniExtra==='function') xMiniExtra(c,s,dot);
  for(const g of EX.groups) if(EX.vis[g.cell]&&!g.dormant&&!(g.stealth&&Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS>3.2)) dot(g.cell,g.tagCol||(g.mini?'#ff9a3a':'#ff6b6b'),g.mini||g.elite?2:1);
  xStairsMark(c,s);
  dot(EX.pc,'#ffffff',2);
}
const xMapIsOpen=()=>$('#xMini').classList.contains('big');
function xMapOpen(){ if(!EX||EX.busy) return; xPause(true); $('#xMini').classList.add('big'); $('#xMapShade').hidden=false; $('#xMapClose').hidden=false; xMini(); }
function xMapClose(){ $('#xMini').classList.remove('big'); $('#xMapShade').hidden=true; $('#xMapClose').hidden=true; if(EX) xMini(); xPause(false); }
// a tap on the big map: a discovered floor (or the nearest floor to a discovered wall) is where you walk
function xMapTap(e){ const cv=$('#xMini'), r=appBox(cv), V=EX.miniView; if(!V||!r.width) return xMapClose();
  const [ax,ay]=appXY(e.clientX,e.clientY), x=Math.floor((ax-r.left)/r.width*cv.width/V.s)+V.x0, y=Math.floor((ay-r.top)/r.height*cv.height/V.s)+V.y0;
  if(x<0||y<0||x>=XN||y>=XN) return xMapClose();
  let c=xi(x,y);
  if(!EX.seen[c]) return xMapClose();   // the dark: close
  if(!xPassable(c)){ const n=[c-1,c+1,c-XN,c+XN,c-XN-1,c-XN+1,c+XN-1,c+XN+1].find(k=>k>=0&&k<XN*XN&&EX.seen[k]&&xPassable(k)); if(n==null) return; c=n; }
  xMapClose();
  if(c===EX.pc) return;
  const path=xPathToCell(c); if(!path){ xSay('mapway','You know no way there yet.'); return; }
  EX.goal={cell:c, x:xw(c), z:xz(c)}; EX.path=path; EX.needInput=false; xLog('You set off across the floor…','dim'); }
function xLog(t,c){ if(!EX) return; EX.log.push({t,c}); if(EX.log.length>5) EX.log.shift();
  const el=$('#xLog'); if(el) el.innerHTML=EX.log.map((l,i)=>`<div class="${l.c||''}" style="opacity:${.45+.55*(i+1)/EX.log.length}">${esc(l.t)}</div>`).join(''); }
function xSay(k,t){ const now=performance.now(); if((EX.msgT[k]||0)>now) return; EX.msgT[k]=now+2500; xLog(t,'warn'); }

/* ---------------- first-time tips ---------------- */
/* One short card the first time you meet each thing, in place of the long how-to line.
   Settings › Dungeon tips turns them off; turning them back on shows them all again. */
const XTIPS={
  move:   ()=>matchMedia('(pointer:coarse)').matches?'Tap a spot to walk there, or hold to walk toward your finger.':'Click a spot to walk there, or move with WASD or the arrow keys.',
  stairs: ()=>'You found the stairs down! Walk onto them to go deeper.'+(xStairsMarkOn()?' They stay marked on your minimap; hold the map to see it big.':' Hold the minimap to see it big.'),
  door:   ()=>'Walk into a door to open it.',
  locked: ()=>'A locked door. Find its key on this floor, or buy one from a merchant.',
  chest:  ()=>'Walk into a chest to open it. Some locks hide a needle: Search near it first, then Disarm.',
  sleeper:()=>'That enemy is asleep. Reach it before it wakes to ambush it.',
  trap:   ()=>'A trap! Step around it, or stand next to it and Disarm it.',
  person: ()=>'Walk into people to talk to them.',
  puzzle: ()=>'A puzzle. Walk into levers, statues and stones to use them; clues may be elsewhere on the floor.',
  hidden: ()=>'Stand still for a moment to notice hidden doors and traps, or use Search to look harder.',
};
const XTIP_PUZZLE=new Set(['lever','plever','plate','statue','mirror','runestone','block']);
const xTipsOn=()=>{ try{ return localStorage.getItem('hexmancers-xtips')!=='0'; }catch(e){ return true; } };
const xStairsMarkOn=()=>{ try{ return localStorage.getItem('hexmancers-xstairs')!=='0'; }catch(e){ return true; } };
let xTipSeen=null, xTipQ=[], xTipT=0, xTipScanT=0, xTipStill=0;
function xTipSeenSet(){ if(!xTipSeen){ try{ xTipSeen=new Set(JSON.parse(localStorage.getItem('hexmancers-xtipseen')||'[]')); }catch(e){ xTipSeen=new Set(); } } return xTipSeen; }
function xTipReset(){ xTipSeen=new Set(); try{ localStorage.removeItem('hexmancers-xtipseen'); }catch(e){} }
function xTip(k){ if(!xTipsOn()||!XTIPS[k]) return; const seen=xTipSeenSet(); if(seen.has(k)||xTipQ.includes(k)) return; xTipQ.push(k); if(!$('#xTipCard').classList.contains('on')) xTipNext(); }
function xTipNext(){ const card=$('#xTipCard'); clearTimeout(xTipT);
  if(!$('#scrExplore').classList.contains('on')){ card.classList.remove('on'); return; }   // in a fight: keep the rest for later
  const k=xTipQ.shift();
  if(!k||!xTipsOn()){ card.classList.remove('on'); xTipQ=[]; return; }
  const seen=xTipSeenSet(); seen.add(k); try{ localStorage.setItem('hexmancers-xtipseen',JSON.stringify([...seen])); }catch(e){}
  $('#xTipText').textContent=XTIPS[k](); card.classList.add('on'); xTipT=setTimeout(xTipNext,9000); }
function xTipHide(){ clearTimeout(xTipT); xTipQ=[]; const c=$('#xTipCard'); if(c) c.classList.remove('on'); }
$('#xTipOk').onclick=()=>xTipNext();
$('#xTipOff').onclick=()=>{ try{ localStorage.setItem('hexmancers-xtips','0'); }catch(e){} xTipHide(); if(typeof applyXTips==='function') applyXTips(); tip('Tips are off. Turn them back on in Settings.'); };
// a few times a second: is anything new in sight? and have you been standing still long enough to learn about secrets?
function xTipScan(dt){ if(!EX||!xTipsOn()) return;
  xTipStill=EX.path&&EX.path.length?0:xTipStill+dt; if(xTipStill>4&&EX.depth>=1&&(EX.floorT||0)>25) xTip('hidden');
  EX.floorT=(EX.floorT||0)+dt; if((xTipScanT+=dt)<.4) return; xTipScanT=0;
  const seen=xTipSeenSet(), want=k=>!seen.has(k)&&!xTipQ.includes(k), V=EX.vis;
  if(want('stairs')&&V[EX.down]) xTip('stairs');
  if(want('door')||want('locked')) for(const [i,d] of EX.doors){ if(!V[i]) continue; if(d.state==='closed') xTip('door'); else if(d.state==='locked') xTip('locked'); }
  if(want('chest')&&EX.chests.some(c=>!c.open&&V[c.cell])) xTip('chest');
  if(want('sleeper')&&EX.groups.some(g=>g.state==='sleep'&&!g.dormant&&V[g.cell])) xTip('sleeper');
  if(want('trap')&&EX.traps.some(t=>t.known&&t.armed&&V[t.cell])) xTip('trap');
  if((want('person')||want('puzzle'))&&EX.props) for(const p of EX.props){ if(p.gone||!V[p.wall?p.front:p.cell]) continue;
    if(p.kind==='npc'||p.kind==='merchant') xTip('person'); else if(XTIP_PUZZLE.has(p.kind)) xTip('puzzle'); }
}

// the stairs down on the minimap, once seen: a pulsing ring and a down arrow in the floor's color (red on a boss floor)
function xStairsMark(c,s){ if(!xStairsMarkOn()||!EX.seen[EX.down]) return;
  const col=isBossDepth(EX.depth)?'#ff5d6c':EX.area.glow, x=xcx(EX.down)*s+s/2, y=xcy(EX.down)*s+s/2, u=Math.max(s,3), p=.5+.5*Math.sin(performance.now()/260);
  c.save(); c.lineWidth=Math.max(1.5,u*.45); c.strokeStyle=col; c.globalAlpha=.35+.5*p; c.beginPath(); c.arc(x,y,u*(2.2+.8*p),0,Math.PI*2); c.stroke(); c.globalAlpha=1;
  c.beginPath(); c.moveTo(x-u*1.3,y-u*.8); c.lineTo(x+u*1.3,y-u*.8); c.lineTo(x,y+u*1.1); c.closePath();
  c.fillStyle=col; c.fill(); c.lineWidth=Math.max(1,u*.3); c.strokeStyle='#05060a'; c.stroke(); c.restore(); }
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
  // the long how-to line under the buttons is replaced by first-time tips (xTip)
  document.querySelector('#xBottom .keys').classList.add('learned');
  const v=validateDeck(activeDeck().list,CARDS,save.owned); if(!v.ok) return;
  if(typeof THREE==='undefined'){ tip('The 3D map could not load; fighting directly.'); return fight(depth); }
  show('scrExplore'); xInit3D();
  if(XPARK&&XPARK.depth===depth){ EX=XPARK; XPARK=null; EX.hp=xmaxHp(); EX.busy=false; EX.path=[]; EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.pc=EX.up; xUpdateVis(); xLog('You climb back down. You feel rested.','dim'); }
  else { XPARK=null; if(typeof xNewRun==='function') xNewRun(depth); buildFloor(depth); }
  EX.active=true; xHud(); xLoopStart(); xTip('move');
  xBanner(depth);
}
// back from a fight that started on the map: the enemy is gone and your wounds carry over
// info.ruleOK: a trial's rule was kept (dungeon.js pays out)
function resumeExplore(hp,won,info){
  if(!EX) return openCamp();
  const g=EX.fighting; EX.fighting=null;
  if(won&&g){ EX.groups=EX.groups.filter(x=>x!==g); [g.sprite,g.zz,g.bang,g.ring,g.tag].forEach(o=>{ if(!o) return; X3.group.remove(o); if(o.material.map) o.material.map.dispose(); o.material.dispose(); }); if(g.boss){ EX.bossDead=true; xLog(ENEMY_DEFS[g.ids[0]].name+' falls. The stairs down to '+areaOf(EX.depth+1).name+' are open.','good'); } }
  EX.hp=Math.max(1,hp); EX.busy=false; EX.active=true; EX.path=[]; EX.aim=null;
  xPause($('#lvlUp').classList.contains('on'));   // let go of a pause left over from before the fight (keys and touches too)
  show('scrExplore'); xUpdateVis();
  if(typeof xAfterFight==='function') xAfterFight(g,won,info);
  // not while the next fight is starting: the panel would pause the map under it
  setTimeout(()=>{ if(typeof maybeLevelUp==='function'&&EX&&EX.active&&!EX.busy) maybeLevelUp(); },300);
  xHud(); xLoopStart();
}
$('#xSearch').onclick=()=>xSearch();
$('#xStrike').onclick=()=>xStrike();
$('#xDisarm').onclick=()=>xDisarm();
$('#xCamp').onclick=()=>xToCamp();
$('#xUp').onclick=()=>xStairsUp();
// touch movement: the Settings row cycles the styles
{ const next=()=>{ const m=XMOVES[(XMOVES.indexOf(xMoveMode())+1)%XMOVES.length]; xSetMoveMode(m); return m; };
  const s=$('#setXMove'); if(s) s.onclick=()=>next();
  window.addEventListener('resize',xStickDraw); xMoveUi(); }
