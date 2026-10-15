/* Hexmancers — the battle arena in 3D. The fight's rules stay in battle.js; this draws them with
   the dungeon's look (look.js): the same lit stone, normal maps, AO, haze and settings.

   Battle units are world units here: one hex has radius 1, tile tops are at y = 0. The board's
   columns run toward the enemy (wx) and its rows across the screen (wz); three.js gets
   (x, y, z) = (wz, y, -wx), so your side is near the camera and the enemy's far from it.

   Each frame battle.js's render() hands over:
   - every tile's colour (arenaTiles)
   - the floor layer: aim areas, traps, telegraphs, claimed land. These are drawn by the old 2D
     code into a top-down canvas laid on the board (arenaDecal), so they sit under the units and
     in the camera's perspective.
   - every unit it would have drawn (arenaUnit)
   Bars, labels and numbers still go on the flat #board canvas on top, placed through the 3D
   camera (arenaProject). */

let AR=null;
const AR_V=new THREE.Vector3();
const arW=(wx,y,wz)=>AR_V.set(wz,y,-wx);   // battle point -> three.js point (shared vector)

function arenaInit(){
  if(AR) return AR;
  const cv=document.getElementById('board3d'), renderer=new THREE.WebGLRenderer({canvas:cv, antialias:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(46,1,.1,240);
  const amb=new THREE.AmbientLight(0xffffff,.2), sun=new THREE.DirectionalLight(0xffffff,.22); sun.position.set(-4,10,6);
  const lamp=new THREE.PointLight(0xffd9a0,1.6,16,1.4);   // your light, as in the dungeon
  scene.add(amb,sun,lamp);
  AR={renderer,scene,cam,amb,sun,lamp,grp:null,key:null,w:0,h:0,unit:1.15,frameN:0,
    base:{pos:new THREE.Vector3(),look:new THREE.Vector3()},
    // the camera's moves on top of its base view (arenaCamera)
    shot:{t:0,fly:1,drift:new THREE.Vector3(),swing:0,punch:0,shake:0}};
  lookWatch(renderer,()=>scene); arSpellPool(AR); arPropLights(AR);   // made up front: a change in the number of lights would rebuild every material
  return AR; }

/* ---------------- fitting the camera to the board ----------------
   By default the camera is the old 2D board's view, matched exactly: the flat board was drawn as
   seen from a camera tilted down by asin(View.iy) (53 degrees in portrait, 38 on a wide screen) at
   View.dist from the middle of the board, with View.S * View.dist pixels of focal length, its centre
   at (View.cx, View.cy) on the canvas. resizeView works those out first, as it always did.
   The debug menu's Angle and Lens, when set (not 0), fit a camera of that tilt and field of view
   instead: the nearest that keeps every tile and a unit's height inside the canvas. */
function arenaFit(w,h){ const A=arenaInit(), c=A.cam; A.w=w; A.h=h; c.aspect=w/h; c.clearViewOffset();
  if(!(XLIT.camPitch>0)){ const iy=View.iy2D, cp=Math.sqrt(1-iy*iy), d=View.dist, f=View.S*d, look=arW(-View.v0,0,View.u0).clone();
    c.fov=2*Math.atan(h/2/f)*180/Math.PI; c.setViewOffset(w,h,w/2-View.cx,h/2-View.cy,w,h); c.updateProjectionMatrix();
    c.position.set(look.x,d*iy,look.z+d*cp); c.lookAt(look); c.updateMatrixWorld();
    A.base.pos.copy(c.position); A.base.look.copy(look); A.dist=d; return; }
  c.fov=XLIT.camFov>0?XLIT.camFov:46; c.updateProjectionMatrix();
  const portrait=h>w*1.05, mx=portrait?12:36, my=12, AR_PITCH=Math.max(10,XLIT.camPitch-(portrait?0:8))*Math.PI/180;   // the debug menu's angle (8 degrees lower on a wide screen)
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z0=Math.min(z0,t.wz); z1=Math.max(z1,t.wz); }
  const pts=[]; for(const t of TILES) if(t.wx<=x0+.1||t.wx>=x1-.1||t.wz<=z0+.1||t.wz>=z1-.1) for(const y of [0,2.2]) for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; pts.push([t.wx+Math.cos(a),y,t.wz+Math.sin(a)]); }
  pts.push([x0-1,-SLAB,0],[x1+1,-SLAB,0]);
  const v=new THREE.Vector3(), fit=(d,off)=>{ c.position.set(0,Math.sin(AR_PITCH)*d,Math.cos(AR_PITCH)*d+off); c.lookAt(0,0,off); c.updateMatrixWorld(); c.updateProjectionMatrix();
    let a=1e9,b=-1e9,cc=1e9,e=-1e9; for(const [px,py,pz] of pts){ v.set(pz,py,-px).project(c); if(v.z>1) return null; const sx=(v.x+1)/2*w, sy=(1-v.y)/2*h; a=Math.min(a,sx); b=Math.max(b,sx); cc=Math.min(cc,sy); e=Math.max(e,sy); }
    return [a,b,cc,e]; };
  let lo=6, hi=400, off=0;
  for(let it=0;it<30;it++){ const d=(lo+hi)/2; let r=fit(d,off);
    for(let k=0;k<6&&r;k++){ const mid=(r[2]+r[3])/2-h/2; off+=mid/h*d*.9; r=fit(d,off); }
    if(r&&r[0]>=mx&&r[1]<=w-mx&&r[2]>=my&&r[3]<=h-my) hi=d; else lo=d; }
  fit(hi,off); A.base.pos.copy(c.position); A.base.look.set(0,0,off); A.dist=hi; }

// a battle point (wx, height, wz) to #board canvas pixels, through the camera as drawn this frame
function arenaProject(wx,y,wz){ const A=AR; if(!A||!A.w) return [0,0]; const v=arW(wx,y,wz).project(A.cam); return [(v.x+1)/2*A.w,(1-v.y)/2*A.h]; }

/* ---------------- building the arena ---------------- */
// every material the arena made, so a new battle frees the old ones
function arMat(m){ (AR.mats||(AR.mats=[])).push(m); return m; }
function arenaClear(){ const A=AR; if(!A||!A.grp) return; A.scene.remove(A.grp);
  A.grp.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  for(const m of A.mats||[]){ XLITMATS.delete(m); m.dispose(); } A.mats=[];
  for(const t of A.texs||[]) t.dispose(); A.texs=[]; A.grp=null; A.units=new Map(); }
const arTex=t=>{ (AR.texs||(AR.texs=[])).push(t); return t; };

