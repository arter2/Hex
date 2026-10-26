/* ---------------- the Enemy lab ----------------
   The Movement lab's other half (the lab button asks which): an empty board where you summon any enemy and
   watch it move and attack. You can't lose (a hit is counted, then healed), and killing everything doesn't end it.
   Its panel lists every kind of enemy with its attacks, the order it uses them (in turn, or picked at random),
   how it walks, how often it attacks, and its damage and HP; change any of them and the ones on the board change
   at once. Depth stages: from a depth you pick, a kind can switch to other attacks, walking, timing, damage or HP
   (each stage starts as a copy of the one before it; the Depth slider picks which stage new summons use).
   Copy gives your changes as text to paste back here later (or to send on); Paste applies such text.
   Changes live in this browser and only in the lab, unless "Use in real fights" is on: then every enemy met in
   the dungeon from this browser uses them too, by the depth it is met at. */
const ELAB_KEY='hexmancers-enemylab';
const ELAB_OPT_DEF={depth:3, respawn:false, tough:false, attack:true, live:false};
const ELAB=(()=>{ let s={}; try{ s=JSON.parse(localStorage.getItem(ELAB_KEY))||{}; }catch(e){}
  return {over:s.over||{}, opt:Object.assign({},ELAB_OPT_DEF,s.opt||{}), open:null, pick:'ram', find:'', stage:{}}; })();
const elabKeep=()=>{ try{ localStorage.setItem(ELAB_KEY,JSON.stringify({over:ELAB.over,opt:ELAB.opt})); }catch(e){} };
const elabOn=()=>!!(B&&B.lab&&B.lab.foes);
const ELAB_AI={align:'Lines up', wander:'Wanders', back:'Keeps back', still:'Still'};
let ELAB_HITS=0;

// what a kind does out of the box: its fixed order (fights.js RHYTHM) if it has one, otherwise its moves at random
function elabBase(id){ const d=ENEMY_DEFS[id], r=typeof RHYTHM!=='undefined'&&RHYTHM[id];
  return {moves:(r||d.moves||['shot']).slice(), order:!!r, ai:d.ai||'wander', rate:d.rate.slice(), dmg:d.dmg, hp:d.hp}; }
const ELAB_FIELDS=['moves','order','ai','rate','dmg','hp'];
const elabPick=o=>{ const r={}; for(const k of ELAB_FIELDS) if(o&&o[k]!==undefined) r[k]=o[k]; return r; };
const elabStages=id=>(ELAB.over[id]&&ELAB.over[id].stages)||[];
// the settings of stage k (0: from depth 1; k: the k-th depth stage), each stage on top of the ones before it
function elabChain(id,k){ const s=Object.assign(elabBase(id),elabPick(ELAB.over[id])), st=elabStages(id);
  for(let i=0;i<k&&i<st.length;i++) Object.assign(s,elabPick(st[i])); return s; }
const elabStageAt=(id,depth)=>elabStages(id).filter(x=>x.from<=depth).length;
const elabCur=(id,k)=>elabChain(id,k==null?(ELAB.stage[id]||0):k);
// which settings a change touches at a depth (the rest stay the game's own, so its elites and depth moves keep working)
function elabTouched(id,depth){ const t=new Set(Object.keys(elabPick(ELAB.over[id]))); const st=elabStages(id);
  for(let i=0;i<elabStageAt(id,depth);i++) Object.keys(elabPick(st[i])).forEach(k=>t.add(k)); return t; }
// change stage k of a kind, keeping only what differs from the stage before it (or the game's own, for stage 0)
function elabSetStage(id,k,patch){ const o=Object.assign({},ELAB.over[id]||{}), st=(o.stages||[]).map(x=>Object.assign({},x));
  if(!k){ const base=elabBase(id); Object.assign(o,patch); for(const f of ELAB_FIELDS) if(f in o&&JSON.stringify(o[f])===JSON.stringify(base[f])) delete o[f]; }
  else { const prev=elabChain(id,k-1), x=Object.assign(st[k-1],patch); for(const f of ELAB_FIELDS) if(f in x&&JSON.stringify(x[f])===JSON.stringify(prev[f])) delete x[f]; }
  if(st.length) o.stages=st; else delete o.stages;
  elabStore(id,o); }
