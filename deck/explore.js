/* Hexmancers — the overworld. Each depth is a dungeon floor in the spirit of Rogue and NetHack:
   rooms joined by corridors, drawn in 3D and hidden until you walk through them. A lit room
   shows whole when you step in; corridors and dark rooms show only what is right around you.
   Enemies sleep, wander or hunt you, and you only see them once they are in your sight, so a
   patrol can catch you off guard. Some doors are secret and some floors are trapped: search (F)
   to find both, then disarm (E) a trap before you cross it. Chests hold cards, gold or gear.
   Touching an enemy starts a battle: reach a sleeping one first for an ambush, or get caught
   unawares and it strikes first. Stairs down lead deeper; the stairs up lead back to camp. */

const XN=48, XCS=2, XWALL=1.7;           // grid cells per side, world units per cell, wall height
const T_ROCK=0, T_FLOOR=1, T_DOOR=2;
const TRAPS={
  spike:{name:'spike trap', dmg:[9,14],  col:'#9aa4b0', text:'Spikes shoot up through the floor!'},
  dart: {name:'dart trap',  dmg:[6,10],  col:'#6bd36b', text:'A poisoned dart flies out of the wall!'},
  fire: {name:'fire rune',  dmg:[12,18], col:'#ff7a2a', text:'A rune flares and fire washes over you!'},
  pit:  {name:'pit',        dmg:[8,12],  col:'#2a2230', text:'The floor gives way and you fall into a pit!', stuck:1.6},
  alarm:{name:'alarm rune', dmg:[0,0],   col:'#f2c94c', text:'A rune shrieks! Everything on this floor heard that.'},
};
let EX=null, X3=null;
const xi=(x,y)=>y*XN+x, xcx=i=>i%XN, xcy=i=>(i/XN)|0;
const xw=i=>(xcx(i)+.5)*XCS, xz=i=>(xcy(i)+.5)*XCS;
const xcell=(x,z)=>{ const cx=Math.floor(x/XCS), cy=Math.floor(z/XCS); return cx<0||cy<0||cx>=XN||cy>=XN?-1:xi(cx,cy); };
const xmaxHp=()=>120+((typeof gearMods==='function'&&gearMods(save).hp)||0);

/* ---------------- the floor plan ---------------- */
function genFloor(depth){
  for(let tries=0;tries<40;tries++){ const f=tryFloor(depth,caveRng((Date.now()&0xffffff)^(depth*7919)^(tries*104729))); if(f) return f; }
  return tryFloor(depth,caveRng(depth));
}
function tryFloor(depth,R){
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const t=new Uint8Array(XN*XN), room=new Int16Array(XN*XN).fill(-1), rooms=[];
  const free=(x,y,w,h,m)=>!rooms.some(r=>x<r.x+r.w+m&&x+w+m>r.x&&y<r.y+r.h+m&&y+h+m>r.y);
  for(let k=0;k<400&&rooms.length<10;k++){ const w=ri(5,10), h=ri(4,8), x=ri(2,XN-w-3), y=ri(2,XN-h-3);
    if(free(x,y,w,h,4)) rooms.push({x,y,w,h,lit:R()<.68}); }
  if(rooms.length<6) return null;
  rooms.sort((a,b)=>(a.x+a.w/2)-(b.x+b.w/2));
  // a hidden closet: a tiny room reached only through a secret door, with a good chest in it
  for(let k=0;k<200;k++){ const x=ri(2,XN-6), y=ri(2,XN-6); if(free(x,y,3,3,3)){ rooms.push({x,y,w:3,h:3,lit:false,closet:true}); break; } }
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
  const main=rooms.filter(r=>!r.closet);
  for(let k=1;k<main.length;k++) carve(main[k-1],main[k],null);
  for(let n=0;n<2;n++){ const a=pick(main), b=pick(main); if(a!==b) carve(a,b,R()<.6?b:null); }
  const closet=rooms.find(r=>r.closet);
  if(closet){ const near=main.slice().sort((p,q)=>Math.hypot(p.cx-closet.cx,p.cy-closet.cy)-Math.hypot(q.cx-closet.cx,q.cy-closet.cy))[0]; carve(closet,near,near); }
  // corridors that clip a room corner can leave doors with no wall either side; keep only real doorways
  for(const [i] of doors){ const x=xcx(i), y=xcy(i), open=d=>t[d]!==T_ROCK;
    const ew=open(xi(x-1,y))&&open(xi(x+1,y)), ns=open(xi(x,y-1))&&open(xi(x,y+1));
    if(ew===ns){ doors.delete(i); t[i]=T_FLOOR; } }
  main[0].lit=true;   // you always arrive somewhere you can see
  const start=main[0], dist=xbfs(t,doors,xi(start.cx,start.cy),false);
  let exit=main[main.length-1], far=-1; for(const r of main){ const d=dist[xi(r.cx,r.cy)]; if(d>far){ far=d; exit=r; } }
  if(far<22) return null;
  return {t,room,rooms,doors,start,exit};
}
// breadth-first distances; secret doors block unless found; `seenOnly` limits it to explored cells
function xbfs(t,doors,s,seenOnly,blockFn){
  const d=new Int16Array(XN*XN).fill(-1), q=[s]; d[s]=0;
  for(let h=0;h<q.length;h++){ const c=q[h], x=xcx(c), y=xcy(c);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=XN||ny>=XN) continue; const n=xi(nx,ny);
      if(d[n]>=0||t[n]===T_ROCK) continue; const dr=doors.get(n); if(dr&&dr.state==='secret') continue;
      if(seenOnly&&!seenOnly[n]) continue; if(blockFn&&blockFn(n)) continue; d[n]=d[c]+1; q.push(n); } }
  return d;
}

