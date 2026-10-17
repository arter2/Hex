/* ---------------- The other kinds of card on the new rules (card rules plan, step 2) ----------------
   Like creatures (creatures.js) and strikes (strikes.js), every lob, ward, boon, charge, trap and
   ground card is built from parts; two cards of one colour must differ in at least 2 of them.
     lob          pattern · fuse · keyword · aftermath
     ward         form · build · wall effect · how long
     boon         what it does · how long · colour side effect · timing
     charge       shot · uses · keyword · edge
     trap         kind · keyword · how long · size
     environment  ground · pattern · how long · keyword
   And two parts more for the older kinds, so every card can be told apart:
     strike       + cast (quick, normal or charged)
     Gray creature + stance (front line, rear guard or escort) */

// how long a card lasts, for wards, boons, traps and ground: [time ×, strength ×]
const KD_LEN={short:{name:'Brief', t:.6, k:1.25}, normal:{name:'', t:1, k:1}, long:{name:'Lasting', t:1.6, k:.8}};

/* ---------- lobs ---------- */
const KD_FUSE={quick:{name:'Quick fuse', dur:.35, k:.85}, normal:{name:'', dur:.6, k:1}, heavy:{name:'Heavy', dur:1, k:1.3}};
const KD_AFTER={none:{name:'', text:''}, ground:{name:'Scorches', text:'leaves its colour\'s ground there for 4 seconds'}, knock:{name:'Knocks back', text:'knocks what it hits back a tile'}};
const KD_PATTERNS=['single','burst','cross','column','ring','row'];

/* ---------- wards ---------- */
const KD_FORMS={line:'up your lane', arc:'in a half-ring around you', rampart:'across the lanes in front of you', corridor:'up the lanes on both sides of you', cage:'around the enemy you aim', shield:'as a shield on you'};
const KD_BUILD={light:{name:'Light', n:1, hp:.7}, normal:{name:'', n:0, hp:1}, heavy:{name:'Heavy', n:-1, hp:1.6}};
// what the walls (or the shield) do to whatever hits them, by colour
const KD_WALL_FX={
  thorns:  {name:'Thorns',   text:'hit back for {v}'},
  burning: {name:'Burning',  text:'set whatever hits them burning'},
  freezing:{name:'Freezing', text:'freeze whatever hits them for a moment'},
  shocking:{name:'Shocking', text:'stun whatever hits them for a moment'},
  healing: {name:'Healing',  text:'heal you {v} a second while they stand'},
  draining:{name:'Draining', text:'heal you {v} each time they are hit'},
  steady:  {name:'Steady',   text:'no single hit takes more than a fifth of their HP'},
};
const KD_WALL_FX_OF={fire:['thorns','burning'], frost:['freezing','thorns'], storm:['shocking','thorns'], verdant:['thorns','healing'],
  light:['healing','steady'], shadow:['draining','thorns'], gray:['steady','thorns'], brown:['steady','shocking']};

/* ---------- boons ---------- */
// a small extra each colour's boons can carry
const KD_SIDE={
  scorch:  {color:'fire',    name:'Scorch',      text:'costs 4 HP, and the boon is 25% stronger'},
  embers:  {color:'fire',    name:'Embers',      text:'sets enemies within 2 tiles of you burning'},
  chill:   {color:'frost',   name:'Chill',       text:'slows enemies within 2 tiles of you for 2 seconds'},
  rime:    {color:'frost',   name:'Rime armour', text:'and a shield of {v}'},
  spark:   {color:'storm',   name:'Spark',       text:'and fills 10% of the Spell gauge'},
  jolt:    {color:'storm',   name:'Jolt',        text:'and stuns the nearest enemy for a moment'},
  sprout:  {color:'verdant', name:'Sprout',      text:'and heals 1 a second for 6 seconds'},
  cleanse: {color:'verdant', name:'Cleanse',     text:'and frees you from roots, hexes and slows'},
  glow:    {color:'light',   name:'Glow',        text:'and heals {v}'},
  radiance:{color:'light',   name:'Radiance',    text:'and a shield of {v}'},
  blood:   {color:'shadow',  name:'Blood price', text:'costs 6 HP, and the boon is 30% stronger'},
  siphon:  {color:'shadow',  name:'Siphon',      text:'and drains {v} from the nearest enemy'},
  rally:   {color:'gray',    name:'Rally',       text:'and your creatures deal +20% for 6 seconds'},
  muster:  {color:'gray',    name:'Muster',      text:'and heals your creatures 15%'},
  wound:   {color:'brown',   name:'Wound up',    text:'and fills 8% of the Spell gauge'},
  parts:   {color:'brown',   name:'Spare parts', text:'and repairs your machines and walls 15%'},
};
const kdSidesOf=col=>Object.keys(KD_SIDE).filter(k=>KD_SIDE[k].color===col);
// when a boon lands: now; again at half strength 5 s later (Echo); or 2 s late but 30% stronger (Delayed)
const KD_TIMING={now:{name:'', text:''}, echo:{name:'Echo', text:'it happens again at half strength 5 seconds later'}, delayed:{name:'Delayed', text:'it lands 2 seconds after you cast, 30% stronger'}};
const KD_BOONS=['power','pact','haste','dodge','phase','regen','heal','gauge','courage','intervene'];
const KD_TIMED=['power','pact','haste','phase','regen','courage'];

