/* ---------------- the Movement lab ----------------
   A testing screen, from the front page: a battle with no foes, or with Crossbowmen that stand still at
   the back and fire straight down their row, to try how walking feels. Its panel (⚙ Lab) changes the
   board (columns, rows, hexes or squares, which only the lab ever builds: battle.js BOARD_TEST), the
   turrets, and how you walk (the same settings as Debug › Battle › Battle movement). You can't lose:
   a hit is counted, then healed. Nothing here touches your game; the lab's own settings are kept in
   this browser. With no game loaded it borrows a starter hexmancer that is never saved. */
const MLAB_KEY='hexmancers-movelab', MLAB_FOE='marksman';
const MLAB_DEF={cols:6, rows:8, square:false, turrets:0, every:4, shotSpd:12};
const MLAB=Object.assign({},MLAB_DEF,(()=>{ try{ return JSON.parse(localStorage.getItem(MLAB_KEY))||{}; }catch(e){ return {}; } })());
const mlabKeep=()=>{ try{ localStorage.setItem(MLAB_KEY,JSON.stringify(MLAB)); }catch(e){} };
const mlabOn=()=>!!(B&&B.lab&&B.lab.move);
let MLAB_HITS=0, MLAB_SHOTS=0;

function mlabStart(){
  if(!save){ save=newSave(STARTERS[0]); save.char=lockChar(newChar('human',0)); save.temp=true; }   // never written (ui.js persist)
  paused=false; BOARD_TEST={cols:MLAB.cols, rows:MLAB.rows, square:MLAB.square}; MLAB_HITS=0; MLAB_SHOTS=0;
  fight(1,[Array(MLAB.turrets).fill(MLAB_FOE)],{lab:{list:activeDeck().list, move:true}});
  if(!B) return;
  const p=B.player; p.hp=p.maxHp=999;
  // the turrets: the back column, their rows spread over the board; too tough to kill
  B.enemies.forEach((e,i)=>{ const t=tileCR(BOARD_COLS-1,Math.min(BOARD_ROWS-1,Math.floor((i+.5)*BOARD_ROWS/MLAB.turrets)));
    if(t&&!t.occ){ e.tile.occ=null; e.tile=t; t.occ=e; e.rx=e.rz=null; }
    e.hp=e.maxHp=99999; e.atkMax=MLAB.every; e.atkT=MLAB.every*(.6+.4*((i*.37)%1)); });
  const hurt=B.hooks.onHurt; B.hooks.onHurt=d=>{ MLAB_HITS++; if(hurt) hurt(d); B.player.hp=B.player.maxHp; mlabHud(); };
  closeCustomScreen(); mlabSync(); }
// a turret's turn (enemies.js): count down, then one straight shot down its row
function mlabTurret(e,dt){ e.atkT-=dt; if(e.atkT>0) return; e.atkT=e.atkMax=MLAB.every;
  shoot(e.tile,lineTiles(e.tile,DIRS.W),{dmg:5,from:'e',owner:e,color:COLORS[e.color].c,speed:1/MLAB.shotSpd}); MLAB_SHOTS++; mlabHud(); }
function mlabExit(){ $('#mlabPanel').classList.remove('on'); BOARD_TEST=null; buildBoard(); B=null; paused=false;
  if(save&&save.temp) save=null; mlabSync(); openMenu(); }
// the lab's button and score show only in a lab battle
function mlabSync(){ const on=mlabOn(); $('#mlabHud').hidden=!on; if(!on) $('#mlabPanel').classList.remove('on'); else { mlabHud(); requestAnimationFrame(mlabPlace); } }
function mlabHud(){ const s=$('#mlabScore'); if(s) s.textContent='Shots '+MLAB_SHOTS+' · Hits '+MLAB_HITS+(MLAB_SHOTS?' · '+Math.round(100*(1-MLAB_HITS/MLAB_SHOTS))+'% dodged':''); }

