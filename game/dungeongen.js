/* The spacious floor (layout 2, dungeon redesign). Bigger rooms, a few of them landmark halls, joined as a graph:
   a spanning tree of corridors plus loops, so you rarely walk back the way you came. Corridors are three cells
   wide (a gallery five), run in any of eight directions, and every floor has at least two long diagonals.
   A corridor never opens into a room: it narrows to a one-cell doorway with a one-cell vestibule outside it, on a
   straight side of the room, so locks, secret doors and the boss door work exactly as before. The ring of wall
   around every room is never dug by a wide corridor, so a corridor cannot slip round a lock or into a room.
   x2Rooms places the rooms; x2Corridors digs the main corridors. tryFloor (explore.js) does everything after that
   (side rooms, the gate, locks, the boss door, checks) the same for both layouts. */
const X2={ yaw:45, marg:5, landmarks:3, rooms:11, small:6, loops:2, wide:3, gallery:5, diagMin:6, diagNeed:2 };

// rooms: landmark halls first (they need the room), then ordinary rooms; null when too few fit
function x2Rooms(R,ri,plan){ const rooms=[], small=!!plan.small, want=small?X2.small:X2.rooms;
  const free=(x,y,w,h,m)=>!rooms.some(r=>x<r.x+r.w+m&&x+w+m>r.x&&y<r.y+r.h+m&&y+h+m>r.y);
  const lm=small?0:X2.landmarks;
  for(let k=0;k<1500&&rooms.length<want;k++){ const big=rooms.length<lm, w=big?ri(11,14):ri(7,11), h=big?ri(10,13):ri(6,9), x=ri(2,XN-w-3), y=ri(2,XN-h-3);
    if(free(x,y,w,h,X2.marg)) rooms.push({x,y,w,h,lit:big||R()<.68,landmark:big||undefined});
    else if(big&&k>400) break; }   // no room left for a hall: the floor is tried again
  if(rooms.filter(r=>r.landmark).length<lm||rooms.length<(small?5:9)) return null;
  return rooms; }

// the main corridors between the main rooms; false when the floor should be tried again
function x2Corridors(main,F,R,ri){ const {t,room,doors}=F, n=main.length;
  const prot=i=>{ const x=xcx(i), y=xcy(i); for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=XN||ny>=XN) return true; if(room[xi(nx,ny)]>=0) return true; } return false; };
  const inside=(x,y)=>x>=1&&y>=1&&x<XN-1&&y<XN-1;
  // a doorway on room a's side facing (tx,ty): the door cell in the wall ring and the vestibule outside it
  const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
  const doorways=(a,tx,ty)=>{ const vx=tx-a.cx, vy=ty-a.cy, out=[];
    const order=SIDES.slice().sort((p,q)=>(q[0]*vx+q[1]*vy)-(p[0]*vx+p[1]*vy));
    for(const [sx,sy] of order.slice(0,2)) for(const off of [0,2,-2,4,-4]){
      let x, y; if(sx){ x=sx>0?a.x+a.w:a.x-1; y=Math.max(a.y+1,Math.min(a.y+a.h-2,ty))+off; if(y<a.y+1||y>a.y+a.h-2) continue; }
      else { y=sy>0?a.y+a.h:a.y-1; x=Math.max(a.x+1,Math.min(a.x+a.w-2,tx))+off; if(x<a.x+1||x>a.x+a.w-2) continue; }
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
  const link=(a,b,w)=>{ for(const A of doorways(a,b.cx,b.cy).slice(0,6)) for(const B of doorways(b,xcx(A.v),xcy(A.v)).slice(0,4)){
      const forms=shapes(xcx(A.v),xcy(A.v),xcx(B.v),xcy(B.v)).sort((p,q)=>(q.diag-p.diag)||(R()-.5));
      for(const f of forms){ if(!ok(f.pts)) continue;
        for(const D of [A,B]){ t[D.d]=T_DOOR; doors.set(D.d,{state:R()<.3?'closed':'open'}); t[D.v]=T_FLOOR; }
        dig(f.pts,w); return {a:a.id,b:b.id,w,diag:f.diag}; } }
    return null; };
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

if(typeof module!=='undefined') module.exports={X2,x2Rooms,x2Corridors};
