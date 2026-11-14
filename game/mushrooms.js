/* Hexmancers - small painted mushrooms (docs/art-production/mushrooms/; the plan
   docs/superpowers/plans/2026-11-14-mold-and-foliage-cards.md). Twelve kinds of cluster, each one painted tile in the
   effects sheet (envart.js), drawn as little cards at mixed sizes: most about a quarter of your height, some tiny, now
   and then one at knee height. The upright kinds stand on their root as two crossed cards, at the foot of walls among
   the fallen rocks; the bracket kinds (shelf fans, oyster rosettes) jut from walls and the sides of wood, one card set
   flat against the surface. Each room grows two or three kinds of its area's (a Fungus room all of them); the
   luminous ones glow softly (their glow masks: atlas/effects-e.webp, the same layout). */
const XMUSH={
  area:{ hollows:['lantern-bells','pinlight-colony','moss-puffballs','split-sage-caps','glow'], deeps:['ivory-bonnets','pinlight-colony'], vault:['violet-waves','coral-fingers'],
    rifts:['copper-cups','amber-buttons'], ruins:['amber-buttons','split-sage-caps','copper-cups'], abyss:['black-trumpets','violet-waves'] },
  upright:['lantern-bells','amber-buttons','ivory-bonnets','violet-waves','moss-puffballs','coral-fingers','copper-cups','black-trumpets','pinlight-colony','split-sage-caps','glow'],
  bracket:['shelf-fans','oyster-rosette'], noBracket:['rifts'], half:{rifts:['amber-buttons']},
  perRoom:[2,3],
  // card heights (world units: you stand about 1.7 tall): [lowest, highest, how often]
  size:{ tiny:[.12,.2,.25], small:[.25,.42,.6], knee:[.55,.75,.15] },
  cap:12, capFungus:30, capPassage:10,   // clusters and bracket patches a room grows at most (corridors: the whole floor's)
  damp:['flooded','bathhouse','crypt','fungus','overgrown','collapsed'],   // themes that grow more
};
// a kind's effects tile
const xMushTile=name=>name==='glow'?'mushrooms-glow':'cave20-mushroom-'+name;
const xMushMeta=name=>(typeof ENVART_MAP!=='undefined'&&ENVART_MAP.mush&&ENVART_MAP.mush[xMushTile(name)])||null;
const xMushReady=name=>typeof envArtFx==='function'&&!!envArtFx(xMushTile(name));
// a room's kinds: two or three of its area's, all of them in a Fungus room; stable, from a stream of its own
function xMushPick(room,seed,areaId){ const L=XMUSH.area[areaId]||[]; if(!L.length) return [];
  if(room&&room.theme==='fungus') return XMUSH.upright.slice();
  const R=caveRng(seed*53+((room&&room.id)|0)*131+6007), n=Math.min(L.length,XMUSH.perRoom[0]+(R()*(XMUSH.perRoom[1]-XMUSH.perRoom[0]+1)|0)), pool=L.slice(), out=[];
  while(out.length<n&&pool.length) out.push(pool.splice(R()*pool.length|0,1)[0]);
  return out; }
// a height, by how often each size comes up
function xMushSize(R){ const S=XMUSH.size, tot=Object.values(S).reduce((a,s)=>a+s[2],0); let r=R()*tot;
  for(const k in S){ const [lo,hi,w]=S[k]; if((r-=w)<=0) return lo+R()*(hi-lo); } return S.small[0]; }
// a kind's card shape: upright, two crossed cards on its root (the tile's pivot); a bracket, one card with its middle
// on the surface, tipped forward so the shelf juts out. Made once per kind.
const XMUSH_GEO=new Map();
function xMushGeo(name,bracket){ const key=(bracket?'b:':'u:')+name; if(XMUSH_GEO.has(key)) return XMUSH_GEO.get(key);
  let g;
  if(bracket){ g=new THREE.PlaneGeometry(1,1).rotateX(-.3); }
  else { const [pu,pv]=(xMushMeta(name)||{pivot:[.5,.85]}).pivot, P=[], U=[], N=[];
    for(const turn of [0,Math.PI/2]){ const q=new THREE.PlaneGeometry(1,1).translate(.5-pu,pv-.5,0).rotateY(turn).toNonIndexed(), n=turn?[1,1.2,0]:[0,1.2,1], l=Math.hypot(...n);
      P.push(...q.attributes.position.array); U.push(...q.attributes.uv.array); for(let i=0;i<q.attributes.position.count;i++) N.push(n[0]/l,n[1]/l,n[2]/l); }
    g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); }
  XMUSH_GEO.set(key,g); return g; }
