/* Hexmancers - the battle arena's backdrops (docs/superpowers/specs/2026-11-16-arena-backdrops-design.md; the plan
   docs/superpowers/plans/2026-11-16-arena-backdrops.md). Each battle stands in one of three kinds of place, from its seed:
   a cave (a sculpted rock face round the board), an island (the board on floating rock over the chasm) or ruins (the
   island with ruins round it); a boss in its own battlefield. The rock is sculpted, not stacked: one continuous face,
   its texture laid in world space at its real size (never stretched), a second sample at another scale breaking up any
   repeat. Painted materials come from tools/build-arena-backdrops.py (envart.js envArtBackdrop); until they have come in
   the area's code-painted rock stands in. */

// ---- noise (value noise, smooth, from a seed) ----
function bdHash(x,y,s){ let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2147483647); h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function bdNoise(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=bdHash(xi,yi,s), b=bdHash(xi+1,yi,s), c=bdHash(xi,yi+1,s), d=bdHash(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
const bdFbm=(x,y,s,o=3)=>{ let t=0, w=.5, f=1, n=0; for(let k=0;k<o;k++){ t+=w*bdNoise(x*f,y*f,s+k*17); n+=w; w*=.5; f*=2.03; } return t/n; };

// ---- which kind of place (Task 1) ----
const BD_WEIGHTS={ cave:.35, island:.35, ruins:.30 };
function arBdKind(A,R,boss){ if(boss) return 'boss'; const r=R(); if(typeof window!=='undefined'&&window.__bdForce) return window.__bdForce;   // (a check or a picture can ask for a kind)
  let k=r<BD_WEIGHTS.cave?'cave':r<BD_WEIGHTS.cave+BD_WEIGHTS.island?'island':'ruins';
  if(k==='cave'&&!XLIT.arWalls) k='island'; return k; }

// ---- materials ----
/* A backdrop material: kind 'rock' (the area's natural rock), 'stone' (its dressed stone, for ruins) or 'special' (its
   set-piece material; a boss's battlefield material with id 'boss-<id>'). The painted PBR set when it has come in, laid
   in world space (the geometry's uv is world units / 4), with a second sample at 2.7 times the scale blended in by a
   broad noise so no stretch repeats; else the code-painted stand-in. */
function arBdRockMat(Ar,kind,id){ kind=kind||'rock'; const S=typeof envArtBackdrop==='function'?envArtBackdrop(id||Ar.id):null, set=S&&S[kind];
  if(!set){ const st=Ar.stone||AREAS[0].stone, cv=kind==='stone'?xBlockWall(st,(Ar.index||0)*7+2,false):xRockWall(st,(Ar.index||0)*13+1), t=arTex(xTex(cv,true));
    const m=xLitTag(xPhong({map:t}),2,cv); m.userData.xmold=2; m.userData.bdStandIn=1; return arMat(m); }
  const tx=(img,data)=>{ const t=arTex(new THREE.Texture(img)); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.anisotropy=4; t.needsUpdate=true; return t; };
  const M=tx(set.m), m=new THREE.MeshStandardMaterial({map:tx(set.map), normalMap:tx(set.n), aoMap:M, roughnessMap:M, roughness:1, metalness:0, color:new THREE.Color().setScalar(BD_BASE)});
  if(set.e){ m.emissiveMap=tx(set.e); m.emissive=new THREE.Color(BD_GLOW[id||Ar.id]||Ar.glow||'#ffffff'); m.emissiveIntensity=.9; }
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
  vec4 bdA=texture2D(map,vUv), bdB=texture2D(map,vUv*.37+vec2(.31,.67));   // (the second sample: 2.7 times as big, elsewhere in the painting)
  vec2 bq=floor(vUv*.35), bf=fract(vUv*.35); bf=bf*bf*(3.-2.*bf);
  float h00=fract(sin(dot(bq,vec2(127.1,311.7)))*43758.5), h10=fract(sin(dot(bq+vec2(1,0),vec2(127.1,311.7)))*43758.5), h01=fract(sin(dot(bq+vec2(0,1),vec2(127.1,311.7)))*43758.5), h11=fract(sin(dot(bq+vec2(1,1),vec2(127.1,311.7)))*43758.5);
  float bw=smoothstep(.35,.65,mix(mix(h00,h10,bf.x),mix(h01,h11,bf.x),bf.y));
  vec4 texelColor=mix(bdA,bdB,bw*.6); texelColor=mapTexelToLinear(texelColor); diffuseColor*=texelColor;
#endif`); };
  m.customProgramCacheKey=()=>'bdmat'; m.userData.xmold=2; m.userData.noProj=1; return arMat(m); }
const BD_BASE=.55;   // the painted rock's brightness under the arena's lights (the hex floor's plain stone is .6)
const BD_GLOW={ hollows:'#8dffb0', vault:'#b48cff', rifts:'#ff7a2a', abyss:'#5ad8ff', 'boss-golem':'#ffffff', 'boss-glacier':'#9fdcff', 'boss-wyrm':'#ff6a1a', 'boss-treant':'#c8ff6a', 'boss-hollow':'#5ad8ff' };

// ---- the cave's rock face (Task 1) ----
/* One continuous horseshoe of sculpted rock round the board: up the left side from near you, across the back, down the
   right; tall at the back with two or three crags, stepping down along the sides toward you, open at the front. Its
   cross-section is a face (toward the board), a broken top, and a short back slope. Displaced by three octaves of noise:
   buttresses, ledges, chips. uv = world units / 4 along the path and up the face. */
function arBdRibbon(A,Ar,R,o){ const {back,near,side,boss}=o, seed=(Ar.index||0)*71+(R()*1e6|0), x1=back-1.5;
  // the path in battle coordinates (wx: away from you, wz: across), a little outside where the blocks stood
  const pts=[], step=.25, inset=XCS/2;
  const push=(wx,wz)=>pts.push([wx,wz]);
  for(let wx=near;wx<back;wx+=step) push(wx,-(side+inset));
  for(let wz=-(side+inset);wz<side+inset;wz+=step) push(back+inset,wz);
  for(let wx=back;wx>=near;wx-=step) push(wx,side+inset);
  const L=[0]; for(let i=1;i<pts.length;i++) L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const crags=[...Array(2+(R()*2|0))].map(()=>({at:(.3+R()*.4)*L[L.length-1], w:1.2+R()*1.6, k:.4+R()*.3}));
  const full=XWALL_B*(boss?2.6:1.9);
  const height=(i)=>{ const [wx]=pts[i], hk=Math.max(.25,Math.min(1,(wx-near+2)/(back-near+2))), s=L[i];
    let h=full*hk*(.7+.6*bdFbm(s*.18,0,seed,2)); for(const c of crags) h*=1+c.k*Math.max(0,1-Math.abs(s-c.at)/c.w);
    return Math.max(.5,h); };
  // inward normals (toward the board), smoothed round the corners
  const nrm=pts.map((p,i)=>{ const a=pts[Math.max(0,i-2)], b=pts[Math.min(pts.length-1,i+2)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1; let nx=-tz/l, nz=tx/l;
    if(nx*(-p[0]+(back+near)/2)+nz*(-p[1])<0){ nx=-nx; nz=-nz; } return [nx,nz]; });
  const ROWS=26, pos=[], uv=[], idx=[];
  for(let i=0;i<pts.length;i++){ const [wx,wz]=pts[i], [nx,nz]=nrm[i], h=height(i), s=L[i];
    for(let r=0;r<=ROWS;r++){ const t=r/ROWS; let y, out;
      if(t<=.78){ y=-SLAB+(h+SLAB)*(t/.78); out=0; }                      // the face
      else if(t<=.92){ const q=(t-.78)/.14; y=h+.12*Math.sin(q*Math.PI); out=q*1.1; }   // the broken top
      else { const q=(t-.92)/.08; y=h-q*(h+SLAB); out=1.1+q*.6; }        // the back slope
      const big=(bdFbm(s/6,y/6,seed+1,2)-.5)*1.2, mid=(bdFbm(s/1.5,y/1.5,seed+2,2)-.5)*.4, fine=(bdNoise(s/.3,y/.3,seed+3)-.5)*.1;
      const top=t>.74&&t<.95?(bdFbm(s/.9,0,seed+4,2)-.5)*.7:0;
      const d=(t<=.92?big+mid+fine:0)-out;   // (in toward the board: buttresses out, recesses back)
      const X=wx+nx*d, Z=wz+nz*d, Y=y+top;
      pos.push(Z,Y,-X); uv.push(s/4,(t<=.78?y:h+out)/4); } }
  for(let i=0;i<pts.length-1;i++) for(let r=0;r<ROWS;r++){ const a=i*(ROWS+1)+r, b=a+ROWS+1; idx.push(a,b,a+1, b,b+1,a+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('uv2',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const m=o.wall?arBdRockMat(Ar,'special','boss-'+o.wall):arBdRockMat(Ar,'rock'); m.side=THREE.DoubleSide; const mesh=new THREE.Mesh(g,m); mesh.userData.bd='ribbon';
  // the AO bake's wall cells, sampled along the path (arena.js arenaBakeAO)
  const cells=[]; for(let i=0;i<pts.length;i+=Math.round(XCS/step)){ const [wx,wz]=pts[i]; cells.push([wx,wz,height(i)/full]); }
  return {mesh, cells}; }

// ---- the floating island (Task 2) ----
/* The board on a floating rock: its top the area's rock floor, its outline broken by noise (only ever outward: never into
   the board), its sides a sculpted cliff of ledges and strata that tapers down into a hanging underside, a few sculpted
   spires and fragments out in the chasm, vines hanging down the far and side edges. Nothing here is a cave floor (the
   Abyss hides those; the island must stay). o: {back, near, side} the island's extent (battle coordinates). */
function arBdIsland(A,Ar,R,o){ const {back,near,side}=o, seed=(Ar.index||0)*53+(R()*1e6|0), cx=(back+near)/2, hx=(back-near)/2, hz=side+1.5, out=[];
  // the outline: round the rectangle, every .25, pushed out by noise (0 to .5)
  const pts=[], per=2*(2*hx+2*hz), n=Math.ceil(per/.25);
  for(let i=0;i<n;i++){ const s=i/n*per; let wx, wz;
    if(s<2*hz){ wx=back; wz=-hz+s; } else if(s<2*hz+2*hx){ wx=back-(s-2*hz); wz=hz; } else if(s<4*hz+2*hx){ wx=near; wz=hz-(s-2*hz-2*hx); } else { wx=near+(s-4*hz-2*hx); wz=-hz; }
    const ox=wx-cx, oz=wz, l=Math.hypot(ox/hx,oz/hz)||1, push=bdFbm(s*.35,0,seed,3)*.5;
    pts.push({wx:wx+ox/l/hx*push, wz:wz+oz/l/hz*push, s}); }
  // the top: a fan from the middle, uv in world units / 8 (the old island's repeat)
  { const pos=[cx*0, -SLAB, -cx], uv=[0,cx/8], idx=[]; pos.length=0; uv.length=0; pos.push(0,-SLAB,-cx); uv.push(0,cx/8);
    for(const p of pts){ pos.push(p.wz,-SLAB,-p.wx); uv.push(p.wz/8,p.wx/8); }
    for(let i=1;i<=pts.length;i++) idx.push(0,i,i%pts.length+1);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const t=arTex(xTex(arArt(Ar,'floor',()=>xRockFloor(Ar.stone||AREAS[0].stone,(Ar.index||0)*17+3)),true)), m=arMat(xLitTag(xPhong({map:t}),1,t.image)); m.userData.xmold=1;
    const top=new THREE.Mesh(g,m); top.userData.bd='islandTop'; out.push(top); }
  // the cliff and underside: rings below the outline, tapering in toward the middle, displaced by ledges and strata
  { const ROWS=22, pos=[], uv=[], idx=[], col=[], N=pts.length;
    for(let i=0;i<=N;i++){ const p=pts[i%N], ox=p.wx-cx, oz=p.wz, l=Math.hypot(ox,oz)||1, nx=ox/l, nz=oz/l, s=i===N?per:p.s, deep=3+3*bdFbm(s*.12,5,seed,2);
      for(let r=0;r<=ROWS;r++){ const t=r/ROWS, y=-SLAB-t*deep, taper=Math.pow(t,1.8)*l*.88;
        const strata=(bdFbm(s/1.4,y/.5,seed+1,2)-.5)*.35+(bdFbm(s/5,y/3,seed+2,2)-.5)*.6+(t>.6?(bdNoise(s/.7,0,seed+3)-.5)*1.2*(t-.6):0);
        const lip=r===0?0:strata;
        const X=p.wx-nx*taper+nx*lip, Z=p.wz-nz*taper+nz*lip, Y=y-(t>.7?bdNoise(s/.9,1,seed+4)*1.8*(t-.7)/.3:0);   // (hanging lobes at the bottom)
        pos.push(Z,Y,-X); uv.push(s/4,y/4); const k=1-.85*Math.pow(t,.7); col.push(k,k,k); } }   // (darker with depth: the cliff falls away into the dark)
    for(let i=0;i<N;i++) for(let r=0;r<ROWS;r++){ const a=i*(ROWS+1)+r, b=a+ROWS+1; idx.push(a,a+1,b, b,a+1,b+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('uv2',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
    const m=arBdRockMat(Ar,'rock'); m.side=THREE.DoubleSide; m.vertexColors=true; const cliff=new THREE.Mesh(g,m); cliff.userData.bd='cliff'; out.push(cliff); }
  // spires and fragments out in the chasm
  { const n=2+(R()*4|0);
    for(let k=0;k<n;k++){ const a=(R()-.5)*Math.PI*1.4, d=hz+6+R()*19, h=3+R()*7, r0=.6+R()*1.4, g=new THREE.CylinderGeometry(r0*.25,r0,h,10,12), P=g.attributes.position;
      for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), q=(bdFbm(Math.atan2(z,x)*2,y*.8,seed+10+k,2)-.5)*.6*r0; const l=Math.hypot(x,z)||1; P.setXYZ(i,x+x/l*q,y,z+z/l*q); }
      g.computeVertexNormals(); const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*r0*1.5,uv.getY(i)*h/4); g.setAttribute('uv2',uv.clone());
      const m=arBdRockMat(Ar,'rock'), sp=new THREE.Mesh(g,m); sp.position.set(Math.sin(a)*d,-SLAB-2-R()*8+h/2-(R()<.4?h:0),-(cx+Math.cos(a)*d)); sp.rotation.z=(R()-.5)*.3; sp.userData.bd='spire'; out.push(sp); } }
  // vines down the far and side edges (the dungeon's vine cards)
  { const img=typeof envArtFx==='function'&&envArtFx('vine-broad');
    if(img){ const pos=[], uv=[], nr=[], k=8+(R()*7|0);
      for(let j=0;j<k;j++){ const p=pts[(R()*pts.length)|0]; if(p.wx<near+1) continue; const ox=p.wx-cx, oz=p.wz, l=Math.hypot(ox,oz)||1, nx=ox/l, nz=oz/l, h=1.4+R()*1.8, w=h*.35, tx=-nz, tz=nx;
        const X=p.wx+nx*.12, Z=p.wz+nz*.12, C=[[-1,0],[1,0],[1,1],[-1,0],[1,1],[-1,1]];
        for(const [a,b] of C){ const wx=X+tx*a*w/2, wz=Z+tz*a*w/2, y=-SLAB+.1-(1-b)*h; pos.push(wz,y,-wx); uv.push((a+1)/2,b); nr.push(nz,0,-nx); } }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nr,3));
      const m=arMat(xPhong({map:xLeafTex(img,true),alphaTest:.5,side:THREE.DoubleSide,shininess:2,specular:0x0a0a0a})); m.userData.noProj=1; if(typeof xHueMat==='function'&&Ar.moss) xHueMat(m,Ar.moss);
      const v=new THREE.Mesh(g,m); v.userData.bd='vines'; out.push(v); } }
  return out; }

// ---- matte paintings (Task 6) ----
/* A painted panorama behind the arena, in two layers on curved cards round the board's far side: the far plate (radius
   70, 70 degrees wide) and its middle layer (radius 45, 64 degrees, with a clear sky). Being at two distances they shift
   against each other as the camera moves. Their lower quarter fades into the area's fog, so they meet the chasm without a
   seam; unfogged and unlit (they are paintings of light already). Each battle picks one of its place's mattes, never the
   last battle's when it has another; only that one loads, and the cards fade in when it has. */
let AR_LAST_MATTE=null;
function arBdMatteId(A){ return A.bd&&A.bd.kind==='boss'&&typeof bossFor==='function'?'boss-'+bossFor(A.depth):A.area.id; }
function arBdMatte(A,R){ if(typeof ARENA_BACKDROP==='undefined') return; const id=arBdMatteId(A), cnt=ARENA_BACKDROP.mattes[id]||0; if(!cnt) return;
  let n=1+(R()*cnt|0); if(cnt>1&&AR_LAST_MATTE===id+'-'+n) n=n%cnt+1; AR_LAST_MATTE=id+'-'+n;
  A.bdMatte={id, n, built:false, t:0}; envArtMatte(id,n); }
function arBdMatteCard(img,radius,width,y0,cz,fog,order,transparent){ const H=radius*width/2;   // (2:1, as painted)
  const g=new THREE.CylinderGeometry(radius,radius,H,64,1,true,Math.PI-width/2,width), uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,1-uv.getX(i));   // (seen from inside: unmirrored)
  const t=arTex(new THREE.Texture(img)); t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.anisotropy=4; t.needsUpdate=true;
  const U={uFog:{value:new THREE.Color(fog)}, uK:{value:0}};
  const m=new THREE.MeshBasicMaterial({map:t, side:THREE.BackSide, fog:false, depthWrite:false, transparent:true, opacity:0});
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U); sh.fragmentShader='uniform vec3 uFog;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n  diffuseColor.rgb=mix(uFog,diffuseColor.rgb*.85,smoothstep(.02,.25,vUv.y));'); };
  m.customProgramCacheKey=()=>'bdmatte'; m.userData.matte=U; arMat(m);
  const mesh=new THREE.Mesh(g,m); mesh.position.set(0,y0+H/2,cz); mesh.renderOrder=-10+order; mesh.frustumCulled=false; mesh.userData.bd='matte'; return mesh; }
