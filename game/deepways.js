/* Hexmancers — the deep ways: how you move through the dungeon.
   - The path map: at the stairs down you choose the next floor from two or three ways, each with
     icons for what it holds (a merchant, a sanctuary, a puzzle, a miniboss, a vault…) and a flavour:
     the Worn Stair (as it comes), the Quiet Way (fewer foes and traps), the Perilous Way (tougher
     foes, a miniboss, richer chests) or the Gilded Way (a vault and more chests, more traps).
   - The stirring dark: linger on a floor and more foes come, each wave a little harder, up to the
     floor's cap. Past the cap the waves keep coming but grow no worse, so you can stay and farm.
     (This replaces the Executioner's bell.)
   - Teleport runes: a hidden trap that throws you to a random spot on the floor.
   - Deep falls: a trapdoor drops you 2 or 3 floors (never past a boss floor you have not beaten).
     The stairs down where you land are held by a Fallen Seal; its Wayshard waits one floor up, a
     short walk from that floor's stairs down. Your Lost Satchel stays on the floor you fell from,
     full of gold and shards (sometimes a pack), for whoever climbs all the way back. */

/* ---------------- the path map ---------------- */
const ROUTES={
  plain:   {name:'The Worn Stair',   icon:'🪜', col:'#cfc6b8', text:'The floor as it comes.',                                  foes:1,   traps:1,   chests:1,   tier:0, stir:0},
  quiet:   {name:'The Quiet Way',    icon:'🌙', col:'#8fe4ff', text:'Fewer foes and traps, fewer chests. No miniboss.',         foes:.6,  traps:.5,  chests:.8,  tier:0, stir:-1},
  peril:   {name:'The Perilous Way', icon:'💀', col:'#ff5d6c', text:'Tougher foes and a miniboss, but richer chests and more XP.', foes:1.25,traps:1.3, chests:1.3, tier:1, stir:1},
  treasure:{name:'The Gilded Way',   icon:'💰', col:'#f2c94c', text:'A locked vault and more chests, but many more traps.',     foes:1,   traps:1.7, chests:1.6, tier:0, stir:0},
};
const routeMods=k=>ROUTES[k]||ROUTES.plain;
// what a planned floor holds, as icons
const FEAT_ICON=[['merchant','🛒','merchant'],['sanct','✦','sanctuary'],['puzzle','🧩','puzzle'],['mini','👹','miniboss'],['vault','🔒','vault'],['prisoner','⛓','prisoner'],
  ['npc','👤','stranger'],['cache','💎','hidden cache'],['gauntlet','⚔','blade gauntlet'],['totem','☾','curse totem'],['lock','🗝','locked rooms'],['gate','🚪','shortcut gate']];
function routeFeats(plan){ const F=plan&&plan.feats||{}; return [...(F.rare||[]).map(k=>typeof RARE_ROOMS!=='undefined'&&RARE_ROOMS[k]?['rare',RARE_ROOMS[k].icon,RARE_ROOMS[k].name]:null).filter(Boolean),...FEAT_ICON.filter(([k])=>F[k])]; }
// shape a plan to its way: the Quiet Way loses its dangers, the Perilous Way gains a miniboss, the Gilded Way a vault
function routeShape(plan,kind,d){ const F=plan.feats;
  if(kind==='quiet'){ delete F.mini; delete F.gauntlet; delete F.totem; delete F.mimic; }
  if(kind==='peril'&&d>=2){ if(!F.mini){ const ids=MINIBOSS_IDS.filter(id=>MINI_MAP[id].min<=d&&id!=='executioner'&&id!=='giant_mimic'); if(ids.length) F.mini=xpick(ids); }
    F.gauntlet=1; if(d>=4) F.totem=1; }
  if(kind==='treasure'){ if(!F.vault){ F.vault=1; plan.side.push({kind:'vault', lock:d>=6&&XR()<.35?'gold':'silver', w:4, h:3, content:'treasure'}); } F.cache=1; if(d>=2) F.mimic=1; }
  return plan; }
