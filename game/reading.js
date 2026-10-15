/* Hexmancers — reading and outplaying enemies.
   - Attack bar: the outline of the tile under each enemy fills counter-clockwise, like a health bar,
     as its next attack comes; when it is full it flashes twice, then the attack goes. A card that
     lands while it flashes (or while the attack winds up, casts or is marked on the board) is a
     Counter Hit: double damage, a stun, and the attack is cancelled.
   - Perfect Dodge: step off a marked tile (or out of a shot's path) in the last moment before it
     lands: a white flash, a short slow-down, and 15% of the Spell gauge.
   - Tells: each kind of attack marks the board its own way (a rush sweeps chevrons down the row, a
     snipe draws a laser, a quake cracks the ground…).
   - Bestiary: a creature's weakness and resistance show as "?" until you have beaten 3 of its kind
     (1 for a boss, a miniboss or a rare foe). Camp › Bestiary lists everything you have met. */

const FLASH_T=.4, PERFECT_T=.4, BEST_KNOW=3;   // PERFECT_T in real seconds before the hit lands
const TAU2=Math.PI*2;

/* ---------------- the attack bar ---------------- */
// the tile's outline, as screen points, going counter-clockwise from the bottom (front) corner, which the enemy never hides
function barPoints(t){ const hc=hexCorners(t,.9), cx=hc.reduce((a,p)=>a+p[0],0)/6, cy=hc.reduce((a,p)=>a+p[1],0)/6;
  const ang=p=>{ let a=Math.atan2(-(p[1]-cy),p[0]-cx)+Math.PI/2; while(a<0) a+=TAU2; while(a>=TAU2) a-=TAU2; return a; };   // 0 at the bottom, growing counter-clockwise on screen
  return hc.slice().sort((a,b)=>ang(a)-ang(b)); }
function atkBars(ctx,b,T){ if(!b||b.phase!=='fight') return;
  for(const e of b.enemies){ if(e.hp<=0||e.def.minion&&!e.def.mini) continue;
    const pts=barPoints(e.tile), busy=e.windT>0||!!e.casting||b.teles.some(tl=>tl.owner===e&&!tl.friendly), held=e.stunT>0||e.freezeT>0;
    const max=e.atkMax||3, k=busy?1:Math.max(0,Math.min(1,1-e.atkT/max)), flashing=!held&&!busy&&e.atkT<FLASH_T;
    const on=flashing?Math.floor((FLASH_T-e.atkT)/(FLASH_T/4))%2===0:false;
    // the empty track
    ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.lineWidth=Math.max(3,(ctx===View.ctx?View.S:DEC.k)*.13);
    ctx.strokeStyle='rgba(10,12,16,.7)'; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.stroke();
    // the filled part, from the bottom corner round counter-clockwise
    const col=held?'#7fd4ff':on?'#ffffff':busy?'#ff3a4a':k>.75?'#ff5d3a':k>.45?'#ffb03a':'#f2e27a';
    ctx.strokeStyle=col; if(on||busy){ ctx.shadowColor=col; ctx.shadowBlur=10; }
    const segs=pts.map((p,i)=>[p,pts[(i+1)%6]]), len=segs.map(([a,c])=>Math.hypot(c[0]-a[0],c[1]-a[1])), tot=len.reduce((a,b)=>a+b,0); let left=tot*(flashing?1:k);
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=0;i<6&&left>0;i++){ const [a,c]=segs[i], f=Math.min(1,left/len[i]); ctx.lineTo(a[0]+(c[0]-a[0])*f,a[1]+(c[1]-a[1])*f); left-=len[i]; }
    if(!flashing||on) ctx.stroke(); ctx.restore(); } }
// a card that lands while the bar flashes counts as a Counter Hit too
const inCounterWindow=e=>e.atkT>0&&e.atkT<FLASH_T&&!(e.stunT>0)&&!(e.freezeT>0);

/* ---------------- perfect dodge ---------------- */
function readingTick(dt){ const b=B, p=b&&b.player; if(!p) return;
  if(p.lastTile&&p.lastTile!==p.tile){ p.leftTile=p.lastTile; p.leftT=b.time; } p.lastTile=p.tile;
  for(const e of b.enemies) if(e.hp>0) bestiarySeen(e); }
function perfectDodge(t){ const b=B, p=b.player; if(b.phase!=='fight'||p.hp<=0) return; if(b.perfectT&&b.time-b.perfectT<.5) return; b.perfectT=b.time;
  b.gauge=Math.min(GAUGE_MAX,b.gauge+.15*GAUGE_MAX); b.slowMo=Math.max(b.slowMo||0,.18); b.perfects=(b.perfects||0)+1;
  floater('PERFECT!',p.tile,'#ffffff',true); flash(p.tile,'#ffffff',1); ring(p.tile,'#e6f4ff',1.6,.35,6);
  spray(p.tile,14,{shape:'spark',color:['#ffffff','#bfefff'],v0:2,v:5,up0:1,up:4,g:4,drag:2,life:.4,s:3,add:true}); }