function elabStore(id,o){ if(o.stages&&!o.stages.length) delete o.stages;
  if(Object.keys(o).length) ELAB.over[id]=o; else delete ELAB.over[id]; elabKeep();
  for(const e of B?B.enemies:[]) if(e.id===id&&e.hp>0&&e.labDepth) elabApply(e); elabShareSync(); }
const elabSetOver=(id,patch)=>elabSetStage(id,ELAB.stage[id]||0,patch);
// add a stage from a depth (a copy of the one before it), take one away, or move where one starts
function elabAddStage(id){ const o=Object.assign({},ELAB.over[id]||{}), st=(o.stages||[]).slice(), last=st.length?st[st.length-1].from:1;
  if(last>=30){ tip('The last stage already starts at depth 30'); return; }
  st.push({from:Math.min(30,last<8?8:last+4)}); o.stages=st; ELAB.stage[id]=st.length; elabStore(id,o); }
function elabDelStage(id,k){ const o=Object.assign({},ELAB.over[id]||{}), st=(o.stages||[]).slice(); st.splice(k-1,1); o.stages=st; ELAB.stage[id]=Math.min(k-1,st.length); elabStore(id,o); }
function elabStageFrom(id,k,v){ const o=Object.assign({},ELAB.over[id]||{}), st=(o.stages||[]).map(x=>Object.assign({},x)), lo=k>1?st[k-2].from+1:2, hi=k<st.length?st[k].from-1:30;
  st[k-1].from=Math.max(lo,Math.min(hi,v)); o.stages=st; elabStore(id,o); }
// the Share buttons follow how many enemies are changed
function elabShareSync(){ const n=Object.keys(ELAB.over).length, t=document.querySelector('#mlabForm .eltabs [data-t=share]');
  if(t) t.innerHTML='Share'+(n?' <i>'+n+'</i>':''); }
function elabCat(d){ return d.boss?'Bosses':d.mini?'Minibosses':d.rare?'Rare foes':d.minion?'Summoned helpers':d.vermin?'Vermin':d.outlaw?'Outlaws':d.spell?'Spellfolk':d.deck?'Card casters':'Monsters'; }

/* ---------------- the battle ---------------- */
function elabStart(){
  if(!save){ save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); save.temp=true; }   // never written (ui.js persist)
  paused=false; BOARD_TEST=null; buildBoard(); ELAB_HITS=0;
  fight(1,[[]],{lab:{list:activeDeck().list, move:true, foes:true}});
  if(!B) return;
  const p=B.player; p.hp=p.maxHp=999;
  const hurt=B.hooks.onHurt; B.hooks.onHurt=d=>{ ELAB_HITS++; if(hurt) hurt(d); B.player.hp=B.player.maxHp; mlabHud(); };
  closeCustomScreen(); mlabSync(); elabSummon(ELAB.pick); }
// summon one: on a free back tile in a random row, or anywhere free
function elabSummon(id){ if(!elabOn()||!ENEMY_DEFS[id]) return;
  B.enemies=B.enemies.filter(e=>e.hp>0||e.deathT>0);
  const free=openEnemyTiles(), back=free.filter(t=>t.col>=BOARD_COLS/2+1), t=pick(back.length?back:free);
  if(!t){ tip('No room left on their side'); return; }
  const e=makeEnemy(id,t,ELAB.opt.depth); e.labDepth=ELAB.opt.depth; B.enemies.push(e); elabApply(e,true); burst(t,COLORS[e.color].c,16); floater(e.name,t,'#ffe24d');
  e.atkT=Math.max(e.atkT,1.5); renderElabBoard(); }
