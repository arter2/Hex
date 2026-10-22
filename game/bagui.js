/* Hexmancers — the bag, redesigned: a wooden frame with your character in the middle of their
   gear (head, body and arms on the left, rings on the right, weapon and off-hand below with your
   damage, armor and HP between them) and the Items Bag beside it as a grid of slots. Tap anything
   to see it and use or equip it. Quests, the journal and blessings are tabs on the bag side.
   Opens from the dungeon (B or the Bag button); it pauses the floor while open. At camp the same
   bag is the Character screen: potions wait for the dungeon, and gear gains the camp's actions
   (merge, enchant, purify) and a Look tab. Stats are a tab in both. */
let BAGUI={tab:'items', sel:null};
const BAG_COLS=5, BAG_MIN=30;
function bagItems(){ const s=gearState(save), out=[];
  for(const k of Object.keys(BAG)) if(bagN(k)>0) out.push({kind:'bag',k,n:bagN(k),name:BAG[k].name,text:BAG[k].text,pic:pxIcon(BAG[k].icon,BAG[k].col,34),act:'Use'});
  for(const k of Object.keys(KEYS)) if(keyN(k)>0) out.push({kind:'key',k,n:keyN(k),name:KEYS[k].name,text:KEYS[k].text||'Kept for this dive',pic:pxIcon('key',KEYS[k].col,34)});
  for(const m of Object.keys(MATS)) if(matN(m)>0) out.push({kind:'mat',k:m,n:matN(m),name:MATS[m].name,text:m==='ore'?'Smiths use it to upgrade gear':m==='shard'?'Scholars and collectors want these':'Sells well; some trade for it',pic:pxIcon('gem',MATS[m].col,34)});
  for(const k of Object.keys(SCROLLS)) if(s.scrolls[k]>0) out.push({kind:'scroll',k,n:s.scrolls[k],name:SCROLLS[k].name,text:SCROLLS[k].text+' (at camp)',pic:lootPic('scroll:'+k,34)});
  if(EX&&EX.carrying) out.push({kind:'crate',k:'crate',n:1,name:EX.carrying.owner+'’s crate',text:'Bring it back to its owner on this floor',pic:pxIcon('bag','#8a5a32',34)});
  const worn=new Set(SLOTS.map(k=>s.gear[k]).filter(Boolean));
  for(const id of Object.keys(GEAR)){ const n=(s.items[id]||0)-(worn.has(id)?1:0)-(s.gear.ring1===id&&s.gear.ring2===id?1:0); if(n>0)
    out.push({kind:'gear',k:id,n,name:gearName(save,id),text:(GEAR[id].text||'')+(GEAR[id].mods?' '+modsText(GEAR[id].mods):''),pic:gearIcon(id,40),fam:COLORS[GEAR[id].family].c,tier:GEAR[id].legendary?'✹':GEAR[id].tier?'★'.repeat(GEAR[id].tier):'',act:'Equip'}); }
  return out; }
const bagInRun=()=>!!(typeof EX!=='undefined'&&EX&&EX.active);
const bagTabs=()=>bagInRun()?[['items','Items'],['stats','Stats'],['quests','Quests'],['journal','Journal'],['bless','Blessings']]:[['items','Items'],['stats','Stats'],['look','Look'],['bless','Blessings']];
function openBagUI(){ BAGUI.sel=null; if(!bagTabs().some(t=>t[0]===BAGUI.tab)) BAGUI.tab='items'; renderBag(); $('#bagUI').classList.add('on'); }
function xBag(){ if(!EX||EX.busy||$('#xDialog').classList.contains('on')) return; xPause(true); openBagUI(); }
function closeBag(){ $('#bagUI').classList.remove('on');
  if(bagInRun()){ if(!$('#pause').classList.contains('on')) xPause(false); xHud(); }
  else if($('#scrCamp').classList.contains('on')&&typeof xpBar==='function') xpBar($('#campLevel')); }
