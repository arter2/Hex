/* Hexmancers — what fills the dungeon: people, keys, merchants, sanctuaries, puzzles, traps,
   minibosses and secrets. explore.js digs each floor and runs it; this file plans what a floor
   holds before it is dug (xFloorPlan), gives some rooms a role (xAssignRooms), fills it
   (xPopulate) and handles everything you can walk into, talk to, pull, push, unlock or find.

   A run lasts from leaving camp until you return, die or flee. During a run you carry keys,
   quests and a sanctuary's blessing from floor to floor (XRUN). Your bag of consumables,
   crafting materials, permanent blessings and the lore you have read are kept in the save.

   Every floor can hold: an NPC with a side quest, a merchant (every 3 to 6 floors), a
   sanctuary (every 5 to 6 floors), a miniboss, a puzzle room, the secret closet (always) and
   other secrets, locked doors and vaults, and trap gauntlets. A plan rolls at least two of these
   on top of the closet, so no two floors or runs are alike.

   Fair-play rules: the stairs down never need a key; a locked door shuts off at most two rooms;
   every lock has more than one way through (its key somewhere on the floor or from a quest,
   a skeleton key, a merchant, or picking the lock); a boss key always lies where you can reach
   it; puzzles are built solved and then scrambled, so they can always be solved. */

/* ---------------- what there is ---------------- */
const KEYS={
  bronze:  {name:'Bronze key',   col:'#c8843a', price:70},
  silver:  {name:'Silver key',   col:'#cfd8e6', price:180},
  gold:    {name:'Gold key',     col:'#f2c94c', price:360},
  skeleton:{name:'Skeleton key', col:'#e8e0c8', price:420, text:'opens any lock but a boss door, once'},
  boss:    {name:'Boss key',     col:'#ff5d6c'},
};
const LOCKS={
  bronze:{name:'locked door',       key:'bronze', pick:.4},
  silver:{name:'silver vault door', key:'silver', pick:.16},
  gold:  {name:'gold vault door',   key:'gold',   pick:0},
  gate:  {name:'shortcut gate',     key:'gold',   pick:0},
  boss:  {name:'boss door',         key:'boss',   pick:0},
};
const BAG={
  draught: {name:'Healing Draught',      text:'Restores 40% of your HP',                      price:60, icon:'potion', col:'#ff5d6c'},
  antidote:{name:'Antidote',             text:'Cures poison and curses',                      price:45, icon:'potion', col:'#8fd14f'},
  smoke:   {name:'Smoke Bomb',           text:'Every enemy you can see loses you and dozes off', price:80, icon:'smoke', col:'#9aa3b5'},
  oil:     {name:'Lantern Oil',          text:'See 2 tiles further on this floor',            price:50, icon:'potion', col:'#f2c94c'},
  chart:   {name:"Cartographer's Chart", text:'Maps every room and corridor of this floor',   price:90, icon:'map',    col:'#d9dee2'},
};
const MATS={ore:{name:'Deep Iron', price:30, col:'#8f99a3'}, essence:{name:'Arcane Essence', price:45, col:'#b48cff'}, shard:{name:'Relic Shard', price:80, col:'#7fd4ff'}};
const PERM={vigor:{name:'Vigor', text:'+6 max HP', max:10}, might:{name:'Might', text:'+1 wand damage, +2 charged', max:5},
            insight:{name:'Insight', text:'see 1 tile further in the dungeon', max:3}, fortune:{name:'Fortune', text:'+5% gold from fights', max:5}};
const LORE=[
  {id:'founding', title:'The First Hexmancers', text:'They learned that every color yields to another, and carved the wheel into the floor of the first hall: fire over verdant, verdant over storm, storm over frost, frost over shadow, shadow over light, light over fire.'},
  {id:'glowworms', title:'On Glowworms', text:'The Hollows are lit by worms that eat stone and shine green. The crystal golem that walks there was built to keep them fed.'},
  {id:'queen', title:'The Glacier Queen', text:'She froze the Deeps to keep something below from climbing out. The cold kept it. The cold kept her too.'},
  {id:'vault', title:'Storm Vault Ledger', text:'Item: one roc, thunder-bred, held in the vault for its lightning. Note: do not open the roof.'},
  {id:'rifts', title:'A Smith of the Rifts', text:'Deep iron only sings when worked over lava. We follow the wyrm’s cracks to find the hottest seams, and we run when they glow.'},
  {id:'ruins', title:'The Gilded City', text:'We buried the gold so the dark would not want it. A seed of the old forest grew through the vault anyway, and became the Treant.'},
  {id:'abyss', title:'The Hollow King', text:'A king who traded his shadow for a crown. Now the crown wears him.'},
  {id:'mimics', title:'Field Notes: Mimics', text:'A mimic is a chest that learned to wait. If a lid breathes, search before you touch it.'},
  {id:'executioner', title:'The Bell', text:'Stay too long on any floor and the bell rings. The Executioner comes for those who linger.'},
  {id:'wardens', title:'Wardens’ Oath', text:'We keep the doors. We answer every alarm. We do not stop.'},
  {id:'keys', title:'A Locksmith’s Boast', text:'Bronze for the common door, silver for the vault, gold for the gate. And for every lock but the boss’s, a skeleton key.'},
  {id:'shrines', title:'Pilgrim’s Prayer', text:'Rest where the old light burns. Bind your name to the shrine, and if you fall it will pull you back, once.'},
  {id:'secrets', title:'The Patient Thief', text:'The best rooms are never shown. Stand still. Listen to the walls. Feel which floor stone moves.'},
  {id:'goblins', title:'Goblin Price List', text:'Keys: cheap. Maps: cheaper. Questions: double.'},
  {id:'alchemy', title:'Plague Notes', text:'The puddles burn only the living. Keep moving and the poison cannot settle.'},
  {id:'construct', title:'Arcane Construct, Manual', text:'Activates when its vault is opened. Beam sweeps two rows. Do not stand where it is looking.'},
];
// rewards and stock are drawn with this; tests may swap it for a seeded one
let XR=Math.random;
const xri=(a,b)=>a+Math.floor(XR()*(b-a+1)), xpick=a=>a[Math.floor(XR()*a.length)];
const xweighted=list=>{ const tot=list.reduce((s,[,w])=>s+w,0); let x=XR()*tot; for(const [v,w] of list){ x-=w; if(x<=0) return v; } return list[list.length-1][0]; };

/* ---------------- what you keep ---------------- */
function dState(s){ s=s||save; s.bag=s.bag||{}; s.mats=s.mats||{}; s.perm=s.perm||{}; s.lore=s.lore||{}; return s; }
const bagN=k=>(dState().bag[k]||0), matN=k=>(dState().mats[k]||0);
function addBag(k,n){ dState().bag[k]=bagN(k)+(n||1); }
function addMat(k,n){ dState().mats[k]=matN(k)+(n||1); xQuestCheck(); }
function addPerm(k){ const P=dState().perm; if((P[k]||0)>=PERM[k].max) return false; P[k]=(P[k]||0)+1; return true; }
function addLore(id){ const L=dState().lore; const fresh=!L[id]; L[id]=1; return fresh; }
const loreOf=id=>LORE.find(l=>l.id===id)||LORE[0];
const unreadLore=()=>LORE.filter(l=>!dState().lore[l.id]);

/* ---------------- the run ---------------- */
let XRUN=null;
function xNewRun(depth){
  XRUN={start:depth, keys:{}, quests:[], kills:{}, attuned:0, chute:0, solution:0, discount:0,
        next:{merchant:depth+xri(0,2), sanct:depth+xri(3,5)}};
}
const keyN=k=>XRUN&&XRUN.keys[k]||0;
function addKey(k,n){ if(!XRUN) xNewRun(EX?EX.depth:1); XRUN.keys[k]=keyN(k)+(n||1); }

/* Rewards: one of gold, gear, a consumable, a permanent blessing, materials, a key, a dungeon
   shortcut, a puzzle solution, a card or lore. xRollReward picks one from the kinds allowed;
   xGrant applies it and says what it was. */
function xRollReward(depth,kinds,rich){
  const k=xweighted(kinds);
  if(k==='gold') return {gold:Math.round((50+18*depth)*(rich?1.8:1)*(.8+XR()*.4))};
  if(k==='gear') return {gear:rollLoot(depth+(rich?2:0),XR,rich)};
  if(k==='bag') return {bag:xpick(Object.keys(BAG)), n:rich?2:1};
  if(k==='perm'){ const left=Object.keys(PERM).filter(p=>(dState().perm[p]||0)<PERM[p].max); return left.length?{perm:xpick(left)}:{gold:120+20*depth}; }
  if(k==='mat') return {mat:xweighted([['ore',5],['essence',3],['shard',rich?3:1]]), n:rich?2+xri(0,1):1+xri(0,1)};
  if(k==='key') return {key:xweighted([['bronze',4],['silver',3],['gold',depth>=5?2:.5],['skeleton',rich?1.5:.6]])};
  if(k==='chute') return isBossDepth(depth+1)||!EX||EX.branch?{key:'silver'}:{chute:depth+1};
  if(k==='solution') return {solution:1};
  if(k==='card') return {card:rollCard({depth:depth+2,min:rich?'rare':'uncommon'},XR)};
  if(k==='lore'){ const u=unreadLore(); return u.length?{lore:xpick(u).id}:{mat:'essence',n:1}; }
  return {gold:60};
}
function rewardText(r){
  if(r.gold) return r.gold+' gold';
  if(r.gear) return lootLabel(save,r.gear).name;
  if(r.bag) return (r.n>1?r.n+' × ':'')+BAG[r.bag].name;
  if(r.perm) return 'a blessing of '+PERM[r.perm].name+' ('+PERM[r.perm].text+')';
  if(r.mat) return r.n+' '+MATS[r.mat].name;
  if(r.key) return 'a '+KEYS[r.key].name;
  if(r.chute) return 'a chute on the next floor that drops you a floor further';
  if(r.solution) return 'the answer to the next lever or rune puzzle';
  if(r.card) return 'the card '+r.card.name;
  if(r.lore) return 'the tale "'+loreOf(r.lore).title+'"';
  return 'nothing';
}
function xGrant(r,why){
  const t=rewardText(r);
  if(r.gold){ save.gold+=r.gold; }
  if(r.gear){ const res=addLoot(save,r.gear,XR); if(res&&res.cursed) xLog(res.msg,'bad'); }
  if(r.bag) addBag(r.bag,r.n||1);
  if(r.perm){ if(!addPerm(r.perm)) save.gold+=150; }
  if(r.mat) addMat(r.mat,r.n||1);
  if(r.key) addKey(r.key);
  if(r.chute&&XRUN) XRUN.chute=r.chute;
  if(r.solution&&XRUN) XRUN.solution++;
  if(r.card) addCards(save,[r.card]);
  if(r.lore) addLore(r.lore);
  persist(); xLog((why?why+': ':'')+t+'.',r.perm?'good':r.gold?'gold':'loot'); tip(t.charAt(0).toUpperCase()+t.slice(1)); xSfx('chime');
  if(typeof xHud==='function') xHud();
  return t;
}

/* ---------------- who you meet ----------------
   Each NPC has a look (one of the hand-drawn hero sprites), a voice and a purpose. */
const NPC_KINDS={
  quest:   {title:'Quest giver',      looks:['human_f','wizard','dwarf_f','elf_m'], names:['Marta','Old Bram','Sister Ivy','Tobin','Hesk'],
            items:["lucky charm","grandfather's ring","map case","prayer beads","silver locket","journal"]},
  lost:    {title:'Lost adventurer',  looks:['ranger_m','ranger_f','elf_f','human_f'], names:['Kel','Ardo','Pip','Wren','Sully']},
  prisoner:{title:'Prisoner',         looks:['dwarf_m','elf_m','human_f','orc_m'],     names:['Grunda','Feyl','Hamm','Ottilie','Rask']},
  scholar: {title:'Scholar',          looks:['necro','necro_f','witch_m'],            names:['Magister Quill','Doctor Vey','Archivist Lorn','Sage Imre']},
  peddler: {title:'Robbed merchant',  looks:['dwarf_m','dwarf_f'],                    names:['Bodo','Gretta','Fennick']},
  rival:   {title:'Treasure hunter',  looks:['orc_m','orc_f','ranger_m'],                 names:['Vasha the Quick','Dagan','Lucky Mott','Ressa']},
  hermit:  {title:'Hermit',           looks:['shaman_m','shaman_f','undead_m'],         names:['the Hermit','Brother Ash','the Pilgrim']},
};
const MERCHANTS={
  weapon:{name:'Weapon Merchant',           look:'dwarf_m', who:'Brakka',   greet:'Steel, wood and wands. Hit things harder.', services:['upgrade'], slot:'weapon'},
  armor: {name:'Armor Merchant',            look:'dwarf_f', who:'Helga',    greet:'Every hit you do not take is a hit you do not feel.', services:['upgrade','curse'], slot:'armor'},
  card:  {name:'Card Merchant',             look:'witch',   who:'Madame Oriel', greet:'The cards remember who owned them. Choose kindly.', services:['reroll']},
  curio: {name:'Curio Collector',           look:'necro_f', who:'Silas Grey',   greet:'Machines, relics, curiosities. I buy shards, too.', services:['shards']},
  black: {name:'Black Market Trader',       look:'undead_m', who:'No One',      greet:'You did not see me. Prices reflect that.', services:['curse'], minDepth:3},
  goblin:{name:'Traveling Goblin Merchant', look:'orc_m',     who:'Snik',     greet:'Keys! Maps! Bits! Cheap, cheap, mostly cheap!', services:['map']},
};
const SANCTUARIES={
  shrine: {name:'Ancient Shrine',          text:'Worn steps and an old light that never went out.'},
  temple: {name:'Forgotten Temple',        text:'Pillars, dust, and a quiet that the monsters will not cross.'},
  crystal:{name:'Crystal Healing Chamber', text:'Crystals hum a low note. Wounds close in their light.'},
  camp:   {name:'Campfire',                text:'Someone left a fire burning, and a ward around it.'},
  garden: {name:'Sacred Garden',           text:'Moss, flowers and clean water, deep under the stone.'},
  arcane: {name:'Arcane Rest Station',     text:'Floating rings of light, a cot, and a ward against the dark.'},
};
// how each miniboss moves on the map: hunts you, walks a beat, guards something, or appears when something happens
const MINI_MAP={
  executioner:  {beh:'hunt',   min:3, hint:'A distant bell tolls.'},
  corruptknight:{beh:'patrol', min:2, hint:'Heavy armour clanks somewhere on this floor.'},
  giant_mimic:  {beh:'guard',  min:3, hint:'Something smells of old gold and hunger.'},
  dungeonwarden:{beh:'patrol', min:2, hint:'Chains drag along a corridor nearby.'},
  alchemist:    {beh:'guard',  min:4, hint:'A sour, green smell drifts through the halls.'},
  assassin:     {beh:'hunt',   min:5, hint:'You feel watched.'},
  construct:    {beh:'guard',  min:4, hint:'A machine hums behind a wall.'},
  bonecollector:{beh:'guard',  min:3, hint:'Bones rattle in the dark.'},
};

/* ---------------- planning a floor ----------------
   Before a floor is dug: which side rooms it gets, whether doors are locked, whether there is a
   shortcut gate and a boss door, and the features it will hold. */
function xFloorPlan(depth,opt){
  if(!XRUN) xNewRun(depth);
  const boss=isBossDepth(depth)&&!opt.branch, pl={side:[], locks:0, gate:false, bossDoor:boss, small:!!opt.branch, feats:{}}, F=pl.feats;
  if(opt.branch){ pl.side.push({kind:'closet',lock:'secret',content:'treasure'}); F.branch=true; return pl; }
  pl.side.push({kind:'closet',lock:'secret',content:xPickSecret(depth,boss)});
  // a merchant every 3 to 6 floors and a sanctuary every 5 to 6, never on a boss floor
  if(!boss&&depth>=XRUN.next.merchant){ F.merchant=xPickMerchant(depth); XRUN.next.merchant=depth+xri(3,6); }
  if(depth>=XRUN.next.sanct){ if(boss) XRUN.next.sanct=depth+1; else { F.sanct=xpick(Object.keys(SANCTUARIES)); XRUN.next.sanct=depth+xri(5,6); } }
  // the rest: each has its own chance, and every floor gets at least two
  const pool=[['npc',.55],['puzzle',.45],['lock',.4],['cache',.35],
    ...(depth>=2?[['prisoner',.3],['vault',.35],['mini',depth>=8?.45:.3],['gate',.3],['gauntlet',.35],['mimic',.25],['totem',depth>=4?.3:0]]:[])];
  for(const [k,p] of pool) if(XR()<p) F[k]=1;
  const cap=F.merchant||F.sanct?3:5, extra=()=>Object.keys(F).filter(k=>!['merchant','sanct'].includes(k));
  while(extra().length<2){ const left=pool.filter(([k,p])=>!F[k]&&p>0); if(!left.length) break; F[xweighted(left)]=1; }
  while(extra().length>cap) delete F[xpick(extra())];
  if(F.vault) pl.side.push({kind:'vault', lock:depth>=6&&XR()<.35?'gold':'silver', w:4, h:3, content:depth>=3&&XR()<.3?'mimic':depth>=4&&XR()<.3?'construct':'treasure'});
  if(F.prisoner) pl.side.push({kind:'cell', lock:'bronze'});
  if(F.lock) pl.locks=1+(depth>=8&&XR()<.4?1:0);
  if(F.gate) pl.gate=true;
  if(F.mini) F.mini=xpick(MINIBOSS_IDS.filter(id=>MINI_MAP[id].min<=depth&&id!=='executioner'&&id!=='giant_mimic'));
  return pl;
}
function xPickSecret(depth,boss){
  return xweighted([['treasure',.3],['lore',.15],['shrine',.12],['mats',.12],...(depth>=3?[['merchant',.1]]:[]),...(depth>=4?[['bonus',.1]]:[]),...(!boss&&depth>=2?[['branch',.11]]:[])]);
}
function xPickMerchant(depth){ return xpick(Object.keys(MERCHANTS).filter(k=>!MERCHANTS[k].minDepth||MERCHANTS[k].minDepth<=depth).filter(k=>k!=='black'||XR()<.4)); }