// a marked attack lands: did you leave one of its tiles just in time?
function perfectCheck(tl){ const p=B.player; if(tl.friendly||!p.leftTile||tl.tiles.includes(p.tile)) return;
  if(tl.tiles.includes(p.leftTile)&&B.time-p.leftT<=PERFECT_T) perfectDodge(p.leftTile); }
// a shot comes into the tile you just left
function perfectShot(s,t){ const p=B.player; if(s.perfectDone||t!==p.leftTile||B.time-p.leftT>PERFECT_T||t===p.tile) return; s.perfectDone=true; perfectDodge(t); }

/* ---------------- tells: each attack marks the board its own way ---------------- */
const TELL={
  rush:    {c:'255,140,60',  text:'charges down your row: chevrons sweep across it'},
  quake:   {c:'200,150,90',  text:'stamps: cracks run out across the ground'},
  snipe:   {c:'255,40,60',   text:'takes aim: a red laser marks your tile'},
  cleave:  {c:'255,90,90',   text:'raises its blade: an arc sweeps over two rows'},
  hex:     {c:'190,90,230',  text:'chants: a purple sigil spins over your row'},
  iceslam: {c:'120,210,255', text:'slams: frost creeps over the tiles'},
  firebomb:{c:'255,120,40',  text:'throws fire: the tile flickers with flame'},
  bomb:    {c:'255,150,60',  text:'lobs a bomb: a fuse ring counts down'},
  cross:   {c:'255,220,80',  text:'calls lightning in a cross'},
  boulders:{c:'170,160,150', text:'shakes the roof: shadows of falling rocks grow'},
  lunge:   {c:'255,90,70',   text:'lunges at you'},
  steal:   {c:'240,200,90',  text:'reaches for your cards'},
  snare:   {c:'110,220,110', text:'casts a snare: vines curl on your tile'},
  collect: {c:'240,200,90',  text:'grabs at your cards'},
  shot:    {c:'255,80,90',   text:'winds up and shoots down its row'},
  blink:   {c:'170,110,255', text:'blinks to another tile'},
  mend:    {c:'120,255,160', text:'heals its allies'},
};
function teleLook(ctx,t,tl,T){ const k=Math.min(1,tl.t/tl.dur), L=TELL[tl.kind]||{c:'255,50,70'}, late=tl.dur-tl.t<.4, hc=hexCorners(t,.96*k), cen=hexCorners(t,0)[0];
  ctx.save(); ctx.fillStyle='rgba('+L.c+','+(late?.65+.25*Math.sin(T*40):.5)+')'; poly(ctx,hc); ctx.fill();
  const S=ctx===View.ctx?View.S:DEC.k, cx=cen[0], cy=cen[1]; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=Math.max(1.5,S*.04);
  switch(tl.kind){
    case 'rush': { const ph=(T*3)%1; for(let i=0;i<2;i++){ const ox=(i*.5+ph-.5)*S*.7; ctx.beginPath(); ctx.moveTo(cx+ox+S*.12,cy-S*.16); ctx.lineTo(cx+ox-S*.08,cy); ctx.lineTo(cx+ox+S*.12,cy+S*.16); ctx.stroke(); } break; }
    case 'quake': case 'boulders': { ctx.beginPath(); for(let i=0;i<5;i++){ const a=i*1.26+t.q, r=S*.42*k; ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r*.5,cy+Math.sin(a)*r*.35); ctx.lineTo(cx+Math.cos(a+.3)*r,cy+Math.sin(a+.3)*r*.7); } ctx.stroke();
      if(tl.kind==='boulders'){ ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(cx,cy,S*.36*k,S*.24*k,0,0,TAU2); ctx.fill(); } break; }
    case 'snipe': { const o=tl.owner&&tl.owner.tile; if(o){ const a=hexCorners(o,0)[0]; ctx.strokeStyle=late?'rgba(255,40,60,.95)':'rgba(255,40,60,'+(.25+.25*Math.sin(T*30))+')'; ctx.lineWidth=late?Math.max(2,S*.05):1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(cx,cy); ctx.stroke(); }
      ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,S*.22,0,TAU2); ctx.moveTo(cx-S*.3,cy); ctx.lineTo(cx+S*.3,cy); ctx.moveTo(cx,cy-S*.2); ctx.lineTo(cx,cy+S*.2); ctx.stroke(); break; }
    case 'cleave': { ctx.beginPath(); ctx.arc(cx,cy,S*.34,-Math.PI*.8,-Math.PI*.8+Math.PI*1.6*k); ctx.stroke(); break; }
    case 'hex': { ctx.translate(cx,cy); ctx.rotate(T*3); ctx.strokeStyle='rgba(230,180,255,.9)'; ctx.beginPath(); for(let i=0;i<5;i++){ const a=i*TAU2*2/5; ctx[i?'lineTo':'moveTo'](Math.cos(a)*S*.28,Math.sin(a)*S*.2); } ctx.closePath(); ctx.stroke(); break; }
    case 'iceslam': { ctx.strokeStyle='rgba(230,250,255,.9)'; ctx.beginPath(); for(let i=0;i<3;i++){ const a=i*Math.PI/3; ctx.moveTo(cx-Math.cos(a)*S*.26*k,cy-Math.sin(a)*S*.18*k); ctx.lineTo(cx+Math.cos(a)*S*.26*k,cy+Math.sin(a)*S*.18*k); } ctx.stroke(); break; }
    case 'firebomb': case 'bomb': { ctx.strokeStyle='rgba(255,240,200,.9)'; ctx.beginPath(); ctx.arc(cx,cy,S*.3,-Math.PI/2,-Math.PI/2+TAU2*(1-k)); ctx.stroke(); break; }
    case 'cross': { ctx.strokeStyle='rgba(255,250,200,.9)'; ctx.beginPath(); ctx.moveTo(cx-S*.2,cy); ctx.lineTo(cx+S*.2,cy); ctx.moveTo(cx,cy-S*.14); ctx.lineTo(cx,cy+S*.14); ctx.stroke(); break; }
    case 'snare': { ctx.strokeStyle='rgba(180,255,160,.9)'; ctx.beginPath(); for(let i=0;i<3;i++) ctx.arc(cx,cy,S*(.1+i*.08)*k,i,i+4); ctx.stroke(); break; }
  }
  ctx.restore(); }

