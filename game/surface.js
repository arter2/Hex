/* Hexmancers — surfaces: texture coordinates and material for everything lit that has no texture of its own.
   The floors and walls are painted textures with normal maps. Everything else in the 3D scenes (furniture, door frames,
   arches, rocks, barrels, pillars, puzzle pieces, the battle arenas' props) was plain colour with no texture
   coordinates, so the lighting had nothing to work with. Each such material is now given:
     texture coordinates  worked out on the card from each face's own position, along the face's main direction and
                          at the object's real size (instances and scaled meshes included), so the grain never stretches
                          and has the same density on a crate, a door frame and a boulder
     a material           stone, wood, metal or bone/cloth, read from the surface's own colour (its vertex colour
                          included), from a small atlas of four tileable pixel-art textures
     a normal map         the same atlas's relief, so joints, grain and pits catch the light (the debug menu's normal
                          map switch turns it off with the rest)
   It joins every material the lighting already handles (look.js xLit): nothing to do at each place a thing is built.
   The chests are rebuilt here too: bevelled planks with their own texture and normal map, a rounded lid, iron straps,
   corner guards, a lock plate and feet (xChestBuild). */

const XPROJ={ tile:1.6, strength:1.0 };   // world units one tile of the atlas covers; how strong its relief is
let XPROJ_TEX=null;
// the atlas: four 64 px tiles (stone, wood, metal, bone/cloth) in a 128 px square; red is the albedo shade, a second
// texture holds the normals (each tile wraps on itself, so it repeats without a seam)
function xProjAtlas(){ if(XPROJ_TEX) return XPROJ_TEX; const T=64, N=128, R=caveRng(9091);
  const al=document.createElement('canvas'); al.width=al.height=N; const ax=al.getContext('2d'), aim=ax.createImageData(N,N);
  const nm=document.createElement('canvas'); nm.width=nm.height=N; const nx=nm.getContext('2d');
  const fb=(b)=>xFbm(T,R,b), nz=(c)=>xNoise(T,c,R);
  const tiles=[
    // stone: blotches, grit and a few pits
    (()=>{ const f=fb(3), g=fb(16), p=nz(10); return (i,j)=>{ let h=f(i,j)*4+g(i,j)*2; const q=p(i,j); if(q<.2) h-=(.2-q)*14; return h; }; })(),
    // wood: grain running down the face, wavy, with a knot or two
    (()=>{ const w=fb(4), k=nz(3); return (i,j)=>{ const u=i+w(i,j)*10+Math.sin(j/T*6.283*2)*1.5, gr=Math.sin(u/T*6.283*9)*.5+.5, kn=Math.max(0,.18-Math.abs(k(i,j)-.5))*8; return gr*1.6+w(i,j)*1.2-kn*2; }; })(),
    // metal: fine brushed streaks across, a few scratches, slight hammering
    (()=>{ const s=xNoise(T,32,R), f=fb(4), sc=nz(7); return (i,j)=>{ let h=s(i>>3,j)*.8+f(i,j)*1.6; if(Math.abs(sc(i,j)-.5)<.012) h-=1.2; return h; }; })(),
    // bone, wax, cloth: soft mottling and a weave of fine fibres
    (()=>{ const f=fb(4), g=fb(12); return (i,j)=>f(i,j)*2+g(i,j)*1+((i+j)%4===0?.25:0); })() ];
  tiles.forEach((fn,k)=>{ const ox=(k%2)*T, oy=(k>>1)*T, H=new Float32Array(T*T); let lo=1e9, hi=-1e9;
    for(let j=0;j<T;j++) for(let i=0;i<T;i++){ const v=fn(i,j); H[j*T+i]=v; lo=Math.min(lo,v); hi=Math.max(hi,v); }
    for(let j=0;j<T;j++) for(let i=0;i<T;i++){ const v=(H[j*T+i]-lo)/Math.max(1e-6,hi-lo), o=((oy+j)*N+ox+i)*4, q=Math.round(v*6)/6;   // a few steps: it stays pixel art
      aim.data[o]=aim.data[o+1]=aim.data[o+2]=Math.round(q*255); aim.data[o+3]=255; }
    const n=xNormalMapWH(H,T,T,k===2?.9:1.1); nx.drawImage(n,ox,oy); });
  ax.putImageData(aim,0,0);
  const mk=cv=>{ const t=new THREE.CanvasTexture(cv); t.magFilter=t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; return t; };
  XPROJ_TEX={al:mk(al),nm:mk(nm)}; return XPROJ_TEX; }
