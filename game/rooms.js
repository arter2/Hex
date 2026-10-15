/* Hexmancers — special rooms (round 2 of the dungeon plan). Every 2 to 3 floors (from depth 2) a
   floor holds a special room, sometimes two. They show on the path map before you choose a way.
     nest      Monster nest: egg sacs hatch foes every 20 s until you smash them all; then a rich chest.
     hub       Teleporter hub: a ring of pads, each to another room, one to the floor's secret closet.
     pit       Pit room: a marked drop of two floors, with treasure waiting at the bottom.
     treasury  Collapsing treasury: take anything and the ceiling starts to fall; 14 s to get out.
     mirror    Mirror room: your reflection steps out and fights with a deck of your colour.
     gambler   Gambler's den: dice for gold, or pay for a blind card draw.
     forge     Forge: temper one piece of gear you wear, +1 level, free, once.
     trade     Shrine of trade: give a spare card, take a random card a rarity higher, once.
     camp      Wounded adventurer: rest by their fire, buy supplies, or pay them to fight beside you.
     chapel    Haunted chapel: a ghost asks you to find its bones on the floor and lay them to rest.
   Hooks from dungeon.js / explore.js / battle.js / ui.js: xRarePlan, xRareAssign, xRareFill,
   xRareInteract, xRareEnter, xRareTick, xRarePickup, xRareItemMesh, xRareMesh, xRareTalk,
   xRareAfterFight, roomAllyStart, xRareHud. */

const RARE_ROOMS={
  nest:    {name:'Monster nest',        icon:'🥚', min:2, w:5, h:4, safe:false},
  hub:     {name:'Teleporter hub',      icon:'🌀', min:2, w:4, h:4, safe:false},
  pit:     {name:'Pit room',            icon:'🕳', min:3, w:4, h:4, safe:false},
  treasury:{name:'Collapsing treasury', icon:'🏛', min:2, w:4, h:4, safe:false},
  mirror:  {name:'Mirror room',         icon:'🪞', min:3, w:4, h:4, safe:false},
  gambler: {name:'Gambler’s den',       icon:'🎲', min:2, w:3, h:3, safe:true},
  forge:   {name:'Forge',               icon:'⚒', min:2, w:3, h:3, safe:true},
  trade:   {name:'Shrine of trade',     icon:'⚖', min:2, w:3, h:3, safe:true},
  camp:    {name:'Wounded adventurer',  icon:'🔥', min:2, w:3, h:3, safe:true},
  chapel:  {name:'Haunted chapel',      icon:'👻', min:2, w:4, h:3, safe:true},
};
Object.assign(NPC_KINDS,{
  gambler:{title:'Gambler',            looks:['orc_m','undead_m','dwarf_m'],    names:['Lucky Tamsin','One-Eyed Gorm','Madam Pell','Rattle']},
  camper: {title:'Wounded adventurer', looks:['ranger_m','ranger_f','dwarf_f','human_f'], names:['Brann','Ysolde','Kettle','Marn the Bold']},
  ghost:  {title:'Restless ghost',     looks:['undead_m','necro_f','necro'],    names:['Sir Aldous','the Grey Lady','Brother Wim','Old Mother Rook']},
});
Object.assign(LINES,{
  gambler:['Care to test your luck? The bones never lie. Well, rarely.','Sit, sit. Gold on the table.'],
  camper:['Careful… the thing that did this is still out there.','Sit by the fire a while. It keeps them back.'],
  ghost:['They left my bones to the rats. I cannot rest.','Cold… so cold, all these years.'],
});

/* ---------------- planning ---------------- */
// every 2 to 3 floors (never a boss floor or a hidden branch) a floor gets a special room, sometimes two
function xRarePlan(depth,F,boss){ if(!XRUN||boss||depth<2) return; if(XRUN.next.rare==null) XRUN.next.rare=depth+xri(0,1);
  if(depth<XRUN.next.rare) return; XRUN.next.rare=depth+xri(2,3);
  const pool=Object.keys(RARE_ROOMS).filter(k=>RARE_ROOMS[k].min<=depth&&!(k==='pit'&&isBossDepth(depth+1)));
  const n=XR()<.35?2:1; F.rare=pool.sort(()=>XR()-.5).slice(0,n); }
// rooms get their role once the floor is dug; one with no room to fit tries again next floor
function xRareAssign(F,give,take){ if(!F.rare) return;
  for(const k of F.rare){ const R=RARE_ROOMS[k], r=give(take(x=>x.w>=R.w&&x.h>=R.h&&(!R.fit||R.fit(x))),'rare',R.safe); if(r) r.rare=k; else if(XRUN) XRUN.next.rare=EX.depth+1; } }
const rareRoom=k=>EX.rooms.find(r=>r.rare===k);
const xRareName=k=>RARE_ROOMS[k]?RARE_ROOMS[k].icon+' '+RARE_ROOMS[k].name:k;

/* ---------------- filling the rooms ---------------- */
function xRareFill(r){ if(xFillExplore(r)) return; if(typeof xFillPuzzRoom==='function'&&xFillPuzzRoom(r)) return; const d=EX.depth, c=xFreeSolid(r,true); if(c<0) return;
  switch(r.rare){
    case 'nest': { xProp('nestcore',c,{room:r.id, solid:false}); for(let k=0;k<3;k++){ const s=xFreeSolid(r,true); if(s>=0) xProp('eggsac',s,{room:r.id, hp:3}); } r.nest={next:12, alive:3}; break; }
    case 'hub': { xRareHub(r,c); break; }
    case 'pit': { xProp('pithole',c,{}); break; }
    case 'treasury': { const ch=xChest(c,{rich:true}); r.tre={state:'idle', t:0, chest:ch, items:[]};
      for(let k=0;k<3;k++){ const g=xFreeCell(r,true); if(g>=0) r.tre.items.push(xItem('gold',g,{n:Math.round((40+15*d)*(.8+XR()*.5))})); }
      const g=xFreeCell(r,true); if(g>=0) r.tre.items.push(xItem('gear',g,{gear:rollLoot(d+2,XR,true)})); break; }
    case 'mirror': { xProp('mirror',c,{}); break; }
    case 'gambler': { xPlaceNPCAt('gambler',c,{games:0}); break; }
    case 'forge': { xProp('anvil',c,{}); break; }
    case 'trade': { xProp('tradeshrine',c,{}); break; }
    case 'camp': { xPlaceNPCAt('camper',c,{stock:2}); const f=xFreeSolid(r,true); if(f>=0) xProp('campfire',f,{}); break; }
    case 'chapel': { const ghost=xPlaceNPCAt('ghost',c,{}); const a=xFreeSolid(r,true); if(a>=0) xProp('chapelaltar',a,{});
      const reach=xReach(), far=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r).sort((a,b)=>Math.hypot(b.cx-r.cx,b.cy-r.cy)-Math.hypot(a.cx-r.cx,a.cy-r.cy)).slice(0,4);
      const br=far.length?xpick(far):null, bc=br?xFreeCell(br):-1; if(bc>=0) xItem('ghostbones',bc,{ghost:ghost.name}); break; }
  } }
