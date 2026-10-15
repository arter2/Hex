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
  const n=XR()<.25?2:1; F.rare=pool.sort(()=>XR()-.5).slice(0,n); }
// rooms get their role once the floor is dug; one with no room to fit tries again next floor
function xRareAssign(F,give,take){ if(!F.rare) return;
  for(const k of F.rare){ const R=RARE_ROOMS[k], r=give(take(x=>x.w>=R.w&&x.h>=R.h),'rare',R.safe); if(r) r.rare=k; else if(XRUN) XRUN.next.rare=EX.depth+1; } }
const rareRoom=k=>EX.rooms.find(r=>r.rare===k);
const xRareName=k=>RARE_ROOMS[k]?RARE_ROOMS[k].icon+' '+RARE_ROOMS[k].name:k;

/* ---------------- filling the rooms ---------------- */
function xRareFill(r){ const d=EX.depth, c=xFreeSolid(r,true); if(c<0) return;
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
function xRareInteract(p){ const d=EX.depth;
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
function xRareTick(dt){ if(!EX||EX.busy) return; const d=EX.depth;
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
  if(EX.bones) out.push('<span class="xs">🦴 bones</span>'); }

/* ---------------- items ---------------- */
function xRarePickup(it){ if(it.kind!=='ghostbones') return false; EX.bones=it.ghost; xSfx('click'); xLog('You gather up '+it.ghost+'’s bones. Bring them back to the chapel.','loot'); return true; }
function xRareItemMesh(it){ if(it.kind!=='ghostbones') return null; const m=new THREE.Group(), bone=xMat(0xe8e0c8);
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
function xRareMesh(p,g){ const stone=xMat(0x6e6a64), dark=xMat(0x2a2a30);
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
function xRareAnim(T){ if(!EX) return; for(const p of EX.props){ if(!p.mesh||!p.mesh.visible) continue;
  if(p.kind==='eggsac'&&p.pulse) p.pulse.scale.setScalar(1+.06*Math.sin(T*3+p.cell));
  if(p.kind==='campfire'&&p.flame) p.flame.scale.y=.85+.2*Math.sin(T*9+p.cell); } }
