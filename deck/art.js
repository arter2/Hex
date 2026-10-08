/* Hexmancers deck prototype — pixel art for every card (64 x 64) and every unit on the board (32 x 32).
   A card's picture is composed, not stamped:
   - the subject comes from the card's own name (a Lance, a Fang, a Censer, an Owl, a Trebuchet),
     falling back to what the card does;
   - its type sets the staging (a wedge fans three weapons, missiles scatter copies, a digger
     bursts from the ground, a lob shows its landing pattern);
   - its color family sets the scene, one of three per color (a lava cavern, a volcano or a
     burning forest for Fire; peaks, an ice cave or an aurora for Frost...);
   - the words in its name add effects (Magma veins, Rime ice, Thistle thorns and flowers,
     Raven feathers, Brass plating, Volt arcs...);
   - keywords add corner badges, rarity adds a glow and the frame.
   Shading comes from the top left, with a dark outline. Variation is seeded from the card id,
   so a card always has the same picture. cardArt(card) returns 64 rows of 64 hex colors;
   tools/export-art.js writes them to CSV files. */

(function(root){
const ART_SIZE=64, SPR=64;   // card art and battle sprites are both 64 x 64 (sprites: 32 design units at 2 px each)

/* ---------------- colors ---------------- */
const hexRgb=h=>{ const v=parseInt(h.slice(1),16); return [v>>16&255,v>>8&255,v&255]; };
const rgbHex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
function artMix(a,b,t){ const p=hexRgb(a), q=hexRgb(b); return rgbHex(p.map((v,i)=>v*(1-t)+q[i]*t)); }
// four tones per material: deep shadow, shadow, base, light
const ramp=c=>[artMix(c,'#0a0612',.62),artMix(c,'#0a0612',.3),c,artMix(c,'#ffffff',.42)];
const FAM={
  fire:   {m:'#e8542a', a:'#ffc233', sky:['#1c0a0e','#4a1616'], ground:'#3a1a12', glow:'#ff7a2a', o:'#140605'},
  frost:  {m:'#4fb4ee', a:'#dff4ff', sky:['#0a1430','#1e4468'], ground:'#dbe8f4', glow:'#9fe0ff', o:'#050a18'},
  storm:  {m:'#f2d23a', a:'#8f86ff', sky:['#120f2a','#3a3266'], ground:'#2a2440', glow:'#fff39a', o:'#08061a'},
  verdant:{m:'#4fbf4f', a:'#c08a4a', sky:['#0a1a12','#1e3a26'], ground:'#1f3a1a', glow:'#b8f08a', o:'#050e07'},
  light:  {m:'#ffd966', a:'#e8f0ff', sky:['#2a2240','#6a5a80'], ground:'#8a7a9a', glow:'#fff6c8', o:'#120e1c'},
  shadow: {m:'#c23a7a', a:'#8a6ac0', sky:['#0a0410','#26102e'], ground:'#1a0c1e', glow:'#f08ab8', o:'#050208'},
  gray:   {m:'#a4aabe', a:'#d09060', sky:['#141620','#2e3240'], ground:'#3a3c46', glow:'#e0e4f0', o:'#07080c'},
  brown:  {m:'#b07440', a:'#b8b8c8', sky:['#140e0a','#34261a'], ground:'#3a2a1a', glow:'#ffcf80', o:'#0a0604'},
};
// shared materials (lowercase letters are shaded, uppercase are flat, unshaded glow)
// each creature's own coat, so summons read against their scene
const COAT={Imp:'#d0463a',Wolf:'#8a98b8',Hound:'#b08a5a',Owl:'#9a7048',Toad:'#5aa04a',Bat:'#7a5a9a',Knight:'#a8a8b8',Squire:'#98a0b0',Spirit:'#8ad8e8',Golem:'#8a8272',
  Rat:'#8a7a70',Boar:'#8a5a3a',Hawk:'#c09a5a',Mole:'#6a4a3a',Beetle:'#3a9a8a',Serpent:'#4a9a4a',Bear:'#7a5030',Fox:'#e07a2a',Ogre:'#7a8a3a',Sprite:'#e080c0'};
const MATS={g:'#8a8398', t:'#8a5a2c', w:'#e8e4f0', k:'#3a3448', y:'#e8b830', s:'#7a7486', f:'#8a5a3a', l:'#4f9a3a', r:'#c02a3a', p:'#8a4ad0', x:'#a8d8f0', b:'#e8dcc0'};

/* ---------------- drawing on a grid of materials ----------------
   Shapes are given in 32-unit design coordinates and drawn at U pixels per unit: card art at
   U = 2 (64 x 64), battle sprites at U = 1 (32 x 32). Curves, circles and slopes are tested at
   the finer pixels, so a card's outlines come out smoother and its details finer. */
let G=null, GN=32, U=1;   // the subject layer being drawn, its size in pixels, pixels per unit
function grid(n,u){ GN=n; U=u; G=Array.from({length:n},()=>Array(n).fill(null)); return G; }
function hp(X,Y,m){ if(X>=0&&X<GN&&Y>=0&&Y<GN) G[Y][X]=m; }   // one fine pixel
function px(x,y,m){ const X=Math.floor(x)*U, Y=Math.floor(y)*U; for(let j=0;j<U;j++) for(let i=0;i<U;i++) hp(X+i,Y+j,m); }
function rect(x0,y0,x1,y1,m){ for(let Y=Math.round(y0)*U;Y<=Math.round(y1)*U+U-1;Y++) for(let X=Math.round(x0)*U;X<=Math.round(x1)*U+U-1;X++) hp(X,Y,m); }
// visit the fine pixels whose centres fall in a design-space box
function box(x0,y0,x1,y1,fn){ const X0=Math.max(0,Math.floor(x0*U)), X1=Math.min(GN-1,Math.ceil(x1*U)), Y0=Math.max(0,Math.floor(y0*U)), Y1=Math.min(GN-1,Math.ceil(y1*U));
  for(let Y=Y0;Y<=Y1;Y++) for(let X=X0;X<=X1;X++) fn(X,Y,(X+.5)/U,(Y+.5)/U); }
function ell(cx,cy,rx,ry,m){ box(cx-rx,cy-ry,cx+rx,cy+ry,(X,Y,x,y)=>{ if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1) G[Y][X]=m; }); }
function circ(cx,cy,r,m){ ell(cx,cy,r,r,m); }
function ringp(cx,cy,r,w,m){ box(cx-r,cy-r,cx+r,cy+r,(X,Y,x,y)=>{ const d=Math.hypot(x-cx,y-cy); if(d<=r&&d>=r-w) G[Y][X]=m; }); }
function poly(pts,m){ const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  box(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys),(X,Y,x,y)=>{ let ins=false;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i], [xj,yj]=pts[j]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) ins=!ins; }
    if(ins) G[Y][X]=m; }); }
// a thin line is one design pixel wide at U = 1, and a crisp fine-pixel stroke at U = 2
function seg(x0,y0,x1,y1,w,m){ const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*2*U)+1;
  for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, y=y0+(y1-y0)*i/n; if(w<=1){ if(U===1) px(x,y,m); else { const X=Math.floor(x*U), Y=Math.floor(y*U); hp(X,Y,m); hp(X+1,Y,m); hp(X,Y+1,m); } } else circ(x,y,w/2,m); } }
function curve(pts,w,m){ for(let i=0;i<pts.length-1;i++) seg(...pts[i],...pts[i+1],w,m); }
function quad(p0,p1,p2,w,m,steps){ const out=[]; steps=steps||14; for(let i=0;i<=steps;i++){ const t=i/steps, u=1-t;
  out.push([u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]]); } curve(out,w,m); }
// point along a direction: from (x,y) at angle a, distance d
const at=(x,y,a,d)=>[x+Math.cos(a)*d,y+Math.sin(a)*d];

/* ---------------- weapons: drawn from tail (x0,y0) to tip (x1,y1) ---------------- */
const WEAPON={
  lance(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); seg(x0,y0,...at(x1,y1,a,-7),2,'t'); const b=at(x1,y1,a,-9);
    poly([at(...b,a+1.6,4),at(x1,y1,a,0),at(...b,a-1.6,4)],'g'); poly([at(...at(x0,y0,a,5),a+1.6,3),at(x0,y0,a,9),at(...at(x0,y0,a,5),a-1.6,3)],'m'); },
  spear(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); seg(x0,y0,...at(x1,y1,a,-5),2,'t'); const b=at(x1,y1,a,-7);
    poly([at(...b,a+1.57,2.5),at(x1,y1,a,0),at(...b,a-1.57,2.5),at(...b,a,-2)],'g'); px(...at(...b,a,-3),'a'); },
  javelin(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); seg(x0,y0,x1,y1,1,'t'); poly([at(...at(x1,y1,a,-4),a+1.6,1.8),at(x1,y1,a,1),at(...at(x1,y1,a,-4),a-1.6,1.8)],'g');
    seg(...at(x0,y0,a,4),...at(x0,y0,a,7),2,'m'); },
  dart(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0), m=at(x0,y0,a,Math.hypot(x1-x0,y1-y0)*.45); seg(...m,x1,y1,2,'g');
    poly([at(...m,a+2.3,5),at(...m,a,3),at(...m,a-2.3,5)],'m'); px(x1,y1,'W'); },
  needle(x0,y0,x1,y1){ seg(x0,y0,x1,y1,1,'x'); px(x1,y1,'W'); px(x0,y0,'a'); },
  arrow(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); seg(x0,y0,x1,y1,1,'t');
    poly([at(...at(x1,y1,a,-4),a+2,3),at(x1,y1,a,1),at(...at(x1,y1,a,-4),a-2,3)],'g');
    for(const s of [1,-1]) poly([at(x0,y0,a,0),at(...at(x0,y0,a,4),a+s*1.8,3),at(x0,y0,a,6)],'m'); },
  bolt(x0,y0,x1,y1){ const pts=[], n=5; for(let i=0;i<=n;i++){ const t=i/n, j=(i%2?1:-1)*(i&&i<n?3:0), a=Math.atan2(y1-y0,x1-x0)+1.57;
      pts.push([x0+(x1-x0)*t+Math.cos(a)*j, y0+(y1-y0)*t+Math.sin(a)*j]); } curve(pts,3,'a'); curve(pts,1,'W'); },
  shot(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); for(let i=0;i<4;i++) circ(...at(x1,y1,a,-4-i*3),2.8-i*.6,i<2?'m':'a'); circ(x1,y1,4,'a'); circ(x1-1,y1-1,2,'W'); },
  ray(x0,y0,x1,y1){ seg(x0,y0,x1,y1,5,'a'); seg(x0,y0,x1,y1,2,'W'); circ(x0,y0,4,'m'); },
  beam(x0,y0,x1,y1){ WEAPON.ray(x0,y0,x1,y1); const a=Math.atan2(y1-y0,x1-x0); for(const d of [8,14]) ringp(...at(x0,y0,a,d),3,1,'m'); },
  fang(x0,y0,x1,y1){ const mx=(x0+x1)/2, my=(y0+y1)/2; poly([[mx-6,my-7],[mx+5,my-6],[mx+2,my+3],[mx-1,my+9],[mx-3,my+1]],'b'); px(mx-1,my+8,'r'); px(mx,my+7,'r'); },
  claw(x0,y0,x1,y1){ for(const d of [-5,0,5]) quad([x0+d,y0-2],[x0+d+4,(y0+y1)/2],[x1+d,y1],2,'m'); for(const d of [-5,0,5]) px(x1+d,y1,'W'); },
  blade(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0); const g=at(x0,y0,a,6); seg(x0,y0,...g,2,'t'); seg(...at(...g,a+1.57,4),...at(...g,a-1.57,4),2,'y');
    poly([at(...g,a+1.57,2),at(x1,y1,a,0),at(...g,a-1.57,2)],'w'); seg(...g,...at(x1,y1,a,-2),1,'x'); },
  lash(x0,y0,x1,y1){ const mx=(x0+x1)/2, my=(y0+y1)/2; quad([x0,y0],[mx+8,my-10],[x1,y1],2,'t'); circ(x0,y0,2,'m'); px(x1,y1,'a'); px(x1+1,y1-1,'a'); },
  spike(x0,y0,x1,y1){ const gy=Math.max(y0,y1); for(const [d,h] of [[-8,9],[-3,15],[3,12],[8,7]]) poly([[16+d-2.5,gy],[16+d,gy-h],[16+d+2.5,gy]],'m'); rect(4,gy,27,gy+2,'s'); },
};
WEAPON.javelin2=WEAPON.javelin;
const WEAPON_WORDS={Lance:'lance',Spear:'spear',Javelin:'javelin',Dart:'dart',Needle:'needle',Arrow:'arrow',Bolt:'bolt',Shot:'shot',Ray:'ray',Beam:'beam',
  Fang:'fang',Claw:'claw',Blade:'blade',Lash:'lash',Spike:'spike',Shard:'needle',Spark:'bolt',Lightning:'bolt',Missiles:'shot',Motes:'shot',Row:'beam',Fan:'arrow'};

