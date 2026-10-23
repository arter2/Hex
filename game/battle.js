/* Hexmancers deck prototype — real-time battle on a 7 x 12 hex board, drawn with an
   orthographic isometric projection on a 2D canvas. Your side is the six columns
   nearest you, the enemy side the six across from you. A turn ends each time the
   Custom screen opens; shields and everything cards put on the board last a set
   time of fighting (10 s per "turn" on the card) or until their HP runs out. */

const SQ3=Math.sqrt(3), TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- board ---------------- */
let BOARD_ROWS=7, BOARD_COLS=12;   // every real fight is 7 x 12; only the Movement lab changes them (BOARD_TEST)
const DIRS={E:[1,0],NE:[1,-1],NW:[0,-1],W:[-1,0],SW:[-1,1],SE:[0,1]}, DIRLIST=Object.values(DIRS);
/* TEST ONLY: the Movement lab (movelab.js) can build a board of another size, or of squares, to try how
   walking feels. BOARD_TEST is null for every real fight, which is always 12 x 7 hexes. Squares touch
   their 8 neighbours, distance counts a diagonal step as 1, and the hex shapes are drawn as squares. */
let BOARD_TEST=null, SQUARE=false; const SQS=1.5;   // a square's side, in board units
const SQ_NB=[[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1]];
// a tile's corners as offsets on the board (wx, wz), going round: a hex's six, or a square's four
function tileCornerOffs(rad){ if(SQUARE){ const h=rad*SQS/2; return [[h,h],[-h,h],[-h,-h],[h,-h]]; }
  const out=[]; for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; out.push([Math.cos(a)*rad,Math.sin(a)*rad]); } return out; }
// The arrays below are rebuilt in place by buildBoard, so references to them stay valid.
const BOARD=new Map(), CR=new Map(), TILES=[], P_TILES=[], E_TILES=[]; let P_RECT=null;   // your half's standing box (pRect)
function buildBoard(){
  BOARD.clear(); CR.clear(); TILES.length=0; P_TILES.length=0; E_TILES.length=0; P_RECT=null;
  const L=BOARD_TEST; SQUARE=!!(L&&L.square); BOARD_ROWS=L?L.rows:7; BOARD_COLS=L?L.cols*2:12; Object.assign(DIRS,SQUARE?{NE:[1,-1],NW:[0,-1],SW:[0,1],SE:[1,1]}:{NE:[1,-1],NW:[0,-1],SW:[-1,1],SE:[0,1]}); DIRLIST.splice(0,6,...Object.values(DIRS));
  if(SQUARE){ for(let r=0;r<BOARD_ROWS;r++) for(let c=0;c<BOARD_COLS;c++){ const x=c-(BOARD_COLS-1)/2, side=c<BOARD_COLS/2?'p':'e';
      const t={q:c,r,col:c,x,side,wx:SQS*x,wz:SQS*(r-(BOARD_ROWS-1)/2),key:c+','+r,occ:null,flash:0,flashC:'#fff'};
      BOARD.set(t.key,t); CR.set(c+','+r,t); TILES.push(t); (side==='p'?P_TILES:E_TILES).push(t); }
    return; }
  for(let r=0;r<BOARD_ROWS;r++) for(let c=0;c<BOARD_COLS;c++){
    // odd rows are offset by half a tile; q is the axial column so a row keeps one r
    const q=c-Math.floor(r/2), x=c+(r%2)*.5-(BOARD_COLS-.5)/2, side=c<BOARD_COLS/2?'p':'e';
    const t={q,r,col:c,x,side,wx:SQ3*x,wz:1.5*(r-(BOARD_ROWS-1)/2),key:q+','+r,occ:null,flash:0,flashC:'#fff'};
    BOARD.set(t.key,t); CR.set(c+','+r,t); TILES.push(t); (side==='p'?P_TILES:E_TILES).push(t);
  }
}
buildBoard();
const tileAt=(q,r)=>BOARD.get(q+','+r);
const tileCR=(c,r)=>CR.get(c+','+r);   // by board column and row
// Floor patterns for lobs, environments and traps, kept to one side of the board.
function patternTiles(t,pat,side){
  let ts;
  switch(pat){
    case 'burst': ts=[t,...around(t)]; break;
    case 'ring': ts=around(t); break;
    case 'cross': ts=TILES.filter(x=>(x.r===t.r&&Math.abs(x.col-t.col)<=2)||(x.col===t.col&&Math.abs(x.r-t.r)<=2)); break;
    case 'column': ts=TILES.filter(x=>x.col===t.col); break;
    case 'row': ts=TILES.filter(x=>x.r===t.r); break;
    default: ts=[t];
  }
  return side?ts.filter(x=>x.side===side):ts;
}
const neighbors=t=>(SQUARE?SQ_NB:DIRLIST).map(d=>tileAt(t.q+d[0],t.r+d[1])).filter(Boolean);
const around=neighbors;   // area effects hit the 6 surrounding tiles
const hexDist=(a,b)=>{ const dq=a.q-b.q, dr=a.r-b.r; if(SQUARE) return Math.max(Math.abs(dq),Math.abs(dr)); return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2; };
// a diagonal shot: forward a column each step, bouncing off the top and bottom rows (a straight
// diagonal ran off the 7-row board before it reached most of the enemy side)
function diagPath(t,d){ const out=[]; let r=t.r; for(let i=1;t.col+i<BOARD_COLS;i++){ if(r+d<0||r+d>=BOARD_ROWS) d=-d; r+=d; const n=tileCR(t.col+i,r); if(n) out.push(n); } return out; }
function lineTiles(t,d){ const out=[]; let q=t.q,r=t.r; for(;;){ q+=d[0]; r+=d[1]; const n=tileAt(q,r); if(!n) break; out.push(n); } return out; }
function wedgeTiles(t,len){ return TILES.filter(o=>{ const dx=o.wx-t.wx, dz=o.wz-t.wz; return dx>.1 && Math.hypot(dx,dz)<=len*SQ3 && Math.abs(dz)<=dx*1.2; }); }
/* A shortest walk over free tiles on your side. On a hex board there are often many equally short
   walks, and a plain search picks any of them, so the mage veered off and back. Of the shortest
   walks this takes the one that stays closest to the straight line from start to goal. */
function pathTo(from,to){
  if(to.side!=='p'||to.occ||to===from) return [];
  const free=n=>n.side==='p'&&!(n.holeT>0)&&(!n.occ||n===from);
  const dist=new Map([[to,0]]), q=[to];   // steps to the goal, counted back from it
  while(q.length){ const c=q.shift(); if(c===from) break;
    for(const n of neighbors(c)) if(!dist.has(n)&&free(n)){ dist.set(n,dist.get(c)+1); q.push(n); } }
  if(!dist.has(from)) return [];
  const ax=from.wx, az=from.wz, dx=to.wx-ax, dz=to.wz-az, L=Math.hypot(dx,dz)||1;
  const off=t=>Math.abs((t.wx-ax)*dz-(t.wz-az)*dx)/L;   // how far a tile is from the line
  const path=[]; let c=from;
  while(c!==to){ const k=dist.get(c)-1; let best=null;
    for(const n of neighbors(c)) if(dist.get(n)===k&&(!best||off(n)<off(best)-1e-6)) best=n;
    path.push(best); c=best; }
  return path;
}

/* enemies, encounters and terrain live in enemies.js */

/* The whole game can be turned a quarter (Settings › Orientation) when the browser will not lock
   the screen: then on-screen boxes and pointer positions are turned back into the game's own frame. */
const appRot=()=>typeof document!=='undefined'&&!!document.getElementById('app')&&document.getElementById('app').classList.contains('rot');
function appBox(el){ const r=el.getBoundingClientRect(); if(!appRot()) return r; const W=innerWidth; return {left:r.top, top:W-r.right, width:r.height, height:r.width, right:r.bottom, bottom:W-r.left}; }
const appXY=(x,y)=>appRot()?[y,innerWidth-x]:[x,y];

/* ---------------- state ---------------- */
let B=null;
const GAUGE_MAX=10;

function startBattle(list,depth,hooks,opts){
  buildBoard();
  const p={kind:'player', hp:120, maxHp:120, tile:P_TILES.find(t=>t.col===1&&t.r===(BOARD_ROWS>>1)), path:[], moveCd:0, castCd:0, wandCd:0, charging:false, chargeT:0,
           barrier:0, shieldT:0, hurtT:0, invT:0, dodge:false, powerT:0, setT:0, pactT:0, courageT:0, intervene:0, hasteT:0, regenT:0, regenAmt:0, hero:null};
  p.tile.occ=p;
  B={depth, hooks:hooks||{}, piles:createPiles(list), player:p, aim:null, enemies:[], allies:[], walls:[], shots:[], lobs:[], shocks:[], teles:[], fx:[], floaters:[], parts:[],
     timers:[], gauge:0, phase:'custom', time:0, log:[]};
  B.waves=(opts&&opts.waves)||makeEncounter(depth); B.wave=0;
  makeTerrain(depth);
  if(typeof arRuleInit==='function') arRuleInit(depth);   // the area's own rule (arearules.js)
  spawnWave(0);
  if(opts&&opts.prepare) opts.prepare(B.piles);
  soulInit(opts&&opts.soul);
  applyGear(p,opts&&opts.gear); p.look=opts&&opts.look; B.piles.surgeLuck=(opts&&opts.gear&&opts.gear.surge)||0;
  // fights that start on the overworld carry your wounds in, and how the fight began matters:
  // catching a sleeping enemy holds its first attacks back; being caught off guard lets it strike first
  if(opts&&opts.hp!=null) p.hp=Math.max(1,Math.min(p.maxHp,opts.hp));
  // a threat tier (deepways.js): foes the stirring dark sent, or a perilous way, are tougher and pay more
  B.tier=opts&&opts.tier||0; if(B.tier) B.enemies.forEach(e=>{ const k=1+.18*B.tier; e.hp=e.maxHp=Math.round(e.maxHp*k); e.dmg=Math.round(e.dmg*(1+.1*B.tier)); });
  B.opening=opts&&opts.opening||null;
  // a trial's rule (minibosses.js): fight in order, survive, or light the switches
  B.rule=opts&&opts.rule?Object.assign({},opts.rule):null; if(B.rule&&typeof ruleSetup==='function') ruleSetup(B.rule);
  // First Strike from the map: every enemy opens hurt (15%), stunned and slow to act
  if(B.opening==='strike') B.enemies.forEach(e=>{ const d=Math.max(8,Math.round(e.maxHp*.15)); e.hp=Math.max(1,e.hp-d); e.atkT+=3; e.stunT=Math.max(e.stunT,2); later(.5,()=>{ floater('-'+d,e.tile,'#ffe24d',true); burst(e.tile,'#ffffff',12,1); }); });
  if(B.opening==='ambush') B.enemies.forEach(e=>{ e.atkT+=3.5; e.stunT=Math.max(e.stunT,1.5); });
  if(B.opening==='surprised') B.enemies.forEach(e=>{ e.atkT=rnd(.4,.9); });
  openCustomScreen();
  return B;
}

// Your equipped weapon and armor (see gear.js): wand damage, speed and element, max HP, damage
// taken off every hit, a starting shield, and any curse's drawback.
function applyGear(p,m){
  m=Object.assign({tap:0,charged:0,cd:1,charge:1,hp:0,guard:0,shield:0,kind:'wand'},m||{});
  const K=(typeof WEAPON_KINDS!=='undefined'&&WEAPON_KINDS[m.kind])||{tap:3,charged:7,cd:.3,ccd:.5};
  p.wand={kind:m.kind, tap:Math.max(1,K.tap+m.tap), charged:Math.max(2,K.charged+m.charged), cd:K.cd*m.cd, ccd:K.ccd*m.cd, charge:.9*m.charge, color:m.color||null,
    chill:m.chill||0, zap:m.zap||0, drain:m.drain||0, glow:m.glow||0, burn:m.burn||0, misfire:m.misfire||0, hpPerShot:m.hpPerShot||0};
  p.guard=m.guard; p.slow=m.slow||1; p.hurt=m.hurt||1; p.gaugeMult=(m.gauge||1)*(m.sGauge||1);
  p.wand.mult=m.shotMult||1; p.shotSpeed=m.shotSpeed||1; p.spell=m.spell||1;
  p.dodgeChance=m.dodge||0; p.block=m.block||0; p.blocksLeft=p.block; p.counter=m.counter||0; p.regenGear=m.regen||0; p.castSlow=(m.castSlow||1)*(m.sCast||1); p.power=m.power||{};
  p.maxHp+=m.hp; p.hp=p.maxHp;
  if(m.shield){ p.barrier=m.shield; p.shieldT=secs(2); }
}
const alive=()=>B.enemies.filter(e=>e.hp>0);
// a boss with an impact animation (sprites_pal.js) bursts its rock where it lands
// effect frames are drawn at the same scale as the boss's body (pal_sprites.py: like), so they are sized like it
const palH=(S,id,sc)=>S*2.7*(sc||((ENEMY_DEFS[id]||{}).scale)||1)*((PAL_SPRITES[id]&&PAL_SPRITES[id].zoom)||1);
const lightShot=s=>typeof palHas==='function'&&palHas('golem','shard')&&!(s.owner&&palHas(s.owner.id,'rock')&&!(s.owner.phase>=2))&&(s.card?s.card.color==='light':!!(s.owner&&s.owner.color==='light'));
function palImpact(e,t,s){ if(s&&lightShot(s)&&t){ B.fx.push({kind:'palfx',id:'golem',anim:'shardHit',a:t,t:0,life:4/14}); return; } if(e&&t&&!(e.phase>=2)&&typeof palHas==='function'&&palHas(e.id,'impact')) B.fx.push({kind:'palfx',id:e.id,anim:'impact',a:t,t:0,life:8/14}); }
function later(sec,fn){ B.timers.push({t:sec,fn}); }
// units slide between tiles instead of jumping
const INTENT_ICON={hex:'☾',summon:'☠',shift:'⟳',collect:'🂠',brew:'⚗',snare:'❦',revive:'✝',bless:'✦',lunge:'⚔',steal:'✋',snipe:'◎',guard:'🛡',cleave:'⚔',bomb:'💣',shot:'➶',firebomb:'🔥',iceslam:'❄',cross:'✚',rush:'➤',blink:'☾',mend:'✚',quake:'⚠',boulders:'●'};
const posOf=u=>[u.rx??u.tile.wx, u.rz??u.tile.wz];
function shake(a){ View.shake=Math.max(View.shake||0,a); }
function floater(text,t,color,big){ B.floaters.push({text,wx:t.wx,wz:t.wz,y:1.6,t:0,color:color||'#fff',big}); }
function flash(t,color,amt){ t.flash=Math.max(t.flash,amt||1); t.flashC=color; }
/* Particle shapes: square chips (default), 'glow' soft additive dots, 'shard' spinning ice splinters,
   'spark' streaks along their motion, 'ember' rising flickers, 'leaf' tumbling petals, 'ring' a ground shockwave. */
function drawPart(ctx,q){
  const k=q.t/q.life, [x,y]=proj(q.wx,q.y,q.wz), S=scaleAt(q.wx,q.wz)/20, sz=(q.s||4)*S*(q.shrink?1-k:1);
  ctx.globalAlpha=Math.max(0,1-k); ctx.globalCompositeOperation=q.add?'lighter':'source-over'; ctx.fillStyle=ctx.strokeStyle=q.color;
  switch(q.shape){
    case 'glow': { const g=ctx.createRadialGradient(x,y,0,x,y,sz); g.addColorStop(0,q.color); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,sz,0,TAU); ctx.fill(); break; }
    case 'shard': ctx.save(); ctx.translate(x,y); ctx.rotate(q.rot||0); ctx.beginPath(); ctx.moveTo(0,-sz*1.6); ctx.lineTo(sz*.45,0); ctx.lineTo(0,sz*1.6); ctx.lineTo(-sz*.45,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#fff'; ctx.globalAlpha*=.7; ctx.fillRect(-sz*.12,-sz*1.1,sz*.24,sz*.9); ctx.restore(); break;
    case 'spark': { const [x2,y2]=proj(q.wx-q.vx*.05,q.y-q.vy*.05,q.wz-q.vz*.05); ctx.lineWidth=Math.max(1,sz*.5); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x,y); ctx.stroke(); break; }
    case 'ember': ctx.globalAlpha*=.6+.4*Math.sin(q.t*30+q.wx*9); ctx.fillRect(x-sz/2,y-sz/2,sz,sz); break;
    case 'leaf': ctx.save(); ctx.translate(x,y); ctx.rotate(q.rot||0); ctx.beginPath(); ctx.ellipse(0,0,sz,sz*.45,0,0,TAU); ctx.fill(); ctx.restore(); break;
    case 'ring': { const r=(q.r0+(q.r1-q.r0)*(1-(1-k)*(1-k)))*S*20; ctx.lineWidth=Math.max(1,(q.s||6)*S*(1-k)); ctx.beginPath(); ctx.ellipse(x,y,r,r*View.iy,0,0,TAU); ctx.stroke(); break; }
    default: ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
  }
}
// n particles of one kind from a tile; o sets shape, color(s), speed, rise, gravity, life and size.
function spray(t,n,o){ const cs=[].concat(o.color);
  for(let i=0;i<n;i++){ const a=rnd(0,TAU), v=rnd(o.v0==null?1:o.v0,o.v||3);
    B.parts.push({wx:t.wx+rnd(-.15,.15),wz:t.wz+rnd(-.15,.15),y:o.y==null?.9:o.y+rnd(-.2,.2),vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:rnd(o.up0==null?1:o.up0,o.up==null?3:o.up),
      g:o.g,drag:o.drag,t:0,life:rnd((o.life||.7)*.6,o.life||.7),color:cs[i%cs.length],shape:o.shape,s:rnd((o.s||4)*.6,o.s||4),add:o.add,shrink:o.shrink,rot:rnd(0,TAU),spin:o.spin?rnd(-o.spin,o.spin):0}); } }
function ring(t,color,r1,life,s){ B.parts.push({wx:t.wx,wz:t.wz,y:.05,vx:0,vz:0,vy:0,g:0,t:0,life:life||.45,color,shape:'ring',r0:.1,r1:r1||1,s:s||6,add:true}); }
function burst(t,color,n,y){ for(let i=0;i<(n||10);i++) B.parts.push({wx:t.wx,wz:t.wz,y:y||.8,vx:rnd(-2,2),vz:rnd(-2,2),vy:rnd(1,3.5),t:0,life:rnd(.4,.8),color}); }
function colorOf(card){ return card&&card.color?COLORS[card.color].c:'#e6f4ff'; }

/* ---------------- custom screen ---------------- */
function openCustomScreen(){
  const b=B; if(!b||b.phase==='win'||b.phase==='lose') return;
  if(b.turn!=null) endTurn(); b.turn=(b.turn==null?0:b.turn+1);
  b.phase='custom'; b.player.charging=false; b.player.path=[]; if(b.player.step&&!b.player.step.half) b.player.step=null;
  b.justDrawn=new Set(openCustom(b.piles).map(c=>c.uid));
  if(typeof curseSlot==='function') curseSlot(b);   // a cursed idol's hex takes a slot (puzzles.js)
  b.hooks.onCustom&&b.hooks.onCustom();
}
function closeCustomScreen(){
  const b=B; if(!b||b.phase!=='custom') return;
  const pl=b.piles, unused=pl.queue.filter(c=>isDeckTool(c.card));   // a deck tool left in a slot unused goes back to the hand
  if(unused.length){ pl.queue=pl.queue.filter(c=>!unused.includes(c)); pl.hand.push(...unused); }
  commitCustom(b.piles); b.phase='fight'; b.gauge=0;
  for(const cb of b.piles.combos||[]) if(cb.kind==='run'){ const p=b.player; p.hasteT=Math.max(p.hasteT,cb.dur); p.courageT=Math.max(p.courageT,cb.dur); }   // Rune Run
  for(const cb of b.piles.combos||[]) if(cb.kind==='set'){ const p=b.player; p.setT=Math.max(p.setT||0,cb.dur); }   // Rune Set: wand ×2.5 (a Power boon is ×1.8)
  if(b.turn>0&&b.hooks.onTurn) b.hooks.onTurn(b.turn+1);
  for(const cb of b.piles.combos||[]){ if(cb.kind==='recipe'){ b.hooks.onRecipe&&b.hooks.onRecipe(cb.recipe); continue; } if(cb.kind!=='straight') b.hooks.onCombo&&b.hooks.onCombo(cb.label); }
  b.hooks.onFight&&b.hooks.onFight();
}
const gaugeFull=()=>B.gauge>=GAUGE_MAX;

/* ---------------- damage ---------------- */
function hitEnemy(e,base,card,opts){
  if(!e||e.hp<=0) return 0;
  opts=opts||{};
  if(e.def.bossId&&typeof bossHit==='function'){ const r=bossHit(e,card,base); if(r!==null) return r; }
  const pl=B.player;
  let mult=opts.raw?1:bossMult(card&&card.color,e)*(e.curseT>0?1.3:1)*(pl.pactT>0||pl.courageT>0?1.3:1)*(card&&card.valor&&pl.hp<=pl.maxHp/2?1.5:1)*heroMult(card)*(e.radiantT>B.time&&!opts.raw?1.15:1)*(onLand('flood')&&!opts.raw?1.2:1)*((card&&pl.power&&pl.power[card.color])||1);
  // Counter Hit (Battle Network): a card that lands while the enemy winds up, casts or has an attack
  // marked on the board does double damage, stuns it and cancels the attack.
  const counter=!opts.raw&&card&&card.id!=='wand'&&e.hp>0&&!(e.stunT>0)&&!(e.freezeT>0)&&(e.windT>0||!!e.casting||B.teles.some(t=>t.owner===e&&!t.friendly)||(typeof inCounterWindow==='function'&&inCounterWindow(e)));   // or while its attack bar flashes (reading.js)
  const weak=mult>=WEAK_MULT; if(counter) mult*=2;
  const crit=!opts.raw&&card&&card.crit&&Math.random()<card.crit; if(crit) mult*=2;   // a strike's Crit rider
  if(weak&&!opts.raw&&typeof bountyWeak==='function') bountyWeak(e);
  if(weak&&!opts.raw) B.hitStop=Math.max(B.hitStop||0,.045);
  if(card&&!opts.raw&&card.id!=='wand'&&card.id!=='unison') chainHit();
  const resisted=!opts.raw&&card&&e.resist&&card.color===e.resist&&!e.reflect;
  let dmg=Math.max(1,Math.round(base*mult));
  if(counter) counterHit(e);
  if(e.barrier>0&&!opts.raw&&!opts.dig){ const a=Math.min(e.barrier,dmg); e.barrier-=a; dmg-=a; if(!dmg){ floater('🛡',e.tile,'#fff0b3'); return 0; } }
  e.hp-=dmg; e.hitT=.18; if(typeof palPlay==='function') palPlay(e,'hurt'); if(dmg>=40||weak) shake(dmg>=60?5:3);
  floater(dmg+(crit?' CRIT!':weak?' WEAK!':resisted?' resist':''),e.tile,counter?'#ff8fa3':crit?'#ffb347':weak?'#ffe24d':opts.raw?'#b8ffb0':'#fff',weak||counter||crit);
  flash(e.tile,colorOf(card),.8);
  if(card&&!opts.raw) applyStatus(e,card);
  if(card&&!opts.raw) react(e,card,base);
  if(card&&!opts.raw&&!opts.noShove) shove(e,card,base);
  if(card&&card.drain&&!opts.raw) healPlayer(Math.round(dmg*card.drain));
  if(card&&card.mend&&!opts.raw) healPlayer(card.mend);
  if(heroOn('widow')&&!opts.raw) healPlayer(Math.round(dmg*.2),true);
  if(heroAura('drain')&&!opts.raw) healPlayer(Math.round(dmg*heroAura('drain')),true);
  if(onLand('swamp')&&!opts.raw) healPlayer(Math.round(dmg*.1),true);
  if(typeof rareHit==='function') rareHit(e,dmg);
  if(e.hp<=0) killEnemy(e);
  if(e.hp<=0&&card&&card.onkill&&!opts.raw){ B.gauge=Math.min(GAUGE_MAX,B.gauge+card.onkill*GAUGE_MAX); floater('Reaper +gauge',B.player.tile,'#e0588f'); }   // a strike's Reaper rider
  return dmg;
}
/* Reactions: a colored hit leaves its element on the enemy for 6 s. Hitting it with the
   partner color sets the pair off and uses the mark up, so the order of your casts is the plan. */
const REACTIONS={
  'fire+frost':   {name:'Shatter',  c:'#bfefff'},  // big burst, more if it is frozen
  'frost+storm':  {name:'Conduct',  c:'#ffe24d'},  // arcs to enemies within 2 hexes and stuns them
  'fire+verdant': {name:'Wildfire', c:'#ff6a3d'},  // burns it, its neighbors and their tiles
  'light+shadow': {name:'Eclipse',  c:'#e0588f'},  // pierces barriers and curses
  'storm+verdant':{name:'Thornbind',c:'#6fdc7a'},  // roots it in place: long stun, attack cancelled
  'frost+verdant':{name:'Rimebind', c:'#9fd0ff'},  // freezes it and everything next to it
};
const MARK_T=6;
// Each reaction's own particles: a bright core, a shockwave, then its element.
function reactFx(name,t){
  const R=REACTIONS[Object.keys(REACTIONS).find(k=>REACTIONS[k].name===name)];
  spray(t,6,{shape:'glow',color:R.c,v0:0,v:.6,up0:0,up:.6,g:0,life:.35,s:22,add:true,shrink:1});
  ring(t,R.c,1.4,.45,7);
  switch(name){
    case 'Shatter': spray(t,26,{shape:'shard',color:['#e8fbff','#9fe6ff','#6fd6ff'],v0:2,v:5.5,up0:1,up:4,g:7,drag:1.2,life:.9,s:7,spin:14}); spray(t,14,{shape:'spark',color:'#ffffff',v0:3,v:7,up:3,g:0,drag:3,life:.3,s:3,add:true}); ring(t,'#ffffff',.9,.3,4); break;
    case 'Conduct': spray(t,30,{shape:'spark',color:['#fff6a8','#ffe24d','#ffffff'],v0:3,v:9,up0:-1,up:4,g:0,drag:4,life:.35,s:3,add:true}); spray(t,10,{shape:'glow',color:'#ffe24d',v:2,up:2,g:0,life:.5,s:8,add:true}); break;
    case 'Wildfire': spray(t,34,{shape:'ember',color:['#ffd27a','#ff9a3d','#ff6a3d','#d8401f'],v0:.3,v:2.2,up0:1.5,up:4,g:-2,drag:1.5,life:1.1,s:5,shrink:1,add:true}); spray(t,8,{shape:'glow',color:'#ff6a3d',v:1.5,up:2,g:-1,life:.7,s:14,add:true,shrink:1}); break;
    case 'Eclipse': spray(t,22,{shape:'glow',color:['#e0588f','#7a2a8f','#fff0b3'],v0:2,v:4,up0:-.5,up:1,g:0,drag:2.5,life:.7,s:9,add:true,shrink:1}); ring(t,'#fff0b3',.6,.6,3); ring(t,'#7a2a8f',1.9,.7,9); break;
    case 'Thornbind': spray(t,24,{shape:'leaf',color:['#6fdc7a','#3fa856','#b6f59a'],v0:.5,v:2.5,up0:2,up:4.5,g:5,drag:1,life:1,s:6,spin:8}); spray(t,10,{shape:'spark',color:'#ffe24d',v0:2,v:5,g:0,drag:3,life:.3,s:2,add:true}); break;
    case 'Rimebind': spray(t,20,{shape:'shard',color:['#ffffff','#bfefff','#6fdc7a'],v0:.5,v:2.5,up0:.5,up:2,g:3,drag:1.5,life:.9,s:5,spin:6}); spray(t,16,{shape:'glow',color:'#bfefff',v:1.5,up0:-.2,up:.5,g:0,drag:1,life:.9,s:7,add:true,shrink:1}); break;
  }
}
// The reaction this color would set off on some marked enemy, if any (lights up queued cards).
const reactWith=c=>{ for(const e of alive()) if(e.markT>0&&e.mark&&e.mark!==c){ const r=REACTIONS[[e.mark,c].sort().join('+')]; if(r) return r; } return null; };
function react(e,card,base,fromGround){
  const c=card.color; if(!SIX.includes(c)) return;
  const m=e.markT>0?e.mark:null;
  const rx=m&&m!==c?REACTIONS[[m,c].sort().join('+')]:null;
  if(!rx){ e.mark=c; e.markT=MARK_T; if(!fromGround) stain(e.tile,c); return; }
  e.mark=null; e.markT=0; e.tile.gT=0;
  const sc=B.soul&&B.soul.card.color; if(sc===m||sc===c){ base=Math.round(base*1.3); } soulGain(sc===m||sc===c?25:12);   // the Soul feeds on its own element's reactions
  const t=e.tile, near=r=>alive().filter(o=>o!==e&&hexDist(o.tile,t)<=r);
  floater(rx.name+'!',t,rx.c,true); flash(t,rx.c,1); shake(5); reactFx(rx.name,t); groundFx(rx.name,t);
  B.reacts=(B.reacts||0)+1;
  later(.12,()=>{ switch(rx.name){
    case 'Shatter': { const k=e.freezeT>0?1.5:1; e.freezeT=0; if(e.hp>0) hitEnemy(e,Math.round(base*k),null,{raw:true}); break; }
    case 'Conduct': near(2).forEach(o=>{ B.fx.push({kind:'bolt',a:t,b:o.tile,color:rx.c,t:0,life:.3}); spray(o.tile,10,{shape:'spark',color:['#fff6a8','#ffffff'],v0:2,v:6,g:0,drag:4,life:.3,s:3,add:true}); hitEnemy(o,Math.round(base*.6),null,{raw:true}); if(o.hp>0){ o.stunT=Math.max(o.stunT,1); cancelAttack(o); } }); if(e.hp>0) e.stunT=Math.max(e.stunT,1); break;
    case 'Wildfire': [e,...near(1)].forEach(o=>{ o.burnT=Math.max(o.burnT,6); o.tile.burnT=Math.max(o.tile.burnT||0,4); spray(o.tile,12,{shape:'ember',color:['#ffd27a','#ff6a3d'],v:1,up0:1,up:3,g:-2,drag:1.5,life:.9,s:4,add:true,shrink:1}); }); break;
    case 'Eclipse': if(e.hp>0){ hitEnemy(e,Math.round(base*1.2),null,{raw:true}); e.curseT=Math.max(e.curseT,5); } break;
    case 'Thornbind': if(e.hp>0){ e.stunT=Math.max(e.stunT,2.5); e.slowT=Math.max(e.slowT,5); cancelAttack(e); } break;
    case 'Rimebind': [e,...near(1)].forEach(o=>{ if(o.hp>0){ o.freezeT=Math.max(o.freezeT,2); cancelAttack(o); spray(o.tile,10,{shape:'shard',color:['#ffffff','#bfefff'],v:1.8,up:2.5,g:6,life:.6,s:4,spin:8}); ring(o.tile,'#bfefff',.8,.4,4); } }); break;
  } });
}
/* Ground: a colored hit stains the enemy-side tile under it for 8 s. An enemy that steps or stands on a
   stain picks the element up as its mark (or sets off a reaction with the one it carries), and a card that
   lands on an empty stained tile reacts with the stain itself. Every reaction also reshapes the ground. */