// the stairs down: offer the ways to the next floor; true when the choice is showing
function xRouteChoose(){ if(!EX||!XRUN||typeof xFloorPlan!=='function') return false;
  const nd=EX.depth+1, m=xFloors(); if(m&&m.get(nd)) return false;   // a floor you have been on is kept as it was
  if(isBossDepth(nd)){ EX.routeOk={kind:'plain'}; xLog('Only one way leads down: to the guardian of '+areaOf(nd).name+'.','warn'); return false; }
  const base=JSON.stringify(XRUN.next), kinds=['plain','quiet','peril','treasure'].sort(()=>Math.random()-.5).slice(0,nd<=2?2:3);
  const ways=kinds.map(kind=>{ XRUN.next=JSON.parse(base); const plan=routeShape(xFloorPlan(nd,{}),kind,nd); return {kind,plan,next:XRUN.next}; });
  XRUN.next=JSON.parse(base);
  xDlg({title:'Choose your way down', sub:'Depth '+nd+' · '+areaLabel(nd), icon:['scroll','#f2c94c'], text:'Several stairs lead down from here. Each one reaches a different floor.',
    body(box){ box.classList.add('xroutes');
      for(const w of ways){ const R=ROUTES[w.kind], feats=routeFeats(w.plan);
        const row=xRow(box,`<span class="rticon">${R.icon}</span>`,R.name,R.text,'Take it',()=>{ xDlgClose(); XRUN.next=w.next; EX.routeOk=w; xStairsDown(); });
        row.style.setProperty('--rc',R.col);
        const ic=document.createElement('div'); ic.className='rfeats'; ic.innerHTML=feats.length?feats.map(([k,i,n])=>`<span title="${n}">${i} ${n}</span>`).join(''):'<span>nothing marked</span>';
        row.querySelector('.nm').appendChild(ic); } },
    buttons:[['Not yet',null,true]]});
  return true; }
function xRouteArrive(){ if(!EX||!EX.route||EX.route==='plain') return; const R=ROUTES[EX.route]; xLog('You took '+R.name.replace(/^The /,'the ')+': '+R.text.charAt(0).toLowerCase()+R.text.slice(1),'good'); }

/* ---------------- the stirring dark ---------------- */
const STIR_FIRST=75, STIR_GAP=[40,55];
const stirCap=d=>Math.max(1,Math.min(6,2+Math.floor(d/4))+routeMods(EX&&EX.route).stir);
function xStirInit(){ EX.stir=EX.branch?null:{lvl:0, cap:stirCap(EX.depth), next:STIR_FIRST}; }
const STIR_COL=['#f2c94c','#f2c94c','#ff9a3a','#ff7a3a','#ff5d6c','#e0588f','#c04dff'];
function xStirTick(dt){ const s=EX.stir; if(!s||EX.busy||!EX.active) return; s.next-=dt; if(s.next>0) return;
  s.next=s.lvl>=s.cap?STIR_GAP[1]+10:rnd(STIR_GAP[0],STIR_GAP[1]);
  if(EX.groups.filter(g=>g.stirred).length>=3+Math.floor(s.lvl/2)) return;   // the floor is crowded enough already
  const rose=s.lvl<s.cap; if(rose) s.lvl++;
  if(xStirSpawn(s.lvl)){ xSfx('thud');
    if(rose) xLog(s.lvl>=s.cap?'The dark is at its worst on this floor (threat '+s.lvl+'/'+s.cap+'). It will send no worse, but it will keep sending.':'The dark stirs: new foes prowl this floor, and they are stronger (threat '+s.lvl+'/'+s.cap+').',s.lvl>=s.cap?'bad':'warn');
    else xLog('Somewhere, more creatures crawl out of the dark.','dim');
    xHud(); } }
// a group of the stirring dark, out of sight and well away from you
function xStirSpawn(lvl){ const dist=xbfs(EX.t,EX.doors,EX.pc,false,n=>typeof xSolid==='function'&&xSolid(n));
  const rooms=EX.rooms.filter(r=>!r.side&&!r.safe&&r.role!=='puzzle'&&r!==EX.start&&dist[xi(r.cx,r.cy)]>=14&&!EX.vis[xi(r.cx,r.cy)]);
  if(!rooms.length) return false; const r=xpick(rooms), c=xFreeCell(r); if(c<0) return false;
  const wave=makeEncounter(EX.depth)[0].filter(id=>!(ENEMY_DEFS[id]&&ENEMY_DEFS[id].rare)); if(!wave.length) return false;
  const ids=wave.slice(0,Math.min(wave.length,1+Math.ceil(lvl/2)));
  const g=xGroup(ids,c,'wander'); Object.assign(g,{stirred:true, tier:lvl+routeMods(EX.route).tier, tagTxt:'▲'+lvl, tagCol:STIR_COL[Math.min(lvl,6)], hunter:lvl>=2});
  EX.groups.push(g); if(X3&&X3.group) xGroupSprites(g,X3.group); return true; }