/* ---------- charges ---------- */
const KD_SHOT={bolt:'bolt of {pow} down your row', twin:'bolts of {pow} down your row and the next', lob:'lob of {pow} on the tile you aim', burst:'lob of {pow} that splashes around where it lands'};
const KD_USES={few:{name:'Few', u:.5, k:1.5}, normal:{name:'', u:1, k:1}, many:{name:'Many', u:1.7, k:.7}};
const KD_EDGE={none:'', pierce:'Pierce: its bolts go through one more enemy, and through walls, rocks and shields', crit:'Crit: 1 use in 4 deals double', splash:'Splash: also hits around what it hits for half'};

/* ---------- traps ---------- */
const KD_TRAPS=['spike','snare','blast','shock','zombie','pendulum'];
// traps that belong to one colour (others take them only when weighted in)
const KD_TRAP_HOME={shock:'storm', zombie:'shadow', pendulum:'brown'};
/* how far a trap reaches: the shock field around a caught enemy, or the line a pendulum swings down.
   k: strength (a wider field zaps softer) */
const KD_SPREAD={
  single:{name:'Single', text:'the tiles either side of it in its row', k:1,   of:'shock'},
  plus:  {name:'Plus',   text:'a + around it',                           k:.8,  of:'shock'},
  ring:  {name:'Circle', text:'all 6 tiles around it',                   k:.65, of:'shock'},
  row:   {name:'Row',    text:'across its row',                          k:1,   of:'pendulum'},
  column:{name:'Column', text:'down its column',                         k:.9,  of:'pendulum'},
};
const KD_SPREAD_OF=t=>Object.keys(KD_SPREAD).filter(k=>KD_SPREAD[k].of===t);
const KD_SIZE={one:{name:'', n:1, k:1}, three:{name:'Triple', n:3, k:.55}};

/* ---------- ground ---------- */
const KD_ENVS=['burn','freeze','bramble','tremor'];
const KD_ENV_PAT=['burst','cross','column','row'];

/* ---------- strikes and Gray creatures ---------- */
const KD_CAST={quick:{name:'Quick', text:'casts in a flash: your next card comes sooner', k:.85}, normal:{name:'', text:'', k:1}, charged:{name:'Charged', text:'charges for half a second first, then hits harder', k:1.35}};
const KD_STANCE={front:{name:'Front line', text:'stands at the front of your side and takes 20% less damage'},
  rear:{name:'Rear guard', text:'stands at the back of your side and deals +20%'},
  escort:{name:'Escort', text:'keeps to your row, moving with you'}};

/* ---------------- building the cards ----------------
   kdBuild(c,parts) sets a card's numbers from its parts. c keeps its id, name, colour, type, rank,
   rarity and rune; the parts are an array in the order listed at the top. */