/* ---------------- things: each drawn about the centre ---------------- */
const THING={
  // lobs
  bomb(){ circ(15,18,8,'k'); rect(17,8,21,11,'g'); quad([20,9],[24,4],[27,6],1,'t'); px(27,5,'A'); px(28,6,'W'); px(26,4,'A'); px(11,14,'w'); px(12,13,'w'); },
  orb(){ circ(16,16,9,'m'); circ(16,16,5,'a'); circ(13,13,2,'W'); ringp(16,16,11,1,'A'); },
  pot(){ ell(16,19,9,8,'f'); rect(12,9,20,12,'f'); rect(11,8,21,9,'k'); for(let x=9;x<24;x+=4) px(x,19,'a'); circ(16,7,3,'A'); },
  mortar(){ poly([[10,26],[10,12],[16,4],[22,12],[22,26]],'g'); rect(10,20,22,21,'k'); rect(14,14,18,15,'a'); },
  comet(){ for(let i=0;i<6;i++) circ(9+i*2.4,24-i*2.4,1.5+i*.5,i<3?'a':'m'); circ(23,9,6,'m'); circ(21,7,2.5,'A'); },
  stone(){ poly([[7,22],[9,12],[16,7],[24,10],[26,20],[19,26],[11,26]],'s'); seg(12,14,16,18,1,'k'); seg(19,12,21,19,1,'k'); px(14,11,'w'); },
  globe(){ circ(16,16,10,'x'); for(let i=0;i<22;i++){ const a=i*.5, r=1+i*.35; px(16+Math.cos(a)*r,16+Math.sin(a)*r,'M'); } circ(12,12,2,'W'); rect(12,26,20,28,'y'); },
  burst(){ for(let i=0;i<12;i++){ const a=i*Math.PI/6; poly([at(16,16,a-.25,4),at(16,16,a,i%2?10:14),at(16,16,a+.25,4)],i%2?'a':'m'); } circ(16,16,5,'A'); circ(16,16,2,'W'); },
  seed(){ ell(16,17,7,10,'f'); seg(16,8,16,26,1,'k'); quad([16,8],[22,2],[26,4],2,'l'); ell(24,5,3,2,'l'); },
  meteor(){ THING.comet(); for(const [x,y] of [[6,10],[12,4],[28,18]]) px(x,y,'A'); },
  // wards
  aegis(){ circ(16,16,11,'m'); ringp(16,16,11,2,'y'); circ(16,16,4,'a'); for(let i=0;i<8;i++){ const [x,y]=at(16,16,i*Math.PI/4,8); px(x,y,'y'); } },
  shield(){ poly([[6,5],[26,5],[26,16],[16,28],[6,16]],'m'); poly([[6,5],[26,5],[26,7],[6,7]],'y'); rect(15,8,17,22,'a'); rect(10,12,22,14,'a'); },
  ward(){ ringp(16,17,12,2,'a'); ringp(16,17,8,1,'M'); poly([[16,8],[23,21],[9,21]],'m'); circ(16,17,2,'W'); },
  barrier(){ box(2,12,30,26,(X,Y,x,y)=>{ const d=Math.hypot(x-16,y-26); if(d<=14&&d>=12.5&&y<26) G[Y][X]='a'; else if(d<12.5&&y<26&&(X+Y)%(4*U)===0) G[Y][X]='M'; }); rect(2,26,29,28,'s'); },
  veil(){ for(let x=6;x<27;x++){ const w=Math.sin(x*.7)*1.5; rect(x,5+w*.3,x,26+w,x%4<2?'a':'m'); } rect(4,3,28,5,'y'); },
  screen(){ for(let r=0;r<4;r++) for(let c=0;c<4;c++){ const x=7+c*6+(r%2)*3, y=7+r*5; poly([[x-3,y],[x-1.5,y-2.5],[x+1.5,y-2.5],[x+3,y],[x+1.5,y+2.5],[x-1.5,y+2.5]],(r+c)%3?'m':'a'); } },
  mantle(){ poly([[9,5],[23,5],[28,27],[16,24],[4,27]],'m'); rect(9,5,23,7,'y'); circ(16,7,2,'a'); seg(16,9,16,23,1,'k'); },
  wall(){ rect(3,10,28,27,'m'); for(let y=10;y<=27;y+=4) rect(3,y,28,y,'k'); for(let y=11;y<=27;y+=4) for(let x=((y-11)/4%2?5:10);x<28;x+=10) rect(x,y,x,y+2,'k'); },
  bulwark(){ for(let r=0;r<3;r++) for(let c=0;c<3;c++) rect(3+c*9+(r%2)*2,9+r*6,10+c*9+(r%2)*2,14+r*6,'s'); rect(2,27,29,28,'k'); },
  rampart(){ rect(3,13,28,27,'s'); for(let x=3;x<28;x+=6) rect(x,8,x+3,13,'s'); rect(14,19,17,27,'k'); for(let y=16;y<27;y+=4) rect(3,y,28,y,'k'); },
  skin(){ THING.shield(); for(let y=8;y<24;y+=3) seg(8,y,24,y+1,1,'f'); },
  // sentries
  sentry(){ rect(12,12,19,28,'g'); rect(9,26,22,29,'g'); rect(10,10,21,12,'k'); circ(15.5,7,4,'a'); circ(14,6,1.5,'W'); },
  spire(){ poly([[10,29],[16,2],[22,29]],'g'); for(let y=8;y<28;y+=5) rect(13,y,19,y,'k'); circ(16,4,2,'A'); },
  totem(){ for(let i=0;i<3;i++){ rect(10,4+i*8,21,11+i*8,i%2?'m':'t'); rect(12,6+i*8,14,7+i*8,'A'); rect(17,6+i*8,19,7+i*8,'A'); rect(13,9+i*8,18,9+i*8,'k'); } poly([[6,6],[10,4],[10,10]],'a'); poly([[25,6],[21,4],[21,10]],'a'); },
  beacon(){ rect(14,14,17,29,'t'); poly([[8,9],[24,9],[20,15],[12,15]],'g'); for(let i=0;i<5;i++) poly([[10+i*3,9],[11.5+i*3,2+(i%2)*3],[13+i*3,9]],i%2?'a':'m'); },
  obelisk(){ poly([[11,29],[13,6],[16,2],[19,6],[21,29]],'s'); for(let y=10;y<26;y+=5) rect(15,y,17,y+2,'A'); },
  pylon(){ rect(13,6,18,29,'g'); for(let y=7;y<28;y+=3) rect(11,y,20,y,'y'); for(const [a,b] of [[[18,8],[27,4]],[[13,14],[4,10]]]) seg(...a,...b,1,'A'); },
  idol(){ poly([[10,29],[10,14],[16,6],[22,14],[22,29]],'y'); rect(12,15,14,17,'k'); rect(18,15,20,17,'k'); rect(14,21,18,22,'k'); circ(16,10,2,'a'); },
  lantern(){ seg(16,1,16,6,1,'k'); rect(10,6,21,8,'g'); rect(11,9,20,24,'x'); circ(15.5,16,4,'A'); circ(15.5,16,2,'W'); rect(10,25,21,27,'g'); },
  watcher(){ rect(13,16,18,29,'s'); ell(16,10,10,6,'w'); circ(16,10,4,'m'); circ(16,10,2,'k'); px(14,8,'W'); },
  brazier(){ THING.beacon(); },
  // boons
  heart(){ circ(11,12,6,'m'); circ(21,12,6,'m'); poly([[5,14],[27,14],[16,27]],'m'); px(9,9,'W'); px(10,8,'W'); rect(15,10,17,20,'W'); rect(12,14,20,16,'W'); },
  sprout(){ THING.heart(); rect(15,10,17,20,'m'); rect(12,14,20,16,'m'); quad([16,12],[14,4],[20,2],2,'l'); ell(21,4,3,2,'l'); },
  flamesword(){ WEAPON.blade(8,26,25,6); for(let i=0;i<4;i++) poly([[18+i*2,16-i*3],[21+i*2,10-i*3],[22+i*2,15-i*3]],'A'); },
  banner(){ seg(8,3,8,29,2,'t'); poly([[9,4],[26,6],[22,11],[26,16],[9,15]],'m'); circ(15,10,2.5,'y'); },
  skull(){ circ(16,13,9,'b'); rect(11,19,21,24,'b'); circ(12,13,2.5,'k'); circ(20,13,2.5,'k'); poly([[16,16],[15,19],[17,19]],'k'); for(let x=12;x<21;x+=3) rect(x,22,x,24,'k'); px(12,13,'A'); px(20,13,'A'); },
  boot(){ poly([[9,6],[17,6],[17,20],[26,23],[26,27],[9,27]],'f'); rect(9,6,17,8,'y'); for(let i=0;i<3;i++) poly([[17,10+i*3],[28,6+i*2],[26,11+i*3]],'w'); },
  feather(){ quad([6,28],[12,8],[26,4],1,'t'); for(let i=0;i<9;i++){ const t=i/9, x=8+t*16, y=24-t*18; seg(x,y,x+5,y+4-t*2,2,'w'); seg(x,y,x-3,y-5,2,'w'); } },
  ghost(){ circ(16,12,8,'x'); poly([[8,12],[24,12],[24,28],[21,25],[18,28],[15,25],[12,28],[8,25]],'x'); rect(12,10,14,13,'k'); rect(18,10,20,13,'k'); },
  hourglass(){ rect(7,3,24,5,'t'); rect(7,26,24,28,'t'); poly([[9,6],[22,6],[17,15],[14,15]],'x'); poly([[14,16],[17,16],[22,25],[9,25]],'x'); poly([[11,21],[20,21],[22,25],[9,25]],'A'); poly([[12,8],[19,8],[16,12],[15,12]],'A'); },
  halo(){ ringp(16,7,6,2,'Y'); poly([[2,15],[14,13],[10,26]],'w'); poly([[30,15],[18,13],[22,26]],'w'); circ(16,18,4,'m'); for(let i=0;i<3;i++){ seg(4+i*2,17+i*2,12,15+i,1,'s'); seg(28-i*2,17+i*2,20,15+i,1,'s'); } },
  fist(){ rect(9,10,23,22,'f'); for(let x=9;x<23;x+=4) rect(x,10,x,14,'k'); rect(9,22,20,28,'f'); rect(9,23,20,24,'y'); },
  eclipse(){ circ(16,16,11,'A'); circ(18,14,10,'k'); ringp(16,16,13,1,'M'); },
  pillar(){ rect(12,2,19,29,'A'); rect(14,2,17,29,'W'); ell(16,28,10,2,'a'); },
  tree(){ rect(14,17,18,29,'t'); circ(16,12,9,'l'); circ(10,15,5,'l'); circ(22,15,5,'l'); for(const [x,y] of [[12,9],[19,11],[15,15]]) px(x,y,'A'); },
  sun(){ for(let i=0;i<12;i++) seg(...at(16,16,i*Math.PI/6,9),...at(16,16,i*Math.PI/6,14),2,'a'); circ(16,16,8,'m'); circ(13,13,3,'W'); },
  crystal(){ poly([[16,2],[22,12],[16,29],[10,12]],'x'); poly([[7,14],[10,19],[7,28],[4,19]],'m'); poly([[25,12],[28,18],[25,26],[22,18]],'m'); seg(16,4,16,27,1,'W'); },
  // charges
  flask(){ circ(16,20,8,'x'); rect(13,5,18,12,'x'); rect(12,3,19,5,'t'); ell(16,22,6,5,'m'); px(13,19,'W'); px(18,23,'A'); px(15,25,'A'); },
  quiver(){ poly([[9,10],[19,6],[25,26],[15,30]],'f'); rect(10,15,22,17,'y'); for(let i=0;i<4;i++){ seg(11+i*2.5,9-i,8+i*2.5,1-i*.3,1,'t'); px(8+i*2.5,1,'m'); } },
  satchel(){ rect(6,11,25,27,'f'); poly([[6,11],[25,11],[22,18],[9,18]],'t'); circ(15.5,17,2,'y'); quad([6,11],[16,1],[25,11],1,'t'); },
  pouch(){ circ(16,20,9,'f'); poly([[11,12],[21,12],[23,6],[9,6]],'f'); rect(10,11,22,12,'a'); ell(16,6,7,2,'k'); },
  vial(){ rect(13,4,18,26,'x'); ell(15.5,26,3,2,'x'); rect(13,12,18,26,'m'); rect(12,2,19,4,'t'); px(14,14,'W'); },
  cask(){ ell(16,17,10,11,'t'); for(const y of [9,17,25]) rect(6,y,26,y+1,'g'); for(let x=10;x<24;x+=4) seg(x,7,x,27,1,'k'); rect(14,14,18,16,'a'); },
  bundle(){ for(let i=0;i<5;i++) seg(8+i*3,28,12+i*3,4,2,'t'); rect(8,15,24,17,'m'); for(let i=0;i<5;i++) px(12+i*3,4,'A'); },
  charm(){ quad([9,3],[16,12],[23,3],1,'y'); circ(16,19,7,'y'); circ(16,19,4,'m'); px(14,17,'W'); },
  censer(){ seg(16,1,16,9,1,'k'); circ(16,17,8,'y'); rect(8,15,24,16,'k'); for(let x=10;x<23;x+=3) px(x,19,'A'); for(let i=0;i<5;i++) circ(20+i*1.5,9-i*2,1.5+i*.3,'W'); },
  // utilities
  scroll(){ rect(8,7,23,25,'b'); rect(6,5,25,8,'t'); rect(6,24,25,27,'t'); for(let y=11;y<=21;y+=3) rect(10,y,21,y,'k'); px(20,21,'r'); },
  tome(){ rect(6,5,25,27,'m'); rect(8,6,25,26,'b'); rect(6,5,9,27,'k'); circ(17,15,4,'y'); circ(17,15,2,'a'); rect(6,5,25,6,'y'); },
  lens(){ ringp(13,13,9,2,'y'); circ(13,13,7,'x'); px(10,10,'W'); px(11,9,'W'); seg(19,19,28,28,3,'t'); },
  codex(){ THING.tome(); for(let y=9;y<25;y+=5) rect(26,y,27,y+2,'y'); },
  map(){ poly([[4,7],[12,5],[20,8],[28,6],[28,26],[20,28],[12,25],[4,27]],'b'); curve([[8,22],[12,16],[17,19],[22,11]],1,'r'); seg(20,9,24,13,1,'r'); seg(24,9,20,13,1,'r'); },
  key(){ ringp(10,10,6,2,'y'); seg(14,14,26,26,2,'y'); rect(21,22,23,27,'y'); rect(25,24,26,28,'y'); },
  compass(){ circ(16,16,11,'y'); circ(16,16,9,'b'); poly([[16,8],[18,16],[16,24],[14,16]],'r'); poly([[16,16],[18,16],[16,24],[14,16]],'k'); },
  candle(){ rect(12,12,19,28,'b'); ell(15.5,12,4,1.5,'b'); seg(15.5,8,15.5,11,1,'k'); ell(15.5,6,2,3.5,'A'); px(15,6,'W'); rect(9,27,22,29,'y'); },
  cards(){ rect(4,6,17,26,'b'); rect(12,3,26,23,'m'); rect(15,6,23,14,'a'); rect(4,6,17,7,'y'); },
  // traps
  snare(){ ringp(16,20,9,2,'t'); ringp(16,20,6,1,'t'); quad([23,15],[28,6],[22,1],1,'t'); rect(3,27,28,29,'k'); },
  trap(){ rect(4,20,27,24,'g'); for(let x=5;x<27;x+=4) poly([[x,20],[x+3,20],[x+1.5,13]],'w'); for(let x=5;x<27;x+=4) poly([[x,24],[x+3,24],[x+1.5,29]],'w'); circ(16,22,2,'a'); },
  glyph(){ ell(16,22,13,6,'k'); for(let i=0;i<6;i++){ const [x,y]=[16+Math.cos(i*1.05)*10,22+Math.sin(i*1.05)*4]; px(x,y,'A'); px(x+1,y,'A'); } poly([[16,17],[21,25],[11,25]],'M'); },
  mine(){ circ(16,19,8,'g'); for(let i=0;i<8;i++){ const [x,y]=at(16,19,i*Math.PI/4,10); circ(x,y,1.2,'k'); } circ(16,17,2.5,'A'); rect(2,27,29,29,'k'); },
  tripwire(){ rect(5,8,7,28,'t'); rect(25,8,27,28,'t'); seg(7,18,25,19,1,'g'); circ(26,8,2,'A'); rect(2,27,29,29,'k'); },
  pitfall(){ ell(16,22,13,6,'k'); for(let x=7;x<26;x+=4) poly([[x,24],[x+2,24],[x+1,17]],'w'); rect(2,15,29,16,'l'); },
  jaw(){ poly([[4,28],[8,14],[16,10],[24,14],[28,28]],'m'); for(let x=8;x<25;x+=4) poly([[x,17],[x+3,17],[x+1.5,24]],'w'); circ(11,13,1.5,'A'); circ(21,13,1.5,'A'); },
  rune(){ poly([[9,26],[10,8],[16,4],[22,8],[23,26]],'s'); seg(13,10,19,22,1,'A'); seg(19,10,13,22,1,'A'); seg(16,8,16,24,1,'A'); },
  // pieces
  crown(){ poly([[4,24],[4,11],[10,17],[16,6],[22,17],[28,11],[28,24]],'y'); rect(4,24,28,27,'y'); for(const [x,c] of [[9,'r'],[16,'M'],[23,'x']]) circ(x,21,2,c); circ(16,6,2,'A'); },
  sigil(){ ringp(16,16,13,2,'y'); poly([[16,5],[26,23],[6,23]],'m'); poly([[16,26],[6,9],[26,9]],'a'); circ(16,16,3,'W'); },
  eye(){ poly([[2,16],[16,6],[30,16],[16,26]],'w'); circ(16,16,6,'m'); circ(16,16,3,'k'); px(14,14,'W'); rect(2,15,30,15,'k'); },
};
const THING_WORDS={Bomb:'bomb',Orb:'orb',Pot:'pot',Mortar:'mortar',Comet:'comet',Stone:'stone',Globe:'globe',Burst:'burst',Seed:'seed',Meteor:'meteor',Stormcall:'pillar',Judgment:'pillar',
  Aegis:'aegis',Shield:'shield',Ward:'ward',Barrier:'barrier',Veil:'veil',Screen:'screen',Mantle:'mantle',Wall:'wall',Bulwark:'bulwark',Rampart:'rampart',Skin:'skin',Sanctuary:'barrier',
  Sentry:'sentry',Spire:'spire',Totem:'totem',Beacon:'beacon',Obelisk:'obelisk',Pylon:'pylon',Idol:'idol',Lantern:'lantern',Watcher:'watcher',Brazier:'brazier',Pod:'seed',
  Flask:'flask',Quiver:'quiver',Satchel:'satchel',Pouch:'pouch',Vial:'vial',Cask:'cask',Bundle:'bundle',Charm:'charm',Censer:'censer',
  Scroll:'scroll',Tome:'tome',Lens:'lens',Codex:'codex',Map:'map',Key:'key',Compass:'compass',Candle:'candle',
  Snare:'snare',Trap:'trap',Glyph:'glyph',Mine:'mine',Tripwire:'tripwire',Pitfall:'pitfall',Jaw:'jaw',Rune:'rune',Pit:'pitfall',
  Crown:'crown',Heart:'heart',Draught:'flask',Tonic:'vial',Elixir:'flask',Wind:'feather',Eye:'eye',Sigil:'sigil',Tree:'tree',Eclipse:'eclipse',Zero:'crystal',Dawnbreaker:'sun',Pact:'skull',Tailwind:'boot'};
const BOON_THING={heal:'heart',regen:'sprout',power:'flamesword',courage:'banner',pact:'skull',haste:'boot',dodge:'feather',phase:'ghost',gauge:'hourglass',intervene:'halo'};