/* ---------------- a new floor ---------------- */
function buildFloor(depth,hp){
  const F=genFloor(depth), A=areaOf(depth);
  EX=Object.assign({depth, area:A, hp:hp==null?xmaxHp():hp, vis:new Uint8Array(XN*XN), seen:new Uint8Array(XN*XN),
    chests:[], traps:[], groups:[], log:[], action:null, stuckT:0, regenT:0, active:false, busy:false, path:[], msgT:{}, bossDead:false}, F);
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const cellIn=r=>xi(r.x+ri(0,r.w-1), r.y+ri(0,r.h-1));
  const taken=new Set([xi(F.start.cx,F.start.cy), xi(F.exit.cx,F.exit.cy)]);
  const freeCell=r=>{ for(let k=0;k<30;k++){ const c=cellIn(r); if(!taken.has(c)){ taken.add(c); return c; } } return -1; };
  EX.up=xi(F.start.cx,F.start.cy); EX.down=xi(F.exit.cx,F.exit.cy);
  const others=F.rooms.filter(r=>r!==F.start&&!r.closet);
  // chests: about every other room, sometimes trapped; the closet always has a rich one
  for(const r of others) if(Math.random()<.5){ const c=freeCell(r); if(c>=0) EX.chests.push({cell:c, open:false, trap:Math.random()<.22, trapKnown:false}); }
  const cl=F.rooms.find(r=>r.closet); if(cl){ const c=xi(cl.cx,cl.cy); taken.add(c); EX.chests.push({cell:c, open:false, trap:false, trapKnown:false, rich:true}); }
  // hidden traps in rooms and corridors, never on the stairs or in the first room
  const kinds=['spike','spike','dart','dart','fire','pit','alarm'];
  const floorCells=[]; for(let i=0;i<XN*XN;i++) if(F.t[i]===T_FLOOR&&F.room[i]!==F.start.id&&!taken.has(i)) floorCells.push(i);
  const nT=Math.min(9,3+Math.floor(depth/2));
  for(let n=0;n<nT&&floorCells.length;n++){ const c=floorCells.splice(Math.floor(Math.random()*floorCells.length),1)[0]; taken.add(c); EX.traps.push({cell:c, kind:pick(kinds), known:false, armed:true}); }
  // enemy groups: some asleep, some wandering; on a boss depth the boss waits by the stairs down
  const nG=Math.min(others.length,3+Math.floor(depth/3));
  const rooms=others.slice().sort(()=>Math.random()-.5).filter(r=>r!==F.exit||depth%4!==0).slice(0,nG);
  for(const r of rooms){ const c=freeCell(r); if(c<0) continue; const wave=makeEncounter(depth)[0], ids=wave.slice(0,1+Math.floor(Math.random()*Math.min(3,wave.length)));
    EX.groups.push(xGroup(ids,c,Math.random()<.45?'sleep':'wander')); }
  if(depth%4===0){ const c=xi(F.exit.cx-1,F.exit.cy); EX.groups.push(Object.assign(xGroup([bossFor(depth)],c,'guard'),{boss:true})); }
  EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.pc=EX.up; EX.face=1; EX.view='front';
  xBuildScene(); xUpdateVis(); xLog('Depth '+depth+': '+A.name+'.','dim');
  if(depth%4===0) xLog('Something huge waits by the stairs down on this floor.','warn');
}
function xGroup(ids,cell,state){ return {ids, cell, x:xw(cell), z:xz(cell), state, home:cell, path:[], repath:0, lostT:0, wakeT:1+Math.random()*1.5, seen:false, sprite:null, mark:null, bob:Math.random()*6}; }

/* ---------------- line of sight ---------------- */
const xPassable=i=>{ if(i<0||EX.t[i]===T_ROCK) return false; const d=EX.doors.get(i); return !(d&&d.state==='secret'); };
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
  const amb=new THREE.AmbientLight(0xffffff,.42), sun=new THREE.DirectionalLight(0xffffff,.55); sun.position.set(-4,10,6);
  const lamp=new THREE.PointLight(0xffd9a0,1.25,13,1.6);
  scene.add(amb,sun,lamp);
  X3={renderer,scene,cam,lamp,group:null,ray:new THREE.Raycaster(),plane:new THREE.Plane(new THREE.Vector3(0,1,0),0)};
  cv.addEventListener('pointerdown',xTap);
  return X3;
}
function xTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
function xFloorCanvas(A){ const c=document.createElement('canvas'); c.width=c.height=48; const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle=mixHex(A.lit,'#ffffff',.08); x.fillRect(0,0,48,48); x.drawImage(floorTexture(A),0,0,64,64,0,0,48,48); return c; }
function xWallCanvas(A){ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'), R=caveRng(A.name.length);
  x.fillStyle=mixHex(A.wall,'#000000',.4); x.fillRect(0,0,32,32);
  for(let row=0;row<4;row++){ const off=row%2?4:0; for(let b=-1;b<4;b++){ const bx=b*8+off, by=row*8;
    x.fillStyle=mixHex(A.wall,'#ffffff',.06+R()*.16); x.fillRect(bx+1,by+1,7,6);
    x.fillStyle=mixHex(A.wall,'#ffffff',.3); x.fillRect(bx+1,by+1,7,1); } }
  return c; }