function renderBag(){ const s=gearState(save), m=gearMods(save), K=WEAPON_KINDS[m.kind]||WEAPON_KINDS.wand, ch=save.char&&RACES[save.char.race]?save.char:null;
  $('#bgTitle').innerHTML=esc((ch?RACES[ch.race].name:'Hexmancer')+' — Level '+(save.level||1))+'<small>▤ Tap to build your deck ›</small>';
  // the character, big, on a pool of light
  const cv=$('#bgSprite'), c=cv.getContext('2d'); c.clearRect(0,0,cv.width,cv.height); c.imageSmoothingEnabled=false;
  const spr=unitSprite({kind:'player',look:gearLook(save),view:'front'}); if(spr) c.drawImage(spr.img,0,0,spr.img.width,spr.img.height,0,0,cv.width,cv.height);
  const slot=(k,big)=>{ const id=s.gear[k], d=document.createElement('button'); d.className='bgslot'+(big?' big':'')+(id?' full':'')+(BAGUI.sel&&BAGUI.sel.slot===k?' sel':'');
    if(id) d.style.setProperty('--fc',COLORS[GEAR[id].family].c);
    d.innerHTML=(id?gearIcon(id,big?56:40):`<span class="ghost">${uiIcon({weapon:'staff',offhand:'buckler',head:'helm',body:'robe',arms:'bracer',ring1:'ring',ring2:'ring'}[k]||'bag',big?44:30,'#6a5440')}</span>`)+`<span class="lbl">${SLOT_NAMES[k]}</span>`;
    d.dataset.drop='slot:'+k; d.onclick=()=>{ BAGUI.sel=id?{kind:'worn',k:id,slot:k}:null; renderBag(); };
    if(id) bagDrag(d,{kind:'worn',k:id,slot:k}); return d; };
  const L=$('#bgLeft'), R=$('#bgRight'); L.innerHTML=''; R.innerHTML='';
  ['head','body','arms'].forEach(k=>L.appendChild(slot(k))); ['ring1','ring2'].forEach(k=>R.appendChild(slot(k)));
  $('#bgWeapon').replaceChildren(slot('weapon',true)); $('#bgOff').replaceChildren(slot('offhand',true));
  const dmg=Math.max(1,K.tap+m.tap)+'–'+Math.max(2,K.charged+m.charged), armor=Math.round((m.guard||0)*100)+'%';
  $('#bgStats').innerHTML=`<div><span>Damage</span><b>${dmg}</b></div><div><span>Armor</span><b>${armor}</b></div><div><span>HP</span><b>${bagInRun()?EX.hp:xmaxHp()}/${xmaxHp()}</b></div>`;
  $('#bgGold').innerHTML=uiIcon('coin',18)+' '+save.gold;
  // the bag side: tabs, then the grid (or a list for quests, journal and blessings)
  const tabs=$('#bgTabs'); tabs.innerHTML='';
  for(const [k,l] of bagTabs()){ const b=document.createElement('button'); b.className='bgtab'+(BAGUI.tab===k?' on':''); b.textContent=l; b.onclick=()=>{ BAGUI.tab=k; BAGUI.sel=null; renderBag(); }; tabs.appendChild(b); }
  const box=$('#bgGrid'); box.innerHTML=''; box.className=BAGUI.tab==='items'?'bggrid':'bglist'; box.dataset.drop='bag'; $('#bgSprite').dataset.drop='me';
  if(BAGUI.tab==='items'){ const items=bagItems(), n=Math.max(BAG_MIN,Math.ceil((items.length+1)/BAG_COLS)*BAG_COLS);
    for(let i=0;i<n;i++){ const it=items[i], d=document.createElement('button'); d.className='bgcell'+(it?' full':'')+(it&&BAGUI.sel&&BAGUI.sel.kind===it.kind&&BAGUI.sel.k===it.k?' sel':'');
      if(it){ if(it.fam) d.style.setProperty('--fc',it.fam); d.innerHTML=it.pic+(it.n>1?`<span class="cnt">${it.n}</span>`:'')+(it.tier?`<span class="tier">${it.tier}</span>`:''); d.title=it.name; d.onclick=()=>{ BAGUI.sel=it; renderBag(); }; if(it.kind==='gear'||(it.kind==='bag'&&bagInRun())) bagDrag(d,it); }
      else d.disabled=true;
      box.appendChild(d); } }
  else xBagLists(box,{tab:BAGUI.tab});
  $('#bgDetail').style.display=BAGUI.tab==='items'?'':'none';   // the detail strip is for items; the lists say it all
  bagDetail(); }