// a kind's changes on one enemy, by the depth it was met at (fresh: just made, so its health is set from scratch;
// real: a dungeon fight, where Can't die never applies). What a change doesn't touch stays as the game made it.
function elabApply(e,fresh,real){ const d=ENEMY_DEFS[e.id], depth=e.labDepth||1, c=elabChain(e.id,elabStageAt(e.id,depth)), t=elabTouched(e.id,depth);
  if(!e._orig) e._orig={seq:e.seq&&e.seq.slice(), moves:e.moves&&e.moves.slice(), dmg:e.dmg, maxHp:e.maxHp, def:e.def};
  const O=e._orig; e.def=Object.assign({},O.def,{ai:c.ai, rate:c.rate.slice()});
  if(t.has('moves')||t.has('order')){ if(c.order){ e.seq=c.moves.slice(); e.si=1; e.moves=undefined; e.nextMove=e.seq[0]; } else { e.moves=c.moves.slice(); e.seq=null; e.nextMove=pick(e.moves); } }
  else { e.seq=O.seq&&O.seq.slice(); e.moves=O.moves&&O.moves.slice(); e.si=1; e.nextMove=e.seq?e.seq[0]:pick(e.moves||d.moves); }
  e.dmg=t.has('dmg')?Math.round(c.dmg*e.ds):O.dmg;
  if(ELAB.opt.tough&&!real){ e.hp=e.maxHp=99999; return; }
  const full=t.has('hp')?Math.max(1,Math.round(c.hp*O.maxHp/d.hp)):O.maxHp, frac=fresh||e.maxHp===99999?1:e.hp/e.maxHp;
  e.maxHp=full; e.hp=Math.max(1,Math.round(full*frac)); }
// "Use in real fights": every enemy made in a dungeon fight takes this browser's changes, by its depth (enemies.js makeEnemy)
function elabLive(e,depth){ if(!ELAB.opt.live||!ELAB.over[e.id]||(B&&B.lab&&B.lab.foes)) return; e.labDepth=depth; elabApply(e,true,true); }
// a kill: bring one of the same kind back after a moment, if Respawn is on (battle.js kill)
function elabKilled(e){ renderElabBoard(); if(!ELAB.opt.respawn) return; const id=e.id; later(1.5,()=>{ if(elabOn()) elabSummon(id); }); }

/* ---------------- the panel ----------------
   Built for a phone: a sheet along the bottom (the enemies stand at the top of the board), three tabs (Summon,
   Edit, Share), one enemy at a time in the editor, big buttons, and − / + beside every number. */
const elabIds=()=>Object.keys(ENEMY_DEFS);
function elabOptions(sel){ const groups={}; for(const id of elabIds()) (groups[elabCat(ENEMY_DEFS[id])]=groups[elabCat(ENEMY_DEFS[id])]||[]).push(id);
  return Object.entries(groups).map(([g,l])=>`<optgroup label="${g}">`+l.map(id=>`<option value="${id}"${id===sel?' selected':''}>${ELAB.over[id]?'● ':''}${esc(ENEMY_DEFS[id].name)}</option>`).join('')+'</optgroup>').join(''); }
// a labelled block: the label (hold it for what it does) above its control
function elabRow(parent,label,html,tipText){ const r=document.createElement('div'); r.className='mlrow elrow'; if(tipText) r.dataset.tip=tipText;
  r.innerHTML=(label?`<span class="ellab">${label}</span>`:'')+`<div class="elctl">${html}</div>`; parent.appendChild(r); return r; }
// a number: − [slider] + and its value; set(v) runs once a change is done (a tap, or letting go of the slider)
function elabNum(parent,label,val,mn,mx,st,set,tipText){ const dec=st<1?1:0, fmt=v=>(+v).toFixed(dec);
  const r=elabRow(parent,label,`<button class="elstep" data-d="-1" aria-label="Less">−</button><input type="range" min="${mn}" max="${mx}" step="${st}" value="${val}"><button class="elstep" data-d="1" aria-label="More">+</button><b>${fmt(val)}</b>`,tipText);
  const i=r.querySelector('input'), o=r.querySelector('b');
  i.oninput=()=>{ o.textContent=fmt(i.value); }; i.onchange=()=>set(+i.value);
  r.querySelectorAll('.elstep').forEach(b=>b.onclick=()=>{ const v=Math.max(mn,Math.min(mx,Math.round((+i.value+st*+b.dataset.d)/st)*st)); i.value=v; o.textContent=fmt(v); set(+fmt(v)); });
  return r; }
