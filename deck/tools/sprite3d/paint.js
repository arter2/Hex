/* Painted textures. Every texture is a pair of canvases: colour (albedo pass) and flags (R glow 255 /
   soft 128, G metal), so a single garment can carry glowing runes or metal studs. Garments are
   painted in (angle, height) space: x=0 is the front centre and wraps round, row 0 is the top.
   Faces are painted pixel for pixel in the sprite's own front view: the face hemisphere is mapped
   by projecting it through the camera in the standing pose, so one texel lands on one pixel. */
(function(){
const T=THREE, PI=Math.PI;
const hex=c=>'#'+new T.Color(c).getHexString();
const sh=(c,k)=>{ const o=new T.Color(c); o.multiplyScalar(k); o.r=Math.min(1,o.r); o.g=Math.min(1,o.g); o.b=Math.min(1,o.b); return o.getHex(); };
const mixc=(a,b,t)=>{ const A=new T.Color(a), B=new T.Color(b); return A.lerp(B,t).getHex(); };
LAB.sh=sh; LAB.mixc=mixc;
let sd=1; const rnd=()=>((sd=(sd*9301+49297)%233280)/233280);

LAB.paint=function(w,h,fn,o={}){
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const c=cv.getContext('2d');
  const fv=document.createElement('canvas'); fv.width=w; fv.height=h; const f=fv.getContext('2d');
  const fl=(g,s,m)=>`rgb(${g?255:s?128:0},${Math.round((m||0)*255)},255)`;
  f.fillStyle=fl(o.glow,o.soft,o.metal); f.fillRect(0,0,w,h);
  c.fillStyle=hex(o.c==null?0xffffff:o.c); c.fillRect(0,0,w,h);
  sd=o.seed||11;
  const wrap=x=>((Math.round(x)%w)+w)%w;
  const P={w,h,c,f,rnd,seed:s=>{ sd=s; },
    // one pixel / a rectangle in colour, with optional flags {glow, metal, soft}
    px(x,y,col,fg){ x=wrap(x); y=Math.round(y); if(y<0||y>=h) return; c.fillStyle=hex(col); c.fillRect(x,y,1,1); if(fg){ f.fillStyle=fl(fg.glow,fg.soft,fg.metal); f.fillRect(x,y,1,1); } },
    rect(x,y,ww,hh,col,fg){ for(let j=0;j<hh;j++) for(let i=0;i<ww;i++) P.px(x+i,y+j,col,fg); },
    fill(col,fg){ c.fillStyle=hex(col); c.fillRect(0,0,w,h); if(fg){ f.fillStyle=fl(fg.glow,fg.soft,fg.metal); f.fillRect(0,0,w,h); } },
    // a pattern of strings: chars map to colours through key {ch: colour | [colour, flags]}
    stamp(x,y,rows,key,mirror){ rows.forEach((r,j)=>{ for(let i=0;i<r.length;i++){ const k=key[r[i]]; if(k==null) continue; const col=Array.isArray(k)?k[0]:k, fg=Array.isArray(k)?k[1]:null;
        P.px(mirror?x-i:x+i,y+j,col,fg); } }); },
    line(x0,y0,x1,y1,col,fg){ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1); for(let i=0;i<=n;i++) P.px(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,col,fg); },
    hband(y0,y1,col,fg){ for(let y=Math.round(y0);y<Math.round(y1);y++) P.rect(0,y,w,1,col,fg); },
    speckle(col,dens,fg,y0=0,y1=h){ for(let y=y0;y<y1;y++) for(let x=0;x<w;x++) if(rnd()<dens) P.px(x,y,col,fg); },
    // x for an angle round a full lathe (0 = front centre, +PI/2 = the figure's left)
    X:a=>w*(((a/(2*PI))%1)+1)%w,
  };
  fn(P);
  const mk=cv2=>{ const t=new T.CanvasTexture(cv2); t.magFilter=t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.wrapS=T.RepeatWrapping; t.wrapT=T.ClampToEdgeWrapping; return t; };
  return {map:mk(cv), fmap:mk(fv), w, h, canvas:cv, c:o.c==null?0xffffff:o.c};
};

/* ---------- motifs: tiny pixel sprites ---------- */
const MOT={
  star:['.x.','xxx','.x.'], star5:['..x..','..x..','xx.xx','..x..','..x..'],
  spark:['x.x','.x.','x.x'], moon:['.xx','x..','x..','.xx'], dot:['x'], dot2:['xx'], diamond:['.x.','x.x','.x.'], diamondF:['.x.','xxx','.x.'],
  leaf:['.x.','xxx','xxx','.x.'], leafS:['.x','xx','x.'], skull:['.xxx.','x.x.x','.xxx.','.x.x.'], cross:['.x.','xxx','.x.','.x.'],
  rune1:['xx.','.x.','.xx'], rune2:['x.x','xxx','x..'], rune3:['.x.','x.x','.xx'], rune4:['xxx','x..','xx.'], rune5:['x..','xxx','..x'],
  flower:['.x.','xox','.x.'], heart:['x.x','xxx','.x.'], tooth:['x','x'], bone:['x.x','.x.','.x.','x.x'], eye:['.xx.','xoox','.xx.'], drop:['.x.','xxx','.x.'],
  knot:['.xx.','x..x','x..x','.xx.'], tri:['..x..','.xxx.','xxxxx'], chev:['x...x','.x.x.','..x..'],
};
LAB.MOT=MOT;
const RUNES=['rune1','rune2','rune3','rune4','rune5'];
// stamp a motif with colour (o marks a second colour)
function motif(P,name,x,y,col,col2,fg){ const r=MOT[name]; P.stamp(Math.round(x-(r[0].length>>1)),Math.round(y-(r.length>>1)),r,{x:fg?[col,fg]:col,o:col2==null?undefined:col2}); }
LAB.motif=motif;

/* ---------- fabric: a garment texture from a recipe ----------
   r = { c, mottle:[c,dens], rows:[{y0,y1,c,pat,pc,every,off,fg}], seams:[{a,c,w}], patches:[{a,y,w,h,c}],
         tears:{c,n}, stitch:{c,rows:[y]}, scatter:{pat,c,n,y0,y1}, plaid:{c1,c2,step}, rings:{c,c2}, fur:{c,c2},
         scales:{c,c2}, leaves:{c:[...]}, lace:{a,y0,y1,c}, glowRows }  — heights are rows (0 top) unless given 0..1 as frac */
LAB.fabric=function(w,h,r){ return LAB.paint(w,h,P=>{ const R=v=>v<=1&&v>=0&&!Number.isInteger(v)?Math.round(v*h):v;
  P.seed(r.seed||7);
  if(r.plaid){ const {c1,c2,step=8,c3}=r.plaid; for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const a=(x%step)<2, b=(y%step)<2, t=(x%step===4)||(y%step===4);
      if(a&&b) P.px(x,y,sh(c1,.7)); else if(a||b) P.px(x,y,c1); else if(t&&c3) P.px(x,y,c3); else if(((x+y)&1)&&(a||b)) P.px(x,y,c2); } }
  if(r.rings){ for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const k=(x+((y>>1)&1))%2===0&&y%2===0; P.px(x,y,k?r.rings.c:r.rings.c2,{metal:r.rings.metal==null?.7:r.rings.metal}); } }
  if(r.scales){ for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const ox=(Math.floor(y/3)%2)*2, u=(x+ox)%4, v=y%3; const edge=(v===2)||(u===0&&v>0); P.px(x,y,edge?r.scales.c2:r.scales.c,r.scales.fg); } }
  if(r.fur){ for(let x=0;x<w;x++){ let y=0; while(y<h){ const L=2+Math.floor(rnd()*4); const col=rnd()<.5?r.fur.c:r.fur.c2; for(let j=0;j<L&&y<h;j++,y++) P.px(x+(j>1&&rnd()<.3?1:0),y,col,{soft:true}); } } }
  if(r.mottle) P.speckle(r.mottle[0],r.mottle[1],r.mottle[2]);
  if(r.mottle2) P.speckle(r.mottle2[0],r.mottle2[1],r.mottle2[2]);
  if(r.leaves){ const L=r.leaves; for(let y=-2;y<h+2;y+=3) for(let x=0;x<w;x+=3){ const col=L.c[Math.floor(rnd()*L.c.length)]; motif(P,rnd()<.5?'leaf':'leafS',x+(y%2)*1.5+rnd()*1.5,y+rnd(),col); if(rnd()<.35) P.px(x+1,y,sh(col,.6)); } }
  if(r.scatter) for(const sc of [].concat(r.scatter)){ for(let i=0;i<(sc.n||20);i++){ const y=R(sc.y0||0)+rnd()*(R(sc.y1==null?h:sc.y1)-R(sc.y0||0)); motif(P,sc.pat==='rune'?RUNES[i%5]:sc.pat,rnd()*w,y,sc.c,sc.c2,sc.fg); } }
  for(const s of r.seams||[]){ const x=P.X(s.a); for(let y=R(s.y0||0);y<R(s.y1==null?h:s.y1);y++) P.rect(x-(s.w||1)/2,y,s.w||1,1,s.c,s.fg); }
  for(const p of r.patches||[]){ const x=P.X(p.a), y=R(p.y); P.rect(x,y,p.w,p.h,p.c); if(p.st){ for(let i=0;i<p.w;i+=2){ P.px(x+i,y-1,p.st); P.px(x+i,y+p.h,p.st); } for(let j=0;j<p.h;j+=2){ P.px(x-1,y+j,p.st); P.px(x+p.w,y+j,p.st); } } }
  for(const b of r.rows||[]){ const y0=R(b.y0), y1=R(b.y1==null?b.y0+1:b.y1);
    if(b.c!=null) P.hband(y0,y1,b.c,b.fg);
    if(b.pat){ const ev=b.every||6; for(let x=b.off||0;x<w;x+=ev){ const m=b.pat==='rune'?RUNES[Math.floor(x/ev)%5]:b.pat; motif(P,m,x,(y0+y1-1)/2,b.pc,b.pc2,b.pfg); } }
    if(b.zig){ for(let x=0;x<w;x++){ const k=Math.abs(((x+(b.off||0))%b.zig)-b.zig/2)/(b.zig/2); const yy=Math.round(y0+k*(y1-y0-1)); P.px(x,yy,b.zc,b.zfg); } } }
  if(r.lace){ const L=r.lace, x0=P.X(L.a||0); for(let y=R(L.y0);y<R(L.y1);y++){ const k=(y-R(L.y0))%4; P.px(x0+(k<2?-k:k-4),y,L.c); P.px(x0+(k<2?k:4-k),y,L.c); } if(L.gap) for(let y=R(L.y0);y<R(L.y1);y++) P.px(x0,y,L.gap); }
  if(r.stitch) for(const y of r.stitch.rows) for(let x=0;x<w;x+=2) P.px(x,R(y),r.stitch.c);
  if(r.tears){ for(let i=0;i<(r.tears.n||8);i++){ const x=rnd()*w, y=h*(.35+rnd()*.6), L=2+rnd()*4; for(let j=0;j<L;j++) P.px(x+(rnd()-.5)*1.5,y+j,r.tears.c); } }
  if(r.custom) r.custom(P,R);
},{c:r.c, soft:r.soft!==false, metal:r.metal, glow:r.glow}); };