function xTextSprite(txt,col){ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d');
  x.font='bold 22px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=4; x.strokeStyle='#000'; x.strokeText(txt,16,17); x.fillStyle=col; x.fillText(txt,16,17);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:xTex(c),transparent:true,depthTest:false})); s.scale.set(.9,.9,1); s.renderOrder=5; return s; }
function xSprite(getImg,h){ const s=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,alphaTest:.35})); s.center.set(.5,.03); s.scale.set(h,h,1); s.userData={getImg,img:null,flip:false}; return s; }
function xRefresh(s,flip){ const sp=s.userData.getImg(), im=sp&&sp.img;
  if(im&&(im!==s.userData.img||flip!==s.userData.flip)){ s.userData.img=im; s.userData.flip=flip; const tx=xTex(im,true); if(flip){ tx.repeat.x=-1; tx.offset.x=1; }
    if(s.material.map) s.material.map.dispose(); s.material.map=tx; s.material.needsUpdate=true; } }
const xMat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
const xBox=(w,h,d,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); return o; };

function xBuildScene(){
  const G=xInit3D();
  if(G.group){ G.scene.remove(G.group); G.group.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material&&o.material.map) o.material.map.dispose(); }); }
  const grp=new THREE.Group(); G.group=grp; G.scene.add(grp);
  const A=EX.area, floors=[], walls=[];
  for(let i=0;i<XN*XN;i++){ if(EX.t[i]!==T_ROCK) floors.push(i);
    const d=EX.doors.get(i);
    if(EX.t[i]===T_ROCK||(d&&d.state==='secret')){ const x=xcx(i), y=xcy(i); let near=false;
      for(let dy=-1;dy<=1&&!near;dy++) for(let dx=-1;dx<=1;dx++){ const nx=x+dx, ny=y+dy; if(nx>=0&&ny>=0&&nx<XN&&ny<XN&&EX.t[xi(nx,ny)]!==T_ROCK&&!(dx===0&&dy===0)){ near=true; break; } }
      if(near) walls.push(i); } }
  const fm=new THREE.InstancedMesh(new THREE.BoxGeometry(XCS,.3,XCS),xMat(0xffffff,{map:xTex(xFloorCanvas(A))}),floors.length);
  const wm=new THREE.InstancedMesh(new THREE.BoxGeometry(XCS,XWALL,XCS),xMat(0xffffff,{map:xTex(xWallCanvas(A))}),walls.length);
  [fm,wm].forEach(m=>{ m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(m); });
  EX.fIdx=new Map(floors.map((c,k)=>[c,k])); EX.wIdx=new Map(walls.map((c,k)=>[c,k])); EX.fm=fm; EX.wm=wm; EX.shown=new Uint8Array(XN*XN);
  const zero=new THREE.Matrix4().makeScale(0,0,0), col=new THREE.Color(0,0,0);
  floors.forEach((c,k)=>{ fm.setMatrixAt(k,zero); fm.setColorAt(k,col); }); walls.forEach((c,k)=>{ wm.setMatrixAt(k,zero); wm.setColorAt(k,col); });
  // doors: a frame on every doorway, a plank door while it is closed
  const wood=xMat(0x6a4426), iron=xMat(0x2a2a30), frame=xMat(0x3a2414);
  for(const [i,d] of EX.doors){ const ew=EX.t[i-1]!==T_ROCK&&EX.t[i+1]!==T_ROCK, g=new THREE.Group(); g.position.set(xw(i),0,xz(i)); if(ew) g.rotation.y=Math.PI/2;
    g.add(xBox(.22,XWALL,.4,frame,-XCS/2+.11,XWALL/2,0), xBox(.22,XWALL,.4,frame,XCS/2-.11,XWALL/2,0), xBox(XCS,.22,.4,frame,0,XWALL-.11,0));
    const leaf=new THREE.Group(); leaf.add(xBox(XCS-.44,XWALL-.24,.16,wood,0,(XWALL-.24)/2,0), xBox(XCS-.44,.1,.18,iron,0,.4,0), xBox(XCS-.44,.1,.18,iron,0,1.1,0));
    g.add(leaf); d.mesh=g; d.leaf=leaf; leaf.visible=d.state==='closed'; g.visible=false; grp.add(g); }
  // stairs
  const glow=new THREE.Color(EX.depth%4===0?'#ff5d6c':A.glow);
  const down=new THREE.Group(); down.position.set(xw(EX.down),0,xz(EX.down));
  down.add(xBox(XCS*.8,.32,XCS*.8,xMat(0x050507),0,.02,0));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.75,.08,6,20),new THREE.MeshBasicMaterial({color:glow})); ring.rotation.x=Math.PI/2; ring.position.y=.2; down.add(ring);
  down.userData.ring=ring; down.visible=false; grp.add(down); EX.downMesh=down;
  // the way back up: a worn stone circle under a shaft of daylight
  const up=new THREE.Group(); up.position.set(xw(EX.up),0,xz(EX.up));
  up.add(xBox(XCS*.85,.06,XCS*.85,xMat(0xb8b2a0),0,.03,0));
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,6,8,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide})); shaft.position.y=3; up.add(shaft);
  up.visible=false; grp.add(up); EX.upMesh=up;
  // chests
  const cwood=xMat(0x7a4a22), gold=xMat(0xf2c94c,{emissive:0x402a08});
  for(const c of EX.chests){ const g=new THREE.Group(); g.position.set(xw(c.cell),0,xz(c.cell)); g.rotation.y=(Math.random()-.5)*.6;
    g.add(xBox(1,.5,.66,cwood,0,.25,0), xBox(.12,.54,.7,gold,0,.27,0));
    const lid=new THREE.Group(); lid.position.set(0,.5,-.33); lid.add(xBox(1,.22,.66,c.rich?xMat(0x5a3a8a):cwood,0,.11,.33), xBox(.14,.24,.7,gold,0,.12,.33)); g.add(lid);
    g.userData.lid=lid; g.visible=false; c.mesh=g; grp.add(g); }
  // known traps get a plate when found
  for(const tr of EX.traps) tr.mesh=null;
  // you and the enemies are flat sprites standing in the 3D rooms, like the old dungeon crawlers
  EX.me=xSprite(()=>unitSprite({kind:'player',look:gearLook(save),view:EX.view}),2.3); grp.add(EX.me);
  for(const gp of EX.groups) xGroupSprites(gp,grp);
}
function xGroupSprites(gp,grp){ const id=gp.ids[0], d=ENEMY_DEFS[id], h=2.3*Math.max(.75,Math.min(1.7,d.scale||1));
  gp.sprite=xSprite(()=>unitSprite({kind:'enemy',id,color:d.color}),h); gp.sprite.visible=false; grp.add(gp.sprite);
  gp.zz=xTextSprite('z','#9fd8ff'); gp.bang=xTextSprite('!','#ff4d5e'); gp.zz.visible=gp.bang.visible=false; grp.add(gp.zz,gp.bang); gp.h=h; }