function elabChips(parent,label,items,cur,color,onPick,tipText){ const r=elabRow(parent,label,`<div class="chips">${items.map(([k,v])=>`<button class="chip" data-k="${k}" style="--c:${color}">${v}</button>`).join('')}</div>`,tipText);
  r.querySelectorAll('[data-k]').forEach(b=>{ b.classList.toggle('on',b.dataset.k===String(cur)); b.onclick=()=>onPick(b.dataset.k); }); return r; }

function renderElab(){ const f=$('#mlabForm'); f.innerHTML='';
  const tab=ELAB.tab||'sum', tabs=document.createElement('div'); tabs.className='eltabs';
  tabs.innerHTML=[['sum','Summon'],['edit','Edit'],['share','Share']].map(([k,v])=>`<button data-t="${k}" class="${k===tab?'on':''}">${v}${k==='share'&&Object.keys(ELAB.over).length?' <i>'+Object.keys(ELAB.over).length+'</i>':''}</button>`).join('');
  tabs.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ ELAB.tab=b.dataset.t; renderElab(); $('#mlabPanel .mlbody').scrollTop=0; });
  f.appendChild(tabs);
  const body=document.createElement('div'); body.className='eltab'; f.appendChild(body);
  if(tab==='sum') elabSummonTab(body); else if(tab==='edit') elabEditTab(body); else elabShareTab(body); }

function elabSummonTab(f){
  const r=elabRow(f,'Enemy',`<select id="elPick">${elabOptions(ELAB.pick)}</select>`); r.querySelector('select').onchange=e=>{ ELAB.pick=e.target.value; };
  const bt=document.createElement('div'); bt.className='elbig';
  bt.innerHTML='<button class="btn" data-a="sum">Summon</button><button class="btn ghost" data-a="edit">Edit it</button><button class="btn ghost" data-a="clear">Clear all</button>'; f.appendChild(bt);
  bt.querySelector('[data-a=sum]').onclick=()=>elabSummon(ELAB.pick);
  bt.querySelector('[data-a=edit]').onclick=()=>{ ELAB.tab='edit'; renderElab(); };
  bt.querySelector('[data-a=clear]').onclick=()=>{ for(const e of B.enemies){ if(e.tile&&e.tile.occ===e) e.tile.occ=null; } B.enemies=[]; B.teles=B.teles.filter(t=>t.friendly); B.shots=B.shots.filter(x=>x.from!=='e'); renderElabBoard(); };
  const on=document.createElement('p'); on.className='ellab'; on.textContent='On the board'; f.appendChild(on);
  const bd=document.createElement('div'); bd.id='elBoard'; bd.className='elboard'; f.appendChild(bd); renderElabBoard();
  elabNum(f,'Depth',ELAB.opt.depth,1,30,1,v=>{ ELAB.opt.depth=v; elabKeep(); },'The dungeon depth new enemies are summoned at: deeper ones have more HP, hit harder, and use the depth stage for that depth.');
  const tog=(k,label,tipText)=>elabChips(f,label,[['1','On'],['0','Off']],ELAB.opt[k]?'1':'0','#ff6ad5',v=>{ ELAB.opt[k]=v==='1'; elabKeep(); if(k==='tough') for(const e of B.enemies) if(e.hp>0) elabApply(e,true); renderElab(); },tipText);
  tog('attack','They attack','Off: enemies only walk about, so you can watch how they move.');
  tog('respawn','Respawn when killed','On: a killed enemy comes back (the same kind) after 1.5 s.');
  tog('tough',"Can't die",'On: enemies on the board have 99,999 HP, to watch them for as long as you like.');
  tog('live','Use in real fights','On: enemies you meet in the dungeon (in this browser) use your changes too, each by the depth it is met at. Off: only the lab uses them.'); }

