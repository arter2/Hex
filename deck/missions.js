/* Hexmancers — missions: things that happen while you explore a floor.
   Besides the people waiting in rooms (dungeon.js), most floors roll a mission that starts a
   while after you arrive, at a random moment, somewhere you are not looking:

   rescue   a scream: someone is cornered by monsters in a far room. Get there in time and win.
   bounty   a messenger bird brings a wanted notice: an elite monster (♛) roams this floor.
   escort   a wounded scout limps out of the dark: lead them to any stairs. Monsters go for them.
   purge    three cursed braziers flare up in violet fire: snuff them all.
   collect  a gust scatters an explorer's journal: find its five pages.
   nest     a nest hatches: wipe out its three broods (☠).

   A floor that has no one waiting usually gets one (90%), one that does more often than not (60%),
   and now and then a second one comes later. Missions go in the run's quest list (XRUN.quests),
   so they show in your bag and survive save points; what they put on the floor (people, monster
   groups, braziers, pages) is part of the floor and stays if you climb back up to it. A rescue
   fails when its time runs out or you leave the floor; an escort fails if the scout falls. */

Object.assign(NPC_KINDS,{
  captive:{title:'Cornered traveller', looks:['human_f','elf_f','dwarf_m','wizard','shaman_f'], names:['Tamsin','Old Hobb','Lira','Corwen','Bettany','Gil']},
  scout:  {title:'Wounded scout',      looks:['ranger_m','ranger_f','elf_m','orc_f'],          names:['Scout Maren','Scout Dace','Scout Ferro','Scout Ilse']},
});
Object.assign(LINES,{
  captive:['Thank the stars! I thought that was the end of me.','You came! I could hear them breathing outside the door.'],
  scout:['They got my unit. I can still walk, mostly.','Keep them off me and I can make it.'],
});
const MISSION_KINDS={rescue:1, bounty:1, escort:1, purge:.7, collect:.7, nest:.7};
const BOUNTY_NAMES=['Old Scar','the Gnawer','Red Maw','the Widowmaker','Grisletooth','the Butcher of the Deep','Mother Rot','Hollowjaw'];
const xmQuest=id=>XRUN&&XRUN.quests.find(q=>q.id===id);
const xmLive=q=>q&&!q.done&&!q.failed;

// a word for where a cell lies from you (north is up the screen)
function xmDir(c){ const dx=xcx(c)-xcx(EX.pc), dy=xcy(c)-xcy(EX.pc), a=Math.atan2(dy,dx)*180/Math.PI;
  return ['east','south-east','south','south-west','west','north-west','north','north-east'][Math.round(((a+360)%360)/45)%8]; }
// rooms anyone can reach that you are not in and cannot see right now, farthest first
function xmFarRooms(){ const reach=xReach(), here=EX.room[EX.pc];
  return xOpenRooms(reach,{notStart:true}).filter(r=>!r.role&&r.id!==here&&!EX.vis[xi(r.cx,r.cy)]&&!(r===EX.exit&&isBossDepth(EX.depth)))
    .sort((a,b)=>Math.hypot(b.cx-xcx(EX.pc),b.cy-xcy(EX.pc))-Math.hypot(a.cx-xcx(EX.pc),a.cy-xcy(EX.pc))); }
function xmGroup(ids,cell,state,o){ const g=Object.assign(xGroup(ids,cell,state),o||{}); EX.groups.push(g); EX.taken.add(cell); if(X3&&X3.group) xGroupSprites(g,X3.group); return g; }
function xmQuestAdd(q){ q=Object.assign({id:'m'+Date.now()+'_'+Math.floor(XR()*1e4), depth:EX.depth, done:false, failed:false},q); XRUN.quests.push(q); return q; }
function xmReward(q,why){ q.done=true; xXp(10+3*EX.depth,'mission'); xGrant(q.reward,why||'Mission'); xHud(); }
function xmFail(q,msg){ if(!xmLive(q)) return; q.failed=true; xLog(msg,'bad'); xSfx('thud'); xHud(); }