// the hub: three pads, each to a different place (two rooms and the secret closet), each with a pad back
const PAD_COL=['#b48cff','#7fe3ff','#f2c94c'];
function xRareHub(r,c0){ const reach=xReach(), others=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r&&!x.rare).sort(()=>XR()-.5).slice(0,2), cl=EX.rooms.find(x=>x.closet);
  const dests=[...others.map(x=>({room:x})),...(cl?[{room:cl,secret:true}]:[])];
  dests.forEach((dst,i)=>{ const a=i===0?c0:xFreeCell(r,true), b=dst.secret?xRoomCells(dst.room).find(x=>!EX.taken.has(x)&&!nearDoor(x)):xFreeCell(dst.room); if(a==null||a<0||b==null||b<0) return;
    const pa=xProp('tpad',a,{solid:false, col:i, secret:!!dst.secret}), pb=xProp('tpad',b,{solid:false, col:i, back:true}); pa.to=b; pb.to=a; }); }

/* ---------------- touching things ---------------- */
function xRareInteract(p){ const d=EX.depth; if(xInteractExplore(p)) return true;
  switch(p.kind){
    case 'eggsac': { p.hp--; xSfx('thud'); xSparks(xw(p.cell),xz(p.cell),0x8fd14f,10,1); if(p.hp>0){ xLog('You tear into the egg sac. It quivers.','dim'); return true; }
      xRemoveProp(p); const r=EX.rooms[p.room]; r.nest.alive--; xLog(r.nest.alive>0?'The egg sac bursts. '+r.nest.alive+' left.':'The last egg sac bursts. The nest is dead.','good');
      if(r.nest.alive<=0){ xXp(25+3*d,'nest destroyed'); const c=[xi(r.cx,r.cy),...xRoomCells(r)].find(x=>!EX.taken.has(x)&&!EX.chests.some(h=>h.cell===x)); if(c!=null){ const ch=xChest(c,{rich:true}); xMeshChest(ch); xLog('Among the husks: a chest the nest was hoarding.','loot'); } }
      return true; }
    case 'pithole': return xDlg({title:'A marked drop', sub:'Pit room', icon:['skull','#b48cff'], text:'A sign is nailed beside the hole: “TWO FLOORS DOWN. TREASURE BELOW. NO WAY UP BUT THE STAIRS.” Far below, something glitters.',
      buttons:[['Jump in',()=>xPitJump()],['Not now',null,true]]}), true;
    case 'mirror': if(p.used) return xSay('mirror','The mirror is cracked and dark.'), true;
      return xDlg({title:'The mirror', sub:'Mirror room', icon:['hero','#cfe6ff'], text:'Your reflection does not move when you do. It smiles. Touch the glass and it steps out to fight you, with a deck of your own colour. Beat it and it leaves something of you behind.',
        buttons:[['Touch the glass',()=>xMirrorFight(p)],['Step back',null,true]]}), true;
    case 'anvil': return xForge(p), true;
    case 'tradeshrine': return xTradeShrine(p), true;
    case 'campfire': return xSay('campfire','The fire crackles. Its warmth keeps the dark back.'), true;
    case 'chapelaltar': return xSay('chapel','A cracked altar. Candles burn on it that no one lit.'), true;
    case 'nestcore': return true;
  }
  return false; }
// stepping onto a pad: across to its partner (step off before it works again)
function xRareEnter(p){ if(p.kind!=='tpad') return false; if(EX.padLock===p.cell) return true; const to=p.to; if(to==null) return true;
  xSparks(xw(EX.pc),xz(EX.pc),new THREE.Color(PAD_COL[p.col]),16,2); EX.pc=to; EX.px=xw(to); EX.pz=xz(to); EX.path=[]; EX.padLock=to; xUpdateVis(); xSparks(xw(to),xz(to),new THREE.Color(PAD_COL[p.col]),16,2);
  xSfx('chime'); if(typeof xFlashView==='function') xFlashView(300); xLog(p.secret?'The gold pad hums and you stand somewhere sealed and secret.':p.back?'The pad sends you back to the hub.':'The pad flares and the room around you changes.',p.secret?'good':'dim'); return true; }

