/* ---------------- Creatures (v78, card rules plan step 1) ----------------
   A creature card (a summon, a machine or a tower) is built from five parts:
     behaviour  what it does (24, CR_BEH)
     HP tier    how tough it is (CR_TIER)
     speed      how often it acts (CR_SPEED); slower ones hit harder
     keyword    the colour effect its hits carry (burn, freeze...), or none
     trait      one of its colour's traits (CR_TRAITS)
   A card with `beh` uses these rules. Older cards keep their `ai` until the card list is rebuilt
   (step 2 of docs/card-rules-plan.md). The Card lab (cardlab.js) builds any mix of parts to try. */

const CR_BEH={
  // shots
  bolt:     {name:'Bolt',       icon:'➶', group:'shot',    k:1,    text:'shoots the first enemy in its row'},
  pierce:   {name:'Pierce',     icon:'⇶', group:'shot',    k:.8,   text:'shoots through every enemy in its row'},
  twin:     {name:'Twin',       icon:'⇉', group:'shot',    k:.65,  text:'shoots down its row and the next'},
  diag:     {name:'Diagonals',  icon:'⤧', group:'shot',    k:.85,  text:'shoots along both diagonals, bouncing off the edges of the board'},
  zigzag:   {name:'Zigzag',     icon:'≷', group:'shot',    k:1.1,  text:'shoots a zigzag between its row and the next'},
  cone:     {name:'Cone',       icon:'◁', group:'shot',    k:.8,   text:'blasts a wedge 4 tiles long in front of it'},
  snipe:    {name:'Snipe',      icon:'◎', group:'shot',    k:.85,  text:'snipes the weakest enemy anywhere'},
  chain:    {name:'Chain',      icon:'ϟ', group:'shot',    k:.5,   text:'zaps the nearest enemy, then jumps to 2 more (weaker each jump)'},
  beam:     {name:'Beam',       icon:'━', group:'shot',    k:1.35, text:'charges, then burns its whole row across the board, walls and rocks too'},
  burrow:   {name:'Burrow',     icon:'⤓', group:'shot',    k:1.05, text:'tunnels under walls and rocks to the first enemy in its row'},
  barrage:  {name:'Barrage',    icon:'⁂', group:'shot',    k:.35,  text:'rains 4 small hits on random enemy tiles'},
  // lobs
  lob:      {name:'Lob',        icon:'⌒', group:'lob',     k:1,    text:'lobs at the nearest enemy, over walls'},
  blast:    {name:'Blast',      icon:'✺', group:'lob',     k:.65,  text:'lobs a bomb that splashes around where it lands'},
  cross:    {name:'Cross',      icon:'✢', group:'lob',     k:.65,  text:'lobs a bomb that bursts in a + shape'},
  // close
  pounce:   {name:'Pounce',     icon:'⤳', group:'close',   k:.76,  text:'leaps at the nearest enemy'},
  trample:  {name:'Trample',    icon:'⇛', group:'close',   k:.85,  text:'charges down its row into the enemy side, hitting everything on the way, then runs back'},
  dash:     {name:'Dash',       icon:'↯', group:'close',   k:.45,  text:'dashes at {n} enemies in turn; each one flashes first and may sidestep'},
  // support
  mends:    {name:'Mends',      icon:'♥', group:'support', text:'heals you {amt}'},
  shields:  {name:'Shields',    icon:'🛡', group:'support', text:'shields you for {amt}'},
  guards:   {name:'Guards',     icon:'⛨', group:'support', text:'takes the hits meant for you'},
  taunt:    {name:'Taunt',      icon:'‼', group:'support', text:'enemies must aim at it'},
  summoner: {name:'Summoner',   icon:'☄', group:'support', text:'calls a small helper that pounces (2 at most)'},
  wardmaker:{name:'Ward-maker', icon:'▦', group:'support', text:'raises a small wall in front of you'},
  empower:  {name:'Empower',    icon:'⇧', group:'support', text:'doesn\'t attack; your next card cast while it stands hits {amt}% harder'},
};
const CR_GROUPS={shot:'Shots', lob:'Lobs', close:'Close', support:'Support'};
// supports with a pause between acts that is longer than their speed
const CR_SLOW_SUPPORT={summoner:1, wardmaker:1, empower:1};
// how tough: HP against today's creatures, and how hard it hits for that (a bigger body hits softer per second)
const CR_TIER={
  frail:   {name:'Frail',    icon:'◌', hp:.6,  k:1.15},
  sturdy:  {name:'Sturdy',   icon:'○', hp:1,   k:1},
  tough:   {name:'Tough',    icon:'◍', hp:1.6, k:.92},
  huge:    {name:'Huge',     icon:'●', hp:2.5, k:.85, turns:1},   // +1 turn: their HP has time to pay off
  colossal:{name:'Colossal', icon:'⬤', hp:3.5, k:.78, turns:1, rare:true},   // rare cards and up only
};
// how often it acts, and how hard each act lands (about the same over time; a little more for the slow ones)
const CR_SPEED={
  frantic:{name:'Frantic', icon:'⏵⏵⏵', rate:.4, k:.36},
  quick:  {name:'Quick',   icon:'⏵⏵',  rate:.7, k:.6},
  steady: {name:'Steady',  icon:'⏵',   rate:1.2, k:1},
  slow:   {name:'Slow',    icon:'⏸',   rate:2,  k:1.75},
};
// the keywords a creature of each colour can carry (Gray and Brown carry none)
const CR_KWS={fire:['burn','push'], frost:['freeze','slow','pull'], storm:['stun','confuse','push'], verdant:['poison','slow','drain','pull'],
  light:['mend','valor','push'], shadow:['curse','drain','confuse','pull'], gray:[], brown:[]};
