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
  // in chunks of the floor (12 x 12 cells, as the walls are), each with its own bounds, so only the chunks on screen are
  // drawn: the view takes in about 12 cells. (They were quarters of the floor, and three.js turns culling off for
  // instanced meshes unless told otherwise, so every piece of growth on the floor was drawn every frame.)
  const CH=12, chunked=[]; for(const kind in byKind){ const by=new Map(); for(const p of byKind[kind]){ const key=((xcy(p[1])/CH)|0)*16+((xcx(p[1])/CH)|0); if(!by.has(key)) by.set(key,[]); by.get(key).push(p); } for(const [key,L] of by) chunked.push([kind,key,L]); }
  for(const [kind,key,L] of chunked){ const im=new THREE.InstancedMesh(geoOf[kind],mat(kind),L.length); im.frustumCulled=true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // (growth is drawn darker than its paint: the lamp is strong)
    const col=new THREE.Color(), dim=kind==='shard'?1:kind==='clump'||kind==='clumpTop'?.62:.85; L.forEach(([,wall,spec],k)=>{ im.setMatrixAt(k,zero); col.set(spec.col).multiplyScalar(dim*(.85+R()*.3)); im.setColorAt(k,col); if(!EX.nat.has(wall)) EX.nat.set(wall,[]); EX.nat.get(wall).push([EX.natM.length,k,kind,spec]); });
    const g=new THREE.BufferGeometry(); for(const at in geoOf[kind].attributes) g.setAttribute(at,geoOf[kind].attributes[at]); if(geoOf[kind].index) g.index=geoOf[kind].index; im.geometry=g;   // (its own bounds, the shape shared)
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3(((key%16)+.5)*CH*XCS,XWALL/2,(((key/16)|0)+.5)*CH*XCS),CH*XCS*.75+XWALL); grp.add(im); EX.natM.push(im); }
  xNatPatches(grp,K,caveRng(seed+1998),floorOK,pz,A); xNatPools(grp,K,caveRng(seed+1999),floorOK,pz); }   // (the blotches and pools on streams of their own: the dressing before them draws by what the camera sees, low near walls drawing less, so on the shared stream they moved every time the scene was built)

function xNatMat(kind,K){ const ice=(kind==='mite'&&K.mite&&K.mite.ice)||(kind==='tite'&&K.tite&&K.tite.ice);
  let m;
  if(kind==='shard') m=new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9});
  else if(ice) m=xPhong({color:0xffffff, shininess:90, specular:0x9fd8ff, transparent:true, opacity:.82, pbr:'ice'});
  else if(kind==='clump'||kind==='clumpTop') m=xPhong({color:0xffffff, shininess:2, specular:0x0a0a0a});
  else if(kind==='vine') m=xPhong({color:0xffffff, shininess:2, specular:0x0a0a0a, side:THREE.DoubleSide});
  else m=xPhong({color:0xffffff, shininess:kind==='block'?6:10, specular:0x161616});
  if(kind!=='shard') m.userData.xao=2;   // (the foot shade of things standing on the floor; their faces get their material and relief from surface.js)
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
function xNatPatches(grp,K,R,floorOK,pz,A){ if(!K.patch) return;
  if(XLIT.mold&&A&&(A.id==='hollows'||A.id==='ruins')) return;   // (the mold grows there in their place: mold.js)
  const cv=document.createElement('canvas'); cv.width=cv.height=64; const x=cv.getContext('2d');
  for(let k=0;k<26;k++){ const g=x.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(.6,'rgba(255,255,255,.4)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.save(); x.translate(12+R()*40,12+R()*40); x.scale(6+R()*12,5+R()*9); x.fillStyle=g; x.beginPath(); x.arc(0,0,1,0,7); x.fill(); x.restore(); }
  for(let k=0;k<160;k++){ x.fillStyle='rgba(255,255,255,'+(.3+R()*.5)+')'; x.fillRect(R()*64|0,R()*64|0,1,1); }
  const tex=new THREE.CanvasTexture(cv), P=[], U=[];
  const quad=(cx,cz,w,d,rot)=>{ const cs=Math.cos(rot), sn=Math.sin(rot), pt=(u,v)=>[cx+u*w/2*cs-v*d/2*sn,.022,cz+u*w/2*sn+v*d/2*cs], a=pt(-1,-1), b=pt(-1,1), c=pt(1,1), e=pt(1,-1);
    P.push(...a,...b,...c,...a,...c,...e); U.push(0,0, 0,1, 1,1, 0,0, 1,1, 1,0); };
  const bare=c=>{ const r=EX.room[c]; return r>=0&&EX.rooms[r]&&EX.rooms[r].theme==='library'; };   // (a library's floor stays clear of moss)
  for(let c=0;c<XN*XN;c++){ if(!floorOK(c)||EX.room[c]===pz&&pz>=0||bare(c)) continue;
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const w=c+dx+dy*XN; if(!EX.wIdx.has(w)||R()>K.patch.n) continue;
      quad(xw(c)+dx*.55+(R()-.5)*.6,xz(c)+dy*.55+(R()-.5)*.6,1.4+R()*1.2,.9+R()*.8,dx?Math.PI/2:0); } }
  if(!P.length) return; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,xNmapLuma(new THREE.MeshPhongMaterial({map:tex,color:new THREE.Color(K.patch.col),transparent:true,opacity:.7,depthWrite:false,shininess:2,polygonOffset:true,polygonOffsetFactor:-2}),.5));
  mesh.renderOrder=0; mesh.userData.natPatch=1; grp.add(mesh); }

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
    if(!mat.isMeshBasicMaterial) xNmapLuma(mat,P.kind==='ice'?.6:.9);   // (its ripples, or the ice's cracks, catch the light)
    const mesh=new THREE.Mesh(geo,mat); mesh.position.set((x0+w/2)*XCS,.03,(y0+h/2)*XCS); mesh.renderOrder=0; grp.add(mesh);
    let glow=null; if(P.kind==='lava'){ glow=new THREE.Mesh(new THREE.PlaneGeometry(w*XCS*1.5,h*XCS*1.5).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:xGlowTex.t||(xGlowTex.t=xGlowTex()),color:new THREE.Color(P.rim),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})); glow.position.set(mesh.position.x,.035,mesh.position.z); glow.renderOrder=2; glow.visible=false; grp.add(glow); }
    EX.natPools.push({mesh,glow,surf,kind:P.kind,cells:blob,ph:R()*6}); made++; } }