/* ---------------- every frame ---------------- */
function xRareTick(dt){ if(!EX||EX.busy) return; const d=EX.depth; xTickExplore(dt);
  if(EX.padLock!=null&&EX.pc!==EX.padLock) EX.padLock=null;
  for(const r of EX.rooms){
    // the nest hatches a group every 20 s (at most 3 out at once) while a sac still stands
    if(r.nest&&r.nest.alive>0){ r.nest.next-=dt; if(r.nest.next<=0){ r.nest.next=20;
      if(EX.groups.filter(g=>g.nest===r.id).length<3){ const c=[xi(r.cx,r.cy),...xRoomCells(r)].find(x=>!xSolid(x)&&x!==EX.pc); const wave=makeEncounter(d)[0].filter(id=>!ENEMY_DEFS[id].rare);
        if(c!=null&&wave.length){ const g=xGroup(wave.slice(0,1+xri(0,1)),c,'wander'); g.nest=r.id; EX.groups.push(g); if(X3&&X3.group) xGroupSprites(g,X3.group); if(EX.vis[c]) xLog('An egg sac splits and something crawls out.','warn'); } } } }
    // the treasury: touch its loot and the ceiling comes down
    const T=r.tre; if(!T||T.state==='done') continue;
    if(T.state==='idle'&&(T.chest.open||T.items.some(it=>!EX.items.includes(it)))){ T.state='fall'; T.t=14; EX.shakeT=.8; xSfx('thud'); xLog('The ceiling groans. Dust pours down. The treasury is collapsing: get out!','bad'); tip('The treasury is collapsing! Get out!',3000); }
    if(T.state==='fall'){ T.t-=dt; const inside=EX.room[EX.pc]===r.id; T.rock=(T.rock||0)-dt;
      if(T.rock<=0){ T.rock=.8; xSparks(xw(r.cx)+(XR()-.5)*r.w*XCS,xz(r.cy)+(XR()-.5)*r.h*XCS,0xb0a890,8,.5); if(inside&&XR()<.35){ xLog('A falling stone strikes you!','bad'); xHurt(Math.round(5+d*.6),'falling stone'); EX.shakeT=.3; } }
      if(T.t<=0){ T.state='done'; EX.shakeT=1; xSfx('thud'); let lost=0;
        for(const it of T.items) if(EX.items.includes(it)){ lost++; EX.items=EX.items.filter(x=>x!==it); EX.itemAt.delete(it.cell); if(it.mesh) it.mesh.visible=false; }
        if(!T.chest.open){ lost++; T.chest.open=true; if(T.chest.mesh) T.chest.mesh.visible=false; }
        if(inside){ const out=[...EX.doors.keys()].find(i=>xAdj4(i).some(c=>EX.room[c]===r.id)), to=out!=null?xAdj4(out).find(c=>EX.room[c]!==r.id&&EX.t[c]!==T_ROCK):null;
          xHurt(Math.round(xmaxHp()*.25),'the collapsing treasury'); if(to!=null&&EX.hp>0){ EX.pc=to; EX.px=xw(to); EX.pz=xz(to); EX.path=[]; xUpdateVis(); } xLog('The treasury caves in on you! You dig your way out, bruised.','bad'); }
        else xLog('Behind you the treasury caves in with a roar.'+(lost?' Whatever you left is buried.':' You got it all.'),lost?'warn':'good');
        xHud(); } } } }
function xRareHud(out){ for(const r of EX.rooms) if(r.tre&&r.tre.state==='fall') out.push('<span class="xs bad">⏳ '+Math.ceil(r.tre.t)+'s</span>');
  if(XRUN&&XRUN.ally&&XRUN.ally.fights>0) out.push('<span class="xs good" title="Fights beside you">⚔ '+XRUN.ally.name+' ×'+XRUN.ally.fights+'</span>');
  if(EX.bones) out.push('<span class="xs">🦴 bones</span>');
  if(EX.torch) out.push('<span class="xs good" title="Dark rooms are lit for you on this floor">🔥 torch</span>'); if(EX.planks) out.push('<span class="xs" title="Walk into a chasm\'s edge to bridge it">🪵 planks</span>'); }

/* ---------------- items ---------------- */
function xRarePickup(it){ if(xPickupExplore(it)) return true; if(it.kind!=='ghostbones') return false; EX.bones=it.ghost; xSfx('click'); xLog('You gather up '+it.ghost+'’s bones. Bring them back to the chapel.','loot'); return true; }
function xRareItemMesh(it){ const em=xItemMeshExplore(it); if(em) return em; if(it.kind!=='ghostbones') return null; const m=new THREE.Group(), bone=xMat(0xe8e0c8);
  for(let k=0;k<4;k++){ const b=xBox(.36,.07,.07,bone,(k%2-.5)*.1,-.1+k*.05,(k-1.5)*.08); b.rotation.y=k*.8; m.add(b); } m.add(xBall(.12,bone,0,.1,0), xBall(.18,xGlowMat(0xcfe6ff,{transparent:true,opacity:.35}),0,.1,0)); return m; }

/* ---------------- the pit ---------------- */
function xPitJump(){ let n=2; const m=xFloors(); for(let k=1;k<=2;k++){ const dd=EX.depth+k; if(isBossDepth(dd)&&!(m&&m.get(dd)&&m.get(dd).bossDead)){ n=k; break; } }
  if(XRUN) XRUN.pitGift=EX.depth+n; xFall(n,'You jump into the pit and drop, and drop…',n>1);
  setTimeout(()=>{ if(!EX||!XRUN||XRUN.pitGift!==EX.depth) return; XRUN.pitGift=0; const c=[...xAdj4(EX.pc),...xRoomCells(roomOf(EX.pc)||{x:0,y:0,w:0,h:0})].find(x=>EX.t[x]===T_FLOOR&&!EX.taken.has(x)&&x!==EX.pc&&x!==EX.down&&x!==EX.up);
    if(c!=null){ const ch=xChest(c,{rich:true,legend:XR()<.25}); xMeshChest(ch); xLog('Beside you in the rubble lies what glittered from above: a heavy chest.','loot'); } },900); }

/* ---------------- the mirror ---------------- */
const REFLECT_IDS={};
for(const c of SIX){ const id='reflect_'+c; REFLECT_IDS[c]=id;
  ENEMY_DEFS[id]={name:'Your Reflection', color:c, hp:260, dmg:15, rate:[2.6,3.4], moves:['shot','lunge'], ai:'align', deck:true, mini:true, look:'knight', tint:'#cfe6ff', scale:1.15,
    info:'It fights with a deck of your colour. At half health it grows desperate.'}; }
function myColor(){ const d=typeof activeDeck==='function'?activeDeck():null, list=d?d.list.map(id=>CARDS[id]):[]; return (typeof deckElem==='function'&&deckElem(list))||(()=>{ const n={}; for(const c of list) if(c&&SIX.includes(c.color)) n[c.color]=(n[c.color]||0)+1; return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||'shadow'; })(); }
function xMirrorFight(p){ const col=myColor(), g=xGroup([REFLECT_IDS[col]],EX.pc,'wander'); g.mirror=p; g.mirrorCol=col; g.x=EX.px; g.z=EX.pz; g.seen=true; EX.groups.push(g); xEngage(g,null); }
function xRareAfterFight(g){ if(!g||!g.mirror) return; const p=g.mirror, d=EX.depth; p.used=true; if(p.glass) p.glass.visible=false;
  const card=rollCard({depth:d+3,min:'rare',color:g.mirrorCol}), res=addCards(save,[card]), gold=Math.round(80+25*d); save.gold+=gold; persist(); xCardPop(card,res[0]&&res[0].isNew);
  xLog('Your reflection shatters. In the shards: '+card.name+' and '+gold+' gold.','loot'); xXp(30+4*d,'reflection beaten'); }

