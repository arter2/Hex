/* Weapons: one builder for every held item. The grip sits at the origin and the item points up +y,
   so characters hold the same models the weapon icons show. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI;
const EL={fire:0xff7a2a, frost:0x8fdcff, storm:0xffe45a, shadow:0xa77aff, light:0xffe9a0, verdant:0x6ff0a4};
LAB.EL=EL;
const WOOD=M(0x8e5c33), DWOOD=M(0x5e3a22), PALE=M(0xd8c39a), GOLD=M(0xe2b850,{metal:.9}), SILVER=M(0xc9d2dc,{metal:1}),
  IRON=M(0x7d8792,{metal:.8}), DARK=M(0x2c2533), LEATHER=M(0x6b3f24), BONE=M(0xe8dcc0), STRING=M(0xeee6d0);
LAB.WM={WOOD,DWOOD,PALE,GOLD,SILVER,IRON,DARK,LEATHER,BONE};
const glow=c=>M(c,{glow:true});

// heads sit on top of a shaft at height h
function head(g,type,c,h){ const gm=glow(c), core=glow(0xffffff);
  const H=grp(g,0,h,0); H.userData.gem=true;
  switch(type){
    case 'crystal':{ add(H,G.tor(.075,.018,5,10),GOLD,0,-.02,0,PI/2); const o=add(H,G.oct(.1),gm,0,.12,0); o.scale.set(1,1.6,1); add(H,G.oct(.04),core,0,.12,.04);
      add(H,G.cone(.035,.16,5),GOLD,.07,.02,0,0,0,-.7); add(H,G.cone(.035,.16,5),GOLD,-.07,.02,0,0,0,.7); break; }
    case 'leaf':{ add(H,G.tor(.075,.018,5,10),GOLD,0,-.02,0,PI/2); const o=add(H,G.oct(.1),gm,0,.12,0); o.scale.set(1,1.6,1); add(H,G.oct(.04),core,0,.12,.04);
      add(H,G.cone(.045,.2,5),M(0x5fd08a),.09,0,0,0,0,-1); add(H,G.cone(.045,.2,5),M(0x5fd08a),-.09,0,0,0,0,1); break; }
    case 'orb':{ add(H,G.tor(.11,.018,5,12),GOLD,0,.1,0); add(H,G.tor(.11,.018,5,12),GOLD,0,.1,0,0,PI/2); add(H,G.sph(.085,10,8),gm,0,.1,0); add(H,G.sph(.035,6,5),core,-.02,.12,.06); break; }
    case 'flame':{ add(H,G.cyl(.05,.03,.08,6),IRON,0,0,0); add(H,G.cone(.1,.32,7),glow(c),0,.18,0); add(H,G.cone(.06,.2,6),glow(0xffe08a),0,.14,.02); add(H,G.cone(.05,.14,5),glow(c),.07,.1,0,0,0,-.5); add(H,G.cone(.05,.14,5),glow(c),-.07,.1,0,0,0,.5); break; }
    case 'skull':{ add(H,G.sph(.085,10,8),BONE,0,.08,0); add(H,G.box(.09,.05,.08),BONE,0,.01,.02); add(H,G.box(.03,.03,.02),glow(c),.035,.08,.075); add(H,G.box(.03,.03,.02),glow(c),-.035,.08,.075);
      add(H,G.sph(.06,8,6),glow(c),0,.2,-.02); break; }
    case 'ghost':{ add(H,G.tor(.09,.016,5,10),IRON,0,.12,0); add(H,G.tor(.09,.016,5,10),IRON,0,.12,0,0,PI/2); const w=add(H,G.sph(.07,8,6),gm,0,.12,0); w.scale.set(1,1.3,1); add(H,G.cone(.05,.14,6),gm,0,.24,0); break; }
    case 'feather':{ add(H,G.oct(.08),gm,0,.08,0).scale.set(1,1.5,1); for(const s of [1,-1]){ const f=add(H,G.box(.05,.22,.015),M(0xf1ead8),.07*s,-.08,.02,0,0,.35*s); } add(H,G.sph(.03,5,4),M(0xc8463a),0,-.04,.05); break; }
    case 'antler':{ for(const s of [1,-1]) add(H,G.tube([[0,0,0],[.08*s,.12,0],[.12*s,.26,0],[.06*s,.34,0]],.025,.01,8,5),BONE,0,0,0); add(H,G.sph(.06,8,6),gm,0,.12,0); break; }
    case 'star':{ add(H,G.tor(.13,.02,5,14),GOLD,0,.13,0); const s=add(H,G.oct(.13),gm,0,.13,0); s.scale.set(1,1.4,.7); add(H,G.oct(.05),core,0,.14,.05);
      for(let i=0;i<4;i++) add(H,G.cone(.03,.12,4),GOLD,Math.cos(i*PI/2)*.17,.13+Math.sin(i*PI/2)*.17,0,0,0,i*PI/2-PI/2); break; }
    case 'rune':{ for(let i=0;i<3;i++) add(H,G.tor(.04,.014,4,10),glow(c),0,-.25-i*.12,0,PI/2); add(H,G.cyl(.06,.035,.16,6),M(0x6b6f7a),0,.08,0); add(H,G.oct(.065),gm,0,.22,0).scale.set(1,1.5,1); break; }
    case 'knot':{ add(H,G.rock(.08,3,.25,0),WOOD,0,.04,0); add(H,G.tor(.06,.018,4,8),WOOD,.03,.1,0,0,.4,0); break; }
    case 'bone':{ add(H,G.sph(.07,8,6),BONE,0,.06,0); add(H,G.cone(.025,.14,5),BONE,.05,.14,0,0,0,-.4); add(H,G.cone(.025,.14,5),BONE,-.05,.14,0,0,0,.4); add(H,G.sph(.04,6,5),glow(c),0,.07,.05); break; }
  } return H; }

/* spec: {kind, wood, head, c, len} for staffs; other kinds take their own fields */
LAB.weapon=function(spec){ const g=grp(null), k=spec.kind, w=spec.wood||WOOD, c=spec.c||EL.verdant;
  if(k==='staff'){ const L=spec.len||1.7, lo=-.65; add(g,G.cyl(.024,.03,L,6),w,0,lo+L/2,0);
    if(spec.wrap) add(g,G.cyl(.034,.034,.16,6),spec.wrap,0,.05,0);
    if(spec.bands) for(let i=0;i<spec.bands.n;i++) add(g,G.cyl(.033,.033,.03,6),spec.bands.m,0,lo+L-.12-i*.18,0);
    g.userData.top=lo+L; g.userData.gemAt=lo+L+.12; head(g,spec.head||'crystal',c,lo+L); }
  else if(k==='wand'){ const L=spec.len||.5; add(g,G.cyl(.016,.026,L,6),w,0,L/2-.08,0);
    if(spec.grip) add(g,G.cyl(.03,.03,.14,6),spec.grip,0,0,0);
    if(spec.bands) for(let i=0;i<spec.bands.n;i++) add(g,G.cyl(.024,.024,.022,6),spec.bands.m,0,.12+i*.09,0);
    const top=L-.08; g.userData.top=top; g.userData.gemAt=top+.04;
    if(spec.broken){ add(g,G.cone(.02,.08,4),w,.01,top+.03,0,0,0,-.4); add(g,G.cone(.014,.06,4),w,-.012,top+.02,0,0,0,.5); }
    else if(spec.tip==='sun'){ add(g,G.tor(.05,.012,4,10),GOLD,0,top+.06,0); add(g,G.sph(.035,8,6),glow(c),0,top+.06,0); for(let i=0;i<6;i++) add(g,G.cone(.012,.05,3),GOLD,Math.cos(i*PI/3)*.07,top+.06+Math.sin(i*PI/3)*.07,0,0,0,i*PI/3-PI/2); }
    else if(spec.tip==='moon'){ add(g,G.tor(.05,.016,5,10,PI*1.3),glow(c),0,top+.06,0,0,0,-.2); add(g,G.sph(.018,5,4),glow(0xffffff),.01,top+.06,.01); }
    else if(spec.tip==='spark'){ for(let i=0;i<3;i++) add(g,G.tor(.03,.008,4,8),M(0xc87a3a,{metal:.8}),0,top-.1+i*.04,0,PI/2); const s=add(g,G.oct(.045),glow(c),0,top+.05,0); s.scale.set(.8,1.5,.8); }
    else if(spec.tip==='ice'){ const s=add(g,G.oct(.04),glow(c),0,top+.07,0); s.scale.set(.7,2.4,.7); }
    else if(spec.tip==='scepter'){ add(g,G.cyl(.05,.02,.08,6),GOLD,0,top,0); const s=add(g,G.oct(.06),glow(c),0,top+.09,0); s.scale.set(1,1.5,1); add(g,G.tor(.06,.012,4,10),GOLD,0,top+.09,0,0,PI/2); }
    else if(spec.tip==='leaf'){ add(g,G.cone(.03,.12,5),M(0x5fd08a),.04,top-.02,0,0,0,-1); add(g,G.sph(.025,6,5),glow(c),0,top+.02,0); }
    else add(g,G.sph(.025,6,5),glow(c),0,top+.02,0); }
  else if(k==='bow'){ const lim=spec.wood||PALE, R=.55;
    add(g,G.tor(R,.022,5,18,PI*.62),lim,-R*.82,0,0,0,0,-PI*.31); add(g,G.cyl(.03,.03,.16,6),LEATHER,0,0,0);
    const a=PI*.31, tx=-R*.82+R*Math.cos(a), ty=R*Math.sin(a); add(g,G.cyl(.006,.006,ty*2,3),STRING,tx,0,0);
    if(spec.tips) for(const s of [1,-1]) add(g,G.cone(.03,.08,5),spec.tips,tx+.01,ty*s,0,0,0,s>0?0:PI);
    if(spec.leaves) for(const s of [1,-1]) add(g,G.cone(.035,.14,5),M(0x5fd08a),.05,.3*s,0,0,0,-.8*s);
    if(spec.c) add(g,G.sph(.03,6,5),glow(spec.c),.035,0,0);
    g.userData.top=ty; g.userData.gemAt=.1; }
  else if(k==='crossbow'){ const st=spec.wood||WOOD, met=spec.metal||IRON;
    add(g,G.box(.07,.6,.08),st,0,.15,0); add(g,G.box(.05,.12,.06),st,0,-.12,-.05,.5);
    add(g,G.tor(.32,.025,5,14,PI*.7),met,0,.15,0,PI/2,0,PI*.15); add(g,G.cyl(.005,.005,.6,3),STRING,0,.27,.0,0,0,PI/2);
    add(g,G.cyl(.012,.012,.42,4),DWOOD,0,.33,.05); add(g,G.cone(.025,.07,4),met,0,.57,.05);
    if(spec.mag){ add(g,G.box(.1,.2,.12),met,0,.2,.1); for(let i=0;i<3;i++) add(g,G.tor(.05,.01,4,8),glow(spec.c),0,.0+i*.06,0,PI/2); }
    g.userData.top=.6; g.userData.gemAt=.25; }
  else if(k==='spear'){ const L=spec.len||1.8; add(g,G.cyl(.022,.026,L,6),w,0,L/2-.6,0); const top=L-.6;
    if(spec.wrap) add(g,G.cyl(.032,.032,.2,6),spec.wrap,0,.02,0);
    if(spec.trident){ add(g,G.box(.26,.04,.04),spec.metal||GOLD,0,top,0); for(const x of [-.12,0,.12]){ add(g,G.cyl(.016,.016,.24,5),spec.metal||GOLD,x,top+.12,0); add(g,G.cone(.028,.09,4),spec.metal||GOLD,x,top+.28,0); }
      if(spec.c) add(g,G.oct(.05),glow(spec.c),0,top+.05,.03); }
    else if(spec.fang){ add(g,G.tor(.05,.014,4,10),SILVER,0,top,0,PI/2); const f=add(g,G.cone(.07,.42,4),glow(spec.c),0,top+.24,0); f.scale.set(1,1,.45); add(g,G.cone(.04,.16,4),glow(0xeafcff),.07,top+.06,0,0,0,-.9); add(g,G.cone(.04,.16,4),glow(0xeafcff),-.07,top+.06,0,0,0,.9); }
    else { add(g,G.cyl(.03,.024,.06,6),spec.metal||IRON,0,top,0); const b=add(g,G.oct(.08),spec.metal||IRON,0,top+.16,0); b.scale.set(.75,2.3,.25); if(spec.tassel) add(g,G.cone(.04,.12,5),spec.tassel,.03,top-.08,0,0,0,PI); }
    g.userData.top=top+.3; g.userData.gemAt=top+.1; }
  else if(k==='sword'){ const met=spec.metal||SILVER; add(g,G.cyl(.022,.022,.2,6),LEATHER,0,0,0); add(g,G.sph(.035,6,5),spec.guard||GOLD,0,-.12,0);
    add(g,G.box(.26,.04,.06),spec.guard||GOLD,0,.11,0); const b=add(g,G.box(.08,spec.len||.9,.022),met,0,.13+(spec.len||.9)/2,0); add(g,G.cone(.057,.14,4),met,0,.2+(spec.len||.9)+.0,0,0,PI/4).scale.set(1,1,.35);
    if(spec.c) add(g,G.box(.02,(spec.len||.9)*.8,.026),glow(spec.c),0,.15+(spec.len||.9)*.45,0);
    g.userData.top=.2+(spec.len||.9); g.userData.gemAt=.6; }
  else if(k==='axe'){ const L=spec.len||1.3; add(g,G.cyl(.03,.035,L,6),w,0,L/2-.35,0); const top=L-.35;
    for(const s of spec.double?[1,-1]:[1]){ const b=add(g,new THREE.CylinderGeometry(.32,.32,.035,12,1,false,0,PI*.55),spec.metal||IRON,.06*s,top-.15,0,PI/2,0,s>0?PI*.72:-PI*.28); }
    add(g,G.cone(.04,.12,5),spec.metal||IRON,0,top+.06,0); g.userData.top=top; g.userData.gemAt=top-.1; }
  else if(k==='dagger'){ add(g,G.cyl(.018,.018,.12,5),LEATHER,0,0,0); add(g,G.box(.12,.025,.04),spec.guard||IRON,0,.07,0); const b=add(g,G.cone(.04,.36,4),spec.metal||SILVER,0,.26,0); b.scale.set(1,1,.3);
    if(spec.c) add(g,G.box(.012,.2,.03),glow(spec.c),0,.22,0); g.userData.top=.44; g.userData.gemAt=.2; }
  else if(k==='scythe'){ const L=spec.len||1.9; add(g,G.cyl(.022,.026,L,6),w,0,L/2-.6,0); const top=L-.6;
    add(g,G.tube([[0,top,0],[.25,top+.12,0],[.55,top+.02,0],[.7,top-.22,0]],.05,.008,12,4),spec.metal||IRON,0,0,0).scale.set(1,1,.35);
    if(spec.c) add(g,G.sph(.05,6,5),glow(spec.c),0,top,0); g.userData.top=top+.15; g.userData.gemAt=top; }
  else if(k==='banner'){ const L=1.9; add(g,G.cyl(.022,.026,L,6),spec.metal||GOLD,0,L/2-.6,0); const top=L-.6; add(g,G.oct(.05),spec.metal||GOLD,0,top+.06,0).scale.set(1,1.8,1);
    const sx=spec.side||-1; add(g,G.box(.48,.03,.03),spec.metal||GOLD,.22*sx,top-.06,0); add(g,G.cloth(.44,.95,.75,1.5,.03,.02),spec.cloth||M(0x3a62b8),.22*sx,top-.54,0);
    add(g,G.box(.1,.1,.03),GOLD,.22*sx,top-.4,.02,0,0,PI/4); g.userData.top=top; g.userData.gemAt=top; }
  else if(k==='flask'){ add(g,G.sph(.09,8,6),glow(spec.c||0x9be05a),0,.06,0); add(g,G.cyl(.03,.035,.1,6),M(0xcfe8e0),0,.17,0); add(g,G.cyl(.035,.035,.04,6),LEATHER,0,.23,0); g.userData.top=.25; g.userData.gemAt=.06; }
  else if(k==='chain'){ for(let i=0;i<6;i++) add(g,G.tor(.04,.012,4,8),IRON,0,-.05-i*.07,0,0,i%2?PI/2:0,0); add(g,G.sph(.07,8,6),IRON,0,-.47,0); g.userData.top=0; g.userData.gemAt=0; }
  return g; };

