/* The spacious floor (layout 2, dungeon redesign). Bigger rooms, a few of them landmark halls, joined as a graph:
   a spanning tree of corridors plus loops, so you rarely walk back the way you came. Corridors are three cells
   wide (a gallery five), run in any of eight directions, and every floor has at least two long diagonals.
   A corridor never opens into a room: it narrows to a one-cell doorway with a one-cell vestibule outside it, on a
   straight side of the room, so locks, secret doors and the boss door work exactly as before. The ring of wall
   around every room is never dug by a wide corridor, so a corridor cannot slip round a lock or into a room.
   x2Rooms places the rooms; x2Corridors digs the main corridors. tryFloor (explore.js) does everything after that
   (side rooms, the gate, locks, the boss door, checks) the same for both layouts. */
const X2={ n:96, yaw:45, marg:5, landmarks:[3,4], rooms:[12,16], small:6, loops:3, wide:3, gallery:5, diagMin:6, diagNeed:3, view:[10,16], wall:2.8*2.1 };   // wall: the walls' height, 2.1 times a person (XSPR 2.8; old floors 2.5)
// whether the player asked for less motion (no shake, no rush-in when a fight starts)
const XRM=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
// the camera's distance that fits XLIT.dView cells (debug menu › Dungeon camera, 10-16, 12 normal) across the shorter side: across the width on an upright screen, else
// down the height (the ground there is seen at the camera's pitch, so it stretches by 1/sin)
function xViewDist(pitch){ const th=Math.tan(X3.cam.fov*Math.PI/360), a=X3.cam.aspect, n=(a<1?Math.max(5,Math.min(12,XLIT.dViewP||7)):Math.max(X2.view[0],Math.min(X2.view[1],XLIT.dView||12)))*XCS/XLIT.camZoom;   // an upright phone sees fewer cells across (dViewP), so the people stay big
  return a<1?n/(2*th*a):n*Math.sin(pitch)/(2*th); }

/* Room shapes. A room keeps its bounding box (x, y, w, h: placement, lighting and the old code read it) and a shape:
   L (one corner cut away), H (two legs and a bar, either way round), X (a plus: two crossing bands) or none (a
   rectangle). x2In says whether a cell of the box is floor. Every shape keeps whole cells on all four sides of the box,
   so a doorway always opens straight onto the room. */
function x2Shape(R,ri,w,h,big){ const r=R();
  if(w>=9&&h>=9&&r<(big?.35:.12)) return {k:'X',a:Math.max(3,Math.round(w*(.34+R()*.12))),b:Math.max(3,Math.round(h*(.34+R()*.12)))};
  if(w>=9&&h>=8&&r<(big?.7:.24)){ const v=R()<.5, W=v?h:w, H=v?w:h; return {k:'H',v,a:Math.max(3,Math.round(W*.3)),b:Math.max(3,Math.round(H*.34))}; }
  if(w>=7&&h>=6&&r<(big?.85:.55)) return {k:'L',c:ri(0,3),cw:Math.min(w-3,Math.max(3,Math.round(w*(.4+R()*.15)))),ch:Math.min(h-3,Math.max(3,Math.round(h*(.4+R()*.15))))};
  return null; }
function x2In(r,lx,ly){ const S=r.shape; if(!S) return true; const w=r.w, h=r.h;
  if(S.k==='T') return '#BD'.includes(S.g[ly][lx]);   // a template (roomshapes.js): floor, bridge or doorway
  if(S.k==='L'){ const cx=S.c&1?lx<S.cw:lx>=w-S.cw, cy=S.c&2?ly>=h-S.ch:ly<S.ch; return !(cx&&cy); }
  if(S.k==='X'){ const ox=(w-S.a)>>1, oy=(h-S.b)>>1; return lx>=ox&&lx<ox+S.a||ly>=oy&&ly<oy+S.b; }
  if(S.k==='H'){ const u=S.v?ly:lx, v=S.v?lx:ly, U=S.v?h:w, V=S.v?w:h, o=(V-S.b)>>1; return u<S.a||u>=U-S.a||v>=o&&v<o+S.b; }
  return true; }
// the room's middle for the stairs, a boss or a centrepiece: the floor cell deepest inside it, nearest the box's middle
function x2Centre(r,room){ let best=null, bs=-Infinity; const mx=r.x+r.w/2-.5, my=r.y+r.h/2-.5;
  for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++){ if(room[xi(i,j)]!==r.id) continue; let d=0;
    while(d<6){ let ok=true; for(let dy=-d-1;dy<=d+1&&ok;dy++) for(let dx=-d-1;dx<=d+1;dx++) if(room[xi(i+dx,j+dy)]!==r.id){ ok=false; break; } if(!ok) break; d++; }
    const sc=d*100-Math.hypot(i-mx,j-my); if(sc>bs){ bs=sc; best=[i,j]; } }
  if(best){ r.cx=best[0]; r.cy=best[1]; } }

/* Low walls inside a room: short runs, pillars and blocks of stone you walk round (drawn about half height and
   seen over, but solid underfoot). Never within two cells of the room's edge (doorways and the way round stay
   clear) or of its middle (the stairs), and only where the room stays in one piece. */
// is the room still in one piece (every cell reachable from its middle, 4-way)?
function x2Whole(r,room){ let n=0; for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++) if(room[xi(i,j)]===r.id) n++;
  const seen=new Set([xi(r.cx,r.cy)]), q=[xi(r.cx,r.cy)]; for(let h=0;h<q.length;h++) for(const c of [q[h]-1,q[h]+1,q[h]-XN,q[h]+XN]) if(room[c]===r.id&&!seen.has(c)){ seen.add(c); q.push(c); }
  return seen.size===n; }
function x2Walls(rooms,F,R,ri){ const {t,room}=F, low=F.low||[];
  const clear=(i,j,r)=>{ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) if(room[xi(i+dx,j+dy)]!==r.id) return false; return Math.hypot(i-r.cx,j-r.cy)>2.5; };
  const whole=r=>x2Whole(r,room);
  const PIECES=[[[0,0],[1,0],[2,0]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2]],[[0,0],[0,1],[0,2],[0,3]],[[0,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[0,1],[1,1],[2,1]]];
  for(const r of rooms){ if(r.side||r.w<8||r.h<7||r.shape&&r.shape.k==='T') continue; const area=r.w*r.h, want=r.mark?ri(0,1):r.landmark?ri(2,4):area>=60&&R()<.75?ri(1,2):R()<.35?1:0;
    for(let n=0,k=0;n<want&&k<40;k++){ const P=PIECES[ri(0,PIECES.length-1)], ox=ri(r.x+2,r.x+r.w-3), oy=ri(r.y+2,r.y+r.h-3);
      const cells=P.map(([dx,dy])=>[ox+dx,oy+dy]); if(!cells.every(([i,j])=>clear(i,j,r))) continue;
      for(const [i,j] of cells){ const c=xi(i,j); t[c]=T_ROCK; room[c]=-1; }
      if(!whole(r)){ for(const [i,j] of cells){ const c=xi(i,j); t[c]=T_FLOOR; room[c]=r.id; } continue; }
      for(const [i,j] of cells) low.push(xi(i,j)); r.walls=true; n++; } }
  F.low=low; }

/* Landmark centrepieces: each landmark hall gets one, a different kind per floor where it can. Laid out along the
   hall's long axis (u) and across it (v), never on the middle (the stairs or a boss stand there), always a cell clear
   of the walls and only where the hall stays in one piece. Their cells are solid like the low walls (F.low: you see
   over them, you walk round them) and are listed in F.marks, which is what the scene draws (xLandmarks); the shapes
   drawn never decide what is solid.
   shrine: an altar on a dais. chasm: a pit across the hall with a broken bridge. archive: fallen shelves.
   hall: a colonnade either side of a processional way. */
