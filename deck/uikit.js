/* Hexmancers pixel UI kit: rock walls, carved stone frames, stone buttons, inset slots,
   header bars, banners, pixel icons and the camp scene, all drawn here at load in the
   style of an old PC dungeon game. Every art pixel is shown as PX css pixels (2, so the art
   stays crisp on phones and tablets). Textures are handed to the stylesheet as CSS
   variables (--px-frame and friends); icons and scenes are data URLs and canvases. */
(function(root){
'use strict';
const PX=2;
const hx=h=>{ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255]; };
const mix=(a,b,t)=>[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t)).concat(255);
const lift=(c,d)=>[0,1,2].map(i=>Math.max(0,Math.min(255,c[i]+d))).concat(255);
const STONE=['#0b0c0e','#121417','#191c20','#22262b','#2c3137','#383e45','#474e56','#5c646d','#7a838c','#a3acb4'].map(hx);
const C={k:hx('#000000'), blue:hx('#8fe4ff'), blue2:hx('#3a9ccc'), blue3:hx('#1b5a85'), deep:hx('#0e3a66'), deep2:hx('#0a2846'),
  gold:hx('#f2c94c'), gold2:hx('#b08a2a'), gold3:hx('#6e5418'), white:hx('#eef3f6'), neon:hx('#39ff8a'),
  wood:hx('#7a5532'), wood2:hx('#4e3420'), wood3:hx('#a8784a'), skin:hx('#d4a985'), skin2:hx('#a77c5c'),
  steel:hx('#8f99a3'), steel2:hx('#5c656e'), steel3:hx('#c7d0d8'), paper:hx('#d9dee2'), paper2:hx('#a9b1b8'),
  leather:hx('#6e4a2c'), leather2:hx('#4a311d'), red:hx('#ff5d6c')};
const FIRE=['#5c1a0e','#a8361a','#e8582c','#ff8a3d','#f2c94c','#fff3b0'].map(hx);

// a tiny seeded random, so the kit looks the same on every load
function rng(seed){ let a=seed|0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// a pixel image with the few drawing tools the kit needs
function Img(w,h,fill){ const d=new Uint8ClampedArray(w*h*4); const I={w,h,d,
  get(x,y){ if(x<0||y<0||x>=w||y>=h) return null; const i=(y*w+x)*4; return [d[i],d[i+1],d[i+2],d[i+3]]; },
  set(x,y,c){ x|=0; y|=0; if(!c||x<0||y<0||x>=w||y>=h) return; const i=(y*w+x)*4; d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; d[i+3]=c[3]==null?255:c[3]; },
  rect(x0,y0,x1,y1,c){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) I.set(x,y,c); },
  line(x0,y0,x1,y1,c,wd=1){ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;
    for(let i=0;i<=n;i++){ const x=Math.round(x0+(x1-x0)*i/n), y=Math.round(y0+(y1-y0)*i/n); for(let a=0;a<wd;a++) for(let b=0;b<wd;b++) I.set(x+a,y+b,c); } },
  ellipse(cx,cy,rx,ry,c){ for(let y=Math.floor(cy-ry);y<=cy+ry;y++) for(let x=Math.floor(cx-rx);x<=cx+rx;x++){ const u=(x-cx)/rx, v=(y-cy)/ry; if(u*u+v*v<=1) I.set(x,y,c); } },
  ring(cx,cy,rx,ry,t,c,a0=0,a1=360){ for(let y=Math.floor(cy-ry);y<=cy+ry;y++) for(let x=Math.floor(cx-rx);x<=cx+rx;x++){ const u=(x-cx)/rx, v=(y-cy)/ry, r=u*u+v*v,
      ui=(x-cx)/Math.max(.5,rx-t), vi=(y-cy)/Math.max(.5,ry-t); if(r<=1&&ui*ui+vi*vi>1){ let a=Math.atan2(y-cy,x-cx)*180/Math.PI; if(a<0) a+=360; if(a>=a0&&a<=a1) I.set(x,y,c); } } },
  poly(pts,c){ let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const [x,y] of pts){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
    for(let y=Math.floor(y0);y<=y1;y++) for(let x=Math.floor(x0);x<=x1;x++){ let ins=false; const px=x+.5, py=y+.5;
      for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi) ins=!ins; }
      if(ins) I.set(x,y,c); } },
  // a black edge around everything drawn, the way hand-made sprites are outlined
  outline(c=C.k){ const src=d.slice(); const on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&src[(y*w+x)*4+3]>0;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(!on(x,y)&&(on(x+1,y)||on(x-1,y)||on(x,y+1)||on(x,y-1))) I.set(x,y,c); return I; },
  over(o,ox=0,oy=0){ for(let y=0;y<o.h;y++) for(let x=0;x<o.w;x++){ const c=o.get(x,y); if(c[3]) I.set(x+ox,y+oy,c); } return I; },
  canvas(){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').putImageData(new ImageData(d,w,h),0,0); return cv; },
  url(){ return I.canvas().toDataURL(); } };
  if(fill) for(let i=0;i<w*h;i++) d.set(fill,i*4);
  return I; }