// each frame: build the cards once the matte has come in, then fade them in over 0.6 s
function arBdMatteTick(A,dt){ const M=A.bdMatte; if(!M) return;
  if(!M.built){ const L=envArtMatte(M.id,M.n); if(!L) return; M.built=true;
    const cz=-((A.room.back+A.room.near)/2), fog=new THREE.Color(A.area.fog).multiplyScalar(.35);
    M.cards=[arBdMatteCard(L.far,70,70*Math.PI/180,-24,cz,fog,0), arBdMatteCard(L.mid,45,64*Math.PI/180,-19,cz,fog,1)];   // (narrow arcs: a phone shows about 40 degrees, so the painting is spread over little more than the view and keeps its detail; low enough that each painting's middle band meets the board's horizon)   // (low enough that each painting's detailed middle band meets the board's horizon)
    for(const c of M.cards) A.grp.add(c); }
  if(M.cards&&M.t<1){ M.t=Math.min(1,M.t+dt/.6); for(const c of M.cards) c.material.opacity=M.t; } }

// ---- ruins (Task 3) ----
// pieces of geometry merged into one, its uv laid by box projection in world space at 4 units a repeat (no stretching)
function bdMerge(parts){ const P=[], Nn=[], U=[];
  for(const [g,m] of parts){ const q=g.index?g.toNonIndexed():g; q.applyMatrix4(m); q.computeVertexNormals(); const p=q.attributes.position, n=q.attributes.normal;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
      P.push(x,y,z); Nn.push(n.getX(i),n.getY(i),n.getZ(i)); if(ay>ax&&ay>az) U.push(x/4,z/4); else if(ax>az) U.push(z/4,y/4); else U.push(x/4,y/4); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setAttribute('uv2',new THREE.Float32BufferAttribute(U,2)); return g; }
// chip and roughen a piece: every vertex nudged by noise, the top ones more (crumbled)
function bdChip(g,seed,amt,top){ const P=g.attributes.position; let y1=-1e9; for(let i=0;i<P.count;i++) y1=Math.max(y1,P.getY(i));
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), k=(bdNoise(x*3.1+y*1.7,z*3.3,seed)-.5)*amt*2;
    const t=top&&y>y1-.01?-bdFbm(x*1.3,z*1.3,seed+5,2)*top:0; P.setXYZ(i,x+k,y+k*.5+t,z+k); } return g; }