const X2MARK={
  shrine:{need:1, pieces:[[[-1,3],[0,3],[1,3]]]},   // (on the side the altar is drawn: v +3)
  chasm:{need:1, pieces:[[-3,-2,-1,0,1,2,3].flatMap(u=>[[u,3],[u,4]])], small:{need:1, pieces:[[-2,-1,0,1,2].flatMap(u=>[[u,3],[u,4]])]}},
  archive:{need:2, small:{need:2, pieces:[[[-3,-3],[-2,-3]],[[2,-3],[3,-3]],[[-3,3],[-2,3]],[[2,3],[3,3]]]}, pieces:[[[-4,-3],[-3,-3],[-2,-3]],[[2,-3],[3,-3],[4,-3]],[[-4,3],[-3,3],[-2,3]],[[2,3],[3,3],[4,3]]]},
  hall:{need:4, pieces:[-4,-2,0,2,4].flatMap(u=>[[[u,-3]],[[u,3]]])} };
function x2Marks(rooms,F,R){ const {t,room}=F, low=F.low||(F.low=[]), marks=F.marks||(F.marks=[]);
  x2Feats(rooms,F);
  const deck=Object.keys(X2MARK).sort(()=>R()-.5); let next=0;
  for(const r of rooms){ if(!r.landmark||r.side||r.shape&&r.shape.k==='T') continue; const horiz=r.w>=r.h;
    for(let k=0;k<deck.length;k++){ const kind=deck[(next+k)%deck.length];
      for(const K of [X2MARK[kind],X2MARK[kind].small].filter(Boolean)) for(const s of [1,-1]){ if(r.mark) break; const at=([u,v])=>horiz?xi(r.cx+u,r.cy+v*s):xi(r.cx+v*s,r.cy+u), placed=[];
        for(const P of K.pieces){ const cells=P.map(at), mine=new Set(cells);
          // every cell and all eight round it must be the hall's own floor (or the same piece)
          if(!cells.every(c=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const n=c+dy*XN+dx; if(room[n]!==r.id&&!mine.has(n)) return false; } return true; })) continue;
          for(const c of cells){ t[c]=T_ROCK; room[c]=-1; }
          if(!x2Whole(r,room)){ for(const c of cells){ t[c]=T_FLOOR; room[c]=r.id; } continue; }
          placed.push(cells); }
        if(placed.length>=K.need){ for(const p of placed) low.push(...p); marks.push({room:r.id,kind,horiz,s,cx:r.cx,cy:r.cy,pieces:placed}); r.mark=kind; r.walls=true; next+=k+1; break; }
        for(const p of placed) for(const c of p){ t[c]=T_FLOOR; room[c]=r.id; } }
      if(r.mark) break; } } }

/* A template room's own pieces, once the floor is stamped (its floor, bridges and doorways are already floor):
   L low walls and W water and C chasm cells are solid underfoot but seen over (F.low); P pillars stay full walls.
   Water, chasm and bridge cells are listed in F.marks (kinds pool, pit, bridge) for the scene to draw (xShapeFeats). */
function x2Feats(rooms,F){ const low=F.low, marks=F.marks;
  for(const r of rooms){ const S=r.shape; if(!S||S.k!=='T') continue; const got={pool:[],pit:[],bridge:[]};
    for(let ly=0;ly<r.h;ly++) for(let lx=0;lx<r.w;lx++){ const ch=S.g[ly][lx], c=xi(r.x+lx,r.y+ly);
      if(ch==='L'||ch==='W'||ch==='C') low.push(c);
      if(ch==='W') got.pool.push(c); else if(ch==='C') got.pit.push(c); else if(ch==='B') got.bridge.push(c); }
    for(const kind of ['pool','pit','bridge']) if(got[kind].length) marks.push({room:r.id,kind,pieces:[got[kind]],cx:r.cx,cy:r.cy}); } }

/* Clutter: things to fill the spacious floor's rooms and galleries (placed when the floor is dug, so they are kept
   with it). Each room rolls a kit and gets a few pieces, more in a landmark hall:
     pillar   a standing column (some broken)            fire     a column with a fire bowl on top: swing at it
     ruin     a broken stretch of temple wall (3 cells)  column   a fallen column (3 cells)
     planter  a long stone planter, overgrown (2 cells)  boulder  a big rock; bigrock: four cells of them
     rubble   loose stones you walk over
   Everything but rubble is solid underfoot and seen over (F.low), only ever where the room stays in one piece, two
   cells clear of its edge (doorways) and of its middle (the stairs). Ruins are pale marble in bright areas and dark
   basalt in grim ones. Galleries (passages five wide) get pillars and fire pillars along their sides. Template rooms
   get only a few, clear of their own pieces. One F.marks entry per room ({kind:'clutter', items}) is what the scene draws (xClutter);
   a fire pillar's item.out says it was snuffed. */
const X2C={room:.8, kits:{temple:['pillar','pillar','fire','ruin','ruin','column','planter','rubble'], garden:['planter','planter','planter','boulder','pillar','fire','rubble'],
  cave:['boulder','boulder','bigrock','bigrock','rubble','rubble','fire','ruin'], hall:['pillar','pillar','pillar','fire','fire','ruin','column','planter','rubble']}};
const XDARK_RUIN=new Set(['rifts','abyss','deeps']);
function x2Clutter(rooms,F,R,ri,depth){ const {t,room,doors}=F, low=F.low||(F.low=[]), marks=F.marks||(F.marks=[]);
  const aid=depth&&typeof areaOf==='function'?areaOf(depth).id:'hollows', nat=typeof XNATURAL!=='undefined'&&XNATURAL.has(aid), dark=XDARK_RUIN.has(aid);
  const SH={pillar:[[[0,0]]], fire:[[[0,0]]], boulder:[[[0,0]]], bigrock:[[[0,0],[1,0],[0,1],[1,1]]], planter:[[[0,0],[1,0]],[[0,0],[0,1]]],
    column:[[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]]], ruin:[[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]]]};
  for(const r of rooms){ if(r.side||r.nook||r.w<7||r.h<6||R()>X2C.room) continue; const tpl=!!(r.shape&&r.shape.k==='T');
    const kit=X2C.kits[r.landmark?(nat&&R()<.5?'cave':'hall'):nat?(R()<.65?'cave':'garden'):(R()<.6?'temple':'garden')];
    const want=tpl?ri(2,4):r.mark?ri(2,4):r.landmark?ri(7,11):r.w*r.h>=60?ri(4,6):ri(2,4), items=[], solid=[];
    // a clear ring of one cell round each piece (so the box's edge stays a walkway), two cells from any doorway, off the middle
    const clear=(i,j)=>{ if(i<r.x+1||j<r.y+1||i>r.x+r.w-2||j>r.y+r.h-2||Math.hypot(i-r.cx,j-r.cy)<2) return false;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(room[xi(i+dx,j+dy)]!==r.id) return false;
      for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) if(doors.has(xi(i+dx,j+dy))) return false; return true; };
    let rub=0;
    for(let n=0,k=0;n<want&&k<120;k++){ const kind=kit[ri(0,kit.length-1)], ox=ri(r.x+1,r.x+r.w-2), oy=ri(r.y+1,r.y+r.h-2);
      if(kind==='rubble'){ const c=xi(ox,oy); if(rub<2&&room[c]===r.id&&!items.some(it=>it.cells.includes(c))){ items.push({k:'rubble',cells:[c],sd:ri(0,9999)}); n++; rub++; } continue; }
      const P=SH[kind][ri(0,SH[kind].length-1)], cells=P.map(([dx,dy])=>[ox+dx,oy+dy]); if(!cells.every(([i,j])=>clear(i,j))) continue;
      const cs=cells.map(([i,j])=>xi(i,j)); for(const c of cs){ t[c]=T_ROCK; room[c]=-1; }
      if(!x2Whole(r,room)){ for(const c of cs){ t[c]=T_FLOOR; room[c]=r.id; } continue; }
      low.push(...cs); solid.push(...cs); items.push({k:kind,cells:cs,sd:ri(0,9999),v:cs.length>1&&xcx(cs[1])===xcx(cs[0])?1:0}); n++; }
    if(!items.length) continue; if(solid.length) r.walls=true;
    marks.push({kind:'clutter',room:r.id,dark,nat,items,pieces:[solid],cx:r.cx,cy:r.cy}); }
  // galleries: a passage cell against a straight wall with four more cells of passage across from it
  const pass=c=>t[c]===T_FLOOR&&room[c]<0&&!doors.has(c), rock=c=>t[c]===T_ROCK&&room[c]<0&&!low.includes(c), placed=[];
  const nearDoor=c=>{ for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++) if(doors.has(c+dy*XN+dx)) return true; return false; };
  for(let k=0;k<4000&&placed.length<14;k++){ const x=ri(3,XN-4), y=ri(3,XN-4), c=xi(x,y); if(!pass(c)) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const back=c-dx-dy*XN, side=dx?XN:1; if(!rock(back)||!rock(back+side)||!rock(back-side)) continue;
      let ok=true; for(let s2=1;s2<=4&&ok;s2++){ const f=c+(dx+dy*XN)*s2; if(!pass(f)||!pass(f+side)||!pass(f-side)) ok=false; } if(!ok||!pass(c+side)||!pass(c-side)) continue;
      if(nearDoor(c)||placed.some(q=>Math.max(Math.abs(xcx(q)-x),Math.abs(xcy(q)-y))<5)) continue;
      t[c]=T_ROCK; low.push(c); placed.push(c);
      marks.push({kind:'clutter',room:-1,dark,nat,items:[{k:R()<.4?'fire':'pillar',cells:[c],sd:ri(0,9999),v:0}],pieces:[[c]],cx:x,cy:y}); break; } } }