/* ---------- textures ---------- */
// cracked stone blocks that tile in both directions; tones come from a ramp so each area can tint them
function wall(ramp,size,seed,base){ const R=rng(seed), I=Img(size,size,ramp[0]); const pick=t=>ramp[Math.max(0,Math.min(ramp.length-1,t+(R()<.12?-1:R()<.12?1:0)))];
  const rows=[]; let y=0; while(y<size){ let h=[14,16,18,20][Math.floor(R()*4)]; if(size-y-h<12) h=size-y; rows.push([y,h]); y+=h; }
  for(const [ry,rh] of rows){ const ws=[]; while(ws.reduce((a,b)=>a+b,0)<size) ws.push([16,20,24,28,32][Math.floor(R()*5)]);
    ws[ws.length-1]-=ws.reduce((a,b)=>a+b,0)-size; if(ws[ws.length-1]<10){ const l=ws.pop(); ws[ws.length-1]+=l; }
    let cx=Math.floor(R()*size);
    for(const bw of ws){ const tone=base+(R()<.3?-1:R()<.3?1:0);
      for(let by=0;by<rh;by++) for(let bx=0;bx<bw;bx++){ const X=(cx+bx)%size, Y=ry+by;
        if(bx===bw-1||by===rh-1){ I.set(X,Y,ramp[0]); continue; }
        if((bx<2||bx>bw-4)&&(by<2||by>rh-4)&&!(bx>0&&bx<bw-2&&by>0&&by<rh-2)){ I.set(X,Y,ramp[1]); continue; }
        if(by===0||bx===0) I.set(X,Y,pick(tone+2)); else if(by===1||bx===1) I.set(X,Y,pick(tone+1));
        else if(by===rh-2||bx===bw-2) I.set(X,Y,pick(tone-1)); else I.set(X,Y,pick(tone)); }
      // a crack or a chip in some blocks
      if(R()<.45){ let kx=cx+3+Math.floor(R()*(bw-7)), ky=ry+2+Math.floor(R()*(rh-6)); const n=4+Math.floor(R()*7);
        for(let i=0;i<n;i++){ I.set(kx%size,ky,ramp[1]); I.set((kx+1)%size,ky,pick(tone+1)); kx+=R()<.5?1:0; ky=Math.min(ry+rh-3,ky+(R()<.7?1:0)); } }
      if(R()<.3){ const px=cx+2+Math.floor(R()*(bw-5)), py=ry+2+Math.floor(R()*(rh-5)); I.set(px%size,py,ramp[0]); I.set((px+1)%size,py,ramp[1]); I.set(px%size,py+1,pick(tone+2)); }
      cx+=bw; } }
  return I; }
function slate(){ const R=rng(11), I=Img(32,32); for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const r=R(); I.set(x,y,r<.1?STONE[2]:r<.975?STONE[1]:STONE[3]); } return I; }
// the carved frame for panels: slice 10, shown as an 20px border
function frame(){ const N=30, S=10, I=Img(N,N), R=rng(5); const n=t=>STONE[Math.max(0,Math.min(9,t+(R()<.15?-1:R()<.15?1:0)))];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const dd=Math.min(x,y,N-1-x,N-1-y), tl=Math.min(x,y)===dd&&!(x>N-1-y||y>N-1-x);
    if(dd>=S) continue;
    if(dd===S-1){ I.set(x,y,STONE[1]); continue; }
    if(dd===0) I.set(x,y,C.k);
    else if(dd===1) I.set(x,y,tl?STONE[8]:STONE[3]);
    else if(dd===2) I.set(x,y,tl?n(6):n(3));
    else if(dd<=5) I.set(x,y,n(dd===3&&tl?5:4));
    else if(dd===6) I.set(x,y,tl?STONE[2]:STONE[5]);
    else if(dd===7) I.set(x,y,C.k);
    else I.set(x,y,STONE[0]); }
  for(const [cx,cy] of [[3,3],[N-6,3],[3,N-6],[N-6,N-6]]){ I.rect(cx,cy,cx+2,cy+2,STONE[7]); I.set(cx,cy,STONE[9]); I.set(cx+1,cy,STONE[8]); I.set(cx,cy+1,STONE[8]); I.set(cx+2,cy+2,STONE[1]); I.set(cx+2,cy+1,STONE[4]); I.set(cx+1,cy+2,STONE[4]); }
  return I; }
// raised buttons, slice 4: stone, enchanted blue (the main action), gold, and pressed stone
function button(rim,hi,body,lo,lo2){ const N=12, I=Img(N,N,body);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(x===0||y===0||x===N-1||y===N-1) I.set(x,y,C.k);
    else if(y===1||x===1) I.set(x,y,rim); else if(y===2||x===2) I.set(x,y,hi);
    else if(y===N-2||x===N-2) I.set(x,y,lo2); else if(y===N-3||x===N-3) I.set(x,y,lo); }
  for(const [x,y] of [[0,0],[N-1,0],[0,N-1],[N-1,N-1]]) I.set(x,y,[0,0,0,0]);
  I.set(1,1,C.k); I.set(N-2,1,C.k); I.set(1,N-2,C.k); I.set(N-2,N-2,C.k);
  return I; }
function slot(){ const N=9, I=Img(N,N,hx('#0c0e10'));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ if(y===0||x===0) I.set(x,y,C.k); else if(y<3&&x>0||x<3&&y>0) I.set(x,y,STONE[0]); else if(y===N-1||x===N-1) I.set(x,y,STONE[5]); }
  I.rect(3,3,N-2,N-2,hx('#0c0e10')); return I; }
// a section header bar with rivets at both ends, slice 4 x 12
function bar(){ const W=32, H=16, I=Img(W,H,STONE[3]);
  for(let x=0;x<W;x++){ I.set(x,0,C.k); I.set(x,H-1,C.k); I.set(x,1,STONE[6]); I.set(x,2,STONE[4]); I.set(x,H-2,STONE[1]); I.set(x,H-3,STONE[2]); }
  for(let y=0;y<H;y++){ I.set(0,y,C.k); I.set(W-1,y,C.k); if(y>0&&y<H-1){ I.set(1,y,STONE[5]); I.set(W-2,y,STONE[2]); } }
  for(const cx of [4,W-7]){ I.rect(cx,6,cx+2,8,STONE[7]); I.set(cx,6,STONE[9]); I.set(cx+2,8,STONE[1]); }
  return I; }
