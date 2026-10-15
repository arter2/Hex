/* Hexmancers — each area plays differently. Every area has one signature rule on its battle board,
   announced when the fight starts and shown on the camp screen:
     hollows  Glowing crystals grow on your side. Stand on one for a moment and your next card hits 50% harder.
     deeps    The enemy side is iced over: a pushed or pulled enemy slides until it hits something (and slams).
     vault    Lightning marks a tile every few seconds, then strikes whoever stands on it, you or them.
     rifts    Lava creeps in from the edges of both sides as the fight goes on.
     ruins    Gold tiles on the enemy side: an enemy that falls on one drops extra gold.
     abyss    Void tiles flicker out and back. Whoever stands on one when it vanishes falls and is hurt.
   B.ar = {id, ...state}. Hooks called from battle.js / enemies.js: arRuleInit, arRuleTick, arRuleKill,
   arRuleCard (a card's power factor), arRuleShove, arRuleFill (a tile's colour). */

const AREA_RULES={
  hollows:{name:'Glow crystals', icon:'💎', text:'Stand on a glowing crystal to charge your next card (+50%).'},
  deeps:  {name:'Black ice',     icon:'❄️', text:'Pushed or pulled enemies slide across the ice until they hit something.'},
  vault:  {name:'Storm strikes', icon:'⚡', text:'Lightning marks a tile, then strikes whoever stands on it. Move off, or lure them on.'},
  rifts:  {name:'Rising lava',   icon:'🌋', text:'Lava creeps in from the edges of both sides as the fight goes on.'},
  ruins:  {name:'Gilded floor',  icon:'🪙', text:'An enemy that falls on a gold tile drops extra gold.'},
  abyss:  {name:'Void tiles',    icon:'🕳', text:'Flickering void tiles vanish for a moment. Whoever stands on one falls and is hurt.'},
};
const arOn=id=>!!(B&&B.ar&&B.ar.id===id);
const arFree=(list,also)=>list.filter(t=>!t.occ&&!t.terrain&&!(t.holeT>0)&&!t.crystal&&!t.gild&&!t.voidTile&&(!also||also(t)));

function arRuleInit(depth){ const A=typeof areaOf==='function'?areaOf(depth):null; if(!A||!AREA_RULES[A.id]) { B.ar=null; return; }
  const ar=B.ar={id:A.id, t:0, intro:false, next:0}, edge=t=>t.col!==1||t.r!==(BOARD_ROWS>>1);
  if(ar.id==='hollows'){ for(let i=0;i<2;i++) arCrystal(); }
  if(ar.id==='deeps'){ for(let i=0;i<3;i++){ const t=pick(arFree(E_TILES)); if(t) t.terrain='ice'; } }
  if(ar.id==='vault') ar.next=5;
  if(ar.id==='rifts'){ ar.next=8; ar.n={p:0,e:0}; }
  if(ar.id==='ruins'){ const ts=arFree(E_TILES).sort(()=>Math.random()-.5).slice(0,4); ts.forEach(t=>t.gild=true); B.bonusGold=0; }
  if(ar.id==='abyss'){ const ps=arFree(P_TILES,edge).sort(()=>Math.random()-.5).slice(0,3), es=arFree(E_TILES).sort(()=>Math.random()-.5).slice(0,3);
    [...ps,...es].forEach((t,i)=>{ t.voidTile={ph:'solid', t:3+i*1.3}; }); } }

// a crystal grows on a free tile on your side
function arCrystal(){ const p=B.player, t=pick(arFree(P_TILES,x=>x!==p.tile&&hexDist(x,p.tile)>=1)); if(t){ t.crystal=true; burst(t,'#7dffa8',10,.6); } }