/* ---------------- the forge ---------------- */
function xForge(p){ const s=gearState(save);
  xDlg({title:'The forge', sub:'Forge', icon:['plate','#ff9a3a'], text:p.used?'The coals have gone grey. The forge has done its work.':'The coals still glow and the anvil is sound. You can temper one piece you wear: +1 level, free. Once.',
    body(box){ if(p.used) return; let n=0;
      for(const slot of SLOTS){ const id=s.gear[slot]; if(!id||!GEAR[id]) continue; const lv=s.gearLv[id]||0; n++;
        xRow(box,gearIcon(id,32),gearName(save,id),lv>=MAX_LEVEL?'Already at +'+MAX_LEVEL:'To +'+(lv+1),lv>=MAX_LEVEL?'—':'Temper',()=>{ s.gearLv[id]=lv+1; p.used=true; persist(); xSfx('chime'); xDlgClose(); xLog('Hammer, heat, water: your '+gearName(save,id)+' is stronger.','good'); tip(gearName(save,id)+' +'+(lv+1)); },lv>=MAX_LEVEL); }
      if(!n) box.innerHTML='<p class="hint">You wear nothing the forge can work.</p>'; },
    buttons:[['Leave',null]]}); }

/* ---------------- the shrine of trade ---------------- */
const RARITY_UP={common:'uncommon', uncommon:'rare', rare:'legendary'};
function xTradeShrine(p){ const d=EX.depth;
  xDlg({title:'Shrine of trade', sub:'Shrine of trade', icon:['cards','#f2c94c'], text:p.used?'The scales are still. The shrine has traded.':'Two bowls on a scale. Lay a spare card in one, and the other fills with a card one rarity higher. Once.',
    body(box){ if(p.used) return; const ids=Object.keys(save.owned).filter(id=>CARDS[id]&&RARITY_UP[CARDS[id].rarity]&&!CARDS[id].mastery&&typeof spareCopies==='function'&&spareCopies(save,id)>0)
        .sort((a,b)=>['common','uncommon','rare'].indexOf(CARDS[b].rarity)-['common','uncommon','rare'].indexOf(CARDS[a].rarity)).slice(0,14);
      if(!ids.length) box.innerHTML='<p class="hint">You have no spare cards: every copy you own is in a deck.</p>';
      for(const id of ids){ const c=CARDS[id], pic=typeof artURL==='function'?`<img class="pxi" src="${artURL(c)}" width="32" height="32" alt="">`:'';
        xRow(box,pic,c.name+' ×'+spareCopies(save,id)+' spare',RARITY[c.rarity].n+' → '+RARITY[RARITY_UP[c.rarity]].n,'Offer',()=>{
          save.owned[id]--; const got=rollCard({depth:d+2,min:RARITY_UP[c.rarity]}), res=addCards(save,[got]); p.used=true; persist(); xSfx('chime'); xDlgClose(); xCardPop(got,res[0]&&res[0].isNew);
          xLog('The scale tips. '+c.name+' is gone; '+got.name+' ('+RARITY[got.rarity].n+') lies in the other bowl.','loot'); }); } },
    buttons:[['Leave',null]]}); }

/* ---------------- people ---------------- */
function xRareTalk(p){ const d=EX.depth, L=xpick(LINES[p.role]||['…']);
  if(p.role==='gambler') return xGamble(p,L), true;
  if(p.role==='camper') return xCamper(p,L), true;
  if(p.role==='ghost'){ if(p.state==='done') return true;
    if(EX.bones===p.name){ EX.bones=null; p.state='done'; const r=xRollReward(d,[['perm',3],['card',2],['gear',1]],true);
      return xDlg({look:p.look,title:p.name,sub:p.title,text:'My bones… you brought them home. Lay them on the altar. At last, I can rest. Take this, with my thanks: '+rewardText(r)+'.',
        buttons:[['Rest well',()=>{ xGrant(r,'A ghost’s thanks'); const u=unreadLore(); if(u.length){ addLore(u[0].id); persist(); xLog('As it fades, the ghost whispers a tale: “'+u[0].title+'”.','good'); } xRemoveProp(p); }]]}), true; }
    if(p.state!=='active'){ p.state='active'; xLog('Quest: find '+p.name+'’s bones on this floor and bring them to the chapel.','loot'); }
    return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' My bones lie somewhere on this floor, far from here. Bring them back to this chapel and I will reward you.',buttons:[['I’ll find them',null]]}), true; }
  return false; }
