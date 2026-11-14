/* Hexmancers - mold on the dungeon's floors and walls (docs/superpowers/plans/2026-11-14-mold-and-foliage-cards.md).
   The painted mold (docs/art-production/mold/) is 20 repeating tiles, ten colours each dense and sparse, in one atlas
   sheet (atlas/mold.webp, envart.js envArtMold). Each area grows its own few colours and each room picks one of them
   (a big room a second, at half weight), more in the damp themes, none in a library.

   Where it grows is the mold map: one texture over the floor on the AO map's grid (look.js xBakeAO, 8 texels a cell).
   Its red, green and blue are how much of the area's first, second and third colour grows there (0..255 is 0..2), its
   alpha how damp it is there: shut in by walls (within a cell of a wall's foot, more in corners) or near water (a flooded
   room, a pool or a basin, the area's still pools). Both are worked out at the middle of each cell and blended across
   to the next, so a doorway between two rooms cross-fades over a cell. The shader (xMoldShader) lays the dense tile where
   it is damp and a sprinkle of the sparse one elsewhere. */
const XMOLD={
  area:{ hollows:['olive-powder','teal-fuzz','mint-patina-mold'], deeps:['slate-blue-bloom','ivory-mycelium'], vault:['plum-mildew','dusty-rose-mildew'],
    rifts:['rust-crust','charcoal-blight','ochre-spores'], ruins:['ochre-spores','olive-powder','ivory-mycelium'], abyss:['charcoal-blight','plum-mildew'] },
  // how much grows, by the room's theme (times the room level); rooms with no theme take room, corridors passage, and
  // the battle floor arena
  theme:{ flooded:1.6, bathhouse:1.6, crypt:1.4, fungus:1.5, overgrown:1.4, collapsed:1.3, forge:.4, armory:.5, barracks:.5, library:0 },
  room:.7, passage:.45, arena:.35,
  big:40,        // a room of this many cells or more grows a second colour, at half weight
  water:2.5,     // how far (cells) the damp reaches from water
};
// the floor's own seed for its choices (a floor is the same every time you come to it)
function xMoldSeed(){ return (EX.depth*31+(((typeof save!=='undefined'&&save&&save.worldSeed)|0)*7))|0; }
// a room's colour slots: a, and for a big room b (at half weight); stable, from a stream of its own
function xMoldPick(roomId,seed,nSlots){ const R=caveRng(seed*31+roomId*977+4441), n=Math.max(1,nSlots|0), a=R()*n|0;
  let b=null; const r=EX&&EX.rooms&&EX.rooms[roomId]; if(n>1&&r&&r.w*r.h>=XMOLD.big){ b=(a+1+(R()*(n-1)|0))%n; } return {a,b}; }
// how much mold a room grows (before its colour pick)
function xMoldLevel(r){ if(!r) return XMOLD.passage; const t=r.flood?'flooded':r.theme; return t&&XMOLD.theme[t]!=null?XMOLD.room*XMOLD.theme[t]:XMOLD.room; }
// the cells that count as water: a flooded room, a pool or a basin, the area's still pools
function xMoldWaterCells(){ const W=new Set();
  for(const r of EX.rooms||[]) if(r.flood) for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++){ const c=xi(i,j); if(EX.room[c]===r.id) W.add(c); }
  for(const mk of EX.marks||[]) if(mk.kind==='clutter') for(const it of mk.items) if(it.k==='pool'||it.k==='basin') for(const c of it.cells) W.add(c);
  for(const P of EX.natPools||[]) for(const c of P.cells||[]) W.add(c);
  return W; }
// the damp from water at each cell's middle: 1 on the water, falling to 0 XMOLD.water cells away
function xMoldWaterField(){ const N=XN*XN, F=new Float32Array(N), W=xMoldWaterCells(), reach=Math.ceil(XMOLD.water);
  for(const c of W){ const x=xcx(c), y=xcy(c);
    for(let dy=-reach;dy<=reach;dy++) for(let dx=-reach;dx<=reach;dx++){ const X=x+dx, Y=y+dy; if(X<0||Y<0||X>=XN||Y>=XN) continue;
      const v=Math.max(0,1-Math.hypot(dx,dy)/XMOLD.water), q=xi(X,Y); if(v>F[q]) F[q]=v; } }
  return F; }
// the area's slots this floor: their tile keys (dense, sparse) and their rectangles in the sheet (u, v up, w, h)
function xMoldSlots(A){ const ids=(A&&XMOLD.area[A.id])||XMOLD.area.hollows; return ids.map(id=>({id, dense:id, sparse:id+'-sparse'})); }
function xMoldRect(key){ const S=typeof ENVART_MAP!=='undefined'&&ENVART_MAP.sheets&&ENVART_MAP.sheets.mold, t=S&&S.tiles[key]; if(!t) return [0,0,0,0];
  const [W,H]=S.size; return [t[0]/W,1-(t[1]+t[3])/H,t[2]/W,t[3]/H]; }
// the uniforms the shader reads: the mold map, its slots' rectangles (dense then sparse, three slots)
function xMoldUniforms(tex,slots){ const U=XLITU; U.uXMoldMap.value=tex||null;
  for(let k=0;k<3;k++){ const s=slots[k]; U.uXMoldR.value[k*2].fromArray(s?xMoldRect(s.dense):[0,0,0,0]); U.uXMoldR.value[k*2+1].fromArray(s?xMoldRect(s.sparse):[0,0,0,0]); } }