// the panel: [key, label, min, max, step, what a change needs] — 'board' rebuilds the battle, 'turret' and 'mv' apply at
// once, 'tog' is an on/off switch for a walking setting
const MLAB_ROWS=[
  ['Board',[['cols','Columns per side',2,12,1,'board'],['rows','Rows',3,15,1,'board']]],
  ['Turrets',[['turrets','Crossbowmen',0,6,1,'board'],['every','Fire every (s)',.2,10,.1,'turret'],['shotSpd','Shot speed (tiles/s)',2,60,1,'turret']]],
  ['Joystick',[['mvStick','Joystick (off: follow finger)',0,0,0,'tog'],['mvStickShow','Show the stick',0,0,0,'tog'],['mvStickR','Stick reach (px)',20,160,1,'mv'],['mvDead','Dead zone',0,.7,.01,'mv'],
    ['mvStickSpeed','Top speed (tiles/s)',1,12,.1,'mv'],['mvStickMin','Slowest',0,1,.01,'mv'],['mvStickFull','Full speed at',.1,1,.01,'mv'],['mvCurve','Curve',.2,4,.05,'mv'],['mvTapMs','Tap time (ms)',50,600,10,'mv'],['mvTapPx','Tap slop (px)',2,40,1,'mv']]],
  ['Walking',[['mvShow','Show movement',0,0,0,'tog'],['mvEven','Even screen speed',0,1,.01,'mv'],['mvSpeed','Tap/key speed',.3,5,.05,'mv'],['mvFaceWalk','Face where you walk',0,0,0,'tog'],['mvStride','Stride (tiles)',0,1.5,.01,'mv']]],
  ['Magnet',[['mvSnap','Magnet',0,1,.01,'mv'],['mvSnapAhead','Only forward',0,0,0,'tog'],['mvSnapR','Range (tiles)',0,1.5,.01,'mv'],['mvSnapTime','Ease (s)',0,.6,.01,'mv'],['mvSnapSpd','Top speed',.1,6,.05,'mv'],
    ['mvRest','Finger rest (s)',0,2,.05,'mv']]],
  ['Momentum',[['mvMomentum','Momentum',0,0,0,'tog'],['mvMAccel','Speed-up (s)',0,1,.01,'mv'],['mvMBrake','Braking (s)',.02,1.5,.01,'mv'],['mvMSkid','Skid (s)',.02,1.5,.01,'mv'],['mvGrip','Turn grip',0,1,.01,'mv']]],
  ['Other',[['mvAccel','Speed-up, no momentum (s)',0,2,.01,'mv'],['mvDrag','Drag reach (follow finger)',.5,6,.05,'mv']]]];
const mlabSet=(k,v)=>{ XLIT[k]=v; try{ localStorage.setItem('hexmancers-xl-'+k,typeof v==='boolean'?(v?'1':'0'):String(v)); }catch(e){} if(typeof mlabProfMark==='function') mlabProfMark(); };
// what each lab setting does (press and hold its name); the walking settings take theirs from the debug menu
const MLAB_TIPS={cols:'How many columns each side of the board has. The board is rebuilt when you let go.', rows:'How many rows the board has. The board is rebuilt when you let go.',
  shape:'Hex tiles (the game\'s) or square ones (the lab only), to compare how walking feels.', turrets:'How many Crossbowmen stand at the back of the enemy side. They never move; each fires straight down its row.',
  every:'Seconds between each Crossbowman\'s shots. Its attack bar fills as the shot comes.', shotSpd:'How fast their shots fly, in tiles a second.'};
