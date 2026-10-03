/* Sprite lab core: 3D models -> pixel-art frames.
   Every frame is rendered in five passes (albedo, light with shadows, view normals, depth, part id)
   and combined per pixel into 5 hue-shifted tone bands, a cool rim light, metal glints, inner
   contour lines where one part overlaps another, and a coloured outline. One world scale
   (PPU pixels per unit) for every model so sizes stay consistent; bosses get bigger cells. */
(function(){
const T=THREE;
const LAB=window.LAB={};
const PPU=LAB.PPU=33;            // pixels per world unit for every character
const EL=30*Math.PI/180;          // camera elevation

/* ---------- part helpers ---------- */
let pidN=0;
const M=LAB.M=(c,o={})=>({c:new T.Color(c),glow:!!o.glow,metal:o.metal||0,side:o.side||T.FrontSide,soft:!!o.soft});
LAB.mesh=(geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{ const o=new T.Mesh(geo); o.userData.m=m; o.userData.pid=1+(pidN++%250);
  o.position.set(x,y,z); o.rotation.set(rx,ry,rz); o.castShadow=!m.glow; o.receiveShadow=true; return o; };
LAB.grp=(p,x=0,y=0,z=0)=>{ const o=new T.Group(); o.position.set(x,y,z); if(p) p.add(o); return o; };
LAB.add=(p,...a)=>{ const o=LAB.mesh(...a); p.add(o); return o; };
const G=LAB.G={
  cyl:(rt,rb,h,s=10)=>new T.CylinderGeometry(rt,rb,h,s),
  box:(w,h,d)=>new T.BoxGeometry(w,h,d),
  sph:(r,w=12,h=10)=>new T.SphereGeometry(r,w,h),
  cap:(r,phi=.55,w=12,h=8)=>new T.SphereGeometry(r,w,h,0,Math.PI*2,0,Math.PI*phi),
  cone:(r,h,s=10)=>new T.ConeGeometry(r,h,s),
  tor:(r,t,rs=6,ts=14,arc)=>new T.TorusGeometry(r,t,rs,ts,arc),
  oct:r=>new T.OctahedronGeometry(r),
  ico:(r,d=0)=>new T.IcosahedronGeometry(r,d),
  dod:r=>new T.DodecahedronGeometry(r),
  lathe:(pts,s=14)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),s),
  // a robe: lathe whose radius ripples into folds, deeper toward the hem
  robe:(pts,folds=7,amp=.028,s=42)=>{ const g=new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),s), p=g.attributes.position;
    const ys=pts.map(q=>q[1]), top=Math.max(...ys), bot=Math.min(...ys);
    for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), y=p.getY(i), a=Math.atan2(x,z), d=(top-y)/(top-bot||1);
      const k=1+amp*d*Math.sin(a*folds+Math.sin(a*3)*.8)/Math.max(.12,Math.hypot(x,z)); p.setX(i,x*k); p.setZ(i,z*k); }
    g.computeVertexNormals(); return g; },
  // cloth panel hanging down from y=0: widened toward the bottom by k, rippled into folds
  cloth:(w,h,k=1.4,folds=3,amp=.03,d=.03)=>{ const g=new T.BoxGeometry(w,h,d,12,8,1), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const y=p.getY(i), t=(h/2-y)/h; p.setX(i,p.getX(i)*(1+(k-1)*t)); p.setZ(i,p.getZ(i)+amp*t*Math.sin(p.getX(i)/w*Math.PI*2*folds)); }
    g.computeVertexNormals(); return g; },
  // a box whose bottom (y<0) is widened by k: capes, skirts, tabards
  trap:(w,h,d,k)=>{ const g=new T.BoxGeometry(w,h,d), p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<0) p.setX(i,p.getX(i)*k); g.computeVertexNormals(); return g; },
  // a tapered tube through points (tails, tentacles, horns)
  tube:(pts,r0,r1,seg=12,rs=6)=>{ const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))); const g=new T.TubeGeometry(c,seg,1,rs,false);
    const p=g.attributes.position, n=(seg+1); // scale radius along length
    const pts2=c.getSpacedPoints(seg);
    for(let i=0;i<=seg;i++){ const r=r0+(r1-r0)*i/seg, ce=c.getPointAt(i/seg); for(let j=0;j<=rs;j++){ const k=i*(rs+1)+j; const v=new T.Vector3(p.getX(k),p.getY(k),p.getZ(k)).sub(ce).multiplyScalar(r).add(ce); p.setXYZ(k,v.x,v.y,v.z); } }
    g.computeVertexNormals(); return g; },
  // a rough rock: icosahedron with jittered vertices (seeded)
  rock:(r,seed=1,j=.25,d=1)=>{ const g=new T.IcosahedronGeometry(r,d), p=g.attributes.position; let s=seed*9301+49297;
    const rnd=()=>((s=(s*9301+49297)%233280)/233280); const map=new Map();
    for(let i=0;i<p.count;i++){ const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join(); if(!map.has(key)) map.set(key,1+(rnd()-.5)*2*j); const f=map.get(key); p.setXYZ(i,p.getX(i)*f,p.getY(i)*f,p.getZ(i)*f); }
    g.computeVertexNormals(); return g; },
};