/* Rooms with a role hold no chests, traps or monsters of their own: the merchant's and the
   sanctuary's are safe (monsters will not enter), the puzzle room holds its puzzle, a lair holds
   a miniboss and its hoard. Rooms behind a bronze lock get a rich chest. */
function xAssignRooms(){
  const F=EX.plan?EX.plan.feats:{}, mid=EX.rooms.filter(r=>!r.side&&!r.nook&&r!==EX.start&&r!==EX.exit&&!r.behind);
  const take=fn=>mid.filter(r=>!r.role&&fn(r)).sort(()=>XR()-.5)[0]||null;
  const give=(r,role,safe)=>{ if(!r) return null; r.role=role; r.lit=true; if(safe){ r.safe=true; for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++) EX.safe.add(xi(i,j)); } return r; };
  // a merchant or sanctuary with no room to stand in tries again on the next floor
  if(F.merchant&&!give(take(()=>true),'merchant',true)){ delete F.merchant; XRUN.next.merchant=EX.depth+1; }
  if(F.sanct&&!give(take(()=>true),'sanctuary',true)){ delete F.sanct; XRUN.next.sanct=EX.depth+1; }
  if(F.puzzle&&!give(take(r=>r.w>=5&&r.h>=5),'puzzle')) delete F.puzzle;
  if(F.mini&&MINI_MAP[F.mini].beh==='guard'&&!give(take(r=>r.w*r.h>=20),'lair')) F.mini='corruptknight';
}

/* ---------------- filling a floor ---------------- */
const xRoomCells=r=>{ const out=[]; for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++) out.push(xi(i,j)); return out; };
const xInterior=r=>xRoomCells(r).filter(c=>{ const x=xcx(c), y=xcy(c); return r.w<3||r.h<3||(x>r.x&&x<r.x+r.w-1&&y>r.y&&y<r.y+r.h-1); });
const xSolid=n=>{ const p=EX.propAt.get(n); return !!(p&&p.solid); };
const nearDoor=c=>xAdj4(c).some(n=>EX.doors.has(n));
const xReach=extra=>xbfs(EX.t,EX.doors,EX.up,false,n=>xSolid(n)||(extra&&extra(n)));
const nReach=d=>{ let n=0; for(const v of d) if(v>=0) n++; return n; };
// can something solid stand here without cutting off anything but its own cell?
function xSolidOK(c){ if(c<0||EX.taken.has(c)||EX.t[c]!==T_FLOOR) return false;
  const before=xReach(), after=xReach(n=>n===c); return nReach(after)>=nReach(before)-(before[c]>=0?1:0)&&after[EX.down]>=0; }
function xFreeCell(r,interior){ const cs=(interior?xInterior(r):xRoomCells(r)).filter(c=>!EX.taken.has(c)&&!nearDoor(c)); return cs.length?xpick(cs):-1; }
function xFreeSolid(r,interior){ for(const c of (interior?xInterior(r):xRoomCells(r)).filter(c=>!EX.taken.has(c)&&!nearDoor(c)).sort(()=>XR()-.5)) if(xSolidOK(c)) return c; return -1; }
function xProp(kind,cell,o){ const p=Object.assign({kind,cell,solid:true},o||{}); EX.props.push(p); if(cell>=0){ if(p.solid||!EX.propAt.has(cell)) EX.propAt.set(cell,p); EX.taken.add(cell); } return p; }
function xWallProp(kind,wall,front,o){ const p=Object.assign({kind,cell:wall,front,wall:true,solid:false},o||{}); EX.props.push(p); EX.wallAt.set(wall,p); return p; }
function xItem(kind,cell,o){ const it=Object.assign({kind,cell},o||{}); EX.items.push(it); EX.itemAt.set(cell,it); EX.taken.add(cell); return it; }
function xChest(cell,o){ const ch=Object.assign({cell,open:false,trap:false,trapKnown:false},o||{}); EX.chests.push(ch); EX.taken.add(cell); return ch; }
// a rock cell beside a room, for things mounted on walls
function xWallSpot(r,avoid){ const out=[]; for(const c of xRoomCells(r)) for(const n of xAdj4(c)) if(EX.t[n]===T_ROCK&&!EX.wallAt.has(n)&&!(avoid&&avoid(n,c))) out.push([n,c]); return out.length?xpick(out):null; }
// rooms anyone can reach from the stairs up without a key
function xOpenRooms(reach,o){ return EX.rooms.filter(r=>!r.side&&!r.nook&&!r.safe&&r.role!=='puzzle'&&reach[xi(r.cx,r.cy)]>=0&&(!o||!o.notStart||r!==EX.start)&&(!o||o.not!==r)); }
function xReachableCell(reach,o){ const rooms=xOpenRooms(reach,o).filter(r=>r!==EX.start||!(o&&o.notStart)); for(let k=0;k<20;k++){ const r=xpick(rooms); if(!r) break; const c=xFreeCell(r); if(c>=0&&reach[c]>=0) return c; } return -1; }
const roomOf=c=>EX.room[c]>=0?EX.rooms[EX.room[c]]:null;

function xPopulate(){
  const F=EX.plan?EX.plan.feats:{}, d=EX.depth;
  EX.give={bronze:0, silver:0, gold:0, boss:0};   // keys this floor still has to hand out somewhere
  for(const r of EX.rooms){ if(r.side==='closet') xFillCloset(r); else if(r.side==='vault') xFillVault(r); else if(r.side==='cell') xFillCell(r); }
  for(const r of EX.rooms) if(r.behind){ const c=xFreeCell(r); if(c>=0) xChest(c,{rich:true}); }
  for(const r of EX.rooms){ if(r.role==='merchant'&&!xPlaceMerchant(r,F.merchant)){ r.role=null; XRUN.next.merchant=d+1; } else if(r.role==='sanctuary'&&!xPlaceSanctuary(r,F.sanct)){ r.role=null; XRUN.next.sanct=d+1; } else if(r.role==='puzzle') xPlacePuzzle(r); else if(r.role==='lair') xPlaceLair(r,F.mini); }
  if(F.mini&&MINI_MAP[F.mini].beh!=='guard') xPlaceMini(F.mini);
  if(F.npc) xPlaceNPC(xpick(['quest','quest','lost','scholar','peddler','rival']));
  if(EX.gate) xWallProp('lever',EX.gate.lever,EX.gate.side,{gate:true, on:false});
  if(F.gauntlet) xPlaceGauntlet();
  if(F.cache) for(let n=1+xri(0,1);n>0;n--) xPlaceCache();
  if(F.mimic) xMakeMimic();
  if(F.totem) xPlaceTotem();
  xPlaceKeys();
  xPlaceClosetTriggers();
  if(XRUN) for(const q of XRUN.quests) if(!q.done&&!q.placed&&q.depth===d) xPlaceQuestItem(q);
  if(XRUN&&XRUN.chute===d) xPlaceChute();
  if(EX.branch) xFillBranch();
  // every floor holds at least two things beyond the closet: top it up when a planned one did not fit
  for(let k=0;k<4&&!EX.branch&&xRealized().length<2;k++){ const have=xRealized();
    if(!have.includes('cache')) xPlaceCache(); else if(!have.includes('npc')) xPlaceNPC(xpick(['quest','lost','scholar'])); else if(!have.includes('gauntlet')) xPlaceGauntlet(); else xMakeMimic(); }
  EX.bellAt=d>=3&&!EX.branch?Math.max(140,230+xri(0,40)-d*4):0;   // stay too long and the Executioner comes
}
// what a floor really ended up holding (a planned feature may not have fitted)
function xRealized(){ const out=new Set();
  for(const p of EX.props){ if(p.kind==='npc'&&p.role!=='hermit') out.add('npc'); if(p.kind==='cache') out.add('cache'); if(p.kind==='blade'||p.kind==='jet') out.add('gauntlet'); if(p.kind==='totem') out.add('totem'); }
  if(EX.puzzle) out.add('puzzle'); if(EX.groups.some(g=>g.mini)) out.add('mini'); if(EX.groups.some(g=>g.boss)) out.add('boss'); if(EX.gate) out.add('gate'); if(EX.chests.some(c=>c.mimic||c.giant)) out.add('mimic');
  if(EX.rooms.some(r=>r.side==='vault')) out.add('vault'); if([...EX.doors.values()].some(d=>d.lock==='bronze')) out.add('lock');
  return [...out]; }
// the secret closet: what it hides was chosen in the plan
function xFillCloset(r){ const c=xi(r.cx,r.cy), corner=()=>xRoomCells(r).find(x=>x!==c&&!EX.taken.has(x)&&!nearDoor(x));
  switch(r.content){
    case 'lore': xProp('pedestal',c,{lore:xpick(unreadLore().length?unreadLore():LORE).id}); { const k=corner(); if(k!=null) xItem('mat',k,{mat:'shard',n:1}); } break;
    case 'shrine': xProp('pedestal',c,{orb:xpick(Object.keys(PERM))}); break;
    case 'mats': for(const m of ['ore','essence','shard']){ const k=m==='ore'?c:corner(); if(k!=null) xItem('mat',k,{mat:m,n:m==='shard'?1:2}); } break;
    case 'merchant': xPlaceMerchant(r,'black',c); break;
    case 'bonus': { xChest(c,{rich:true,legend:true}); const k=corner(); if(k!=null){ const id=xpick(['corruptknight','dungeonwarden','alchemist','bonecollector']); EX.groups.push(xMiniGroup(id,k,{beh:'guard'})); } } break;
    case 'branch': xProp('hstair',c,{solid:false}); break;
    default: xChest(c,{rich:true});
  } }
// a vault: rich chests, sometimes a Giant Mimic among them or a dormant Arcane Construct
function xFillVault(r){ const cs=xRoomCells(r).filter(c=>!nearDoor(c)).sort(()=>XR()-.5);
  const a=cs[0], b=cs[1], g=cs[2]; if(a!=null) xChest(a,{rich:true}); if(b!=null) xChest(b,{rich:true,legend:XR()<.25});
  if(r.content==='mimic'&&g!=null) xChest(g,{rich:true,giant:true});
  else if(r.content==='construct'&&g!=null){ const grp=xMiniGroup('construct',g,{beh:'guard'}); grp.dormant=true; grp.vault=r.id; EX.groups.push(grp); }
  else if(g!=null) xItem('gold',g,{n:Math.round(60+25*EX.depth)}); }
// a prison cell: someone inside, and a guard nearby with the key
function xFillCell(r){ const c=xi(r.cx,r.cy); const p=xPlaceNPCAt('prisoner',c); p.cell2=r.id;
  const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true}).sort((a,b)=>Math.hypot(a.cx-r.cx,a.cy-r.cy)-Math.hypot(b.cx-r.cx,b.cy-r.cy));
  const gr=rooms[0], gc=gr?xFreeCell(gr):-1;
  if(gc>=0){ const ids=makeEncounter(EX.depth)[0].slice(0,2); const grp=xGroup(ids,gc,'wander'); grp.carry=['key:bronze']; grp.guardOf='cell'; EX.groups.push(grp); } }

/* ---------------- merchants ----------------
   Stock is drawn when the merchant is placed and scales with depth: higher gear tiers, rarer
   cards, dearer prices. Each kind has its own services. */
const tierPrice=t=>[90,150,260,420][t]||420;
const gearPrice=id=>{ const G=GEAR[id]; return Math.round((G.legendary?900:tierPrice(G.tier||0))*(1+.04*EX.depth)); };
const cardPrice=c=>Math.round(({common:40,uncommon:80,rare:180,legendary:450,hero:900}[c.rarity]||80)*(1+.03*EX.depth));
function xStock(kind){ const d=EX.depth, out=[], gear=(fn,n)=>{ for(let k=0,tries=0;k<n&&tries<40;tries++){ const id=rollLoot(d+1,XR); if(id.startsWith('scroll:')||!fn(GEAR[id])||out.some(o=>o.id===id)) continue; out.push({kind:'gear',id,price:gearPrice(id)}); k++; } };
  if(kind==='weapon') gear(G=>G.slot==='weapon',3);
  if(kind==='armor') gear(G=>G.slot!=='weapon',3);
  if(kind==='card'||kind==='curio'){ const pool=kind==='curio'?CARD_LIST.filter(c=>['machine','summon'].includes(c.type)&&c.rarity!=='common'&&c.rarity!=='hero'):null;
    for(let k=0;k<4;k++){ const rare=XR()<.15+.02*d, c=pool?xpick(pool.filter(x=>rare?x.rarity!=='uncommon':x.rarity==='uncommon').concat(pool.slice(0,1))):rollCard({depth:d+2,min:rare?'rare':'uncommon'},XR); out.push({kind:'card',card:c,price:cardPrice(c)}); } }
  if(kind==='curio'&&XR()<.5){ const p=xpick(Object.keys(PERM)); out.push({kind:'perm',k:p,price:Math.round(650*(1+.03*d))}); }
  if(kind==='black'){ const leg=xpick(Object.keys(GEAR).filter(id=>GEAR[id].legendary)); out.push({kind:'gear',id:leg,price:Math.round(gearPrice(leg)*.6),shady:true});
    out.push({kind:'key',k:'skeleton',price:KEYS.skeleton.price},{kind:'key',k:'gold',price:KEYS.gold.price}); }
  if(kind==='goblin'){ out.push({kind:'bag',k:xpick(['draught','antidote']),price:BAG.draught.price},{kind:'bag',k:xpick(['smoke','oil','chart']),price:80},
      {kind:'key',k:'bronze',price:KEYS.bronze.price},{kind:'key',k:XR()<.5?'silver':'bronze',price:0},{kind:'mat',k:xpick(['ore','essence']),price:60}); out[3].price=KEYS[out[3].k].price; }
  if(kind==='weapon'||kind==='armor') out.push({kind:'mat',k:'ore',price:55});
  if(kind!=='goblin'&&kind!=='black') out.push({kind:'bag',k:'draught',price:BAG.draught.price});
  for(const o of out) o.price=Math.round(o.price*(1+.02*d));
  return out; }
function xPlaceMerchant(r,kind,cell){ const c=cell!=null?cell:xFreeSolid(r,true); if(c<0) return null; const M=MERCHANTS[kind];
  return xProp('merchant',c,{mkind:kind, name:M.who, title:M.name, look:M.look, stock:xStock(kind), used:{}}); }

/* ---------------- sanctuaries ---------------- */
function xPlaceSanctuary(r,theme){ const c=xFreeSolid(r,true); if(c<0) return null;
  const altar=xProp('altar',c,{theme, rested:false, attuned:false});
  for(const k of xRoomCells(r).filter(x=>{ const X=xcx(x), Y=xcy(x); return (X===r.x||X===r.x+r.w-1)&&(Y===r.y||Y===r.y+r.h-1)&&!nearDoor(x)&&!EX.taken.has(x); })) xProp('decor',k,{theme,solid:false});
  if(XR()<.5){ const h=xFreeSolid(r,true); if(h>=0) xPlaceNPCAt('hermit',h); } return altar; }

/* ---------------- minibosses on the map ---------------- */
function xMiniGroup(id,cell,o){ const g=xGroup(miniWave(id,EX.depth),cell,'wander'); return Object.assign(g,{mini:id, beh:MINI_MAP[id].beh, post:cell, route:null, ri:0, stealth:id==='assassin'},o||{}); }
function xPlaceMini(id){ const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true}).filter(r=>r!==EX.exit); if(!rooms.length) return;
  const g=xMiniGroup(id,xi(rooms[0].cx,rooms[0].cy));
  if(g.beh==='patrol'){ const route=rooms.sort(()=>XR()-.5).slice(0,3).map(r=>xi(r.cx,r.cy)); g.route=route; g.cell=route[0]; g.home=g.post=route[0]; }
  if(g.beh==='hunt'){ const far=rooms.sort((a,b)=>reach[xi(b.cx,b.cy)]-reach[xi(a.cx,a.cy)])[0]; g.cell=g.home=g.post=xi(far.cx,far.cy); g.huntT=35+XR()*35; }
  g.x=xw(g.cell); g.z=xz(g.cell); EX.taken.add(g.cell); EX.groups.push(g); }