/* ---------------- the bestiary ---------------- */
const bState=()=>{ save.bestiary=save.bestiary||{}; return save.bestiary; };
const bKey=e=>e.id||'';
function bestiarySeen(e){ if(e.bSeen) return; e.bSeen=true; const S=bState(), k=bKey(e); if(!k) return; if(!S[k]){ S[k]={seen:0,kills:0}; } S[k].seen++; }
function bestiaryKill(e){ const S=bState(), k=bKey(e); if(!k) return; const E=S[k]||(S[k]={seen:1,kills:0}); const was=bKnown(e); E.kills++;
  if(!was&&bKnown(e)&&B) later(.6,()=>{ floater('Learned: '+e.def.name.replace(/^★ /,'')+' weakness!',e.tile,'#ffe24d',true); }); }
const bNeed=d=>d.boss||d.mini||d.rare?1:BEST_KNOW;
function bKnown(e){ const d=e.def||ENEMY_DEFS[e.id]||{}; const E=bState()[bKey(e)]; return !!E&&E.kills>=bNeed(d); }
function openBestiary(){ renderBestiary(); show('scrBestiary'); }
function renderBestiary(){ const S=bState(), box=$('#bestList'); if(!box) return; const ids=Object.keys(S).filter(id=>ENEMY_DEFS[id]);
  $('#bestCount').textContent=ids.filter(id=>S[id].kills>=bNeed(ENEMY_DEFS[id])).length+' / '+ids.length+' known';
  box.innerHTML=ids.length?'':'<p class="hint">Nothing met yet. Every creature you fight is written down here.</p>';
  ids.sort((a,b)=>(ENEMY_DEFS[a].boss?1:0)-(ENEMY_DEFS[b].boss?1:0)||ENEMY_DEFS[a].name.localeCompare(ENEMY_DEFS[b].name));
  for(const id of ids){ const d=ENEMY_DEFS[id], E=S[id], known=E.kills>=bNeed(d), col=COLORS[d.color]||{c:'#ccc',icon:'',name:d.color};
    const weak=d.weak||WEAK_TO[d.color], moves=[...new Set(d.moves||[])].map(m=>TELL[m]?'<li>'+esc(TELL[m].text)+'</li>':'').join('');
    const el=document.createElement('div'); el.className='bentry'+(known?' known':''); el.style.setProperty('--bc',col.c);
    el.innerHTML=`<div class="bhead"><b>${esc(d.name)}</b><span class="bk">${E.kills} beaten</span></div>`
      +`<div class="bline">${col.icon||''} ${esc(col.name||'')}${d.boss?' · boss':d.mini?' · miniboss':d.rare?' · rare':''}</div>`
      +(known?`<div class="bline">Weak to <b>${COLORS[weak]?COLORS[weak].icon+' '+COLORS[weak].name:'?'}</b>${SIX.includes(d.color)?' · resists <b>'+col.icon+' '+col.name+'</b>':''}. Elemental kin follow the colour wheel.</div>`
             :`<div class="bline dim">Weakness unknown: beat ${bNeed(d)-E.kills} more to learn it.</div>`)
      +(moves?`<ul class="btells">${moves}</ul>`:'');
    box.appendChild(el); } }
(function(){ const b=document.getElementById('goBestiary'); if(b) b.onclick=()=>openBestiary(); })();
