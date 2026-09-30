/* Hexmancers deck prototype — pixel art for every card.
   Each card gets a 16 x 16 picture: a motif for what the card does (an arrow for a strike,
   a bomb for a lob, a shield, a tower, a flask...), painted in its color family, shaded and
   outlined like pixel art, over a dithered background. Variation is seeded from the card id,
   so a card always has the same picture. cardArt(card) returns 16 rows of 16 hex colors;
   tools/export-art.js writes them to CSV files. */

const ART_SIZE=16;
// per color family: main and accent ramps [dark, mid, light], background top/bottom, outline
const ART_PAL={
  fire:   {m:['#8c2410','#e8542a','#ff9a5c'], a:['#c77a12','#ffc233','#fff08a'], bg:['#2a0f14','#4a1a1a'], o:'#1a0806'},
  frost:  {m:['#1f5f9c','#4fb4ee','#b8ecff'], a:['#6fa8c8','#e0f6ff','#ffffff'], bg:['#0e1a33','#16304f'], o:'#060c1a'},
  storm:  {m:['#9a7a10','#f2d23a','#fff39a'], a:['#5a4fd0','#8f86ff','#d0ccff'], bg:['#1a1633','#2a2450'], o:'#0c0a1a'},
  verdant:{m:['#2a6a2a','#4fbf4f','#a8f08a'], a:['#7a4f26','#b07a44','#e0b07a'], bg:['#0f2014','#1a3320'], o:'#07120a'},
  light:  {m:['#b08a2a','#ffd966','#fff6c8'], a:['#8aa0c8','#e8f0ff','#ffffff'], bg:['#2a2438','#403a58'], o:'#141020'},
  shadow: {m:['#6a1f4a','#c23a7a','#f08ab8'], a:['#3a2a5a','#7a5aa8','#b8a0e0'], bg:['#12081a','#24102e'], o:'#08040c'},
  gray:   {m:['#5a5e6e','#9aa0b4','#d8dcea'], a:['#8a5a3a','#c08a5a','#f0c090'], bg:['#1a1c24','#2a2e3a'], o:'#0a0b10'},
  brown:  {m:['#5a3a1c','#a06a3a','#dca070'], a:['#6a6a78','#a8a8b8','#e8e8f0'], bg:['#1c140e','#2e2016'], o:'#0c0806'},
};
// shared materials: g metal, w white/glass, t wood, k dark
const ART_MAT={g:['#4a4458','#8a8398','#c8c4d4'], w:['#a8a8c0','#e8e8f8','#ffffff'], t:['#4a2c14','#8a5a2c','#c08a4a'], k:['#1a1624','#2e2838','#4a4458']};

/* ---------------- drawing primitives on a 16 x 16 grid of material letters ---------------- */
function artPx(g,x,y,m){ x=Math.round(x); y=Math.round(y); if(x>=0&&x<ART_SIZE&&y>=0&&y<ART_SIZE) g[y][x]=m; }
function artRect(g,x0,y0,x1,y1,m){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) artPx(g,x,y,m); }
function artCircle(g,cx,cy,r,m){ for(let y=0;y<ART_SIZE;y++) for(let x=0;x<ART_SIZE;x++) if((x-cx)**2+(y-cy)**2<=r*r+r*.6) g[y][x]=m; }
function artRing(g,cx,cy,r,m){ for(let y=0;y<ART_SIZE;y++) for(let x=0;x<ART_SIZE;x++){ const d=Math.hypot(x-cx,y-cy); if(Math.abs(d-r)<.7) g[y][x]=m; } }
function artLine(g,x0,y0,x1,y1,m,w){ const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2));
  for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, y=y0+(y1-y0)*i/n; artPx(g,x,y,m); if(w>1){ artPx(g,x+1,y,m); artPx(g,x,y+1,m); } } }
function artPoly(g,pts,m){ for(let y=0;y<ART_SIZE;y++) for(let x=0;x<ART_SIZE;x++){ const px=x+.5, py=y+.5; let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i], [xj,yj]=pts[j]; if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi) inside=!inside; }
  if(inside) g[y][x]=m; } }