function xGamble(p,L){ const d=EX.depth, drawCost=Math.round(60+6*d);
  if(p.games>=6) return xDlg({look:p.look,title:p.name,sub:p.title,text:'No more! You’ve cleaned me out of luck for today.',buttons:[['Farewell',null]]});
  const roll=()=>1+Math.floor(Math.random()*6)+1+Math.floor(Math.random()*6);
  const dice=bet=>{ if(save.gold<bet) return tip('Not enough gold'); p.games++; const a=roll(), b=roll(); let msg;
    if(a>b){ save.gold+=bet; msg='You roll '+a+', '+p.name+' rolls '+b+'. You win '+bet+' gold!'; xSfx('chime'); }
    else if(a<b){ save.gold-=bet; msg='You roll '+a+', '+p.name+' rolls '+b+'. You lose '+bet+' gold.'; xSfx('thud'); }
    else msg='You both roll '+a+'. A draw: your bet comes back.';
    persist(); xLog(msg,a>b?'gold':a<b?'bad':'dim'); xHud(); xGamble(p,msg); };
  xDlg({look:p.look, title:p.name, sub:p.title, text:L+' '+(6-p.games)+' games left before I call it a night.',
    body(box){ for(const bet of [20,50,100].map(x=>Math.round(x*(1+.08*d)))) xRow(box,pxIcon('coin','#f2c94c'),'Bones for '+bet,'Two dice each; higher roll wins your bet back doubled','Roll',()=>dice(bet),save.gold<bet);
      xRow(box,pxIcon('cards','#b48cff'),'Blind draw','Pay '+drawCost+' gold for a face-down card. Most are common. Some are not.','Draw',()=>{ if(save.gold<drawCost) return tip('Not enough gold'); save.gold-=drawCost; p.games++;
        const x=Math.random(), card=rollCard({depth:d+1,min:x<.04?'legendary':x<.2?'rare':undefined}), res=addCards(save,[card]); persist(); xCardPop(card,res[0]&&res[0].isNew); xLog('You turn the card over: '+card.name+' ('+RARITY[card.rarity].n+').','loot'); xHud(); xGamble(p,'Ha! '+card.name+'. '+(card.rarity==='legendary'||card.rarity==='rare'?'Lucky.':'Better luck next time.')); },save.gold<drawCost); },
    buttons:[['Farewell',null]]}); }
function xCamper(p,L){ const d=EX.depth, price=Math.round(50+8*d), m=xmaxHp();
  xDlg({look:p.look, title:p.name, sub:p.title, text:L,
    body(box){
      xRow(box,pxIcon('hero','#ff9a3a'),'Share the fire','Heal 35% of your health. Once.',p.rested?'Done':'Rest',()=>{ p.rested=true; EX.hp=Math.min(m,EX.hp+Math.round(m*.35)); xSfx('chime'); xLog('You rest by '+p.name+'’s fire. Some of your wounds close.','good'); xHud(); xCamper(p,'Rest well.'); },!!p.rested);
      xRow(box,pxIcon(BAG.draught.icon,BAG.draught.col),BAG.draught.name+' ('+p.stock+' left)',BAG.draught.text,'40 gold',()=>{ if(save.gold<40) return tip('Not enough gold'); save.gold-=40; p.stock--; addBag('draught'); persist(); xSfx('click'); xHud(); xCamper(p,'Spare it well.'); },p.stock<=0||save.gold<40);
      const has=XRUN&&XRUN.ally&&XRUN.ally.fights>0;
      xRow(box,pxIcon('bow','#f2c94c'),'Fight beside me','They join your next 3 fights, shooting your foes. '+price+' gold, or a '+BAG.draught.name+' for their wounds.',has||p.joined?'Joined':'Hire',()=>{
        if(bagN('draught')>0) dState().bag.draught--; else if(save.gold>=price) save.gold-=price; else return tip('You need '+price+' gold or a '+BAG.draught.name);
        p.joined=true; XRUN.ally={name:p.name, fights:3, dmg:Math.round(8+3*d)}; persist(); xSfx('chime'); xLog(p.name+' shoulders a bow: “Lead the way.” They will fight beside you in your next 3 fights.','good'); xHud(); xDlgClose(); xRemoveProp(p); },has||!!p.joined); },
    buttons:[['Farewell',null]]}); }
// in a dungeon fight: the hired adventurer looses a shot every 3.5 s
function roomAllyStart(){ const A=XRUN&&XRUN.ally; if(!B||!A||A.fights<=0) return; A.fights--; B.ally=A;
  const shot=()=>{ if(!B||B.ally!==A) return; if(B.phase==='fight'){ const e=pick(alive()); if(e){ B.fx.push({kind:'arc',a:B.player.tile,b:e.tile,color:'#f2c94c',t:0,life:.3}); floater(A.name.split(' ')[0]+' shoots',e.tile,'#f2c94c'); hitEnemy(e,A.dmg,null,{raw:true}); } }
    if(B.phase==='fight'||B.phase==='custom') later(3.5,shot); };
  later(2,shot); }

/* ---------------- how they look ---------------- */
function xRareMesh(p,g){ if(xMeshExplore(p,g)) return true; const stone=xMat(0x6e6a64), dark=xMat(0x2a2a30);
  switch(p.kind){
    case 'eggsac': { const m=xMat(0x6a8a3a,{emissive:0x1a3008}); for(let k=0;k<3;k++){ const b=xBall(.28-k*.05,m,(k-1)*.2,.28+k*.12,(k%2)*.12); b.scale.y=1.2; g.add(b); } g.add(xBall(.12,xGlowMat(0xb8ff6a),0,.55,.2)); p.pulse=g.children[0]; return true; }
    case 'nestcore': { const c=new THREE.Mesh(new THREE.CircleGeometry(1.2,16),new THREE.MeshBasicMaterial({color:0x2a3a10,transparent:true,opacity:.6})); c.rotation.x=-Math.PI/2; c.position.y=.04; g.add(c); return true; }
    case 'tpad': { const col=new THREE.Color(PAD_COL[p.col]); g.add(xCyl(.62,.08,dark,0,.04,0)); const d=new THREE.Mesh(new THREE.CircleGeometry(.5,20),xGlowMat(col,{transparent:true,opacity:.7})); d.rotation.x=-Math.PI/2; d.position.y=.1; g.add(d);
      const r=new THREE.Mesh(new THREE.TorusGeometry(.58,.04,6,24),xGlowMat(col)); r.rotation.x=Math.PI/2; r.position.y=.14; g.add(r); p.ring=r; return true; }
    case 'pithole': { g.add(xCyl(1.05,.12,xMat(0x050507),0,.03,0)); const rim=new THREE.Mesh(new THREE.TorusGeometry(1.05,.1,6,24),stone); rim.rotation.x=Math.PI/2; rim.position.y=.08; g.add(rim);
      g.add(xBox(.08,1.1,.08,xMat(0x5a3a22),.9,.55,.9), xBox(.6,.35,.05,xMat(0x8a6a42),.9,1.05,.9)); g.add(xBall(.06,xGlowMat(0xf2c94c),0,.12,0)); return true; }
    case 'mirror': { g.add(xBox(1.1,2.1,.18,xMat(0x6a5a3a),0,1.05,0)); p.glass=xBox(.9,1.8,.04,xGlowMat(0xcfe6ff,{transparent:true,opacity:.55}),0,1.05,.1); g.add(p.glass); if(p.used) p.glass.visible=false; return true; }
    case 'anvil': { const iron=xMat(0x3a3a40,{shininess:40}); g.add(xBox(.5,.5,.4,stone,0,.25,0), xBox(.9,.22,.36,iron,0,.6,0), xBox(.3,.12,.3,iron,.52,.6,0));
      g.add(xBox(.6,.3,.6,dark,-.9,.15,.2), xBall(.18,xGlowMat(0xff7a2a),-.9,.34,.2)); return true; }
    case 'tradeshrine': { g.add(xBox(.5,.9,.5,stone,0,.45,0), xBox(1.2,.06,.08,xMat(0xf2c94c,{emissive:0x402a08}),0,1.1,0), xCyl(.04,.4,xMat(0xf2c94c),0,.95,0));
      g.add(xCyl(.22,.06,xMat(0xc0a050),-.55,1.02,0), xCyl(.22,.06,xMat(0xc0a050),.55,1.02,0), xBall(.1,xGlowMat(0xb48cff),.55,1.12,0)); return true; }
    case 'campfire': { const wood=xMat(0x6a4020); for(let k=0;k<3;k++){ const l=xBox(.7,.1,.12,wood,0,.08,0); l.rotation.y=k*1.05; g.add(l); } p.flame=xCone(.22,.6,xGlowMat(0xff9a3a,{transparent:true,opacity:.85}),0,.4,0); g.add(p.flame); return true; }
    case 'chapelaltar': { g.add(xBox(1.2,.7,.6,stone,0,.35,0)); for(const x of [-.4,0,.4]){ g.add(xCyl(.05,.25,xMat(0xf0e2bc),x,.82,0), xBall(.05,xGlowMat(0xcfe6ff),x,1,0)); } return true; }
  }
  return false; }
