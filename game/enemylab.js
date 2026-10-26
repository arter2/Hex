/* ---------------- the Enemy lab ----------------
   The Movement lab's other half (the lab button asks which): an empty board where you summon any enemy and
   watch it move and attack. You can't lose (a hit is counted, then healed), and killing everything doesn't end it.
   Its panel lists every kind of enemy with its attacks, the order it uses them (in turn, or picked at random),
   how it walks, how often it attacks, and its damage and HP; change any of them and the ones on the board change
   at once. Copy gives your changes as text to paste back here later (or to send on); Paste applies such text.
   Changes live in this browser and only in the lab: real fights use the game's own enemies. */
const ELAB_KEY='hexmancers-enemylab';
const ELAB_OPT_DEF={depth:3, respawn:false, tough:false, attack:true};
const ELAB=(()=>{ let s={}; try{ s=JSON.parse(localStorage.getItem(ELAB_KEY))||{}; }catch(e){}
  return {over:s.over||{}, opt:Object.assign({},ELAB_OPT_DEF,s.opt||{}), open:null, pick:'ram', find:''}; })();
const elabKeep=()=>{ try{ localStorage.setItem(ELAB_KEY,JSON.stringify({over:ELAB.over,opt:ELAB.opt})); }catch(e){} };
const elabOn=()=>!!(B&&B.lab&&B.lab.foes);
const ELAB_AI={align:'Lines up', wander:'Wanders', back:'Keeps back', still:'Still'};
let ELAB_HITS=0;

// what a kind does out of the box: its fixed order (fights.js RHYTHM) if it has one, otherwise its moves at random
function elabBase(id){ const d=ENEMY_DEFS[id], r=typeof RHYTHM!=='undefined'&&RHYTHM[id];
  return {moves:(r||d.moves||['shot']).slice(), order:!!r, ai:d.ai||'wander', rate:d.rate.slice(), dmg:d.dmg, hp:d.hp}; }
const elabCur=id=>Object.assign(elabBase(id),ELAB.over[id]||{});
// keep only what differs from the game's own
function elabSetOver(id,patch){ const base=elabBase(id), o=Object.assign({},ELAB.over[id]||{},patch);
  for(const k in o) if(JSON.stringify(o[k])===JSON.stringify(base[k])) delete o[k];
  if(Object.keys(o).length) ELAB.over[id]=o; else delete ELAB.over[id]; elabKeep();
  for(const e of B?B.enemies:[]) if(e.id===id&&e.hp>0) elabApply(e); elabShareSync(); }
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
  const e=makeEnemy(id,t,ELAB.opt.depth); B.enemies.push(e); elabApply(e,true); burst(t,COLORS[e.color].c,16); floater(e.name,t,'#ffe24d');
  e.atkT=Math.max(e.atkT,1.5); renderElabBoard(); }
// a kind's changes on one enemy on the board (fresh: just summoned, so set its health from scratch)
function elabApply(e,fresh){ const c=elabCur(e.id), d=ENEMY_DEFS[e.id];
  e.def=Object.assign({},d,{ai:c.ai, rate:c.rate.slice()});
  if(c.order){ e.seq=c.moves.slice(); e.si=0; e.moves=undefined; } else { e.moves=c.moves.slice(); e.seq=null; }
  e.nextMove=c.order?(e.si++,e.seq[0]):pick(e.moves);
  e.dmg=Math.round(c.dmg*e.ds);
  if(e.hpScale==null) e.hpScale=e.maxHp/d.hp;   // the depth's HP scaling, taken once when it is summoned
  if(ELAB.opt.tough){ e.hp=e.maxHp=99999; return; }
  const full=Math.max(1,Math.round(c.hp*e.hpScale)), frac=fresh||e.maxHp===99999?1:e.hp/e.maxHp;
  e.maxHp=full; e.hp=Math.max(1,Math.round(full*frac)); }
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
  { const r=document.createElement('div'); r.className='mlrow'; r.dataset.tip='The dungeon depth new enemies are summoned at: deeper ones have more HP and hit harder.';
    r.innerHTML=`<span>Depth</span><input type="range" min="1" max="30" step="1" value="${ELAB.opt.depth}"><b>${ELAB.opt.depth}</b>`;
    const i=r.querySelector('input'), o=r.querySelector('b'); i.oninput=()=>{ ELAB.opt.depth=+i.value; o.textContent=i.value; elabKeep(); }; f.appendChild(r); }

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
    let k=0; for(const id in o) if(ENEMY_DEFS[id]&&o[id]&&typeof o[id]==='object'){ const p={};
      if(Array.isArray(o[id].moves)) p.moves=o[id].moves.filter(m=>MOVES[m]); if('order' in o[id]) p.order=!!o[id].order;
      if(ELAB_AI[o[id].ai]) p.ai=o[id].ai; if(Array.isArray(o[id].rate)&&o[id].rate.length===2) p.rate=o[id].rate.map(Number);
      if(+o[id].dmg>=0) p.dmg=+o[id].dmg; if(+o[id].hp>0) p.hp=+o[id].hp; if(p.moves&&!p.moves.length) delete p.moves;
      elabSetOver(id,p); k++; }
    tip(k?'Applied changes to '+k+' enem'+(k>1?'ies':'y'):'Nothing in that to apply'); renderElab(); };
  const rs=sh.querySelector('[data-a=reset]'); rs.onclick=()=>{ if(!rs.dataset.armed){ rs.dataset.armed='1'; rs.textContent='Tap again to reset all'; return; }
    const was=Object.keys(ELAB.over); ELAB.over={}; elabKeep(); for(const e of B.enemies) if(e.hp>0&&was.includes(e.id)) elabApply(e); renderElab(); };
}
// the enemies on the board, each with an ✕ to send it away
function renderElabBoard(){ const bd=document.getElementById('elBoard'); if(!bd||!B) return; const live=B.enemies.filter(e=>e.hp>0);
  bd.innerHTML=live.length?'':'<span class="dim">Nobody yet: pick an enemy and Summon.</span>';
  for(const e of live){ const c=document.createElement('span'); c.className='elon'; c.innerHTML=`${esc(e.name)} <button aria-label="Remove">✕</button>`;
    c.querySelector('button').onclick=()=>{ if(e.tile&&e.tile.occ===e) e.tile.occ=null; B.enemies=B.enemies.filter(x=>x!==e); B.teles=B.teles.filter(t=>t.owner!==e); renderElabBoard(); };
    bd.appendChild(c); } }