/* One ruin piece's geometry, at the origin, standing on y=0: 'drum' (a broken column), 'stub' (a wall stub, its top
   stepped and crumbled), 'arch' (whole, or collapsed with one side gone), 'steps', 'block' (fallen), 'plinth'. */
function arBdRuinKit(kind,R){ const s=(R()*1e6)|0, parts=[], M=(x,y,z,ry,rz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry||0,rz||0)),new THREE.Vector3(1,1,1));
  if(kind==='drum'){ const h=.9+R()*2.6, r=.42+R()*.12, g=new THREE.CylinderGeometry(r*.95,r,h,16,Math.ceil(h*3)); const P=g.attributes.position;
      for(let i=0;i<P.count;i++){ const x=P.getX(i), z=P.getZ(i), a=Math.atan2(z,x), f=1-.06*Math.max(0,Math.cos(a*8)); P.setX(i,x*f); P.setZ(i,z*f); }   // (fluted)
      parts.push([bdChip(g,s,.03,.5+R()*.6),M(0,h/2,0)]); parts.push([bdChip(new THREE.BoxGeometry(r*2.5,.22,r*2.5,3,1,3),s+1,.03,0),M(0,.11,0)]); }
  else if(kind==='stub'){ const w=1.6+R()*1.6, h=.8+R()*1.4; parts.push([bdChip(new THREE.BoxGeometry(w,h,.6,Math.ceil(w*4),Math.ceil(h*4),2),s,.04,.6+R()*.5),M(0,h/2,0)]); }
  else if(kind==='arch'){ const span=2.4, h=2.8+R()*.8, broke=R()<.5;
      parts.push([bdChip(new THREE.BoxGeometry(.6,h,.6,2,8,2),s,.03,0),M(-span/2,h/2,0)]);
      if(!broke) parts.push([bdChip(new THREE.BoxGeometry(.6,h,.6,2,8,2),s+1,.03,0),M(span/2,h/2,0)]);
      const tor=new THREE.TorusGeometry(span/2,.3,6,18,broke?Math.PI*.55:Math.PI); parts.push([bdChip(tor,s+2,.03,0),new THREE.Matrix4().compose(new THREE.Vector3(0,h,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,broke?Math.PI*.45:0)),new THREE.Vector3(1,1,1))]); }
  else if(kind==='steps'){ for(let k=0;k<3;k++) parts.push([bdChip(new THREE.BoxGeometry(2.2-k*.5,.24,1.4-k*.4,6,1,4),s+k,.03,0),M(0,.12+k*.24,0)]); }
  else if(kind==='block'){ const a=.6+R()*.5; parts.push([bdChip(new THREE.BoxGeometry(a*1.6,a,a,4,3,3),s,.05,0),M(0,a/2-.05,0,R()*3,(R()-.5)*.4)]); }
  else { parts.push([bdChip(new THREE.BoxGeometry(1.3,.5,1.3,4,2,4),s,.03,0),M(0,.25,0)]); parts.push([bdChip(new THREE.BoxGeometry(1.05,.25,1.05,3,1,3),s+1,.02,.12),M(0,.62,0)]); }
  return bdMerge(parts); }