// which materials get it: lit, with no texture and no normal map of their own (look.js xLit asks)
function xProjWants(m){ return !!m&&(m.isMeshPhongMaterial||m.isMeshStandardMaterial)&&!m.map&&!m.normalMap&&!(m.userData&&(m.userData.nmap||m.userData.noProj)); }
function xProjShader(sh){ const T=xProjAtlas(); sh.uniforms.uXPA={value:T.al}; sh.uniforms.uXPN={value:T.nm};
  sh.vertexShader='varying vec3 vXPP; varying vec3 vXPN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  { vec3 xpp=transformed, xpn=objectNormal;\n  #ifdef USE_INSTANCING\n  xpp=(instanceMatrix*vec4(xpp,1.0)).xyz-instanceMatrix[3].xyz; xpn=mat3(instanceMatrix)*xpn;\n  #endif\n'
    +'  vXPP=xpp*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz)); vXPN=xpn; }');
  const F='varying vec3 vXPP; varying vec3 vXPN; uniform sampler2D uXPA; uniform sampler2D uXPN; vec2 xpUV; vec2 xpAUV;\n'
    // the face's coordinates: along its main direction, a tile per XPROJ.tile units
    +'vec2 xpCoord(){ vec3 a=abs(vXPN); vec2 uv=a.x>=a.y&&a.x>=a.z?vXPP.zy:a.y>=a.z?vXPP.xz:vXPP.xy; return uv/'+XPROJ.tile.toFixed(2)+'; }\n'
    // what it is made of, from its colour: dark grey or gold/brass is metal, warm brown is wood, pale is bone or cloth, the rest stone
    +'float xpKind(vec3 c){ float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b)), s=mx-mn; bool warm=c.r>=c.g&&c.g>=c.b;\n'
    +'  if(mx<.2&&s<.06) return 2.0; if(warm&&c.r>.55&&s>.3&&c.g>.35) return 2.0; if(warm&&s>.1&&mx<.7) return 1.0; if(mx>.72&&s<.25) return 3.0; return 0.0; }\n'
    // the tangent frame from the screen-space change of the (unwrapped) coordinates, as three.js does for its own normal maps
    +'vec3 xpPerturb(vec3 eye,vec3 N,vec3 mapN,vec2 uv){ vec3 q0=dFdx(eye), q1=dFdy(eye); vec2 st0=dFdx(uv), st1=dFdy(uv); vec3 q1p=cross(q1,N), q0p=cross(N,q0);\n'
    +'  vec3 T=q1p*st0.x+q0p*st1.x, B=q1p*st0.y+q0p*st1.y; float det=max(dot(T,T),dot(B,B)), sc=det==0.0?0.0:inversesqrt(det); return normalize(T*(mapN.x*sc)+B*(mapN.y*sc)+N*mapN.z); }\n';
  sh.fragmentShader=F+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  { xpUV=xpCoord(); float k=xpKind(diffuseColor.rgb); xpAUV=(vec2(mod(k,2.0),floor(k/2.0))+fract(xpUV))*.5;\n    diffuseColor.rgb*=.74+texture2D(uXPA,xpAUV).r*.52; }')
    .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n  #ifdef XPROJ_N\n  { vec3 mapN=texture2D(uXPN,xpAUV).xyz*2.0-1.0; mapN.xy*='+XPROJ.strength.toFixed(2)+'; normal=xpPerturb(-vViewPosition,normal,mapN,xpUV); }\n  #endif'); }

/* ---------------- geometry helpers: bevelled boxes with real texture coordinates ---------------- */
// a box whose twelve edges are cut back by b (two facets each, so they read as rounded), flat-shaded so each facet
// takes the light on its own
function xChamferBox(w,h,d,b){ const g=new THREE.BoxGeometry(w,h,d,3,3,3), P=g.attributes.position, H=[w/2,h/2,d/2];
  for(let i=0;i<P.count;i++){ const v=[P.getX(i),P.getY(i),P.getZ(i)];
    for(let a=0;a<3;a++) if(Math.abs(Math.abs(v[a])-H[a]/3)<1e-5) v[a]=Math.sign(v[a])*(H[a]-b);   // the inner loops, just in from each edge
    const ext=[0,1,2].filter(a=>Math.abs(Math.abs(v[a])-H[a])<1e-5); if(ext.length>=2) for(const a of ext) v[a]=Math.sign(v[a])*(H[a]-b/2);
    P.setXYZ(i,v[0],v[1],v[2]); }
  const n=g.toNonIndexed(); n.computeVertexNormals(); return n; }