// a pool's surface: soft ripples (water), cracks of light (ice), slow-turning crust (lava), a few glints (black water)
function xNatSurface(kind){ const P=typeof envArtFx==='function'&&envArtFx('pool-'+kind);
  // the painted surface (envart.js): its highlights over a solid white body, so the pool keeps its body where the art is clear
  if(P){ const c=document.createElement('canvas'); c.width=P.width; c.height=P.height; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(P,0,0);
    const t=xTexSmooth(c,true); t.repeat.set(2,2); return t; }
  const N=64, cv=document.createElement('canvas'); cv.width=cv.height=N; const x=cv.getContext('2d'), R=caveRng(kind.length*97+5);
  x.fillStyle='#fff'; x.fillRect(0,0,N,N);
  if(kind==='lava'){ for(let k=0;k<30;k++){ x.fillStyle='rgba(60,10,0,'+(.3+R()*.5)+')'; x.beginPath(); x.ellipse(R()*N,R()*N,3+R()*9,2+R()*6,R()*3,0,7); x.fill(); } }
  else if(kind==='ice'){ x.strokeStyle='rgba(120,170,200,.6)'; for(let k=0;k<9;k++){ x.beginPath(); let px=R()*N, py=R()*N; x.moveTo(px,py); for(let j=0;j<4;j++){ px+=(R()-.5)*24; py+=(R()-.5)*24; x.lineTo(px,py); } x.stroke(); } }
  else { for(let k=0;k<14;k++){ x.strokeStyle='rgba(170,200,210,'+(.12+R()*.2)+')'; x.lineWidth=1; x.beginPath(); x.ellipse(R()*N,R()*N,4+R()*12,2+R()*6,0,0,7); x.stroke(); }
    if(kind==='black') for(let k=0;k<12;k++){ x.fillStyle='rgba(255,255,255,.9)'; x.fillRect(R()*N|0,R()*N|0,1,1); } }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); return t; }
// every frame: the pools' surfaces drift; a lava pool breathes and its glow shows once its ground is seen
function xNatureTick(T){ for(const P of EX.natPools||[]){ if(P.kind==='ice') continue; P.surf.offset.set(Math.sin(T*.13+P.ph)*.12,T*(P.kind==='lava'?.015:.025));
    if(P.kind==='lava'){ const v=.85+.15*Math.sin(T*1.7+P.ph); P.mesh.material.color.setRGB(1*v,.36*v,.07*v); if(P.glow){ P.glow.visible=P.cells.some(c=>EX.seen[c]); P.glow.material.opacity=.28+.12*Math.sin(T*1.7+P.ph); } } } }

/* ---------------- each area's own floor ----------------
   Three floors per area on a spacious floor (explore.js xBuildScene): the passages (0) and the two kinds of room (1, 2).
   Painted as pixel art like the others (look.js xPaint, in the area's stone tones), seeded by the depth so every floor
   lays its stones afresh, wrapping at the edges so the texture repeats without a seam, and each with a height field the
   lighting turns into relief (look.js xLitTag).
     Hollows  soil threaded with roots and moss; mossy flagstones, small or big, moss in the joints
     Deeps    rock silvered with frost; rock with glassy ice sheets; rock under snow drifts
     Rifts    cracked basalt plates with glowing seams, big or small; basalt under ash
     Vault    worn square paving with puddles in the low spots; hexagonal paving; basketweave
     Ruins    broken slabs heaved by roots; big dressed slabs with gold inlay; slabs under a gold lattice
     Abyss    dark cracked stone with violet veins; polished veined slabs; slabs inlaid with rings of stars */
const xfMix=(a,b,t)=>{ t=Math.max(0,Math.min(1,t)); return [0,1,2].map(n=>Math.round(a[n]+(b[n]-a[n])*t)); };
const xfSm=(a,b,v)=>{ const t=Math.max(0,Math.min(1,(v-a)/(b-a))); return t*t*(3-2*t); };
// stones from points on a jittered grid (G a side; odd rows shifted by off), wrapped: per pixel the nearest point (id), how far
// it is (d) and how much further the next nearest is (e: small along a joint)
function xfVoro(N,G,R,jit,off){ const S=N/G, P=[];
  for(let y=0;y<G;y++) for(let x=0;x<G;x++) P.push([(x+.5+(y%2?off||0:0)+(R()-.5)*jit)*S,(y+.5+(R()-.5)*jit)*S]);
  const id=new Int16Array(N*N), e=new Float32Array(N*N), d=new Float32Array(N*N), md=(a,b)=>((a%b)+b)%b;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const gx=Math.floor(i/S), gy=Math.floor(j/S); let b1=1e9, b2=1e9, k1=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const wx=gx+dx, wy=gy+dy, cx=md(wx,G), cy=md(wy,G), p=P[cy*G+cx];   // (the eight cells round are enough at this jitter)
      const px=p[0]+(wx-cx)/G*N-i, py=p[1]+(wy-cy)/G*N-j, q=px*px+py*py;
      if(q<b1){ b2=b1; b1=q; k1=cy*G+cx; } else if(q<b2) b2=q; }
    const o=j*N+i; id[o]=k1; d[o]=Math.sqrt(b1); e[o]=Math.sqrt(b2)-d[o]; }
  return {id,e,d,n:P.length}; }