const mlabTip=k=>MLAB_TIPS[k]||(()=>{ const el=document.getElementById('dbg_'+k), sm=el&&el.closest('.srow')&&el.closest('.srow').querySelector('small'); return sm?sm.textContent:''; })();
function renderMlab(){ const f=$('#mlabForm'); f.innerHTML=''; mlabProfiles(f);
  for(const [head,rows] of MLAB_ROWS){ const h=document.createElement('h4'); h.textContent=head; f.appendChild(h);
    if(head==='Board'){ const r=document.createElement('div'); r.className='mlrow'; r.dataset.tip=mlabTip('shape'); r.innerHTML='<span>Shape</span><div class="chips"><button class="chip" data-sq="0" style="--c:#8fe4ff">⬡ Hex</button><button class="chip" data-sq="1" style="--c:#8fe4ff">◻ Square</button></div>';
      r.querySelectorAll('[data-sq]').forEach(b=>{ b.classList.toggle('on',+b.dataset.sq===+MLAB.square); b.onclick=()=>{ MLAB.square=b.dataset.sq==='1'; mlabKeep(); renderMlab(); mlabStart(); }; }); f.appendChild(r); }
    for(const [k,label,mn,mx,st,what] of rows){ const r=document.createElement('div'); r.className='mlrow'; r.dataset.k=k; r.dataset.tip=mlabTip(k);
      if(what==='tog'){ r.innerHTML='<span>'+label+'</span><div class="chips"><button class="chip" data-tog="1" style="--c:#ff6ad5">'+(XLIT[k]?'On':'Off')+'</button></div>';
        const c=r.querySelector('button'); c.classList.toggle('on',!!XLIT[k]); c.onclick=()=>{ mlabSet(k,!XLIT[k]); renderMlab(); }; f.appendChild(r); continue; }
      const mv=what==='mv', val=mv?XLIT[k]:MLAB[k], dec=st<.1?2:st<1?1:0;
      r.innerHTML=`<span>${label}</span><input type="range" min="${mn}" max="${mx}" step="any" data-q="${xStepQ(st)}" data-k="${k}" value="${val}"><b>${(+val).toFixed(dec)}</b>`;
      const inp=r.querySelector('input'), out=r.querySelector('b');
      inp.oninput=()=>{ const v=+inp.value; out.textContent=v.toFixed(dec); if(mv){ mlabSet(k,v); mlabCurve(); } else { MLAB[k]=v; mlabKeep(); } mlabProfMark(); };
      if(what==='board') inp.onchange=()=>mlabStart();   // the board is rebuilt once you let go of the slider
      f.appendChild(r); xABMark(inp); }
    if(head==='Joystick'){ const c=document.createElement('canvas'); c.id='mlabCurve'; c.width=300; c.height=90; f.appendChild(c); mlabCurve(); } } }
/* Profiles: name and keep a whole setup (every walking setting and the lab's board and Crossbowmen) to switch
   between tests. Tap a profile to load it; a dot marks the loaded one once you change something. Kept in this
   browser. */
const MLAB_PKEY='hexmancers-mlab-profiles', MLAB_PCUR='hexmancers-mlab-profile';
const mlabProfs=()=>{ try{ return JSON.parse(localStorage.getItem(MLAB_PKEY))||{}; }catch(e){ return {}; } };
/* Two built-in profiles (★), tuned with a scored test of scripted thumb input on hex and square boards: start,
   stop, skid, turns, edges, flicks, dodges and how often a stop lands on the tile you meant. Both keep your board.
   Tight: near-instant, like a phone action game; a short slide, and every stop lands on a tile's middle.
   Mario: a little weight, keeping Super Mario Bros.' proportions (letting go slows you a touch faster than you
   speed up, and pushing the other way skids round faster still), scaled down to a dodge on a small board. */
const MLAB_PRESETS={
  '★ Tight':{mv:{mvMAccel:.03, mvMBrake:.08, mvMSkid:.03, mvGrip:1, mvSnapR:.6, mvSnapSpd:5, mvStickSpeed:5.5, mvDead:.15, mvStickMin:.3, mvStickFull:.7}},
  '★ Mario':{mv:{mvMAccel:.05, mvMBrake:.1, mvMSkid:.04, mvGrip:.93, mvSnapR:.7, mvSnapSpd:5, mvStickSpeed:5.5, mvDead:.15, mvStickMin:.3, mvStickFull:.7}}};