const CR_TRAITS={
  explodes:  {color:'fire',    name:'Explodes',       text:'when it falls or its time runs out it explodes onto the nearest enemy and around it'},
  fury:      {color:'fire',    name:'Fury',           text:'hits harder as it\'s hurt (up to +80%)'},
  forged:    {color:'fire',    name:'Forged',         text:'starts with armour worth half its HP'},
  scorched:  {color:'fire',    name:'Scorched earth', text:'its hits leave the ground burning for 3 seconds'},
  bloodlust: {color:'fire',    name:'Bloodlust',      text:'each kill makes it act 15% faster'},
  chilling:  {color:'frost',   name:'Chilling',       text:'whatever hits it is slowed'},
  pack:      {color:'frost',   name:'Pack',           text:'+35% power next to another creature of its colour'},
  tidal:     {color:'frost',   name:'Tidal',          text:'every 3rd hit pushes the enemy back'},
  shatter:   {color:'frost', also:['shadow'], never:['gray'], name:'Shatter',        text:'double damage to frozen enemies'},
  submerge:  {color:'frost',   name:'Submerge',       text:'can\'t be hit for a moment after it acts'},
  static:    {color:'storm',   name:'Static',         text:'shocks and stuns enemies that hit it'},
  swift:     {color:'storm',   name:'Swift',          text:'moves to a new row every 10 seconds, toward the enemy'},
  greedy:    {color:'storm',   name:'Greedy',         text:'kills drop gold'},
  overcharge:{color:'storm',   name:'Overcharge',     text:'every 3rd attack is doubled and stuns'},
  sandstorm: {color:'storm',   name:'Sandstorm',      text:'enemies in its row miss 1 attack in 4'},
  regrows:   {color:'verdant', name:'Regrows',        text:'heals 2% of its HP every second'},
  seeds:     {color:'verdant', name:'Seeds',          text:'leaves a sapling that shoots when it falls or its time runs out'},
  thorny:    {color:'verdant', name:'Thorny',         text:'hurts whatever hits it'},
  ambush:    {color:'verdant', name:'Ambush',         text:'its first attack hits three times as hard'},
  camouflage:{color:'verdant', name:'Camouflage',     text:'enemies ignore it while another of your creatures or walls stands'},
  guardian:  {color:'light',   name:'Guardian',       text:'takes half of each hit meant for you while it has more than half its HP'},
  blessed:   {color:'light',   name:'Blessed',        text:'heals you a little each time it acts'},
  rallying:  {color:'light',   name:'Rallying',       text:'your other creatures deal +20% while it stands'},
  martyr:    {color:'light',   name:'Martyr',         text:'when it falls or its time runs out you get a big shield'},
  radiant:   {color:'light',   name:'Radiant',        text:'enemies it hits take 15% more from you for 4 seconds'},
  rises:     {color:'shadow',  name:'Rises again',    text:'the first time it falls it rises again at half HP'},
  lifesteal: {color:'shadow',  name:'Lifesteal',      text:'heals you a quarter of the damage it deals'},
  plague:    {color:'shadow',  name:'Plague',         text:'its hits poison, and the poison spreads to enemies next to them'},
  dread:     {color:'shadow',  name:'Dread',          text:'its hits confuse'},
  phantom:   {color:'shadow',  name:'Phantom',        text:'its attacks pass through enemy walls, rocks and shields'},
  harvest:   {color:'shadow',  name:'Soul harvest',   text:'+8% power each time an enemy dies while it stands'},
  veteran:   {color:'gray',    name:'Veteran',        text:'+10% power for every 10 seconds it survives'},
  loyal:     {color:'gray',    name:'Loyal',          text:'stands next to you and takes 35% less damage there'},
  steadfast: {color:'gray',    name:'Steadfast',      text:'no single hit takes more than a fifth of its HP'},
  drilled:   {color:'gray',    name:'Drilled',        text:'+12% power for every other creature of its colour on the board'},
  laststand: {color:'gray',    name:'Last stand',     text:'survives a killing blow once, at 1 HP'},
  racetech:  {color:'brown',   name:'Race tech',      text:'its race\'s tech (see below)'},
  overclock: {color:'brown',   name:'Overclock',      text:'acts 35% faster but loses 5% of its HP every second'},
  selfrepair:{color:'brown',   name:'Self-repair',    text:'mends 4% of its HP after each act'},
};
const crTraitsOf=color=>Object.keys(CR_TRAITS).filter(k=>CR_TRAITS[k].color===color||(CR_TRAITS[k].also||[]).includes(color));
// Brown's race tech on a creature
const CR_RACE={dwarf:'Dwarven armour: takes 25% less damage', gnome:'Gnomish gears: acts 20% faster', elf:'Elven sights: +30% power on enemies 4 or more tiles away',
  goblin:'Goblin powder: +40% power, but 1 act in 6 blows up in its face', alchemy:'Desert alchemy: its hits carry a random effect', sea:'Sea-folk: every 3rd hit pushes',
  sky:'Sky-folk: its attacks fly over walls, rocks and shields', human:'Human craft: +15% power', troll:'Troll hide: heals 3% of its HP every second', djinn:'Djinn: blinks to a new row every 10 seconds'};