// rooms: landmark halls first (they need the room), then ordinary rooms; null when too few fit
/* Template rooms (roomshapes.js): most landmark halls take one of the six hall shapes (a different one each), and
   about a third of the ordinary rooms one of the room shapes (the cave pocket only in a natural area). The box is the
   template's own size. Template rooms keep their own pillars and pools: no low walls or centrepiece is added. */
const X2T={hall:.7, room:.35};
function x2Rooms(R,ri,plan,depth){ const rooms=[], small=!!plan.small, want=small?X2.small:ri(...X2.rooms);
  const tpl=typeof rsPick==='function', nat=tpl&&depth&&typeof areaOf==='function'&&typeof XNATURAL!=='undefined'&&XNATURAL.has(areaOf(depth).id), usedT=new Set();
  const free=(x,y,w,h,m)=>!rooms.some(r=>x<r.x+r.w+m&&x+w+m>r.x&&y<r.y+r.h+m&&y+h+m>r.y);
  const lm=small?0:ri(...X2.landmarks);
  for(let k=0;k<2500&&rooms.length<want;k++){ const big=rooms.length<lm, T=tpl&&R()<(big?X2T.hall:X2T.room)?rsPick(R,big?'hall':'room',nat,big?usedT:null):null;
    const w=T?T.g[0].length:big?ri(13,18):ri(7,13), h=T?T.g.length:big?ri(12,16):ri(6,11), x=ri(2,XN-w-3), y=ri(2,XN-h-3);
    if(free(x,y,w,h,X2.marg)){ if(T&&big) usedT.add(T.id); rooms.push({x,y,w,h,lit:big||R()<.68,landmark:big||undefined,shape:T||x2Shape(R,ri,w,h,big)||undefined}); }
    else if(big&&k>600) break; }   // no room left for a hall: the floor is tried again
  if(rooms.filter(r=>r.landmark).length<lm||rooms.length<(small?5:X2.rooms[0])) return null;
  return rooms; }

// the main corridors between the main rooms; false when the floor should be tried again
function x2Corridors(main,F,R,ri){ const {t,room,doors}=F, n=main.length;
  // a room's box and the ring round it are never dug by a corridor (a shaped room's cut-away corners stay rock)
  const box=new Uint8Array(XN*XN); for(const r of F.rooms) for(let j=r.y-1;j<=r.y+r.h;j++) for(let i=r.x-1;i<=r.x+r.w;i++) if(i>=0&&j>=0&&i<XN&&j<XN) box[xi(i,j)]=1;
  const prot=i=>{ const x=xcx(i), y=xcy(i); if(x<1||y<1||x>=XN-1||y>=XN-1) return true; return !!box[i]; };
  const inside=(x,y)=>x>=1&&y>=1&&x<XN-1&&y<XN-1;
  // a doorway on room a's side facing (tx,ty): the door cell in the wall ring and the vestibule outside it
  const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
  const doorways=(a,tx,ty)=>{ const vx=tx-a.cx, vy=ty-a.cy, out=[];
    // a template room: only its own doorways (D on its edge), the ones facing the target first
    if(a.shape&&a.shape.k==='T'){ const list=rsDoors(a.shape.g).sort((p,q)=>(q[2]*vx+q[3]*vy)-(p[2]*vx+p[3]*vy));
      for(const [lx,ly,sx,sy] of list){ const x=a.x+lx+sx, y=a.y+ly+sy, vx2=x+sx, vy2=y+sy; if(!inside(vx2,vy2)) continue; const d=xi(x,y), v=xi(vx2,vy2);
        if(prot(v)) continue; let near=false; for(let k=-2;k<=2;k++){ const c=sx?xi(x,y+k):xi(x+k,y); if(doors.has(c)) near=true; } if(near) continue; out.push({d,v}); }
      return out; }
    const order=SIDES.slice().sort((p,q)=>(q[0]*vx+q[1]*vy)-(p[0]*vx+p[1]*vy));
    for(const [sx,sy] of order.slice(0,2)) for(const off of [0,2,-2,4,-4]){
      let x, y; if(sx){ x=sx>0?a.x+a.w:a.x-1; y=Math.max(a.y+1,Math.min(a.y+a.h-2,ty))+off; if(y<a.y+1||y>a.y+a.h-2) continue; }
      else { y=sy>0?a.y+a.h:a.y-1; x=Math.max(a.x+1,Math.min(a.x+a.w-2,tx))+off; if(x<a.x+1||x>a.x+a.w-2) continue; }
      if(room[xi(x-sx,y-sy)]!==a.id) continue;   // the room has floor right inside this doorway
      const vx2=x+sx, vy2=y+sy; if(!inside(vx2,vy2)) continue; const d=xi(x,y), v=xi(vx2,vy2);
      if(prot(v)) continue;   // the vestibule may not touch another room's ring
      let near=false; for(let k=-2;k<=2;k++){ const c=sx?xi(x,y+k):xi(x+k,y); if(doors.has(c)) near=true; } if(near) continue;
      out.push({d,v}); }
    return out; };
  // the centre line from one vestibule to the other: a diagonal run and a straight run, in either order,
  // or straight-diagonal-straight; each diagonal step must have an open bridge cell, so the band never pinches
  const shapes=(x0,y0,x1,y1)=>{ const dx=x1-x0, dy=y1-y0, sx=Math.sign(dx), sy=Math.sign(dy), ad=Math.abs(dx), bd=Math.abs(dy), dg=Math.min(ad,bd);
    const run=(pts,x,y,mx,my,k)=>{ for(let i=0;i<k;i++){ x+=mx; y+=my; pts.push([x,y]); } return [x,y]; };
    const st=ad>bd?[sx,0]:[0,sy], sl=Math.abs(ad-bd), out=[];
    for(const form of [0,1,2]){ const p=[[x0,y0]]; let q=[x0,y0];
      if(form===0){ q=run(p,...q,sx,sy,dg); run(p,...q,...st,sl); }
      else if(form===1){ q=run(p,...q,...st,sl); run(p,...q,sx,sy,dg); }
      else { const h=sl>>1; q=run(p,...q,...st,h); q=run(p,...q,sx,sy,dg); run(p,...q,...st,sl-h); }
      out.push({pts:p,diag:dg}); }
    return out; };
  const ok=pts=>{ for(let k=0;k<pts.length;k++){ const [x,y]=pts[k]; if(!inside(x,y)||(k>0&&k<pts.length-1&&prot(xi(x,y)))) return false;
      if(k){ const [px,py]=pts[k-1]; if(px!==x&&py!==y&&prot(xi(x,py))&&prot(xi(px,y))) return false; } }
    return true; };
  const dig=(pts,w)=>{ const r=(w-1)>>1;
    for(let k=0;k<pts.length;k++){ const [x,y]=pts[k];
      if(k){ const [px,py]=pts[k-1]; if(px!==x&&py!==y){ for(const b of [xi(x,py),xi(px,y)]) if(!prot(b)&&t[b]===T_ROCK) t[b]=T_FLOOR; } }
      for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const nx=x+dx, ny=y+dy; if(!inside(nx,ny)) continue; const c=xi(nx,ny); if(!prot(c)&&t[c]===T_ROCK) t[c]=T_FLOOR; } } };
  // one corridor between rooms a and b, as wide as w; null when no doorway pair and shape fits
  const link=(a,b,w,maxLen)=>{ for(const A of doorways(a,b.cx,b.cy).slice(0,6)) for(const B of doorways(b,xcx(A.v),xcy(A.v)).slice(0,4)){
      const forms=shapes(xcx(A.v),xcy(A.v),xcx(B.v),xcy(B.v)).sort((p,q)=>(q.diag-p.diag)||(R()-.5));
      for(const f of forms){ if(maxLen&&f.pts.length>maxLen||!ok(f.pts)) continue;
        for(const D of [A,B]){ t[D.d]=T_DOOR; doors.set(D.d,{state:R()<.3?'closed':'open'}); t[D.v]=T_FLOOR; }
        dig(f.pts,w); return {a:a.id,b:b.id,w,diag:f.diag}; } }
    return null; };
  F.link=link;   // tryFloor joins the side rooms and the gate's corridor with it too
  // the graph: a spanning tree by distance (Prim), then loops between rooms the tree keeps far apart
  const dist=(p,q)=>Math.hypot(p.cx-q.cx,p.cy-q.cy), inT=new Set([0]), edges=[];
  while(inT.size<n){ let best=null; for(const i of inT) for(let j=0;j<n;j++) if(!inT.has(j)){ const d=dist(main[i],main[j]); if(!best||d<best[2]) best=[i,j,d]; }
    inT.add(best[1]); edges.push(best); }
  const adj=main.map(()=>new Set()); const hops=(s,e)=>{ const seen=new Map([[s,0]]), q=[s]; for(let h=0;h<q.length;h++) for(const m of adj[q[h]]) if(!seen.has(m)){ seen.set(m,seen.get(q[h])+1); q.push(m); } return seen.has(e)?seen.get(e):99; };
  // the gallery: the longest tree corridor or two are five wide
  const longest=edges.slice().sort((p,q)=>q[2]-p[2]).slice(0,n>6?2:1);
  const cors=[];
  for(const e of edges){ const c=link(main[e[0]],main[e[1]],longest.includes(e)?X2.gallery:X2.wide); if(!c) return false; cors.push(c); adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
  const want=n>6?X2.loops:1, cand=[]; for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) if(!adj[i].has(j)) cand.push([i,j,dist(main[i],main[j])]);
  cand.sort((p,q)=>p[2]-q[2]); let loops=0;
  for(const [i,j,d] of cand){ if(loops>=want) break; if(d>34||hops(i,j)<3) continue; const c=link(main[i],main[j],X2.wide); if(!c) continue; cors.push(c); adj[i].add(j); adj[j].add(i); loops++; }
  if(loops<want) return false;
  if(n>6&&cors.filter(c=>c.diag>=X2.diagMin).length<X2.diagNeed) return false;
  F.corridors=cors.map(c=>({a:c.a,b:c.b,w:c.w,diag:c.diag}));
  return true; }