// the hex tiles: one merged mesh, each tile a hex prism with its own window of the area's floor
// stone on top (as in the old board) and a colour per vertex set every frame from the tile's state
function arenaBoard(A,Ar,R){
  const tex=arTex(xTex(xSlabFloor(Ar.stone||AREAS[0].stone,(Ar.index||0)*31+5,0),true)), cvs=tex.image;
  const n=TILES.length, VT=6*3+6*6, pos=new Float32Array(n*VT*3), nor=new Float32Array(n*VT*3), uv=new Float32Array(n*VT*2), col=new Float32Array(n*VT*3).fill(1);
  const rad=.96, lo=-SLAB; let k=0;
  const put=(x,y,z,nx,ny,nz,u,w)=>{ pos.set([x,y,z],k*3); nor.set([nx,ny,nz],k*3); uv.set([u,w],k*2); k++; };
  TILES.forEach((t,ti)=>{ t._v0=k; const cx=t.wz, cz=-t.wx, h=Math.imul(t.q*73856093^t.r*19349663,2654435761)>>>0, ou=(h%97)/97, ov=((h>>>8)%89)/89;
    const C=[]; for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; C.push([cx+Math.sin(a)*rad, cz-Math.cos(a)*rad]); }
    const U=(x,z)=>[ou+(x-cx)*.17, ov+(z-cz)*.17];
    for(let i=0;i<6;i++){ const a=C[i], b=C[(i+1)%6];
      put(cx,0,cz,0,1,0,...U(cx,cz)); put(b[0],0,b[1],0,1,0,...U(b[0],b[1])); put(a[0],0,a[1],0,1,0,...U(a[0],a[1])); }
    for(let i=0;i<6;i++){ const a=C[i], b=C[(i+1)%6], mx=(a[0]+b[0])/2-cx, mz=(a[1]+b[1])/2-cz, l=Math.hypot(mx,mz), nx=mx/l, nz=mz/l, u0=ou+i*.1, u1=u0+.1;
      put(a[0],0,a[1],nx,0,nz,u0,.6); put(b[0],0,b[1],nx,0,nz,u1,.6); put(b[0],lo,b[1],nx,0,nz,u1,.55);
      put(a[0],0,a[1],nx,0,nz,u0,.6); put(b[0],lo,b[1],nx,0,nz,u1,.55); put(a[0],lo,a[1],nx,0,nz,u0,.55); }
    t._v1=k; });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const m=arMat(xLitTag(xPhong({map:tex,vertexColors:true,pbr:'slab'}),1,cvs)), mesh=new THREE.Mesh(g,m); mesh.renderOrder=0;
  // the glow layer: the same tiles' tops again, unlit and added on, black where nothing glows
  const gpos=[], gcol=[]; TILES.forEach(t=>{ t._g0=gpos.length/3; const cx=t.wz, cz=-t.wx;
    for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3, b=a+Math.PI/3; gpos.push(cx,.012,cz, cx+Math.sin(b)*rad,.012,cz-Math.cos(b)*rad, cx+Math.sin(a)*rad,.012,cz-Math.cos(a)*rad); gcol.push(0,0,0,0,0,0,0,0,0); } });
  const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.Float32BufferAttribute(gpos,3)); gg.setAttribute('color',new THREE.Float32BufferAttribute(gcol,3));
  const glow=new THREE.Mesh(gg,arMat(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}))); glow.renderOrder=1;
  // the outline of every tile and a faint triangle grid inside it, a steady guide to walk by
  const lp=[], lc=[]; const side=t=>t.side==='p'?[.5,.83,1]:t.side==='e'?[.59,.65,.7]:[.22,1,.54];
  for(const t of TILES){ const cx=t.wz, cz=-t.wx, c=side(t), f=t.side==='p'?.5:t.side==='e'?.32:.5, fi=t.side==='p'?.14:.08;
    for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3, b=a+Math.PI/3, ax=cx+Math.sin(a)*rad, az=cz-Math.cos(a)*rad, bx=cx+Math.sin(b)*rad, bz=cz-Math.cos(b)*rad;
      lp.push(ax,.02,az,bx,.02,bz); lc.push(...c.map(v=>v*f),...c.map(v=>v*f));
      if(t.side!=='n'){ lp.push(cx,.02,cz,ax,.02,az); lc.push(...c.map(v=>v*fi),...c.map(v=>v*fi)); } } }
  const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3)); lg.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
  const lines=new THREE.LineSegments(lg,arMat(new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}))); lines.renderOrder=2;
  A.board={mesh,glow,lines}; return [mesh,glow,lines]; }

/* The floor layer: a canvas seen from straight above, laid on the board. The old 2D floor code
   draws into it unchanged: battle.js turns its projection to this canvas while it does (DEC). */
const DEC={k:40, wx0:0, wx1:0, wz0:0, wz1:0, cv:null, ctx:null, tex:null};
function arenaDecal(A){ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z0=Math.min(z0,t.wz); z1=Math.max(z1,t.wz); }
  Object.assign(DEC,{wx0:x0-1.6,wx1:x1+1.6,wz0:z0-1.6,wz1:z1+1.6});
  if(!DEC.cv){ DEC.cv=document.createElement('canvas'); DEC.ctx=DEC.cv.getContext('2d'); }
  DEC.cv.width=Math.round((DEC.wz1-DEC.wz0)*DEC.k); DEC.cv.height=Math.round((DEC.wx1-DEC.wx0)*DEC.k);
  if(DEC.tex) DEC.tex.dispose(); DEC.tex=new THREE.CanvasTexture(DEC.cv); DEC.tex.minFilter=THREE.LinearFilter;
  const W=DEC.wz1-DEC.wz0, H=DEC.wx1-DEC.wx0, m=new THREE.Mesh(new THREE.PlaneGeometry(W,H),arMat(new THREE.MeshBasicMaterial({map:DEC.tex,transparent:true,depthWrite:false,fog:false})));
  m.rotation.x=-Math.PI/2; m.position.set((DEC.wz0+DEC.wz1)/2,.03,-(DEC.wx0+DEC.wx1)/2); m.renderOrder=3; return m; }

/* The cave around the board: a floor of the area's raw rock, then its dungeon wall blocks in a
   horseshoe: tall at the back (behind the enemy), stepping down along the sides, and only low
   rubble at the front so nothing ever hides the board. */
