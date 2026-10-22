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
function mlabSync(){ const on=mlabOn(); $('#mlabHud').hidden=!on; if(!on) $('#mlabPanel').classList.remove('on'); else mlabHud(); }
function mlabHud(){ const s=$('#mlabScore'); if(s) s.textContent='Shots '+MLAB_SHOTS+' · Hits '+MLAB_HITS+(MLAB_SHOTS?' · '+Math.round(100*(1-MLAB_HITS/MLAB_SHOTS))+'% dodged':''); }

// the panel: [key, label, min, max, step, what a change needs] — 'board' rebuilds the battle, 'turret' and 'mv' apply at once
const MLAB_ROWS=[
  ['Board',[['cols','Columns per side',2,12,1,'board'],['rows','Rows',3,15,1,'board']]],
  ['Turrets',[['turrets','Crossbowmen',0,6,1,'board'],['every','Fire every (s)',.2,10,.1,'turret'],['shotSpd','Shot speed (tiles/s)',2,60,1,'turret']]],
  ['Walking',[['mvSpeed','Walk speed',.3,5,.05,'mv'],['mvSnap','Magnet',0,1,.01,'mv'],['mvSnapR','Magnet range (tiles)',0,1.5,.01,'mv'],['mvSnapSpd','Magnet speed',.1,6,.05,'mv'],
    ['mvRest','Finger rest (s)',0,2,.05,'mv'],['mvDrag','Drag reach',.5,6,.05,'mv'],['mvAccel','Speed-up (s)',0,2,.01,'mv']]]];
function renderMlab(){ const f=$('#mlabForm'); f.innerHTML='';
  for(const [head,rows] of MLAB_ROWS){ const h=document.createElement('h4'); h.textContent=head; f.appendChild(h);
    if(head==='Walking'){ const r=document.createElement('div'); r.className='mlrow'; r.innerHTML='<span>Show movement</span><div class="chips"><button class="chip" style="--c:#ff6ad5">'+(XLIT.mvShow?'On':'Off')+'</button></div>';
      const c=r.querySelector('button'); c.classList.toggle('on',!!XLIT.mvShow); c.onclick=()=>{ XLIT.mvShow=!XLIT.mvShow; try{ localStorage.setItem('hexmancers-xl-mvShow',XLIT.mvShow?'1':'0'); }catch(e){} renderMlab(); }; f.appendChild(r); }
    if(head==='Board'){ const r=document.createElement('div'); r.className='mlrow'; r.innerHTML='<span>Shape</span><div class="chips"><button class="chip" data-sq="0" style="--c:#8fe4ff">⬡ Hex</button><button class="chip" data-sq="1" style="--c:#8fe4ff">◻ Square</button></div>';
      r.querySelectorAll('[data-sq]').forEach(b=>{ b.classList.toggle('on',+b.dataset.sq===+MLAB.square); b.onclick=()=>{ MLAB.square=b.dataset.sq==='1'; mlabKeep(); renderMlab(); mlabStart(); }; }); f.appendChild(r); }
    for(const [k,label,mn,mx,st,what] of rows){ const mv=what==='mv', val=mv?XLIT[k]:MLAB[k], dec=st<.1?2:st<1?1:0;
      const r=document.createElement('div'); r.className='mlrow'; r.innerHTML=`<span>${label}</span><input type="range" min="${mn}" max="${mx}" step="any" data-q="${xStepQ(st)}" value="${val}"><b>${(+val).toFixed(dec)}</b>`;
      const inp=r.querySelector('input'), out=r.querySelector('b');
      inp.oninput=()=>{ const v=+inp.value; out.textContent=v.toFixed(dec);
        if(mv){ XLIT[k]=v; try{ localStorage.setItem('hexmancers-xl-'+k,String(v)); }catch(e){} } else { MLAB[k]=v; mlabKeep(); } };
      if(what==='board') inp.onchange=()=>mlabStart();   // the board is rebuilt once you let go of the slider
      f.appendChild(r); } } }
function mlabDefaults(){ Object.assign(MLAB,MLAB_DEF); mlabKeep(); for(const k in MV_DEF){ XLIT[k]=MV_DEF[k]; try{ localStorage.removeItem('hexmancers-xl-'+k); }catch(e){} } renderMlab(); mlabStart(); }

$('#mmMove').onclick=()=>mlabStart();
xFineSliders($('#mlabPanel'));
$('#mlabBtn').onclick=()=>{ const P=$('#mlabPanel'); P.classList.toggle('on'); if(P.classList.contains('on')) renderMlab(); };
$('#mlabHide').onclick=()=>$('#mlabPanel').classList.remove('on');
$('#mlabReset').onclick=()=>{ MLAB_HITS=0; MLAB_SHOTS=0; mlabHud(); };
$('#mlabDefaults').onclick=mlabDefaults;
$('#mlabCopy').onclick=()=>xDbgCopy('mlabCopyNote','mlabCopy');
$('#mlabExit').onclick=mlabExit;