// a lair: the Plague Alchemist in its lab, the Bone Collector under its bone pile, or an Arcane Construct over a hoard
function xPlaceLair(r,id){ const c=xFreeSolid(r,true); if(c<0) return;
  if(id==='bonecollector'){ xProp('bones',c,{loot:true}); const k=xAdj4(c).find(n=>EX.room[n]===r.id&&!EX.taken.has(n)); if(k!=null){ const g=xMiniGroup(id,k); g.dormant=true; g.risesFrom=c; EX.groups.push(g); EX.taken.add(k); } return; }
  xChest(c,{rich:true,legend:XR()<.2});
  if(id==='alchemist') for(let n=0;n<4;n++){ const k=xFreeCell(r); if(k>=0) xProp('puddle',k,{solid:false}); }
  const k=xAdj4(c).find(n=>EX.room[n]===r.id&&!EX.taken.has(n)); if(k!=null){ EX.groups.push(xMiniGroup(id,k)); EX.taken.add(k); } }

/* ---------------- keys ----------------
   Every bronze lock gets a bronze key somewhere you can reach (in a chest or lying on the floor);
   a boss door's key lies on a stand you can reach; a vault's key may be carried by the floor's
   miniboss, be a puzzle's reward, sit in a hidden cache, or not be here at all (bring one, buy
   one, or pick the lock). */
function xPlaceKeys(){
  const reach=xReach(); let bronze=0, vault=null;
  for(const [i,d] of EX.doors) if(d.state==='locked'){ if(d.lock==='bronze') bronze++; if(d.lock==='silver'||d.lock==='gold') vault=d.lock; }
  const carried=EX.groups.filter(g=>g.carry&&g.carry.includes('key:bronze')).length;
  for(let n=Math.max(0,bronze-carried);n>0;n--){ const ch=EX.chests.filter(c=>!c.open&&!c.key&&!c.mimic&&!c.giant&&reach[c.cell]>=0&&!c.rich);
    if(ch.length&&XR()<.5) xpick(ch).key='bronze'; else { const c=xReachableCell(reach,{notStart:true}); if(c>=0) xItem('key',c,{key:'bronze'}); } }
  if(EX.bossDoor){ const c=xReachableCell(reach,{room:true,notStart:true}); if(c>=0) xProp('keystand',c,{key:'boss',solid:false}); else { const k=xReachableCell(reach); if(k>=0) xItem('key',k,{key:'boss'}); } }
  if(vault){ const mini=EX.groups.find(g=>g.mini&&!g.dormant&&!g.vault), pz=EX.puzzle;
    if(mini){ mini.carry=(mini.carry||[]).concat('key:'+vault); }
    else if(pz) pz.key=vault;
    else if(XR()<(vault==='silver'?.65:.35)) xPlaceCache('key:'+vault); }
}

/* ---------------- people ---------------- */
function xPlaceNPCAt(kind,cell,o){ const K=NPC_KINDS[kind];
  return xProp('npc',cell,Object.assign({role:kind, name:xpick(K.names), title:K.title, look:xpick(K.looks), state:'idle'},o||{})); }
function xPlaceNPC(kind){ const reach=xReach(), rooms=xOpenRooms(reach).filter(r=>r!==EX.exit); if(!rooms.length) return;
  for(let k=0;k<10;k++){ const r=xpick(rooms), c=xFreeSolid(r,true); if(c<0) continue; const p=xPlaceNPCAt(kind,c), d=EX.depth;
    if(kind==='quest'){ p.item=xpick(NPC_KINDS.quest.items); p.where=XR()<.6?d:d+1; p.reward=xRollReward(d,[['gold',3],['gear',2],['bag',2],['perm',1],['mat',2],['key',1.5],['chute',1],['solution',1]]); }
    if(kind==='lost') p.reward=xRollReward(d,[['gold',2],['bag',2],['perm',1],['chute',1.5],['mat',1],['key',1]]);
    if(kind==='scholar'){ p.want=XR()<.5?'shard':'samples'; p.color=xpick(SIX); p.need=3; p.reward=xRollReward(d,[['perm',2],['lore',2],['card',2],['solution',1]],true); }
    if(kind==='peddler'){ const other=rooms.filter(x=>x!==r), rr=other.length?xpick(other):r, cc=xFreeCell(rr);
      if(cc>=0){ xItem('crate',cc,{owner:p.name}); const gc=xFreeCell(rr); if(gc>=0){ EX.groups.push(xGroup(makeEncounter(d)[0].slice(0,2),gc,'sleep')); EX.taken.add(gc); } } }
    if(kind==='rival'){ const far=xOpenRooms(reach,{notStart:true}).sort((a,b)=>Math.hypot(b.cx-r.cx,b.cy-r.cy)-Math.hypot(a.cx-r.cx,a.cy-r.cy))[0], tc=far?xFreeCell(far):-1;
      if(tc>=0){ p.target=xChest(tc,{rich:true,legend:XR()<.3,raced:true}); p.solid=true; p.x=xw(c); p.z=xz(c); p.path=[]; } }
    return p; } }

/* ---------------- traps you can see, mimics, caches ---------------- */
// a gauntlet on the way to the stairs: swinging blades in a corridor, or flame jets in a room
function xPlaceGauntlet(){ const dist=xbfs(EX.t,EX.doors,EX.down,false), path=[]; let cur=EX.up;
  for(let k=0;k<300&&cur!==EX.down;k++){ const nx=xAdj4(cur).filter(n=>dist[n]>=0&&dist[n]<dist[cur]).sort((a,b)=>dist[a]-dist[b])[0]; if(nx==null) break; path.push(nx); cur=nx; }
  const corr=path.filter(c=>EX.room[c]<0&&!EX.doors.has(c)&&!EX.taken.has(c)&&!EX.traps.some(t=>t.cell===c));
  let run=[]; for(const c of corr){ if(run.length&&!xAdj4(run[run.length-1]).includes(c)) run=[]; run.push(c); if(run.length>=5) break; }
  if(run.length>=5){ [run[0],run[2],run[4]].forEach((c,k)=>{ const ew=EX.t[c-1]!==T_ROCK&&EX.t[c+1]!==T_ROCK; xProp('blade',c,{solid:false, ph:k*.33, ew}); }); return; }
  const r=roomOf(path.find(c=>roomOf(c)&&roomOf(c)!==EX.start&&!roomOf(c).safe&&roomOf(c).role!=='puzzle')||EX.up); if(!r||r===EX.start) return;
  for(let n=0;n<3;n++){ const c=xFreeCell(r); if(c>=0) xProp('jet',c,{solid:false, ph:n*.33}); } }
// a hidden cache in a wall: found by searching or by standing still nearby
function xPlaceCache(force){ const reach=xReach(), rooms=xOpenRooms(reach); if(!rooms.length) return;
  const s=xWallSpot(xpick(rooms),(n)=>EX.doors.has(n)); if(!s) return;
  const loot=force||xweighted([['mat',4],['gold',2],['bag',2],['lore',1],['key:bronze',1],['key:skeleton',.3]]);
  xWallProp('cache',s[0],s[1],{loot, found:false}); }
function xMakeMimic(){ const ch=EX.chests.filter(c=>!c.rich&&!c.key&&!c.open); if(ch.length) xpick(ch).mimic=true; }
function xPlaceTotem(){ const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true}); for(let k=0;k<6&&rooms.length;k++){ const c=xFreeSolid(xpick(rooms),true); if(c>=0){ xProp('totem',c,{hp:2}); return; } } }
// the closet can also be opened by a loose floor stone or a switch hidden in a wall sconce elsewhere
function xPlaceClosetTriggers(){ const cl=EX.rooms.find(r=>r.closet); if(!cl) return; const reach=xReach(), rooms=xOpenRooms(reach);
  if(!rooms.length) return;
  if(XR()<.35){ const c=xReachableCell(reach,{room:true}); if(c>=0) xProp('loose',c,{solid:false, opens:cl.id, found:false}); }
  else if(XR()<.45){ const near=rooms.sort((a,b)=>Math.hypot(a.cx-cl.cx,a.cy-cl.cy)-Math.hypot(b.cx-cl.cx,b.cy-cl.cy))[0], s=near&&xWallSpot(near,n=>EX.doors.has(n));
    if(s) xWallProp('switch',s[0],s[1],{opens:cl.id, found:false}); } }
function xPlaceQuestItem(q){ const reach=xReach(), c=xReachableCell(reach,{notStart:q.depth===EX.depth}); if(c<0) return; q.placed=true; xItem('quest',c,{qid:q.id}); }
function xPlaceChute(){ const c=xAdj4(EX.up).concat(xRoomCells(EX.start)).find(n=>EX.room[n]===EX.start.id&&n!==EX.up&&!EX.taken.has(n)&&!nearDoor(n)); if(c!=null) xProp('chute',c,{solid:false}); }
// the hidden sanctum: a guarded legendary hoard, a tale, and quiet
function xFillBranch(){ const reach=xReach(), rooms=xOpenRooms(reach,{notStart:true});
  const r=rooms.sort((a,b)=>b.w*b.h-a.w*a.h)[0]; if(r){ const c=xFreeCell(r); if(c>=0){ xChest(c,{rich:true,legend:true}); const k=xAdj4(c).find(n=>EX.room[n]===r.id&&!EX.taken.has(n)); if(k!=null){ EX.groups.push(xMiniGroup(xpick(['corruptknight','alchemist','construct']),k,{beh:'guard'})); EX.taken.add(k); } } }
  const r2=xpick(rooms); if(r2){ const c=xFreeSolid(r2,true); if(c>=0) xProp('pedestal',c,{lore:xpick(LORE).id}); }
  const r3=xpick(rooms); if(r3){ const c=xFreeCell(r3); if(c>=0) xChest(c,{rich:true}); } }
// what you hear as you arrive: hints, never the secrets themselves
function xArrival(){ const F=EX.plan?EX.plan.feats:{};
  if(EX.branch){ xLog('A hidden stair has led you somewhere older and quieter.','good'); return; }
  if(F.merchant) xLog('Somewhere a merchant calls out prices.','dim');
  if(F.sanct) xLog('A calm warmth lingers somewhere on this floor.','good');
  const mini=EX.groups.find(g=>g.mini&&!g.dormant); if(mini) xLog(MINI_MAP[mini.mini].hint,'warn');
  if(EX.rooms.some(r=>r.side==='vault')) xLog('Somewhere, a heavy lock waits for its key.','dim');
  if(XRUN) for(const q of XRUN.quests) if(!q.done&&q.depth===EX.depth&&q.kind==='fetch') xLog(q.giver+'’s '+q.item+' should be on this floor.','loot');
  if(XRUN&&XRUN.chute===EX.depth) xLog('The chute you were promised is beside the stairs up.','good');
  if(XRUN) XRUN.solutionUsed=false; }

/* ---------------- puzzles ----------------
   One puzzle room at most per floor. Each is built solved, then scrambled, so it can always be
   solved; solving it opens a reward at the room's heart (a rich chest, often a key, sometimes a
   blessing or a tale).
   - plates: push the stone blocks onto the pressure plates (a rune in the corner puts them back)
   - statues: turn every statue to face the altar
   - mirrors: turn the mirrors so the light reaches the crystal
   - runes: touch the runestones in the order of the colour wheel the tablet describes
   - levers: pull the three levers in the order scratched into a wall elsewhere on the floor
   - trial: a fight with a rule (minibosses.js) */
const DIRV=[[0,-1],[1,0],[0,1],[-1,0]];   // north, east, south, west
const WHEEL_ICON={fire:'🔥',frost:'❄',storm:'⚡',verdant:'🌿',light:'☀',shadow:'☾'};
function xPlacePuzzle(r){
  const kinds=['plates','statues','mirrors','runes','levers','trial'].sort(()=>XR()-.5);
  for(const k of kinds){ const snap={props:EX.props.length, taken:new Set(EX.taken)};
    const pz=PUZZLE_BUILD[k](r); if(pz){ EX.puzzle=Object.assign(pz,{kind:k, room:r.id, solved:false}); return; }
    // undo a half-built attempt
    for(const p of EX.props.splice(snap.props)){ if(p.wall) EX.wallAt.delete(p.cell); else if(EX.propAt.get(p.cell)===p) EX.propAt.delete(p.cell); }
    EX.taken=snap.taken; }
  r.role=null; }
const PUZZLE_BUILD={
  plates(r){ if(r.w<5||r.h<5) return null; const cols=[]; for(let x=r.x+1;x<=r.x+r.w-2;x++) cols.push(x); cols.sort(()=>XR()-.5);
    const pick2=cols.find(a=>cols.some(b=>Math.abs(a-b)>=2)), c2=cols.find(b=>Math.abs(b-pick2)>=2); if(pick2==null||c2==null) return null;
    const plates=[], blocks=[];
    for(const x of [pick2,c2]){ const pl=xi(x,r.y+1), bl=xi(x,r.y+3), from=xi(x,r.y+4);
      if([pl,bl,from].some(c=>EX.taken.has(c)||nearDoor(c)&&c!==from)) return null;
      plates.push(xProp('plate',pl,{solid:false})); if(!xSolidOK(bl)) return null; blocks.push(xProp('block',bl,{home:bl})); }
    const corner=xRoomCells(r).filter(c=>xcy(c)===r.y+r.h-1&&!EX.taken.has(c)&&!nearDoor(c)&&!plates.some(p=>xcx(p.cell)===xcx(c)));
    if(!corner.length) return null; xProp('reset',xpick(corner),{solid:false});
    return {plates,blocks}; },
  statues(r){ if(r.w<5||r.h<5) return null; const core=xi(r.cx,r.cy); if(!xSolidOK(core)) return null; xProp('core',core,{});
    const spots=xInterior(r).filter(c=>c!==core&&!EX.taken.has(c)&&!nearDoor(c)&&Math.abs(xcx(c)-r.cx)!==Math.abs(xcy(c)-r.cy)).sort(()=>XR()-.5), st=[];
    for(const c of spots){ if(st.length>=3) break; if(st.some(s=>Math.abs(xcx(s.cell)-xcx(c))+Math.abs(xcy(s.cell)-xcy(c))<2)) continue; if(!xSolidOK(c)) continue;
      const dx=r.cx-xcx(c), dy=r.cy-xcy(c), want=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
      st.push(xProp('statue',c,{want, face:(want+xri(1,3))%4})); }
    return st.length>=3?{statues:st}:null; },
  mirrors(r){ if(r.w<6||r.h<4) return null;
    for(let tries=0;tries<20;tries++){ const y1=xri(r.y+1,r.y+r.h-2), y2=xri(r.y,r.y+r.h-1); if(y2===y1) continue;
      const xa=xri(r.x+1,r.x+r.w-4), xb=xri(xa+2,r.x+r.w-2), wall=xi(r.x-1,y1);
      if(EX.t[wall]!==T_ROCK||EX.wallAt.has(wall)) continue;
      const lane=[]; for(let x=r.x;x<xa;x++) lane.push(xi(x,y1)); for(let y=Math.min(y1,y2)+1;y<Math.max(y1,y2);y++) lane.push(xi(xa,y)); for(let x=xa+1;x<xb;x++) lane.push(xi(x,y2));
      const A=xi(xa,y1), Bc=xi(xa,y2), C=xi(xb,y2);
      if(lane.concat([A,Bc,C]).some(c=>EX.taken.has(c))||[A,Bc,C].some(nearDoor)) continue;
      if(!xSolidOK(A)) continue; const ma=xProp('mirror',A,{want:y2>y1?'\\':'/'}); ma.o=ma.want==='/'?'\\':'/';
      if(!xSolidOK(Bc)){ EX.props.pop(); EX.propAt.delete(A); EX.taken.delete(A); continue; }
      const mb=xProp('mirror',Bc,{want:y2>y1?'\\':'/'}); mb.o=mb.want==='/'?'\\':'/';
      if(!xSolidOK(C)) return null; xProp('crystal',C,{});
      xWallProp('emitter',wall,xi(r.x,y1),{});
      return {emit:xi(r.x,y1), mirrors:[ma,mb], target:C}; }
    return null; },
  runes(r){ const start=xpick(SIX), seq=[start]; while(seq.length<4) seq.push(BEATS[seq[seq.length-1]]);
    const spots=xInterior(r).filter(c=>!EX.taken.has(c)&&!nearDoor(c)).sort(()=>XR()-.5), stones=[];
    for(const c of spots){ if(stones.length>=4) break; if(stones.some(s=>Math.abs(xcx(s.cell)-xcx(c))+Math.abs(xcy(s.cell)-xcy(c))<2)) continue; if(!xSolidOK(c)) continue; stones.push(xProp('runestone',c,{color:seq[stones.length]})); }
    if(stones.length<4) return null;
    const t=xFreeSolid(r,false); if(t<0) return null; xProp('tablet',t,{text:'Begin with '+COLORS[start].name+' '+WHEEL_ICON[start]+'. Then touch what it overcomes, and so on, four in all.'});
    return {seq, stones, step:0}; },
  levers(r){ const marks=['☀','☾','✦'], order=marks.slice().sort(()=>XR()-.5), levers=[];
    for(const m of marks){ const s=xWallSpot(r,(n)=>EX.doors.has(n)||levers.some(l=>Math.abs(xcx(l.cell)-xcx(n))+Math.abs(xcy(l.cell)-xcy(n))<2)); if(!s) return null; levers.push(xWallProp('plever',s[0],s[1],{sym:m,on:false})); }
    // the order is scratched into a wall in another room you can reach
    const reach=xReach(), others=xOpenRooms(reach).filter(x=>x!==r), wr=others.length?xpick(others):null, ws=wr&&xWallSpot(wr,n=>EX.doors.has(n));
    if(ws) xWallProp('inscription',ws[0],ws[1],{text:'Scratched into the stone: '+order.join(' then ')+'.'});
    return {order, levers, step:0}; },
  trial(r){ const c=xi(r.cx,r.cy); if(!xSolidOK(c)) return null; xProp('trialaltar',c,{rule:xpick(['order','survive','switches'])}); return {}; },
};
// a puzzle is solved: something grinds open at its heart
function xPuzzleSolved(){ const pz=EX.puzzle; if(!pz||pz.solved) return; pz.solved=true; const r=EX.rooms[pz.room];
  xSfx('chime'); xSfx('grind'); xLog('Something clicks into place, and stone grinds open.','good'); tip('Puzzle solved!');
  const around=xRoomCells(r).filter(c=>!EX.taken.has(c)).sort((a,b)=>Math.hypot(xcx(a)-r.cx,xcy(a)-r.cy)-Math.hypot(xcx(b)-r.cx,xcy(b)-r.cy));
  if(around[0]!=null){ const ch=xChest(around[0],{rich:true,legend:XR()<.12}); if(pz.key) ch.key=pz.key; else if(XR()<.4) ch.key=XR()<.25&&EX.depth>=5?'gold':'silver'; xMeshChest(ch); }
  const roll=XR(); if(around[1]!=null){ if(roll<.15) xMeshProp(xProp('pedestal',around[1],{orb:xpick(Object.keys(PERM))})); else if(roll<.35) xMeshProp(xProp('pedestal',around[1],{lore:xpick(unreadLore().length?unreadLore():LORE).id})); }
  xUpdateVis(); }