/* ---------------- creatures, from parts ---------------- */
const CREATURES={
  Imp:{head:'round',ears:'horns',snout:'grin',body:'small',wings:1,tail:1}, Wolf:{head:'long',ears:'point',snout:'long',body:'big',tail:1}, Hound:{head:'long',ears:'floppy',snout:'long',body:'big',tail:1},
  Owl:{head:'round',ears:'tufts',snout:'beak',body:'round',eyes:'big'}, Toad:{head:'wide',ears:'none',snout:'wide',body:'squat',eyes:'top'}, Bat:{head:'round',ears:'point',snout:'fangs',body:'small',wings:1},
  Knight:{head:'helm',ears:'plume',snout:'none',body:'armor'}, Squire:{head:'helm',ears:'none',snout:'none',body:'armor'}, Spirit:{head:'round',ears:'none',snout:'none',body:'wisp',eyes:'glow'},
  Golem:{head:'square',ears:'none',snout:'none',body:'block',eyes:'glow'}, Rat:{head:'long',ears:'round',snout:'long',body:'small',tail:1}, Boar:{head:'wide',ears:'point',snout:'tusk',body:'big'},
  Hawk:{head:'round',ears:'none',snout:'beak',body:'round',wings:1}, Mole:{head:'round',ears:'none',snout:'long',body:'squat',claws:1}, Beetle:{head:'round',ears:'antenna',snout:'mandible',body:'shell'},
  Serpent:{head:'long',ears:'none',snout:'fangs',body:'coil'}, Bear:{head:'wide',ears:'round',snout:'short',body:'big'}, Fox:{head:'long',ears:'point',snout:'long',body:'small',tail:2},
  Ogre:{head:'square',ears:'round',snout:'tusk',body:'big'}, Sprite:{head:'round',ears:'point',snout:'none',body:'small',wings:2},
};
// the adjective in a summon's name changes it: Stone creatures are made of stone, Tiny ones are small...
const CREATURE_MOD={Stone:{mat:'s'},Iron:{mat:'g'},Tiny:{scale:.75},Ancient:{beard:1},Grim:{eyes:'r'},Dire:{eyes:'r',scale:1.1},Swift:{lines:1},Feral:{eyes:'r'},
  Mossy:{moss:1},Noble:{crown:1},Loyal:{collar:1},Pale:{mat:'w'},Scrappy:{scar:1},Lucky:{star:1},Hungry:{drool:1},Gentle:{blush:1},Clever:{glasses:1},Sly:{eyes:'narrow'},Wild:{lines:1},Brave:{scar:1},Old:{beard:1}};
function creature(spec,mod,rng){
  const m=mod.mat||'c', s=mod.scale||1, cx=16, by=27, B=v=>v*s;
  // body
  if(spec.body==='coil'){ for(let i=0;i<3;i++) ringp(cx,by-4-i*3,B(9-i*2),B(3),m); }
  else if(spec.body==='wisp'){ poly([[cx-B(7),by-12],[cx+B(7),by-12],[cx+B(4),by],[cx,by-4],[cx-B(4),by]],'x'); }
  else if(spec.body==='block'||spec.body==='armor'){ rect(cx-B(8),by-B(12),cx+B(8),by,spec.body==='armor'?'g':m); if(spec.body==='armor') rect(cx-B(8),by-B(7),cx+B(8),by-B(6),'y'); }
  else if(spec.body==='shell'){ ell(cx,by-B(7),B(10),B(7),m); seg(cx,by-B(14),cx,by,1,'k'); }
  else { const w={big:10,round:8,small:7,squat:10}[spec.body]||8, h={big:9,round:9,small:7,squat:6}[spec.body]||8; ell(cx,by-B(h),B(w),B(h),m); }
  if(spec.wings) for(const d of [-1,1]) poly([[cx+d*B(5),by-B(12)],[cx+d*B(15),by-B(18)],[cx+d*B(13),by-B(8)],[cx+d*B(7),by-B(6)]],spec.wings===2?'x':m);
  if(spec.tail) quad([cx+B(8),by-B(4)],[cx+B(15),by-B(6)],[cx+B(13),by-B(15)],spec.tail===2?3:1.5,m);
  if(spec.claws) for(const d of [-1,1]) for(let i=0;i<3;i++) px(cx+d*B(9)+i,by,'w');
  // head
  const hy=by-B(spec.body==='coil'?20:spec.body==='squat'?13:17), hr=B(spec.head==='wide'?7:6);
  if(spec.head==='square'||spec.head==='helm') rect(cx-hr,hy-hr,cx+hr,hy+hr,spec.head==='helm'?'g':m);
  else if(spec.head==='long') ell(cx,hy,hr,hr*.9,m); else ell(cx,hy,hr*(spec.head==='wide'?1.2:1),hr,m);
  // ears
  const ear=spec.ears;
  if(ear==='point'||ear==='horns') for(const d of [-1,1]) poly([[cx+d*B(2),hy-hr+1],[cx+d*B(ear==='horns'?7:6),hy-hr-B(6)],[cx+d*B(6),hy-hr+2]],ear==='horns'?'w':m);
  if(ear==='floppy') for(const d of [-1,1]) ell(cx+d*B(6),hy,B(2),B(4),'f');
  if(ear==='round') for(const d of [-1,1]) circ(cx+d*B(5),hy-hr+1,B(2.5),m);
  if(ear==='tufts') for(const d of [-1,1]) poly([[cx+d*B(3),hy-hr+1],[cx+d*B(6),hy-hr-B(4)],[cx+d*B(6),hy-hr+2]],m);
  if(ear==='antenna') for(const d of [-1,1]) quad([cx+d*B(2),hy-hr],[cx+d*B(3),hy-hr-B(5)],[cx+d*B(7),hy-hr-B(6)],1,'k');
  if(ear==='plume') poly([[cx-1,hy-hr],[cx+B(6),hy-hr-B(7)],[cx+2,hy-hr]],'r');
  // face
  if(spec.head==='helm'){ rect(cx-hr+1,hy-1,cx+hr-1,hy,'k'); for(let x=cx-hr+2;x<cx+hr-1;x+=2) px(x,hy+2,'k'); }
  const eyeMat=mod.eyes==='r'?'R':spec.eyes==='glow'?'A':'W', ey=spec.eyes==='top'?hy-hr+1:hy-1;
  if(spec.head!=='helm') for(const d of [-1,1]){ if(spec.eyes==='big'){ circ(cx+d*B(3),ey,B(2.3),'W'); px(cx+d*B(3),ey,'k'); } else if(mod.eyes==='narrow') rect(cx+d*B(3)-1,ey,cx+d*B(3),ey,'k'); else { px(cx+d*B(3),ey,eyeMat); px(cx+d*B(3),ey+1,'k'); } }
  const sn=spec.snout;
  if(sn==='beak') poly([[cx-B(2),hy+1],[cx+B(2),hy+1],[cx,hy+B(4)]],'y');
  if(sn==='long') ell(cx+B(4),hy+B(2),B(4),B(2),m), px(cx+B(7),hy+B(1.5),'k');
  if(sn==='short'||sn==='wide') { ell(cx,hy+B(3),B(sn==='wide'?5:3),B(2),'b'); px(cx,hy+B(2),'k'); }
  if(sn==='tusk') for(const d of [-1,1]) poly([[cx+d*B(2),hy+B(3)],[cx+d*B(4),hy+B(3)],[cx+d*B(4),hy-B(1)]],'w');
  if(sn==='fangs'||sn==='grin'){ rect(cx-B(2),hy+B(3),cx+B(2),hy+B(3),'k'); px(cx-B(1),hy+B(4),'w'); px(cx+B(1),hy+B(4),'w'); }
  if(sn==='mandible') for(const d of [-1,1]) quad([cx+d*B(2),hy+B(3)],[cx+d*B(5),hy+B(5)],[cx+d*B(2),hy+B(7)],1,'k');
  // modifiers
  if(mod.beard) poly([[cx-B(4),hy+B(3)],[cx+B(4),hy+B(3)],[cx,hy+B(10)]],'w');
  if(mod.crown) { rect(cx-4,hy-hr-2,cx+4,hy-hr,'y'); for(const d of [-4,0,4]) px(cx+d,hy-hr-3,'y'); }
  if(mod.collar) { rect(cx-B(6),hy+hr-1,cx+B(6),hy+hr,'r'); px(cx,hy+hr+1,'y'); }
  if(mod.moss) for(let i=0;i<5;i++) px(cx-6+Math.floor(rng()*12),by-B(10)+Math.floor(rng()*6),'l');
  if(mod.scar) seg(cx-B(4),hy-B(3),cx-B(1),hy+B(1),1,'r');
  if(mod.glasses) for(const d of [-1,1]) ringp(cx+d*B(3)+.5,ey+.5,B(2),1,'k');
  if(mod.blush) for(const d of [-1,1]) px(cx+d*B(4),hy+B(2),'R');
  if(mod.drool) seg(cx+B(1),hy+B(4),cx+B(1),hy+B(7),1,'x');
}

/* ---------------- machines, from parts ---------------- */
function machine(noun,ai){
  const base=()=>{ rect(6,23,25,28,'g'); for(let x=8;x<25;x+=5) circ(x,28,2,'k'); };
  switch(noun){
    case 'Ballista': case 'Crossbow': base(); rect(12,15,19,22,'t'); quad([6,9],[16,15],[26,9],2,'t'); seg(8,10,24,10,1,'w'); seg(14,12,29,12,2,'g'); px(29,12,'A'); return;
    case 'Cannon': base(); circ(14,18,6,'k'); seg(14,17,28,11,5,'k'); ringp(28,11,3,1,'y'); return;
    case 'Tower': rect(9,6,22,28,'s'); for(let x=9;x<22;x+=4) rect(x,3,x+2,6,'s'); rect(14,12,17,17,'k'); circ(15.5,14,1.5,'A'); return;
    case 'Drone': ell(16,14,7,4,'g'); for(const d of [-1,1]){ seg(16,14,16+d*11,10,1,'k'); ell(16+d*11,9,5,1.2,'x'); } circ(16,16,2,'A'); return;
    case 'Automaton': rect(11,4,20,12,'g'); rect(8,13,23,24,'y'); rect(9,25,13,29,'g'); rect(18,25,22,29,'g'); rect(13,7,18,8,'A'); circ(15.5,18,2,'A'); for(const d of [-1,1]) rect(16+d*9-1,13,16+d*9+1,22,'g'); return;
    case 'Gatling': case 'Repeater': base(); circ(12,18,5,'g'); for(const dy of [-2,0,2]) seg(14,17+dy,29,13+dy,1,'k'); ringp(27,14,4,1,'y'); return;
    case 'Catapult': base(); seg(8,22,24,8,2,'t'); ell(24,7,4,2,'t'); circ(24,5,2.5,'s'); rect(9,16,13,22,'t'); return;
    case 'Engine': rect(6,12,25,26,'g'); for(let x=8;x<24;x+=4) rect(x,14,x+1,24,'k'); rect(19,4,23,12,'k'); for(let i=0;i<3;i++) circ(22+i*2,3-i,1.5+i*.5,'W'); circ(12,20,3,'y'); return;
    case 'Trebuchet': rect(6,26,25,28,'t'); seg(10,26,16,10,2,'t'); seg(22,26,16,10,2,'t'); seg(5,16,27,6,2,'t'); rect(3,15,8,20,'g'); circ(27,5,2,'s'); return;
    case 'Barricade': case 'Palisade': for(let x=4;x<28;x+=5) poly([[x,28],[x,9],[x+2,5],[x+4,9],[x+4,28]],'t'); seg(3,14,29,14,2,'g'); seg(3,22,29,22,2,'g'); return;
    case 'Bastion': case 'Rampart': case 'Bulwark': THING.rampart(); rect(3,22,28,23,'g'); return;
  }
  base(); circ(15,18,6,'m'); seg(16,16,28,10,3,'k'); px(13,15,'W');
}

/* ---------------- card art at 64 x 64 ----------------
   Fine pixels from here on: AN = 64. A card's picture is built in layers:
   scene (one of three per color) -> background effects -> a glow for rarer cards -> the
   subject's ground shadow -> the subject, shaded as a solid with textures per material ->
   outline -> effects from the words in its name -> keyword badges -> frame. */