function arenaCave(A,Ar,R,boss){ const out=[], S=Ar.stone||AREAS[0].stone;
  let x0=1e9,x1=-1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z1=Math.max(z1,t.wz); }
  const back=x1+(boss?6:3.2), near=x0-7, side=z1+(boss?4.2:2.6);
  A.room={back,near,side};
  // walls only some of the time (always on a boss floor): otherwise the board stands on an island of
  // rock over the dungeon's chasm, in the area's haze, so you can see it is the same place
  A.open=!boss&&(!XLIT.arWalls||R()<.65);
  if(A.open){ A.room.back=x1+1.7; A.room.near=x0-1.9; const back=A.room.back, near=A.room.near;   // the island ends just past the board, so the chasm shows beyond
    const t=arTex(xTex(xRockFloor(S,(Ar.index||0)*17+3),true)); t.repeat.set((2*side+3)/8,(back-near)/8);
    const sideT=arTex(xTex(xRockWall(S,(Ar.index||0)*13+1),true)); sideT.repeat.set(6,1);
    const top=arMat(xLitTag(xPhong({map:t}),1,t.image)), rim=arMat(xLitTag(xPhong({map:sideT}),2,sideT.image));
    const g=new THREE.BoxGeometry(2*side+3,1.6,back-near), isl=new THREE.Mesh(g,[rim,rim,top,rim,rim,rim]); isl.position.set(0,-SLAB-.8,-(back+near)/2); isl.userData.caveFloor=1; out.push(isl);
    out.push(...arChasm(A,Ar,S)); A.wallCells=[]; return out; }
  // the floor: raw rock, sunk a slab below the tiles so the board stands up out of it
  out.push(...arChasm(A,Ar,S));
  const ft=arTex(xTex(xRockFloor(S,(Ar.index||0)*17+3),true)); ft.repeat.set((2*side+8)/8,(back-near+8)/8);
  const fm=arMat(xLitTag(xPhong({map:ft}),1,ft.image)), floor=new THREE.Mesh(new THREE.PlaneGeometry(2*side+8,back-near+8),fm);
  floor.rotation.x=-Math.PI/2; floor.position.set(0,-SLAB,-(back+near)/2); floor.userData.caveFloor=1; out.push(floor);
  // the walls: dungeon blocks (rough rock), each its own height, in an instanced mesh
  const wt=arTex(xTex(xRockWall(S,(Ar.index||0)*13+1),true)), wm=arMat(xLitTag(xPhong({map:wt}),2,wt.image)), geo=xWallGeo(true,(Ar.index||0)+3);
  const cells=[]; const B2=XCS;
  for(let z=-side;z<=side+.01;z+=B2) cells.push([back+B2/2,z,1]);                                 // back wall
  for(const s of [-1,1]) for(let x=back;x>=near;x-=B2) cells.push([x,s*(side+B2/2),Math.max(.25,Math.min(1,(x-x0+2)/(back-x0+2)))]);   // sides, lower toward you
  const im=new THREE.InstancedMesh(geo,wm,cells.length), m4=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), p=new THREE.Vector3();
  cells.forEach(([wx,wz,hk],i)=>{ const hy=(hk*(boss?2.6:1.9)+R()*.5)*(1+(wx>x1?R()*.6:0)); sc.set(1,hy,1); q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.floor(R()*4)*Math.PI/2);
    p.set(wz,-SLAB+XWALL*hy/2,-wx); m4.compose(p,q,sc); im.setMatrixAt(i,m4); });
  out.push(im); A.wallCells=cells;
  return out; }

// the AO map under the arena: the floor darkens toward the walls around it (as on a dungeon floor)
function arenaBakeAO(){ const A=AR; if(!A||!A.room||!A.wallCells) return; const {back,near,side}=A.room, x0=near-4, z0=-side-4, W=Math.max(back-near,2*side)+8, N=128;
  const d=A.aoData||(A.aoData=new Uint8Array(N*N*4)), rad=Math.max(.05,XLIT.aoRad)*2.2;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const X=z0+(i+.5)/N*W, Z=-(back+4)+(j+.5)/N*W; let o=0;   // three.js x, z
    for(const [wx,wz] of A.wallCells){ const ex=Math.max(Math.abs(X-wz)-1,0), ez=Math.max(Math.abs(Z+wx)-1,0), w=Math.max(0,1-Math.hypot(ex,ez)/rad); o+=w*w; }
    d[(j*N+i)*4]=Math.round(255*(1-Math.exp(-o*.9))); }
  if(!A.aoTex){ const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat); t.magFilter=t.minFilter=THREE.LinearFilter; A.aoTex=t; }
  A.aoTex.needsUpdate=true; A.ao={scale:W,ox:z0,oz:-(back+4)}; }

// a new battle (or a new depth): the arena is built again from the area's look
function arenaBuild(depth,seed){ const A=arenaInit(); arenaClear(); const Ar=areaOf(depth), R=caveRng(seed|0), boss=isBossDepth(depth);
  A.area=Ar; A.boss=boss; A.depth=depth; A.grp=new THREE.Group(); A.units=new Map();
  for(const o of arenaBoard(A,Ar,R)) A.grp.add(o);
  A.grp.add(A.decal=arenaDecal(A));
  A.voidWalls=false; A.flashAmb=0; A.tick=null; A.chasm=null;
  for(const o of arenaCave(A,Ar,R,boss)) A.grp.add(o);
  arenaProps(A,Ar,R,boss);
  if(A.voidWalls) A.grp.children.forEach(o=>{ if(o.isInstancedMesh||o.userData.caveFloor) o.visible=false; });
  // the area's light and air, as in its dungeon
  const glowC=new THREE.Color(Ar.glow);
  A.scene.background=new THREE.Color(Ar.fog).multiplyScalar(.3);
  A.scene.fog=new THREE.Fog(new THREE.Color(Ar.fog).multiplyScalar(.35),20,46);
  A.amb.color.set(0xffffff).lerp(glowC,.25); A.lamp.color.set(0xffd9a0).lerp(glowC,.3);
  A.scene.environment=lookEnv(A.renderer,Ar);
  A.scene.add(A.grp); arenaBakeAO(); xLitAll(A.grp); }

/* ---------------- each frame ---------------- */
const AR_C=new THREE.Color(), AR_G=new THREE.Color();
// the tiles' colours: their stone tinted by side and state; anything brighter than the side's own
// colour (a telegraph, fire, ice, a flash) also glows on the glow layer
function arenaTiles(list){ const A=AR; if(!A||!A.board) return; const ca=A.board.mesh.geometry.attributes.color, ga=A.board.glow.geometry.attributes.color;
  for(const {t,base,fill} of list){ AR_C.set(fill); AR_G.set(base);
    const r=Math.min(1.6,AR_C.r*2.6+.25), g=Math.min(1.6,AR_C.g*2.6+.25), b=Math.min(1.6,AR_C.b*2.6+.25);
    for(let v=t._v0;v<t._v1;v++) ca.setXYZ(v,r,g,b);
    const gr=Math.max(0,AR_C.r-AR_G.r)*1.4, gg=Math.max(0,AR_C.g-AR_G.g)*1.4, gb=Math.max(0,AR_C.b-AR_G.b)*1.4;
    for(let v=t._g0;v<t._g0+18;v++) ga.setXYZ(v,gr,gg,gb); }
  ca.needsUpdate=true; ga.needsUpdate=true; }

