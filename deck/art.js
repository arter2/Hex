/* Hexmancers deck prototype — pixel art for every card, 32 x 32.
   A card's picture is composed, not stamped:
   - the subject comes from the card's own name (a Lance, a Fang, a Censer, an Owl, a Trebuchet),
     falling back to what the card does;
   - its type sets the staging (a wedge fans three weapons, missiles scatter copies, a digger
     bursts from the ground, a lob shows its landing pattern);
   - its color family sets the scene (lava cavern, snowy peaks, storm sky, forest, sun rays,
     moonlit fog, stone cave, workshop) and the particles;
   - keywords add details (flames, bubbles, stars, runes), rarity adds the frame and a glow.
   Shading comes from the top left, with a dark outline. Variation is seeded from the card id,
   so a card always has the same picture. cardArt(card) returns 32 rows of 32 hex colors;
   tools/export-art.js writes them to CSV files. */

(function(root){
const ART_SIZE=32, N=ART_SIZE;

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

/* ---------------- drawing on a 32 x 32 grid of materials ---------------- */
let G=null;   // the subject layer being drawn
function px(x,y,m){ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<N&&y>=0&&y<N) G[y][x]=m; }
function rect(x0,y0,x1,y1,m){ for(let y=Math.round(y0);y<=Math.round(y1);y++) for(let x=Math.round(x0);x<=Math.round(x1);x++) px(x,y,m); }
function ell(cx,cy,rx,ry,m){ for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1) G[y][x]=m; }
function circ(cx,cy,r,m){ ell(cx,cy,r,r,m); }
function ringp(cx,cy,r,w,m){ for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const d=Math.hypot(x+.5-cx,y+.5-cy); if(d<=r&&d>=r-w) G[y][x]=m; } }
function poly(pts,m){ for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const X=x+.5, Y=y+.5; let ins=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i], [xj,yj]=pts[j]; if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi) ins=!ins; }
  if(ins) G[y][x]=m; } }
function seg(x0,y0,x1,y1,w,m){ const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*2)+1;
  for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, y=y0+(y1-y0)*i/n; if(w<=1) px(x,y,m); else circ(x,y,w/2,m); } }
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
  barrier(){ for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const d=Math.hypot(x+.5-16,y+.5-26); if(d<=14&&d>=12.5&&y<26) G[y][x]='a'; else if(d<12.5&&y<26&&(x+y)%4===0) G[y][x]='M'; } rect(2,26,29,28,'s'); },
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
  Crown:'crown',Heart:'heart',Eye:'eye',Sigil:'sigil',Tree:'tree',Eclipse:'eclipse',Zero:'crystal',Dawnbreaker:'sun',Pact:'skull',Tailwind:'boot'};
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

/* ---------------- scenes ---------------- */
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function scene(fam,rng,groundY){
  const F=FAM[fam], out=Array.from({length:N},()=>Array(N).fill(null));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const t=y/(N-1); out[y][x]=(BAYER[y%4][x%4]/16)<t?F.sky[1]:F.sky[0]; }
  const put=(x,y,c)=>{ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<N&&y>=0&&y<N) out[y][x]=c; };
  const dark=artMix(F.sky[0],'#000000',.3), mid=artMix(F.sky[1],F.m,.25);
  switch(fam){
    case 'fire': // cavern with a lava pool
      for(let x=0;x<N;x++){ const h=3+Math.sin(x*.5+rng()*6)*2; for(let y=0;y<h;y++) put(x,y,dark); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(x+y*3)%9===0?artMix(F.glow,'#3a0a04',.3):artMix(F.m,'#2a0604',.62+.1*Math.sin(x*.8+y)));
      break;
    case 'frost': // mountains and snow
      for(let x=0;x<N;x++){ const h=groundY-6-Math.abs(((x+rng()*3)%16)-8)*1.2; for(let y=Math.floor(h);y<groundY;y++) put(x,y,y<h+2?'#e8f4ff':mid); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(BAYER[y%4][x%4]>12)?'#b8d4ea':F.ground);
      break;
    case 'storm': // cloud bank and a distant strike
      for(let i=0;i<5;i++){ const cx=rng()*N, cy=3+rng()*6; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(((x-cx)/7)**2+((y-cy)/3)**2<1) put(x,y,mid); }
      { let x=4+rng()*24; for(let y=8;y<groundY;y++){ x+=(rng()-.5)*2; put(x,y,artMix(F.a,F.sky[1],.3)); } }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,F.ground);
      break;
    case 'verdant': // tree line and grass
      for(let i=0;i<6;i++){ const cx=rng()*N, r=4+rng()*4; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(Math.hypot(x-cx,(y-groundY+4)*1.2)<r) put(x,y,artMix(F.sky[1],F.m,.35)); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(x*7+y*3)%9===0?F.m:F.ground);
      break;
    case 'light': // sun rays
      for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const a=Math.atan2(y-4,x-16); if(Math.sin(a*9)>.55&&y<groundY) put(x,y,artMix(out[y][x],F.glow,.18)); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(x+y)%6===0?F.glow:F.ground);
      break;
    case 'shadow': { // moon and mist
      const mx=6+rng()*20; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(Math.hypot(x-mx,y-6)<4) put(x,y,Math.hypot(x-mx-1.5,y-5)<3.2?out[y][x]:'#e8d8f0');
      for(let y=groundY-3;y<N;y++) for(let x=0;x<N;x++) if(y>=groundY||(BAYER[y%4][x%4]>(groundY-y)*5)) put(x,y,y>=groundY?F.ground:artMix(F.sky[1],F.a,.35));
      break; }
    case 'gray': // cave wall and pebbles
      for(let i=0;i<14;i++){ const x=rng()*N, y=rng()*groundY; put(x,y,mid); put(x+1,y,mid); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(x*5+y*11)%13===0?'#5a5c68':F.ground);
      break;
    case 'brown': { // workshop planks and a gear
      for(let y=0;y<groundY;y++) for(let x=0;x<N;x++) if(x%8===0) put(x,y,dark);
      const gx=4+rng()*24, gy=4+rng()*6; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const d=Math.hypot(x-gx,y-gy), a=Math.atan2(y-gy,x-gx); if(d<5+(Math.sin(a*8)>0?1:0)&&d>2) put(x,y,mid); }
      for(let y=groundY;y<N;y++) for(let x=0;x<N;x++) put(x,y,(y-groundY)%3===0?dark:F.ground);
      break; }
  }
  return out;
}