/* ---------------- motifs: one per kind of card ---------------- */
const MOTIF={
  arrow(g){ artLine(g,3,12,11,4,'t',1); artPoly(g,[[9,2],[14,1],[13,6]],'a'); artPoly(g,[[1,12],[4,11],[4,14]],'m'); artPoly(g,[[2,10],[5,10],[3,13]],'m'); },
  beam(g){ artRect(g,0,6,15,9,'m'); artRect(g,0,7,15,8,'w'); artCircle(g,2,7.5,2.5,'a'); },
  fan(g){ artPoly(g,[[1,8],[14,1],[15,15]],'m'); artPoly(g,[[3,8],[12,4],[13,12]],'a'); artCircle(g,2,8,1.5,'w'); },
  burst(g){ for(let i=0;i<8;i++){ const a=i*Math.PI/4; artLine(g,7.5,7.5,7.5+Math.cos(a)*7,7.5+Math.sin(a)*7,'m',1); } artCircle(g,7.5,7.5,3,'a'); artCircle(g,7.5,7.5,1.3,'w'); },
  orbs(g){ artCircle(g,4,11,2.4,'m'); artCircle(g,11,10,2.4,'m'); artCircle(g,7.5,4,2.4,'m'); [[4,11],[11,10],[7.5,4]].forEach(([x,y])=>artPx(g,x,y,'w')); artLine(g,1,14,3,12,'a',1); artLine(g,14,14,12,12,'a',1); },
  drill(g){ artPoly(g,[[2,4],[2,12],[14,8]],'g'); for(let x=3;x<12;x+=3) artLine(g,x,5+(x-2)*.3,x+1,11-(x-2)*.3,'k',1); artRect(g,0,13,15,15,'t'); },
  zigzag(g){ const pts=[[1,4],[5,11],[8,4],[11,11],[14,4]]; for(let i=0;i<pts.length-1;i++) artLine(g,...pts[i],...pts[i+1],'a',2); artCircle(g,14,4,1.5,'w'); },
  cross(g){ artLine(g,2,2,13,13,'t',1); artLine(g,2,13,13,2,'t',1); artPoly(g,[[11,1],[14,1],[14,4]],'a'); artPoly(g,[[11,14],[14,14],[14,11]],'a'); },
  bomb(g){ artCircle(g,7,9.5,5,'m'); artRect(g,9,4,11,5,'g'); artLine(g,11,4,12,1,'t',1); artPx(g,13,0,'a'); artPx(g,12,0,'w'); artPx(g,14,1,'a'); artPx(g,5,7,'w'); },
  shield(g){ artPoly(g,[[2,2],[14,2],[14,8],[8,15],[2,8]],'m'); artRect(g,7,4,8,11,'a'); artRect(g,4,6,11,7,'a'); },
  wall(g){ artRect(g,1,5,14,14,'m'); for(let y=5;y<=14;y+=3){ artRect(g,1,y,14,y,'k'); } for(let y=6;y<=14;y+=3) for(let x=(y%2?3:6);x<15;x+=6) artRect(g,x,y,x,y+1,'k'); },
  thorns(g){ MOTIF.wall(g); for(let x=2;x<15;x+=3) artPoly(g,[[x-1,5],[x+1,5],[x,1]],'w'); },
  tower(g){ artRect(g,6,6,9,14,'g'); artRect(g,4,13,11,15,'g'); artRect(g,5,5,10,6,'k'); artCircle(g,7.5,3,2.2,'a'); artPx(g,7,2,'w'); },
  heart(g){ artCircle(g,5,6,3,'m'); artCircle(g,10,6,3,'m'); artPoly(g,[[2,7],[13,7],[7.5,14]],'m'); artPx(g,4,5,'w'); artPx(g,5,4,'w'); },
  sword(g){ artRect(g,7,1,8,10,'w'); artRect(g,4,10,11,11,'a'); artRect(g,7,12,8,14,'t'); artPx(g,7,15,'a'); artPx(g,8,15,'a'); },
  wing(g){ artPoly(g,[[2,12],[6,4],[14,2],[11,7],[14,8],[9,11],[12,12]],'w'); artLine(g,3,11,12,3,'a',1); },
  swirl(g){ for(let i=0;i<60;i++){ const a=i*.32, r=1+i*.11; artPx(g,7.5+Math.cos(a)*r,7.5+Math.sin(a)*r,i%12<6?'m':'a'); } },
  hourglass(g){ artRect(g,3,1,12,2,'t'); artRect(g,3,13,12,14,'t'); artPoly(g,[[4,3],[11,3],[8,8],[7,8]],'w'); artPoly(g,[[7,8],[8,8],[11,12],[4,12]],'w'); artPoly(g,[[5,10],[10,10],[11,12],[4,12]],'a'); },
  halo(g){ artRing(g,7.5,3,3.2,'a'); artPoly(g,[[1,8],[7,7],[5,13]],'w'); artPoly(g,[[14,8],[8,7],[10,13]],'w'); artCircle(g,7.5,9,1.8,'m'); },
  skull(g){ artCircle(g,7.5,7,5,'w'); artRect(g,5,11,10,13,'w'); artCircle(g,5.5,7,1.2,'k'); artCircle(g,9.5,7,1.2,'k'); artPx(g,7,10,'k'); artPx(g,8,10,'k'); artPx(g,6,13,'k'); artPx(g,9,13,'k'); },
  flask(g){ artCircle(g,7.5,10,4.5,'w'); artRect(g,6,2,9,6,'w'); artRect(g,5,1,10,2,'t'); artCircle(g,7.5,11,3.4,'m'); artPx(g,6,9,'w'); artPx(g,9,12,'a'); artPx(g,7,13,'a'); },
  scroll(g){ artRect(g,3,3,12,12,'w'); artRect(g,2,2,13,3,'t'); artRect(g,2,12,13,13,'t'); for(let y=5;y<=10;y+=2) artRect(g,5,y,10,y,'k'); },
  cards(g){ artRect(g,2,3,9,13,'w'); artRect(g,6,1,13,11,'m'); artRect(g,8,3,11,5,'a'); },
  jaw(g){ artRect(g,1,11,14,13,'g'); for(let x=1;x<15;x+=3){ artPoly(g,[[x,11],[x+2,11],[x+1,7]],'w'); } artPoly(g,[[3,6],[12,6],[7.5,3]],'a'); },
  snare(g){ artRing(g,7.5,8,5,'t'); artRing(g,7.5,8,4,'t'); artLine(g,12,4,15,0,'t',1); artPx(g,7,8,'a'); },
  mine(g){ artCircle(g,7.5,9,4.5,'g'); for(let i=0;i<6;i++){ const a=i*Math.PI/3; artPx(g,7.5+Math.cos(a)*6,9+Math.sin(a)*6,'k'); } artCircle(g,7.5,8,1.4,'a'); artRect(g,1,14,14,15,'t'); },
  flames(g){ artRect(g,0,13,15,15,'k'); artPoly(g,[[2,13],[4,4],[6,13]],'m'); artPoly(g,[[6,13],[8,2],[11,13]],'m'); artPoly(g,[[10,13],[12,6],[14,13]],'m'); artPoly(g,[[7,13],[8,7],[9,13]],'a'); artPoly(g,[[3,13],[4,9],[5,13]],'a'); },
  crystal(g){ artPoly(g,[[7.5,1],[11,7],[7.5,14],[4,7]],'w'); artPoly(g,[[3,6],[5,9],[3,13],[1,9]],'m'); artPoly(g,[[12,5],[14,8],[12,12],[10,8]],'m'); artLine(g,7.5,2,7.5,13,'a',1); },
  vine(g){ for(let y=1;y<15;y++) artPx(g,7.5+Math.sin(y*.7)*3,y,'m'); for(let y=1;y<15;y++) artPx(g,8.5+Math.sin(y*.7)*3,y,'m'); for(let y=2;y<14;y+=3){ const x=7.5+Math.sin(y*.7)*3; artPx(g,x-2,y,'w'); artPx(g,x+3,y+1,'w'); } artCircle(g,4,4,1.5,'a'); },
  crack(g){ artRect(g,0,8,15,15,'m'); artLine(g,7,8,5,11,'k',1); artLine(g,5,11,8,13,'k',1); artLine(g,8,13,6,15,'k',1); artLine(g,7,8,11,11,'k',1); artPoly(g,[[2,8],[4,5],[5,8]],'m'); artPoly(g,[[10,8],[12,6],[13,8]],'m'); },
  turret(g){ artRect(g,3,11,12,14,'g'); artCircle(g,7.5,9,3.6,'m'); artLine(g,9,8,15,5,'k',2); artPx(g,6,7,'w'); },
  repeater(g){ artRect(g,3,11,12,14,'g'); artCircle(g,6.5,9,3.2,'m'); for(const dy of [-1,1,3]) artLine(g,8,8+dy,15,6+dy,'k',1); artPx(g,5,7,'w'); },
  mortar(g){ artRect(g,2,12,13,14,'g'); artPoly(g,[[4,12],[7,4],[12,6],[10,12]],'m'); artRect(g,6,3,10,4,'k'); artPx(g,6,8,'w'); },
  plate(g){ artRect(g,2,2,13,14,'g'); for(const [x,y] of [[4,4],[11,4],[4,12],[11,12],[7,8],[8,8]]) artPx(g,x,y,'k'); artRect(g,2,8,13,8,'k'); },
  crown(g){ artPoly(g,[[2,12],[2,5],[5,8],[7.5,3],[10,8],[13,5],[13,12]],'a'); artRect(g,2,12,13,13,'a'); artPx(g,5,11,'m'); artPx(g,7,10,'m'); artPx(g,8,10,'m'); artPx(g,10,11,'m'); },
  eye(g){ artPoly(g,[[1,8],[7.5,3],[14,8],[7.5,13]],'w'); artCircle(g,7.5,8,2.8,'m'); artCircle(g,7.5,8,1.2,'k'); artPx(g,6,7,'w'); },
  sigil(g){ artRing(g,7.5,7.5,6,'a'); artPoly(g,[[7.5,2],[12,11],[3,11]],'m'); artPoly(g,[[7.5,5],[10,10],[5,10]],'k'); },
  // creatures for summons, picked by the name's creature word
  ears(g){ MOTIF.blob(g); artPoly(g,[[3,6],[4,1],[7,5]],'m'); artPoly(g,[[12,6],[11,1],[8,5]],'m'); },
  beak(g){ MOTIF.blob(g); artPoly(g,[[6,9],[9,9],[7.5,12]],'a'); },
  helmet(g){ artRect(g,4,3,11,13,'g'); artRect(g,4,7,11,8,'k'); artPx(g,6,7,'a'); artPx(g,9,7,'a'); artPoly(g,[[7,3],[8,3],[7.5,0]],'m'); },
  block(g){ artRect(g,3,3,12,13,'m'); artRect(g,5,6,6,7,'a'); artRect(g,9,6,10,7,'a'); artRect(g,5,10,10,11,'k'); },
  horns(g){ MOTIF.blob(g); artPoly(g,[[4,5],[2,1],[6,4]],'w'); artPoly(g,[[11,5],[13,1],[9,4]],'w'); },
  batwing(g){ artPoly(g,[[0,5],[5,7],[4,11]],'m'); artPoly(g,[[15,5],[10,7],[11,11]],'m'); artCircle(g,7.5,8,3.2,'m'); artPx(g,6,7,'a'); artPx(g,9,7,'a'); },
  coil(g){ artRing(g,7.5,10,4,'m'); artRing(g,7.5,10,3,'m'); artCircle(g,11,4,2.4,'m'); artPx(g,12,3,'a'); },
  blob(g){ artCircle(g,7.5,8.5,5.2,'m'); artPx(g,5,8,'w'); artPx(g,10,8,'w'); artPx(g,5,7,'k'); artPx(g,10,7,'k'); },
};
const CREATURE={Wolf:'ears',Hound:'ears',Fox:'ears',Bear:'ears',Boar:'ears',Rat:'ears',Owl:'beak',Hawk:'beak',Knight:'helmet',Squire:'helmet',
  Golem:'block',Ogre:'block',Imp:'horns',Sprite:'horns',Bat:'batwing',Beetle:'batwing',Serpent:'coil',Toad:'blob',Spirit:'blob',Mole:'blob'};