// the lights, set from the shared settings (as in the dungeon) and the area's flicker
function arenaLights(T,dt){ const A=AR, p=B&&B.player; if(!A) return; const FL=XLIT.flick;
  A.amb.intensity=.2*XLIT.amb*1.35; A.sun.intensity=.22*XLIT.sun*1.4;
  if(p&&p.tile){ const [wx,wz]=posOf(p); A.lamp.position.copy(arW(wx,XLIT.lampY,wz)); }
  A.lamp.intensity=1.6*XLIT.lamp*(.95+FL*(.04*Math.sin(T*9.3)+.03*Math.sin(T*21.1))); A.lamp.distance=16*XLIT.lampRad;
  const d=A.cam.position.distanceTo(A.base.look), off=Math.max(0,d-19);
  const deep=(areaFloor(A.depth||1)-1)*2.5;   // each floor deeper in the area, the haze closes in a little
  if(A.scene.fog){ A.scene.fog.near=XLIT.fogNear+off-deep; A.scene.fog.far=Math.max(XLIT.fogNear+1,XLIT.fogFar)+off-deep*1.5; }
  A.amb.intensity+=(A.flashAmb||0)*.8; if(A.tick) A.tick(T,dt||1/60); arChasmTick(T,dt||1/60); }

function arenaDraw(dt,T){ const A=AR; if(!A||!A.grp||!A.w) return;
  // keep the 3D canvas exactly under the flat one (the HUD around it can change size without a resize)
  { const cv=View.canvas, g=A.renderer.domElement, k=cv.offsetLeft+','+cv.offsetTop+','+cv.offsetWidth+','+cv.offsetHeight;
    if(A.box!==k){ A.box=k; g.style.left=cv.offsetLeft+'px'; g.style.top=cv.offsetTop+'px'; g.style.width=cv.offsetWidth+'px'; g.style.height=cv.offsetHeight+'px'; } }
  const q=lookQuality(dt), pr=lookPR(); AR_Q.lights=q.lights; if(A.renderer.getPixelRatio()!==pr) A.renderer.setPixelRatio(pr);
  const s=A.renderer.getSize(new THREE.Vector2()); if(s.x!==A.w||s.y!==A.h) A.renderer.setSize(A.w,A.h,false);
  arenaLights(T,dt); arenaSpellLights(T); if(DEC.tex) DEC.tex.needsUpdate=true;
  const a=A.ao; lookUse(A.aoTex,a&&a.scale,a&&a.ox,a&&a.oz);
  xRender({renderer:A.renderer,scene:A.scene,cam:A.cam,unit:A.unit}); lookFps(dt,A.renderer); }

/* The camera: its base view, plus the moves of the moment:
   - a fly-in over the arena as the fight opens (1.2 s, from high behind the enemy; a tap skips it)
   - a slow drift (up to 6% of the board's width) toward whoever is winding up a cast
   - a swing (up to 4 degrees) and a shake when a boss attacks, and the shake of any heavy hit
   - a punch in (6%) on a crit or a kill
   While your finger is down on the board, every move eases back to the base view within .15 s
   and holds there, so the board never moves under your aim. */
const AR_FLY=1.2;
function arFocus(){ const b=B; if(!b) return null;
  const boss=(b.enemies||[]).find(e=>e.def&&e.def.bossId&&e.hp>0&&(e.windT>0||e.casting)); if(boss) return {u:boss,boss:true};
  const e=(b.enemies||[]).find(e=>e.hp>0&&(e.windT>0||e.casting)); if(e) return {u:e};
  const p=b.player; if(p&&(p.charging||(b.time-(p.poseT??-9))<.4)) return {u:p};
  return null; }
function arenaCamera(dt,T){ const A=AR; if(!A) return; const c=A.cam, S=A.shot, held=A.hold>0, k=1-Math.exp(-dt*(held?30:4));
  if(A.key!==S.key){ S.key=A.key; S.fly=0; S.drift.set(0,0,0); S.swing=0; S.punch=0; }
  S.fly=Math.min(1,S.fly+dt/AR_FLY); if(held) S.fly=1;
  // what the moment asks for
  const f=held?null:arFocus(), tgt=new THREE.Vector3(), b=B;
  if(f){ const [wx,wz]=posOf(f.u); tgt.copy(arW(wx,0,wz)).sub(A.base.look).multiplyScalar(.06); tgt.y=0; }
  S.drift.lerp(tgt,held?k:k*.6);
  S.swing+=((f&&f.boss&&!held?Math.sin(T*1.3)*4:0)-S.swing)*(held?k:k*.5);
  if(b&&!held) for(const fl of b.floaters||[]) if(fl.big&&fl.t<.05&&!fl._pun){ fl._pun=1; S.punch=1; }
  S.punch=held?0:Math.max(0,S.punch-dt/.4);
  // the base view, turned by the swing about the aim point, pulled in by the punch, slid by the drift
  const look=A.base.look.clone().add(S.drift), off=A.base.pos.clone().sub(A.base.look);
  off.applyAxisAngle(new THREE.Vector3(0,1,0),S.swing*Math.PI/180); off.multiplyScalar(1/XLIT.camZoom);   // the debug menu's zoom
  const pk=Math.sin(Math.min(1,S.punch)*Math.PI); off.multiplyScalar(1-.06*pk);
  // the fly-in: from high above and behind the enemy, easing into the base view
  if(S.fly<1){ const e=1-Math.pow(1-S.fly,3); off.lerpVectors(new THREE.Vector3(0,A.dist*.9,-A.dist*.55),off.clone(),e); }
  c.position.copy(look).add(off); c.lookAt(look);
  const sh=held?0:(View.shake||0)*.025+(f&&f.boss?.02:0);
  if(sh>.005){ c.position.x+=(Math.random()-.5)*sh; c.position.y+=(Math.random()-.5)*sh; }
  c.updateMatrixWorld(); }
// a finger on the board holds the camera still (and skips the fly-in)
function arHoldBind(){ const bd=document.getElementById('board'); if(!bd) return; const down=new Set();
  bd.addEventListener('pointerdown',e=>{ down.add(e.pointerId); if(AR) AR.hold=down.size; },true);
  const up=e=>{ down.delete(e.pointerId); if(AR) AR.hold=down.size; };
  bd.addEventListener('pointerup',up,true); bd.addEventListener('pointercancel',up,true); }
