/* Hexmancers playtest bot. Injected into the page; run with PT.runFight({...}). Read-only on the game:
   it only wraps a few global functions to count things. */
(function(){
const PT=window.PT={};
const DT=1/30;
PT.WAND_OVR=null;

/* ---------- instrumentation ---------- */
/* Fair hits: for every hit that cost HP, how long its threat was on screen first (a ground telegraph's whole
   time; a shot's flight plus its owner's wind-up), and how long you had already stood on the tile it hit.
   Unfair: less warning than a person needs to see it and step away (REACT), while you stood there all along. */
const REACT=.4, TIGHT=.7, WARN_BINS=[.2,.4,.7,1,2,99];
function warnHit(S,b,p,lost){ let warn=null, k='other';
  const tl=b.teles.find(t=>!t.friendly&&t.t>=t.dur&&t.tiles.includes(p.tile));
  if(tl){ warn=tl.dur; k='tele'; }
  else { const sh=b.shots.find(x=>x.from==='e'&&!x.done&&x.tiles[x.i]===p.tile); if(sh){ warn=b.time-(sh._w0!=null?sh._w0:b.time); k='shot'; } }
  const W=S.warn||(S.warn={hits:0,dmg:0,unfair:0,unfairDmg:0,tight:0,pinned:0,byKind:{},bins:WARN_BINS.map(()=>0),worst:[]});
  const stood=b.time-(S.tileT||0), pinned=p.rootT>0||p.stunT>0||p.freezeT>0;
  W.hits++; W.dmg+=lost; const K=W.byKind[k]||(W.byKind[k]={n:0,dmg:0,warnSum:0,warnN:0}); K.n++; K.dmg+=lost;
  if(warn==null) return; K.warnSum+=warn; K.warnN++; W.bins[WARN_BINS.findIndex(x=>warn<x)]++;
  if(pinned) W.pinned++;
  if(warn<REACT&&stood>=warn-.01){ W.unfair++; W.unfairDmg+=lost; if(W.worst.length<5) W.worst.push({k,warn:+warn.toFixed(2),lost,src:tl&&tl.owner?tl.owner.id:(b.shots.find(x=>x.from==='e'&&x.tiles[x.i]===p.tile)||{}).owner?.id,move:tl&&tl.kind}); }
  else if(warn<TIGHT) W.tight++; }
function wrap(){
  if(PT.wrapped) return; PT.wrapped=true;
  const _hitEnemy=window.hitEnemy, _hitPlayer=window.hitPlayer, _shoot=window.shoot, _playCard=window.playCard,
        _payHp=window.payHp, _healPlayer=window.healPlayer, _killEnemy=window.killEnemy, _counterHit=window.counterHit, _useInstant=window.useInstant;
  const allyType=c=>!!c&&(['summon','machine','sentry','hero'].includes(c.type==='piece'?c.base:c.type)||!!c.beh||/^cr_/.test(c.id||''));
  window.hitEnemy=function(e,base,card,opts){
    const S=PT.cur, before=e&&e.hp>0?e.hp:0;
    if(S&&!card&&!(opts&&opts.raw)) S.lastNull=0;
    const r=_hitEnemy.apply(this,arguments);
    if(S&&before>0&&r>0){ const d=Math.min(r,before);
      let k; if(opts&&opts.raw) k='raw'; else if(!card) k='nullcard'; else if(card.id==='wand'||card.id==='unison') k='wand'; else if(allyType(card)) k='ally'; else k='card';
      S.dmg[k]=(S.dmg[k]||0)+d; if(k==='nullcard') S.lastNull=d; else if(k==='card'&&card&&card.lab) S.dmg.labCard=(S.dmg.labCard||0)+d;
      if(k==='ally'&&card&&card.lab) S.dmg.labAlly=(S.dmg.labAlly||0)+d;
      if(k==='card'||k==='ally'){ const key=(card.type==='piece'?card.base:card.type)+(card.shape?':'+card.shape:card.beh?':'+card.beh:''); S.dmgByKind[key]=(S.dmgByKind[key]||0)+d; } }
    return r; };
  window.shoot=function(from,tiles,o){
    const S=PT.cur;
    if(S&&o&&o.wand){ S.wandShots++; const prev=o.onHit; o.onHit=function(e,t){ if(S.lastNull){ S.dmg.nullcard-=S.lastNull; S.dmg.wand=(S.dmg.wand||0)+S.lastNull; S.lastNull=0; } if(prev) prev.apply(this,arguments); }; }
    if(o&&o.from==='e'&&B){ const ow=o.owner; o._w0=ow&&ow._wStart!=null?ow._wStart:B.time; }   // warning: from the wind-up (or the shot) on
    return _shoot.apply(this,arguments); };
  window.hitPlayer=function(dmg,src){
    const S=PT.cur, b=B, p=b&&b.player; const hp0=p?p.hp:0;
    let kind='?';
    if(p){ const tl=b.teles.find(t=>!t.friendly&&t.t>=t.dur&&t.tiles.includes(p.tile)&&(!src||t.owner===src)); kind=tl?(tl.kind||(tl.owner?'cardcast':'boss-dive')):src?'shot':p.tile.zapT>=1.9?'vault-bolt':p.tile.voidHole?'void-fall':p.tile.toxT>0?'toxic':burning(p.tile)?'burn-tile':(b.enemies.some(e=>e.reflect)?'reflect?':'sentry/other'); }
    const r=_hitPlayer.apply(this,arguments);
    if(S&&p){ const lost=hp0-Math.max(0,p.hp); if(lost>0) warnHit(S,b,p,lost); }
    if(S&&p&&S.hitLog&&S.hitLog.length<60){ const lost=hp0-Math.max(0,p.hp); if(lost>0){ const tl=b.teles.find(t=>!t.friendly&&t.t>=t.dur&&t.tiles.includes(p.tile));
      S.hitLog.push({t:+b.time.toFixed(2),lost,kind,src:src&&src.id,tile:[p.tile.col,p.tile.r],path:p.path.length,moveCd:+p.moveCd.toFixed(2),root:p.rootT>0,teleDur:tl&&tl.dur,teleN:tl&&tl.tiles.length,teleRows:tl&&[...new Set(tl.tiles.map(x=>x.r))].join(''),srcTile:src&&src.tile&&[src.tile.col,src.tile.r],tgt:PT.lastTgt}); } }
    if(S&&p){ const lost=hp0-Math.max(0,p.hp); if(lost>0&&lost>(S.maxHit.n||0)) S.maxHit={n:lost,by:(src&&src.id||'none')+':'+kind}; if(lost>0){ S.dmgTaken+=lost; S.hitsTaken++; const key=(src&&src.id||'none')+':'+kind; S.hurtBy[key]=(S.hurtBy[key]||0)+lost; } }
    return r; };
  window.payHp=function(n){ const S=PT.cur, p=B&&B.player, h0=p?p.hp:0; const r=_payHp.apply(this,arguments); if(S&&p) S.selfPaid+=h0-p.hp; return r; };
  window.healPlayer=function(n,q){ const S=PT.cur, p=B&&B.player, h0=p?p.hp:0; const r=_healPlayer.apply(this,arguments); if(S&&p) S.healed+=Math.max(0,p.hp-h0); return r; };
  window.playCard=function(inst){ const S=PT.cur; if(S){ S.casts++; const c=inst.card, k=(c.type==='piece'?c.base:c.type); S.castsByType[k]=(S.castsByType[k]||0)+1; if(c.lab) S.labCasts++; } return _playCard.apply(this,arguments); };
  window.useInstant=function(inst){ const S=PT.cur; const r=_useInstant.apply(this,arguments); if(S&&r){ S.instants++; } return r; };
  window.killEnemy=function(e){ const S=PT.cur; if(S&&e){ S.kills++; } return _killEnemy.apply(this,arguments); };
}

/* ---------- human perception (bot.human) ---------- */
let HU=null, SEEN=null, ESTATE=null;
const urand=()=>HU.rng(), gauss=()=>{ let u=0,v=0; while(!u) u=urand(); while(!v) v=urand(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const between=([a,b])=>a+(b-a)*urand();
// real seconds of reaction for one threat, and whether it is noticed at all
function noticeOf(key){ let s=SEEN.get(key); if(!s){ const h=HU.cfg; s={t0:B.time, d:Math.max(h.reactMin,h.react+h.reactSd*gauss())*PACE, miss:urand()>h.notice}; SEEN.set(key,s); } return s; }
const known=key=>{ if(!HU) return true; const s=noticeOf(key); return !s.miss&&B.time-s.t0>=s.d; };
// an enemy's wind-up or cast is a new threat each time it starts
function eKey(e,state){ let m=ESTATE.get(e); if(!m||m.state!==state){ m={state,key:{}}; ESTATE.set(e,m); } return m.key; }

/* ---------- the joystick and flicks (bot.stick) ----------
   What the game's own stick does each frame (ui.js stickWalk): a push sets a raw free target 3 units that way at
   the stick's speed; letting go is freeEnd (momentum and the magnet finish); a flick is flickThrow. */
let ST=null;
const spOf=t=>Math.min(...neighbors(t).map(n=>Math.hypot(n.wx-t.wx,n.wz-t.wz)));
function TH_URGENT(p){ return threatsAt(p.tile).some(th=>th.T<.7); }
function stickGo(t,urgent){ const p=B.player, h=HU&&HU.cfg||{}, sp=spOf(p.tile), dx=t.wx-p.fx, dz=t.wz-p.fz, n=Math.hypot(dx,dz)/sp;
  ST.tgt=t; ST.ang=(h.stickNoise||0)*Math.PI/180*gauss(); ST.rel=Math.max(.12,(h.release||.35)+(h.releaseSd||.1)*gauss());
  if(urgent&&n>.6&&n<=3.2&&MV('mvFlick')&&urand()<(h.flickP||0)){   // a flick: as hard as the distance asks, give or take
    const lo=MV('mvFlickMin'), hi=MV('mvFlickMax'), want=Math.round(n), str=Math.max(0,Math.min(1,(want-lo)/Math.max(1,hi-lo)+.15*gauss()));
    const c=Math.cos(ST.ang), s2=Math.sin(ST.ang); freeEnd(); if(flickThrow(dx*c-dz*s2,dx*s2+dz*c,str)){ ST.flicks++; ST.tgt=null; } } }
function stickTick(){ const p=B.player, t=ST.tgt; if(!t||p.fx==null) return;
  const sp=spOf(p.tile), dx=t.wx-p.fx, dz=t.wz-p.fz, d=Math.hypot(dx,dz);
  if(d/sp<ST.rel||t.occ&&t.occ!==p){ freeEnd(); ST.tgt=null; return; }   // let go: the slide and the magnet finish it
  const c=Math.cos(ST.ang), s2=Math.sin(ST.ang), ux=(dx*c-dz*s2)/d, uz=(dx*s2+dz*c)/d;
  freeTarget(p.fx+ux*3,p.fz+uz*3,false,1,true); if(p.free) p.free.tps=MV('mvStickSpeed'); ST.held+=DT; }

/* ---------- helpers ---------- */
const hostileTeles=()=>B.teles.filter(t=>!t.friendly&&!(t.owner&&t.owner.hp<=0));
// real seconds until a hostile hit lands on tile t (teles, enemy shots, wind-ups in that row)
let RT=0;
function threatsAt(t){
  const out=[];
  for(const tl of hostileTeles()) if(tl.tiles.includes(t)&&tl.t/PACE>=RT&&known(tl)) out.push({T:Math.max(0,(tl.dur-tl.t)/PACE),w:1});
  for(const s of B.shots){ if(s.from!=='e'||s.done||!known(s)) continue; const j=s.tiles.indexOf(t); if(j<=s.i) continue;
    // a shot stops at the first thing in its way before reaching t
    let blocked=false; for(let k=Math.max(0,s.i+1);k<j;k++){ const o=s.tiles[k].occ; if(o&&o.kind!=='enemy'&&!o.enemy&&o.kind!=='player'&&!(o.cr&&typeof crPassThrough==='function'&&crPassThrough(o))){ blocked=true; break; } }
    if(!blocked) out.push({T:Math.max(0,((j-s.i)*s.speed-s.stepT)/PACE),w:.9}); }
  for(const e of alive()){ const dr=Math.abs(e.tile.r-t.r), rowHit=dr===0||(e.confuseT>0&&dr===1), d=Math.abs(e.tile.col-t.col);
    if(!rowHit) continue;
    if(e.windT>0&&(.7-e.windT)/PACE>=RT&&known(eKey(e,'w'))) out.push({T:(e.windT+d*.08)/PACE,w:.8});
    if(e.casting&&(.9-e.castT)/PACE>=RT&&known(eKey(e,'c'+(e.casting.id||'')))){ const c=e.casting, k=c.type==='piece'?c.base:c.type;
      if(k==='charge'){ for(let i=0;i<3;i++) out.push({T:(e.castT+i*.35+d*.08)/PACE,w:.8}); }
      else if(k==='strike'&&c.shape==='line') out.push({T:(e.castT+d*.08)/PACE,w:.8});
      else if(k==='strike'&&c.shape!=='all'&&c.shape!=='missiles'&&dr===0) out.push({T:(e.castT+.6)/PACE,w:.8}); } }
  for(const a of B.allies){ if(!a.enemy||a.hp<=0||a.tile.r!==t.r||!known(a)) continue; out.push({T:(Math.max(0,a.fireT)+Math.abs(a.tile.col-t.col)*.08)/PACE,w:.6}); }
  if(t.boltT>0&&(1.6-t.boltT)/PACE>=RT&&known(eKey(t,'bolt'))) out.push({T:t.boltT/PACE,w:1});
  const v=t.voidTile; if(v&&known(v)){ if(v.ph==='warn') out.push({T:v.t/PACE,w:1}); else if(v.ph==='solid'&&v.t<1.5) out.push({T:(v.t+1.2)/PACE,w:1}); }
  return out;
}
function bfs(from){ const dist=new Map([[from,0]]), par=new Map(), q=[from];
  while(q.length){ const c=q.shift(); for(const n of neighbors(c)) if(!dist.has(n)&&n.side==='p'&&!(n.holeT>0)&&!n.occ){ dist.set(n,dist.get(c)+1); par.set(n,c); q.push(n); } }
  return {dist,par}; }
// first thing a shot from t along its row reaches: an enemy?
function rowTarget(t){ const r=shotPath(lineTiles(t,DIRS.E),false); return r.hit[0]?r.hit[0].occ:null; }
function rowBlockedEnemy(t){ for(const x of lineTiles(t,DIRS.E)){ const o=x.occ; if(!o) continue; if(o.kind==='enemy'&&o.hp>0) return o; if(o.kind==='rock'||o.enemy) return lineTiles(x,DIRS.E).some(y=>y.occ&&y.occ.kind==='enemy'&&y.occ.hp>0)?o:null; } return null; }

function nextCardNeedsRow(){ const q=B.piles.queue[0]; if(!q) return false; const c=q.card, k=c.type==='piece'?c.base:c.type;
  if(k==='strike') return ['line','dig','row','wedge','zigzag','twin','fan','spear','boomerang','gun','burst','ricochet'].includes(c.shape);
  if(k==='charge'&&c.fx!=='lob') return true; return false; }

/* ---------- movement (good bot) ---------- */
function chooseTile(bot){
  const b=B, p=b.player, {dist,par}=bfs(p.tile), STEP=.14*(p.slow||1)*(p.hasteT>0?.6:1);
  const needRow=nextCardNeedsRow(), wedge=(()=>{ const q=b.piles.queue[0]; return q&&q.card.type==='strike'&&q.card.shape==='wedge'; })();
  let best=null, bestS=-1e9, curS=null; const TH=new Map();
  RT=bot.react||0;
  // the random player (a baseline for the mastery gap): wanders to a nearby tile now and then, blind to threats
  if(bot.random){ const near=[...dist].filter(([t,d])=>d>0&&d<=2).map(([t])=>t); if(near.length&&urand()<.35) return {best:near[Math.floor(urand()*near.length)],bestS:1e9,curS:0}; return {best:p.tile,bestS:0,curS:0}; }
  if(bot.dodge) for(const [t] of dist){ const th=threatsAt(t); if(th.length) TH.set(t,th); }
  const dep0=Math.max(0,p.moveCd);
  for(const [t,d] of dist){
    const arr=d?dep0+(d-1)*STEP:0;
    let s=-4*d;
    if(bot.dodge){
      for(const th of (TH.get(t)||[])){
        if(th.T>=arr-.06) s-=(th.T-arr<1.6?900:150)*th.w*(bot.fear||1);   // still to land after I get there
      }
      // tiles on the way, the start included: a hit that lands while I am still on one of them
      if(d>0&&TH.size){ let x=par.get(t), i=d-1; while(x){ const from=i===0?-1:dep0+(i-1)*STEP, to=dep0+i*STEP+.06;
          for(const th of (TH.get(x)||[])) if(th.T>=from&&th.T<=to) s-=700*th.w; if(x===p.tile) break; x=par.get(x); i--; } }
      if(burning(t)||t.toxT>0||t.lavaWarn>0) s-=120;
      if(t.voidTile) s-=25;
      if(icy(t)) s-=8;
    } else if(burning(t)) s-=120;
    const tgt=rowTarget(t);
    if(tgt){ s+=40+(needRow?25:0); if(tgt.windT>0||tgt.casting) s+=5; if(bot.prio&&(tgt.id==='rootnode'||tgt.def.spell||tgt.id==='sprite')) s+=45; }
    else if(rowBlockedEnemy(t)) s+=12;
    if(wedge) s+=6*t.col;
    if(bot.dodge&&t.crystal&&!p.crystalCharge) s+=30;
    // a dungeon trial's rule (minibosses.js), which a player reads on the board: step on the glowing tiles; break them in order
    const rule=b.rule; if(rule&&rule.kind==='switches'&&rule.tiles&&rule.tiles.includes(t)&&!rule.lit.has(t)) s+=150;
    if(rule&&rule.kind==='order'&&rule.ok&&tgt&&tgt.order&&tgt.order!==rule.next) s-=55;
    if(t===p.tile) curS=s;
    if(s>bestS){ bestS=s; best=t; }
  }
  return {best,bestS,curS};
}

/* ---------- the Spell screen ---------- */
function cardVal(c){ if(!c) return 0; const k=c.type==='piece'?c.base:c.type;
  let v=c.pow||0; if(k==='strike'&&c.shape==='all') v*=2; if(k==='strike'&&c.shape==='missiles') v*=(c.n||3)*.6; if(k==='lob'&&c.radius) v*=1.5;
  if(!v&&c.amt) v=c.amt*.8; if(!v&&c.hp) v=c.hp/3; if(c.uses) v*=Math.min(3,c.uses)*.7; return Math.max(v,8); }
function comboScore(cards){ // cards: instances
  const cs=detectCombos(cards); let s=cards.reduce((a,c)=>a+cardVal(c.card),0);
  for(const cb of cs){ if(cb.kind==='recipe') s+=120; else if(cb.kind==='simple') s+=(cb.mult-1)*cb.n*cardVal(cards.find(c=>c.card.id===cb.id).card);
    else if(cb.kind==='flush') s*=1.25; else if(cb.kind==='straight') s+=.5*cards.reduce((a,c)=>a+(c.card.pow||20),0); else if(cb.kind==='set') s+=18; else if(cb.kind==='run') s+=18; else if(cb.kind==='brood') s+=10*cb.n; }
  return {s,cs}; }
function botQueue(bot){
  const p=B.piles;
  if(bot.instants){ for(const inst of p.hand.filter(c=>isInstant(c.card)&&(!HU||urand()<HU.cfg.instantP))){ const c=inst.card; if(c.as==='utility'&&(c.util==='keep'||c.util==='reshuffle')) continue; useInstant(inst); } }
  const cand=p.hand.filter(c=>!isInstant(c.card)&&!c.cursed), free=slotsOf(p)-p.queue.length, k=Math.min(free,cand.length);
  if(k<=0) return;
  if(!bot.combos){ cand.slice(0,k).forEach(c=>toggleQueue(p,c.uid)); return; }
  if(HU&&urand()>HU.cfg.comboSkill){ cand.slice().sort((a,b)=>cardVal(b.card)-cardVal(a.card)).slice(0,k).forEach(c=>toggleQueue(p,c.uid)); return; }
  let best=null, bestS=-1;
  const pre=p.queue.slice();
  const rec=(sel,used)=>{ if(sel.length===k){ const {s}=comboScore(pre.concat(sel)); if(s>bestS){ bestS=s; best=sel.slice(); } return; }
    for(let i=0;i<cand.length;i++){ if(used&(1<<i)) continue; sel.push(cand[i]); rec(sel,used|(1<<i)); sel.pop(); } };
  rec([],0);
  for(const c of best) toggleQueue(p,c.uid);
}
function doCustom(bot,S){ botQueue(bot,S); const cs=detectCombos(B.piles.queue); cs.forEach(cb=>{ S.combos[cb.kind]=(S.combos[cb.kind]||0)+1; }); S.spellScreens++; closeCustomScreen(); }

/* ---------- casting and aiming ---------- */
function lobTarget(){ const es=alive(); if(!es.length) return null;
  const still=es.filter(e=>e.stunT>0||e.freezeT>0||e.windT>0||e.casting||e.moveT>.9);
  const pool=still.length?still:es, p=B.player;
  return pool.sort((a,b)=>hexDist(p.tile,a.tile)-hexDist(p.tile,b.tile))[0].tile; }

/* ---------- one fight ---------- */
PT.runFight=function(cfg){
  wrap();
  const bot=Object.assign({move:true,dodge:true,combos:true,instants:true,aim:true,smartCast:true},cfg.bot||{});
  // a human player (bot.human): a seeded dice, what they have noticed, and when their thumbs are next free
  let seed=(cfg.seed||1)>>>0; const rng=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  HU=bot.human?{cfg:bot.human,rng}:null; SEEN=new Map(); ESTATE=new WeakMap(); ST={tgt:null, ang:0, rel:.35, flicks:0, held:0, bot};
  const H={nextTap:0, chargeUntil:-1, movedAt:-9, castAt:null, gaugeAt:null, nextEval:0};
  if(!cfg.adopt){ B=null; fight(cfg.depth,cfg.waves); }   // adopt: a fight the dungeon started (crawl.js); its own end screens still run
  if(!B) return {error:'fight did not start'};
  const b=B, keepEnd=b.hooks.onEnd; b.hooks.onEnd=()=>{}; b.hooks.onCustom=()=>{}; b.hooks.onFight=()=>{}; b.hooks.onCast=()=>{}; b.hooks.onHurt=()=>{}; b.hooks.onTurn=()=>{}; b.hooks.onWave=()=>{}; b.hooks.onSoul=()=>{};
  try{ document.getElementById('scrBattle').classList.remove('on'); document.getElementById('custom').classList.remove('on'); }catch(e){}
  const S=PT.cur={maxHit:{}, hitLog:cfg.debug?[]:null, dmg:{}, dmgByKind:{}, hurtBy:{}, dmgTaken:0, hitsTaken:0, selfPaid:0, healed:0, casts:0, castsByType:{}, labCasts:0, instants:0, wandShots:0, kills:0, combos:{}, spellScreens:0, lastNull:0, errors:[]};
  const maxT=cfg.maxT||420; let fullT=0, holdT=0, ticks=0, emptyT=0, moveEval=0, lastTarget=null, wandOnlyAt=null, stuck=null;
  const startEnemies=new Set();
  try{ doCustom(bot,S); }catch(e){ S.errors.push('custom: '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | ')); }
  while(b.phase==='fight'&&b.time<maxT){
    ticks++;
    const p=b.player;
    try{
      // the Spell screen: when the gauge is full and the queue is empty (or it has been full for a while)
      if(gaugeFull()&&!wandOnly(b.piles)){ fullT+=DT;
        if(HU){ if(H.gaugeAt==null) H.gaugeAt=b.time+between(HU.cfg.gaugeDelay)*PACE*(b.piles.queue.length?3:1);   // noticed it is full (later while cards are still queued)
          if(b.time>=H.gaugeAt){ H.gaugeAt=null; fullT=0; if(p.charging) wandUp(); openCustomScreen(); doCustom(bot,S); } }
        else if(b.piles.queue.length===0||fullT>4){ fullT=0; openCustomScreen(); doCustom(bot,S); } } else { fullT=0; if(HU) H.gaugeAt=null; }
      if(wandOnly(b.piles)&&wandOnlyAt==null) wandOnlyAt=b.time;
      // moving
      if(bot.move&&(HU?b.time>=H.nextEval:(--moveEval<=0||p.path.length===0))){ if(HU) H.nextEval=b.time+between(HU.cfg.evalGap)*PACE;
        moveEval=bot.evalEvery||3; const {best,bestS,curS}=chooseTile(bot); PT.lastTgt=best&&[best.col,best.r,Math.round(bestS),curS==null?null:Math.round(curS)];
        if(best&&best!==p.tile&&(curS==null||bestS>curS+(curS<-100?0:12))){ if(best!==lastTarget||(bot.stick?(!ST.tgt&&!(p.snap&&p.snap.flick)&&p.tile!==best):!p.path.length)){ let go=best;
            if(HU&&urand()<HU.cfg.misTap){ const ns=neighbors(best).filter(n=>n.side==='p'&&!n.occ&&!(n.holeT>0)); if(ns.length) go=ns[Math.floor(urand()*ns.length)]; S.misTaps=(S.misTaps||0)+1; }   // the thumb lands on the tile next to it
            if(bot.stick) stickGo(go,TH_URGENT(p)); else moveTo(go); lastTarget=best; H.movedAt=b.time; } }
        else if(best===p.tile){ p.path=[]; lastTarget=null; if(bot.stick&&ST.tgt&&ST.tgt!==p.tile) stickGo(p.tile,false); }
      }
      // casting
      const q=b.piles.queue[0];
      if(q&&p.castCd<=0&&!(q.frozenT>0)){
        if(bot.aim&&nextIsLob()){ const t=lobTarget(); if(t) b.aim=t; }
        let go=true;
        if(bot.smartCast){ const pv=castPreview(); const att=pv&&(pv.hit.length||pv.self||pv.place.length);
          if(!att&&alive().length){ holdT+=DT; go=holdT>1.5; } else if(!alive().length) go=false; }
        if(go&&HU){ if(H.castAt==null) H.castAt=b.time+between(HU.cfg.castDelay)*PACE; go=b.time>=H.castAt; }
        if(go){ holdT=0; H.castAt=null; castCard(); }
      }
      // wand
      if(HU){ // taps at a human rate, now and then a held charge shot; the thumb rests a moment after a move
        const h=HU.cfg;
        if(p.charging){ if(b.time>=H.chargeUntil){ wandUp(); S.charged=(S.charged||0)+1; } }
        else if(b.time>=H.nextTap&&b.time-H.movedAt>=h.focusPause*PACE&&p.wandCd<=0){
          const t=rowTarget(p.tile)||rowBlockedEnemy(p.tile);
          if(t||urand()<h.blindTap){ if(urand()<h.chargeP){ wandDown(); H.chargeUntil=b.time+(chargeNeed(p)+.08); } else fireWand(false); S.taps=(S.taps||0)+1; }
          H.nextTap=b.time+Math.max(h.tapMin,-Math.log(1-urand())/h.fireRate)*PACE; } }
      else if(p.wandCd<=0){ const t=rowTarget(p.tile)||rowBlockedEnemy(p.tile); if(t||!bot.smartCast) fireWand(false); }
      if(b.sidearm&&rowTarget(p.tile)) fireAce();
      for(const e of b.enemies) startEnemies.add(e);
      if(cfg.trace&&ticks%300===0){ const bo=b.enemies.find(e=>e.def.boss); (S.trace=S.trace||[]).push({t:Math.round(b.time),boss:bo&&bo.hp,ph:bo&&bo.phase,nodes:alive().filter(e=>e.id==='rootnode').map(e=>e.hp+'@'+e.tile.col+','+e.tile.r+(e.barrier?'b'+e.barrier:'')+'|front:'+lineTiles(e.tile,DIRS.W).filter(x=>x.occ).map(x=>(x.occ.id||x.occ.kind)+x.col).join(',')).join('/'),sap:alive().filter(e=>e.id==='sapling').length,alive:alive().length,deck:b.piles.draw.length,php:p.hp,row:p.tile.r,tgt:(rowTarget(p.tile)||{}).id}); }
      if(p.tile!==S.tile){ S.tile=p.tile; S.tileT=b.time; }
      for(const e of b.enemies){ if(e.windT>0||e.casting){ if(e._wStart==null) e._wStart=b.time; } else e._wStart=null; }
      if(bot.stick) stickTick();
      update(DT);
      if(!alive().length&&b.phase==='fight'){ emptyT+=DT; if(emptyT>15&&!stuck) stuck='no enemies alive for 15s, wave='+b.wave+'/'+b.waves.length; } else emptyT=0;
      if(stuck&&emptyT>20) break;
    }catch(e){ S.errors.push('tick: '+e.message+' | '+(e.stack||'').split('\n').slice(0,4).join(' | ')); if(S.errors.length>3) break; }
  }
  for(const e of b.enemies) startEnemies.add(e);
  const en={}; for(const e of startEnemies) en[e.id]=(en[e.id]||0)+1;
  const res=b.phase==='win'?'win':b.phase==='lose'?'lose':S.errors.length?'error':stuck?'stuck':'timeout';
  const out={deck:cfg.deck, depth:cfg.depth, bot:cfg.botName, res, time:+b.time.toFixed(1), ticks, hpEnd:b.player.hp, maxHp:b.player.maxHp,
    dmgTaken:S.dmgTaken, hitsTaken:S.hitsTaken, selfPaid:S.selfPaid, healed:S.healed, casts:S.casts, castsByType:S.castsByType, labCasts:S.labCasts, instants:S.instants,
    wandShots:S.wandShots, kills:S.kills, counters:b.counters||0, reacts:b.reacts||0, combos:S.combos, spellScreens:S.spellScreens, dmg:S.dmg, dmgByKind:S.dmgByKind, hurtBy:S.hurtBy,
    waves:b.waves.length, waveReached:b.wave, enemies:en, enemyHpLeft:alive().reduce((a,e)=>a+e.hp,0), boss:b.enemies.filter(e=>e.def.boss).map(e=>e.id),
    wandOnlyAt, deckLeft:b.piles.draw.length, flicks:ST.flicks, stickSecs:+ST.held.toFixed(1), taps:S.taps, charged:S.charged, misTaps:S.misTaps, missedThreats:HU?[...SEEN.values()].filter(x=>x.miss).length:0, threatsSeen:HU?SEEN.size:0, stuck, warn:S.warn||null, maxHit:S.maxHit, errors:S.errors, hitLog:S.hitLog||undefined, trace:S.trace};
  PT.lastB=b; PT.cur=null; HU=null;
  if(cfg.adopt){ b.hooks.onEnd=keepEnd; out.realSecs=+(ticks*DT).toFixed(1); for(let k=0;k<200&&B===b&&b.timers.length;k++){ try{ update(DT); }catch(e){ out.errors.push('end: '+e.message); break; } } }
  else B=null;
  return out;
};

/* ---------- decks ---------- */
PT.setupDeck=function(i,labIds){
  save=newSave(STARTERS[i]); save.char=lockChar(newChar('human',0));
  if(labIds&&labIds.length){ const list=save.decks[save.active||0].list;
    const recipe=(RECIPES.find(r=>r.id===STARTERS[i].recipe)||{cards:[]}).cards;
    const add=[]; labIds.forEach(id=>{ add.push(id,id); });
    let n=add.length;
    while(n>0){ const cnt={}; list.forEach(id=>cnt[id]=(cnt[id]||0)+1);
      const cut=Object.keys(cnt).filter(id=>!recipe.includes(id)&&CARDS[id].rarity!=='hero'&&CARDS[id].rarity!=='legendary').sort((a,b)=>cnt[b]-cnt[a]||CARDS[b].rank-CARDS[a].rank)[0];
      list.splice(list.lastIndexOf(cut),1); n--; }
    list.push(...add); add.forEach(id=>save.owned[id]=(save.owned[id]||0)+1);
  }
  const d=activeDeck(); const v=validateDeck(d.list,CARDS,save.owned);
  return {ok:v.ok, errors:v.errors, n:d.list.length};
};
PT.makeLab=function(spec){ Object.assign(LAB,{kind:'creature',shape:'twin',rider:null,cluster:'ring',color:'fire',beh:'bolt',tier:'sturdy',speed:'steady',kw:null,trait:null,race:'dwarf',body:0,rank:6,rarity:'rare'},spec);
  const c=labCard(); CARDS[c.id]=c; return {id:c.id, name:c.name, type:c.type, pow:c.pow, hp:c.hp, amt:c.amt, rate:c.rate, text:(typeof cardText==='function'?cardText(c):'')}; };

/* ---------- whole runs (PT.runRun) ----------
   A new character picks one colour and is dealt 20 commons and 10 uncommons of it, 30 random commons and
   uncommons, and 1 or 2 rares (all rank 1-6), plus the colour's hero. Each fight is a battle at the next depth;
   a win pays what the game pays (cards, gold, gear, XP, a boss's pack); a loss costs 20% of the gold and the
   fight is tried again (three losses in a row at one depth end the run). Between fights the bot rebuilds its
   deck in its own style and puts on better gear. */
const kindOf2=c=>c.type==='piece'?c.base:c.type;
const ATTACK=['strike','lob','charge','trap','bomb','mine'], CREAT=['summon','sentry','machine','hero'];
function dealRun(lean,rng){ const pick=a=>a[Math.floor(rng()*a.length)];
  const pool=CARD_LIST.filter(c=>c.rank<=6&&!c.brood&&!c.recipe&&!c.mastery&&c.type!=='claim'&&!isDeckTool(c));
  const out=[], add=(list,n,cap)=>{ let guard=0; while(n>0&&list.length&&guard++<5000){ const c=pick(list); if(out.filter(x=>x===c.id).length>=cap) continue; out.push(c.id); n--; } };
  add(pool.filter(c=>c.color===lean&&c.rarity==='common'),20,3); add(pool.filter(c=>c.color===lean&&c.rarity==='uncommon'),10,2);
  add(pool.filter(c=>c.rarity==='common'),22,3); add(pool.filter(c=>c.rarity==='uncommon'),8,2);
  add(pool.filter(c=>c.rarity==='rare'&&(rng()<.5?c.color===lean:true)),rng()<.5?1:2,1);
  const h=heroOfColor(lean); if(h) out.push(h); return out; }
function cardScore(c,style,R,lean){ let v=cardVal(c); const k=kindOf2(c), atk=ATTACK.includes(k);
  if(isInstant(c)) v*=.8;
  if(c.rarity==='hero') v*=3;
  if(style==='fast'){ v*=atk?1.35:CREAT.includes(k)?.8:.35; }
  else if(style==='combo'){ v*=(c.code===R||c.code===WILD_RUNE?2.4:.45)*(c.color===lean?1.2:1); }
  else { v*=c.color===lean?1.15:NEUTRAL.includes(c.color)?1:.9; }
  return v; }
// the rune a combo player builds around: the most total value among the cards they own
function bestRune(owned,lean){ const sum={}; for(const id in owned){ const c=CARDS[id]; if(!c||!c.code||c.code===WILD_RUNE) continue; sum[c.code]=(sum[c.code]||0)+cardVal(c)*Math.min(owned[id],4)*(c.color===lean?1.3:1); }
  return Object.keys(sum).sort((a,b)=>sum[b]-sum[a])[0]; }
function buildDeck(style,save,lean){ const owned=save.owned, size={average:60,good:50,fast:45,combo:45}[style], R=style==='combo'?bestRune(owned,lean):null;
  const copies=[]; for(const id in owned){ const c=CARDS[id]; if(!c||c.recipe||c.mastery||c.type==='claim') continue; const n=Math.min(owned[id],copyLimit(c)); for(let i=0;i<n;i++) copies.push({id,c,s:cardScore(c,style,R,lean)*(1-.03*i)}); }
  copies.sort((a,b)=>b.s-a.s);
  const cap={good:{ward:6,boon:7,creat:14,instant:6},average:{ward:9,boon:9,creat:16,instant:8},fast:{ward:2,boon:3,creat:8,instant:4},combo:{ward:8,boon:8,creat:14,instant:6}}[style], n={ward:0,boon:0,creat:0,instant:0,hero:0}, list=[];
  for(const x of copies){ if(list.length>=size) break; const k=kindOf2(x.c), g=isInstant(x.c)?'instant':k==='ward'?'ward':k==='boon'?'boon':CREAT.includes(k)?'creat':null;
    if(x.c.rarity==='hero'){ if(n.hero>=RULES.heroes) continue; n.hero++; }
    if(g&&n[g]>=cap[g]) continue; if(g) n[g]++; list.push(x.id); }
  for(const x of copies){ if(list.length>=RULES.min) break; if(list.filter(i=>i===x.id).length<Math.min(owned[x.id],copyLimit(x.c))&&!(x.c.rarity==='hero'&&n.hero>=RULES.heroes)) list.push(x.id); }
  return {list,R}; }
// an average player keeps their deck and now and then swaps a weak card for a new one
function tweakDeck(save,lean,newIds,rng){ const list=save.decks[0].list.filter(id=>CARDS[id]);
  const cnt={}; list.forEach(id=>cnt[id]=(cnt[id]||0)+1); for(const id in cnt) while(cnt[id]>(save.owned[id]||0)){ list.splice(list.lastIndexOf(id),1); cnt[id]--; }   // cards burned up
  for(const id of newIds){ if(rng()>.6) continue; const c=CARDS[id]; if(!c||c.rarity==='hero'||(cnt[id]||0)>=Math.min(save.owned[id],copyLimit(c))) continue;
    const sc=x=>cardScore(CARDS[x],'average',null,lean), weak=list.filter(x=>CARDS[x].rarity!=='hero').sort((a,b)=>sc(a)-sc(b))[0];
    if(list.length<RULES.max){ list.push(id); cnt[id]=(cnt[id]||0)+1; }
    else if(weak&&sc(id)>sc(weak)*1.15){ list.splice(list.indexOf(weak),1); cnt[weak]--; list.push(id); cnt[id]=(cnt[id]||0)+1; } }
  if(list.length<RULES.min) return buildDeck('average',save,lean).list; return list; }
const STAT_PLAN={average:['con','int','str','dex'], good:['int','con','cst','int','con','rch'], fast:['str','int','rch','str','int','cst'], combo:['int','cst','con','int','cst','rch']};
function spendAll(ch,style){ const plan=STAT_PLAN[style]; let i=0, guard=0; while(pointsLeft(ch)>0&&guard++<200){ spendPoint(ch,plan[i%plan.length],1); i++; } }
function wearBetter(save,ids){ for(const g of ids){ const G=GEAR[g]; if(!G) continue; const st=gearState(save), slots=G.slot==='ring'?['ring1','ring2']:[G.slot];
  for(const sl of slots){ const cur=st.gear[sl]; if(!cur||(GEAR[cur]&&GEAR[cur].tier<(G.tier||0))){ const r=equip(save,sl,g); if(r&&r.ok) break; } } } }
function deckInfo(list){ const by=(f)=>{ const m={}; list.forEach(id=>{ const k=f(CARDS[id]); m[k]=(m[k]||0)+1; }); return m; };
  const runes=by(c=>c.code||'-'), top=Math.max(...Object.values(runes)); return {n:list.length, kinds:by(c=>isInstant(c)?'instant':kindOf2(c)), colors:by(c=>c.color), rarity:by(c=>c.rarity), topRune:top, avgVal:Math.round(list.reduce((a,id)=>a+cardVal(CARDS[id]),0)/list.length)}; }
PT.run={dealRun,buildDeck,tweakDeck,spendAll,wearBetter,deckInfo,cardScore,STAT_PLAN};   // for crawl.js
PT.runRun=function(cfg){
  let seed=(cfg.seed||1)>>>0; const rng=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  const style=cfg.style, lean=cfg.lean;
  // the character: a human, the creation points spent the bot's way
  const ch=newChar('human',0); spendAll(ch,style);
  const ids=dealRun(lean,rng), owned={}; ids.forEach(id=>owned[id]=(owned[id]||0)+1);
  save={v:1, gold:100, depth:1, deepest:1, owned, seen:Object.assign({},owned), decks:[{name:'run',list:[]}], active:0, wins:0, items:{basic_wand:1}, gear:{weapon:'basic_wand'}, heroCards:1, lean, char:lockChar(ch), level:1, xp:0};
  const startInfo=deckInfo(ids);
  let spent=0, packs=0; const fights=[], log=[]; let depth=1, lossesHere=0, lastNew=[];
  const rebuild=()=>{ if(cfg.noCards&&save.decks[0].list.length){ const l=save.decks[0].list, c={}; let bad=false; l.forEach(id=>{ c[id]=(c[id]||0)+1; if(c[id]>(save.owned[id]||0)) bad=true; }); if(!bad) return; }
    if(style==='average'&&save.decks[0].list.length) save.decks[0].list=tweakDeck(save,lean,lastNew,rng); else { const d=buildDeck(style,save,lean); save.decks[0].list=d.list; } 
    const v=validateDeck(save.decks[0].list,CARDS,save.owned); if(!v.ok){ save.decks[0].list=buildDeck('good',save,lean).list; } };
  if(style==='average') save.decks[0].list=buildDeck('average',save,lean).list;
  rebuild();
  const firstDeck=deckInfo(save.decks[0].list);
  while(fights.length<cfg.maxFights&&depth<=cfg.maxDepth){
    const r=PT.runFight({depth, botName:style, bot:cfg.bot, maxT:[4,8,12,16,20,24,28].includes(depth)?900:420, seed:(cfg.seed||1)*131+fights.length});
    const b=PT.lastB; if(!b||r.error){ log.push('fight failed at '+depth+': '+(r.error||'')); break; }
    try{ settleChargeUses(save,b.piles); }catch(e){}
    const f={depth, res:r.res, time:r.time, hpLost:r.dmgTaken, dmg:r.dmg, casts:r.casts, wand:r.wandShots, combos:r.combos, flicks:r.flicks, stick:r.stickSecs, level:save.level, deck:save.decks[0].list.length, errors:r.errors.length+(r.pageErrors?r.pageErrors.length:0), hurtBy:r.hurtBy, warn:r.warn, list:save.decks[0].list.slice()};
    fights.push(f);
    if(r.res==='win'){
      const boss=b.enemies.some(e=>e.def.boss), mini=b.enemies.some(e=>e.def.mini);
      const rw=battleRewards(b.enemies.filter(e=>!e.def.minion).map(e=>e.def.outlaw?e.weak:e.color),depth,boss,rng,save.owned);
      save.gold+=rw.gold||0; save.wins++; save.deepest=Math.max(save.deepest,depth+1);
      const xp=Math.round(fightXp(b.enemies.map(e=>({minion:e.def.minion,boss:e.def.boss,mini:e.def.mini})),depth)*(typeof xpScale==='function'?xpScale(save.level,depth):1)), up=gainXp(save,xp); if(up&&!cfg.noStats) spendAll(save.char,style);
      const gotGear=[]; for(const k of rw.items){ try{ addLoot(save,k,rng); if(GEAR[k]) gotGear.push(k); }catch(e){} } if(!cfg.noGear) wearBetter(save,gotGear);
      let cards=rw.cards.slice(); if(rng()<(boss?.4:mini?.2:0)) cards=cards.concat(openPack(Math.max(depth,save.deepest),packFor(depth),rng));
      // camp: the shop. Careful players keep a reserve and buy at most one pack; a shopaholic spends it all
      const buy=fam=>{ const pr=packPrice(!!fam,save.deepest); if(save.gold<pr) return false; save.gold-=pr; const got=openPack(save.deepest,fam,rng); cards=cards.concat(got); spent+=pr; packs++; return true; };
      if(cfg.shopaholic){ while(save.gold>=packPrice(false,save.deepest)){ if(!buy(rng()<.7&&save.gold>=packPrice(true,save.deepest)?lean:null)) break; } }
      else { const reserve=200+10*depth; if(save.gold-packPrice(true,save.deepest)>=reserve) buy(lean); else if(style==='average'&&save.gold-packPrice(false,save.deepest)>=reserve) buy(null); }
      addCards(save,cards); lastNew=cards.map(c=>c.id);
      depth++; lossesHere=0;
    } else { save.gold-=Math.floor(save.gold*.2); lossesHere++; lastNew=[]; if(lossesHere>=3){ log.push('stuck at depth '+depth); break; } }
    rebuild();
  }
  const finalDeck=deckInfo(save.decks[0].list), gear=gearState(save).gear;
  const ch2=save.char, mods=statMods(ch2);
  return {label:cfg.label||style, variant:cfg.variant||'full', stats:Object.fromEntries(STAT_KEYS.map(k=>[k,statOf(ch2,k)])), style, lean, seed:cfg.seed, deepest:depth-(fights.length&&fights[fights.length-1].res==='win'?0:0), reached:depth, fights, wins:fights.filter(f=>f.res==='win').length, losses:fights.filter(f=>f.res!=='win').length,
    level:save.level, gold:save.gold, spent, packs, levelAt:{10:(fights.find(f=>f.depth===10)||{}).level, 20:(fights.find(f=>f.depth===20)||{}).level, 30:(fights.find(f=>f.depth===30)||{}).level, 40:(fights.find(f=>f.depth===40)||{}).level}, owned:Object.values(save.owned).reduce((a,b)=>a+b,0), startInfo, firstDeck, finalDeck, names:Object.fromEntries([...new Set(fights.flatMap(f=>f.list||[]))].map(id=>[id,CARDS[id]?CARDS[id].name:id])), gear:Object.fromEntries(Object.entries(gear).map(([k,v])=>[k,v&&GEAR[v]?GEAR[v].tier:null])), log};
};
})();