const AN=ART_SIZE;
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const dith=(x,y,t)=>BAYER[y&3][x&3]/16<t;
function hash2(x,y,s){ let h=Math.imul((x|0)*374761393+(y|0)*668265263+(s|0)*1442695041,1274126177); h^=h>>>13; h=Math.imul(h,1103515245); return ((h^h>>>16)>>>0)/4294967296; }
function canvasOf(c0){ return Array.from({length:AN},()=>Array(AN).fill(c0||null)); }
// drawing straight onto a color layer, in fine pixels
function painter(out){
  const put=(x,y,c)=>{ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<AN&&y>=0&&y<AN&&c) out[y][x]=c; };
  const get=(x,y)=>out[Math.max(0,Math.min(AN-1,Math.floor(y)))][Math.max(0,Math.min(AN-1,Math.floor(x)))];
  const P={put,get,
    rect:(x0,y0,x1,y1,c)=>{ for(let y=Math.floor(y0);y<=y1;y++) for(let x=Math.floor(x0);x<=x1;x++) put(x,y,c); },
    circ:(cx,cy,r,c,t)=>{ for(let y=Math.floor(cy-r);y<=cy+r;y++) for(let x=Math.floor(cx-r);x<=cx+r;x++) if((x+.5-cx)**2+(y+.5-cy)**2<=r*r&&(t==null||dith(x,y,t))) put(x,y,c); },
    ell:(cx,cy,rx,ry,c,t)=>{ for(let y=Math.floor(cy-ry);y<=cy+ry;y++) for(let x=Math.floor(cx-rx);x<=cx+rx;x++) if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1&&(t==null||dith(x,y,t))) put(x,y,typeof c==='function'?c(x,y):c); },
    poly:(pts,c)=>{ const ys=pts.map(p=>p[1]), xs=pts.map(p=>p[0]);
      for(let y=Math.floor(Math.min(...ys));y<=Math.max(...ys);y++) for(let x=Math.floor(Math.min(...xs));x<=Math.max(...xs);x++){ const X=x+.5, Y=y+.5; let ins=false;
        for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i], [xj,yj]=pts[j]; if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi) ins=!ins; }
        if(ins) put(x,y,typeof c==='function'?c(x,y):c); } },
    line:(x0,y0,x1,y1,c)=>{ const n=Math.ceil(Math.hypot(x1-x0,y1-y0))+1; for(let i=0;i<=n;i++) put(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c); },
    tint:(x,y,c,t)=>{ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<AN&&y>=0&&y<AN) out[y][x]=artMix(out[y][x],c,t); },
  };
  return P;
}
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------------- scenes: three per color ---------------- */
function scene(fam,rng,gy,v){
  const F=FAM[fam], out=canvasOf(), P=painter(out);
  const sky0=F.sky[0], sky1=F.sky[1], dark=artMix(sky0,'#000000',.35), mid=artMix(sky1,F.m,.22), far=artMix(sky1,F.m,.1);
  // a dithered sky, darker at the top
  for(let y=0;y<AN;y++){ const t=y/gy*4; for(let x=0;x<AN;x++){ const k=Math.min(4,Math.floor(t)+(dith(x,y,t%1)?1:0)); out[y][x]=artMix(sky0,sky1,k/4); } }
  const ground=(fn)=>{ for(let y=gy;y<AN;y++) for(let x=0;x<AN;x++) out[y][x]=fn(x,y,(y-gy)/(AN-gy)); };
  const hills=(base,amp,freq,col,ph)=>{ for(let x=0;x<AN;x++){ const h=base-amp*(.5+.5*Math.sin(x*freq+ph))-amp*.4*Math.sin(x*freq*2.3+ph*1.7); for(let y=Math.floor(h);y<gy;y++) P.put(x,y,col); } };
  const stars=(n,c)=>{ for(let i=0;i<n;i++){ const x=rng()*AN, y=rng()*gy*.6; P.put(x,y,c||'#ffffff'); } };
  switch(fam){
    case 'fire':
      if(v===0){ // lava cavern: stalactites, glowing pool
        for(let i=0;i<9;i++){ const x=rng()*AN, w=3+rng()*5, h=6+rng()*14; P.poly([[x-w,0],[x+w,0],[x,h]],dark); }
        hills(gy-4,6,.15,mid,rng()*6);
        ground((x,y,t)=>{ const n=Math.sin(x*.4+y*.9)+Math.sin(x*.13-y*.5); return n>1.1?F.glow:n>.6?artMix(F.m,'#ffcc33',.3):artMix(F.m,'#2a0604',.55+.15*t); });
      } else if(v===1){ // a volcano and its ash plume
        const cx=12+rng()*40, cone=artMix('#4a2c24',sky1,.25); P.poly([[cx-34,gy],[cx-6,gy-28],[cx+6,gy-28],[cx+34,gy]],cone);
        for(let i=0;i<8;i++) P.circ(cx+(rng()-.5)*10+i*1.5,gy-32-i*3,3+i*.7,artMix(sky1,'#3a2a2a',.5),.7);
        for(const d of [-1,1]){ let x=cx+d*3; for(let y=gy-28;y<gy;y++){ x+=d*.35+(rng()-.5)*.8; P.put(x,y,F.glow); P.put(x+1,y,artMix(F.m,'#ffcc33',.4)); } }
        P.ell(cx,gy-28,6,1.5,F.glow);
        ground((x,y,t)=>hash2(x,y,3)<.06?F.glow:(x+y*2)%11===0?artMix(F.m,'#1a0402',.4):artMix('#2a1a1a',F.m,.12+.1*t));
      } else { // burning forest
        for(let i=0;i<7;i++){ const x=rng()*AN, h=14+rng()*16; P.rect(x-1,gy-h,x+1,gy,dark); for(let k=0;k<4;k++) P.poly([[x-7+k,gy-h+5+k*4],[x,gy-h-2+k*4],[x+7-k,gy-h+5+k*4]],dark); }
        for(let x=0;x<AN;x++) for(let y=gy-10;y<gy;y++) if(dith(x,y,(y-gy+10)/14)) P.tint(x,y,F.glow,.35);
        ground((x,y)=>hash2(x,y,5)<.05?F.a:(x*3+y)%7===0?'#3a1408':'#2a1008');
      }
      break;
    case 'frost':
      if(v===0){ // snowy peaks, a far range and a near one
        for(const [b,a,f,col] of [[gy-6,22,.09,far],[gy,14,.14,mid]]){ const ph=rng()*6;
          for(let x=0;x<AN;x++){ const tri=1-Math.abs(((x*f+ph)%2+2)%2-1), h=b-a*tri; for(let y=Math.floor(h);y<b;y++) P.put(x,y,y<h+a*.3*tri?(dith(x,y,.8)?'#eef8ff':'#c8e0f4'):col); } }
        ground((x,y,t)=>dith(x,y,.3+t*.4)?'#b8d4ea':F.ground);
      } else if(v===1){ // ice cave
        for(let i=0;i<12;i++){ const x=rng()*AN, w=1.5+rng()*3, h=5+rng()*14; P.poly([[x-w,0],[x+w,0],[x,h]],i%3?mid:'#cfeaff'); }
        for(let i=0;i<5;i++){ const x=rng()*AN, h=6+rng()*10; P.poly([[x-3,gy],[x,gy-h],[x+3,gy]],artMix(F.m,'#ffffff',.3)); }
        ground((x,y)=>(x-y*2)%9===0?'#ffffff':dith(x,y,.5)?'#9ccbe8':'#c8e4f6');
      } else { // aurora over a frozen lake
        stars(18);
        for(let b=0;b<3;b++){ const y0=8+b*5+rng()*4, col=['#6affc8','#6ad0ff','#b08aff'][b]; for(let x=0;x<AN;x++){ const y=y0+Math.sin(x*.12+b*2)*4; for(let k=0;k<7;k++) if(dith(x,y+k,.5-k*.07)) P.tint(x,y+k,col,.6); } }
        hills(gy-2,4,.2,dark,rng()*6);
        ground((x,y,t)=>{ const r=out[Math.max(0,gy-(y-gy)*2-2)][x]; return dith(x,y,.25)?'#dff4ff':artMix(r,'#9fd0ee',.45); });
      }
      break;
    case 'storm':
      if(v===0){ // cloud bank and a strike
        for(let i=0;i<7;i++) P.ell(rng()*AN,4+rng()*14,10+rng()*8,4+rng()*3,mid);
        { let x=8+rng()*48; for(let y=14;y<gy;y++){ x+=(rng()-.5)*3; P.put(x,y,'#ffffff'); P.put(x+1,y,F.glow); } }
        ground((x,y)=>(x+y)%13===0?artMix(F.ground,F.m,.3):F.ground);
      } else if(v===1){ // rain on a lone spire
        const sx=10+rng()*44; P.poly([[sx-4,gy],[sx-1,gy-30],[sx+1,gy-30],[sx+4,gy]],dark); P.line(sx,gy-30,sx+3,gy-40,F.glow);
        for(let i=0;i<70;i++){ const x=rng()*AN, y=rng()*gy; P.line(x,y,x-2,y+4,artMix(sky1,'#c8d4ff',.35)); }
        ground((x,y)=>dith(x,y,.15)?artMix(F.ground,'#8a86ff',.3):F.ground);
      } else { // a distant twister over windswept grass
        const tx=10+rng()*44; for(let y=6;y<gy;y++){ const w=(gy-y)*.25+1, ox=Math.sin(y*.3)*3; for(let x=-w;x<=w;x++) if(dith(Math.floor(tx+ox+x),y,.6)) P.put(tx+ox+x,y,mid); }
        for(let i=0;i<6;i++) P.ell(rng()*AN,3+rng()*6,12,3,mid);
        ground((x,y)=>(x*5+y*3)%7===0?artMix(F.ground,'#6a8a4a',.5):artMix(F.ground,'#3a4a2a',.4));
      }
      break;
    case 'verdant':
      if(v===0){ // tree line
        for(let i=0;i<9;i++){ const cx=rng()*AN, r=6+rng()*8; P.circ(cx,gy-4-r*.5,r,artMix(sky1,F.m,.3+rng()*.15)); }
        ground((x,y)=>hash2(x,y,7)<.12?F.m:(x*7+y*3)%11===0?artMix(F.m,'#ffffff',.2):F.ground);
      } else if(v===1){ // deep forest with light shafts
        for(let i=0;i<8;i++){ const x=rng()*AN, w=2+rng()*3; P.rect(x-w,0,x+w,gy,artMix(dark,'#2a1a0a',.4)); }
        for(let i=0;i<3;i++){ const x=rng()*AN; for(let y=0;y<gy;y++) for(let k=0;k<5;k++) if(dith(Math.floor(x+y*.5+k),y,.35)) P.tint(x+y*.5+k,y,F.glow,.25); }
        ground((x,y)=>hash2(x,y,9)<.15?artMix(F.m,'#000000',.2):F.ground);
        for(let i=0;i<6;i++){ const x=rng()*AN; for(let k=0;k<4;k++) P.line(x,gy+2,x+(k-1.5)*3,gy-4,F.m); }
      } else { // rolling meadow under a sun
        P.circ(8+rng()*48,10,6,'#fff6c8');
        hills(gy-6,6,.08,artMix(F.m,sky1,.45),rng()*6); hills(gy-2,4,.13,artMix(F.m,'#1a3a12',.3),rng()*6);
        ground((x,y)=>{ const h=hash2(x,y,11); return h<.03?'#ff8ab0':h<.06?'#ffe066':h<.2?F.m:F.ground; });
      }
      break;
    case 'light':
      if(v===0){ // sun rays
        const sx=16+rng()*32; for(let y=0;y<gy;y++) for(let x=0;x<AN;x++){ const a=Math.atan2(y+6,x-sx); if(Math.sin(a*14)>.5) P.tint(x,y,F.glow,.2); }
        P.circ(sx,0,9,'#fff6c8',.8);
        ground((x,y)=>(x+y)%6===0?F.glow:dith(x,y,.3)?artMix(F.ground,'#ffffff',.2):F.ground);
      } else if(v===1){ // cathedral window between pillars
        const wx=20+rng()*24; P.rect(wx-9,8,wx+9,gy,artMix(sky0,'#000000',.2)); P.circ(wx,8,9,artMix(sky0,'#000000',.2));
        const glass=['#ffd966','#8ad0ff','#ff8a8a','#b08aff']; for(let y=1;y<gy-4;y++) for(let x=wx-7;x<=wx+7;x++) if(Math.hypot(x-wx,Math.max(0,8-y))<7.5) P.put(x,y,(x%4===0||y%5===0)?'#2a2030':artMix(glass[(Math.floor(x/4)*3+Math.floor(y/5))%4],sky1,.35));
        for(const px0 of [wx-15,wx+12]) P.rect(px0,0,px0+3,gy,artMix(F.ground,'#ffffff',.25));
        ground((x,y)=>((x>>2)+(y>>2))%2?artMix(F.ground,'#ffffff',.25):F.ground);
      } else { // above the clouds
        for(let i=0;i<9;i++) P.ell(rng()*AN,gy-2+rng()*4,10+rng()*8,4+rng()*3,'#fff6e8');
        ground((x,y)=>dith(x,y,.5)?'#fff6e8':'#e8dcc8');
        for(let i=0;i<5;i++) P.ell(rng()*AN,6+rng()*20,8,2,artMix(sky1,'#ffffff',.3));
      }
      break;
    case 'shadow':
      if(v===0){ // moon and mist
        const mx=10+rng()*44; P.circ(mx,11,7,'#e8d8f0'); P.circ(mx+3,9,6,artMix(sky0,sky1,.3)); stars(14,'#c8a8e0');
        for(let y=gy-8;y<gy;y++) for(let x=0;x<AN;x++) if(dith(x,y,(y-gy+8)/9)) P.put(x,y,artMix(sky1,F.a,.4));
        ground((x,y)=>dith(x,y,.12)?artMix(F.ground,F.a,.4):F.ground);
      } else if(v===1){ // graveyard
        stars(10,'#c8a8e0');
        const tree=4+rng()*56; P.line(tree,gy,tree,gy-24,dark); for(let k=0;k<5;k++){ const y=gy-10-k*3, d=k%2?1:-1; P.line(tree,y,tree+d*(6+k),y-5,dark); }
        for(let i=0;i<5;i++){ const x=rng()*AN, h=5+rng()*5; if(rng()<.5){ P.rect(x-2,gy-h,x+2,gy,mid); P.circ(x,gy-h,2,mid); } else { P.rect(x,gy-h-2,x+1,gy,mid); P.rect(x-2,gy-h+1,x+3,gy-h+2,mid); } }
        ground((x,y)=>hash2(x,y,13)<.1?artMix(F.ground,'#3a2a3a',.5):F.ground);
      } else { // castle on the skyline, with bats
        const cx=8+rng()*48; P.rect(cx-12,gy-14,cx+12,gy,dark); for(const t of [-12,-4,6]) { P.rect(cx+t,gy-24,cx+t+5,gy,dark); P.poly([[cx+t-1,gy-24],[cx+t+2.5,gy-31],[cx+t+6,gy-24]],dark); }
        for(let i=0;i<5;i++) P.put(cx-10+rng()*20,gy-10-rng()*12,'#ffd966');
        for(let i=0;i<4;i++){ const x=rng()*AN, y=4+rng()*16; P.put(x,y,dark); P.put(x-1,y-1,dark); P.put(x+1,y-1,dark); P.put(x-2,y,dark); P.put(x+2,y,dark); }
        ground((x,y)=>(x*3+y*5)%9===0?artMix(F.ground,F.m,.2):F.ground);
      }
      break;
    case 'gray':
      if(v===0){ for(let i=0;i<10;i++){ const x=rng()*AN, w=2+rng()*4; P.poly([[x-w,0],[x+w,0],[x,5+rng()*10]],mid); }
        for(let i=0;i<30;i++){ const x=rng()*AN, y=rng()*gy; P.put(x,y,mid); P.put(x+1,y,mid); }
        ground((x,y)=>hash2(x,y,17)<.08?'#5a5c68':(x*5+y*11)%13===0?'#4a4c58':F.ground);
      } else if(v===1){ hills(gy-10,10,.09,far,rng()*6); hills(gy-3,6,.17,mid,rng()*6);
        for(let i=0;i<6;i++){ const x=rng()*AN; P.ell(x,gy+2,4+rng()*3,3,'#5a5c68'); }
        ground((x,y)=>dith(x,y,.2)?'#4a4c58':F.ground);
      } else { // ruins
        for(let i=0;i<4;i++){ const x=4+i*16+rng()*6, h=10+rng()*22; P.rect(x,gy-h,x+5,gy,mid); P.rect(x-1,gy-h,x+6,gy-h+1,far); for(let y=gy-h+4;y<gy;y+=4) P.rect(x,y,x+5,y,dark); }
        ground((x,y)=>((x>>3)+(y>>2))%2?'#4a4c58':F.ground);
      }
      break;
    case 'brown':
      if(v===0){ for(let y=0;y<gy;y++) for(let x=0;x<AN;x++) if(x%12===0||(y%16===0)) P.put(x,y,dark);
        const gx=8+rng()*48, gy0=8+rng()*12; for(let y=gy0-9;y<gy0+9;y++) for(let x=gx-9;x<gx+9;x++){ const d=Math.hypot(x-gx,y-gy0), a=Math.atan2(y-gy0,x-gx); if(d<7+(Math.sin(a*10)>0?2:0)&&d>3) P.put(x,y,mid); }
        ground((x,y)=>(y-gy)%4===0?dark:F.ground);
      } else if(v===1){ // foundry chimneys
        for(let i=0;i<3;i++){ const x=6+rng()*52, h=18+rng()*16; P.rect(x-3,gy-h,x+3,gy,dark); for(let k=0;k<5;k++) P.circ(x+k*2,gy-h-3-k*4,2+k*.8,artMix(sky1,'#6a5a4a',.5),.6); }
        for(let x=0;x<AN;x++) for(let y=gy-6;y<gy;y++) if(dith(x,y,(y-gy+6)/8)) P.tint(x,y,'#ff9a3a',.35);
        ground((x,y)=>hash2(x,y,19)<.04?'#ffb050':(x+y)%8===0?dark:F.ground);
      } else { // pipes and valves
        for(let i=0;i<3;i++){ const y=6+i*12+rng()*4; P.rect(0,y,AN,y+3,mid); P.rect(0,y,AN,y,far); for(let x=4+rng()*8;x<AN;x+=18){ P.rect(x,y-1,x+2,y+4,dark); } }
        const vx=10+rng()*44; P.circ(vx,10,4,'#c04a2a'); P.circ(vx,10,1.5,dark);
        ground((x,y)=>(x%8===0||(y-gy)%5===0)?dark:F.ground);
      }
      break;
  }
  return out;
}

/* ---------------- effects from the words in a card's name ----------------
   Each card's adjective sets what is happening to its subject: a Magma card glows with
   molten veins, a Rime card is iced over, a Thistle card grows thorns and flowers, a
   Raven card sheds feathers. Material effects change the subject before shading; overlay
   effects are painted on top; background effects go behind it. */
const FX_WORDS={
  Cinder:'embers charred', Ember:'embers flames', Blaze:'flames flames', Scorch:'charred flames', Ash:'charred smoke', Magma:'molten embers', Flare:'flames sparkles',
  Pyre:'flames charred', Inferno:'flames embers rays', Kindling:'embers glowup', Char:'charred molten', Smolder:'smoke embers', Searing:'flames glowup', Molten:'molten glowup',
  Wildfire:'flames leaves', Brand:'molten runes', Sunfire:'flames rays', Flame:'flames', Hearth:'glowup embers', Ignis:'flames runes', Fire:'flames', Kindle:'embers', Meteor:'embers smoke',
  Rime:'ice sparkles', Frost:'snowcap icicles', Glacial:'ice icicles', Hoarfrost:'snowcap sparkles', Ice:'ice', Sleet:'rain icicles', Snow:'snowcap snowfall', Winter:'snowcap icicles snowfall',
  Crystal:'ice sparkles', Polar:'snowcap aurora', Boreal:'aurora snowcap', Chill:'icicles wind', Permafrost:'ice snowcap', Hail:'snowfall icicles', Frozen:'ice icicles', Icicle:'icicles',
  Tundra:'snowcap wind', Arctic:'snowcap aurora', Numbing:'ice wind', Pale:'sparkles snowfall', Zero:'ice aurora', Blizzard:'snowfall wind',
  Thunder:'arcs rain', Volt:'arcs', Static:'arcs sparkles', Spark:'arcs sparks', Gale:'wind', Tempest:'wind rain arcs', Lightning:'arcs arcs', Squall:'rain wind', Surge:'arcs glowup',
  Arc:'arcs', Storm:'rain arcs', Charged:'arcs runes', Zephyr:'wind sparkles', Cyclone:'wind wind', Flash:'sparkles arcs', Crackling:'arcs sparks', Galvanic:'arcs gears', Monsoon:'rain rain',
  Sky:'wind clouds', Ion:'runes arcs', Tailwind:'wind', Chain:'arcs',
  Briar:'thorns vines', Thorn:'thorns', Moss:'moss', Vine:'vines', Root:'moss roots', Bramble:'thorns vines', Fern:'moss leaves', Oak:'moss leaves', Bloom:'flowers vines', Spore:'spores moss',
  Willow:'vines leaves', Thistle:'thorns flowers', Wild:'flowers leaves', Sap:'sap', Grove:'leaves moss', Nettle:'thorns leaves', Ivy:'vines vines', Verdant:'flowers moss', Seed:'spores leaves', Hollow:'spores eyes',
  Radiant:'rays sparkles', Holy:'halo rays', Dawn:'rays glowup', Solar:'rays', Sacred:'halo gold', Gleaming:'sparkles gold', Blessed:'halo sparkles', Valiant:'wings gold', Aurora:'aurora sparkles',
  Halo:'halo', Hallowed:'gold runes', Brave:'wings', Luminous:'sparkles glowup', Seraph:'wings halo', Gilded:'gold sparkles', Shining:'sparkles rays', Dawnlit:'rays glowup', Bright:'sparkles',
  Pure:'halo sparkles', Vigil:'runes glowup', Judgment:'rays halo', Sanctuary:'halo', Dawnbreaker:'rays wings',
  Hex:'runes smoke', Grave:'bones smoke', Dusk:'smoke', Blood:'blood', Bone:'bones', Night:'eyes stars', Umbral:'smoke eyes', Wraith:'smoke smoke', Soul:'wisps', Crypt:'bones runes',
  Gloom:'smoke eyes', Shade:'smoke', Raven:'feathers', Dread:'eyes blood', Cursed:'runes charred', Black:'eclipse charred', Vile:'blood spores', Ghoul:'bones blood', Eclipse:'eclipse', Tomb:'bones runes', Pact:'blood runes',
  Clockwork:'gears', Brass:'brass rivets', Steam:'steam', Iron:'rivets', Copper:'copper', Rusted:'rust', Gear:'gears', Cog:'gears', Tin:'rivets sparkles', Bolted:'rivets', Riveted:'rivets rust',
  Piston:'steam gears', Spring:'spring', Gyro:'gears wind', Dwarven:'brass runes', Forge:'glowup embers', Oiled:'oil', Ratchet:'gears rivets', Valve:'steam', Anvil:'embers glowup',
};
// the gray family's words describe creatures, so they read differently there
const FX_GRAY={Loyal:'sparkles', Feral:'eyes', Stone:'moss', Tiny:'sparkles', Ancient:'moss runes', Wild:'leaves', Grim:'smoke', Swift:'wind', Brave:'sparkles', Old:'moss', Lucky:'sparkles flowers',
  Dire:'eyes smoke', Pale:'snowfall', Clever:'runes', Hungry:'blood', Gentle:'flowers', Sly:'smoke', Mossy:'moss leaves', Scrappy:'charred', Noble:'gold sparkles'};