// a kind's material: the painted card, cut out, lit like the stone; a luminous kind glows with its own colour through
// its glow mask (the glow does not light anything round it)
function xMushMat(name){ const img=envArtFx(xMushTile(name)), m=xPhong({color:0xffffff, map:xLeafTex(img,true), alphaTest:.5, side:THREE.DoubleSide, shininess:3, specular:0x0c0c0c});
  m.userData.noProj=1; const meta=xMushMeta(name), gl=meta&&meta.glow&&typeof envArtFxGlow==='function'&&envArtFxGlow(xMushTile(name));
  if(gl){ m.emissive=new THREE.Color(meta.glow).multiplyScalar(meta.k||.35); m.emissiveMap=xLeafTex(gl,true); }
  return m; }
/* Where they grow on a floor (nature.js xNature, after its own dressing, on a stream of their own so nothing else moves):
   for each wall face looking onto a room, now and then a cluster at its foot, in the band where the fallen rocks lie;
   on a wall face, now and then a patch of brackets (not in the Rifts). More in a damp room or by water (water: how
   near water each cell is, mold.js xMoldWaterField). add(kind, wall, spec) as nature's pieces. */
function xMushrooms(add,A,seed,faces,water){ if(!A||!XMUSH.area[A.id]) return; const R=caveRng(seed+3313), picks=new Map(), count=new Map(), half=XMUSH.half[A.id]||[];
  const roomOf=fl=>{ const r=EX.room[fl]; return r>=0?EX.rooms[r]:null; };
  const kindsOf=r=>{ const k=r?r.id:-1; if(!picks.has(k)) picks.set(k,(r?xMushPick(r,seed,A.id):XMUSH.area[A.id].slice(0,2)).filter(xMushReady)); return picks.get(k); };
  const room=r=>r?r.id:-1, cap=r=>!r?XMUSH.capPassage:r.theme==='fungus'?XMUSH.capFungus:XMUSH.cap, used=r=>count.get(room(r))||0, use=r=>count.set(room(r),used(r)+1);
  const brackets=XMUSH.noBracket.includes(A.id)?[]:XMUSH.bracket.filter(xMushReady);
  for(const F of faces){ const {c,fl,dx,dz,at}=F, r=roomOf(fl), fungus=r&&r.theme==='fungus', wet=water[fl]>.3||!!(r&&XMUSH.damp.includes(r.theme)), L=kindsOf(r);
    const a1=R(), a2=R(), a3=R();   // (a face always draws the same dice, whatever comes of them)
    if(L.length&&used(r)<cap(r)&&a1<(fungus?.3:wet?.14:.05)){ const n=1+(R()*3|0); use(r);
      for(let k=0;k<n;k++){ let name=L[R()*L.length|0]; if(half.includes(name)&&R()<.5) name=L[0]; const [x,z]=at((R()-.5)*1.5,.1+R()*.25), h=xMushSize(R);
        add('mush:'+name,c,{x,z,h,rot:R()*6.3,flip:R()<.5,col:'#ffffff'}); } }
    if(brackets.length&&used(r)<cap(r)&&a2<(fungus?.12:wet?.06:.015)){ use(r); const name=brackets[a3*brackets.length|0], n=2+(R()*3|0), [bx,bz]=at((R()-.5)*1.1,.03), y0=.4+R()*1.0;
      for(let k=0;k<n;k++){ const h=.22+R()*.3; add('bracket:'+name,c,{x:bx-dz*(R()-.5)*.6,z:bz+dx*(R()-.5)*.6,y:y0+(R()-.5)*.5,h,rot:Math.atan2(dx,dz),flip:R()<.5,col:'#ffffff'}); } } } }
/* A patch of bracket mushrooms (shelf fans or oyster rosettes) on a surface at (x,y,z) facing (nx,nz): two to four
   cards flat against it, tipped so their shelves jut out, into the merger get(tile) gives for the kind (dungeongen.js
   xLeafMerger: one draw call per kind per room). For a log's side, a crate's or a shelf's, a sapling's trunk. False if
   the art is not in. */
function xBracketCards(get,x,y,z,nx,nz,R){ const names=XMUSH.bracket.filter(xMushReady); if(!names.length) return false;
  const name=names[R()*names.length|0], F=get(xMushTile(name)), n=2+(R()*3|0), tx=-nz, tz=nx, a=-.3, ux=nx*Math.sin(-a), uy=Math.cos(a), uz=nz*Math.sin(-a);
  for(let k=0;k<n;k++){ const s=.2+R()*.25, px=x+tx*(R()-.5)*.5+nx*.02, py=y+(R()-.5)*.3, pz=z+tz*(R()-.5)*.5+nz*.02, fl=R()<.5, sh=.92+R()*.12;
    const ln=Math.hypot(nx,.5,nz);
    const corner=(su,sv)=>{ F.P.push(px+tx*su*s/2+ux*sv*s/2, py+uy*sv*s/2, pz+tz*su*s/2+uz*sv*s/2); F.N.push(nx/ln,.5/ln,nz/ln);
      F.U.push(((fl?-su:su)+1)/2,(sv+1)/2); F.C.push(sh,sh,sh); };
    for(const [su,sv] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]) corner(su,sv); }
  return true; }