function xPaintCells(){
  const zero=new THREE.Matrix4().makeScale(0,0,0), m=new THREE.Matrix4(), col=new THREE.Color();
  for(const [c,k] of EX.fIdx){ const s=EX.seen[c]; if(!s) continue;
    if(!EX.shown[c]){ m.makeTranslation(xw(c),-.15,xz(c)); EX.fm.setMatrixAt(k,m); }
    const v=EX.vis[c], n=.9+((c*2654435761>>>0)%100)/1000; col.setRGB(v?n:.3,v?n:.3,v?n:.34); EX.fm.setColorAt(k,col); }
  for(const [c,k] of EX.wIdx){ if(!EX.seen[c]) continue;
    if(!EX.shown[c]){ m.makeTranslation(xw(c),XWALL/2-.1,xz(c)); EX.wm.setMatrixAt(k,m); }
    const v=EX.vis[c]; col.setRGB(v?1:.32,v?1:.32,v?1:.36); EX.wm.setColorAt(k,col); }
  for(let c=0;c<XN*XN;c++) if(EX.seen[c]) EX.shown[c]=1;
  EX.fm.instanceMatrix.needsUpdate=EX.wm.instanceMatrix.needsUpdate=true;
  if(EX.fm.instanceColor) EX.fm.instanceColor.needsUpdate=true; if(EX.wm.instanceColor) EX.wm.instanceColor.needsUpdate=true;
  for(const [i,d] of EX.doors) if(d.mesh) d.mesh.visible=!!EX.seen[i]&&d.state!=='secret';
  for(const c of EX.chests) c.mesh.visible=!!EX.seen[c.cell];
  EX.downMesh.visible=!!EX.seen[EX.down]; EX.upMesh.visible=!!EX.seen[EX.up];
}
function xTrapMesh(tr){ if(tr.mesh||!X3) return; const T=TRAPS[tr.kind], g=new THREE.Group(); g.position.set(xw(tr.cell),0,xz(tr.cell));
  g.add(xBox(1.3,.06,1.3,xMat(new THREE.Color(T.col).multiplyScalar(.6)),0,.03,0));
  if(tr.kind==='spike') for(let k=0;k<5;k++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.1,.4,4),xMat(0xb8c0cc)); s.position.set(-.4+k*.2,.2,(k%2-.5)*.4); g.add(s); }
  else { const r=new THREE.Mesh(new THREE.TorusGeometry(.42,.06,4,12),new THREE.MeshBasicMaterial({color:T.col})); r.rotation.x=Math.PI/2; r.position.y=.08; g.add(r); }
  tr.mesh=g; X3.group.add(g); }