const FX_DEFAULT={fire:'embers', frost:'snowfall', storm:'arcs', verdant:'leaves', light:'sparkles', shadow:'smoke', gray:'', brown:'rivets'};
function effectsOf(c){
  let list=[];
  for(const w of words(c)){ const f=(c.color==='gray'&&FX_GRAY[w])||FX_WORDS[w]; if(f) list=list.concat(f.split(' ')); }
  if(!list.length) list=FX_DEFAULT[c.color].split(' ').filter(Boolean);
  return list;
}
const FX_BG=new Set(['rays','rain','aurora','eclipse','stars','snowfall','clouds','leaves','eyes']);
const FX_MAT=new Set(['molten','charred','ice','icicles','snowcap','moss','thorns','gold','wings','bones','gears','rivets','rust','spring','copper','brass','vines','roots']);

// the subject's shape: its box, and the pixels on its top and bottom edges
function subjInfo(){ let x0=AN,y0=AN,x1=-1,y1=-1; const top=[],bot=[],all=[];
  for(let y=0;y<AN;y++) for(let x=0;x<AN;x++) if(G[y][x]){ all.push([x,y]); x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y);
    if(y===0||!G[y-1][x]) top.push([x,y]); if(y===AN-1||!G[y+1][x]) bot.push([x,y]); }
  if(x1<0){ x0=y0=24; x1=y1=40; }
  return {x0,y0,x1,y1,top,bot,all,cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0+1,h:y1-y0+1};
}
const pickN=(arr,n,rng)=>{ const a=arr.slice(), out=[]; while(out.length<n&&a.length) out.push(a.splice(Math.floor(rng()*a.length),1)[0]); return out; };
const inSubj=(x,y)=>x>=0&&y>=0&&x<AN&&y<AN&&G[y][x];

// background effects, painted on the scene before the subject
const BG_FX={
  rays(P,I,F,rng){ for(let y=0;y<AN;y++) for(let x=0;x<AN;x++){ const a=Math.atan2(y-I.cy,x-I.cx); if(Math.sin(a*10+rng.ph)>.6) P.tint(x,y,F.glow,.22); } },
  rain(P,I,F,rng,n){ for(let i=0;i<40*n;i++){ const x=rng()*AN, y=rng()*AN; P.line(x,y,x-2,y+5,artMix(P.get(x,y),'#c8d8ff',.45)); } },
  aurora(P,I,F,rng){ for(let b=0;b<2;b++){ const y0=4+b*6+rng()*4, col=b?'#b08aff':'#6affc8'; for(let x=0;x<AN;x++){ const y=y0+Math.sin(x*.1+b*2+rng.ph)*4; for(let k=0;k<6;k++) if(dith(x,Math.floor(y+k),.55-k*.08)) P.tint(x,y+k,col,.55); } } },
  eclipse(P,I,F,rng){ const x=rng()<.5?12:52; P.circ(x,11,8,'#fff0c8'); P.circ(x,11,6.5,'#0a0410'); },
  stars(P,I,F,rng,n){ for(let i=0;i<20*n;i++) P.put(rng()*AN,rng()*AN*.6,rng()<.3?F.glow:'#ffffff'); },
  snowfall(P,I,F,rng,n){ for(let i=0;i<26*n;i++){ const x=rng()*AN, y=rng()*AN; P.put(x,y,'#ffffff'); if(rng()<.3){ P.put(x+1,y,'#dff4ff'); P.put(x,y+1,'#dff4ff'); } } },
  clouds(P,I,F,rng){ for(let i=0;i<4;i++) P.ell(rng()*AN,4+rng()*18,9,3,artMix(P.get(32,10),'#ffffff',.35),.75); },
  leaves(P,I,F,rng,n){ const cols=['#6fbf4f','#a8c84a','#d8a040','#c0602a']; for(let i=0;i<8*n;i++){ const x=rng()*AN, y=rng()*AN, c=cols[Math.floor(rng()*4)], d=rng()<.5?1:-1; P.put(x,y,c); P.put(x+d,y,c); P.put(x+d,y+1,c); P.put(x+2*d,y+1,artMix(c,'#000000',.3)); } },
  eyes(P,I,F,rng,n){ for(let i=0;i<2+n;i++){ const x=2+rng()*58, y=2+rng()*(I.y1-4); if(Math.abs(x-I.cx)<I.w/2+3&&y>I.y0-3) continue; const c=rng()<.5?'#ff3a4a':F.glow; P.put(x,y,c); P.put(x+3,y,c); P.put(x,y+1,artMix(c,'#000000',.5)); P.put(x+3,y+1,artMix(c,'#000000',.5)); } },
};
// material effects, on the subject layer before it is shaded
const MAT_FX={
  molten(I,F,rng,n){ for(let v=0;v<2+n;v++){ let [x,y]=I.all[Math.floor(rng()*I.all.length)]; for(let k=0;k<14;k++){ if(inSubj(x,y)) G[y][x]='A'; x+=Math.round(rng()*2-1); y+=Math.round(rng()*2-1); } } },
  charred(I,F,rng,n){ for(let i=0;i<3+2*n;i++){ const [x,y]=I.all[Math.floor(rng()*I.all.length)], r=1+rng()*2; for(let j=-3;j<=3;j++) for(let k=-3;k<=3;k++) if(j*j+k*k<=r*r&&inSubj(x+j,y+k)&&!/[A-Z]/.test(G[y+k][x+j])) G[y+k][x+j]='k'; } },
  ice(I,F,rng){ for(const [x,y] of I.all) if(y>I.y1-I.h*.42+Math.sin(x*.9)*2) G[y][x]=hash2(x,y,21)<.06?'W':'x'; },
  icicles(I,F,rng,n){ for(const [x,y] of pickN(I.bot.filter(p=>p[1]>I.cy-2),3+2*n,rng)){ const L=3+Math.floor(rng()*6); for(let k=1;k<=L;k++){ if(!G[y+k]) break; if(!G[y+k][x]) G[y+k][x]=k===L?'W':'x'; if(k<L/2&&G[y+k][x+1]===null) G[y+k][x+1]='x'; } } },
  snowcap(I){ for(const [x,y] of I.top){ const t=1+(hash2(x,y,23)<.6?1:0)+(hash2(x,y,24)<.25?1:0); for(let k=0;k<t;k++) if(inSubj(x,y+k)) G[y+k][x]='w'; if(y>0&&hash2(x,y,25)<.3) G[y-1][x]='w'; } },
  moss(I,F,rng){ for(const [x,y] of I.top) if(hash2(x,y,27)<.65){ const t=1+(hash2(x,y,28)<.5?1:0); for(let k=0;k<t;k++) if(inSubj(x,y+k)) G[y+k][x]='l'; if(hash2(x,y,29)<.12) for(let k=t;k<t+3;k++) if(inSubj(x,y+k)) G[y+k][x]='l'; } },
  roots(I,F,rng,n){ for(const [x,y] of pickN(I.bot,2+n,rng)){ let X=x, Y=y; for(let k=0;k<8;k++){ Y++; X+=Math.round(rng()*2-1); if(Y<AN&&X>=0&&X<AN&&!G[Y][X]) G[Y][X]='t'; } } },
  thorns(I,F,rng,n){ for(const [x,y] of pickN(I.top.concat(I.bot),5+3*n,rng)){ const up=!inSubj(x,y-1), d=up?-1:1, s=rng()<.5?-1:1;
      for(let k=1;k<=3;k++){ const X=x+(k>1?s:0), Y=y+d*k; if(Y>=0&&Y<AN&&X>=0&&X<AN&&!G[Y][X]) G[Y][X]=k===3?'W':'b'; } } },
  vines(I,F,rng,n){ for(let v=0;v<Math.max(1,Math.round(n));v++){ const ph=rng()*6, amp=I.h*.28, y0=I.cy+(v-.5)*I.h*.25;
      for(let x=I.x0-2;x<=I.x1+2;x++){ const y=Math.round(y0+Math.sin(x*.3+ph)*amp); for(const yy of [y,y+1]) if(yy>=0&&yy<AN&&x>=0&&x<AN&&(G[yy][x]||Math.abs(x-I.cx)<I.w/2)) G[yy][x]='l';
        if((x+v*3)%7===0){ const s=Math.sin(x)>0?-1:1; for(const [dx,dy] of [[0,s*2],[1,s*2],[1,s*3],[0,s*1]]) if(y+dy>=0&&y+dy<AN&&x+dx<AN) G[y+dy][x+dx]='l'; } } } },
  gold(I){ for(const [x,y] of I.all){ const m=G[y][x]; if(m==='g'||m==='t'||m==='s') G[y][x]='y'; } for(const [x,y] of I.top) if(hash2(x,y,31)<.15) G[y][x]='Y'; },
  brass(I){ for(const [x,y] of I.all){ const m=G[y][x]; if(m==='g'||m==='s'||m==='m') G[y][x]='y'; } },
  copper(I){ for(const [x,y] of I.all){ const m=G[y][x]; if(m==='g'||m==='s'||m==='m') G[y][x]='o'; } },
  bones(I){ for(const [x,y] of I.all){ const m=G[y][x]; if(m==='m'||m==='c'||m==='s') G[y][x]=hash2(x,y,33)<.04?'k':'b'; } },
  wings(I){ const y0=Math.max(4,I.y0+I.h*.2); for(const d of [-1,1]){ const bx=I.cx+d*3;
      for(let f=0;f<4;f++){ const len=10+f*2.5-(f===3?3:0); for(let k=0;k<len;k++){ const x=Math.round(bx+d*(k+2)), y=Math.round(y0+f*2.5+k*.15-Math.sin(k/len*Math.PI)*3); for(const yy of [y,y+1]) if(x>=0&&x<AN&&yy>=0&&yy<AN&&!G[yy][x]) G[yy][x]=k===len-1?'W':'w'; } } } },
  gears(I,F,rng,n){ for(let i=0;i<Math.max(1,Math.round(n));i++){ const gx=i?I.x0+3:I.x1-3, gy=i?I.y1-4:I.y0+4, R=4+rng()*2, Rc=Math.ceil(R);
      for(let y=gy-Rc-2;y<=gy+Rc+2;y++) for(let x=gx-Rc-2;x<=gx+Rc+2;x++){ if(y<0||x<0||y>=AN||x>=AN) continue; const d=Math.hypot(x-gx,y-gy), a=Math.atan2(y-gy,x-gx); if(d<R+(Math.sin(a*8)>0?1.6:0)) G[y][x]=d<1.6?'k':d<R*.55?'y':'g'; } } },
  rivets(I){ for(const [x,y] of I.top) if((x%5)===0&&inSubj(x,y+2)&&inSubj(x,y+3)){ G[y+2][x]='K'; if(inSubj(x-1,y+1)) G[y+1][x-1]='W'; } },
  rust(I,F,rng,n){ for(let i=0;i<4+2*n;i++){ const [x,y]=I.all[Math.floor(rng()*I.all.length)]; for(let j=-2;j<=2;j++) for(let k=-1;k<=1;k++) if(inSubj(x+j,y+k)&&hash2(x+j,y+k,35)<.7&&!/[A-Z]/.test(G[y+k][x+j])) G[y+k][x+j]='o'; } },
  spring(I){ const x=Math.min(AN-6,I.x1+2); for(let y=I.y0+6;y<I.y1;y++){ const o=Math.round(Math.sin(y*.9)*2); if(!G[y][x+o+2]) G[y][x+o+2]='g'; } },
};
// overlay effects, painted on top of the shaded subject
const OV_FX={
  flames(P,I,F,rng,n){ const pts=pickN(I.top.filter(p=>p[1]<I.cy+2),4+Math.round(3*n),rng);
    for(const [x,y] of pts){ const H=5+Math.floor(rng()*7), ph=rng()*6;
      for(let k=0;k<H;k++){ const t=k/H, w=Math.round((1-t)*2.6), ox=Math.round(Math.sin(k*.7+ph)*1.3), Y=y-k;
        for(let i=-w;i<=w;i++) P.put(x+ox+i,Y,t>.75?'#d03a1a':Math.abs(i)===w&&w>0?'#ff6a1a':t<.3&&Math.abs(i)<w?'#fff3b0':'#ffc233'); } } },
  embers(P,I,F,rng,n){ for(let i=0;i<10*n;i++){ const x=I.x0-4+rng()*(I.w+8), y=I.y0-12+rng()*(I.h*.7+12), c=rng()<.5?'#ffb030':'#ff6a1a'; P.put(x,y,c); if(rng()<.4) P.put(x,y+1,artMix(c,'#000000',.4)); } },
  sparks(P,I,F,rng,n){ for(let i=0;i<10*n;i++){ const x=rng()*AN, y=rng()*AN; if(inSubj(x|0,y|0)) continue; P.put(x,y,'#fff39a'); if(rng()<.3) P.put(x+1,y-1,'#ffffff'); } },
  smoke(P,I,F,rng,n){ const col=artMix(F.sky[1],'#8a7a9a',.45); for(const [x,y] of pickN(I.top,2+Math.round(n),rng)){ let X=x, Y=y-2; for(let k=0;k<6;k++){ const r=1.5+k*.7;
      for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++) if(i*i+j*j<=r*r&&dith(Math.floor(X+i),Math.floor(Y+j),.55-k*.06)&&!inSubj(Math.floor(X+i),Math.floor(Y+j))) P.put(X+i,Y+j,col); X+=rng()*3-1; Y-=3; } } },
  arcs(P,I,F,rng,n){ const pts=pickN(I.top.concat(I.bot),3+Math.round(2*n),rng);
    for(const [x,y] of pts){ const a0=Math.atan2(y-I.cy,x-I.cx); let X=x, Y=y; for(let k=0;k<9+rng()*6;k++){ const a=a0+(rng()-.5)*1.6; X+=Math.cos(a)*1.6; Y+=Math.sin(a)*1.6; if(inSubj(Math.floor(X),Math.floor(Y))) continue; P.put(X,Y,'#ffffff'); P.put(X+1,Y,F.glow); } } },
  wind(P,I,F,rng,n){ for(let i=0;i<2+Math.round(n);i++){ const y0=I.y0+rng()*I.h, len=20+rng()*20, x0=rng()*(AN-len), ph=rng()*6;
      for(let k=0;k<len;k++){ const x=x0+k, y=y0+Math.sin(k*.15+ph)*3; if(!inSubj(Math.floor(x),Math.floor(y))&&dith(Math.floor(x),Math.floor(y),.85)) P.put(x,y,'#e8f0ff'); }
      const ex=x0+len, ey=y0+Math.sin(len*.15+ph)*3; for(let a=0;a<5;a+=.5) P.put(ex+Math.cos(a)*2.5,ey-2.5+Math.sin(a)*2.5,'#e8f0ff'); } },
  halo(P,I,F){ const y=Math.max(3,I.y0-4); for(let a=0;a<TAU2;a+=.08){ const x=I.cx+Math.cos(a)*7, yy=y+Math.sin(a)*2.2; if(!inSubj(Math.floor(x),Math.floor(yy))||Math.sin(a)<0) P.put(x,yy,Math.sin(a)<-.5?'#ffffff':'#ffe066'); } },
  sparkles(P,I,F,rng,n){ for(let i=0;i<3+3*n;i++){ const x=2+rng()*60, y=2+rng()*58; if(inSubj(x|0,y|0)&&rng()<.5) continue; const big=rng()<.4;
      P.put(x,y,'#ffffff'); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) P.put(x+dx,y+dy,F.glow); if(big) for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]) P.put(x+dx,y+dy,artMix(F.glow,'#000000',.2)); } },
  glowup(P,I,F){ const y=Math.min(AN-3,I.y1+1); for(let j=-4;j<=3;j++) for(let i=-I.w/2-6;i<=I.w/2+6;i++){ const X=Math.floor(I.cx+i), Y=y+j; if(!inSubj(X,Y)&&((i/(I.w/2+6))**2+(j/4)**2)<1&&dith(X,Y,.6)) P.tint(X,Y,F.glow,.45); } },
  flowers(P,I,F,rng,n){ const cols=['#ff6a9a','#ffffff','#c08aff','#ff9a3a']; for(const [x,y] of pickN(I.top.concat(I.bot),3+2*n,rng)){ const c=cols[Math.floor(rng()*4)], Y=inSubj(x,y-1)?y+1:y-1;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) P.put(x+dx,Y+dy,c); P.put(x,Y,'#ffd23a'); } },
  spores(P,I,F,rng,n){ for(let i=0;i<6*n;i++){ const x=I.x0-6+rng()*(I.w+12), y=I.y0-14+rng()*(I.h*.6+14); P.circ(x,y,1.2,'#e8f0c0',.6); P.put(x,y,'#f8ffe0'); } },
  steam(P,I,F,rng,n){ for(let i=0;i<2+n;i++){ let X=I.cx+(rng()-.3)*I.w*.6, Y=I.y0-2; for(let k=0;k<4;k++){ P.circ(X,Y,2+k*.8,'#f0f0f0',.5-k*.08); X+=rng()*3-1; Y-=4; } } },
  blood(P,I,F,rng,n){ for(const [x,y] of pickN(I.bot.filter(p=>p[1]>I.cy),2+2*n,rng)){ const L=2+Math.floor(rng()*5); for(let k=1;k<=L;k++) P.put(x,y+k,k===L?'#ff3a4a':'#a0102a'); } },
  sap(P,I,F,rng,n){ for(const [x,y] of pickN(I.bot,2+2*n,rng)){ const L=2+Math.floor(rng()*4); for(let k=1;k<=L;k++) P.put(x,y+k,k===L?'#ffd27a':'#c88a2a'); } },
  oil(P,I,F,rng,n){ for(const [x,y] of pickN(I.bot,2+2*n,rng)){ const L=2+Math.floor(rng()*4); for(let k=1;k<=L;k++) P.put(x,y+k,k===L?'#6a6a8a':'#1a1a24'); } },
  feathers(P,I,F,rng,n){ for(let i=0;i<2+Math.round(2*n);i++){ const x=4+rng()*56, y=4+rng()*50, a=rng()*3; for(let k=0;k<6;k++){ const X=x+Math.cos(a)*k, Y=y+Math.sin(a)*k; P.put(X,Y,'#1a1424'); if(k>1&&k<5){ P.put(X+Math.sin(a),Y-Math.cos(a),'#2e2440'); } } } },
  wisps(P,I,F,rng,n){ for(let i=0;i<2+Math.round(2*n);i++){ const x=4+rng()*56, y=6+rng()*40; if(inSubj(x|0,y|0)) continue; P.circ(x,y,2,'#8ad8e8'); P.put(x,y,'#ffffff'); P.put(x,y-3,'#8ad8e8'); P.put(x+1,y-4,'#8ad8e8'); } },
  runes(P,I,F,rng,n){ const glyphs=[['#.#','.#.','#.#'],['###','#..','###'],['.#.','###','.#.'],['#..','###','..#'],['##.','.#.','.##']];
    for(let i=0;i<2+Math.round(n);i++){ const [x,y]=I.all[Math.floor(rng()*I.all.length)], g=glyphs[Math.floor(rng()*glyphs.length)];
      g.forEach((r,j)=>[...r].forEach((ch,k)=>{ if(ch==='#') P.put(x+k-1,y+j-1,F.glow); })); } },
};
const TAU2=Math.PI*2;