// quests, journal and blessings: the same lists as before, drawn into the bag's side
function xBagLists(box,o){
  if(o.tab==='stats'){ box.innerHTML=charStatsHTML(); charStatsBind(); }
  if(o.tab==='look') renderLooks(box);
  if(o.tab==='quests'){ const qs=XRUN?XRUN.quests:[]; if(!qs.length) box.innerHTML='<p class="hint">No quests. People on the floors ask for help now and then.</p>';
    for(const q of qs){ const what=(typeof xMissionText==='function'&&xMissionText(q))||(q.kind==='fetch'?'Find '+q.giver+'’s '+q.item+' on depth '+q.depth:q.giver||'A task');
      xRow(box,pxIcon('scroll',q.done?'#39ff8a':q.failed?'#ff5d6c':'#f2c94c'),q.done?'Done':q.failed?'Failed':'In progress',what+(q.reward?' · reward: '+rewardText(q.reward):'')); } }
  if(o.tab==='journal'){ const read=LORE.filter(l=>dState().lore[l.id]); box.insertAdjacentHTML('beforeend','<p class="hint">'+read.length+' of '+LORE.length+' tales found.</p>'); for(const l of read) xRow(box,pxIcon('scroll','#f2c94c'),l.title,l.text); }
  if(o.tab==='bless'){ const P=dState().perm; let n=0; for(const k of Object.keys(PERM)) if(P[k]){ n++; xRow(box,pxIcon('gem','#f2c94c'),PERM[k].name+' ×'+P[k]+' / '+PERM[k].max,PERM[k].text||''); }
    if(XRUN&&XRUN.attuned){ n++; xRow(box,pxIcon('hero','#fff2c0'),'Shrine’s blessing','If you fall in this dive, you wake at the stairs up, once'); }
    if(!n) box.innerHTML='<p class="hint">No blessings yet. Orbs in hidden shrines, freed prisoners and rare quests grant them.</p>'; } }