/* Build a creature card's numbers from its parts. F is the card's power factor (rank and rarity,
   as in cards.js); kw is its keyword. Works on summons, machines and towers. */
function crBuild(c,F,rank,kw){
  const B0=CR_BEH[c.beh], T=CR_TIER[c.tier||'sturdy'], S=CR_SPEED[c.speed||'steady'];
  const k=kw&&typeof applyKw==='function'?applyKw(c,kw,rank):1;
  c.hp=Math.round(40*F*T.hp*(c.beh==='guards'||c.beh==='taunt'?2.2:1));
  c.rate=S.rate*(B0.group==='support'&&CR_SLOW_SUPPORT[c.beh]?4:1)*(c.beh==='beam'?1.6:1);
  // a Steady, Sturdy Bolt hits for 10 at rank 1. Push and pull are worth more on a creature than on a
  // card (it lands them again and again), so they cost a little more here
  // Gray creatures come in every deck (and carry a stance), so they hit 18% softer than a colour's
  const per=10*F*T.k*S.k*k*(kw==='push'||kw==='pull'?.85:1)*(c.color==='gray'?.82:1);
  if(B0.group==='support'){ delete c.pow;
    if(c.beh==='mends') c.amt=Math.max(1,Math.round(3*F*T.k*S.k));
    if(c.beh==='shields') c.amt=Math.max(2,Math.round(7*F*T.k*S.k));
    // these act every few seconds: what each act gives grows with the wait, so speed is a fair trade
    if(c.beh==='empower') c.amt=Math.round(25*F*T.k*Math.sqrt(S.k));
    if(c.beh==='wardmaker') c.wallHp=Math.max(10,Math.round(16*F*T.k*S.rate/1.2));
    if(c.beh==='summoner'){ c.helperPow=Math.max(2,Math.round(8*F*T.k)); c.helperLife=+(4*S.rate/1.2+2).toFixed(1); }
    if(c.beh==='summoner'||c.beh==='wardmaker'||c.beh==='guards'||c.beh==='taunt') c.pow=Math.max(2,Math.round(10*F*T.k*k*.5));
  } else c.pow=Math.max(1,Math.round(per*B0.k));
  if(c.beh==='dash') c.n=c.rarity==='rare'||c.rarity==='legendary'?3:2;
  c.turns=Math.max(1,Math.round((12+rank*1.5)/10))+(T.turns||0);
  return c;
}
function crText(c){
  const B0=CR_BEH[c.beh]; if(!B0) return '';
  const T=CR_TIER[c.tier||'sturdy'], S=CR_SPEED[c.speed||'steady'];
  const what=B0.text.replace('{n}',c.n||2).replace('{amt}',c.amt);
  let t=B0.name+': '+what;
  if(B0.group!=='support') t+=' for '+c.pow;
  t+=' · '+T.name+' '+c.hp+' HP · '+S.name+(B0.group==='support'&&!c.rate?'':', every '+(+c.rate.toFixed(1))+'s');
  if(c.trait&&CR_TRAITS[c.trait]) t+='. '+CR_TRAITS[c.trait].name+': '+CR_TRAITS[c.trait].text;
  if(c.trait==='racetech'&&c.race&&CR_RACE[c.race]) t+='. '+CR_RACE[c.race];
  return t+', '+(typeof tn==='function'?tn(c.turns):c.turns*10+' seconds');
}