/* ---------------- keyword badges and frames ---------------- */
const BADGES={
  burn:[['..#..','.##..','.###.','#####','.###.'],'#ff7a2a'], freeze:[['..#..','#.#.#','.###.','#.#.#','..#..'],'#dff4ff'], slow:[['..#..','#.#.#','.###.','#.#.#','..#..'],'#9fd0ff'],
  stun:[['..#..','.###.','#####','.###.','.#.#.'],'#fff39a'], poison:[['.#...','###.#','.#.##','...#.','.....'],'#8aff6a'], curse:[['#...#','.#.#.','..#..','.#.#.','#...#'],'#b88aff'],
  drain:[['..#..','.###.','#####','#####','.###.'],'#e0304a'], mend:[['..#..','..#..','#####','..#..','..#..'],'#8aff9a'], valor:[['#...#','##.##','.###.','..#..','.#.#.'],'#ffd966'],
  confuse:[['.###.','#...#','...#.','..#..','..#..'],'#ffffff'], push:[['#....','.#...','..#..','.#...','#....'],'#e8e0ff'], pull:[['....#','...#.','..#..','...#.','....#'],'#e8e0ff'],
};
function badges(P,c,rng){
  const spots=[[2,2],[51,2],[2,51],[51,51]].sort(()=>rng()-.5), keys=Object.keys(BADGES).filter(k=>c[k]||(k==='drain'&&c.self));
  for(const k of keys.slice(0,4)){ const [x,y]=spots.pop(), [rows,col]=BADGES[k];
    P.circ(x+5.5,y+5.5,6,'#0a0612'); P.circ(x+5.5,y+5.5,5,artMix(col,'#0a0612',.7));
    rows.forEach((r,j)=>[...r].forEach((ch,i)=>{ if(ch==='#'){ P.rect(x+1+i*2,y+1+j*2,x+2+i*2,y+2+j*2,col); } })); }
}
function frame(out,c,F){
  const P=painter(out), r=c.rarity, edge=(w,light,dark)=>{ for(let i=0;i<w;i++) for(let k=i;k<AN-i;k++){ P.put(k,i,light); P.put(i,k,light); P.put(k,AN-1-i,dark); P.put(AN-1-i,k,dark); } };
  if(r==='common'){ edge(1,artMix(F.o,'#ffffff',.15),F.o); return; }
  if(r==='uncommon'){ edge(1,artMix(F.m,'#ffffff',.25),artMix(F.m,'#000000',.45)); return; }
  if(r==='rare'){ edge(2,'#e8e4f4','#6a6478'); for(const [x,y] of [[2,2],[61,2],[2,61],[61,61]]) P.put(x,y,'#ffffff'); return; }
  const gold=['#fff3a8','#e8b830','#8a6418'];
  edge(3,gold[0],gold[2]); for(let k=1;k<AN-1;k++){ P.put(k,1,gold[1]); P.put(1,k,gold[1]); P.put(k,AN-2,gold[1]); P.put(AN-2,k,gold[1]); }
  for(const [x,y] of [[3,3],[60,3],[3,60],[60,60]]){ P.circ(x+.5,y+.5,3,gold[2]); P.circ(x+.5,y+.5,2,F.m); P.put(x,y,'#ffffff'); }
  if(r==='hero'){ // a crown at the top, and the frame banded in the color
    for(let k=6;k<AN-6;k+=6){ P.put(k,1,F.m); P.put(1,k,F.m); P.put(k,AN-2,F.m); P.put(AN-2,k,F.m); }
    const cx=32; P.rect(cx-6,4,cx+6,7,gold[1]); for(const d of [-6,0,6]){ P.poly([[cx+d-2,5],[cx+d,0],[cx+d+2,5]],gold[1]); P.put(cx+d,1,'#ffffff'); } P.rect(cx-6,4,cx+6,4,gold[0]);
    P.put(cx,6,'#ff3a4a'); P.put(cx-4,6,F.m); P.put(cx+4,6,F.m);
  }
}

/* ---------------- shading: each material as a lit solid ----------------
   Light comes from the top left. A pixel's tone depends on how far it is from its own
   material's edges: lit rims on top and left, shade and a colored rim light on the bottom
   right, and a dithered gradient between. Wood shows grain, stone speckles, metal a
   streak of shine, fur strokes, glass glints. */
const ramp5=c=>[artMix(c,'#0a0612',.62),artMix(c,'#0a0612',.32),c,artMix(c,'#ffffff',.32),artMix(c,'#ffffff',.62)];
function texture(m,x,y,tone){
  const h=hash2(x,y,41);
  switch(m){
    case 't': case 'f': if(((y*3+Math.round(Math.sin(x*.45)*2))%7)===0&&tone>0) return tone-1; return tone;
    case 's': return h<.1?tone-1:h>.93?tone+1:tone;
    case 'g': case 'y': case 'o': return ((x+y)%13===0||(x+y)%13===1)&&tone>=2?tone+1:tone;
    case 'c': return hash2(x,y>>1,43)<.16?tone-1:tone;
    case 'x': return h>.96?4:tone;
    case 'l': return hash2(x>>1,y>>1,45)<.2?tone-1:tone;
    default: return h<.04?tone-1:tone;
  }
}
function shadeSubject(out,R,flat,rim){
  const at=(x,y)=>y>=0&&y<AN&&x>=0&&x<AN?G[y][x]:null;
  const run=(x,y,dx,dy,m)=>{ let k=1; while(k<=6&&at(x+dx*k,y+dy*k)===m) k++; return k; };
  for(let y=0;y<AN;y++) for(let x=0;x<AN;x++){ const m=G[y][x]; if(!m) continue;
    if(flat[m]){ out[y][x]=flat[m]; continue; }
    const top=Math.min(run(x,y,0,-1,m),run(x,y,-1,0,m),run(x,y,-1,-1,m)), bot=Math.min(run(x,y,0,1,m),run(x,y,1,0,m),run(x,y,1,1,m));
    const ext=(dx,dy)=>!at(x+dx,y+dy);
    let tone;
    if(top===1) tone=ext(0,-1)||ext(-1,0)?4:3;
    else if(bot===1) tone=0;
    else if(bot===2) tone=1;
    else if(top===2) tone=3;
    else tone=bot<=4&&dith(x,y,.5)?1:top<=4&&dith(x,y,.35)?3:2;
    tone=Math.max(0,Math.min(4,texture(m,x,y,tone)));
    let col=(R[m]||R.m)[tone];
    if(rim&&bot===1&&(ext(1,0)||ext(0,1))) col=artMix((R[m]||R.m)[2],rim,.5);
    out[y][x]=col; }
}

/* ---------------- composition ---------------- */
function artRng(id){ let h=2166136261; for(const ch of 'art64:'+id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } let a=h>>>0;
  const r=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; r.ph=r()*6; return r; }
const words=c=>c.name.replace(/[,]/g,'').replace(/ of the /,' ').split(/\s+/);
function findWord(c,table){ const ws=words(c); for(let i=ws.length-1;i>=0;i--) if(table[ws[i]]) return table[ws[i]]; return null; }
// what the picture shows: [kind, key] for the subject
function subjectOf(c){
  const kind=c.type==='piece'?c.base:c.type;
  if(kind==='hero') return ['hero',c.hero];
  if(c.type==='piece') return ['thing',findWord(c,THING_WORDS)||'sigil'];
  if(kind==='summon') return ['creature',Object.keys(CREATURES).find(n=>words(c).includes(n))||'Imp'];
  if(kind==='machine'){ const n=words(c).at(-1); return ['machine',n]; }
  if(kind==='strike'||(kind==='charge'&&c.fx==='bolt')&&!findWord(c,THING_WORDS)) return ['weapon',findWord(c,WEAPON_WORDS)||{row:'beam',all:'bolt',missiles:'shot',wedge:'arrow',dig:'spear',zigzag:'bolt',diag:'blade'}[c.shape]||'arrow'];
  const t=findWord(c,THING_WORDS); if(t) return ['thing',t];
  if(kind==='boon') return ['thing',BOON_THING[c.boon]||'heart'];
  const fall={lob:'bomb',ward:c.ward==='barrier'?'shield':'wall',sentry:'sentry',charge:'flask',utility:c.util==='copy'?'cards':'scroll',trap:'trap',
              environment:{burn:'burst',freeze:'crystal',bramble:'tree',tremor:'stone'}[c.env]}[kind];
  return ['thing',fall||'orb'];
}
function drawSubject(c,rng){
  const [kind,key]=subjectOf(c), sh=c.shape;
  if(kind==='hero'){ human(HERO_LOOK[key]||{}); return; }
  if(kind==='creature'){ const adj=words(c)[0]; creature(CREATURES[key],CREATURE_MOD[adj]||{},rng); return; }
  if(kind==='machine'){ machine(key,c.ai); return; }
  if(kind==='weapon'){ const W=WEAPON[key]||WEAPON.arrow;
    if(c.type==='charge'){ W(6,26,24,8); W(12,28,28,14); return; }
    switch(sh){
      case 'wedge': W(4,28,14,4); W(4,28,28,6); W(4,28,28,20); return;
      case 'missiles': W(3,14,11,8); W(14,26,22,19); W(17,9,27,3); return;
      case 'dig': W(4,4,26,26); for(let i=0;i<6;i++) px(20+rng()*10,20+rng()*10,'t'); return;
      case 'zigzag': curve([[2,24],[8,14],[13,22],[19,12]],1,'A'); W(14,20,28,5); return;
      case 'diag': W(4,26,27,5); W(5,5,27,26); return;
      case 'row': W(2,17,29,15); return;
      case 'all': for(let i=0;i<8;i++) seg(...at(16,16,i*Math.PI/4,11),...at(16,16,i*Math.PI/4,14),1,'A'); W(5,26,26,6); return;
      default: W(5,27,27,5); return;
    }
  }
  THING[key](rng);
  if(c.type==='ward'&&c.ward==='thorns') for(let x=4;x<28;x+=4) poly([[x-1.5,10],[x+1.5,10],[x,4]],'w');
}
// turn, scale and nudge the drawn subject a little, so two cards with the same subject sit differently
function restage(rng,upright){
  const s=.9+rng()*.16, a=upright?0:(rng()-.5)*.3, dx=(rng()-.5)*5, dy=(rng()-.5)*3, cx=32, cy=36, src=G, cs=Math.cos(a), sn=Math.sin(a);
  const dst=Array.from({length:AN},()=>Array(AN).fill(null));
  for(let y=0;y<AN;y++) for(let x=0;x<AN;x++){ const u=(x+.5-cx-dx)/s, v=(y+.5-cy-dy)/s, sx=Math.floor(cx+u*cs+v*sn), sy=Math.floor(cy-u*sn+v*cs);
    if(sx>=0&&sx<AN&&sy>=0&&sy<AN) dst[y][x]=src[sy][sx]; }
  G=dst;
}

