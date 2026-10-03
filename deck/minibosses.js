/* Hexmancers — minibosses and trials, the battle side. (Their ids must not reuse an ordinary
   enemy's: the Grove Warden is 'warden' and the Hex Knight 'knight'.) The dungeon (dungeon.js) decides where a
   miniboss walks and when it appears; this file is how each one fights. A miniboss is a big
   threat but not a floor boss: one signature attack pattern, an escort or a trick, and an
   enrage at half health (it attacks a quarter faster). Their sprites are the hand-drawn enemy
   sprites recoloured and scaled up (the Giant Mimic gets its own), so they sit in the same art.

   Trials are fights with a rule, started at a trial altar in the dungeon:
   - order: break the enemies in the order of their numerals; a wrong kill heals the rest.
   - survive: hold out until the timer runs out while more enemies keep coming.
   - switches: step on the three glowing tiles on your side while enemies keep coming.
   B.rule.ok says whether the rule was kept; the dungeon pays out only then. */

const MINI_DEFS={
  executioner:  {name:'Executioner',     color:'fire',    hp:480, dmg:24, rate:[2.8,3.6], moves:['cleave','cleave','shot'], ai:'align', mini:true, look:'cultist', tint:'#5a0a10', scale:1.4,
                 info:'Its axe falls across your whole row. Step out of the line before it lands.'},
  corruptknight:{name:'Corrupted Knight', color:'shadow',  hp:450, dmg:20, rate:[2.4,3.2],     moves:['lunge','guard','shot'],   ai:'align', mini:true, look:'paladin', tint:'#3a1050', scale:1.35,
                 info:'Lunges to the front and strikes the tiles nearest the middle; raises its guard to soak hits.'},
  giant_mimic:  {name:'Giant Mimic',      color:'light',   hp:520, dmg:21, rate:[2.6,3.4], moves:['chomp','coins','shot'],   ai:'still', mini:true, look:'mimic', scale:1.6,
                 info:'Bites the tile you stand on and the ones in front; spits coins across your side.'},
  dungeonwarden:{name:'Dungeon Warden',   color:'frost',   hp:560, dmg:18, rate:[2.6,3.4], moves:['chains','call','shot'],   ai:'wander', mini:true, look:'knight', tint:'#5a6470', scale:1.45,
                 info:'Its chains root you in place, and it calls jailers to help.'},
  alchemist:    {name:'Plague Alchemist', color:'verdant', hp:400, dmg:15, rate:[2.2,3], moves:['flask','flask','shot'],   ai:'back',  mini:true, look:'caller', tint:'#2f6a10', scale:1.3,
                 info:'Its flasks leave toxic puddles that burn while you stand in them.'},
  assassin:     {name:'Shadow Assassin',  color:'shadow',  hp:340, dmg:22, rate:[2.2,2.8], moves:['backstab','shot'],        ai:'wander', mini:true, look:'clone', tint:'#1a0a26', scale:1.25,
                 info:'Vanishes, then strikes your tile and the one behind you. Keep moving.'},
  construct:    {name:'Arcane Construct', color:'storm',   hp:600, dmg:20, rate:[2.8,3.6], moves:['beam','quake','shot'],    ai:'still', mini:true, look:'golem', tint:'#3a2a9a', scale:1.25,
                 info:'Its beam sweeps two rows; its pulse shakes every tile but a few.'},
  bonecollector:{name:'Bone Collector',   color:'frost',   hp:470, dmg:16, rate:[2.4,3.2],     moves:['bones','raise','shot'],   ai:'back',  mini:true, look:'witch', tint:'#d8d0b8', scale:1.35,
                 info:'Rains bones on your side and raises Bonewalkers from the floor.'},
  // the small mimic a trapped chest turns out to be, and the minions the minibosses bring
  mimic:        {name:'Mimic',            color:'light',   hp:150, dmg:13, rate:[3,4],     moves:['chomp','shot'],           ai:'still', look:'mimic', scale:1},
  bonewalker:   {name:'Bonewalker',       color:'frost',   hp:55,  dmg:9,  rate:[2.8,3.6], moves:['shot'],                   ai:'align', minion:true, look:'clone', tint:'#e8e0c8'},
  jailer:       {name:'Jailer',           color:'frost',   hp:70,  dmg:10, rate:[3,4],     moves:['shot'],                   ai:'align', minion:true, look:'knight', tint:'#5a6470'},
};
// an id already taken by an ordinary enemy would turn every such enemy into a miniboss: refuse it loudly
for(const k in MINI_DEFS){ if(ENEMY_DEFS[k]){ console.error('minibosses.js: enemy id "'+k+'" is already taken'); delete MINI_DEFS[k]; } }
Object.assign(ENEMY_DEFS,MINI_DEFS);
const MINIBOSS_IDS=['executioner','corruptknight','giant_mimic','dungeonwarden','alchemist','assassin','construct','bonecollector'];
// a miniboss never fights alone: one monster of its colour escorts it, two from depth 6
function miniWave(id,depth){ const col=ENEMY_DEFS[id].color, own=MONSTERS.filter(m=>ENEMY_DEFS[m].color===col), pool=own.length?own:MONSTERS;
  return [id].concat(Array.from({length:depth>=6?2:1},()=>pick(pool))); }