/* ---------------- in battle ---------------- */
const crOn=(a,tr)=>a.card.trait===tr;
const crMine=()=>B.allies.filter(a=>a.hp>0&&a.cr&&!a.enemy);
const crRace=(a,r)=>a.card.trait==='racetech'&&a.card.race===r;
// the tile enemies aim at: a Taunt creature's, or yours
function foeAim(){ const t=B&&B.allies.find(a=>a.hp>0&&a.cr&&!a.enemy&&a.card.beh==='taunt'); return t?t.tile:B.player.tile; }
// a creature card goes on the board
function crSpawn(c,at){
  if(!at&&c.stance&&typeof kdStanceTile==='function') at=kdStanceTile(c);   // a Gray creature's stance (kinds.js)
  if(!at&&c.trait==='loyal'){ const P=B.player.tile; at=around(P).filter(t=>t.side==='p'&&!t.occ&&!(t.holeT>0)).sort((x,y)=>y.col-x.col)[0]; }   // Loyal stands by you
  const a=placeAlly(c,'cr',c.hp,c.turns,at); if(!a) return null;
  // the first act comes sooner for quick creatures (a flat .5 s gave slow ones a free early hit)
  a.cr=1; a.acts=0; a.hits=0; a.kills=0; a.souls=0; a.fireT=c.beh==='beam'?1:.3+Math.min(c.rate||1,2)*.25;
  if(crOn(a,'forged')){ a.armor=Math.round(a.maxHp*.5); }
  if(c.beh==='taunt'){ floater('Taunt!',a.tile,'#ffe24d'); ring(a.tile,'#ffe24d',1.4,.5); }
  return a;
}
// how hard it hits right now (traits and its friends)
function crPowMult(a){ const c=a.card, mine=crMine(); let m=1;
  if(crOn(a,'fury')) m*=1+.8*(1-a.hp/a.maxHp);
  if(crOn(a,'pack')&&mine.some(o=>o!==a&&o.card.color===a.card.color&&hexDist(o.tile,a.tile)===1)) m*=1.35;
  if(crOn(a,'drilled')) m*=1+.12*mine.filter(o=>o!==a&&o.card.color===a.card.color).length;
  if(crOn(a,'harvest')) m*=1+.08*Math.min(10,a.souls);
  if(mine.some(o=>o!==a&&crOn(o,'rallying'))) m*=1.2;
  if(crRace(a,'goblin')) m*=1.4; if(crRace(a,'human')) m*=1.15;
  if(a.card.stance==='rear') m*=1.2; if(B.player.rallyT>0) m*=1.2;   // kinds.js
  return m; }
function crRateMult(a){ let m=1;
  if(crOn(a,'bloodlust')) m*=Math.max(.5,Math.pow(.85,a.kills));
  if(crOn(a,'overclock')) m*=.65; if(crRace(a,'gnome')) m*=.8;
  return m; }
// the card its hits carry this act: its keyword plus what its traits add
function crHitCard(a,c,act){ const o=Object.assign({},c,act.kw||{});
  if((crOn(a,'tidal')||crRace(a,'sea'))&&a.hits%3===2) o.push=1;   // every 3rd hit
  if(crOn(a,'dread')) o.confuse=Math.max(o.confuse||0,2);
  if(crOn(a,'plague')) o.poison=Math.max(o.poison||0,3+Math.round(c.rank/2));
  if(crRace(a,'alchemy')){ const k=pick(['burn','slow','poison','stun']); o[k]=Math.max(o[k]||0,{burn:3,slow:2,poison:4,stun:.5}[k]); }
  return o; }
// one hit on one enemy, with everything its traits do
function crHit(a,e,pow,c){ if(!e||e.hp<=0) return 0;
  let p=pow; if(crOn(a,'shatter')&&e.freezeT>0) p*=2;
  if(crRace(a,'elf')&&hexDist(a.tile,e.tile)>=4) p*=1.3;
  // Ambush and Overcharge count hits that land, so an act that hits nothing doesn't use them up
  if(crOn(a,'ambush')&&!a.hits){ p*=3; floater('Ambush!',a.tile,'#6fdc7a',true); }
  if(crOn(a,'overcharge')&&a.hits%3===2){ p*=2; c=Object.assign({},c,{stun:Math.max(c.stun||0,.6)}); floater('Overcharge!',a.tile,'#ffe24d'); }
  a.hits++;
  const d=hitEnemy(e,Math.max(1,Math.round(p)),c,{dig:crOn(a,'phantom')||crRace(a,'sky')});
  if(d>0){
    if(crOn(a,'lifesteal')) healPlayer(Math.max(1,Math.round(d*.25)),true);
    if(crOn(a,'radiant')) e.radiantT=B.time+4;
    if(crOn(a,'scorched')&&e.tile.side==='e'){ e.tile.burnT=Math.max(e.tile.burnT||0,3); }
    if(crOn(a,'plague')) for(const n of around(e.tile)){ const o=n.occ; if(o&&o.kind==='enemy'&&o.hp>0&&!(o.poisonT>0)){ o.poisonT=8; o.poisonAmt=Math.max(o.poisonAmt,c.poison||3); floater('plague',n,'#9a7ab8'); } }
  }
  if(e.hp<=0){ a.kills++; if(crOn(a,'bloodlust')) floater('Bloodlust!',a.tile,'#ff6a3d');
    if(crOn(a,'greedy')){ const g=3+Math.round(B.depth/2); B.bonusGold=(B.bonusGold||0)+g; floater('+'+g+' gold',e.tile,'#ffe066'); } }
  return d; }