// the damp of being shut in by walls at texel (tx,ty) of the map: strongest at a wall's foot, gone a cell out, adding up
// in a corner (the walls of the 3 x 3 cells round about)
function xMoldWallDamp(tx,ty){ const R=XAO_R, wx=(tx+.5)/R, wz=(ty+.5)/R, cx=Math.floor(wx), cy=Math.floor(wz); let o=0;
  if(cx<0||cy<0||cx>=XN||cy>=XN||EX.t[xi(cx,cy)]!==T_FLOOR) return 1;
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const X=cx+dx, Y=cy+dy; if(X<0||Y<0||X>=XN||Y>=XN||EX.t[xi(X,Y)]===T_FLOOR) continue;
    const ex=Math.max(X-wx,0,wx-X-1), ez=Math.max(Y-wz,0,wz-Y-1), w=Math.max(0,1-Math.hypot(ex,ez)); o+=w*w; }
  return 1-Math.exp(-o*1.6); }
/* The mold map for the floor in front of you (called by look.js xBakeAO, after the AO map, on its grid). */
function xMoldBake(){ if(!EX||!EX.rooms||!EX.aoData) return; const R=XAO_R, W=XN*R, N=XN*XN, d=EX.moldData||(EX.moldData=new Uint8Array(W*W*4));
  const slots=xMoldSlots(EX.area), n=slots.length, seed=xMoldSeed(), water=xMoldWaterField();
  // each cell's three colour weights (a wall takes the most of the floor beside it, so the foot of a wall is not starved)
  const CW=new Float32Array(N*3), floor=c=>EX.t[c]===T_FLOOR;
  const picks=new Map(); for(const r of EX.rooms) picks.set(r.id,xMoldPick(r.id,seed,n));
  for(let c=0;c<N;c++){ if(!floor(c)) continue; const ri=EX.room[c], r=ri>=0?EX.rooms[ri]:null, lv=xMoldLevel(r);
    if(!r){ CW[c*3]=lv; continue; } const p=picks.get(r.id); CW[c*3+p.a]+=lv; if(p.b!=null) CW[c*3+p.b]+=lv*.5; }
  for(let c=0;c<N;c++){ if(floor(c)) continue; const x=xcx(c), y=xcy(c);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const X=x+dx, Y=y+dy; if(X<0||Y<0||X>=XN||Y>=XN) continue; const q=xi(X,Y); if(!floor(q)) continue;
      for(let k=0;k<3;k++) CW[c*3+k]=Math.max(CW[c*3+k],CW[q*3+k]); if(water[q]>water[c]) water[c]=water[q]; } }
  // per texel: the cell-middle values blended across (bilinear) from the floor round about, the damp the larger of the
  // walls' and the water's. A floor texel blends only with floor (a wall's borrowed weights would leak one room's mold
  // into the next across the wall between them); a wall texel keeps its own (the walls read the floor in front of them)
  const at=(x,y,own)=>{ const q=xi(Math.min(XN-1,Math.max(0,x)),Math.min(XN-1,Math.max(0,y))); return floor(own)&&!floor(q)?own:q; };
  for(let ty=0;ty<W;ty++){ const gy=(ty+.5)/R-.5, y0=Math.floor(gy), fy=gy-y0;
    for(let tx=0;tx<W;tx++){ const own=xi(Math.floor(tx/R),Math.floor(ty/R)), gx=(tx+.5)/R-.5, x0=Math.floor(gx), fx=gx-x0;
      const a=floor(own)?at(x0,y0,own):own, b=floor(own)?at(x0+1,y0,own):own, c=floor(own)?at(x0,y0+1,own):own, e=floor(own)?at(x0+1,y0+1,own):own;
      const w00=(1-fx)*(1-fy), w10=fx*(1-fy), w01=(1-fx)*fy, w11=fx*fy, o=(ty*W+tx)*4;
      for(let k=0;k<3;k++){ const v=CW[a*3+k]*w00+CW[b*3+k]*w10+CW[c*3+k]*w01+CW[e*3+k]*w11; d[o+k]=Math.min(255,Math.round(v*127.5)); }
      const wv=water[a]*w00+water[b]*w10+water[c]*w01+water[e]*w11; d[o+3]=Math.round(255*Math.max(xMoldWallDamp(tx,ty),Math.min(1,wv))); } }
  if(!EX.moldTex){ const t=new THREE.DataTexture(d,W,W,THREE.RGBAFormat); t.magFilter=t.minFilter=THREE.LinearFilter; EX.moldTex=t; }
  EX.moldTex.needsUpdate=true; xMoldUniforms(EX.moldTex,slots); }
/* The battle floor: the area's first colour, light, everywhere; no damp (its scale and origin are the arena AO map's). */
function xMoldArena(A){ if(!A) return; const N=16, d=A.moldData||(A.moldData=new Uint8Array(N*N*4)), v=Math.round(XMOLD.arena*127.5);
  for(let i=0;i<N*N;i++){ d[i*4]=v; d[i*4+1]=d[i*4+2]=d[i*4+3]=0; }
  if(!A.moldTex){ const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat); t.magFilter=t.minFilter=THREE.LinearFilter; A.moldTex=t; }
  A.moldTex.needsUpdate=true; A.moldSlots=xMoldSlots(A.area); }