Object.assign(MOVES,{
  // Executioner: the whole row (two rows once enraged), slow and heavy
  cleave(e){ const p=B.player, rows=[p.tile.r]; if(e.enraged){ const r2=p.tile.r+(Math.random()<.5?-1:1); if(r2>=0&&r2<BOARD_ROWS) rows.push(r2); }
    tele(e,P_TILES.filter(t=>rows.includes(t.r)),1.15,Math.round(e.dmg*1.3)); },
  // Corrupted Knight: steps into your row at the front, then strikes the tiles nearest the middle
  lunge(e){ const p=B.player, to=pick(E_TILES.filter(t=>!t.occ&&!burning(t)&&t.r===p.tile.r&&t.col<=BOARD_COLS/2+1));
    if(to){ burst(e.tile,'#c0a0ff',10); stepEnemy(e,to); burst(to,'#c0a0ff',10); }
    tele(e,P_TILES.filter(t=>t.r===p.tile.r&&t.col>=P_COLS()-3),.85,e.dmg); },
  guard(e){ e.barrier=Math.max(e.barrier,Math.round(40*e.ds)); e.shieldTurns=Math.max(e.shieldTurns||0,1); floater('🛡 Guard',e.tile,'#fff0b3'); burst(e.tile,'#fff0b3',10,1); },
  // Mimics: a bite on your tile and the tiles in front of you; coins rain on your side
  chomp(e){ const t=B.player.tile, ts=[t,...neighbors(t).filter(x=>x.side==='p'&&x.col>t.col)]; tele(e,ts,1,Math.round(e.dmg*1.4)); },
  coins(e){ const ts=P_TILES.filter(t=>!t.occ||t.occ.kind==='player').sort(()=>Math.random()-.5).slice(0,e.enraged?5:3);
    tele(e,ts,1.2,Math.round(e.dmg*.7),()=>ts.forEach(t=>burst(t,'#f2c94c',8,.4))); },
  // Dungeon Warden: chains root you; it calls up to two jailers
  chains(e){ const t=B.player.tile; tele(e,[t],1,Math.round(e.dmg*.6),()=>{ if(B.player.tile===t){ B.player.rootT=2; floater('Chained!',t,'#cfd8e6',true); } }); },
  call(e){ if(helpers(e,'jailer').length>=2) return MOVES.chains(e); summon(e,'jailer',1); floater('Jailers!',e.tile,'#cfd8e6',true); },
  // Plague Alchemist: flasks leave toxic puddles (see extraTick)
  flask(e){ const t=B.player.tile, n=pick(neighbors(t).filter(x=>x.side==='p')), ts=[t,n].filter(Boolean);
    tele(e,ts,1,Math.round(e.dmg*.6),()=>ts.forEach(x=>{ x.toxT=7; burst(x,'#8fd14f',12,.3); })); },
  // Shadow Assassin: gone for a moment, then at the front of your row, striking your tile and the one behind it
  backstab(e){ leave(e); later(.9,()=>{ if(!B||e.hp<=0) return; const p=B.player;
      come(e,pick(E_TILES.filter(t=>!t.occ&&!burning(t)&&t.r===p.tile.r&&t.col<=BOARD_COLS/2+1)));
      const behind=P_TILES.find(t=>t.r===p.tile.r&&t.col===p.tile.col-1);
      tele(e,[p.tile,behind].filter(Boolean),.6,Math.round(e.dmg*1.4)); }); },
  // Arcane Construct: a beam down your row and the next
  beam(e){ const p=B.player, r2=Math.min(BOARD_ROWS-1,Math.max(0,p.tile.r+(p.tile.r>=BOARD_ROWS-1||Math.random()<.5?-1:1)));
    tele(e,P_TILES.filter(t=>t.r===p.tile.r||t.r===r2),1.5,e.dmg); },
  // Bone Collector: bones on four or five tiles; it raises Bonewalkers
  bones(e){ const ts=P_TILES.slice().sort(()=>Math.random()-.5).slice(0,e.enraged?5:4); tele(e,ts,1.1,Math.round(e.dmg*.8)); },
  raise(e){ if(helpers(e,'bonewalker').length>=2) return MOVES.bones(e); summon(e,'bonewalker',e.enraged?2:1); floater('Rise!',e.tile,'#e8e0c8',true); },
});
Object.assign(INTENT_ICON,{cleave:'⚔',lunge:'➤',guard:'🛡',chomp:'◎',coins:'●',chains:'⛓',call:'!',flask:'⚗',backstab:'☾',beam:'≡',bones:'✦',raise:'☠'});