// what a card plays as: an instant plays as its `as`, a Legendary piece as its `base`
const kdBase=c=>c.type==='instant'?c.as:c.type==='piece'?c.base:c.type;
// power: an instant's attack is a little weaker (it costs no slot), a Legendary piece's stronger
const kdF=c=>(1+.06*(c.rank-1))*RARITY_MULT[c.rarity]*(c.type==='instant'&&['strike','lob'].includes(c.as)?.8:1)*(c.type==='piece'?1.2:1);
const kdNoKw=c=>{ for(const k of ['burn','freeze','stun','slow','poison','curse','drain','mend','valor','push','pull','confuse','self']) delete c[k]; };
const KD_BUILDERS={
  lob(c,[pattern,fuse,kw,after]){ const F=kdF(c); c.pattern=pattern||'single'; c.fuse=fuse||'normal'; c.after=after||'none';
    const k=applyKw(c,kw,c.rank); c.pow=Math.round(32*F*PATTERN_MULT[c.pattern]*k*KD_FUSE[c.fuse].k*(c.after==='none'?1:.85)); c.delay=KD_FUSE[c.fuse].dur; },
  ward(c,[form,build,fx,len]){ const F=kdF(c), B0=KD_BUILD[build||'normal'], L=KD_LEN[len||'normal']; c.form=form||'line'; c.build=build||'normal'; c.len=len||'normal';
    if(fx) c.wfx=fx; c.turns=+((c.form==='cage'?.4:2)*L.t).toFixed(1);
    const fxK=fx?.85:1;
    if(c.form==='shield'){ c.ward='barrier'; c.amt=Math.round(45*F*B0.hp*L.k*fxK); }
    else { c.ward=fx==='thorns'?'thorns':'wall'; c.n=Math.max(1,2+(c.rank>6?1:0)+B0.n); if(c.form==='cage') c.n=6; c.hp=Math.round(35*F*B0.hp*L.k*fxK*(c.form==='cage'?.6:1)); }
    if(fx==='thorns') c.thorns=Math.round(6*F); if(fx==='healing') c.wheal=+(.3+c.rank*.03).toFixed(2); if(fx==='draining') c.wdrain=2+Math.round(c.rank/3);
    if(c.form==='line') delete c.form; },
  boon(c,[boon,len,side,timing]){ const F=kdF(c), L=KD_LEN[len||'normal']; c.boon=boon; c.len=len||'normal'; if(side) c.side=side; c.timing=timing||'now';
    BUILD.boon(c,F,c.rank,null,{},x=>x[0]); delete c.self;
    const k=(side==='scorch'?1.25:side==='blood'?1.3:1)*(side&&!['scorch','blood'].includes(side)?.85:1)*(c.timing==='echo'?.75:c.timing==='delayed'?1.3:1);
    if(c.dur) c.dur=Math.max(1,Math.round(c.dur*L.t*(KD_TIMED.includes(boon)?k:1)));
    if(c.amt&&c.boon!=='gauge') c.amt=Math.round(c.amt*(KD_TIMED.includes(boon)?L.k:1)*k); if(c.boon==='gauge') c.amt=r1(Math.min(.95,c.amt*k));
    if(c.boon==='pact') c.self=10+c.rank;
    if(side==='rime'||side==='radiance') c.sideV=Math.round(10*F); if(side==='glow') c.sideV=Math.round(8*F); if(side==='siphon') c.sideV=Math.round(8*F); },
  charge(c,[shot,uses,kw,edge]){ const F=kdF(c), U=KD_USES[uses||'normal']; c.fx=shot||'bolt'; c.usesK=uses||'normal'; if(edge&&edge!=='none') c.edge=edge;
    const base={common:4,uncommon:6,rare:10,legendary:15}[c.rarity]; c.uses=Math.max(2,Math.round(base*U.u));
    const k=applyKw(c,kw,c.rank); c.pow=Math.max(3,Math.round(16*F*k*U.k/Math.sqrt(base/3)*(c.fx==='twin'||c.fx==='burst'?.65:1)*(c.edge?.85:1))); },
  trap(c,[trap,kw,len,size,spread]){ const F=kdF(c), L=KD_LEN[len||'normal'], S=KD_SIZE[size||'one']; c.trap=trap||'spike'; c.len=len||'normal'; c.size=size||'one';
    const sp=KD_SPREAD_OF(c.trap); if(sp.length) c.spread=sp.includes(spread)?spread:sp[0];
    const k=applyKw(c,kw,c.rank); c.pow=Math.round({spike:38,snare:18,blast:26,shock:16,zombie:10,pendulum:30}[c.trap]*F*k*L.k*S.k*(c.trap==='pendulum'?KD_SPREAD[c.spread].k:1)); if(c.trap==='snare') c.stun=r1(1.5+c.rank*.1);
    // shock: holds the enemy it catches, and zaps any other enemy that comes into the field around it
    if(c.trap==='shock'){ c.hold=r1((2.5+c.rank*.1)*L.k); c.zap=Math.max(3,Math.round(12*F*S.k*KD_SPREAD[c.spread].k)); }
    // zombie: the enemy it catches turns on its own side for a while
    if(c.trap==='zombie') c.infect=r1((4+c.rank*.2)*L.k*S.k);
    c.turns=+(2*L.t).toFixed(1); },
  environment(c,[env,pattern,len,kw]){ const F=kdF(c), L=KD_LEN[len||'normal']; c.env=env||'burn'; c.pattern=pattern||'burst'; c.len=len||'normal'; if(kw) c.envKw=kw;
    if(c.env==='bramble') c.pow=Math.round(8*F*L.k); if(c.env==='tremor'){ c.pow=Math.round(14*F*L.k); c.stun=r1((.8+c.rank*.08)*L.k); }
    else c.turns=+((6+Math.round(c.rank/2)>=10?2:1)*L.t).toFixed(1);
    if(kw) applyKw(c,kw,c.rank); },
};
// the parts a card of this kind has, read back from the card
function kdParts(c){ const T=kdBase(c), kw=['burn','freeze','stun','slow','poison','curse','drain','mend','valor','push','pull','confuse','self'].find(k=>c[k]!=null&&!(T==='trap'&&c.trap==='snare'&&k==='stun')&&!(T==='environment'&&k==='stun'))||null;
  switch(T){
    case 'lob': return [c.pattern,c.fuse,kw,c.after];
    case 'ward': return [c.form||'line',c.build,c.wfx||null,c.len];
    case 'boon': return [c.boon,c.len,c.side||null,c.timing||'now'];
    case 'charge': return [c.fx,c.usesK,kw,c.edge||'none'];
    case 'trap': return [c.trap,kw,c.len,c.size,c.spread||null];
    case 'environment': return [c.env,c.pattern,c.len,c.envKw||null]; }
  return null; }