const mlabPreset=n=>MLAB_PRESETS[n]&&{mv:Object.assign({},MV_DEF,{mvMomentum:true, mvStick:true},MLAB_PRESETS[n].mv)};
const mlabProf=n=>mlabPreset(n)||mlabProfs()[n];
const mlabProfsKeep=P=>{ try{ localStorage.setItem(MLAB_PKEY,JSON.stringify(P)); }catch(e){} };
let mlabCur=(()=>{ try{ return localStorage.getItem(MLAB_PCUR)||''; }catch(e){ return ''; } })();
const mlabSetCur=n=>{ mlabCur=n; try{ localStorage.setItem(MLAB_PCUR,n); }catch(e){} };
function mlabSnap(){ const mv={}; for(const k in MV_DEF) mv[k]=XLIT[k]; return {mv, lab:Object.assign({},MLAB)}; }
const mlabSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function mlabLoad(n){ const P=mlabProf(n); if(!P) return; const was=Object.assign({},MLAB);
  for(const k in MV_DEF) if(P.mv&&k in P.mv) mlabSet(k,P.mv[k]);
  if(P.lab) Object.assign(MLAB,MLAB_DEF,P.lab); mlabKeep(); mlabSetCur(n); renderMlab();
  if(['cols','rows','square','turrets'].some(k=>was[k]!==MLAB[k])) mlabStart(); }
function mlabProfMark(){ const b=document.querySelector('#mlabForm .mlprof .chip.on'); if(!b) return; const P=mlabProf(mlabCur), now=mlabSnap(); b.classList.toggle('dirty',!!P&&!mlabSame(P.mv,now.mv)||!!(P&&P.lab)&&!mlabSame(P.lab,now.lab)); }
function mlabProfiles(f){ const P=mlabProfs(), names=[...Object.keys(MLAB_PRESETS),...Object.keys(P).filter(n=>!MLAB_PRESETS[n])];
  const h=document.createElement('h4'); h.textContent='Profiles'; f.appendChild(h);
  const box=document.createElement('div'); box.className='mlprof';
  box.innerHTML=(names.length?names.map(n=>`<button class="chip${n===mlabCur?' on':''}" data-p="${n.replace(/"/g,'&quot;')}" style="--c:${MLAB_PRESETS[n]?'#8fe4ff':'#ffe066'}"></button>`).join(''):'<span class="dim">No profiles yet: name this setup and save it.</span>');
  box.querySelectorAll('[data-p]').forEach(b=>{ b.textContent=b.dataset.p; b.onclick=()=>mlabLoad(b.dataset.p); });
  f.appendChild(box);
  const bar=document.createElement('div'); bar.className='mlprofbar';
  bar.innerHTML='<input id="mlabPName" type="text" maxlength="24" placeholder="Name this setup"><button class="btn small" data-a="save">Save</button><button class="btn ghost small" data-a="del">Delete</button>';
  const name=bar.querySelector('input'); name.value=mlabCur;
  bar.querySelector('[data-a=save]').onclick=()=>{ let n=(name.value.trim()||mlabCur||'Profile '+(names.length+1)); if(MLAB_PRESETS[n]) n=n.replace(/^★ */,'')+' (mine)';   /* the built-ins stay as they are */ const Q=mlabProfs(); Q[n]=mlabSnap(); mlabProfsKeep(Q); mlabSetCur(n); renderMlab(); tip&&tip('Saved “'+n+'”'); };
  const del=bar.querySelector('[data-a=del]'); del.disabled=!P[mlabCur];
  del.onclick=()=>{ if(!del.dataset.armed){ del.dataset.armed='1'; del.textContent='Tap to delete “'+mlabCur+'”'; setTimeout(()=>{ if(del.isConnected){ delete del.dataset.armed; del.textContent='Delete'; } },2500); return; }
    const Q=mlabProfs(); delete Q[mlabCur]; mlabProfsKeep(Q); mlabSetCur(''); renderMlab(); };
  f.appendChild(bar); mlabProfMark(); }
/* The joystick's speed against how far you push, drawn under its settings: grey, the dead zone; the line,
   your share of walking speed from the middle of the stick (left) to its rim (right). */