/* The ruins: the island, and 10-18 ruin pieces along its sides and back (beyond the board, never in front of it), a few
   broken off its far edge floating in the chasm, rubble and moss at their feet. */
function arBdRuins(A,Ar,R,o){ const out=arBdIsland(A,Ar,R,o), {back,near,side}=o;
  let z1=0, x1=-1e9, x0=1e9; for(const t of TILES){ z1=Math.max(z1,Math.abs(t.wz)); x1=Math.max(x1,t.wx); x0=Math.min(x0,t.wx); }
  const parts=[], feet=[], kinds=['drum','drum','stub','stub','block','plinth','steps','drum'], put=(kind,wx,wz,y,ry)=>{ const g=arBdRuinKit(kind,R); parts.push([g,new THREE.Matrix4().compose(new THREE.Vector3(wz,y,-wx),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1))]); feet.push([wx,wz,y]); };
  const n=10+(R()*9|0);
  for(let k=0;k<n;k++){ const sd=R()<.5?-1:1, wx=x0+4+R()*(x1-x0-3), wz=sd*(z1+1.9+R()*1.6), kind=kinds[R()*kinds.length|0]; put(kind,wx,wz,-SLAB,R()*6.3); }
  put('arch',x1+.6,(R()<.5?-1:1)*(z1+2.2),-SLAB,Math.PI/2);   // (an arch at a back corner)
  for(let k=0,m=2+(R()*3|0);k<m;k++){ const wx=back+1.5+R()*4, wz=(R()-.5)*2*(side), kind=['drum','stub','block','arch'][R()*4|0]; put(kind,wx,wz,-SLAB-1-R()*3,R()*6.3); }   // (broken off the far edge, floating)
  const g=bdMerge(parts.map(([g,m])=>{ const q=g.clone(); return [q,m]; })), mat=arBdRockMat(Ar,'stone'); const mesh=new THREE.Mesh(g,mat); mesh.userData.bd='ruins'; out.push(mesh);
  out.push(...arBdDressing(A,Ar,R,feet));
  return out; }

// ---- dressing (Task 3) ----
/* Rubble (small sculpted rocks, instanced) and the hex floor's flat growth (moss, lichen, leaves) at the feet of rock and
   ruins: feet are [wx, wz, y] in battle coordinates. */