// a hash of a stone's place (for the rectangular layouts)
const xfH=(a,b,s)=>{ const v=Math.sin(a*12.9898+b*78.233+s*.7311)*43758.5453; return v-Math.floor(v); };
// only: paint just that one of the area's floors and keep it (the background painter, xPrewarmTick), returning null
function xAreaFloors(A,S,seed,only){ if(only==null&&typeof envArtAreaFloors==='function'){ const P=envArtAreaFloors(A); if(P) return P; }   // the painted art (envart.js), when it has loaded
  const id=A&&A.id, kept=XAREA_FLOOR_KEEP.get(id);
  if(only==null&&kept&&kept.length&&kept.every(Boolean)) return kept;
  const N=256, T=t=>xTone(S,Math.max(0,Math.min(1,t))), X=h=>xHexRGB(h);
  const make=(sd,fn,speck)=>{ const R=caveRng(sd), H=new Float32Array(N*N), c=fn(R,H); if(speck) xSpeck(c,S,R,speck); c.h=H; c.hk=.55; return c; };
  const pebbles=(c,R,H,n,lo)=>{ const x=c.getContext('2d'); for(let k=0;k<n;k++){ const px=R()*N|0, py=R()*N|0, w=1+R()*2|0, h=1+R()*2|0;
      x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(px+1,py+1,w,h); x.fillStyle='rgb('+T((lo||.45)+R()*.35).join(',')+')'; x.fillRect(px,py,w,h); for(let j=py;j<py+h;j++) for(let i=px;i<px+w;i++) H[(j%N)*N+i%N]+=1.4; } };
  // a cracked rock ground: blotches, two families of thin cracks sunk in; lift raises it, cr how dark the cracks
  const rock=(R,H,lift,cr)=>{ const f=xFbm(N,R,4), k1=xNoise(N,12,R), k2=xNoise(N,7,R);
    return {f,c:xPaint(N,(i,j)=>{ const fv=f(i,j), a=Math.abs(k1(i,j)-.5), b=Math.abs(k2(i,j)-.5); let t=fv*1.1-.1+lift; H[j*N+i]=fv*6;
      if(a<.011||b<.008){ t-=cr; H[j*N+i]-=2; } return T(t); })}; };
  const F={
    hollows:[
      // soil threaded with roots, moss in the damp hollows
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,4), m=xFbm(N,R,6), r1=xNoise(N,10,R), r2=xNoise(N,6,R), soil=X('#2a241c'), root=X('#3e2c1c'), moss=X(S.moss);
        const c=xPaint(N,(i,j)=>{ const fv=f(i,j), mv=m(i,j); let col=xfMix(T(fv*.55+.05),soil,.45); H[j*N+i]=fv*5;
          if(mv>.56) col=xfMix(col,moss,(mv-.56)*4.5);
          const a=Math.abs(r1(i,j)-.5), b=Math.abs(r2(i,j)-.5); if(a<.012||b<.009){ col=xfMix(root,T(.6),a<.005||b<.004?.25:0); H[j*N+i]+=1.4; } return col; });
        pebbles(c,R,H,60); return c; },30),
      // rough cobbled rock, G stones a side over the texture's eight cells (18: small, 13: mixed): warped, chipped
      // edges, a domed face with fine grain, flecks and the odd crack, moss and grit in the joints. Drawn at 512 for
      // the detail, in smooth tones (xTone steps would flatten each stone to one colour).
      ...[18,13].map(G=>s=>{ const N2=512, R=caveRng(s+G), H=new Float32Array(N2*N2), V=xfVoro(N2,G,R,.95), rv=Array.from({length:V.n},()=>R()), rk=Array.from({length:V.n},()=>R());
        const wx=xNoise(N2,22,R), wy=xNoise(N2,22,R), ch=xFbm(N2,R,40), gr=xFbm(N2,R,64), co=xFbm(N2,R,6), m=xFbm(N2,R,8), ck=xNoise(N2,30,R), gap=X('#141a12'), grit=X('#3a3226'), moss=X(S.moss);
        const ramp=S.rock.map(X), Tc=t=>{ t=Math.max(0,Math.min(1,t))*(ramp.length-1); const i=Math.min(ramp.length-2,Math.floor(t)); return xfMix(ramp[i],ramp[i+1],t-i); };
        const c=xPaint(N2,(i,j)=>{ const si=((i+Math.round((wx(i,j)-.5)*9))%N2+N2)%N2, sj=((j+Math.round((wy(i,j)-.5)*9))%N2+N2)%N2, q=sj*N2+si, o=j*N2+i;
          const id=V.id[q], e=V.e[q]-(ch(i,j)-.5)*3.2, mv=m(i,j), g=gr(i,j);
          if(e<1.6){ H[o]=-1.5; let col=xfMix(gap,grit,g); if(mv>.5) col=xfMix(col,moss,Math.min(1,(mv-.5)*3)); return col; }
          const dome=Math.sqrt(Math.min(e,7)/7);
          let t=.28+rv[id]*.26+(g-.5)*.3+(co(i,j)-.5)*.14+dome*.08-(e<3?.08:0); H[o]=1.2+dome*2.6+(g-.5)*1.4;
          if(rk[id]<.35&&Math.abs(ck(i,j)-.5)<.01){ t-=.18; H[o]-=1.2; }   // a cracked stone
          if(((i*7+j*13+id*31)%97)<2) t+=.12;   // pale flecks
          let col=Tc(t); if(mv>.6&&e<6) col=xfMix(col,moss,Math.min(.8,(mv-.6)*4)); return col; });
        xSpeck(c,S,R,60); c.h=H; c.hk=.6; return c; }) ],
    deeps:[
      // rock silvered with frost
      s=>make(s,(R,H)=>{ const g=rock(R,H,.05,.3), fr=xFbm(N,R,5), w=X('#e6f6ff'), cv=g.c, x=cv.getContext('2d'), im=x.getImageData(0,0,N,N);
        for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const a=xfSm(.48,.72,fr(i,j))*.7, o=(j*N+i)*4; for(let n=0;n<3;n++) im.data[o+n]=Math.round(im.data[o+n]+(w[n]-im.data[o+n])*a); }
        x.putImageData(im,0,0); return cv; },50),
      // rock with glassy ice sheets
      s=>make(s,(R,H)=>{ const V=xfVoro(N,5,R,.8), rv=Array.from({length:V.n},()=>R()), f=xFbm(N,R,6), ck=xNoise(N,9,R), lo=X('#8cc4e4'), hi=X('#e6f6ff');
        return xPaint(N,(i,j)=>{ const o=j*N+i, e=V.e[o], fv=f(i,j), ice=rv[V.id[o]]<.45;
          if(e<1.4){ H[o]=-1; return T(.12); }
          if(ice){ H[o]=1.2; let col=xfMix(lo,hi,fv*1.2-.1); if(Math.abs(ck(i,j)-.5)<.007) col=hi; if((i+j+V.id[o]*7)%46<3) col=xfMix(col,[255,255,255],.5); return col; }
          H[o]=2+fv*3; return T(.32+rv[V.id[o]]*.25+(fv-.5)*.22-(e<3?.06:0)); }); },20),
      // rock under snow drifts
      s=>make(s,(R,H)=>{ const g=rock(R,H,0,.3), sn=xFbm(N,R,3), dt=xFbm(N,R,16), w=X('#eef6ff'), bl=X('#b8d4ea'), cv=g.c, x=cv.getContext('2d'), im=x.getImageData(0,0,N,N);
        for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const a=xfSm(.52,.62,sn(i,j))*.8, o=(j*N+i)*4; if(a<=0) continue; const s2=xfMix(bl,w,dt(i,j)*1.1-.2);
          for(let n=0;n<3;n++) im.data[o+n]=Math.round(im.data[o+n]+(s2[n]-im.data[o+n])*a); H[j*N+i]+=a*3; }
        x.putImageData(im,0,0); return cv; },40) ],
    rifts:[
      ...[[6,.7,.25],[9,.9,.1],[6,0,.8]].map(([G,glow,ash])=>s=>make(s+G*7,(R,H)=>{ const V=xfVoro(N,G,R,.55), rv=Array.from({length:V.n},()=>R()), f=xFbm(N,R,6), gl=xFbm(N,R,4), as=xFbm(N,R,4);
        const hot=X('#ff5a10'), hot2=X('#ffd36a'), ashC=X('#48423e');
        return xPaint(N,(i,j)=>{ const o=j*N+i, e=V.e[o], fv=f(i,j); let col, h;
          if(e<1.9){ h=-1.5; col=[18,9,6]; if(glow&&e<1.1&&gl(i,j)>1-glow*.62) col=xfMix(hot,hot2,(gl(i,j)-.5)*2); }
          else { h=2+fv*1.6; col=T(.18+rv[V.id[o]]*.24+(fv-.5)*.16-(e<3.5?.06:0)); }
          const a=xfSm(.42,.7,as(i,j))*ash; if(a>0){ col=xfMix(col,ashC,a); h+=a; } H[o]=h; return col; }); },ash>.5?20:40)) ],
    vault:[
      // worn square paving in rows, puddles in the low spots
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), wr=xFbm(N,R,3), pd=xFbm(N,R,3), wet=X(A.fog||'#1e1a3a');
        return xPaint(N,(i,j)=>{ const row=j>>4, off=(row%2)*8, col0=((i+off)%N)>>4, u=(i+off)%16, v=j%16, o=j*N+i, fv=f(i,j);
          if(u===15||v===15){ H[o]=-1; return T(.08); }
          let t=.34+xfH(col0,row,s)*.2+(fv-.5)*.14+Math.max(0,wr(i,j)-.6)*.5-(u===14||v===14?.05:0)+(u===0||v===0?.06:0); H[o]=2+fv*1.2;
          let col=T(t); const p=pd(i,j); if(p>.62){ col=xfMix(col,wet,Math.min(.75,(p-.62)*6)); H[o]-=1; } return col; }); },30),
      // hexagonal paving
      s=>make(s,(R,H)=>{ const V=xfVoro(N,8,R,0,.5), rv=Array.from({length:V.n},()=>R()), f=xFbm(N,R,6), wr=xFbm(N,R,3);
        return xPaint(N,(i,j)=>{ const o=j*N+i, e=V.e[o], fv=f(i,j); if(e<1.5){ H[o]=-1; return T(.07); }
          H[o]=2+fv; return T(.32+rv[V.id[o]]*.24+(fv-.5)*.14+Math.max(0,wr(i,j)-.62)*.5+(e<3?.05:0)); }); },30),
      // basketweave: pairs of bricks, turned square by square
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), wr=xFbm(N,R,3);
        return xPaint(N,(i,j)=>{ const bx=i>>5, by=j>>5, u=i&31, v=j&31, flat=(bx+by)%2===0, half=flat?(v>>4):(u>>4), a=flat?u:v, b=flat?v&15:u&15, o=j*N+i, fv=f(i,j);
          if(a===31||b===15){ H[o]=-1; return T(.07); }
          H[o]=2+fv; return T(.33+xfH(bx*2+half,by,s+3)*.22+(fv-.5)*.14+Math.max(0,wr(i,j)-.62)*.5+(b===0?.05:0)); }); },30) ],
    ruins:[
      // broken slabs, heaved and split by roots, moss in the cracks
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), r1=xNoise(N,8,R), r2=xNoise(N,5,R), ck=xNoise(N,11,R), m=xFbm(N,R,5), root=X('#4a3420'), moss=X(S.moss||'#6a7a3a');
        return xPaint(N,(i,j)=>{ const row=j>>6, off=(row%2)*32, cx=((i+off)%N)>>6, u=(i+off)&63, v=j&63, o=j*N+i, fv=f(i,j), hz=xfH(cx,row,s);
          if(u===63||v===63){ H[o]=-1; return xfMix(T(.08),moss,m(i,j)); }
          let t=.38+hz*.2+(fv-.5)*.16; if(hz>.7) t+=(u/64-.5)*.18;   // a heaved slab: lit along one side
          let col=T(t); H[o]=2+fv+(hz>.7?u/40:0);
          if(Math.abs(ck(i,j)-.5)<.008){ col=T(.1); H[o]-=1.5; }
          const a=Math.abs(r1(i,j)-.5), b=Math.abs(r2(i,j)-.5); if(a<.011||b<.008){ col=xfMix(root,moss,m(i,j)-.3); H[o]+=1.2; } return col; }); },24),
      // big dressed slabs with a gold inlay line round each
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), wr=xFbm(N,R,3), gold=X(S.spark||'#f2c94c');
        return xPaint(N,(i,j)=>{ const u=i&63, v=j&63, o=j*N+i, fv=f(i,j);
          if(u===63||v===63){ H[o]=-1; return T(.08); }
          const inset=Math.min(u,v,62-u,62-v); if(inset===5&&wr(i,j)>.3){ H[o]=1.6; return xfMix(gold,T(.6),fv*.5); }
          if((u===31||v===31)&&inset>5&&xfH(i>>6,j>>6,s)>.5&&wr(i,j)>.35){ H[o]=1.6; return xfMix(gold,T(.6),fv*.6); }   // some slabs quartered by inlay too
          H[o]=2+fv; return T(.42+xfH(i>>6,j>>6,s+1)*.16+(fv-.5)*.14+Math.max(0,wr(i,j)-.62)*.4); }); },20),
      // slabs under a diagonal gold lattice, a stud where its lines cross
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), wr=xFbm(N,R,3), gold=X(S.spark||'#f2c94c');
        return xPaint(N,(i,j)=>{ const u=i&31, v=j&31, o=j*N+i, fv=f(i,j), p=(i+j)&63, q=(i-j+N)&63;
          if((p<1||q<1)&&wr(i,j)>.28){ H[o]=1.6; return xfMix(gold,T(.7),fv*.5); }
          { const u6=i&63, v6=j&63; let q2=1e9; for(const [cx,cy] of [[0,0],[64,0],[0,64],[64,64],[32,32]]) q2=Math.min(q2,(u6-cx)*(u6-cx)+(v6-cy)*(v6-cy)); if(q2<6){ H[o]=2.4; return gold; } }   // a stud where the lines cross
          if(u===31||v===31){ H[o]=-1; return T(.1); }
          H[o]=2+fv; return T(.36+xfH(i>>5,j>>5,s+2)*.18+(fv-.5)*.14); }); },20) ],
    abyss:[
      // dark cracked stone with faint violet veins
      s=>make(s,(R,H)=>{ const g=rock(R,H,-.18,.25), vn=xNoise(N,6,R), vc=X(S.moss||'#3a2a56'), cv=g.c, x=cv.getContext('2d'), im=x.getImageData(0,0,N,N);
        for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const a=Math.abs(vn(i,j)-.5), o=(j*N+i)*4; if(a>.02) continue; const k=(1-a/.02)*.7; for(let n=0;n<3;n++) im.data[o+n]=Math.round(im.data[o+n]+(vc[n]-im.data[o+n])*k); }
        x.putImageData(im,0,0); return cv; },30),
      // polished dark slabs, veined, with a sheen across them
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), vn=xNoise(N,5,R), vn2=xNoise(N,9,R);
        return xPaint(N,(i,j)=>{ const u=i&31, v=j&31, o=j*N+i, fv=f(i,j); if(u===31||v===31){ H[o]=-1; return [6,7,10]; }
          let t=.16+xfH(i>>5,j>>5,s)*.1+(fv-.5)*.08+(((i-j+N)&63)<5?.05:0); if(Math.abs(vn(i,j)-.5)<.008||Math.abs(vn2(i,j)-.5)<.005) t+=.32;
          H[o]=2+fv*.5; return T(t); }); },16),
      // slabs inlaid with a ring of stars, flecks between
      s=>make(s,(R,H)=>{ const f=xFbm(N,R,6), st=X(S.spark||'#e9fbff');
        const c=xPaint(N,(i,j)=>{ const u=i&63, v=j&63, o=j*N+i, fv=f(i,j); if(u===63||v===63){ H[o]=-1; return [6,7,10]; }
          const dx=u-31.5, dy=v-31.5, r=Math.sqrt(dx*dx+dy*dy), a=Math.atan2(dy,dx), on=Math.abs(r-19)<1.1&&Math.cos(a*8)>.82||r<2.2;
          if(on){ H[o]=2.6; return xfMix(st,T(.8),.2); } if(Math.abs(r-24)<.6){ H[o]=1.4; return T(.42); }
          H[o]=2+fv*.6; return T(.14+xfH(i>>6,j>>6,s)*.08+(fv-.5)*.08); });
        const x=c.getContext('2d'); for(let k=0;k<120;k++){ x.fillStyle='rgba('+st.join(',')+','+(.3+R()*.6)+')'; x.fillRect(R()*N|0,R()*N|0,1,1); } return c; },0) ] };
  const L=F[id]; if(!L) return null; const set=kept||new Array(L.length);
  XAREA_FLOOR_KEEP.delete(id); XAREA_FLOOR_KEEP.set(id,set); for(const k of [...XAREA_FLOOR_KEEP.keys()]) if(XAREA_FLOOR_KEEP.size>2) XAREA_FLOOR_KEEP.delete(k);
  if(only!=null){ if(only<L.length&&!set[only]) set[only]=L[only](seed+only*101); return null; }
  for(let k=0;k<L.length;k++) if(!set[k]) set[k]=L[k](seed+k*101);
  return set; }