// a shot a creature fired reaches an enemy (battle.js calls this from the shot loop)
function crShotHit(s,o){ return crHit(s.ally,o,s.dmg,s.card); }
function crShoot(a,from,tiles,pow,c,o){ shoot(from,tiles,Object.assign({card:c,dmg:pow,from:'p',ally:a,dig:crOn(a,'phantom')||crRace(a,'sky')},o||{})); }
// its own lob: the tiles light up, it lands, every enemy there is hit
function crLob(a,c,pow,t,pattern){ if(!t) return; const ts=patternTiles(t,pattern||'single','e'), dur=.6;
  B.lobs.push({a:a.tile,b:t,t:0,dur,card:c}); B.teles.push({tiles:ts,t:0,dur,friendly:true});
  later(dur,()=>ts.forEach(x=>{ flash(x,colorOf(c),1); burst(x,colorOf(c),6,.2); const o=x.occ;
    if(o&&o.kind==='enemy') crHit(a,o,pow,c); else if(o&&(o.enemy||o.kind==='rock')&&(pattern||'single')==='single') o.kind==='rock'?hitRock(o,pow):hitBlock(o,pow,null); else if(!o) groundHit(x,c); })); }
const crNear=(a,es)=>{ const inRow=es.filter(e=>e.tile.r===a.tile.r); return (inRow.length?inRow:es).sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0]; };
// a run out and back: it is drawn moving through the tiles, then home
function crRun(a,tiles,step,each,done){ tiles.forEach((t,i)=>later(i*step,()=>{ if(a.hp<=0) return; a.goTo=t; each&&each(t,i); }));
  later(tiles.length*step+.05,()=>{ a.goTo=null; done&&done(); }); }

