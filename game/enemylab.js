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
function elabShareSync(){ const n=Object.keys(ELAB.over).length, c=document.querySelector('#mlabForm [data-a=copy]'), r=document.querySelector('#mlabForm .elshare [data-a=reset]');
  if(c) c.textContent='Copy changes'+(n?' ('+n+')':''); if(r){ r.disabled=!n; delete r.dataset.armed; r.textContent='Reset all'; } }
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

/* ---------------- the panel ---------------- */
function renderElab(){ const f=$('#mlabForm'); f.innerHTML='';
  const h=(t,sub)=>{ const x=document.createElement('h4'); x.textContent=t; if(sub){ const s=document.createElement('small'); s.textContent=sub; x.appendChild(s); } f.appendChild(x); return x; };
  const ids=Object.keys(ENEMY_DEFS), groups={}; for(const id of ids) (groups[elabCat(ENEMY_DEFS[id])]=groups[elabCat(ENEMY_DEFS[id])]||[]).push(id);
  const options=sel=>Object.entries(groups).map(([g,l])=>`<optgroup label="${g}">`+l.map(id=>`<option value="${id}"${id===sel?' selected':''}>${esc(ENEMY_DEFS[id].name)}</option>`).join('')+'</optgroup>').join('');

  h('Summon');
  const s=document.createElement('div'); s.className='mlrow elsum';
  s.innerHTML=`<select id="elPick">${options(ELAB.pick)}</select><button class="btn small" data-a="sum">Summon</button><button class="btn ghost small" data-a="clear">Clear all</button>`;
  s.querySelector('select').onchange=e=>{ ELAB.pick=e.target.value; };
  s.querySelector('[data-a=sum]').onclick=()=>elabSummon(ELAB.pick);
  s.querySelector('[data-a=clear]').onclick=()=>{ for(const e of B.enemies){ if(e.tile&&e.tile.occ===e) e.tile.occ=null; } B.enemies=[]; B.teles=B.teles.filter(t=>t.friendly); B.shots=B.shots.filter(x=>x.from!=='e'); renderElabBoard(); };
  f.appendChild(s);
  const tog=(k,label,tipText)=>{ const r=document.createElement('div'); r.className='mlrow'; r.dataset.tip=tipText;
    r.innerHTML=`<span>${label}</span><div class="chips"><button class="chip" style="--c:#ff6ad5">${ELAB.opt[k]?'On':'Off'}</button></div>`;
    const c=r.querySelector('button'); c.classList.toggle('on',!!ELAB.opt[k]);
    c.onclick=()=>{ ELAB.opt[k]=!ELAB.opt[k]; elabKeep(); if(k==='tough') for(const e of B.enemies) if(e.hp>0) elabApply(e,true); renderElab(); }; f.appendChild(r); };
  tog('attack','They attack','Off: enemies only walk about, so you can watch how they move.');
  tog('respawn','Respawn when killed','On: a killed enemy comes back (the same kind) after 1.5 s.');
  tog('tough',"Can't die",'On: enemies on the board have 99,999 HP, to watch them for as long as you like.');
  tog('live','Use in real fights','On: enemies you meet in the dungeon (in this browser) use your changes too, each by the depth it is met at. Off: only the lab uses them.');
  { const r=document.createElement('div'); r.className='mlrow'; r.dataset.tip='The dungeon depth new enemies are summoned at: deeper ones have more HP and hit harder, and use the depth stage for that depth.';
    r.innerHTML=`<span>Depth</span><input type="range" min="1" max="30" step="1" value="${ELAB.opt.depth}"><b>${ELAB.opt.depth}</b>`;
    const i=r.querySelector('input'), o=r.querySelector('b'); i.oninput=()=>{ ELAB.opt.depth=+i.value; o.textContent=i.value; elabKeep(); };
    i.onchange=()=>{ if(ELAB.open){ const w=[...document.querySelectorAll('.elkind.open')][0]; if(w) w.replaceWith(elabKind(ELAB.open)); } }; f.appendChild(r); }

  h('On the board'); const bd=document.createElement('div'); bd.id='elBoard'; bd.className='elboard'; f.appendChild(bd); renderElabBoard();

  h('Enemies','tap one to see and change it');
  const find=document.createElement('input'); find.type='search'; find.className='elfind'; find.placeholder='Find an enemy or an attack'; find.value=ELAB.find;
  find.oninput=()=>{ ELAB.find=find.value; list.querySelectorAll('.elkind').forEach(x=>{ x.hidden=!!ELAB.find&&!x.dataset.find.includes(ELAB.find.toLowerCase()); }); };
  f.appendChild(find);
  const list=document.createElement('div'); list.className='ellist'; f.appendChild(list);
  for(const [g,l] of Object.entries(groups)){ const gh=document.createElement('p'); gh.className='elgroup'; gh.textContent=g; list.appendChild(gh);
    for(const id of l) list.appendChild(elabKind(id)); }
  find.oninput();

  h('Share changes');
  const sh=document.createElement('div'); sh.className='mlrow elsum elshare';
  const n=Object.keys(ELAB.over).length;
  sh.innerHTML=`<button class="btn small" data-a="copy">Copy changes${n?' ('+n+')':''}</button><button class="btn ghost small" data-a="paste">Paste</button><button class="btn ghost small" data-a="reset"${n?'':' disabled'}>Reset all</button>`;
  f.appendChild(sh);
  const ta=document.createElement('textarea'); ta.className='dbgcopy elpaste'; ta.hidden=true; ta.placeholder='Paste copied enemy changes here, then Apply'; f.appendChild(ta);
  const ap=document.createElement('button'); ap.className='btn small'; ap.textContent='Apply'; ap.hidden=true; f.appendChild(ap);
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
    const was=Object.keys(ELAB.over); ELAB.over={}; ELAB.stage={}; elabKeep(); for(const e of B.enemies) if(e.hp>0&&e.labDepth&&was.includes(e.id)) elabApply(e); renderElab(); };
}
// the enemies on the board, each with an ✕ to send it away
function renderElabBoard(){ const bd=document.getElementById('elBoard'); if(!bd||!B) return; const live=B.enemies.filter(e=>e.hp>0);
  bd.innerHTML=live.length?'':'<span class="dim">Nobody yet: pick an enemy and Summon.</span>';
  for(const e of live){ const c=document.createElement('span'); c.className='elon'; c.innerHTML=`${esc(e.name)} <button aria-label="Remove">✕</button>`;
    c.querySelector('button').onclick=()=>{ if(e.tile&&e.tile.occ===e) e.tile.occ=null; B.enemies=B.enemies.filter(x=>x!==e); B.teles=B.teles.filter(t=>t.owner!==e); renderElabBoard(); };
    bd.appendChild(c); } }