const ART_CACHE={};
function cardArt(c){
  if(ART_CACHE[c.id]) return ART_CACHE[c.id];
  const rng=artRng(c.id), fam=c.color, F=FAM[fam], gy=46+Math.floor(rng()*7), variant=Math.floor(rng()*3);
  const amt={common:.6,uncommon:.8,rare:1,legendary:1.3,hero:1.6}[c.rarity]||1;
  const fx=effectsOf(c);
  // the subject first, so the scene can be lit around it
  grid(AN,2); drawSubject(c,rng);
  const kind=subjectOf(c)[0], upright=kind==='creature'||kind==='hero'||kind==='machine';
  if(!upright&&rng()<.5) G.forEach(row=>row.reverse());
  restage(rng,upright);
  let I=subjInfo();
  const out=scene(fam,rng,gy,variant), P=painter(out);
  for(const f of fx) if(FX_BG.has(f)) BG_FX[f](P,I,F,rng,amt);
  // rarer cards glow behind the subject
  if(c.rarity!=='common'){ const r={uncommon:18,rare:24,legendary:30,hero:34}[c.rarity];
    for(let y=0;y<AN;y++) for(let x=0;x<AN;x++){ const d=Math.hypot(x-I.cx,y-I.cy); if(d<r&&dith(x,y,(1-d/r)*1.1)) out[y][x]=artMix(out[y][x],F.glow,c.rarity==='hero'?.45:.32); } }
  // the subject's shadow on the ground
  { const sy=Math.min(AN-3,Math.max(gy+2,I.y1)), rx=I.w*.42+2; for(let y=sy-3;y<=sy+3;y++) for(let x=Math.floor(I.cx-rx);x<=I.cx+rx;x++) if(((x-I.cx)/rx)**2+((y-sy)/3)**2<=1&&dith(x,y,.75)) P.tint(x,y,'#000000',.45); }
  for(const f of fx) if(FX_MAT.has(f)) MAT_FX[f](I,F,rng,amt);
  I=subjInfo();
  // materials: the family's two colors (sometimes swapped, always shifted a little), plus the shared kit
  const swap=rng()<.2, jit=(col)=>artMix(col,rng()<.5?F.a:'#ffffff',rng()*.16);
  const base={...MATS, m:jit(swap?F.a:F.m), a:jit(swap?F.m:F.a), c:COAT[subjectOf(c)[1]]||F.m, o:'#c8743a', h:'#e8b890', d:artMix(F.m,'#1a1020',.6)};
  if(kind==='hero') Object.assign(base,{m:F.m,a:F.a,c:artMix(F.m,'#000000',.35)});
  const R={}; for(const k in base) R[k]=ramp5(k==='m'||k==='a'?base[k]:artMix(base[k],F.m,.12));
  const flat={A:F.glow, W:'#ffffff', M:F.m, Y:'#ffe066', R:'#ff3a4a', K:'#140a1a'};
  shadeSubject(out,R,flat,F.glow);
  // outline: dark all round
  const has=(x,y)=>y>=0&&y<AN&&x>=0&&x<AN&&G[y][x];
  for(let y=0;y<AN;y++) for(let x=0;x<AN;x++){ if(G[y][x]) continue; if(has(x,y+1)||has(x,y-1)||has(x+1,y)||has(x-1,y)) out[y][x]=F.o; }
  for(const f of fx) if(OV_FX[f]) OV_FX[f](P,I,F,rng,amt);
  if(c.rarity==='legendary'||c.rarity==='hero') OV_FX.sparkles(P,I,F,rng,.6);
  badges(P,c,rng);
  frame(out,c,F);
  return ART_CACHE[c.id]=out;
}
const motifKey=c=>subjectOf(c).join(':');
function artCSV(c){ return cardArt(c).map(row=>row.join(',')).join('\n')+'\n'; }

// in the browser: a data URL of the picture, drawn once per card
const ART_URL={};
function artURL(c){
  if(ART_URL[c.id]) return ART_URL[c.id];
  const cv=document.createElement('canvas'); cv.width=cv.height=AN; const ctx=cv.getContext('2d');
  cardArt(c).forEach((row,y)=>row.forEach((col,x)=>{ ctx.fillStyle=col; ctx.fillRect(x,y,1,1); }));
  return ART_URL[c.id]=cv.toDataURL();
}

/* ---------------- battle sprites ----------------
   The same pixel kit draws everything on the board: your wizard, each monster, the six
   humanoids, and your summons, machines and towers. Each sprite is 32 x 32, shaded from the
   top left and outlined, on a transparent ground, with a black silhouette (for cast shadows)
   and a white one (for hit flashes). Feet stand on row 30. */
// a person, built from parts: robe, hat or helmet, and what they hold
function human(o){
  if(o.back==='wings') for(const d of [-1,1]){ poly([[16+d*4,12],[16+d*15,3],[16+d*14,11],[16+d*12,20],[16+d*6,20]],'w'); for(let i=0;i<3;i++) seg(16+d*(7+i*2),13+i*2,16+d*(13-i),6+i*4,1,'b'); }
  if(o.back==='legs') for(const d of [-1,1]) for(let i=0;i<3;i++) curve([[16+d*5,14+i*3],[16+d*(11+i),8+i*4],[16+d*(14+i),18+i*4]],1,'k');
  if(o.cape) poly([[10,13],[22,13],[26,30],[6,30]],'c');
  rect(12,25,14,30,'d'); rect(18,25,20,30,'d'); rect(11,29,14,30,'k'); rect(18,29,21,30,'k');
  // the body: a robe by default, or what the gear says
  switch(o.body){
    case 'shirt': rect(12,22,20,27,'d'); poly([[10,24],[22,24],[21,15],[11,15]],'m'); rect(10,22,22,23,'t'); rect(8,15,11,21,'m'); rect(21,15,24,21,'m'); break;
    case 'leather': rect(12,22,20,27,'d'); poly([[10,25],[22,25],[21,15],[11,15]],'m'); seg(11,15,21,24,1,'a'); rect(10,22,22,23,'y'); rect(8,15,11,22,'m'); rect(21,15,24,22,'m'); break;
    case 'thief': rect(12,22,20,27,'m'); poly([[10,25],[22,25],[21,15],[11,15]],'m'); rect(10,21,22,22,'a'); seg(12,15,20,21,1,'a'); rect(8,15,11,22,'m'); rect(21,15,24,22,'m'); break;
    case 'plate': rect(12,23,20,28,'m'); rect(11,15,21,24,'m'); rect(13,17,19,18,'a'); rect(15,15,17,23,'a'); rect(10,23,22,24,'k'); rect(7,14,11,17,'a'); rect(21,14,25,17,'a'); rect(8,17,11,23,'m'); rect(21,17,24,23,'m'); break;
    case 'samurai': rect(11,22,21,27,'m'); for(let y=23;y<27;y+=2) rect(11,y,21,y,'a'); rect(11,15,21,22,'m'); for(let y=16;y<22;y+=2) rect(11,y,21,y,'a');
      for(const d of [-1,1]){ poly([[16+d*5,14],[16+d*10,15],[16+d*10,21],[16+d*5,19]],'m'); seg(16+d*6,16,16+d*9,17,1,'a'); seg(16+d*6,18,16+d*9,19,1,'a'); } break;
    default: poly([[9,27],[23,27],[20,15],[12,15]],'m'); rect(11,20,21,21,'a'); rect(15,15,17,27,'a'); rect(8,15,11,23,'m'); rect(21,15,24,23,'m');
  }
  rect(8,23,10,25,'h'); rect(22,23,24,25,'h');
  circ(16,11,4.2,'h'); px(14,11,'K'); px(18,11,'K'); if(o.beard) poly([[12,13],[20,13],[16,21]],'w');
  if(o.body==='thief') rect(12,12,20,14,'m');   // a thief's mask
  switch(o.hat){
    case 'wizard': poly([[8,9],[24,9],[19,5],[13,0]],'m'); rect(9,8,23,9,'a'); px(16,4,'Y'); break;
    case 'witch': poly([[6,9],[26,9],[18,5],[21,0]],'k'); rect(12,7,20,8,'m'); break;
    case 'hood': poly([[10,14],[11,7],[16,3],[21,7],[22,14],[20,14],[19,9],[13,9],[12,14]],'m'); break;
    case 'helm': rect(11,6,21,13,'g'); rect(12,10,20,11,'K'); poly([[16,6],[19,0],[23,3]],'r'); break;
    case 'spiked': rect(11,6,21,13,'k'); rect(12,10,20,11,'R'); for(const x of [12,16,20]) poly([[x-1,6],[x+1,6],[x,1]],'g'); break;
    case 'leaf': poly([[9,11],[16,3],[23,11],[16,9]],'l'); break;
    case 'cap': ell(16,8,5.2,3,'t'); rect(10,8,23,9,'t'); break;
    case 'kabuto': ell(16,8,6,4.5,'k'); rect(9,9,23,10,'k'); for(const d of [-1,1]) poly([[16+d*5,9],[16+d*9,10],[16+d*8,14],[16+d*5,12]],'k'); quad([11,4],[16,8],[21,4],2,'y'); break;
    case 'crown': rect(11,5,21,7,'y'); for(const x of [12,16,20]) poly([[x-1.5,6],[x,1.5],[x+1.5,6]],'y'); px(16,6,'R'); px(12,6,'A'); px(20,6,'A'); break;
    case 'tiara': for(const [x,h] of [[11,4],[13.5,6],[16,9],[18.5,6],[21,4]]) poly([[x-1.3,8],[x,8-h],[x+1.3,8]],'x'); rect(11,7,21,8,'w'); px(16,2,'W'); break;
    case 'tricorn': poly([[7,9],[25,9],[21,4],[16,6],[11,4]],'k'); rect(8,8,24,9,'y'); quad([22,5],[27,1],[29,3],2,'a'); break;
    case 'antlers': rect(11,6,21,8,'l'); for(const d of [-1,1]){ quad([16+d*4,7],[16+d*8,3],[16+d*12,0],2,'t'); seg(16+d*7,5,16+d*6,1,1,'t'); seg(16+d*10,2,16+d*12,4,1,'t'); } break;
    case 'veil': poly([[10,15],[10,8],[16,4],[22,8],[22,15],[20,15],[19,10],[13,10],[12,15]],'k'); for(let x=11;x<22;x+=2) px(x,9,'M'); poly([[13,3],[16,0],[19,3]],'M'); break;
  }
  if(o.hair==='flame') for(const [x,h] of [[10,5],[12,8],[15,9],[18,8],[21,6],[23,4]]) poly([[x-1.6,9],[x,9-h],[x+1.6,9]],(x%2?'A':'M'));
  if(o.hair==='long') for(const d of [-1,1]) rect(16+d*4-(d>0?0:1),9,16+d*4+(d>0?1:0),19,'w');
  switch(o.weapon){
    case 'staff': seg(25,6,25,30,2,'t'); circ(25,5,2.6,'A'); px(24,4,'W'); break;
    case 'wand': seg(25,14,25,25,1,'t'); circ(25,13,1.6,'A'); px(25,12,'W'); break;
    case 'crossbow': rect(20,19,29,20,'t'); quad([27,13],[30,19],[27,25],1,'g'); seg(27,13,27,25,1,'w'); px(29,19,'A'); break;
    case 'spear': seg(25,4,25,30,1,'t'); poly([[25,-1],[27,4],[25,7],[23,4]],'g'); px(25,2,'W'); break;
    case 'bolt': seg(25,8,25,30,1,'g'); curve([[25,1],[23,4],[27,5],[25,9]],1,'A'); break;
    case 'sword': seg(25,3,25,20,2,'w'); rect(23,19,27,20,'y'); break;
    case 'bow': quad([25,4],[30,16],[25,28],1,'t'); seg(25,4,25,28,1,'w'); break;
    case 'darksword': seg(25,2,25,20,2,'k'); seg(25,3,25,18,1,'R'); rect(23,19,27,20,'g'); break;
    case 'flamestaff': seg(25,7,25,30,2,'t'); for(const [x,h] of [[23,6],[25,9],[27,6]]) poly([[x-1.5,7],[x,7-h],[x+1.5,7]],'A'); circ(25,6,2,'Y'); break;
    case 'icestaff': seg(25,8,25,30,2,'w'); poly([[25,0],[28,5],[25,10],[22,5]],'x'); px(24,3,'W'); break;
    case 'saber': quad([25,20],[28,10],[24,2],2,'w'); rect(22,20,27,21,'y'); seg(25,21,25,24,2,'t'); break;
    case 'gnarl': curve([[25,30],[24,22],[26,15],[24,9],[26,3]],2,'t'); for(const [x,y] of [[27,5],[23,10],[27,14]]) ell(x,y,2,1.2,'l'); break;
    case 'greatsword': seg(25,1,25,21,3,'w'); seg(25,2,25,19,1,'Y'); rect(21,20,29,21,'y'); seg(25,22,25,25,2,'t'); circ(25,26,1.4,'y'); break;
    case 'scythe': seg(25,4,25,30,1,'k'); quad([25,4],[19,0],[13,6],2,'g'); px(13,6,'W'); break;
  }
  if(o.shield==='round'){ circ(6.5,19,4.2,'t'); ringp(6.5,19,4.2,1,'g'); px(6,19,'y'); }
  else if(o.shield==='tower'){ rect(2,13,10,27,'g'); rect(5,15,7,25,'a'); rect(3,19,9,20,'a'); }
  else if(o.shield==='gold'){ poly([[3,14],[11,14],[11,21],[7,25],[3,21]],'y'); circ(7,19,1.8,'A'); }
  else if(o.shield){ poly([[3,14],[11,14],[11,21],[7,25],[3,21]],'a'); rect(6,15,8,22,'y'); }
}
const MONSTER={
  gloop(){ ell(16,22,13,9,'m'); ell(14,14,6,5,'m'); for(const x of [6,12,20,26]) rect(x,29,x+1,31,'m');
    circ(11,19,2.6,'W'); circ(20,19,2.6,'W'); px(11,19,'K'); px(12,20,'K'); px(20,19,'K'); px(21,20,'K');
    rect(12,24,19,25,'K'); px(13,26,'w'); px(18,26,'w'); for(const [x,y] of [[8,24],[24,23],[15,14]]) circ(x,y,1.2,'A'); px(10,15,'W'); px(11,14,'W'); },
  wisp(){ poly([[16,-1],[21,8],[25,18],[22,27],[16,30],[10,27],[7,18],[11,8]],'m'); poly([[16,6],[20,14],[21,22],[16,27],[11,22],[12,14]],'a');
    ell(16,21,3.5,5,'W'); poly([[6,14],[2,8],[9,12]],'m'); poly([[26,14],[30,8],[23,12]],'m'); rect(12,17,13,18,'K'); rect(19,17,20,18,'K'); rect(14,22,18,22,'K'); },
  mite(){ for(const d of [-1,1]) for(let i=0;i<3;i++) seg(16+d*6,22+i*2,16+d*(13+i),26+i*2,1,'k');
    ell(16,20,10,7,'m'); for(const [x,h] of [[10,7],[14,11],[18,9],[22,6]]) poly([[x-2,16],[x,16-h],[x+2,16]],'x');
    for(const d of [-1,1]){ seg(16+d*8,18,16+d*13,12,2,'m'); poly([[16+d*13,12],[16+d*15,8],[16+d*11,9]],'w'); }
    for(const d of [-1,1]){ seg(16+d*3,15,16+d*4,11,1,'k'); circ(16+d*4,10,1.4,'A'); } },
  beetle(){ for(const d of [-1,1]) for(let i=0;i<3;i++) seg(16+d*5,21+i*3,16+d*12,23+i*3,1,'k');
    for(const d of [-1,1]) poly([[16,14],[16+d*14,8],[16+d*10,20]],'x');
    ell(16,21,9,8,'m'); seg(16,13,16,29,1,'k'); ell(16,12,5,4,'k');
    curve([[16,9],[14,5],[18,3],[15,-1]],2,'a'); px(13,11,'A'); px(19,11,'A'); px(12,17,'W'); },
  ram(){ ell(17,19,11,8,'w'); for(let i=0;i<7;i++) circ(9+i*3,13+(i%2)*2,2.5,'w'); for(const x of [9,13,20,24]) rect(x,25,x+1,30,'k');
    ell(7,16,5,6,'k'); px(5,15,'A'); ringp(9,11,4,2,'a'); ringp(9,11,2,1,'a'); for(let i=0;i<4;i++) px(12+i*4,10+(i%2)*2,'Y'); px(4,19,'W'); },
  shade(){ poly([[16,0],[24,8],[26,20],[29,31],[24,27],[20,31],[16,27],[12,31],[8,27],[3,31],[6,20],[8,8]],'m');
    poly([[16,3],[22,9],[21,15],[11,15],[10,9]],'K'); rect(12,10,14,11,'A'); rect(18,10,20,11,'A');
    for(const d of [-1,1]) poly([[16+d*8,15],[16+d*14,22],[16+d*9,20]],'m'); curve([[3,6],[5,3],[2,1]],1,'M'); curve([[28,4],[30,2],[27,0]],1,'M'); },
  sprite(){ for(const d of [-1,1]){ ell(16+d*8,13,6,8,'x'); ell(16+d*7,22,4,5,'x'); }
    ell(16,20,3,7,'b'); circ(16,11,3.5,'h'); px(15,11,'K'); px(17,11,'K'); ringp(16,5,4,1,'Y'); rect(14,14,18,15,'a');
    for(const [x,y] of [[5,4],[27,6],[8,28],[25,27]]) px(x,y,'W'); },
  golem(){ rect(8,10,24,26,'s'); rect(11,3,21,11,'s'); rect(2,11,8,24,'s'); rect(24,11,30,24,'s'); rect(9,26,14,31,'s'); rect(18,26,23,31,'s');
    circ(16,17,3.5,'A'); circ(16,17,1.6,'W'); rect(13,6,14,7,'A'); rect(18,6,19,7,'A');
    for(const [x,y] of [[10,12],[21,22],[4,15],[27,19]]) px(x,y,'M'); seg(8,10,24,10,1,'k'); seg(16,21,16,26,1,'k'); },
};
MONSTER.gloopling=MONSTER.gloop;
// the bosses and their helpers
Object.assign(MONSTER,{
  glacier(){ poly([[16,9],[26,31],[6,31]],'m'); poly([[16,12],[20,31],[12,31]],'x'); seg(12,14,5,21,2,'m'); seg(20,14,26,9,2,'m');
    seg(27,4,27,30,1,'x'); ell(27,4,2.2,3.2,'x'); px(27,4,'A'); circ(16,8,3.6,'h'); px(15,8,'K'); px(17,8,'K');
    poly([[11,5],[12,0],[14,4],[16,-1],[18,4],[20,0],[21,5]],'x'); for(const [x,y] of [[8,26],[23,27],[12,20]]) px(x,y,'W'); },
  treant(){ ell(16,8,13,8,'m'); ell(6,13,6,5,'m'); ell(26,13,6,5,'m'); rect(11,12,21,31,'f'); seg(11,17,3,10,2,'f'); seg(21,17,29,10,2,'f');
    for(const x of [13,17,20]) seg(x,14,x+(x%2?1:-1),30,1,'k'); circ(13,19,1.6,'A'); circ(19,19,1.6,'A'); rect(14,24,18,25,'K');
    seg(11,30,6,31,2,'f'); seg(21,30,26,31,2,'f'); for(const [x,y] of [[8,5],[22,4],[16,2]]) px(x,y,'Y'); },
  wyrm(){ ell(16,27,13,4.5,'m'); ell(13,21,8,4,'m'); curve([[17,21],[22,14],[20,7]],4,'m'); ell(20,6,5.5,4,'m');
    seg(18,3,15,-1,2,'b'); seg(22,3,25,-1,2,'b'); px(22,5,'A'); px(23,5,'A'); poly([[24,7],[29,8],[24,9]],'K');
    for(const [x,y] of [[8,23],[12,18],[19,16],[22,11]]) poly([[x,y],[x+2,y-3],[x+3,y]],'a'); ell(16,28,8,1.5,'a'); },
  roc(){ poly([[16,15],[1,4],[3,12],[6,19]],'m'); poly([[16,15],[31,4],[29,12],[26,19]],'m');
    for(const d of [-1,1]) for(let i=0;i<3;i++) seg(16+d*(8+i*3),12+i*2,16+d*(10+i*3),18+i,1,'a');
    ell(16,19,6,8,'m'); ell(16,21,3.5,5,'a'); circ(16,9,4,'m'); poly([[17,9],[22,11],[17,12]],'y'); px(15,8,'A'); px(14,8,'A');
    seg(13,26,11,31,1,'k'); seg(19,26,21,31,1,'k'); for(const [x,y] of [[4,3],[28,2],[2,15]]) px(x,y,'Y'); },
  hollow(){ MONSTER.shade(); poly([[10,4],[11,0],[13,3],[16,-1],[19,3],[21,0],[22,4]],'y'); px(16,1,'A'); },
  rootnode(){ seg(10,31,6,31,2,'f'); seg(22,31,26,31,2,'f'); rect(11,21,21,31,'f'); ell(16,21,5,2,'f'); ell(16,13,3.5,7,'l'); px(16,11,'A'); px(15,13,'A'); px(17,15,'A'); },
  sapling(){ seg(16,31,16,15,2,'f'); ell(10,15,6,3.5,'m'); ell(22,12,6,3.5,'m'); ell(16,8,4,4,'m'); px(14,22,'A'); px(18,22,'A'); },
});
MONSTER.clone=MONSTER.shade;
const HUMAN_LOOK={cultist:{hat:'hood',weapon:'staff'}, witch:{hat:'witch',weapon:'staff',cape:1}, caller:{hat:'hood',weapon:'bolt'},
  warden:{hat:'leaf',weapon:'bow',cape:1}, paladin:{hat:'helm',weapon:'sword',shield:1}, knight:{hat:'spiked',weapon:'darksword',cape:1}};