const STAIN_T=8;
function stain(t,c){ if(!t||t.side!=='e'||t.holeT>0) return; t.gEl=c; t.gT=STAIN_T; }
const groundArea=t=>[t,...neighbors(t)].filter(x=>x.side==='e');
function groundFx(name,t){ const A=groundArea(t);
  switch(name){
    case 'Shatter':  A.forEach(x=>{ x.iceT=Math.max(x.iceT||0,6); }); break;                        // ice field: enemies on it are slowed
    case 'Conduct':  A.forEach(x=>{ x.zapT=Math.max(x.zapT||0,5); }); break;                        // live current: damage and jolts
    case 'Wildfire': A.forEach(x=>{ x.burnT=Math.max(x.burnT||0,6); }); break;                      // burning ground
    case 'Eclipse':  A.forEach(x=>{ x.voidT=Math.max(x.voidT||0,6); }); break;                      // shadow pool: curses whoever stands in it
    case 'Thornbind':A.forEach(x=>{ x.thornT=Math.max(x.thornT||0,8); x.thornPow=Math.max(x.thornPow||0,10); }); break;  // thorns hurt anything that steps in
    case 'Rimebind': A.forEach(x=>{ x.iceT=Math.max(x.iceT||0,8); }); break;
  }
  A.forEach((x,i)=>{ x.gT=0; later(.04*i,()=>flash(x,REACTIONS[Object.keys(REACTIONS).find(k=>REACTIONS[k].name===name)].c,.7)); });
}
// A card hits an empty enemy tile: stain it, or react with the stain already there.
function groundHit(t,c){ if(!c||!SIX.includes(c.color)||t.side!=='e') return;
  const m=t.gT>0?t.gEl:null, rx=m&&m!==c.color?REACTIONS[[m,c.color].sort().join('+')]:null;
  if(!rx) return stain(t,c.color);
  t.gT=0; floater(rx.name+'!',t,rx.c,true); shake(3); reactFx(rx.name,t); groundFx(rx.name,t); B.reacts=(B.reacts||0)+1; }
// Enemies standing on stains or reshaped ground (called every frame from updateTerrain).
function groundTick(e,dt){ const t=e.tile;
  if(t.gT>0&&t.gEl&&!(e.markT>0&&e.mark===t.gEl)){ const c=t.gEl; t.gT=0; react(e,{color:c},12,true); if(e.hp<=0) return; }
  if(icy(t)) e.slowT=Math.max(e.slowT,.5);
  if(t.voidT>0) e.curseT=Math.max(e.curseT,.6);
  if(t.zapT>0){ e.zapAcc=(e.zapAcc||0)+dt; if(e.zapAcc>=.6){ e.zapAcc=0; spray(t,5,{shape:'spark',color:['#fff6a8','#ffe24d'],v0:2,v:5,g:0,drag:4,life:.25,s:2,add:true}); hitEnemy(e,4,null,{raw:true}); if(e.hp>0&&Math.random()<.35){ e.stunT=Math.max(e.stunT,.35); cancelAttack(e); } } } else e.zapAcc=0;
}
/* ---------------- the Soul ----------------
   Your hero stands beside the fight instead of sitting in your deck. Casting its color, setting off
   reactions with its color (which also hit 30% harder) and landing Counter Hits charge its meter.
   Full, it offers a choice: Summon calls the hero onto the board (its usual hero card), or Unison
   gives up the next card in your queue to take its power for 10 s: your wand shots fire in its color,
   1.5x as hard, with its element's effect, and they mark enemies for reactions. */
const SOUL_MAX=100, UNISON_T=10;
const UNISON_FX={fire:{burn:3}, frost:{slow:1.5}, storm:{stun:.25}, verdant:{poison:4}, light:{mend:2}, shadow:{drain:.2}};
function soulInit(id){ const c=id&&CARDS[id]; B.soul=c?{card:c,charge:0,unisonT:0,ready:false}:null; }
function soulGain(n){ const s=B&&B.soul; if(!s||s.unisonT>0) return; const was=s.charge>=SOUL_MAX; s.charge=Math.min(SOUL_MAX,s.charge+n);
  if(!was&&s.charge>=SOUL_MAX){ floater('Soul ready!',B.player.tile,COLORS[s.card.color].c,true); B.hooks.onSoul&&B.hooks.onSoul(true); } }
const soulReady=()=>!!(B&&B.soul&&B.soul.charge>=SOUL_MAX&&B.phase==='fight');
function soulSummon(){ if(!soulReady()) return false; const s=B.soul; s.charge=0; callHero(s.card); B.hooks.onSoul&&B.hooks.onSoul(); return true; }
function soulUnite(){ if(!soulReady()) return false; const s=B.soul, p=B.player, q=B.piles.queue;
  const gone=q.find(c=>!c.combo); if(gone){ q.splice(q.indexOf(gone),1); floater('Gave up '+gone.card.name,p.tile,'#c8c8d8'); }
  s.charge=0; s.unisonT=UNISON_T; const col=COLORS[s.card.color].c;
  ring(p.tile,col,2.2,.6,9); ring(p.tile,'#ffffff',1.2,.4,4); spray(p.tile,30,{shape:'glow',color:[col,'#ffffff'],v0:1,v:4,up0:1,up:4,g:-1,drag:2,life:.9,s:8,add:true,shrink:1}); shake(5);
  floater(s.card.name.split(',')[0]+' Unison!',p.tile,col,true); B.hooks.onSoul&&B.hooks.onSoul(); return true; }
// while in Unison: a function that builds the wand shot's card in the Soul's element
function soulUnison(){ const s=B.soul; if(!s||!(s.unisonT>0)) return null; const c=s.card.color;
  return charged=>Object.assign({id:'unison', name:'Unison', color:c}, UNISON_FX[c]||{}, charged&&c==='frost'?{freeze:1}:{}); }
function counterHit(e){
  const t=e.tile; cancelAttack(e); e.stunT=Math.max(e.stunT,1.5);
  if(typeof FLASH_T!=='undefined'&&e.atkT<FLASH_T) e.atkT=e.atkMax||2;   // countered while its bar flashed: the attack starts over
  floater('COUNTER!',{wx:t.wx,wz:t.wz},'#ff3b5c',true); B.floaters[B.floaters.length-1].y=2.4;
  B.hitStop=.12; shake(7); flash(t,'#ffffff',1);
  spray(t,1,{shape:'glow',color:'#ffffff',v0:0,v:0,up0:0,up:0,g:0,life:.25,s:30,add:true,shrink:1});
  ring(t,'#ff3b5c',1.6,.4,8); ring(t,'#ffffff',1,.25,4);
  spray(t,22,{shape:'spark',color:['#ffffff','#ff3b5c','#ffd0d8'],v0:4,v:10,up0:-1,up:5,g:0,drag:4,life:.35,s:3,add:true});
  B.counters=(B.counters||0)+1; soulGain(15);
}
/* The hit chain: card hits that land within 1.5 s of each other build a chain. From 3 hits a counter
   grows on screen; a chain of 5 or more bursts when it ends, with a freeze, a shake and Soul charge
   (4 per hit); 8 or more also powers you up for 3 s. Wand shots don't count. */
const CHAIN_GAP=1.5;
function chainHit(){ const b=B, c=b.chain||(b.chain={n:0,last:-9,best:0}); c.n=b.time-c.last<=CHAIN_GAP?c.n+1:1; c.last=b.time; c.best=Math.max(c.best,c.n); chainShow(); }
function chainTick(){ const c=B.chain; if(!c||!c.n||B.time-c.last<=CHAIN_GAP) return; const n=c.n; c.n=0; if(n>=5) chainBurst(n); else chainShow(); }
function chainBurst(n){ const p=B.player; B.hitStop=Math.max(B.hitStop||0,.1); shake(4+Math.min(6,n/2)); ring(p.tile,'#ffd166',2.2,.5,8);
  spray(p.tile,24,{shape:'glow',color:['#ffd166','#ffffff'],v0:1,v:5,up0:1,up:5,g:-1,drag:2,life:.8,s:6,add:true,shrink:1}); soulGain(4*n);
  if(n>=8){ p.powerT=Math.max(p.powerT||0,3); floater('Power up!',p.tile,'#ffe24d',true); } if(typeof arenaKick==='function') arenaKick(.5); chainShow(n); }
function chainShow(burst){ const el=typeof document!=='undefined'&&document.getElementById('chainCtr'); if(!el) return; const n=B&&B.chain?B.chain.n:0;
  if(burst){ el.textContent='CHAIN ×'+burst+'!'; el.className='chainctr on burst'; clearTimeout(el._t); el._t=setTimeout(()=>{ el.className='chainctr'; },1100); return; }
  if(el.classList.contains('burst')) return;
  if(n>=3){ el.textContent='×'+n+' chain'; el.className='chainctr on'; el.style.setProperty('--s',Math.min(1.8,1+(n-3)*.08).toFixed(2)); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  else el.className='chainctr'; }
/* Elements and you. Your deck's element is the colour that makes up at least 40% of it (none for a
   mixed deck). Enemies of the colour that beats it hit you 30% harder; enemies it beats hit 20% softer. */
const ELEM_HURT=1.3, ELEM_GUARD=.8;
function deckElem(cards){ const n={}; let all=0; for(const c of cards){ if(!c) continue; all++; if(SIX.includes(c.color)) n[c.color]=(n[c.color]||0)+1; }
  const top=SIX.slice().sort((a,b)=>(n[b]||0)-(n[a]||0))[0]; return all&&(n[top]||0)/all>=.4?top:null; }
function playerElem(){ const b=B; if(!b) return null; if(b.pElem===undefined){ const P=b.piles||{}; b.pElem=deckElem([...(P.draw||[]),...(P.hand||[]),...(P.queue||[]),...(P.discard||[])].map(c=>c.card)); } return b.pElem; }
const bossMult=(atk,e)=>typeof bossColorMult==='function'?bossColorMult(atk,e):colorMult(atk,e.color);
function applyStatus(e,c){
  if(c.burn) e.burnT=Math.max(e.burnT,c.burn);
  if(c.slow) e.slowT=Math.max(e.slowT,c.slow);
  if(c.curse) e.curseT=Math.max(e.curseT,c.curse);
  if(c.poison){ e.poisonT=8; e.poisonAmt=Math.max(e.poisonAmt,c.poison); }
  if(c.freeze){ e.freezeT=Math.max(e.freezeT,c.freeze); cancelAttack(e); }
  if(c.stun){ e.stunT=Math.max(e.stunT,c.stun); cancelAttack(e); }
  if(c.confuse) e.confuseT=Math.max(e.confuseT||0,c.confuse);
}
// Knockback shoves an enemy one column back; if something is in the way it slams into it for 50% more.
// Pull drags it one column toward you.
function shove(e,c,base){
  if(e.hp<=0||(!c.push&&!c.pull)) return;
  if(typeof arRuleShove==='function'&&arRuleShove(e,c,base)) return;   // Black ice: it slides
  const to=tileCR(e.tile.col+(c.push?1:-1),e.tile.r);
  if(to&&to.side==='e'&&!to.occ){ e.tile.occ=null; e.tile=to; to.occ=e; burst(to,'#e6f4ff',6,.3); if(to.trap) springTrap(to,e); }
  else if(c.push){ floater('slam!',e.tile,'#ffe24d'); hitEnemy(e,Math.round(base*.5),null,{raw:true}); }
}
function cancelAttack(e){
  const had=e.windT>0||e.casting||B.teles.some(t=>t.owner===e);
  e.windT=0; e.casting=null; B.teles=B.teles.filter(t=>t.owner!==e);
  if(had) floater('cancelled',e.tile,'#6fd6ff');
}
function killEnemy(e){
  if(typeof bestiaryKill==='function'&&!e.def.minion&&!B.lab) bestiaryKill(e);
  if(typeof arRuleKill==='function') arRuleKill(e);
  // a kill lands hard: a short freeze and a white flash; the last kill of a boss fight goes slow
  B.hitStop=Math.max(B.hitStop||0,e.def.boss?.2:.07); flash(e.tile,'#ffffff',1);
  e.hp=0; e.deathT=.5; if(e.tile.occ===e) e.tile.occ=null; cancelAttack(e);
  if(e.def.bossId&&typeof bossDown==='function') bossDown(e); burst(e.tile,COLORS[e.color].c,30,1); shake(4);
  if(e.loot&&e.loot.length){ const room=handRoom(B.piles); B.piles.hand.push(...e.loot.slice(0,room)); B.piles.draw.push(...e.loot.slice(room)); floater('Got back '+e.loot.map(c=>c.card.name).join(', '),e.tile,'#39ff8a',true); e.loot=null; }   // a Cutpurse drops what it stole   // past a full hand, the rest go back on top of the deck
  if(e.def.mini&&typeof helpers==='function') for(const m of helpers(e)) if(m.hp>0) killEnemy(m);   // a miniboss's helpers fall with it
  if(typeof extraKill==='function') extraKill(e);
  crEnemyDied(e);
  if(B.enemies.some(x=>x.def.boss)&&!alive().length&&Number.isInteger(B.wave)&&B.wave>=B.waves.length-1){
    B.slowMo=.55; floater('FINISH!',e.tile,'#ffffff',true); ring(e.tile,'#ffffff',2.4,.7,10); shake(10); if(typeof arenaKick==='function') arenaKick(); }
  if(e.def.split){ const spots=around(e.tile).filter(t=>t.side==='e'&&!t.occ).slice(0,2);   // a Gloop splits in two
    if(!spots.length&&!e.tile.occ) spots.push(e.tile);
    spots.forEach(t=>{ const m=makeEnemy(e.def.split,t,B.depth); m.atkT+=1; B.enemies.push(m); }); }
  if(!alive().length&&B.phase==='fight'){
    if(!Number.isInteger(B.wave)) return;   // the next wave is already on its way
    if(B.wave<B.waves.length-1){ const nx=B.wave+1; later(1.1,()=>spawnWave(nx)); B.wave=nx-.5; return; }
    B.phase='win'; B.player.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(true)); }
}
function healPlayer(n,quiet){ const p=B.player; if(n<=0||p.hp<=0) return; const h=Math.min(n,p.maxHp-p.hp); p.hp+=h; if(h>0&&!quiet) floater('+'+h,p.tile,'#39ff8a'); }
function hitPlayer(dmg,src){
  const p=B.player; if(B.phase!=='fight') return;
  // your deck's element: an enemy whose colour beats it hits you harder; one it beats hits you softer
  { const el=playerElem(), sc=src&&src.color; if(el&&sc&&SIX.includes(sc)){ if(BEATS[sc]===el){ dmg=Math.round(dmg*ELEM_HURT); floater('weak!',p.tile,COLORS[sc].c); } else if(BEATS[el]===sc) dmg=Math.max(1,Math.round(dmg*ELEM_GUARD)); } }
  if(p.invT>0){ floater('miss',p.tile,'#7fd4ff'); return; }
  if(p.dodge){ p.dodge=false; floater('dodge',p.tile,'#6fd6ff'); return; }
  if(p.dodgeChance&&Math.random()<p.dodgeChance){ floater('dodge',p.tile,'#9fdcff'); return; }
  if(p.blocksLeft>0){ p.blocksLeft--; floater('blocked',p.tile,'#f2c94c'); burst(p.tile,'#f2c94c',8,1); return; }
  if(p.barrier>0){ const a=Math.min(p.barrier,dmg); p.barrier-=a; dmg-=a; floater('🛡'+a,p.tile,'#6fd6ff'); if(p.barrierCard&&src) kdWallHit({card:p.barrierCard},src,a); }
  // Gray Guardians, Guards creatures and Aegis gear take an attack's hit (not burning ground); they
  // see who hit, so their thorns and shocks answer it. A Light Guardian takes half, while above half HP.
  if(src&&dmg>0){ const g=guards().sort((x,y)=>y.hp-x.hp)[0];
    if(g){ B.fx.push({kind:'beam',a:g.tile,b:p.tile,color:'#b4b8c8',t:0,life:.25}); floater('guarded',p.tile,'#b4b8c8'); hitBlock(g,dmg,src); return; }
    const h=B.allies.find(a=>a.cr&&a.hp>a.maxHp/2&&!a.enemy&&a.card.trait==='guardian');
    if(h){ const half=Math.ceil(dmg/2); B.fx.push({kind:'beam',a:h.tile,b:p.tile,color:'#fff0b3',t:0,life:.25}); hitBlock(h,half,src); dmg-=half; } }
  if(heroAura('dodge')&&Math.random()<heroAura('dodge')){ floater('dodge',p.tile,'#9fdcff'); return; }
  if(p.guard&&dmg>0) dmg=Math.max(1,Math.round(dmg*(1-p.guard)));
  if(heroAura('armor')&&dmg>0) dmg=Math.max(1,Math.round(dmg*(1-heroAura('armor'))));
  if(onLand('marble')&&dmg>0) dmg=Math.max(1,Math.round(dmg*.75));
  if(p.hurt&&p.hurt!==1&&dmg>0) dmg=Math.round(dmg*p.hurt);
  if(p.hexT>0&&dmg>0) dmg=Math.round(dmg*1.3);   // a Dark Wizard's hex
  if(dmg<=0) return;
  if(p.counter){ const foe=alive().filter(e=>hexDist(e.tile,p.tile)<=5).sort((a,b)=>hexDist(a.tile,p.tile)-hexDist(b.tile,p.tile))[0];
    if(foe){ B.fx.push({kind:'beam',a:p.tile,b:foe.tile,color:'#e6f4ff',t:0,life:.2}); hitEnemy(foe,p.counter,null,{raw:true}); } }
  if(src&&src.kind==='enemy') dmg=Math.min(dmg,Math.round(p.maxHp*.45));   // no one-shots: one enemy hit takes at most 45% of your HP
  p.hp-=dmg; p.hurtT=.25; shake(dmg>=15?8:5); floater('-'+dmg,p.tile,'#ff5d6c',true); flash(p.tile,'#ff5d6c',1); B.hooks.onHurt&&B.hooks.onHurt(dmg);
  // Divine Intervention: a lethal hit leaves you at 1 HP, then heals
  if(p.hp<=0&&p.intervene){ p.hp=1; const h=p.intervene; p.intervene=0; floater('Divine Intervention',p.tile,'#fff0b3',true); burst(p.tile,'#fff0b3',30,1); healPlayer(h); }
  if(p.hp<=0){ p.hp=0; B.phase='lose'; p.charging=false; later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(false)); }
}
function hitBlock(o,dmg,src){
  if(o.cr){ dmg=crHurt(o,dmg,src); if(dmg<=0) return; }   // a creature's traits (creatures.js)
  if(o.kind==='wall'&&!o.enemy&&o.card&&o.card.wfx) dmg=kdWallHit(o,src,dmg);   // a ward's wall effect (kinds.js)
  o.hp-=dmg; floater('-'+dmg,o.tile,'#ffb3a0'); flash(o.tile,'#ffb3a0',.6);
  if(o.thorns&&src&&src.hp>0) hitEnemy(src,o.thorns,o.card);
  if(o.hp<=0&&!(o.cr&&crSave(o))) removeBlock(o);
}
function removeBlock(o){
  if(o.cr&&!o.fell){ o.fell=1; crFell(o); }   // fell, or its time ran out
  if(o.tile.occ===o) o.tile.occ=null; burst(o.tile,colorOf(o.card),12);
  if(o.gear&&o.gear.length){ (B.gearDrop=B.gearDrop||[]).push(...o.gear); o.gear=null; floater('gear dropped',o.tile,'#c08a55'); }
  if(o===B.player.hero) heroLeaves();
  B.walls=B.walls.filter(w=>w!==o); B.allies=B.allies.filter(s=>s!==o);
}
function payHp(n){ const p=B.player; if(!n) return; const c=Math.min(n,p.hp-1); p.hp-=c; floater('-'+c,p.tile,'#e0588f'); }

/* ---------------- casting ---------------- */
// A card as cast: numbers scaled by any combo on its queue slot.
function scaled(c,m){ if(!m||m===1) return c; const o=Object.assign({},c); for(const k of ['pow','amt','thorns','hp']) if(typeof o[k]==='number') o[k]=Math.round(o[k]*m); return o; }
// Race tech (Brown): +10% for each other card of the same race in your hand
const raceMult=(card,except)=>card.race?1+.1*B.piles.hand.filter(h=>h!==except&&h.card.race===card.race).length:1;
// race tech also lifts the fractional numbers of gear, tinkers and Ace Enchantments
function raceFrac(c,m){ if(m===1) return c; const o=Object.assign({},c); for(const k of ['tk','eqPow','upPow']) if(typeof o[k]==='number') o[k]=Math.round(o[k]*m*100)/100; return o; }
// Unstable tech misfires 1 time in 5: it fizzles and burns you
function misfire(c,p){ if(!c.unstable||Math.random()>=.2) return false;
  const d=Math.round(6+(c.pow||c.amt||c.hp||20)*.15); payHp(d); floater('Misfire!',p.tile,'#ff8a3d',true); spray(p.tile,14,{shape:'spark',color:['#ffb04d','#5a4a3a','#ffffff'],v0:2,v:5,up0:1,up:4,g:6,drag:1,life:.5,s:4,add:true}); shake(4); return true; }