// one kind: a summary line; tap it for the editor
function elabKind(id){ const d=ENEMY_DEFS[id], st=elabStages(id), k=Math.min(ELAB.stage[id]||0,st.length), c=elabCur(id,k), c0=elabCur(id,0), changed=!!ELAB.over[id], open=ELAB.open===id;
  const w=document.createElement('div'); w.className='elkind'+(open?' open':'')+(changed?' changed':'');
  w.dataset.find=(d.name+' '+c.moves.join(' ')+' '+elabCat(d)).toLowerCase();
  const head=document.createElement('button'); head.className='elhead'; head.type='button';
  head.innerHTML=`<b>${esc(d.name)}${changed?' <i>changed</i>':''}</b><span>${c0.moves.map(m=>esc(m)).join(c0.order?' → ':' · ')}${c0.order?'':' <em>(random)</em>'}${st.length?' <em>· '+st.length+' depth stage'+(st.length>1?'s':'')+'</em>':''}</span>`;
  head.onclick=()=>{ ELAB.open=open?null:id; const nw=elabKind(id); w.replaceWith(nw); };
  w.appendChild(head); if(!open) return w;

  const ed=document.createElement('div'); ed.className='eledit';
  const row=(label,html,tipText)=>{ const r=document.createElement('div'); r.className='mlrow'; if(tipText) r.dataset.tip=tipText; r.innerHTML=`<span>${label}</span>`+html; ed.appendChild(r); return r; };
  const redo=()=>{ const nw=elabKind(id); w.replaceWith(nw); };
  // depth stages: a tab for each (from depth 1, then each stage's own); the one the Depth slider uses is starred
  const now=elabStageAt(id,ELAB.opt.depth), tabs=row('Depth',`<div class="chips">${[1,...st.map(x=>x.from)].map((f,i)=>`<button class="chip" data-st="${i}" style="--c:#b48cff">${f}+${i===now?' ★':''}</button>`).join('')}<button class="chip" data-st="add" style="--c:#b48cff">+ Stage</button></div>`,
    'Depth stages. Each tab is what this enemy does from that depth down, until the next stage; a new stage starts as a copy of the one before it, so change only what differs. ★: the stage the Depth slider (above) uses for new summons.');
  tabs.querySelectorAll('[data-st]').forEach(b=>{ b.classList.toggle('on',b.dataset.st===String(k)); b.onclick=()=>{ if(b.dataset.st==='add') elabAddStage(id); else ELAB.stage[id]=+b.dataset.st; redo(); }; });
  if(k){ const r=row('Starts at depth',`<input type="range" min="2" max="30" step="1" value="${st[k-1].from}"><b>${st[k-1].from}</b>`,'The depth this stage takes over from.');
    const i=r.querySelector('input'), o=r.querySelector('b'); i.oninput=()=>{ o.textContent=i.value; }; i.onchange=()=>{ elabStageFrom(id,k,+i.value); redo(); };
    const del=document.createElement('button'); del.className='btn ghost small elstdel'; del.textContent='Remove this stage'; del.onclick=()=>{ elabDelStage(id,k); redo(); }; ed.appendChild(del); }
  // attacks, in order: tap ✕ to drop one, ‹ › to move it, and add any move the game has
  const mv=row('Attacks',`<div class="elmoves">${c.moves.map((m,i)=>`<span class="elmove" title="${esc((typeof TELL!=='undefined'&&TELL[m]&&TELL[m].text)||'')}"><button data-l="${i}" aria-label="Earlier">‹</button>${esc(m)}<button data-r="${i}" aria-label="Later">›</button><button data-x="${i}" aria-label="Remove">✕</button></span>`).join('')}</div>`,
    'Its attacks. In order: it uses them one after another and starts again. Random: it picks one each time. Hold an attack name for what it does.');
  mv.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{ const l=c.moves.slice(); l.splice(+b.dataset.x,1); if(!l.length){ tip('It needs at least one attack'); return; } elabSetOver(id,{moves:l}); redo(); });
  mv.querySelectorAll('[data-l],[data-r]').forEach(b=>b.onclick=()=>{ const l=c.moves.slice(), i=+(b.dataset.l??b.dataset.r), j=b.dataset.l!=null?i-1:i+1; if(j<0||j>=l.length) return; [l[i],l[j]]=[l[j],l[i]]; elabSetOver(id,{moves:l}); redo(); });
  const add=row('Add attack',`<select>${'<option value="">Pick one…</option>'+Object.keys(MOVES).sort().map(m=>`<option value="${m}">${m}${typeof TELL!=='undefined'&&TELL[m]?' — '+esc(TELL[m].text):''}</option>`).join('')}</select>`);
  add.querySelector('select').onchange=e=>{ const m=e.target.value; if(!m) return; elabSetOver(id,{moves:c.moves.concat(m)}); redo(); };
  const ord=row('Order',`<div class="chips"><button class="chip" data-o="1" style="--c:#8fe4ff">In order</button><button class="chip" data-o="0" style="--c:#8fe4ff">Random</button></div>`);
  ord.querySelectorAll('[data-o]').forEach(b=>{ b.classList.toggle('on',+b.dataset.o===+c.order); b.onclick=()=>{ elabSetOver(id,{order:b.dataset.o==='1'}); redo(); }; });
  const ai=row('Walking',`<div class="chips">${Object.entries(ELAB_AI).map(([k,v])=>`<button class="chip" data-ai="${k}" style="--c:#ffe066">${v}</button>`).join('')}</div>`,
    'How it moves between attacks. Lines up: steps into your row. Wanders: drifts, pressing in later. Keeps back: stays far early, then closes in. Stands still: never moves.');
  ai.querySelectorAll('[data-ai]').forEach(b=>{ b.classList.toggle('on',b.dataset.ai===c.ai); b.onclick=()=>{ elabSetOver(id,{ai:b.dataset.ai}); redo(); }; });
  const slide=(label,val,mn,mx,st,set,tipText)=>{ const r=row(label,`<input type="range" min="${mn}" max="${mx}" step="${st}" value="${val}"><b>${val}</b>`,tipText);
    const i=r.querySelector('input'), o=r.querySelector('b'); i.oninput=()=>{ o.textContent=i.value; }; i.onchange=()=>{ set(+i.value); redo(); }; };
  slide('Attacks every, fastest (s)',c.rate[0],.5,12,.1,v=>elabSetOver(id,{rate:[v,Math.max(v,c.rate[1])]}),'Seconds between its attacks: each wait is picked between the fastest and the slowest.');
  slide('Attacks every, slowest (s)',c.rate[1],.5,12,.1,v=>elabSetOver(id,{rate:[Math.min(v,c.rate[0]),v]}));
  slide('Damage',c.dmg,0,80,1,v=>elabSetOver(id,{dmg:v}),'Its hit before depth scaling (what it would do at depth 1); the game still makes it hit harder the deeper it is met.');
  slide('HP',c.hp,5,3000,5,v=>elabSetOver(id,{hp:v}),'Its health before depth scaling (what it would have at depth 1); the game still adds more the deeper it is met.');
  const bt=document.createElement('div'); bt.className='mlrow elsum';
  bt.innerHTML=`<button class="btn small" data-a="sum">Summon one</button><button class="btn ghost small" data-a="reset"${changed?'':' disabled'}>Back to the game's (all stages)</button>`;
  bt.querySelector('[data-a=sum]').onclick=()=>{ ELAB.pick=id; const s=document.getElementById('elPick'); if(s) s.value=id; elabSummon(id); };
  bt.querySelector('[data-a=reset]').onclick=()=>{ ELAB.stage[id]=0; elabStore(id,{}); redo(); };
  ed.appendChild(bt); w.appendChild(ed); return w; }

/* ---------------- the lab button: which lab? ---------------- */
$('#goMove').onclick=()=>$('#labPick').classList.add('on');
$('#lpMove').onclick=()=>{ $('#labPick').classList.remove('on'); mlabStart(); };
$('#lpFoes').onclick=()=>{ $('#labPick').classList.remove('on'); elabStart(); };
$('#lpCancel').onclick=()=>$('#labPick').classList.remove('on');
$('#labPick').addEventListener('click',e=>{ if(e.target.id==='labPick') $('#labPick').classList.remove('on'); });