function xRareAnim(T){ if(!EX) return; xAnimExplore(T); for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
  if(p.kind==='eggsac'&&p.pulse) p.pulse.scale.setScalar(1+.06*Math.sin(T*3+p.cell));
  if(p.kind==='campfire'&&p.flame) p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); } }

/* ---------------- round 3: exploration rooms ----------------
     flood     Flooded room: you wade at half speed; things lie sunk under the water, found by searching.
     dark      Dark room: you see almost nothing without the torch left somewhere on the floor. Glowing
               moss marks the way from the door to a rich chest; something sleeps in there.
     bridge    Collapsed bridge: a chasm cuts off a ledge holding treasure. Find the planks on the floor
               and walk into the edge to lay a bridge.
     library   Overgrown library: search the shelves for a tale, a scroll, a tome (a card) or gold.
     crystal   Crystal cave: a geode is buried in the cave; the crystals glow and ring louder the
               nearer you are. Search to dig it up (Relic Shards, essence, gold). */
Object.assign(RARE_ROOMS,{
  flood:  {name:'Flooded room',     icon:'🌊', min:2, w:5, h:4, safe:false},
  dark:   {name:'Dark room',        icon:'🌑', min:2, w:5, h:4, safe:false},
  bridge: {name:'Collapsed bridge', icon:'🌉', min:2, w:6, h:4, safe:false, fit:r=>!!xBridgeSplit(r)},
  library:{name:'Overgrown library',icon:'📚', min:1, w:4, h:3, safe:true},
  crystal:{name:'Crystal cave',     icon:'💎', min:2, w:4, h:4, safe:false},
});
// a chasm line across a room that cuts off a ledge with no door of its own: [chasm cells, ledge cells] or null
function xBridgeSplit(r){ const cells=xRoomCells(r), doorSide=f=>[...EX.doors.keys()].some(i=>xAdj4(i).some(c=>EX.room[c]===r.id&&f(c)));
  const tries=[];
  for(const s of [r.x+2,r.x+r.w-3]) tries.push({line:c=>xcx(c)===s, ledge:s<r.x+r.w/2?c=>xcx(c)<s:c=>xcx(c)>s});
  for(const s of [r.y+1,r.y+r.h-2]) tries.push({line:c=>xcy(c)===s, ledge:s<r.y+r.h/2?c=>xcy(c)<s:c=>xcy(c)>s});
  for(const t of tries){ const ledge=cells.filter(t.ledge), line=cells.filter(t.line); if(ledge.length<3||doorSide(c=>t.ledge(c)||t.line(c))) continue; return [line,ledge]; }
  return null; }