function playCard(inst){ if(B&&B.player){ B.player.poseT=B.time; B.player.poseK='cast'; }
  if(inst.card.curseFx&&typeof curseCast==='function') return curseCast(inst.card,B.player);
  const b=B, p=b.player; let c=scaled(inst.card,(inst.mult||1)*(p.spell||1)*raceMult(inst.card,inst)*(typeof arRuleCard==='function'?arRuleCard(inst):1));
  c=raceFrac(c,raceMult(inst.card,inst));
  if(inst.extra) c=Object.assign({},c,inst.extra);   // a Tinker's keyword
  if(inst.brood) c=Object.assign({},c,{broodN:inst.brood,leader:inst.leader});
  if(p.empower&&!isInstant(c)) c=scaled(c,crEmpowerUse());   // an Empower creature's boost
  if(misfire(c,p)) return;
  b.log.push(c.name);
  b.hooks.onCast&&b.hooks.onCast(c,inst);
  B.fx.push({kind:'ring',a:p.tile,color:colorOf(c),t:0,life:.45}); burst(p.tile,colorOf(c),10,1.2);
  if(c.self&&c.type!=='boon') payHp(c.self);
  // a strike's cast (kinds.js): Quick brings your next card sooner; Charged winds up half a second first
  if(c.type==='strike'&&c.cast==='quick') p.castCd*=.5;
  if(c.type==='boon'&&c.timing==='delayed'&&!c.late){ ring(p.tile,colorOf(c),1,.6); floater('…',p.tile,colorOf(c)); return later(2,()=>{ if(B===b&&b.phase==='fight') CAST.boon(Object.assign({},c,{late:1}),p); }); }
  if(c.type==='strike'&&c.cast==='charged'){ ring(p.tile,colorOf(c),1.2,.5); floater('charging…',p.tile,colorOf(c)); p.castCd=Math.max(p.castCd,.6);
    return later(.5,()=>{ if(B===b&&b.phase==='fight') CAST.strike(c,p); }); }
  CAST[c.type==='piece'?c.base:c.type](c,p);
}
function castCard(){
  const b=B; if(!b||b.phase!=='fight') return;
  const p=b.player; if(p.castCd>0) return;
  const fq=b.piles.queue[0]; if(fq&&fq.frozenT>0){ floater('Frozen ❄',p.tile,'#9fd0ff'); return; }
  const inst=castNext(b.piles); if(!inst) return;
  p.castCd=(p.hasteT>0||heroOn('volta')||heroAura('haste')?.25:.45)*(p.castSlow||1);
  playCard(inst); b.casts=(b.casts||0)+1; soulGain(B.soul&&inst.card.color===B.soul.card.color?18:8);
  if(inst.straight){ // Straight: the next two cards follow in one chain, then a finisher
    const chain=[]; for(let i=0;i<inst.straight.length-1;i++){ const n=castNext(b.piles); if(n) chain.push(n); }
    const grand=inst.straight.length>=4;
    b.hooks.onCombo&&b.hooks.onCombo(grand?'Grand Straight!':'Straight!');
    chain.forEach((n,i)=>later(.28*(i+1),()=>playCard(n)));
    const total=[inst,...chain].reduce((a,n)=>a+(scaled(n.card,n.mult).pow||20),0);
    later(.28*(chain.length+1)+.15,()=>{ const e=nearestEnemyTile(p.tile); if(!e) return; const t=e;
      B.fx.push({kind:'beam',a:p.tile,b:t,color:'#ffe066',t:0,life:.45}); floater(grand?'GRAND STRAIGHT!':'STRAIGHT!',t,'#ffe066',true); shake(grand?10:7); hitAt(t,Math.round(total*(grand?.9:.5)),null); });
    p.castCd=.28*(chain.length+1)+.4;
  }
}
const CAST={
  strike(c,p){
    strikeRecoil(c,p);   // riders and the newer shapes are in strikes.js
    if(STRIKE_SHAPES[c.shape]) return STRIKE_CAST[c.shape](c,p);
    const row=lineTiles(p.tile,DIRS.E);
    if(c.shape==='line') shoot(p.tile,row,{card:c,dmg:c.pow,from:'p',pierce:c.rider==='pierce'?1:0});
    else if(c.shape==='row'){ row.forEach((t,i)=>{ flash(t,colorOf(c),1); hitAt(t,c.pow,c); });
      B.fx.push({kind:'beam',a:p.tile,b:row[row.length-1]||p.tile,color:colorOf(c),t:0,life:.3}); }
    else if(c.shape==='wedge'){ const ts=wedgeTiles(p.tile,4.5); ts.forEach(t=>{ flash(t,colorOf(c),1); hitAt(t,c.pow,c); }); }
    else if(c.shape==='all') alive().forEach(e=>{ B.fx.push({kind:'bolt',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.35}); hitEnemy(e,c.pow,c); });
    else if(c.shape==='dig') shoot(p.tile,row,{card:c,dmg:c.pow,from:'p',dig:true,pierce:c.rider==='pierce'?1:0});
    else if(c.shape==='zigzag'){ const alt=tileCR(p.tile.col,p.tile.r+1)?1:-1, path=[];
      for(let i=1;i<BOARD_COLS;i++){ const t=tileCR(p.tile.col+i,p.tile.r+(i%2?alt:0)); if(t) path.push(t); } shoot(p.tile,path,{card:c,dmg:c.pow,from:'p',pierce:c.rider==='pierce'?1:0}); }
    else if(c.shape==='diag') for(const d of [-1,1]) shoot(p.tile,diagPath(p.tile,d),{card:c,dmg:c.pow,from:'p',pierce:c.rider==='pierce'?1:0});
    else if(c.shape==='missiles') for(let i=0;i<c.n;i++) later(i*.09,()=>{ const e=pick(alive()); if(!e) return;
      B.fx.push({kind:'arc',a:p.tile,b:e.tile,color:colorOf(c),t:0,life:.25}); hitEnemy(e,c.pow,c); });
  },
  lob(c,p){ lobFrom(p.tile,c,c.pow,c.radius,c.delay||.6,B.aim); B.aim=null; },
  ward(c,p){
    if(c.ward==='barrier'){ p.barrier=c.amt; p.shieldT=secs(c.turns||2); p.barrierCard=c.wfx?c:null; floater('🛡'+c.amt,p.tile,'#6fd6ff'); return; }   // shields replace, never stack
    let cage=null, ts;
    if(c.form==='cage'){ cage=cageTarget(B.aim); B.aim=null; ts=cage?cageTiles(cage):[]; if(!ts.length){ floater(cage?'no room':'no target',p.tile,'#ffb3a0'); return; } }
    else { ts=placementTiles(c.n,c.form); if(!ts.length){ floater('no room',p.tile,'#ffb3a0'); return; } }
    ts.forEach(t=>{ const w={kind:'wall',card:c,tile:t,hp:c.hp,maxHp:c.hp,thorns:c.thorns||0,life:secs(c.turns||2),maxLife:secs(c.turns||2),cage}; t.occ=w; B.walls.push(w); burst(t,colorOf(c),8,.3); });
    if(cage){ cage.path=[]; floater('Caged!',cage.tile,colorOf(c),true); }
  },
  sentry(c,p){ if(c.beh) return crSpawn(c); placeAlly(c,'sentry',c.hp||40,c.turns); },
  trap(c,p){ // on the aimed tile, or a free tile next to the nearest enemy
    const e=alive().sort((a,b)=>hexDist(p.tile,a.tile)-hexDist(p.tile,b.tile))[0];
    let t=B.aim&&!B.aim.occ&&!B.aim.trap?B.aim:null; B.aim=null;
    if(!t&&e) t=pick(around(e.tile).filter(x=>x.side==='e'&&!x.occ&&!x.trap));
    if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
    t.trap={card:c,life:secs(c.turns||2)}; burst(t,colorOf(c),10,.2);
    if(c.size==='three') around(t).filter(x=>x.side==='e'&&!x.occ&&!x.trap).slice(0,2).forEach(x=>{ x.trap={card:c,life:secs(c.turns||2)}; burst(x,colorOf(c),10,.2); }); },
  environment(c,p){
    const t=B.aim||nearestEnemyTile(p.tile); B.aim=null; if(!t) return;
    for(const x of patternTiles(t,c.pattern,'e')){ flash(x,colorOf(c),.8);
      if(c.turns) x.envT=Math.max(x.envT||0,secs(c.turns));   // lasts that many seconds of fighting
      const foe=x.occ&&x.occ.kind==='enemy'&&x.occ.hp>0?x.occ:null;
      if(c.env==='burn'){ x.burnT=1e9; if(foe){ if(c.pow) hitEnemy(foe,c.pow,c); foe.burnT=Math.max(foe.burnT||0,4); } }
      if(c.env==='freeze'){ x.iceT=1e9; if(foe){ foe.slowT=Math.max(foe.slowT,2); if(c.pow) hitEnemy(foe,c.pow,c); } }
      if(c.env==='bramble'){ x.thornT=1e9; x.thornPow=c.pow; x.thornCard=c; }
      if(c.env==='tremor') hitAt(x,c.pow,c);
      else if(c.envKw&&x.occ&&x.occ.kind==='enemy'&&x.occ.hp>0) hitEnemy(x.occ,1,c); } },   // ground with a keyword (kinds.js)
  charge(c,p){ if(c.kd) return kdCharge(c,p); if(c.fx==='lob') lobFrom(p.tile,c,c.pow,0,.45,B.aim); else shoot(p.tile,lineTiles(p.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); },
  utility(c,p){
    const pl=B.piles;
    if(c.util==='search'){ const got=deckSearch(c); floater(got?'Found: '+got.card.name:handRoom(B.piles)?'nothing found':'hand full',p.tile,'#c08a55'); if(got) B.justDrawn=new Set([got.uid]); burst(p.tile,colorOf(c),10,1); return; }
    if(c.util==='reshuffle'){ const r=reshuffleHand(pl); floater('Reshuffle: '+r.got.length+' new',p.tile,'#c08a55'); B.justDrawn=new Set(r.got.map(x=>x.uid)); burst(p.tile,colorOf(c),10,1); return; }
    if(c.util==='keep'){ const r=reshuffleHand(pl,B.keepSet||new Set()); B.keepSet=null; floater('Kept '+pl.hand.filter(x=>!r.got.includes(x)).length+', drew '+r.got.length,p.tile,'#c08a55'); B.justDrawn=new Set(r.got.map(x=>x.uid)); burst(p.tile,colorOf(c),10,1); return; }
    if(c.util==='recharge'){ const k=rechargeAll(pl,c.n); floater(k?'Recharged '+k+' card'+(k>1?'s':''):'no Charge cards',p.tile,'#c08a55'); burst(p.tile,colorOf(c),10,1); return; }
    if(c.util==='draw'){ const got=drawCards(pl,c.n); floater(got.length?'+'+got.length+' to hand':'deck empty',p.tile,'#7fd4ff'); }
    else if(c.util==='recall'){ const got=recallTop(pl); floater(got?'Recall: '+got.card.name:'nothing to recall',p.tile,'#7fd4ff'); }
    else if(c.util==='copy'){ const got=copyNext(pl); floater(got?'Copy: '+got.card.name:'nothing to copy',p.tile,'#7fd4ff'); }
    else if(c.util==='cleanse'){ const n=B.teles.filter(t=>!t.friendly).length; B.teles=B.teles.filter(t=>t.friendly); B.enemies.forEach(e=>e.windT=0);
      if(n) floater('cleansed',p.tile,'#e6f4ff'); healPlayer(c.amt); }
    burst(p.tile,colorOf(c),10,1);
  },
  summon(c,p){ if(c.beh) return crSpawn(c);   // a creature built from parts (creatures.js)
    if(c.ai!=='critter') return placeAlly(c,c.ai,c.hp,c.turns);
    const n=c.broodN>=2?2:1; for(let i=0;i<n;i++) later(i*.15,()=>spawnCritter(c));
    if(c.leader&&typeof BROOD_LEADER!=='undefined') later(.35,()=>{ const o=spawnCritter(scaled(BROOD_LEADER,1.25)); if(o) floater('Bramble Ogre!',o.tile,'#6fdc7a',true); }); },
  hero(c,p){ callHero(c); if(c.hero==='grovebeast'){ shake(9); spray(p.tile,40,{shape:'leaf',color:['#6fdc7a','#3fa856','#b6f59a'],v0:1,v:6,up0:2,up:6,g:5,life:1.2,s:7,spin:9}); } },
  machine(c,p){ if(c.beh) return crSpawn(c);
    if(c.ai==='bulwark') return CAST.ward({ward:'wall',n:c.n,hp:c.hp,turns:c.turns,color:c.color,name:c.name},p);
    placeAlly(c,c.ai,c.hp,c.turns);
  },
  equip(c,p){ equipAlly(c); },
  ace(c,p){ loadAce(c); },
  claim(c,p){ claimLand(c); },
  aceup(c,p){ enchantAce(c); },
  // instants normally come from your hand (useInstant), but a copied or recalled one still works
  instant(c,p){ CAST[c.as](c,p); },
  tinker(c,p){ const t=bestTinkerTarget(); if(t) tinkerCard(c,t); },
  boon(c,p){
    const col=colorOf(c);
    switch(c.boon){
      case 'power': p.powerT=c.dur; break;
      case 'pact': payHp(c.self); p.pactT=c.dur; break;
      case 'haste': p.hasteT=c.dur; break;
      case 'dodge': p.dodge=true; break;
      case 'phase': p.invT=c.dur; break;
      case 'regen': p.regenT=c.dur; p.regenAmt=c.amt; break;
      case 'heal': healPlayer(c.amt); break;
      case 'gauge': B.gauge=Math.min(GAUGE_MAX,B.gauge+c.amt*GAUGE_MAX); break;
      case 'courage': p.courageT=c.dur; break;
      case 'intervene': p.intervene=c.amt; break;
    }
    if(c.side&&typeof kdSide==='function') kdSide(c,p);   // a colour side effect (kinds.js)
    if(c.timing==='echo'&&!c.echoed) later(5,()=>{ if(B&&B.phase==='fight') CAST.boon(scaled(Object.assign({},c,{echoed:1,side:null,dur:c.dur&&Math.max(1,Math.round(c.dur/2))}),.5),p); });
    burst(p.tile,col,16,1); floater(c.name,p.tile,col);
  },
};
// Arc onto the aimed tile, or the enemy nearest to `from`, over walls and allies.
// The tile is fixed at cast, so an enemy that moves during the flight is missed.
const nearestEnemyTile=from=>{ const e=alive().sort((a,b)=>hexDist(from,a.tile)-hexDist(from,b.tile))[0]; return e?e.tile:null; };
// damage whatever enemy thing stands on a tile: an enemy, or its wall or sentry
function hitAt(t,pow,c){ const o=t.occ; if(!o) return groundHit(t,c); if(o.kind==='enemy') hitEnemy(o,pow,c); else if(o.enemy) hitBlock(o,pow,null); }
function lobFrom(from,c,pow,radius,dur,target){
  const t=target||nearestEnemyTile(from); if(!t) return;
  const ts=patternTiles(t,c.pattern||(radius?'burst':'single'),'e');
  B.lobs.push({a:from,b:t,t:0,dur,card:c});
  B.teles.push({tiles:ts,t:0,dur,friendly:true});
  later(dur,()=>{ ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),6,.2); hitAt(x,pow,c); }); if(c.after&&typeof kdAfter==='function') kdAfter(c,ts); });
}
// Sentries, summons and machines stand on a free tile of your side, nearest your row and the rift.
// where walls, towers, summons and machines go: free tiles on your side, nearest your row and the front
/* Where a ward's walls go, by the card's form. The camera looks down your row at the enemy, so a
   row is a lane running up the screen.
     (none)    the usual: straight up your lane, from the front of your side back towards you
     arc       hugging you: the 3 tiles in front, then the 2 behind-diagonals; the tile behind stays open
     rampart   across the lanes, one tile in front of you: your lane first, then out to each side
     corridor  up the lanes on either side of you, from where you stand forward; your lane stays open
   A cage (cageTiles) goes around an enemy instead. */
function placementTiles(n,form){ const p=B.player, P=p.tile, free=t=>t&&t.side==='p'&&!t.occ&&!(t.holeT>0);
  if(form==='arc') return ['E','NE','SE','NW','SW'].map(d=>tileAt(P.q+DIRS[d][0],P.r+DIRS[d][1])).filter(free).slice(0,n);
  if(form==='rampart'){ const out=[], ahead=P.x+1;
    for(const r of [...Array(BOARD_ROWS).keys()].sort((a,b)=>Math.abs(a-P.r)-Math.abs(b-P.r)||a-b)){ if(out.length>=n) break;
      const t=P_TILES.filter(x=>x.r===r&&x.x>P.x-1&&free(x)).sort((a,b)=>Math.abs(a.x-ahead)-Math.abs(b.x-ahead))[0]; if(t) out.push(t); }
    return out; }
  if(form==='corridor'){ const runs=[P.r-1,P.r+1].map(r=>P_TILES.filter(t=>t.r===r&&t.x>=P.x-.5&&free(t)).sort((a,b)=>a.x-b.x)), out=[];
    for(let i=0;out.length<n&&runs.some(x=>x.length>i);i++) for(const run of runs) if(run[i]&&out.length<n) out.push(run[i]);
    return out; }
  return P_TILES.filter(t=>!t.occ).sort((a,b)=>Math.abs(a.r-P.r)-Math.abs(b.r-P.r)||b.x-a.x).slice(0,n); }
// a cage: the enemy on the aimed tile (or nearest it, or nearest you), walled in on every free side.
// Your shots pass through your own walls; its shots stop on them, and it cannot move while caged.
function cageTarget(aim){ const at=aim&&aim.occ&&aim.occ.kind==='enemy'&&aim.occ.hp>0?aim.occ:null; if(at) return at;
  const from=aim||B.player.tile; return alive().sort((a,b)=>hexDist(from,a.tile)-hexDist(from,b.tile))[0]||null; }
const cageTiles=e=>around(e.tile).filter(t=>!t.occ&&!(t.holeT>0)&&!t.trap);
const caged=e=>!!(B&&B.walls.some(w=>w.cage===e&&w.hp>0));
// a Brood critter: a small ally that pounces on the nearest enemy
function spawnCritter(c){ const free=P_TILES.filter(t=>!t.occ&&!(t.holeT>0)&&t!==B.player.tile).sort((x,y)=>y.col-x.col||Math.random()-.5);
  const front=free.filter(t=>t.col>=free[0].col-1); const a=placeAlly(c,'critter',c.hp,c.turns,front.length?pick(front):free[0]); if(!a) return null; a.fireT=.3+Math.random()*.3;
  spray(a.tile,10,{shape:'leaf',color:['#6fdc7a','#b6f59a'],v0:.5,v:2,up0:1.5,up:3.5,g:5,life:.8,s:5,spin:8}); return a; }
function placeAlly(c,ai,hp,turns,at){
  const p=B.player, t=at||placementTiles(1)[0];
  if(!t){ floater('no room',p.tile,'#ffb3a0'); return; }
  const a={kind:'ally',ai,card:c,tile:t,hp,maxHp:hp,life:secs(turns||1),maxLife:secs(turns||1),fireT:.4}; t.occ=a; B.allies.push(a); burst(t,colorOf(c),10,.4);
  if(ai!=='sentry'&&ai!=='hero'&&B.gearDrop&&B.gearDrop.length){ const g=B.gearDrop; B.gearDrop=[]; g.forEach(x=>wearGear(a,x)); }   // dropped gear is picked up
  return a;
}

/* ---------------- Brown: instants, the deck tools, equipment and tinkering ---------------- */
// Search: which deck cards a search card can find
function deckSearch(c,pickUid){ const pl=B.piles;
  if(c.find==='pick') return pickUid!=null?takeFromDeck(pl,pickUid):searchDeck(pl,x=>x.rank===Math.max(...pl.draw.map(d=>d.card.rank)));
  if(c.find==='rune'){ const q=pl.queue.map(x=>x.card.code).find(k=>k&&k!==WILD_RUNE)||surgeRune(pl.hand)||(()=>{ const n={}; pl.hand.forEach(h=>{ const k=h.card.code; if(k&&k!==WILD_RUNE) n[k]=(n[k]||0)+1; }); return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]; })();
    return searchDeck(pl,x=>!q||x.code===q||x.code===WILD_RUNE); }
  if(c.find==='attack'||c.find==='defense') return searchDeck(pl,x=>cardRole(x)===c.find);
  if(c.find==='creature') return searchDeck(pl,x=>['summon','machine','sentry'].includes(x.type==='piece'?x.base:x.type));
  return searchDeck(pl); }
/* Use an instant from your hand, on the Spell screen or mid-fight. `choice` carries a pick when
   the card needs one: {target: a card instance} for Tinker, {keep: Set of uids} for Keep and
   Reshuffle, {uid} for a pick-any search. Returns false if it could not be used. */
function useInstant(inst,choice){
  const b=B; if(!b||(b.phase!=='fight'&&b.phase!=='custom')) return false;
  const pl=b.piles, p=b.player, i=pl.hand.indexOf(inst); if(i<0||!isInstant(inst.card)) return false;
  pl.hand.splice(i,1); pl.discard.push(inst);
  const rm=raceMult(inst.card,inst); let c=raceFrac(scaled(inst.card,rm*(inst.card.as==='utility'?1:(p.spell||1))),rm);
  b.log.push(c.name); b.hooks.onCast&&b.hooks.onCast(c,inst); soulGain(5);
  B.fx.push({kind:'ring',a:p.tile,color:colorOf(c),t:0,life:.45});
  if(misfire(c,p)) return true;
  if(c.type==='tinker'){ const t=choice&&choice.target||bestTinkerTarget(); if(t) tinkerCard(c,t); else floater('nothing to tinker',p.tile,'#c08a55'); return true; }
  if(c.as==='utility'&&c.util==='keep') B.keepSet=choice&&choice.keep||new Set();
  if(c.as==='utility'&&c.util==='search'&&c.find==='pick'){ const got=deckSearch(c,choice&&choice.uid); floater(got?'Found: '+got.card.name:handRoom(B.piles)?'nothing found':'hand full',p.tile,'#c08a55'); if(got) B.justDrawn=new Set([got.uid]); return true; }
  if(c.self&&c.as!=='boon') payHp(c.self);
  CAST[c.as](c,p);
  return true;
}
/* A deck tool double-tapped in its slot on the hand screen: it acts, goes to the discard pile and
   shuts its slot (see toolLock). `choice` as for useInstant: {keep} or {uid}. */
function useDeckTool(inst,choice){
  const b=B; if(!b||b.phase!=='custom') return false;
  const pl=b.piles, p=b.player, i=pl.queue.indexOf(inst); if(i<0||!isDeckTool(inst.card)) return false;
  const c=inst.card; pl.queue.splice(i,1); pl.discard.push(inst);
  (pl.locks=pl.locks||[]).push({n:toolLock(c), name:c.name});
  b.log.push(c.name); b.hooks.onCast&&b.hooks.onCast(c,inst); soulGain(5);
  if(misfire(c,p)) return true;
  if(c.util==='keep') B.keepSet=choice&&choice.keep||new Set();
  if(c.util==='search'&&c.find==='pick'){ const got=deckSearch(c,choice&&choice.uid); if(got) B.justDrawn=new Set([got.uid]); return true; }
  CAST.utility(c,p);
  return true;
}
// mid-fight, a Tinker with nobody to ask picks your strongest card waiting in queue or hand
function bestTinkerTarget(){ const pl=B.piles; return [...pl.queue,...pl.hand].filter(x=>!isInstant(x.card)&&!x.temp).sort((a,b)=>(b.card.pow||b.card.amt||b.card.hp||0)-(a.card.pow||a.card.amt||a.card.hp||0))[0]||null; }
function tinkerCard(c,target){ target.mult=(target.mult||1)*(1+c.tk); target.tinker=(target.tinker||0)+c.tk;
  const kw={}; for(const k of ['burn','freeze','stun','slow','poison','curse','drain','mend','confuse','push','pull','valor']) if(c[k]) kw[k]=c[k];
  if(Object.keys(kw).length) target.extra=Object.assign(target.extra||{},kw);
  floater('🔧 '+target.card.name+' +'+Math.round(c.tk*100)+'%',B.player.tile,'#c08a55'); }
// Equipment goes on your strongest creature; with none, it waits and your next summon picks it up
function equipAlly(c){ const a=B.allies.filter(x=>x.hp>0&&x.ai!=='sentry').sort((x,y)=>y.hp-x.hp)[0];
  if(!a){ (B.gearDrop=B.gearDrop||[]).push(c); floater(c.name+' waits for a creature',B.player.tile,'#c08a55'); return; }
  wearGear(a,c); }
function wearGear(a,c){ (a.gear=a.gear||[]).push(c); if(c.eqHp){ a.maxHp+=c.eqHp; a.hp+=c.eqHp; } if(c.eqTurns){ a.life+=secs(c.eqTurns); a.maxLife+=secs(c.eqTurns); }
  floater('⚔ '+c.name,a.tile,'#c08a55'); burst(a.tile,'#c08a55',10,1); }
/* What an ally attacks with: its card, made stronger by Veteran time (Gray), a Legend nearby
   (Gray) and its equipment (Brown). */
function allyCard(a){ const c=a.card; if(a.ai==='hero'||a.enemy) return c;
  let m=1+(a.vet||0)*.1;
  if(c.color==='gray'&&!c.legend&&B.allies.some(x=>x!==a&&x.hp>0&&x.card.legend)) m+=.25;
  const kw={}; let rate=1;
  for(const g of a.gear||[]){ if(g.eqPow) m+=g.eqPow; if(g.eqRate) rate*=g.eqRate; for(const k of ['burn','freeze','stun','slow','poison','curse','drain','mend','confuse']) if(g[k]) kw[k]=g[k]; }
  if(m===1&&rate===1&&!Object.keys(kw).length) return c;
  return Object.assign(scaled(c,m),kw,{rate:(c.rate||1)*rate}); }
const guards=()=>B.allies.filter(a=>a.hp>0&&!a.enemy&&!a.down&&(a.card.color==='gray'&&a.ai==='guardian'||a.cr&&a.card.beh==='guards'||(a.gear||[]).some(g=>g.eq==='aegis')));

/* ---------------- the Sidearm and its Ace ----------------
   An Ace card loads into your Sidearm instead of going off. Ace Enchantments (from any color)
   add power, a new shape or their effects, up to ×3. You fire it when you choose; loading another
   Ace replaces it, and it is gone when the fight ends. */
const ACE_MAX=3;
function loadAce(c){ const old=B.sidearm, pend=B.acePending||[]; B.acePending=[];
  B.sidearm={card:c, mult:1, shape:c.shape, kw:{}, name:c.name};
  pend.forEach(enchantAce);
  floater((old?'Swapped: ':'Loaded: ')+c.name,B.player.tile,'#ffe066',true); B.fx.push({kind:'ring',a:B.player.tile,color:'#ffe066',t:0,life:.6}); }
function enchantAce(c){ const s=B.sidearm;
  if(!s){ (B.acePending=B.acePending||[]).push(c); floater('♤ waits for an Ace',B.player.tile,colorOf(c)); return; }
  s.mult=Math.min(ACE_MAX,s.mult+(c.upPow||0)); if(c.upShape) s.shape=c.upShape;
  for(const k of ['burn','freeze','stun','slow','poison','curse','drain','mend','confuse','push','pull','valor']) if(c[k]) s.kw[k]=Math.max(s.kw[k]||0,c[k]);
  s.tint=c.color; floater('♤ Ace ×'+s.mult.toFixed(1),B.player.tile,colorOf(c),true); burst(B.player.tile,colorOf(c),14,1.2); }
function fireAce(){ const b=B; if(!b||b.phase!=='fight'||!b.sidearm) return false;
  const s=b.sidearm, p=b.player; b.sidearm=null;
  const c=Object.assign(scaled(s.card,s.mult*(p.spell||1)),s.kw,{shape:s.shape==='nova'||s.shape==='twin'?'line':s.shape});
  floater(s.name+'!',p.tile,'#ffe066',true); shake(8); B.fx.push({kind:'ring',a:p.tile,color:'#ffe066',t:0,life:.7}); burst(p.tile,'#ffe066',24,1.4);
  b.hooks.onCast&&b.hooks.onCast(c,{combo:'Ace ×'+s.mult.toFixed(1)});
  if(s.shape==='nova'){ const t=b.aim||nearestEnemyTile(p.tile); b.aim=null; if(t){ B.fx.push({kind:'beam',a:p.tile,b:t,color:'#ffe066',t:0,life:.4}); patternTiles(t,'burst','e').forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),8,.4); hitAt(x,c.pow,c); }); } }
  else if(s.shape==='twin'){ CAST.strike(c,p); later(.2,()=>CAST.strike(c,p)); }
  else CAST.strike(c,p);
  b.hooks.onAce&&b.hooks.onAce(s);
  return true; }

/* ---------------- claimed land ----------------
   A Claim card takes the enemy's front tiles for 20 or 30 seconds (LANDS in cards.js). The tiles join
   your side: you can walk there and your summons stand there. Enemies on them are driven back,
   their walls crumble, and when the time runs out the ground goes back to the enemy. */
const LAND_LOOK={overgrowth:{base:'#1c4523',c:'#6fdc7a'}, swamp:{base:'#2a2232',c:'#9a7ab8'}, marble:{base:'#a9adb6',c:'#fff6dc'}, flood:{base:'#0b6b7c',c:'#7ff0ff'}};
const onLand=k=>{ const t=B&&B.player&&B.player.tile; return !!(t&&t.claim&&t.claim.land===k); };
function claimLand(c){
  const p=B.player, look=LAND_LOOK[c.land], n=c.reach==='front'?1:2, want=[];
  for(let r=0;r<BOARD_ROWS;r++){ if(c.reach==='patch'&&Math.abs(r-p.tile.r)>1) continue;
    want.push(...E_TILES.filter(t=>t.r===r&&t.col<=BOARD_COLS-3).sort((a,b)=>a.col-b.col).slice(0,n)); }
  // ground of the same land you already hold gets its time back
  for(const t of P_TILES) if(t.claim&&t.claim.land===c.land) t.claim.t=Math.max(t.claim.t,c.secs);
  const got=want.filter(t=>clearForClaim(t,c.land,want));
  for(const t of got){ t.side='p'; t.claim={land:c.land,t:c.secs}; E_TILES.splice(E_TILES.indexOf(t),1); P_TILES.push(t);
    t.terrain=null; t.trap=null; t.burnT=0; t.iceT=0; t.thornT=0; t.voidT=0; t.zapT=0;
    flash(t,look.c,1); burst(t,look.c,8,.5); }
  shake(4); floater(got.length?LANDS[c.land].name+'!':'no ground to take',p.tile,look.c,true);
}
// clear a tile for the claim: an enemy is driven further back (and the land's effect hits it), its walls crumble
function clearForClaim(t,land,taking){ const o=t.occ; if(!o) return true;
  if(o.kind==='enemy'){ const far=land==='flood'?2:1;
    const to=E_TILES.filter(x=>!x.occ&&!taking.includes(x)&&x.col>t.col).sort((a,b)=>Math.abs(a.r-t.r)*3+Math.abs(a.col-t.col-far)-(Math.abs(b.r-t.r)*3+Math.abs(b.col-t.col-far)))[0];
    if(!to) return false; t.occ=null; o.tile=to; to.occ=o; burst(to,'#e6f4ff',6,.3);
    if(land==='overgrowth') o.slowT=Math.max(o.slowT||0,2.5);
    if(land==='swamp') o.curseT=Math.max(o.curseT||0,4);
    if(land==='marble'){ o.stunT=Math.max(o.stunT||0,1); cancelAttack(o); }
    if(land==='flood') o.slowT=Math.max(o.slowT||0,2);
    if(to.trap) springTrap(to,o); return true; }
  if(o.enemy){ removeBlock(o); return true; }
  return false; }
// claimed ground lasts a set time in the fight (it pauses on the Custom screen); then it goes back to the enemy
function landTick(dt){ const back=P_TILES.filter(t=>t.claim&&(t.claim.t-=dt)<=0); if(!back.length) return;
  for(const t of back){ t.claim=null; t.side='e'; P_TILES.splice(P_TILES.indexOf(t),1); E_TILES.push(t); flash(t,'#ffffff',.6); }
  // whoever stood there steps back onto your side
  for(const t of back){ const o=t.occ; if(!o||o.kind==='enemy') continue;
    const to=P_TILES.filter(x=>!x.occ&&!(x.holeT>0)).sort((a,b)=>hexDist(a,t)-hexDist(b,t))[0];
    t.occ=null; if(!to){ if(o.kind!=='player') removeBlock(o); else { t.occ=o; continue; } continue; }
    o.tile=to; to.occ=o; if(o.kind==='player') o.path=[]; }
  floater('the ground is lost',B.player.tile,'#c8c8d8'); }

/* ---------------- heroes ----------------
   A hero stands on your side for 30 seconds, attacks on its own, and while it stands it
   empowers you (its aura). One at a time: calling another sends the first one home. */
const heroOn=id=>{ const h=B&&B.player.hero; return !!(h&&h.hp>0&&h.card.hero===id); };
const heroAura=k=>{ const h=B&&B.player.hero; return h&&h.hp>0&&h.card.aurae?h.card.aurae[k]||0:0; };
const heroMult=card=>(heroOn('pyra')?1.3:1)*(heroOn('aurelion')&&card?1.25:1)*(1+heroAura('dmg'))*(card&&heroAura('crit')&&Math.random()<heroAura('crit')?2:1);
function callHero(c){
  const p=B.player; if(p.hero) removeBlock(p.hero);
  const a=placeAlly(c,'hero',c.hp,c.turns); if(!a) return;
  p.hero=a; a.fireT=.8;
  if(c.hero==='thornfather'){ p.maxHp+=30; healPlayer(30); }
  if(c.hero==='aurelion') p.intervene=Math.max(p.intervene||0,c.amt);
  if(c.hero==='ysolde'||(c.aurae&&c.aurae.shield)) heroShield();
  if(c.hero==='grovebeast'&&typeof BROOD!=='undefined') for(let i=0;i<2;i++) later(.4+i*.2,()=>spawnCritter(BROOD[0]));
  burst(a.tile,colorOf(c),40,1.6); burst(a.tile,'#ffe066',20,2); flash(a.tile,'#ffe066',1); shake(6);
  B.fx.push({kind:'ring',a:p.tile,color:'#ffe066',t:0,life:.7});
  B.hooks.onHero&&B.hooks.onHero(c);
}
function heroShield(){ const p=B.player, c=p.hero.card, amt=c.amt||heroAura('shield'); if(p.barrier<amt){ p.barrier=amt; p.shieldT=secs(1); floater('🛡'+amt,p.tile,'#6fd6ff'); } }
function heroLeaves(){ const p=B.player, c=p.hero.card; p.hero=null; floater(c.name.split(',')[0]+' departs',p.tile,'#ffe066');
  if(c.hero==='thornfather'){ p.maxHp-=30; p.hp=Math.min(p.hp,p.maxHp); } }