const CR_ACT={
  bolt(a,c,P){ crShoot(a,a.tile,lineTiles(a.tile,DIRS.E),P,c); },
  pierce(a,c,P){ crShoot(a,a.tile,lineTiles(a.tile,DIRS.E),P,c,{pierce:9}); },
  twin(a,c,P){ crShoot(a,a.tile,lineTiles(a.tile,DIRS.E),P,c); const n=tileCR(a.tile.col,a.tile.r+1)||tileCR(a.tile.col,a.tile.r-1); if(n) crShoot(a,n,lineTiles(n,DIRS.E),P,c); },
  diag(a,c,P){ for(const d of [-1,1]){ const path=diagPath(a.tile,d); if(path.length) crShoot(a,a.tile,path,P,c); } },
  zigzag(a,c,P){ const alt=tileCR(a.tile.col,a.tile.r+1)?1:-1, path=[]; for(let i=1;i<BOARD_COLS;i++){ const t=tileCR(a.tile.col+i,a.tile.r+(i%2?alt:0)); if(t) path.push(t); } crShoot(a,a.tile,path,P,c); },
  cone(a,c,P){ const ts=wedgeTiles(a.tile,4).filter(t=>t.side==='e'); B.fx.push({kind:'ring',a:a.tile,color:colorOf(c),t:0,life:.3});
    ts.forEach(t=>{ flash(t,colorOf(c),.9); if(t.occ&&t.occ.kind==='enemy') crHit(a,t.occ,P,c); else if(t.occ&&t.occ.enemy) hitBlock(t.occ,P,null); }); },
  snipe(a,c,P,es){ const e=es.slice().sort((x,y)=>x.hp-y.hp)[0]; B.fx.push({kind:'bolt',a:a.tile,b:e.tile,color:colorOf(c),t:0,life:.2,y0:1.2}); crHit(a,e,P,c); },
  chain(a,c,P,es){ let from=a.tile, e=crNear(a,es); const done=new Set();
    for(let i=0;i<3&&e;i++){ const f=from, t=e, k=[1,.7,.5][i]; done.add(e); later(i*.12,()=>{ B.fx.push({kind:'bolt',a:f,b:t.tile,color:colorOf(c),t:0,life:.2,y0:1.1}); crHit(a,t,P*k,c); });
      from=e.tile; e=es.filter(x=>!done.has(x)&&x.hp>0).sort((x,y)=>hexDist(from,x.tile)-hexDist(from,y.tile))[0]; } },
  beam(a,c,P){ const row=lineTiles(a.tile,DIRS.E); row.forEach(t=>flash(t,colorOf(c),.4)); floater('charging',a.tile,colorOf(c));
    later(.6,()=>{ if(a.hp<=0) return; B.fx.push({kind:'beam',a:a.tile,b:row[row.length-1]||a.tile,color:colorOf(c),t:0,life:.35}); shake(3);
      row.forEach(t=>{ flash(t,colorOf(c),1); const o=t.occ; if(!o) return; if(o.kind==='enemy') crHit(a,o,P,c); else if(o.kind==='rock') hitRock(o,P); else if(o.enemy) hitBlock(o,P,null); }); }); },
  burrow(a,c,P){ crShoot(a,a.tile,lineTiles(a.tile,DIRS.E),P,c,{dig:true}); },
  barrage(a,c,P,es){ for(let i=0;i<4;i++) later(i*.1,()=>{ const live=alive(); const t=Math.random()<.6&&live.length?pick(live).tile:pick(E_TILES); if(!t) return;
      B.fx.push({kind:'arc',a:a.tile,b:t,color:colorOf(c),t:0,life:.25}); later(.2,()=>{ flash(t,colorOf(c),.8); burst(t,colorOf(c),4,.3); const o=t.occ; if(o&&o.kind==='enemy') crHit(a,o,P,c); }); }); },
  lob(a,c,P,es){ crLob(a,c,P,crNear(a,es).tile,'single'); },
  blast(a,c,P,es){ crLob(a,c,P,crNear(a,es).tile,'burst'); },
  cross(a,c,P,es){ crLob(a,c,P,crNear(a,es).tile,'cross'); },
  pounce(a,c,P,es){ const e=es.slice().sort((x,y)=>hexDist(a.tile,x.tile)-hexDist(a.tile,y.tile))[0]; a.hopT=.25;
    B.fx.push({kind:'arc',a:a.tile,b:e.tile,color:colorOf(c),t:0,life:.22}); later(.18,()=>crHit(a,e,P,c)); },
  trample(a,c,P){ const row=lineTiles(a.tile,DIRS.E).filter(t=>t.side==='e'); const hit=new Set();
    crRun(a,row,.07,t=>{ const o=t.occ; if(o&&o.kind==='enemy'&&!hit.has(o)){ hit.add(o); crHit(a,o,P,c); shake(2); } else if(o&&o.enemy) hitBlock(o,P,null); burst(t,colorOf(c),3,.2); }); },
  dash(a,c,P,es){ const targets=es.slice().sort(()=>Math.random()-.5).slice(0,c.n||2); let t0=0;
    targets.forEach(e=>{ later(t0,()=>{ if(e.hp<=0||a.hp<=0) return; flash(e.tile,'#ffffff',1); floater('!',e.tile,'#ffe24d'); });
      later(t0+.35,()=>{ if(e.hp<=0||a.hp<=0) return;
        // the target saw the flash: about 1 time in 4 it steps aside to a free tile
        const side=around(e.tile).filter(t=>t.side==='e'&&!t.occ&&!burning(t));
        if(!e.stunT&&!e.freezeT&&side.length&&Math.random()<.25&&!(typeof caged==='function'&&caged(e))){ a.goTo=e.tile; floater('sidestep',e.tile,'#9fdcff'); stepEnemy(e,pick(side)); }
        else { a.goTo=e.tile; B.fx.push({kind:'arc',a:a.tile,b:e.tile,color:colorOf(c),t:0,life:.15}); crHit(a,e,P,c); } });
      t0+=.55; });
    a.busyT=t0+.1; later(t0+.1,()=>{ a.goTo=null; }); },
  // support
  mends(a,c){ healPlayer(c.amt); B.fx.push({kind:'beam',a:a.tile,b:B.player.tile,color:'#39ff8a',t:0,life:.2}); },
  shields(a,c){ const p=B.player; if(p.barrier<c.amt*4){ p.barrier=Math.min(c.amt*4,p.barrier+c.amt); p.shieldT=Math.max(p.shieldT||0,secs(1)); floater('🛡'+p.barrier,p.tile,'#6fd6ff'); B.fx.push({kind:'beam',a:a.tile,b:p.tile,color:'#6fd6ff',t:0,life:.2}); } },
  guards(){}, taunt(){},
  summoner(a,c){ const mine=B.allies.filter(x=>x.hp>0&&x.helperOf===a); if(mine.length>=2) return;
    const h={id:'cr_helper', name:'Helper', color:c.color, type:'summon', beh:'pounce', tier:'frail', speed:'quick', rank:c.rank, rarity:'common', pow:c.helperPow||Math.max(2,Math.round(c.pow*.8)), hp:Math.round(c.hp*.3), rate:.8, turns:1};
    const free=P_TILES.filter(t=>!t.occ&&!(t.holeT>0)).sort((x,y)=>hexDist(x,a.tile)-hexDist(y,a.tile))[0];
    const o=crSpawn(h,free); if(o){ o.helperOf=a; o.life=o.maxLife=c.helperLife||8; B.fx.push({kind:'arc',a:a.tile,b:o.tile,color:colorOf(c),t:0,life:.25}); } },
  wardmaker(a,c){ const t=placementTiles(1)[0]; if(!t) return; const hp=c.wallHp||Math.max(10,Math.round(c.hp*.4));
    const w={kind:'wall',card:c,tile:t,hp,maxHp:hp,thorns:0,life:secs(.6),maxLife:secs(.6)}; t.occ=w; B.walls.push(w); burst(t,colorOf(c),8,.3); B.fx.push({kind:'arc',a:a.tile,b:t,color:colorOf(c),t:0,life:.25}); },
  empower(a,c){ const p=B.player; if((p.empower||0)<c.amt){ p.empower=c.amt; floater('⇧ +'+c.amt+'%',p.tile,colorOf(c)); B.fx.push({kind:'beam',a:a.tile,b:p.tile,color:colorOf(c),t:0,life:.25}); } },
};
// an Empower creature's bonus goes on the next card you cast (battle.js playCard)
function crEmpowerUse(){ const p=B.player, m=p.empower||0; if(!m) return 1; p.empower=0; floater('Empowered!',p.tile,'#ffe066'); return 1+m/100; }