const xRareSpeed=()=>{ const i=EX&&EX.room[EX.pc]; return i>=0&&EX.rooms[i].flood?.55:1; };
function xFillExplore(r){ const d=EX.depth, c=xFreeSolid(r,true);
  switch(r.rare){
    case 'flood': { r.flood=true; xProp('water',xi(r.cx,r.cy),{solid:false, room:r.id});
      const finds=[{kind:'gold',n:Math.round(50+18*d)},{kind:'key',key:d>=5&&XR()<.4?'silver':'bronze'},{kind:'gear',gear:rollLoot(d+1,XR)},{kind:'potion',bag:'draught'}].sort(()=>XR()-.5).slice(0,3);
      for(const f of finds){ const s=xFreeCell(r,true); if(s>=0) xProp('sunken',s,{solid:false, found:false, find:f}); } return true; }
    case 'dark': { r.dark=true; r.lit=false; const far=xRoomCells(r).filter(x=>!EX.taken.has(x)&&!nearDoor(x)).sort((a,b)=>xDoorDist(r,b)-xDoorDist(r,a))[0];
      if(far!=null){ xChest(far,{rich:true}); const path=xMossPath(r,far); path.forEach((m,i)=>{ if(i%1===0&&!EX.taken.has(m)) xProp('moss',m,{solid:false}); }); }
      const g=xFreeCell(r,true); if(g>=0){ const w=makeEncounter(d)[0].filter(id=>!ENEMY_DEFS[id].rare); if(w.length) EX.groups.push(xGroup(w.slice(0,2),g,'sleep')); }
      const reach=xReach(), rs=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r), tr=rs.length?rs.sort((a,b)=>Math.hypot(a.cx-r.cx,a.cy-r.cy)-Math.hypot(b.cx-r.cx,b.cy-r.cy))[Math.min(rs.length-1,1)]:null, tc=tr?xFreeCell(tr):-1;
      if(tc>=0) xItem('torch',tc,{}); return true; }
    case 'bridge': { const sp=xBridgeSplit(r); if(!sp) return true; const [line,ledge]=sp;
      for(const x of line) xProp('chasm',x,{room:r.id, solid:true});
      const lc=ledge.filter(x=>!EX.taken.has(x)&&!nearDoor(x)); if(lc.length) xChest(lc[Math.floor(lc.length/2)],{rich:true,legend:XR()<.2}); if(lc.length>2){ const u=unreadLore(); xProp('pedestal',lc[0],{lore:xpick(u.length?u:LORE).id}); }
      const reach=xReach(), rs=xOpenRooms(reach,{notStart:true}).filter(x=>x!==r), pr=rs.length?xpick(rs):null, pc=pr?xFreeCell(pr):-1; if(pc>=0) xItem('planks',pc,{}); return true; }
    case 'library': { const n=Math.min(4,Math.max(3,Math.floor(r.w*r.h/6))), loot=['lore','scroll','tome','gold','dust'].sort(()=>XR()-.5);
      for(let k=0;k<n;k++){ const s=xFreeSolid(r,true); if(s>=0) xProp('libshelf',s,{loot:loot[k]}); } return true; }
    case 'crystal': { const g=xFreeCell(r,true); if(g>=0) r.geode=xProp('geode',g,{solid:false, found:false});
      for(let k=0;k<4;k++){ const s=xFreeSolid(r,false); if(s>=0) xProp('cavecrystal',s,{room:r.id, ph:XR()*6}); } return true; }
  }
  return false; }
const xDoorDist=(r,c)=>Math.min(...[...EX.doors.keys()].filter(i=>xAdj4(i).some(x=>EX.room[x]===r.id)).map(i=>Math.abs(xcx(i)-xcx(c))+Math.abs(xcy(i)-xcy(c))),99);
// glowing moss: the cells from the room's nearest door to its chest
function xMossPath(r,goal){ const door=[...EX.doors.keys()].filter(i=>xAdj4(i).some(x=>EX.room[x]===r.id)).sort((a,b)=>Math.hypot(xcx(a)-xcx(goal),xcy(a)-xcy(goal))-Math.hypot(xcx(b)-xcx(goal),xcy(b)-xcy(goal)))[0]; if(door==null) return [];
  const dist=xbfs(EX.t,EX.doors,goal,false,n=>EX.room[n]!==r.id&&n!==door), out=[]; let cur=door;
  for(let k=0;k<60&&cur!==goal;k++){ const nx=xAdj4(cur).filter(n=>dist[n]>=0&&dist[n]<dist[cur]).sort((a,b)=>dist[a]-dist[b])[0]; if(nx==null) break; cur=nx; if(cur!==goal) out.push(cur); }
  return out; }
function xInteractExplore(p){ const d=EX.depth;
  switch(p.kind){
    case 'chasm': { if(p.bridged) return true; if(!EX.planks) return xSay('chasm','The bridge here fell long ago. The gap is too wide to jump. Planks would span it.'), true;
      EX.planks=false; for(const q of EX.props) if(q.kind==='chasm'&&q.room===p.room){ q.bridged=true; q.solid=false; if(q.plank) q.plank.visible=true; }
      xSfx('grind'); xLog('You lay the planks across the gap. A rickety bridge, but it holds.','good'); xXp(15+2*d,'bridge laid'); xUpdateVis(); return true; }
    case 'libshelf': { if(p.searched) return xSay('shelf','You have already searched these shelves.'), true; p.searched=true; xSfx('click');
      if(p.loot==='lore'){ const u=unreadLore(); if(u.length){ addLore(u[0].id); persist(); return xDlgText(u[0].title,'Under the vines, a book still dry enough to read. '+u[0].text), true; } addMat('essence'); xLog('A crumbling book leaves a mote of Arcane Essence in your hands.','loot'); }
      else if(p.loot==='scroll'){ const k=XR()<.6?'enchant':'purify'; addScroll(save,k); xLog('Rolled inside a hollow book: a Scroll of '+(k==='purify'?'Purifying':'Enchanting')+'.','loot'); }
      else if(p.loot==='tome'){ const c=rollCard({depth:d+2,min:'uncommon'}), res=addCards(save,[c]); xCardPop(c,res[0]&&res[0].isNew); xLog('A spell tome, its pages still bright: '+c.name+'.','loot'); }
      else if(p.loot==='gold'){ const g=Math.round(30+12*d); save.gold+=g; xLog('Someone hid '+g+' gold behind the books.','gold'); }
      else xLog('Dust, rot and a very angry spider. Nothing here.','dim');
      persist(); xHud(); return true; }
    case 'cavecrystal': { if(EX.crystalTaken) return xSay('crystal2','The crystals ring when you touch them, but the rest are rooted deep.'), true;
      EX.crystalTaken=true; addMat('essence'); xSfx('chime'); xLog('You prise loose a small crystal: Arcane Essence. The rest ring louder near something buried here.','loot'); return true; }
    case 'water': case 'moss': case 'sunken': case 'geode': return true;
  }
  return false; }