function heroStrike(a,near){
  const c=a.card, col=colorOf(c), es=alive(); if(!es.length) return;
  near=near||es[0];
  switch(c.hero){
    case 'pyra': lobFrom(a.tile,c,c.pow,1,.6,near.tile); break;
    case 'ysolde': B.fx.push({kind:'beam',a:a.tile,b:near.tile,color:col,t:0,life:.3}); hitEnemy(near,c.pow,c); break;
    case 'volta': { let from=a.tile; es.sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile)).slice(0,3).forEach((e,i)=>{ const f=from;
      later(i*.12,()=>{ B.fx.push({kind:'bolt',a:f,b:e.tile,color:col,t:0,life:.3}); hitEnemy(e,c.pow,c); }); from=e.tile; }); break; }
    case 'thornfather': thornBurst(a,near.tile,c,col); break;
    case 'aurelion': B.fx.push({kind:'beam',a:near.tile,b:near.tile,y0:6,color:'#fff6c8',t:0,life:.45}); flash(near.tile,'#fff6c8',1); burst(near.tile,'#fff6c8',14,1.5); hitEnemy(near,c.pow,c); healPlayer(c.heal); break;
    case 'widow': B.fx.push({kind:'arc',a:a.tile,b:near.tile,color:col,t:0,life:.35}); hitEnemy(near,c.pow,c); break;
    default: heroStyle(a,near,c,col,es);
  }
}
// a vine lashes out from the hero, then the ground around the enemy bursts
function thornBurst(a,t,c,col){ B.fx.push({kind:'arc',a:a.tile,b:t,color:col,t:0,life:.25});
  later(.22,()=>[t,...around(t)].forEach(x=>{ flash(x,col,.8); burst(x,col,4,.3); hitAt(x,c.pow,c); })); }
// A hero walks your half of the board: it lines up with the enemy nearest to it, keeps to its
// fighting distance (casters stay back, brawlers go to the front) and never stands still for long.
const HERO_BACK=['pyra','ysolde','aurelion'], HERO_BACK_STYLE=['lob','sky'];
function heroWalk(a,dt){
  a.walkT=(a.walkT==null?.5:a.walkT)-dt; if(a.walkT>0||B.phase!=='fight') return; a.walkT=.45+Math.random()*.45;
  const es=alive(); if(!es.length) return; const p=B.player, c=a.card;
  const foe=es.slice().sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0].tile;
  const col=HERO_BACK.includes(c.hero)||HERO_BACK_STYLE.includes(c.style)?2:4;
  const score=t=>-Math.abs(t.r-foe.r)*1.2-Math.abs(t.col-col)*.7-(t.r===p.tile.r&&t.col>p.tile.col?1.5:0)+Math.random()*1.4;
  const opts=neighbors(a.tile).filter(t=>t.side==='p'&&!t.occ&&!(t.holeT>0));
  if(!opts.length) return;
  const best=opts.map(t=>[t,score(t)]).sort((x,y)=>y[1]-x[1])[0];
  if(best[1]<score(a.tile)-.3&&(a.still=(a.still||0)+1)<2) return;   // where it stands is better: it waits a moment, but not for long
  a.still=0; a.tile.occ=null; a.tile=best[0]; best[0].occ=a; }
// the later Souls attack by style
function heroStyle(a,near,c,col,es){
  switch(c.style){
    case 'lob': lobFrom(a.tile,c,c.pow,1,.6,near.tile); break;
    case 'multi': for(let i=0;i<(c.n||3);i++) later(i*.1,()=>{ const e=pick(alive()); if(!e) return; B.fx.push({kind:'arc',a:a.tile,b:e.tile,color:col,t:0,life:.25}); hitEnemy(e,c.pow,c); }); break;
    case 'sky': B.fx.push({kind:'beam',a:near.tile,b:near.tile,y0:6,color:col,t:0,life:.4}); flash(near.tile,col,1); burst(near.tile,col,14,1.5); hitEnemy(near,c.pow,c); if(c.heal) healPlayer(c.heal); break;
    case 'row': { const row=lineTiles(a.tile,DIRS.E), hit=row.filter(t=>t.occ&&t.occ.kind==='enemy').map(t=>t.occ);
      if(!hit.length){ B.fx.push({kind:'beam',a:a.tile,b:near.tile,color:col,t:0,life:.3}); hitEnemy(near,c.pow,c); break; }   // nothing in its row: it turns on the nearest
      B.fx.push({kind:'beam',a:a.tile,b:row[row.length-1],color:col,t:0,life:.3}); hit.forEach(e=>hitEnemy(e,c.pow,c)); break; }
    case 'chain': { let from=a.tile; es.sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile)).slice(0,c.n||3).forEach((e,i)=>{ const f=from;
      later(i*.12,()=>{ B.fx.push({kind:'bolt',a:f,b:e.tile,color:col,t:0,life:.3}); hitEnemy(e,c.pow,c); }); from=e.tile; }); break; }
    case 'burst': thornBurst(a,near.tile,c,col); break;
    default: B.fx.push({kind:'arc',a:a.tile,b:near.tile,color:col,t:0,life:.35}); hitEnemy(near,c.pow,c);
  }
}
/* Everything a card leaves behind lasts a set time of fighting, not a number of turns: a turn only
   ends when the Custom screen opens, so a player who never opened it could keep walls, summons
   and shields forever. A card's "turns" are TURN_S seconds each (about how long a turn takes),
   and the clock stops while the Custom screen is open. Repeating bonuses (Veteran, a hero's
   shield, a Buckler's block) come every TURN_S seconds too. */
const TURN_S=10, secs=n=>n*TURN_S;
function timeTick(dt){
  const b=B, p=b.player;
  if(p.shieldT>0&&(p.shieldT-=dt)<=0&&p.barrier>0){ p.barrier=0; p.barrierCard=null; floater('shield fades',p.tile,'#6fd6ff'); }
  if(typeof kdTick==='function') kdTick(dt);   // healing walls, Rally (kinds.js)
  for(const e of alive()) if(e.shieldT>0&&(e.shieldT-=dt)<=0) e.barrier=0;
  for(const o of [...b.walls,...b.allies]) if((o.life-=dt)<=0){ floater('expired',o.tile,'#9fdcff'); removeBlock(o); }
  for(const a of b.allies) if(a.hp>0&&a.card.color==='gray'&&a.ai!=='hero'&&!a.enemy&&(!a.cr||a.card.trait==='veteran')&&(a.vetT=(a.vetT||0)+dt)>=TURN_S){ a.vetT-=TURN_S; a.vet=(a.vet||0)+1; floater('Veteran +'+a.vet*10+'%',a.tile,'#b4b8c8'); }   // Gray: Veteran
  for(const t of TILES){
    if(t.trap&&(t.trap.life-=dt)<=0) t.trap=null;
    if(t.envT>0&&(t.envT-=dt)<=0){ t.burnT=0; t.iceT=0; t.thornT=0; }
  }
  shockTick(dt);
  if((p.beatT=(p.beatT||0)+dt)>=TURN_S){ p.beatT-=TURN_S;
    if(heroOn('ysolde')||heroAura('shield')) heroShield();
    p.blocksLeft=p.block||0; }   // a Buckler's block comes back
}
// A turn ends (the Custom screen opens)
function endTurn(){}
function updateAlly(a,dt){
  if(a.ai==='hero') heroWalk(a,dt);
  if(a.cr){ if(!a.down) crTick(a,dt); return; }
  a.fireT-=dt;
  if(a.fireT>0) return;
  const c=allyCard(a); a.fireT=c.rate||1;
  if(a.enemy){ shoot(a.tile,lineTiles(a.tile,DIRS.W),{dmg:a.pow,from:'e',owner:null,color:colorOf(c)}); return; }
  const es=alive(); if(!es.length&&a.ai!=='healer') return;
  const inRow=es.filter(e=>e.tile.r===a.tile.r);
  const near=(inRow.length?inRow:es).sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0];
  switch(a.ai){
    case 'sentry': case 'turret': case 'repeater': case 'guardian':
      if(near){ B.fx.push({kind:'bolt',a:a.tile,b:near.tile,color:colorOf(c),t:0,life:.18,y0:1.3}); hitEnemy(near,c.pow,c); } break;
    case 'shooter': shoot(a.tile,lineTiles(a.tile,DIRS.E),{card:c,dmg:c.pow,from:'p'}); break;
    case 'bomber': case 'mortar': lobFrom(a.tile,c,c.pow,a.ai==='mortar'?1:0,.7); break;
    case 'healer': healPlayer(c.amt); break;
    case 'hero': heroStrike(a,near); break;
    case 'critter': if(near){ a.hopT=.25; B.fx.push({kind:'arc',a:a.tile,b:near.tile,color:colorOf(c),t:0,life:.22}); later(.18,()=>{ if(near.hp>0){ hitEnemy(near,c.pow,c); spray(near.tile,5,{shape:'leaf',color:'#6fdc7a',v:2,up:2,g:5,life:.5,s:4,spin:8}); } }); } break;
  }
}
// a trap springs when an enemy steps on it
function springTrap(t,e){ const c=t.trap.card; t.trap=null; floater(c.name,t,colorOf(c));
  if(c.trap==='pendulum') return swingPendulum(t,e,c);
  const ts=c.trap==='blast'?patternTiles(t,'burst','e'):[t]; ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),8,.3); hitAt(x,c.pow,c); });
  if(e.hp<=0) return;
  // Shock trap: it holds the enemy, and a field around it zaps any other enemy that comes in
  if(c.trap==='shock'){ e.stunT=Math.max(e.stunT,c.hold); cancelAttack(e); floater('Held!',t,'#ffe24d',true);
    B.shocks.push({e,life:c.hold,card:c,seen:new Map()}); }
  // Zombie trap: it turns on its own side for a while (enemies.js zombieAttack); bosses shake it off sooner
  if(c.trap==='zombie'){ e.infectT=Math.max(e.infectT||0,c.infect*(e.def.bossId||e.def.mini?.5:1)); cancelAttack(e); e.atkT=Math.min(e.atkT||0,.5); /* the first bite comes soon */ floater('Infected!',t,'#9be36a',true); burst(t,'#9be36a',14,.6); } }
// the tiles a shock field covers around a held enemy (kinds.js KD_SPREAD)
function shockTiles(t,sp){ const row=[tileCR(t.col-1,t.r),tileCR(t.col+1,t.r)];
  const ts=sp==='ring'?around(t):sp==='plus'?[...row,tileCR(t.col,t.r-1),tileCR(t.col,t.r+1)]:row;
  return ts.filter(x=>x&&x.side==='e'); }
function shockTick(dt){
  for(const f of B.shocks){ f.life-=dt; const e=f.e; if(e.hp<=0||f.life<=0){ f.life=0; continue; }
    const c=f.card, ts=shockTiles(e.tile,c.spread);
    if(Math.random()<dt*6) spray(pick(ts)||e.tile,2,{shape:'spark',color:['#fff6a8','#ffe24d'],v0:1,v:3,g:0,drag:4,life:.2,s:2,add:true});
    for(const x of ts){ const o=x.occ; if(!o||o.kind!=='enemy'||o===e||o.hp<=0) continue;
      if(B.time-(f.seen.get(o)||-9)<1) continue; f.seen.set(o,B.time);   // once a second while it stays close
      B.fx.push({kind:'bolt',a:e.tile,b:x,color:'#ffe24d',t:0,life:.25}); hitEnemy(o,c.zap,c,{raw:true});
      if(o.hp>0){ o.stunT=Math.max(o.stunT,.8); cancelAttack(o); } } }
  B.shocks=B.shocks.filter(f=>f.life>0); }
/* Pendulum: the blade swings down the row or column after a short warning; every enemy in its path
   is hit, but one that isn't stuck may step out of the way (not the one that sprang it) */
function swingPendulum(t,e,c){ const line=patternTiles(t,c.spread==='column'?'column':'row','e'), dur=.7;
  B.teles.push({tiles:line,t:0,dur,friendly:true}); line.forEach(x=>flash(x,colorOf(c),.6));
  if(e.hp>0){ e.stunT=Math.max(e.stunT,dur); cancelAttack(e); }
  later(dur,()=>{
    for(const x of line){ const o=x.occ; if(!o||o.kind!=='enemy'||o===e||o.hp<=0||o.stunT>0||o.freezeT>0) continue;
      const out=neighbors(o.tile).filter(n=>n.side==='e'&&!n.occ&&!line.includes(n)&&!(n.holeT>0));
      if(out.length&&Math.random()<.35){ floater('dodged',o.tile,'#9fdcff'); stepEnemy(o,pick(out)); } }
    const a=line[0], b=line[line.length-1]; if(a&&b) B.fx.push({kind:'bolt',a,b,color:'#c8a070',t:0,life:.3});
    line.forEach(x=>{ burst(x,'#c8a070',6,.6); if(x.occ&&x.occ.kind==='enemy') hitEnemy(x.occ,c.pow,c); }); }); }
/* How a buffed wand looks. While a Power boon runs (wand x1.8) your shots fly big, orange-red and
   burning; under a Pact (+30%, paid in health) they are a dark glowing blue; under Courage (+30%) golden.
   Each leaves a trail of sparks and lights the arena as it flies, and the weapon's tip wears the same
   colour with an aura that gives off sparks. Power wins when more than one is running. */
const WAND_BUFF={power:{c:'#ff6a3d', c2:'#ffd27a', size:1.55, trail:2.2, name:'Power'},
                 pact:{c:'#1a3fd1', c2:'#6fa8ff', size:1.3, trail:1.8, name:'Pact'},
                 courage:{c:'#f2c94c', c2:'#fff3b0', size:1.3, trail:1.6, name:'Courage'}};
// The trail of a buffed shot: pixels laid by a 4x4 ordered dither, fading from the shot back to its
// tail and thinning toward the edges, and swaying in a travelling wave, so it shimmers like heat in the air.
const BAYER4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
function wandTrail(ctx,tx,ty,hx,hy,r,L,S){ const dx=hx-tx, dy=hy-ty, len=Math.hypot(dx,dy); if(len<2) return;
  const px=Math.max(2,Math.round(S*.035)), ux=dx/len, uy=dy/len, nx=-uy, ny=ux, W=r*L.trail*.6, T=B.time, steps=Math.ceil(len/px);
  for(let i=0;i<=steps;i++){ const t=i/steps, f=Math.pow(t,1.4), w=W*(.35+.65*t), sway=Math.sin(t*9-T*26)*r*.45*(1-t), cx=tx+dx*t+nx*sway, cy=ty+dy*t+ny*sway;
    for(let j=-Math.ceil(w/px);j<=Math.ceil(w/px);j++){ const e=1-Math.abs(j*px)/(w+px); if(e<=0) continue; const a=f*e*(.75+.25*Math.sin(t*14-T*30+j));
      const X=Math.round((cx+nx*j*px)/px), Y=Math.round((cy+ny*j*px)/px); if(a<=BAYER4[(Y&3)*4+(X&3)]) continue;
      ctx.fillStyle=e>.6&&t>.45?L.c2:L.c; ctx.globalAlpha=Math.min(1,.35+.55*a); ctx.fillRect(X*px,Y*px,px,px); } }
  ctx.globalAlpha=1; }
const wandBuff=p=>!p?null:p.powerT>0||p.setT>0?'power':p.pactT>0?'pact':p.courageT>0?'courage':null;
function shoot(from,tiles,o){ if(o.from==='p'&&o.card&&(o.card.rider==='pierce'||o.card.edge==='pierce')) o.dig=true;   // the Pierce rider (strikes.js) and a charge's Pierce edge (kinds.js)
  B.shots.push(Object.assign({a:from,tiles,i:-1,stepT:0,speed:o.from==='p'?.045*((B.player&&B.player.shotSpeed)||1):.08,hit:new Set()},o)); }

function fireWand(charged){ if(B&&B.player){ B.player.poseT=B.time; B.player.poseK='attack'; }
  const b=B, p=b.player; if(b.phase!=='fight'||p.wandCd>0) return;
  const w=p.wand||{kind:'wand',tap:3,charged:7,cd:.3,ccd:.5};
  p.wandCd=charged?w.ccd||.5:w.cd||.3;
  if(w.hpPerShot) payHp(w.hpPerShot);
  if(w.misfire&&Math.random()<w.misfire){ floater('fizzle',p.tile,'#93a9ba'); burst(p.tile,'#56606a',5,1); return; }
  let dmg=Math.max(1,Math.round((charged?w.charged:w.tap)*(w.mult||1)*(p.setT>0?2.5:p.powerT>0?1.8:1)));
  // an elemental weapon shoots in its color, and its effects ride on the shot like a card's
  let card=w.color||w.burn||w.drain||w.zap||w.chill||w.glow?{id:'wand', name:'Wand', color:w.color, burn:w.burn||0, drain:w.drain||0,
    freeze:charged?w.chill:0, stun:w.zap&&Math.random()<w.zap?.5:0, mend:charged?w.glow:0}:null;
  const un=soulUnison();
  if(un){ card=un(charged); dmg=Math.round(dmg*1.5); }
  const row=lineTiles(p.tile,DIRS.E), buff=wandBuff(p), o=()=>({dmg,from:'p',wand:true,big:charged,card,buff});
  // each kind of weapon fires its own way (see WEAPON_KINDS in gear.js)
  switch(w.kind){
    case 'staff': shoot(p.tile,row,Object.assign(o(),{pierce:charged?1:0})); break;
    case 'bow': if(charged){ for(const dr of [-1,0,1]){ const st=dr?tileCR(p.tile.col,p.tile.r+dr):p.tile; if(st) shoot(st,lineTiles(st,DIRS.E),o()); } }
      else shoot(p.tile,row,Object.assign(o(),{pierce:1,falloff:.6})); break;
    case 'crossbow': shoot(p.tile,row,Object.assign(o(),charged?{dig:true}:{push:true})); break;
    case 'spear': shoot(p.tile,charged?row:row.slice(0,6),Object.assign(o(),charged?{pierce:9}:{})); break;
    default: shoot(p.tile,row,o());
  }
}

/* ---------------- simulation ---------------- */
const PACE=.7;
function update(dt){
  const b=B; if(!b) return;
  if(b.hitStop>0){ b.hitStop-=dt; dt*=.08; }   // a Counter Hit, a kill or a WEAK hit freezes the moment for a beat
  else if(b.slowMo>0){ b.slowMo-=dt; dt*=.25; }   // the killing blow of a boss fight plays in slow motion
  b.time+=dt;
  // Effects keep animating on the Custom screen, the fight itself is paused.
  for(const f of b.fx) f.t+=dt; b.fx=b.fx.filter(f=>f.t<f.life);
  for(const f of b.floaters){ f.t+=dt; f.y+=dt*1.2; } b.floaters=b.floaters.filter(f=>f.t<.9);
  const k=1-Math.exp(-dt*16);
  for(const u of [b.player,...b.enemies,...b.allies]){ if(u.fx!=null){ if(u.fLerp&&u.rx!=null){ u.rx+=(u.fx-u.rx)*k; u.rz+=(u.fz-u.rz)*k; if(Math.hypot(u.fx-u.rx,u.fz-u.rz)<.03) u.fLerp=false; } else { u.rx=u.fx; u.rz=u.fz; } continue; } const s=u.step; if(s&&u.rx!=null&&Math.hypot(u.rx-s.from.wx,u.rz-s.from.wz)<2.5){ const f=Math.min(1,s.t/s.dur); u.rx=s.from.wx+(s.to.wx-s.from.wx)*f; u.rz=s.from.wz+(s.to.wz-s.from.wz)*f; continue; }   // your glide (above)
    const g=u.goTo||u.tile; u.rx=u.rx==null?g.wx:u.rx+(g.wx-u.rx)*k; u.rz=u.rz==null?g.wz:u.rz+(g.wz-u.rz)*k; }   // goTo: a creature's run or dash
  for(const e of b.enemies) if(e.hp<=0&&e.deathT>0) e.deathT-=dt;
  View.shake=(View.shake||0)*Math.exp(-dt*9);
  for(const q of b.parts){ q.t+=dt; q.vy-=(q.g==null?9:q.g)*dt; if(q.drag){ const d=Math.max(0,1-q.drag*dt); q.vx*=d; q.vz*=d; q.vy*=d; } if(q.spin) q.rot=(q.rot||0)+q.spin*dt; q.wx+=q.vx*dt; q.wz+=q.vz*dt; q.y=Math.max(0,q.y+q.vy*dt); } b.parts=b.parts.filter(q=>q.t<q.life);
  for(const t of TILES) t.flash=Math.max(0,t.flash-dt*3);
  if(b.phase==='custom') return;
  if(b.phase==='fight') chainTick();
  if(b.phase==='fight'&&typeof readingTick==='function') readingTick(dt);   // perfect dodges, the bestiary (reading.js)
  // The fight runs at PACE speed (70%) so enemies, shots and attacks are easier to follow.
  // Your own moving, firing and charging stay at full speed.
  const rdt=dt; dt*=PACE;

  for(const tm of b.timers) tm.t-=dt;
  const due=b.timers.filter(tm=>tm.t<=0); b.timers=b.timers.filter(tm=>tm.t>0); due.forEach(tm=>tm.fn());
  if(b.phase!=='fight'){ b.shots=[]; b.teles=[]; return; }

  // safety: a fight with nobody left and no wave coming is won
  if(!alive().length&&Number.isInteger(b.wave)&&b.wave>=b.waves.length-1&&b.enemies.length){ b.phase='win'; b.player.charging=false; later(1.2,()=>b.hooks.onEnd&&b.hooks.onEnd(true)); return; }
  if(typeof extraTick==='function'){ extraTick(dt); if(b.phase!=='fight') return; }
  const p=b.player, haste=p.hasteT>0;
  b.gauge=Math.min(GAUGE_MAX,b.gauge+dt*(heroOn('volta')?1.5:1)*(heroAura('gauge')||1)*(p.gaugeMult||1));
  landTick(dt); timeTick(dt); strikeTick(dt);
  ['moveCd','wandCd','hurtT'].forEach(k=>p[k]=Math.max(0,p[k]-rdt));
  ['castCd','invT','powerT','setT','pactT','courageT','hasteT','regenT'].forEach(k=>p[k]=Math.max(0,p[k]-dt));
  if(p.regenT>0){ p.regenAcc=(p.regenAcc||0)+p.regenAmt*dt; if(p.regenAcc>=5){ healPlayer(5); p.regenAcc-=5; } }
  if(p.regenGear){ p.gearAcc=(p.gearAcc||0)+p.regenGear*dt; if(p.gearAcc>=3){ healPlayer(3,true); p.gearAcc-=3; } }
  if(onLand('overgrowth')){ p.landAcc=(p.landAcc||0)+3*dt; if(p.landAcc>=3){ healPlayer(3); p.landAcc-=3; } }
  if(heroAura('regen')){ p.auraAcc=(p.auraAcc||0)+heroAura('regen')*dt; if(p.auraAcc>=4){ healPlayer(4); p.auraAcc-=4; } }
  if(heroOn('thornfather')){ p.heroAcc=(p.heroAcc||0)+3*dt; if(p.heroAcc>=6){ healPlayer(6); p.heroAcc-=6; } }
  if(p.charging) p.chargeT=Math.min(1.2,p.chargeT+rdt);
  if(B.soul&&B.soul.unisonT>0&&b.phase==='fight'){ B.soul.unisonT-=dt; if(B.soul.unisonT<=0){ floater('Unison ends',p.tile,COLORS[B.soul.card.color].c); B.hooks.onSoul&&B.hooks.onSoul(); } }
  p.rootT=Math.max(0,(p.rootT||0)-dt); p.hexT=Math.max(0,(p.hexT||0)-dt); for(const q of b.piles.queue) if(q.frozenT>0) q.frozenT-=dt;
  /* Walking glides: you slide from tile to tile at a steady speed, and a walk of several tiles is one
     smooth run. Hits still go by whole tiles: you stand on the tile you are leaving until you are halfway,
     then on the one you are entering. A tile taken from under you mid-step sends you back; being knocked,
     pulled or pushed elsewhere ends the step. */
  if(p.step){ const s=p.step; if(p.tile!==(s.half?s.to:s.from)) p.step=null; else { s.t+=rdt;
      if(!s.half&&s.t>=s.dur/2){ if((s.to.occ&&s.to.occ!==p)||s.to.holeT>0){ p.step={from:s.to,to:s.from,t:s.dur-s.t,dur:s.dur,half:true}; p.path=[]; }
        else { s.half=true; s.from.occ=null; p.tile=s.to; s.to.occ=p; } }
      if(p.step&&p.step.t>=p.step.dur){ p.stepOver=p.step.t-p.step.dur; p.step=null; } } }
  freeTick(p,rdt,haste);
  p.stepOver=0;   // time left over from a step just ended carries into the next, so a run keeps an even pace

  // your shots and enemy shots travel tile by tile
  for(const s of b.shots){
    s.stepT+=dt;
    if(s.buff&&!s.done){ s.sparkT=(s.sparkT||0)-dt; if(s.sparkT<=0){ s.sparkT=.035; const L=WAND_BUFF[s.buff], f=s.i<0?s.a:s.tiles[s.i], t2=s.tiles[s.i+1]||f;
      if(f){ const k=clamp(s.stepT/s.speed,0,1); spray({wx:f.wx+(t2.wx-f.wx)*k, wz:f.wz+(t2.wz-f.wz)*k},1,{shape:'glow',color:[L.c,L.c2],y:1,v0:.1,v:.6,up0:-.3,up:.6,g:s.buff==='power'?-1.5:0,drag:2,life:.35,s:s.big?5:3.5,add:true,shrink:1}); } } }
    while(s.stepT>=s.speed&&!s.done){ s.stepT-=s.speed; s.i++;
      const t=s.tiles[s.i]; if(!t){ s.done=true; break; }
      if(s.from==='e'&&typeof perfectShot==='function') perfectShot(s,t);
      const o=t.occ;
      if(s.dig&&o&&(o.kind==='rock'||o.enemy)) continue;   // diggers tunnel under walls and rocks
      if(s.from==='p'&&t.mine){ mineBlow(t); s.done=true; }   // your shot sets off your mine (strikes.js)
      else if(o&&o.kind==='rock'){ hitRock(o,s.dmg); s.done=true; }
      else if(s.from==='p'&&o&&o.kind==='enemy'&&o.hp>0){ if(s.hit.has(o)) continue; s.hit.add(o);
        if(s.ally) crShotHit(s,o); else hitEnemy(o,s.dmg,s.card,{dig:s.dig}); if(s.onHit) s.onHit(o,t); if(s.push&&o.hp>0) shove(o,{push:1},s.dmg);
        if(s.pierce>0){ s.pierce--; s.dmg=Math.max(1,Math.round(s.dmg*(s.falloff||1))); burst(t,'#ffffff',4,.8); } else s.done=true; }
      else if(s.from==='p'&&o&&o.enemy){ hitBlock(o,s.dmg,null); s.done=true; }
      else if(s.from==='e'&&o&&o.cr&&crPassThrough(o)) continue;   // Submerge, Camouflage
      else if(s.from==='e'&&o&&o.kind!=='enemy'&&!o.enemy){ palImpact(s.owner,t,s); if(o.kind==='player') hitPlayer(s.dmg,s.owner); else hitBlock(o,s.dmg,s.owner); s.done=true; }
      if(s.done) burst(t,s.card?colorOf(s.card):s.color||'#fff',6,.8);
    }
  }
  b.shots=b.shots.filter(s=>!s.done);

  for(const l of b.lobs) l.t+=dt; b.lobs=b.lobs.filter(l=>l.t<l.dur);

  for(const tl of b.teles){ tl.t+=dt;
    if(tl.t>=tl.dur&&!tl.friendly){ if(tl.owner&&tl.owner.hp<=0) continue; if(typeof perfectCheck==='function') perfectCheck(tl);
      for(const t of tl.tiles){ flash(t,'#ff5d6c',1); const o=t.occ; if(!o) continue;
        if(o.kind==='player') hitPlayer(tl.dmg,tl.owner); else if(o.kind!=='enemy'&&o.kind!=='rock'&&!o.enemy) hitBlock(o,tl.dmg,tl.owner); }
      if(tl.after) tl.after(); } }
  b.teles=b.teles.filter(tl=>tl.t<tl.dur);

  for(const a of b.allies.slice()) updateAlly(a,dt);

  updateTerrain(dt);
  for(const e of alive()) updateEnemy(e,dt);
}


/* ---------------- input helpers ---------------- */
// Aiming lobs: tap an enemy-side tile (again to clear it). A lob card uses the aim once; a lob charge keeps it.
// cards that land on a tile you aim: lobs, lob charges, traps and environments
/* ---------------- cast preview ----------------
   What the next queued card will do if cast right now, drawn on the board until it is cast:
   the tiles it covers, the enemies it would hit (with the damage they would take), or where
   it would place walls and units. It follows you as you move. */
// the path of a shot from you: stops at the first enemy (or enemy wall, or rock) unless it digs under
function shotPath(tiles,dig){ const path=[];
  for(const t of tiles){ path.push(t); const o=t.occ; if(!o) continue;
    if(o.kind==='enemy'&&o.hp>0) return {path,hit:[t]};
    if(!dig&&(o.kind==='rock'||o.enemy)) return {path,hit:[]}; }
  return {path,hit:[]}; }
