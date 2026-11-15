/* Hexmancers - the battle board's painted hex floor (docs/superpowers/specs/2026-11-15-arena-hex-floor-design.md; the
   plan docs/superpowers/plans/2026-11-15-arena-hex-floor.md). Every hex is a carved stone tile painted to the hex, set
   flush in a dark joint: one of the area's eight painted tiles (tools/build-arena-hex.py: art/environment/arena/hex/),
   turned by sixths and now and then mirrored, its tone, edge wear, cracks and moss varied by its own key, with a slow
   tone drift across the whole board. The material is PBR (MeshStandardMaterial: the painted roughness and metalness, a
   normal and an ambient-occlusion map from the painted height) and tuned live from the debug menu's Arena floor rows.
   Until an area's art has come in (or if it failed) the board stands in with the same tiles built from their shape:
   the area's code-painted slab as faint grain, a bevel from the distance to the hex's edge. The square board of the
   Movement lab keeps the old board (arena.js). */
const HEX_R=.92;   // a tile's circumradius (the grid's is 1): the joints between are about .14 wide
const HEX_MATS=new Set();   // the live hex materials, for the debug menu's rows
// a tile's stable dice: its painted variant, turn (sixths), mirror, tone and the strengths of its masks
function hexKey(t){ return Math.imul(t.q*73856093^t.r*19349663,2654435761)>>>0; }
function hexPicks(){ const P=new Map(), at=new Map(TILES.map(t=>[t.q+','+t.r,t])), nb=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  for(const t of TILES){ let h=hexKey(t), v=h%8, turn=(h>>>3)%6;
    for(let k=0;k<12;k++){ const clash=nb.some(([dq,dr])=>{ const o=at.get((t.q+dq)+','+(t.r+dr)), p=o&&P.get(o); return p&&p.v===v&&p.turn===turn; }); if(!clash) break;
      h=Math.imul(h^0x9e3779b9,2246822507)>>>0; v=h%8; turn=(h>>>3)%6; }
    const f=s=>((h>>>s)&255)/255;
    P.set(t,{v, turn, mir:((h>>>6)&3)===0?1:0, tone:(f(8)-.5)*.14, wear:.6+f(16)*.6, crack:.8+f(24)*.4, moss:f(11)}); }
  return P; }
// a point (ox, oz) off a tile's centre, in world units, to its place in the painting: the art's hexes are pointy-top
// (a corner straight up the image), the board's have a corner along world x; turned by sixths, mirrored across
function hexUV(ox,oz,p,cols,rows,cellPx,hexPx){ const r=Math.hypot(ox,oz)/HEX_R*hexPx, a=Math.atan2(oz,ox)-Math.PI/2+p.turn*Math.PI/3;
  let x=Math.cos(a)*r, y=Math.sin(a)*r; if(p.mir) x=-x; const cx=(p.v%cols+.5)*cellPx+x, cy=(((p.v/cols)|0)%rows+.5)*cellPx+y;
  return [cx/(cols*cellPx), 1-cy/(rows*cellPx)]; }
