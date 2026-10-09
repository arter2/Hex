/* Hexmancers — the bag, redesigned: a wooden frame with your character in the middle of their
   gear (head, body and arms on the left, rings on the right, weapon and off-hand below with your
   damage, armor and HP between them) and the Items Bag beside it as a grid of slots. Tap anything
   to see it and use or equip it. Quests, the journal and blessings are tabs on the bag side.
   Opens from the dungeon (B or the Bag button); it pauses the floor while open. */
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
function xBag(){ if(!EX||EX.busy||$('#xDialog').classList.contains('on')) return; xPause(true); BAGUI.sel=null; renderBag(); $('#bagUI').classList.add('on'); }
function closeBag(){ $('#bagUI').classList.remove('on'); if(!$('#pause').classList.contains('on')) xPause(false); xHud(); }
function renderBag(){ const s=gearState(save), m=gearMods(save), K=WEAPON_KINDS[m.kind]||WEAPON_KINDS.wand, ch=save.char&&RACES[save.char.race]?save.char:null;
  $('#bgTitle').textContent=(ch?RACES[ch.race].name:'Hexmancer')+' — Level '+(save.level||1);
  // the character, big, on a pool of light
  const cv=$('#bgSprite'), c=cv.getContext('2d'); c.clearRect(0,0,cv.width,cv.height); c.imageSmoothingEnabled=false;
  const spr=unitSprite({kind:'player',look:gearLook(save),view:'front'}); if(spr) c.drawImage(spr.img,0,0,spr.img.width,spr.img.height,0,0,cv.width,cv.height);
  const slot=(k,big)=>{ const id=s.gear[k], d=document.createElement('button'); d.className='bgslot'+(big?' big':'')+(id?' full':'')+(BAGUI.sel&&BAGUI.sel.slot===k?' sel':'');
    if(id) d.style.setProperty('--fc',COLORS[GEAR[id].family].c);
    d.innerHTML=(id?gearIcon(id,big?56:40):`<span class="ghost">${uiIcon({weapon:'staff',offhand:'buckler',head:'helm',body:'robe',arms:'bracer',ring1:'ring',ring2:'ring'}[k]||'bag',big?44:30,'#6a5440')}</span>`)+`<span class="lbl">${SLOT_NAMES[k]}</span>`;
    d.onclick=()=>{ BAGUI.sel=id?{kind:'worn',k:id,slot:k}:null; renderBag(); }; return d; };
  const L=$('#bgLeft'), R=$('#bgRight'); L.innerHTML=''; R.innerHTML='';
  ['head','body','arms'].forEach(k=>L.appendChild(slot(k))); ['ring1','ring2'].forEach(k=>R.appendChild(slot(k)));
  $('#bgWeapon').replaceChildren(slot('weapon',true)); $('#bgOff').replaceChildren(slot('offhand',true));
  const dmg=Math.max(1,K.tap+m.tap)+'–'+Math.max(2,K.charged+m.charged), armor=Math.round((m.guard||0)*100)+'%';
  $('#bgStats').innerHTML=`<div><span>Damage</span><b>${dmg}</b></div><div><span>Armor</span><b>${armor}</b></div><div><span>HP</span><b>${EX?EX.hp:120}/${xmaxHp()}</b></div>`;
  $('#bgGold').innerHTML=uiIcon('coin',18)+' '+save.gold;
  // the bag side: tabs, then the grid (or a list for quests, journal and blessings)
  const tabs=$('#bgTabs'); tabs.innerHTML='';
  for(const [k,l] of [['items','Items'],['quests','Quests'],['journal','Journal'],['bless','Blessings']]){ const b=document.createElement('button'); b.className='bgtab'+(BAGUI.tab===k?' on':''); b.textContent=l; b.onclick=()=>{ BAGUI.tab=k; BAGUI.sel=null; renderBag(); }; tabs.appendChild(b); }
  const box=$('#bgGrid'); box.innerHTML=''; box.className=BAGUI.tab==='items'?'bggrid':'bglist';
  if(BAGUI.tab==='items'){ const items=bagItems(), n=Math.max(BAG_MIN,Math.ceil((items.length+1)/BAG_COLS)*BAG_COLS);
    for(let i=0;i<n;i++){ const it=items[i], d=document.createElement('button'); d.className='bgcell'+(it?' full':'')+(it&&BAGUI.sel&&BAGUI.sel.kind===it.kind&&BAGUI.sel.k===it.k?' sel':'');
      if(it){ if(it.fam) d.style.setProperty('--fc',it.fam); d.innerHTML=it.pic+(it.n>1?`<span class="cnt">${it.n}</span>`:'')+(it.tier?`<span class="tier">${it.tier}</span>`:''); d.title=it.name; d.onclick=()=>{ BAGUI.sel=it; renderBag(); }; }
      else d.disabled=true;
      box.appendChild(d); } }
  else xBagLists(box,{tab:BAGUI.tab});
  bagDetail(); }