/* ---------- faces ----------
   A = anchors in canvas pixels: eyeN/eyeF (near/far eye), browN/browF, nose, mouth, chin, cheekN/cheekF, d (+1 looks right) */
const SCL=0xf2ece2, INK=0x1a1016;
LAB.paintFace=function(P,A,F,skin){
  const d=A.d, S=(k)=>sh(skin,k), q=v=>Math.floor(v);
  const at=(p,dx,dy,col,fg)=>P.px(q(p[0])+dx*d,q(p[1])+dy,col,fg);
  const E=F.eyes||{}, st=E.style||'round', iris=E.c==null?0x3a5a7a:E.c, liner=E.liner==null?INK:E.liner, gl=E.glow?{glow:true}:null;
  // skin shading: sockets, cheekbones, stubble, makeup
  if(F.sunken){ for(const p of [A.eyeN,A.eyeF]) for(let dx=-2;dx<=2;dx++) for(let dy=-1;dy<=1;dy++) at(p,dx,dy,mixc(S(.72),F.sunken===true?0x3a2a4a:F.sunken,.25)); }
  if(F.cheekbones) for(const [p,s] of [[A.cheekN,1],[A.cheekF,1]]) { at(p,0,1,S(.84)); at(p,-1,1,S(.84)); }
  if(F.stubble){ const m=A.mouth; for(let dx=-3;dx<=3;dx++) for(let dy=-1;dy<=3;dy++) if((dx+dy)&1) at(m,dx,dy,mixc(skin,F.stubble,.45)); }
  if(F.blush) for(const p of [A.cheekN,A.cheekF]) { at(p,0,0,mixc(skin,F.blush,.55)); at(p,-d*0,1,mixc(skin,F.blush,.35)); }
  if(F.freckles) for(const [dx,dy] of [[-2,0],[0,1],[2,0],[3,1],[-3,1],[1,-1]]) at(A.nose,dx,dy,S(.8));
  if(F.shadow) for(const p of [A.eyeN,A.eyeF]) { at(p,-1,-2,F.shadow); at(p,0,-2,F.shadow); at(p,1,-2,F.shadow); }
  if(F.paint) for(const pt of [].concat(F.paint)) paintMark(P,A,pt,at,skin);
  // eyes
  const eye=(p,near)=>{
    if(st==='none') return;
    if(st==='socket'){ for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) at(p,dx,dy,0x120a10); if(near) at(p,-1,-2,0x120a10); at(p,0,0,iris,{glow:true}); if(near) at(p,1,0,mixc(iris,0xffffff,.5),{glow:true}); return; }
    if(st==='glow'){ at(p,-1,0,mixc(iris,0xffffff,.0),{glow:true}); at(p,0,0,mixc(iris,0xffffff,.45),{glow:true}); if(near) at(p,1,0,iris,{glow:true}); at(p,-1,-1,liner); at(p,0,-1,liner); if(near) at(p,1,-1,liner); return; }
    if(st==='slit'){ at(p,-1,0,liner); at(p,0,0,iris,gl); if(near) at(p,1,0,liner); at(p,-1,-1,S(.7)); at(p,0,-1,S(.7)); if(near) at(p,1,-1,S(.7)); return; }
    if(st==='narrow'){ // heavy-browed small eye
      at(p,-1,0,liner); at(p,0,0,iris,gl); if(near){ at(p,1,0,liner); }
      at(p,-1,-1,S(.62)); at(p,0,-1,S(.62)); if(near) at(p,1,-1,S(.62)); return; }
    if(st==='almond'){ // long, lifted at the outer corner
      if(near){ at(p,-2,-2,liner); at(p,-1,-1,liner); at(p,0,-1,liner); at(p,1,-1,liner); at(p,-1,0,SCL); at(p,0,0,iris,gl); at(p,1,0,E.pupil||mixc(iris,INK,.55),gl); }
      else { at(p,0,-1,liner); at(p,1,-1,liner); at(p,2,-2,liner); at(p,0,0,iris,gl); at(p,1,0,SCL); }
      return; }
    if(st==='big'){ // larger eye with a glint
      if(near){ for(let dx=-1;dx<=1;dx++) at(p,dx,-2,liner); at(p,-2,-2,E.lash?liner:null); at(p,-1,-1,SCL); at(p,0,-1,iris,gl); at(p,1,-1,E.pupil||mixc(iris,INK,.6),gl); at(p,-1,0,SCL); at(p,0,0,mixc(iris,0xffffff,.25),gl); at(p,1,0,iris,gl); at(p,0,-1,0xffffff); }
      else { at(p,0,-2,liner); at(p,1,-2,liner); if(E.lash) at(p,2,-2,liner); at(p,0,-1,iris,gl); at(p,1,-1,SCL); at(p,0,0,iris,gl); at(p,1,0,SCL); }
      return; }
    if(st==='old'){ // squinting, bags beneath
      at(p,-1,-1,liner); at(p,0,-1,liner); if(near) at(p,1,-1,liner); at(p,0,0,iris,gl); at(p,-1,0,S(.82)); if(near) at(p,1,0,SCL);
      at(p,-1,1,S(.8)); at(p,0,1,S(.8)); return; }
    // round
    if(near){ at(p,-1,-1,liner); at(p,0,-1,liner); at(p,1,-1,liner); if(E.lash) at(p,-2,-2,liner); at(p,-1,0,SCL); at(p,0,0,iris,gl); at(p,1,0,E.pupil||mixc(iris,INK,.6),gl); }
    else { at(p,0,-1,liner); at(p,1,-1,liner); if(E.lash) at(p,2,-2,liner); at(p,0,0,SCL); at(p,1,0,iris,gl); }
  };
  eye(A.eyeN,true); eye(A.eyeF,false);
  // brows
  const B=F.brows||{}, bs=B.style||'thin', bc=B.c==null?0x3a2418:B.c;
  const brow=(p,near)=>{ if(bs==='none') return; const y=-3+(B.dy||0);
    if(bs==='thin'){ at(p,-1,y,bc); at(p,0,y,bc); if(near) at(p,1,y,bc); }
    else if(bs==='arched'){ at(p,-1,y+1,bc); at(p,0,y,bc); at(p,1,y,bc); if(near) at(p,2,y+1,bc); }
    else if(bs==='angry'){ if(near){ at(p,-1,y,bc); at(p,0,y,bc); at(p,1,y+1,bc); at(p,2,y+1,bc); } else { at(p,-1,y+1,bc); at(p,0,y+1,bc); at(p,1,y,bc); } }
    else if(bs==='bushy'){ for(let dx=-2;dx<=(near?2:1);dx++){ at(p,dx,y,bc); if(dx>-2&&dx<(near?2:1)) at(p,dx,y+1,bc); } at(p,near?-2:2,y+1,bc); }
    else if(bs==='heavy'){ for(let dx=-2;dx<=(near?2:1);dx++){ at(p,dx,y+1,bc); at(p,dx,y,S(.7)); } }
    else if(bs==='raised'){ at(p,-1,y,bc); at(p,0,y-1,bc); if(near) at(p,1,y-1,bc); } };
  brow(A.browN||A.eyeN,true); brow(A.browF||A.eyeF,false);
  // nose (drawn on the far side of the bridge, where it shades)
  const N=F.nose||'small', n=A.nose;
  if(N==='small'){ at(n,1,0,S(.78)); }
  else if(N==='button'){ at(n,0,0,S(1.08)); at(n,1,0,S(.78)); }
  else if(N==='long'){ at(n,0,-2,S(1.08)); at(n,0,-1,S(1.05)); at(n,1,0,S(.74)); at(n,1,-1,S(.84)); }
  else if(N==='hook'){ at(n,1,-2,S(.8)); at(n,1,-1,S(.78)); at(n,1,0,S(.7)); at(n,2,0,S(.8)); }
  else if(N==='broad'){ at(n,-1,0,S(.66)); at(n,1,0,S(.66)); at(n,0,0,S(.9)); at(n,0,-1,S(1.06)); }
  else if(N==='big'){ at(n,0,-1,mixc(S(1.04),0xd06050,.25)); at(n,0,0,mixc(S(1),0xd06050,.3)); at(n,1,0,S(.72)); at(n,-1,1,S(.8)); at(n,1,1,S(.66)); }
  else if(N==='skull'){ at(n,0,0,0x120a10); at(n,1,0,0x120a10); at(n,0,-1,0x2a1e24); }
  else if(N==='snout'){ at(n,-1,0,0x1a1210); at(n,1,0,0x1a1210); at(n,0,-1,S(1.1)); }
  // mouth
  const Mo=F.mouth||'line', m=A.mouth, mc=F.lips||S(.62);
  if(Mo==='line'){ at(m,-1,0,mc); at(m,0,0,mc); at(m,1,0,S(.72)); }
  else if(Mo==='smile'){ at(m,-2,-1,mc); at(m,-1,0,mc); at(m,0,0,mc); at(m,1,0,mc); at(m,2,-1,S(.72)); }
  else if(Mo==='frown'){ at(m,-2,1,mc); at(m,-1,0,mc); at(m,0,0,mc); at(m,1,0,mc); at(m,2,1,S(.7)); }
  else if(Mo==='lips'){ at(m,-1,0,sh(mc,.75)); at(m,0,0,sh(mc,.75)); at(m,1,0,sh(mc,.6)); at(m,0,1,mc); at(m,-1,1,mixc(mc,0xffffff,.15)); }
  else if(Mo==='smirk'){ at(m,-1,0,mc); at(m,0,0,mc); at(m,1,-1,mc); }
  else if(Mo==='teeth'){ for(let dx=-2;dx<=2;dx++) at(m,dx,0,0x2a0a0e); at(m,-1,0,0xf2ead8); at(m,1,0,0xf2ead8); at(m,0,1,0x2a0a0e); }
  else if(Mo==='fangs'){ for(let dx=-2;dx<=2;dx++) at(m,dx,0,0x2a0a0e); at(m,-1,1,0xf6f0e0); at(m,1,1,0xf6f0e0); }
  else if(Mo==='open'){ at(m,-1,-1,0x1a080c); at(m,0,-1,0x1a080c); at(m,-1,0,0x2a0a12); at(m,0,0,0x2a0a12); at(m,-1,1,0x1a080c); at(m,0,1,0x1a080c); if(F.mouthGlow){ at(m,0,0,F.mouthGlow,{glow:true}); } }
  else if(Mo==='skull'){ for(let dx=-2;dx<=2;dx++){ at(m,dx,-1,0x120a10); at(m,dx,0,(dx&1)?0x120a10:0xe8e0cc); } }
  else if(Mo==='stitched'){ for(let dx=-2;dx<=2;dx++) at(m,dx,0,0x2a1a20); for(const dx of [-2,0,2]){ at(m,dx,-1,0x4a3a40); at(m,dx,1,0x4a3a40); } }
  else if(Mo==='tusk'){ for(let dx=-2;dx<=2;dx++) at(m,dx,0,0x2a1214); at(m,-2,-1,0xf2ead8); at(m,2,-1,0xf2ead8); }
  // wrinkles, scars, tattoos
  if(F.wrinkles){ at(A.eyeN,-2,0,S(.8)); at(A.eyeN,-2,1,S(.84)); at(A.eyeF,2,0,S(.8)); at(A.browN||A.eyeN,0,-5,S(.86)); at(A.browN||A.eyeN,1,-5,S(.86)); at(A.browF||A.eyeF,0,-5,S(.86));
    at(A.mouth,-3,-1,S(.82)); at(A.mouth,3,-1,S(.84)); }
  if(F.scar){ const sc=F.scar, p=sc.at==='far'?A.eyeF:A.eyeN, col=sc.c||mixc(skin,0xffe8e0,.5); for(let i=-3;i<=3;i++) at(p,Math.round(i*.5)*(sc.dir||1),i,col); }
  if(F.custom) F.custom(P,A,at,skin);
};
function paintMark(P,A,pt,at,skin){ const c=pt.c, fg=pt.glow?{glow:true}:null;
  if(pt.type==='mask'){ for(const p of [A.eyeN,A.eyeF]) for(let dx=-2;dx<=2;dx++) for(let dy=-1;dy<=0;dy++) at(p,dx,dy,c,fg); for(let x=Math.min(A.eyeN[0],A.eyeF[0]);x<=Math.max(A.eyeN[0],A.eyeF[0]);x++) P.px(x,A.eyeN[1]-1,c,fg); }
  if(pt.type==='stripes'){ for(const p of [A.cheekN,A.cheekF]) for(let i=0;i<(pt.n||2);i++) for(let dy=-1;dy<=1;dy++) at(p,-1+i*2,dy,c,fg); }
  if(pt.type==='chin'){ for(let dy=0;dy<=2;dy++) at(A.mouth,0,dy+1,c,fg); at(A.mouth,-2,2,c,fg); at(A.mouth,2,2,c,fg); }
  if(pt.type==='dots'){ for(const p of [A.cheekN,A.cheekF]) { at(p,-1,0,c,fg); at(p,1,0,c,fg); at(p,0,1,c,fg); } }
  if(pt.type==='band'){ const y=Math.round(A.eyeN[1]); for(let x=0;x<P.w;x++) for(let dy=-1;dy<=1;dy++) P.px(x,y+dy,c,fg); }
  if(pt.type==='line'){ for(const p of [A.eyeN,A.eyeF]) for(let dy=1;dy<=4;dy++) at(p,0,dy,c,fg); }
  if(pt.type==='forehead'){ const b=A.browN||A.eyeN, f=A.browF||A.eyeF, x=Math.round((b[0]+f[0])/2), y=Math.round(Math.min(b[1],f[1]))-4; P.px(x,y,c,fg); P.px(x,y-1,c,fg); P.px(x-1,y-1,c,fg); P.px(x+1,y-1,c,fg); P.px(x,y-2,c,fg); }
  if(pt.type==='tear'){ const p=A.eyeN; for(let dy=1;dy<=4;dy++) at(p,0,dy,c,fg); at(p,-1,4,c,fg); }
  if(pt.type==='runes'){ const p=A.cheekN; at(p,-1,-1,c,fg); at(p,-1,0,c,fg); at(p,0,1,c,fg); at(p,-1,2,c,fg); const f=A.cheekF; at(f,1,-1,c,fg); at(f,1,1,c,fg); }
  if(pt.type==='veins'){ for(const p of [A.eyeN]) { at(p,-2,1,c,fg); at(p,-3,2,c,fg); at(p,-2,3,c,fg); at(p,-3,4,c,fg); } at(A.eyeF,2,2,c,fg); at(A.eyeF,2,3,c,fg); }
}
})();