LAB.shield=function(spec){ const g=grp(null);
  if(spec.kind==='round'){ add(g,G.cyl(.3,.3,.05,14),spec.m||WOOD,0,0,0,PI/2); add(g,G.tor(.3,.025,4,16),spec.rim||IRON,0,0,.01); add(g,G.sph(.07,8,6),spec.rim||IRON,0,0,.04); }
  else { add(g,G.trap(.46,.6,.05,.55),spec.m||M(0xe8e4dc,{metal:.4}),0,0,0); add(g,G.box(.06,.5,.06),spec.rim||GOLD,0,0,.02); add(g,G.box(.36,.06,.06),spec.rim||GOLD,0,.12,.02);
    if(spec.c) add(g,G.oct(.05),M(spec.c,{glow:true}),0,.12,.05); }
  return g; };

/* the game's 21 weapons */
LAB.GAME_WEAPONS={
  broken_wand:{name:'Broken Wand', kind:'wand', wood:M(0x7a5232), broken:true, len:.42},
  basic_wand:{name:'Basic Wand', kind:'wand', wood:WOOD, c:0xfff2c8},
  oak_wand:{name:'Oak Wand', kind:'wand', wood:M(0x6e4528), grip:LEATHER, tip:'leaf', c:EL.verdant, len:.55},
  quick_wand:{name:'Quick Wand', kind:'wand', wood:PALE, bands:{n:3,m:SILVER}, c:0x9ff4ff},
  ice_wand:{name:'Thin Wand of Ice', kind:'wand', wood:M(0xbfe6f5,{metal:.3}), tip:'ice', c:EL.frost, len:.5},
  volt_wand:{name:'Wand of Electricity', kind:'wand', wood:IRON, tip:'spark', c:EL.storm},
  dark_wand:{name:'Wand of Darkness', kind:'wand', wood:DARK, grip:M(0x4a2a5a), tip:'moon', c:EL.shadow},
  light_wand:{name:'Wand of Light', kind:'wand', wood:M(0xf3ead6), grip:GOLD, tip:'sun', c:EL.light},
  focus_rod:{name:'Focus Rod', kind:'staff', wood:SILVER, head:'orb', c:0xc08aff, len:1.45},
  storm_scepter:{name:'Storm Scepter', kind:'wand', wood:GOLD, tip:'scepter', c:EL.storm, len:.6},
  archmage_staff:{name:"Archmage's Staff", kind:'staff', wood:M(0x4a3a6a), head:'star', c:0x9fe8ff, bands:{n:3,m:GOLD}, len:1.85},
  rune_staff:{name:'Runecarved Staff', kind:'staff', wood:M(0x5d5a66), head:'rune', c:0x7fd4ff, len:1.75},
  oak_staff:{name:'Oak Staff', kind:'staff', wood:M(0x7a4e2c), head:'knot', len:1.7},
  elven_bow:{name:'Elven Bow', kind:'bow', wood:PALE, tips:GOLD},
  ashwood_bow:{name:'Ashwood Bow', kind:'bow', wood:M(0x9ab07a), leaves:true, c:EL.verdant},
  iron_crossbow:{name:'Iron Crossbow', kind:'crossbow'},
  thunder_repeater:{name:'Thunderbolt Repeater', kind:'crossbow', wood:M(0x3b3346), metal:M(0xb08a3a,{metal:.9}), mag:true, c:EL.storm},
  hunter_spear:{name:"Hunter's Spear", kind:'spear', wrap:LEATHER, tassel:M(0xb5452e)},
  storm_trident:{name:'Storm Trident', kind:'spear', wood:M(0x34405a), trident:true, c:EL.storm},
  first_flame:{name:'Staff of the First Flame', kind:'staff', wood:M(0x3a1d14), head:'flame', c:0xff6a1a, bands:{n:2,m:GOLD}, len:1.85, legendary:true},
  frostfang:{name:'Frostfang Scepter', kind:'spear', wood:M(0xdcefff,{metal:.4}), fang:true, c:EL.frost, len:1.6, legendary:true},
};
})();