/* ---------------- planning: which missions this floor will spring, and when ---------------- */
function xPlanEvents(){ EX.events=[]; if(EX.branch||!XRUN) return;
  const hasNpc=EX.props.some(p=>p.kind==='npc'&&p.role!=='hermit'&&p.role!=='prisoner');
  if(XR()>=(hasNpc?.6:.9)) return;
  const kinds=()=>Object.entries(MISSION_KINDS).filter(([k])=>!(k==='nest'&&EX.depth<2)&&!EX.events.some(e=>e.kind===k));
  EX.events.push({t:12+XR()*55, kind:xweighted(kinds())});
  if(XR()<.22) EX.events.push({t:EX.events[0].t+45+XR()*70, kind:xweighted(kinds())}); }

/* ---------------- starting one ---------------- */
const XM_START={
  rescue(){ const rooms=xmFarRooms().slice(0,4); for(const r of rooms.sort(()=>XR()-.5)){
      const c=xFreeSolid(r,true); if(c<0) continue; const gc=xFreeCell(r); if(gc<0) continue;
      const d=EX.depth, p=xPlaceNPCAt('captive',c,{state:'captive'});
      const dist=xbfs(EX.t,EX.doors,c,null,n=>xSolid(n)&&n!==c)[EX.pc], secs=Math.round(30+Math.max(8,dist)/3.5*1.7);
      const q=xmQuestAdd({kind:'rescue', giver:p.name, cell:c, room:r.id, left:secs, reward:xRollReward(d,[['gold',2],['gear',2],['perm',1],['bag',1.5],['key',1]],true)});
      p.qid=q.id; xMeshProp(p);
      const wave=makeEncounter(d)[0]; xmGroup(wave.slice(0,Math.min(wave.length,2+(d>=4?1:0))),gc,'guard',{mission:q.id});
      xUpdateVis(); xSfx('whisper',Math.sign(xcx(c)-xcx(EX.pc)));
      xDlg({title:'A scream!', icon:['skull','#ff5d6c'], text:'"Help! Somebody, please!" A cry echoes from the '+xmDir(c)+'. Someone is cornered by monsters. Reach them within '+secs+' seconds and drive the monsters off. (The spot is marked on your map.)', buttons:[['Go!',null]]});
      xLog('Rescue '+p.name+' to the '+xmDir(c)+' within '+secs+' s.','loot'); return true; }
    return false; },
  bounty(){ const r=xmFarRooms()[0]; if(!r) return false; const c=xFreeCell(r); if(c<0) return false; const d=EX.depth;
    const wave=makeEncounter(d+1)[0], ids=wave.slice(0,Math.min(3,wave.length)), name=xpick(BOUNTY_NAMES), what=ENEMY_DEFS[ids[0]].name;
    const q=xmQuestAdd({kind:'bounty', giver:'the Hunters’ Lodge', name, what, reward:xRollReward(d+1,[['gold',4],['gear',2],['mat',1]],true)});
    xmGroup(ids,c,'wander',{mission:q.id, elite:true, tagTxt:'♛', tagCol:'#ffd166'});
    xSfx('chime'); xDlg({title:'Wanted', sub:'A messenger bird drops a note', icon:['scroll','#f2c94c'], text:'WANTED: '+name+', a '+what+' and its pack, loose on this floor. Look for the gold crown (♛). Bring it down and the Hunters’ Lodge pays '+rewardText(q.reward)+'.', buttons:[['Take the bounty',null]]});
    xLog('Bounty: hunt down '+name+' (♛) on this floor.','loot'); return true; },
  escort(){ const reach=xReach(), px=xcx(EX.pc), py=xcy(EX.pc), cs=[];
    for(let dy=-6;dy<=6;dy++) for(let dx=-6;dx<=6;dx++){ const c=xi(px+dx,py+dy), n=Math.max(Math.abs(dx),Math.abs(dy)); if(n<3||px+dx<0||py+dy<0||px+dx>=XN||py+dy>=XN) continue;
      if(EX.t[c]===T_FLOOR&&reach[c]>=0&&!EX.taken.has(c)&&!EX.safe.has(c)&&!EX.traps.some(t=>t.cell===c)) cs.push(c); }
    if(!cs.length) return false; const c=xpick(cs), d=EX.depth;
    const p=xPlaceNPCAt('scout',c,{state:'idle', hp:3, reward:xRollReward(d,[['gold',2],['bag',2],['perm',1],['chute',1],['key',1.5]])}); p.solid=false; xMeshProp(p);
    for(let i=0;i<XN*XN;i++) if(Math.hypot(xcx(i)-xcx(c),xcy(i)-xcy(c))<1.6) EX.seen[i]=1;
    xUpdateVis(); xSfx('whisper',Math.sign(xcx(c)-px)); xLog('Someone limps out of the dark to the '+xmDir(c)+'.','loot'); xTalk(p); return true; },
  purge(){ const rooms=xmFarRooms().concat(xOpenRooms(xReach(),{notStart:true}).filter(r=>!r.role)), used=new Set(), cells=[];
    for(const r of rooms){ if(cells.length>=3) break; if(used.has(r.id)) continue; const c=xFreeSolid(r,true); if(c<0) continue; used.add(r.id); cells.push(c); }
    if(cells.length<3) return false;
    const q=xmQuestAdd({kind:'purge', giver:'the floor’s curse', need:3, got:0, reward:xRollReward(EX.depth,[['perm',1.5],['gold',2],['mat',2],['lore',1]],true)});
    for(const c of cells){ const b=xProp('brazier',c,{qid:q.id, lit:true}); xMeshProp(b); }
    xUpdateVis(); xSfx('grind'); xDlg({title:'Violet fire', icon:['skull','#b48cff'], text:'Somewhere on this floor three braziers flare up in violet fire, and the air turns cold and sour. Find them and snuff them out (walk into each) to lift the curse.', buttons:[['On it',null]]});
    xLog('Snuff the 3 cursed braziers on this floor.','loot'); return true; },
  collect(){ const reach=xReach(), cells=[]; for(let k=0;k<40&&cells.length<5;k++){ const c=xReachableCell(reach,{notStart:k>10}); if(c>=0&&!cells.includes(c)&&!EX.vis[c]) cells.push(c); }
    if(cells.length<5) return false;
    const q=xmQuestAdd({kind:'collect', giver:'a lost explorer', need:5, got:0, reward:xRollReward(EX.depth,[['lore',2],['gold',2],['bag',1],['solution',1],['perm',.7]],true)});
    for(const c of cells){ const it=xItem('mpage',c,{qid:q.id}); xMeshItem(it); }
    xUpdateVis(); xDlg({title:'Scattered pages', icon:['scroll','#e8e0c8'], text:'A cold gust sweeps through the halls and something flutters past you: the pages of an old explorer’s journal, scattered across this floor. Find all five.', buttons:[['Gather them',null]]});
    xLog('Find the 5 journal pages on this floor.','loot'); return true; },
  nest(){ const r=xmFarRooms()[0]; if(!r) return false; const d=EX.depth, cells=[]; for(let k=0;k<12&&cells.length<3;k++){ const c=xFreeCell(r); if(c>=0&&!cells.includes(c)){ cells.push(c); EX.taken.add(c); } }
    if(cells.length<3) return false;
    const q=xmQuestAdd({kind:'nest', giver:'the nest', need:3, got:0, reward:xRollReward(d,[['gold',3],['mat',2],['gear',1.5],['bag',1]],true)});
    for(const c of cells){ const wave=makeEncounter(d)[0]; xmGroup(wave.slice(0,1+Math.floor(XR()*2)),c,XR()<.5?'sleep':'wander',{mission:q.id, tagTxt:'☠', tagCol:'#ff6b6b'}); }
    xSfx('thud'); xDlg({title:'A nest hatches', icon:['skull','#ff6b6b'], text:'Skittering fills the walls and a wet, hungry chittering comes from the '+xmDir(xi(r.cx,r.cy))+'. A nest has hatched on this floor. Wipe out its three broods (☠).', buttons:[['Hunt them',null]]});
    xLog('Wipe out the nest’s 3 broods (☠).','loot'); return true; },
};