/* ---------------- input ---------------- */
const XKEY={};
document.addEventListener('keydown',e=>{ if(!EX||!EX.active) return; const k=e.key.toLowerCase(); XKEY[k]=true;
  if(k==='f') xSearch(); if(k==='e') xDisarm(); if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); EX.path=[]; });
document.addEventListener('keyup',e=>{ XKEY[e.key.toLowerCase()]=false; });
function xTap(e){ if(!EX||!EX.active||EX.busy) return; const G=X3, r=e.target.getBoundingClientRect();
  const v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1), hit=new THREE.Vector3();
  G.ray.setFromCamera(v,G.cam); if(!G.ray.ray.intersectPlane(G.plane,hit)) return;
  const c=xcell(hit.x,hit.z); if(c<0||!EX.seen[c]) return;
  const goal=c, blocked=n=>xKnownTrap(n)||xChestAt(n)&&n!==goal;
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
  if(EX.action){ EX.action.t-=dt; if(EX.action.t<=0){ const a=EX.action; EX.action=null; a.done(); } return; }
  if(EX.stuckT>0){ EX.stuckT-=dt; return; }
  let ix=0, iz=0;
  if(XKEY.a||XKEY.arrowleft) ix-=1; if(XKEY.d||XKEY.arrowright) ix+=1; if(XKEY.w||XKEY.arrowup) iz-=1; if(XKEY.s||XKEY.arrowdown) iz+=1;
  if(!ix&&!iz&&EX.path.length){ const n=EX.path[0], tx=xw(n)-EX.px, tz=xz(n)-EX.pz, d=Math.hypot(tx,tz); if(d<.25){ EX.path.shift(); } else { ix=tx/d; iz=tz/d; } }
  const len=Math.hypot(ix,iz); if(len<.1){ EX.walk=0; return; }
  ix/=len; iz/=len; const sp=5.4*dt, r=.42;
  const tryAxis=(nx,nz)=>{ for(const [ox,oz] of [[-r,-r],[r,-r],[-r,r],[r,r]]){ const c=xcell(nx+ox,nz+oz); if(c===EX.pc) continue; if(!xBump(c)) return false; } return true; };
  if(tryAxis(EX.px+ix*sp,EX.pz)) EX.px+=ix*sp; if(tryAxis(EX.px,EX.pz+iz*sp)) EX.pz+=iz*sp;
  if(Math.abs(ix)>.2) EX.face=ix<0?-1:1; EX.view=iz<-.35?'back':'front'; EX.walk=(EX.walk||0)+dt*10;
  const c=xcell(EX.px,EX.pz); if(c!==EX.pc&&c>=0){ EX.pc=c; xEnter(c); }
}
// walking into a cell: walls stop you, doors open, chests open, a trap you know about stops you
function xBump(c){
  if(c<0||!xPassable(c)) return false;
  const d=EX.doors.get(c); if(d&&d.state==='closed'){ d.state='open'; d.leaf.visible=false; xLog('You open the door.','dim'); xUpdateVis(); return false; }
  const ch=xChestAt(c); if(ch){ xOpenChest(ch); return false; }
  const tr=xKnownTrap(c); if(tr){ xSay('trap','There is a '+TRAPS[tr.kind].name+' there. Disarm it (E) or go around.'); EX.path=[]; return false; }
  return true;
}
function xEnter(c){
  xUpdateVis();
  const tr=EX.traps.find(t=>t.cell===c&&t.armed); if(tr) xSpring(tr);
  if(c===EX.down) xStairsDown();
  xHud();
}
function xHurt(n,why){ EX.hp=Math.max(0,EX.hp-n); xFlash(); xHud(); if(EX.hp<=0) xDie(why); }
function xSpring(tr){ const T=TRAPS[tr.kind]; tr.known=true; xTrapMesh(tr);
  xLog(T.text,'bad'); const dmg=T.dmg[1]?Math.round(rnd(T.dmg[0],T.dmg[1])+EX.depth*.8):0;
  if(tr.kind==='alarm'){ tr.armed=false; if(tr.mesh) tr.mesh.visible=false; for(const g of EX.groups) if(!g.boss){ g.state='chase'; g.lostT=0; } }
  if(tr.kind==='pit') EX.stuckT=T.stuck;
  if(dmg) xHurt(dmg,'a '+T.name); }

