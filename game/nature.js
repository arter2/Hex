/* Hexmancers — nature: each area's own natural dressing on a spacious floor.
   Glowworm Hollows, the Frozen Deeps and the Ember Rifts are natural caves (explore.js XNATURAL: rough, lumpy rock
   walls and rock floors, no masonry dressing); the Storm Vault, the Gilded Ruins and the Abyss stay built stonework.
   Every area then gets its own kit (XKIT), all of it scenery that never blocks anyone:
     mite    stalagmites rising along the foot of the walls, and clustered in a cave room's corners
     tite    stalactites (icicles in the Deeps) hanging from the lip of the walls
     rock    boulders half sunk into the foot of the walls (fallen masonry in the built areas)
     clump   moss on the wall tops and at their feet (snow in the Deeps, ash in the Rifts, lichen, fungus)
     vine    creepers hanging down the faces (roots too in the Ruins)
     shard   crystals growing out of the faces, glowing in the area's colour
     tuft    grass in the Ruins' cracks
     patch   the same growth spread on the floor along the walls
     pool    still water (frozen in the Deeps, lava in the Rifts, black water in the Abyss), just for looks
   The pieces are instanced, one mesh per kind, and each belongs to the wall block it stands against: it shows when that
   wall is first seen and follows its height (a low near wall's stalagmites, moss and crystals come down with it, its
   stalactites and creepers go: xNatShow, from explore.js xWallFade). Pools and floor patches lie under the darkness
   veil, so ground you have not found hides them. */

const XKIT={
  hollows:{ mite:{col:['#4a5a60','#5e6e74','#3e4c52'],n:.30}, tite:{col:['#56666f','#46545c'],n:.34}, rock:{col:['#3e4c56','#2c3740'],n:.34},
    clump:{col:['#3f7a3a','#58944a','#2f6a34'],n:.55,top:.75}, vine:{col:['#3f7a3a','#4f8a3a'],n:.22}, shard:{col:['#39ff8a','#8fe4ff'],n:.05,glow:true},
    patch:{col:'#3f7a3a',n:.45}, pool:{kind:'water',col:'#123a36',rim:'#39ff8a',n:3}, corner:.7 },
  deeps:{ mite:{col:['#cfeaff','#e6f6ff','#a8d4f0'],n:.30,ice:true}, tite:{col:['#e6f6ff','#cfeeff'],n:.5,ice:true}, rock:{col:['#40607c','#2a4054'],n:.3},
    clump:{col:['#cfe0ee','#b8cde0'],n:.38,top:.5}, shard:{col:['#7fd4ff','#bfe6ff'],n:.045,glow:true},
    patch:{col:'#e8f4ff',n:.5}, pool:{kind:'ice',col:'#a8d8f0',rim:'#e6f6ff',n:3}, corner:.7 },
  rifts:{ mite:{col:['#2a1c18','#3a2620','#24140f'],n:.32}, tite:{col:['#2e201a','#3a2620'],n:.28}, rock:{col:['#30201a','#1e1412'],n:.36},
    clump:{col:['#2a2624','#3e3632','#1e1a18'],n:.42,top:.6}, shard:{col:['#ff8a3a','#ffd36a'],n:.08,glow:true},
    patch:{col:'#140c0a',n:.45}, pool:{kind:'lava',col:'#ff5a10',rim:'#ffd36a',n:3}, corner:.65 },
  vault:{ rock:{col:['#383552','#25233a'],n:.3,rubble:true}, clump:{col:['#5a52a0','#6e66b8'],n:.28,top:.5}, shard:{col:['#fff39a','#8f86ff'],n:.08,glow:true},
    tite:{col:['#524e72'],n:.1,small:true}, patch:{col:'#3a3460',n:.3}, pool:{kind:'water',col:'#16122e',rim:'#fff39a',n:3} },
  ruins:{ rock:{col:['#4a463e','#33302b'],n:.34,rubble:true}, clump:{col:['#6a7a3a','#5a6a2a','#8a6a2a'],n:.45,top:.7}, vine:{col:['#4a6a2a','#5a7a32'],n:.32},
    root:{col:['#5a4026','#4a3420'],n:.18}, tuft:{col:['#6a8a3a','#8a9a4a'],n:.35}, patch:{col:'#55652a',n:.4}, pool:{kind:'water',col:'#22200e',rim:'#f2c94c',n:2} },
  abyss:{ rock:{col:['#232a36','#161b22'],n:.3,rubble:true}, clump:{col:['#3a2a56','#c8d8e8','#4a3a6a'],n:.3,top:.5}, shard:{col:['#e9fbff','#b48cff'],n:.1,glow:true},
    tite:{col:['#26303a'],n:.16}, patch:{col:'#1a1428',n:.35}, pool:{kind:'black',col:'#03050a',rim:'#e9fbff',n:3} },
};