function arBdDressing(A,Ar,R,feet){ const out=[], n=feet.length*3;
  { const g=bdChip(new THREE.DodecahedronGeometry(.18,1),(R()*1e6)|0,.05,0); g.setAttribute('uv2',g.attributes.uv.clone());
    const im=new THREE.InstancedMesh(g,arBdRockMat(Ar,'rock'),n), m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), sc=new THREE.Vector3();
    for(let i=0;i<n;i++){ const [wx,wz,y]=feet[i%feet.length], a=R()*6.3, d=.5+R()*.9, s=.5+R()*1.4; e.set(R()*3,R()*3,R()*3); q.setFromEuler(e);
      v.set(wz+Math.sin(a)*d,y+.05*s,-(wx+Math.cos(a)*d)); sc.set(s,s*.7,s); m4.compose(v,q,sc); im.setMatrixAt(i,m4); }
    im.userData.bd='rubble'; out.push(im); }
  const H=typeof envArtHex==='function'&&envArtHex(Ar.id), G=typeof ARENA_HEX!=='undefined'&&ARENA_HEX.growth;
  if(H&&G){ const flat=G.flat[Ar.id]||[], cs=G.cell, W=8*cs, Hh=4*cs, P=[], N=[], U=[];
    for(let i=0;i<feet.length*2&&flat.length;i++){ const [wx,wz,y]=feet[i%feet.length], c=flat[R()*flat.length|0], b=G.box[Ar.id]['f'+c]||[8,8,cs-8,cs-8], x0=(c%4)*cs, y0=((c/4)|0)*cs;
      const u0=(x0+b[0])/W, u1=(x0+b[2])/W, v0=1-(y0+b[3])/Hh, v1=1-(y0+b[1])/Hh, a=R()*6.3, d=.3+R()*.8, L=.5+R()*.5, X=wx+Math.cos(a)*d, Z=wz+Math.sin(a)*d, r=R()*6.3, cr=Math.cos(r), sr=Math.sin(r);
      for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){ const px=sx*L/2, pz=sz*L/2; P.push(Z+px*cr-pz*sr,y+.02,-(X+px*sr+pz*cr)); N.push(0,1,0); U.push(sx<0?u0:u1,sz<0?v0:v1); } }
    if(P.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
      const m=arMat(new THREE.MeshStandardMaterial({map:xLeafTex(H.growth,true),alphaTest:.5,side:THREE.DoubleSide,roughness:1,metalness:0})); m.userData.noProj=1;
      const mesh=new THREE.Mesh(g,m); mesh.userData.bd='moss'; out.push(mesh); } }
  return out; }

// ---- set pieces (Task 4) ----
/* Two or three per area, sculpted from the area's materials and its special one (special: the set-piece material; it
   glows where its mask says). Each stands in a slot {wx, wz, y, face} (battle coordinates; face: the angle it turns to
   look at the board), returns its meshes, and may add a tick to A.bdTicks (lava running, a pylon turning). */
const bdMesh=(g,m,tag)=>{ if(!g.attributes.uv2&&g.attributes.uv) g.setAttribute('uv2',g.attributes.uv.clone()); const o=new THREE.Mesh(g,m); o.userData.bd=tag||'setpiece'; return o; };
const bdAt=(o,s,dy)=>{ o.position.set(s.wz,(s.y||0)+(dy||0),-s.wx); o.rotation.y=s.face||0; return o; };
function bdCrystals(m,R,n,r,h,spread){ const parts=[];
  for(let k=0;k<n;k++){ const hh=h*(.4+R()*.8), g=new THREE.OctahedronGeometry(1,0); g.scale(r*(.5+R()*.6),hh,r*(.5+R()*.6));
    parts.push([g,new THREE.Matrix4().compose(new THREE.Vector3((R()-.5)*spread,hh*.55,(R()-.5)*spread*.6),new THREE.Quaternion().setFromEuler(new THREE.Euler((R()-.5)*.8,R()*3,(R()-.5)*.8)),new THREE.Vector3(1,1,1))]); }
  return bdMerge(parts); }