function motifKey(c){
  const k=c.type==='piece'?'piece':c.type;
  switch(k){
    case 'strike': return {line:'arrow',row:'beam',wedge:'fan',all:'burst',missiles:'orbs',dig:'drill',zigzag:'zigzag',diag:'cross'}[c.shape]||'arrow';
    case 'lob': return 'bomb';
    case 'ward': return c.ward==='barrier'?'shield':c.ward==='thorns'?'thorns':'wall';
    case 'sentry': return 'tower';
    case 'boon': return {heal:'heart',regen:'heart',power:'sword',courage:'sword',pact:'skull',haste:'wing',dodge:'wing',phase:'swirl',gauge:'hourglass',intervene:'halo'}[c.boon]||'heart';
    case 'charge': return 'flask';
    case 'utility': return c.util==='copy'?'cards':'scroll';
    case 'trap': return {spike:'jaw',snare:'snare',blast:'mine'}[c.trap];
    case 'environment': return {burn:'flames',freeze:'crystal',bramble:'vine',tremor:'crack'}[c.env];
    case 'summon': { const w=Object.keys(CREATURE).find(n=>c.name.includes(n)); return CREATURE[w]||'blob'; }
    case 'machine': return {turret:'turret',repeater:'repeater',mortar:'mortar',bulwark:'plate'}[c.ai];
    case 'piece': return c.name.startsWith('Crown')?'crown':c.name.startsWith('Heart')?'heart':c.name.startsWith('Eye')?'eye':'sigil';
  }
  return 'blob';
}
const MIRROR_OK=new Set(['arrow','fan','drill','zigzag','bomb','wing','flask','turret','repeater','mortar','vine','coil','flames','crack','snare','mine','orbs']);