// beam of light from the emitter, bounced by mirrors; returns the cells it crosses and whether it hit the crystal
function xTraceBeam(){ const pz=EX.puzzle; let c=pz.emit, dx=1, dy=0; const cells=[]; let hit=false;
  for(let k=0;k<80;k++){ if(c<0||EX.t[c]===T_ROCK||EX.doors.has(c)) break; const p=EX.propAt.get(c);
    if(p&&p.kind==='crystal'){ hit=true; cells.push(c); break; }
    if(p&&p.kind==='mirror'){ if(p.o==='/'){ const t=dx; dx=-dy; dy=-t; } else { const t=dx; dx=dy; dy=t; } }
    else if(p&&p.solid) break;
    cells.push(c); const x=xcx(c)+dx, y=xcy(c)+dy; if(x<0||y<0||x>=XN||y>=XN) break; c=xi(x,y); }
  return {cells,hit}; }
function xCheckPuzzle(){ const pz=EX.puzzle; if(!pz||pz.solved) return;
  if(pz.kind==='plates'&&pz.plates.every(pl=>pz.blocks.some(b=>b.cell===pl.cell))) xPuzzleSolved();
  if(pz.kind==='statues'&&pz.statues.every(s=>s.face===s.want)) xPuzzleSolved();
  if(pz.kind==='mirrors'){ const b=xTraceBeam(); xMeshBeam(b.cells); if(b.hit) xPuzzleSolved(); } }

/* ---------------- how things look ----------------
   Built from boxes, cones and the hand-drawn sprites, in the same style as the doors and chests.
   Floor things stand on their cell; wall things sit on the face of the rock they are set in. */
const xGlowMat=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
const xCone=(r,h,m,x,y,z,seg)=>{ const o=new THREE.Mesh(new THREE.ConeGeometry(r,h,seg||6),m); o.position.set(x,y,z); return o; };
const xBall=(r,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),m); o.position.set(x,y,z); return o; };
const xCyl=(r,h,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),m); o.position.set(x,y,z); return o; };
const THEME_COL={shrine:0xfff2c0, temple:0xf2c94c, crystal:0x8fe4ff, camp:0xff9a3a, garden:0x6fdc7a, arcane:0xb48cff};
const PERM_COL={vigor:0xff5d6c, might:0xff9a3a, insight:0x8fe4ff, fortune:0xf2c94c};
function xKeyMesh(col){ const g=new THREE.Group(), m=xMat(new THREE.Color(col),{emissive:new THREE.Color(col).multiplyScalar(.35)});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.05,6,12),m); ring.position.set(-.22,0,0); g.add(ring, xBox(.42,.07,.07,m,.1,0,0), xBox(.06,.14,.07,m,.24,-.07,0), xBox(.06,.1,.07,m,.14,-.05,0)); return g; }
function xNameMark(txt,col){ const s=xTextSprite(txt,col); s.scale.set(.7,.7,1); return s; }
function xMeshProp(p){
  if(!X3||!X3.group) return null; const g=new THREE.Group(); let px=xw(p.cell), pz=xz(p.cell);
  if(p.wall){ const dx=xcx(p.front)-xcx(p.cell), dz=xcy(p.front)-xcy(p.cell); px+=dx*(XCS/2+.02); pz+=dz*(XCS/2+.02); g.rotation.y=Math.atan2(dx,dz); }
  g.position.set(px,0,pz);
  const stone=xMat(0x6e6a64), dark=xMat(0x2a2a30), wood=xMat(0x7a4a22), gold=xMat(0xf2c94c,{emissive:0x402a08});
  switch(p.kind){
    case 'npc': case 'merchant': {
      p.spr=xSprite(()=>lookSprite(p.look,'front',true),2.2); g.add(p.spr);
      if(p.kind==='merchant'){ g.add(xBox(1.5,.62,.45,wood,0,.31,.62), xBox(1.6,.08,.55,xMat(0x4e2e16),0,.64,.62), xCyl(.04,1.3,dark,.72,.65,.62), xBall(.12,xGlowMat(0xffd08a),.72,1.35,.62)); }
      p.mark=xNameMark(p.kind==='merchant'?'$':'!',p.kind==='merchant'?'#f2c94c':'#8fe4ff'); p.mark.position.set(0,2.75,0); g.add(p.mark); break; }
    case 'altar': { const c=THEME_COL[p.theme]||0xfff2c0; g.add(xBox(1.3,.7,.8,stone,0,.35,0), xBox(1.45,.12,.95,xMat(0x8a8478),0,.72,0)); p.orbMesh=xBall(.22,xGlowMat(c),0,1.15,0); g.add(p.orbMesh);
      const halo=new THREE.Mesh(new THREE.TorusGeometry(.4,.03,6,20),xGlowMat(c)); halo.rotation.x=Math.PI/2; halo.position.y=.8; g.add(halo); break; }
    case 'decor': { const c=THEME_COL[p.theme]||0xfff2c0;
      if(p.theme==='crystal'||p.theme==='arcane') for(let k=0;k<3;k++){ const o=xCone(.12,.7+k*.2,xGlowMat(c,{transparent:true,opacity:.85}),(k-1)*.25,.35+k*.1,(k%2)*.2,4); o.rotation.z=(k-1)*.3; g.add(o); }
      else if(p.theme==='camp'){ g.add(xBox(.8,.12,.18,wood,0,.08,0), xBox(.18,.12,.8,wood,0,.1,0)); const f=xCone(.22,.6,xGlowMat(0xff9a3a,{transparent:true,opacity:.9}),0,.4,0); p.flame=f; g.add(f); }
      else if(p.theme==='garden'){ g.add(xBall(.32,xMat(0x2e7a4a),0,.3,0), xBall(.22,xMat(0x3f9a5a),.25,.25,.2)); for(let k=0;k<4;k++) g.add(xBall(.06,xGlowMat([0xff6a9a,0xffffff,0xc08aff,0xff9a3a][k]),Math.cos(k*1.6)*.4,.12,Math.sin(k*1.6)*.4)); }
      else g.add(xBox(.4,1.6,.4,stone,0,.8,0), xBox(.55,.12,.55,xMat(0x8a8478),0,1.62,0));
      break; }
    case 'statue': { g.add(xBox(.8,.3,.8,stone,0,.15,0), xCyl(.22,.9,xMat(0x9a958a),0,.75,0), xBall(.2,xMat(0x9a958a),0,1.35,0));
      const arm=xCone(.1,.45,xMat(0xf2c94c,{emissive:0x403010}),0,1.1,-.35); arm.rotation.x=-Math.PI/2; g.add(arm); p.rot=g; g.rotation.y=-p.face*Math.PI/2; break; }
    case 'core': { g.add(xBox(1,.5,1,dark,0,.25,0)); const s=xBall(.18,xGlowMat(0xf2c94c),0,.75,0); g.add(s); p.glow=s; break; }
    case 'mirror': { const fr=new THREE.Group(); fr.add(xBox(1.3,1.2,.06,xMat(0xcfd8e6,{shininess:80,specular:0xffffff,emissive:0x202830}),0,.85,0), xBox(1.4,.08,.12,xMat(0x6e5418),0,.25,0)); fr.rotation.y=p.o==='/'?Math.PI/4:-Math.PI/4; p.rot=fr; g.add(fr, xBox(.3,.25,.3,dark,0,.12,0)); break; }
    case 'crystal': { const m=xGlowMat(0x8fe4ff,{transparent:true,opacity:.75}); g.add(xCone(.25,1.1,m,0,.55,0,5), xCone(.14,.6,m,.25,.3,.1,5)); p.glowMat=m; break; }
    case 'emitter': { g.add(xBox(.5,.5,.08,dark,0,.9,0)); const e=xBall(.14,xGlowMat(0xfff2a0),0,.9,.06); g.add(e); break; }
    case 'runestone': { g.add(xBox(.6,1.15,.4,stone,0,.58,0)); const m=xGlowMat(new THREE.Color(COLORS[p.color].c),{transparent:true,opacity:.45}); const face=xBox(.4,.4,.02,m,0,.8,.21); g.add(face); p.glowMat=m; break; }
    case 'tablet': { const s=xBox(1,1.1,.18,xMat(0x8a8478),0,.6,0); s.rotation.x=-.2; g.add(s); for(let k=0;k<4;k++) g.add(xBox(.7,.04,.02,xMat(0x3a3630),0,.35+k*.18,.12-k*.035)); break; }
    case 'inscription': { g.add(xBox(1.1,.6,.03,xMat(0xb8b0a0),0,1,0)); for(let k=0;k<3;k++) g.add(xBox(.8,.04,.04,dark,0,.85+k*.15,.02)); break; }
    case 'plever': case 'lever': case 'switch': {
      g.add(xBox(.4,.5,.06,dark,0,.9,0));
      if(p.kind==='switch'){ g.add(xBox(.12,.25,.15,xMat(0x6e5418),0,1.2,.08)); p.flame=xCone(.08,.2,xGlowMat(0xffb060),0,1.42,.1); g.add(p.flame); }
      const h=new THREE.Group(); h.position.set(0,.9,.06); h.add(xBox(.07,.45,.07,xMat(0x8f99a3),0,.22,0), xBall(.08,p.kind==='plever'?xGlowMat(0xf2c94c):xMat(0xff5d6c),0,.46,0)); g.add(h); p.handle=h; h.visible=p.kind!=='switch';
      if(p.sym){ const t=xNameMark(p.sym,'#f2c94c'); t.position.set(0,1.45,.1); t.scale.set(.5,.5,1); g.add(t); }
      break; }
    case 'plate': g.add(xBox(1.3,.06,1.3,xMat(0x8a7a4a,{emissive:0x201808}),0,.03,0)); p.top=g.children[0]; break;
    case 'reset': { const r=new THREE.Mesh(new THREE.TorusGeometry(.45,.05,4,16),xGlowMat(0x7fd4ff)); r.rotation.x=Math.PI/2; r.position.y=.06; g.add(r); break; }
    case 'block': g.add(xBox(1.55,1.4,1.55,xMat(0x77736a),0,.7,0), xBox(1.6,.1,1.6,xMat(0x5a5650),0,1.42,0)); break;
    case 'trialaltar': { g.add(xBox(1.2,.7,1.2,dark,0,.35,0)); p.flame=xCone(.3,.7,xGlowMat(0xff5d6c,{transparent:true,opacity:.85}),0,1.05,0); g.add(p.flame); break; }
    case 'blade': { const pv=new THREE.Group(); pv.position.y=XWALL-.1; pv.add(xBox(.06,1.1,.06,xMat(0x5c656e),0,-.55,0)); const bl=xBox(.7,.28,.05,xMat(0xc7d0d8,{shininess:80,specular:0xffffff}),0,-1.15,0); pv.add(bl); g.add(pv); p.pivot=pv; if(!p.ew) g.rotation.y=Math.PI/2; break; }
    case 'jet': { g.add(xBox(.9,.05,.9,dark,0,.03,0)); const f=xCone(.32,1.6,xGlowMat(0xff7a2a,{transparent:true,opacity:.85}),0,.8,0); f.visible=false; g.add(f); p.flame=f; break; }
    case 'totem': { g.add(xCyl(.12,1.5,wood,0,.75,0), xBall(.25,xMat(0xe8e0c8),0,1.62,0)); for(const s of [-.09,.09]) g.add(xBall(.05,xGlowMat(0xff3a4a),s,1.65,.2)); break; }
    case 'cache': { const m=xGlowMat(0xf2c94c,{transparent:true,opacity:.7}); g.add(xBox(.5,.35,.05,dark,0,.5,0), xBox(.36,.22,.06,m,0,.5,.01)); break; }
    case 'loose': { const m=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.14}); const t=xBox(1.7,.02,1.7,m,0,.05,0); g.add(t); p.top=t; p.mat=m; break; }
    case 'pedestal': { g.add(xBox(.5,.9,.5,stone,0,.45,0), xBox(.7,.1,.7,xMat(0x8a8478),0,.92,0));
      if(p.orb){ const o=xBall(.2,xGlowMat(PERM_COL[p.orb]||0xffffff),0,1.25,0); g.add(o); p.glow=o; } else { const sc=xBox(.45,.06,.32,xMat(0xd9dee2),0,1.0,0); g.add(sc); p.glow=sc; } break; }
    case 'hstair': case 'chute': { g.add(xBox(XCS*.7,.3,XCS*.7,xMat(0x050507),0,.02,0)); const r=new THREE.Mesh(new THREE.TorusGeometry(.65,.06,6,20),xGlowMat(p.kind==='chute'?0x8fe4ff:0xb48cff)); r.rotation.x=Math.PI/2; r.position.y=.2; g.add(r); p.ring=r;
      if(p.kind==='chute') for(let k=-1;k<=1;k++) g.add(xBox(1.3,.05,.06,xMat(0x5c656e),0,.18,k*.4)); break; }
    case 'bones': for(let k=0;k<9;k++){ const b=xBox(.12+XR()*.2,.08,.08,xMat(0xe8e0c8),(XR()-.5)*.9,.06+XR()*.3,(XR()-.5)*.9); b.rotation.y=XR()*3; g.add(b); } g.add(xBall(.16,xMat(0xe8e0c8),.1,.45,0)); break;
    case 'puddle': { const m=new THREE.MeshBasicMaterial({color:0x8fd14f,transparent:true,opacity:.35}); const c=new THREE.Mesh(new THREE.CircleGeometry(.6,12),m); c.rotation.x=-Math.PI/2; c.position.y=.05; g.add(c); break; }
    case 'keystand': { g.add(xBox(.4,.8,.4,stone,0,.4,0)); const k=xKeyMesh(KEYS[p.key].col); k.position.y=1.15; g.add(k); p.spin=k; break; }
  }
  g.visible=false; p.mesh=g; X3.group.add(g); return g; }
function xMeshItem(it){ if(!X3||!X3.group) return null; const g=new THREE.Group(); g.position.set(xw(it.cell),0,xz(it.cell));
  let m;
  if(it.kind==='key') m=xKeyMesh(KEYS[it.key].col);
  else if(it.kind==='mat'){ m=xCone(.18,.4,xGlowMat(new THREE.Color(MATS[it.mat].col)),0,0,0,4); }
  else if(it.kind==='crate'){ m=new THREE.Group(); m.add(xBox(.7,.55,.55,xMat(0x8a5a32),0,0,0), xBox(.74,.06,.6,xMat(0x4e3420),0,.1,0)); }
  else if(it.kind==='gold'){ m=new THREE.Group(); for(let k=0;k<5;k++) m.add(xCyl(.14,.05,xMat(0xf2c94c,{emissive:0x402a08}),(k%3-1)*.2,-.12+k*.05,(k%2)*.15)); }
  else { m=new THREE.Group(); m.add(xBall(.2,xMat(0x8a5a32),0,0,0), xBox(.12,.08,.12,xMat(0xf2c94c),0,.18,0)); }
  m.position.y=.55; g.add(m); it.spin=m; g.visible=false; it.mesh=g; X3.group.add(g); return g; }
