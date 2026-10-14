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
  AR={renderer,scene,cam,amb,sun,lamp,grp:null,key:null,w:0,h:0,unit:1.15,
    base:{pos:new THREE.Vector3(),look:new THREE.Vector3()},
    // the camera's moves on top of its base view (arenaCamera)
    shot:{t:0,fly:1,drift:new THREE.Vector3(),swing:0,punch:0,shake:0}};
  return AR; }

/* ---------------- fitting the camera to the board ----------------
   The dungeon's tilt (about 48 degrees down; 40 on a wide screen) and lens. The distance is the smallest that keeps
   every tile, and a unit's height above it, inside the canvas with a small margin; the aim point
   is slid along the board so it sits in the middle of the screen. */
function arenaFit(w,h){ const A=arenaInit(); A.w=w; A.h=h; A.cam.aspect=w/h; A.cam.updateProjectionMatrix();
  const portrait=h>w*1.05, mx=portrait?12:36, my=12, AR_PITCH=(portrait?48:40)*Math.PI/180;   // a wide screen looks in a little lower, so the long board fills more of it
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z0=Math.min(z0,t.wz); z1=Math.max(z1,t.wz); }
  const pts=[]; for(const t of TILES) if(t.wx<=x0+.1||t.wx>=x1-.1||t.wz<=z0+.1||t.wz>=z1-.1) for(const y of [0,2.2]) for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; pts.push([t.wx+Math.cos(a),y,t.wz+Math.sin(a)]); }
  pts.push([x0-1,-SLAB,0],[x1+1,-SLAB,0]);
  const v=new THREE.Vector3(), fit=(d,off)=>{ A.cam.position.set(0,Math.sin(AR_PITCH)*d,Math.cos(AR_PITCH)*d+off); A.cam.lookAt(0,0,off); A.cam.updateMatrixWorld(); A.cam.updateProjectionMatrix();
    let a=1e9,b=-1e9,c=1e9,e=-1e9; for(const [px,py,pz] of pts){ v.set(pz,py,-px).project(A.cam); if(v.z>1) return null; const sx=(v.x+1)/2*w, sy=(1-v.y)/2*h; a=Math.min(a,sx); b=Math.max(b,sx); c=Math.min(c,sy); e=Math.max(e,sy); }
    return [a,b,c,e]; };
  // slide the aim point until the board is centred top to bottom, then find the distance that fits
  let lo=6, hi=120, off=0;
  for(let it=0;it<28;it++){ const d=(lo+hi)/2; let r=fit(d,off);
    for(let k=0;k<6&&r;k++){ const mid=(r[2]+r[3])/2-h/2; off+=mid/h*d*.9; r=fit(d,off); }
    if(r&&r[0]>=mx&&r[1]<=w-mx&&r[2]>=my&&r[3]<=h-my) hi=d; else lo=d; }
  fit(hi,off); A.base.pos.copy(A.cam.position); A.base.look.set(0,0,off); A.dist=hi; }

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
  const m=arMat(xLitTag(xPhong({map:tex,vertexColors:true}),1,cvs)), mesh=new THREE.Mesh(g,m); mesh.renderOrder=0;
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
  // the floor: raw rock, sunk a slab below the tiles so the board stands up out of it
  const ft=arTex(xTex(xRockFloor(S,(Ar.index||0)*17+3),true)); ft.repeat.set((2*side+8)/8,(back-near+8)/8);
  const fm=arMat(xLitTag(xPhong({map:ft}),1,ft.image)), floor=new THREE.Mesh(new THREE.PlaneGeometry(2*side+8,back-near+8),fm);
  floor.rotation.x=-Math.PI/2; floor.position.set(0,-SLAB,-(back+near)/2); out.push(floor);
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
  for(const o of arenaCave(A,Ar,R,boss)) A.grp.add(o);
  // the area's light and air, as in its dungeon
  const glowC=new THREE.Color(Ar.glow);
  A.scene.background=new THREE.Color(Ar.fog).multiplyScalar(.3);
  A.scene.fog=new THREE.Fog(new THREE.Color(Ar.fog).multiplyScalar(.35),20,46);
  A.amb.color.set(0xffffff).lerp(glowC,.25); A.lamp.color.set(0xffd9a0).lerp(glowC,.3);
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
function arenaLights(T){ const A=AR, p=B&&B.player; if(!A) return; const FL=XLIT.flick;
  A.amb.intensity=.2*XLIT.amb*1.35; A.sun.intensity=.22*XLIT.sun*1.4;
  if(p&&p.tile){ const [wx,wz]=posOf(p); A.lamp.position.copy(arW(wx,XLIT.lampY,wz)); }
  A.lamp.intensity=1.6*XLIT.lamp*(.95+FL*(.04*Math.sin(T*9.3)+.03*Math.sin(T*21.1))); A.lamp.distance=16*XLIT.lampRad;
  const d=A.cam.position.distanceTo(A.base.look), off=Math.max(0,d-19);
  if(A.scene.fog){ A.scene.fog.near=XLIT.fogNear+off; A.scene.fog.far=Math.max(XLIT.fogNear+1,XLIT.fogFar)+off; } }

function arenaDraw(dt,T){ const A=AR; if(!A||!A.grp||!A.w) return;
  const pr=Math.min(window.devicePixelRatio||1,2); if(A.renderer.getPixelRatio()!==pr) A.renderer.setPixelRatio(pr);
  const s=A.renderer.getSize(new THREE.Vector2()); if(s.x!==A.w||s.y!==A.h) A.renderer.setSize(A.w,A.h,false);
  arenaLights(T); if(DEC.tex) DEC.tex.needsUpdate=true;
  const a=A.ao; lookUse(A.aoTex,a&&a.scale,a&&a.ox,a&&a.oz);
  xRender({renderer:A.renderer,scene:A.scene,cam:A.cam,unit:A.unit}); lookFps(dt,A.renderer); }

/* The camera: its base view, plus the moves of the moment (arenaShot) */
function arenaCamera(dt,T){ const A=AR; if(!A) return; const c=A.cam, sh=(View.shake||0)*.02;
  c.position.copy(A.base.pos); c.lookAt(A.base.look);
  if(sh>.005){ c.position.x+=(Math.random()-.5)*sh; c.position.y+=(Math.random()-.5)*sh; }
  c.updateMatrixWorld(); }