/* ---------------- painting ---------------- */
function artRng(id){ let h=2166136261; for(const ch of 'art:'+id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } let a=h>>>0;
  return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function artMix(a,b,t){ const p=parseInt(a.slice(1),16), q=parseInt(b.slice(1),16);
  const ch=s=>Math.round(((p>>s)&255)*(1-t)+((q>>s)&255)*t); return '#'+[16,8,0].map(s=>ch(s).toString(16).padStart(2,'0')).join(''); }
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];

const ART_CACHE={};
function cardArt(c){
  if(ART_CACHE[c.id]) return ART_CACHE[c.id];
  const rng=artRng(c.id), pal=ART_PAL[c.color], key=motifKey(c);
  const g=Array.from({length:ART_SIZE},()=>Array(ART_SIZE).fill(null));
  MOTIF[key](g);
  if(MIRROR_OK.has(key)&&rng()<.5) g.forEach(row=>row.reverse());
  // some cards swap their main and accent colors for variety
  const swap=rng()<.25, ramps={m:swap?pal.a:pal.m, a:swap?pal.m:pal.a, ...ART_MAT};
  const out=Array.from({length:ART_SIZE},()=>Array(ART_SIZE).fill(null)), filled=(x,y)=>y>=0&&y<ART_SIZE&&x>=0&&x<ART_SIZE&&g[y][x];
  for(let y=0;y<ART_SIZE;y++) for(let x=0;x<ART_SIZE;x++){ const m=g[y][x]; if(!m) continue;
    // light from the top left: top edges lit, bottom and right edges shaded
    const r=ramps[m], shade=filled(x,y-1)!==m?2:(filled(x,y+1)!==m||filled(x+1,y)!==m)?0:1; out[y][x]=r[shade]; }
  // background: a dithered top-to-bottom gradient with a few sparkles
  const spark=new Set(); for(let i=0;i<3;i++) spark.add(Math.floor(rng()*ART_SIZE)+','+Math.floor(rng()*ART_SIZE));
  for(let y=0;y<ART_SIZE;y++) for(let x=0;x<ART_SIZE;x++){ if(out[y][x]) continue;
    const edge=[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>filled(x+dx,y+dy));
    if(edge){ out[y][x]=pal.o; continue; }
    const t=y/(ART_SIZE-1), bg=(BAYER[y%4][x%4]/16)<t?pal.bg[1]:pal.bg[0];
    out[y][x]=spark.has(x+','+y)?artMix(bg,pal.m[2],.35):bg; }
  // rarity frame: gold for legendary, silver for rare
  const frame=c.rarity==='legendary'?['#ffd84d','#b08a2a']:c.rarity==='rare'?['#c8c4d4','#6a6478']:null;
  if(frame) for(let i=0;i<ART_SIZE;i++) for(const [x,y] of [[i,0],[i,ART_SIZE-1],[0,i],[ART_SIZE-1,i]]) out[y][x]=frame[(x+y)%2];
  return ART_CACHE[c.id]=out;
}
function artCSV(c){ return cardArt(c).map(row=>row.join(',')).join('\n')+'\n'; }

// in the browser: a data URL of the picture, drawn once per card
const ART_URL={};
function artURL(c){
  if(ART_URL[c.id]) return ART_URL[c.id];
  const cv=document.createElement('canvas'); cv.width=cv.height=ART_SIZE; const ctx=cv.getContext('2d');
  cardArt(c).forEach((row,y)=>row.forEach((col,x)=>{ ctx.fillStyle=col; ctx.fillRect(x,y,1,1); }));
  return ART_URL[c.id]=cv.toDataURL();
}

if(typeof module!=='undefined') module.exports={ART_SIZE,cardArt,artCSV,motifKey};