function xMeshChest(ch){ if(typeof xChestMesh==='function'&&X3&&X3.group) X3.group.add(xChestMesh(ch)); }
// the mirrors' beam, rebuilt whenever a mirror turns
function xMeshBeam(cells){ if(!X3||!X3.group) return; if(EX.beam){ X3.group.remove(EX.beam); EX.beam.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  const g=new THREE.Group(), m=xGlowMat(0xfff2a0,{transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
  for(let k=0;k<cells.length;k++){ const a=cells[k], b=cells[k+1]; const ax=xw(a), az=xz(a), bx=b!=null?xw(b):ax, bz=b!=null?xz(b):az;
    const len=Math.hypot(bx-ax,bz-az)||.4, s=xBox(len,.08,.08,m,(ax+bx)/2,.95,(az+bz)/2); s.rotation.y=-Math.atan2(bz-az,bx-ax); g.add(s); }
  g.visible=true; EX.beam=g; X3.group.add(g); }
// all of a floor's meshes, called by explore.js when it builds the scene
function xBuildProps(){ for(const p of EX.props) xMeshProp(p); for(const it of EX.items) xMeshItem(it); EX.beam=null;
  if(EX.puzzle&&EX.puzzle.kind==='mirrors') xMeshBeam(xTraceBeam().cells); }

/* ---------------- walking into things ---------------- */
const xCanAct=()=>{ const now=performance.now(); if(now<(EX.actT||0)) return false; EX.actT=now+350; return true; };
// explore.js asks this before its own rules: false = blocked, undefined = carry on as usual
function xBumpExtra(c,front){
  if(c<0) return;
  const w=EX.wallAt.get(c); if(w){ if(front&&(w.found!==false||w.kind==='switch')&&xCanAct()) xInteract(w); return false; }
  const d=EX.doors.get(c); if(d&&d.state==='locked'){ if(front&&xCanAct()) xTryUnlock(c,d); return false; }
  const p=EX.propAt.get(c);
  if(p&&p.solid&&!p.gone){ if(front){ if(p.kind==='block') xPushBlock(p); else if(xCanAct()) xInteract(p); } return false; }
}
// stepping onto a cell
function xEnterExtra(c){
  const it=EX.itemAt.get(c); if(it) xPickup(it);
  for(const p of EX.props){ if(p.cell!==c||p.wall||p.gone) continue;
    if(p.kind==='reset') xResetBlocks();
    if(p.kind==='keystand'&&!p.taken){ p.taken=true; if(p.spin) p.spin.visible=false; addKey(p.key); xLog('You take the '+KEYS[p.key].name+'.','good'); xSfx('unlock'); }
    if(p.kind==='hstair') return xEnterBranch();
    if(p.kind==='chute') return xFall(1,'You drop down the chute and slide a floor deeper.');
    if(p.kind==='loose'&&!p.done){ p.stand=0; xSfx('click'); if(p.top) p.top.position.y=.01; } }
  const r=roomOf(c);
  if(r&&r.safe&&!EX.msgT['safe'+r.id]){ EX.msgT['safe'+r.id]=1; xLog(r.role==='sanctuary'?'A ward hums here. Nothing hostile will enter.':'The merchant’s wards keep monsters out of this room.','good'); }
}
function xTryUnlock(c,d){ const L=LOCKS[d.lock];
  if(d.lock==='gate'&&keyN('gold')<1){ xSay('gate','A shortcut gate. Its lever is on the far side, or a gold key turns its lock.'); return; }
  let used=keyN(L.key)>0?L.key:d.lock!=='boss'&&keyN('skeleton')>0?'skeleton':null;
  if(!used){ xSay('lock'+c,'The '+L.name+' is locked. You need a '+KEYS[L.key].name+(L.pick?', or pick the lock (E)':'')+'.'); xSfx('click'); return; }
  XRUN.keys[used]--; xUnlock(c,d,'You open the '+L.name+' with a '+KEYS[used].name+(used==='skeleton'?'; it crumbles to dust':'')+'.'); }
function xUnlock(c,d,msg){ d.state='open'; d.lock=null; if(d.leaf) d.leaf.visible=false; xSfx('unlock'); xLog(msg,'good'); xUpdateVis(); xHud();
  const r=xAdj4(c).map(roomOf).find(x=>x&&x.side==='vault');
  if(r) for(const g of EX.groups) if(g.dormant&&g.vault===r.id){ g.dormant=false; g.state='chase'; g.beh='guard'; xLog('An Arcane Construct grinds awake inside the vault!','warn'); xSfx('grind'); } }
function xFoundDoor(i,d){ d.state='closed'; if(d.leaf) d.leaf.visible=true; const w=EX.wIdx.get(i);
  if(w){ w[0].setMatrixAt(w[1],new THREE.Matrix4().makeScale(0,0,0)); w[0].instanceMatrix.needsUpdate=true; EX.wIdx.delete(i); } EX.seen[i]=1; }
function xOpenCloset(id,how){ let n=0; for(const [i,d] of EX.doors) if(d.state==='secret'&&xAdj4(i).some(c=>EX.room[c]===id)){ xFoundDoor(i,d); n++; }
  if(n){ xLog(how,'good'); xSfx('grind'); xUpdateVis(); } return n; }
function xPushBlock(p){ const now=performance.now(); if(now<(p.pushT||0)) return; const [dx,dy]=EX.moveDir||[0,0]; if(!dx&&!dy) return;
  const to=xi(xcx(p.cell)+dx,xcy(p.cell)+dy), r=roomOf(p.cell);
  const ok=to>=0&&EX.room[to]===(r?r.id:-2)&&!xSolid(to)&&!EX.itemAt.has(to)&&!EX.chests.some(c=>c.cell===to)&&!EX.groups.some(g=>g.cell===to);
  if(!ok){ xSay('block','The block will not move that way.'); return; }
  p.pushT=now+260; EX.propAt.delete(p.cell); EX.taken.delete(p.cell); p.cell=to; EX.propAt.set(to,p); EX.taken.add(to);
  p.mesh.position.set(xw(to),0,xz(to)); xSfx('grind'); xCheckPuzzle(); }
function xResetBlocks(){ const pz=EX.puzzle; if(!pz||pz.kind!=='plates'||pz.solved) return; let moved=0;
  for(const b of pz.blocks){ if(b.cell===b.home||xSolid(b.home)&&EX.propAt.get(b.home)!==b) continue; EX.propAt.delete(b.cell); EX.taken.delete(b.cell); b.cell=b.home; EX.propAt.set(b.home,b); EX.taken.add(b.home); b.mesh.position.set(xw(b.home),0,xz(b.home)); moved++; }
  if(moved){ xLog('The rune flashes and the blocks slide home.','dim'); xSfx('grind'); } }
function xPickup(it){ EX.items=EX.items.filter(x=>x!==it); EX.itemAt.delete(it.cell); EX.taken.delete(it.cell); if(it.mesh) it.mesh.visible=false;
  if(it.kind==='key'){ addKey(it.key); xLog('You pick up a '+KEYS[it.key].name+'.','good'); xSfx('unlock'); }
  else if(it.kind==='mat'){ addMat(it.mat,it.n||1); xLog('You gather '+(it.n||1)+' '+MATS[it.mat].name+'.','loot'); }
  else if(it.kind==='gold'){ save.gold+=it.n; xLog('You scoop up '+it.n+' gold.','gold'); }
  else if(it.kind==='crate'){ EX.carrying=it; xLog('You heave up '+it.owner+'’s crate. Bring it back to them.','loot'); }
  else if(it.kind==='quest'){ const q=XRUN&&XRUN.quests.find(x=>x.id===it.qid); if(q&&!q.done){ q.done=true; xLog('You find '+q.giver+'’s '+q.item+'. Their token glows warm in your pocket.','good'); xGrant(q.reward,'Quest reward'); } }
  persist(); xHud(); }

/* ---------------- using things ---------------- */
function xInteract(p){
  const pz=EX.puzzle;
  switch(p.kind){
    case 'npc': return xTalk(p);
    case 'merchant': return xTrade(p);
    case 'altar': return xSanctuary(p);
    case 'statue': p.face=(p.face+1)%4; if(p.rot) p.rot.rotation.y=-p.face*Math.PI/2; xSfx('grind'); return xCheckPuzzle();
    case 'mirror': p.o=p.o==='/'?'\\':'/'; if(p.rot) p.rot.rotation.y=p.o==='/'?Math.PI/4:-Math.PI/4; xSfx('click'); return xCheckPuzzle();
    case 'crystal': return xSay('crystal','A cold crystal. It is waiting for light.');
    case 'core': return xSay('core','An altar with a gold eye. The statues around it should look at it.');
    case 'runestone': { if(!pz||pz.solved) return; if(p.lit) return;
      if(p.color===pz.seq[pz.step]){ pz.step++; p.lit=true; if(p.glowMat) p.glowMat.opacity=1; xSfx('click'); if(pz.step>=pz.seq.length) xPuzzleSolved(); }
      else { pz.step=0; for(const s of pz.stones){ s.lit=false; if(s.glowMat) s.glowMat.opacity=.45; } xSfx('thud'); xLog('The runes flare and go dark: wrong order.','bad'); xHurt(Math.round(4+EX.depth*.5),'a rune’s backlash'); }
      return; }
    case 'tablet': return xDlgText('A stone tablet',p.text+(XRUN&&XRUN.solution&&pz&&pz.kind==='runes'?' (Your hint: '+pz.seq.map(c=>COLORS[c].name).join(', ')+'.)':''));
    case 'inscription': return xDlgText('Scratched into the wall',p.text);
    case 'plever': { if(!pz||pz.solved||p.on) return;
      if(p.sym===pz.order[pz.step]){ pz.step++; p.on=true; if(p.handle) p.handle.rotation.x=1.2; xSfx('click'); if(pz.step>=3) xPuzzleSolved(); }
      else { pz.step=0; for(const l of pz.levers){ l.on=false; if(l.handle) l.handle.rotation.x=0; } xSfx('thud'); xLog('The levers snap back with a clang that echoes down the halls.','bad'); xMakeNoise(10); }
      return; }
    case 'lever': { if(p.on) return; const d=EX.doors.get(EX.gate.cell); p.on=true; if(p.handle) p.handle.rotation.x=1.2; xSfx('click');
      if(d&&d.state==='locked') xUnlock(EX.gate.cell,d,'You pull the lever. The shortcut gate rattles open: a quick way back to the stairs up.'); return; }
    case 'switch': { if(!p.found||p.used) return xSay('sconce','Just an old sconce.'); p.used=true; if(p.handle) p.handle.rotation.x=1.2; xSfx('click'); xOpenCloset(p.opens,'You pull the hidden lever. Somewhere, stone grinds aside.'); return; }
    case 'cache': { if(!p.found||p.used) return; p.used=true; if(p.mesh) p.mesh.visible=false; xSfx('grind'); xCacheLoot(p.loot); return; }
    case 'trialaltar': { if(p.spent) return xSay('altar','The altar is cold now.'); const T={order:['Trial of Order','Three enemies, numbered. Break them in order, I to III. A wrong kill heals the rest and breaks the trial.'],
        survive:['Trial of Endurance','Survive 40 seconds while enemies keep coming.'], switches:['Trial of Swiftness','Step on three glowing tiles on your side while enemies keep coming.']}[p.rule];
      return xDlg({title:T[0], sub:'A dark altar', icon:['skull','#ff5d6c'], text:T[1]+' Pass it and the altar opens its hoard.', buttons:[['Begin the trial',()=>xStartTrial(p)],['Not now',null,true]]}); }
    case 'totem': { p.hp--; xSfx('thud'); if(p.hp>0){ xLog('You strike the curse totem. It cracks.','dim'); return; }
      xRemoveProp(p); addMat('essence'); xLog('The totem shatters, leaving a mote of Arcane Essence.','good'); return; }
    case 'pedestal': { if(p.taken) return; p.taken=true; if(p.glow) p.glow.visible=false;
      if(p.orb){ const ok=addPerm(p.orb); if(!ok) save.gold+=150; persist(); xSfx('chime'); xLog(ok?'The orb sinks into your hands: a blessing of '+PERM[p.orb].name+' ('+PERM[p.orb].text+'), for good.':'The orb fades; you are as blessed as you can be. It leaves 150 gold behind.','good'); tip(PERM[p.orb].name+'!'); xHud(); return; }
      if(p.lore){ const fresh=addLore(p.lore), L=loreOf(p.lore); persist(); return xDlgText(L.title,L.text+(fresh?'':' (You have read this before.)')); } return; }
    case 'bones': { if(p.taken) return; p.taken=true; xLoot(true); persist(); xHud(); const g=EX.groups.find(x=>x.dormant&&x.risesFrom===p.cell);
      if(g){ g.dormant=false; g.state='chase'; g.beh='hunt'; g.huntT=0; xLog('The bones knit together: the Bone Collector rises!','warn'); xSfx('thud'); } return; }
  } }
function xRemoveProp(p){ p.gone=true; if(p.mesh) p.mesh.visible=false; if(EX.propAt.get(p.cell)===p) EX.propAt.delete(p.cell); EX.taken.delete(p.cell); }
function xCacheLoot(loot){
  if(loot.startsWith('key:')){ const k=loot.slice(4); addKey(k); xLog('Behind the loose stone: a '+KEYS[k].name+'!','good'); return; }
  if(loot==='mat'){ const m=xweighted([['ore',3],['essence',2],['shard',1]]); addMat(m,1+xri(0,1)); xLog('Behind the loose stone: '+MATS[m].name+'.','loot'); return; }
  if(loot==='gold'){ const g=Math.round(40+20*EX.depth); save.gold+=g; persist(); xLog('Behind the loose stone: '+g+' gold.','gold'); return; }
  if(loot==='bag'){ const b=xpick(Object.keys(BAG)); addBag(b); persist(); xLog('Behind the loose stone: a '+BAG[b].name+'.','loot'); return; }
  if(loot==='lore'){ const u=unreadLore(); if(u.length){ addLore(u[0].id); persist(); xDlgText(u[0].title,u[0].text); } else { addMat('essence'); xLog('Behind the loose stone: Arcane Essence.','loot'); } } }
// noise draws the nearest sleepers
function xMakeNoise(rad){ for(const g of EX.groups) if(!g.boss&&!g.dormant&&Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS<rad){ g.state='chase'; g.lostT=0; } }
// a chest you open (explore.js asks first): mimics bite back; keys and legendary hoards come out too
function xChestExtra(ch){
  if(ch.mimic||ch.giant){ const g=xGroup(ch.giant?miniWave('giant_mimic',EX.depth):['mimic'],ch.cell,'wander'); g.mimicChest=ch; g.x=xw(ch.cell); g.z=xz(ch.cell); g.seen=!!ch.mimicKnown;
    xLog(ch.mimicKnown?'You strike the mimic before it can bite!':'The chest’s lid snaps open: it has teeth!','warn'); xEngage(g,ch.mimicKnown?'ambush':'surprised'); return true; }
  return false; }
function xChestAfter(ch){
  if(ch.key){ addKey(ch.key); xLog('Inside lies a '+KEYS[ch.key].name+'.','good'); ch.key=null; }
  if(ch.legend){ const leg=xpick(Object.keys(GEAR).filter(id=>GEAR[id].legendary)); const res=addLoot(save,leg,XR); xLog('A legendary find: '+lootLabel(save,leg).name+'!'+(res&&res.cursed?' '+res.msg:''),'loot'); tip('Legendary!'); }
  if(ch.raced){ const rv=EX.props.find(p=>p.role==='rival'); if(rv&&rv.state!=='won'){ rv.state='lost'; xLog(rv.name+' arrives too late and swears loudly.','good'); } }
  persist(); }

/* ---------------- every frame ---------------- */
function xDungeonTick(dt){
  const now=performance.now(), pc=EX.pc, d=EX.depth;
  EX.clock+=dt;
  // ailments: poison bites every 1.5s but never past 1 HP; a curse lowers your max HP until cured
  const A=EX.ail||(EX.ail={poison:0,curse:0});
  if(A.poison>0){ A.poison-=dt; EX.poisonAcc=(EX.poisonAcc||0)+dt; if(EX.poisonAcc>=1.5){ EX.poisonAcc=0; if(EX.hp>1){ EX.hp=Math.max(1,EX.hp-Math.max(1,Math.round(1+d/6))); xFlash(); } xHud(); } if(A.poison<=0) xHud(); }
  if(EX.hp>xmaxHp()) EX.hp=xmaxHp();
  // visible traps: blades swing across corridors, flame jets roar on a cycle
  for(const p of EX.props){ if(p.gone) continue;
    if(p.kind==='blade'){ const ph=((EX.clock/2.4+p.ph)%1)*Math.PI*2, a=Math.sin(ph)*1.15; p.danger=Math.abs(Math.sin(ph))<.28&&!p.jammed;
      if(p.pivot) p.pivot.rotation.z=p.jammed?.9:a;
      if(p.danger&&pc===p.cell&&now>(p.hitT||0)){ p.hitT=now+900; xLog('A swinging blade cuts you!','bad'); xHurt(Math.round(8+d),'a swinging blade'); } }
    if(p.kind==='jet'){ const ph=(EX.clock/3+p.ph)%1, on=ph>.6&&ph<.93&&!p.jammed; p.on=on; if(p.flame){ p.flame.visible=on||(ph>.5&&ph<=.6&&!p.jammed); p.flame.scale.y=on?1:.25; }
      if(on&&pc===p.cell&&now>(p.hitT||0)){ p.hitT=now+400; xHurt(Math.round(3+d*.3),'a flame jet'); } }
    if(p.kind==='puddle'&&pc===p.cell&&A.poison<4){ A.poison=8+d*.5; xLog('The green puddle burns: you are poisoned.','bad'); xHud(); }
    if(p.kind==='totem'&&!A.curse&&Math.hypot(xcx(p.cell)-xcx(pc),xcy(p.cell)-xcy(pc))<4.5&&xLos(p.cell,pc)){ A.curse=1; xLog('The totem’s gaze settles on you: cursed (max HP -20%). Smash it, or cure it.','bad'); xSfx('thud'); xHud(); }
    if(p.kind==='loose'&&!p.done&&pc===p.cell){ p.stand=(p.stand||0)+dt; if(p.stand>1.2){ p.done=p.found=true; if(p.mat) p.mat.opacity=.3; xOpenCloset(p.opens,'The stone sinks under your weight. Somewhere, a wall slides open.'); } }
    if(p.kind==='loose'&&!p.done&&pc!==p.cell&&p.top) p.top.position.y=.05;
    if((p.role==='lost'&&p.state==='follow')||(p.role==='rival'&&p.state==='race')) xNpcWalk(p,dt); }
  // the rival sets off on his own a while after you first see him
  for(const p of EX.props) if(p.role==='rival'&&p.state==='idle'&&EX.vis[p.cell]){ p.seenT=(p.seenT||0)+dt; if(p.seenT>20){ p.state='race'; xLog(p.name+' laughs and sprints off toward the treasure!','warn'); } }
  // the bell: stay too long on one floor and the Executioner comes for you
  if(EX.bellAt){ if(!EX.bellWarned&&EX.clock>EX.bellAt-25){ EX.bellWarned=1; xLog('A distant bell tolls. You have lingered too long.','warn'); xSfx('thud'); }
    if(EX.clock>=EX.bellAt){ EX.bellAt=0; const reach=xReach(); let c=EX.up; if(Math.hypot(xcx(c)-xcx(pc),xcy(c)-xcy(pc))<7){ const far=EX.rooms.filter(r=>!r.side&&!r.safe&&reach[xi(r.cx,r.cy)]>=0).sort((a,b)=>Math.hypot(b.cx-xcx(pc),b.cy-xcy(pc))-Math.hypot(a.cx-xcx(pc),a.cy-xcy(pc)))[0]; if(far) c=xi(far.cx,far.cy); }
      const g=xMiniGroup('executioner',c,{huntT:0}); EX.groups.push(g); xGroupSprites(g,X3.group); xLog('Heavy steps. The Executioner has come for you.','bad'); xSfx('thud'); } }
  // secrets: standing still you notice things; nearby secrets whisper
  if(EX.stillT>=2.5&&!EX.action&&now>(EX.passiveT||0)){ EX.passiveT=now+1500; xSearchRoll(.35,true); }
  if(now>(EX.whisperT||0)&&now>(EX.whisperCheck||0)){ EX.whisperCheck=now+1000; const s=xNearestSecret(4); if(s&&XR()<(EX.stillT>.8?.3:.12)){ EX.whisperT=now+12000; xLog(s.cue,'dim'); xSfx('whisper',Math.sign(xcx(s.cell)-xcx(pc))); } }
}
function xNearestSecret(rad){ const pc=EX.pc, px=xcx(pc), py=xcy(pc), out=[]; const near=c=>Math.hypot(xcx(c)-px,xcy(c)-py)<=rad;
  for(const [i,d] of EX.doors) if(d.state==='secret'&&near(i)) out.push({cell:i,cue:'A cold draft brushes past you from somewhere close.'});
  for(const p of EX.props){ if(p.gone||!near(p.cell)) continue;
    if(p.kind==='cache'&&!p.found) out.push({cell:p.cell,cue:'The wall nearby sounds hollow when you breathe.'});
    if(p.kind==='switch'&&!p.found) out.push({cell:p.cell,cue:'One of the sconces here flickers against a draft.'});
    if(p.kind==='loose'&&!p.found) out.push({cell:p.cell,cue:'Grit trickles from between the floor stones nearby.'}); }
  for(const ch of EX.chests) if((ch.mimic||ch.giant)&&!ch.mimicKnown&&!ch.open&&near(ch.cell)) out.push({cell:ch.cell,cue:'Something nearby breathes, slow and patient.'});
  out.sort((a,b)=>Math.hypot(xcx(a.cell)-px,xcy(a.cell)-py)-Math.hypot(xcx(b.cell)-px,xcy(b.cell)-py)); return out[0]||null; }
// searching (F, or standing still at a third of the chance) also finds caches, switches, loose stones and mimics
function xSearchExtra(k,quiet){ const pc=EX.pc, px=xcx(pc), py=xcy(pc); let found=0; const near=(c,r)=>Math.max(Math.abs(xcx(c)-px),Math.abs(xcy(c)-py))<=r;
  for(const p of EX.props){ if(p.gone||p.found!==false||!near(p.cell,2)) continue; const see=p.wall?xLos(pc,p.front):xLos(pc,p.cell); if(!see) continue;
    if(XR()<(p.kind==='loose'?.5:.6)*k){ p.found=true; found++;
      if(p.kind==='cache'){ if(p.mesh) p.mesh.visible=true; xLog('One stone in the wall sits loose: a hidden cache! Walk into it to open it.','good'); }
      if(p.kind==='switch'){ if(p.handle) p.handle.visible=true; xLog('That sconce is no sconce: a lever is hidden in it.','good'); }
      if(p.kind==='loose'){ if(p.mat) p.mat.opacity=.3; xLog('One floor stone sits a little proud of the rest. Stand on it?','good'); } } }
  for(const ch of EX.chests) if((ch.mimic||ch.giant)&&!ch.mimicKnown&&!ch.open&&near(ch.cell,2)&&XR()<.7*k){ ch.mimicKnown=true; found++; xLog('That chest’s lid rises and falls. It is breathing: a mimic!','good'); }
  if(found) xSfx('click'); return found; }

/* ---------------- people on the move ---------------- */
function xNpcWalk(p,dt){ if(p.x==null){ p.x=xw(p.cell); p.z=xz(p.cell); p.path=[]; }
  if(EX.propAt.get(p.cell)===p){ EX.propAt.delete(p.cell); EX.taken.delete(p.cell); } p.solid=false;
  let goal, sp;
  if(p.role==='lost'){ goal=EX.pc; sp=5.2; if(Math.hypot(p.x-EX.px,p.z-EX.pz)<XCS*1.3) return xNpcPlace(p); }
  else { const t=p.target; if(!t||t.open){ p.state=t&&t.open&&p.state!=='won'?'lost':p.state; return; } goal=t.cell; sp=1.8;
    if(xAdj4(t.cell).includes(p.cell)||p.cell===t.cell){ t.open=true; if(t.mesh&&t.mesh.userData.lid) t.mesh.userData.lid.rotation.x=-1.9; p.state='won'; xLog('You hear a whoop of triumph: '+p.name+' got to the treasure first.','bad'); return; } }
  p.repath=(p.repath||0)-dt; if(p.repath<=0){ p.repath=.5; const dist=xbfs(EX.t,EX.doors,goal,null,n=>xSolid(n)&&n!==goal); p.path=xPathTo(dist,p.cell,goal); }
  if(p.path.length){ const n=p.path[0], tx=xw(n)-p.x, tz=xz(n)-p.z, l=Math.hypot(tx,tz); if(l<.2) p.path.shift(); else { const s=Math.min(sp*dt,l); p.x+=tx/l*s; p.z+=tz/l*s; }
    const dr=EX.doors.get(n); if(dr&&dr.state==='closed'&&l<1){ dr.state='open'; if(dr.leaf) dr.leaf.visible=false; } }
  const c=xcell(p.x,p.z); if(c>=0) p.cell=c; xNpcPlace(p); }
function xNpcPlace(p){ if(p.mesh) p.mesh.position.set(p.x,0,p.z); }
// leading someone lost to the stairs: they thank you if they kept up
function xEscortCheck(){ for(const p of EX.props) if(p.role==='lost'&&p.state==='follow'){
  if(Math.hypot(p.x-EX.px,p.z-EX.pz)/XCS<4){ p.state='done'; xRemoveProp(p); xLog(p.name+' sees the stairs and grins. "I owe you."','good'); xGrant(p.reward,'For your help'); }
  else { p.state='done'; xRemoveProp(p); xLog(p.name+' did not keep up and is left behind.','bad'); } } }

/* ---------------- minibosses on the move ---------------- */
const xEnemyBlock=n=>EX.safe.has(n)||xSolid(n);
function xWalk(g,goal,sp,dt){
  g.repath-=dt; if(g.repath<=0||g.goal!==goal){ g.repath=.45; g.goal=goal; g.path=xPathTo(xbfs(EX.t,EX.doors,goal,null,xEnemyBlock),g.cell,goal); }
  if(g.path.length){ const n=g.path[0], tx=xw(n)-g.x, tz=xz(n)-g.z, l=Math.hypot(tx,tz);
    if(l<.2){ g.path.shift(); const dr=EX.doors.get(n); if(dr&&dr.state==='closed'){ dr.state='open'; if(dr.leaf) dr.leaf.visible=false; if(EX.seen[n]) xUpdateVis(); } }
    else { const s=Math.min(sp*dt,l); g.x+=tx/l*s; g.z+=tz/l*s; g.face=tx<0?-1:1; } }
  const c=xcell(g.x,g.z); if(c>=0) g.cell=c; }
// hunters always know where you are (after a while); patrols walk a beat; guards stay by their hoard
function xMiniStep(g,dt,cells){
  const sees=cells<7.5&&!EX.safe.has(EX.pc)&&xLos(g.cell,EX.pc);
  if(sees&&!g.seen&&EX.vis[g.cell]&&!g.stealth){ g.seen=true; xLog('The '+ENEMY_DEFS[g.mini].name+' has seen you!','warn'); }
  if(g.stunT>0){ g.stunT-=dt; return true; }
  if(g.beh==='hunt'){ if(g.huntT>0){ g.huntT-=dt; if(g.huntT<=0&&g.mini==='assassin') xLog('The back of your neck prickles. Something is hunting you.','warn'); return true; }
    g.state='chase'; if(!EX.safe.has(EX.pc)) xWalk(g,EX.pc,g.mini==='assassin'?3.6:2.7,dt); return true; }
  if(g.beh==='patrol'){
    if(sees){ g.state='chase'; g.lostT=0; } else if(g.state==='chase'){ g.lostT+=dt; if(g.lostT>5) g.state='patrol'; }
    if(g.state==='chase') xWalk(g,EX.pc,3.8,dt);
    else { const goal=g.route[g.ri%g.route.length]; if(g.cell===goal) g.ri++; xWalk(g,g.route[g.ri%g.route.length],1.9,dt); }
    return true; }
  // guard
  if(sees&&cells<5.5){ if(g.state!=='chase'&&EX.vis[g.cell]) xLog('The '+ENEMY_DEFS[g.mini].name+' rises to defend its hoard!','warn'); g.state='chase'; g.lostT=0; }
  else if(g.state==='chase'){ g.lostT+=dt; if(g.lostT>4) g.state='guard'; }
  if(g.state==='chase') xWalk(g,EX.pc,3.4,dt); else if(g.cell!==g.post) xWalk(g,g.post,2,dt);
  return true; }

/* ---------------- after a fight on the map ----------------
   Minibosses drop materials, gold, often a key and sometimes gear; a group that carried a key
   drops it; a beaten mimic's chest opens; a kept trial opens the puzzle's hoard. */
function xAfterFight(g,won,info){
  if(!g||!won) return;
  if(XRUN){ for(const id of g.ids){ const c=ENEMY_DEFS[id]&&ENEMY_DEFS[id].color; if(c) XRUN.kills[c]=(XRUN.kills[c]||0)+1; } xQuestCheck(); }
  const drops=[];
  if(g.mini){ const m=xweighted([['ore',3],['essence',3],['shard',1.5]]), n=1+xri(0,1); addMat(m,n); drops.push(n+' '+MATS[m].name);
    const gold=Math.round(60+20*EX.depth); save.gold+=gold; drops.push(gold+' gold');
    if(!(g.carry||[]).some(c=>c.startsWith('key:'))&&XR()<.5){ const k=EX.depth>=6&&XR()<.35?'gold':XR()<.6?'silver':'bronze'; addKey(k); drops.push('a '+KEYS[k].name); }
    if(XR()<.4){ const id=rollLoot(EX.depth+2,XR,true), res=addLoot(save,id,XR); drops.push(lootLabel(save,id).name); if(res&&res.cursed) xLog(res.msg,'bad'); } }
  for(const c of g.carry||[]) if(c.startsWith('key:')){ addKey(c.slice(4)); drops.push('a '+KEYS[c.slice(4)].name); }
  if(drops.length){ xLog((g.mini?'The '+ENEMY_DEFS[g.mini].name:'They')+' dropped '+drops.join(', ')+'.','loot'); xSfx('chime'); }
  if(g.mimicChest){ const ch=g.mimicChest; ch.mimic=ch.giant=false; ch.open=true; if(ch.mesh&&ch.mesh.userData.lid) ch.mesh.userData.lid.rotation.x=-1.9; xLoot(true); if(ch.rich) xLoot(true); xChestAfter(ch); }
  if(g.trial){ const p=g.trial; p.spent=true; if(p.flame) p.flame.visible=false;
    if(info&&info.ruleOK) xPuzzleSolved(); else xLog('The trial was broken. The altar goes dark.','bad'); }
  persist(); xHud(); }
function xStartTrial(p){ const d=EX.depth, mons=n=>Array.from({length:n},()=>pick(MONSTERS));
  const g=xGroup(p.rule==='order'?mons(3):mons(2),EX.pc,'wander'); g.trial=p; g.rule={kind:p.rule}; g.x=EX.px; g.z=EX.pz; g.seen=true;
  xEngage(g,null); }
function xQuestCheck(){ if(!XRUN||!EX) return;
  for(const q of XRUN.quests){ if(q.done) continue;
    if(q.kind==='samples'&&(XRUN.kills[q.color]||0)-q.base>=q.need){ q.done=true; xLog(q.giver+'’s token glows: you have the '+COLORS[q.color].name+' samples.','good'); xGrant(q.reward,'Quest reward'); }
    if(q.kind==='shard'&&matN('shard')>0&&!q.told&&q.depth===EX.depth){ q.told=true; xLog('Your Relic Shard hums. '+q.giver+' would want to see it.','loot'); } } }

/* ---------------- falling, branching, coming back ---------------- */
// a trapdoor or a chute: down one floor, landing somewhere on it (never past a boss floor's boss)
function xFall(n,msg){ if(EX.busy) return; EX.busy=true; xEscortCheck(); xLog(msg,'warn'); xSfx('thud');
  const nd=EX.depth+n, hp=EX.hp; save.deepest=Math.max(save.deepest,nd); persist(); if(XRUN){ XRUN.keys.boss=0; if(XRUN.chute===EX.depth) XRUN.chute=0; }
  setTimeout(()=>{ buildFloor(nd,hp); const land=EX.rooms.filter(r=>!r.side&&!r.nook&&r!==EX.exit&&!r.behind&&r!==EX.start);
    if(land.length&&n>0&&msg.indexOf('chute')<0){ const r=xpick(land); EX.pc=xi(r.cx,r.cy); EX.px=xw(EX.pc); EX.pz=xz(EX.pc); xUpdateVis(); }
    EX.active=true; xHud(); xLoopStart(); xBanner(nd); },550); }
// the hidden stair in a secret closet: a small, quiet floor of the same depth with a guarded hoard
function xEnterBranch(){ if(EX.busy) return; EX.busy=true; xEscortCheck(); xLog('The hidden stair winds down into the dark…','good'); xSfx('grind');
  const d=EX.depth, hp=EX.hp; setTimeout(()=>{ buildFloor(d,hp,{branch:true}); EX.active=true; xHud(); xLoopStart(); xBanner(d); const b=$('#xBang'); b.innerHTML='Hidden Sanctum<small>Depth '+d+' · a secret branch</small>'; },550); }
// a sanctuary's blessing: the first time you fall afterwards, you wake at the stairs up of that floor
function xTryRevive(){ if(!XRUN||!XRUN.attuned||!EX) return false; XRUN.attuned=0; return true; }
function xRevived(){ const g=EX.fighting; resumeExplore(Math.round(xmaxHp()*.5),false);
  if(g&&g.sprite){ g.x=xw(g.home); g.z=xz(g.home); g.cell=g.home; g.state=g.boss?'guard':'sleep'; g.wakeT=6; g.path=[]; }
  EX.pc=EX.up; EX.px=xw(EX.up); EX.pz=xz(EX.up); EX.ail={poison:0,curse:0}; xUpdateVis(); xHud(); xLog('The shrine’s light pulls you back to the stairs up. Its blessing is spent.','good'); }

/* ---------------- talking ---------------- */
const LINES={
  quest:['Oh! A living soul. Please, I need help.','You look capable. And armed. Good.','Don’t step there. Sorry. Nervous. Can you help me?'],
  lost:['Is this the way out? Is ANY of this the way out?','I’ve walked past that skull three times now.','Please. I just want to see the stairs again.'],
  prisoner:['You came! I thought they’d forgotten me down here.','Quick, before the guards come back!'],
  scholar:['Fascinating. You’re fascinating. Everything down here is fascinating.','Mind the specimens. Some of them bite.'],
  peddler:['Goblins! Took my whole crate while I napped.','Business was good until it was stolen.'],
  rival:['Another treasure hunter? Hah. Try to keep up.','The gilded chest on this floor is mine. Fair warning.'],
  hermit:['Sit. The ward holds. It always holds.','I have been down here longer than the stairs.'],
};
function xTalk(p){ const L=xpick(LINES[p.role]||['…']), d=EX.depth;
  const done=t=>xDlg({look:p.look, title:p.name, sub:p.title, text:t, buttons:[['Farewell',null]]});
  if(p.role==='quest'){ if(p.state==='idle') return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' I lost my '+p.item+(p.where===d?' somewhere on this floor':' on the floor below')+'. Find it and you’ll have '+rewardText(p.reward)+'.',
      buttons:[['I’ll find it',()=>{ p.state='active'; const q={id:'q'+Date.now(), kind:'fetch', giver:p.name, item:p.item, depth:p.where, reward:p.reward, done:false, placed:false}; XRUN.quests.push(q); if(p.where===d){ xPlaceQuestItem(q); const it=EX.items[EX.items.length-1]; if(it&&it.qid===q.id) xMeshItem(it); xUpdateVis(); } xLog('Quest: find '+p.name+'’s '+p.item+(p.where===d?' on this floor.':' on depth '+p.where+'.'),'loot'); }],['Not now',null,true]]});
    const q=XRUN.quests.find(x=>x.giver===p.name); return done(q&&q.done?'You found it! Thank you, truly.':'Any luck with my '+p.item+'?'); }
  if(p.role==='lost'){ if(p.state==='idle') return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' Lead me to the stairs, up or down, and '+rewardText(p.reward)+' is yours.',
      buttons:[['Follow me',()=>{ p.state='follow'; xLog(p.name+' falls in behind you. Reach the stairs together.','loot'); }],['Not now',null,true]]});
    return done('Lead on. I’m right behind you.'); }
  if(p.role==='prisoner'){ if(p.state==='idle'){ p.state='done'; const r=xRollReward(d,[['perm',3],['gear',2],['gold',2],['key',2]],true);
      xDlg({look:p.look,title:p.name,sub:'Freed prisoner',text:L+' Here, I hid this from them. It’s yours: '+rewardText(r)+'.',buttons:[['Go, quickly',()=>{ xGrant(r,'A prisoner’s thanks'); xRemoveProp(p); }]]}); return; }
    return; }
  if(p.role==='scholar'){ if(p.want==='shard'){ if(p.state==='done') return done('I shall write a paper about you.');
      if(matN('shard')>0) return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' Is that a Relic Shard? Let me study it and I’ll give you '+rewardText(p.reward)+'.',buttons:[['Trade a shard',()=>{ save.mats.shard--; p.state='done'; xGrant(p.reward,'The scholar’s trade'); }],['Keep it',null,true]]});
      if(p.state==='idle'){ p.state='active'; XRUN.quests.push({id:'s'+Date.now(),kind:'shard',giver:p.name,depth:d,reward:p.reward,done:false}); }
      return done(L+' I seek a Relic Shard. They hide in closets and caches, behind loose stones. Bring me one and you’ll have '+rewardText(p.reward)+'.'); }
    if(p.state==='idle') return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' I study '+COLORS[p.color].name+' creatures. Defeat '+p.need+' of them, anywhere in the dungeon, and I’ll share '+rewardText(p.reward)+'.',
      buttons:[['Agreed',()=>{ p.state='active'; XRUN.quests.push({id:'k'+Date.now(),kind:'samples',giver:p.name,color:p.color,need:p.need,base:XRUN.kills[p.color]||0,reward:p.reward,done:false}); xLog('Quest: defeat '+p.need+' '+COLORS[p.color].name+' creatures for '+p.name+'.','loot'); }],['Not now',null,true]]});
    return done('Samples, samples. '+COLORS[p.color].icon+' ones, if you please.'); }
  if(p.role==='peddler'){ if(EX.carrying&&EX.carrying.owner===p.name){ EX.carrying=null; p.state='shop';
      Object.assign(p,{mkind:'goblin', stock:xStock('goblin').map(o=>Object.assign(o,{price:Math.round(o.price*.6)})), used:{}}); addBag('draught'); persist();
      return xDlg({look:p.look,title:p.name,sub:'Grateful merchant',text:'My crate! Everything’s here. Take a draught, and shop at my prices: 40% off, for you.',buttons:[['Show me',()=>xTrade(p)],['Later',null,true]]}); }
    if(p.state==='shop') return xTrade(p);
    if(p.state==='idle'){ p.state='active'; xLog('Quest: find '+p.name+'’s crate on this floor and bring it back.','loot'); }
    return done(L+' The thieves can’t have gone far. Find my crate on this floor and bring it back; you won’t regret it.'); }
  if(p.role==='rival'){ if(p.state==='idle'){ p.state='race'; const t=p.target; if(t){ EX.seen[t.cell]=1; xUpdateVis(); }
      return done(L+' The chest is marked on your map now, if you think you’re fast enough. Go!'); }
    if(p.state==='lost'&&!p.sold){ const id=rollLoot(d+1,XR), price=gearPrice(id); return xDlg({look:p.look,title:p.name,sub:p.title,text:'Fine, you won. I do have this spare: '+lootLabel(save,id).name+'. '+price+' gold?',
      buttons:[['Buy it ('+price+')',()=>{ if(save.gold<price) return tip('Not enough gold'); save.gold-=price; p.sold=true; const res=addLoot(save,id,XR); persist(); xLog('You buy '+lootLabel(save,id).name+'.'+(res&&res.cursed?' '+res.msg:''),'loot'); xHud(); }],['No',null,true]]}); }
    return done(p.state==='won'?'Too slow, friend. Better luck below.':'Out of my way!'); }
  if(p.role==='hermit'){ if(p.state==='idle'){ p.state='done'; if(XR()<.2){ const k=xpick(Object.keys(PERM)), ok=addPerm(k); persist(); return done(L+' Here. Take a little of my strength. ('+(ok?PERM[k].name+': '+PERM[k].text:'you are already strong')+')'); }
      const u=unreadLore(); if(u.length){ addLore(u[0].id); persist(); return xDlgText(u[0].title,L+' Let me tell you a story. '+u[0].text); } }
    return done(L); }
  done(L); }

