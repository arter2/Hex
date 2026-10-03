// Runs inside the game context. Bots approximate players of different skill.
var STATS=null;
const _hitEnemy=hitEnemy, _hitPlayer=hitPlayer;
hitEnemy=function(e,base,card,opts){ const before=e&&e.hp>0?e.hp:0; const d=_hitEnemy(e,base,card,opts);
  if(STATS&&d){ const src=opts&&opts.raw?'dot':!card||card.id==='wand'?'wand':(card.recipe?'recipe':card.type==='piece'?card.base:card.type); STATS.dmg[src]=(STATS.dmg[src]||0)+Math.min(before,d); }
  return d; };
hitPlayer=function(dmg){ const p=B.player, hp=p.hp; _hitPlayer(dmg); if(STATS){ STATS.taken+=hp-p.hp; if(hp>p.hp) STATS.hits++; } };
function cardScore(c,es){ const col=es.some(e=>BEATS[c.color]===e.color)?1.75:1, k=c.type==='piece'?c.base:c.type, n=es.length;
  switch(k){ case 'strike': return (c.shape==='all'?c.pow*n:c.shape==='missiles'?c.pow*c.n:c.shape==='row'?c.pow*1.3:c.pow)*col+(c.freeze||c.stun?20:0);
    case 'lob': return c.pow*1.3*col; case 'charge': return c.pow*c.uses*.6*col; case 'sentry': return (c.pow||5)*8*col; case 'summon': return 60; case 'machine': return 60; case 'hero': return 300;
    case 'ward': return (c.amt||c.hp*(c.n||1))*.5; case 'boon': return c.boon==='heal'?(B.player.maxHp-B.player.hp>30?c.amt:5):45; case 'trap': return c.pow*.7; case 'environment': return 50; }
  return 25; }
function subsets(a,k){ const out=[]; const rec=(i,cur)=>{ if(cur.length===k){ out.push(cur.slice()); return; } for(let j=i;j<a.length;j++){ cur.push(a[j]); rec(j+1,cur); cur.pop(); } }; rec(0,[]); return out; }
// pick what to queue
function pickCards(skill){ const p=B.piles; STATS.customs++; const es=alive(), slots=slotsOf(p);
  if(slots>3) STATS.surges++;
  if(skill.pick==='first'){ for(const c of p.hand.slice()){ if(p.queue.length>=slots) break; if(toggleQueue(p,c.uid)) {} else STATS.runeBlocks++; } }
  else { let best=null, bs=-1; const hand=p.hand.slice(0,12);
    for(let k=Math.min(slots,hand.length);k>=1;k--) for(const sub of subsets(hand,k)){ if(!runesFit(sub.map(c=>c.card))) continue;
      const cb=detectCombos(sub); let sc=sub.reduce((a,c)=>a+cardScore(c.card,es),0)*(1+.25*cb.length)+(cb.some(x=>x.kind==='recipe')?400:0);
      if(sc>bs){ bs=sc; best=sub; } }
    if(best) best.forEach(c=>toggleQueue(p,c.uid)); }
  STATS.queued+=p.queue.length; const cb=detectCombos(p.queue); cb.forEach(x=>STATS.combos[x.kind]=(STATS.combos[x.kind]||0)+1);
  closeCustomScreen(); }
// skill: wandRate, dodge, react, align, pick, smartCast, charge
function playBattle(list,depth,skill,capSec,gear){
  STATS={dmg:{},taken:0,hits:0,cast:0,customs:0,queued:0,surges:0,runeBlocks:0,combos:{},backTime:0,outOfReach:0,enemyT:0,castTypes:{}};
  let t=0, wandT=0, reactT=0; const dt=1/30;
  startBattle(list,depth,{onEnd:()=>{}},{gear:gear||{},look:null});
  pickCards(skill);
  while(t<capSec&&(B.phase==='fight'||B.phase==='custom')){
    if(B.phase==='custom'){ pickCards(skill); continue; }
    const p=B.player, es=alive();
    // how often enemies sit in the back two columns, and out of reach of the weapon
    for(const e of es){ STATS.enemyT+=dt; if(e.tile.col>=BOARD_COLS-2) STATS.backTime+=dt; }
    reactT-=dt;
    if(reactT<=0){ reactT=skill.react;
      const danger=new Set(); B.teles.filter(x=>!x.friendly).forEach(x=>x.tiles.forEach(tt=>danger.add(tt)));
      es.filter(e=>e.windT>0).forEach(e=>lineTiles(e.tile,DIRS.W).forEach(tt=>danger.add(tt)));
      B.shots.filter(s=>s.from==='e').forEach(s=>s.tiles.slice(Math.max(0,s.i)).forEach(tt=>danger.add(tt)));
      if(danger.has(p.tile)&&Math.random()<skill.dodge){ const safe=P_TILES.filter(tt=>!tt.occ&&!danger.has(tt)).sort((a,b)=>hexDist(p.tile,a)-hexDist(p.tile,b))[0]; if(safe) moveTo(safe); }
      else if(skill.align&&es.length&&!p.path.length){ // experts follow the boss tip: break healers first, then the boss; others pick the weakest
        const heals=e=>e.def.moves.some(m=>m==='mend'||m==='mendboss'), rank=e=>skill.smartCast?(heals(e)?0:e.def.boss?1:2):0;
        const tgt=es.slice().sort((a,b)=>rank(a)-rank(b)||a.hp-b.hp)[0];
        if(tgt.tile.r!==p.tile.r){ const tt=P_TILES.filter(x=>x.r===tgt.tile.r&&!x.occ&&!danger.has(x)).sort((a,b)=>(skill.closeIn?b.x-a.x:0))[0]; if(tt) moveTo(tt); }
        else if(skill.closeIn){ const fwd=P_TILES.filter(x=>x.r===p.tile.r&&!x.occ&&!danger.has(x)).sort((a,b)=>b.x-a.x)[0]; if(fwd&&fwd!==p.tile) moveTo(fwd); } }
    }
    // reach: is any enemy in this row within the weapon's range?
    const reach=p.wand.kind==='spear'?6:99, inRow=es.filter(e=>e.tile.r===p.tile.r);
    if(inRow.length&&!inRow.some(e=>e.tile.col-p.tile.col<=reach)) STATS.outOfReach+=dt;
    const next=B.piles.queue[0];
    if(next&&p.castCd<=0){ let go=true;
      if(skill.smartCast){ const k=next.card.type==='piece'?next.card.base:next.card.type; if((k==='strike'&&!['all','missiles'].includes(next.card.shape)||(k==='charge'&&next.card.fx==='bolt'))&&!inRow.length) go=false; }
      if(go){ const k=next.card.type; STATS.castTypes[k]=(STATS.castTypes[k]||0)+1; castCard(); STATS.cast++; } }
    wandT-=dt;
    if(skill.charge&&inRow.length&&!p.charging&&wandT<=0){ wandDown(); }
    if(p.charging&&p.chargeT>=chargeNeed(p)){ wandUp(); wandT=.2; }
    else if(!skill.charge&&wandT<=0&&(!skill.align||inRow.length)){ fireWand(false); wandT=1/skill.wandRate; }
    if(B.phase==='fight'&&gaugeFull()&&!wandOnly(B.piles)&&!B.piles.queue.length) openCustomScreen();
    update(dt); t+=dt;
  }
  for(let i=0;i<60&&B.phase==='fight';i++) update(dt);
  return {win:B.phase==='win', time:t, hp:B.player.hp, maxHp:B.player.maxHp, timeout:t>=capSec, stats:STATS, turns:B.turn+1, enemies:B.enemies.length};
}
