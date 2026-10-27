/* ---------------- enemy tactics: aggression ----------------
   An enemy's aggression (e.aggr, 0 to 1) is how much it reads you instead of only aiming where you stand:
   - Lead: on the move, its attack lands where you are heading, not where you were.
   - Crossfire: with another enemy's attack already on you, it covers the tile you would step out to.
   - Follow-up: dodge one of its attacks close by and it snaps a quick, weaker one onto you (0.55 s warning).
   - Footwork: it steps into your row to get a shot, and out of the way of your shots and your charged wand.
   - Pressure: it attacks more often, more still while you stand about, and once badly hurt it gets angry.
   0 is the old, simple foe. In the dungeon it grows with depth (foeAggrAt); bosses and minibosses keep their own
   scripts (0). The Enemy lab sets it per enemy and depth stage (enemylab.js). */
const foeAggrAt=d=>Math.round(Math.min(.85,.15+.06*(Math.max(1,d)-1))*100)/100;
const aggrOf=e=>e&&e.aggr>0?Math.min(1,e.aggr):0;
const FOLLOW_WARN=.55, FOLLOW_DMG=.6;
const pTileOk=t=>t&&t.side==='p'&&!(t.holeT>0)&&(!t.occ||t.occ.kind==='player');
// where you will be in s seconds if you keep on as you are: your slide, or the next tile of a tapped path (2 tiles at most)
function foeLead(s){ const p=B.player, v=Math.hypot(p.vx||0,p.vz||0);
  if(v>.3&&p.fx!=null){ const sp=Math.min(...neighbors(p.tile).map(n=>Math.hypot(n.wx-p.tile.wx,n.wz-p.tile.wz))), k=Math.min(s,2*sp/v);
    const t=nearestTile(p.fx+p.vx*k,p.fz+p.vz*k); return pTileOk(t)?t:p.tile; }
  const n=p.path&&p.path.find(t=>t!==p.tile); return pTileOk(n)?n:p.tile; }
const foeMoving=()=>{ const p=B.player; return Math.hypot(p.vx||0,p.vz||0)>.3||!!(p.path&&p.path.some(t=>t!==p.tile)); };
// tiles already under someone's warning
const foeCovered=t=>B.teles.some(tl=>!tl.friendly&&tl.tiles.includes(t));
/* Where an attack aims (enemies.js aimT), or null for where you stand. A Taunt creature still draws it first. */
function foeAimSmart(e){ const a=aggrOf(e), p=B.player; if(!a||!p) return null;
  // crossfire: someone else has you covered, so take away the way out (the tile you are heading for, if it's open)
  if(B.teles.some(tl=>!tl.friendly&&tl.owner!==e&&tl.tiles.includes(p.tile))&&Math.random()<a){
    const outs=neighbors(p.tile).filter(t=>pTileOk(t)&&!foeCovered(t)); if(outs.length){ const L=foeLead(.35); return outs.includes(L)?L:pick(outs); } }
  if(foeMoving()&&Math.random()<a*.85) return foeLead(.35);
  return null; }
/* Follow-up: a warning of its ran out on tiles you had just left (you are within two steps): a quick strike
   on you and, the more aggressive, the tile you are heading for. Not from a follow-up, and not twice in 2.5 s. */
function foeFollow(tl){ const e=tl.owner, a=aggrOf(e), p=B.player;
  if(!a||tl.follow||!e||e.hp<=0||e.under||!p||tl.tiles.includes(p.tile)||(e.followT||0)>B.time) return;
  if(!tl.tiles.some(t=>hexDist(t,p.tile)<=2)||Math.random()>a*.7) return;
  e.followT=B.time+2.5; const ts=[p.tile]; if(a>=.5){ const L=foeLead(.3); if(L!==p.tile) ts.push(L); }
  later(.12,()=>{ if(e.hp<=0||!B||B.phase!=='fight') return; floater('!',e.tile,'#ff4a5a');
    B.teles.push({tiles:ts,t:0,dur:FOLLOW_WARN,dmg:Math.max(1,Math.round(e.dmg*FOLLOW_DMG)),owner:e,kind:'snap',follow:true}); }); }
/* Footwork, before its usual step (enemies.js moveEnemy): out of the line of your shots or a charged wand, else
   into your row. null: walk as it always has. */
function foeStep(e,opts,a){ const p=B.player, inRow=t=>t.r===p.tile.r;
  const threat=foeShotAt(e)||p.charging&&inRow(e.tile);
  if(threat&&Math.random()<a){ const off=opts.filter(t=>t.r!==e.tile.r); if(off.length) return pick(off); }
  if(e.def.ai!=='back'&&!inRow(e.tile)&&!threat&&Math.random()<a*.6){ const d=Math.sign(p.tile.r-e.tile.r), to=opts.filter(t=>Math.sign(t.r-e.tile.r)===d);
    if(to.length) return pick(to); }
  return null; }
// one of your shots on its way down a line through this enemy
const foeShotAt=e=>B.shots.some(s=>s.from==='p'&&s.tiles&&s.tiles.indexOf(e.tile)>s.i);
/* Every frame (enemies.js updateEnemy): side-steps a shot it sees coming, keeps count of how long you have stood,
   and gets angry once below 40% HP. Returns how fast its attack timer runs. */
function foeTick(e,dt){ const a=aggrOf(e), p=B.player; if(!a||!p) return 1;
  if(p.fmov||(p.path&&p.path.length)) B.pMovedT=B.time;
  if(foeShotAt(e)&&(e.evadeT||0)<B.time&&e.def.ai!=='still'&&!e.under&&!B.teles.some(t=>t.owner===e)){ e.evadeT=B.time+1.4/a;
    if(Math.random()<a) moveEnemy(e); }
  if(!e.enraged&&e.hp<e.maxHp*.4&&a>=.3){ e.enraged=true; floater('Enraged!',e.tile,'#ff4a5a',true); burst(e.tile,'#ff4a5a',16,.8); }
  const idle=B.time-(B.pMovedT??B.time)>1.5;
  return 1+.35*a+(idle?.5*a:0)+(e.enraged?.3*a:0); }