// texture coordinates from each triangle's own facing, s world units to a tile (u along the face, v up it)
function xBakeUV(g,s){ const P=g.attributes.position, U=new Float32Array(P.count*2), a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3(), n=new THREE.Vector3();
  for(let t=0;t<P.count;t+=3){ a.fromBufferAttribute(P,t); b.fromBufferAttribute(P,t+1); c.fromBufferAttribute(P,t+2); n.subVectors(c,b).cross(a.clone().sub(b)); const x=Math.abs(n.x), y=Math.abs(n.y), z=Math.abs(n.z);
    for(let k=0;k<3;k++){ const p=[a,b,c][k], uv=x>=y&&x>=z?[p.z,p.y]:y>=z?[p.x,p.z]:[p.x,p.y]; U[(t+k)*2]=uv[0]/s; U[(t+k)*2+1]=uv[1]/s; } }
  g.setAttribute('uv',new THREE.BufferAttribute(U,2)); return g; }

/* ---------------- the chest ----------------
   A plank body with its edges bevelled, on four feet; a rounded (barrel) lid hinged along the back; two iron straps
   over body and lid, iron guards up the corners, a lock plate with its keyhole on the front and a hasp hanging from the
   lid. The wood has its own planks texture (planks laid along the chest, seams, grain and nail heads) and its normal
   map; the iron and gold take the atlas's metal (xProjShader). A rich chest's lid is purple and its fittings gold; a
   legendary hoard's gold glows. The lid turns about the hinge as before (explore.js xLidTick). */
const XCHEST={ W:1.0, H:.44, D:.64, R:.32, LY:.62, FOOT:.05 };
function xChestPlanks(){ if(XCHEST.tex) return XCHEST; const N=64, R=caveRng(31337), f=xFbm(N,R,4), g=xNoise(N,24,R), H=new Float32Array(N*N), base=[[122,74,34],[108,64,28],[132,82,40],[116,70,32]];
  const c=xPaint(N,(i,j)=>{ const p=j>>4, v=j&15, t=base[p], gr=g(i,(j*3)%N), o=j*N+i;
    let k=.86+gr*.22+(f(i,j)-.5)*.2; H[o]=2+gr*.8;
    if(v===15){ k=.32; H[o]=-1; } else if(v===0){ k+=.12; }                    // the seam under each plank, its lit top edge
    const nail=(i%32===4||i%32===5)&&(v===7||v===8); if(nail){ H[o]=3; return [70,66,62]; }
    return t.map(x=>Math.max(0,Math.min(255,Math.round(x*k)))); });
  c.h=H; c.hk=.6; XCHEST.cv=c; XCHEST.tex=xTex(c,true);
  // the shapes, once
  const {W,H:BH,D,R:LR,LY,FOOT}=XCHEST;
  const body=xBakeUV(xChamferBox(W,BH,D,.035).translate(0,FOOT+BH/2,0),.64);
  const lid=new THREE.CylinderGeometry(LR,LR,W,14,1,false,Math.PI,Math.PI); lid.rotateZ(-Math.PI/2); lid.scale(1,LY,1); lid.translate(0,0,D/2); lid.computeVertexNormals();
  { const U=lid.attributes.uv, P=lid.attributes.position, Nn=lid.attributes.normal; for(let i=0;i<U.count;i++){ if(Math.abs(Nn.getX(i))>.9){ U.setXY(i,P.getZ(i)/.64,P.getY(i)/.64); continue; }   // the ends: up and across
      U.setXY(i,P.getX(i)/.64,(Math.atan2(P.getY(i)/LY,P.getZ(i)-D/2))*LR/.64); } }   // the curve: planks along the chest
  XCHEST.body=body; XCHEST.lid=lid; return XCHEST; }