/* ---------------- the dialog box ----------------
   One overlay for people, merchants, sanctuaries, tablets and your bag. While it is open the
   floor stands still. */
function xDlgPic(o){ const cv=$('#xdPic'), c=cv.getContext('2d'); c.clearRect(0,0,96,96); c.imageSmoothingEnabled=false;
  const draw=im=>{ if(im) c.drawImage(im,0,0,im.width,im.height,0,0,96,96); };
  if(o.look){ const s=lookSprite(o.look,'front',true); draw(s&&s.img); }
  else if(o.enemy){ const s=unitSprite({kind:'enemy',id:o.enemy,color:ENEMY_DEFS[o.enemy].color}); draw(s&&s.img); }
  else if(o.icon){ const im=new Image(); im.onload=()=>{ c.imageSmoothingEnabled=false; c.drawImage(im,12,12,72,72); }; im.src=uiIconURL(o.icon[0],o.icon[1]); }
  cv.style.display=o.look||o.enemy||o.icon?'':'none'; }
function xDlg(o){ if(!EX) return; xPause(true); EX.dlg=o;
  $('#xdTitle').textContent=o.title||''; $('#xdSub').textContent=o.sub||''; $('#xdText').textContent=o.text||''; xDlgPic(o);
  goldText($('#xdGold'));
  const tabs=$('#xdTabs'); tabs.innerHTML=''; tabs.hidden=!o.tabs;
  if(o.tabs) o.tabs.forEach(([id,label])=>{ const b=document.createElement('button'); b.className='chip'+(o.tab===id?' on':''); b.textContent=label; b.onclick=()=>{ o.tab=id; xDlg(o); }; tabs.appendChild(b); });
  const body=$('#xdBody'); body.innerHTML=''; if(o.body) o.body(body,o);
  const bb=$('#xdBtns'); bb.innerHTML=''; bb.classList.toggle('two',(o.buttons||[]).length>1);
  (o.buttons||[['Close',null]]).forEach(([label,fn,ghost])=>{ const b=document.createElement('button'); b.className='btn'+(ghost?' ghost':''); b.textContent=label; b.onclick=()=>{ xDlgClose(); if(fn) fn(); }; bb.appendChild(b); });
  $('#xDialog').classList.add('on'); setTimeout(()=>{ const m=bb.querySelector('.btn:not(.ghost)'); if(m) m.focus(); },40); }