// every frame for each of your creatures
function crTick(a,dt){ const c0=a.card;
  if(a.subT>0) a.subT-=dt;
  if(crOn(a,'regrows')||crRace(a,'troll')){ a.regAcc=(a.regAcc||0)+a.maxHp*(crRace(a,'troll')?.03:.02)*dt; if(a.regAcc>=1&&a.hp<a.maxHp){ const h=Math.floor(a.regAcc); a.regAcc-=h; a.hp=Math.min(a.maxHp,a.hp+h); } }
  if(crOn(a,'overclock')){ a.ocAcc=(a.ocAcc||0)+a.maxHp*.05*dt; if(a.ocAcc>=1){ const h=Math.floor(a.ocAcc); a.ocAcc-=h; a.hp-=h; if(a.hp<=0){ a.hp=0; floater('burnt out',a.tile,'#c08a55',true); burst(a.tile,'#c08a55',12,.6); removeBlock(a); return; } } }
  if((crOn(a,'swift')||crRace(a,'djinn'))&&(a.swiftT=(a.swiftT||0)+dt)>=TURN_S){ a.swiftT=0; crHop(a); }
  if(c0.stance) kdEscort(a,dt);
  if(a.busyT>0){ a.busyT-=dt; return; }   // a dash still running
  a.fireT-=dt; if(a.fireT>0) return;
  const c=allyCard(a); a.fireT=(c.rate||1)*crRateMult(a);
  const B0=CR_BEH[c0.beh], es=alive();
  if(B0.group!=='support'&&!es.length){ a.fireT=.3; return; }
  if(crRace(a,'goblin')&&Math.random()<1/6){ floater('backfire!',a.tile,'#ff9a3a'); burst(a.tile,'#ff9a3a',10,.6); a.hp-=Math.round(a.maxHp*.1); if(a.hp<=0){ a.hp=0; floater('blown apart',a.tile,'#ff9a3a',true); removeBlock(a); } return; }
  a.acts++;
  const P=(c.pow||0)*crPowMult(a), act={};
  const hc=crHitCard(a,c,act);
  CR_ACT[c0.beh](a,hc,P,es);
  if(crOn(a,'blessed')) healPlayer(2+Math.round(c.rank/3));
  if(crOn(a,'selfrepair')&&a.hp<a.maxHp){ const h=Math.max(1,Math.round(a.maxHp*.04)); a.hp=Math.min(a.maxHp,a.hp+h); floater('+'+h,a.tile,'#c08a55'); }
  if(crOn(a,'submerge')) a.subT=.8;
}
// Swift (and Djinn): it moves to a free tile in another row, preferring rows with enemies
function crHop(a){ const rows=new Set(alive().map(e=>e.tile.r));
  const free=P_TILES.filter(t=>!t.occ&&!(t.holeT>0)&&t.r!==a.tile.r).sort((x,y)=>(rows.has(y.r)-rows.has(x.r))||(y.col-x.col)||(Math.random()-.5));
  const to=free[0]; if(!to) return; burst(a.tile,colorOf(a.card),8,.5); a.tile.occ=null; a.tile=to; to.occ=a; burst(to,colorOf(a.card),8,.5); floater('swift',to,colorOf(a.card)); }
// it is hit (battle.js hitBlock): returns the damage it actually takes
function crHurt(a,dmg,src){
  if(a.down) return 0;   // Rises again: it lies still a moment and can't be finished off
  if(a.subT>0){ floater('submerged',a.tile,'#6fd6ff'); return 0; }
  if(crOn(a,'camouflage')&&crCamo(a)){ floater('unseen',a.tile,'#6fdc7a'); return 0; }
  if(crOn(a,'loyal')&&hexDist(a.tile,B.player.tile)===1) dmg*=.65;
  if(crRace(a,'dwarf')) dmg*=.75;
  if(a.card.stance==='front') dmg*=.8;
  if(crOn(a,'steadfast')) dmg=Math.min(dmg,a.maxHp*.2);
  dmg=Math.max(1,Math.round(dmg));
  if(a.armor>0){ const s=Math.min(a.armor,dmg); a.armor-=s; dmg-=s; floater('armour',a.tile,'#ffb070'); if(!dmg) return 0; }
  if(src&&src.kind==='enemy'&&src.hp>0){
    if(crOn(a,'chilling')){ src.slowT=Math.max(src.slowT,2); floater('chilled',src.tile,'#9fd0ff'); }
    if(crOn(a,'static')){ B.fx.push({kind:'bolt',a:a.tile,b:src.tile,color:'#ffe24d',t:0,life:.2}); hitEnemy(src,4+Math.round(a.card.rank/2),null,{raw:true}); src.stunT=Math.max(src.stunT,.4); cancelAttack(src); }
    if(crOn(a,'thorny')){ hitEnemy(src,Math.max(3,Math.round(dmg*.3)),null,{raw:true}); floater('thorns',src.tile,'#6fdc7a'); }
    // a Guard or Taunt creature with a keyword passes it to whatever hits it
    if((a.card.beh==='guards'||a.card.beh==='taunt')&&a.card.pow) hitEnemy(src,a.card.pow,crHitCard(a,a.card,{}));
  }
  return dmg; }