function xChestBuild(c){ const K=xChestPlanks(), {W,H:BH,D,R:LR,LY,FOOT}=K;
  const wood=xLitTag(xPhong({map:K.tex,shininess:6,specular:0x161210}),2,K.cv), lidWood=xLitTag(xPhong({map:K.tex,color:c.rich?0xa888d8:0xffffff,shininess:6,specular:0x161210}),2,K.cv);
  const fit=c.rich?0xc8a040:0x34343a, glow=c.legend?0x806010:c.rich?0x2a1c06:0x000000;
  const ironM=xPhong({vertexColors:true,shininess:c.rich?50:30,specular:c.rich?0x806a30:0x303038,emissive:glow});
  const g=new THREE.Group(); g.position.set(xw(c.cell),0,xz(c.cell)); g.rotation.y=(Math.random()-.5)*.6;
  g.add(new THREE.Mesh(K.body,wood));
  // the body's iron: two straps, four corner guards, the lock plate and its keyhole, four feet
  const I=xMerger(), y0=FOOT, y1=FOOT+BH, keyC=0x0a0a0c;
  for(const sx of [-.3,.3]) I.add(xChamferBox(.08,BH+.02,D+.03,.012),fit,sx,y0+BH/2,0);
  for(const sx of [-1,1]) for(const sz of [-1,1]) I.add(xChamferBox(.07,BH+.015,.07,.01),fit,sx*(W/2-.025),y0+BH/2,sz*(D/2-.025));
  I.add(xChamferBox(.17,.19,.03,.01),fit,0,y1-.12,D/2+.012); I.add(XG.box,keyC,0,y1-.14,D/2+.03,0,0,0,.03,.06,.01); I.add(XG.ball,keyC,0,y1-.1,D/2+.03,0,0,0,.04,.04,.01);
  for(const sx of [-1,1]) for(const sz of [-1,1]) I.add(xChamferBox(.11,FOOT+.01,.11,.012),fit,sx*(W/2-.06),FOOT/2,sz*(D/2-.06));
  g.add(I.build(ironM));
  // inside: dark boards just under the rim, and a glint of what it holds (seen while the lid is up)
  { const inner=new THREE.Mesh(xBakeUV(xChamferBox(W-.09,.012,D-.09,.004),.64).translate(0,y1+.002,0),xLitTag(xPhong({map:K.tex,color:0x3a2a20,shininess:4}),2,K.cv)); g.add(inner);
    const hoard=new THREE.Mesh(new THREE.SphereGeometry(.5,8,4,0,Math.PI*2,0,Math.PI/2),xPhong({color:c.legend||c.rich?0xf2c94c:0xb08a3a,shininess:60,specular:0x806a30,emissive:c.legend?0x403008:0x100a02})); hoard.scale.set(W*.8,.1,D*.75); hoard.position.y=y1-.02; g.add(hoard); }
  // the lid, about its hinge along the back top edge
  const lid=new THREE.Group(); lid.position.set(0,y1,-D/2); lid.add(new THREE.Mesh(K.lid,lidWood));
  const L=xMerger(), strap=new THREE.CylinderGeometry(LR+.014,LR+.014,.08,14,1,true,Math.PI,Math.PI); strap.rotateZ(-Math.PI/2); strap.scale(1,LY,1); strap.computeVertexNormals();
  for(const sx of [-.3,.3]) L.add(strap,fit,sx,0,D/2);
  // the lid's iron rim where it meets the body: four bars round the edge (an open frame, so the boards inside show)
  L.add(xChamferBox(W+.02,.04,.03,.01),fit,0,.02,D+.005); L.add(xChamferBox(W+.02,.04,.03,.01),fit,0,.02,-.005);
  for(const sx of [-1,1]) L.add(xChamferBox(.03,.04,D,.01),fit,sx*(W/2+.005),.02,D/2);
  lid.add(new THREE.Mesh(xBakeUV(xChamferBox(W-.04,.02,D-.04,.006),.64).translate(0,.015,D/2),xLitTag(xPhong({map:K.tex,color:0x8a6a50,shininess:4}),2,K.cv)));   // the boards on the lid's underside
  L.add(xChamferBox(.09,.13,.025,.01),fit,0,-.02,D+.014);   // the hasp, hanging over the lock
  lid.add(L.build(ironM)); g.add(lid);
  if(c.open) lid.rotation.x=-1.9;
  g.userData.lid=lid; g.visible=false; c.mesh=g; return g; }