function mlabCurve(){ const c=document.getElementById('mlabCurve'); if(!c) return; const g=c.getContext('2d'), W=c.width, H=c.height, L=28, T=8, w=W-L-8, h=H-T-18;
  g.clearRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(L,T,w*MV('mvDead'),h);
  g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1; g.strokeRect(L+.5,T+.5,w,h);
  g.beginPath(); for(let i=0;i<=120;i++){ const l=i/120, d=MV('mvDead'), u=Math.min(1,(l-d)/Math.max(.01,MV('mvStickFull')-d)), k=l<d?0:MV('mvStickMin')+(1-MV('mvStickMin'))*Math.pow(u,MV('mvCurve'));
    const x=L+l*w, y=T+h-k*h; i?g.lineTo(x,y):g.moveTo(x,y); } g.strokeStyle='#8fe4ff'; g.lineWidth=2; g.stroke();
  g.fillStyle='#93a9ba'; g.font='10px system-ui,sans-serif'; g.fillText('speed',0,T+8); g.fillText('push →',L+w-34,H-4); g.fillText('0',L,H-4); g.fillText('rim',L+w-58,H-4); }
// the panel's height: drag the grip at its foot, like the debug menu's; a tap on the grip folds it small or back
function mlabGrip(){ const grip=$('#mlabGrip'), pan=$('#mlabPanel'), KEY='hexmancers-mlabh', MIN=120; if(!grip) return;
  const maxH=()=>Math.max(MIN,$('#scrBattle').clientHeight-24), set=h=>{ h=Math.round(Math.max(MIN,Math.min(maxH(),h))); pan.style.height=h+'px'; return h; };
  let saved=null; try{ const v=localStorage.getItem(KEY); if(v!==null&&+v>0) saved=+v; }catch(e){} if(saved) set(saved);
  const keep=h=>{ saved=h; try{ localStorage.setItem(KEY,String(h)); }catch(e){} }, P=e=>appXY(e.clientX,e.clientY);
  let drag=null;
  grip.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ grip.setPointerCapture(e.pointerId); }catch(_){} drag={id:e.pointerId,p0:P(e)[1],s0:pan.offsetHeight,moved:false}; grip.classList.add('on'); });
  grip.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; const d=P(e)[1]-drag.p0; if(Math.abs(d)>4) drag.moved=true; if(drag.moved) set(drag.s0+d); });
  const end=e=>{ if(!drag||e.pointerId!==drag.id) return; const d=drag; drag=null; grip.classList.remove('on');
    if(d.moved) keep(pan.offsetHeight); else if(e.type==='pointerup') keep(set(d.s0>MIN+20?MIN:Math.round(maxH()*.45))); };
  grip.addEventListener('pointerup',end); grip.addEventListener('pointercancel',end); }
// the Lab button sits in the middle, just above the card slots, clear of the Spell bar and the cards
function mlabPlace(){ const hud=$('#mlabHud'), hb=$('#hudBottom'); if(!hud||hud.hidden||!hb) return; hud.style.top=Math.max(80,hb.offsetTop-hud.offsetHeight-14)+'px'; }
addEventListener('resize',mlabPlace);
function mlabDefaults(){ Object.assign(MLAB,MLAB_DEF); mlabKeep(); for(const k in MV_DEF){ XLIT[k]=MV_DEF[k]; try{ localStorage.removeItem('hexmancers-xl-'+k); }catch(e){} } renderMlab(); mlabStart(); }

$('#mmMove').onclick=()=>mlabStart();
xFineSliders($('#mlabPanel')); mlabGrip(); xRowTools($('#mlabPanel'),'.mlrow',row=>row.dataset.tip||'');
$('#mlabBtn').onclick=()=>{ const P=$('#mlabPanel'); P.classList.toggle('on'); if(P.classList.contains('on')) renderMlab(); };
$('#mlabHide').onclick=()=>$('#mlabPanel').classList.remove('on');
$('#mlabReset').onclick=()=>{ MLAB_HITS=0; MLAB_SHOTS=0; mlabHud(); };
$('#mlabDefaults').onclick=mlabDefaults;
$('#mlabCopy').onclick=()=>xDbgCopy('mlabCopyNote','mlabCopy');
$('#mlabExit').onclick=mlabExit;