/* ---------------- search, disarm, chests ---------------- */
function xSearch(){ if(!EX||EX.action||EX.busy) return; EX.path=[]; xLog('You search the area…','dim');
  EX.action={t:1.1, done(){ const x=xcx(EX.pc), y=xcy(EX.pc); let found=0;
    for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const i=xi(x+dx,y+dy), d=EX.doors.get(i);
      if(d&&d.state==='secret'&&Math.random()<.55){ d.state='closed'; d.leaf.visible=true; found++; xLog('You find a hidden door!','good');
        const k=EX.wIdx.get(i); if(k!=null){ EX.wm.setMatrixAt(k,new THREE.Matrix4().makeScale(0,0,0)); EX.wm.instanceMatrix.needsUpdate=true; } EX.seen[i]=1; } }
    for(const tr of EX.traps) if(tr.armed&&!tr.known&&Math.max(Math.abs(xcx(tr.cell)-x),Math.abs(xcy(tr.cell)-y))<=2&&Math.random()<.65){ tr.known=true; xTrapMesh(tr); found++; xLog('You find a '+TRAPS[tr.kind].name+'.','good'); }
    for(const ch of EX.chests) if(!ch.open&&ch.trap&&!ch.trapKnown&&Math.max(Math.abs(xcx(ch.cell)-x),Math.abs(xcy(ch.cell)-y))<=1&&Math.random()<.65){ ch.trapKnown=true; found++; xLog('The chest\'s lock is trapped.','good'); }
    if(!found) xLog('You find nothing.','dim'); xUpdateVis(); xHud(); } };
  xHud(); }
function xDisarmTarget(){ const x=xcx(EX.pc), y=xcy(EX.pc), near=c=>Math.max(Math.abs(xcx(c)-x),Math.abs(xcy(c)-y))<=1;
  return EX.traps.find(t=>t.armed&&t.known&&near(t.cell))||EX.chests.find(c=>!c.open&&c.trap&&c.trapKnown&&near(c.cell)); }
function xDisarm(){ if(!EX||EX.action||EX.busy) return; const tg=xDisarmTarget(); if(!tg){ xLog('There is nothing here you know how to disarm.','dim'); return; }
  EX.path=[]; const isChest=tg.open!==undefined; xLog('You carefully work at the '+(isChest?'lock':TRAPS[tg.kind].name)+'…','dim');
  EX.action={t:1.3, done(){ const ok=Math.random()<.72;
    if(isChest){ if(ok){ tg.trap=false; xLog('You disarm the needle in the lock.','good'); } else { tg.trap=false; xLog('Click. A needle jabs your hand!','bad'); xHurt(Math.round(5+EX.depth),'a trapped lock'); } }
    else if(ok){ tg.armed=false; if(tg.mesh) tg.mesh.visible=false; xLog('You disarm the '+TRAPS[tg.kind].name+'.','good'); if(Math.random()<.3){ const g=Math.round(5+EX.depth*3); save.gold+=g; persist(); xLog('You salvage '+g+' gold of parts.','gold'); } }
    else { xLog('You slip!','bad'); xSpring(tg); tg.armed=false; if(tg.mesh) tg.mesh.visible=false; }
    xHud(); } };
  xHud(); }
function xOpenChest(ch){
  if(ch.trap&&ch.trapKnown){ xSay('chest','The lock is trapped. Disarm it first (E).'); return; }
  if(ch.trap){ ch.trap=false; xLog('A needle in the lock pricks you!','bad'); xHurt(Math.round(5+EX.depth),'a trapped chest'); if(EX.hp<=0) return; }
  ch.open=true; ch.mesh.userData.lid.rotation.x=-1.9; EX.path=[];
  const rolls=ch.rich?2:1; for(let n=0;n<rolls;n++) xLoot(ch.rich);
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
  for(const g of EX.groups){
    const vis=!!EX.vis[g.cell]; if(vis&&!g.seen&&g.state!=='sleep'){ g.seen=true; }
    const d=Math.hypot(g.x-EX.px,g.z-EX.pz), cells=d/XCS;
    if(g.state==='sleep'){ g.wakeT-=dt; if(g.wakeT<=0){ g.wakeT=1; if(cells<2.6&&Math.random()<.3){ g.state='chase'; g.surprise=!EX.vis[g.cell]; if(EX.vis[g.cell]) xLog(ENEMY_DEFS[g.ids[0]].name+' wakes up!','warn'); } } }
    else if(g.state==='guard'){ if(EX.room[EX.pc]===EX.room[g.home]&&EX.room[EX.pc]>=0){ g.state='chase'; xLog(ENEMY_DEFS[g.ids[0]].name+' rises to face you!','warn'); } }
    else { const sees=cells<7.5&&xLos(g.cell,EX.pc);
      if(sees){ if(g.state!=='chase'&&EX.vis[g.cell]) xLog(ENEMY_DEFS[g.ids[0]].name+' spots you!','warn'); g.state='chase'; g.lostT=0; }
      else if(g.state==='chase'){ g.lostT+=dt; if(g.lostT>6){ g.state='wander'; g.path=[]; } }
      g.repath-=dt;
      if(g.repath<=0){ g.repath=g.state==='chase'?.4:2.5;
        const goal=g.state==='chase'?EX.pc:(g.path.length?null:xWanderGoal(g));
        if(goal!=null){ const dist=xbfs(EX.t,EX.doors,goal,null,n=>!!xKnownTrap(n)&&false); g.path=xPathTo(dist,g.cell,goal); } }
      const sp=(g.state==='chase'?4.1:2)*dt;
      if(g.path.length){ const n=g.path[0], tx=xw(n)-g.x, tz=xz(n)-g.z, l=Math.hypot(tx,tz);
        if(l<.2){ g.path.shift(); const dr=EX.doors.get(n); if(dr&&dr.state==='closed'){ dr.state='open'; dr.leaf.visible=false; if(EX.seen[n]) xUpdateVis(); } }
        else { g.x+=tx/l*Math.min(sp,l); g.z+=tz/l*Math.min(sp,l); g.face=tx<0?-1:1; } }
      const c=xcell(g.x,g.z); if(c>=0) g.cell=c; }
    if(d<1.15&&!EX.busy){ xEngage(g); return; }
  }
}
function xWanderGoal(g){ const r=pick(EX.rooms.filter(r=>!r.closet)); return xi(r.x+Math.floor(Math.random()*r.w),r.y+Math.floor(Math.random()*r.h)); }
function xPathTo(dist,from,goal){ if(dist[from]<0) return []; const out=[]; let cur=from;
  for(let k=0;k<200&&cur!==goal;k++){ const x=xcx(cur), y=xcy(cur); let best=-1;
    for(const n of [xi(x+1,y),xi(x-1,y),xi(x,y+1),xi(x,y-1)]) if(n>=0&&n<XN*XN&&dist[n]>=0&&dist[n]<dist[cur]&&(best<0||dist[n]<dist[best])) best=n;
    if(best<0) break; out.push(best); cur=best; }
  return out; }