if(typeof module!=='undefined') module.exports={X2,x2Rooms,x2Corridors,x2Walls,x2In,x2Centre};

/* The centrepieces, drawn (from EX.marks; what is solid is decided by the floor, never by these shapes). Built from
   the area's own stone tones like the rest of the floor's dressing, merged into one mesh per hall (plus one for
   what glows), shown once any of its cells has been seen. Cells under a piece have no floor tile: each piece covers
   its own cells (a stone footing), except the chasm, which is open down to the depths. */
function xLandmarks(grp,A,S,seed){ const R=caveRng(seed+509), tone=v=>new THREE.Color('rgb('+xTone(S,v).join(',')+')');
  const ST=tone(.55), DK=tone(.22), LT=tone(.72), MID=tone(.4), WOOD=0x5a3a20, WOOD2=0x3e2814, GLOW=new THREE.Color(A.glow||'#ffb060'), ACC=new THREE.Color(S.spark||'#ffd080');
  // cloth in the area's colour, dyed dark: the lamp you carry washes a bright cloth out into a glowing strip
  const AREA=new THREE.Color(COLORS[A.color]?COLORS[A.color].c:'#8a2a2a').lerp(tone(.22),.6).multiplyScalar(.5);
  for(const mk of EX.marks){ if(mk.kind==='clutter') continue;   // (drawn by xClutter)
    const M=xMerger(), L=xMerger(), seen=new Set(), {horiz,s}=mk;
    // hall-local (u along, v across, toward the piece's side) to world
    const W=(u,v)=>{ const lx=horiz?u:v*s, ly=horiz?v*s:u; return [(mk.cx+lx+.5)*XCS,(mk.cy+ly+.5)*XCS]; };
    // a block lu long (along the hall) by lv deep, in cells; lean tips its top toward -v (its +v end up), in radians
    const box=(col,u,v,y,lu,hh,lv,lean,to)=>{ const [x,z]=W(u,v), a=lean||0; (to||M).add(XG.box,col,x,y,z,horiz?-a*s:0,0,horiz?0:a*s,(horiz?lu:lv)*XCS,hh,(horiz?lv:lu)*XCS); };
    const cells=mk.pieces.flat(); for(const c of cells){ seen.add(c); for(const n of [c-1,c+1,c-XN,c+XN]) seen.add(n); }
    const footing=c=>{ const x=(xcx(c)+.5)*XCS, z=(xcy(c)+.5)*XCS; M.add(XG.box,MID,x,-.2,z,0,0,0,XCS,.5,XCS); };
    const local=c=>{ const dx=xcx(c)-mk.cx, dy=xcy(c)-mk.cy; return horiz?[dx,dy*s]:[dy,dx*s]; };
    // a template room's water, chasm and bridges (roomshapes.js, x2Feats)
    const gap=n=>n>=0&&n<XN*XN&&EX.t[n]===T_ROCK&&xMarkCell(n), open=n=>n>=0&&n<XN*XN&&EX.t[n]!==T_ROCK;
    const edges=c=>[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>[dx,dz,c+dx+dz*XN]);
    if(mk.kind==='pool'){ const WATER=new THREE.Color('#1d4f63').lerp(GLOW,.08), DEEP=new THREE.Color('#0b2230');
      for(const c of cells){ const x=(xcx(c)+.5)*XCS, z=(xcy(c)+.5)*XCS;
        M.add(XG.box,DEEP,x,-1.2,z,0,0,0,XCS,.1,XCS); M.add(XG.box,WATER,x,-.32,z,0,0,0,XCS,.04,XCS);   // the bed, and the still surface
        if(R()<.35) L.add(XG.box,new THREE.Color('#9fdcf0').multiplyScalar(.35),x+(R()-.5)*XCS*.6,-.29,z+(R()-.5)*XCS*.6,0,R()*3,0,.5+R()*.4,.01,.05);   // a glint
        for(const [dx,dz,n] of edges(c)){ if(!open(n)) continue; const ex=x+dx*XCS/2, ez=z+dz*XCS/2, along=dx?0:1;
          M.add(XG.box,DK,ex-dx*.06,-.6,ez-dz*.06,0,0,0,along?XCS:.12,1.2,along?.12:XCS);   // the pool's side
          M.add(XG.box,LT,ex-dx*.1,.05,ez-dz*.1,0,0,0,along?XCS+.02:.34,.12,along?.34:XCS+.02); } } }   // its coping
    else if(mk.kind==='pit'){
      for(const c of cells){ const x=(xcx(c)+.5)*XCS, z=(xcy(c)+.5)*XCS;
        for(const [dx,dz,n] of edges(c)){ if(!open(n)) continue; const ex=x+dx*XCS/2, ez=z+dz*XCS/2, along=dx?0:1;
          M.add(XG.box,DK,ex-dx*.08,-3,ez-dz*.08,0,0,0,along?XCS:.16,6,along?.16:XCS);
          for(let k=0;k<3;k++){ const o=(k-1)*XCS/3+(R()-.5)*.15; M.add(XG.rock,MID,ex+(along?o:-dx*.1),.02,ez+(along?-dz*.1:o),R()*3,R()*3,0,.35+R()*.25,.18+R()*.12,.35+R()*.25); } }
        L.add(XG.box,GLOW.clone().multiplyScalar(.35),x,-6,z,0,0,0,XCS,.05,XCS); } }
    else if(mk.kind==='bridge'){
      for(const c of cells){ const x=(xcx(c)+.5)*XCS, z=(xcy(c)+.5)*XCS, ns=gap(c-XN)||gap(c+XN), ew=gap(c-1)||gap(c+1), run=ns&&!ew?0:1;   // run 1: east-west
        M.add(XG.box,WOOD2,x,.04,z,0,0,0,XCS,.08,XCS);
        for(let k=0;k<4;k++){ const o=(k-1.5)*XCS/4; M.add(XG.box,R()<.2?WOOD2:WOOD,run?x+o:x,.1,run?z:z+o,0,0,0,run?XCS/4-.06:XCS-.1,.05,run?XCS-.1:XCS/4-.06); }   // planks across the way
        for(const [dx,dz,n] of edges(c)){ if(!gap(n)) continue; const ex=x+dx*(XCS/2-.08), ez=z+dz*(XCS/2-.08), along=dx?0:1;
          for(const o of [-.38,.38]) M.add(XG.box,WOOD2,along?ex+o*XCS:ex,.45,along?ez:ez+o*XCS,0,0,0,.1,.8,.1);   // posts
          M.add(XG.box,WOOD,ex,.82,ez,0,0,0,along?XCS:.07,.07,along?.07:XCS); } } }   // the rail
    else if(mk.kind==='shrine'){ cells.forEach(footing);
      box(DK,0,3,.12,3.2,.24,1.3); box(ST,0,3,.3,2.6,.14,1.05);   // the dais and its step
      box(LT,0,3.1,.85,1.1,.95,.42); box(ST,0,3.1,1.36,1.3,.1,.5); box(AREA,0,3.1,1.42,1.36,.02,.32); box(AREA,0,2.86,1.2,.36,.5,.02);   // the altar and its top slab
      box(ACC,0,2.88,.85,.5,.5,.02,0,L);   // a rune cut in its face, glowing
      for(const u of [-.4,.4]){ box(0xe8dcc0,u,3.1,1.5,.05,.18,.05); box(0xffd890,u,3.1,1.63,.035,.08,.035,0,L); }   // candles
      for(const u of [-1,1]){ box(DK,u,3.1,.5,.36,.7,.18); box(ST,u,3.1,1.2,.26,.7,.13); box(LT,u,3.1,1.65,.2,.2,.1); }   // two worn guardian figures
      for(const u of [-2,2]){ const [x,z]=W(u,2.6), c=xcell(x,z); if(c>=0&&EX.t[c]===T_FLOOR) xBrazier(grp,x,z,c,A); } }
    else if(mk.kind==='chasm'){
      // the pit's walls drop away beneath each edge, a broken lip of stone runs round it, a glow far below
      for(const c of cells){ const x=(xcx(c)+.5)*XCS, z=(xcy(c)+.5)*XCS;
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const n=c+dx+dz*XN; if(EX.t[n]===T_ROCK) continue; const ex=x+dx*XCS/2, ez=z+dz*XCS/2, along=dx?0:1;
          M.add(XG.box,DK,ex-dx*.08,-3,ez-dz*.08,0,0,0,along?XCS:.16,6,along?.16:XCS);
          for(let k=0;k<3;k++){ const o=(k-1)*XCS/3+(R()-.5)*.15; M.add(XG.rock,MID,ex+(along?o:-dx*.1),.02,ez+(along?-dz*.1:o),R()*3,R()*3,0,.35+R()*.25,.18+R()*.12,.35+R()*.25); } }
        L.add(XG.box,GLOW.clone().multiplyScalar(.35),x,-6,z,0,0,0,XCS,.05,XCS); }
      // the bridge: two posts on each bank, planks running out over the drop and stopping short
      for(const [v0,dir] of [[2.45,1],[5.55,-1]]){ for(const u of [-.45,.45]) box(WOOD2,u,v0,.5,.08,1.0,.08);
        const n=dir>0?3:2; for(let k=0;k<n;k++){ const v=v0+dir*(.28+k*.32), sag=-k*k*.05; box(WOOD,(R()-.5)*.08,v,.06+sag,1.05,.06,.26,-dir*k*.08); } }
      box(0x8a7a5a,-.45,4.0,.32,.03,.03,3.0); }   // one rope still spans the gap
    else if(mk.kind==='archive'){
      // tall open bookcases (back, sides, four boards, rows of spines) and one that has toppled, its books spilled
      const tilt=R()*mk.pieces.length|0, SP=[0xa83a2a,0x3a6a9a,0x7a8a3a,0x9a6a3a,0x6a3a8a,0xc8b890], BD=0x7a5232;
      mk.pieces.forEach((p,pi)=>{ p.forEach(footing); const [u0]=local(p[0]), [u1]=local(p[p.length-1]), [,v]=local(p[0]), sg=Math.sign(v), um=(u0+u1)/2, len=Math.abs(u1-u0)+.8;
        if(pi===tilt){ box(WOOD2,um,v-sg*.5,.3,len,.55,1.05,sg*.18); box(BD,um,v-sg*.5,.6,len+.04,.06,1.08,sg*.18);
          for(let k=0;k<14;k++) box(SP[k%6],um+(R()-.5)*len,v-sg*(1.2+R()*1.3),.04,.12+R()*.1,.06,.08+R()*.06);
          for(let k=0;k<3;k++){ const [x,z]=W(um+(R()-.5)*len,v-sg*(.9+R())); M.add(XG.rock,MID,x,.1,z,R()*3,R()*3,0,.5,.3,.5); }
          return; }
        box(WOOD2,um,v+sg*.22,1.05,len,2.1,.1); for(const e of [-1,1]) box(BD,um+e*len/2,v,1.05,.06,2.16,.56);
        for(const y of [.06,.72,1.38,2.06]) box(BD,um,v,y,len,.07,.56);
        const nb=Math.round(len*6);
        for(let sh=0;sh<3;sh++) for(let b=0;b<nb;b++){ if(R()<.15) continue; const hh=.4+R()*.16, bu=um-len/2+(b+.5)*len/nb;
          box(SP[R()*SP.length|0],bu,v-sg*.04,.1+sh*.66+hh/2,len/nb*.82,hh,.4,R()<.08?sg*.25:0); } });
      for(let k=0;k<6;k++) box(0xe0d4b4,(R()-.5)*6,(R()-.5)*3,.012,.14,.01,.1);   // loose pages
    }
    else if(mk.kind==='hall'){
      const us=cells.map(c=>local(c)[0]), umax=Math.max(...us.map(Math.abs));
      box(AREA,0,0,.012,2*umax+1.4,.02,1.3); for(const e of [-.5,.5]) box(ACC.clone().lerp(DK,.7).multiplyScalar(.6),0,e,.016,2*umax+1.3,.02,.07);   // the processional runner
      cells.forEach((c,k)=>{ footing(c); const [u,v]=local(c), broken=R()<.18;
        box(ST,u,v,.18,.8,.36,.8); box(LT,u,v,.42,.66,.12,.66);
        const [x,z]=W(u,v), hh=broken?.9+R()*.5:XWALL-.3; M.add(XG.cyl,ST,x,.48+hh/2,z,0,0,0,.95,hh,.95);
        if(!broken) box(LT,u,v,XWALL,.78,.26,.78); else for(let q=0;q<3;q++) M.add(XG.rock,ST,x+(R()-.5)*1.4,.12,z+(R()-.5)*1.4,R()*3,R()*3,0,.4,.25,.4); }); }
    const g=new THREE.Group(); if(M.size()) g.add(M.build(xPhong({vertexColors:true}))); if(L.size()) g.add(L.build(new THREE.MeshBasicMaterial({vertexColors:true})));
    g.visible=false; grp.add(g); EX.decor.push({mesh:g,cells:[...seen],ph:R()*6}); } }