/* ---------------- particles and keyword details, drawn flat on top ---------------- */
function particles(out,fam,rng,n){
  const F=FAM[fam], put=(x,y,c)=>{ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<N&&y>=0&&y<N) out[y][x]=c; };
  for(let i=0;i<n;i++){ const x=rng()*N, y=rng()*N;
    switch(fam){
      case 'fire': put(x,y,rng()<.5?F.glow:F.a); break;
      case 'frost': put(x,y,'#ffffff'); if(rng()<.4){ put(x+1,y,'#dff4ff'); put(x-1,y,'#dff4ff'); put(x,y+1,'#dff4ff'); put(x,y-1,'#dff4ff'); } break;
      case 'storm': put(x,y,F.m); put(x+1,y+1,F.glow); break;
      case 'verdant': put(x,y,F.m); put(x+1,y,artMix(F.m,'#ffffff',.3)); break;
      case 'light': put(x,y,'#ffffff'); if(rng()<.5){ put(x+1,y,F.m); put(x-1,y,F.m); put(x,y+1,F.m); put(x,y-1,F.m); } break;
      case 'shadow': put(x,y,F.a); put(x+1,y,artMix(F.a,F.sky[0],.5)); break;
      case 'gray': put(x,y,'#8a8ea0'); break;
      case 'brown': put(x,y,'#d8d0c8'); put(x+1,y-1,'#a8a098'); break;
    } }
}
function details(out,c,rng){
  const put=(x,y,col)=>{ x=Math.floor(x); y=Math.floor(y); if(x>=0&&x<N&&y>=0&&y<N) out[y][x]=col; };
  const icon=(x,y,rows,col)=>rows.forEach((r,j)=>[...r].forEach((ch,i)=>{ if(ch==='#') put(x+i,y+j,col); }));
  const spots=[[2,2],[25,2],[2,25],[25,25]].sort(()=>rng()-.5);
  const next=()=>spots.pop()||[2,2];
  if(c.burn){ const [x,y]=next(); icon(x,y,['..#..','.##..','.###.','#####','.###.'],'#ff7a2a'); put(x+2,y+3,'#ffe066'); }
  if(c.freeze||c.slow){ const [x,y]=next(); icon(x,y,['..#..','#.#.#','.###.','#.#.#','..#..'],'#dff4ff'); }
  if(c.stun){ const [x,y]=next(); icon(x,y,['..#..','.###.','#####','.###.','.#.#.'],'#fff39a'); }
  if(c.poison){ const [x,y]=next(); icon(x,y,['.#...','###.#','.#.##','...#.','.....'],'#8aff6a'); }
  if(c.curse){ const [x,y]=next(); icon(x,y,['#...#','.#.#.','..#..','.#.#.','#...#'],'#b88aff'); }
  if(c.drain||c.self){ const [x,y]=next(); icon(x,y,['..#..','.###.','#####','#####','.###.'],'#e0304a'); }
  if(c.mend){ const [x,y]=next(); icon(x,y,['..#..','..#..','#####','..#..','..#..'],'#8aff9a'); }
  if(c.valor){ const [x,y]=next(); icon(x,y,['#...#','##.##','.###.','..#..','.#.#.'],'#ffd966'); }
  if(c.confuse){ const [x,y]=next(); icon(x,y,['.###.','#...#','...#.','..#..','..#..'],'#ffffff'); }
  if(c.push||c.pull){ const [x,y]=next(); icon(x,y,c.push?['#....','.#...','..#..','.#...','#....']:['....#','...#.','..#..','...#.','....#'],'#e8e0ff'); }
}