// the title banner: deep blue cloth between two pointed iron caps with blue gems, slice 0 x 16
function banner(){ const W=64, H=24, I=Img(W,H);
  I.rect(14,3,W-15,H-4,C.deep);
  for(let x=14;x<W-14;x++){ I.set(x,3,C.k); I.set(x,H-4,C.k); I.set(x,4,C.blue); I.set(x,5,C.blue3); I.set(x,H-5,C.blue3); I.set(x,H-6,C.deep2); }
  for(const side of [0,1]){ const P=(x,y,c)=>I.set(side?W-1-x:x,y,c);
    for(let y=0;y<H;y++){ const span=11-Math.abs(y-11.5)|0; for(let x=Math.max(1,13-span);x<=14;x++) P(x,y,y<11?STONE[7]:y<14?STONE[6]:STONE[4]);
      if(span>0) P(Math.max(0,13-span),y,C.k); }
    for(let y=1;y<H-1;y++) P(15,y,C.k);
    P(8,10,C.blue); P(9,10,C.white); P(8,11,C.blue2); P(9,11,C.blue); P(8,12,C.blue3); P(9,12,C.blue2); P(10,11,C.blue2); P(7,11,C.blue3);
    for(let y=0;y<H;y++) if(I.get(side?W-1-14:14,y)[3]) P(14,y,C.k); }
  return I; }