// the six heroes: a crowned fire queen, a frost sorceress, a sky captain, an antlered
// forest elder, a winged paladin and a spider-legged witch of the night
const HERO_LOOK={pyra:{hat:'crown',hair:'flame',weapon:'flamestaff',cape:1}, ysolde:{hat:'tiara',hair:'long',weapon:'icestaff',cape:1},
  volta:{hat:'tricorn',weapon:'saber',cape:1}, thornfather:{hat:'antlers',weapon:'gnarl',beard:1},
  aurelion:{hat:'helm',weapon:'greatsword',shield:1,back:'wings'}, widow:{hat:'veil',weapon:'scythe',back:'legs',cape:1}};
const SPRITES={};
function makeSprite(key,pal,draw){
  if(SPRITES[key]) return SPRITES[key];
  grid(SPR,SPR/32); draw();
  const R={}; for(const k in MATS) R[k]=ramp(MATS[k]); R.m=ramp(pal.m); R.a=ramp(pal.a); R.c=ramp(pal.c||pal.a); R.h=ramp('#e8b890'); R.d=ramp(pal.d||'#3a2e4a');
  const flat={A:pal.glow, W:'#ffffff', M:pal.m, Y:'#ffe066', R:'#ff3a4a', K:'#140a1a'};
  const mk=()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=SPR; return cv; };
  const img=mk(), sil=mk(), wht=mk(), ci=img.getContext('2d'), cs=sil.getContext('2d'), cw=wht.getContext('2d');
  const has=(x,y)=>y>=0&&y<SPR&&x>=0&&x<SPR&&G[y][x];
  cs.fillStyle='#000'; cw.fillStyle='#fff';
  for(let y=0;y<SPR;y++) for(let x=0;x<SPR;x++){ const m=G[y][x]; let col=null;
    if(m){ if(flat[m]) col=flat[m]; else { const same=(dx,dy)=>has(x+dx,y+dy)===m;
        // light from the upper left: a highlight band along top/left edges, a shadow band along the
        // bottom/right, a deep core shadow in the far corner; bands scale with the sprite's resolution
        const d=SPR/32, edge=(sx,sy,n)=>{ for(let k=1;k<=n;k++) if(!same(sx*k,sy*k)) return true; return false; };
        col=R[m][edge(0,-1,d)||edge(-1,-1,d)||edge(-1,0,1)?3:(edge(1,1,d)&&edge(0,1,d))?0:(edge(1,0,2*d)||edge(0,1,2*d))?1:2]; } }
    else if([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>has(x+dx,y+dy))) col=pal.o||'#0a0610';
    if(col){ ci.fillStyle=col; ci.fillRect(x,y,1,1); cs.fillRect(x,y,1,1); cw.fillRect(x,y,1,1); } }
  return SPRITES[key]={img,sil,wht};
}
// the sprite for a unit on the board: 'player', an enemy id, or an ally's card
// The hand-placed player sprites from sprites.js, decoded once into the same {img,sil,wht}
// canvases the generated sprites use. Until an image has loaded the old sprite stands in.
const LOOK_SPR={};
const hatOn=()=>{ try{ return !(typeof save!=='undefined'&&save&&save.hat===false); }catch(e){ return true; } };
// From behind (battle and dungeon) a look has four poses drawn together on one sheet: idle, walk,
// cast and attack (sprites.js `anim`), so every frame shares a palette, a scale and the same feet.
const POSES=['idle','walk','cast','attack'];
// Undead and Necromancer became one class; old saves keep their look
const LOOK_ALIAS={undead_m:'necro',undead_f:'necro_f'};
function lookSprite(id,view,hat,pose){
  if(typeof PLAYER_LOOKS==='undefined'||typeof document==='undefined') return null;
  id=LOOK_ALIAS[id]||id;
  if(!PLAYER_LOOKS[id]) id='wizard'; if(hat==null) hat=hatOn();
  const L=PLAYER_LOOKS[id], bare=!hat&&!!L[view+'Bare'];
  // the posed frames, when this look has them
  if(view==='back'&&L.anim){ const field=bare&&L.animBare?'animBare':'anim', key=id+':'+field, pi=Math.max(0,POSES.indexOf(pose||'idle'));
    if(!(key in LOOK_SPR)){ LOOK_SPR[key]=null; const im=new Image();
      im.onload=()=>{ const n=im.height, tips=(field==='animBare'?L.tipsBare:L.tips)||[];
        LOOK_SPR[key]=POSES.map((_,i)=>{ const mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=n; return c; }, img=mk(), sil=mk(), wht=mk();
          img.getContext('2d').drawImage(im,i*n,0,n,n,0,0,n,n);
          for(const [c,col] of [[sil,'#000'],[wht,'#fff']]){ const x=c.getContext('2d'); x.drawImage(img,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,n,n); }
          return {img,sil,wht,hand:true,tip:tips[i]||L.tipBack||null,pose:POSES[i]}; });
        if(root.onLookLoaded) root.onLookLoaded(); };
      im.src=L[field]; }
    const fr=LOOK_SPR[key]; return fr?fr[Math.min(pi,fr.length-1)]:null; }
  const field=view+(bare?'Bare':''), key=id+':'+field;
  if(key in LOOK_SPR) return LOOK_SPR[key];
  LOOK_SPR[key]=null; const im=new Image();
  im.onload=()=>{ const n=im.width, mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=n; return c; };
    const img=mk(), sil=mk(), wht=mk(); img.getContext('2d').drawImage(im,0,0);
    for(const [c,col] of [[sil,'#000'],[wht,'#fff']]){ const x=c.getContext('2d'); x.drawImage(im,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,n,n); }
    LOOK_SPR[key]={img,sil,wht,hand:true,tip:view==='back'?(L.tipBack||L.tip):L.tip}; if(root.onLookLoaded) root.onLookLoaded(); };
  im.src=L[field]; return null;
}
const playerLook=()=>{ try{ const l=(typeof save!=='undefined'&&save&&save.look)||'wizard'; return LOOK_ALIAS[l]||l; }catch(e){ return 'wizard'; } };
if(typeof PLAYER_LOOKS!=='undefined'&&typeof document!=='undefined') for(const id in PLAYER_LOOKS) for(const v of ['front','back']) for(const h of [true,false]) lookSprite(id,v,h);
// enemies, bosses and heroes drawn on the rig (sprites.js), decoded the same way
const UNIT_SPR={};
function rigSprite(id){
  if(typeof UNIT_SPRITES==='undefined'||typeof document==='undefined'||!UNIT_SPRITES[id]) return null;
  if(id in UNIT_SPR) return UNIT_SPR[id];
  UNIT_SPR[id]=null; const im=new Image();
  im.onload=()=>{ const n=im.width, mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=n; return c; };
    const img=mk(), sil=mk(), wht=mk(); img.getContext('2d').drawImage(im,0,0);
    for(const [c,col] of [[sil,'#000'],[wht,'#fff']]){ const x=c.getContext('2d'); x.drawImage(im,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,n,n); }
    UNIT_SPR[id]={img,sil,wht,hand:true}; };
  im.src=UNIT_SPRITES[id]; return null;
}
if(typeof UNIT_SPRITES!=='undefined'&&typeof document!=='undefined') for(const id in UNIT_SPRITES) rigSprite(id);
/* Bosses with animation sheets (sprites_pal.js): one fixed palette per boss and its frames as
   palette indices. Each animation's indices are unpacked once (raw deflate, in the background),
   and each frame is painted into a canvas the first time it is shown. Until then, and in old
   browsers without DecompressionStream, the boss keeps its old single sprite. The frames face the
   viewer, so they are never mirrored (front:true). */
const PAL_IDX={}, PAL_SPR={};
if(typeof PAL_SPRITES!=='undefined'&&typeof document!=='undefined'&&typeof DecompressionStream!=='undefined')
  for(const id in PAL_SPRITES) for(const a in PAL_SPRITES[id].anims){ const b=atob(PAL_SPRITES[id].anims[a]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(buf=>{ PAL_IDX[id+':'+a]=new Uint8Array(buf); }).catch(()=>{}); }
function palFrame(id,anim,i){ const P=PAL_SPRITES[id], idx=PAL_IDX[id+':'+anim]||PAL_IDX[id+':idle']; if(!idx) return null;
  if(!PAL_IDX[id+':'+anim]) anim='idle';
  const n=P.size, count=idx.length/(n*n), f=((i%count)+count)%count, key=id+':'+anim+':'+f; if(PAL_SPR[key]) return PAL_SPR[key];
  const rgb=P.rgb||(P.rgb=P.pal.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]));
  const mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=n; return c; }, img=mk(), sil=mk(), wht=mk();
  const ctx=img.getContext('2d'), d=ctx.createImageData(n,n), px=d.data, o=f*n*n;
  for(let k=0;k<n*n;k++){ const v=idx[o+k]; if(!v) continue; const c=rgb[v-1]; px[k*4]=c[0]; px[k*4+1]=c[1]; px[k*4+2]=c[2]; px[k*4+3]=255; }
  ctx.putImageData(d,0,0);
  for(const [c,col] of [[sil,'#000'],[wht,'#fff']]){ const x=c.getContext('2d'); x.drawImage(img,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,n,n); }
  return PAL_SPR[key]={img,sil,wht,hand:true,front:true}; }
/* Which animation a boss shows: in a fight, its walk toward you, away, or to either side while it
   slides between tiles (it keeps walking a moment after, so a step is not a flicker); otherwise
   its idle. On the board your side is low x and the screen's right is +z. */
function palSprite(u){ const P=PAL_SPRITES[u.id], t=performance.now()/1000; let anim='idle';
  if(u.tile&&u.rx!=null){ const dx=u.tile.wx-u.rx, dz=u.tile.wz-u.rz;
    if(Math.hypot(dx,dz)>.03){ anim=Math.abs(dz)>Math.abs(dx)*1.2?(dz>0?'walkR':'walkL'):(dx<0?'walkF':'walkB'); u.palWalk=anim; u.palT=t; }
    else if(u.palWalk&&t-u.palT<.35) anim=u.palWalk; }
  return palFrame(u.id,anim,Math.floor(t*((P.fps&&P.fps[anim])||10))); }
function unitSprite(u){
  if(u.kind==='player'){ const hs=lookSprite(u.lookId||playerLook(),u.view||'back',null,u.pose); if(hs) return hs; }
  if(u.kind==='player'){ const L=u.look||{body:'robe',m:'#1f5fa8',a:'#f2c94c',hat:'wizard',weapon:'staff',glow:'#7fd4ff',beard:true};
    return makeSprite('player:'+JSON.stringify(L),{m:L.m,a:L.a,c:artMix(L.m,'#000000',.35),glow:L.glow,o:'#03070c',d:artMix(L.m,'#1a1020',.55)},()=>human(L)); }
  if(u.kind==='enemy'&&typeof PAL_SPRITES!=='undefined'&&PAL_SPRITES[u.id]){ const ps=palSprite(u); if(ps) return ps; }
  if(u.kind==='enemy'){ const rs=rigSprite(u.id); if(rs) return rs; }
  if(u.kind==='enemy'){ const F=FAM[u.color], id=u.id;
    const pal={m:F.m,a:F.a,glow:F.glow,o:F.o,c:artMix(F.m,'#000000',.35),d:artMix(F.m,'#1a1020',.6)};
    if(HUMAN_LOOK[id]) return makeSprite('e:'+id,pal,()=>human(HUMAN_LOOK[id]));
    return makeSprite('e:'+id,pal,MONSTER[id]||MONSTER.gloop); }
  if(u.card&&u.card.type==='hero'){ const rs=rigSprite('hero_'+u.card.hero); if(rs) return rs; }
  const c=u.card, F=FAM[c.color], pal={m:F.m,a:F.a,glow:F.glow,o:F.o};
  if(c.type==='hero') return makeSprite('h:'+c.hero,{m:F.m,a:F.a,glow:F.glow,o:F.o,c:artMix(F.m,'#000000',.35),d:artMix(F.m,'#1a1020',.6)},()=>human(HERO_LOOK[c.hero]||{}));
  return makeSprite('c:'+c.id,Object.assign(pal,{c:COAT[subjectOf(c)[1]]||F.m}),()=>{
    const [kind,key]=subjectOf(c);
    if(kind==='creature') creature(CREATURES[key],CREATURE_MOD[words(c)[0]]||{},()=>.5);
    else if(kind==='machine') machine(key,c.ai);
    else (THING[key]||THING.sentry)(()=>.5); });
}

Object.assign(root,{ART_SIZE,cardArt,artCSV,artURL,motifKey,unitSprite,lookSprite,rigSprite,palFrame,palSprite,LOOK_ALIAS});
if(typeof module!=='undefined') module.exports={ART_SIZE,cardArt,artCSV,motifKey};
})(typeof window!=='undefined'?window:globalThis);