// how the fight opens: reach a sleeping enemy first and you ambush it; one you never saw coming strikes first
function xEngage(g){
  const opening=g.state==='sleep'?'ambush':(g.surprise||!g.seen)?'surprised':null;
  EX.busy=true; EX.path=[]; EX.fighting=g;
  const name=ENEMY_DEFS[g.ids[0]].name;
  if(opening==='ambush') xLog('You catch the '+name+' asleep!','good'); else if(opening==='surprised') xLog('The '+name+' was waiting for you!','bad');
  const b=$('#xBang'); b.textContent=opening==='ambush'?'Ambush!':opening==='surprised'?'Surprised!':'!'; b.className='x-bang on '+(opening||'');
  setTimeout(()=>{ b.className='x-bang'; EX.active=false; fight(EX.depth,[g.ids.slice()],{hp:EX.hp,opening,explore:true}); },700);
}

/* ---------------- floors, camp, death ---------------- */
function xStairsDown(){
  if(EX.groups.some(g=>g.boss)){ xSay('boss','The stairs are sealed while the guardian of this floor lives.'); return; }
  EX.busy=true; xLog('You descend…','dim'); const nd=EX.depth+1, hp=Math.min(xmaxHp(),EX.hp+Math.round(xmaxHp()*.2));
  save.deepest=Math.max(save.deepest,nd); persist();
  setTimeout(()=>{ buildFloor(nd,hp); EX.active=true; xHud(); xLoopStart(); xBanner('Depth '+nd); },500);
}
function xToCamp(){ if(!EX||EX.pc!==EX.up) return; logCamp('Climbed back to camp from depth '+EX.depth+'.','dim'); stopExplore(); pickDepth=EX.depth; EX=null; openCamp(); }
function xDie(why){ EX.busy=true; const lost=Math.floor(save.gold*.2); save.gold-=lost; persist(); const depth=EX.depth;
  logCamp('Killed by '+why+' at depth '+depth+', dropped '+lost+' gold.','curse'); stopExplore();
  reveal('You died…','Killed by '+why+' on depth '+depth+'. You dropped '+lost+' gold. Your cards are safe.',[],[['Camp',()=>{ EX=null; openCamp(); },true]]); }
function stopExplore(){ if(EX) EX.active=false; }