/* ---------------- card text ---------------- */
function kdText(c,kw){ const T=kdBase(c), K=kw&&kw.length?'. '+kw.join(', '):'', cap=s=>s[0].toUpperCase()+s.slice(1), len=c.len&&c.len!=='normal'?KD_LEN[c.len].name+'. ':'';
  switch(T){
    case 'lob': return (c.fuse!=='normal'?KD_FUSE[c.fuse].name+'. ':'')+c.pow+' on the tile you aim'+PATTERN_TEXT[lobPattern(c)]+', over blockers, '+c.delay+'s after you cast'+(c.after&&c.after!=='none'?'. It '+KD_AFTER[c.after].text:'')+K;
    case 'ward': { const fx=c.wfx?KD_WALL_FX[c.wfx]:null, fxT=fx?fx.text.replace('{v}',c.thorns||c.wheal||c.wdrain):'';
      if(c.ward==='barrier') return len+(c.build!=='normal'?KD_BUILD[c.build].name+'. ':'')+'Shield of '+c.amt+' for '+tn(c.turns)+'; replaces your current shield'+(fx?'. '+fx.name+': hits on it '+fxT.replace('whatever hits them','the attacker').replace('while they stand','while it lasts').replace('each time they are hit','each time it is hit').replace('their HP','the shield'):'');
      return len+(c.build!=='normal'?KD_BUILD[c.build].name+'. ':'')+(c.form==='cage'?'Cages the enemy you aim in walls of '+c.hp+' HP: it can\'t move and its shots hit the bars; yours pass through':c.n+' wall'+(c.n>1?'s':'')+' of '+c.hp+' HP '+KD_FORMS[c.form||'line'])+', '+tn(c.turns)+(fx?'. '+fx.name+': they '+fxT:''); }
    case 'boon': { const S=c.side?KD_SIDE[c.side]:null, T=KD_TIMING[c.timing||'now']; return len+cardText(Object.assign({},c,{len:null,side:null,kd:null}))+(S?'. '+S.name+': '+S.text.replace('{v}',c.sideV):'')+(T.name?'. '+T.name+': '+T.text:''); }
    case 'charge': return (c.usesK!=='normal'?KD_USES[c.usesK].name+' uses. ':'')+c.uses+' uses: '+KD_SHOT[c.fx].replace('{pow}',c.pow)+(c.edge?'. '+KD_EDGE[c.edge]:'')+K;
    case 'trap': { const on=c.size==='three'?'the tile you aim or the 2 next to it':'the tile you aim', sp=(KD_SPREAD[c.spread]||{}).text;
      if(c.trap==='shock') return len+(c.size==='three'?'Three shock traps':'Shock trap')+' on '+on+', '+tn(c.turns)+': the enemy that steps on it takes '+c.pow+' and is held in place for '+c.hold+'s, and while it is held any other enemy that comes onto '+sp+' is shocked for '+c.zap+' and stunned'+K;
      if(c.trap==='zombie') return len+(c.size==='three'?'Three zombie traps':'Zombie trap')+' on '+on+', '+tn(c.turns)+': the enemy that steps on it takes '+c.pow+' and is infected for '+c.infect+'s, attacking the other enemies instead of you'+K;
      if(c.trap==='pendulum') return len+(c.size==='three'?'Three pendulum traps':'Pendulum trap')+' on '+on+', '+tn(c.turns)+': when an enemy steps on it a blade swings '+sp+', '+c.pow+' to every enemy in its path; the others can dodge it'+K;
      return len+(c.size==='three'?'Three traps: ':'')+{spike:'Spike trap: '+c.pow, snare:'Snare: '+c.pow+' and roots', blast:'Blast trap: '+c.pow+' to it and around it'}[c.trap]+' when an enemy steps on '+on+'; '+tn(c.turns)+K; }
    case 'environment': return len+{burn:'Sets the ground burning', freeze:'Ices the ground, halving enemy speed,', bramble:'Grows brambles that deal '+c.pow+' per step', tremor:'Tremor deals '+c.pow}[c.env]+AREA_TEXT[c.pattern]+(c.turns?' for '+tn(c.turns):'')+(c.envKw?'; enemies standing there when it appears get the keyword':'')+K; }
  return ''; }