/* ---------------- teleport runes ---------------- */
function xWarp(tr){ const reach=xReach(), from=EX.pc, out=[];
  for(let c=0;c<XN*XN;c++) if(reach[c]>=0&&EX.t[c]===T_FLOOR&&EX.room[c]>=0&&!EX.taken.has(c)&&!EX.traps.some(t=>t.cell===c&&t.armed)&&!EX.safe.has(c)&&Math.hypot(xcx(c)-xcx(from),xcy(c)-xcy(from))>=12) out.push(c);
  if(!out.length) return; const c=xpick(out);
  xSparks(xw(from),xz(from),0xb48cff,18,2); EX.pc=c; EX.px=xw(c); EX.pz=xz(c); EX.path=[]; EX.stuckT=0; xUpdateVis(); xSparks(xw(c),xz(c),0xb48cff,18,2);
  if(typeof xFlashView==='function') xFlashView(400); xSfx('chime'); xLog('You land somewhere else on the floor. The rune still glows behind you.','warn'); }

/* ---------------- deep falls ---------------- */
// how far a trapdoor drops you: 2 or 3 floors, but never past a boss floor you have not beaten
function xFallDepth(){ if(!EX||EX.branch) return 1; const r=xri(2,3), m=xFloors();
  for(let k=1;k<=r;k++){ const d=EX.depth+k; if(isBossDepth(d)&&!(m&&m.get(d)&&m.get(d).bossDead)) return k; }
  return r; }
// your Lost Satchel tears loose and stays where you fell from
function xDropSatchel(n){ const d=EX.depth, c=[EX.pc,...xAdj4(EX.pc)].find(x=>EX.t[x]!==T_ROCK&&!EX.itemAt.has(x)&&!EX.doors.has(x)); if(c==null) return;
  const it=xItem('satchel',c,{gold:Math.round(60+22*d), shards:8+2*d, pack:Math.random()<.35, from:d});
  if(it.cell!==EX.pc) EX.taken.add(c); xMeshItem(it);
  if(XRUN) (XRUN.satchels=XRUN.satchels||[]).push({depth:d, got:false}); }
// where you land: a Fallen Seal on the stairs down, its Wayshard one floor up
function xSealFloor(n){ if(!XRUN||!EX||EX.branch||n<2) return; const nd=EX.depth;
  const fresh=(EX.clock||0)<1&&!EX.seal; if(!fresh) return;
  XRUN.seals=XRUN.seals||[]; const s={depth:nd, shard:nd-1, got:false, placed:false, open:false}; XRUN.seals.push(s); EX.seal=true;
  const p=xProp('seal',EX.down,{solid:false}); xMeshProp(p);
  xLog('You land hard on depth '+nd+'. A Fallen Seal holds the stairs down here: its Wayshard lies on depth '+(nd-1)+', a short walk from the stairs down there.','warn');
  xLog('Your Lost Satchel tore loose in the fall. It waits on depth '+(nd-n)+', if you climb all the way back.','dim');
  tip('Find the Wayshard on depth '+(nd-1)+' to open the stairs down',5000); xHud(); }
// the stairs down: false while a Fallen Seal still holds them
function xSealCheck(){ if(typeof xCurseBlocks==='function'&&xCurseBlocks()) return false; const s=XRUN&&(XRUN.seals||[]).find(x=>x.depth===EX.depth&&!x.open); if(!s) return true;
  if(!s.got){ xSay('seal','A Fallen Seal holds these stairs shut. Its Wayshard lies on depth '+s.shard+', up the stairs and a short walk from the stairs down there.'); return false; }
  s.open=true; const p=EX.props.find(q=>q.kind==='seal'&&!q.gone); if(p){ p.gone=true; if(p.mesh) p.mesh.visible=false; }
  xLog('The Wayshard melts into the Fallen Seal. The stairs down are open.','good'); xSfx('unlock'); xXp(20+2*EX.depth,'seal broken'); return true; }
