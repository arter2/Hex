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
  const m=arBdRockMat(Ar,'rock'); m.side=THREE.DoubleSide; const mesh=new THREE.Mesh(g,m); mesh.userData.bd='ribbon';
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