/* The clutter, drawn (x2Clutter): one merged mesh per room (or gallery piece), shown once any of its cells is seen.
   Ruins are cut from the area's own stone: light ones from its upper tones with dull gold trim, dark ones from its lower
   tones with the area's glow in their cracks. A fire pillar's
   flame is a light of its own (EX.glows, like a brazier) and goes when you snuff it (xSnuff). */
function xClutter(grp,A,S,seed){ EX.fireL=new Map(); if(!EX.marks) return; const tone=v=>new THREE.Color('rgb('+xTone(S,v).join(',')+')');
  for(const mk of EX.marks){ if(mk.kind!=='clutter') continue; const D=mk.dark, glow=new THREE.Color(A.glow||'#ffb060');
    // the area's own stone: light ruins from its upper tones, dark ones from its lower, so they sit with the walls and floor
    const ST=tone(D?.3:.56), SH=tone(D?.18:.42), LT=tone(D?.42:.68), TRIM=D?glow.clone().multiplyScalar(.55):new THREE.Color('#b08a44').lerp(tone(.5),.45);
    const ROCK=tone(.42), ROCK2=tone(.28), ROCK3=tone(.58), SOIL=new THREE.Color('#2b2117'), LEAF=new THREE.Color(S.moss||'#4f7a3a'), LEAF2=LEAF.clone().lerp(new THREE.Color('#1e3a1a'),.45), FLOW=[0xd9465a,0xf2c94c,0xb48cff,0xf0f0e0];
    const M=xMerger(), L=xMerger(), seen=new Set();
    for(const it of mk.items){ const R=caveRng(it.sd*7+seed), cs=it.cells, mx=cs.reduce((a,c)=>a+xcx(c),0)/cs.length, my=cs.reduce((a,c)=>a+xcy(c),0)/cs.length, x=(mx+.5)*XCS, z=(my+.5)*XCS;
      for(const c of cs){ seen.add(c); for(const n of [c-1,c+1,c-XN,c+XN]) seen.add(n); }
      const B=(col,bx,by,bz,sx,sy,sz,ry,to)=>(to||M).add(XG.box,col,bx,by,bz,0,ry||0,0,sx,sy,sz), C=(col,bx,by,bz,r,h,to)=>(to||M).add(XG.cyl,col,bx,by,bz,0,0,0,r*2,h,r*2);
      const rock=(col,bx,by,bz,sz)=>M.add(XG.rock,col,bx,by,bz,R()*3,R()*3,R()*3,sz*(.8+R()*.4),sz*(.6+R()*.3),sz*(.8+R()*.4));
      const along=it.v?[0,1]:[1,0], len=cs.length*XCS;
      if(it.k==='pillar'||it.k==='fire'){ const fire=it.k==='fire', broken=!fire&&R()<.3, h=fire?2.3:broken?1.2+R()*1.6:4.4+R()*.4;
        B(SH,x,.18,z,1.5,.36,1.5,R()*.2); B(ST,x,.46,z,1.2,.2,1.2);
        C(ST,x,.56+h/2,z,.42,h); for(const yy of [.75,.56+h-.25]) C(LT,x,yy,z,.47,.1);   // the shaft and its rings
        if(D) B(TRIM,x,.56+h*.55,z,.88,.06,.88,0,L);   // dark ruins: a glowing band
        if(fire){ C(SH,x,.56+h+.15,z,.5,.3); C(ST,x,.56+h+.42,z,.62,.24); C(new THREE.Color('#1a1512'),x,.56+h+.55,z,.5,.04); xFireGlow(grp,x,z,.56+h+.58,cs[0],it.out); }
        else if(broken){ for(let k=0;k<3;k++) rock(ST,x+(R()-.5)*1.4,.15,z+(R()-.5)*1.4,.45); B(LT,x+(R()-.5)*.2,.56+h,z,.7,.12,.6,R()*3); }
        else B(LT,x,.56+h+.16,z,1.25,.32,1.25); }
      else if(it.k==='ruin'){ for(const c of cs){ const cx=(xcx(c)+.5)*XCS, cz=(xcy(c)+.5)*XCS, top=.9+R()*2.6; let y=0;
          for(let k=0;y<top;k++){ const hh=Math.min(.55,top-y+.05), sx=XCS*(.92-R()*.12), sz=XCS*(.62-R()*.1), col=k%2?ST:ST.clone().lerp(SH,.35);
            B(col,cx+(R()-.5)*.1,y+hh/2,cz+(R()-.5)*.1,cs.length>1&&xcx(cs[1])===xcx(cs[0])?sz:sx,hh,cs.length>1&&xcx(cs[1])===xcx(cs[0])?sx:sz,(R()-.5)*.08); y+=hh; }
          B(LT,cx,y+.06,cz,XCS*.5,.12,XCS*.4,R()*3);   // a loose block on top
          if(D&&R()<.6) B(TRIM,cx,y*.5,cz,XCS*.95,.05,XCS*.66,0,L);
          rock(ST,cx+(R()-.5)*1.2,.12,cz+(R()-.5)*1.2,.4); } }
      else if(it.k==='column'){ const rx=it.v?Math.PI/2:0, rz=it.v?0:Math.PI/2;
        M.add(XG.cyl,ST,x,.48,z,rx,0,rz,.9,len-.6,.9); for(let k=-1;k<=1;k++) M.add(XG.cyl,LT,x+along[0]*k*XCS,.48,z+along[1]*k*XCS,rx,0,rz,.96,.08,.96);
        B(LT,x+along[0]*(len/2-.3),.6,z+along[1]*(len/2-.3),1.2,1.2,1.2,R()*.4); for(let k=0;k<4;k++) rock(ST,x+(R()-.5)*len*.8*along[0]+(R()-.5)*.6,.1,z+(R()-.5)*len*.8*along[1]+(R()-.5)*.6,.3); }
      else if(it.k==='planter'){ const lx=it.v?XCS-.25:len-.25, lz=it.v?len-.25:XCS-.25;
        B(SH,x,.5,z,lx,1,lz); B(LT,x,1.04,z,lx+.08,.1,lz+.08); B(SOIL,x,1.06,z,lx-.3,.06,lz-.3);
        if(D) B(TRIM,x,.55,z,lx+.02,.06,lz+.02,0,L);
        const n=10+R()*6|0; for(let k=0;k<n;k++){ const px=x+(R()-.5)*(lx-.6), pz=z+(R()-.5)*(lz-.6), s2=.35+R()*.45, col=R()<.5?LEAF:LEAF2;
          M.add(R()<.35?XG.cone:XG.ball,col,px,1.1+s2*.5,pz,0,R()*3,0,s2*1.3,s2*1.4,s2*1.3); }
        for(let k=0;k<4;k++) if(R()<.7) M.add(XG.ball,new THREE.Color(FLOW[R()*FLOW.length|0]),x+(R()-.5)*(lx-.6),1.5+R()*.4,z+(R()-.5)*(lz-.6),0,0,0,.18,.18,.18); }
      else if(it.k==='boulder'||it.k==='bigrock'){ const big=it.k==='bigrock', n=big?5:3;
        for(let k=0;k<n;k++){ const sz=(big?2.2:1.5)*(k?.55+R()*.35:1); rock(k%2?ROCK2:ROCK,x+(R()-.5)*(big?2:.8),sz*.32,z+(R()-.5)*(big?2:.8),sz); }
        if(R()<.5) M.add(XG.ball,LEAF2,x+(R()-.5),.15,z+(R()-.5),0,0,0,.9,.15,.7); }   // moss at its foot
      else if(it.k==='rubble'){ for(let k=0;k<6;k++) rock(R()<.5?ROCK:ROCK3,x+(R()-.5)*1.6,.06,z+(R()-.5)*1.6,.18+R()*.25); } }
    const g=new THREE.Group(); if(M.size()) g.add(M.build(xDitherMat(xPhong({vertexColors:true})))); if(L.size()) g.add(L.build(new THREE.MeshBasicMaterial({vertexColors:true})));
    g.visible=false; grp.add(g); EX.decor.push({mesh:g,cells:[...seen],ph:0}); } }