/* ---------------- loop, hud ---------------- */
let xRaf=0, xLast=0;
function xLoopStart(){ cancelAnimationFrame(xRaf); xLast=performance.now(); xRaf=requestAnimationFrame(xLoop); }
function xLoop(ts){
  if(!EX||!EX.active||!$('#scrExplore').classList.contains('on')) return;
  const dt=Math.min(.05,(ts-xLast)/1000); xLast=ts;
  if(!EX.busy){ xMove(dt); xEnemies(dt);
    EX.regenT+=dt; if(EX.regenT>3){ EX.regenT=0; if(EX.hp<xmaxHp()){ EX.hp++; xHud(); } } }
  xDraw(ts/1000); xRaf=requestAnimationFrame(xLoop);
}
function xResize(){ const G=X3, cv=$('#xView'), w=cv.clientWidth||400, h=cv.clientHeight||600; G.renderer.setSize(w,h,false); G.cam.aspect=w/h; G.cam.updateProjectionMatrix(); }
function xDraw(T){
  const G=X3; xResize();
  const bob=EX.walk?Math.abs(Math.sin(EX.walk))*.08:0;
  EX.me.position.set(EX.px,bob,EX.pz); xRefresh(EX.me,EX.face<0);
  G.lamp.position.set(EX.px,2.6,EX.pz);
  const portrait=G.cam.aspect<1, hgt=portrait?23:18, back=portrait?12:10;
  G.cam.position.set(EX.px,hgt,EX.pz+back); G.cam.lookAt(EX.px,0,EX.pz-.5);
  for(const g of EX.groups){ const v=!!EX.vis[g.cell]; g.sprite.visible=v; g.zz.visible=v&&g.state==='sleep'; g.bang.visible=v&&g.state==='chase';
    if(v){ g.sprite.position.set(g.x,g.state==='sleep'?0:Math.abs(Math.sin(T*4+g.bob))*.06,g.z); xRefresh(g.sprite,(g.face||-1)>0);
      g.zz.position.set(g.x+.5,g.h+.2+Math.sin(T*2+g.bob)*.15,g.z); g.bang.position.set(g.x,g.h+.35,g.z); } }
  EX.downMesh.userData.ring.rotation.z+=.02;
  for(const c of EX.chests) if(c.rich&&!c.open) c.mesh.position.y=Math.abs(Math.sin(T*2))*.05;
  G.renderer.render(G.scene,G.cam);
  if((EX.miniT=(EX.miniT||0)+1)%6===0) xMini();
}
function xMini(){
  const cv=$('#xMini'), c=cv.getContext('2d'), s=3; cv.width=cv.height=XN*s;
  c.fillStyle='rgba(5,6,10,.8)'; c.fillRect(0,0,cv.width,cv.height);
  for(let i=0;i<XN*XN;i++){ if(!EX.seen[i]||EX.t[i]===T_ROCK) continue; const d=EX.doors.get(i); if(d&&d.state==='secret') continue;
    c.fillStyle=d?'#a0703a':EX.vis[i]?'#7c8aa6':'#3c4458'; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); }
  const dot=(i,col,r)=>{ c.fillStyle=col; c.fillRect(xcx(i)*s-r+1,xcy(i)*s-r+1,s+2*r-2,s+2*r-2); };
  if(EX.seen[EX.down]) dot(EX.down,EX.depth%4===0?'#ff5d6c':'#d6b8ff',2); if(EX.seen[EX.up]) dot(EX.up,'#fff2c0',2);
  for(const ch of EX.chests) if(EX.seen[ch.cell]&&!ch.open) dot(ch.cell,'#f2c94c',1);
  for(const tr of EX.traps) if(tr.known&&tr.armed) dot(tr.cell,'#ff4d5e',1);
  for(const g of EX.groups) if(EX.vis[g.cell]) dot(g.cell,'#ff6b6b',1);
  dot(EX.pc,'#ffffff',2);
}
function xLog(t,c){ if(!EX) return; EX.log.push({t,c}); if(EX.log.length>5) EX.log.shift();
  const el=$('#xLog'); if(el) el.innerHTML=EX.log.map((l,i)=>`<div class="${l.c||''}" style="opacity:${.45+.55*(i+1)/EX.log.length}">${esc(l.t)}</div>`).join(''); }
function xSay(k,t){ const now=performance.now(); if((EX.msgT[k]||0)>now) return; EX.msgT[k]=now+2500; xLog(t,'warn'); }
function xBanner(t){ const b=$('#xBang'); b.textContent=t; b.className='x-bang on depth'; setTimeout(()=>{ if(b.textContent===t) b.className='x-bang'; },1400); }
function xFlash(){ const h=$('#xHurt'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); }
function xHud(){ if(!EX) return; const m=xmaxHp();
  $('#xHpBar').style.width=(100*EX.hp/m)+'%'; $('#xHpTxt').textContent=Math.ceil(EX.hp)+' / '+m+' HP';
  $('#xDepth').textContent='Depth '+EX.depth+' · '+EX.area.name; $('#xGold').textContent=save.gold+' gold';
  $('#xSearch').disabled=!!EX.action; $('#xDisarm').disabled=!!EX.action||!xDisarmTarget();
  $('#xCamp').style.display=EX.pc===EX.up?'':'none'; $('#xAct').textContent=EX.action?'…':''; }

/* ---------------- entering and returning ---------------- */
function enterExplore(depth){
  const v=validateDeck(activeDeck().list,CARDS,save.owned); if(!v.ok) return;
  if(typeof THREE==='undefined'){ tip('The 3D map could not load; fighting directly.'); return fight(depth); }
  show('scrExplore'); xInit3D(); buildFloor(depth); EX.active=true; xHud(); xLoopStart();
  xBanner('Depth '+depth);
}
// back from a fight that started on the map: the enemy is gone and your wounds carry over
function resumeExplore(hp,won){
  if(!EX) return openCamp();
  const g=EX.fighting; EX.fighting=null;
  if(won&&g){ EX.groups=EX.groups.filter(x=>x!==g); [g.sprite,g.zz,g.bang].forEach(o=>X3.group.remove(o)); if(g.boss){ EX.bossDead=true; xLog('The guardian falls. The stairs down are open.','good'); } }
  EX.hp=Math.max(1,hp); EX.busy=false; EX.active=true; EX.path=[];
  for(const k in XKEY) XKEY[k]=false;
  show('scrExplore'); xUpdateVis(); xHud(); xLoopStart();
}
$('#xSearch').onclick=()=>xSearch();
$('#xDisarm').onclick=()=>xDisarm();
$('#xCamp').onclick=()=>xToCamp();