/* ---------- icons (24 x 24, shown at 48) ---------- */
const ICON={};
const dark=(c,t=.45)=>mix(c,C.k,t), light=(c,t=.45)=>mix(c,C.white,t);
const ICONS={
  coin(I){ I.ellipse(11.5,11.5,9,9,C.gold2); I.ellipse(11,11,8,8,C.gold); I.ring(11,11,6,6,1,C.gold2); I.rect(10,7,11,15,C.gold2); I.set(7,5,C.white); I.set(6,6,C.white); I.set(8,5,light(C.gold)); },
  deck(I){ I.rect(8,2,19,19,C.deep); I.rect(9,3,18,18,C.deep2); I.rect(9,3,18,3,C.blue3); I.rect(3,5,14,22,C.paper); I.rect(4,6,13,21,C.white); I.rect(5,7,12,20,C.paper);
    I.line(8,9,8,18,C.blue3); I.line(5,13,11,13,C.blue3); I.set(8,13,C.blue); },
  cards(I){ [[1,1,C.blue],[13,1,C.gold],[1,13,C.neon],[13,13,FIRE[3]]].forEach(([x,y,c])=>{ I.rect(x,y,x+9,y+9,C.paper); I.rect(x+1,y+1,x+8,y+8,C.white); I.rect(x+3,y+3,x+6,y+6,c); I.set(x+3,y+3,light(c)); }); },
  bag(I){ I.ellipse(11.5,15,9,7.5,STONE[6]); I.ellipse(11,14,7,6,STONE[7]); I.poly([[7,3],[16,3],[14,8],[9,8]],STONE[6]); I.line(7,8,16,8,C.gold,1); I.line(7,9,16,9,C.gold2);
    I.ellipse(8,14,2,2,STONE[8]); I.set(11,17,C.gold); I.set(12,17,C.gold); I.set(11,18,C.gold2); },
  hero(I){ I.poly([[14,0],[5,12],[19,12]],C.deep); I.poly([[14,1],[12,6],[16,6]],C.blue3); I.rect(3,12,20,13,C.deep); I.rect(5,10,18,11,C.gold); I.set(13,5,C.blue); I.set(14,4,C.white);
    I.rect(7,14,16,18,C.skin); I.rect(7,18,16,18,C.skin2); I.set(9,16,C.blue); I.set(14,16,C.blue); I.poly([[7,18],[16,18],[13,23],[10,23]],C.white); I.line(11,19,11,22,C.paper2); },
  skull(I){ I.ellipse(11.5,10,8,8,C.gold); I.rect(7,15,16,20,C.gold); I.rect(8,8,10,11,C.k); I.rect(13,8,15,11,C.k); I.set(11,13,C.gold3); I.set(12,13,C.gold3);
    for(const x of [9,11,13,15]) I.set(x,19,C.gold3); I.set(7,6,light(C.gold)); },
  scroll(I,a){ I.rect(5,4,18,19,C.paper); I.rect(6,5,17,18,C.white); I.rect(3,2,20,4,C.paper2); I.rect(3,19,20,21,C.paper2); I.line(3,3,20,3,C.paper);
    for(const y of [8,11,14]) I.line(8,y,15,y,dark(a,.3)); I.rect(11,19,13,23,a); I.set(12,23,dark(a)); },
  wand(I,a){ I.line(3,20,15,8,C.wood2,2); I.line(3,19,14,8,C.wood3); I.line(4,19,6,17,C.gold,2);
    I.poly([[18,2],[21,5],[18,8],[15,5]],a); I.set(18,4,C.white); I.set(17,5,light(a)); I.set(19,6,dark(a));
    for(const [x,y] of [[22,1],[14,1],[22,9],[13,9]]) I.set(x,y,light(a,.3)); },
  broken(I){ I.line(3,20,9,14,C.wood2,2); I.line(3,19,8,14,C.wood3); I.set(10,13,C.wood3); I.set(9,12,C.wood3);
    I.line(13,10,18,5,C.wood2,2); I.set(12,11,C.wood3); I.set(13,12,C.wood3); I.ellipse(19.5,3.5,2,2,STONE[6]); I.set(19,3,STONE[8]); },
  staff(I,a){ I.line(2,22,14,10,C.wood2,2); I.line(2,21,13,10,C.wood3); I.ring(17,6,6,6,2,C.gold,0,360); I.ellipse(17,6,3.2,3.2,a); I.set(16,5,C.white); I.set(15,6,light(a));
    I.set(18,8,dark(a)); I.set(12,12,C.gold); I.set(13,12,C.gold); I.set(12,13,C.gold2); },
  bow(I,a){ I.ring(22,22,19,19,2,C.wood,180,270); I.ring(22,22,18,18,1,C.wood3,180,270); I.line(3,21,21,3,C.paper2); I.line(6,18,18,6,STONE[7]);
    I.poly([[17,4],[21,3],[20,7]],C.steel3); I.line(4,18,7,21,a); I.line(4,17,8,21,a); I.set(4,18,light(a)); },
  crossbow(I,a){ I.ring(12,15,11,9,2,C.steel2,180,360); I.ring(12,15,10,8,1,C.steel,185,355); I.line(11,7,11,22,C.wood2,3); I.line(12,8,12,21,C.wood3);
    I.line(2,15,11,10,C.paper2); I.line(22,15,12,10,C.paper2); I.line(11,2,11,12,STONE[7]); I.poly([[9,3],[11,0],[13,3]],a); I.set(11,1,light(a)); I.rect(9,17,14,18,C.gold2); },
  spear(I,a){ I.line(2,21,14,9,C.wood2,2); I.line(2,20,13,9,C.wood3); I.poly([[14,6],[21,1],[18,10]],C.steel); I.poly([[15,7],[20,2],[18,8]],C.steel3); I.line(15,7,20,2,C.white);
    I.rect(12,9,14,11,a); I.set(12,12,a); I.set(11,13,dark(a)); I.set(10,13,dark(a)); },
  robe(I,a){ const m=mix(a,C.deep,.55); I.poly([[9,2],[15,2],[21,22],[3,22]],m); I.poly([[9,3],[3,13],[5,15],[10,8]],m); I.poly([[15,3],[21,13],[19,15],[14,8]],m);
    I.line(12,3,12,22,C.gold); I.rect(3,21,21,22,C.gold); I.line(9,9,15,9,dark(m)); I.line(10,3,8,8,light(m,.25)); I.rect(10,2,14,3,dark(m)); I.set(12,12,a); I.set(12,16,a); },
  shirt(I,a){ const m=mix(a,STONE[6],.6); I.poly([[7,3],[17,3],[22,9],[18,11],[18,22],[6,22],[6,11],[2,9]],m); I.poly([[10,3],[14,3],[12,6]],dark(m,.5)); I.line(6,12,18,12,dark(m,.25)); I.line(8,4,4,8,light(m,.3)); },
  leather(I,a){ I.poly([[6,3],[18,3],[20,20],[4,20]],C.leather); I.poly([[9,3],[15,3],[12,8]],C.leather2); I.rect(4,13,20,15,C.leather2); I.rect(10,13,13,15,C.gold);
    I.line(7,5,6,12,mix(C.leather,C.white,.2)); for(let y=5;y<12;y+=2){ I.set(12,y,a); } I.line(4,19,20,19,a); },
  plate(I,a){ I.poly([[5,3],[19,3],[21,10],[18,21],[6,21],[3,10]],C.steel); I.poly([[6,4],[11,4],[10,20],[7,20],[4,10]],C.steel3); I.line(12,4,12,20,C.steel2);
    I.rect(2,3,6,7,C.steel2); I.rect(18,3,22,7,C.steel2); I.line(5,14,19,14,C.steel2); I.ellipse(12,9,1.6,1.6,a); I.set(11,8,C.white); },
  hat(I,a){ const m=mix(a,C.deep,.6); I.poly([[15,1],[6,16],[19,16]],m); I.poly([[15,2],[13,8],[16,8]],light(m,.2)); I.rect(2,16,22,18,m); I.rect(3,19,21,19,dark(m)); I.rect(6,14,19,15,C.gold); I.set(14,8,a); I.set(15,7,C.white); },
  cap(I,a){ I.ellipse(12,13,9,8,C.leather); I.rect(3,13,21,16,C.leather); I.rect(3,16,22,17,C.leather2); I.line(6,8,9,6,mix(C.leather,C.white,.25)); I.line(12,5,12,16,C.leather2); I.set(12,9,a); },
  helm(I,a){ I.ellipse(12,12,9,10,C.steel); I.rect(3,12,21,20,C.steel); I.ellipse(10,9,4,4,C.steel3); I.rect(5,13,19,14,C.k); I.line(12,14,12,20,C.steel2); I.rect(3,20,21,21,C.steel2);
    I.poly([[11,2],[14,2],[18,-2],[20,0]],a); I.line(12,1,19,-1,a,2); },
  hood(I,a){ const m=mix(a,STONE[2],.75); I.ellipse(12,12,10,11,m); I.rect(2,13,22,23,m); I.ellipse(12,14,6,7,C.k); I.set(10,14,a); I.set(14,14,a); I.set(10,13,light(a)); I.set(14,13,light(a)); I.line(5,6,9,3,light(m,.2)); },
  buckler(I,a){ I.ellipse(12,12,10,10,C.steel2); I.ellipse(12,12,8.5,8.5,C.wood); I.ring(12,12,10,10,1.5,C.steel,0,360); I.ellipse(12,12,3,3,a); I.set(11,11,C.white); I.set(7,7,C.wood3); I.set(16,15,C.wood2); },
  tower(I,a){ I.poly([[4,2],[20,2],[20,15],[12,22],[4,15]],C.steel2); I.poly([[6,4],[18,4],[18,14],[12,20],[6,14]],mix(a,C.deep,.55)); I.line(12,6,12,17,a); I.line(8,10,16,10,a); I.set(12,10,C.white); I.line(5,3,5,13,C.steel3); },
  bracer(I,a){ for(const ox of [1,12]){ I.poly([[ox+1,5],[ox+9,3],[ox+10,20],[ox,21]],C.leather); I.rect(ox,7,ox+9,8,C.steel); I.rect(ox,16,ox+10,17,C.steel); I.line(ox+2,6,ox+2,19,mix(C.leather,C.white,.2)); I.rect(ox+4,11,ox+6,13,a); I.set(ox+4,11,C.white); } },
  ring(I,a){ I.ring(12,15,8,7,2.5,C.gold,0,360); I.ring(12,15,8,7,1,C.gold2,20,160); I.poly([[12,2],[16,6],[12,10],[8,6]],a); I.set(11,4,C.white); I.set(10,6,light(a)); I.set(13,8,dark(a)); I.set(6,13,light(C.gold)); },
};
function icon(name,accent){ const key=name+'|'+(accent||''); if(ICON[key]) return ICON[key];
  const I=Img(24,24); (ICONS[name]||ICONS.coin)(I,accent?hx(accent):C.blue); I.outline(); return ICON[key]=I.url(); }