function arRuleTick(dt){ const ar=B&&B.ar; if(!ar||B.phase!=='fight') return; ar.t+=dt;
  if(!ar.intro){ ar.intro=true; const R=AREA_RULES[ar.id]; if(typeof banner==='function') banner(R.icon+' '+R.name,'#e6f4ff'); if(typeof tip==='function') tip(R.icon+' '+R.name+': '+R.text,5000); }
  const p=B.player;
  if(ar.id==='hollows'){ const t=p.tile;
    if(t.crystal){ p.onCrystal=(p.onCrystal||0)+dt; if(p.onCrystal>=.6&&!p.crystalCharge){ p.crystalCharge=true; t.crystal=false; p.onCrystal=0; floater('Charged! 💎',t,'#7dffa8',true);
        ring(t,'#7dffa8',1.4,.4,6); spray(t,18,{shape:'glow',color:['#7dffa8','#e6fff0'],v0:1,v:3,up0:1,up:4,g:-1,drag:2,life:.7,s:6,add:true,shrink:1}); later(7,arCrystal); } }
    else p.onCrystal=0; }
  if(ar.id==='vault'){ ar.next-=dt;
    if(ar.next<=0&&!ar.mark){ ar.next=rnd(5,7.5); const occ=TILES.filter(t=>t.occ&&(t.occ.kind==='player'||(t.occ.kind==='enemy'&&t.occ.hp>0))), t=Math.random()<.6&&occ.length?pick(occ):pick(TILES.filter(t=>t.side!=='n'));
      if(t){ ar.mark={t, left:1.6}; t.boltT=1.6; } }
    if(ar.mark){ const m=ar.mark; m.left-=dt; m.t.boltT=Math.max(0,m.left);
      if(m.left<=0){ const t=m.t, o=t.occ, d=10+2*B.depth; ar.mark=null; t.boltT=0;
        B.fx.push({kind:'bolt',a:t,b:t,y0:9,color:'#fff6a8',t:0,life:.35}); flash(t,'#ffffff',1); shake(5); t.zapT=Math.max(t.zapT||0,2);
        spray(t,22,{shape:'spark',color:['#ffffff','#ffe24d','#fff6a8'],v0:3,v:9,up0:1,up:6,g:0,drag:4,life:.4,s:3,add:true});
        if(o&&o.kind==='player') hitPlayer(d);
        else if(o&&o.kind==='enemy'&&o.hp>0){ hitEnemy(o,Math.round(d*1.6),null,{raw:true}); if(o.hp>0) o.stunT=Math.max(o.stunT,.8); } } } }
  if(ar.id==='rifts'){ ar.next-=dt;
    if(ar.next<=0){ ar.next=rnd(7,9); for(const side of ['p','e']){ if(ar.n[side]>=5) continue;
        const L=side==='p'?P_TILES:E_TILES, rim=t=>Math.min(side==='p'?t.col:BOARD_COLS-1-t.col,t.r,BOARD_ROWS-1-t.r);
        const ts=arFree(L,t=>!t.lavaWarn&&!(side==='p'&&t===p.tile)).sort((a,b)=>rim(a)-rim(b)||Math.random()-.5), t=ts[0];
        if(t){ ar.n[side]++; t.lavaWarn=1.5; } } }
    for(const t of TILES) if(t.lavaWarn>0){ t.lavaWarn-=dt; if(t.lavaWarn<=0){ t.lavaWarn=0; if(!t.terrain){ t.terrain='lava'; burst(t,'#ff6a3d',16,.6); } } } }
  if(ar.id==='abyss'){ for(const t of TILES){ const v=t.voidTile; if(!v) continue; v.t-=dt;
      if(v.ph==='gone'&&t.occ) arFall(t);   // stepped onto the open void
      if(v.t>0) continue;
      if(v.ph==='solid'){ v.ph='warn'; v.t=1.2; }
      else if(v.ph==='warn'){ v.ph='gone'; v.t=1.8; t.holeT=1.8; t.voidHole=true; arFall(t); }
      else { v.ph='solid'; v.t=rnd(4,6.5); t.holeT=0; t.voidHole=false; } } } }