// called every frame for a miniboss: it announces itself once and enrages at half health
function miniTick(e){
  if(!e.miniSeen){ e.miniSeen=1; B.hooks.onBoss&&B.hooks.onBoss(e.name,COLORS[e.color].c,e.def.info);
    if(e.id==='dungeonwarden') summon(e,'jailer',1); if(e.id==='bonecollector') summon(e,'bonewalker',1); }
  if(!e.enraged&&e.hp<=e.maxHp*.5){ e.enraged=true; e.def=Object.assign({},e.def,{rate:[e.def.rate[0]*.75,e.def.rate[1]*.75]});
    cancelAttack(e); shake(6); burst(e.tile,COLORS[e.color].c,30,1); B.hooks.onBoss&&B.hooks.onBoss(e.name+' is enraged!','#ff5d6c'); }
  return false;
}

/* ---------------- trials ---------------- */
function ruleSetup(r){
  r.ok=false; r.t=0; r.spawnT=6;
  if(r.kind==='order'){ alive().forEach((e,i)=>e.order=i+1); r.next=1; r.ok=true; r.text='Break them in order: I first'; }
  if(r.kind==='survive'){ r.dur=r.dur||40; r.text='Survive '+r.dur+' seconds'; }
  if(r.kind==='switches'){ const pool=P_TILES.filter(t=>!t.occ).sort(()=>Math.random()-.5), out=[];
    for(const t of pool){ if(out.length>=3) break; if(out.every(o=>Math.abs(o.r-t.r)+Math.abs(o.col-t.col)>=3)) out.push(t); }
    r.tiles=out; r.lit=new Set(); r.text='Step on the three glowing tiles'; }
  later(.6,()=>B&&B.hooks.onBoss&&B.hooks.onBoss('Trial · '+r.text,'#f2c94c'));
}
// enemies that keep coming in the survive and switches trials
function ruleSpawn(){ const free=E_TILES.filter(t=>!t.occ&&!burning(t)&&t.col>=BOARD_COLS/2+1); if(!free.length) return;
  const t=pick(free), e=makeEnemy(pick(MONSTERS),t,B.depth); e.atkT+=1; B.enemies.push(e); burst(t,COLORS[e.color].c,16); }
// the trial is kept: whatever is left on the board vanishes and the fight is won
function ruleWin(){ const r=B.rule; r.ok=true; B.wave=B.waves.length-1;
  for(const e of alive()){ e.hp=0; e.deathT=.5; if(e.tile.occ===e) e.tile.occ=null; burst(e.tile,'#f2c94c',20,1); }
  B.phase='win'; B.player.charging=false; B.hooks.onBoss&&B.hooks.onBoss('Trial passed!','#39ff8a'); later(1.2,()=>B.hooks.onEnd&&B.hooks.onEnd(true)); }