// the floors of the last two areas, kept: the next floor of an area wears them again instead of painting its own (the
// Hollows' cobbles take most of a second on a slow phone), and the next area's are painted ahead (xPrewarmTick)
const XAREA_FLOOR_KEEP=new Map();
/* Painting the next area's floors ahead. On the last floor of an area, once you have seen the stairs down and are
   within a dozen cells of them, the floors of the area below (its own three and its themes' floors) are painted one
   at a time, each only after you have stood still for a moment, so a pause of the painting falls where you are not
   moving. The next floor then builds as fast as any other in its area. */
function xPrewarmTick(dt){ if(!EX||EX.layout!==2||!EX.active||EX.dlg||EX.fighting||typeof areaOf!=='function') return;
  const nd=EX.depth+1, NA=areaOf(nd); if(!NA||!EX.area||NA.id===EX.area.id) return;
  let W=EX.prewarm; if(!W||W.depth!==nd){ const S=NA.stone||AREAS[0].stone, jobs=[];
      // the painted art: its sheets load in the background (envart.js), nothing to paint here; the code-painted
      // floors are painted ahead only where there is no art to load
      if(typeof envArtWant==='function'&&typeof ENVART_MAP!=='undefined'){ envArtWant(NA.id); EX.prewarm={depth:nd, jobs:[], still:0, at:-1}; return; }
      for(let k=0;k<3;k++) jobs.push(()=>xAreaFloors(NA,S,nd*31,k));
      const TA=typeof XTHEME_AREA!=='undefined'&&XTHEME_AREA[NA.id]; if(TA) for(const th of Object.keys(TA)) jobs.push(()=>xThemeFloor(th,NA,S));
      W=EX.prewarm={depth:nd, jobs, still:0, at:-1}; }
  if(!W.jobs.length||!EX.seen[EX.down]||Math.hypot(xcx(EX.pc)-xcx(EX.down),xcy(EX.pc)-xcy(EX.down))>12) return;
  const here=EX.px*1000+EX.pz; if(here!==W.at||(EX.path&&EX.path.length)){ W.at=here; W.still=0; return; }
  if((W.still+=dt)<.6) return;
  W.still=0; const job=W.jobs.shift(); try{ job(); }catch(e){} }