// one kind: a summary line; tap it for the editor
function elabKind(id){ const d=ENEMY_DEFS[id], c=elabCur(id), changed=!!ELAB.over[id], open=ELAB.open===id;
  const w=document.createElement('div'); w.className='elkind'+(open?' open':'')+(changed?' changed':'');
  w.dataset.find=(d.name+' '+c.moves.join(' ')+' '+elabCat(d)).toLowerCase();
  const head=document.createElement('button'); head.className='elhead'; head.type='button';
  head.innerHTML=`<b>${esc(d.name)}${changed?' <i>changed</i>':''}</b><span>${c.moves.map(m=>esc(m)).join(c.order?' → ':' · ')}${c.order?'':' <em>(random)</em>'}</span>`;
  head.onclick=()=>{ ELAB.open=open?null:id; const nw=elabKind(id); w.replaceWith(nw); };
  w.appendChild(head); if(!open) return w;

  const ed=document.createElement('div'); ed.className='eledit';
  const row=(label,html,tipText)=>{ const r=document.createElement('div'); r.className='mlrow'; if(tipText) r.dataset.tip=tipText; r.innerHTML=`<span>${label}</span>`+html; ed.appendChild(r); return r; };
  const redo=()=>{ const nw=elabKind(id); w.replaceWith(nw); };
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
  slide('Damage (depth 1)',c.dmg,0,80,1,v=>elabSetOver(id,{dmg:v}),'Its hit at depth 1; deeper enemies hit harder (Depth, above).');
  slide('HP (depth 1)',c.hp,5,3000,5,v=>elabSetOver(id,{hp:v}),'Its health at depth 1; deeper enemies have more.');
  const bt=document.createElement('div'); bt.className='mlrow elsum';
  bt.innerHTML=`<button class="btn small" data-a="sum">Summon one</button><button class="btn ghost small" data-a="reset"${changed?'':' disabled'}>Back to the game's</button>`;
  bt.querySelector('[data-a=sum]').onclick=()=>{ ELAB.pick=id; const s=document.getElementById('elPick'); if(s) s.value=id; elabSummon(id); };
  bt.querySelector('[data-a=reset]').onclick=()=>{ delete ELAB.over[id]; elabKeep(); for(const e of B.enemies) if(e.id===id&&e.hp>0) elabApply(e); elabShareSync(); redo(); };
  ed.appendChild(bt); w.appendChild(ed); return w; }

/* ---------------- the lab button: which lab? ---------------- */
$('#goMove').onclick=()=>$('#labPick').classList.add('on');
$('#lpMove').onclick=()=>{ $('#labPick').classList.remove('on'); mlabStart(); };
$('#lpFoes').onclick=()=>{ $('#labPick').classList.remove('on'); elabStart(); };
$('#lpCancel').onclick=()=>$('#labPick').classList.remove('on');
$('#labPick').addEventListener('click',e=>{ if(e.target.id==='labPick') $('#labPick').classList.remove('on'); });