/* ---------------- every frame ---------------- */
function xMissionTick(dt){ if(!EX||!XRUN) return;
  // spring the next mission when its moment comes (never mid-dialog or in a safe room)
  const ev=EX.events&&EX.events[0];
  if(ev&&EX.clock>=ev.t&&!EX.dlg&&!EX.safe.has(EX.pc)){ EX.events.shift(); const ok=XM_START[ev.kind]&&XM_START[ev.kind](); if(!ok&&EX.events.length) EX.events[0].t=EX.clock+20; }
  for(const q of XRUN.quests){ if(!xmLive(q)||q.depth!==EX.depth) continue;
    if(q.kind==='rescue'&&!q.reached){ if(EX.room[EX.pc]===q.room){ q.reached=true; xLog('You burst in! Drive the monsters off '+q.giver+'.','good'); xHud(); continue; }
      const s0=Math.ceil(q.left); q.left-=dt; if(Math.ceil(q.left)!==s0) xHud();
      if(q.left<=10&&!q.warned){ q.warned=true; xLog('The cries are getting weaker…','warn'); }
      if(q.left<=0){ const p=EX.props.find(x=>x.qid===q.id&&x.role==='captive'); if(p){ p.state='done'; xRemoveProp(p); }
        for(const g of EX.groups) if(g.mission===q.id) g.state='wander';
        xmFail(q,'The screaming stops. You were too late for '+q.giver+'.'); } }
    if(q.kind==='escort'){ const p=EX.props.find(x=>x.qid===q.id&&x.role==='scout'&&x.state==='follow'); if(!p||p.x==null) continue;
      for(const g of EX.groups){ if(g.dormant||g.state==='sleep'||g.state==='guard') continue;
        const ds=Math.hypot(g.x-p.x,g.z-p.z)/XCS, dp=Math.hypot(g.x-EX.px,g.z-EX.pz)/XCS;
        if(ds<1.1&&dp>1.3&&EX.clock>(p.hitT||0)){ p.hitT=EX.clock+2.5; p.hp--; xSfx('thud');
          if(p.hp<=0){ p.state='done'; xRemoveProp(p); xmFail(q,'The '+ENEMY_DEFS[g.ids[0]].name+' brings '+p.name+' down. The escort has failed.'); break; }
          xLog('The '+ENEMY_DEFS[g.ids[0]].name+' lunges at '+p.name+'! ('+p.hp+' wound'+(p.hp>1?'s':'')+' left before they fall)','bad'); xHud(); }
        // monsters near the scout go for them once they have noticed either of you
        if(g.state==='chase'&&ds<dp-.5&&ds<5){ g.goal=null; g.path=xPathTo(xbfs(EX.t,EX.doors,p.cell,null,typeof xEnemyBlock==='function'?xEnemyBlock:null),g.cell,p.cell); g.repath=.6; } } } } }