// the extra line a strike's cast or a Gray creature's stance adds
const kdCastText=c=>c.cast&&c.cast!=='normal'?'. '+KD_CAST[c.cast].name+': '+KD_CAST[c.cast].text:'';
const kdStanceText=c=>c.stance?'. '+KD_STANCE[c.stance].name+': '+KD_STANCE[c.stance].text:'';

/* ---------------- in battle ---------------- */
// a lob's aftermath, where it landed
function kdAfter(c,ts){ if(!c.after||c.after==='none') return;
  if(c.after==='knock') ts.forEach(t=>{ const e=t.occ; if(e&&e.kind==='enemy'&&e.hp>0) shove(e,{push:1},c.pow||10); });
  if(c.after==='ground') ts.forEach(t=>{ const g={fire:'burn',frost:'freeze',verdant:'bramble',shadow:'bramble'}[c.color]||'burn';
    t.envT=Math.max(t.envT||0,4); if(g==='burn') t.burnT=1e9; if(g==='freeze') t.iceT=1e9; if(g==='bramble'){ t.thornT=1e9; t.thornPow=Math.max(3,Math.round((c.pow||10)*.15)); t.thornCard=c; } }); }
// a wall (or your shield) with an effect is hit by `src`
function kdWallHit(w,src,dmg){ const fx=w.card&&w.card.wfx; if(!fx||!src||src.kind!=='enemy'||src.hp<=0) return dmg;
  if(fx==='burning') src.burnT=Math.max(src.burnT||0,3);
  if(fx==='freezing'){ src.freezeT=Math.max(src.freezeT||0,.8); typeof cancelAttack==='function'&&cancelAttack(src); }
  if(fx==='shocking'){ src.stunT=Math.max(src.stunT||0,.6); typeof cancelAttack==='function'&&cancelAttack(src); }
  if(fx==='draining') healPlayer(w.card.wdrain);
  if(fx==='steady'&&w.maxHp) dmg=Math.min(dmg,Math.ceil(w.maxHp*.2));
  return dmg; }