// which picture a piece of gear gets
const HEADS={leather_cap:'cap', wizard_hat:'hat', black_hood:'hood'};
function gearIconName(id){ const G=typeof GEAR!=='undefined'&&GEAR[id]; if(!G) return 'wand';
  if(G.slot==='weapon') return id==='broken_wand'?'broken':(G.kind||'wand');
  if(G.slot==='body') return id==='cloth_shirt'?'shirt':G.weight==='heavy'?'plate':G.weight==='medium'?'leather':'robe';
  if(G.slot==='head') return HEADS[id]||'helm';
  if(G.slot==='offhand') return id==='buckler'?'buckler':'tower';
  if(G.slot==='arms') return 'bracer';
  return 'ring'; }
function gearIcon(id,size=48){ const G=GEAR[id], col=(COLORS[G.family]||{}).c||'#b4b8c8';
  return `<img class="pxi" src="${icon(gearIconName(id),col)}" width="${size}" height="${size}" alt="">`; }
function uiIcon(name,size=48,accent){ return `<img class="pxi" src="${icon(name,accent)}" width="${size}" height="${size}" alt="">`; }

/* ---------- the camp scene, one per area ---------- */
const SCENE_W=165, SCENE_H=96, SCENES={};
const AREA_LOOK=[ // Glowworm Hollows, Frozen Deeps, Gilded Ruins, The Abyss
  {tint:'#1d262f', dots:['#39ff8a','#8fe4ff'], feature:'crystal'},
  {tint:'#1b3048', dots:['#8fe4ff','#eef3f6'], feature:'ice'},
  {tint:'#25272b', dots:['#f2c94c','#fff3b0'], feature:'gold'},
  {tint:'#0d1115', dots:['#eef3f6','#8fe4ff'], feature:'stars'}];
function areaRamp(tint){ const t=hx(tint); return [-30,-20,-10,0,10,20,32,46].map(dl=>lift(t,dl)); }
function sceneBase(ai){ if(SCENES[ai]) return SCENES[ai];
  const L=AREA_LOOK[ai%AREA_LOOK.length], R=rng(91+ai*7), ramp=areaRamp(L.tint), W=SCENE_W, H=SCENE_H;
  const T=wall(ramp,64,33+ai,3), I=Img(W,H); for(let y=0;y<H;y++) for(let x=0;x<W;x++) I.set(x,y,T.get(x%64,y%64));
  // a tunnel leading deeper
  I.ellipse(124,44,22,26,hx('#040506')); I.rect(102,44,146,70,hx('#040506')); I.ring(124,44,23,27,2,ramp[5],180,360); I.ring(124,44,23,27,1,ramp[6],200,340);
  for(let y=46;y<70;y+=3){ I.set(102,y,ramp[4]); I.set(146,y,ramp[2]); }
  // the floor
  const F=66; for(let y=F;y<H;y++) for(let x=0;x<W;x++){ const t=y<F+8?2:y<F+18?3:4; I.set(x,y,ramp[Math.max(0,Math.min(7,t+(R()<.15?-1:R()<.12?1:0)))]); }
  I.line(0,F,W-1,F,ramp[0]); I.line(0,F+1,W-1,F+1,ramp[5]);
  for(let i=0;i<60;i++){ const x=Math.floor(R()*W), y=F+3+Math.floor(R()*(H-F-4)); I.set(x,y,ramp[6]); I.set(x+1,y,ramp[5]); I.set(x,y+1,ramp[1]); I.set(x+1,y+1,ramp[1]); }
  // stalactites
  for(const sx of [8,30,52,76,98,150,160]){ const len=8+Math.floor(R()*12); for(let i=0;i<len;i++){ const w=Math.max(0,3-Math.floor(i/4)); for(let x=sx-w;x<=sx+w;x++) I.set(((x%W)+W)%W,i,x<sx?ramp[5]:x===sx?ramp[4]:ramp[2]); } }
  // the area's own light
  if(L.feature==='crystal'||L.feature==='ice'){ const cols=L.dots.map(hx);
    for(const [cx,cy,h] of [[18,66,12],[26,66,8],[148,66,14],[156,66,9]]){ const c=cols[0], d2=dark(c,.5);
      I.poly([[cx-3,cy],[cx,cy-h],[cx+3,cy]],c); I.poly([[cx,cy],[cx,cy-h],[cx+3,cy]],d2); I.set(cx-1,cy-h+3,C.white); } }
  if(L.feature==='gold'){ for(const px of [14,150]){ I.rect(px,20,px+9,F,ramp[5]); I.rect(px+1,20,px+3,F,ramp[6]); I.rect(px+7,20,px+9,F,ramp[3]); I.rect(px-2,18,px+11,21,ramp[6]); I.rect(px-2,F-3,px+11,F,ramp[4]);
      for(let y=26;y<F-4;y+=7){ I.set(px+4,y,C.gold); I.set(px+5,y+1,C.gold); I.set(px+5,y,C.gold2); } }
    for(let i=0;i<14;i++){ const x=Math.floor(R()*W), y=8+Math.floor(R()*50); I.set(x,y,C.gold); I.set(x+1,y+1,C.gold2); } }
  for(let i=0;i<(L.feature==='stars'?40:22);i++){ const x=Math.floor(R()*W), y=1+Math.floor(R()*(L.feature==='stars'?60:20)), c=hx(L.dots[R()<.7?0:1]);
    I.set(x,y,c); if(R()<.4) I.set(x,y+1,dark(c,.5)); }
  // stones around the fire and the logs
  for(const [x,y] of [[70,84],[76,87],[83,88],[90,87],[96,84]]){ I.rect(x,y,x+4,y+2,STONE[6]); I.rect(x+1,y,x+3,y,STONE[8]); I.rect(x,y+2,x+4,y+2,STONE[3]); }
  I.line(72,83,94,77,C.wood2,3); I.line(72,77,94,83,C.wood,3); I.line(73,77,93,82,C.wood3);
  // a chest, gold-banded
  const ch=Img(W,H); ch.rect(104,72,122,85,C.wood); ch.rect(104,69,122,73,C.wood3); ch.rect(104,74,122,75,C.gold2); ch.rect(111,73,115,78,C.gold); ch.set(113,76,C.k);
  ch.line(105,71,121,71,mix(C.wood3,C.white,.2)); ch.outline(); I.over(ch);
  // a bedroll
  const bd=Img(W,H); bd.rect(20,80,46,86,C.deep); bd.rect(20,80,46,81,C.blue3); bd.ellipse(46,83,4,3.5,C.deep2); bd.line(30,80,30,86,C.gold2); bd.outline(); I.over(bd);
  return SCENES[ai]=I; }