/* ---------------- the room themes' floors (dungeongen.js XTHEMES) ----------------
   One painter per theme (Temple keeps the area's own floors), in the area's rock tones where the theme is stone, in
   its own colours where it is wood, tile or earth. 256 pixels over eight cells, with a height field for the lighting
   (look.js xLitTag). Painted once per theme and area, then kept: a floor of five themes costs nothing the second time. */
const XTHEME_FLOOR_CACHE=new Map();
function xThemeFloor(th,A,S){ if(typeof envArtTheme==='function'){ const P=envArtTheme(th,A); if(P) return P; }   // the painted art (envart.js), when it has loaded
  const key=th+'|'+(A&&A.id); if(XTHEME_FLOOR_CACHE.has(key)) return XTHEME_FLOOR_CACHE.get(key);
  const N=th==='library'?512:256, X=h=>xHexRGB(h), ramp=S.rock.map(X), T=t=>{ t=Math.max(0,Math.min(1,t))*(ramp.length-1); const i=Math.min(ramp.length-2,Math.floor(t)); return xfMix(ramp[i],ramp[i+1],t-i); };
  const sd=[...th].reduce((a,c)=>a*31+c.charCodeAt(0),7)&0xffff, R=caveRng(sd+1), H=new Float32Array(N*N), mix=xfMix, h=xfH;
  const pebbles=(c,n,lo)=>{ const x=c.getContext('2d'); for(let k=0;k<n;k++){ const px=R()*N|0, py=R()*N|0, w=1+R()*2|0, hh=1+R()*2|0;
      x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(px+1,py+1,w,hh); x.fillStyle='rgb('+T((lo||.4)+R()*.3).join(',')+')'; x.fillRect(px,py,w,hh); for(let j=py;j<py+hh;j++) for(let i=px;i<px+w;i++) H[(j%N)*N+i%N]+=1.4; } };
  let c=null;
  switch(th){
    // worn slabs in courses, bound with riveted iron
    case 'armory': { const f=xFbm(N,R,6), w=xFbm(N,R,3), iron=X('#2a2826'), rivet=X('#7a746a');
      c=xPaint(N,(i,j)=>{ const row=j>>5, u=(i+(row&1)*32)&63, v=j&31, o=j*N+i, fv=f(i,j);
        if(v<2||u<2){ H[o]=1.2; return (u<2&&((v+4)&15)<3)||(v<2&&((u+6)&15)<3)?rivet:iron; }
        H[o]=2+fv*1.5; return T(.38+h((i+(row&1)*32)>>6,row,sd)*.16+(fv-.5)*.2-(w(i,j)>.62?.1:0)); }); break; }
    // dark wet tiles, shallow standing water in the low places
    case 'flooded': { const f=xFbm(N,R,6), p=xFbm(N,R,3), wet=X('#183640'), hi=X('#6ab0c0');
      c=xPaint(N,(i,j)=>{ const u=i&31, v=j&31, o=j*N+i, fv=f(i,j), pv=p(i,j), joint=u===31||v===31||u===0||v===0;   // (joints on both edges: a bombed tile can be turned)
        let col=mix(joint?T(.06):T(.24+h(i>>5,j>>5,sd)*.1+(fv-.5)*.1),wet,.35); H[o]=joint?-1:2+fv*.5;
        if(pv>.56){ const k=Math.min(1,(pv-.56)*7); col=mix(col,wet,k*.85); H[o]=1.2; if(pv>.6&&h(i,j,sd)<.025) col=mix(col,hi,.7); }
        return col; }); break; }
    // cracked slabs pushed apart by roots, moss in every joint
    case 'overgrown': { const f=xFbm(N,R,6), m=xFbm(N,R,4), r1=xNoise(N,8,R), r2=xNoise(N,5,R), k=xNoise(N,14,R), moss=X(S.moss||'#4f7a3a'), root=X('#3e2c1c');
      c=xPaint(N,(i,j)=>{ const u=i&63, v=j&63, o=j*N+i, fv=f(i,j), mv=m(i,j), joint=u===63||v===63||u===0||v===0;
        let col=joint?mix(moss,T(.1),.45):T(.42+h(i>>6,j>>6,sd)*.12+(fv-.5)*.16); H[o]=joint?-1:2+fv;
        if(Math.abs(k(i,j)-.5)<.01){ col=mix(col,T(.06),.7); H[o]-=1.5; }
        if(mv>.6) col=mix(col,mix(moss,T(.25),.3),Math.min(.75,(mv-.6)*2.2));   // moss in patches, not a carpet
        if(Math.abs(r1(i,j)-.5)<.012||Math.abs(r2(i,j)-.5)<.009){ col=root; H[o]+=1.4; }
        return col; }); break; }
    // broken paving: stones heaved and missing, grit in the holes
    case 'collapsed': { const V=xfVoro(N,9,R,.9), rv=Array.from({length:V.n},()=>R()), f=xFbm(N,R,6), grit=X('#2a241e');
      c=xPaint(N,(i,j)=>{ const q=j*N+i, e=V.e[q], fv=f(i,j), r=rv[V.id[q]];
        if(r<.2||e<1.5){ H[q]=-1.5; return mix(grit,T(.18),fv); }
        H[q]=1.5+fv+Math.min(e,6)*.15; return T(.3+r*.28+(fv-.5)*.16); });
      pebbles(c,160,.28); break; }
    // a basket weave of old planks, stained gray and beaten up: water stains with a dark tide line, scratches, worn
    // ends, dirt packed in the joints, the odd plank rotted dark or gone (grit in the hole)
    case 'library': { const f=xFbm(N,R,8), st=xFbm(N,R,3), st2=xFbm(N,R,5), sc1=xNoise(N,22,R), sc2=xNoise(N,17,R), dirt=X('#25221f'),
        Ws=[X('#6c6862'),X('#5a5651'),X('#78736b'),X('#4c4945'),X('#64605a')];
      c=xPaint(N,(i,j)=>{ const o=j*N+i, sq=((i>>5)+(j>>5))&1, across=sq?i:j, along=sq?j:i, pid=(across>>3)*7+(along>>5)*13+sq, fv=f(i,j);
        if((across&7)===7||(along&31)===31){ H[o]=-1.2; return mix(dirt,[12,11,10],fv*.6); }
        if(h(pid,0,sd)<.045){ H[o]=-.9; return mix(dirt,T(.18),fv); }
        const gr=Math.sin(across*2.3+h(pid,1,sd)*20+fv*6)*.5+.5, e=Math.min(along&31,31-(along&31)), side=Math.min(across&7,6-(across&7));
        let col=mix(Ws[Math.floor(h(pid,2,sd)*5)],[22,20,18],gr*.2+(fv-.5)*.4); H[o]=2+gr*.35-(e<2?.6:0);
        if(e<3||side<1) col=mix(col,dirt,e<2?.4:.22);
        if(h(pid,3,sd)<.12) col=mix(col,dirt,.35);
        const sv=st(i,j), sv2=st2(i,j); if(sv>.58) col=mix(col,[40,36,32],Math.min(.55,(sv-.58)*2.4)); if(Math.abs(sv-.58)<.005) col=mix(col,[26,23,20],.55);
        if(sv2>.66) col=mix(col,[92,88,80],Math.min(.3,(sv2-.66)*2));
        if(Math.abs(sc1(i,j)-.5)<.004||Math.abs(sc2(i,j)-.5)<.003){ col=mix(col,[158,152,142],.32); H[o]-=.35; }
        return col; }); break; }
    // big flagstones, some of them grave slabs with a carved border and cross
    case 'crypt': { const f=xFbm(N,R,6), k=xNoise(N,10,R);
      c=xPaint(N,(i,j)=>{ const u=i&63, v=j&63, o=j*N+i, fv=f(i,j), tid=h(i>>6,j>>6,sd);
        if(u===63||v===63||u===0||v===0){ H[o]=-1.2; return T(.05); }   // (joints on both edges: a bombed slab can be turned)
        let t=.34+tid*.12+(fv-.5)*.14; H[o]=2+fv;
        if(tid<.45){ const inR=u>13&&u<49&&v>5&&v<57, edge=inR&&(u===14||u===48||v===6||v===56), cross=(Math.abs(u-31)<1.6&&v>13&&v<45)||(Math.abs(v-24)<1.6&&u>21&&u<41);
          if(inR) t+=.06; if(edge||cross){ t-=.22; H[o]=.6; } }
        if(Math.abs(k(i,j)-.5)<.008){ t-=.15; H[o]-=1; }
        return T(t); }); break; }
    // soot-black stone split by cracks that still glow
    case 'forge': { const f=xFbm(N,R,5), k1=xNoise(N,9,R), k2=xNoise(N,5,R), soot=X('#141010'), ember=X('#ff4a10'), hot=X('#ffb040');
      c=xPaint(N,(i,j)=>{ const o=j*N+i, fv=f(i,j), m=Math.min(Math.abs(k1(i,j)-.5)/.011,Math.abs(k2(i,j)-.5)/.006); let col=mix(T(fv*.35),soot,.6); H[o]=fv*5;
        if(m<1){ col=mix(ember,hot,1-m); H[o]-=1.6; } else if(m<2.4) col=mix(col,[90,28,8],(2.4-m)/1.4*.6);
        return col; }); break; }
    // a mosaic of small tiles: pale ground, blue bands, a ring in each square
    case 'bathhouse': { const f=xFbm(N,R,6), Cs=[X('#e4e0d4'),X('#b4d4dc'),X('#3a7a9a'),X('#1e4a6a')];
      c=xPaint(N,(i,j)=>{ const o=j*N+i, ti=i>>3, tj=j>>3; if((i&7)===7||(j&7)===7){ H[o]=-.6; return [72,76,74]; }
        const band=(ti&15)===0||(tj&15)===0||(ti&15)===15||(tj&15)===15, ring=Math.abs(Math.hypot((ti&15)-7.5,(tj&15)-7.5)-4.5)<.8;   // (centred: a bombed square can be turned)
        const k=band?2:ring?3:h(ti,tj,sd)<.16?1:0; H[o]=1.6+h(ti,tj,sd+1)*.6; return mix(Cs[k],[0,0,0],Math.max(0,(f(i,j)-.4)*.4+h(ti,tj,sd+3)*.08)); }); break; }
    // long plain boards, nailed down
    case 'barracks': { const f=xFbm(N,R,8), W1=X('#6a4a2c'), W2=X('#56391f');
      c=xPaint(N,(i,j)=>{ const o=j*N+i, row=j>>4, off=Math.floor(h(row,0,sd)*128), along=(i+off)&127, plank=row*31+((i+off)>>7);
        if((j&15)===15||along===127){ H[o]=-1; return [26,16,8]; }
        if((along===5||along===121)&&((j&15)===4||(j&15)===10)){ H[o]=2.6; return [70,68,64]; }
        const gr=Math.sin(j*1.7+h(plank,2,sd)*30+f(i,j)*5)*.5+.5; H[o]=2+gr*.3; return mix(h(plank,1,sd)<.5?W1:W2,[24,14,6],gr*.22+(f(i,j)-.5)*.3); }); break; }
    // dark earth laced with mycelium, glowing where it gathers
    case 'fungus': { const f=xFbm(N,R,4), m=xFbm(N,R,8), t1=xNoise(N,16,R), t2=xNoise(N,11,R), soil=X('#221a14'), thread=X('#d8d0c0'), glow=X(A&&A.glow||'#7fe3ff');
      c=xPaint(N,(i,j)=>{ const o=j*N+i, fv=f(i,j), mv=m(i,j); let col=mix(soil,T(fv*.4),.35); H[o]=fv*4;
        if(Math.abs(t1(i,j)-.5)<.006||Math.abs(t2(i,j)-.5)<.005){ col=mix(col,thread,.55); H[o]+=.8; }
        if(mv>.62) col=mix(col,glow,Math.min(.8,(mv-.62)*2.4));
        return col; });
      const x=c.getContext('2d'); for(let k=0;k<110;k++){ x.fillStyle='rgba('+glow.join(',')+','+(.4+R()*.6)+')'; x.fillRect(R()*N|0,R()*N|0,1+(R()<.2?1:0),1); } break; }
    default: return null; }
  c.h=H; c.hk=.55;
  // theme floors are laid with texture bombing and painted vertices (explore.js xBuildScene, look.js xBombShader); the
  // library's planks are painted at twice the pixels over the same eight cells, each plank half the size
  // the bombing's step is the pattern's repeat, in the texture's cells a side: whole tiles (8 a side: flooded), whole
  // slabs (4: overgrown, crypt), the mosaic's banded squares (2: bathhouse). A floor whose pattern does not repeat on
  // the cell grid (the armory's staggered slabs, broken paving, cracks, earth, the barracks' boards) is painted only
  c.paint=1; const BOMB={library:8, flooded:8, overgrown:4, crypt:4, bathhouse:2}; if(BOMB[th]) c.bomb=BOMB[th];
  XTHEME_FLOOR_CACHE.set(key,c); return c; }