// another target of yours that enemies can see (two Camouflage creatures don't hide each other)
const crCamo=a=>B.allies.some(o=>o!==a&&o.hp>0&&!o.enemy&&!(o.cr&&crOn(o,'camouflage')))||B.walls.some(w=>w.hp>0&&!w.enemy);
// enemy shots fly past it (Submerge, Camouflage)
const crPassThrough=a=>a.down||a.subT>0||(crOn(a,'camouflage')&&crCamo(a));
// a killing blow: Last stand and Rises again keep it on the board
function crSave(a){
  if(crOn(a,'laststand')&&!a.stood){ a.stood=1; a.hp=1; floater('Last stand!',a.tile,'#b4b8c8',true); burst(a.tile,'#b4b8c8',14,1); return true; }
  if(crOn(a,'rises')&&!a.rose){ a.rose=1; a.hp=0; a.down=1; floater('…',a.tile,'#7a2a8f');
    later(1,()=>{ if(!B.allies.includes(a)) return; a.down=0; a.hp=Math.round(a.maxHp*.5); floater('Rises again!',a.tile,'#e0588f',true); burst(a.tile,'#7a2a8f',20,1); }); return true; }
  return false; }
// it has fallen, or its time ran out (battle.js removeBlock)
function crFell(a){ const c=a.card;
  if(crOn(a,'explodes')){ const t=nearestEnemyTile(a.tile); burst(a.tile,'#ff6a3d',20,1); shake(4); if(t) crLob(a,Object.assign({},c,{burn:Math.max(c.burn||0,3)}),Math.round((c.pow||10)*1.5+c.hp*.15),t,'burst'); }
  if(crOn(a,'martyr')){ const p=B.player, amt=Math.round(a.maxHp*.5); p.barrier=Math.max(p.barrier,amt); p.shieldT=Math.max(p.shieldT||0,secs(1)); floater('Martyr 🛡'+amt,p.tile,'#fff0b3',true); B.fx.push({kind:'beam',a:a.tile,b:p.tile,color:'#fff0b3',t:0,life:.4}); }
  if(crOn(a,'seeds')){ const t0=a.tile; later(.3,()=>{ const t=!t0.occ?t0:P_TILES.filter(x=>!x.occ&&!(x.holeT>0)).sort((x,y)=>hexDist(x,t0)-hexDist(y,t0))[0]; if(!t) return; const s={id:'cr_sapling', name:'Sapling', color:'verdant', type:'summon', beh:'bolt', tier:'frail', speed:'steady', rank:c.rank, rarity:'common', pow:Math.max(3,Math.round((c.pow||10)*.5)), hp:Math.round(c.hp*.4), rate:1.2, turns:1};
      const o=crSpawn(s,t); if(o){ floater('Sapling',t,'#6fdc7a'); spray(t,10,{shape:'leaf',color:['#6fdc7a','#b6f59a'],v0:.5,v:2,up0:1.5,up:3.5,g:5,life:.8,s:5,spin:8}); } }); }
}
// any enemy dies: Soul harvest grows
function crEnemyDied(){ if(!B) return; for(const a of crMine()) if(crOn(a,'harvest')){ a.souls++; floater('soul +8%',a.tile,'#e0588f'); } }
// Sandstorm: an enemy in the row of one of your Sandstorm creatures misses 1 attack in 4
function crSandstorm(e){ if(!B) return false; if(!crMine().some(a=>crOn(a,'sandstorm')&&a.tile.r===e.tile.r)) return false;
  if(Math.random()>=.25) return false; floater('lost in the sand',e.tile,'#e8c872'); spray(e.tile,8,{color:['#e8c872','#c9a35a'],v0:.5,v:2,up0:.2,up:1,g:0,drag:2,life:.6,s:4}); return true; }

if(typeof module!=='undefined') module.exports={CR_BEH,CR_TIER,CR_SPEED,CR_TRAITS,CR_KWS,CR_RACE,crBuild,crText,crTraitsOf};