// draw the scene with the player and a fire that flickers with time t
function drawCampScene(cv,depth,t,sprite){ const ai=Math.floor((Math.max(1,depth)-1)/3), base=sceneBase(ai);
  cv.width=SCENE_W; cv.height=SCENE_H; const cx=cv.getContext('2d'); cx.imageSmoothingEnabled=false; cx.putImageData(new ImageData(base.d.slice(),SCENE_W,SCENE_H),0,0);
  const fx=83, fy=80, R=rng(Math.floor(t*8));
  // firelight on the floor and walls: two dithered rings, never a gradient
  const img=cx.getImageData(0,0,SCENE_W,SCENE_H), d=img.data;
  for(let y=30;y<SCENE_H;y++) for(let x=40;x<130;x++){ const r=Math.hypot(x-fx,(y-fy)*1.7), i=(y*SCENE_W+x)*4;
    if(r<30&&((x+y)%2===0||r<18)){ const k=r<18?26:16; d[i]=Math.min(255,d[i]+k); d[i+1]=Math.min(255,d[i+1]+k*.6); d[i+2]=Math.min(255,d[i+2]+k*.2); } }
  cx.putImageData(img,0,0);
  for(let x=fx-9;x<=fx+9;x++){ const h=4+Math.round(13*(1-Math.abs(x-fx)/10))+Math.floor(R()*4);
    for(let i=0;i<h;i++){ const k=Math.min(5,Math.floor((1-i/h)*3.2)+(Math.abs(x-fx)<4?2:Math.abs(x-fx)<7?1:0));
      if(i>h-3&&R()<.5) continue; const c=FIRE[k]; cx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`; cx.fillRect(x,fy-2-i,1,1); } }
  for(let i=0;i<4;i++){ const c=FIRE[4]; cx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`; cx.fillRect(fx-6+Math.floor(R()*12),fy-22-Math.floor(R()*16),1,1); }
  if(sprite){ cx.fillStyle='rgba(0,0,0,.45)'; cx.fillRect(43,88,22,2);
    // hand-placed sprites (64 px) stand at full size; the old 32 px ones are scaled up
    if(sprite.width>32) cx.drawImage(sprite,14,26); else cx.drawImage(sprite,0,0,sprite.width,sprite.height,38,48,40,40); }
}

/* ---------- the depth map ---------- */
// 12 depths in a window around the chosen one; cleared depths are pale, the chosen one is
// blue, bosses are gold skulls, dotted lines mark where the area changes
function drawDepthMap(cv,pick,deepest){ const W=165, H=45, SP=13; cv.width=W; cv.height=H; const I=Img(W,H), R=rng(3);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) I.set(x,y,R()<.9?STONE[1]:STONE[2]);
  const start=Math.max(1,Math.floor((pick-1)/12)*12+1), pts=[];
  for(let i=0;i<12;i++) pts.push([10+i*SP, 22+(i%2?6:-6)]);
  for(let i=1;i<12;i++) if((start+i-1)%3===0){ const x=10+i*SP-Math.floor(SP/2); for(let y=3;y<H-3;y+=2) I.set(x,y,STONE[4]); }
  for(let i=0;i<11;i++){ const [x0,y0]=pts[i],[x1,y1]=pts[i+1]; for(let s=0;s<SP;s+=2) I.set(x0+s,Math.round(y0+(y1-y0)*s/SP),start+i<deepest?STONE[7]:STONE[3]); }
  const sk=Img(24,24); ICONS.skull(sk); sk.outline();
  pts.forEach(([x,y],i)=>{ const n=start+i, boss=n%4===0;
    if(n===pick){ I.rect(x-5,y-5,x+5,y+5,C.k); I.rect(x-4,y-4,x+4,y+4,C.blue2); I.rect(x-3,y-3,x+3,y+3,C.blue); I.set(x-2,y-2,C.white); I.set(x-1,y-2,C.white);
      for(const [a,b] of [[-8,0],[8,0],[0,-8],[0,8]]) I.set(x+a,y+b,C.blue2); }
    if(boss){ for(let yy=0;yy<24;yy+=2) for(let xx=0;xx<24;xx+=2){ const c=sk.get(xx,yy); if(c[3]) I.set(x-6+xx/2,y-6+yy/2,n>deepest?mix(c,STONE[3],.6):c); }
      if(n<pick&&n<=deepest){ I.line(x-5,y-5,x+5,y+5,STONE[8]); } }
    else if(n!==pick){ I.rect(x-3,y-3,x+3,y+3,C.k); I.rect(x-2,y-2,x+2,y+2,n<deepest?STONE[8]:n===deepest?STONE[6]:STONE[3]); if(n<deepest) I.set(x-1,y-1,C.white); } });
  cv.getContext('2d').putImageData(new ImageData(I.d,W,H),0,0); return start; }