// the strip under the grid: what you picked, and what you can do with it
function bagDetail(){ const d=$('#bgDetail'); let it=BAGUI.sel; d.innerHTML='';
  // a merge, an enchant or a drop may have changed it: look it up again
  if(it&&it.kind!=='worn'){ const k=it.kind, id=it.k; it=bagItems().find(x=>x.kind===k&&x.k===id)||null; BAGUI.sel=it; }
  if(it&&it.kind==='worn'&&gearState(save).gear[it.slot]!==it.k){ it=null; BAGUI.sel=null; }
  if(!it){ d.innerHTML='<p class="hint">'+(BAGUI.tab==='items'?'Tap an item or a gear slot.':'')+'</p>'; return; }
  const btn=(label,fn,cls)=>{ const b=document.createElement('button'); b.className='btn small'+(cls?' '+cls:''); b.textContent=label; b.onclick=fn; d.querySelector('.acts').appendChild(b); };
  if(it.kind==='worn'||it.kind==='gear'){ const id=it.k, G=GEAR[id], s=gearState(save), stuck=isStuck(save,id), set=setOf(id), lv=s.gearLv[id]||0;
    d.innerHTML=`<div class="pic">${gearIcon(id,48)}</div><div class="nm"><b>${esc(gearName(save,id))}${it.n>1?' ×'+it.n:''} <span class="tier">${G.legendary?'✹':G.tier?'★'.repeat(G.tier):''}</span></b><small>${esc(gearText(save,id))}${G.text?' · '+esc(G.text):''}</small>`
      +(set?`<small class="set${activeSets(save).includes(set)?' on':''}">Set: ${esc(SETS[set].name)} (${SETS[set].pieces.filter(x=>SLOTS.some(k=>s.gear[k]===x)).length}/3 worn) · ${esc(modsText(SETS[set].mods))}</small>`:'')
      +(unworn(save,id)?'<small class="fresh">Not worn yet: it may be enchanted or cursed.</small>':'')
      +(stuck?`<small class="curse">☠ Cursed ${esc(CURSES[s.cursed[id]].name)}: ${esc(CURSES[s.cursed[id]].text)}</small>`:'')+'</div><div class="acts"></div>';
    if(it.kind==='worn'){ if(stuck) d.querySelector('.acts').insertAdjacentHTML('beforeend','<span class="curse">Won’t come off</span>');
      else if(!G.starter||it.slot!=='weapon') btn('Unequip',()=>{ const r=equip(save,it.slot,null); if(r.msg) tip(r.msg); if(r.ok) persist(); BAGUI.sel=null; renderBag(); },'ghost'); }
    else btn('Equip',()=>{ const sl=G.slot==='ring'?(!s.gear.ring1?'ring1':'ring2'):G.slot; const r=equip(save,sl,id); if(r.msg) tip(r.msg); if(r.ok) persist(); BAGUI.sel=null; renderBag(); });
    // at camp: merge two copies, enchant, and break a curse
    if(!bagInRun()){ const keep=()=>{ BAGUI.sel=it; };
      if(s.items[id]>1&&lv<MAX_LEVEL) btn('Merge → +'+(lv+1),()=>{ keep(); charMsg(mergeGear(save,id)); },'ghost');
      if(!s.ench[id]&&s.scrolls.enchant>0) btn('Enchant ('+s.scrolls.enchant+')',()=>{ keep(); charMsg(enchantGear(save,id)); },'ghost');
      if(stuck){ if(s.scrolls.purify>0) btn('Purify ('+s.scrolls.purify+')',()=>{ keep(); charMsg(purifyGear(save,id)); },'ghost'); btn('Sacrifice 3 rune '+curseRune(save,id),()=>pickSacrifice(id),'ghost'); } }
    return; }
  d.innerHTML=`<div class="pic">${it.pic}</div><div class="nm"><b>${esc(it.name)}${it.n>1?' ×'+it.n:''}</b><small>${esc(it.text||'')}</small></div><div class="acts"></div>`;
  if(it.kind==='bag'){ if(bagInRun()) btn('Use',()=>{ xUseBag(it.k); BAGUI.sel=bagN(it.k)>0?it:null; renderBag(); }); else d.querySelector('.acts').innerHTML='<span class="dim">Use it in the dungeon</span>'; }
}
/* Drag and drop: drag gear from the bag onto its slot (or onto your character) to put it on, a worn
   piece back into the bag to take it off, a ring between the two ring slots, and a potion onto your
   character to drink it. A tap without a drag still selects, as before. */
const BAG_DRAG_PX=8;
// where this thing may be dropped: a list of data-drop names
function bagDropsFor(it){ if(it.kind==='bag') return bagInRun()?['me']:[];
  if(it.kind==='gear'){ const sl=GEAR[it.k].slot; return ['me',...(sl==='ring'?['slot:ring1','slot:ring2']:['slot:'+sl])]; }
  if(it.kind==='worn') return ['bag',...(it.slot==='ring1'?['slot:ring2']:it.slot==='ring2'?['slot:ring1']:[])];
  return []; }