// a fire pillar's flame: coals, two cones and a halo, a light like a brazier's (none once snuffed)
function xFireGlow(grp,x,z,y,cell,out){ if(out) return; const tex=xGlowTex.t||(xGlowTex.t=xGlowTex()), g=new THREE.Group(), mats=[]; g.position.set(x,0,z);
  const coal=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,10),new THREE.MeshBasicMaterial({color:0xff5a20})); coal.position.y=y; g.add(coal);
  const flame=new THREE.Group(), fm=c=>{ const m=new THREE.MeshBasicMaterial({color:c,transparent:true}); mats.push(m); return m; };
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.42,1.05,7),fm(0xff7a2a)), f2=new THREE.Mesh(new THREE.ConeGeometry(.22,.7,7),fm(0xffe08a)); f1.position.y=.52; f2.position.y=.35; flame.add(f1,f2); flame.position.y=y; g.add(flame);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffa040,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); halo.scale.set(5,5,1); halo.position.y=y+.6; halo.renderOrder=2; g.add(halo);
  const floor=[cell+1,cell-1,cell+XN,cell-XN].find(n=>EX.t[n]===T_FLOOR); g.visible=false; grp.add(g);
  const Lt={g,floor:floor!=null?floor:cell,mats,halo,flame,torch:true,ph:Math.random()*6}; EX.glows.push(Lt); EX.fireL.set(cell,Lt); }