// lumpy shapes: a geometry pushed in and out by a hash of where each point is (the same point always moves the same)
function xLumpy(g,amp,seed){ const P=g.attributes.position, h=(x,y,z)=>{ const v=Math.sin(x*127.1+y*311.7+z*74.7+seed*13.3)*43758.5453; return v-Math.floor(v); };
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), k=1+(h(Math.round(x*40),Math.round(y*40),Math.round(z*40))-.5)*amp; P.setXYZ(i,x*k,y,z*k); }
  g.computeVertexNormals(); return g; }
const XNG={};   // the shapes, made once
function xNatGeo(){ if(XNG.mite) return XNG;
  XNG.mite=xLumpy(new THREE.ConeGeometry(.5,1,6,2).translate(0,.5,0),.45,1);            // stands on its foot (y 0..1)
  XNG.tite=xLumpy(new THREE.ConeGeometry(.5,1,5,2).rotateX(Math.PI).translate(0,-.5,0),.4,2);   // hangs from its root (y 0..-1)
  XNG.rock=xLumpy(new THREE.DodecahedronGeometry(.5,0),.35,3);
  XNG.block=new THREE.BoxGeometry(1,1,1,1,1,1);
  XNG.clump=xLumpy(new THREE.SphereGeometry(.5,7,3,0,Math.PI*2,0,Math.PI/2),.6,4);      // a dome on the ground
  XNG.vine=(()=>{ const g=new THREE.PlaneGeometry(1,1,1,8).translate(0,-.5,0), P=g.attributes.position; for(let i=0;i<P.count;i++){ const y=P.getY(i); P.setX(i,P.getX(i)*(1-(-y)*.55)+Math.sin(y*9)*.9); P.setZ(i,Math.sin(y*5+1)*.6); } g.computeVertexNormals(); return g; })();   // a strip, waving and thinning as it hangs
  XNG.shard=new THREE.OctahedronGeometry(.5,0).translate(0,.5,0);
  XNG.tuft=new THREE.ConeGeometry(.5,1,4,1).translate(0,.5,0);
  return XNG; }