/* ---------------- composition ---------------- */
function artRng(id){ let h=2166136261; for(const ch of 'art32:'+id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } let a=h>>>0;
  return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const words=c=>c.name.replace(/ of the /,' ').split(/\s+/);
function findWord(c,table){ const ws=words(c); for(let i=ws.length-1;i>=0;i--) if(table[ws[i]]) return table[ws[i]]; return null; }
// what the picture shows: [kind, key] for the subject
function subjectOf(c){
  const kind=c.type==='piece'?c.base:c.type;
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

const ART_CACHE={};
function cardArt(c){
  if(ART_CACHE[c.id]) return ART_CACHE[c.id];
  const rng=artRng(c.id), fam=c.color, F=FAM[fam], groundY=24+Math.floor(rng()*4);
  const bg=scene(fam,rng,groundY);
  // rarer cards glow behind the subject
  if(c.rarity!=='common'){ const r={uncommon:9,rare:12,legendary:15}[c.rarity];
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const d=Math.hypot(x-15.5,y-15.5); if(d<r&&BAYER[y%4][x%4]<(1-d/r)*16) bg[y][x]=artMix(bg[y][x],F.glow,.35); } }
  particles(bg,fam,rng,6+Math.floor(rng()*6));
  // subject
  G=Array.from({length:N},()=>Array(N).fill(null));
  drawSubject(c,rng);
  if(rng()<.5&&!['creature'].includes(subjectOf(c)[0])) G.forEach(row=>row.reverse());
  const swap=rng()<.2, base={m:swap?F.a:F.m, a:swap?F.m:F.a, c:COAT[subjectOf(c)[1]]||F.m, ...MATS};
  // an Ember card leans red, a Frost card blue: tint shared materials a little toward the family
  const R={}; for(const k in base) R[k]=ramp(k==='m'||k==='a'?base[k]:artMix(base[k],F.m,.12));
  const flat={A:F.glow, W:'#ffffff', M:F.m, Y:'#ffe066', R:'#ff3a4a'};
  const out=bg.map(r=>r.slice()), has=(x,y)=>y>=0&&y<N&&x>=0&&x<N&&G[y][x];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const m=G[y][x]; if(!m) continue;
    if(flat[m]){ out[y][x]=flat[m]; continue; }
    const same=(dx,dy)=>has(x+dx,y+dy)===m;
    const tone=!same(0,-1)||!same(-1,-1)?3:(!same(1,1)&&!same(0,1))?0:(!same(1,0)||!same(0,1))?1:2;
    out[y][x]=R[m][tone]; }
  // outline around the subject, and a soft shadow on the ground
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ if(G[y][x]) continue;
    if([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>has(x+dx,y+dy))) out[y][x]=F.o; }
  details(out,c,rng);
  // frame by rarity
  const frame={legendary:['#ffe066','#b08a2a','#fff6c8'],rare:['#d8d4e4','#7a7488','#ffffff'],uncommon:[artMix(F.m,'#ffffff',.2),artMix(F.m,'#000000',.4),null]}[c.rarity];
  if(frame) for(let i=0;i<N;i++) for(const [x,y] of [[i,0],[i,N-1],[0,i],[N-1,i]]) out[y][x]=frame[(x+y)%2];
  if(c.rarity==='legendary') for(const [x,y] of [[1,1],[N-2,1],[1,N-2],[N-2,N-2]]){ out[y][x]=frame[2]; }
  return ART_CACHE[c.id]=out;
}
const motifKey=c=>subjectOf(c).join(':');
function artCSV(c){ return cardArt(c).map(row=>row.join(',')).join('\n')+'\n'; }

// in the browser: a data URL of the picture, drawn once per card
const ART_URL={};
function artURL(c){
  if(ART_URL[c.id]) return ART_URL[c.id];
  const cv=document.createElement('canvas'); cv.width=cv.height=N; const ctx=cv.getContext('2d');
  cardArt(c).forEach((row,y)=>row.forEach((col,x)=>{ ctx.fillStyle=col; ctx.fillRect(x,y,1,1); }));
  return ART_URL[c.id]=cv.toDataURL();
}

Object.assign(root,{ART_SIZE,cardArt,artCSV,artURL,motifKey});
if(typeof module!=='undefined') module.exports={ART_SIZE,cardArt,artCSV,motifKey};
})(typeof window!=='undefined'?window:globalThis);