/* ---------- renderer and passes ---------- */
const R=LAB.renderer=new T.WebGLRenderer({antialias:false,alpha:true,preserveDrawingBuffer:true});
R.setPixelRatio(1); R.setClearColor(0,0); R.shadowMap.enabled=true; R.shadowMap.type=T.BasicShadowMap;
const scene=LAB.scene=new T.Scene();
const amb=new T.AmbientLight(0xffffff,.4); scene.add(amb);
const key=new T.DirectionalLight(0xffffff,.92); key.position.set(-3.2,6,4.2); key.castShadow=true;
key.shadow.mapSize.set(2048,2048); const sc=key.shadow.camera; sc.left=-5; sc.right=5; sc.top=7; sc.bottom=-3; sc.near=.5; sc.far=30;
key.shadow.bias=-.0015; key.shadow.normalBias=.015; scene.add(key); scene.add(key.target);
const lambert=[new T.MeshLambertMaterial({color:0xffffff}),new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide})];
const white=new T.MeshBasicMaterial({color:0xffffff});
const normalM=[new T.MeshNormalMaterial(),new T.MeshNormalMaterial({side:T.DoubleSide})];
const depthM=[new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide})];
const basicCache=new Map();
const basic=(c,side)=>{ const k=c.getHexString()+side; if(!basicCache.has(k)) basicCache.set(k,new T.MeshBasicMaterial({color:c,side})); return basicCache.get(k); };
function setPass(root,pass){ root.traverse(o=>{ if(!o.isMesh) return; const m=o.userData.m, d=m.side===T.DoubleSide?1:0;
  if(pass==='albedo') o.material=basic(m.c,m.side);
  else if(pass==='light') o.material=m.glow?white:lambert[d];
  else if(pass==='normal') o.material=normalM[d];
  else if(pass==='depth') o.material=depthM[d];
  else if(pass==='flags') o.material=basic(new T.Color((m.glow?255:m.soft?128:0)/255,Math.round(m.metal*255)/255,o.userData.pid/255),m.side); }); }

function camFor(size,base){ const h=size/PPU, c=new T.OrthographicCamera(-h/2,h/2,h/2,-h/2,.1,60);
  const ty=(h/2-base/PPU)/Math.cos(EL); c.position.set(0,ty+20*Math.sin(EL),20*Math.cos(EL)); c.lookAt(0,ty,0); c.updateMatrixWorld(); return c; }
LAB.camFor=camFor;

let RT=null;
function grab(size){ const b=new Uint8Array(size*size*4); R.readRenderTargetPixels(RT,0,0,size,size,b);
  const o=new Uint8Array(size*size*4); for(let y=0;y<size;y++) o.set(b.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); return o; }

/* ---------- shading ---------- */
const COOL=[42,34,84], COOL2=[46,62,110], WARM=[255,238,196], RIM=[200,236,255], INK=[14,10,22];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
function tone(A,band){ switch(band){
  case 0: return mix(mul(A,.4),COOL,.3);
  case 1: return mix(mul(A,.66),COOL2,.14);
  case 2: return A;
  case 3: return mix(mul(A,1.12),WARM,.16);
  default: return mix(mul(A,1.22),WARM,.42); } }
const clamp=v=>v<0?0:v>255?255:v;
// light direction in view space for highlights (upper left, toward camera)
const LV=new T.Vector3(-.55,.62,.56).normalize(), HV=LV.clone().add(new T.Vector3(0,0,1)).normalize();