/* ---------------- hooks from dungeon.js ---------------- */
// a monster group won: bounties pay, broods count, a rescue frees its captive
function xMissionFight(g){ const q=g&&g.mission&&xmQuest(g.mission); if(!xmLive(q)) return;
  if(q.kind==='bounty'){ xLog(q.name+' is dead. The bounty is yours.','good'); xmReward(q,'Bounty'); }
  if(q.kind==='nest'){ q.got++; if(q.got>=q.need){ xLog('The last brood is gone. The walls fall quiet.','good'); xmReward(q,'Nest cleared'); } else { xLog('Brood '+q.got+' of '+q.need+' wiped out.','loot'); xHud(); } }
  if(q.kind==='rescue'&&!EX.groups.some(x=>x!==g&&x.mission===q.id)){ const p=EX.props.find(x=>x.qid===q.id&&x.role==='captive');
    if(p){ p.state='done'; q.done=true; const r=q.reward; xDlg({look:p.look,title:p.name,sub:'Rescued',text:xpick(LINES.captive)+' Please, take this: '+rewardText(r)+'.',buttons:[['Get to safety',()=>{ xRemoveProp(p); xXp(10+3*EX.depth,'mission'); xGrant(r,'Rescue'); }]]}); } } }
function xMissionPickup(it){ const q=xmQuest(it.qid); if(!xmLive(q)) return; q.got++; xSfx('click');
  if(q.got>=q.need){ xLog('The last page! The explorer’s journal is whole again.','good'); xmReward(q,'Journal'); } else { xLog('A journal page ('+q.got+'/'+q.need+').','loot'); xHud(); } }