function xDlgClose(){ $('#xDialog').classList.remove('on'); if(EX) EX.dlg=null; if(!$('#pause').classList.contains('on')) xPause(false); xHud(); }
const xDlgText=(title,text)=>xDlg({title,text,icon:['scroll','#f2c94c'],buttons:[['Close',null]]});
// a row in a list: picture, name and text, and a button
function xRow(box,pic,name,text,btn,fn,dis){ const r=document.createElement('div'); r.className='xrow';
  r.innerHTML=`<span class="pic">${pic||''}</span><span class="nm"><b>${esc(name)}</b><small>${esc(text||'')}</small></span>`;
  if(btn){ const b=document.createElement('button'); b.className='btn small'+(dis?' ghost':''); b.textContent=btn; b.disabled=!!dis; b.onclick=fn; r.appendChild(b); } box.appendChild(r); return r; }
const pxIcon=(n,col,s)=>uiIcon(n,s||32,col);

/* ---------------- trading ---------------- */
function xTrade(p){ const M=MERCHANTS[p.mkind]||MERCHANTS.goblin;
  const o={look:p.look, title:p.name, sub:M.name, text:M.greet, tabs:[['buy','Buy'],['sell','Sell'],['services','Services']], tab:'buy', buttons:[['Leave',null]],
    body(box,o){ const refresh=()=>xDlg(o);
      if(o.tab==='buy'){ if(!p.stock.some(s=>!s.sold)) box.innerHTML='<p class="hint">Sold out.</p>';
        for(const s of p.stock){ if(s.sold) continue; const can=save.gold>=s.price;
          let pic='', name='', text='';
          if(s.kind==='gear'){ pic=gearIcon(s.id,32); name=GEAR[s.id].name+(GEAR[s.id].legendary?' ✹':''); text=(s.shady?'No questions asked. It may be cursed. ':'')+lootLabel(save,s.id).text; }
          if(s.kind==='card'){ pic=typeof artURL==='function'?`<img class="pxi" src="${artURL(s.card)}" width="32" height="32" alt="">`:pxIcon('cards',COLORS[s.card.color].c); name=s.card.name; text=RARITY[s.card.rarity].n+' '+COLORS[s.card.color].name+' '+TYPES[s.card.type].name+': '+cardText(s.card); }
          if(s.kind==='key'){ pic=pxIcon('key',KEYS[s.k].col); name=KEYS[s.k].name; text=KEYS[s.k].text||'for this dive'; }
          if(s.kind==='bag'){ pic=pxIcon(BAG[s.k].icon,BAG[s.k].col); name=BAG[s.k].name; text=BAG[s.k].text; }
          if(s.kind==='mat'){ pic=pxIcon('gem',MATS[s.k].col); name=MATS[s.k].name; text='for upgrades at a smith'; }
          if(s.kind==='perm'){ pic=pxIcon('gem','#ff5d6c'); name='Vial of '+PERM[s.k].name; text='Permanent: '+PERM[s.k].text; }
          xRow(box,pic,name,text,s.price+' gold',()=>{ if(save.gold<s.price) return tip('Not enough gold'); save.gold-=s.price; s.sold=true;
            if(s.kind==='gear'){ const res=addLoot(save,s.id,XR); if(res&&res.cursed) tip(res.msg); }
            if(s.kind==='card') addCards(save,[s.card]); if(s.kind==='key') addKey(s.k); if(s.kind==='bag') addBag(s.k); if(s.kind==='mat') addMat(s.k); if(s.kind==='perm') addPerm(s.k);
            persist(); xSfx('chime'); refresh(); },!can); } }
      if(o.tab==='sell'){ const s=gearState(save), rate=p.mkind==='black'?.55:.35; let n=0;
        for(const id of Object.keys(s.items).filter(id=>GEAR[id]&&s.items[id]>0&&!GEAR[id].starter)){ const worn=SLOTS.filter(k=>s.gear[k]===id).length; if(s.items[id]-worn<=0) continue; n++;
          const price=Math.round(gearPrice(id)*rate); xRow(box,gearIcon(id,32),gearName(save,id)+(s.items[id]-worn>1?' ×'+(s.items[id]-worn):''),'Not worn',price+' gold',()=>{ s.items[id]--; save.gold+=price; persist(); xSfx('chime'); refresh(); }); }
        for(const m of Object.keys(MATS)) if(matN(m)>0){ n++; const price=Math.round(MATS[m].price*(p.mkind==='curio'&&m==='shard'?1.6:1)); xRow(box,pxIcon('gem',MATS[m].col),MATS[m].name+' ×'+matN(m),p.mkind==='curio'&&m==='shard'?'The collector pays well for shards':'',price+' gold',()=>{ save.mats[m]--; save.gold+=price; persist(); refresh(); }); }
        if(!n) box.innerHTML='<p class="hint">Nothing to sell: gear you are wearing and your starter wand stay with you.</p>'; }
      if(o.tab==='services'){ const sv=M.services||[], s=gearState(save); let n=0;
        if(sv.includes('upgrade')) for(const slot of SLOTS){ const id=s.gear[slot]; if(!id||!GEAR[id]) continue; const isW=GEAR[id].slot==='weapon'; if((M.slot==='weapon')!==isW) continue;
          const lv=s.gearLv[id]||0, gold=Math.round(120*(lv+1)*(1+.04*EX.depth)), ore=lv+1; n++;
          xRow(box,gearIcon(id,32),'Upgrade '+gearName(save,id),lv>=MAX_LEVEL?'Already at +'+MAX_LEVEL:'To +'+(lv+1)+': '+gold+' gold and '+ore+' Deep Iron (you have '+matN('ore')+')',lv>=MAX_LEVEL?'—':'Upgrade',()=>{
            if(save.gold<gold||matN('ore')<ore) return tip('You need '+gold+' gold and '+ore+' Deep Iron'); save.gold-=gold; save.mats.ore-=ore; s.gearLv[id]=lv+1; persist(); xSfx('chime'); xLog('Your '+gearName(save,id)+' is stronger.','good'); refresh(); },lv>=MAX_LEVEL); }
        if(sv.includes('curse')) for(const id of Object.keys(s.cursed)){ if(!GEAR[id]) continue; n++; const price=Math.round(150*(1+.03*EX.depth));
          xRow(box,gearIcon(id,32),'Lift the curse on '+gearName(save,id),CURSES[s.cursed[id]].text,price+' gold',()=>{ if(save.gold<price) return tip('Not enough gold'); save.gold-=price; delete s.cursed[id]; persist(); xSfx('chime'); refresh(); }); }
        if(sv.includes('map')){ n++; const price=Math.round(90*(1+.03*EX.depth)); xRow(box,pxIcon('map','#d9dee2'),'Map of this floor','Every room and corridor, and a mark wherever something is hidden',p.used.map?'Bought':price+' gold',()=>{ if(save.gold<price) return tip('Not enough gold'); save.gold-=price; p.used.map=1; xReveal(true); persist(); refresh(); },!!p.used.map); }
        if(sv.includes('reroll')){ n++; xRow(box,pxIcon('cards','#b48cff'),'Shuffle the stock','New cards on the table',p.used.reroll?'Done':'40 gold',()=>{ if(save.gold<40) return tip('Not enough gold'); save.gold-=40; p.used.reroll=1; p.stock=xStock(p.mkind); persist(); o.tab='buy'; refresh(); },!!p.used.reroll); }
        if(sv.includes('shards')){ n++; xRow(box,pxIcon('gem',MATS.shard.col),'Shards for a blessing','Trade 3 Relic Shards for a permanent blessing (you have '+matN('shard')+')','Trade',()=>{ if(matN('shard')<3) return tip('You need 3 Relic Shards'); const left=Object.keys(PERM).filter(k=>(save.perm[k]||0)<PERM[k].max); if(!left.length) return tip('You are fully blessed'); save.mats.shard-=3; xGrant({perm:xpick(left)},'The collector’s blessing'); refresh(); },matN('shard')<3); }
        if(!n) box.innerHTML='<p class="hint">Nothing to offer you right now.</p>'; } } };
  xDlg(o); }