LAB.render=function(root,size,base,opts={}){
  const cam=camFor(size,base==null?Math.round(size*.06):base);
  if(!RT||RT.width!==size){ if(RT) RT.dispose(); RT=new T.WebGLRenderTarget(size,size,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true}); }
  R.setRenderTarget(RT);
  scene.add(root); root.updateMatrixWorld(true);
  const P={};
  for(const pass of ['albedo','light','normal','depth','flags']){ setPass(root,pass); R.setClearColor(0,0); R.clear(); R.render(scene,cam); P[pass]=grab(size); }
  R.setRenderTarget(null); scene.remove(root);
  const N=size*size, out=new Uint8ClampedArray(N*4), a=new Uint8Array(N), band=new Int8Array(N), dep=new Float32Array(N), pid=new Uint8Array(N);
  for(let i=0;i<N;i++){ const k=i*4; a[i]=P.albedo[k+3]>=128?1:0; if(!a[i]) continue;
    const d=P.depth; dep[i]=(d[k]/16777216+d[k+1]/65536+d[k+2]/256+d[k+3])/255;   // three's RGBA depth packing
    pid[i]=P.flags[k+2]; }
  for(let i=0;i<N;i++){ if(!a[i]) continue; const k=i*4;
    const A=[P.albedo[k],P.albedo[k+1],P.albedo[k+2]], glow=P.flags[k]>200, soft=P.flags[k]>100&&P.flags[k]<=200, metal=P.flags[k+1]/255;
    if(glow){ const nz=P.normal[k+2]/127.5-1; const c=nz>.75?mix(A,[255,255,255],.45):nz>.4?A:mul(A,.82); out.set([clamp(c[0]),clamp(c[1]),clamp(c[2]),255],k); band[i]=9; continue; }
    const nx=P.normal[k]/127.5-1, ny=P.normal[k+1]/127.5-1, nz=P.normal[k+2]/127.5-1;
    let v=P.light[k]/255*1.05;
    const rim=Math.max(0,nx*.85+ny*.25)*Math.pow(Math.max(0,1-nz),1.6);
    const spec=Math.pow(Math.max(0,nx*HV.x+ny*HV.y+nz*HV.z),metal>0?18:40);
    v+=spec*(metal>0?1.1*metal:.12);
    // metal reflects the room: bright from above, dark from below, sharp glints
    if(metal>0){ const env=.32+.62*Math.max(0,ny)+.25*Math.max(0,-nx)*nz+spec*1.3; v=v*(1-.65*metal)+env*.65*metal; v=.5+(v-.5)*1.3; }
    const TH=[.36,.56,.8,1.02]; let b=v<TH[0]?0:v<TH[1]?1:v<TH[2]?2:v<TH[3]?3:4;
    if(soft&&opts.dither!==false){ const px=i%size, py=(i/size)|0; for(let q=0;q<4;q++){ const dd=v-TH[q]; if(Math.abs(dd)<.03&&((px+py)&1)) b=dd<0?q+1:q; } }
    if(soft&&b===4) b=3;
    let c=tone(A,b);
    if(rim>.42&&b<=2) c=mix(tone(A,2),RIM,.38), b=2;
    out.set([clamp(c[0]),clamp(c[1]),clamp(c[2]),255],k); band[i]=b; }
  // inner contour: the far side of an occlusion edge between two parts gets a dark line
  const line=new Uint8Array(N);
  if(opts.inner!==false) for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const i=y*size+x; if(!a[i]||band[i]===9) continue;
    for(const j of [i-1,i+1,i-size,i+size]){ if(j<0||j>=N||!a[j]) continue; if((j===i-1&&x===0)||(j===i+1&&x===size-1)) continue;
      if(pid[j]!==pid[i]&&dep[i]-dep[j]>(opts.gap||.0045)){ line[i]=1; break; } } }
  for(let i=0;i<N;i++) if(line[i]){ const k=i*4; const c=mix([out[k],out[k+1],out[k+2]],INK,.62); out[k]=c[0]; out[k+1]=c[1]; out[k+2]=c[2]; }
  // outline: each outside pixel takes a very dark shade of the colour it borders
  if(opts.outline!==false){ const o2=out.slice();
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const i=y*size+x; if(a[i]) continue; let best=-1;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const xx=x+dx, yy=y+dy; if(xx<0||yy<0||xx>=size||yy>=size) continue; const j=yy*size+xx; if(a[j]){ best=j; break; } }
      if(best>=0){ const k=best*4, c=mix(mul([P.albedo[k],P.albedo[k+1],P.albedo[k+2]],.22),INK,.55); o2.set([c[0],c[1],c[2],255],i*4); } }
    out.set(o2); }
  const c=document.createElement('canvas'); c.width=c.height=size; c.getContext('2d').putImageData(new ImageData(out,size,size),0,0); return c;
};

/* ---------- animation helpers ---------- */
LAB.lerp=(a,b,t)=>a+(b-a)*t; LAB.ease=t=>t*t*(3-2*t);
LAB.keyed=function(base,keys,t){ let i=0; while(i<keys.length-2&&t>=keys[i+1][0]) i++;
  const [t0,a]=keys[i],[t1,b]=keys[i+1], k=LAB.ease(Math.min(1,Math.max(0,(t-t0)/(t1-t0)))), P={...base};
  for(const n in base){ const va=n in a?a[n]:base[n], vb=n in b?b[n]:base[n]; P[n]=va+(vb-va)*k; } return P; };
LAB.SIN=t=>Math.sin(t*Math.PI*2); LAB.COS=t=>Math.cos(t*Math.PI*2);
})();