function estDamage(c,e,m){ const pl=B.player;
  return Math.max(1,Math.round((c.pow||0)*(m||1)*bossMult(c.color,e)*(e.curseT>0?1.3:1)*(pl.pactT>0||pl.courageT>0?1.3:1)*(c.valor&&pl.hp<=pl.maxHp/2?1.5:1)*heroMult(c)*((pl.power&&pl.power[c.color])||1))); }
function castPreview(){
  const b=B, inst=b&&b.piles.queue[0]; if(!inst||b.phase!=='fight') return null;
  // with Recoil, it fires from the tile you'll be thrown back to
  const c=inst.card, k=c.type==='piece'?c.base:c.type, p0=b.player, rt=c.rider==='recoil'&&recoilTile(p0), p=rt?Object.assign({},p0,{tile:rt}):p0, row=lineTiles(p.tile,DIRS.E), out={card:c,mult:inst.mult||1,area:[],hit:[],place:[],paths:[],arc:null,self:false,note:''};
  const enemyTiles=()=>alive().map(e=>e.tile), path=(tiles,dig)=>{ const r=shotPath(tiles,dig); out.area.push(...r.path); out.hit.push(...r.hit); out.paths.push(r.path); };
  const route=fn=>{ const ts=[]; for(let i=1;i<BOARD_COLS;i++){ const t=fn(i); if(!t) break; ts.push(t); } return ts; };
  if(k==='strike'||(k==='charge'&&c.fx!=='lob')){
    const sh=k==='charge'?'line':c.shape;
    if(sh==='line') path(row,false);
    else if(sh==='dig') path(row,true);
    else if(sh==='row'){ out.area.push(...row); out.paths.push(row); out.hit.push(...row.filter(t=>t.occ&&t.occ.kind==='enemy')); }
    else if(sh==='wedge'){ const ts=wedgeTiles(p.tile,4.5); out.area.push(...ts); out.hit.push(...ts.filter(t=>t.occ&&t.occ.kind==='enemy')); }
    else if(sh==='zigzag'){ const alt=tileCR(p.tile.col,p.tile.r+1)?1:-1; path(route(i=>tileCR(p.tile.col+i,p.tile.r+(i%2?alt:0))),false); }
    else if(sh==='diag'){ for(const d of [-1,1]) path(diagPath(p.tile,d),false); }
    else if(sh==='all'){ out.hit.push(...enemyTiles()); out.area.push(...out.hit); }
    else if(sh==='missiles'){ out.area.push(...enemyTiles()); out.note=c.n+' hits on random enemies'; }
    else if(STRIKE_SHAPES[sh]) strikePreview(c,p,out,path);
  }
  else if(k==='lob'||k==='trap'||k==='environment'||(k==='charge'&&c.fx==='lob')){
    const t=b.aim||nearestEnemyTile(p.tile); if(t){ const ts=patternTiles(t,aimPattern(),'e'); out.area.push(...ts); out.arc=t; if(k!=='trap') out.hit.push(...ts.filter(x=>x.occ&&x.occ.kind==='enemy')); }
  }
  else if(k==='ward'&&c.ward==='barrier') out.self=true;
  else if(k==='ward'&&c.form==='cage'){ const e=cageTarget(b.aim); if(e){ out.place.push(...cageTiles(e)); out.arc=e.tile; } }
  else if(k==='ward'||(k==='machine'&&c.ai==='bulwark')) out.place.push(...placementTiles(c.n||1,c.form));
  else if(k==='sentry'||k==='summon'||k==='machine'||k==='hero') out.place.push(...placementTiles(1));
  else out.self=true;   // boons and utilities act on you
  return out;
}
function nextIsLob(){ const q=B&&B.piles.queue[0]; if(!q) return false; const c=q.card, k=c.type==='piece'?c.base:c.type; return k==='lob'||k==='trap'||k==='environment'||(k==='charge'&&c.fx==='lob')||(k==='ward'&&c.form==='cage')||(k==='strike'&&!!STRIKE_AIMED[c.shape]); }
function aimPattern(){ const q=B.piles.queue[0]; if(!q) return 'single'; const c=q.card; return c.type==='trap'?(c.trap==='blast'?'burst':c.trap==='pendulum'?(c.spread==='column'?'column':'row'):'single'):c.type==='environment'?c.pattern:lobPattern(c); }
function setAim(t){ const b=B; if(!b||b.phase!=='fight'||!t||t.side!=='e') return; b.aim=b.aim===t?null:t; }
function cycleAim(){ const b=B; if(!b||b.phase!=='fight') return; const ts=alive().map(e=>e.tile).sort((a,c)=>a.r-c.r||a.q-c.q); if(!ts.length) return;
  b.aim=ts[(ts.indexOf(b.aim)+1)%ts.length]; }
// where your next move starts: the tile your current step ends on
/* You walk as a float: your mage glides at walking speed and can stand anywhere, between tiles too,
   while the tile you are on for hits (p.tile) is always the one nearest your mage, so it changes at the
   halfway line. Nothing snaps you back to a tile's middle when you stop. A dragged finger or a held key
   sets a point to walk toward (p.free); a tapped tile or a quick key press walks a path of tiles
   (p.path) to the middle of the last one. p.fx/p.fz is where your mage is. */
/* Where your mage may stand: on the board (inside the hexagon, or square, of the tile nearest the point, so
   never off the grid's outer edge), on your side, on your own tile or a free neighbour. Returns that tile. */
function onTile(t,x,z){ const C=tileCornerOffs(1); let sg=0;
  for(let i=0;i<C.length;i++){ const [ax,az]=C[i], [bx,bz]=C[(i+1)%C.length], c=(bx-ax)*(z-t.wz-az)-(bz-az)*(x-t.wx-ax);
    if(Math.abs(c)<1e-7) continue; const s=c>0?1:-1; if(!sg) sg=s; else if(s!==sg) return false; }
  return true; }
/* Where your mage may stand: the biggest box your half's tiles fully cover. Hexes leave a zigzag at every edge of
   your half (and at the line with the enemy's), and a push along one caught in its notches; the box's edges are
   straight, so you glide along them, and you never stand off the grid. Squares fill their box exactly. */
function pRect(){ if(P_RECT) return P_RECT;
  const xs=P_TILES.map(t=>t.wx), zs=P_TILES.map(t=>t.wz), R={x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)};
  const mine=(x,z)=>{ const t=nearestTile(x,z); return t&&t.side==='p'&&onTile(t,x,z); };
  // (each end kept a hair in, off the point where two tiles' corners meet)
  const covered=(ax,az,bx,bz)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.max(2,Math.ceil(L/.04)), e=Math.min(.02,L/4)/(L||1); for(let i=0;i<=n;i++){ const f=e+(1-2*e)*i/n; if(!mine(ax+(bx-ax)*f,az+(bz-az)*f)) return false; } return true; };
  for(let grew=true,k=0;grew&&k<400;k++){ grew=false; const e=.01;
    if(covered(R.x1+e,R.z0,R.x1+e,R.z1)){ R.x1+=e; grew=true; } if(covered(R.x0-e,R.z0,R.x0-e,R.z1)){ R.x0-=e; grew=true; }
    if(covered(R.x0,R.z1+e,R.x1,R.z1+e)){ R.z1+=e; grew=true; } if(covered(R.x0,R.z0-e,R.x1,R.z0-e)){ R.z0-=e; grew=true; } }
  return P_RECT=R; }
const inPRect=(x,z)=>{ const R=pRect(); return x>=R.x0-1e-9&&x<=R.x1+1e-9&&z>=R.z0-1e-9&&z<=R.z1+1e-9; };
function standAt(p,x,z){ if(!inPRect(x,z)) return null; const n=nearestTile(x,z); if(!n||!onTile(n,x,z)) return null;
  return n===p.tile||(n.side==='p'&&!n.occ&&!(n.holeT>0)&&neighbors(p.tile).includes(n))?n:null; }
function nearestTile(x,z){ let best=null, bd=1e9; for(const t of TILES){ const d=(t.wx-x)**2+(t.wz-z)**2; if(d<bd){ bd=d; best=t; } } return best; }
// the walking settings (debug menu › Battle › Battle movement, and the Movement lab), kept in look.js
// the walking feel up to v117, kept so the debug menu (Battle movement) and the Movement lab can go back to it
const MV_V117={mvSpeed:1.2, mvSnap:1, mvSnapR:.46, mvSnapSpd:2.3, mvRest:.6, mvDrag:2.5, mvAccel:0, mvStick:true, mvStickShow:true, mvStickR:56, mvDead:.18, mvStickMin:.25, mvStickFull:.8, mvCurve:1, mvTapMs:200, mvTapPx:12, mvStickSpeed:5, mvEven:1, mvSnapTime:.12, mvSnapAhead:true, mvStride:.5, mvFaceWalk:true, mvMomentum:true, mvMAccel:.1, mvMBrake:.22, mvMSkid:.08, mvGrip:.7, mvFlick:true, mvFlickV0:450, mvFlickV1:1400, mvFlickMin:2, mvFlickMax:3, mvFlickTime:.4, mvFlickWin:90};
const MV_DEF={mvSpeed:1.2, mvSnap:1, mvSnapR:.7, mvSnapSpd:5, mvRest:.6, mvDrag:2.5, mvAccel:0, mvStick:true, mvStickShow:true, mvStickR:39, mvDead:.15, mvStickMin:.15, mvStickFull:.7, mvCurve:.49, mvTapMs:306, mvTapPx:17, mvStickSpeed:8, mvEven:1, mvSnapTime:.12, mvSnapAhead:true, mvStride:.5, mvFaceWalk:true, mvMomentum:true, mvMAccel:.36, mvMBrake:.06, mvMSkid:.22, mvGrip:.93, mvFlick:true, mvFlickV0:450, mvFlickV1:1400, mvFlickMin:1, mvFlickMax:3, mvFlickTime:.35, mvFlickWin:90};
const MV=k=>typeof XLIT!=='undefined'&&XLIT[k]!=null?XLIT[k]:MV_DEF[k];
function freeTarget(x,z,key,k,raw){ const b=B; if(!b||b.phase!=='fight') return; const p=b.player;
  const xs=P_TILES.map(t=>t.wx), zs=P_TILES.map(t=>t.wz), o=p.free;
  // kept on your half of the board, but for a joystick's (raw), which only gives the way to go: clamped, a push
  // into the border would turn into a slide along it
  const f=raw?{x,z,key:!!key,k:k==null?1:k,raw:true}:{x:Math.max(Math.min(...xs),Math.min(Math.max(...xs),x)), z:Math.max(Math.min(...zs),Math.min(Math.max(...zs),z)), key:!!key, k:k==null?1:k};   // k: the share of walking speed (a joystick pushed part way)
  f.t=o&&Math.hypot(o.x-f.x,o.z-f.z)<.02?o.t:b.time;   // when the finger last moved
  p.free=f; p.path=[]; p.lane=null; }
function freeEnd(){ if(B&&B.player) B.player.free=null; }
function freeTick(p,rdt,haste){
  // a fight's start, or knocked, pulled or pushed elsewhere: carry on from the new tile (drawn sliding there)
  if(p.fx==null||p.fTile!==p.tile){ if(p.fx!=null) p.fLerp=true; p.fx=p.tile.wx; p.fz=p.tile.wz; p.fTile=p.tile; p.snap=null; p.vx=p.vz=0; }
  while(p.path.length>1&&p.path[0]===p.tile) p.path.shift();   // once in a tile on the way, head for the next
  p.fmov=false; if(p.rootT>0||p.moveCd>0){ p.fv=0; p.vx=p.vz=0; return; }
  const sp=Math.min(...neighbors(p.tile).map(n=>Math.hypot(n.wx-p.tile.wx,n.wz-p.tile.wz)));
  /* Momentum is the joystick's alone: it starts when the stick steers (carrying on at the speed you were going)
     and lasts through the coast after you let go, until a tap, a key or a dragged point takes over. */
  if(MV('mvMomentum')){
    if(p.free&&p.free.raw){ if(!p.momo){ p.momo=true; const s=p.lastSpd||0, d=p.lastDir; p.vx=d?d[0]*s:0; p.vz=d?d[1]*s:0; } }
    else if(p.path.length||p.free) p.momo=false;
    if(p.momo) return momentumTick(p,rdt,haste,sp); }
  else p.momo=false;
  const x0=p.fx, z0=p.fz; p.lastSpd=0;
  /* The magnet: once you stop (you let go, or your finger has rested a moment where your mage stands),
     you slide part of the way (mvSnap) into the middle of your tile, if you are within mvSnapR tiles of it. */
  const tag=p.free?p.free.t:-1;
  const still=!p.path.length&&(p.snap&&p.snap.tag===tag||!p.free||B.time-p.free.t>=MV('mvRest')&&Math.hypot(p.free.x-p.fx,p.free.z-p.fz)<.02);
  if(!still){ p.snap=null; if(!p.moving){ p.moving=true; p.moveFrom=p.tile; } }   // the tile a move set off from
  else if(p.snap&&p.snap.tag!==tag&&Math.hypot(p.snap.x-p.fx,p.snap.z-p.fz)<.01) p.snap.tag=tag;   // letting go after the magnet pulled you in: no second pull
  else if(!p.snap||p.snap.tag!==tag){ const ox=p.tile.wx-p.fx, oz=p.tile.wz-p.fz;
    let k=Math.hypot(ox,oz)/sp<=MV('mvSnapR')+1e-6?MV('mvSnap'):0;
    // mvSnapAhead: the magnet never pulls you back into the tile you set off from, so a small deliberate move
    // stays put; in any other tile it settles you into the middle from either side
    if(MV('mvSnapAhead')&&p.tile===p.moveFrom&&p.lastDir&&ox*p.lastDir[0]+oz*p.lastDir[1]<-1e-6) k=0;
    p.snap={tag,x:p.fx+ox*k,z:p.fz+oz*k}; }
  if(still) p.moving=false;
  if(!still&&!p.free&&!p.path.length){ p.fv=0; return; }
  // walking speed in tiles a second: a joystick's own top speed (mvStickSpeed), or the step speed of taps and keys
  const walkTps=MV('mvSpeed')/(haste?.08:.14), tps=!still&&p.free&&p.free.tps?p.free.tps*(haste?1.75:1):walkTps;
  let budget=rdt*sp*tps/((icy(p.tile)?2.2:1)*(p.slow||1));
  if(still){ budget*=MV('mvSnapSpd')*walkTps/tps; p.fv=0;
    // the magnet eases you in (mvSnapTime): fast at first, slowing into the middle, never faster than Magnet speed
    if(MV('mvSnapTime')>0&&p.snap){ const d=Math.hypot(p.snap.x-p.fx,p.snap.z-p.fz); budget=Math.min(budget,d<.01?d:d*(1-Math.exp(-rdt/MV('mvSnapTime')))); } }
  else { p.fv=MV('mvAccel')>0?Math.min(1,(p.fv||0)+rdt/MV('mvAccel')):1; budget*=p.fv*(p.free?p.free.k:1);   // speeding up from a stand; a joystick's push
    const go=p.free||(p.path.length?{x:p.path[0].wx,z:p.path[0].wz}:null); if(go) budget*=evenK(p.fx,p.fz,go.x-p.fx,go.z-p.fz); }
  const ok=(x,z)=>standAt(p,x,z);
  for(let i=0;i<12&&budget>1e-6;i++){
    const go=still?p.snap:p.free||(p.path.length?{x:p.path[0].wx,z:p.path[0].wz}:null); if(!go) break;
    const dx=go.x-p.fx, dz=go.z-p.fz, d=Math.hypot(dx,dz);
    if(d<1e-4){ if(!still&&!p.free&&p.path.length){ p.path.shift(); continue; } break; }
    const m=Math.min(d,budget,sp*.25);   // short hops, so a slow frame can't jump a tile
    let x=p.fx+dx/d*m, z=p.fz+dz/d*m, n=ok(x,z);
    for(let f=.5;!n&&f>.03;f*=.5){ x=p.fx+dx/d*m*f; z=p.fz+dz/d*m*f; n=ok(x,z); }   // a shorter hop, right up to what is in the way
    // blocked: slide along whatever is in the way, if you are pushing along it at least a little (a thumb a
    // hair off straight into the border shouldn't creep you sideways into the next row)
    if(!n&&Math.abs(dx)/d>.35){ x=p.fx+dx/d*m; z=p.fz; n=ok(x,z); }
    if(!n&&Math.abs(dz)/d>.35){ x=p.fx; z=p.fz+dz/d*m; n=ok(x,z); }
    if(!n||Math.hypot(x-p.fx,z-p.fz)<1e-6){ if(!p.free) p.path=[]; break; }
    const hx=x-p.fx, hz=z-p.fz, hl=Math.hypot(hx,hz); p.walkDist=(p.walkDist||0)+hl; if(!still) p.lastDir=[hx/hl,hz/hl];
    p.fx=x; p.fz=z; p.fmov=true; budget-=m;
    if(n!==p.tile){ p.tile.occ=null; p.tile=n; n.occ=p; p.fTile=n; } }
  if(rdt>0) p.lastSpd=Math.hypot(p.fx-x0,p.fz-z0)/rdt;
  { const d=p.lastDir, full=tps*sp/((icy(p.tile)?2.2:1)*(p.slow||1))*(d?evenK(p.fx,p.fz,d[0],d[1]):1);
    mvNote(p,{ph:p.fmov?(still?'magnet':'glide'):'idle', f:full>0?p.lastSpd/full:0, v:p.lastSpd, lat:0, lag:0, walled:false, ux:d?d[0]:0, uz:d?d[1]:0, tx:0, tz:0, momo:false},rdt); } }
/* Momentum (mvMomentum): your mage has a velocity (p.vx, p.vz) that the input steers rather than sets. It
   speeds up to what your push asks for in mvMAccel seconds, brakes from full speed in mvMBrake seconds, and
   turns toward a new way at a rate set by mvGrip (1 turns at once; lower keeps some of the old way, a hard
   turn back brakes first). Let go and you coast: the magnet picks the tile where your slide would end (not the
   one under you when you let go), and the slide bends and brakes smoothly into that tile's middle (or just
   stops where it ends, if the magnet would not pull there). The tile you are hit on is still the nearest. */
function momentumTick(p,rdt,haste,sp){
  const walkTps=MV('mvSpeed')/(haste?.08:.14), slowK=1/((icy(p.tile)?2.2:1)*(p.slow||1));
  const top=(p.free&&p.free.tps?p.free.tps*(haste?1.75:1):walkTps)*sp*slowK, ref=(MV('mvStickSpeed')||walkTps)*sp*slowK;   // board units a second
  const A=ref/Math.max(.01,MV('mvMAccel')), Bk=ref/Math.max(.01,MV('mvMBrake'));   // speeding up and braking, units/s²
  let vx=p.vx||0, vz=p.vz||0, v=Math.hypot(vx,vz);
  const tag=p.free?p.free.t:-1;
  const resting=p.free&&!p.free.raw&&!p.free.key&&B.time-p.free.t>=MV('mvRest')&&Math.hypot(p.free.x-p.fx,p.free.z-p.fz)<.02;   // a dragging finger at rest
  const still=!p.path.length&&(!p.free||resting||!!(p.snap&&p.snap.tag===tag));
  if(!still){ p.snap=null; if(!p.moving){ p.moving=true; p.moveFrom=p.tile; } }
  else { p.moving=false;
    if(!p.snap||p.snap.tag!==tag){   // where the slide will end, and the magnet's pull there
      const s=v>1e-4?v/(2*Bk):0, stand=(x,z)=>{ const t=inPRect(x,z)&&nearestTile(x,z); return t&&onTile(t,x,z)&&(t===p.tile||t.side==='p'&&!t.occ&&!(t.holeT>0)); };
      let Sx=p.fx+vx*s, Sz=p.fz+vz*s;
      // a slide aimed off the grid, past the border or into something stops where you can last stand
      for(let f=1;f>0&&!stand(Sx,Sz);f-=.125){ Sx=p.fx+vx*s*f; Sz=p.fz+vz*s*f; }
      if(!stand(Sx,Sz)){ Sx=p.fx; Sz=p.fz; }
      const t0=nearestTile(Sx,Sz)||p.tile, dir=v>1e-4?[vx/v,vz/v]:p.lastDir, sliding=v>.05;
      /* The magnet: the middle of the tile you would stop in, or of one next to it, if it is in range. Sliding, it
         only ever takes you on ahead of where you are (never back against the way you go), and it lands you
         there by braking a little harder or softer (p.snap.a), never by pulling: in reach of that, or none. */
      let best=null, bd=1e9;
      if(MV('mvSnap')>0) for(const t of [t0,...neighbors(t0)]){
        if(t.side!=='p'||t.occ&&t.occ!==p||t.holeT>0) continue;   // never into a tile you can't stand on
        const ox=t.wx-Sx, oz=t.wz-Sz, dS=Math.hypot(ox,oz);
        if(!(dS/sp<=MV('mvSnapR')+1e-6||p.walled&&t===p.tile)||dS>=bd) continue;
        if(MV('mvSnapAhead')&&t===p.moveFrom&&dir&&ox*dir[0]+oz*dir[1]<-1e-6) continue;   // nor back into the tile you set off from
        if(sliding){ const gx=Sx+ox*MV('mvSnap'), gz=Sz+oz*MV('mvSnap'), ahead=(gx-p.fx)*dir[0]+(gz-p.fz)*dir[1];
          if(ahead<-1e-6) continue; const a=v*v/(2*Math.max(1e-4,Math.hypot(gx-p.fx,gz-p.fz))); if(a>Bk*2.5||a<Bk*.5) continue; }
        best=t; bd=dS; }
      const k=best?MV('mvSnap'):0, ox=best?best.wx-Sx:0, oz=best?best.wz-Sz:0, gx=Sx+ox*k, gz=Sz+oz*k, gd=Math.hypot(gx-p.fx,gz-p.fz);
      p.snap={tag,x:gx,z:gz,a:sliding&&gd>1e-4?clamp(v*v/(2*gd),Bk*.5,Bk*2.5):0}; } }
  // what the input asks for: a point to reach, and whether to brake to a stop on it (arrive) or run on through it
  let gx=null, gz=null, arrive=true, want=0;
  if(still){ if(p.snap){ gx=p.snap.x; gz=p.snap.z; want=p.snap.flick?1e9:walkTps*sp*slowK*MV('mvSnapSpd'); } }   // a flick glides at its own pace
  else if(p.free){ gx=p.free.x; gz=p.free.z; arrive=!p.free.raw; want=top*(p.free.k==null?1:p.free.k); }
  else if(p.path.length){ gx=p.path[0].wx; gz=p.path[0].wz; arrive=p.path.length===1; want=top; }
  let tx=0, tz=0, d=0;
  if(gx!=null){ const dx=gx-p.fx, dz=gz-p.fz; d=Math.hypot(dx,dz);
    if(d<1e-3&&v<.05){ if(!still&&!p.free&&p.path.length) p.path.shift(); d=0; }
    else if(d>1e-6){ let s=want*(still?1:evenK(p.fx,p.fz,dx,dz)); if(arrive) s=Math.min(s,Math.sqrt(2*(still&&p.snap&&p.snap.a||Bk)*d)); if(still&&p.snap&&p.snap.a) s=Math.max(s,Math.min(v,Math.sqrt(2*p.snap.a*d))); tx=dx/d*s; tz=dz/d*s; } }
  // steer the velocity toward that: speed up at A, slow at Bk (landing on the magnet's point: at its own rate), turn
  // at the grip's rate; a hard turn back skids to a stop at Sk first
  const ts=Math.hypot(tx,tz), g=still?1:MV('mvGrip'), Sk=ref/Math.max(.01,MV('mvMSkid')), Bd=still&&p.snap&&p.snap.a?Math.max(Bk,p.snap.a*1.25):Bk;
  if(v<1e-4) v=0;
  let ux=v?vx/v:(ts?tx/ts:0), uz=v?vz/v:(ts?tz/ts:0);
  const v0=v, ux0=ux, uz0=uz, dot0=ts>1e-6?ux*tx/ts+uz*tz/ts:1;
  if(ts>1e-6){ const wx=tx/ts, wz=tz/ts, dot=ux*wx+uz*wz;
    if(v>0&&dot<-.3&&!still){ v=Math.max(0,v-Sk*rdt); if(v===0){ ux=wx; uz=wz; } }   // a hard turn back: skid first
    else if(g>=.999||v===0){ ux=wx; uz=wz; v=v+clamp(ts-v,-Bd*rdt,A*rdt); }
    else { const f=1-Math.exp(-rdt*3/(1-g)); let nx=ux+(wx-ux)*f, nz=uz+(wz-uz)*f; const nl=Math.hypot(nx,nz)||1; ux=nx/nl; uz=nz/nl; v=v+clamp(ts-v,-Bk*rdt,A*rdt); } }
  else v=Math.max(0,v-Bk*rdt);
  // arriving: never step past the point
  let mx=ux*v*rdt, mz=uz*v*rdt;
  if(arrive&&gx!=null&&d>0&&Math.hypot(mx,mz)>=d&&mx*(gx-p.fx)+mz*(gz-p.fz)>0){ mx=gx-p.fx; mz=gz-p.fz; v=0; }   // (only while heading there)
  const [rx,rz]=freeMoveBy(p,mx,mz,sp), moved=Math.hypot(rx,rz);
  // what stopped you (a wall, the border) takes that part of your speed away
  p.walled=Math.hypot(mx,mz)>1e-6&&moved<Math.hypot(mx,mz)*.98;
  if(p.walled&&rdt>0){ v=moved/rdt; if(moved>1e-7){ ux=rx/moved; uz=rz/moved; } else v=0; }
  p.vx=ux*v; p.vz=uz*v; p.fmov=moved>1e-5;
  if(p.fmov&&!still) p.lastDir=[rx/moved,rz/moved];
  { const s=v>1e-4?v/(2*Bk):0; p.coast=[p.fx+p.vx*s,p.fz+p.vz*s]; }   // for Show movement
  // for Show movement's gizmos: which part of the move you are in, how fast against full push, how hard you turn
  { const k=p.free&&p.free.k!=null?p.free.k:1, full=!still&&ts>1e-6&&k>0?ts/k:top*evenK(p.fx,p.fz,v?ux:1,v?uz:0);
    let ph; if(still) ph=v>.05?'coast':'idle';
    else if(ts>1e-6&&dot0<-.3&&g<.999&&v0>0&&v<v0) ph='brake';
    else if(v<ts*.995&&v>=v0-1e-6&&ts>1e-6) ph='accel';
    else if(v<v0-1e-6) ph='brake';
    else ph=v>.05?(k>=.999?'top':'cruise'):'idle';
    const turned=Math.acos(clamp(ux0*ux+uz0*uz,-1,1)), lag=ts>1e-6&&v>.05?Math.acos(clamp(ux*tx/ts+uz*tz/ts,-1,1))*180/Math.PI:0;
    const side=Math.sign(ux*(tz||0)-uz*(tx||0))||0;
    mvNote(p,{ph, f:full>0?v/full:0, v, A, Bk, lat:v0>.05&&rdt>0?v*turned/rdt:0, lag, side, walled:p.walled, ux, uz, tx:ts>1e-6?tx/ts:0, tz:ts>1e-6?tz/ts:0, momo:true}, rdt); }
  if(!still&&!p.free&&!p.path.length) p.snap=null; }
/* A flick (mvFlick): let go of the joystick while your thumb is still moving fast (ui.js dragEnd) and your mage is
   thrown that way: a light flick (mvFlickV0 px/s) carries you mvFlickMin tiles, a hard one (mvFlickV1) mvFlickMax,
   gliding and slowing all the way (over mvFlickTime seconds) until the magnet sets you on the last tile's middle.
   The tiles are counted from your own tile (or its middle, if that is still well ahead of you), one beside the
   next; flicks in a row keep to the line the first set off from (hexes to the side sit half a tile up or down, so
   left, right, left, right would otherwise wander off down the board). */