// quests, journal and blessings: the same lists as before, drawn into the bag's side
function xBagLists(box,o){
  if(o.tab==='quests'){ const qs=XRUN?XRUN.quests:[]; if(!qs.length) box.innerHTML='<p class="hint">No quests. People on the floors ask for help now and then.</p>';
    for(const q of qs){ const what=(typeof xMissionText==='function'&&xMissionText(q))||(q.kind==='fetch'?'Find '+q.giver+'’s '+q.item+' on depth '+q.depth:q.giver||'A task');
      xRow(box,pxIcon('scroll',q.done?'#39ff8a':q.failed?'#ff5d6c':'#f2c94c'),q.done?'Done':q.failed?'Failed':'In progress',what+(q.reward?' · reward: '+rewardText(q.reward):'')); } }
  if(o.tab==='journal'){ const read=LORE.filter(l=>dState().lore[l.id]); box.insertAdjacentHTML('beforeend','<p class="hint">'+read.length+' of '+LORE.length+' tales found.</p>'); for(const l of read) xRow(box,pxIcon('scroll','#f2c94c'),l.title,l.text); }
  if(o.tab==='bless'){ const P=dState().perm; let n=0; for(const k of Object.keys(PERM)) if(P[k]){ n++; xRow(box,pxIcon('gem','#f2c94c'),PERM[k].name+' ×'+P[k]+' / '+PERM[k].max,PERM[k].text||''); }
    if(XRUN&&XRUN.attuned){ n++; xRow(box,pxIcon('hero','#fff2c0'),'Shrine’s blessing','If you fall in this dive, you wake at the stairs up, once'); }
    if(!n) box.innerHTML='<p class="hint">No blessings yet. Orbs in hidden shrines, freed prisoners and rare quests grant them.</p>'; } }
// the strip under the grid: what you picked, and what you can do with it
function bagDetail(){ const d=$('#bgDetail'), it=BAGUI.sel; d.innerHTML='';
  if(!it){ d.innerHTML='<p class="hint">'+(BAGUI.tab==='items'?'Tap an item or a gear slot.':'')+'</p>'; return; }
  const btn=(label,fn,cls)=>{ const b=document.createElement('button'); b.className='btn small'+(cls?' '+cls:''); b.textContent=label; b.onclick=fn; d.querySelector('.acts').appendChild(b); };
  if(it.kind==='worn'){ const id=it.k, G=GEAR[id];
    d.innerHTML=`<div class="pic">${gearIcon(id,48)}</div><div class="nm"><b>${esc(gearName(save,id))}</b><small>${esc((G.text||'')+(G.mods?' '+modsText(G.mods):''))}</small></div><div class="acts"></div>`;
    if(isStuck(save,id)) d.querySelector('.acts').innerHTML='<span class="curse">Cursed: it will not come off</span>';
    else if(!G.starter||it.slot!=='weapon') btn('Unequip',()=>{ const r=equip(save,it.slot,null); if(r.msg) tip(r.msg); if(r.ok) persist(); BAGUI.sel=null; renderBag(); },'ghost');
    return; }
  d.innerHTML=`<div class="pic">${it.pic}</div><div class="nm"><b>${esc(it.name)}${it.n>1?' ×'+it.n:''}</b><small>${esc(it.text||'')}</small></div><div class="acts"></div>`;
  if(it.kind==='bag') btn('Use',()=>{ xUseBag(it.k); BAGUI.sel=bagN(it.k)>0?it:null; renderBag(); });
  if(it.kind==='gear') btn('Equip',()=>{ const G=GEAR[it.k], sl=G.slot==='ring'?(!gearState(save).gear.ring1?'ring1':'ring2'):G.slot; const r=equip(save,sl,it.k); if(r.msg) tip(r.msg); if(r.ok) persist(); BAGUI.sel=null; renderBag(); });
}
$('#bgClose').onclick=closeBag;
$('#bagUI').addEventListener('pointerdown',e=>{ if(e.target.id==='bagUI') closeBag(); });
document.addEventListener('keydown',e=>{ if(!$('#bagUI').classList.contains('on')) return; const k=e.key.toLowerCase(); if(k==='escape'||(typeof keyAct==='function'&&keyAct(k,'map')==='bag')){ e.preventDefault(); e.stopImmediatePropagation(); closeBag(); } },true);