/* ---------- card frames ----------
   A carved stone rim around every card with a band in the card's color, gold studs on
   legendary and hero cards: the cards sit in the same stone world as the menus.
   Slice 3, shown as a 6px border. */
const FRAMES={};
function cardFrame(col,rarity){ const key=col+'|'+rarity; if(FRAMES[key]) return FRAMES[key];
  const N=9, I=Img(N,N), R=rng(17), c=hx(col), gold=rarity==='legendary'||rarity==='hero';
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const d=Math.min(x,y,N-1-x,N-1-y), tl=x<=y?x===d:y===d;
    const lit=(x===d&&x<N/2)||(y===d&&y<N/2);
    if(d===0) I.set(x,y,C.k);
    else if(d===1) I.set(x,y,lit?STONE[R()<.25?5:6]:STONE[R()<.25?2:3]);
    else if(d===2) I.set(x,y,lit?light(c,.15):dark(c,.25)); }
  for(const [x,y] of [[1,1],[N-2,1],[1,N-2],[N-2,N-2]]) I.set(x,y,gold?C.gold:STONE[8]);
  if(rarity==='hero') for(const [x,y] of [[2,1],[1,2],[N-3,1],[N-2,2],[1,N-3],[2,N-2],[N-3,N-2],[N-2,N-3]]) I.set(x,y,C.gold2);
  return FRAMES[key]=`url(${I.url()})`; }
function cardTexture(){ const R=rng(23), I=Img(32,32);
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const r=R(); if(r<.07) I.set(x,y,[0,0,0,70]); else if(r<.11) I.set(x,y,[255,255,255,14]); }
  for(let i=0;i<5;i++){ let x=Math.floor(R()*32), y=Math.floor(R()*32); for(let k=0;k<4;k++){ I.set(x%32,y%32,[0,0,0,55]); x+=R()<.5?1:0; y++; } }
  return I; }