/* Build the dressing (explore.js xBuildScene, after the walls). R is the floor's own dice, so a floor keeps its look. */
function xNature(grp,A,S,seed){ EX.nat=new Map(); EX.natM=[]; EX.natPools=[];
  if(EX.layout!==2) return; const K=XKIT[A.id]; if(!K) return;
  const R=caveRng(seed+1777), G=xNatGeo(), cave=!!EX.natural, pick=a=>a[R()*a.length|0];
  const floorOK=c=>c>=0&&c<XN*XN&&EX.t[c]===T_FLOOR&&c!==EX.up&&c!==EX.down&&!EX.doors.has(c);
  const busy=new Set([...EX.wallAt.keys(),...(EX.glows||[]).map(L=>L.wall),...(EX.onWall||[]).map(W=>W.wall)]);
  const nearDoorW=c=>xAdj4(c).some(n=>EX.doors.has(n))||[c-XN-1,c-XN+1,c+XN-1,c+XN+1].some(n=>EX.doors.has(n));
  const pz=EX.puzzle&&EX.puzzle.room!=null?EX.puzzle.room:-1;
  // one instanced mesh per kind; pieces are added as [kind, owner wall, spec] and counted first
  const pieces=[], add=(kind,wall,spec)=>pieces.push([kind,wall,spec]);
  // every face of a wall block that looks onto floor: where the pieces go
  for(const c of EX.wIdx.keys()){ if(busy.has(c)) continue; const W=xWedge(c), low=xLow(c);
    const faces=W?[[W.nx,W.nz,0]]:[[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy])=>floorOK(c+dx+dy*XN)).map(([dx,dy])=>[dx,dy,1]);
    if(!faces.length||nearDoorW(c)) continue;
    for(const [dx,dz,off] of faces){ const fx=xw(c)+dx*off*XCS/2, fz=xz(c)+dz*off*XCS/2, tx=-dz, tz=dx;   // the face's middle, and along it
      const at=(a,o)=>[fx+tx*a+dx*o, fz+tz*a+dz*o], fl=c+Math.round(dx)+Math.round(dz)*XN;
      if(EX.room[fl]===pz&&pz>=0) continue;   // a puzzle's room stays clear
      if(K.mite&&!low&&R()<K.mite.n){ const n=1+(R()*3|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.5,.12+R()*.22), h=(.5+R()*1.1)*(k?.6:1); add('mite',c,{x,z,h,r:.16+R()*.14+h*.08,rot:R()*6.3,col:pick(K.mite.col)}); } }
      if(K.rock&&R()<K.rock.n){ const n=1+(R()*2|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.6,.06+R()*.14), s=.16+R()*.3; add(K.rock.rubble&&R()<.5?'block':'rock',c,{x,z,h:s*.7,r:s,rot:R()*6.3,tilt:K.rock.rubble?(R()-.5)*.5:0,col:pick(K.rock.col)}); } }
      if(K.clump&&R()<K.clump.n){ const n=1+(R()*2|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.5,.04+R()*.16), s=.2+R()*.3; add('clump',c,{x,z,h:s*.32,r:s,rot:R()*6.3,col:pick(K.clump.col)}); } }
      if(K.clump&&R()<(K.clump.top||0)){ const n=1+(R()*2|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.5,-.2-R()*.45), s=.25+R()*.35; add('clumpTop',c,{x,z,h:s*.3,r:s,rot:R()*6.3,col:pick(K.clump.col)}); } }
      if(K.tuft&&R()<K.tuft.n){ for(let k=0;k<3+(R()*3|0);k++){ const [x,z]=at((R()-.5)*1.6,.08+R()*.25), h=.2+R()*.3; add('tuft',c,{x,z,h,r:.05+R()*.04,rot:R()*6.3,tilt:(R()-.5)*.5,col:pick(K.tuft.col)}); } }
      if(!low&&K.tite&&R()<K.tite.n){ const n=K.tite.small?1:2+(R()*3|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.6,.1+R()*.12), L=(K.tite.small?.35:.5)+R()*(K.tite.small?.3:1.1); add('tite',c,{x,z,h:L,r:.1+R()*.1+L*.05,rot:R()*6.3,col:pick(K.tite.col)}); } }
      for(const vk of ['vine','root']) if(!low&&K[vk]&&R()<K[vk].n){ const n=3+(R()*4|0); for(let k=0;k<n;k++){ const [x,z]=at((R()-.5)*1.6,.04), L=.8+R()*(vk==='root'?2.6:2); add('vine',c,{x,z,h:L,r:vk==='root'?.1:.06,rot:Math.atan2(dx,dz),tilt:(R()-.5)*.25,col:pick(K[vk].col),root:vk==='root'}); } }
      if(!low&&K.shard&&R()<K.shard.n){ const n=2+(R()*3|0), [bx,bz]=at((R()-.5)*1.2,0), y0=.9+R()*2.2; for(let k=0;k<n;k++){ const s=.2+R()*.3; add('shard',c,{x:bx+tx*(R()-.5)*.5,z:bz+tz*(R()-.5)*.5,y:y0+(R()-.5)*.5,h:s*2.2,r:s,rot:R()*6.3,tilt:.5+R()*.6,dx,dz,col:pick(K.shard.col)}); } } } }
  // a cave room's inside corners: a cluster of stalagmites (they belong to one of the corner's two walls)
  if(cave&&K.mite) for(let c=0;c<XN*XN;c++){ if(!floorOK(c)||EX.room[c]<0||EX.room[c]===pz||EX.taken.has(c)) continue;
    for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ const a=c+dx, b=c+dy*XN; if(!EX.wIdx.has(a)||!EX.wIdx.has(b)||xLow(a)||busy.has(a)||nearDoorW(a)||R()>K.corner) continue;
      const cx=xw(c)+dx*.62, cz=xz(c)+dy*.62; for(let k=0;k<2+(R()*3|0);k++){ const h=.5+R()*1.4*(k?.6:1); add('mite',a,{x:cx+(R()-.5)*.6,z:cz+(R()-.5)*.6,h,r:.18+R()*.14+h*.08,rot:R()*6.3,col:pick(K.mite.col)}); } } }
  // the meshes
  const mats={}, mat=kind=>mats[kind]||(mats[kind]=xNatMat(kind,K)), byKind={};
  for(const p of pieces) (byKind[p[0]]=byKind[p[0]]||[]).push(p);
  const zero=new THREE.Matrix4().makeScale(0,0,0), geoOf={mite:G.mite,tite:G.tite,rock:G.rock,block:G.block,clump:G.clump,clumpTop:G.clump,vine:G.vine,shard:G.shard,tuft:G.tuft};
  // in quarters of the floor (48 x 48 cells), each with its own bounds, so a quarter off screen is not drawn (smaller
  // pieces cost more draw calls than they save: the view takes in most of a floor)
  const CH=48, chunked=[]; for(const kind in byKind){ const by=new Map(); for(const p of byKind[kind]){ const key=((xcy(p[1])/CH)|0)*16+((xcx(p[1])/CH)|0); if(!by.has(key)) by.set(key,[]); by.get(key).push(p); } for(const [key,L] of by) chunked.push([kind,key,L]); }
  for(const [kind,key,L] of chunked){ const im=new THREE.InstancedMesh(geoOf[kind],mat(kind),L.length); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // (growth is drawn darker than its paint: the lamp is strong)
    const col=new THREE.Color(), dim=kind==='shard'?1:kind==='clump'||kind==='clumpTop'?.62:.85; L.forEach(([,wall,spec],k)=>{ im.setMatrixAt(k,zero); col.set(spec.col).multiplyScalar(dim*(.85+R()*.3)); im.setColorAt(k,col); if(!EX.nat.has(wall)) EX.nat.set(wall,[]); EX.nat.get(wall).push([EX.natM.length,k,kind,spec]); });
    const g=new THREE.BufferGeometry(); for(const at in geoOf[kind].attributes) g.setAttribute(at,geoOf[kind].attributes[at]); if(geoOf[kind].index) g.index=geoOf[kind].index; im.geometry=g;   // (its own bounds, the shape shared)
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3(((key%16)+.5)*CH*XCS,XWALL/2,(((key/16)|0)+.5)*CH*XCS),CH*XCS*.75+XWALL); grp.add(im); EX.natM.push(im); }
  xNatPatches(grp,K,R,floorOK,pz); xNatPools(grp,K,R,floorOK,pz); }