/* ---------------- normal maps for what has no painted height ----------------
   The floors and walls carry height fields (look.js xLitTag turns them into normal maps). The rest is given one here,
   kept where the lighting keeps it (material.userData.nmap: look.js xLitDefines puts it on while the debug menu's
   normal maps are on, and takes it off when they are off):
     xNmapLuma   a painted texture (a room's floor border and centre piece, a pool's surface, the floor growth):
                 its own brightness is its height, so its painted joints and ripples catch the light
     xNmapGrain  a shared tileable grain of stone (the 3D pieces now take theirs from surface.js) */
function xNormalMapWH(H,W,Hh,k){ const c=document.createElement('canvas'); c.width=W; c.height=Hh; const x=c.getContext('2d'), im=x.createImageData(W,Hh), at=(i,j)=>H[((j+Hh)%Hh)*W+((i+W)%W)];
  for(let j=0;j<Hh;j++) for(let i=0;i<W;i++){ const nx=-(at(i+1,j)-at(i-1,j))*k, ny=(at(i,j+1)-at(i,j-1))*k, l=Math.hypot(nx,ny,1), o=(j*W+i)*4;
    im.data[o]=(nx/l*.5+.5)*255; im.data[o+1]=(ny/l*.5+.5)*255; im.data[o+2]=(1/l*.5+.5)*255; im.data[o+3]=255; }
  x.putImageData(im,0,0); return c; }