/* Arches over the wide passages (spacious floors): every so often a straight run of a 3- or 5-wide corridor is
   spanned by a stone arch, a pier against each wall and a low, wide arch of dressed stones with a keystone, its
   crown at the walls' height. Pure dressing: nothing about where you can walk changes (the piers stand within the
   wall's thickness and a hand's width into the passage). An arch between the camera and you fades like a wall. */
function xArches(grp,A,S,seed){ const R=caveRng(seed+733), tone=v=>new THREE.Color('rgb('+xTone(S,v).join(',')+')'), base=tone(.5), lite=tone(.66), dark=tone(.34);
  const pass=c=>c>=0&&c<XN*XN&&EX.t[c]===T_FLOOR&&EX.room[c]<0&&!EX.doors.has(c), wall=c=>EX.t[c]===T_ROCK&&EX.wIdx.has(c)&&!xWedge(c)&&!xLow(c);
  const sites=[], near=(x,y,d)=>sites.some(q=>Math.max(Math.abs(q.x-x),Math.abs(q.y-y))<d);
  const busy=(x,y)=>{ for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){ const n=xi(x+dx,y+dy); if(EX.room[n]>=0||EX.doors.has(n)||n===EX.up||n===EX.down) return true; } return false; };
  for(let y=4;y<XN-4;y++) for(let x=4;x<XN-4;x++) for(const w of [3,5]) for(const ax of [0,1]){
    // ax 0: the passage runs north-south and the arch spans x..x+w-1; ax 1: it runs east-west, spanning y..y+w-1
    const at=(a,b)=>ax?xi(x+b,y+a):xi(x+a,y+b); let ok=true;
    for(let b=-1;b<=1&&ok;b++){ if(!wall(at(-1,b))||!wall(at(w,b))) ok=false; for(let a=0;a<w&&ok;a++) if(!pass(at(a,b))) ok=false; }
    if(!ok) continue; const mx=ax?x:x+(w-1)/2, my=ax?y+(w-1)/2:y; if(near(mx,my,9)||busy(Math.round(mx),Math.round(my))) continue;
    if(R()<(w>3?.9:.55)) sites.push({x:mx,y:my,w,ax,cell:at((w-1)>>1,0)}); }   // (nearly every gallery stretch gets one)
  EX.arches=[];
  for(const st of sites){ const M=xMerger(), span=st.w*XCS, a=span/2-.1, b=st.w>3?1.15:1.05, ys=XWALL-b+.02, g=new THREE.Group();
    g.position.set((st.x+.5)*XCS,0,(st.y+.5)*XCS); if(st.ax) g.rotation.y=Math.PI/2;
    for(const sx of [-1,1]){ const px=sx*(span/2+.05);
      M.add(XG.box,lite,px,.18,0,0,0,0,.62,.36,.92); M.add(XG.box,base.clone().multiplyScalar(.92+R()*.12),px,(ys+.36)/2,0,0,0,0,.5,ys-.36,.78);
      M.add(XG.box,lite,px-sx*.02,ys,0,0,0,0,.64,.12,.9); }
    const N=st.w>3?15:11, T=.36;
    for(let k=0;k<N;k++){ const t0=Math.PI*k/N, t1=Math.PI*(k+1)/N, tm=(t0+t1)/2, x0=a*Math.cos(t0), y0=b*Math.sin(t0), x1=a*Math.cos(t1), y1=b*Math.sin(t1);
      const cx=a*Math.cos(tm), cy=b*Math.sin(tm), nx=b*Math.cos(tm), ny=a*Math.sin(tm), nl=Math.hypot(nx,ny), key=k===(N>>1), th=key?T+.14:T;
      const len=Math.hypot(x1-x0,y1-y0)-.03, ang=Math.atan2(y1-y0,x1-x0);
      M.add(XG.box,key?lite:k%2?base:dark.clone().lerp(base,.6),cx+nx/nl*th/2,ys+cy+ny/nl*th/2,0,0,0,ang,len,th,key?.82:.7); }
    const mesh=M.build(xDitherMat(xPhong({vertexColors:true}))); g.add(mesh); g.visible=false; grp.add(g);
    const cells=[]; for(let k=-1;k<=st.w;k++) cells.push(st.ax?xi(Math.round(st.x),Math.round(st.y-(st.w-1)/2)+k):xi(Math.round(st.x-(st.w-1)/2)+k,Math.round(st.y)));
    EX.decor.push({mesh:g,cells,ph:0}); EX.arches.push({g,mesh,cell:st.cell,cut:1}); } }
// an arch fading out of the way (like a wall between the camera and you)
function xArchOp(a){ const op=Math.max(.12,a.cut), solid=op>=.995, M=a.mesh.material; M.transparent=!solid; M.opacity=solid?1:op; M.depthWrite=solid; a.mesh.renderOrder=solid?0:7; }

/* A few grand entrances: an ordinary open (or plain closed) door into a main room, where the passage outside runs
   on past both sides of the vestibule, opens up three cells wide under one arch (no leaf; it never closes). Only the
   two wall cells beside the door and the vestibule's two sides are dug, and they meet the same passage the door
   already reaches, so no lock, secret or side room is ever bypassed. Most likely into a landmark hall; at most four. */
function x2WideDoors(F,R,gate){ const {t,room,doors}=F; let n=0;
  for(const [i,d] of doors){ if(n>=4) break; if(d.lock||(d.state!=='open'&&d.state!=='closed')) continue;
    const inn=[i-1,i+1,i-XN,i+XN].find(c=>room[c]>=0); if(inn==null) continue; const r=F.rooms[room[inn]]; if(!r||r.side||r.nook) continue;
    if(R()>(r.landmark?.5:.18)) continue;
    if(gate&&Math.max(Math.abs(xcx(gate.cell)-xcx(i)),Math.abs(xcy(gate.cell)-xcy(i)))<5) continue;
    const o=i-inn, p=Math.abs(o)===1?XN:1;
    if(t[i+o]===T_ROCK||room[i+o]>=0||t[i+2*o]===T_ROCK||room[i+2*o]>=0) continue;
    let ok=true; const carve=[];
    for(const sd of [p,-p]){ const a=i+sd, b=i+o+sd, out=i+2*o+sd, ins=inn+sd;
      if(t[a]!==T_ROCK||doors.has(a)||doors.has(b)||room[ins]!==r.id||t[out]===T_ROCK||room[out]>=0){ ok=false; break; }
      for(const q of [a,b]) for(const nb of [q-1,q+1,q-XN,q+XN]) if(room[nb]>=0&&room[nb]!==r.id||doors.has(nb)&&nb!==i) ok=false;
      carve.push(a); if(t[b]===T_ROCK) carve.push(b); }
    if(!ok) continue; for(const c of carve){ t[c]=T_FLOOR; room[c]=-1; } d.state='open'; d.wide=true; n++; } }

/* Wall sections on spacious floors, so a long wall is not one block repeated: along the faces the trim runs on
   (rooms and passages), a pilaster every fourth block of a straight run (plinth, shaft standing proud, capital), now
   and then a dark arched niche with a stone sill, and decals laid across the joints between blocks: soot streaks
   from the top, cracks, water stains down the face, moss along the foot. Never at a doorway or where a banner,
   chain or lamp already hangs. Instanced, and shown (and sunk with the cutaway) with their wall, like the trims
   (xDressShow -> xSectShow); a wall not yet seen shows none. */