function xMissionBrazier(p){ if(!p.lit) return; const q=xmQuest(p.qid); p.lit=false; if(p.flame) p.flame.visible=false; if(p.glow) p.glow.visible=false; xSfx('grind');
  if(!xmLive(q)) return; q.got++; if(q.got>=q.need){ xLog('The last violet flame gutters out. The cold lifts from the floor.','good'); xmReward(q,'Curse lifted'); } else { xLog('You smother the violet flame ('+q.got+'/'+q.need+').','loot'); xHud(); } }
// leaving the floor: a rescue still waiting fails
function xMissionLeave(){ if(!XRUN||!EX) return; for(const q of XRUN.quests) if(xmLive(q)&&q.kind==='rescue'&&q.depth===EX.depth&&!EX.branch){ const p=EX.props.find(x=>x.qid===q.id&&x.role==='captive'); if(p){ p.state='done'; xRemoveProp(p); } xmFail(q,'You leave '+q.giver+' to their fate.'); } }
function xMissionTalk(p){ const L=xpick(LINES[p.role]);
  if(p.role==='captive') return xDlg({look:p.look,title:p.name,sub:p.title,text:'Behind you! Get them off me!',buttons:[['Fight',null]]});
  if(p.state==='idle') return xDlg({look:p.look,title:p.name,sub:p.title,text:L+' Get me to the stairs, any stairs, and you’ll have '+rewardText(p.reward)+'. I can take three more hits, no more.',
    buttons:[['Stay close',()=>{ p.state='follow'; const q=xmQuestAdd({kind:'escort', giver:p.name, reward:p.reward}); p.qid=q.id; xLog(p.name+' falls in behind you. Reach the stairs together, and keep the monsters off them.','loot'); xHud(); }],['Not now',null,true]]});
  return xDlg({look:p.look,title:p.name,sub:p.title,text:'I’m with you. '+p.hp+' more hit'+(p.hp>1?'s':'')+' and I’m done for.',buttons:[['Farewell',null]]}); }
// the escort reaches the stairs with you (called with the lost adventurer's check)
function xMissionEscort(){ for(const p of EX.props) if(p.role==='scout'&&p.state==='follow'){ const q=xmQuest(p.qid); p.state='done'; xRemoveProp(p);
  if(Math.hypot(p.x-EX.px,p.z-EX.pz)/XCS<4){ xLog(p.name+' makes it to the stairs. "I won’t forget this."','good'); if(xmLive(q)) xmReward(q,'Escort'); }
  else xmFail(q,p.name+' could not keep up and is left behind.'); } }