function elabEditTab(f){ const id=ENEMY_DEFS[ELAB.pick]?ELAB.pick:'ram';
  const r=elabRow(f,'Enemy',`<select>${elabOptions(id)}</select>`,'● marks the enemies you have changed.'); r.querySelector('select').onchange=e=>{ ELAB.pick=e.target.value; renderElab(); };
  const ch=Object.keys(ELAB.over);
  if(ch.length){ const c=elabRow(f,'Changed',`<div class="chips">${ch.map(k=>`<button class="chip" data-k="${k}" style="--c:#ffe066">${esc(ENEMY_DEFS[k].name)}</button>`).join('')}</div>`);
    c.querySelectorAll('[data-k]').forEach(b=>{ b.classList.toggle('on',b.dataset.k===id); b.onclick=()=>{ ELAB.pick=b.dataset.k; renderElab(); }; }); }
  const box=document.createElement('div'); box.className='eledit'; f.appendChild(box); elabEditor(box,id); }

// the editor for one kind: its depth stages, then the chosen stage's settings
function elabEditor(ed,id){ const st=elabStages(id), k=Math.min(ELAB.stage[id]||0,st.length), c=elabCur(id,k), changed=!!ELAB.over[id];
  const redo=()=>{ const b=$('#mlabPanel .mlbody'), y=b.scrollTop; renderElab(); b.scrollTop=y; };   // the whole tab, so ● and Changed keep up
  const now=elabStageAt(id,ELAB.opt.depth);
  const tabs=elabRow(ed,'Depth stage',`<div class="chips">${[1,...st.map(x=>x.from)].map((f,i)=>`<button class="chip" data-st="${i}" style="--c:#b48cff">From ${f}${i===now?' ★':''}</button>`).join('')}<button class="chip" data-st="add" style="--c:#b48cff">+ Stage</button></div>`,
    'Depth stages. Each is what this enemy does from that depth down, until the next stage; a new stage starts as a copy of the one before it, so change only what differs. ★: the stage the Summon tab\'s Depth uses.');
  tabs.querySelectorAll('[data-st]').forEach(b=>{ b.classList.toggle('on',b.dataset.st===String(k)); b.onclick=()=>{ if(b.dataset.st==='add') elabAddStage(id); else ELAB.stage[id]=+b.dataset.st; redo(); }; });
  if(k){ elabNum(ed,'This stage starts at depth',st[k-1].from,2,30,1,v=>{ elabStageFrom(id,k,v); redo(); },'The depth this stage takes over from.');
    const del=document.createElement('button'); del.className='btn ghost elwide'; del.textContent='Remove this stage'; del.onclick=()=>{ elabDelStage(id,k); redo(); }; ed.appendChild(del); }
  // attacks: one row each, with big ↑ ↓ ✕
  const tellOf=m=>(typeof TELL!=='undefined'&&TELL[m]&&TELL[m].text)||'';
  const mv=elabRow(ed,'Attacks'+(c.order?' (in this order)':' (one picked at random)'),`<div class="elmoves">${c.moves.map((m,i)=>`<div class="elmove"><span><b>${esc(m)}</b><small>${esc(tellOf(m))}</small></span><button data-l="${i}" aria-label="Earlier"${i?'':' disabled'}>↑</button><button data-r="${i}" aria-label="Later"${i<c.moves.length-1?'':' disabled'}>↓</button><button data-x="${i}" aria-label="Remove">✕</button></div>`).join('')}</div>`);
  mv.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{ const l=c.moves.slice(); l.splice(+b.dataset.x,1); if(!l.length){ tip('It needs at least one attack'); return; } elabSetOver(id,{moves:l}); redo(); });
  mv.querySelectorAll('[data-l],[data-r]').forEach(b=>b.onclick=()=>{ const l=c.moves.slice(), i=+(b.dataset.l??b.dataset.r), j=b.dataset.l!=null?i-1:i+1; if(j<0||j>=l.length) return; [l[i],l[j]]=[l[j],l[i]]; elabSetOver(id,{moves:l}); redo(); });
  const add=elabRow(ed,'Add an attack',`<select><option value="">Pick one…</option>${Object.keys(MOVES).sort().map(m=>`<option value="${m}">${m}${tellOf(m)?' — '+esc(tellOf(m)):''}</option>`).join('')}</select>`);
  add.querySelector('select').onchange=e=>{ const m=e.target.value; if(!m) return; elabSetOver(id,{moves:c.moves.concat(m)}); redo(); };
  elabChips(ed,'Order',[['1','In order'],['0','Random']],c.order?'1':'0','#8fe4ff',v=>{ elabSetOver(id,{order:v==='1'}); redo(); },'In order: it uses its attacks one after another and starts again. Random: it picks one each time.');
  elabChips(ed,'Walking',Object.entries(ELAB_AI),c.ai,'#ffe066',v=>{ elabSetOver(id,{ai:v}); redo(); },
    'How it moves between attacks. Lines up: steps into your row. Wanders: drifts, pressing in later. Keeps back: stays far early, then closes in. Still: never moves.');
  elabNum(ed,'Attacks every, fastest (s)',c.rate[0],.5,12,.1,v=>{ elabSetOver(id,{rate:[v,Math.max(v,c.rate[1])]}); redo(); },'Seconds between its attacks: each wait is picked between the fastest and the slowest.');
  elabNum(ed,'Attacks every, slowest (s)',c.rate[1],.5,12,.1,v=>{ elabSetOver(id,{rate:[Math.min(v,c.rate[0]),v]}); redo(); });
  elabNum(ed,'Damage',c.dmg,0,80,1,v=>{ elabSetOver(id,{dmg:v}); redo(); },'Its hit before depth scaling (what it would do at depth 1); the game still makes it hit harder the deeper it is met.');
  elabNum(ed,'HP',c.hp,5,3000,5,v=>{ elabSetOver(id,{hp:v}); redo(); },'Its health before depth scaling (what it would have at depth 1); the game still adds more the deeper it is met.');
  const bt=document.createElement('div'); bt.className='elbig';
  bt.innerHTML=`<button class="btn" data-a="sum">Summon one</button><button class="btn ghost" data-a="reset"${changed?'':' disabled'}>Back to the game's</button>`;
  bt.querySelector('[data-a=sum]').onclick=()=>elabSummon(id);
  const rs=bt.querySelector('[data-a=reset]'); rs.onclick=()=>{ if(!rs.dataset.armed){ rs.dataset.armed='1'; rs.textContent='Tap again: undo all its changes'; return; } ELAB.stage[id]=0; elabStore(id,{}); renderElab(); };
  ed.appendChild(bt); }