if(typeof document!=='undefined'){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',arHoldBind); else arHoldBind(); }

/* ---------------- units ----------------
   A unit is its pixel sprite on a quad that always faces the camera, standing on its tile (feet at
   the sprite's bottom art row). The quad is lit: it shows its own colours at most of their strength,
   and the lights around it (your lamp, the area's lights, spells) add to that, so a fireball going
   past lights up the monsters. A soft round shadow sits under it. A second quad just in front shows
   the white flash when hit, or a frozen or stunned tint. Each picture's texture is made once. */
const AR_TEX=new WeakMap();
function arPic(img,flip){ let p=AR_TEX.get(img); if(!p){ const a=xTex(img,true), b=xTex(img,true); b.repeat.x=-1; b.offset.x=1; p=[a,b]; AR_TEX.set(img,p); } return p[flip?1:0]; }
let AR_SHADOW=null;
function arShadowTex(){ if(AR_SHADOW) return AR_SHADOW; const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(0,0,0,.6)'); g.addColorStop(.6,'rgba(0,0,0,.3)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return AR_SHADOW=new THREE.CanvasTexture(c); }
function arenaUnit(u,spr,o){ const A=AR; if(!A||!A.grp) return; let U=A.units.get(u);
  if(!U){ const geo=A.uGeo||(A.uGeo=new THREE.PlaneGeometry(1,1).translate(0,.5-1/32,0));
    const body=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:0x8c8c8c,alphaTest:.35,emissive:0xffffff,emissiveIntensity:.62,side:THREE.DoubleSide}));
    const over=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false})); over.position.z=.02; over.renderOrder=6; body.add(over);
    const shadow=new THREE.Mesh(A.sGeo||(A.sGeo=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2)),new THREE.MeshBasicMaterial({map:arShadowTex(),transparent:true,depthWrite:false,fog:false}));
    shadow.renderOrder=4; const g=new THREE.Group(); g.add(body,shadow); A.grp.add(g); U={g,body,over,shadow}; A.units.set(u,U); }
  U.seen=A.frameN; U.g.visible=true;
  const [wx,wz]=posOf(u); U.g.position.copy(arW(wx,0,wz));
  const tex=arPic(spr.img,o.flip), m=U.body.material; if(m.map!==tex){ m.map=tex; m.emissiveMap=tex; m.needsUpdate=true; }
  const a=o.alpha==null?1:o.alpha, tr=a<.999; if(m.transparent!==tr){ m.transparent=tr; m.needsUpdate=true; } m.opacity=a; m.depthWrite=!tr;
  U.body.scale.set(o.h,o.h,1); U.body.position.y=o.lift||0; U.body.quaternion.copy(A.cam.quaternion);
  // the flash (white) or the tint over the body
  const om=U.over.material; let ot=null, oa=0;
  if(o.flash>0){ ot=arPic(spr.wht,o.flip); oa=Math.min(1,o.flash)*a; } else if(o.tint){ ot=arPic(tinted(spr.img,o.tint),o.flip); oa=.45*a; }
  U.over.visible=!!ot; if(ot&&om.map!==ot){ om.map=ot; om.needsUpdate=true; } om.opacity=oa;
  U.shadow.scale.set(o.shadow,1,o.shadow); U.shadow.position.y=.035; U.shadow.material.opacity=a; }
// rocks and card walls: lit blocks standing on their tiles, in the area's stone or the card's colour
function arenaBlock(u,kind,col){ const A=AR; if(!A||!A.grp) return; let U=A.units.get(u);
  if(!U){ let mesh; const wall=kind==='wall';
    const geo=new THREE.CylinderGeometry(wall?.62:.7,wall?.66:.74,wall?.9:.75,6,1,false,Math.PI/6); geo.translate(0,(wall?.9:.75)/2,0);
    if(wall) mesh=new THREE.Mesh(geo,arMat(xPhong({color:new THREE.Color(col).lerp(new THREE.Color('#ffffff'),.1),emissive:new THREE.Color(col).multiplyScalar(.25)})));
    else { const t=A.rockTex||(A.rockTex=arTex(xTex(xRockWall(A.area.stone||AREAS[0].stone,(A.area.index||0)*7+2),true))); mesh=new THREE.Mesh(geo,arMat(xLitTag(xPhong({map:t,color:0xc8d0d8}),2,t.image))); xLit(mesh.material); }
    A.grp.add(mesh); U={g:mesh,block:true}; A.units.set(u,U); }
  U.seen=A.frameN; U.g.visible=true; U.g.position.copy(arW(u.tile.wx,0,u.tile.wz));
  if(kind==='rock'&&U.g.material.emissive) U.g.material.emissive.set(col?0x303840:0x000000); }
// a unit not drawn this frame (gone, or under the ground) is hidden; one gone for good is let go
function arenaUnitsEnd(){ const A=AR; if(!A||!A.units) return;
  for(const [u,U] of A.units) if(U.seen!==A.frameN){ U.g.visible=false;
    if(U.seen<A.frameN-120){ A.grp.remove(U.g); U.g.traverse(o=>{ if(o.material&&!U.block) o.material.dispose(); if(U.block&&o.geometry) o.geometry.dispose(); }); A.units.delete(u); } }
  A.frameN=(A.frameN||0)+1; }

/* ---------------- spell lights ----------------
   A small pool of real lights (4, plus 1 kept for the boss) goes to the biggest moments of the
   frame: card shots and big shots in flight, lobs, beams, bolts and rings, tiles flashing from a
   hit, and a boss winding up. Each throws its colour on the stone, the walls and the units around
   it for a moment. Small sparks and particles only glow (they stay on the flat canvas). */
const AR_SPELL_N=4;
let AR_Q={lights:AR_SPELL_N};   // how many spell lights auto quality allows (look.js)
function arSpellPool(A){ if(A.spell) return A.spell; A.spell=[]; for(let k=0;k<AR_SPELL_N+1;k++){ const L=new THREE.PointLight(0xffffff,0,6,1.6); L.position.set(0,-50,0); A.scene.add(L); A.spell.push(L); } return A.spell; }
function arenaSpellLights(T){ const A=AR, b=B; if(!A||!b) return; const pool=arSpellPool(A), want=[];
  const add=(wx,y,wz,col,k,r)=>{ if(k>.04&&col) want.push({wx,y,wz,col,k,r:r||5}); };
  for(const s of b.shots||[]){ if(!(s.card||s.big)) continue; const from=s.i<0?s.a:s.tiles[s.i], to=s.tiles[s.i+1]||from; if(!from) continue; const k=Math.max(0,Math.min(1,s.stepT/s.speed));
    add(from.wx+(to.wx-from.wx)*k,1,from.wz+(to.wz-from.wz)*k,s.card?colorOf(s.card):s.color||'#e6f4ff',s.big?2.6:1.9,s.big?6:5); }
  for(const l of b.lobs||[]){ const k=l.t/l.dur; add(l.a.wx+(l.b.wx-l.a.wx)*k,1+Math.sin(k*Math.PI)*3,l.a.wz+(l.b.wz-l.a.wz)*k,colorOf(l.card),1.8,5.5); }
  for(const f of b.fx||[]){ if(!['beam','bolt','ring','arc'].includes(f.kind)) continue; const e=(f.b||f.a), al=1-f.t/f.life;
    add((f.a.wx+e.wx)/2,1,(f.a.wz+e.wz)/2,f.color,(f.kind==='ring'?2.2:3.6)*al,f.kind==='ring'?4:8); }
  for(const t of TILES) if(t.flash>.3&&t.flashC&&t.flashC[0]==='#') add(t.wx,.9,t.wz,t.flashC.length===7?t.flashC:'#ffffff',t.flash*2.4,4.5);
  want.sort((a,c)=>c.k-a.k);
  // the boss's light: red while it winds up an attack or casts
  const boss=(b.enemies||[]).find(e=>e.def&&e.def.bossId&&e.hp>0); const bl=pool[AR_SPELL_N];
  if(boss&&(boss.windT>0||boss.casting)){ const [wx,wz]=posOf(boss); bl.position.copy(arW(wx,1.6,wz)); bl.color.set(boss.casting?COLORS[boss.casting.color].c:'#ff4a3a'); bl.distance=8; bl.intensity=2.2*(.8+.2*Math.sin(T*20)); }
  else bl.intensity=Math.max(0,bl.intensity-.15);
  const n=Math.min(AR_SPELL_N,AR_Q.lights);
  for(let i=0;i<AR_SPELL_N;i++){ const L=pool[i], w=i<n?want[i]:null;
    if(w){ L.position.copy(arW(w.wx,w.y,w.wz)); L.color.set(w.col); L.distance=w.r; L.intensity=Math.min(4,w.k); } else L.intensity=0; } }