function flickThrow(dx,dz,str){ const b=B; if(!b||b.phase!=='fight'||!MV('mvMomentum')) return false; const p=b.player, l=Math.hypot(dx,dz);
  if(!p||p.fx==null||l<1e-6||p.rootT>0) return false; dx/=l; dz/=l;
  const c=p.tile, sp=Math.min(...neighbors(c).map(n=>Math.hypot(n.wx-c.wx,n.wz-c.wz)));
  if(!p.flickHome||b.time-p.flickHome.t>1) p.flickHome={x:c.wx}; p.flickHome.t=b.time; const hx=p.flickHome.x;
  const ok=n=>n.side==='p'&&!(n.occ&&n.occ!==p)&&!(n.holeT>0);
  const next=(t,fx,fz)=>{ let to=null, bc=-9; for(const n of neighbors(t)){ if(!ok(n)) continue;
      const ox=n.wx-fx, oz=n.wz-fz, cos=(ox*dx+oz*dz)/(Math.hypot(ox,oz)||1); if(cos<.5) continue;
      // the most that way; a tie, the one nearer that line, then the one further back
      if(cos>bc+.02||Math.abs(cos-bc)<=.02&&(Math.abs(n.wx-hx)<Math.abs(to.wx-hx)-1e-6||Math.abs(Math.abs(n.wx-hx)-Math.abs(to.wx-hx))<=1e-6&&n.wx<to.wx)){ if(cos>bc) bc=cos; to=n; } }
    return to; };
  const want=Math.max(1,Math.round(MV('mvFlickMin')+(MV('mvFlickMax')-MV('mvFlickMin'))*clamp(str,0,1)));
  let to=null, k=0;
  if((c.wx-p.fx)*dx+(c.wz-p.fz)*dz>.25*sp){ to=c; k=1; }   // your own tile's middle, ahead of you, counts as the first
  for(let t=to||c, fx=to?c.wx:p.fx, fz=to?c.wz:p.fz;k<want;k++){ const n=next(t,fx,fz); if(!n) break; to=t=n; fx=n.wx; fz=n.wz; }
  if(!to) return false;
  // launched at the speed that glides to that middle in mvFlickTime, slowing evenly the whole way
  const ox=to.wx-p.fx, oz=to.wz-p.fz, d=Math.hypot(ox,oz); if(d<1e-3) return false;
  const v0=2*d/Math.max(.05,MV('mvFlickTime')), a=v0*v0/(2*d);
  p.momo=true; p.free=null; p.path=[]; p.vx=ox/d*v0; p.vz=oz/d*v0; p.moving=false;
  p.snap={tag:-1,x:to.wx,z:to.wz,a,flick:true}; return true; }
// keeps Show movement's notes: the latest (p.mvDiag, with how long you have been in this part of the move) and a
// few seconds of history for its speed graph
function mvNote(p,d,rdt){ const o=p.mvDiag; d.phT=o&&o.ph===d.ph?o.phT+rdt:0; p.mvDiag=d;
  (p.mvHist||(p.mvHist=[])).push([Math.min(1.6,d.f),d.ph,d.walled]); if(p.mvHist.length>150) p.mvHist.shift(); }
// move your mage by (mx, mz) in short hops, stopping at (or sliding along) what is in the way; returns the move made
function freeMoveBy(p,mx,mz,sp){ const L=Math.hypot(mx,mz); if(L<1e-7) return [0,0];
  const ok=(x,z)=>standAt(p,x,z);
  const ux=mx/L, uz=mz/L; let left=L, rx=0, rz=0;
  for(let i=0;i<16&&left>1e-6;i++){ const m=Math.min(left,sp*.25); let x=p.fx+ux*m, z=p.fz+uz*m, n=ok(x,z);
    // blocked: up to what is in the way, then the rest of the hop slides along it (straight across or down the
    // board, else turned toward the way it was going), so a push at the edge glides along it instead of creeping
    // ever closer and stopping
    for(let f=.5;!n&&f>.03;f*=.5){ x=p.fx+ux*m*f; z=p.fz+uz*m*f; n=ok(x,z); }
    if(!n){ x=p.fx; z=p.fz; }   // already against it
    if(x!==p.fx+ux*m||z!==p.fz+uz*m){ const r=m-Math.hypot(x-p.fx,z-p.fz), x0=x, z0=z;
      let s2=null; if(Math.abs(ux)>.35&&ok(x0+ux*r,z0)) s2=[x0+ux*r,z0]; else if(Math.abs(uz)>.35&&ok(x0,z0+uz*r)) s2=[x0,z0+uz*r];
      for(let a=15;!s2&&a<=75;a+=15){ const c=Math.cos(a*Math.PI/180), sn=Math.sin(a*Math.PI/180);
        const L2=r*Math.min(1,2*c);   // a glancing push keeps its speed along it (a hex edge's zigzag would eat it); a hard one slows
        for(const sg of [1,-1]){ const dx=ux*c-uz*sn*sg, dz=uz*c+ux*sn*sg; if(ok(x0+dx*L2,z0+dz*L2)){ s2=[x0+dx*L2,z0+dz*L2]; break; } } }
      if(s2){ x=s2[0]; z=s2[1]; n=ok(x,z); } else if(x===p.fx&&z===p.fz) n=null; }
    if(!n&&Math.abs(ux)>.35){ x=p.fx+ux*m; z=p.fz; n=ok(x,z); }
    if(!n&&Math.abs(uz)>.35){ x=p.fx; z=p.fz+uz*m; n=ok(x,z); }
    if(!n) break; const hx=x-p.fx, hz=z-p.fz, hl=Math.hypot(hx,hz); if(hl<1e-7) break;
    p.fx=x; p.fz=z; rx+=hx; rz+=hz; left-=m; p.walkDist=(p.walkDist||0)+hl;
    if(n!==p.tile){ p.tile.occ=null; p.tile=n; n.occ=p; p.fTile=n; } }
  return [rx,rz]; }
/* Even speed on screen (mvEven): the camera looks down the board at a slant, so a board unit toward the enemies
   is shorter on screen than one across, and everything nearer the camera is bigger. Walking is sped up or slowed
   by the way you go so it covers the same screen distance a second as walking across the middle of the board
   (1: fully even, 0: the same speed on the board every way). */
function evenK(x,z,dx,dz){ const e=MV('mvEven'), l=Math.hypot(dx,dz); if(!(e>0)||l<1e-6) return 1;
  const a=proj(x,0,z), b=proj(x+dx/l*.1,0,z+dz/l*.1), c0=proj(0,0,0), c1=proj(0,0,.1);
  const sDir=Math.hypot(b[0]-a[0],b[1]-a[1]), sRef=Math.hypot(c1[0]-c0[0],c1[1]-c0[1]); if(!(sDir>0)) return 1;
  return 1+(clamp(sRef/sDir,.5,2)-1)*e; }
/* Which way your mage faces (mvFaceWalk): the way you walk while you walk (left or right on screen; walking
   straight up or down keeps the last), and the nearest enemy when you stand, charge or fire. */
function playerFlip(p,foe){ const busy=p.charging||(B.time-(p.poseT??-9))<.28;
  if(MV('mvFaceWalk')&&p.fmov&&!busy&&p.lastDir){ const [x,z]=posOf(p), a=proj(x,0,z), b=proj(x+p.lastDir[0],0,z+p.lastDir[1]), sx=b[0]-a[0], sy=b[1]-a[1];
    if(Math.abs(sx)>.3*Math.hypot(sx,sy)) p.faceL=sx<0; return p.faceL??facing(p,foe,false); }
  if(foe||!MV('mvFaceWalk')){ p.faceL=facing(p,foe,false); return p.faceL; }
  return !!p.faceL; }
/* Show movement (debug menu › Battle movement, or the Movement lab): what the walking settings do, drawn
   on the board. Cyan: each tile's magnet zone (stop inside it and you are pulled to the middle). Yellow
   outline: the tile you are hit on. White: where your mage stands, a line to where your finger points, and
   a ring that fills while your finger rests (the magnet pulls when it closes). Pink: where the magnet is
   taking you. */
function mvOverlay(ctx,b){ const p=b.player; if(!p||p.fx==null) return;
  const sp=Math.min(...neighbors(p.tile).map(n=>Math.hypot(n.wx-p.tile.wx,n.wz-p.tile.wz))), R=MV('mvSnapR')*sp;
  const poly=pts=>{ ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); };
  const ring=(wx,wz,r,n=28)=>Array.from({length:n},(_,i)=>proj(wx+Math.cos(i/n*TAU)*r,0,wz+Math.sin(i/n*TAU)*r));
  ctx.save();
  if(MV('mvSnap')>0&&R>0) for(const t of P_TILES){ if(t.occ&&t.occ!==p) continue;
    ctx.save(); poly(hexCorners(t,1)); ctx.clip(); poly(ring(t.wx,t.wz,R)); ctx.fillStyle='rgba(80,220,255,'+(.1+.16*MV('mvSnap'))+')'; ctx.fill();
    ctx.strokeStyle='rgba(120,235,255,.55)'; ctx.lineWidth=1.2; ctx.stroke(); ctx.restore(); }
  poly(hexCorners(p.tile,.97)); ctx.strokeStyle='#ffe066'; ctx.lineWidth=2.5; ctx.stroke();
  const [mx,my]=proj(p.fx,0,p.fz), dot=(x,y,r,c)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); };
  if(p.free){ const [fx,fy]=proj(p.free.x,0,p.free.z); ctx.setLineDash([5,4]); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(fx,fy); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(fx-6,fy-6); ctx.lineTo(fx+6,fy+6); ctx.moveTo(fx+6,fy-6); ctx.lineTo(fx-6,fy+6); ctx.stroke();
    const k=MV('mvRest')>0?Math.min(1,(b.time-p.free.t)/MV('mvRest')):1; if(!p.snap&&k<1){ ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(mx,my,13,-Math.PI/2,-Math.PI/2+k*TAU); ctx.stroke(); } }
  if(MV('mvMomentum')&&p.coast&&p.fmov){ const [cx,cy]=proj(p.coast[0],0,p.coast[1]); ctx.strokeStyle='rgba(255,106,213,.8)'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(cx,cy); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(cx,cy,6,0,TAU); ctx.stroke(); }   // momentum: where you would stop if you let go now
  if(p.snap){ const [sx,sy]=proj(p.snap.x,0,p.snap.z); ctx.strokeStyle='#ff6ad5'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(sx,sy); ctx.stroke(); dot(sx,sy,4.5,'#ff6ad5'); }
  mvGizmos(ctx,p,mx,my);
  dot(mx,my,4,'#ffffff'); ctx.restore(); }
/* Show movement's gizmos, at your mage. The ring fills with your speed against a full push and takes the colour
   of the part of the move you are in (MV_COL); a thicker rim means you have hit top speed. The arrow is your
   velocity, the thin white line the way the stick points, and the line square to the arrow is the turn (normal)
   force: cyan while the turn keeps up, red while grip holds it back (you are moving more than 8° off the stick).
   A red cross: a wall or the edge is stopping you. */
const MV_COL={idle:'#6b7785', accel:'#ffd23f', top:'#39ff8a', cruise:'#5fd4ff', brake:'#ff5d6c', coast:'#ff9a3a', glide:'#bfeaff', magnet:'#ff6ad5'};
const MV_NAME={idle:'Standing', accel:'Speeding up', top:'Top speed', cruise:'Cruising', brake:'Braking', coast:'Coasting', glide:'Gliding', magnet:'Magnet'};
function mvGizmos(ctx,p,mx,my){ const d=p.mvDiag; if(!d) return; const c=MV_COL[d.ph]||'#fff', f=Math.min(1,d.f), R=17;
  const at=(dx,dz,len)=>{ const [x,y]=proj(p.fx+dx*.4,0,p.fz+dz*.4), l=Math.hypot(x-mx,y-my)||1; return [mx+(x-mx)/l*len,my+(y-my)/l*len]; };   // a board direction, drawn len px long on screen
  ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(mx,my,R,0,TAU); ctx.stroke();
  if(f>0){ ctx.strokeStyle=c; ctx.lineWidth=d.ph==='top'?6:4; ctx.beginPath(); ctx.arc(mx,my,R,-Math.PI/2,-Math.PI/2+f*TAU); ctx.stroke(); }
  if(d.tx||d.tz){ const [x,y]=at(d.tx,d.tz,46); ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(x,y); ctx.stroke(); }
  if(d.f>.02){ const L=R+8+30*Math.min(1.4,d.f), [x,y]=at(d.ux,d.uz,L), a=Math.atan2(y-my,x-mx);
    ctx.strokeStyle=c; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(mx+Math.cos(a)*R,my+Math.sin(a)*R); ctx.lineTo(x,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-Math.cos(a-.5)*8,y-Math.sin(a-.5)*8); ctx.moveTo(x,y); ctx.lineTo(x-Math.cos(a+.5)*8,y-Math.sin(a+.5)*8); ctx.stroke();
    // the normal: square to the arrow, toward the way you are turning, as long as the turn is hard
    if(d.momo&&d.lat>.05){ const n=Math.min(42,8+34*d.lat/Math.max(1e-3,d.A)), s=d.side||1, [nx,ny]=at(-d.uz*s,d.ux*s,n), mx2=(mx+x)/2, my2=(my+y)/2;
      ctx.strokeStyle=d.lag>8?'#ff5d6c':'#5fe8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(mx2,my2); ctx.lineTo(mx2+(nx-mx),my2+(ny-my)); ctx.stroke(); } }
  if(d.walled){ ctx.strokeStyle='#ff5d6c'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(mx-7,my-R-14); ctx.lineTo(mx+7,my-R); ctx.moveTo(mx+7,my-R-14); ctx.lineTo(mx-7,my-R); ctx.stroke(); }
  ctx.font='700 11px system-ui,sans-serif'; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.75)';
  const t=(MV_NAME[d.ph]||d.ph)+' '+Math.round(d.f*100)+'%'; ctx.strokeText(t,mx,my+R+15); ctx.fillStyle=c; ctx.fillText(t,mx,my+R+15); }
/* Show movement's speed graph (top left of the battle): the last 2.5 s of your speed against a full push, coloured by
   the part of the move (MV_COL), with a line at top speed; and the part you are in now, how long you have been in
   it against its setting, and the turn. */
function mvGraph(p){ const c=document.getElementById('mvGraph'); if(!c) return; const on=!!(XLIT.mvShow&&p&&p.mvHist); c.hidden=!on; if(!on) return;
  const g=c.getContext('2d'), W=c.width, H=c.height, top=16, gh=H-top-28, y=f=>top+gh-Math.min(1.25,f)/1.25*gh, h=p.mvHist, d=p.mvDiag||{};
  g.clearRect(0,0,W,H); g.fillStyle='rgba(8,11,15,.82)'; g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(57,255,138,.45)'; g.setLineDash([4,3]); g.beginPath(); g.moveTo(0,y(1)); g.lineTo(W,y(1)); g.stroke(); g.setLineDash([]);
  g.fillStyle='rgba(57,255,138,.7)'; g.font='9px system-ui,sans-serif'; g.textAlign='right'; g.fillText('top',W-3,y(1)-2);
  const dx=W/150; for(let i=1;i<h.length;i++){ const x0=(150-h.length+i-1)*dx; g.strokeStyle=MV_COL[h[i][1]]||'#fff'; g.lineWidth=2; g.beginPath(); g.moveTo(x0,y(h[i-1][0])); g.lineTo(x0+dx,y(h[i][0])); g.stroke();
    if(h[i][2]){ g.fillStyle='rgba(255,93,108,.5)'; g.fillRect(x0,top,dx,gh); } }
  const col=MV_COL[d.ph]||'#fff'; g.textAlign='left'; g.font='700 11px system-ui,sans-serif'; g.fillStyle=col;
  g.fillText((MV_NAME[d.ph]||'—')+'  '+Math.round((d.f||0)*100)+'%',4,12);
  let info=''; const s=x=>x.toFixed(2)+' s';
  if(d.ph==='accel') info='speed-up '+s(d.phT)+' of '+s(MV('mvMAccel'));
  else if(d.ph==='top') info='at top for '+s(d.phT);
  else if(d.ph==='brake'||d.ph==='coast') info=(d.ph==='coast'?'coast ':'braking ')+s(d.phT)+' · stop in '+s(d.Bk?d.v/d.Bk:0)+' of '+s(MV('mvMBrake'));
  else if(d.ph==='cruise') info='part push · '+s(d.phT);
  else if(d.ph==='magnet'||d.ph==='glide') info=(d.ph==='glide'?'tap / key glide · ':'magnet · ')+s(d.phT);
  if(d.lag>1) info+='  ·  turn '+Math.round(d.lag)+'°'+(d.lag>8?' (grip)':'');
  if(d.walled) info+='  ·  wall';
  g.font='10px system-ui,sans-serif'; g.fillStyle='#d8e2ee'; g.fillText(info,4,H-8); }
// canvas point -> board point (x,z), solved from proj() a few times over, starting near (wx,wz)
function unprojGround(x,y,wx,wz){ for(let i=0;i<5;i++){ const [a,b]=proj(wx,0,wz), [a1,b1]=proj(wx+.5,0,wz), [a2,b2]=proj(wx,0,wz+.5);
    const j11=(a1-a)*2, j21=(b1-b)*2, j12=(a2-a)*2, j22=(b2-b)*2, det=j11*j22-j12*j21; if(Math.abs(det)<1e-9) break;
    const ex=x-a, ey=y-b; wx+=(j22*ex-j12*ey)/det; wz+=(j11*ey-j21*ex)/det; }
  return [wx,wz]; }
const walkFrom=p=>p.step?p.step.to:p.tile;
// heading back to the tile you are still leaving turns you round on the spot
function walkBack(p,t){ const s=p.step; if(!s||s.half||t!==s.from) return false; p.step={from:s.to,to:s.from,t:s.dur-s.t,dur:s.dur,half:true}; p.path=[]; return true; }
function moveTo(t){ const b=B; if(!b||b.phase!=='fight'||!t) return; const p=b.player, at=walkFrom(p); p.lane=null; if(walkBack(p,t)) return; if(t===at){ p.free=null; p.path=[t]; return; } const last=p.path[p.path.length-1]; if(last===t) return; const pt=pathTo(at,t); p.free=null; p.path=pt.length||!p.step?pt:[]; }
function stepDir(d){ const b=B; if(!b||b.phase!=='fight') return; const p=b.player, at=walkFrom(p), t=tileAt(at.q+d[0],at.r+d[1]); p.lane=null; if(t&&t.side==='p'&&!t.occ){ p.free=null; p.path=[t]; } else if(t&&p.step&&!p.step.half){ const u=tileAt(p.step.from.q+d[0],p.step.from.r+d[1]); if(u===p.step.from||(d[0]===p.step.from.q-p.step.to.q&&d[1]===p.step.from.r-p.step.to.r)) walkBack(p,p.step.from); } }
// rows are offset by half a tile, so a step to the next row goes half a tile one way or the other:
// keep to the column you started in (lane), so repeated steps run straight instead of wandering
function stepVertical(up){ const p=B.player, at=walkFrom(p), ts=neighbors(at).filter(t=>(up?t.r<at.r:t.r>at.r)&&t.side==='p'&&!t.occ&&!(t.holeT>0)); if(!ts.length) return;
  if(p.lane==null) p.lane=at.wx;
  ts.sort((a,c)=>Math.abs(a.wx-p.lane)-Math.abs(c.wx-p.lane)||(a.wx-c.wx)); p.free=null; p.path=[ts[0]]; }
function wandDown(){ const b=B; if(!b||b.phase!=='fight') return; b.player.charging=true; b.player.chargeT=0; }
function wandUp(){ const b=B; if(!b) return; const p=b.player; if(!p.charging) return; p.charging=false; const ch=p.chargeT>=chargeNeed(p); p.chargeT=0; fireWand(ch); }
const chargeNeed=p=>p.wand?p.wand.charge:.9;

/* ---------------- rendering ---------------- */
// A perspective camera behind you and up: the board is turned so your side is at the bottom and the
// enemy straight ahead (ca/sa, 90 degrees), centered on screen, and the camera looks down the board
// over your shoulder, so near tiles and units are bigger than far ones.
// u = across the screen, v = toward the camera. iy/cp = sin/cos of how far it looks down; dist = how
// far back it sits (in tiles), which sets how strong the perspective is.
const View={canvas:null, ctx:null, S:40, cx:0, cy:0, w:0, h:0, dpr:1, ca:Math.cos(Math.PI/6), sa:Math.sin(Math.PI/6), iy:.6, cp:.8, dist:22, u0:0, v0:0};
const SLAB=.35;
let ISO_Y=.6;
const boardUV=(wx,wz)=>[wx*View.ca+wz*View.sa, -wx*View.sa+wz*View.ca];
// how much nearer than the board's centre a point is: 1 at the centre, above 1 close to the camera
function nearK2D(wx,y,wz){ const dv=-wx*View.sa+wz*View.ca-View.v0; return View.dist/(View.dist-y*View.iy-dv*View.cp); }
function proj2D(wx,y,wz){ const [u,v]=boardUV(wx,wz), du=u-View.u0, dv=v-View.v0, k=nearK2D(wx,y,wz);
  return [View.cx+View.S*k*du, View.cy+View.S*k*(dv*View.iy-y)]; }
// the pixel size of one tile at a point on the board, for sizing units, rings and labels
const scaleAt2D=(wx,wz)=>View.S*nearK2D(wx,0,wz);
/* Where things land on the #board canvas. With the 3D arena up (arena.js) that is through its camera;
   while battle.js draws the floor layer (aim areas, traps, telegraphs, claimed land) it is the
   top-down canvas laid on the board (PJ.decal); without WebGL it is the old flat projection. */
const PJ={decal:false};
const gl3=()=>!!View.gl;
function proj(wx,y,wz){ if(PJ.decal) return [(wz-DEC.wz0)*DEC.k,(DEC.wx1-wx)*DEC.k]; return gl3()?arenaProject(wx,y,wz):proj2D(wx,y,wz); }
function scaleAt(wx,wz){ if(PJ.decal) return DEC.k; if(!gl3()) return scaleAt2D(wx,wz); const a=arenaProject(wx,0,wz), b=arenaProject(wx,0,wz+1); return Math.hypot(b[0]-a[0],b[1]-a[1]); }
// how flat a circle on the floor looks (its height over its width), for rings drawn on the flat canvas
function viewIY(){ if(PJ.decal) return 1; if(!gl3()) return View.iy2D; const a=arenaProject(0,0,0), b=arenaProject(1,0,0), c=arenaProject(0,0,1); return Math.min(1,Math.abs(b[1]-a[1])/Math.max(1e-3,Math.hypot(c[0]-a[0],c[1]-a[1]))); }
const depthOf=t=>-t.wx*View.sa+t.wz*View.ca;
function hexCorners(t,rad,y){ const out=[];
  for(const [dx,dz] of tileCornerOffs(rad)) out.push(proj(t.wx+dx,y||0,t.wz+dz)); return out; }
// the sides of a raised tile that face the camera (edges whose outward normal points down the screen)
function frontFaces(ctx,top,drop){ const n=top.length, cx=top.reduce((a,p)=>a+p[0],0)/n, cy=top.reduce((a,p)=>a+p[1],0)/n;
  for(let i=0;i<n;i++){ const a=top[i], b=top[(i+1)%n]; if((a[1]+b[1])/2<=cy) continue;
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(b[0],b[1]+drop); ctx.lineTo(a[0],a[1]+drop); ctx.closePath(); ctx.fill(); } }

function resizeView(){
  const cv=View.canvas, r=appBox(cv), dpr=Math.min(window.devicePixelRatio||1,2);
  if(!(r.width>0&&r.height>0)) return;
  if(View.gl) View.gl=null;   // the flat fit below is worked out with the flat projection   // hidden (the app is in the background): keep the last size, a 0-size board can't be drawn
  View.dpr=dpr; View.w=r.width; View.h=r.height; cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  const portrait=r.height>r.width*1.05, ang=Math.PI/2;
  View.ca=Math.cos(ang); View.sa=Math.sin(ang); View.iy=ISO_Y=portrait?.8:.62; View.cp=Math.sqrt(1-View.iy*View.iy);
  // look at the middle of the board from a camera about 1.3 boards back
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
  for(const t of TILES){ const [u,v]=boardUV(t.wx,t.wz); u0=Math.min(u0,u); u1=Math.max(u1,u); v0=Math.min(v0,v); v1=Math.max(v1,v); }
  View.u0=(u0+u1)/2; View.v0=(v0+v1)/2; View.dist=Math.max(12,(v1-v0)*(portrait?1.3:1.8));
  // fit the projected board (plus headroom for units) into the canvas
  View.S=1; View.cx=0; View.cy=0;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const t of TILES) for(const [x,y] of hexCorners(t,1).concat(hexCorners(t,0,2.2))){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
  y1+=SLAB+.2;
  View.S=Math.min((r.width-(portrait?24:72))/(x1-x0),(r.height-16)/(y1-y0));
  View.cx=r.width/2-View.S*(x0+x1)/2; View.cy=r.height/2-View.S*(y0+y1)/2;
  View.iy2D=View.iy;
  // the 3D arena: its canvas sits right under this one, and the camera is fitted to the board
  if(View.gl!==false&&typeof arenaInit==='function'){ try{ arenaInit(); const g=document.getElementById('board3d');
      g.style.left=cv.offsetLeft+'px'; g.style.top=cv.offsetTop+'px'; g.style.width=cv.offsetWidth+'px'; g.style.height=cv.offsetHeight+'px';
      arenaFit(r.width,r.height); View.gl=true; View.S=scaleAt(0,0); View.iy=ISO_Y=viewIY(); }
    catch(e){ console.warn('3D arena off:',e); View.gl=false; } }
}
// screen -> tile: the tile whose top face is under the finger, or the nearest one close by
function pickTile(clientX,clientY){
  [clientX,clientY]=appXY(clientX,clientY); const r=appBox(View.canvas); return pickAt(clientX-r.left,clientY-r.top); }
// board point (canvas pixels) -> tile
function pickAt(x,y){
  let best=null, bd=1e9;
  for(const t of TILES){ const hc=hexCorners(t,1);
    let inside=false; for(let i=0,j=hc.length-1;i<hc.length;j=i++){ const [xi,yi]=hc[i], [xj,yj]=hc[j]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside; }
    if(inside) return t;
    const [cx,cy]=proj(t.wx,0,t.wz), d=Math.hypot(x-cx,(y-cy)/View.iy)/scaleAt(t.wx,t.wz); if(d<bd){ bd=d; best=t; } }
  return bd<1.1?best:null;
}

function poly(ctx,pts){ ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); }
function mixHex(a,b,t){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const r=Math.round(((pa>>16)&255)*(1-t)+((pb>>16)&255)*t), g=Math.round(((pa>>8)&255)*(1-t)+((pb>>8)&255)*t), bl=Math.round((pa&255)*(1-t)+(pb&255)*t);
  return 'rgb('+r+','+g+','+bl+')'; }

/* ---------------- the cave around the board ----------------
   The area you fight in (world.js) is built around the board in the same perspective: a rock
   floor past the tiles, a back wall and side walls rising out of it with a dark ceiling,
   stalactites and rubble, and the area's own light: green crystals, blue ice, glowing lava
   cracks, gold veins and pillars, storm crystals, or white motes in the black. The still part is
   drawn once into a cached canvas; glows, mist and drifting dust animate every frame. */