// the tiles: one merged mesh; each tile a hex top and a bevel skirt down into its joint; t._v0..t._v1 its vertices (the
// colour arena.js arenaTiles writes from the tile's state)
function hexGeo(P,cols,rows,cellPx,hexPx){ const pos=[], nor=[], uv=[], col=[], va=[];
  const put=(x,y,z,nx,ny,nz,u,v,p)=>{ pos.push(x,y,z); nor.push(nx,ny,nz); uv.push(u,v); col.push(1,1,1); va.push(p.tone,p.wear,p.crack,p.moss); };
  for(const t of TILES){ const p=P.get(t), cx=t.wz, cz=-t.wx; t._v0=pos.length/3;
    const C=[...Array(6)].map((_,i)=>{ const a=i*Math.PI/3; return [Math.cos(a),Math.sin(a)]; });
    const U=(ox,oz,k)=>hexUV(ox*k,oz*k,p,cols,rows,cellPx,hexPx);
    for(let i=0;i<6;i++){ const a=C[i], b=C[(i+1)%6];
      put(cx,0,cz,0,1,0,...U(0,0,1),p); put(cx+b[0]*HEX_R,0,cz+b[1]*HEX_R,0,1,0,...U(b[0]*HEX_R,b[1]*HEX_R,1),p); put(cx+a[0]*HEX_R,0,cz+a[1]*HEX_R,0,1,0,...U(a[0]*HEX_R,a[1]*HEX_R,1),p); }
    // the skirt: the rim's own colour (just inside the painted edge), sloping out and down into the joint
    for(let i=0;i<6;i++){ const a=C[i], b=C[(i+1)%6], mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2, l=Math.hypot(mx,mz), nx=mx/l*.7, nz=mz/l*.7, R2=HEX_R+.035, y2=-.07;
      const ua=U(a[0]*HEX_R,a[1]*HEX_R,.97), ub=U(b[0]*HEX_R,b[1]*HEX_R,.97);
      put(cx+a[0]*HEX_R,0,cz+a[1]*HEX_R,nx,.7,nz,...ua,p); put(cx+b[0]*HEX_R,0,cz+b[1]*HEX_R,nx,.7,nz,...ub,p); put(cx+b[0]*R2,y2,cz+b[1]*R2,nx,.7,nz,...ub,p);
      put(cx+a[0]*HEX_R,0,cz+a[1]*HEX_R,nx,.7,nz,...ua,p); put(cx+b[0]*R2,y2,cz+b[1]*R2,nx,.7,nz,...ub,p); put(cx+a[0]*R2,y2,cz+a[1]*R2,nx,.7,nz,...ua,p); }
    t._v1=pos.length/3; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('uv2',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setAttribute('aHexVar',new THREE.Float32BufferAttribute(va,4)); return g; }
// a texture from an Image: colour, or data (no colour conversion, no premultiplying: the masks' alpha is data)
function hexTex(img,rep){ const t=arTex(new THREE.Texture(img)); t.wrapS=t.wrapT=rep?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter;
  t.anisotropy=4; t.premultiplyAlpha=false; t.needsUpdate=true; return t; }
// the mean colour of an image (the joints' moss colour the tiles' moss mask mixes toward)
function hexMean(img){ const c=document.createElement('canvas'); c.width=c.height=8; const x=c.getContext('2d'); x.drawImage(img,0,0,8,8); const d=x.getImageData(0,0,8,8).data; let r=0,g=0,b=0;
  for(let i=0;i<64;i++){ r+=d[i*4]; g+=d[i*4+1]; b+=d[i*4+2]; } return new THREE.Color(r/64/255,g/64/255,b/64/255); }
// the tiles' material: PBR, its painted maps, the per-tile variation and the board-wide drift in its shader
function hexMat(H){ const T=hexTex(H.tiles), M=hexTex(H.m), m=new THREE.MeshStandardMaterial({map:T, normalMap:hexTex(H.n), aoMap:M, roughnessMap:M, metalnessMap:M, roughness:1, metalness:1, alphaTest:.5, vertexColors:true});
  m.normalScale.set(XLIT.hexNrm,XLIT.hexNrm); m.aoMapIntensity=XLIT.hexAO;
  const U={ uHexV:{value:hexTex(H.v)}, uHexNoise:{value:hexTex(H.noise,true)}, uHexK:{value:new THREE.Vector4(XLIT.hexRough,XLIT.hexRoughOff,XLIT.hexMetal,XLIT.hexWear)}, uHexMoss:{value:hexMean(H.joint).multiplyScalar(1.6)} };
  m.userData.hexU=U; m.userData.xmold=1;
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute vec4 aHexVar; varying vec4 vHexVar; varying vec2 vHexW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vHexVar=aHexVar; vHexW=(modelMatrix*vec4(position,1.)).xz;');
    sh.fragmentShader='uniform sampler2D uHexV; uniform sampler2D uHexNoise; uniform vec4 uHexK; uniform vec3 uHexMoss; varying vec4 vHexVar; varying vec2 vHexW;\n'+sh.fragmentShader
      .replace('#include <map_fragment>',`#include <map_fragment>
  vec4 hv=texture2D(uHexV,vUv); float hn=texture2D(uHexNoise,vHexW/9.).r-.5;
  diffuseColor.rgb*=(1.+vHexVar.x)*(1.+(hv.b-.5)*.1)*(1.+hn*.08);                       // the tile's tone, its colour patches, the board's drift
  diffuseColor.rgb*=(1.+.25*vHexVar.y*uHexK.w*hv.r)*(1.-.3*vHexVar.z*hv.g);               // worn edges lighter, cracks and chips darker
  diffuseColor.rgb=mix(diffuseColor.rgb,uHexMoss,.4*vHexVar.w*hv.a);`)                     // moss and staining
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n  roughnessFactor=clamp(roughnessFactor*uHexK.x+uHexK.y+.08*hv.g,.04,1.);')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n  metalnessFactor*=uHexK.z;'); };
  m.customProgramCacheKey=()=>'hexfloor';
  HEX_MATS.add(m); return m; }