// every frame of a fight: toxic puddles, then the trial's rule
function extraTick(dt){
  const p=B.player;
  for(const t of TILES) if(t.toxT>0) t.toxT-=dt;
  if(p.tile.toxT>0&&p.invT<=0){ p.toxAcc=(p.toxAcc||0)+dt; if(p.toxAcc>=.5){ p.toxAcc=0; hitPlayer(2+Math.round(B.depth*.2)); } } else p.toxAcc=0;
  const r=B.rule; if(!r||B.phase!=='fight') return;
  r.t+=dt;
  if(r.kind==='survive'){ r.spawnT-=dt; if(r.spawnT<=0&&alive().length<4){ r.spawnT=6; ruleSpawn(); } if(r.t>=r.dur) ruleWin(); }
  if(r.kind==='switches'){ r.spawnT-=dt; if(r.spawnT<=0&&alive().length<4){ r.spawnT=8; ruleSpawn(); }
    if(r.tiles.includes(p.tile)&&!r.lit.has(p.tile)){ r.lit.add(p.tile); burst(p.tile,'#f2c94c',18,.4); floater(r.lit.size+' / 3',p.tile,'#f2c94c',true); if(r.lit.size>=3) ruleWin(); } }
}
// an enemy falls: in the order trial a wrong one heals the rest; the endless trials never run dry
function extraKill(e){
  const r=B.rule; if(!r) return;
  if(r.kind==='order'&&e.order){ if(e.order===r.next) r.next++;
    else if(r.ok){ r.ok=false; for(const x of alive()){ x.hp=Math.min(x.maxHp,x.hp+Math.round(x.maxHp*.35)); burst(x.tile,'#ff5d6c',12,1); }
      B.hooks.onBoss&&B.hooks.onBoss('Wrong order! The trial is broken','#ff5d6c'); } }
  if((r.kind==='survive'||r.kind==='switches')&&!r.ok&&B.phase==='fight'&&!alive().length) ruleSpawn();
}
// drawn over the board: toxic puddles, the switch tiles, the order numerals and the trial's timer
function extraDraw(ctx,T){
  const b=B; if(!b) return;
  for(const t of TILES) if(t.toxT>0){ const [x,y]=proj(t.wx,.02,t.wz), S=scaleAt(t.wx,t.wz); ctx.fillStyle='rgba(143,209,79,'+(.25+.1*Math.sin(T*5+t.q))+')';
    ctx.beginPath(); ctx.ellipse(x,y,S*.5,S*.5*View.iy,0,0,TAU); ctx.fill(); }
  const r=b.rule; if(!r) return;
  ctx.textAlign='center';
  if(r.kind==='switches') for(const t of r.tiles){ const [x,y]=proj(t.wx,.03,t.wz), S=scaleAt(t.wx,t.wz), on=r.lit.has(t);
    ctx.strokeStyle=on?'#39ff8a':'#f2c94c'; ctx.lineWidth=3; ctx.globalAlpha=on?.9:.55+.35*Math.sin(T*5);
    ctx.beginPath(); ctx.ellipse(x,y,S*.45,S*.45*View.iy,0,0,TAU); ctx.stroke(); ctx.globalAlpha=1; }
  if(r.kind==='order') for(const e of alive()) if(e.order){ const [wx,wz]=posOf(e), [x,y]=proj(wx,0,wz), S=scaleAt(wx,wz);
    ctx.font='800 '+Math.round(S*.5)+'px "Pixelify Sans",system-ui,sans-serif'; ctx.fillStyle=e.order===r.next&&r.ok?'#f2c94c':'#ffffff';
    ctx.strokeStyle='#000'; ctx.lineWidth=3; const txt=['','I','II','III','IV','V','VI'][e.order]||e.order; ctx.strokeText(txt,x,y+S*.45); ctx.fillText(txt,x,y+S*.45); }
  ctx.font='700 16px "Pixelify Sans",system-ui,sans-serif'; ctx.fillStyle='#f2c94c'; ctx.strokeStyle='#000'; ctx.lineWidth=3;
  const line=r.kind==='survive'?'Trial · survive '+Math.max(0,Math.ceil(r.dur-r.t))+'s':r.kind==='switches'?'Trial · tiles '+r.lit.size+' / 3':'Trial · order '+(r.ok?'kept':'broken');
  ctx.strokeText(line,View.w/2,View.h-12); ctx.fillText(line,View.w/2,View.h-12);
}

/* ---------------- sprites ----------------
   A miniboss is drawn from a hand-drawn enemy sprite washed in its own colour; the Giant Mimic
   and the small mimic are a chest with a mouth, drawn here at the same size and scale. */