/* ---------------- the area's arena ----------------
   Each area dresses its cave from its dungeon look (world.js), with its own moving parts and two
   or three lights of its own (on a boss floor, all three and a set piece behind the enemy):
     Glowworm Hollows  crystal grotto: green crystals on the walls that pulse, glowworm motes drifting
     Frozen Deeps      ice cavern: icicles along the walls, snow falling, a cold rim light
     Storm Vault       ruined vault: broken pillars, storm-stones, lightning that lights everything
     Ember Rifts       lava rift: lava channels beside the board, embers rising, warm flicker
     Gilded Ruins      gilded hall: braziers, fallen statues, motes in shafts of light
     The Abyss         starfield void: floating rocks over the dark, stars wheeling, ghost lights
   Floors 1 to 3 shuffle the layout, how many lights there are and how warm; the haze thickens. */
const AR_PROP_N=3;
function arPropLights(A){ if(A.plights) return A.plights; A.plights=[]; for(let k=0;k<AR_PROP_N;k++){ const L=new THREE.PointLight(0xffffff,0,12,1.4); L.position.set(0,-50,0); A.scene.add(L); A.plights.push(L); } return A.plights; }
const arGlow=(col,k,o)=>arMat(xPhong(Object.assign({color:new THREE.Color(col).multiplyScalar(.6),emissive:new THREE.Color(col).multiplyScalar(k==null?.6:k),shininess:30,specular:0x333333},o||{})));
function arPut(A,geo,mat,wx,y,wz,ry,s){ const m=new THREE.Mesh(geo,mat); m.position.copy(arW(wx,y,wz)); if(ry) m.rotation.y=ry; if(s!=null) (typeof s==='number'?m.scale.setScalar(s):m.scale.set(...s)); A.props.add(m); return m; }
// a cluster of crystal spikes (octahedra stretched up), leaning out from a point
function arCrystals(A,R,wx,wz,col,n,big){ const mat=arGlow(col,.7,{transparent:true,opacity:.92,pbr:'gloss'}), out=[];
  for(let k=0;k<n;k++){ const g=new THREE.OctahedronGeometry(.25,0); g.scale(1,3.2,1); const s=(big?1.8:1)*(.6+R()*.8);
    const m=arPut(A,g,mat,wx+(R()-.5)*.6*s,.6*s,wz+(R()-.5)*.6*s,R()*3,s); m.rotation.z=(R()-.5)*.7; m.rotation.x=(R()-.5)*.7; out.push(m); }
  return {mat,out}; }