const ARENA_SETPIECES={
  hollows:[
    {name:'crystal seam', kinds:['cave','island','ruins'], build:(A,Ar,R,s)=>[bdAt(bdMesh(bdCrystals(arBdRockMat(Ar,'special'),R,10+(R()*6|0),.35,2.2,2.2),arBdRockMat(Ar,'special')),s)]},
    {name:'giant root wall', kinds:['cave','ruins'], build:(A,Ar,R,s)=>{ const parts=[]; for(let k=0;k<5;k++){ const pts=[]; const x0=(R()-.5)*3; for(let i=0;i<6;i++) pts.push(new THREE.Vector3(x0+(R()-.5)*.8+i*.15*(R()-.5),4-i*.8+(R()-.5)*.3,(i/5)*(R()*1.2)));
        parts.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.18+R()*.22,7,false),new THREE.Matrix4()]); }
      const m=arBdRockMat(Ar,'rock'); m.color.multiply(new THREE.Color('#7a5a3a')); return [bdAt(bdMesh(bdMerge(parts),m),s)]; }},
    {name:'lantern-mushroom cluster', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ if(typeof xMushReady!=='function'||!xMushReady('lantern-bells')) return [];
      const out=[]; for(let k=0;k<3+(R()*3|0);k++){ const h=.9+R()*1.3, g=xMushGeo('lantern-bells',false).clone(); g.scale(h,h,h); const o=bdMesh(g,arMat(xMushMat('lantern-bells')),'setpiece'); bdAt(o,{wx:s.wx+(R()-.5)*1.6,wz:s.wz+(R()-.5)*1.2,y:s.y},0); o.rotation.y=R()*6; out.push(o); } return out; }} ],
  deeps:[
    {name:'frozen waterfall', kinds:['cave'], build:(A,Ar,R,s)=>{ const g=new THREE.PlaneGeometry(2.6,6,10,24), P=g.attributes.position; for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i); P.setZ(i,(bdFbm(x*1.3,y*.6,7,3)-.5)*.6+Math.pow((3-y)/6,2)*.8); }
      g.computeVertexNormals(); const m=arBdRockMat(Ar,'special'); m.transparent=true; m.opacity=.88; return [bdAt(bdMesh(g,m),s,3)]; }},
    {name:'ice pillars', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ const parts=[]; for(let k=0;k<3+(R()*3|0);k++){ const h=1.5+R()*3, g=bdChip(new THREE.CylinderGeometry(.08,.35+R()*.25,h,7,6),k*31,.06,0); parts.push([g,new THREE.Matrix4().makeTranslation((R()-.5)*2.4,h/2,(R()-.5)*1.2)]); }
      const m=arBdRockMat(Ar,'special'); m.transparent=true; m.opacity=.9; return [bdAt(bdMesh(bdMerge(parts),m),s)]; }},
    {name:'frosted ledge with icicles', kinds:['cave','island'], build:(A,Ar,R,s)=>{ const parts=[[bdChip(new THREE.BoxGeometry(3.2,.4,1.1,8,2,3),5,.08,0),new THREE.Matrix4().makeTranslation(0,2.6,0)]];
      for(let k=0;k<9;k++){ const h=.4+R()*1.1, g=new THREE.ConeGeometry(.07+R()*.07,h,6); g.rotateX(Math.PI); parts.push([g,new THREE.Matrix4().makeTranslation((R()-.5)*3,2.4-h/2,(R()-.5)*.8)]); }
      return [bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'special')),s)]; }} ],
  vault:[
    {name:'rune vault door', kinds:['cave','ruins'], build:(A,Ar,R,s)=>{ const parts=[[bdChip(new THREE.BoxGeometry(3,4,.5,6,8,2),11,.03,0),new THREE.Matrix4().makeTranslation(0,2,0)]];
      return [bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'special')),s), bdAt(bdMesh(bdMerge([[bdChip(new THREE.BoxGeometry(3.8,.6,.8,6,1,2),12,.04,.2),new THREE.Matrix4().makeTranslation(0,4.3,0)]]),arBdRockMat(Ar,'stone')),s)]; }},
    {name:'arcane crystal pylon', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ const base=bdAt(bdMesh(arBdRuinKit('plinth',R),arBdRockMat(Ar,'stone')),s);
      const g=new THREE.OctahedronGeometry(1,0); g.scale(.45,1.2,.45); const c=bdAt(bdMesh(g,arBdRockMat(Ar,'special')),s,2.3); (A.bdTicks=A.bdTicks||[]).push((T)=>{ c.rotation.y=T*.6; c.position.y=(s.y||0)+2.3+Math.sin(T*1.3)*.15; }); return [base,c]; }} ],
  rifts:[
    {name:'lava fall', kinds:['cave'], build:(A,Ar,R,s)=>{ const lt=arLavaTex(R); lt.wrapS=lt.wrapT=THREE.RepeatWrapping; lt.repeat.set(1,3); const g=new THREE.PlaneGeometry(1.6,6,6,20), P=g.attributes.position;
      for(let i=0;i<P.count;i++){ const y=P.getY(i); P.setZ(i,Math.pow((3-y)/6,2)*1.2); } const m=arMat(new THREE.MeshBasicMaterial({map:lt,fog:true}));
      (A.bdTicks=A.bdTicks||[]).push(T=>{ lt.offset.y=T*.35; }); const pool=bdMesh(new THREE.CircleGeometry(1.4,20).rotateX(-Math.PI/2),m); return [bdAt(bdMesh(g,m),s,3), bdAt(pool,{wx:s.wx-1.2,wz:s.wz,y:-SLAB+.02})]; }},
    {name:'basalt columns', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ const parts=[]; for(let k=0;k<6+(R()*5|0);k++){ const h=.8+R()*3.2, g=new THREE.CylinderGeometry(.42,.42,h,6,1); parts.push([g,new THREE.Matrix4().makeTranslation((k%4-1.5)*.75+(R()-.5)*.1,h/2,((k/4)|0)*.7)]); }
      return [bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'rock')),s)]; }} ],
  ruins:[
    {name:'collapsed arch', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ const g=arBdRuinKit('arch',R); g.scale(1.5,1.5,1.5); return [bdAt(bdMesh(g,arBdRockMat(Ar,'stone')),s)]; }},
    {name:'statue niche', kinds:['cave','ruins'], build:(A,Ar,R,s)=>{ const parts=[[new THREE.BoxGeometry(2.4,3.6,.4),new THREE.Matrix4().makeTranslation(0,1.8,-.3)],[new THREE.BoxGeometry(1.2,.6,.9),new THREE.Matrix4().makeTranslation(0,.3,0)],
        [new THREE.CylinderGeometry(.32,.42,1.6,10),new THREE.Matrix4().makeTranslation(0,1.4,0)],[new THREE.SphereGeometry(.26,12,8),new THREE.Matrix4().makeTranslation(0,2.45,0)]];
      return [bdAt(bdMesh(bdMerge(parts.map(([g,m],i)=>[bdChip(g,40+i,.02,0),m])),arBdRockMat(Ar,'special')),s)]; }},
    {name:'overgrown colonnade', kinds:['ruins','island'], build:(A,Ar,R,s)=>{ const parts=[]; for(let k=0;k<4;k++){ const g=arBdRuinKit('drum',R); parts.push([g,new THREE.Matrix4().makeTranslation((k-1.5)*1.3,0,0)]); }
      parts.push([bdChip(new THREE.BoxGeometry(5.4,.45,.7,10,1,2),77,.05,.2),new THREE.Matrix4().makeTranslation(0,3.4,0)]); return [bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'stone')),s)]; }} ],
  abyss:[
    {name:'broken stairs into the void', kinds:['island','ruins'], build:(A,Ar,R,s)=>{ const parts=[]; for(let k=0;k<9;k++){ if(R()<.18) continue; parts.push([bdChip(new THREE.BoxGeometry(1.6,.3,.7,4,1,2),k*7,.04,0),new THREE.Matrix4().makeTranslation((R()-.5)*.15,k*.42,-k*.62)]); }
      return [bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'stone')),s)]; }},
    {name:'chained floating monolith', kinds:['island','ruins','cave'], build:(A,Ar,R,s)=>{ const mono=bdAt(bdMesh(bdChip(new THREE.BoxGeometry(1.1,3.6,.6,3,8,2),9,.05,0),arBdRockMat(Ar,'special')),s,3.2);
      const parts=[]; for(let k=0;k<10;k++){ const g=new THREE.TorusGeometry(.13,.04,5,10); parts.push([g,new THREE.Matrix4().compose(new THREE.Vector3(.4,1.3-k*.22,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,k%2?Math.PI/2:0,0)),new THREE.Vector3(1,1,1))]); }
      const chain=bdAt(bdMesh(bdMerge(parts),arBdRockMat(Ar,'rock')),s,0); (A.bdTicks=A.bdTicks||[]).push(T=>{ mono.position.y=(s.y||0)+3.2+Math.sin(T*.7)*.2; mono.rotation.y=(s.face||0)+Math.sin(T*.3)*.1; }); return [mono,chain]; }} ],
};
// the slots a kind of place offers (battle coordinates): at the back, and along each side, beyond the board
function arBdSlots(A,kind,R){ let z1=0, x1=-1e9, x0=1e9; for(const t of TILES){ z1=Math.max(z1,Math.abs(t.wz)); x1=Math.max(x1,t.wx); x0=Math.min(x0,t.wx); }
  const back=A.room.back, mid=(x0+x1)/2+2;
  if(kind==='cave') return [{wx:back+.4,wz:-2.5,y:-SLAB,face:0},{wx:back+.4,wz:3,y:-SLAB,face:0},{wx:mid,wz:-(z1+2.6),y:-SLAB,face:Math.PI/2},{wx:mid,wz:z1+2.6,y:-SLAB,face:-Math.PI/2}];
  return [{wx:x1+1.3,wz:(R()<.5?-1:1)*(z1+2.4),y:-SLAB,face:0},{wx:back+3.5,wz:-3,y:-SLAB-2.5,face:0},{wx:mid,wz:-(z1+2.6),y:-SLAB,face:Math.PI/2},{wx:mid,wz:z1+2.6,y:-SLAB,face:-Math.PI/2}]; }