// the stand-in tile: the area's slab, faint, in a hex with a bevel from its distance to the edge (xLitTag makes the relief)
function hexStandIn(Ar){ const N=256, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d');
  const src=xSlabFloor(Ar.stone||AREAS[0].stone,(Ar.index||0)*31+5,0); x.drawImage(src,0,0,N,N);
  const im=x.getImageData(0,0,N,N), d=im.data; let r=0,g=0,b=0; for(let i=0;i<N*N;i++){ r+=d[i*4]; g+=d[i*4+1]; b+=d[i*4+2]; } r/=N*N; g/=N*N; b/=N*N;
  const H=new Float32Array(N*N), hp=ARENA_HEX.hexR, ri=hp*Math.sqrt(3)/2;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const o=j*N+i, dx=i+.5-N/2, dy=j+.5-N/2; let dd=0; for(let k=0;k<6;k++){ const a=k*Math.PI/3; dd=Math.max(dd,dx*Math.cos(a)+dy*Math.sin(a)); }
    const e=Math.max(0,1-dd/ri), bev=Math.min(1,e/.12);
    d[o*4]=r+(d[o*4]-r)*.3; d[o*4+1]=g+(d[o*4+1]-g)*.3; d[o*4+2]=b+(d[o*4+2]-b)*.3;
    const lit=1+(1-bev)*.12; d[o*4]*=lit; d[o*4+1]*=lit; d[o*4+2]*=lit;
    H[o]=bev*4-Math.max(0,e-.5)*.6; }
  x.putImageData(im,0,0); c.h=H; c.hk=.6; c.pbr='slab'; return c; }
// the overlay layers every board has (arena.js): the glow added on (state highlights) and the outline guide
function hexOverlays(rad){ const gpos=[], gcol=[]; TILES.forEach(t=>{ t._g0=gpos.length/3; const cx=t.wz, cz=-t.wx;
    const C=tileCornerOffs(rad).map(([dx,dz])=>[cx+dz,cz-dx]); for(let i=0;i<C.length;i++){ const a=C[i], b=C[(i+1)%C.length]; gpos.push(cx,.012,cz, b[0],.012,b[1], a[0],.012,a[1]); gcol.push(0,0,0,0,0,0,0,0,0); } });
  const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.Float32BufferAttribute(gpos,3)); gg.setAttribute('color',new THREE.Float32BufferAttribute(gcol,3));
  const glow=new THREE.Mesh(gg,arMat(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}))); glow.renderOrder=1;
  const lp=[], lc=[]; const side=t=>t.side==='p'?[.5,.83,1]:t.side==='e'?[.59,.65,.7]:[.22,1,.54];
  for(const t of TILES){ const cx=t.wz, cz=-t.wx, c=side(t), f=t.side==='p'?.5:t.side==='e'?.32:.5, fi=t.side==='p'?.14:.08;
    const C=tileCornerOffs(rad).map(([dx,dz])=>[cx+dz,cz-dx]); for(let i=0;i<C.length;i++){ const [ax,az]=C[i], [bx,bz]=C[(i+1)%C.length];
      lp.push(ax,.02,az,bx,.02,bz); lc.push(...c.map(v=>v*f),...c.map(v=>v*f));
      if(t.side!=='n'&&!SQUARE){ lp.push(cx,.02,cz,ax,.02,az); lc.push(...c.map(v=>v*fi),...c.map(v=>v*fi)); } } }
  const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3)); lg.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
  const lm=arMat(new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})), lines=new THREE.LineSegments(lg,lm); lines.renderOrder=2;
  lm.userData.hexLines=1; return {glow,lines}; }