function elabShareTab(f){
  const n=Object.keys(ELAB.over).length, p=document.createElement('p'); p.className='hint elnote';
  p.textContent=n?n+' enem'+(n>1?'ies':'y')+' changed: '+Object.keys(ELAB.over).map(k=>ENEMY_DEFS[k].name).join(', ')+'.':'Nothing changed yet. Change an enemy on the Edit tab.';
  f.appendChild(p);
  const sh=document.createElement('div'); sh.className='elbig elshare';
  sh.innerHTML=`<button class="btn" data-a="copy">Copy changes</button><button class="btn ghost" data-a="paste">Paste</button><button class="btn ghost" data-a="reset"${n?'':' disabled'}>Reset all</button>`;
  f.appendChild(sh);
  const ta=document.createElement('textarea'); ta.className='dbgcopy elpaste'; ta.hidden=true; ta.placeholder='Paste copied enemy changes here, then Apply'; f.appendChild(ta);
  const ap=document.createElement('button'); ap.className='btn elwide'; ap.textContent='Apply'; ap.hidden=true; f.appendChild(ap);
  sh.querySelector('[data-a=copy]').onclick=()=>{ const txt=JSON.stringify({enemyLab:ELAB.over},null,1); ta.hidden=false; ap.hidden=true; ta.readOnly=true; ta.value=txt; ta.select();
    const ok=()=>tip(n?'Copied '+n+' changed enem'+(n>1?'ies':'y'):'Copied (no changes yet)');
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok,()=>{ try{ document.execCommand('copy'); }catch(e){} ok(); }); else { try{ document.execCommand('copy'); }catch(e){} ok(); } };
  sh.querySelector('[data-a=paste]').onclick=async()=>{ ta.hidden=false; ta.readOnly=false; ap.hidden=false; ta.value='';
    try{ if(navigator.clipboard&&navigator.clipboard.readText){ const t=await navigator.clipboard.readText(); if(t&&t.includes('{')) ta.value=t; } }catch(e){} ta.focus(); };
  ap.onclick=()=>{ let o; try{ o=JSON.parse(ta.value); }catch(e){ tip('That isn\'t copied enemy changes'); return; }
    o=o&&o.enemyLab||o; if(!o||typeof o!=='object'){ tip('That isn\'t copied enemy changes'); return; }
    const clean=x=>{ const p={}; if(Array.isArray(x.moves)) p.moves=x.moves.filter(m=>MOVES[m]); if('order' in x) p.order=!!x.order;
      if(ELAB_AI[x.ai]) p.ai=x.ai; if(Array.isArray(x.rate)&&x.rate.length===2) p.rate=x.rate.map(Number);
      if(x.dmg!=null&&+x.dmg>=0) p.dmg=+x.dmg; if(+x.hp>0) p.hp=+x.hp; if(p.moves&&!p.moves.length) delete p.moves; return p; };
    let k=0; for(const id in o) if(ENEMY_DEFS[id]&&o[id]&&typeof o[id]==='object'){ const p=clean(o[id]);
      if(Array.isArray(o[id].stages)) p.stages=o[id].stages.filter(x=>x&&+x.from>=2&&+x.from<=30).map(x=>Object.assign({from:Math.round(+x.from)},clean(x))).sort((a,b)=>a.from-b.from)
        .filter((x,i,l)=>!i||x.from!==l[i-1].from);
      ELAB.stage[id]=0; elabStore(id,p); k++; }
    tip(k?'Applied changes to '+k+' enem'+(k>1?'ies':'y'):'Nothing in that to apply'); renderElab(); };
  const rs=sh.querySelector('[data-a=reset]'); rs.onclick=()=>{ if(!rs.dataset.armed){ rs.dataset.armed='1'; rs.textContent='Tap again to reset all'; return; }
    const was=Object.keys(ELAB.over); ELAB.over={}; ELAB.stage={}; elabKeep(); for(const e of B.enemies) if(e.hp>0&&e.labDepth&&was.includes(e.id)) elabApply(e); renderElab(); }; }