const MINI_SPR={};
function mimicSprite(){
  const G=48, c=document.createElement('canvas'); c.width=c.height=G; const x=c.getContext('2d');
  const r=(x0,y0,w,h,col)=>{ x.fillStyle=col; x.fillRect(x0,y0,w,h); };
  r(8,30,32,16,'#6e4220'); for(const y of [34,38,42]) r(9,y,30,1,'#4e2e16');            // the box, planked
  r(14,30,3,16,'#c89a2a'); r(31,30,3,16,'#c89a2a'); r(8,30,32,2,'#f2c94c');               // gold bands and rim
  r(10,18,28,12,'#3a0610'); r(12,20,24,9,'#5a0a18');                                      // the open mouth
  x.fillStyle='#f4efe0'; for(let i=0;i<7;i++){ x.beginPath(); x.moveTo(10+i*4,30); x.lineTo(12+i*4,25); x.lineTo(14+i*4,30); x.fill(); x.beginPath(); x.moveTo(10+i*4,18); x.lineTo(12+i*4,23); x.lineTo(14+i*4,18); x.fill(); }
  x.fillStyle='#7a4a22'; x.beginPath(); x.moveTo(7,18); x.lineTo(41,18); x.lineTo(43,6); x.lineTo(9,4); x.fill();   // the lid, thrown back
  r(9,16,32,2,'#f2c94c'); r(15,5,3,13,'#c89a2a'); r(31,6,3,12,'#c89a2a');
  r(16,11,4,3,'#fff39a'); r(28,11,4,3,'#fff39a'); r(17,12,2,1,'#140a1a'); r(29,12,2,1,'#140a1a');   // eyes under the lid
  r(21,27,6,3,'#e0587a'); r(23,30,5,6,'#e0587a'); r(25,35,4,3,'#c03a5a');                     // the tongue
  r(10,46,4,1,'#2a1608'); r(34,46,4,1,'#2a1608');
  // a black outline, then scale up 2x to the 96 px of the hand-drawn sprites
  const im=x.getImageData(0,0,G,G), d=im.data, out=new Uint8ClampedArray(d);
  for(let j=0;j<G;j++) for(let i=0;i<G;i++){ const o=(j*G+i)*4; if(d[o+3]) continue;
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{ const X=i+a, Y=j+b; return X>=0&&Y>=0&&X<G&&Y<G&&d[(Y*G+X)*4+3]; })){ out[o]=out[o+1]=out[o+2]=8; out[o+3]=255; } }
  x.putImageData(new ImageData(out,G,G),0,0);
  const mk=()=>{ const k=document.createElement('canvas'); k.width=k.height=96; const kx=k.getContext('2d'); kx.imageSmoothingEnabled=false; return [k,kx]; };
  const [img,ix]=mk(); ix.drawImage(c,0,-1,96,96);
  const [sil,sx]=mk(), [wht,wx]=mk();
  for(const [k,kx,col] of [[sil,sx,'#000'],[wht,wx,'#fff']]){ kx.drawImage(img,0,0); kx.globalCompositeOperation='source-in'; kx.fillStyle=col; kx.fillRect(0,0,96,96); }
  return {img,sil,wht,hand:true};
}
function miniSprite(id){
  if(MINI_SPR[id]) return MINI_SPR[id];
  const d=ENEMY_DEFS[id]; if(d.look==='mimic') return MINI_SPR[id]=mimicSprite();
  const base=baseUnitSprite({kind:'enemy',id:d.look,color:d.color});
  if(!base||!base.hand||!base.img.width) return base;   // the hand-drawn base is still loading
  const n=base.img.width, img=document.createElement('canvas'); img.width=img.height=n; const x=img.getContext('2d');
  x.drawImage(base.img,0,0); x.globalCompositeOperation='source-atop'; x.globalAlpha=.5; x.fillStyle=d.tint||'#000'; x.fillRect(0,0,n,n);
  return MINI_SPR[id]={img,sil:base.sil,wht:base.wht,hand:true};
}
const baseUnitSprite=typeof unitSprite==='function'?unitSprite:null;
if(baseUnitSprite&&typeof window!=='undefined') window.unitSprite=u=>u&&u.kind==='enemy'&&ENEMY_DEFS[u.id]&&ENEMY_DEFS[u.id].look?miniSprite(u.id):baseUnitSprite(u);