function xWallSections(grp,S,seed){ const R=caveRng(seed+911), tone=v=>new THREE.Color('rgb('+xTone(S,v).join(',')+')');
  const isFace=(c,dx,dy)=>{ const a=EX.dress.get(c); return !!(a&&a.trim&&a.trim.some(t=>t[1]===dx&&t[2]===dy)); };
  const used=new Set([...(EX.onWall||[]).map(W=>W.wall),...(EX.glows||[]).map(L=>L.wall),...EX.wallAt.keys()]);
  const nearDoor=c=>{ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) if(EX.doors.has(c+dy*XN+dx)) return true; return false; };
  const n={p:0,n:0,d:[0,0,0,0]}, ph=R()*4|0;
  for(const [c,a] of EX.dress){ if(!a.trim) continue;
    for(const [,dx,dy] of a.trim){ if(dx&&dy) continue; const tx=dy?1:0, tz=dx?1:0, t=tx+tz*XN, along=dx?xcy(c):xcx(c);
      const run=isFace(c+t,dx,dy)&&isFace(c-t,dx,dy), free=!used.has(c)&&!nearDoor(c), L=(a.sect=a.sect||[]);
      if(run&&free&&(along+ph)%4===0){ L.push(['p',n.p++,dx,dy]); continue; }
      if(run&&free&&(along+ph)%4===2&&R()<.22){ L.push(['n',n.n++,dx,dy]); continue; }
      if(R()<.42){ const k=[0,0,1,2,3,3][R()*6|0], sh=isFace(c+t,dx,dy)?.5:isFace(c-t,dx,dy)?-.5:0;
        const w=[1.3+R()*.8,1+R()*.6,.8+R()*.6,1.5+R()*.8][k], h=[2.2+R()*1.4,1.2+R()*.9,XWALL*.8,.8+R()*.3][k], y=[XWALL-h/2-.3,1.2+R()*(XWALL-3),XWALL*.45,h/2-.02][k];
        L.push(['d'+k,n.d[k]++,dx,dy,w,h,y,sh+(R()-.5)*.3]); } } }
  const zero=new THREE.Matrix4().makeScale(0,0,0), inst=(geo,mat,cnt)=>{ const im=new THREE.InstancedMesh(geo,mat,Math.max(1,cnt)); for(let k=0;k<im.count;k++) im.setMatrixAt(k,zero); grp.add(im); return im; };
  // the pilaster (built facing +z, standing on the face plane z=0, the wall's full height)
  const P=xMerger(), st=tone(.52), lt=tone(.64), H=XWALL;
  P.add(XG.box,lt,0,.22,.25,0,0,0,1.02,.44,.5); P.add(XG.box,st,0,(.44+H-.5)/2,.19,0,0,0,.8,H-.94,.38); P.add(XG.box,lt,0,H-.36,.24,0,0,0,.98,.22,.48); P.add(XG.box,st,0,H-.15,.2,0,0,0,.84,.2,.4);
  // the niche: a dark recess with a stepped head, a pale frame and a sill
  const Q=xMerger(), dk=tone(.08), fr=tone(.6);
  Q.add(XG.box,dk,0,1.95,.02,0,0,0,.92,2.0,.04); [.84,.7,.5].forEach((w,k)=>Q.add(XG.box,dk,0,3.0+k*.12,.02,0,0,0,w,.12,.04));
  for(const sx of [-1,1]) Q.add(XG.box,fr,sx*.52,1.95,.05,0,0,0,.12,2.1,.1); [1.06,.92,.74,.54].forEach((w,k)=>Q.add(XG.box,fr,0,3.0+k*.12+.02,.05,0,0,0,w,.08,.1));
  Q.add(XG.box,fr,0,.9,.1,0,0,0,1.2,.12,.22);
  const smat=xDitherMat(xPhong({vertexColors:true}));
  EX.sectM={p:inst(P.build(smat).geometry,smat,n.p),n:inst(Q.build(smat).geometry,smat,n.n),d:[0,1,2,3].map(k=>{ const g=new THREE.PlaneGeometry(1,1), U=g.attributes.uv; for(let i=0;i<U.count;i++) U.setX(i,(k+U.getX(i))/4);
    const dm=xSinkPatch(xPhong({map:xDecalTex(S,seed),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})); if(typeof xNmapLuma==='function') xNmapLuma(dm,.4);   // (a crack or streak catches the light: nature.js)
    return inst(g,dm,n.d[k]); })}; }
// the four decals side by side (64 x 128 each): soot streaks, a crack, a water stain, moss
function xDecalTex(S,seed){ if(xDecalTex.c&&xDecalTex.k===seed) return xDecalTex.t; const W=64, Hh=128, c=document.createElement('canvas'); c.width=W*4; c.height=Hh; const x=c.getContext('2d'), R=caveRng(seed+5);
  const dark='rgba('+xTone(S,.02).join(',')+',', moss='rgba('+[52,74,40].join(',')+',';
  for(let s=0;s<14;s++){ const px=6+R()*(W-12), len=30+R()*90, wd=1+R()*3; const g=x.createLinearGradient(0,0,0,len); g.addColorStop(0,dark+'.55)'); g.addColorStop(1,dark+'0)'); x.fillStyle=g; x.fillRect(px|0,0,wd|0||1,len); }
  { let px=W+W/2, py=10; x.fillStyle=dark+'.75)'; for(let k=0;k<110;k++){ x.fillRect(px|0,py|0,1,1); if(R()<.12){ let bx=px, by=py; for(let q=0;q<10;q++){ bx+=(R()-.3)*2; by+=1; x.fillRect(bx|0,by|0,1,1); } } px+=(R()-.5)*2.2; py+=1; px=Math.max(W+4,Math.min(2*W-4,px)); } }
  { const g=x.createLinearGradient(2*W,0,3*W,0); g.addColorStop(0,dark+'0)'); g.addColorStop(.3,dark+'.32)'); g.addColorStop(.7,dark+'.32)'); g.addColorStop(1,dark+'0)'); x.fillStyle=g; x.fillRect(2*W,0,W,Hh); const v=x.createLinearGradient(0,0,0,Hh); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(.15,'rgba(0,0,0,1)'); x.globalCompositeOperation='destination-in'; x.fillStyle=v; x.fillRect(2*W,0,W,Hh); x.globalCompositeOperation='source-over'; }
  for(let k=0;k<420;k++){ const px=3*W+R()*W, py=Hh-Math.pow(R(),1.8)*Hh; x.fillStyle=(R()<.6?moss:dark)+(.35+R()*.45)+')'; x.fillRect(px|0,py|0,1+(R()*2|0),1+(R()*2|0)); }
  xDecalTex.c=c; xDecalTex.k=seed; return xDecalTex.t=xTex(c); }
function xSectShow(c,list,cut){ const M=EX.sectM; if(!M) return; const m=new THREE.Matrix4(), z=new THREE.Matrix4().makeScale(0,0,0), touched=new Set();
  for(const [kind,k,dx,dy,w,h,y,sh] of list){ const mesh=kind==='p'?M.p:kind==='n'?M.n:M.d[+kind[1]], tx=dy?1:0, tz=dx?1:0, s=sh||0; if(EX.layout===2) cut=1;   // (bent by the shader instead)
    const x=xw(c)+dx*XCS/2+tx*s*XCS, zz=xz(c)+dy*XCS/2+tz*s*XCS, show=kind==='p'?cut>.05:cut>.95;
    if(!show) m.copy(z); else { m.makeRotationY(Math.atan2(dx,dy)); if(kind==='p') m.scale(new THREE.Vector3(1,cut,1)); else if(kind[0]==='d') m.scale(new THREE.Vector3(w,h,1));
      m.setPosition(x+dx*(kind[0]==='d'?.03:0),kind[0]==='d'?y:0,zz+dy*(kind[0]==='d'?.03:0)); }
    mesh.setMatrixAt(k,m); touched.add(mesh); }
  for(const t of touched) t.instanceMatrix.needsUpdate=true; }