function caveRng(seed){ let a=seed|0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function buildCave(depth){
  const A=areaOf(depth), cv=document.createElement('canvas'); cv.width=Math.round(View.w*View.dpr); cv.height=Math.round(View.h*View.dpr);
  const ctx=cv.getContext('2d'); ctx.setTransform(View.dpr,0,0,View.dpr,0,0);
  const R=caveRng(depth*977+13), lights=[];
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const t of TILES){ x0=Math.min(x0,t.wx); x1=Math.max(x1,t.wx); z0=Math.min(z0,t.wz); z1=Math.max(z1,t.wz); }
  const back=x1+2.2, near=x0-9, side=z1+2.6;
  // the dark of the cave, a little lighter low down where the area's light pools
  const g=ctx.createLinearGradient(0,0,0,View.h); g.addColorStop(0,'#000000'); g.addColorStop(.55,A.wall); g.addColorStop(1,'#000000');
  ctx.fillStyle=g; ctx.fillRect(0,0,View.w,View.h);
  const P=(wx,y,wz)=>proj(wx,y,wz);
  const fillPoly=(pts,c)=>{ ctx.fillStyle=c; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); };
  // floor: rock, darker toward the back, with cracks
  const fl=[P(back,0,-side),P(back,0,side),P(near,0,side),P(near,0,-side)];
  const fg=ctx.createLinearGradient(0,fl[0][1],0,fl[2][1]); fg.addColorStop(0,'#000'); fg.addColorStop(.35,A.rock); fg.addColorStop(1,mixHex(A.rock,'#000000',.4));
  ctx.fillStyle=fg; ctx.beginPath(); fl.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=mixHex(A.rock,'#000000',.55); ctx.lineWidth=1;
  for(let i=0;i<26;i++){ let wx=near+R()*(back-near), wz=(R()*2-1)*side; ctx.beginPath(); ctx.moveTo(...P(wx,0,wz)); for(let k=0;k<4;k++){ wx+=R()*1.4-.7; wz+=R()*1.4-.7; ctx.lineTo(...P(wx,0,wz)); } ctx.stroke(); }
  // back wall up into the ceiling, then the side walls from far to near
  const wallFace=(pts,top,shade)=>{ fillPoly(pts,shade); ctx.strokeStyle=A.lit; ctx.lineWidth=1.5; ctx.beginPath(); top.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); };
  { const n=24, tops=[], bots=[]; for(let i=0;i<=n;i++){ const wz=-side+2*side*i/n, h=4.2+R()*2.4+Math.sin(i*.9)*.8; tops.push(P(back,h,wz)); bots.push(P(back,0,wz)); }
    fillPoly([[tops[0][0],0],[tops[n][0],0],...tops.slice().reverse()],'#000');   // the ceiling over the back wall
    wallFace([...bots,...tops.slice().reverse()],tops,A.wall);
    for(let i=0;i<n;i++) if(R()<.6){ const a=bots[i], b2=tops[i+1]; ctx.globalAlpha=.25; fillPoly([a,bots[i+1],b2],mixHex(A.wall,'#000000',.5)); ctx.globalAlpha=1; } }
  for(const s2 of [-1,1]){ const n=18;
    for(let i=0;i<n;i++){ const wa=back-(back-near)*i/n, wb=back-(back-near)*(i+1)/n, ha=4.5+R()*2.2, hb=4.5+R()*2.2, z=s2*side, zz=s2*(side+.8+R()*.6);
      const pts=[P(wa,0,z),P(wb,0,z),P(wb,hb,zz),P(wa,ha,zz)];
      fillPoly(pts,mixHex(A.wall,'#000000',.15+.25*(i/n)+R()*.12)); ctx.strokeStyle=A.lit; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(...pts[3]); ctx.lineTo(...pts[2]); ctx.stroke();
      fillPoly([pts[3],pts[2],[pts[2][0]+s2*View.w,pts[2][1]-View.h],[pts[3][0]+s2*View.w,pts[3][1]-View.h]],'#000');   // rock above, out of the light
      if(R()<.5){ const k=R(), wx=wa+(wb-wa)*k, h=.6+R()*(Math.min(ha,hb)-1.2); lights.push({p:P(wx,h,s2*(side+.3)),r:.5+R()*.6,wall:true}); } } }
  // stalactites hanging from the dark above the back wall
  for(let i=0;i<22;i++){ const x=R()*View.w, w=4+R()*12, h=18+R()*70, y0=-4; fillPoly([[x-w,y0],[x+w,y0],[x+R()*4-2,y0+h]],mixHex(A.wall,'#000000',.35+R()*.3));
    ctx.strokeStyle=mixHex(A.lit,'#000000',.4); ctx.beginPath(); ctx.moveTo(x-w*.6,y0); ctx.lineTo(x,y0+h*.9); ctx.stroke(); }
  // rubble and boulders on the floor around the board
  for(let i=0;i<40;i++){ let wx=near+R()*(back-near), wz=(R()*2-1)*side; if(Math.abs(wz)<z1+1.2&&wx>x0-1.2&&wx<x1+1.2) continue;
    const r=.25+R()*.7, h=.2+R()*.6, top=[], bot=[]; for(let k=0;k<6;k++){ const a=k/6*TAU+R()*.4; top.push(P(wx+Math.cos(a)*r,h,wz+Math.sin(a)*r*.9)); bot.push(P(wx+Math.cos(a)*r,0,wz+Math.sin(a)*r*.9)); }
    fillPoly(bot,mixHex(A.rock,'#000000',.5)); fillPoly(top,mixHex(A.wall,A.lit,.25+R()*.2)); }
  // the area's light: crystals, ice, gold, or white motes
  for(const L of lights){ const [x,y]=L.p, S2=scaleAt(0,0)*L.r;
    if(A.veins==='crystal'||A.veins==='ice'||A.veins==='storm'){ for(let k=0;k<3;k++){ const a=-Math.PI/2+(k-1)*.5+R()*.3, len=S2*(.6+R()*.7);
        fillPoly([[x-S2*.12,y],[x+Math.cos(a)*len,y+Math.sin(a)*len],[x+S2*.12,y]],k===1?'#ffffff':A.glow); } }
    else if(A.veins==='gold'||A.veins==='lava'){ ctx.strokeStyle=A.glow; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-S2,y+S2*.3); for(let k=0;k<4;k++) ctx.lineTo(x-S2+S2*.6*(k+1),y+(R()-.5)*S2*.8); ctx.stroke(); }
    else { ctx.fillStyle='#ffffff'; ctx.fillRect(x-1,y-1,2,2); } }
  if(A.veins==='gold') for(const s2 of [-1,1]) for(let i=0;i<3;i++){ const wx=near*.3+back*.7-i*5, wz=s2*(z1+1.9), b0=P(wx,0,wz), t0=P(wx,1.8+R()*2.5,wz), w=scaleAt(wx,wz)*.32;
      fillPoly([[b0[0]-w,b0[1]],[b0[0]+w,b0[1]],[t0[0]+w,t0[1]],[t0[0]-w,t0[1]]],A.lit); fillPoly([[t0[0]-w*1.3,t0[1]],[t0[0]+w*1.3,t0[1]],[t0[0]+w*1.3,t0[1]+w*.5],[t0[0]-w*1.3,t0[1]+w*.5]],A.glow); }
  return {cv,lights,area:A,key:View.w+'x'+View.h+':'+depth};
}
function drawCave(ctx,b,T){
  if(!View.cave||View.cave.key!==View.w+'x'+View.h+':'+b.depth) View.cave=buildCave(b.depth);
  const C=View.cave, A=C.area; ctx.drawImage(C.cv,0,0,View.w,View.h);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  C.lights.forEach((L,i)=>{ const [x,y]=L.p, r=scaleAt(0,0)*(1.2+L.r)*(.85+.15*Math.sin(T*1.7+i)), g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,A.glow+'55'); g.addColorStop(1,A.glow+'00'); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r); });
  // dust drifting through the light
  ctx.fillStyle=A.glow; for(let i=0;i<34;i++){ const x=((i*97.3+T*(6+i%5))%View.w+View.w)%View.w, y=((i*53.1-T*(4+i%3)*2)%View.h+View.h)%View.h;
    ctx.globalAlpha=.25+.25*Math.sin(T*2+i); ctx.fillRect(x,y,1.6,1.6); }
  ctx.restore(); ctx.globalAlpha=1;
}

/* Floor textures: each area paves its hexes in its own pixel-art stone (its `floor` look in
   world.js), drawn once per area into one canvas and laid over each tile's colour, so the side
   and danger tints still read through. Marks are only light and shade (plus the area's accent). */
/* One large field of irregular stones per area (about one stone per tile). Each hex shows a
   different window of it, so no two tiles look alike and the pattern never visibly repeats. */
const FLOOR_TEX={}, FLOOR_N=288, FLOOR_WIN=44;
function floorTexture(A){
  if(FLOOR_TEX[A.name]) return FLOOR_TEX[A.name];
  const F=A.floor||AREAS[0].floor, N=FLOOR_N;
  const R=caveRng((A.index||0)*131+7), cv=document.createElement('canvas'); cv.width=cv.height=N;
  const x=cv.getContext('2d'), img=x.createImageData(N,N), d=img.data;
  // jittered grid of seeds, so stones are even-sized but irregular
  const G=7, cell=N/G, seeds=[];
  for(let gy=0;gy<G;gy++) for(let gx=0;gx<G;gx++) seeds.push({x:(gx+.15+R()*.7)*cell, y:(gy+.15+R()*.7)*cell, sh:(R()-.5)*.1});
  const own=new Int16Array(N*N), gap=new Float32Array(N*N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ let b=0,bd=1e9,b2=1e9; const gx=i/cell|0, gy=j/cell|0;
    for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){ const cx=(gx+ox+G)%G, cy=(gy+oy+G)%G, k=cy*G+cx, s=seeds[k];
      let dx=Math.abs(i-s.x), dy=Math.abs(j-s.y); dx=Math.min(dx,N-dx); dy=Math.min(dy,N-dy); const dd=dx*dx+dy*dy;
      if(dd<bd){ b2=bd; bd=dd; b=k; } else if(dd<b2) b2=dd; }
    own[j*N+i]=b; gap[j*N+i]=Math.sqrt(b2)-Math.sqrt(bd); }
  const put=(i,j,v,a)=>{ const o=(j*N+i)*4; d[o]=d[o+1]=d[o+2]=v; d[o+3]=a; };
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const k=j*N+i, s=seeds[own[k]], e=gap[k];
    if(e<1.2) put(i,j,0,95);                                                    // grout
    else if(e<2.4&&own[((j+2)%N)*N+i]!==own[k]) put(i,j,0,34);                  // shaded lower lip
    else if(e<2.4) put(i,j,255,22);                                             // worn upper edge
    else { const n=s.sh+(R()-.5)*.05; put(i,j,n>0?255:0,Math.round(Math.abs(n)*300)); } }
  x.putImageData(img,0,0);
  const dot=(i,j,c,a)=>{ x.globalAlpha=a; x.fillStyle=c; x.fillRect(i,j,1,1); };
  // hairline cracks across a few stones
  for(let n=0;n<14;n++){ let cx=R()*N, cy=R()*N, ang=R()*6.28; for(let m=0;m<6+R()*8;m++){ dot(cx|0,cy|0,'#000000',.28); ang+=(R()-.5)*.9; cx+=Math.cos(ang); cy+=Math.sin(ang); } }
  // the area's detail, sparse
  const sp=n=>Array.from({length:n},()=>[R()*N|0,R()*N|0]);
  if(F.detail==='moss'){ for(const [cx,cy] of sp(16)) for(let m=0;m<6;m++) dot(cx+(R()*4|0)-2,cy+(R()*3|0)-1,F.moss,.4); for(const [cx,cy] of sp(10)) dot(cx,cy,F.accent,.6); }
  else if(F.detail==='frost'){ for(const [cx0,cy0] of sp(9)){ let cx=cx0, cy=cy0; for(let m=0;m<9;m++){ dot(cx|0,cy|0,F.accent,.32); cx+=R()*2-.4; cy+=R()*2-1; } } for(const [cx,cy] of sp(18)) dot(cx,cy,F.accent,.5); }
  else if(F.detail==='embers'){ for(let n=0;n<7;n++){ let cx=R()*N, cy=R()*N, ang=R()*6.28; for(let m=0;m<8+R()*10;m++){ dot(cx|0,cy|0,F.accent,.3); ang+=(R()-.5)*1.2; cx+=Math.cos(ang); cy+=Math.sin(ang); } } for(const [cx,cy] of sp(14)) dot(cx,cy,F.accent,.5); }
  else if(F.detail==='inlay'){ for(let n=0;n<4;n++){ const y0=R()*N|0, x0=R()*N|0, len=20+R()*40|0; for(let i=0;i<len;i++) dot((x0+i)%N,y0,F.accent,.26); } for(const [cx,cy] of sp(10)) dot(cx,cy,F.accent,.45); }
  else { for(const [cx,cy] of sp(24)) dot(cx,cy,F.accent,.2+R()*.4); for(const [cx,cy] of sp(12)){ dot(cx,cy,F.moss,.45); dot(cx+1,cy,F.moss,.45); } }
  x.globalAlpha=1;
  return FLOOR_TEX[A.name]=cv;
}
// lay a window of the area's stone over one tile's top face, scaled into its projected shape
// the look of claimed ground: overgrowth, swamp, marble bricks or flood water
function drawLand(ctx,t,top,T,S){
  const k=t.claim.land, h=Math.imul(t.q*73856093^t.r*19349663,2654435761)>>>0, rr=i=>((h>>>(i*3))&255)/255, [cx,cy]=proj(t.wx,0,t.wz), iy=View.iy;
  ctx.save(); poly(ctx,top); ctx.clip();
  if(k==='overgrowth'){
    for(let i=0;i<7;i++){ const x=cx+(rr(i)-.5)*S*1.4, y=cy+(rr(i+1)-.5)*S*1.2*iy, sw=Math.sin(T*2+i+t.q)*S*.03;
      ctx.strokeStyle=i%2?'#3fa856':'#7fe08a'; ctx.lineWidth=Math.max(1.5,S*.05); ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+sw,y-S*.14,x+sw*2+S*.05,y-S*.28); ctx.moveTo(x,y); ctx.quadraticCurveTo(x-sw,y-S*.12,x-S*.08,y-S*.22); ctx.stroke(); }
    ctx.fillStyle='#b6f59a'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(cx+(rr(i+4)-.5)*S,cy+(rr(i+2)-.5)*S*iy,S*.07,S*.04,rr(i)*3,0,TAU); ctx.fill(); }
  } else if(k==='swamp'){
    ctx.fillStyle='rgba(60,90,50,.55)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(cx+(rr(i)-.5)*S*1.1,cy+(rr(i+3)-.5)*S*.9*iy,S*.28,S*.28*iy,0,0,TAU); ctx.fill(); }
    for(let i=0;i<3;i++){ const ph=(T*.6+rr(i+1)*3)%1, x=cx+(rr(i+5)-.5)*S, y=cy+(rr(i+2)-.5)*S*.8*iy;
      ctx.strokeStyle='rgba(190,160,220,'+(1-ph).toFixed(2)+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x,y-ph*S*.05,S*(.04+ph*.12),S*(.04+ph*.12)*iy,0,0,TAU); ctx.stroke(); }
  } else if(k==='marble'){
    ctx.strokeStyle='rgba(90,90,110,.55)'; ctx.lineWidth=1.2; const w=S*.5, hh=S*.5*iy;
    for(let j=-3;j<=3;j++){ const y=cy+j*hh; ctx.beginPath(); ctx.moveTo(cx-S*2,y); ctx.lineTo(cx+S*2,y); ctx.stroke();
      for(let i=-4;i<=4;i++){ const x=cx+i*w+(j%2?w/2:0); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+hh); ctx.stroke(); } }
    ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(cx-S*.5,cy-S*.2*iy); ctx.lineTo(cx+S*.1,cy+S*.25*iy); ctx.stroke();   // a vein in the stone
  } else if(k==='flood'){
    for(let i=0;i<3;i++){ const ph=(T*.5+i/3+rr(i))%1; ctx.strokeStyle='rgba(180,235,255,'+(.6*(1-ph)).toFixed(2)+')'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(cx+(rr(i+2)-.5)*S*.6,cy+(rr(i+4)-.5)*S*.5*iy,S*(.15+ph*.6),S*(.15+ph*.6)*iy,0,0,TAU); ctx.stroke(); }
    ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(cx-S*.6+Math.sin(T*1.5+t.q)*S*.2,cy-S*.1*iy,S*.3,1.5);
  }
  ctx.restore();
  // marble raises a short column on some tiles
  if(k==='marble'&&h%3===0&&!t.occ){ const x=cx+S*.25, y=cy-S*.1*iy, cw=S*.18, ch=S*.55;
    ctx.fillStyle='#e9e6dc'; ctx.fillRect(x-cw/2,y-ch,cw,ch); ctx.fillStyle='#c7c3b8'; ctx.fillRect(x+cw/6,y-ch,cw/3,ch);
    ctx.fillStyle='#f6f3ea'; ctx.fillRect(x-cw*.75,y-ch-S*.06,cw*1.5,S*.07); ctx.fillRect(x-cw*.75,y-S*.04,cw*1.5,S*.05); }
}
function paveTile(ctx,t,top,A,alpha){
  const tex=floorTexture(A), h=Math.imul(t.q*73856093^t.r*19349663,2654435761)>>>0, span=FLOOR_N-FLOOR_WIN;
  const sx=h%span, sy=(h>>>12)%span;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const [x,y] of top){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
  ctx.save(); poly(ctx,top); ctx.clip(); ctx.globalAlpha=alpha; ctx.imageSmoothingEnabled=false;
  ctx.drawImage(tex,sx,sy,FLOOR_WIN,FLOOR_WIN,x0,y0,x1-x0,y1-y0);
  // a faint bevel on the far edges, so each slab still reads as raised
  ctx.globalAlpha=alpha*.5; ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=1; ctx.beginPath();
  const n=top.length, cy=top.reduce((a,p)=>a+p[1],0)/n;
  for(let i=0;i<n;i++){ const a=top[i], b=top[(i+1)%n]; if((a[1]+b[1])/2<cy){ ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); } }
  ctx.stroke(); ctx.restore();
}

/* The floor layer: every tile's state, then aim areas, the lob reticle, traps and the path. Flat:
   onto the board itself; 3D: into the top-down canvas laid over the arena's tiles (the tiles'
   colours go to arenaTiles instead, as tl3). */