// the enemies on the board, each with an ✕ to send it away
function renderElabBoard(){ const bd=document.getElementById('elBoard'); if(!bd||!B) return; const live=B.enemies.filter(e=>e.hp>0);
  bd.innerHTML=live.length?'':'<span class="dim">Nobody yet: pick an enemy and Summon.</span>';
  for(const e of live){ const c=document.createElement('span'); c.className='elon'; c.innerHTML=`${esc(e.name)} <button aria-label="Remove">✕</button>`;
    c.querySelector('button').onclick=()=>{ if(e.tile&&e.tile.occ===e) e.tile.occ=null; B.enemies=B.enemies.filter(x=>x!==e); B.teles=B.teles.filter(t=>t.owner!==e); renderElabBoard(); };
    bd.appendChild(c); } }

/* ---------------- the lab button: which lab? ---------------- */
$('#goMove').onclick=()=>$('#labPick').classList.add('on');
$('#lpMove').onclick=()=>{ $('#labPick').classList.remove('on'); mlabStart(); };
$('#lpFoes').onclick=()=>{ $('#labPick').classList.remove('on'); elabStart(); };
$('#lpCancel').onclick=()=>$('#labPick').classList.remove('on');
$('#labPick').addEventListener('click',e=>{ if(e.target.id==='labPick') $('#labPick').classList.remove('on'); });