// one or two of the area's set pieces that fit the kind of place, at least one at the back
function arBdSetPieces(A,Ar,R,kind){ const L=(ARENA_SETPIECES[Ar.id]||[]).filter(p=>p.kinds.includes(kind)); if(!L.length) return [];
  const slots=arBdSlots(A,kind,R), n=Math.min(L.length,1+(R()<.6?1:0)), pick=L.slice().sort(()=>R()-.5).slice(0,n), out=[];
  pick.forEach((p,i)=>{ const s=i===0?slots[R()<.5?0:1]:slots[2+(R()*2|0)]; try{ out.push(...p.build(A,Ar,R,s)); }catch(e){ console.warn('set piece '+p.name+': '+e.message); } });
  A.bdPieces=pick.map(p=>p.name); return out; }

// ---- boss battlefields (Task 5) ----
/* Each boss fights in its own field (spec table): enclosed by sculpted walls (open:false) or on a floating rock (open:
   true), with its own pieces; the last three change as the boss evolves (e.phase 2, 3), eased in over two seconds and
   visual only. Nothing here bakes in the board's outline: what follows the board's edge is built from TILES by
   arBdBoardEdge (the next design moves tiles). build(A, Ar, R) -> meshes, keeping its changing parts in A.bdBoss. */
function arBdBoardEdge(A){ let z1=0, x1=-1e9, x0=1e9; for(const t of TILES){ z1=Math.max(z1,Math.abs(t.wz)); x1=Math.max(x1,t.wx); x0=Math.min(x0,t.wx); } return {z1,x0,x1}; }
const bdBossMat=(Ar,id)=>arBdRockMat(Ar,'special','boss-'+id);
const ARENA_BOSSFIELD={
  golem:{ open:false, wall:'golem', build(A,Ar,R){ const E=arBdBoardEdge(A), out=[], m=bdBossMat(Ar,'golem'); m.emissive=m.emissive||new THREE.Color(); A.bdBoss={glow:m};
      for(const [wx,wz] of [[E.x1+2.6,-5],[E.x1+2.6,0],[E.x1+2.6,5],[E.x0+6,-(E.z1+2.8)],[E.x0+6,E.z1+2.8],[E.x0+11,-(E.z1+2.8)],[E.x0+11,E.z1+2.8]]) out.push(bdAt(bdMesh(bdCrystals(m,R,7+(R()*5|0),.45,3.2,2.4),m,'boss'),{wx,wz,y:-SLAB}));
      return out; },
    tick(A,T,dt,b){ const g=A.bdBoss&&A.bdBoss.glow; if(!g||!b||!b.weak||typeof COLORS==='undefined'||!COLORS[b.weak]) return; g.emissive.lerp(new THREE.Color(COLORS[b.weak].c),Math.min(1,dt*2)); g.emissiveIntensity=.8+.2*Math.sin(T*2); } },
  glacier:{ open:false, wall:null, build(A,Ar,R){ const E=arBdBoardEdge(A), m=bdBossMat(Ar,'glacier'), out=[];
      const throne=[[new THREE.BoxGeometry(3,1,2),0,.5,0],[new THREE.BoxGeometry(3.4,4.5,.6),0,2.6,-.8],[new THREE.BoxGeometry(.6,2,2),-1.4,1.5,0],[new THREE.BoxGeometry(.6,2,2),1.4,1.5,0]];
      out.push(bdAt(bdMesh(bdMerge(throne.map(([g,x,y,z],i)=>[bdChip(g,60+i,.06,i===1?.6:0),new THREE.Matrix4().makeTranslation(x,y,z)])),m,'boss'),{wx:E.x1+3,wz:0,y:-SLAB}));
      const fall=ARENA_SETPIECES.deeps[0].build(A,Ar,R,{wx:E.x1+3.3,wz:-5.5,y:-SLAB}); fall.forEach(o=>o.userData.bd='boss'); out.push(...fall);
      const parts=[]; for(let k=0;k<26;k++){ const a=k/26*Math.PI*2, h=.6+R()*1.6, g=new THREE.ConeGeometry(.1+R()*.08,h,6); g.rotateX(Math.PI); parts.push([g,new THREE.Matrix4().makeTranslation(Math.sin(a)*(E.z1+3.4),5.2-h/2,-(((E.x0+E.x1)/2)+Math.cos(a)*(E.x1-E.x0)/2*1.3))]); }
      out.push(bdMesh(bdMerge(parts),m,'boss')); return out; } },
  roc:{ open:true, build(A,Ar,R){ const E=arBdBoardEdge(A), out=[], st=bdBossMat(Ar,'roc'), parts=[];
      for(let k=0;k<14;k++){ const a=k/14*Math.PI*2, pts=[]; for(let i=0;i<5;i++) pts.push(new THREE.Vector3(Math.cos(a+i*.3)*(2+i*.15),.3+i*.12+(R()-.5)*.2,Math.sin(a+i*.3)*(2+i*.15)*.6)); parts.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.12+R()*.08,5,false),new THREE.Matrix4()]); }
      out.push(bdAt(bdMesh(bdMerge(parts),st,'boss'),{wx:E.x1+3,wz:0,y:-SLAB}));
      const rod=new THREE.CylinderGeometry(.08,.12,4.5,6); for(const [wx,wz] of [[E.x0+5,-(E.z1+2.4)],[E.x0+5,E.z1+2.4],[E.x1,-(E.z1+2.4)],[E.x1,E.z1+2.4]]){ out.push(bdAt(bdMesh(rod.clone(),st,'boss'),{wx,wz,y:-SLAB},2.25)); out.push(bdAt(bdMesh(arBdRuinKit('plinth',R),st,'boss'),{wx,wz,y:-SLAB})); }
      return out; } },
  wyrm:{ open:true, build(A,Ar,R){ const lt=arLavaTex(R); lt.wrapS=lt.wrapT=THREE.RepeatWrapping; lt.repeat.set(12,12); const lm=arMat(new THREE.MeshBasicMaterial({map:lt,fog:false,color:new THREE.Color(.8,.8,.8)}));
      const lake=bdMesh(new THREE.PlaneGeometry(220,220).rotateX(-Math.PI/2),lm,'lava'); lake.position.set(0,-4.5,-10); A.bdBoss={lake, lm, lt, y0:-4.5}; (A.bdTicks=A.bdTicks||[]).push(T=>{ lt.offset.x=T*.01; lt.offset.y=T*.006; });
      const E=arBdBoardEdge(A), out=[lake]; for(const wz of [-6,6]) out.push(...ARENA_SETPIECES.rifts[0].build(A,Ar,R,{wx:A.room.back+5,wz,y:-SLAB-1}));
      for(const wz of [-(E.z1+2.8),E.z1+2.8]){ const g=new THREE.TorusGeometry(.7,.28,8,16); g.rotateX(Math.PI/2); out.push(bdAt(bdMesh(g,arBdRockMat(Ar,'rock'),'boss'),{wx:E.x0+8,wz,y:-SLAB+.05})); }
      return out; },
    phase:[{lava:0,glow:.8,light:'#ffffff'},{lava:.4,glow:1.3,light:'#ff8a5a'},{lava:.8,glow:1.8,light:'#ff5a2a'}],
    apply(A,s){ const B2=A.bdBoss; if(!B2) return; B2.lake.position.y=B2.y0+s.lava; B2.lm.color.setScalar(Math.min(1.6,s.glow)); A.lamp.color.lerp(new THREE.Color(s.light),.5); } },
  treant:{ open:true, ruins:true, build(A,Ar,R){ const E=arBdBoardEdge(A), out=[], bark=bdBossMat(Ar,'treant');
      const trunk=new THREE.CylinderGeometry(2.2,3.4,14,16,10), P=trunk.attributes.position; for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), a=Math.atan2(z,x), k=1+(bdFbm(a*2,y*.3,91,3)-.5)*.5; P.setX(i,x*k); P.setZ(i,z*k); }
      out.push(bdAt(bdMesh(trunk,bark,'boss'),{wx:A.room.back+7,wz:0,y:-SLAB},4));
      const roots=new THREE.Group(), parts=[]; for(let k=0;k<8;k++){ const sd=k%2?1:-1, pts=[new THREE.Vector3(sd*1.5,1,-(A.room.back+6))]; for(let i=1;i<6;i++) pts.push(new THREE.Vector3(sd*(E.z1+2.4+(R()-.5)),.2+(R()*.3),-(A.room.back+5-i*((E.x1-E.x0)/5)*(.5+k/16))));
        parts.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.22+R()*.18,7,false),new THREE.Matrix4()]); }
      const rm=bdBossMat(Ar,'treant'); rm.emissiveIntensity=.4; const rmesh=bdMesh(bdMerge(parts),rm,'boss'); rmesh.position.y=-SLAB; roots.add(rmesh); out.push(roots); A.bdBoss={roots, rm};
      return out; },
    phase:[{close:0,light:'#ffffff'},{close:1,light:'#f0c890'},{close:2,light:'#d9a050'}],
    apply(A,s,T){ const B2=A.bdBoss; if(!B2) return; B2.roots.scale.x=Math.max(.6,1-s.close*.08); const nodes=typeof B!=='undefined'&&B&&B.enemies&&B.enemies.some(e=>e.hp>0&&e.def&&e.def.minion&&e.id==='rootnode');
      B2.rm.emissiveIntensity=nodes?.6+.4*Math.sin(T*4):.25; A.lamp.color.lerp(new THREE.Color(s.light),.5); } },
  hollow:{ open:true, build(A,Ar,R){ const out=[], ob=bdBossMat(Ar,'hollow'), back=A.room.back;
      const th=[[new THREE.BoxGeometry(2.6,.8,2),0,.4,0],[new THREE.BoxGeometry(2.8,4.2,.5),0,2.5,-.8],[new THREE.BoxGeometry(.5,1.6,1.8),-1.2,1.2,0],[new THREE.BoxGeometry(.5,1.6,1.8),1.2,1.2,0]];
      out.push(bdAt(bdMesh(bdMerge(th.map(([g,x,y,z],i)=>[bdChip(g,80+i,.08,i===1?1.2:0),new THREE.Matrix4().makeTranslation(x,y,z)])),ob,'boss'),{wx:back+3.5,wz:0,y:-SLAB-1.5}));
      const shards=[]; for(let k=0;k<8;k++){ const g=new THREE.OctahedronGeometry(1,0); g.scale(.35,1.6+R()*1.2,.12); const a=-1.2+k/7*2.4, o=bdAt(bdMesh(g,ob,'boss'),{wx:back+2+Math.cos(a)*4,wz:Math.sin(a)*7,y:-SLAB},1.5+R()*2); o.rotation.set(R()-.5,R()*3,R()-.5); shards.push({o,home:o.position.clone(),out:new THREE.Vector3(Math.sin(a)*3,2+R()*2,-2-R()*2)}); out.push(o); }
      A.bdBoss={shards}; return out; },
    phase:[{gone:0,fog:1,amb:1},{gone:2,fog:1.4,amb:.85},{gone:6,fog:1.8,amb:.7}],
    apply(A,s,T){ const B2=A.bdBoss; if(!B2) return; B2.shards.forEach((d,i)=>{ const k=Math.max(0,Math.min(1,s.gone-i)); d.o.position.copy(d.home).addScaledVector(d.out,k); d.o.position.y+=Math.sin(T*.8+i)*.15; });
      if(A.scene.fog){ A.scene.fog.near/=s.fog; A.scene.fog.far/=s.fog; } A.amb.intensity*=s.amb; } },
};
// the boss's field each frame, after the lights: its own tick, and for the last three the state of its evolution, eased
function arBdBossTick(A,T,dt){ if(!A.bd||A.bd.kind!=='boss'||typeof bossFor!=='function') return; const id=bossFor(A.depth), F=ARENA_BOSSFIELD[id]; if(!F) return;
  const boss=typeof B!=='undefined'&&B&&B.enemies?B.enemies.find(e=>e.def&&e.def.boss):null;
  if(F.tick) F.tick(A,T,dt,boss);
  if(F.phase){ const ph=Math.max(1,Math.min(3,(boss&&boss.phase)||1)), want=F.phase[ph-1], cur=A.bdPhase||(A.bdPhase=Object.assign({},F.phase[0]));
    const k=Math.min(1,dt/2*3);   // (about two seconds to settle)
    for(const key in want) if(typeof want[key]==='number') cur[key]+=(want[key]-cur[key])*k; else cur[key]=want[key];
    F.apply(A,cur,T); } }