// every frame: healing walls and shields
function kdTick(dt){ const p=B.player; let h=0;
  for(const w of B.walls) if(!w.enemy&&w.hp>0&&w.card&&w.card.wfx==='healing') h+=w.card.wheal*dt;
  if(p.barrier>0&&p.barrierCard&&p.barrierCard.wfx==='healing') h+=p.barrierCard.wheal*dt;
  if(h>0){ p.kdHeal=(p.kdHeal||0)+h; if(p.kdHeal>=1){ const n=Math.floor(p.kdHeal); p.kdHeal-=n; if(p.hp<p.maxHp) healPlayer(n,true); } }
  if(p.rallyT>0) p.rallyT-=dt; }
// a boon's colour side effect
function kdSide(c,p){ const s=c.side; if(!s) return; const near=alive().filter(e=>hexDist(e.tile,p.tile)<=2);
  if(s==='scorch') payHp(4); if(s==='blood') payHp(6);
  if(s==='embers') near.forEach(e=>e.burnT=Math.max(e.burnT||0,3));
  if(s==='chill') near.forEach(e=>e.slowT=Math.max(e.slowT||0,2));
  if(s==='rime'||s==='radiance'){ p.barrier=Math.max(p.barrier||0,0)+c.sideV; p.shieldT=Math.max(p.shieldT||0,6); }
  if(s==='spark') B.gauge=Math.min(GAUGE_MAX,B.gauge+.1*GAUGE_MAX); if(s==='wound') B.gauge=Math.min(GAUGE_MAX,B.gauge+.08*GAUGE_MAX);
  if(s==='jolt'){ const e=nearestEnemyTile(p.tile); if(e&&e.occ){ e.occ.stunT=Math.max(e.occ.stunT||0,.8); typeof cancelAttack==='function'&&cancelAttack(e.occ); B.fx.push({kind:'bolt',a:p.tile,b:e,color:'#ffe24d',t:0,life:.2}); } }
  if(s==='sprout'){ p.regenT=Math.max(p.regenT||0,6); p.regenAmt=Math.max(p.regenAmt||0,1); }
  if(s==='cleanse'){ p.rootT=0; p.hexT=0; p.slowT=0; }
  if(s==='glow') healPlayer(c.sideV);
  if(s==='siphon'){ const e=nearestEnemyTile(p.tile); if(e&&e.occ){ hitEnemy(e.occ,c.sideV,null,{raw:true}); healPlayer(c.sideV); } }
  if(s==='rally') p.rallyT=6;
  if(s==='muster') B.allies.filter(a=>!a.enemy&&a.hp>0).forEach(a=>a.hp=Math.min(a.maxHp,a.hp+Math.round(a.maxHp*.15)));
  if(s==='parts') [...B.walls,...B.allies].filter(a=>!a.enemy&&a.hp>0&&(a.kind==='wall'||a.card.type==='machine')).forEach(a=>a.hp=Math.min(a.maxHp,a.hp+Math.round(a.maxHp*.15))); }
// a charge card's shot
function kdCharge(c,p){ const crit=c.edge==='crit'&&Math.random()<.25, pow=c.pow*(crit?2:1), o={card:c,dmg:pow,from:'p',pierce:c.edge==='pierce'?1:0};
  if(crit) floater('crit!',p.tile,'#ffe066');
  const splash=c.edge==='splash'?(e,t)=>around(t).forEach(x=>{ if(x.occ&&x.occ.kind==='enemy'&&x.occ!==e) hitEnemy(x.occ,Math.round(pow/2),c); }):null;
  if(splash) o.onHit=splash;
  if(c.fx==='bolt') shoot(p.tile,lineTiles(p.tile,DIRS.E),o);
  else if(c.fx==='twin'){ shoot(p.tile,lineTiles(p.tile,DIRS.E),o); const n=tileCR(p.tile.col,p.tile.r+1)||tileCR(p.tile.col,p.tile.r-1); if(n) shoot(n,lineTiles(n,DIRS.E),Object.assign({},o)); }
  else lobFrom(p.tile,Object.assign({},c,{pattern:c.fx==='burst'?'burst':(c.edge==='splash'?'burst':'single')}),pow,0,.45,B.aim); }