function bagDrop(it,to){ let r=null;
  if(it.kind==='bag'&&to==='me'){ xUseBag(it.k); BAGUI.sel=null; renderBag(); return; }
  if(it.kind==='gear'){ const G=GEAR[it.k], sl=to==='me'?(G.slot==='ring'?(!gearState(save).gear.ring1?'ring1':'ring2'):G.slot):to.slice(5); r=equip(save,sl,it.k); }
  if(it.kind==='worn'&&to==='bag'){ if(GEAR[it.k].starter&&it.slot==='weapon') r={ok:false,msg:'Your first wand stays in hand until you hold another'}; else r=equip(save,it.slot,null); }
  if(it.kind==='worn'&&to.startsWith('slot:ring')){ const k2=to.slice(5), s=gearState(save), other=s.gear[k2];
    if(isStuck(save,it.k)||(other&&isStuck(save,other))) r={ok:false,msg:'A cursed ring will not come off'}; else { s.gear[k2]=it.k; s.gear[it.slot]=other||null; r={ok:true}; } }
  if(r&&r.msg) tip(r.msg); if(r&&r.ok){ persist(); xSfx&&xSfx('click'); } BAGUI.sel=null; renderBag(); }
function bagDrag(el,it){ el.style.touchAction='none';
  el.addEventListener('pointerdown',e=>{ if(e.button>0) return; const x0=e.clientX, y0=e.clientY, pid=e.pointerId, ok=bagDropsFor(it); let ghost=null, over=null;
    const targets=()=>[...$('#bagUI').querySelectorAll('[data-drop]')].filter(t=>ok.includes(t.dataset.drop));
    const move=ev=>{ if(ev.pointerId!==pid) return;
      if(!ghost){ if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<BAG_DRAG_PX) return;
        ghost=document.createElement('div'); ghost.className='bgghost'; ghost.innerHTML=el.innerHTML; document.body.appendChild(ghost);
        el.classList.add('dragsrc'); targets().forEach(t=>t.classList.add('dropok')); $('#bagUI').classList.add('dragging'); }
      ghost.style.left=ev.clientX+'px'; ghost.style.top=ev.clientY+'px';
      const t=(document.elementFromPoint(ev.clientX,ev.clientY)||{closest:()=>null}).closest('[data-drop]'), hit=t&&ok.includes(t.dataset.drop)?t:null;
      if(hit!==over){ if(over) over.classList.remove('drophover'); over=hit; if(over) over.classList.add('drophover'); } };
    const up=ev=>{ if(ev.pointerId!==pid) return; removeEventListener('pointermove',move); removeEventListener('pointerup',up); removeEventListener('pointercancel',up);
      if(!ghost) return;   // no drag: the click selects it
      ghost.remove(); el.classList.remove('dragsrc'); $('#bagUI').classList.remove('dragging'); targets().forEach(t=>t.classList.remove('dropok','drophover'));
      BAGUI.dragAt=Date.now();   // the drag is not also a tap
      if(over&&ev.type==='pointerup') bagDrop(it,over.dataset.drop); };
    addEventListener('pointermove',move); addEventListener('pointerup',up); addEventListener('pointercancel',up); }); }
$('#bagUI').addEventListener('dragstart',e=>e.preventDefault());   // the browser's own image drag would cancel ours
$('#bagUI').addEventListener('click',e=>{ if(Date.now()-(BAGUI.dragAt||0)<350){ e.stopPropagation(); e.preventDefault(); } },true);
$('#bgClose').onclick=closeBag;
// tap the top of the bag (its title or the bag badge) to build your deck
for(const sel of ['#bgTitle','.bgbag']) $(sel).onclick=()=>{ if(typeof openDeckUI==='function') openDeckUI('bag'); };
$('#bagUI').addEventListener('pointerdown',e=>{ if(e.target.id==='bagUI') closeBag(); });
document.addEventListener('keydown',e=>{ if(!$('#bagUI').classList.contains('on')) return; const k=e.key.toLowerCase(); if(k==='escape'||(typeof keyAct==='function'&&keyAct(k,'map')==='bag')){ e.preventDefault(); e.stopImmediatePropagation(); closeBag(); } },true);