// the joints: one slab under the board, its top the area's joint fill (tiled in world space), its sides down to the floor
function hexJoint(Ar,H){ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wz); x1=Math.max(x1,t.wz); z0=Math.min(z0,-t.wx); z1=Math.max(z1,-t.wx); }
  const W=x1-x0+2.1, D=z1-z0+2.1, Hh=SLAB-.05, g=new THREE.BoxGeometry(W,Hh,D);
  const p=g.attributes.position, uv=g.attributes.uv; for(let i=0;i<p.count;i++){ const X=p.getX(i)+(x0+x1)/2, Y=p.getY(i), Z=p.getZ(i)+(z0+z1)/2; const ny=g.attributes.normal.getY(i);
    if(Math.abs(ny)>.5) uv.setXY(i,X/3,Z/3); else uv.setXY(i,(X+Z)/3,Y/3); }
  g.setAttribute('uv2',uv.clone());
  let m; if(H){ const J=hexTex(H.joint,true), JM=hexTex(H.jointM,true); m=new THREE.MeshStandardMaterial({map:J, normalMap:hexTex(H.jointN,true), aoMap:JM, roughnessMap:JM, metalnessMap:JM, roughness:1, metalness:1}); }
  else { const c=xRockFloor(Ar.stone||AREAS[0].stone,(Ar.index||0)*17+3), t=arTex(xTex(c,true)); m=xLitTag(xPhong({map:t,color:0x8c8c8c}),1,c); }
  m.userData.hexJoint=1; m.userData.xmold=1; const mesh=new THREE.Mesh(g,arMat(m)); mesh.position.set((x0+x1)/2,-.05-Hh/2,(z0+z1)/2); mesh.userData.caveFloor=1; return mesh; }
/* The board (arena.js arenaBoard, for a hex board): {mesh, joint, glow, lines, art} — mesh keeps arenaBoard's contract
   (t._v0..t._v1 and a colour attribute per tile). */
function arHexFloor(A,Ar,R){ HEX_MATS.clear(); const H=typeof envArtHex==='function'?envArtHex(Ar.id):null, P=hexPicks();
  let mesh;
  if(H){ const g=hexGeo(P,ARENA_HEX.cols,ARENA_HEX.rows,ARENA_HEX.cell,ARENA_HEX.hexR); mesh=new THREE.Mesh(g,arMat(xLitTag(hexMat(H),1))); }
  else { const cv=hexStandIn(Ar), tex=arTex(xTex(cv,false)); tex.magFilter=THREE.LinearFilter; tex.minFilter=THREE.LinearMipmapLinearFilter;
    const P1=new Map([...P].map(([t,p])=>[t,Object.assign({},p,{v:0})])), g=hexGeo(P1,1,1,256,ARENA_HEX.hexR); mesh=new THREE.Mesh(g,arMat(xLitTag(xPhong({map:tex,vertexColors:true,pbr:'slab'}),1,cv))); }
  mesh.renderOrder=0; const joint=hexJoint(Ar,H), {glow,lines}=hexOverlays(HEX_R);
  lines.material.opacity=XLIT.hexLines;
  return {mesh, joint, glow, lines, art:!!H}; }
// the debug menu's Arena floor rows, live
function hexTune(){ for(const m of HEX_MATS){ const U=m.userData.hexU; if(!U) continue; U.uHexK.value.set(XLIT.hexRough,XLIT.hexRoughOff,XLIT.hexMetal,XLIT.hexWear); m.normalScale.set(XLIT.hexNrm,XLIT.hexNrm); m.aoMapIntensity=XLIT.hexAO; }
  if(typeof AR!=='undefined'&&AR&&AR.board){ if(AR.board.lines) AR.board.lines.material.opacity=XLIT.hexLines; if(AR.board.sideGlow) AR.board.sideGlow.material.opacity=XLIT.hexGlow;
    if(AR.board.growth) for(const k in AR.board.growth) if(AR.board.growth[k]) AR.board.growth[k].visible=XLIT.hexGrowth; } }