function xNatMat(kind,K){ const ice=(kind==='mite'&&K.mite&&K.mite.ice)||(kind==='tite'&&K.tite&&K.tite.ice);
  let m;
  if(kind==='shard') m=new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9});
  else if(ice) m=xPhong({color:0xffffff, shininess:90, specular:0x9fd8ff, transparent:true, opacity:.82, pbr:'ice'});
  else if(kind==='clump'||kind==='clumpTop') m=xPhong({color:0xffffff, shininess:2, specular:0x0a0a0a});
  else if(kind==='vine') m=xPhong({color:0xffffff, shininess:2, specular:0x0a0a0a, side:THREE.DoubleSide});
  else m=xPhong({color:0xffffff, shininess:kind==='block'?6:10, specular:0x161616});
  return typeof xSinkPatch==='function'?xSinkPatch(m):m; }

/* A wall's pieces at its height this moment: cut is the share of a full wall it stands at (xWallFade). */
function xNatShow(c,cut){ const L=EX.nat&&EX.nat.get(c); if(!L) return; const m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3(), zero=new THREE.Matrix4().makeScale(0,0,0);
  const w=EX.wIdx.get(c); xWallMatrix(m,c,!!w&&xWT(w[0].userData.v)===0,cut); const top=Math.max(0,XWALL*m.elements[5]-.06), seen=cut>0, touched=new Set();
  for(const [mi,k,kind,p] of L){ const im=EX.natM[mi]; touched.add(im); if(!seen){ im.setMatrixAt(k,zero); continue; }
    let y=0, h=p.h, r=p.r, show=true, rx=0, rz=0;
    switch(kind){
      case 'mite': h=Math.min(p.h,top+.25); show=h>.12; break;                            // never taller than its wall and a little
      case 'rock': case 'block': y=p.h*.2; break;
      case 'clump': case 'tuft': break;
      case 'clumpTop': y=top-.02; break;                                                  // moss on the wall's top, low wall or tall
      case 'tite': y=top-.04; show=top>p.h+1.6; break;                                    // only from a wall standing tall enough
      case 'vine': y=top; h=Math.min(p.h,top-.3); show=h>.4; rz=p.tilt; break;
      case 'shard': y=Math.min(p.y,top-.5); show=top>1.1; rx=p.dz*p.tilt; rz=-p.dx*p.tilt; break; }
    if(!show){ im.setMatrixAt(k,zero); continue; }
    if(kind==='rock'||kind==='block'||kind==='tuft'){ rx=p.tilt||0; }
    e.set(rx,p.rot,rz); q.setFromEuler(e); v.set(p.x,y,p.z);
    if(kind==='vine') s.set(p.root?p.r*1.2:p.r*1.6,h,p.r*1.6); else if(kind==='clump'||kind==='clumpTop') s.set(r*1.4,h*1.6,r*1.4); else s.set(r*2,h,r*2);
    m.compose(v,q,s); im.setMatrixAt(k,m); }
  for(const im of touched) im.instanceMatrix.needsUpdate=true; }