function floorLayer(ctx,b,T,S,telMap,G3,tl3){
  const tiles=TILES.slice().sort((a,c)=>depthOf(a)-depthOf(c));
  for(const t of tiles){
    const top=hexCorners(t,.96), land=t.claim&&LAND_LOOK[t.claim.land], base=land?(t.claim.t<3&&Math.sin(T*12)>0?mixHex(land.base,'#23292f',.6):land.base):{p:'#123756',e:'#23292f',n:'#0a1a14'}[t.side];   // claimed ground blinks in its last 3 seconds
    let fill=base;
    const tl=telMap.get(t);
    if(tl){ const k=tl.t/tl.dur; fill=mixHex(base,tl.friendly?'#e6f4ff':'#ff3b4e',.25+.5*k*(.6+.4*Math.sin(T*18))); }
    if(t.holeT>0) fill='#0b0506';
    else if(burning(t)) fill=mixHex(fill,'#ff5a1f',t.terrain==='lava'?.45+.12*Math.sin(T*3+t.q):.35+.15*Math.sin(T*8));
    else if(icy(t)) fill=mixHex(fill,'#bfeaff',t.terrain==='ice'?.45:.35);
    else if(t.thornT>0) fill=mixHex(fill,'#4f8a3a',.45);
    else if(t.zapT>0) fill=mixHex(fill,'#ffe24d',.22+.25*Math.max(0,Math.sin(T*23+t.q*5)));
    else if(t.voidT>0) fill=mixHex(fill,'#3a0f3f',.6+.1*Math.sin(T*4));
    if(!(t.holeT>0)&&typeof arRuleFill==='function') fill=arRuleFill(t,fill,T);
    if(t.gT>0&&t.gEl&&!t.holeT) fill=mixHex(fill,COLORS[t.gEl].c,(.2+.12*Math.sin(T*5+t.r))*Math.min(1,t.gT/1.5));
    if(t.flash>0) fill=mixHex(base,t.flashC[0]==='#'&&t.flashC.length===7?t.flashC:'#ffffff',Math.min(.8,t.flash));
    if(G3) tl3.push({t,base,fill});   // the 3D board takes the tile's colour; its stone is already there
    else { ctx.fillStyle='#020406'; poly(ctx,top.map(([x,y])=>[x,y+SLAB*S])); ctx.fill();
      ctx.fillStyle=mixHex(base,'#000000',.45);
      frontFaces(ctx,top,SLAB*S);
      ctx.fillStyle=fill; poly(ctx,top); ctx.fill();
      if(!(t.holeT>0)) paveTile(ctx,t,top,View.cave.area,t.side==='n'?.4:land?.25:.7); }
    if(land&&!(t.holeT>0)) drawLand(ctx,t,top,T,S);
    // an incoming attack fills its tile as it gets closer; it lands when the tile is full
    if(tl&&!tl.friendly){ if(typeof teleLook==='function') teleLook(ctx,t,tl,T); else { ctx.fillStyle='rgba(255,50,70,.6)'; poly(ctx,hexCorners(t,.96*Math.min(1,tl.t/tl.dur))); ctx.fill(); } }
    if(t.holeT>0){ ctx.save(); ctx.globalAlpha=.35+.15*Math.sin(T*5+t.q); ctx.fillStyle=t.voidHole?'#9b4dff':'#ff5a1f'; poly(ctx,hexCorners(t,.72)); ctx.fill(); ctx.globalAlpha=1; ctx.fillStyle='#0b0506'; poly(ctx,hexCorners(t,.55)); ctx.fill(); ctx.restore(); poly(ctx,top); }
    if(b.fog&&t.side==='e'){ ctx.save(); ctx.globalAlpha=.42+.06*Math.sin(T*.8+t.q); ctx.fillStyle='#0a0610'; poly(ctx,top); ctx.fill(); ctx.restore(); poly(ctx,top); }
    // a light triangle grid: every hex split into its six triangles, a steady guide to walk by
    if(!G3&&!(t.holeT>0)&&t.side!=='n'){ const [mx,my]=proj(t.wx,0,t.wz); ctx.beginPath(); for(const [x,y] of top){ ctx.moveTo(mx,my); ctx.lineTo(x,y); }
      ctx.strokeStyle=t.side==='p'?'rgba(127,212,255,.13)':'rgba(170,185,200,.09)'; ctx.lineWidth=1; ctx.stroke(); }
    if(!G3){ poly(ctx,top); ctx.strokeStyle=t.side==='p'?'rgba(127,212,255,.5)':t.side==='e'?'rgba(150,165,180,.35)':'rgba(57,255,138,.5)'; ctx.lineWidth=1; ctx.stroke(); }
    if(t.side==='n'){ const [x,y]=proj(t.wx,.1,t.wz); ctx.fillStyle='rgba(57,255,138,.85)'; ctx.beginPath();
      ctx.moveTo(x,y-S*1.1-Math.sin(T*2+t.r)*3); ctx.lineTo(x+S*.22,y-S*.45); ctx.lineTo(x,y); ctx.lineTo(x-S*.22,y-S*.45); ctx.closePath(); ctx.fill(); }
  }
  // lob reticle: your aim, or a faint marker on the default target when a lob is next
  const aimT=b.aim||(nextIsLob()&&b.phase==='fight'?nearestEnemyTile(b.player.tile):null);
  const pv=castPreview();
  if(pv){ const col=colorOf(pv.card), pulse=.55+.25*Math.sin(T*4), hitSet=new Set(pv.hit);
    ctx.lineWidth=2;
    for(const t of new Set(pv.area)){ const hc=hexCorners(t,.88); ctx.globalAlpha=(hitSet.has(t)?.6:.38)*pulse+.18; ctx.fillStyle=col; poly(ctx,hc); ctx.fill();
      ctx.globalAlpha=hitSet.has(t)?.95:.55; ctx.strokeStyle=hitSet.has(t)?'#ffffff':col; ctx.stroke(); }
    for(const t of pv.place){ const hc=hexCorners(t,.8); ctx.globalAlpha=.9; ctx.strokeStyle=col; ctx.setLineDash([4,3]); poly(ctx,hc); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=.25*pulse+.1; ctx.fillStyle=col; ctx.fill(); }
    if(pv.self){ const [x,y]=proj(...posOf(b.player).slice(0,1),.02,posOf(b.player)[1]), S=scaleAt(...posOf(b.player)); ctx.globalAlpha=.8; ctx.strokeStyle=col; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.ellipse(x,y,S*.7,S*.7*View.iy,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha=1; b.preview=pv; } else b.preview=null;
  if(aimT){ const [x,y]=proj(aimT.wx,.02,aimT.wz), S=scaleAt(aimT.wx,aimT.wz), pulse=1+Math.sin(T*6)*.06;
    ctx.strokeStyle=b.aim?'#ffe24d':'rgba(255,226,77,.45)'; ctx.lineWidth=b.aim?3:2; if(!b.aim) ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.ellipse(x,y,S*.62*pulse,S*.62*ISO_Y*pulse,0,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-S*.8,y); ctx.lineTo(x-S*.45,y); ctx.moveTo(x+S*.45,y); ctx.lineTo(x+S*.8,y); ctx.stroke(); ctx.setLineDash([]); }
  // mines (strikes.js): a spiked disc that pulses; a Delayed mark: a crosshair closing in on the enemy
  for(const t of TILES) if(t.mine){ const [x,y]=proj(t.wx,.03,t.wz), S=scaleAt(t.wx,t.wz), col=colorOf(t.mine.card), k=.5+.5*Math.sin(T*8); ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2; ctx.globalAlpha=.55+.35*k;
    ctx.beginPath(); ctx.ellipse(x,y,S*.22,S*.22*View.iy,0,0,TAU); ctx.fill(); ctx.beginPath(); for(let i=0;i<8;i++){ const a=i*TAU/8; ctx.moveTo(x+Math.cos(a)*S*.25,y+Math.sin(a)*S*.25*View.iy); ctx.lineTo(x+Math.cos(a)*S*.42,y+Math.sin(a)*S*.42*View.iy); } ctx.stroke(); ctx.globalAlpha=1; }
  for(const e of b.enemies) if(e.hp>0&&e.markBomb){ const [x,y]=proj(...posOf(e).slice(0,1),.04,posOf(e)[1]), S=scaleAt(e.tile.wx,e.tile.wz), r=S*(.3+.5*e.markBomb.t/1.5); ctx.strokeStyle='#ff5d6c'; ctx.lineWidth=3; ctx.globalAlpha=.9;
    ctx.beginPath(); ctx.ellipse(x,y,r,r*View.iy,0,0,TAU); ctx.moveTo(x-r*1.2,y); ctx.lineTo(x+r*1.2,y); ctx.moveTo(x,y-r*1.2*View.iy); ctx.lineTo(x,y+r*1.2*View.iy); ctx.stroke(); ctx.globalAlpha=1; }
  // traps: a rune only you can see
  for(const t of TILES) if(t.trap){ const [x,y]=proj(t.wx,.03,t.wz), S=scaleAt(t.wx,t.wz); ctx.strokeStyle=colorOf(t.trap.card); ctx.lineWidth=2; ctx.globalAlpha=.6+.3*Math.sin(T*4);
    ctx.beginPath(); ctx.ellipse(x,y,S*.4,S*.4*View.iy,0,0,TAU); ctx.moveTo(x-S*.25,y); ctx.lineTo(x+S*.25,y); ctx.moveTo(x,y-S*.25*View.iy); ctx.lineTo(x,y+S*.25*View.iy); ctx.stroke(); ctx.globalAlpha=1; }
  // path preview
  if(b.player.path.length){ ctx.fillStyle='rgba(127,212,255,.4)'; for(const t of b.player.path){ const [x,y]=proj(t.wx,0,t.wz), S=scaleAt(t.wx,t.wz); ctx.beginPath(); ctx.ellipse(x,y,S*.18,S*.18*ISO_Y,0,0,TAU); ctx.fill(); } }

}
function render(){
  const ctx=View.ctx, b=B; if(!ctx) return;
  ctx.setTransform(View.dpr,0,0,View.dpr,0,0);
  ctx.clearRect(0,0,View.w,View.h);
  if(!b) return;
  const T=b.time, G3=gl3(), dt=Math.max(0,Math.min(.1,T-(View.lastT??T))); View.lastT=T;
  if(G3){ const key=b.depth+':'+(b.uid||(b.uid=Math.random()*1e9|0)); if(AR.key!==key){ arenaBuild(b.depth,b.depth*977+(b.uid%1000)); AR.key=key; }
    arenaCamera(dt,T); View.S=scaleAt(0,0); View.iy=ISO_Y=viewIY(); }
  const S=View.S;
  if(!G3){ if(View.shake>.3) ctx.translate(rnd(-1,1)*View.shake,rnd(-1,1)*View.shake); drawCave(ctx,b,T); }
  const telMap=new Map();
  for(const tl of b.teles) for(const t of tl.tiles) telMap.set(t,tl);

  const tl3=[];
  if(G3){ const dc=DEC.ctx; dc.setTransform(1,0,0,1,0,0); dc.clearRect(0,0,DEC.cv.width,DEC.cv.height); PJ.decal=true; View.iy=ISO_Y=1;
    try{ floorLayer(dc,b,T,DEC.k,telMap,true,tl3); if(typeof atkBars==='function') atkBars(dc,b,T); } finally{ PJ.decal=false; View.iy=ISO_Y=viewIY(); } arenaTiles(tl3); }
  else { floorLayer(ctx,b,T,S,telMap,false,tl3); if(typeof atkBars==='function') atkBars(ctx,b,T); }
  if(XLIT.mvShow) mvOverlay(ctx,b);
  mvGraph(b.player);
  const rocks=TILES.filter(t=>t.occ&&t.occ.kind==='rock').map(t=>t.occ);
  const dying=b.enemies.filter(e=>e.hp<=0&&e.deathT>0);
  const units=[b.player,...b.walls,...b.allies,...rocks,...alive(),...dying].sort((a,c)=>depthOf(a.tile)-depthOf(c.tile));
  for(const u of units) DRAW[u.kind](ctx,u,T,scaleAt(...posOf(u)));
  if(b.preview) previewOverlay(ctx,b.preview,T);
  if(typeof extraDraw==='function') extraDraw(ctx,T);
  // the boss's health across the top, with its two evolutions marked (a miniboss: its enrage at half)
  const boss=b.enemies.find(e=>e.def.bossId&&e.hp>0)||b.enemies.find(e=>e.def.mini&&e.hp>0);
  if(boss){ const w=Math.min(View.w*.72,560), x0=(View.w-w)/2, y0=10, h=12, mini=!boss.def.bossId;
    ctx.fillStyle='rgba(0,0,0,.75)'; ctx.fillRect(x0-3,y0-3,w+6,h+6); ctx.fillStyle='#2a0e12'; ctx.fillRect(x0,y0,w,h);
    ctx.fillStyle=boss.guardT>0?'#e6f4ff':mini?'#ff9a3a':'#ff5d6c'; ctx.fillRect(x0,y0,w*boss.hp/boss.maxHp,h);
    ctx.fillStyle='#000'; for(const f of mini?[1/2]:[1/3,2/3]) ctx.fillRect(x0+w*f-1,y0,2,h);
    ctx.font='600 '+Math.round(Math.max(13,S*.3))+'px "Jersey 15",system-ui,sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fff';
    ctx.fillText(boss.name+'  '+(mini?(boss.enraged?'· enraged':'· miniboss'):['','I','II','III'][boss.phase||1])+(boss.under?'  · out of reach':''),View.w/2,y0+h+Math.max(15,S*.34)); }
  // expected damage on each enemy the next card would hit (★ = its weak color)
  if(b.preview&&b.preview.card.pow){ const pv=b.preview; ctx.textAlign='center'; ctx.font='800 '+Math.round(S*.34)+'px "Jersey 15",system-ui,sans-serif';
    for(const t of new Set(pv.hit)){ const e=t.occ; if(!e||e.kind!=='enemy') continue; const [x,y]=proj(posOf(e)[0],0,posOf(e)[1]), S=scaleAt(...posOf(e)); ctx.font='800 '+Math.round(S*.34)+'px "Jersey 15",system-ui,sans-serif';
      const d=estDamage(pv.card,e,pv.mult), weak=bossMult(pv.card.color,e)>1, txt=(pv.card.shape==='missiles'?pv.card.n+'× ':'')+'−'+d+(weak?' ★':'');
      const w=ctx.measureText(txt).width+12, yy=y-S*.35; ctx.fillStyle=weak?'#ffe066':'rgba(4,8,12,.88)'; ctx.strokeStyle=colorOf(pv.card); ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(x-w/2,yy-S*.28,w,S*.4,6); ctx.fill(); ctx.stroke(); ctx.fillStyle=weak?'#1a1206':'#fff'; ctx.fillText(txt,x,yy); } }

  for(const s of b.shots){
    const from=s.i<0?s.a:s.tiles[s.i], to=s.tiles[s.i+1]||from, k=clamp(s.stepT/s.speed,0,1), S=scaleAt(from.wx,from.wz);
    if(s.buff&&WAND_BUFF[s.buff]){ const L=WAND_BUFF[s.buff], [tx,ty]=proj(from.wx,1,from.wz), wx=from.wx+(to.wx-from.wx)*k, wz=from.wz+(to.wz-from.wz)*k, [x,y]=proj(wx,1,wz), r=S*(s.big?.26:.13)*L.size;
      // a glowing trail back to the last tile, a hot core over a coloured halo
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
      { const [ox,oy]=proj(s.a.wx,1,s.a.wz), back=Math.min(Math.hypot(x-ox,y-oy),S*2.2), dl=Math.hypot(x-tx,y-ty)||1, ux=(x-tx)/dl, uy=(y-ty)/dl;
        wandTrail(ctx,x-ux*back,y-uy*back,x,y,r,L,S); }   // about two tiles of trail, never back past where it was fired
      const g=ctx.createRadialGradient(x,y,0,x,y,r*2.4); g.addColorStop(0,'#ffffff'); g.addColorStop(.3,L.c2); g.addColorStop(.6,L.c); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=1; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.4*(1+.12*Math.sin(B.time*40)),0,TAU); ctx.fill(); ctx.restore(); continue; }
    { const tc=s.card?colorOf(s.card):s.color||'#e6f4ff', [tx,ty]=proj(from.wx,1,from.wz), [hx,hy]=proj(from.wx+(to.wx-from.wx)*k,1,from.wz+(to.wz-from.wz)*k);
      ctx.strokeStyle=tc; ctx.globalAlpha=.45; ctx.lineWidth=S*(s.wand?.08:.14); ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(hx,hy); ctx.stroke(); ctx.globalAlpha=1; }
    const wx=from.wx+(to.wx-from.wx)*k, wz=from.wz+(to.wz-from.wz)*k, [x,y]=proj(wx,1,wz);
    const rk=s.owner&&!(s.owner.phase>=2)&&typeof palHas==='function'&&palHas(s.owner.id,'rock')&&palFrame(s.owner.id,'rock',Math.floor((B.time-(s.t0??(s.t0=B.time)))*14));
    if(rk){ const H=palH(S,s.owner.id), [ax,ay]=proj(from.wx,1,from.wz), [bx,by]=proj(to.wx,1,to.wz); ctx.save(); ctx.imageSmoothingEnabled=false; ctx.translate(x,y); ctx.rotate((Math.atan2(by-ay,bx-ax)||Math.PI/2)-Math.PI/2); ctx.drawImage(rk.img,-H/2,-H/2,H,H); ctx.restore(); continue; }   // drawn flying down (at you); turned to where it goes
    // light shots fly as the crystal shard (sprites_pal.js), turned to where they go: it grows over
    // its first 4 frames, then loops the last 4
    if(lightShot(s)){ const n=Math.floor((B.time-(s.t0??(s.t0=B.time)))*14), sh=palFrame('golem','shard',n<4?n:4+n%4);
      if(sh){ const [ax,ay]=proj(from.wx,1,from.wz), [bx,by]=proj(to.wx,1,to.wz), H=palH(S,'golem',s.owner?((s.owner.def&&s.owner.def.scale)||1):s.wand?.7:1);
        ctx.save(); ctx.imageSmoothingEnabled=false; ctx.translate(x,y); ctx.rotate((Math.atan2(by-ay,bx-ax)||Math.PI/2)-Math.PI/2); ctx.drawImage(sh.img,-H/2,-H/2,H,H); ctx.restore(); continue; } }
    const col=s.card?colorOf(s.card):s.color||(s.wand?'#e6f4ff':'#fff');
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(x,y,S*(s.big?.26:s.wand?.13:.19),0,TAU); ctx.fill(); ctx.shadowBlur=0;
  }
  for(const l of b.lobs){ const k=l.t/l.dur, wx=l.a.wx+(l.b.wx-l.a.wx)*k, wz=l.a.wz+(l.b.wz-l.a.wz)*k, [x,y]=proj(wx,1+Math.sin(k*Math.PI)*3,wz), S=scaleAt(wx,wz);
    const col=colorOf(l.card); ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(x,y,S*.24,0,TAU); ctx.fill(); ctx.shadowBlur=0; }
  for(const f of b.fx){
    if(f.kind==='palfx'){ const fr=palFrame(f.id,f.anim,Math.floor(f.t*14)); if(fr){ const [x,y]=proj(f.a.wx,1,f.a.wz), H=palH(scaleAt(f.a.wx,f.a.wz),f.id); ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(fr.img,x-H/2,y-H/2,H,H); ctx.restore(); } continue; }
    if(f.kind==='ring'){ const [x,y]=proj(...posOf(b.player).slice(0,1),0,posOf(b.player)[1]), r=scaleAt(...posOf(b.player))*(.4+1.4*f.t/f.life); ctx.strokeStyle=f.color; ctx.globalAlpha=1-f.t/f.life; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(x,y,r,r*View.iy,0,0,TAU); ctx.stroke(); ctx.globalAlpha=1; continue; }
    const a=proj(f.a.wx,f.y0||1,f.a.wz), c=proj((f.b||f.a).wx,1,(f.b||f.a).wz), al=1-f.t/f.life;
    ctx.strokeStyle=f.color; ctx.globalAlpha=al; ctx.lineWidth=f.kind==='beam'?S*.35:3; ctx.shadowColor=f.color; ctx.shadowBlur=10; ctx.beginPath(); ctx.moveTo(a[0],a[1]);
    if(f.kind==='bolt'){ for(let i=1;i<6;i++){ const k=i/6; ctx.lineTo(a[0]+(c[0]-a[0])*k+rnd(-6,6),a[1]+(c[1]-a[1])*k+rnd(-6,6)); } }
    else if(f.kind==='arc'){ ctx.quadraticCurveTo((a[0]+c[0])/2,Math.min(a[1],c[1])-S*1.5,c[0],c[1]); }
    ctx.lineTo(c[0],c[1]); ctx.stroke(); ctx.globalAlpha=1; ctx.shadowBlur=0;
  }
  for(const q of b.parts) drawPart(ctx,q); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  ctx.textAlign='center';
  for(const f of b.floaters){ const [x,y]=proj(f.wx,f.y,f.wz), S=scaleAt(f.wx,f.wz), pop=1+.7*Math.max(0,1-f.t/.14); ctx.globalAlpha=Math.min(1,(1-f.t/.9)*1.6); ctx.font=(f.big?'800 ':'700 ')+Math.round(S*(f.big?.55:.42)*pop)+'px "Jersey 15",system-ui,sans-serif';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.strokeText(f.text,x,y); ctx.fillStyle=f.color; ctx.fillText(f.text,x,y); } ctx.globalAlpha=1;
  if(G3){ arenaUnitsEnd(); arenaDraw(dt,T); }
}

// The next card's reach, drawn again over the units so nothing hides it: the outline of every
// tile it covers, and a moving dashed line with an arrow along each path a shot will take
// (or the arc of a lob) from you to where it lands.
function previewOverlay(ctx,pv,T){
  const col=colorOf(pv.card), [px0,pz0]=posOf(B.player);
  ctx.save(); ctx.lineJoin='round';
  ctx.globalAlpha=.6; ctx.strokeStyle=col; ctx.lineWidth=2;
  for(const t of new Set(pv.area)){ poly(ctx,hexCorners(t,.88,.02)); ctx.stroke(); }
  ctx.globalAlpha=.95; ctx.shadowColor=col; ctx.shadowBlur=10;
  const arrow=(a,b2)=>{ const ang=Math.atan2(b2[1]-a[1],b2[0]-a[0]), L=Math.max(9,scaleAt(px0,pz0)*.28); ctx.setLineDash([]); ctx.fillStyle=col; ctx.beginPath();
    ctx.moveTo(b2[0]+Math.cos(ang)*L*.4,b2[1]+Math.sin(ang)*L*.4); ctx.lineTo(b2[0]-Math.cos(ang-.5)*L,b2[1]-Math.sin(ang-.5)*L); ctx.lineTo(b2[0]-Math.cos(ang+.5)*L,b2[1]-Math.sin(ang+.5)*L); ctx.closePath(); ctx.fill(); };
  const S0=scaleAt(px0,pz0); ctx.lineWidth=Math.max(3,S0*.08); ctx.setLineDash([S0*.28,S0*.18]); ctx.lineDashOffset=-T*S0*1.4;
  for(const path of pv.paths){ if(!path.length) continue; const pts=[proj(px0,.08,pz0),...path.map(t=>proj(t.wx,.08,t.wz))];
    ctx.strokeStyle=col; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); arrow(pts[pts.length-2],pts[pts.length-1]); ctx.setLineDash([S0*.28,S0*.18]); }
  if(pv.arc){ const a=proj(px0,.08,pz0), c=proj(pv.arc.wx,.05,pv.arc.wz), m=proj((px0+pv.arc.wx)/2,1.6,(pz0+pv.arc.wz)/2);
    ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo(2*m[0]-(a[0]+c[0])/2+S0*2.2,2*m[1]-(a[1]+c[1])/2,c[0],c[1]); ctx.stroke();
    arrow([c[0],c[1]-S0*.5],c); }
  ctx.restore();
}
// Draw a unit's pixel sprite standing on its tile: a soft ground shadow, a cast shadow falling
// away from the light, a little breathing and bobbing, and a white flash when hit.
// Returns the screen x and the top of the sprite, for bars and labels.
const FACES_LEFT=new Set([]);
// A copy of a sprite filled with one color inside its own pixels (frozen, stunned). Cached per image and color.
const TINTS=new WeakMap();
function tinted(img,c){ let m=TINTS.get(img); if(!m) TINTS.set(img,m={}); if(m[c]) return m[c];
  const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height; const x=cv.getContext('2d');
  x.drawImage(img,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=c; x.fillRect(0,0,cv.width,cv.height); return m[c]=cv; }
function drawSprite(ctx,u,T,S,o){
  const spr=typeof unitSprite==='function'?unitSprite(u):null, [wx,wz]=posOf(u), [x,y]=proj(wx,0,wz);
  const sc=(o.scale||1)*((spr&&spr.zoom)||1), H=S*2.7*sc, k=H/32, alpha=o.alpha==null?1:o.alpha;
  if(!spr){ if(gl3()) return {x,top:y-H};
    const g=ctx.createRadialGradient(x,y,0,x,y,S*.62*sc); g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha; ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,S*.62*sc,S*.62*sc*View.iy,0,0,TAU); ctx.fill(); ctx.globalAlpha=1; return {x,top:y-H}; }
  if(!gl3()){ const g=ctx.createRadialGradient(x,y,0,x,y,S*.62*sc); g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha; ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,S*.62*sc,S*.62*sc*View.iy,0,0,TAU); ctx.fill(); }
  if(spr.front) o=Object.assign({},o,{flip:!!spr.mirror});   // drawn facing the viewer: mirrored only for a side walk reused the other way
  // pixel art is never squashed: it rises one art pixel on a step (o.step, or a slow breath when o.bob is set),
  // and the offset is a whole number of the sprite's own pixels so its pixels stay square
  const ap=H/(spr.hand?spr.img.width:32), seed=(u.tile?u.tile.q*3+u.tile.r:0), step=o.step!=null?o.step:o.bob?Math.floor(T*1.6+seed*.37)%2:0, lift=Math.round(step*ap);
  const bob=lift/S;
  // the 3D arena stands the sprite on its tile (arena.js); the flat canvas keeps only bars and labels
  if(gl3()){ arenaUnit(u,spr,{flip:!!o.flip,flash:o.flash||0,tint:o.tint||null,tintA:o.tintA,alpha,h:2.7*sc,lift:step*2.7*sc/(spr.hand?spr.img.width:32),shadow:.62*sc}); return {x,top:y-30*k-bob*S,H,k}; }
  ctx.imageSmoothingEnabled=false;
  // cast shadow: the silhouette laid flat on the ground toward the lower right
  ctx.save(); ctx.globalAlpha=.3*alpha; ctx.translate(x,y); ctx.transform(1,0,-.7,-.28,0,0); if(o.flip) ctx.scale(-1,1);
  ctx.drawImage(spr.sil,-H/2,-31*k,H,H); ctx.restore();
  // body
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(Math.round(x),Math.round(y)-lift); ctx.scale(o.flip?-1:1,1);
  ctx.drawImage(spr.img,-H/2,-31*k,H,H);
  if(o.flash){ ctx.globalAlpha=alpha*o.flash; ctx.drawImage(spr.wht,-H/2,-31*k,H,H); }
  if(o.tint){ ctx.globalAlpha=alpha*(o.tintA||.45); ctx.drawImage(tinted(spr.img,o.tint),-H/2,-31*k,H,H); }
  ctx.restore(); ctx.globalAlpha=1; ctx.imageSmoothingEnabled=true;
  return {x,top:y-30*k-bob*S,H,k};
}
// face whoever it is fighting: your wizard faces the nearest enemy, enemies face you
function facing(u,target,defLeft){ if(!target) return false; const a=proj(...posOf(u).slice(0,1),0,posOf(u)[1])[0], b=proj(...posOf(target).slice(0,1),0,posOf(target)[1])[0]; return (b<a)!==!!defLeft; }
function shadow(ctx,u,S,r){ const [wx,wz]=u.tile?posOf(u):[u.wx,u.wz], [x,y]=proj(wx,0,wz); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y,S*r,S*r*ISO_Y,0,0,TAU); ctx.fill(); }
// one dot per turn left, over walls and units
function turnPips(ctx,x,y,life,S){ const n=Math.ceil(life/TURN_S); ctx.fillStyle='#e6f4ff';   // one pip for each 10 s left
  for(let i=0;i<n;i++){ ctx.beginPath(); ctx.arc(x+(i-(n-1)/2)*S*.18,y,S*.05,0,TAU); ctx.fill(); } }
function bar(ctx,x,y,w,k,col){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x-w/2-1,y-1,w+2,6); ctx.fillStyle=col; ctx.fillRect(x-w/2,y,w*clamp(k,0,1),4); }
const DRAW={
  player(ctx,p,T,S){
    const foe=alive().sort((m,n)=>hexDist(p.tile,m.tile)-hexDist(p.tile,n.tile))[0];
    // the pose: attack just after a shot, cast after a card or while charging, a walk cycle while moving, else standing
    const moving=p.fx!=null?!!p.fmov:!!p.step||Math.hypot((p.rx??p.tile.wx)-p.tile.wx,(p.rz??p.tile.wz)-p.tile.wz)>.04||p.path.length>0, since=B.time-(p.poseT??-9);
    // the walk cycle steps with the ground covered (mvStride tiles a step), so the feet keep up at any speed
    const ph=MV('mvStride')>0&&p.walkDist!=null?Math.floor(p.walkDist/(MV('mvStride')*1.732))%2:Math.floor(T*7)%2;
    p.pose=since<.28?p.poseK:p.charging?'cast':moving?(ph?'walk':'idle'):'idle';
    if(B.soul&&B.soul.unisonT>0){ const [ux,uy]=proj(posOf(p)[0],0,posOf(p)[1]), uc=COLORS[B.soul.card.color].c, k=.75+.25*Math.sin(T*8);
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=uc; ctx.lineWidth=3; ctx.globalAlpha=.8*k; ctx.beginPath(); ctx.ellipse(ux,uy,S*.75,S*.75*View.iy,0,0,TAU); ctx.stroke();
      ctx.globalAlpha=.25*k; ctx.fillStyle=uc; ctx.fill(); ctx.restore(); if(Math.random()<.3) spray(p.tile,1,{shape:'glow',color:uc,v:.4,up0:1,up:2,g:-1,life:.6,s:5,add:true,shrink:1}); }
    const flip=playerFlip(p,foe), r=drawSprite(ctx,p,T,S,{alpha:p.invT>0?.45:1,flip,step:moving?ph:Math.floor(T*1.6)%2,flash:p.hurtT>0?p.hurtT*3:0});
    // the staff's orb glows, and grows while the wand charges
    const wc=p.wand&&p.wand.color?COLORS[p.wand.color].c:null;
    const bf=wandBuff(p), BL=bf&&WAND_BUFF[bf];
    const glow=p.charging?(p.chargeT>=chargeNeed(p)?'#ffffff':BL?BL.c:wc||'#7fd4ff'):BL?BL.c:wc;
    if(glow&&(!p.look||['staff','wand'].includes(p.look.weapon))){ const sp=unitSprite(p), tp=sp&&sp.tip, ox=tp?r.x+(flip?-1:1)*(tp[0]-.5)*r.H:r.x+(flip?-1:1)*9*r.k, oy=tp?r.top-r.k+tp[1]*r.H:r.top+4*r.k; ctx.fillStyle=glow; ctx.shadowColor=glow; ctx.shadowBlur=10+(p.charging?p.chargeT*18:0);
      ctx.globalAlpha=.85; ctx.beginPath(); ctx.arc(ox,oy,S*(.12+(p.charging?p.chargeT*.12:0)),0,TAU); ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      // a buff's aura around the weapon: a pulsing halo, a ring turning about the tip, and sparks
      if(BL){ const pu=.5+.5*Math.sin(T*7), R=S*(.62+.1*pu); ctx.save(); ctx.globalCompositeOperation='lighter';
        const g=ctx.createRadialGradient(ox,oy,0,ox,oy,R); g.addColorStop(0,BL.c2); g.addColorStop(.35,BL.c); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.globalAlpha=.5+.25*pu; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ox,oy,R,0,TAU); ctx.fill();
        ctx.strokeStyle=BL.c2; ctx.lineWidth=Math.max(1.5,S*.03); ctx.globalAlpha=.7; ctx.setLineDash([S*.08,S*.06]); ctx.lineDashOffset=-T*S*.6;
        ctx.beginPath(); ctx.arc(ox,oy,S*.36,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        if(Math.random()<.5) spray(p.tile,1,{shape:'glow',color:[BL.c,BL.c2],y:2.1,v0:.2,v:.9,up0:.6,up:2,g:bf==='power'?-2:-.5,drag:1.5,life:.7,s:5,add:true,shrink:1}); } }
    const [x,y]=proj(posOf(p)[0],0,posOf(p)[1]);
    if(p.barrier>0){ ctx.strokeStyle='rgba(111,214,255,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(x,y-r.H*.45,S*.75,r.H*.55,0,0,TAU); ctx.stroke();
      ctx.globalAlpha=.12; ctx.fillStyle='#6fd6ff'; ctx.fill(); ctx.globalAlpha=1; }
    if(p.dodge){ ctx.strokeStyle='rgba(200,240,255,.7)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.ellipse(x,y,S*.6,S*.6*ISO_Y,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  },
  enemy(ctx,e,T,S){
    if(e.under) return;
    const dk=e.hp<=0?Math.max(0,e.deathT/.5):1, sc=(e.def.scale||1)*(e.def.minion?.7:1)*(e.hp<=0?.6+.4*dk:1)*(e.hitT>0?1.08:1);
    const col=COLORS[e.color].c, frozen=e.freezeT>0;
    const r=drawSprite(ctx,e,T,S,{scale:sc,alpha:dk*(B.fog&&!e.def.boss?.4:1),flip:facing(e,B.player,FACES_LEFT.has(e.id)),bob:frozen?0:.05,flash:e.hitT>0?.85:0,tint:frozen?'#bfefff':e.stunT>0?'#fff39a':e.elem?COLORS[e.color].c:null,tintA:frozen||e.stunT>0?.45:.3});
    const x=r.x, y=r.top+30*r.k, h=r.H*.45;
    ctx.globalAlpha=dk;
    if(e.markT>0&&e.mark){ const mc=COLORS[e.mark].c, pu=.55+.35*Math.sin(T*6); ctx.globalAlpha=dk*pu*Math.min(1,e.markT/1.2);   // element mark, waiting for its partner
      ctx.strokeStyle=mc; ctx.lineWidth=3; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.ellipse(x,r.top+r.H*.98,S*.62*sc,S*.62*sc*ISO_Y,T*.8,0,TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.font=Math.round(S*.32)+'px system-ui,sans-serif'; ctx.textAlign='center'; ctx.fillStyle=mc; ctx.fillText(COLORS[e.mark].icon,x-S*.7*sc,r.top+r.H*.9); ctx.globalAlpha=dk; }
    if(e.barrier>0){ ctx.strokeStyle='rgba(255,240,179,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(x,y-h,S*.7*sc,h*1.2,0,0,TAU); ctx.stroke(); }
    const top=r.top-S*.1;
    bar(ctx,x,top,S*.9,e.hp/e.maxHp,'#ff5d6c');
    ctx.font='700 '+Math.round(S*.28)+'px "Jersey 15",system-ui,sans-serif'; ctx.textAlign='center';
    const st=[]; if(e.burnT>0) st.push('🔥'); if(frozen) st.push('❄️'); if(e.stunT>0) st.push('💫'); if(e.slowT>0) st.push('🐌'); if(e.poisonT>0) st.push('☠'); if(e.curseT>0) st.push('☾'); if(e.powerT>0) st.push('⬆'); if(e.confuseT>0) st.push('❓'); if(e.infectT>0) st.push('🧟');
    ctx.fillStyle='#fff'; { const kn=typeof bKnown!=='function'||bKnown(e); ctx.fillText(e.name+'  weak: '+(kn?COLORS[e.weak||WEAK_TO[e.color]].icon:'?')+(e.resist?(e.reflect?'  reflects: ':'  resists: ')+(kn?COLORS[e.resist].icon:'?'):''),x,top-4); }   // learned in the bestiary (reading.js)
    if(st.length) ctx.fillText(st.join(''),x,top-4-S*.3);
    if(e.casting){ const w=Math.max(S*1.6,ctx.measureText(e.casting.name).width+14), yy=top-S*.75;   // the card it is about to cast
      ctx.fillStyle='rgba(4,8,12,.9)'; ctx.strokeStyle=COLORS[e.casting.color].c; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(x-w/2,yy-S*.32,w,S*.44,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=COLORS[e.casting.color].c; ctx.fillText(TYPES[e.casting.type].icon+' '+e.casting.name,x,yy); }
    if(e.windT>0||e.casting){ const pu=1+.25*Math.sin(T*25); ctx.fillStyle='#ff5d6c'; ctx.font='800 '+Math.round(S*.6*pu)+'px "Jersey 15",system-ui,sans-serif'; ctx.fillText('!',x+S*.5,y-h*1.6); }
    // intent: what it will do next, with a ring that closes as the attack nears
    if(e.hp>0&&!e.casting&&!e.windT&&e.nextMove&&e.atkT<1.6&&e.freezeT<=0&&e.stunT<=0){ const ix=x+S*.62, iy=top-S*.05, r=S*.26, k=1-e.atkT/1.6;
      ctx.fillStyle='rgba(4,8,12,.85)'; ctx.beginPath(); ctx.arc(ix,iy,r,0,TAU); ctx.fill();
      if(typeof atkBars!=='function'){ ctx.strokeStyle=k>.75?'#ff3a4a':'#ffb3a0'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(ix,iy,r,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke(); }   // the tile's attack bar shows the timing now
      ctx.font=Math.round(S*.28)+'px system-ui'; ctx.fillStyle='#fff'; ctx.fillText(INTENT_ICON[e.nextMove]||'!',ix,iy+S*.1); }
    ctx.globalAlpha=1;
  },
  rock(ctx,r,T,S){
    if(gl3()) arenaBlock(r,'rock',r.tile.rockT>0&&r.tile.rockT<2?'#a8b4c0':null);
    else { const top=hexCorners(r.tile,.7,.75), bot=hexCorners(r.tile,.7,0);
      ctx.fillStyle='#2a3138'; frontFaces(ctx,top,bot[0][1]-top[0][1]);
      ctx.fillStyle=r.tile.rockT>0&&r.tile.rockT<2?'#7d8894':'#56606a'; poly(ctx,top); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.stroke(); }
    // cracks as it takes hits
    const k=r.maxHp?1-r.hp/r.maxHp:0;
    if(k>.05){ const [cx,cy]=proj(r.tile.wx,.76,r.tile.wz); ctx.strokeStyle='rgba(10,14,18,.85)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(let i=0;i<1+Math.floor(k*4);i++){ const a=i*2.1+.4, l=S*.35*(.5+k); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*l*.6,cy+Math.sin(a)*l*.3); ctx.lineTo(cx+Math.cos(a+.4)*l,cy+Math.sin(a+.4)*l*.5); } ctx.stroke(); }
  },
  wall(ctx,w,T,S){
    const col=colorOf(w.card);
    if(gl3()) arenaBlock(w,w.cage?'cage':'wall',col);
    else { const top=hexCorners(w.tile,.62,.9), bot=hexCorners(w.tile,.62,0);
      ctx.fillStyle=mixHex(col,'#000000',.5); ctx.beginPath();
      frontFaces(ctx,top,bot[0][1]-top[0][1]);
      ctx.fillStyle=mixHex(col,'#ffffff',.15); poly(ctx,top); ctx.fill(); }
    if(w.thorns){ ctx.fillStyle='#fff'; const [x,y]=proj(w.tile.wx,1,w.tile.wz); ctx.font='700 '+Math.round(S*.3)+'px system-ui'; ctx.textAlign='center'; ctx.fillText('✶',x,y); }
    const [x,y]=proj(w.tile.wx,1.15,w.tile.wz); bar(ctx,x,y,S*.7,w.hp/w.maxHp,'#6fd6ff'); turnPips(ctx,x,y-S*.12,w.life,S);
  },
  ally(ctx,a,T,S){
    if(a.ai==='hero') return DRAW.hero(ctx,a,T,S);
    const col=colorOf(a.card), unit=a.cr||['shooter','bomber','healer','guardian'].includes(a.ai);
    const r=drawSprite(ctx,a,T,S,{scale:unit?.85:.8,bob:unit?.04:0,flip:facing(a,a.enemy?B.player:alive()[0],false),flash:a.hitT>0?.8:0});
    const x=r.x, top=r.top-S*.05;
    ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x-S*.45,top+S*.1,S*.12,-Math.PI/2,-Math.PI/2+TAU*clamp(a.life/a.maxLife,0,1)); ctx.stroke();
    turnPips(ctx,x,top-S*.1,a.life,S);
    if(a.hp<a.maxHp) bar(ctx,x,top,S*.6,a.hp/a.maxHp,'#6fd6ff');
  },
  // a hero: a golden ring on the ground, a light column, its name, HP and time left
  hero(ctx,a,T,S){
    const col=colorOf(a.card), [gx,gy]=proj(...posOf(a).slice(0,1),.02,posOf(a)[1]), pulse=.5+.5*Math.sin(T*3);
    ctx.strokeStyle='#ffe066'; ctx.lineWidth=2.5; ctx.globalAlpha=.6+.3*pulse; ctx.beginPath(); ctx.ellipse(gx,gy,S*.78,S*.78*View.iy,0,0,TAU); ctx.stroke();
    const g=ctx.createLinearGradient(0,gy-S*3,0,gy); g.addColorStop(0,'rgba(255,230,120,0)'); g.addColorStop(1,'rgba(255,230,120,.28)');
    ctx.globalAlpha=1; ctx.fillStyle=g; ctx.fillRect(gx-S*.55,gy-S*3,S*1.1,S*3);
    const moving=Math.hypot(posOf(a)[0]-a.tile.wx,posOf(a)[1]-a.tile.wz)>.05;
    const r=drawSprite(ctx,a,T,S,{scale:1.05,bob:.04,step:moving?Math.floor(T*7)%2:null,flip:facing(a,alive()[0],false),flash:a.hitT>0?.8:0});
    const top=r.top-S*.1; ctx.textAlign='center'; ctx.font='800 '+Math.round(S*.3)+'px "Jersey 15",system-ui,sans-serif';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.7)'; const nm='♔ '+a.card.name.split(',')[0]; ctx.strokeText(nm,r.x,top-S*.18); ctx.fillStyle='#ffe066'; ctx.fillText(nm,r.x,top-S*.18);
    bar(ctx,r.x,top,S*.9,a.hp/a.maxHp,col); turnPips(ctx,r.x,top+S*.16,a.life,S);
  },
};

if(typeof module!=='undefined') module.exports={TILES,P_TILES,E_TILES,tileAt,neighbors,hexDist,lineTiles,wedgeTiles,pathTo};