/* ---------------- sanctuaries ---------------- */
function xSanctuary(p){ const S=SANCTUARIES[p.theme]||SANCTUARIES.shrine, m=xmaxHp();
  const btns=[];
  if(!p.rested) btns.push(['Rest',()=>{ p.rested=true; EX.hp=m; EX.ail={poison:0,curse:0}; let woke=0; for(const g of EX.groups) if(g.state==='sleep'&&!g.boss){ g.state='wander'; woke++; }
    xLog('You rest. Wounds close and poisons fade.'+(woke?' While you slept, the floor stirred: sleepers are awake now.':''),'good'); xSfx('chime'); xHud(); }]);
  if(!p.attuned&&!(XRUN&&XRUN.attuned)) btns.push(['Bind to the shrine',()=>{ p.attuned=true; XRUN.attuned=1; xLog('You bind your name to the '+S.name+'. If you fall in this dive, it will pull you back once.','good'); xSfx('chime'); xHud(); }]);
  btns.push(['Leave',null,true]);
  xDlg({title:S.name, sub:'Sanctuary', icon:['hero','#fff2c0'], text:S.text+' '+(p.rested?'You have already rested here. ':'Resting heals you fully and cures ailments, once, but the floor stirs while you sleep. ')+(XRUN&&XRUN.attuned?'You carry a shrine’s blessing.':'Binding yourself to the shrine saves you from one fall in this dive.'), buttons:btns}); }

/* ---------------- your bag ---------------- */
function xBag(){ if(!EX||EX.busy||$('#xDialog').classList.contains('on')) return;
  const o={title:'Your bag', sub:'Depth '+EX.depth+' · '+(EX.branch?'Hidden Sanctum':areaOf(EX.depth).name), icon:['bag','#f2c94c'], text:'', tabs:[['items','Items'],['quests','Quests'],['journal','Journal'],['bless','Blessings']], tab:'items', buttons:[['Close',null]],
    body(box,o){ const refresh=()=>xDlg(o);
      if(o.tab==='items'){ let n=0;
        for(const k of Object.keys(BAG)) if(bagN(k)>0){ n++; xRow(box,pxIcon(BAG[k].icon,BAG[k].col),BAG[k].name+' ×'+bagN(k),BAG[k].text,'Use',()=>{ xUseBag(k); refresh(); }); }
        for(const k of Object.keys(KEYS)) if(keyN(k)>0){ n++; xRow(box,pxIcon('key',KEYS[k].col),KEYS[k].name+' ×'+keyN(k),KEYS[k].text||'Kept for this dive'); }
        for(const m of Object.keys(MATS)) if(matN(m)>0){ n++; xRow(box,pxIcon('gem',MATS[m].col),MATS[m].name+' ×'+matN(m),m==='ore'?'Smiths use it to upgrade gear':m==='shard'?'Scholars and collectors want these':'Sells well; some trade for it'); }
        if(EX.carrying){ n++; xRow(box,pxIcon('bag','#8a5a32'),EX.carrying.owner+'’s crate','Bring it back to its owner on this floor'); }
        if(!n) box.innerHTML='<p class="hint">Empty. Chests, caches, merchants and grateful people fill it.</p>'; }
      if(o.tab==='quests'){ const qs=XRUN?XRUN.quests:[]; if(!qs.length) box.innerHTML='<p class="hint">No quests. People on the floors ask for help now and then.</p>';
        for(const q of qs){ const what=q.kind==='fetch'?'Find '+q.giver+'’s '+q.item+' on depth '+q.depth:q.kind==='samples'?'Defeat '+q.need+' '+COLORS[q.color].name+' creatures for '+q.giver+' ('+Math.min(q.need,(XRUN.kills[q.color]||0)-q.base)+'/'+q.need+')':'Bring '+q.giver+' a Relic Shard (depth '+q.depth+')';
          xRow(box,pxIcon('scroll',q.done?'#39ff8a':'#f2c94c'),q.done?'Done':'In progress',what+' · reward: '+rewardText(q.reward)); }
        for(const p of EX.props) if(p.role==='lost'&&p.state==='follow') xRow(box,pxIcon('hero','#8fe4ff'),'Escort','Lead '+p.name+' to the stairs, up or down');
        for(const p of EX.props) if(p.role==='peddler'&&p.state==='active') xRow(box,pxIcon('bag','#8a5a32'),'Find the crate','Bring '+p.name+'’s crate back to them on this floor'); }
      if(o.tab==='journal'){ const read=LORE.filter(l=>dState().lore[l.id]); box.insertAdjacentHTML('beforeend','<p class="hint">'+read.length+' of '+LORE.length+' tales found. Tablets, hermits, caches and secret rooms hold the rest.</p>');
        for(const l of read) xRow(box,pxIcon('scroll','#f2c94c'),l.title,l.text); }
      if(o.tab==='bless'){ const P=dState().perm; let n=0; for(const k of Object.keys(PERM)) if(P[k]){ n++; xRow(box,pxIcon('gem',['#ff5d6c','#ff9a3a','#8fe4ff','#f2c94c'][Object.keys(PERM).indexOf(k)]),PERM[k].name+' ×'+P[k]+' / '+PERM[k].max,PERM[k].text+' each, for good'); }
        if(XRUN&&XRUN.attuned){ n++; xRow(box,pxIcon('hero','#fff2c0'),'Shrine’s blessing','If you fall in this dive, you wake at the stairs up, once'); }
        if(!n) box.innerHTML='<p class="hint">No blessings yet. Orbs in hidden shrines, freed prisoners and rare quests grant them.</p>'; } } };
  xDlg(o); }
function xUseBag(k){ if(bagN(k)<1) return; const m=xmaxHp();
  if(k==='draught'){ if(EX.hp>=m) return tip('You are already at full health'); EX.hp=Math.min(m,EX.hp+Math.round(m*.4)); xLog('You drink a healing draught.','good'); }
  if(k==='antidote'){ if(!EX.ail.poison&&!EX.ail.curse) return tip('Nothing to cure'); EX.ail={poison:0,curse:0}; xLog('The antidote clears your blood.','good'); }
  if(k==='smoke'){ let n=0; for(const g of EX.groups) if(EX.vis[g.cell]&&!g.boss&&!g.dormant){ n++; if(g.mini) g.stunT=8; else { g.state='sleep'; g.wakeT=8; g.path=[]; } } xLog(n?'Smoke billows; '+n+' foes lose you in it.':'Smoke billows, but nothing is watching.','good'); }
  if(k==='oil'){ EX.sight=(EX.sight||0)+2; xUpdateVis(); xLog('Your lantern burns brighter.','good'); }
  if(k==='chart'){ xReveal(false); xLog('You unroll the chart: the whole floor, mapped.','good'); }
  save.bag[k]--; persist(); xSfx('click'); xHud(); }
// map the floor (a chart, or a goblin's map, which also marks where things are hidden)
function xReveal(hints){ for(let i=0;i<XN*XN;i++){ if(EX.t[i]===T_ROCK) continue; const r=roomOf(i); if(r&&(r.side==='closet'||r.side==='vault')) continue; const d=EX.doors.get(i); if(d&&d.state==='secret') continue;
    EX.seen[i]=1; for(const n of xAdj4(i)) if(EX.t[n]===T_ROCK) EX.seen[n]=1; }
  if(hints){ EX.hints=[]; for(const [i,d] of EX.doors) if(d.state==='secret') EX.hints.push(i); for(const p of EX.props) if(p.found===false&&!p.gone) EX.hints.push(p.cell); xLog('The map is marked with '+EX.hints.length+' little crosses.','good'); }
  xPaintCells(); }

/* ---------------- what shows ---------------- */
// which things are visible: what you have seen, except secrets you have not found
function xPaintExtra(){
  for(const p of EX.props){ if(!p.mesh) continue; const at=p.wall?p.front:p.cell;
    p.mesh.visible=!p.gone&&!!EX.seen[at]&&!(p.kind==='cache'&&!p.found)&&!(p.kind==='npc'&&p.state==='done'); }
  for(const it of EX.items) if(it.mesh) it.mesh.visible=!!EX.seen[it.cell]; }
// every frame: things bob, spin, glow and swing
function xDungeonDraw(T){
  for(const it of EX.items) if(it.spin&&it.mesh.visible){ it.spin.rotation.y=T*1.6; it.spin.position.y=.55+Math.sin(T*2.4+it.cell)*.08; }
  for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
    if(p.spr){ xRefresh(p.spr,false); p.spr.position.y=Math.abs(Math.sin(T*2+p.cell))*.03; }
    if(p.mark&&p.mark.isSprite){ const st=p.kind==='merchant'?'$':p.role==='prisoner'||p.state==='done'?'':p.state==='idle'?'!':p.state==='shop'?'$':'?'; p.mark.visible=!!st;
      if(st&&p.mark.userData.txt!==st){ p.mark.userData.txt=st; const s=xTextSprite(st,st==='$'?'#f2c94c':'#8fe4ff'); p.mark.material.map=s.material.map; p.mark.material.needsUpdate=true; }
      p.mark.position.y=2.75+Math.sin(T*3)*.06; }
    if(p.orbMesh) p.orbMesh.position.y=1.15+Math.sin(T*2)*.06;
    if(p.spin) p.spin.rotation.y=T*1.6;
    if(p.ring) p.ring.rotation.z+=.02;
    if(p.kind==='decor'&&p.flame){ p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); }
    if(p.kind==='trialaltar'&&p.flame) p.flame.scale.y=.85+.2*Math.sin(T*7);
    if(p.kind==='crystal'&&p.glowMat) p.glowMat.opacity=EX.puzzle&&EX.puzzle.solved?1:.55+.15*Math.sin(T*2);
    if(p.kind==='switch'&&p.flame) p.flame.scale.y=.8+.25*Math.sin(T*11+p.cell); }
  // a mimic breathes: watch a chest closely and you will see its lid rise and fall
  for(const ch of EX.chests) if((ch.mimic||ch.giant)&&!ch.open&&ch.mesh&&ch.mesh.userData.lid) ch.mesh.userData.lid.rotation.x=-Math.max(0,Math.sin(T*1.3))*.08;
  if(EX.beam) EX.beam.children.forEach((b,i)=>b.material.opacity=.55+.25*Math.sin(T*6-i*.4)); }
// the minimap: people, merchants, sanctuaries, locks, keys and anything a map marked
function xMiniExtra(c,s,dot){
  for(const [i,d] of EX.doors) if(d.state==='locked'&&EX.seen[i]){ c.fillStyle=d.lock==='gate'?'#5c656e':(KEYS[d.lock]||KEYS.boss).col; c.fillRect(xcx(i)*s,xcy(i)*s,s,s); }
  for(const p of EX.props){ if(p.gone) continue; const at=p.wall?p.front:p.cell; if(!EX.seen[at]) continue;
    const col=p.kind==='merchant'?'#f2c94c':p.kind==='altar'?'#39ff8a':p.kind==='npc'&&p.state!=='done'?'#8fe4ff':p.kind==='keystand'&&!p.taken?KEYS.boss.col:p.kind==='trialaltar'||p.kind==='core'||p.kind==='tablet'?'#b48cff':p.kind==='blade'||p.kind==='jet'||p.kind==='totem'?'#ff9a3a':p.kind==='hstair'||p.kind==='chute'?'#b48cff':null;
    if(col) dot(p.cell,col,1); }
  for(const it of EX.items) if(EX.seen[it.cell]) dot(it.cell,it.kind==='key'?KEYS[it.key].col:it.kind==='quest'||it.kind==='crate'?'#8fe4ff':'#c9a7ff',1);
  for(const p of EX.props) if(p.role==='rival'&&p.target&&EX.seen[p.target.cell]&&!p.target.open) dot(p.target.cell,'#f2c94c',2);
  if(EX.hints) for(const h of EX.hints){ c.fillStyle='#ff5d6c'; c.fillRect(xcx(h)*s-1,xcy(h)*s+1,s+2,1); c.fillRect(xcx(h)*s+1,xcy(h)*s-1,1,s+2); } }
// the status strip: keys you carry, ailments, the shrine's blessing, quests
function xHudExtra(){ const el=$('#xStatus'); if(!el) return; const out=[];
  for(const k of Object.keys(KEYS)) if(keyN(k)>0) out.push(`<span class="xs" title="${KEYS[k].name}">${pxIcon('key',KEYS[k].col,18)}${keyN(k)>1?keyN(k):''}</span>`);
  if(EX.ail&&EX.ail.poison>0) out.push('<span class="xs bad">☠ Poisoned</span>'); if(EX.ail&&EX.ail.curse) out.push('<span class="xs bad">☾ Cursed</span>');
  if(XRUN&&XRUN.attuned) out.push('<span class="xs good">✦ Blessed</span>');
  const q=XRUN?XRUN.quests.filter(x=>!x.done).length:0; if(q) out.push('<span class="xs">📜 '+q+'</span>');
  if(EX.carrying) out.push('<span class="xs">📦 crate</span>');
  el.innerHTML=out.join(''); }

/* ---------------- sound ----------------
   A few small sounds made on the spot (no files): a whisper toward a nearby secret, clicks,
   an unlock, a chime, grinding stone and a thud. Off in Settings. */
const XSFX={ctx:null};
const sfxOn=()=>{ try{ return localStorage.getItem('hexmancers-sfx')!=='0'; }catch(e){ return true; } };
function xSfx(kind,pan){ if(!sfxOn()) return; try{
  const A=XSFX.ctx||(XSFX.ctx=new (window.AudioContext||window.webkitAudioContext)()); if(A.state==='suspended') A.resume(); const t=A.currentTime;
  const out=A.createGain(); let node=out; if(A.createStereoPanner&&pan){ const p=A.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,pan*.7)); out.connect(p); node=p; } node.connect(A.destination);
  const tone=(f,t0,dur,type,vol)=>{ const o=A.createOscillator(), g=A.createGain(); o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(0,t+t0); g.gain.linearRampToValueAtTime(vol||.12,t+t0+.01); g.gain.exponentialRampToValueAtTime(.0005,t+t0+dur); o.connect(g); g.connect(out); o.start(t+t0); o.stop(t+t0+dur+.02); };
  const noise=(dur,f0,f1,vol,type)=>{ const n=A.createBufferSource(), b=A.createBuffer(1,Math.ceil(A.sampleRate*dur),A.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; n.buffer=b;
    const f=A.createBiquadFilter(); f.type=type||'bandpass'; f.frequency.setValueAtTime(f0,t); f.frequency.linearRampToValueAtTime(f1,t+dur); const g=A.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.3); g.gain.linearRampToValueAtTime(0,t+dur);
    n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t+dur); };
  out.gain.value=.6;
  if(kind==='whisper') noise(1.2,600,1700,.09);
  else if(kind==='click') tone(320,0,.06,'square',.05);
  else if(kind==='unlock'){ tone(660,0,.12,'triangle',.1); tone(990,.09,.16,'triangle',.08); }
  else if(kind==='chime'){ [523,659,784,1046].forEach((f,i)=>tone(f,i*.07,.35,'sine',.07)); }
  else if(kind==='grind') noise(.7,220,120,.18,'lowpass');
  else if(kind==='thud') tone(80,0,.35,'sine',.25);
}catch(e){} }

/* ---------------- keys and buttons ---------------- */
// Esc closes a dialog before anything else; the bag key opens the bag
window.addEventListener('keydown',e=>{
  if($('#settings').classList.contains('on')) return;
  if($('#xDialog').classList.contains('on')){ if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); xDlgClose(); } return; }
  if(!EX||!EX.active||xPaused||!$('#scrExplore').classList.contains('on')) return;
  if(typeof keyAct==='function'&&keyAct(e.key.toLowerCase(),'map')==='bag'){ e.preventDefault(); xBag(); } },true);
$('#xBag').onclick=()=>xBag();

// Disarm (E) also picks bronze and silver locks (a failed try makes noise) and jams blades and flame jets
function xDisarmAlt(){ if(!EX) return null; const pc=EX.pc;
  const door=xAdj4(pc).find(n=>{ const d=EX.doors.get(n); return d&&d.state==='locked'&&LOCKS[d.lock]&&LOCKS[d.lock].pick>0; });
  if(door!=null){ const d=EX.doors.get(door), L=LOCKS[d.lock];
    return {t:1.6, start:'You work a pin into the '+L.name+'…', run(){ if(d.state!=='locked') return;
      if(XR()<L.pick) xUnlock(door,d,'Click. You pick the lock of the '+L.name+'.'); else { xLog('The pin slips with a loud scrape. Something heard that.','bad'); xSfx('click'); xMakeNoise(9); } }}; }
  const hz=EX.props.find(p=>!p.gone&&!p.jammed&&(p.kind==='blade'||p.kind==='jet')&&(p.cell===pc||xAdj4(pc).includes(p.cell)));
  if(hz) return {t:1.4, start:'You wedge a stone into the '+(hz.kind==='blade'?'blade’s mechanism':'jet’s vent')+'…', run(){
    if(XR()<.6){ hz.jammed=true; if(hz.flame) hz.flame.visible=false; xLog('It jams with a screech.','good'); } else { xLog('It catches you while you work!','bad'); xHurt(Math.round(5+EX.depth*.6),'a trap you were jamming'); } }};
  return null; }