function xNmapLuma(m,k){ const t=m&&m.map, cv=t&&t.image; if(!cv||!cv.getContext) return m;
  const W=cv.width, Hh=cv.height, D=cv.getContext('2d').getImageData(0,0,W,Hh).data, H=new Float32Array(W*Hh);
  for(let i=0;i<W*Hh;i++) H[i]=(D[i*4]*.3+D[i*4+1]*.59+D[i*4+2]*.11)/255*(D[i*4+3]/255)*10;
  const n=new THREE.CanvasTexture(xNormalMapWH(H,W,Hh,k||.35)); n.wrapS=t.wrapS; n.wrapT=t.wrapT; n.repeat.copy(t.repeat); n.magFilter=t.magFilter; n.minFilter=t.minFilter;
  m.userData.nmap=n; m.normalMap=n; m.needsUpdate=true; return m; }
function xNmapGrain(m){ if(!XNG.grain){ const N=64, R=caveRng(4242), f=xFbm(N,R,4), g=xFbm(N,R,16), H=new Float32Array(N*N);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++) H[j*N+i]=f(i,j)*6+g(i,j)*3;
    const t=new THREE.CanvasTexture(xNormalMapWH(H,N,N,1.4)); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=t.minFilter=THREE.LinearFilter; XNG.grain=t; }
  m.userData.nmap=XNG.grain; m.userData.nmapShared=1; m.normalMap=XNG.grain; return m; }