// the bag's quest list
function xMissionText(q){ switch(q.kind){
  case 'rescue': return 'Rescue '+q.giver+' on depth '+q.depth+(xmLive(q)&&!q.reached?' ('+Math.max(0,Math.ceil(q.left))+' s left)':'');
  case 'bounty': return 'Bounty: hunt down '+q.name+', a '+q.what+' (♛), on depth '+q.depth;
  case 'escort': return 'Lead '+q.giver+' to any stairs on depth '+q.depth;
  case 'purge':  return 'Snuff the cursed braziers on depth '+q.depth+' ('+q.got+'/'+q.need+')';
  case 'collect':return 'Find the journal pages on depth '+q.depth+' ('+q.got+'/'+q.need+')';
  case 'nest':   return 'Wipe out the nest’s broods (☠) on depth '+q.depth+' ('+q.got+'/'+q.need+')'; }
  return null; }
// the status strip: a rescue's countdown
function xMissionHud(out){ if(!XRUN) return; for(const q of XRUN.quests) if(xmLive(q)&&q.kind==='rescue'&&!q.reached&&q.depth===EX.depth) out.push('<span class="xs bad">⏳ '+Math.max(0,Math.ceil(q.left))+'s</span>');
  for(const p of EX.props) if(p.role==='scout'&&p.state==='follow') out.push('<span class="xs">🛡 '+p.name.replace('Scout ','')+' '+'♥'.repeat(Math.max(0,p.hp))+'</span>'); }
// the minimap: where the scream came from (always), braziers and pages once seen
function xMissionMini(c,s,dot){ if(!XRUN) return; const blink=Math.floor(performance.now()/400)%2;
  for(const q of XRUN.quests) if(xmLive(q)&&q.kind==='rescue'&&!q.reached&&q.depth===EX.depth&&blink) dot(q.cell,'#ff5d6c',2);
  for(const p of EX.props) if(p.kind==='brazier'&&p.lit&&EX.seen[p.cell]) dot(p.cell,'#b48cff',1);
  for(const it of EX.items) if(it.kind==='mpage'&&EX.seen[it.cell]) dot(it.cell,'#e8e0c8',1);
  for(const p of EX.props) if(p.kind==='corpse'&&!p.gone&&blink) dot(p.cell,'#bfefff',2); }   // your body: you always know where it lies
// the mark over a mission's monsters, drawn by hand (the pixel font has no crown or skull): a gold
// crown over a bounty, a red skull over a nest's brood
function xmTagSprite(txt,col){ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'); x.lineJoin='round';
  const shape=()=>{ x.beginPath(); if(txt==='♛'){ x.moveTo(6,24); x.lineTo(4,10); x.lineTo(11,16); x.lineTo(16,6); x.lineTo(21,16); x.lineTo(28,10); x.lineTo(26,24); x.closePath(); }
    else { x.arc(16,14,9,Math.PI*.85,Math.PI*2.15); x.lineTo(22,26); x.lineTo(10,26); x.closePath(); } };
  x.lineWidth=4; x.strokeStyle='#000'; shape(); x.stroke(); x.fillStyle=col; shape(); x.fill();
  x.fillStyle='#000'; if(txt==='♛') x.fillRect(7,21,18,2); else { x.fillRect(11,12,4,4); x.fillRect(17,12,4,4); x.fillRect(15,18,2,3); }
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:xTex(c),transparent:true,depthTest:false})); s.scale.set(.9,.9,1); s.renderOrder=5; return s; }
// the 3D look of a brazier and a page
function xMissionMesh(p,g){ if(p.kind!=='brazier') return false;
  g.add(xCyl(.1,.8,xMat(0x2a2a30),0,.4,0), xCyl(.38,.18,xMat(0x3a3640),0,.86,0));
  p.flame=xCone(.28,.75,xGlowMat(0xb48cff,{transparent:true,opacity:.9}),0,1.3,0); p.flame.visible=!!p.lit; g.add(p.flame); return true; }
function xMissionItemMesh(it){ if(it.kind!=='mpage') return null; const m=new THREE.Group(); const pg=xBox(.42,.02,.55,xMat(0xe8e0c8,{emissive:0x302a20}),0,0,0); pg.rotation.x=.5; m.add(pg); return m; }

if(typeof module!=='undefined') module.exports={MISSION_KINDS,xMissionText};