/* ---------- card faces: one texture per family, 64 x 64 tiles ---------- */
const TAU=Math.PI*2, sh=(c,d)=>lift(hx(c),d);
const FACE_TEX={
  // frost: rolling water with foam, a few soft cloud puffs
  frost(){ const I=Img(64,64,hx('#173452')), R=rng(41);
    for(const [cx,cy,r] of [[14,10,6],[22,9,5],[48,40,6],[56,41,4]]) I.ellipse(cx,cy,r,r*.6,sh('#173452',10));
    for(let i=0;i<6;i++){ const y0=4+i*11, ph=R()*TAU;
      for(let x=0;x<64;x++){ const t=TAU*x/32+ph, y=Math.round(y0+2*Math.sin(t));
        I.set(x,(y+64)%64,hx('#2a5c8a')); if(Math.cos(t)>.3) I.set(x,(y+63)%64,hx('#4f86b8')); if(Math.cos(t)>.9&&R()<.5) I.set(x,(y+62)%64,hx('#a8d4ff')); } }
    return I; },
  // fire: desert dunes under a red sky, embers drifting up
  fire(){ const I=Img(64,64,hx('#4a1f16')), R=rng(43);
    for(let i=0;i<4;i++){ const y0=i*16+8, ph=R()*TAU;
      for(let x=0;x<64;x++){ const y=Math.round(y0+3*Math.sin(TAU*x/64+ph));
        for(let k=1;k<8;k++) I.set(x,(y+k)%64,sh('#4a1f16',k<3?10:5)); I.set(x,y%64,hx('#8a3e26')); I.set(x,(y+1)%64,hx('#6a2e1c')); } }
    for(let i=0;i<70;i++){ const x=Math.floor(R()*64), y=Math.floor(R()*64); I.set(x,y,hx(R()<.6?'#e8582c':'#f2a54a')); }
    for(let i=0;i<6;i++){ const x=Math.floor(R()*64), y=Math.floor(R()*64); for(let k=0;k<4;k++) I.set((x+(k%2))%64,(y-k+64)%64,hx(k<2?'#c4471f':'#ff8a3d')); }
    return I; },
  // shadow: cave rock, cracked blocks in near-black
  shadow(){ return wall([-16,-11,-6,0,6,12,20,30].map(d=>sh('#1e1a1d',d)),64,47,3); },
  // light: Greek marble ashlar, pale blocks with grey veins
  light(){ const I=Img(64,64,hx('#d9d2bc')), R=rng(53);
    for(let i=0;i<9;i++){ let x=Math.floor(R()*64), y=Math.floor(R()*64); const c=hx(R()<.5?'#bfb59a':'#a99f84');
      for(let k=0;k<40;k++){ I.set(x,y,c); x=(x+1)%64; y=(y+(R()<.5?1:R()<.5?0:63))%64; } }
    for(let y=0;y<64;y+=16){ for(let x=0;x<64;x++){ I.set(x,y,hx('#b3a98e')); I.set(x,(y+1)%64,hx('#ece6d4')); }
      const off=(y/16)%2?16:0; for(let x=off;x<64;x+=32) for(let k=0;k<16;k++){ I.set(x,(y+k)%64,hx('#b3a98e')); I.set((x+1)%64,(y+k)%64,hx('#ece6d4')); } }
    return I; },
  // verdant: plains of grass tufts with a few flowers
  verdant(){ const I=Img(64,64,hx('#1c3a24')), R=rng(59);
    for(let i=0;i<40;i++){ const x=Math.floor(R()*64), y=Math.floor(R()*64); I.ellipse(x,y,3,2,sh('#1c3a24',-6)); }
    for(let i=0;i<120;i++){ const x=Math.floor(R()*64), y=Math.floor(R()*64), c=hx(R()<.5?'#2c5a36':'#3f7a4a');
      I.set(x,y,c); I.set((x+63)%64,(y+63)%64,c); I.set((x+1)%64,(y+63)%64,c); if(R()<.5) I.set(x,(y+62)%64,hx('#5a9a5e')); }
    for(let i=0;i<8;i++) I.set(Math.floor(R()*64),Math.floor(R()*64),hx(R()<.5?'#e8e8a0':'#f2c4d8'));
    return I; },
  // storm: sun rays and forked lightning
  storm(){ const I=Img(64,64,hx('#4a3c12')), R=rng(61);
    for(let y=0;y<64;y++) for(let x=0;x<64;x++) if((x+y)%16<3) I.set(x,y,sh('#4a3c12',8));
    for(let b=0;b<2;b++){ let x=8+b*32+Math.floor(R()*8);
      for(let y=0;y<64;y++){ if(y%3===0) x=(x+(R()<.5?2:62))%64; I.set(x,y,hx('#d9a83a')); I.set((x+1)%64,y,hx('#a8822a')); I.set((x+63)%64,y,hx('#6e5418')); } }
    for(let i=0;i<14;i++) I.set(Math.floor(R()*64),Math.floor(R()*64),hx('#ffd866'));
    return I; },
  // brown (machines): riveted metal plates crossed by a stitched leather strap
  brown(){ const I=Img(64,64,hx('#44352a'));
    for(let y=0;y<64;y++) for(let x=0;x<64;x++){ const px=x%32, py=y%32;
      if(px===0||py===0) I.set(x,y,hx('#5a4636')); else if(px===31||py===31) I.set(x,y,hx('#2a2018')); }
    for(let y=0;y<64;y+=32) for(let x=0;x<64;x+=32) for(const [dx,dy] of [[3,3],[28,3],[3,28],[28,28]]){ I.rect(x+dx,y+dy,x+dx+1,y+dy+1,hx('#8a7a66')); I.set(x+dx,y+dy,hx('#c8b8a0')); }
    for(let y=40;y<50;y++) for(let x=0;x<64;x++) I.set(x,y,hx(y===40||y===49?'#2a1a10':'#5a3c28'));
    for(let x=0;x<64;x+=4){ I.set(x,42,hx('#a87a50')); I.set(x+1,42,hx('#a87a50')); I.set(x,47,hx('#a87a50')); I.set(x+1,47,hx('#a87a50')); }
    return I; },
  // gray: slate-grey paper, ruled pages with a margin line and fibres
  gray(){ const I=Img(64,64,hx('#6f7378')), R=rng(67);
    for(let i=0;i<220;i++) I.set(Math.floor(R()*64),Math.floor(R()*64),hx(R()<.5?'#676b70':'#7b7f84'));
    for(let y=6;y<64;y+=8) for(let x=0;x<64;x++) I.set(x,y,hx('#5f6368'));
    for(let y=0;y<64;y++){ I.set(10,y,hx('#86787a')); }
    return I; },
};

/* ---------- hand the textures to the stylesheet ---------- */
function install(){ if(typeof document==='undefined') return; const s=document.documentElement.style, u=I=>`url(${I.url()})`;
  s.setProperty('--px-wall',u(wall(STONE.slice(0,8).map(c=>lift(c,-4)),64,7,3)));
  s.setProperty('--px-slate',u(slate()));
  s.setProperty('--px-frame',u(frame()));
  s.setProperty('--px-btn',u(button(STONE[8],STONE[6],STONE[5],STONE[3],STONE[2])));
  s.setProperty('--px-btn-down',u(button(STONE[2],STONE[3],STONE[4],STONE[5],STONE[6])));
  s.setProperty('--px-btn-blue',u(button(C.blue,C.blue2,hx('#0e2738'),hx('#0a1b28'),hx('#06121b'))));
  s.setProperty('--px-btn-gold',u(button(hx('#fff3b0'),C.gold,hx('#3a2e10'),hx('#2a210b'),hx('#1c1607'))));
  s.setProperty('--px-slot',u(slot()));
  s.setProperty('--px-bar',u(bar()));
  s.setProperty('--px-banner',u(banner()));
  s.setProperty('--px-coin',`url(${icon('coin')})`);
  s.setProperty('--px-cardtex',u(cardTexture()));
  for(const k in FACE_TEX) s.setProperty('--tex-'+k,u(FACE_TEX[k]()));
}
if(typeof document!=='undefined'){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install(); }

Object.assign(root,{PX,cardFrame,uiIcon,gearIcon,gearIconName,drawCampScene,drawDepthMap,SCENE_W,SCENE_H});
})(typeof window!=='undefined'?window:globalThis);