// a particle cloud over the arena: drifting motes, falling snow, rising embers or still stars
function arCloud(A,n,col,size,box,mode,R){ const pos=new Float32Array(n*3), sp=new Float32Array(n);
  for(let k=0;k<n;k++){ pos[k*3]=box[0]+R()*(box[1]-box[0]); pos[k*3+1]=box[2]+R()*(box[3]-box[2]); pos[k*3+2]=box[4]+R()*(box[5]-box[4]); sp[k]=.4+R(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(g,arMat(new THREE.PointsMaterial({color:col,size,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,fog:mode!=='stars'})));
  p.renderOrder=5; A.props.add(p); return {p,pos,sp,box,mode}; }
function arCloudTick(c,T,dt){ const a=c.pos, b=c.box;
  for(let k=0;k<c.sp.length;k++){ const i=k*3, v=c.sp[k];
    if(c.mode==='snow'){ a[i+1]-=dt*.8*v; a[i]+=Math.sin(T*.7+k)*dt*.25; if(a[i+1]<b[2]) a[i+1]=b[3]; }
    else if(c.mode==='embers'){ a[i+1]+=dt*1.1*v; a[i]+=Math.sin(T*1.3+k)*dt*.3; if(a[i+1]>b[3]){ a[i+1]=b[2]; } }
    else if(c.mode==='motes'){ a[i]+=Math.sin(T*.4+k*1.7)*dt*.35; a[i+1]+=Math.cos(T*.5+k)*dt*.18; a[i+2]+=Math.cos(T*.3+k*2.3)*dt*.35; } }
  c.p.geometry.attributes.position.needsUpdate=true; if(c.mode==='stars') c.p.rotation.y=T*.01; }
// a lava texture: dark crust with glowing veins (it scrolls, so the lava flows)
function arLavaTex(R){ const N=64, f=xFbm(N,R,4), c=xPaint(N,(i,j)=>{ const v=f(i,j), k=Math.abs(v-.5); return k<.05?[255,210,90]:k<.1?[255,120,30]:k<.16?[150,40,10]:[40,12,8]; }); const t=xTex(c,true); return arTex(t); }

const ARENA_LOOK={
  hollows:{ build(A,R,Ar,boss,m){ const L=A.plights, s=[];
      for(let k=0;k<(boss?6:3+(R()*3|0));k++){ const sd=R()<.5?-1:1, wx=m.near+3+R()*(m.back-m.near-4); s.push(arCrystals(A,R,wx,sd*(m.side-.4),Ar.glow,3+(R()*3|0))); }
      for(let k=0;k<3;k++) s.push(arCrystals(A,R,m.back-.6,(R()*2-1)*(m.side-1),Ar.glow,3));
      if(boss){ s.push(arCrystals(A,R,m.dais,0,'#9affc8',9,true)); }
      const cl=arCloud(A,60,Ar.glow,.12,[-m.side,m.side,.3,3.4,-m.back,-m.near],'motes',R);
      L[0].position.copy(arW(m.back-1,2.4,-m.side*.6)); L[1].position.copy(arW(m.back-1,2.4,m.side*.6)); L[2].position.copy(arW(m.dais||0,3,0));
      L.forEach(l=>{ l.color.set(Ar.glow); l.distance=14; });
      return (T,dt)=>{ const p=.75+.25*Math.sin(T*1.6); s.forEach((c,i)=>c.mat.emissive.set(Ar.glow).multiplyScalar(.45+.3*Math.sin(T*1.6+i)));
        L[0].intensity=1.1*p; L[1].intensity=1.1*(1.5-p); L[2].intensity=boss?1.6*p:0; arCloudTick(cl,T,dt); }; } },
  deeps:{ build(A,R,Ar,boss,m){ const L=A.plights, ice=arGlow('#bfeaff',.25,{transparent:true,opacity:.85,shininess:80,pbr:'ice'});
      for(let k=0;k<(boss?40:24);k++){ const sd=R()<.5?-1:1, along=R(); const wx=m.near+2+along*(m.back-m.near-2), wz=sd*(m.side-.3+R()*.3);
        const g=new THREE.ConeGeometry(.12+R()*.12,.8+R()*1.6,5); g.rotateX(Math.PI); arPut(A,g,ice,wx,3.2+R()*1.2,wz); }
      for(let k=0;k<12;k++){ const g=new THREE.ConeGeometry(.15+R()*.1,1+R()*1.4,5); g.rotateX(Math.PI); arPut(A,g,ice,m.back-.4,4+R(),(R()*2-1)*m.side); }
      let falls=null; if(boss){ falls=arGlow('#e6f6ff',.4,{transparent:true,opacity:.7,shininess:90,pbr:'ice'}); for(let k=0;k<7;k++){ const h=4+R()*3; arPut(A,new THREE.BoxGeometry(.9,h,.5),falls,m.dais+1.2,h/2-.35,(k-3)*1.3); } }
      const sn=arCloud(A,140,'#eef8ff',.09,[-m.side,m.side,0,6,-m.back,-m.near],'snow',R);
      L[0].position.copy(arW(m.near+3,4,-m.side)); L[1].position.copy(arW(m.back-1,3,m.side*.5)); L[2].position.copy(arW(m.dais||0,3,0));
      L.forEach(l=>{ l.color.set('#9fd8ff'); l.distance=16; });
      return (T,dt)=>{ L[0].intensity=.9; L[1].intensity=.8+.15*Math.sin(T*.8); L[2].intensity=boss?1.4+.3*Math.sin(T*2):0;
        ice.emissive.set('#bfeaff').multiplyScalar(.2+.08*Math.sin(T*1.2)); if(falls) falls.emissive.set('#e6f6ff').multiplyScalar(.35+.15*Math.sin(T*2.4)); arCloudTick(sn,T,dt); }; } },
  vault:{ build(A,R,Ar,boss,m){ const L=A.plights, st=arMat(xPhong({color:0x5a5878})), glow=arGlow(Ar.glow,.8,{pbr:'gloss'});
      const tex=A.rockTex||(A.rockTex=arTex(xTex(xBlockWall(Ar.stone,(Ar.index||0)*7+2,false),true))), pil=arMat(xLitTag(xPhong({map:tex}),2,tex.image));
      for(let k=0;k<(boss?6:4);k++){ const sd=k%2?1:-1, wx=m.near+3+(k>>1)*((m.back-m.near-4)/2.5), h=1.5+R()*2.5; arPut(A,new THREE.CylinderGeometry(.45,.5,h,8),pil,wx,h/2-SLAB,sd*(m.side-.6)); }
      const stones=[]; for(let k=0;k<4;k++){ const sd=k%2?1:-1; stones.push(arPut(A,new THREE.OctahedronGeometry(.35,0),glow,m.near+5+k*3,2.4,sd*(m.side-.7))); }
      if(boss){ A.scene.background=new THREE.Color('#2a2650'); }
      const cl=arCloud(A,50,'#fff39a',.08,[-m.side,m.side,.3,3.4,-m.back,-m.near],'motes',R);
      L.forEach((l,i)=>{ l.color.set(Ar.glow); l.distance=18; l.position.copy(arW(i===2?(m.dais||m.back-2):m.near+4+i*6,5,(i-1)*m.side*.4)); });
      let flash=0, next=1+R()*3;
      return (T,dt)=>{ next-=dt; if(next<=0){ flash=1; next=(boss?1.2:2.5)+Math.random()*4; } flash=Math.max(0,flash-dt*7);
        const k=flash>0?(Math.random()<.6?flash:flash*.3):0;
        L[0].intensity=.5+3*k; L[1].intensity=.4+2.4*k; L[2].intensity=(boss?.8:0)+3*k; A.flashAmb=k;
        stones.forEach((s,i)=>{ s.rotation.y=T*(.6+i*.1); s.position.y=2.4+Math.sin(T*1.4+i)*.15; }); glow.emissive.set(Ar.glow).multiplyScalar(.5+.5*k+.2*Math.sin(T*3)); arCloudTick(cl,T,dt); }; } },
  rifts:{ build(A,R,Ar,boss,m){ const L=A.plights, lt=arLavaTex(R), lava=arMat(new THREE.MeshBasicMaterial({map:lt,fog:true})); lt.repeat.set(1,6);
      const len=m.back-m.near; for(const sd of [-1,1]){ const p=arPut(A,new THREE.PlaneGeometry(1.4,len),lava,(m.back+m.near)/2,-SLAB+.03,sd*(m.side-1.1)); p.rotation.x=-Math.PI/2; }
      if(boss){ const lk=arPut(A,new THREE.PlaneGeometry(2*m.side,5),lava,m.dais+1.5,-SLAB+.04,0); lk.rotation.x=-Math.PI/2; }
      const bas=arMat(xPhong({color:0x2a1a14})); for(let k=0;k<10;k++){ const s=.4+R()*.7; arPut(A,new THREE.DodecahedronGeometry(s,0),bas,m.near+R()*len,s*.3-SLAB,(R()<.5?-1:1)*(m.side-R()*.6)); }
      const em=arCloud(A,90,'#ffb25a',.1,[-m.side,m.side,-SLAB,5,-m.back,-m.near],'embers',R);
      L[0].position.copy(arW(m.near+len*.3,.6,-(m.side-1.1))); L[1].position.copy(arW(m.near+len*.7,.6,m.side-1.1)); L[2].position.copy(arW(m.dais||0,1,0));
      L.forEach(l=>{ l.color.set('#ff7a2a'); l.distance=10; });
      return (T,dt)=>{ lt.offset.y=-T*.05; const f=XLIT.flick; L[0].intensity=1.5*(.85+f*.15*Math.sin(T*7.3)); L[1].intensity=1.5*(.85+f*.15*Math.sin(T*6.1+1)); L[2].intensity=boss?2*(.85+f*.15*Math.sin(T*5)):0; arCloudTick(em,T,dt); }; } },
  ruins:{ build(A,R,Ar,boss,m){ const L=A.plights, gold=arGlow(Ar.glow,.35,{shininess:60,specular:0x886622,pbr:'gold'}), stone=arMat(xPhong({color:0x8a8478}));
      const flames=[]; const spots=[[m.near+4,-(m.side-.8)],[m.near+4,m.side-.8],[m.back-2,-(m.side-.8)]];
      spots.forEach(([wx,wz],i)=>{ arPut(A,new THREE.CylinderGeometry(.3,.38,1.2,8),gold,wx,.6-SLAB,wz); const f=arPut(A,new THREE.ConeGeometry(.22,.6,6),arGlow('#ffcf6a',1.4),wx,1.6-SLAB,wz); flames.push(f);
        L[i].position.copy(arW(wx,1.9,wz)); L[i].color.set('#ffc060'); L[i].distance=11; });
      for(let k=0;k<3;k++){ const g=new THREE.BoxGeometry(.7,2.2,.7); const s=arPut(A,g,stone,m.near+5+R()*(m.back-m.near-8),.2,(R()<.5?-1:1)*(m.side-.9)); s.rotation.z=Math.PI/2*.92; }
      if(boss){ const vine=arMat(xPhong({color:0x3f7a3a})); for(let k=0;k<8;k++){ const h=3+R()*2; arPut(A,new THREE.CylinderGeometry(.3,.4,h,8),gold,m.dais+1,h/2-SLAB,(k-3.5)*1.4); arPut(A,new THREE.CylinderGeometry(.08,.08,h,5),vine,m.dais+.6,h/2-SLAB,(k-3.5)*1.4+.3); } }
      const sh=arMat(new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      for(let k=0;k<3;k++){ const p=arPut(A,new THREE.PlaneGeometry(1.6,9),sh,m.near+5+k*4,3,(k-1)*2.5); p.rotation.z=.35; }
      const cl=arCloud(A,70,'#fff3b0',.07,[-m.side,m.side,.3,4,-m.back,-m.near],'motes',R);
      return (T,dt)=>{ const fl=XLIT.flick; flames.forEach((f,i)=>{ f.scale.set(1,.85+fl*.25*Math.sin(T*11+i*2),1); L[i].intensity=1.4*(.85+fl*(.1*Math.sin(T*11+i)+.07*Math.sin(T*23.7+i*3))); }); arCloudTick(cl,T,dt); }; } },
  abyss:{ build(A,R,Ar,boss,m){ const L=A.plights, rock=arMat(xPhong({color:0x2a3040})), isl=[];
      A.voidWalls=true;   // no cave walls here: the board floats in the dark
      for(let k=0;k<(boss?14:9);k++){ const s=.4+R()*1.1, ang=R()*6.28, r=m.side+2+R()*6; isl.push({m:arPut(A,new THREE.DodecahedronGeometry(s,0),rock,(R()*2-1)*(m.back-2),-1-R()*3,Math.cos(ang)*r),y:-1-R()*3,ph:R()*6}); }
      const stars=arCloud(A,260,'#e9fbff',.14,[-40,40,-30,-4,-60,10],'stars',R);
      const ghosts=arCloud(A,24,'#9fe8ff',.2,[-m.side,m.side,.5,3,-m.back,-m.near],'motes',R);
      L.forEach((l,i)=>{ l.color.set(i===2?'#c9b6ff':'#e9fbff'); l.distance=14; l.position.copy(arW(i===2?(m.dais||0):m.near+5+i*8,3,(i-.5)*m.side*.8)); });
      return (T,dt)=>{ isl.forEach((o,i)=>{ o.m.position.y=o.y+Math.sin(T*.5+o.ph)*.3; o.m.rotation.y=T*.1+o.ph; }); L[0].intensity=.7+.3*Math.sin(T*.9); L[1].intensity=.6+.3*Math.sin(T*1.1+2); L[2].intensity=boss?1.4+.4*Math.sin(T*1.7):0;
        arCloudTick(stars,T,dt); arCloudTick(ghosts,T,dt); }; } },
};
// the boss floor's dais: a raised hex platform behind the enemy half, where the boss holds court
function arDais(A,Ar,m){ const t=A.rockTex||(A.rockTex=arTex(xTex(xRockWall(Ar.stone,(Ar.index||0)*7+2),true))), mat=arMat(xLitTag(xPhong({map:t}),2,t.image));
  const g=new THREE.CylinderGeometry(3.2,3.6,.9,6,1,false,Math.PI/6); arPut(A,g,mat,m.dais,.45-SLAB,0); }
function arenaProps(A,Ar,R,boss){ const m=Object.assign({},A.room); if(boss) m.dais=m.back-3.4;
  A.props=new THREE.Group(); A.grp.add(A.props); arPropLights(A).forEach(l=>{ l.intensity=0; });
  if(boss) arDais(A,Ar,m);
  const L=ARENA_LOOK[Ar.id]||ARENA_LOOK.hollows; A.tick=L.build(A,R,Ar,boss,m)||null; }

/* The dungeon's chasm under the arena: the same deep (xChasmTex) far below, a slow fog drifting over
   it and dust rising out of it, in the area's light. Seen past the island's edge, and over the
   walls' tops when there are walls. */
function arChasm(A,Ar,S){ const out=[], t=arTex(xTex(xChasmTex(Ar,S,(Ar.index||0)*29+11),true)); t.repeat.set(6,6);
  const deep=new THREE.Mesh(new THREE.PlaneGeometry(160,160),arMat(new THREE.MeshBasicMaterial({map:t,fog:false}))); deep.rotation.x=-Math.PI/2; deep.position.set(0,-12,-8); out.push(deep);
  const N=128, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), R=caveRng((Ar.index||0)*5+9), f=xFbm(N,R,4), im=x.createImageData(N,N), fg=xHexRGB(Ar.glow);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const v=Math.max(0,f(i,j)-.5)*2.2, o=(j*N+i)*4; im.data[o]=fg[0]; im.data[o+1]=fg[1]; im.data[o+2]=fg[2]; im.data[o+3]=Math.round(Math.min(1,v)*120); }
  x.putImageData(im,0,0); const ft=arTex(xTex(c,true)); ft.magFilter=ft.minFilter=THREE.LinearFilter; ft.repeat.set(4,4);
  const fog=new THREE.Mesh(new THREE.PlaneGeometry(160,160),arMat(new THREE.MeshBasicMaterial({map:ft,transparent:true,opacity:.6,depthWrite:false,fog:false,blending:THREE.AdditiveBlending})));
  fog.rotation.x=-Math.PI/2; fog.position.set(0,-4,-8); out.push(fog);
  const M=200, pos=new Float32Array(M*3); for(let k=0;k<M;k++){ pos[k*3]=(Math.random()-.5)*60; pos[k*3+1]=-12+Math.random()*10; pos[k*3+2]=(Math.random()-.5)*60-8; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const rise=new THREE.Points(g,arMat(new THREE.PointsMaterial({color:new THREE.Color(Ar.glow).lerp(new THREE.Color(0xffffff),.3),size:.15,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})));
  out.push(rise); A.chasm={fog:ft,rise}; return out; }
function arChasmTick(T,dt){ const C=AR&&AR.chasm; if(!C) return; C.fog.offset.x=T*.006; C.fog.offset.y=T*.004;
  const a=C.rise.geometry.attributes.position.array; for(let k=0;k<a.length;k+=3){ a[k+1]+=dt*(.6+((k*7)%5)*.12); if(a[k+1]>-2) a[k+1]=-12; } C.rise.geometry.attributes.position.needsUpdate=true; }