// whoever stands on a vanishing void tile falls: hurt, and back up on the nearest free tile of their side
function arFall(t){ const o=t.occ; if(!o) return; burst(t,'#9b4dff',18,.6);
  const to=(t.side==='p'?P_TILES:E_TILES).filter(x=>!x.occ&&!(x.holeT>0)&&x!==t).sort((a,b)=>hexDist(a,t)-hexDist(b,t))[0];
  if(o.kind==='player'){ floater('fell!',t,'#c49bff',true); hitPlayer(Math.round(o.maxHp*.12)); if(to){ t.occ=null; o.tile=to; to.occ=o; o.path=[]; } }
  else if(o.kind==='enemy'&&o.hp>0){ floater('fell!',t,'#c49bff',true); hitEnemy(o,Math.round(o.maxHp*(o.def.boss?.06:.25)),null,{raw:true}); if(o.hp>0&&to){ t.occ=null; o.tile=to; to.occ=o; } else if(t.occ===o) t.occ=null; } }

// a card's power factor (a charged crystal); used once
function arRuleCard(inst){ const p=B&&B.player; if(!p||!p.crystalCharge||!inst||!inst.card||inst.card.id==='wand') return 1;
  p.crystalCharge=false; floater('💎 +50%',p.tile,'#7dffa8',true); return 1.5; }

// Black ice: a shoved enemy keeps sliding; returns true when it handled the shove
function arRuleShove(e,c,base){ if(!arOn('deeps')||e.hp<=0) return false; const dc=c.push?1:-1; let n=0;
  for(;;){ const to=tileCR(e.tile.col+dc,e.tile.r); if(!to||to.side!=='e'||to.occ||to.holeT>0) break;
    e.tile.occ=null; e.tile=to; to.occ=e; n++; if(to.trap){ springTrap(to,e); if(e.hp<=0) return true; } }
  if(n) { burst(e.tile,'#e6f4ff',10,.4); floater(n>1?'slides '+n+'!':'slides',e.tile,'#bfeaff'); }
  if(c.push||n>1){ const blk=tileCR(e.tile.col+dc,e.tile.r); if(!blk||blk.side!=='e'||blk.occ){ floater('slam!',e.tile,'#ffe24d'); hitEnemy(e,Math.round(base*(.4+.15*n)),null,{raw:true}); } }
  return true; }

// an enemy falls: on a gold tile it drops gold
function arRuleKill(e){ if(!arOn('ruins')||!e.tile||!e.tile.gild) return; const g=10+3*B.depth; B.bonusGold=(B.bonusGold||0)+g;
  floater('+'+g+' gold',e.tile,'#f2c94c',true); spray(e.tile,16,{shape:'glow',color:['#f2c94c','#fff3b0'],v0:2,v:5,up0:2,up:6,g:6,drag:1,life:.8,s:4,add:true}); }

// a tile's colour under the area rule (over its usual fill)
function arRuleFill(t,fill,T){
  if(t.crystal) return mixHex(fill,'#9dffc0',.5+.2*Math.sin(T*4+t.q));
  if(t.gild) return mixHex(fill,'#f2c94c',.38+.08*Math.sin(T*2+t.r));
  if(t.boltT>0) return mixHex(fill,'#fff6a8',.3+.45*Math.max(0,Math.sin(T*(14+12*(1-t.boltT/1.6)))));
  if(t.lavaWarn>0) return mixHex(fill,'#ff5a1f',.25+.3*Math.max(0,Math.sin(T*16)));
  if(t.voidTile&&t.voidTile.ph==='warn') return mixHex(fill,'#9b4dff',.3+.4*Math.max(0,Math.sin(T*20)));
  if(t.voidTile&&t.voidTile.ph==='solid') return mixHex(fill,'#5a2a8a',.22);
  return fill; }

// the camp's line: what the area's board does
const areaRuleHTML=A=>{ const R=AREA_RULES[A.id]; return R?`<span class="arule">${R.icon} <b>${R.name}:</b> ${R.text}</span>`:''; };