// the growth spread on the floor along the walls: soft blotches, one merged mesh under the darkness veil
function xNatPatches(grp,K,R,floorOK,pz){ if(!K.patch) return; const cv=document.createElement('canvas'); cv.width=cv.height=64; const x=cv.getContext('2d');
  for(let k=0;k<26;k++){ const g=x.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(.6,'rgba(255,255,255,.4)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.save(); x.translate(12+R()*40,12+R()*40); x.scale(6+R()*12,5+R()*9); x.fillStyle=g; x.beginPath(); x.arc(0,0,1,0,7); x.fill(); x.restore(); }
  for(let k=0;k<160;k++){ x.fillStyle='rgba(255,255,255,'+(.3+R()*.5)+')'; x.fillRect(R()*64|0,R()*64|0,1,1); }
  const tex=new THREE.CanvasTexture(cv), P=[], U=[];
  const quad=(cx,cz,w,d,rot)=>{ const cs=Math.cos(rot), sn=Math.sin(rot), pt=(u,v)=>[cx+u*w/2*cs-v*d/2*sn,.022,cz+u*w/2*sn+v*d/2*cs], a=pt(-1,-1), b=pt(-1,1), c=pt(1,1), e=pt(1,-1);
    P.push(...a,...b,...c,...a,...c,...e); U.push(0,0, 0,1, 1,1, 0,0, 1,1, 1,0); };
  for(let c=0;c<XN*XN;c++){ if(!floorOK(c)||EX.room[c]===pz&&pz>=0) continue;
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const w=c+dx+dy*XN; if(!EX.wIdx.has(w)||R()>K.patch.n) continue;
      quad(xw(c)+dx*.55+(R()-.5)*.6,xz(c)+dy*.55+(R()-.5)*.6,1.4+R()*1.2,.9+R()*.8,dx?Math.PI/2:0); } }
  if(!P.length) return; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshPhongMaterial({map:tex,color:new THREE.Color(K.patch.col),transparent:true,opacity:.7,depthWrite:false,shininess:2,polygonOffset:true,polygonOffsetFactor:-2}));
  mesh.renderOrder=0; grp.add(mesh); }

/* Pools: a few still pools on the floor of the rooms, each a blob over a few free cells (never on a door, the stairs,
   a chest, a trap, a puzzle's room or anything standing), drawn as one plane with a soft-edged shape of its own and a
   slowly moving surface; lava glows. Just for looks: you walk through them. */