function xTickExplore(dt,T){ const here=EX.room[EX.pc], r=here>=0?EX.rooms[here]:null;
  EX.lampMul=r&&r.dark?(EX.torch?1.25:.3):1;
  for(const p of EX.props){ if(p.gone) continue;
    // a sunken find spotted by searching rises to the surface as an item to pick up
    if(p.kind==='sunken'&&p.found){ p.gone=true; if(p.mesh) p.mesh.visible=false; EX.taken.delete(p.cell); if(EX.propAt.get(p.cell)===p) EX.propAt.delete(p.cell);
      const it=xItem(p.find.kind,p.cell,p.find); xMeshItem(it); xLog('Something glints under the water!','good'); }
    if(p.kind==='geode'&&p.found){ p.gone=true; const R=EX.rooms[EX.room[p.cell]]; addMat('shard',2); addMat('essence'); const g=Math.round(60+20*EX.depth); save.gold+=g; persist(); xSfx('chime');
      xLog('You dig where the crystals ring loudest: a geode, split open. 2 Relic Shards, Arcane Essence and '+g+' gold.','loot'); xXp(20+2*EX.depth,'geode found'); if(R) R.geodeDone=true; xHud(); } }
  // the crystals ring as you near the geode
  for(const R of EX.rooms){ if(!R.geode||R.geodeDone) continue; const dd=Math.hypot(xcx(R.geode.cell)-xcx(EX.pc),xcy(R.geode.cell)-xcy(EX.pc)), k=Math.max(0,1-dd/14);
    R.glow=k; if(here===R.id){ const lvl=dd<2.5?3:dd<5?2:1; if(lvl!==R.hum){ R.hum=lvl; xLog(['','The crystals hum faintly.','The crystals ring louder. Something is buried close.','The crystals sing! It is right under your feet: search.'][lvl],'dim'); if(lvl>=2) xSfx('chime'); } } else R.hum=0; } }
function xPickupExplore(it){
  if(it.kind==='torch'){ EX.torch=true; xSfx('click'); xLog('You take up a torch. Dark rooms will not stay dark for you now, on this floor.','good'); tip('Torch!'); xUpdateVis(); return true; }
  if(it.kind==='planks'){ EX.planks=true; xSfx('click'); xLog('A bundle of sound planks. Long enough to bridge a gap.','loot'); return true; }
  return false; }
function xItemMeshExplore(it){
  if(it.kind==='torch'){ const m=new THREE.Group(); m.add(xCyl(.05,.6,xMat(0x6a4020),0,0,0), xCone(.12,.3,xGlowMat(0xff9a3a),0,.4,0,6)); m.rotation.z=.4; return m; }
  if(it.kind==='planks'){ const m=new THREE.Group(), w=xMat(0x8a6a42); for(let k=0;k<3;k++) m.add(xBox(.9,.06,.18,w,0,k*.07-.07,(k-1)*.2)); return m; }
  return null; }
function xMeshExplore(p,g){
  switch(p.kind){
    case 'water': { const r=EX.rooms[p.room], ox=(r.x+r.w/2)*XCS-xw(p.cell), oz=(r.y+r.h/2)*XCS-xz(p.cell);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(r.w*XCS,r.h*XCS),new THREE.MeshBasicMaterial({color:0x1d5a8a,transparent:true,opacity:.5,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(ox,.2,oz); g.add(m); p.waterMat=m.material;
      // light ripples drifting over the water
      const tex=xRippleTex(); tex.repeat.set(r.w/2,r.h/2);
      const rip=new THREE.Mesh(new THREE.PlaneGeometry(r.w*XCS,r.h*XCS),new THREE.MeshBasicMaterial({map:tex,color:0x9fdcff,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false})); rip.rotation.x=-Math.PI/2; rip.position.set(ox,.22,oz); g.add(rip); p.ripTex=tex; return true; }
    case 'sunken': { const m=xBall(.08,xGlowMat(0xcfe6ff,{transparent:true,opacity:.0}),0,.22,0); g.add(m); p.glint=m.material; return true; }
    case 'moss': { const m=new THREE.Mesh(new THREE.CircleGeometry(.26,8),xGlowMat(0x7dffa8,{transparent:true,opacity:.6})); m.rotation.x=-Math.PI/2; m.position.y=.04; g.add(m); return true; }
    case 'chasm': { g.add(xBox(XCS,.04,XCS,xMat(0x020203),0,.03,0)); p.plank=new THREE.Group(); for(let k=0;k<4;k++) p.plank.add(xBox(XCS*.9,.06,.32,xMat(0x8a6a42),0,.08,(k-1.5)*.42)); p.plank.visible=!!p.bridged; g.add(p.plank); return true; }
    case 'libshelf': { const wood=xMat(0x5a3a22); g.add(xBox(1.3,1.9,.5,wood,0,.95,0)); for(let k=0;k<3;k++) g.add(xBox(1.15,.28,.4,xMat([0x7a3a2a,0x3a5a7a,0x6a6a3a][k]),0,.45+k*.55,.06));
      g.add(xBox(.25,1.6,.06,xMat(0x3a7a3a),.45,.9,.27), xBox(.6,.2,.06,xMat(0x3a7a3a),-.2,1.7,.27)); return true; }
    case 'cavecrystal': { const m=new THREE.MeshBasicMaterial({color:0x8fe4ff}); for(let k=0;k<3;k++){ const c=xCone(.16+k*.04,.9-k*.2,m,(k-1)*.22,.45-k*.08,(k%2)*.15,5); c.rotation.z=(k-1)*.3; g.add(c); } p.cmat=m; return true; }
    case 'geode': return true;
  }
  return false; }
function xAnimExplore(T){ for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
  if(p.kind==='water'&&p.waterMat){ p.waterMat.opacity=.46+.06*Math.sin(T*1.7); if(p.ripTex){ p.ripTex.offset.x=(T*.05)%1; p.ripTex.offset.y=(Math.sin(T*.4)*.08)%1; } }
  if(p.kind==='sunken'&&p.glint) p.glint.opacity=Math.max(0,Math.sin(T*1.3+p.cell))**8*.8;
  if(p.kind==='cavecrystal'&&p.cmat){ const R=EX.rooms[p.room], k=R&&!R.geodeDone?R.glow||0:0, pulse=.5+.5*Math.sin(T*(2+10*k)+p.ph); p.cmat.color.setRGB(.35+.4*k*pulse+.1,.6+.35*k*pulse,.75+.25*k*pulse); } } }
function xRippleTex(){ if(xRippleTex.c) return xRippleTex.c.clone(); const N=64, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'); x.strokeStyle='rgba(255,255,255,.8)'; x.lineWidth=1.5;
  for(let k=0;k<5;k++){ x.beginPath(); const y0=k*13+4; for(let i=0;i<=N;i+=4) x.lineTo(i,y0+Math.sin(i/N*Math.PI*2+k)*3); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.NearestFilter; xRippleTex.c=t; const o=t.clone(); o.needsUpdate=true; return o; }