// where a Gray creature with a stance stands
function kdStanceTile(c){ const P=B.player.tile, free=P_TILES.filter(t=>!t.occ&&!(t.holeT>0));
  if(c.stance==='front') return free.sort((a,b)=>b.col-a.col||Math.abs(a.r-P.r)-Math.abs(b.r-P.r))[0];
  if(c.stance==='rear') return free.sort((a,b)=>a.col-b.col||Math.abs(a.r-P.r)-Math.abs(b.r-P.r))[0];
  if(c.stance==='escort') return free.sort((a,b)=>Math.abs(a.r-P.r)-Math.abs(b.r-P.r)||b.col-a.col)[0];
  return null; }
// an Escort keeps to your row
function kdEscort(a,dt){ if(a.card.stance!=='escort'||(a.escT=(a.escT||0)+dt)<.8) return; a.escT=0;
  const P=B.player.tile; if(a.tile.r===P.r) return;
  const to=P_TILES.filter(t=>t.r===P.r&&!t.occ&&!(t.holeT>0)).sort((x,y)=>Math.abs(x.col-a.tile.col)-Math.abs(y.col-a.tile.col))[0]; if(!to) return;
  a.tile.occ=null; a.tile=to; to.occ=a; burst(to,colorOf(a.card),6,.4); }

/* ---------------- a card from its parts ----------------
   Cards are written with their parts (cardsets.js lines, SIGNATURE in cards.js): partsBuild clears
   any older numbers and works the card out from them. Part names by kind (PART_KEYS); a missing
   keyword is none. allocate.js (a tool, not loaded by the game) is what first chose every card's parts. */
const PART_KEYS={creature:['beh','tier','speed','kw','trait','race','stance'], strike:['shape','kw','rider','cast','cluster'],
  lob:['pattern','fuse','kw','after'], ward:['form','build','wfx','len'], boon:['boon','len','side','timing'],
  charge:['shot','uses','kw','edge'], trap:['trap','kw','len','size','spread'], environment:['env','pattern','len','kw']};
const partKind=type=>['summon','machine','sentry'].includes(type)?'creature':PART_KEYS[type]?type:null;
// the kind of parts a card has: an instant or a Legendary piece has those of what it plays as
const cardPartKind=c=>partKind(kdBase(c));
// what a card keeps of what it had: who it is, its rune and its look
const PART_KEEP=['id','name','color','type','rank','rarity','code','rune','body','mod','mach','race','legend','sig','art','look','parts','as','base','piece'];
const partF=kdF;
function partsBuild(c,P){ const kind=cardPartKind(c); if(!kind) return c;
  const v=k=>P[k]==null||P[k]===''||P[k]==='-'?null:P[k];
  for(const k of Object.keys(c)) if(!PART_KEEP.includes(k)) delete c[k];
  if(kind==='creature'){ Object.assign(c,{beh:v('beh'), tier:v('tier')||'sturdy', speed:v('speed')||'steady'}); if(v('trait')) c.trait=v('trait');
    if(c.trait==='racetech') c.race=v('race')||c.race; if(v('stance')) c.stance=v('stance');
    crBuild(c,partF(c),c.rank,v('kw')); }
  else if(kind==='strike'){ c.shape=v('shape')||'line'; if(v('rider')) c.rider=v('rider'); if(c.shape==='cluster') c.cluster=v('cluster')||'ring'; if(v('cast')&&v('cast')!=='normal') c.cast=v('cast');
    if(STRIKE_SHAPES[c.shape]) strikeBuild(c,partF(c),c.rank,v('kw'));
    else { BUILD.strike(c,partF(c),c.rank,v('kw'),{},x=>x[0],(a,b)=>a); strikeRiders(c); }
    if(c.cast){ const k=KD_CAST[c.cast].k; c.pow=Math.round(c.pow*k); if(c.bomblet) c.bomblet=Math.round(c.bomblet*k); } }
  else { KD_BUILDERS[kind](c,PART_KEYS[kind].map(v)); c.kd=1; }
  c.np=1; return c; }
// a card set line's parts (cardsets.js), if it has them
function lineParts(type,o){ const kind=partKind(type); if(!kind||o[PART_KEYS[kind][0]]==null) return null;
  const P={}; for(const k of PART_KEYS[kind]) if(o[k]!=null) P[k]=o[k]; return P; }