function xNatPools(grp,K,R,floorOK,pz){ if(!K.pool) return; const P=K.pool, free=c=>floorOK(c)&&EX.room[c]>=0&&EX.room[c]!==pz&&!EX.taken.has(c)&&!EX.chests.some(ch=>ch.cell===c)&&!EX.traps.some(t=>t.cell===c)&&!xAdj4(c).some(n=>EX.doors.has(n));
  const rooms=EX.rooms.filter(r=>!r.nook&&!r.side&&r.id!==pz&&r.w>=5&&r.h>=5).sort(()=>R()-.5), used=new Set(); let made=0;
  for(const r of rooms){ if(made>=P.n) break; const cells=xRoomCells(r).filter(c=>free(c)&&!used.has(c)); if(cells.length<8) continue;
    const s0=cells[R()*cells.length|0], blob=[s0], want=3+(R()*4|0); used.add(s0);
    for(let t=0;t<40&&blob.length<want;t++){ const b=blob[R()*blob.length|0], n=xAdj4(b)[R()*4|0]; if(free(n)&&!used.has(n)&&!blob.includes(n)){ blob.push(n); used.add(n); } }
    if(blob.length<2) continue;
    const xs=blob.map(xcx), ys=blob.map(xcy), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys), w=x1-x0+1, h=y1-y0+1, N=24;
    const cv=document.createElement('canvas'); cv.width=w*N; cv.height=h*N; const x=cv.getContext('2d');
    // soft discs over the blob's cells, then a hard-ish edge where they add up: one rounded, uneven shape (no canvas blur: Safari has none)
    for(const c of blob) for(let j=0;j<3;j++){ const px=(xcx(c)-x0+.5+(R()-.5)*.5)*N, py=(xcy(c)-y0+.5+(R()-.5)*.5)*N, rr=N*(.6+R()*.25), g=x.createRadialGradient(px,py,0,px,py,rr);
      g.addColorStop(0,'rgba(255,255,255,.75)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(px-rr,py-rr,rr*2,rr*2); }
    const im=x.getImageData(0,0,cv.width,cv.height); for(let i=0;i<im.data.length;i+=4){ const a=im.data[i+3]; im.data[i+3]=a>150?255:a>110?(a-110)*6:0; } x.putImageData(im,0,0);
    const alpha=new THREE.CanvasTexture(cv), geo=new THREE.PlaneGeometry(w*XCS,h*XCS); geo.rotateX(-Math.PI/2);
    const surf=xNatSurface(P.kind), col=new THREE.Color(P.col);
    const mat=P.kind==='lava'?new THREE.MeshBasicMaterial({color:col,map:surf,alphaMap:alpha,transparent:true,depthWrite:false})
      :new THREE.MeshPhongMaterial({color:col,map:surf,alphaMap:alpha,transparent:true,opacity:P.kind==='ice'?.85:.82,depthWrite:false,shininess:P.kind==='ice'?120:90,specular:P.kind==='black'?0x404858:0x8aa0b0});
    const mesh=new THREE.Mesh(geo,mat); mesh.position.set((x0+w/2)*XCS,.03,(y0+h/2)*XCS); mesh.renderOrder=0; grp.add(mesh);
    let glow=null; if(P.kind==='lava'){ glow=new THREE.Mesh(new THREE.PlaneGeometry(w*XCS*1.5,h*XCS*1.5).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:xGlowTex.t||(xGlowTex.t=xGlowTex()),color:new THREE.Color(P.rim),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})); glow.position.set(mesh.position.x,.035,mesh.position.z); glow.renderOrder=2; glow.visible=false; grp.add(glow); }
    EX.natPools.push({mesh,glow,surf,kind:P.kind,cells:blob,ph:R()*6}); made++; } }
// a pool's surface: soft ripples (water), cracks of light (ice), slow-turning crust (lava), a few glints (black water)
function xNatSurface(kind){ const N=64, cv=document.createElement('canvas'); cv.width=cv.height=N; const x=cv.getContext('2d'), R=caveRng(kind.length*97+5);
  x.fillStyle='#fff'; x.fillRect(0,0,N,N);
  if(kind==='lava'){ for(let k=0;k<30;k++){ x.fillStyle='rgba(60,10,0,'+(.3+R()*.5)+')'; x.beginPath(); x.ellipse(R()*N,R()*N,3+R()*9,2+R()*6,R()*3,0,7); x.fill(); } }
  else if(kind==='ice'){ x.strokeStyle='rgba(120,170,200,.6)'; for(let k=0;k<9;k++){ x.beginPath(); let px=R()*N, py=R()*N; x.moveTo(px,py); for(let j=0;j<4;j++){ px+=(R()-.5)*24; py+=(R()-.5)*24; x.lineTo(px,py); } x.stroke(); } }
  else { for(let k=0;k<14;k++){ x.strokeStyle='rgba(170,200,210,'+(.12+R()*.2)+')'; x.lineWidth=1; x.beginPath(); x.ellipse(R()*N,R()*N,4+R()*12,2+R()*6,0,0,7); x.stroke(); }
    if(kind==='black') for(let k=0;k<12;k++){ x.fillStyle='rgba(255,255,255,.9)'; x.fillRect(R()*N|0,R()*N|0,1,1); } }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); return t; }
// every frame: the pools' surfaces drift; a lava pool breathes and its glow shows once its ground is seen
function xNatureTick(T){ for(const P of EX.natPools||[]){ if(P.kind==='ice') continue; P.surf.offset.set(Math.sin(T*.13+P.ph)*.12,T*(P.kind==='lava'?.015:.025));
    if(P.kind==='lava'){ const v=.85+.15*Math.sin(T*1.7+P.ph); P.mesh.material.color.setRGB(1*v,.36*v,.07*v); if(P.glow){ P.glow.visible=P.cells.some(c=>EX.seen[c]); P.glow.material.opacity=.28+.12*Math.sin(T*1.7+P.ph); } } } }