// the Wayshard: on the floor above a sealed one, in a room a short walk from its stairs down
function xPlaceWayshard(){ if(!XRUN||!EX||EX.branch) return;
  for(const s of XRUN.seals||[]){ if(s.got||s.placed||s.shard!==EX.depth) continue;
    const dist=xbfs(EX.t,EX.doors,EX.down,false), rs=EX.rooms.filter(r=>!r.side&&!r.nook&&dist[xi(r.cx,r.cy)]>=0).sort((a,b)=>dist[xi(a.cx,a.cy)]-dist[xi(b.cx,b.cy)]);
    const r=rs.find(r=>dist[xi(r.cx,r.cy)]>=10&&dist[xi(r.cx,r.cy)]<=30)||rs.find(r=>r!==EX.exit)||rs[0]; let c=r?xFreeCell(r):-1;
    if(c<0) c=xAdj4(EX.down).find(x=>EX.t[x]!==T_ROCK&&!EX.taken.has(x)); if(c==null||c<0) continue;
    xItem('wayshard',c,{seal:s.depth}); s.placed=true; } }
// picking up a Wayshard or your satchel; true when it was one of them
function xDeepPickup(it){
  if(it.kind==='wayshard'){ const s=XRUN&&(XRUN.seals||[]).find(x=>x.depth===it.seal); if(s) s.got=true; xSfx('chime');
    xLog('You take the Wayshard. It hums, pulling downward: carry it to the Fallen Seal on depth '+it.seal+'.','good'); tip('Wayshard! Take it down to depth '+it.seal); return true; }
  if(it.kind==='satchel'){ save.gold+=it.gold; save.shards=(save.shards||0)+it.shards; const sc=XRUN&&(XRUN.satchels||[]).find(x=>x.depth===it.from&&!x.got); if(sc) sc.got=true;
    xLog('You find your Lost Satchel: '+it.gold+' gold and '+it.shards+' shards'+(it.pack?', and a sealed pack':'')+'.','gold'); tip('Lost Satchel recovered!'); xSfx('chime');
    if(typeof xCoins==='function') xCoins(it.cell,8);
    if(it.pack&&typeof packReward==='function'){ const c=packFor(EX.depth); packReward(c,EX.depth); } return true; }
  return false; }
function xDeepItemMesh(it){
  if(it.kind==='wayshard'){ const m=new THREE.Group(), g=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),xGlowMat(0xb48cff)); g.scale.y=1.6; m.add(g);
    const h=new THREE.Mesh(new THREE.TorusGeometry(.36,.025,6,20),xGlowMat(0xe6d6ff)); h.rotation.x=Math.PI/2; m.add(h); m.scale.setScalar(1.6); return m; }
  if(it.kind==='satchel'){ const m=new THREE.Group(), lea=xMat(0x7a4a22), dk=xMat(0x4e2e16); const b=xBall(.26,lea,0,-.05,0); b.scale.set(1.2,.85,.9); m.add(b, xBox(.5,.06,.08,dk,0,.12,.18), xBox(.12,.12,.04,xMat(0xf2c94c,{emissive:0x402a08}),0,.02,.24)); return m; }
  return null; }
// the Fallen Seal over the stairs down: a slow violet ring of runes
function xSealMesh(p,g){ const r=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,6,24),xGlowMat(0xb48cff)); r.rotation.x=Math.PI/2; r.position.y=.25; g.add(r); p.ring=r;
  for(let k=0;k<4;k++){ const b=xBox(.12,1.1,.12,xGlowMat(0x7a4dff),Math.cos(k*Math.PI/2)*.75,.55,Math.sin(k*Math.PI/2)*.75); g.add(b); } }

/* ---------------- the status strip ---------------- */
function xDeepHud(out){ const s=EX.stir;
  if(s&&s.lvl) out.push(`<span class="xs ${s.lvl>=s.cap?'bad':''}" title="Threat on this floor: the dark sends harder foes the longer you stay" style="color:${STIR_COL[Math.min(s.lvl,6)]}">▲ ${s.lvl}/${s.cap}</span>`);
  const seals=XRUN?XRUN.seals||[]:[];
  if(seals.some(x=>x.got&&!x.open)) out.push('<span class="xs good" title="Carry it down to the Fallen Seal">◆ Wayshard</span>');
  if(seals.some(x=>x.depth===EX.depth&&!x.open&&!x.got)) out.push('<span class="xs bad" title="Find the Wayshard on the floor above">⛓ Sealed</span>');
  if(XRUN&&(XRUN.satchels||[]).some(x=>!x.got)) out.push('<span class="xs" title="Your Lost Satchel waits where you fell from">🎒 '+XRUN.satchels.filter(x=>!x.got).map(x=>'D'+x.depth).join(' ')+'</span>'); }
